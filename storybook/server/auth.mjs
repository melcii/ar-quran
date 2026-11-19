// Sign-in for the studio server (replaces Supabase Auth): email and password
// (scrypt), session tokens, and TOTP authenticator codes (RFC 6238, the codes
// Google Authenticator, Microsoft Authenticator or 1Password show).
// A session starts at aal1; a correct authenticator code raises it to aal2.
// Every staff permission needs aal2.
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { tx } from './db.mjs';
import { E } from './errors.mjs';

const now = () => new Date().toISOString();
const SESSION_HOURS = Number(process.env.SESSION_HOURS ?? 12);
const ISSUER = process.env.TOTP_ISSUER ?? 'Quran Adventure Studio';

/* ---------------------------------------------------------------- passwords */

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}
function checkPassword(pw, stored) {
  const [kind, salt, key] = String(stored).split('$');
  if (kind !== 'scrypt') return false;
  const want = Buffer.from(key, 'base64');
  const got = crypto.scryptSync(pw, Buffer.from(salt, 'base64'), want.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(want, got);
}
export function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < 10) return 'Use a password of at least 10 characters.';
  if (pw.length > 200) return 'That password is too long.';
  return null;
}
/** A readable one-time password for a new staff account. */
export function tempPassword() {
  const words = crypto.randomBytes(12).toString('base64url').replace(/[-_]/g, 'x');
  return `${words.slice(0, 4)}-${words.slice(4, 8)}-${words.slice(8, 12)}-${words.slice(12, 16)}`;
}

export function createUser(db, email, pw, { mustChange = false } = {}) {
  const e = String(email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 254) throw new E('That does not look like an email address.');
  const p = passwordProblem(pw);
  if (p) throw new E(p);
  if (db.prepare('select 1 from users where email = ?').get(e)) throw new E('An account with that email already exists.', 'PT409', 409);
  const id = crypto.randomUUID();
  db.prepare('insert into users (id, email, pw, must_change_password, created_at) values (?, ?, ?, ?, ?)').run(id, e, hashPassword(pw), mustChange ? 1 : 0, now());
  return id;
}

/* ----------------------------------------------------------------- sessions */

const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

function newSession(db, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const exp = new Date(Date.now() + SESSION_HOURS * 3600e3).toISOString();
  db.prepare('insert into sessions (token_hash, user_id, aal, created_at, expires_at) values (?, ?, ?, ?, ?)').run(sha(token), userId, 'aal1', now(), exp);
  db.prepare('delete from sessions where expires_at < ?').run(now());
  return token;
}

/** Who is calling: { uid, aal, token_hash } or an anonymous caller. */
export function caller(db, req) {
  const h = req.headers.authorization ?? '';
  const m = /^Bearer\s+([A-Za-z0-9_-]{20,})$/.exec(h);
  if (!m) return { uid: null, aal: '' };
  const s = db.prepare('select s.token_hash, s.user_id, s.aal, s.expires_at, u.email from sessions s join users u on u.id = s.user_id where s.token_hash = ?').get(sha(m[1]));
  if (!s || s.expires_at < now()) return { uid: null, aal: '' };
  return { uid: s.user_id, aal: s.aal, email: s.email, token_hash: s.token_hash };
}

// A small brake on password and code guessing: 8 misses per 15 minutes per key.
const misses = new Map();
function brake(key) {
  const t = Date.now();
  const list = (misses.get(key) ?? []).filter((x) => t - x < 15 * 60e3);
  misses.set(key, list);
  if (list.length >= 8) throw new E('Too many tries. Wait a few minutes and try again.', 'PT429', 429);
  return () => list.push(t);
}

export function signUp(db, email, pw) {
  const id = createUser(db, email, pw);
  return { token: newSession(db, id), user: id };
}

export function signIn(db, email, pw, ip) {
  const e = String(email ?? '').trim().toLowerCase();
  const miss = brake(`pw:${e}:${ip}`);
  const u = db.prepare('select id, pw from users where email = ?').get(e);
  // Same answer and similar time whether or not the account exists.
  const ok = u ? checkPassword(String(pw ?? ''), u.pw) : (checkPassword(String(pw ?? ''), hashPassword('x'.repeat(12))), false);
  if (!ok) {
    miss();
    throw new E('Wrong email or password.', 'invalid_credentials', 400);
  }
  return { token: newSession(db, u.id), user: u.id };
}

export function signOut(db, who) {
  if (who.token_hash) db.prepare('delete from sessions where token_hash = ?').run(who.token_hash);
}

export function me(db, who) {
  if (!who.uid) return null;
  const u = db.prepare('select id, email, must_change_password from users where id = ?').get(who.uid);
  const factors = db.prepare('select id, status from mfa_factors where user_id = ? order by created_at').all(who.uid);
  return { user: u.id, email: u.email, aal: who.aal, must_change_password: !!u.must_change_password, factors };
}

export function changePassword(db, who, pw) {
  if (!who.uid) throw new E('Not signed in.', '42501', 401);
  const p = passwordProblem(pw);
  if (p) throw new E(p);
  tx(db, () => {
    db.prepare('update users set pw = ?, must_change_password = 0 where id = ?').run(hashPassword(pw), who.uid);
    // Other sessions of this account end; this one carries on.
    db.prepare('delete from sessions where user_id = ? and token_hash <> ?').run(who.uid, who.token_hash);
  });
}

/* --------------------------------------------------------------------- TOTP */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32(buf) {
  let bits = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}
function unbase32(s) {
  let bits = '';
  for (const c of s.replace(/=+$/, '').toUpperCase()) bits += B32.indexOf(c).toString(2).padStart(5, '0');
  return Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
}
export function totpAt(secret, step) {
  const ctr = Buffer.alloc(8);
  ctr.writeBigUInt64BE(BigInt(step));
  const h = crypto.createHmac('sha1', unbase32(secret)).update(ctr).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}

export async function enrol(db, who) {
  if (!who.uid) throw new E('Not signed in.', '42501', 401);
  // Drop half-finished set-ups first.
  db.prepare("delete from mfa_factors where user_id = ? and status = 'unverified'").run(who.uid);
  const id = crypto.randomUUID();
  const secret = base32(crypto.randomBytes(20));
  db.prepare('insert into mfa_factors (id, user_id, secret, created_at) values (?, ?, ?, ?)').run(id, who.uid, secret, now());
  const uri = `otpauth://totp/${encodeURIComponent(`${ISSUER}:${who.email}`)}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=6&period=30`;
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 240 });
  return { id, secret, uri, qr };
}

/** Check an authenticator code; on success this session becomes aal2. */
export function verify(db, who, code, factorId) {
  if (!who.uid) throw new E('Not signed in.', '42501', 401);
  const miss = brake(`totp:${who.uid}`);
  const f = factorId
    ? db.prepare('select * from mfa_factors where id = ? and user_id = ?').get(factorId, who.uid)
    : db.prepare("select * from mfa_factors where user_id = ? and status = 'verified' order by created_at limit 1").get(who.uid);
  if (!f) throw new E('No authenticator is set up for this account.');
  const c = String(code ?? '').replace(/\s/g, '');
  const step = Math.floor(Date.now() / 30000);
  // One step either side for clock drift; a code that was already used is refused.
  const hit = [step - 1, step, step + 1].find((s) => s > f.last_step && /^\d{6}$/.test(c) && crypto.timingSafeEqual(Buffer.from(totpAt(f.secret, s)), Buffer.from(c)));
  if (hit === undefined) {
    miss();
    throw new E('That code is not right. Check the time on your phone and try the newest code.', 'invalid_code', 400);
  }
  tx(db, () => {
    db.prepare("update mfa_factors set status = 'verified', last_step = ? where id = ?").run(hit, f.id);
    db.prepare("update sessions set aal = 'aal2' where token_hash = ?").run(who.token_hash);
  });
}
