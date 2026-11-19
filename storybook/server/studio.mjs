// The studio's checked actions, ported from the Postgres functions in the old
// Supabase migrations 0002-0005. Same rules: every write tests the caller's
// roles (with an authenticator-checked session) here on the server and
// writes the audit log; reads give staff only what row-level policies gave
// them. Player saves are never touched by publishing or rollback.
// Nothing here calls an AI model.
import crypto from 'node:crypto';
import { tx } from './db.mjs';
import { E, deny } from './errors.mjs';
import { ARABIC, changes, docProblems, isObj, scopeOk } from './rules.mjs';

const now = () => new Date().toISOString();
const J = (x) => JSON.stringify(x ?? null);
const str = (x, d = '') => (x == null ? d : String(x));
const int = (x) => (x == null || x === '' ? null : Number.isInteger(Number(x)) ? Number(x) : (() => { throw new E(`not a whole number: ${x}`); })());
const iso = (x) => {
  if (x == null || x === '') return null;
  const d = new Date(x);
  if (Number.isNaN(+d)) throw new E(`not a date and time: ${x}`);
  return d.toISOString();
};
const later = (a, b) => (a > b ? a : b);

export const ROLES = ['super_admin', 'world_editor', 'story_editor', 'quran_reviewer', 'audio_editor', 'game_tester', 'moderator'];

/* ------------------------------------------------------------- row readers */

const JSON_COLS = new Set(['doc', 'changed', 'validation', 'reviewer_roles', 'report', 'environment', 'device', 'diagnostics', 'detail', 'actor_roles', 'versions', 'previous', 'look']);
const BOOL_COLS = new Set(['quran_linked', 'validation_ok', 'ok', 'needs_code', 'licence_confirmed', 'room_closed', 'closed', 'mfa', 'multiplayer', 'phrases_only', 'approved', 'waiting_for_me', 'joined']);
export function row(r) {
  if (!r) return r;
  const o = {};
  for (const [k, v] of Object.entries(r)) o[k] = v == null ? null : JSON_COLS.has(k) && typeof v === 'string' ? JSON.parse(v) : BOOL_COLS.has(k) ? !!v : v;
  return o;
}
const rows = (list) => list.map(row);

/* ------------------------------------------------------------- who is asking */

export function who(db, c) {
  const roles = c.uid ? db.prepare('select role from staff_roles where user_id = ? order by role').all(c.uid).map((r) => r.role) : [];
  const mfa = c.aal === 'aal2';
  const exact = (r) => mfa && roles.includes(r);
  const has = (r) => mfa && (roles.includes(r) || roles.includes('super_admin'));
  return { uid: c.uid, aal: c.aal, roles, mfa, staff: mfa && roles.length > 0, exact, has };
}

function audit(db, w, action, scope, detail) {
  db.prepare('insert into audit_log (at, actor, actor_roles, action, scope, detail) values (?, ?, ?, ?, ?, ?)').run(now(), w?.uid ?? null, J(w?.roles ?? []), action, scope ?? null, J(detail ?? {}));
}

/* ------------------------------------------------------------- content helpers */

function liveRow(db, scope, at = now()) {
  return db
    .prepare(
      `select p.scope, v.doc, v.number, v.hash, p.effective_at, p.action from publications p left join content_versions v on v.id = p.version_id
       where p.scope = ? and p.effective_at <= ? order by p.effective_at desc, p.id desc limit 1`,
    )
    .get(scope, at);
}
export function live(db, scope) {
  const r = liveRow(db, scope);
  return r ? [row(r)] : [];
}
const liveDoc = (db, scope) => {
  const r = liveRow(db, scope);
  return r?.doc ? JSON.parse(r.doc) : null;
};
export const liveSetting = (db, scope, key) => liveDoc(db, scope)?.set?.[key] ?? null;

function mayChange(w, scope, classes) {
  if (!w.staff) return false;
  return classes.every((c) =>
    c === 'text' || c === 'quran' || c === 'record'
      ? w.has('story_editor')
      : c === 'world' || c === 'catalog'
        ? w.has('world_editor')
        : c === 'tasks'
          ? w.has('story_editor') || w.has('world_editor')
          : c === 'audio'
            ? w.has('audio_editor')
            : c === 'config'
              ? scope === 'config:multiplayer' || scope === 'config:play'
                ? w.has('moderator')
                : w.has('audio_editor')
              : false,
  );
}

function problems(db, scope, doc) {
  const ay = db.prepare('select ayahs from quran_surahs where n = ?');
  const aud = db.prepare("select 1 from audio_assets where id = ? and kind = 'narration' and status = 'approved'");
  return docProblems(scope, doc, { ayahs: (n) => ay.get(n)?.ayahs, approvedNarration: (id) => !!aud.get(id) });
}

const getVersion = (db, id) => db.prepare('select * from content_versions where id = ?').get(id);
const hashDoc = (doc) => crypto.createHash('md5').update(JSON.stringify(doc)).digest('hex');

/* ------------------------------------------------------------- the actions */

// Each action: (db, w, args) -> result. Run inside a write transaction.
export const ACTIONS = {
  studio_whoami(db, w) {
    return { user: w.uid, aal: w.aal ?? '', roles: w.roles, staff: w.staff };
  },

  studio_live_doc(db, w, { p_scope }) {
    return liveDoc(db, p_scope);
  },

  studio_save_draft(db, w, { p_scope, p_doc, p_revision }) {
    if (!w.staff) throw deny('staff with a multi-factor session only');
    if (!scopeOk(p_scope)) throw new E(`unknown scope ${p_scope}`);
    if (!isObj(p_doc)) throw new E('the document must be an object');
    const cur = db.prepare('select * from content_drafts where scope = ?').get(p_scope);
    const base = cur ? JSON.parse(cur.doc) : (liveDoc(db, p_scope) ?? { v: 1 });
    if (cur && cur.revision !== Number(p_revision)) throw new E(`someone else saved this draft (revision ${cur.revision} is newer than yours, ${p_revision}); reload it first`, 'PT409');
    const classes = changes(p_scope, base, p_doc);
    if (!classes.length) return cur?.revision ?? 0;
    if (!mayChange(w, p_scope, classes)) throw deny(`your roles do not allow these changes (${classes.join(', ')})`);
    const text = J(p_doc);
    if (Buffer.byteLength(text) >= 600000) throw new E('the document is too large');
    if (cur) db.prepare('update content_drafts set doc = ?, revision = revision + 1, updated_by = ?, updated_at = ? where scope = ?').run(text, w.uid, now(), p_scope);
    else {
      const bv = db.prepare('select max(version_id) m from publications where scope = ?').get(p_scope).m;
      db.prepare('insert into content_drafts (scope, doc, base_version, revision, updated_by, updated_at) values (?, ?, ?, 1, ?, ?)').run(p_scope, text, bv, w.uid, now());
    }
    const rev = (cur?.revision ?? 0) + 1;
    audit(db, w, 'draft.save', p_scope, { classes, revision: rev });
    return rev;
  },

  studio_discard_draft(db, w, { p_scope }) {
    const d = db.prepare('select * from content_drafts where scope = ?').get(p_scope);
    if (!d) return null;
    if (!mayChange(w, p_scope, changes(p_scope, liveDoc(db, p_scope) ?? { v: 1 }, JSON.parse(d.doc)))) throw deny('your roles do not allow discarding this draft');
    db.prepare('delete from content_drafts where scope = ?').run(p_scope);
    audit(db, w, 'draft.discard', p_scope, { revision: d.revision });
    return null;
  },

  studio_submit(db, w, { p_scope, p_note }) {
    const d = db.prepare('select * from content_drafts where scope = ?').get(p_scope);
    if (!d) throw new E('there is no draft to submit');
    const doc = JSON.parse(d.doc);
    const classes = changes(p_scope, liveDoc(db, p_scope) ?? { v: 1 }, doc);
    if (!classes.length) throw new E('the draft is the same as what is published');
    // Each change was checked against its author's roles when it was saved;
    // any content editor may send the draft on for review.
    if (!(w.has('story_editor') || w.has('world_editor') || w.has('audio_editor') || ((p_scope === 'config:multiplayer' || p_scope === 'config:play') && w.has('moderator')))) throw deny('editors only');
    const probs = problems(db, p_scope, doc);
    if (probs.length) throw new E(`the draft has problems: ${probs.join('; ')}`);
    const num = db.prepare('select coalesce(max(number), 0) + 1 n from content_versions where scope = ?').get(p_scope).n;
    db.prepare("update content_versions set state = 'withdrawn' where scope = ? and state in ('submitted', 'approved', 'changes_requested')").run(p_scope);
    const vid = Number(
      db
        .prepare('insert into content_versions (scope, number, doc, hash, note, quran_linked, changed, created_by, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(p_scope, num, d.doc, hashDoc(doc), str(p_note).slice(0, 2000), classes.includes('quran') ? 1 : 0, J(classes), w.uid, now()).lastInsertRowid,
    );
    audit(db, w, 'version.submit', p_scope, { version: vid, number: num, classes });
    return vid;
  },

  studio_record_test(db, w, { p_scope, p_version, p_kind, p_ok, p_summary, p_report, p_hash, p_env }) {
    if (!['game_tester', 'world_editor', 'story_editor', 'quran_reviewer', 'audio_editor'].some((r) => w.has(r))) throw deny('testers and editors only');
    if (!scopeOk(p_scope)) throw new E(`unknown scope ${p_scope}`);
    let v = null;
    if (p_version != null) {
      v = getVersion(db, int(p_version));
      if (!v || v.scope !== p_scope) throw new E(`no such version for ${p_scope}`);
    }
    const tid = Number(
      db
        .prepare('insert into test_runs (scope, version_id, doc_hash, kind, ok, summary, report, source, environment, ran_by, ran_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(p_scope, v?.id ?? null, p_hash ?? null, str(p_kind), p_ok ? 1 : 0, str(p_summary), J(p_report ?? {}), 'studio', J(p_env ?? {}), w.uid, now()).lastInsertRowid,
    );
    if (v && p_hash === v.hash && p_kind === 'content') db.prepare('update content_versions set validation = ?, validation_ok = ?, validated_at = ? where id = ?').run(J(p_report ?? {}), p_ok ? 1 : 0, now(), v.id);
    audit(db, w, 'test.record', p_scope, { test: tid, kind: p_kind, ok: !!p_ok, version: p_version ?? null });
    return tid;
  },

  // Quran-linked changes need a Quran Content Reviewer (the role itself; Super
  // Admin alone is not enough). Nobody approves their own work, except a Super
  // Admin on a change that is not Quran-linked.
  studio_review(db, w, { p_version, p_decision, p_note }) {
    const v = getVersion(db, int(p_version));
    if (!v) throw new E('no such version');
    if (!['submitted', 'changes_requested', 'approved'].includes(v.state)) throw new E(`this version is ${v.state}, not waiting for review`);
    if (!['approve', 'changes'].includes(p_decision)) throw new E('decision must be approve or changes');
    if (v.quran_linked) {
      if (!w.exact('quran_reviewer')) throw deny('Quran-linked changes need a Quran Content Reviewer');
    } else if (!(w.has('quran_reviewer') || w.has('super_admin'))) throw deny('reviewers only');
    if (v.created_by === w.uid && (v.quran_linked || !w.exact('super_admin'))) throw deny('you cannot approve your own change');
    db.prepare('update content_versions set state = ?, reviewed_by = ?, reviewer_roles = ?, reviewed_at = ?, review_note = ? where id = ?').run(
      p_decision === 'approve' ? 'approved' : 'changes_requested', w.uid, J(w.roles), now(), str(p_note), v.id);
    audit(db, w, `version.${p_decision}`, v.scope, { version: v.id, number: v.number, note: p_note ?? null });
    return null;
  },

  studio_publish(db, w, { p_version, p_effective_at, p_note }) {
    if (!w.has('super_admin')) throw deny('only a Super Admin publishes');
    const v = getVersion(db, int(p_version));
    if (!v) throw new E('no such version');
    if (v.state !== 'approved') throw new E(`version ${v.number} is ${v.state}, it must be approved first`);
    if (v.validation_ok !== 1) throw new E(`version ${v.number} has not passed validation`);
    const at = later(iso(p_effective_at) ?? now(), now());
    const pid = Number(db.prepare("insert into publications (scope, version_id, action, by, at, effective_at, note) values (?, ?, 'publish', ?, ?, ?, ?)").run(v.scope, v.id, w.uid, now(), at, str(p_note)).lastInsertRowid);
    db.prepare("update content_versions set state = 'published' where id = ?").run(v.id);
    // The draft carries on from what was just published.
    db.prepare('update content_drafts set base_version = ? where scope = ?').run(v.id, v.scope);
    audit(db, w, 'version.publish', v.scope, { version: v.id, number: v.number, publication: pid, effective_at: at });
    return pid;
  },

  // Only the published pointer moves: player saves, drafts and other versions are untouched.
  studio_rollback(db, w, { p_scope, p_version, p_note }) {
    if (!w.has('super_admin')) throw deny('only a Super Admin rolls back');
    if (!scopeOk(p_scope)) throw new E(`unknown scope ${p_scope}`);
    const vid = p_version == null ? null : int(p_version);
    if (vid != null && !db.prepare("select 1 from publications where scope = ? and version_id = ? and action in ('publish', 'rollback')").get(p_scope, vid)) throw new E('you can only roll back to a version that was published before');
    const t = now();
    const pid = Number(db.prepare('insert into publications (scope, version_id, action, by, at, effective_at, note) values (?, ?, ?, ?, ?, ?, ?)').run(p_scope, vid, vid == null ? 'unpublish' : 'rollback', w.uid, t, t, str(p_note)).lastInsertRowid);
    audit(db, w, vid == null ? 'version.unpublish' : 'version.rollback', p_scope, { version: vid, publication: pid });
    return pid;
  },

  /* staff (Super Admin) */
  studio_staff(db, w) {
    if (!w.has('super_admin')) return [];
    const list = db
      .prepare(
        `select u.id user_id, u.email, json_group_array(r.role) roles,
           exists (select 1 from mfa_factors f where f.user_id = u.id and f.status = 'verified') mfa
         from (select * from staff_roles order by role) r join users u on u.id = r.user_id group by u.id, u.email order by u.email`,
      )
      .all();
    return list.map((x) => ({ ...x, roles: JSON.parse(x.roles), mfa: !!x.mfa }));
  },

  // Giving a role to an email with no account creates the account with a
  // one-time password, shown once to the Super Admin to pass on.
  studio_set_role(db, w, { p_email, p_role, p_on }, deps) {
    if (!w.has('super_admin')) throw deny('only a Super Admin manages staff');
    if (!ROLES.includes(p_role)) throw new E(`unknown role ${p_role}`);
    const email = str(p_email).trim().toLowerCase();
    let uid = db.prepare('select id from users where email = ?').get(email)?.id;
    let created = null;
    if (!uid) {
      if (!p_on) throw new E('no account with that email');
      created = deps.tempPassword();
      uid = deps.createUser(db, email, created, { mustChange: true });
      audit(db, w, 'staff.account_create', null, { user: uid });
    }
    if (p_on) db.prepare('insert or ignore into staff_roles (user_id, role, granted_by, granted_at) values (?, ?, ?, ?)').run(uid, p_role, w.uid, now());
    else {
      if (p_role === 'super_admin' && db.prepare("select count(*) c from staff_roles where role = 'super_admin'").get().c <= 1) throw new E('the last Super Admin cannot be removed');
      db.prepare('delete from staff_roles where user_id = ? and role = ?').run(uid, p_role);
    }
    audit(db, w, p_on ? 'staff.grant' : 'staff.revoke', null, { user: uid, role: p_role });
    return created ? { created: true, password: created } : { created: false };
  },

  /* bugs */
  studio_file_bug(db, w, { p }) {
    if (!w.staff) throw deny('staff only');
    p = isObj(p) ? p : {};
    const t = now();
    const bid = Number(
      db
        .prepare(
          `insert into bug_reports (surah, scene, object, title, description, severity, category, steps, device, diagnostics, needs_code, source, reported_by, discovered_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(int(p.surah), str(p.scene), str(p.object), str(p.title), str(p.description), str(p.severity, 'medium'), str(p.category, 'other'), str(p.steps), J(p.device ?? {}), J(p.diagnostics ?? {}), p.needs_code ? 1 : 0, p.source === 'automated' ? 'automated' : 'staff', w.uid, t, t)
        .lastInsertRowid,
    );
    audit(db, w, 'bug.file', p.surah != null ? `surah:${p.surah}` : null, { bug: bid });
    return bid;
  },

  studio_update_bug(db, w, { p_id, p }) {
    if (!w.staff) throw deny('staff only');
    p = isObj(p) ? p : {};
    const b = db.prepare('select * from bug_reports where id = ?').get(int(p_id));
    if (!b) throw new E('no such bug');
    const status = p.status ?? b.status;
    const diag = JSON.parse(b.diagnostics);
    if ('status' in p && p.status !== b.status) diag.history = [...(diag.history ?? []), { at: now(), by: w.uid, from: b.status, to: p.status }];
    db.prepare(
      `update bug_reports set status = ?, severity = ?, category = ?, needs_code = ?, resolution = ?, assigned_to = ?, resolved_at = ?, diagnostics = ?, updated_at = ? where id = ?`,
    ).run(
      status, p.severity ?? b.severity, p.category ?? b.category, p.needs_code == null ? b.needs_code : p.needs_code ? 1 : 0, p.resolution ?? b.resolution,
      'assigned_to' in p ? p.assigned_to ?? null : b.assigned_to,
      ['fixed', 'wont_fix', 'duplicate'].includes(status) ? (b.resolved_at ?? now()) : null,
      J(diag), now(), b.id,
    );
    audit(db, w, 'bug.update', b.surah != null ? `surah:${b.surah}` : null, { bug: b.id, change: p });
    return null;
  },

  studio_bug_from_problems(db, w, { p_ids, p_bug, p_title }) {
    if (!w.staff) throw deny('staff only');
    const ids = (Array.isArray(p_ids) ? p_ids : []).map(int);
    if (!ids.length) throw new E('choose at least one report');
    const marks = ids.map(() => '?').join(',');
    let bid = p_bug == null ? null : int(p_bug);
    let s = null;
    if (bid == null) {
      const g = db.prepare(`select min(surah) s, min(category) c from player_problems where id in (${marks})`).get(...ids);
      s = g.s;
      const cat = { stuck: 'movement', cannot_finish: 'activity', sound: 'audio', looks_wrong: 'visual' }[g.c] ?? 'other';
      const t = now();
      bid = Number(
        db
          .prepare(
            `insert into bug_reports (surah, title, description, category, severity, source, reported_by, diagnostics, discovered_at, updated_at) values (?, ?, ?, ?, ?, 'player', ?, ?, ?, ?)`,
          )
          .run(s, str(p_title).trim() || 'Player reports', `Made from ${ids.length} player report(s). Player reports carry only a world, a category and a screen size.`, cat, ids.length >= 5 ? 'high' : 'medium', w.uid, J({ player_reports: ids }), t, t)
          .lastInsertRowid,
      );
    } else if (!db.prepare('select 1 from bug_reports where id = ?').get(bid)) throw new E('no such bug');
    db.prepare(`update player_problems set bug_id = ? where id in (${marks})`).run(bid, ...ids);
    audit(db, w, 'bug.link_reports', s != null ? `surah:${s}` : null, { bug: bid, reports: ids });
    return bid;
  },

  /* audio */
  studio_audio_register(db, w, { p }) {
    if (!w.has('audio_editor')) throw deny('audio editors only');
    p = isObj(p) ? p : {};
    const obj = db.prepare("select * from storage_objects where bucket = 'studio-audio' and path = ?").get(str(p.path));
    if (!obj) throw new E('upload the file first');
    if (obj.owner !== w.uid) throw deny('that file was uploaded by someone else');
    if (ARABIC.test(JSON.stringify(p))) throw new E('Arabic script is not allowed in audio records; the Quran text comes from the locked dataset');
    const s = int(p.surah);
    const a1 = int(p.ayah_from);
    const a2 = p.ayah_to == null ? a1 : int(p.ayah_to);
    if (p.kind === 'recitation') {
      const q = s == null ? null : db.prepare('select ayahs from quran_surahs where n = ?').get(s);
      if (!q || a1 == null || a1 < 1 || a2 > q.ayahs || a2 < a1) throw new E(`not a real ayah range: ${s}:${a1}-${a2}`);
    }
    const lang = str(p.language, 'en');
    if (!/^[a-z]{2}$/.test(lang)) throw new E('language must be a two-letter code');
    if (!/^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/.test(obj.path)) throw new E('bad file path');
    const id = crypto.randomUUID();
    db.prepare(
      `insert into audio_assets (id, kind, title, language, path, mime, bytes, duration_s, voice, origin, licence, licence_confirmed, source, surah, ayah_from, ayah_to, line_text, uploaded_by, uploaded_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id, str(p.kind), str(p.title), lang, obj.path, obj.mime, obj.size, p.duration_s == null ? null : Number(p.duration_s), str(p.voice), str(p.origin), str(p.licence),
      p.licence_confirmed ? 1 : 0, str(p.source), p.kind === 'recitation' || p.kind === 'narration' ? s : null, p.kind === 'recitation' ? a1 : null, p.kind === 'recitation' ? a2 : null,
      p.kind === 'narration' ? (p.line_text ?? null) : null, w.uid, now(),
    );
    audit(db, w, 'audio.register', null, { asset: id, kind: p.kind ?? null, origin: p.origin ?? null });
    return id;
  },

  studio_audio_review(db, w, { p_id, p_decision, p_note }) {
    const x = db.prepare('select * from audio_assets where id = ?').get(str(p_id));
    if (!x) throw new E('no such audio file');
    if (!['approve', 'reject', 'retire'].includes(p_decision)) throw new E('decision must be approve, reject or retire');
    if (p_decision === 'retire') {
      if (!w.has('audio_editor')) throw deny('audio editors only');
    } else if (x.kind === 'recitation') {
      if (!w.exact('quran_reviewer')) throw deny('recitation is approved by a Quran Content Reviewer');
      if (p_decision === 'approve' && !x.licence_confirmed) throw new E('the licence must be confirmed before a recitation is approved');
    } else {
      if (!w.has('audio_editor')) throw deny('audio editors only');
      if (p_decision === 'approve' && !x.licence_confirmed) throw new E('the licence must be confirmed first');
    }
    if (p_decision !== 'retire' && x.uploaded_by === w.uid && !w.exact('super_admin')) throw deny('you cannot review your own upload');
    db.prepare('update audio_assets set status = ?, reviewed_by = ?, reviewer_roles = ?, reviewed_at = ?, review_note = ? where id = ?').run(
      { approve: 'approved', reject: 'rejected', retire: 'retired' }[p_decision], w.uid, J(w.roles), now(), str(p_note), x.id);
    audit(db, w, `audio.${p_decision}`, null, { asset: x.id, kind: x.kind, note: p_note ?? null });
    return null;
  },

  /* moderation: only what a moderator needs to decide */
  studio_mod_queue(db, w) {
    if (!w.has('moderator')) throw deny('moderators only');
    return rows(
      db
        .prepare(
          `select r.id, r.reason, r.created_at, r.status, r.action, r.note, r.handled_at,
             r.room, rm.world room_world, rm.closed room_closed,
             r.about, x.nickname about_nickname, (select count(*) from reports r2 where r2.about = r.about) about_reports, x.online_paused_until about_paused_until
           from reports r left join rooms rm on rm.id = r.room left join explorers x on x.id = r.about
           order by (r.status = 'open') desc, r.created_at desc, r.id desc limit 500`,
        )
        .all(),
    );
  },

  studio_mod_act(db, w, { p_report, p_action, p_days, p_note }) {
    if (!w.has('moderator')) throw deny('moderators only');
    const r = db.prepare('select * from reports where id = ?').get(int(p_report));
    if (!r) throw new E('no such report');
    const days = p_days == null ? null : int(p_days);
    if (p_action === 'pause_online') {
      if (!r.about) throw new E('this report is not about an explorer');
      if (days == null || days < 1 || days > 30) throw new E('pause online play for 1 to 30 days');
      const x = db.prepare('select online_paused_until u from explorers where id = ?').get(r.about);
      const from = later(x?.u ?? now(), now());
      db.prepare('update explorers set online_paused_until = ? where id = ?').run(new Date(Date.parse(from) + days * 864e5).toISOString(), r.about);
      // Leave any open room straight away.
      db.prepare('delete from room_members where explorer = ? and room in (select id from rooms where not closed)').run(r.about);
    } else if (p_action === 'reset_nickname') {
      if (!r.about) throw new E('this report is not about an explorer');
      db.prepare('update explorers set nickname = ? where id = ?').run(`Explorer ${String(crypto.randomInt(10000)).padStart(4, '0')}`, r.about);
    } else if (p_action === 'close_room') {
      if (!r.room) throw new E('this report is not about a room');
      db.prepare('update rooms set closed = 1 where id = ?').run(r.room);
    } else if (p_action !== 'dismiss') throw new E('unknown action');
    db.prepare('update reports set status = ?, action = ?, note = ?, handled_by = ?, handled_at = ? where id = ?').run(
      p_action === 'dismiss' ? 'dismissed' : 'actioned', p_action, str(p_note).slice(0, 1000), w.uid, now(), r.id);
    // The audit names the report and the action, not the child.
    audit(db, w, `moderation.${p_action}`, null, { report: r.id, days });
    return null;
  },

  studio_mod_unpause(db, w, { p_report }) {
    if (!w.has('moderator')) throw deny('moderators only');
    const a = db.prepare('select about from reports where id = ?').get(int(p_report))?.about;
    if (!a) throw new E('no such report');
    db.prepare('update explorers set online_paused_until = null where id = ?').run(a);
    audit(db, w, 'moderation.unpause', null, { report: int(p_report) });
    return null;
  },

  /* releases */
  studio_release_create(db, w, { p_title, p_notes, p_versions }) {
    if (!w.has('super_admin')) throw deny('only a Super Admin plans releases');
    const ids = (Array.isArray(p_versions) ? p_versions : []).map(int);
    if (!ids.length) throw new E('choose at least one approved version');
    const bad = [];
    const scopes = new Set();
    for (const x of ids) {
      const v = getVersion(db, x);
      if (!v) bad.push(`version ${x} does not exist`);
      else {
        scopes.add(v.scope);
        if (v.state !== 'approved' || v.validation_ok !== 1) bad.push(`${v.scope} v${v.number} is ${v.state}`);
      }
    }
    if (bad.length) throw new E(`only approved, validated versions can be released: ${bad.join('; ')}`);
    if (scopes.size !== ids.length) throw new E('a release holds one version per world or setting');
    const rid = Number(db.prepare('insert into releases (title, notes, versions, created_by, created_at) values (?, ?, ?, ?, ?)').run(str(p_title).trim(), str(p_notes), J(ids), w.uid, now()).lastInsertRowid);
    audit(db, w, 'release.create', null, { release: rid, versions: ids });
    return rid;
  },

  // Publish every version of a release at once (all or nothing).
  studio_release_publish(db, w, { p_id, p_at }) {
    if (!w.has('super_admin')) throw deny('only a Super Admin publishes');
    const rel = db.prepare('select * from releases where id = ?').get(int(p_id));
    if (!rel) throw new E('no such release');
    if (rel.state !== 'planned') throw new E(`this release is already ${rel.state}`);
    const at = later(iso(p_at) ?? now(), now());
    const prev = {};
    for (const id of JSON.parse(rel.versions)) {
      const v = getVersion(db, id);
      // What was live in this scope just before (null: the built-in content).
      prev[v.scope] = db.prepare('select version_id from publications where scope = ? and effective_at <= ? order by effective_at desc, id desc limit 1').get(v.scope, at)?.version_id ?? null;
      ACTIONS.studio_publish(db, w, { p_version: v.id, p_effective_at: at, p_note: `Release: ${rel.title}` });
    }
    db.prepare("update releases set state = 'published', effective_at = ?, previous = ?, published_by = ?, published_at = ? where id = ?").run(at, J(prev), w.uid, now(), rel.id);
    audit(db, w, 'release.publish', null, { release: rel.id, effective_at: at });
    return null;
  },

  // Undo a release: every scope goes back to what was live before it.
  studio_release_undo(db, w, { p_id }) {
    if (!w.has('super_admin')) throw deny('only a Super Admin rolls back');
    const rel = db.prepare('select * from releases where id = ?').get(int(p_id));
    if (!rel) throw new E('no such release');
    if (rel.state !== 'published') throw new E('only a published release can be undone');
    for (const [scope, vid] of Object.entries(JSON.parse(rel.previous))) {
      ACTIONS.studio_rollback(db, w, { p_scope: scope, p_version: typeof vid === 'number' ? vid : null, p_note: `Undo release: ${rel.title}` });
    }
    db.prepare("update releases set state = 'undone', undone_at = ? where id = ?").run(now(), rel.id);
    audit(db, w, 'release.undo', null, { release: rel.id });
    return null;
  },

  studio_release_cancel(db, w, { p_id }) {
    if (!w.has('super_admin')) throw deny('only a Super Admin plans releases');
    const r = db.prepare("update releases set state = 'cancelled' where id = ? and state = 'planned'").run(int(p_id));
    if (!r.changes) throw new E('only a planned release can be cancelled');
    audit(db, w, 'release.cancel', null, { release: int(p_id) });
    return null;
  },
};

/** Run an action by name for a caller, in one transaction. */
export function act(db, caller, name, args, deps) {
  const fn = Object.prototype.hasOwnProperty.call(ACTIONS, name) ? ACTIONS[name] : null;
  if (!fn) throw new E(`unknown action ${name}`, 'PGRST202', 404);
  const w = who(db, caller);
  if (!w.uid && name !== 'studio_whoami') throw deny('sign in first');
  return tx(db, () => fn(db, w, isObj(args) ? args : {}, deps));
}

/* --------------------------------------------------- what the player game reads */

// Child-safe problem reports: a world, one of six fixed choices, a screen size.
export function reportProblem(db, { p_surah, p_category, p_screen }) {
  return tx(db, () => {
    // A simple brake on floods: at most 30 reports a minute overall.
    if (db.prepare('select count(*) c from player_problems where created_at > ?').get(new Date(Date.now() - 60e3).toISOString()).c >= 30) return null;
    const s = p_surah == null ? null : int(p_surah);
    if (s != null && (s < 1 || s > 114)) throw new E('not a surah');
    if (p_screen != null && !/^[0-9]{2,5}x[0-9]{2,5}$/.test(String(p_screen))) throw new E('not a screen size');
    db.prepare('insert into player_problems (surah, category, screen, created_at) values (?, ?, ?, ?)').run(s, str(p_category), p_screen ?? null, now());
    return null;
  });
}

export function liveAudio(db, ids, kind) {
  const list = ids.filter((x) => /^[0-9a-f-]{36}$/.test(x)).slice(0, 500);
  if (!list.length) return [];
  const q = `select id, kind, path, language from audio_assets where status = 'approved' and id in (${list.map(() => '?').join(',')})${kind ? ' and kind = ?' : ''}`;
  return db.prepare(q).all(...list, ...(kind ? [kind] : []));
}

/* --------------------------------------------------- staff reads (like the old row policies) */

const READS = {
  quran_surahs: { who: 'anyone', order: 'n asc' },
  content_drafts: { who: 'staff', order: 'updated_at desc' },
  content_versions: { who: 'staff', order: 'id desc' },
  publications: { who: 'staff', order: 'id desc' },
  test_runs: { who: 'staff', order: 'id desc' },
  bug_reports: { who: 'staff', order: 'id desc' },
  player_problems: { who: 'staff', order: 'id desc' },
  audio_assets: { who: 'staff', order: 'uploaded_at desc' },
  releases: { who: 'staff', order: 'id desc' },
  audit_log: { who: 'super_admin', order: 'id desc' },
};

export function read(db, caller, table, q) {
  const spec = Object.prototype.hasOwnProperty.call(READS, table) ? READS[table] : null;
  if (!spec) throw new E(`unknown table ${table}`, 'PGRST205', 404);
  const w = who(db, caller);
  if (spec.who === 'staff' && !w.staff) return [];
  if (spec.who === 'super_admin' && !w.has('super_admin')) return [];
  const where = [];
  const args = [];
  for (const k of ['scope', 'id']) {
    if (q.get(k) != null) {
      where.push(`${k} = ?`);
      args.push(k === 'id' ? int(q.get(k)) : q.get(k));
    }
  }
  const limit = Math.min(Math.max(int(q.get('limit')) ?? 500, 1), 1000);
  return rows(db.prepare(`select * from ${table}${where.length ? ` where ${where.join(' and ')}` : ''} order by ${spec.order} limit ${limit}`).all(...args));
}
