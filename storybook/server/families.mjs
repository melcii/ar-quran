// Grown-up accounts, explorer profiles, saves, friends and private rooms
// (ported from the old Supabase migration 0001, with the phase 5 changes:
// moderator pauses and the published online-play settings).
// Draft for legal and technical review; no claim of compliance with any
// child-privacy law. The game has no family sign-in or multiplayer screens
// yet; these actions are here so moderation has something real to act on.
//
// Only grown-ups sign in. Each child is an explorer profile with a nickname and
// a look. Children are never findable: friends join only by a code the
// grown-ups exchange, and both grown-ups approve. Rooms are 2 to 4 friends.
import crypto from 'node:crypto';
import { tx } from './db.mjs';
import { E } from './errors.mjs';
import { isObj } from './rules.mjs';
import { liveSetting, row } from './studio.mjs';

const now = () => new Date().toISOString();
const str = (x) => (x == null ? '' : String(x));

const isMine = async (db, uid, e) => !!await db.prepare('select 1 from explorers where id = ? and guardian = ?').get(str(e), uid);
async function mine(db, uid, e) {
  if (!(await isMine(db, uid, e))) throw new E('not your explorer');
}
async function areFriends(db, x, y) {
  const [a, b] = x < y ? [x, y] : [y, x];
  return (
    !!await db.prepare('select 1 from friendships where a = ? and b = ? and a_ok and b_ok').get(a, b) &&
    !await db.prepare('select 1 from blocks where (explorer = ? and blocked = ?) or (explorer = ? and blocked = ?)').get(x, y, y, x)
  );
}
// The family's choice, not paused by a moderator, and online play on for everyone.
export async function mayPlayOnline(db, e) {
  const r = await db.prepare('select g.multiplayer, g.consent_at, x.online_paused_until p from explorers x join guardians g on g.id = x.guardian where x.id = ?').get(str(e));
  const family = !!r && !!r.multiplayer && !!r.consent_at && (!r.p || r.p <= now());
  return family && (await liveSetting(db, 'config:multiplayer', 'enabled')) !== false;
}
async function online(db, e, msg = 'multiplayer is off for this explorer') {
  if (!(await mayPlayOnline(db, e))) throw new E(msg);
}
const SAVE_KEY = (k) => /^(quran-adventure\.|quran-storybook\/)/.test(k) && !/^quran-adventure\.profile/.test(k);

export const FAMILY = {
  /** The grown-up's own settings: consent, multiplayer, phrases only. */
  async family_settings(db, uid, p) {
    p = isObj(p) ? p : {};
    await db.prepare('insert or ignore into guardians (id, created_at) values (?, ?)').run(uid, now());
    if ('consent' in p) await db.prepare('update guardians set consent_at = ? where id = ?').run(p.consent ? now() : null, uid);
    if ('multiplayer' in p) await db.prepare('update guardians set multiplayer = ? where id = ?').run(p.multiplayer ? 1 : 0, uid);
    if ('phrases_only' in p) await db.prepare('update guardians set phrases_only = ? where id = ?').run(p.phrases_only ? 1 : 0, uid);
    return row(await db.prepare('select * from guardians where id = ?').get(uid));
  },
  async explorer_add(db, uid, { nickname, look }) {
    await db.prepare('insert or ignore into guardians (id, created_at) values (?, ?)').run(uid, now());
    const nick = str(nickname).trim();
    if (!/^[\p{L}\p{N} ]{1,16}$/u.test(nick)) throw new E('a nickname is 1 to 16 letters, numbers or spaces');
    const id = crypto.randomUUID();
    await db.prepare('insert into explorers (id, guardian, nickname, look, friend_code, created_at) values (?, ?, ?, ?, ?, ?)').run(id, uid, nick, JSON.stringify(look ?? {}), crypto.randomBytes(4).toString('hex').toUpperCase(), now());
    return id;
  },
  async my_explorers(db, uid) {
    return (await db.prepare('select id, nickname, look, friend_code, created_at, online_paused_until from explorers where guardian = ? order by created_at').all(uid)).map(row);
  },
  async saves_get(db, uid, { me }) {
    await mine(db, uid, me);
    return await db.prepare('select key, value, updated_at from saves where explorer = ?').all(str(me));
  },
  async saves_put(db, uid, { me, key, value }) {
    await mine(db, uid, me);
    if (!SAVE_KEY(str(key))) throw new E('not a save key');
    await db.prepare('insert into saves (explorer, key, value, updated_at) values (?, ?, ?, ?) on conflict (explorer, key) do update set value = excluded.value, updated_at = excluded.updated_at').run(str(me), str(key), str(value), now());
    return null;
  },
  async request_friend(db, uid, { me, code }) {
    await mine(db, uid, me);
    await online(db, me);
    const other = (await db.prepare('select id from explorers where friend_code = ?').get(str(code).trim().toUpperCase()))?.id;
    // The same answer whether the code is wrong, blocked or the other family has multiplayer off.
    if (!other || other === me || !(await mayPlayOnline(db, other))) throw new E('no explorer with that code');
    if (await db.prepare('select 1 from blocks where (explorer = ? and blocked = ?) or (explorer = ? and blocked = ?)').get(me, other, other, me)) throw new E('no explorer with that code');
    const [a, b] = me < other ? [me, other] : [other, me];
    await db.prepare('insert into friendships (a, b, a_ok, b_ok, created_at) values (?, ?, ?, ?, ?) on conflict (a, b) do update set a_ok = a_ok or excluded.a_ok, b_ok = b_ok or excluded.b_ok').run(a, b, me < other ? 1 : 0, me > other ? 1 : 0, now());
    return other;
  },
  async approve_friend(db, uid, { me, other }) {
    await mine(db, uid, me);
    await online(db, me);
    const [a, b] = me < other ? [me, other] : [other, me];
    const r = await db.prepare('update friendships set a_ok = a_ok or (a = ?), b_ok = b_ok or (b = ?) where a = ? and b = ?').run(me, me, a, b);
    if (!r.changes) throw new E('no request');
    return null;
  },
  // What a family may see of friends and requests: nickname and look only.
  async friend_list(db, uid, { me }) {
    if (!(await isMine(db, uid, me))) return [];
    return (await db
      .prepare(
        `select x.id explorer, x.nickname, x.look, (f.a_ok and f.b_ok) approved, ((f.a = ? and not f.a_ok) or (f.b = ? and not f.b_ok)) waiting_for_me
         from friendships f join explorers x on x.id = case when f.a = ? then f.b else f.a end where f.a = ? or f.b = ?`,
      )
      .all(me, me, me, me, me))
      .map(row);
  },
  async block(db, uid, { me, other }) {
    await mine(db, uid, me);
    await db.prepare('insert or ignore into blocks (explorer, blocked, created_at) values (?, ?, ?)').run(str(me), str(other), now());
    return null;
  },
  async open_room(db, uid, { me, world }) {
    await mine(db, uid, me);
    await online(db, me);
    if (!/^(ark|[0-9]{1,3})$/.test(str(world))) throw new E('not a world');
    const r = crypto.randomUUID();
    await db.prepare('insert into rooms (id, host, world, created_at) values (?, ?, ?, ?)').run(r, me, str(world), now());
    await db.prepare('insert into room_members (room, explorer, invited_at, joined_at) values (?, ?, ?, ?)').run(r, me, now(), now());
    return r;
  },
  // Only the host invites, only approved friends, at most the published room size (2 to 4).
  async invite(db, uid, { r, friend }) {
    const h = (await db.prepare('select host from rooms where id = ? and not closed').get(str(r)))?.host;
    if (!h || !(await isMine(db, uid, h))) throw new E('not your room');
    if (!(await areFriends(db, h, str(friend)))) throw new E('only approved friends can be invited');
    await online(db, friend, 'multiplayer is off for that explorer');
    const max = Math.min(4, Math.max(2, Number((await liveSetting(db, 'config:multiplayer', 'roomMax')) ?? 4)));
    if ((await db.prepare('select count(*) c from room_members where room = ?').get(str(r))).c >= max) throw new E('the room is full');
    await db.prepare('insert or ignore into room_members (room, explorer, invited_at) values (?, ?, ?)').run(str(r), str(friend), now());
    return null;
  },
  async join_room(db, uid, { me, r }) {
    await mine(db, uid, me);
    await online(db, me);
    const x = await db.prepare('update room_members set joined_at = ? where room = ? and explorer = ? and exists (select 1 from rooms where id = ? and not closed)').run(now(), str(r), str(me), str(r));
    if (!x.changes) throw new E('not invited');
    return null;
  },
  async leave_room(db, uid, { me, r }) {
    await mine(db, uid, me);
    await db.prepare('delete from room_members where room = ? and explorer = ?').run(str(r), str(me));
    await db.prepare('update rooms set closed = 1 where id = ? and (host = ? or not exists (select 1 from room_members where room = ?))').run(str(r), str(me), str(r));
    return null;
  },
  async room_roster(db, uid, { r }) {
    const inIt = await db.prepare('select 1 from room_members m join explorers x on x.id = m.explorer where m.room = ? and x.guardian = ?').get(str(r), uid);
    if (!inIt) return [];
    return (await db.prepare('select x.id explorer, x.nickname, x.look, m.joined_at is not null joined from room_members m join explorers x on x.id = m.explorer where m.room = ?').all(str(r))).map(row);
  },
  async report(db, uid, { by_explorer, about, reason, room }) {
    await mine(db, uid, by_explorer);
    if (!['unkind', 'unsafe', 'other'].includes(reason)) throw new E('reason must be unkind, unsafe or other');
    return Number((await db.prepare('insert into reports (by_explorer, about, reason, room, created_at) values (?, ?, ?, ?, ?)').run(str(by_explorer), about ?? null, reason, room ?? null, now())).lastInsertRowid);
  },
};

export async function familyAct(db, caller, name, args) {
  const fn = Object.prototype.hasOwnProperty.call(FAMILY, name) ? FAMILY[name] : null;
  if (!fn) throw new E(`unknown action ${name}`, 'PGRST202', 404);
  if (!caller.uid) throw new E('sign in first', '42501', 401);
  return tx(db, () => fn(db, caller.uid, isObj(args) ? args : {}));
}
