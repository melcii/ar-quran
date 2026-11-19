// The studio's database: one SQLite file (node:sqlite, built into Node 22+).
// Same tables and rules as the old Supabase migrations 0001-0005, written for
// SQLite. JSON values are stored as text and decoded by the readers in
// studio.mjs; times are ISO-8601 UTC strings, which sort correctly as text.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA = `
pragma journal_mode = wal;
pragma foreign_keys = on;
pragma busy_timeout = 5000;

-- Accounts (replaces Supabase Auth). Passwords are scrypt hashes; sessions are
-- random tokens stored as SHA-256 hashes; aal2 = signed in with an authenticator code.
create table if not exists users (
  id text primary key,
  email text not null unique collate nocase,
  pw text not null,
  must_change_password integer not null default 0,
  created_at text not null
);
create table if not exists sessions (
  token_hash text primary key,
  user_id text not null references users (id) on delete cascade,
  aal text not null default 'aal1' check (aal in ('aal1', 'aal2')),
  created_at text not null,
  expires_at text not null
);
create index if not exists sessions_user on sessions (user_id);
create table if not exists mfa_factors (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  secret text not null,
  status text not null default 'unverified' check (status in ('unverified', 'verified')),
  last_step integer not null default 0,
  created_at text not null
);

-- Files (replaces Supabase Storage): who uploaded which file in which bucket.
create table if not exists storage_objects (
  bucket text not null,
  path text not null,
  owner text references users (id) on delete set null,
  size integer not null,
  mime text not null,
  created_at text not null,
  primary key (bucket, path)
);

-- -------------------------------------------------------------- families (0001)
create table if not exists guardians (
  id text primary key references users (id) on delete cascade,
  created_at text not null,
  consent_at text,
  multiplayer integer not null default 0,
  phrases_only integer not null default 1
);
create table if not exists explorers (
  id text primary key,
  guardian text not null references guardians (id) on delete cascade,
  nickname text not null check (length(nickname) between 1 and 16),
  look text not null default '{}' check (length(look) < 4000),
  friend_code text not null unique,
  created_at text not null,
  online_paused_until text
);
create index if not exists explorers_guardian on explorers (guardian);
create table if not exists saves (
  explorer text not null references explorers (id) on delete cascade,
  key text not null,
  value text not null check (length(value) < 200000),
  updated_at text not null,
  primary key (explorer, key)
);
create table if not exists friendships (
  a text not null references explorers (id) on delete cascade,
  b text not null references explorers (id) on delete cascade,
  a_ok integer not null default 0,
  b_ok integer not null default 0,
  created_at text not null,
  primary key (a, b),
  check (a < b)
);
create table if not exists blocks (
  explorer text not null references explorers (id) on delete cascade,
  blocked text not null references explorers (id) on delete cascade,
  created_at text not null,
  primary key (explorer, blocked)
);
create table if not exists reports (
  id integer primary key autoincrement,
  by_explorer text references explorers (id) on delete set null,
  about text references explorers (id) on delete set null,
  reason text not null check (reason in ('unkind', 'unsafe', 'other')),
  room text,
  created_at text not null,
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  action text check (action in ('pause_online', 'reset_nickname', 'close_room', 'dismiss')),
  note text not null default '' check (length(note) <= 1000),
  handled_by text references users (id) on delete set null,
  handled_at text
);
create table if not exists rooms (
  id text primary key,
  host text not null references explorers (id) on delete cascade,
  world text not null,
  created_at text not null,
  closed integer not null default 0
);
create table if not exists room_members (
  room text not null references rooms (id) on delete cascade,
  explorer text not null references explorers (id) on delete cascade,
  invited_at text not null,
  joined_at text,
  primary key (room, explorer)
);

-- ---------------------------------------------------------- studio (0002-0005)
create table if not exists staff_roles (
  user_id text not null references users (id) on delete cascade,
  role text not null check (role in ('super_admin', 'world_editor', 'story_editor', 'quran_reviewer', 'audio_editor', 'game_tester', 'moderator')),
  granted_by text references users (id) on delete set null,
  granted_at text not null,
  primary key (user_id, role)
);
create table if not exists quran_surahs (
  n integer primary key check (n between 1 and 114),
  name text not null,
  ayahs integer not null check (ayahs > 0)
);

create table if not exists audit_log (
  id integer primary key autoincrement,
  at text not null,
  actor text,
  actor_roles text not null default '[]',
  action text not null,
  scope text,
  detail text not null default '{}'
);
create index if not exists audit_at on audit_log (at);
-- Append only: nobody, not even the server's own code, can change or delete a row.
create trigger if not exists audit_log_no_update before update on audit_log
  begin select raise(abort, 'the audit log cannot be changed'); end;
create trigger if not exists audit_log_no_delete before delete on audit_log
  begin select raise(abort, 'the audit log cannot be changed'); end;

create table if not exists content_drafts (
  scope text primary key,
  doc text not null default '{"v":1}' check (length(doc) < 600000),
  base_version integer,
  revision integer not null default 0,
  updated_by text references users (id) on delete set null,
  updated_at text not null
);
create table if not exists content_versions (
  id integer primary key autoincrement,
  scope text not null,
  number integer not null,
  doc text not null check (length(doc) < 600000),
  hash text not null,
  note text not null default '' check (length(note) <= 2000),
  quran_linked integer not null,
  changed text not null default '[]',
  state text not null default 'submitted' check (state in ('submitted', 'approved', 'changes_requested', 'published', 'withdrawn')),
  created_by text references users (id) on delete set null,
  created_at text not null,
  validation text,
  validation_ok integer,
  validated_at text,
  reviewed_by text references users (id) on delete set null,
  reviewer_roles text,
  reviewed_at text,
  review_note text,
  unique (scope, number)
);
create table if not exists publications (
  id integer primary key autoincrement,
  scope text not null,
  version_id integer references content_versions (id),
  action text not null check (action in ('publish', 'rollback', 'unpublish')),
  by text references users (id) on delete set null,
  at text not null,
  effective_at text not null,
  note text not null default ''
);
create index if not exists publications_live on publications (scope, effective_at, id);
create table if not exists test_runs (
  id integer primary key autoincrement,
  scope text not null,
  version_id integer references content_versions (id) on delete set null,
  doc_hash text,
  kind text not null check (kind in ('content', 'collision', 'movement', 'interaction', 'playthrough', 'assets', 'audio')),
  ok integer not null,
  summary text not null default '' check (length(summary) <= 2000),
  report text not null default '{}' check (length(report) < 400000),
  source text not null default 'studio' check (source in ('studio', 'headless', 'imported')),
  environment text not null default '{}',
  ran_by text references users (id) on delete set null,
  ran_at text not null
);
create index if not exists test_runs_scope on test_runs (scope, ran_at);
create table if not exists bug_reports (
  id integer primary key autoincrement,
  surah integer references quran_surahs (n),
  scene text not null default '' check (length(scene) <= 200),
  object text not null default '' check (length(object) <= 200),
  title text not null check (length(title) between 3 and 200),
  description text not null default '' check (length(description) <= 8000),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  category text not null default 'other' check (category in ('movement', 'collision', 'activity', 'story', 'quran_content', 'audio', 'save', 'visual', 'multiplayer', 'performance', 'other')),
  steps text not null default '' check (length(steps) <= 8000),
  device text not null default '{}' check (length(device) < 8000),
  diagnostics text not null default '{}' check (length(diagnostics) < 200000),
  status text not null default 'new' check (status in ('new', 'confirmed', 'in_progress', 'needs_developer', 'fixed', 'wont_fix', 'duplicate')),
  needs_code integer not null default 0,
  assigned_to text references users (id) on delete set null,
  resolution text not null default '' check (length(resolution) <= 8000),
  source text not null default 'staff' check (source in ('staff', 'player', 'automated')),
  reported_by text references users (id) on delete set null,
  discovered_at text not null,
  resolved_at text,
  updated_at text not null
);
create table if not exists player_problems (
  id integer primary key autoincrement,
  surah integer references quran_surahs (n),
  category text not null check (category in ('stuck', 'cannot_finish', 'sound', 'looks_wrong', 'too_hard', 'other')),
  screen text,
  created_at text not null,
  bug_id integer references bug_reports (id) on delete set null
);
create table if not exists audio_assets (
  id text primary key,
  kind text not null check (kind in ('narration', 'recitation', 'effect')),
  title text not null check (length(title) between 1 and 200),
  language text not null default 'en',
  path text not null unique,
  mime text not null check (mime in ('audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/aac')),
  bytes integer not null check (bytes > 0 and bytes <= 10485760),
  duration_s real check (duration_s is null or (duration_s > 0 and duration_s < 1800)),
  voice text not null default '' check (length(voice) <= 120),
  origin text not null check (origin in ('human_recording', 'licensed_tts', 'sound_library')),
  licence text not null check (length(licence) between 3 and 2000),
  licence_confirmed integer not null default 0,
  source text not null default '' check (length(source) <= 500),
  surah integer references quran_surahs (n),
  ayah_from integer,
  ayah_to integer,
  line_text text check (line_text is null or length(line_text) <= 2000),
  status text not null default 'uploaded' check (status in ('uploaded', 'approved', 'rejected', 'retired')),
  uploaded_by text references users (id) on delete set null,
  uploaded_at text not null,
  reviewed_by text references users (id) on delete set null,
  reviewer_roles text,
  reviewed_at text,
  review_note text,
  -- Recitation: a named person's own recording of a real passage, never synthetic.
  check (kind <> 'recitation' or (origin = 'human_recording' and length(voice) > 1 and surah is not null and ayah_from >= 1 and ayah_to >= ayah_from)),
  check (kind <> 'effect' or origin in ('sound_library', 'human_recording')),
  check (kind <> 'narration' or length(coalesce(line_text, '')) > 0)
);
create table if not exists releases (
  id integer primary key autoincrement,
  title text not null check (length(title) between 3 and 120),
  notes text not null default '' check (length(notes) <= 4000),
  versions text not null,
  state text not null default 'planned' check (state in ('planned', 'published', 'undone', 'cancelled')),
  effective_at text,
  previous text not null default '{}',
  created_by text references users (id) on delete set null,
  created_at text not null,
  published_by text references users (id) on delete set null,
  published_at text,
  undone_at text
);
`;

export function openDb(file) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  if (!db.prepare('select count(*) c from quran_surahs').get().c) {
    const list = JSON.parse(readFileSync(new URL('./surahs.json', import.meta.url), 'utf8'));
    const ins = db.prepare('insert into quran_surahs (n, name, ayahs) values (?, ?, ?)');
    for (const [n, name, ayahs] of list) ins.run(n, name, ayahs);
  }
  return db;
}

/** Run fn inside one write transaction (all or nothing). */
export function tx(db, fn) {
  db.exec('begin immediate');
  try {
    const out = fn();
    db.exec('commit');
    return out;
  } catch (e) {
    db.exec('rollback');
    throw e;
  }
}
