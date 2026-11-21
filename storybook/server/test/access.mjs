// End-to-end access checks for the Admin Studio server (the same checks the
// old Supabase version had, plus sign-in, files and accounts):
//
//   cd storybook/server && npm test
//
// Starts a throwaway server on a free port with an empty database, signs up
// accounts, sets up real authenticator (TOTP) codes, and checks that the
// server, not the interface, refuses everything a role may not do.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../index.mjs';
import { totpAt } from '../auth.mjs';

const dataDir = mkdtempSync(join(tmpdir(), 'studio-test-'));
const { server, db } = createServer({ dataDir, openSignup: true });
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${server.address().port}`;

let failures = 0;
let passes = 0;
function check(name, ok, extra) {
  if (ok) passes++;
  else failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && extra ? `  (${extra})` : ''}`);
}
const q = (sql, ...a) => db.prepare(sql).get(...a);
// q() is async now (the database client is): await it and read the field after.
const savesHash = async () => (await q("select coalesce(group_concat(explorer || key || value || updated_at, ','), '') h from (select * from saves order by key)")).h;

async function call(token, method, path, body, headers = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined && !(body instanceof Uint8Array) ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body === undefined ? undefined : body instanceof Uint8Array ? body : JSON.stringify(body),
  });
  const j = await r.json().catch(() => null);
  return r.ok ? { data: j, error: null, status: r.status } : { data: null, error: j?.error ?? { message: `HTTP ${r.status}` }, status: r.status };
}
const client = (token) => ({
  token,
  rpc: (name, args = {}) => call(token, 'POST', `/api/rpc/${name}`, args),
  read: (table, params = {}) => call(token, 'GET', `/api/read/${table}?${new URLSearchParams(params)}`),
  fam: (name, args = {}) => call(token, 'POST', `/api/family/${name}`, args),
  live: (scope) => call(token, 'GET', `/api/live?scope=${encodeURIComponent(scope)}`),
});
const code = (secret, dt = 0) => totpAt(secret, Math.floor(Date.now() / 30000) + dt);

const run = Date.now().toString(36);
const PW = 'correct horse battery staple 9';
async function account(name, { mfa = true } = {}) {
  const email = `${name}-${run}@studio.test`;
  const s = await call(null, 'POST', '/api/auth/signup', { email, password: PW });
  if (s.error) throw new Error(s.error.message);
  const c = client(s.data.token);
  if (mfa) {
    const en = await call(c.token, 'POST', '/api/auth/mfa/enroll');
    const v = await call(c.token, 'POST', '/api/auth/mfa/verify', { factorId: en.data.id, code: code(en.data.secret) });
    if (v.error) throw new Error(v.error.message);
    c.secret = en.data.secret;
  }
  return { c, email };
}

const denied = (r) => !!r.error && /42501|not allowed|only|permission|cannot|need|sign in/i.test(`${r.error.code} ${r.error.message}`);
const doc = (set, extra = {}) => ({ v: 1, set, ...extra });
const anon = client(null);

// 0. Sign-in itself.
{
  const closed = createServer({ dataDir: mkdtempSync(join(tmpdir(), 'studio-test-')), openSignup: false });
  await new Promise((ok) => closed.server.listen(0, '127.0.0.1', ok));
  const r = await fetch(`http://127.0.0.1:${closed.server.address().port}/api/auth/signup`, { method: 'POST', body: JSON.stringify({ email: 'x@y.test', password: PW }) });
  check('nobody can sign up unless the server allows it', r.status === 403);
  closed.server.close();
  const a = await account('signin');
  const wrong = await call(null, 'POST', '/api/auth/signin', { email: a.email, password: 'not the password' });
  check('a wrong password is refused', !!wrong.error && /Wrong email or password/.test(wrong.error.message), wrong.error?.message);
  const ghost = await call(null, 'POST', '/api/auth/signin', { email: `nobody-${run}@studio.test`, password: PW });
  check('an unknown email gets the same answer as a wrong password', ghost.error?.message === wrong.error?.message);
  const ok = await call(null, 'POST', '/api/auth/signin', { email: a.email.toUpperCase(), password: PW });
  const me = await call(ok.data?.token, 'GET', '/api/auth/me');
  check('the right password signs in (email in any case), at aal1 until a code is given', !ok.error && me.data?.aal === 'aal1', JSON.stringify(me.data ?? ok.error));
  const replay = await call(ok.data.token, 'POST', '/api/auth/mfa/verify', { code: code(a.c.secret) });
  check('an authenticator code that was already used is refused', !!replay.error, replay.error?.message);
  const next = await call(ok.data.token, 'POST', '/api/auth/mfa/verify', { code: code(a.c.secret, 1) });
  const me2 = await call(ok.data.token, 'GET', '/api/auth/me');
  check('a fresh code raises the session to aal2', !next.error && me2.data?.aal === 'aal2', next.error?.message);
  await call(ok.data.token, 'POST', '/api/auth/signout');
  const gone = await call(ok.data.token, 'GET', '/api/auth/me');
  check('signing out ends the session', gone.data === null);
  const forged = await call('A'.repeat(43), 'POST', '/api/rpc/studio_save_draft', { p_scope: 'surah:19', p_doc: doc({ welcome: 'x' }), p_revision: 0 });
  check('a made-up token is not signed in', denied(forged), forged.error?.message);
}

// 1. Anonymous visitors.
{
  const s = await anon.read('quran_surahs');
  check('anon reads the surah list (public data)', !s.error && s.data.length === 114, s.error?.message);
  const v = await anon.read('content_versions');
  check('anon sees no versions', !v.error ? v.data.length === 0 : true);
  const a = await anon.read('audit_log');
  check('anon sees no audit log', !a.error ? a.data.length === 0 : true);
  const d = await anon.rpc('studio_save_draft', { p_scope: 'surah:19', p_doc: doc({ welcome: 'x' }), p_revision: 0 });
  check('anon cannot save a draft', !!d.error, 'no error');
  const ins = await call(null, 'POST', '/api/read/content_drafts', { scope: 'surah:19', doc: {} });
  check('anon cannot write tables directly', !!ins.error);
  const p = await call(null, 'POST', '/api/report-problem', { p_surah: 19, p_category: 'stuck', p_screen: '390x844' });
  check('anon can send a child-safe problem report', !p.error, p.error?.message);
  const bad = await call(null, 'POST', '/api/report-problem', { p_surah: 19, p_category: 'my name is Sam', p_screen: '390x844' });
  check('problem reports accept only fixed categories', !!bad.error);
}

// 2. Accounts.
const owner = await account('owner');
const story = await account('story');
const world = await account('world');
const reviewer = await account('reviewer');
const moderator = await account('moderator');
const nomfa = await account('nomfa', { mfa: false });
const player = await account('parent', { mfa: false });

{
  const w = await player.c.rpc('studio_whoami');
  check('an ordinary account is not staff', !w.error && w.data.staff === false && w.data.roles.length === 0, JSON.stringify(w.data ?? w.error));
  const d = await player.c.rpc('studio_save_draft', { p_scope: 'surah:19', p_doc: doc({ welcome: 'Hello' }), p_revision: 0 });
  check('an ordinary account cannot save a draft', denied(d), d.error?.message);
  const g = await player.c.rpc('studio_set_role', { p_email: player.email, p_role: 'super_admin', p_on: true });
  check('an ordinary account cannot give itself a role', denied(g), g.error?.message);
}

// The first Super Admin comes from the person running the server only.
{
  const b = await owner.c.rpc('studio_bootstrap_super_admin', { p_email: owner.email });
  check('making the first Super Admin cannot be done over the network', !!b.error);
  const out = execFileSync(process.execPath, ['--disable-warning=ExperimentalWarning', fileURLToPath(new URL('../admin.mjs', import.meta.url)), 'first-admin', owner.email], { env: { ...process.env, STUDIO_DATA: dataDir }, encoding: 'utf8' });
  const w = await owner.c.rpc('studio_whoami');
  check('owner is Super Admin with an aal2 session (made with server/admin.mjs)', /Super Admin/.test(out) && w.data?.staff === true && w.data.roles.includes('super_admin'), JSON.stringify(w.data));
}

// Roles are granted by the Super Admin.
for (const [who, role] of [[story, 'story_editor'], [world, 'world_editor'], [reviewer, 'quran_reviewer'], [moderator, 'moderator'], [nomfa, 'story_editor']]) {
  const r = await owner.c.rpc('studio_set_role', { p_email: who.email, p_role: role, p_on: true });
  check(`Super Admin grants ${role}`, !r.error, r.error?.message);
}
{
  const r = await story.c.rpc('studio_set_role', { p_email: story.email, p_role: 'super_admin', p_on: true });
  check('a story editor cannot grant roles', denied(r), r.error?.message);
  const w = await nomfa.c.rpc('studio_whoami');
  check('a role without multi-factor sign-in is not active', w.data?.staff === false && w.data.roles.includes('story_editor'), JSON.stringify(w.data));
  const d = await nomfa.c.rpc('studio_save_draft', { p_scope: 'surah:19', p_doc: doc({ welcome: 'Hello' }), p_revision: 0 });
  check('a staff account without MFA cannot save', denied(d), d.error?.message);
  // A new staff member without an account: the Super Admin gets a one-time password.
  const email = `newcomer-${run}@studio.test`;
  const n = await owner.c.rpc('studio_set_role', { p_email: email, p_role: 'game_tester', p_on: true });
  const si = await call(null, 'POST', '/api/auth/signin', { email, password: n.data?.password });
  const me = await call(si.data?.token, 'GET', '/api/auth/me');
  check('giving a role to a new email makes the account with a one-time password', n.data?.created === true && !si.error && me.data?.must_change_password === true, JSON.stringify(n.data ?? n.error));
  const short = await call(si.data.token, 'POST', '/api/auth/password', { password: 'short' });
  const ch = await call(si.data.token, 'POST', '/api/auth/password', { password: 'a much longer new password' });
  const me2 = await call(si.data.token, 'GET', '/api/auth/me');
  check('they choose their own password (10 characters or more)', !!short.error && !ch.error && me2.data?.must_change_password === false, ch.error?.message);
  const last = await owner.c.rpc('studio_set_role', { p_email: owner.email, p_role: 'super_admin', p_on: false });
  check('the last Super Admin cannot be removed', !!last.error && /last Super Admin/.test(last.error.message), last.error?.message);
}

// Saves of a player before any publishing, to compare afterwards.
const explorer = (await player.c.fam('explorer_add', { nickname: 'Sam' })).data;
await player.c.fam('saves_put', { me: explorer, key: 'quran-adventure.adventure.19', value: '{"done":["quiet"],"prog":{}}' });
const savesBefore = await savesHash();

// 3. Drafts and permissions by kind of change.
const S = 'surah:19';
let rev = 0;
{
  const t = await story.c.rpc('studio_save_draft', { p_scope: S, p_doc: doc({ welcome: 'Welcome to the Quiet Grove, edited.' }), p_revision: rev });
  check('story editor saves a wording change', !t.error, t.error?.message);
  rev = t.data;
  const w = await story.c.rpc('studio_save_draft', { p_scope: S, p_doc: doc({ welcome: 'Welcome to the Quiet Grove, edited.', 'structures.0.x': 6 }), p_revision: rev });
  check('story editor cannot move objects', denied(w), w.error?.message);
  const m = await moderator.c.rpc('studio_save_draft', { p_scope: S, p_doc: doc({ welcome: 'Moderator text' }), p_revision: rev });
  check('a moderator cannot edit stories', denied(m), m.error?.message);
  const ww = await world.c.rpc('studio_save_draft', { p_scope: S, p_doc: doc({ welcome: 'Welcome to the Quiet Grove, edited.', 'structures.0.x': 6 }), p_revision: rev });
  check('world editor moves an object', !ww.error, ww.error?.message);
  const stale = await story.c.rpc('studio_save_draft', { p_scope: S, p_doc: doc({ welcome: 'Older copy' }), p_revision: rev });
  check('a stale copy cannot overwrite a newer save', !!stale.error && /reload/.test(stale.error.message), stale.error?.message);
  rev = ww.data;
  const direct = await call(world.c.token, 'PUT', '/api/read/content_drafts', { doc: {} });
  check('staff cannot change tables directly either', !!direct.error);
}

// 4. Server-side content checks.
{
  const ar = await story.c.rpc('studio_save_draft', { p_scope: S, p_doc: doc({ welcome: 'Welcome to the Quiet Grove, edited.', 'structures.0.x': 6, 'tasks#quiet.intro': 'بسم الله' }), p_revision: rev });
  rev = ar.data ?? rev;
  const sub = await story.c.rpc('studio_submit', { p_scope: S, p_note: 'with Arabic' });
  check('a draft with Arabic script cannot be submitted', !!sub.error && /Arabic/.test(sub.error.message), sub.error?.message);
  const bad = await story.c.rpc('studio_save_draft', { p_scope: S, p_doc: doc({ welcome: 'Welcome to the Quiet Grove, edited.', 'structures.0.x': 6, 'tasks#quiet.asks.0.reading.refs': [[19, 99]] }), p_revision: rev });
  rev = bad.data ?? rev;
  const sub2 = await story.c.rpc('studio_submit', { p_scope: S, p_note: 'bad ref' });
  check('a reference to an ayah that does not exist is refused', !!sub2.error && /ayah reference/.test(sub2.error.message), sub2.error?.message);
  const lock = await story.c.rpc('studio_save_draft', { p_scope: S, p_doc: doc({ welcome: 'Welcome to the Quiet Grove, edited.', 'structures.0.x': 6, 'tasks#quiet.kind': 'read' }), p_revision: rev });
  rev = lock.data ?? rev;
  const sub3 = await story.c.rpc('studio_submit', { p_scope: S, p_note: 'locked' });
  check('locked fields (kind, id, seed) are refused', !!sub3.error && /locked/.test(sub3.error.message), sub3.error?.message);
}

// 5. Review and publishing.
let v1;
{
  const ok = await story.c.rpc('studio_save_draft', { p_scope: S, p_doc: doc({ welcome: 'Welcome to the Quiet Grove, edited.', 'structures.0.x': 6 }), p_revision: rev });
  rev = ok.data;
  const sub = await story.c.rpc('studio_submit', { p_scope: S, p_note: 'Gentler welcome; bench moved' });
  check('a clean draft is submitted as version 1', !sub.error, sub.error?.message);
  v1 = sub.data;
  const early = await owner.c.rpc('studio_publish', { p_version: v1, p_effective_at: null, p_note: '' });
  check('an unapproved version cannot be published', !!early.error && /approved/.test(early.error.message), early.error?.message);
  const self = await story.c.rpc('studio_review', { p_version: v1, p_decision: 'approve', p_note: '' });
  check('an author cannot approve their own change', denied(self), self.error?.message);
  const appr = await owner.c.rpc('studio_review', { p_version: v1, p_decision: 'approve', p_note: 'Looks right' });
  check('Super Admin approves a change that is not Quran-linked', !appr.error, appr.error?.message);
  const nov = await owner.c.rpc('studio_publish', { p_version: v1, p_effective_at: null, p_note: '' });
  check('an unvalidated version cannot be published', !!nov.error && /validation/.test(nov.error.message), nov.error?.message);
  const ver = await owner.c.read('content_versions', { id: v1 });
  const t = await world.c.rpc('studio_record_test', { p_scope: S, p_version: v1, p_kind: 'content', p_ok: true, p_summary: 'all checks passed', p_report: { checks: 12 }, p_hash: ver.data[0].hash, p_env: {} });
  check('world editor records a passing validation', !t.error, t.error?.message);
  const mod = await moderator.c.rpc('studio_publish', { p_version: v1, p_effective_at: null, p_note: '' });
  check('a moderator cannot publish', denied(mod), mod.error?.message);
  const pub = await owner.c.rpc('studio_publish', { p_version: v1, p_effective_at: null, p_note: 'first' });
  check('Super Admin publishes version 1', !pub.error, pub.error?.message);
  const live = await anon.live(S);
  check('players see version 1', live.data?.[0]?.number === 1 && live.data[0].doc.set['structures.0.x'] === 6, JSON.stringify(live.data ?? live.error));
}

// 6. A Quran-linked change needs a Quran Content Reviewer.
let v2;
{
  const d = await story.c.rpc('studio_save_draft', {
    p_scope: S,
    p_doc: doc({ welcome: 'Welcome to the Quiet Grove, edited.', 'structures.0.x': 6, 'tasks#quiet.asks.0.reading.note': 'A clearer explanation for children.' }),
    p_revision: rev,
  });
  rev = d.data;
  const sub = await story.c.rpc('studio_submit', { p_scope: S, p_note: 'clearer note' });
  v2 = sub.data;
  const row = (await owner.c.read('content_versions', { id: v2 })).data?.[0];
  check('editing a reading note is marked Quran-linked', row?.quran_linked === true, JSON.stringify(row));
  const sa = await owner.c.rpc('studio_review', { p_version: v2, p_decision: 'approve', p_note: '' });
  check('Super Admin alone cannot approve Quran-linked content', denied(sa), sa.error?.message);
  const qr = await reviewer.c.rpc('studio_review', { p_version: v2, p_decision: 'approve', p_note: 'Checked against the tafsir' });
  check('Quran Content Reviewer approves it', !qr.error, qr.error?.message);
  await world.c.rpc('studio_record_test', { p_scope: S, p_version: v2, p_kind: 'content', p_ok: true, p_summary: 'ok', p_report: {}, p_hash: row.hash, p_env: {} });
  const pub = await owner.c.rpc('studio_publish', { p_version: v2, p_effective_at: null, p_note: 'second' });
  check('version 2 is published', !pub.error, pub.error?.message);
  const live = await anon.live(S);
  check('players see version 2', live.data?.[0]?.number === 2);
}

// 7. Rollback and player progress.
{
  const bad = await world.c.rpc('studio_rollback', { p_scope: S, p_version: v1, p_note: '' });
  check('only a Super Admin rolls back', denied(bad), bad.error?.message);
  const rb = await owner.c.rpc('studio_rollback', { p_scope: S, p_version: v1, p_note: 'v2 broke something' });
  check('Super Admin rolls back to version 1', !rb.error, rb.error?.message);
  const live = await anon.live(S);
  check('players see version 1 again', live.data?.[0]?.number === 1);
  check('player saves are byte-for-byte unchanged by publishing and rollback', savesBefore === (await savesHash()) && savesBefore.length > 0);
}

// 8. Scheduled publication.
{
  const d = await story.c.rpc('studio_save_draft', { p_scope: 'surah:1', p_doc: doc({ welcome: 'A scheduled welcome.' }), p_revision: 0 });
  const sub = await story.c.rpc('studio_submit', { p_scope: 'surah:1', p_note: 'scheduled' });
  await owner.c.rpc('studio_review', { p_version: sub.data, p_decision: 'approve', p_note: '' });
  const h = (await owner.c.read('content_versions', { id: sub.data })).data[0].hash;
  await world.c.rpc('studio_record_test', { p_scope: 'surah:1', p_version: sub.data, p_kind: 'content', p_ok: true, p_summary: 'ok', p_report: {}, p_hash: h, p_env: {} });
  const later = new Date(Date.now() + 3600e3).toISOString();
  const pub = await owner.c.rpc('studio_publish', { p_version: sub.data, p_effective_at: later, p_note: 'in an hour' });
  const live = await anon.live('surah:1');
  check('a scheduled publication is not live before its time', !d.error && !pub.error && live.data?.length === 0, JSON.stringify(live.data ?? pub.error));
}

// 9. The audit log.
{
  const a = await owner.c.read('audit_log', { limit: 1000 });
  const actions = new Set((a.data ?? []).map((r) => r.action));
  check('audit log records saves, submissions, reviews, publishing, rollback and role changes',
    ['draft.save', 'version.submit', 'version.approve', 'version.publish', 'version.rollback', 'staff.grant', 'staff.bootstrap', 'test.record'].every((x) => actions.has(x)),
    [...actions].join(','));
  const s = await story.c.read('audit_log');
  check('only Super Admins read the audit log', !s.error && s.data.length === 0);
  let frozen = false;
  try {
    await db.exec('update audit_log set action = action');
  } catch {
    frozen = true;
  }
  let frozen2 = false;
  try {
    await db.exec('delete from audit_log');
  } catch {
    frozen2 = true;
  }
  check('the audit log cannot be edited or deleted, even directly in the database file', frozen && frozen2);
}

// 10. Bugs.
{
  const b = await world.c.rpc('studio_file_bug', { p: { surah: 19, title: 'Rock floats near the stream', severity: 'high', category: 'collision', steps: 'Walk to the stream', device: { ua: 'test' } } });
  check('staff file a bug', !b.error, b.error?.message);
  const u = await world.c.rpc('studio_update_bug', { p_id: b.data, p: { status: 'fixed', resolution: 'Moved the rock' } });
  const row = (await world.c.read('bug_reports', { id: b.data })).data?.[0];
  check('a fixed bug gets a resolved date and history', !u.error && row?.status === 'fixed' && !!row.resolved_at && row.diagnostics.history?.[0]?.to === 'fixed', u.error?.message);
  const p = await player.c.rpc('studio_file_bug', { p: { title: 'not staff' } });
  check('an ordinary account cannot file staff bugs', denied(p), p.error?.message);
  const sev = await world.c.rpc('studio_file_bug', { p: { title: 'Bad severity', severity: 'apocalyptic' } });
  check('bug fields only take the listed values', !!sev.error, 'no error');
}

// 11. Phase 3/4: audio, Ark settings, player reports.
const audioA = await account('audio-a');
const audioB = await account('audio-b');
for (const x of [audioA, audioB]) await owner.c.rpc('studio_set_role', { p_email: x.email, p_role: 'audio_editor', p_on: true });
{
  const a = await anon.rpc('studio_audio_register', { p: { kind: 'narration' } });
  check('an anonymous caller cannot register audio', !!a.error, a.error?.message);
  const r = await anon.read('audio_assets');
  check('anonymous callers cannot read the audio library', !!r.error || r.data.length === 0);
  const l = await call(null, 'GET', '/api/live-audio?ids=');
  check('players can read the approved-audio list', !l.error, l.error?.message);
  const w = await world.c.rpc('studio_audio_register', { p: { kind: 'narration' } });
  check('a World Editor cannot register audio', denied(w), w.error?.message);
  const bytes = new Uint8Array([0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 0, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const wu = await call(world.c.token, 'PUT', '/api/upload/studio-audio?ext=mp3', bytes, { 'Content-Type': 'audio/mpeg' });
  check('only Audio Editors upload files', denied(wu), wu.error?.message);
  const notAudio = await call(audioA.c.token, 'PUT', '/api/upload/studio-audio?ext=html', bytes, { 'Content-Type': 'text/html' });
  check('only audio files are accepted', !!notAudio.error, 'no error');
  const up = await call(audioA.c.token, 'PUT', '/api/upload/studio-audio?ext=mp3', bytes, { 'Content-Type': 'audio/mpeg' });
  const stolen = await audioB.c.rpc('studio_audio_register', { p: { kind: 'narration', path: up.data?.path, title: 'x', origin: 'human_recording', licence: 'own recording', line_text: 'Hello' } });
  check('an audio editor cannot register someone else\'s upload', !up.error && denied(stolen), up.error?.message ?? stolen.error?.message);
  const tts = await audioA.c.rpc('studio_audio_register', { p: { kind: 'recitation', path: up.data.path, title: 'x', origin: 'licensed_tts', licence: 'licence text', voice: 'Reader', surah: 1, ayah_from: 1, ayah_to: 7 } });
  check('synthetic recitation is refused', !!tts.error, 'no error');
  const reg = await audioA.c.rpc('studio_audio_register', { p: { kind: 'narration', path: up.data.path, title: 'Welcome line', origin: 'human_recording', licence: 'Our own recording', licence_confirmed: true, line_text: 'Welcome to the grove.' } });
  const own = await audioA.c.rpc('studio_audio_review', { p_id: reg.data, p_decision: 'approve', p_note: '' });
  check('nobody approves their own upload', !reg.error && denied(own), reg.error?.message ?? own.error?.message);
  const appr = await audioB.c.rpc('studio_audio_review', { p_id: reg.data, p_decision: 'approve', p_note: 'clear' });
  const la = await call(null, 'GET', `/api/live-audio?ids=${reg.data}&kind=narration`);
  const file = await fetch(`${BASE}/files/studio-audio/${la.data?.[0]?.path}`);
  const got = new Uint8Array(await file.arrayBuffer());
  check('another audio editor approves it; players can stream it', !appr.error && la.data?.length === 1 && file.ok && got.length === bytes.length, appr.error?.message);
  const trav = await fetch(`${BASE}/files/studio-audio/..%2F..%2Fstudio.db`);
  check('file paths cannot reach outside the audio folder', trav.status === 404);

  const k = await story.c.rpc('studio_save_draft', { p_scope: 'ark:slice', p_doc: { v: 1, set: { 'giraffe.speed': 3 } }, p_revision: 0 });
  check('a Story Editor cannot change Ark speeds', denied(k), k.error?.message);
  const kw = await world.c.rpc('studio_save_draft', { p_scope: 'ark:slice', p_doc: { v: 1, set: { 'giraffe.speed': 30 } }, p_revision: 0 });
  const ks = await world.c.rpc('studio_submit', { p_scope: 'ark:slice', p_note: '' });
  check('Ark numbers out of range are refused at submit', !kw.error && !!ks.error && /out of the allowed range/.test(ks.error.message), ks.error?.message);
  await call(null, 'POST', '/api/report-problem', { p_surah: 19, p_category: 'stuck', p_screen: '390x844' });
  const id = (await q('select max(id) m from player_problems')).m;
  const g = await player.c.rpc('studio_bug_from_problems', { p_ids: [id], p_bug: null, p_title: 'x' });
  check('an ordinary account cannot turn player reports into bugs', denied(g), g.error?.message);
  const ok = await world.c.rpc('studio_bug_from_problems', { p_ids: [id], p_bug: null, p_title: 'Players stuck in Maryam' });
  check('staff group player reports into a bug', !ok.error && (await q('select bug_id b from player_problems where id = ?', id)).b === ok.data, ok.error?.message);
}

// 12. Phase 5: moderation, play settings, releases.
{
  // Two families whose explorers are approved friends, in a room together; one reports the other.
  const other = await account('parent2', { mfa: false });
  await player.c.fam('family_settings', { consent: true, multiplayer: true });
  await other.c.fam('family_settings', { consent: true, multiplayer: true });
  const kai = (await other.c.fam('explorer_add', { nickname: 'Kai' })).data;
  const samCode = (await player.c.fam('my_explorers')).data[0].friend_code;
  const fr = await other.c.fam('request_friend', { me: kai, code: samCode });
  const fa = await player.c.fam('approve_friend', { me: explorer, other: kai });
  const room = await player.c.fam('open_room', { me: explorer, world: '19' });
  const inv = await player.c.fam('invite', { r: room.data, friend: kai });
  check('(setup) two friends in a room', !fr.error && !fa.error && !room.error && !inv.error, fr.error?.message ?? fa.error?.message ?? room.error?.message ?? inv.error?.message);
  const rep = await other.c.fam('report', { by_explorer: kai, about: explorer, reason: 'unkind', room: room.data });
  const rid = rep.data;
  check('a family files a report from a room', !rep.error && rid > 0, rep.error?.message);

  const qa = await anon.rpc('studio_mod_queue');
  const qp = await player.c.rpc('studio_mod_queue');
  const qw = await world.c.rpc('studio_mod_queue');
  check('only moderators see player reports (anonymous, family, world editor refused)', !!qa.error && denied(qp) && denied(qw), [qa.error?.message, qp.error?.message, qw.error?.message].join(' | '));
  const qm = await moderator.c.rpc('studio_mod_queue');
  const row = qm.data?.find((x) => x.id === rid);
  check('a moderator sees the reason, the world and the nickname', !qm.error && row?.reason === 'unkind' && row.room_world === '19' && row.about_nickname === 'Sam', JSON.stringify(row ?? qm.error));
  const keys = Object.keys(row ?? {}).join(',');
  check('a moderator never sees the grown-up, friend code, look, saves or who reported', !/guardian|email|friend_code|look|save|by_explorer/.test(keys), keys);
  const ex = await moderator.c.read('explorers');
  const sv = await moderator.c.read('saves');
  check('a moderator cannot read explorers or saves directly', !!ex.error && !!sv.error);
  const bad = await moderator.c.rpc('studio_mod_act', { p_report: rid, p_action: 'pause_online', p_days: 40, p_note: '' });
  check('pauses are 1 to 30 days', !!bad.error, bad.error?.message);
  const wp = await world.c.rpc('studio_mod_act', { p_report: rid, p_action: 'dismiss', p_days: null, p_note: '' });
  check('a world editor cannot act on reports', denied(wp), wp.error?.message);
  const pa = await moderator.c.rpc('studio_mod_act', { p_report: rid, p_action: 'pause_online', p_days: 3, p_note: 'Unkind words' });
  const after = await player.c.fam('open_room', { me: explorer, world: '19' });
  const left = (await q('select count(*) c from room_members where explorer = ? and room = ?', explorer, room.data)).c;
  check('a paused explorer leaves the room and cannot open another', !pa.error && !!after.error && /off/.test(after.error.message) && left === 0, pa.error?.message ?? after.error?.message);
  check('playing alone is not touched (saves unchanged)', (await q('select count(*) c from saves where explorer = ?', explorer)).c === 1);
  const un = await moderator.c.rpc('studio_mod_unpause', { p_report: rid });
  const again = await player.c.fam('open_room', { me: explorer, world: '19' });
  check('a moderator can lift the pause early', !un.error && !again.error, un.error?.message ?? again.error?.message);
  const audit = (await q("select detail from audit_log where action = 'moderation.pause_online' order by id desc limit 1"))?.detail ?? '';
  check('moderation is audited without naming the child', /"report"/.test(audit) && !/Sam/.test(audit), audit);

  // Online play switch: moderators draft it, a Super Admin publishes, the room functions obey.
  const wd = await world.c.rpc('studio_save_draft', { p_scope: 'config:multiplayer', p_doc: { v: 1, set: { enabled: false } }, p_revision: 0 });
  check('a world editor cannot change online play settings', denied(wd), wd.error?.message);
  const md0 = await moderator.c.rpc('studio_save_draft', { p_scope: 'config:multiplayer', p_doc: { v: 1, set: { roomMax: 6 } }, p_revision: 0 });
  const sb0 = await moderator.c.rpc('studio_submit', { p_scope: 'config:multiplayer', p_note: '' });
  check('settings out of range are refused at submit', !md0.error && !!sb0.error && /2, 3 or 4/.test(sb0.error.message), sb0.error?.message);
  const md = await moderator.c.rpc('studio_save_draft', { p_scope: 'config:multiplayer', p_doc: { v: 1, set: { enabled: false } }, p_revision: md0.data });
  const sb = await moderator.c.rpc('studio_submit', { p_scope: 'config:multiplayer', p_note: 'Pause online play' });
  check('a moderator submits online play off', !md.error && !sb.error, md.error?.message ?? sb.error?.message);
  const ap = await owner.c.rpc('studio_review', { p_version: sb.data, p_decision: 'approve', p_note: '' });
  const h = (await owner.c.read('content_versions', { id: sb.data })).data[0].hash;
  const tr = await owner.c.rpc('studio_record_test', { p_scope: 'config:multiplayer', p_version: sb.data, p_kind: 'content', p_ok: true, p_summary: 'ok', p_report: {}, p_hash: h, p_env: {} });
  const pb = await owner.c.rpc('studio_publish', { p_version: sb.data, p_effective_at: null, p_note: '' });
  const off = await player.c.fam('open_room', { me: explorer, world: '19' });
  check('when online play is off for everyone, rooms cannot be opened', !ap.error && !tr.error && !pb.error && !!off.error, [ap.error?.message, tr.error?.message, pb.error?.message].join(' | '));
  await owner.c.rpc('studio_rollback', { p_scope: 'config:multiplayer', p_version: null, p_note: 'back on' });
  const on = await player.c.fam('open_room', { me: explorer, world: '19' });
  check('unpublishing turns online play back on', !on.error, on.error?.message);

  // Releases: approved versions go out together and come back together.
  const pd = await moderator.c.rpc('studio_save_draft', { p_scope: 'config:play', p_doc: { v: 1, set: { breakMinutes: 20, closedWorlds: [7] } }, p_revision: 0 });
  const ps = await moderator.c.rpc('studio_submit', { p_scope: 'config:play', p_note: 'Break after 20 minutes' });
  check('a moderator submits play settings', !pd.error && !ps.error, pd.error?.message ?? ps.error?.message);
  const early = await owner.c.rpc('studio_release_create', { p_title: 'Too early', p_notes: '', p_versions: [ps.data] });
  check('a release only takes approved, validated versions', !!early.error && /approved/.test(early.error.message), early.error?.message);
  await owner.c.rpc('studio_review', { p_version: ps.data, p_decision: 'approve', p_note: '' });
  const ph = (await owner.c.read('content_versions', { id: ps.data })).data[0].hash;
  await owner.c.rpc('studio_record_test', { p_scope: 'config:play', p_version: ps.data, p_kind: 'content', p_ok: true, p_summary: 'ok', p_report: {}, p_hash: ph, p_env: {} });
  const sr = await story.c.rpc('studio_release_create', { p_title: 'Not mine', p_notes: '', p_versions: [ps.data] });
  check('only a Super Admin plans releases', denied(sr), sr.error?.message);
  const rc = await owner.c.rpc('studio_release_create', { p_title: 'Calmer play', p_notes: 'Break reminder', p_versions: [ps.data] });
  const rp = await owner.c.rpc('studio_release_publish', { p_id: rc.data, p_at: null });
  const lv = await anon.live('config:play');
  check('a release publishes its versions; players get them', !rc.error && !rp.error && lv.data?.[0]?.doc?.set?.breakMinutes === 20, rc.error?.message ?? rp.error?.message);
  const savesMid = await savesHash();
  const ru = await owner.c.rpc('studio_release_undo', { p_id: rc.data });
  const lv2 = (await anon.live('config:play')).data?.[0];
  check('undoing a release goes back to what was live before; saves untouched', !ru.error && lv2?.doc == null && lv2?.action === 'unpublish' && savesMid === (await savesHash()), ru.error?.message ?? JSON.stringify(lv2));
}

console.log(`\n${passes} passed, ${failures} failed`);
server.close();
rmSync(dataDir, { recursive: true, force: true });
process.exit(failures ? 1 : 0);
