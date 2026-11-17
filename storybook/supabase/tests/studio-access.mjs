// End-to-end access checks for the Admin Studio, run against a real local
// Supabase (Auth with TOTP multi-factor, PostgREST, Postgres):
//
//   npx supabase start            (from storybook/)
//   node supabase/tests/studio-access.mjs
//
// It signs up throwaway accounts, enrols real TOTP factors, and checks that
// the server (not the interface) refuses everything a role may not do.
// Uses SUPABASE_URL / SUPABASE_ANON_KEY / DATABASE_URL, defaulting to the
// local CLI stack.
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const KEY = process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const DB = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const run = Date.now().toString(36);

let failures = 0;
let passes = 0;
function check(name, ok, extra) {
  if (ok) passes++;
  else failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && extra ? `  (${extra})` : ''}`);
}
const sql = (q) => execFileSync('psql', [DB, '-At', '-c', q], { encoding: 'utf8' }).trim();

// RFC 6238 TOTP, the same codes an authenticator app shows.
function totp(secret) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret.replace(/=+$/, '').toUpperCase()) bits += alpha.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const ctr = Buffer.alloc(8);
  ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = crypto.createHmac('sha1', key).update(ctr).digest();
  const o = h[h.length - 1] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0');
}

const client = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function account(name, { mfa = true } = {}) {
  const c = client();
  const email = `${name}-${run}@studio.test`;
  const { error } = await c.auth.signUp({ email, password: 'correct horse battery staple 9' });
  if (error) throw error;
  if (mfa) {
    const en = await c.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'test' });
    if (en.error) throw en.error;
    const ch = await c.auth.mfa.challenge({ factorId: en.data.id });
    if (ch.error) throw ch.error;
    const v = await c.auth.mfa.verify({ factorId: en.data.id, challengeId: ch.data.id, code: totp(en.data.totp.secret) });
    if (v.error) throw v.error;
  }
  return { c, email };
}

const denied = (r) => !!r.error && /42501|not allowed|only|permission|cannot|need/i.test(`${r.error.code} ${r.error.message}`);
const doc = (set, extra = {}) => ({ v: 1, set, ...extra });

const anon = client();

// 1. Anonymous visitors.
{
  const s = await anon.from('quran_surahs').select('n').limit(200);
  check('anon reads the surah list (public data)', !s.error && s.data.length === 114, s.error?.message);
  const v = await anon.from('content_versions').select('id');
  check('anon sees no versions', !v.error ? v.data.length === 0 : true);
  const a = await anon.from('audit_log').select('id');
  check('anon sees no audit log', !a.error ? a.data.length === 0 : true);
  const d = await anon.rpc('studio_save_draft', { p_scope: 'surah:19', p_doc: doc({ welcome: 'x' }), p_revision: 0 });
  check('anon cannot save a draft', !!d.error, 'no error');
  const ins = await anon.from('content_drafts').insert({ scope: 'surah:19', doc: {} });
  check('anon cannot write tables directly', !!ins.error);
  const p = await anon.rpc('report_problem', { p_surah: 19, p_category: 'stuck', p_screen: '390x844' });
  check('anon can send a child-safe problem report', !p.error, p.error?.message);
  const bad = await anon.rpc('report_problem', { p_surah: 19, p_category: 'my name is Sam', p_screen: '390x844' });
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

// The first Super Admin comes from the database owner only.
{
  const b = await owner.c.rpc('studio_bootstrap_super_admin', { p_email: owner.email });
  check('bootstrap cannot be called through the API', !!b.error);
  sql(`select public.studio_bootstrap_super_admin('${owner.email}')`);
  const w = await owner.c.rpc('studio_whoami');
  check('owner is Super Admin with an aal2 session', w.data?.staff === true && w.data.roles.includes('super_admin'), JSON.stringify(w.data));
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
}

// Saves of a player before any publishing, to compare afterwards.
sql(`insert into public.guardians (id) select id from auth.users where email = '${player.email}'`);
const explorer = sql(`insert into public.explorers (guardian, nickname) select id, 'Sam' from auth.users where email = '${player.email}' returning id`).split('\n')[0];
sql(`insert into public.saves (explorer, key, value) values ('${explorer}', 'quran-adventure.adventure.19', '{"done":["quiet"],"prog":{}}')`);
const savesBefore = sql(`select md5(string_agg(explorer || key || value || updated_at, ',' order by key)) from public.saves`);

// 3. Drafts and permissions by kind of change.
const S = 'surah:19';
// Start the scopes used here from nothing so the run is repeatable (the browser tests use them too).
for (const x of [S, 'surah:1', 'ark:slice']) sql(`delete from public.test_runs where scope = '${x}'; delete from public.publications where scope = '${x}'; delete from public.content_drafts where scope = '${x}'; delete from public.content_versions where scope = '${x}'`);
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
  const direct = await world.c.from('content_drafts').update({ doc: {} }).eq('scope', S).select();
  check('staff cannot change tables directly either', !!direct.error || direct.data.length === 0);
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
  const ver = await owner.c.from('content_versions').select('hash').eq('id', v1).single();
  const t = await world.c.rpc('studio_record_test', { p_scope: S, p_version: v1, p_kind: 'content', p_ok: true, p_summary: 'all checks passed', p_report: { checks: 12 }, p_hash: ver.data.hash, p_env: {} });
  check('world editor records a passing validation', !t.error, t.error?.message);
  const mod = await moderator.c.rpc('studio_publish', { p_version: v1, p_effective_at: null, p_note: '' });
  check('a moderator cannot publish', denied(mod), mod.error?.message);
  const pub = await owner.c.rpc('studio_publish', { p_version: v1, p_effective_at: null, p_note: 'first' });
  check('Super Admin publishes version 1', !pub.error, pub.error?.message);
  const live = await anon.from('live_content').select('*').eq('scope', S).single();
  check('players see version 1', live.data?.number === 1 && live.data.doc.set['structures.0.x'] === 6, JSON.stringify(live.data ?? live.error));
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
  const row = await owner.c.from('content_versions').select('quran_linked, changed, hash').eq('id', v2).single();
  check('editing a reading note is marked Quran-linked', row.data?.quran_linked === true, JSON.stringify(row.data));
  const sa = await owner.c.rpc('studio_review', { p_version: v2, p_decision: 'approve', p_note: '' });
  check('Super Admin alone cannot approve Quran-linked content', denied(sa), sa.error?.message);
  const qr = await reviewer.c.rpc('studio_review', { p_version: v2, p_decision: 'approve', p_note: 'Checked against the tafsir' });
  check('Quran Content Reviewer approves it', !qr.error, qr.error?.message);
  await world.c.rpc('studio_record_test', { p_scope: S, p_version: v2, p_kind: 'content', p_ok: true, p_summary: 'ok', p_report: {}, p_hash: row.data.hash, p_env: {} });
  const pub = await owner.c.rpc('studio_publish', { p_version: v2, p_effective_at: null, p_note: 'second' });
  check('version 2 is published', !pub.error, pub.error?.message);
  const live = await anon.from('live_content').select('number').eq('scope', S).single();
  check('players see version 2', live.data?.number === 2);
}

// 7. Rollback and player progress.
{
  const bad = await world.c.rpc('studio_rollback', { p_scope: S, p_version: v1, p_note: '' });
  check('only a Super Admin rolls back', denied(bad), bad.error?.message);
  const rb = await owner.c.rpc('studio_rollback', { p_scope: S, p_version: v1, p_note: 'v2 broke something' });
  check('Super Admin rolls back to version 1', !rb.error, rb.error?.message);
  const live = await anon.from('live_content').select('number').eq('scope', S).single();
  check('players see version 1 again', live.data?.number === 1);
  const savesAfter = sql(`select md5(string_agg(explorer || key || value || updated_at, ',' order by key)) from public.saves`);
  check('player saves are byte-for-byte unchanged by publishing and rollback', savesBefore === savesAfter);
}

// 8. Scheduled publication.
{
  const d = await story.c.rpc('studio_save_draft', { p_scope: 'surah:1', p_doc: doc({ welcome: 'A scheduled welcome.' }), p_revision: 0 });
  const sub = await story.c.rpc('studio_submit', { p_scope: 'surah:1', p_note: 'scheduled' });
  await owner.c.rpc('studio_review', { p_version: sub.data, p_decision: 'approve', p_note: '' });
  const h = await owner.c.from('content_versions').select('hash').eq('id', sub.data).single();
  await world.c.rpc('studio_record_test', { p_scope: 'surah:1', p_version: sub.data, p_kind: 'content', p_ok: true, p_summary: 'ok', p_report: {}, p_hash: h.data.hash, p_env: {} });
  const later = new Date(Date.now() + 3600e3).toISOString();
  const pub = await owner.c.rpc('studio_publish', { p_version: sub.data, p_effective_at: later, p_note: 'in an hour' });
  const live = await anon.from('live_content').select('number').eq('scope', 'surah:1');
  check('a scheduled publication is not live before its time', !d.error && !pub.error && live.data?.length === 0, JSON.stringify(live.data ?? pub.error));
}

// 9. The audit log.
{
  const a = await owner.c.from('audit_log').select('action').order('id');
  const actions = new Set((a.data ?? []).map((r) => r.action));
  check('audit log records saves, submissions, reviews, publishing, rollback and role changes',
    ['draft.save', 'version.submit', 'version.approve', 'version.publish', 'version.rollback', 'staff.grant', 'staff.bootstrap', 'test.record'].every((x) => actions.has(x)),
    [...actions].join(','));
  const s = await story.c.from('audit_log').select('id');
  check('only Super Admins read the audit log', !s.error && s.data.length === 0);
  let frozen = false;
  try {
    sql('update public.audit_log set action = action');
  } catch {
    frozen = true;
  }
  check('the audit log cannot be edited, even by the database owner', frozen);
}

// 10. Bugs.
{
  const b = await world.c.rpc('studio_file_bug', { p: { surah: 19, title: 'Rock floats near the stream', severity: 'high', category: 'collision', steps: 'Walk to the stream', device: { ua: 'test' } } });
  check('staff file a bug', !b.error, b.error?.message);
  const u = await world.c.rpc('studio_update_bug', { p_id: b.data, p: { status: 'fixed', resolution: 'Moved the rock' } });
  const row = await world.c.from('bug_reports').select('status, resolved_at').eq('id', b.data).single();
  check('a fixed bug gets a resolved date', !u.error && row.data?.status === 'fixed' && !!row.data.resolved_at, u.error?.message);
  const p = await player.c.rpc('studio_file_bug', { p: { title: 'not staff' } });
  check('an ordinary account cannot file staff bugs', denied(p), p.error?.message);
}

// 11. Phase 3/4: audio, Ark settings, player reports.
{
  const a = await anon.rpc('studio_audio_register', { p: { kind: 'narration' } });
  check('an anonymous caller cannot register audio', !!a.error, a.error?.message);
  const r = await anon.from('audio_assets').select('id');
  check('anonymous callers cannot read the audio library', !!r.error || r.data.length === 0);
  const l = await anon.from('live_audio').select('id').limit(1);
  check('players can read the approved-audio list', !l.error, l.error?.message);
  const w = await world.c.rpc('studio_audio_register', { p: { kind: 'narration' } });
  check('a World Editor cannot register audio', denied(w), w.error?.message);
  const k = await story.c.rpc('studio_save_draft', { p_scope: 'ark:slice', p_doc: { v: 1, set: { 'giraffe.speed': 3 } }, p_revision: 0 });
  check('a Story Editor cannot change Ark speeds', denied(k), k.error?.message);
  const pr = await anon.rpc('report_problem', { p_surah: 19, p_category: 'stuck', p_screen: '390x844' });
  const id = +sql(`select max(id) from public.player_problems`);
  const g = await player.c.rpc('studio_bug_from_problems', { p_ids: [id], p_bug: null, p_title: 'x' });
  check('an ordinary account cannot turn player reports into bugs', !pr.error && denied(g), g.error?.message);
  const ok = await world.c.rpc('studio_bug_from_problems', { p_ids: [id], p_bug: null, p_title: 'Players stuck in Maryam' });
  const linked = sql(`select bug_id from public.player_problems where id = ${id}`);
  check('staff group player reports into a bug', !ok.error && linked === String(ok.data), ok.error?.message);
}

// 12. Phase 5: moderation, play settings, releases.
{
  for (const sc of ['config:play', 'config:multiplayer']) sql(`delete from public.test_runs where scope = '${sc}'; delete from public.publications where scope = '${sc}'; delete from public.content_drafts where scope = '${sc}'; delete from public.content_versions where scope = '${sc}'`);
  // Two families whose explorers are approved friends, in a room together; one reports the other.
  const other = await account('parent2', { mfa: false });
  sql(`update public.guardians set consent_at = now(), multiplayer = true where id = (select id from auth.users where email = '${player.email}')`);
  sql(`insert into public.guardians (id, consent_at, multiplayer) select id, now(), true from auth.users where email = '${other.email}'`);
  const kai = sql(`insert into public.explorers (guardian, nickname) select id, 'Kai' from auth.users where email = '${other.email}' returning id`).split('\n')[0];
  sql(`insert into public.friendships (a, b, a_ok, b_ok) values (least('${explorer}'::uuid, '${kai}'::uuid), greatest('${explorer}'::uuid, '${kai}'::uuid), true, true)`);
  const room = await player.c.rpc('open_room', { me: explorer, world: '19' });
  const inv = await player.c.rpc('invite', { r: room.data, friend: kai });
  check('(setup) two friends in a room', !room.error && !inv.error, room.error?.message ?? inv.error?.message);
  const rep = await other.c.from('reports').insert({ by_explorer: kai, about: explorer, reason: 'unkind', room: room.data });
  const rid = +sql(`select max(id) from public.reports`);
  check('a family files a report from a room', !rep.error && rid > 0, rep.error?.message);

  const qa = await anon.rpc('studio_mod_queue');
  const qp = await player.c.rpc('studio_mod_queue');
  const qw = await world.c.rpc('studio_mod_queue');
  check('only moderators see player reports (anonymous, family, world editor refused)', !!qa.error && denied(qp) && denied(qw), [qa.error?.message, qp.error?.message, qw.error?.message].join(' | '));
  const q = await moderator.c.rpc('studio_mod_queue');
  const row = q.data?.find((x) => x.id === rid);
  check('a moderator sees the reason, the world and the nickname', !q.error && row?.reason === 'unkind' && row.room_world === '19' && row.about_nickname === 'Sam', JSON.stringify(row ?? q.error));
  const keys = Object.keys(row ?? {}).join(',');
  check('a moderator never sees the grown-up, friend code, look, saves or who reported', !/guardian|email|friend_code|look|save|by_explorer/.test(keys), keys);
  const ex = await moderator.c.from('explorers').select('*');
  const sv = await moderator.c.from('saves').select('*');
  check('a moderator cannot read explorers or saves directly', (ex.data ?? []).length === 0 && (sv.data ?? []).length === 0);
  const bad = await moderator.c.rpc('studio_mod_act', { p_report: rid, p_action: 'pause_online', p_days: 40, p_note: '' });
  check('pauses are 1 to 30 days', !!bad.error, bad.error?.message);
  const wp = await world.c.rpc('studio_mod_act', { p_report: rid, p_action: 'dismiss', p_days: null, p_note: '' });
  check('a world editor cannot act on reports', denied(wp), wp.error?.message);
  const pa = await moderator.c.rpc('studio_mod_act', { p_report: rid, p_action: 'pause_online', p_days: 3, p_note: 'Unkind words' });
  const after = await player.c.rpc('open_room', { me: explorer, world: '19' });
  const left = sql(`select count(*) from public.room_members where explorer = '${explorer}' and room = '${room.data}'`);
  check('a paused explorer leaves the room and cannot open another', !pa.error && !!after.error && /off/.test(after.error.message) && left === '0', pa.error?.message ?? after.error?.message);
  check('playing alone is not touched (saves unchanged)', sql(`select count(*) from public.saves where explorer = '${explorer}'`) === '1');
  const un = await moderator.c.rpc('studio_mod_unpause', { p_report: rid });
  const again = await player.c.rpc('open_room', { me: explorer, world: '19' });
  check('a moderator can lift the pause early', !un.error && !again.error, un.error?.message ?? again.error?.message);
  const audit = sql(`select detail::text from public.audit_log where action = 'moderation.pause_online' order by id desc limit 1`);
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
  const h = await owner.c.from('content_versions').select('hash').eq('id', sb.data).single();
  const tr = await owner.c.rpc('studio_record_test', { p_scope: 'config:multiplayer', p_version: sb.data, p_kind: 'content', p_ok: true, p_summary: 'ok', p_report: {}, p_hash: h.data.hash, p_env: {} });
  const pb = await owner.c.rpc('studio_publish', { p_version: sb.data, p_effective_at: null, p_note: '' });
  const off = await player.c.rpc('open_room', { me: explorer, world: '19' });
  check('when online play is off for everyone, rooms cannot be opened', !ap.error && !tr.error && !pb.error && !!off.error, [ap.error?.message, tr.error?.message, pb.error?.message].join(' | '));
  await owner.c.rpc('studio_rollback', { p_scope: 'config:multiplayer', p_version: null, p_note: 'back on' });
  const on = await player.c.rpc('open_room', { me: explorer, world: '19' });
  check('unpublishing turns online play back on', !on.error, on.error?.message);

  // Releases: approved versions go out together and come back together.
  const pd = await moderator.c.rpc('studio_save_draft', { p_scope: 'config:play', p_doc: { v: 1, set: { breakMinutes: 20, closedWorlds: [7] } }, p_revision: 0 });
  const ps = await moderator.c.rpc('studio_submit', { p_scope: 'config:play', p_note: 'Break after 20 minutes' });
  check('a moderator submits play settings', !pd.error && !ps.error, pd.error?.message ?? ps.error?.message);
  const early = await owner.c.rpc('studio_release_create', { p_title: 'Too early', p_notes: '', p_versions: [ps.data] });
  check('a release only takes approved, validated versions', !!early.error && /approved/.test(early.error.message), early.error?.message);
  await owner.c.rpc('studio_review', { p_version: ps.data, p_decision: 'approve', p_note: '' });
  const ph = await owner.c.from('content_versions').select('hash').eq('id', ps.data).single();
  await owner.c.rpc('studio_record_test', { p_scope: 'config:play', p_version: ps.data, p_kind: 'content', p_ok: true, p_summary: 'ok', p_report: {}, p_hash: ph.data.hash, p_env: {} });
  const sr = await story.c.rpc('studio_release_create', { p_title: 'Not mine', p_notes: '', p_versions: [ps.data] });
  check('only a Super Admin plans releases', denied(sr), sr.error?.message);
  const rc = await owner.c.rpc('studio_release_create', { p_title: 'Calmer play', p_notes: 'Break reminder', p_versions: [ps.data] });
  const rp = await owner.c.rpc('studio_release_publish', { p_id: rc.data, p_at: null });
  const lv = await anon.from('live_content').select('doc').eq('scope', 'config:play').single();
  check('a release publishes its versions; players get them', !rc.error && !rp.error && lv.data?.doc?.set?.breakMinutes === 20, rc.error?.message ?? rp.error?.message);
  const savesMid = sql(`select md5(string_agg(explorer || key || value || updated_at, ',' order by key)) from public.saves`);
  const ru = await owner.c.rpc('studio_release_undo', { p_id: rc.data });
  const lv2 = await anon.from('live_content').select('doc, action').eq('scope', 'config:play').single();
  const savesAfter = sql(`select md5(string_agg(explorer || key || value || updated_at, ',' order by key)) from public.saves`);
  check('undoing a release goes back to what was live before; saves untouched', !ru.error && lv2.data?.doc == null && lv2.data?.action === 'unpublish' && savesMid === savesAfter, ru.error?.message ?? JSON.stringify(lv2.data));
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
