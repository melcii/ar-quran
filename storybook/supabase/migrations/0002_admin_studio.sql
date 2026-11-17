-- Quran Adventure Admin Studio: staff roles, audit log, versioned content
-- (draft -> submitted -> approved -> published), rollback, test results and
-- bug reports.
--
-- Design:
-- * Staff are ordinary Supabase Auth users with rows in staff_roles. Nobody
--   gets a role by signing up: the first Super Admin is granted from the SQL
--   editor (see studio_bootstrap_super_admin below), later ones by a Super Admin.
-- * Every staff permission also needs a multi-factor session (aal2 in the
--   JWT). Without it a staff member can see their own role names, nothing else.
-- * Tables are read through row-level policies; every write goes through a
--   checked function (security definer) that tests the caller's roles on the
--   server and writes an audit row. There are no insert/update/delete
--   policies, so direct table writes are refused.
-- * Game content stays in the app's source code. What the studio stores is an
--   overlay document per scope ('surah:19', 'catalog:avatar', ...) that the
--   game applies on top. Players read only the published overlay, through the
--   live_content view.
-- * Player progress lives in public.saves (0001) and is never touched here:
--   publishing and rollback only move the published pointer.
-- * The Arabic Quran text is not stored here at all. Overlays may hold ayah
--   references, never Arabic script (checked on the server).

create type public.staff_role as enum (
  'super_admin', 'world_editor', 'story_editor', 'quran_reviewer', 'audio_editor', 'game_tester', 'moderator'
);

create table public.staff_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.staff_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Surah names and ayah counts, so the server can check ayah references.
create table public.quran_surahs (
  n int primary key check (n between 1 and 114),
  name text not null,
  ayahs int not null check (ayahs > 0)
);

-- --------------------------------------------------------------------------
-- Who is asking
-- --------------------------------------------------------------------------

create function public.studio_mfa_ok() returns boolean
language sql stable as $$ select coalesce(auth.jwt() ->> 'aal', '') = 'aal2' $$;

-- The caller holds this role exactly (Super Admin does not count).
create function public.studio_has_exact_role(r public.staff_role) returns boolean
language sql stable security definer set search_path = public as $$
  select public.studio_mfa_ok() and exists (select 1 from public.staff_roles where user_id = auth.uid() and role = r)
$$;

-- The caller holds this role, or is a Super Admin.
create function public.studio_has_role(r public.staff_role) returns boolean
language sql stable security definer set search_path = public as $$
  select public.studio_mfa_ok() and exists (
    select 1 from public.staff_roles where user_id = auth.uid() and (role = r or role = 'super_admin'))
$$;

create function public.studio_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.studio_mfa_ok() and exists (select 1 from public.staff_roles where user_id = auth.uid())
$$;

create function public.studio_my_roles() returns public.staff_role[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(role order by role), '{}') from public.staff_roles where user_id = auth.uid()
$$;

-- --------------------------------------------------------------------------
-- Audit log: append only
-- --------------------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  actor_roles public.staff_role[] not null default '{}',
  action text not null,
  scope text,
  detail jsonb not null default '{}'::jsonb
);
create index on public.audit_log (at desc);
create index on public.audit_log (scope, at desc);

create function public.studio_audit_frozen() returns trigger language plpgsql as $$
begin
  raise exception 'the audit log cannot be changed';
end $$;
create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function public.studio_audit_frozen();

create function public.studio_audit(action text, scope text, detail jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_log (actor, actor_roles, action, scope, detail)
  values (auth.uid(), public.studio_my_roles(), action, scope, coalesce(detail, '{}'::jsonb))
$$;

-- --------------------------------------------------------------------------
-- Content: drafts, versions, publications
-- --------------------------------------------------------------------------

create function public.studio_scope_ok(scope text) returns boolean
language sql immutable as $$
  select scope ~ '^(surah:([1-9]|[1-9][0-9]|10[0-9]|11[0-4])|catalog:(avatar|room)|config:(multiplayer|audio))$'
$$;

create table public.content_drafts (
  scope text primary key check (public.studio_scope_ok(scope)),
  doc jsonb not null default '{"v":1}'::jsonb check (octet_length(doc::text) < 600000),
  base_version bigint,
  revision int not null default 0,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.content_versions (
  id bigint generated always as identity primary key,
  scope text not null check (public.studio_scope_ok(scope)),
  number int not null,
  doc jsonb not null check (octet_length(doc::text) < 600000),
  hash text not null,
  note text not null default '' check (char_length(note) <= 2000),
  quran_linked boolean not null,
  changed text[] not null default '{}',
  state text not null default 'submitted' check (state in ('submitted', 'approved', 'changes_requested', 'published', 'withdrawn')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  validation jsonb,
  validation_ok boolean,
  validated_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewer_roles public.staff_role[],
  reviewed_at timestamptz,
  review_note text,
  unique (scope, number)
);

create table public.publications (
  id bigint generated always as identity primary key,
  scope text not null check (public.studio_scope_ok(scope)),
  version_id bigint references public.content_versions (id),
  action text not null check (action in ('publish', 'rollback', 'unpublish')),
  by uuid references auth.users (id) on delete set null,
  at timestamptz not null default now(),
  effective_at timestamptz not null default now(),
  note text not null default ''
);
create index on public.publications (scope, effective_at desc, id desc);

-- What players get: for each scope, the newest publication already in effect.
-- An unpublish row means "back to the content built into the app" (doc null).
create view public.live_content with (security_invoker = false) as
  select distinct on (p.scope) p.scope, v.doc, v.number, v.hash, p.effective_at, p.action
  from public.publications p left join public.content_versions v on v.id = p.version_id
  where p.effective_at <= now()
  order by p.scope, p.effective_at desc, p.id desc;

-- Results of automated checks (in-browser validation, headless runs, imports).
create table public.test_runs (
  id bigint generated always as identity primary key,
  scope text not null check (public.studio_scope_ok(scope)),
  version_id bigint references public.content_versions (id) on delete set null,
  doc_hash text,
  kind text not null check (kind in ('content', 'collision', 'movement', 'interaction', 'playthrough', 'assets', 'audio')),
  ok boolean not null,
  summary text not null default '' check (char_length(summary) <= 2000),
  report jsonb not null default '{}'::jsonb check (octet_length(report::text) < 400000),
  source text not null default 'studio' check (source in ('studio', 'headless', 'imported')),
  environment jsonb not null default '{}'::jsonb,
  ran_by uuid references auth.users (id) on delete set null,
  ran_at timestamptz not null default now()
);
create index on public.test_runs (scope, ran_at desc);

-- Bugs filed by staff (from the studio or from inside a world) and by checks.
create table public.bug_reports (
  id bigint generated always as identity primary key,
  surah int references public.quran_surahs (n),
  scene text not null default '' check (char_length(scene) <= 200),
  object text not null default '' check (char_length(object) <= 200),
  title text not null check (char_length(title) between 3 and 200),
  description text not null default '' check (char_length(description) <= 8000),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  category text not null default 'other' check (category in ('movement', 'collision', 'activity', 'story', 'quran_content', 'audio', 'save', 'visual', 'multiplayer', 'performance', 'other')),
  steps text not null default '' check (char_length(steps) <= 8000),
  device jsonb not null default '{}'::jsonb check (octet_length(device::text) < 8000),
  diagnostics jsonb not null default '{}'::jsonb check (octet_length(diagnostics::text) < 200000),
  status text not null default 'new' check (status in ('new', 'confirmed', 'in_progress', 'needs_developer', 'fixed', 'wont_fix', 'duplicate')),
  needs_code boolean not null default false,
  assigned_to uuid references auth.users (id) on delete set null,
  resolution text not null default '' check (char_length(resolution) <= 8000),
  source text not null default 'staff' check (source in ('staff', 'player', 'automated')),
  reported_by uuid references auth.users (id) on delete set null,
  discovered_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);
create index on public.bug_reports (status, severity);

-- Child-safe problem reports from players: a surah, a fixed category and the
-- screen size. No free text, no account, no explorer, no location.
create table public.player_problems (
  id bigint generated always as identity primary key,
  surah int references public.quran_surahs (n),
  category text not null check (category in ('stuck', 'cannot_finish', 'sound', 'looks_wrong', 'too_hard', 'other')),
  screen text check (screen ~ '^[0-9]{2,5}x[0-9]{2,5}$'),
  created_at timestamptz not null default now(),
  bug_id bigint references public.bug_reports (id) on delete set null
);

-- --------------------------------------------------------------------------
-- Row-level access: reading only. All writes go through the functions below.
-- --------------------------------------------------------------------------

alter table public.staff_roles enable row level security;
alter table public.quran_surahs enable row level security;
alter table public.audit_log enable row level security;
alter table public.content_drafts enable row level security;
alter table public.content_versions enable row level security;
alter table public.publications enable row level security;
alter table public.test_runs enable row level security;
alter table public.bug_reports enable row level security;
alter table public.player_problems enable row level security;

create policy "own roles, or all for super admin" on public.staff_roles for select to authenticated
  using (user_id = auth.uid() or public.studio_has_role('super_admin'));
create policy "surah list is public" on public.quran_surahs for select to anon, authenticated using (true);
create policy "super admins read the audit log" on public.audit_log for select to authenticated
  using (public.studio_has_role('super_admin'));
create policy "staff read drafts" on public.content_drafts for select to authenticated using (public.studio_is_staff());
create policy "staff read versions" on public.content_versions for select to authenticated using (public.studio_is_staff());
create policy "staff read publications" on public.publications for select to authenticated using (public.studio_is_staff());
create policy "staff read test runs" on public.test_runs for select to authenticated using (public.studio_is_staff());
create policy "staff read bugs" on public.bug_reports for select to authenticated using (public.studio_is_staff());
create policy "staff read player problems" on public.player_problems for select to authenticated using (public.studio_is_staff());

revoke insert, update, delete, truncate on public.staff_roles, public.quran_surahs, public.audit_log, public.content_drafts,
  public.content_versions, public.publications, public.test_runs, public.bug_reports, public.player_problems from anon, authenticated;
revoke all on public.live_content from anon, authenticated;
grant select on public.live_content to anon, authenticated;

-- --------------------------------------------------------------------------
-- Checks on an overlay document
-- --------------------------------------------------------------------------

-- Which kinds of change this is, for permissions:
--   text   story wording (story editors)
--   quran  ayah references and the readings tied to them (story editors; needs a Quran reviewer)
--   world  positions, sizes, colours, scenery, numbers (world editors)
--   tasks  activities added from templates, chapter order (story or world editors)
--   record the surah's content record (story editors)
--   audio  narration and recitation assignments (audio editors)
--   catalog / config  catalogs and settings
create function public.studio_key_class(k text, v jsonb) returns text
language sql immutable as $$
  select case
    when k ~ '(^|\.)(refs?|reading|after)(\.|$)' then 'quran'
    when jsonb_typeof(v) = 'string' and not (v #>> '{}') ~* '^#[0-9a-f]{6}$' then 'text'
    else 'world' end
$$;

create function public.studio_changes(scope text, a jsonb, b jsonb) returns text[]
language plpgsql immutable as $$
declare
  out text[] := '{}';
  k text;
  sec text;
begin
  a := coalesce(a, '{}'::jsonb);
  b := coalesce(b, '{}'::jsonb);
  if scope !~ '^surah:' then
    if a is distinct from b then out := array[split_part(scope, ':', 1)]; end if;
    return out;
  end if;
  for k in select key from jsonb_each(coalesce(a -> 'set', '{}')) union select key from jsonb_each(coalesce(b -> 'set', '{}')) loop
    if (a -> 'set' -> k) is distinct from (b -> 'set' -> k) then
      out := out || public.studio_key_class(k, coalesce(b -> 'set' -> k, a -> 'set' -> k));
    end if;
  end loop;
  foreach sec in array array['place', 'add', 'order', 'record', 'audio'] loop
    if (a -> sec) is distinct from (b -> sec) then
      out := out || case sec
        when 'place' then 'world'
        when 'add' then (case when (b -> 'add' -> 'tasks') is distinct from (a -> 'add' -> 'tasks') then 'tasks' else 'world' end)
        when 'order' then 'tasks'
        when 'record' then 'record'
        else 'audio' end;
      -- Added activities that carry ayah references are Quran-linked as well.
      if sec = 'add' and (b -> 'add' -> 'tasks') is distinct from (a -> 'add' -> 'tasks')
         and coalesce((b -> 'add' -> 'tasks')::text, '') ~ '"(refs?|reading)"' then
        out := out || 'quran';
      end if;
      if sec = 'record' and (b -> 'record' -> 'quran_references') is distinct from (a -> 'record' -> 'quran_references') then
        out := out || 'quran';
      end if;
    end if;
  end loop;
  return array(select distinct x from unnest(out) x order by x);
end $$;

-- May the caller make changes of these classes in this scope?
create function public.studio_may_change(scope text, classes text[]) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  c text;
  ok boolean;
begin
  if not public.studio_is_staff() then return false; end if;
  foreach c in array classes loop
    ok := case c
      when 'text' then public.studio_has_role('story_editor')
      when 'quran' then public.studio_has_role('story_editor')
      when 'record' then public.studio_has_role('story_editor')
      when 'world' then public.studio_has_role('world_editor')
      when 'tasks' then public.studio_has_role('story_editor') or public.studio_has_role('world_editor')
      when 'audio' then public.studio_has_role('audio_editor')
      when 'catalog' then public.studio_has_role('world_editor')
      when 'config' then case when scope = 'config:multiplayer' then public.studio_has_role('moderator') else public.studio_has_role('audio_editor') end
      else false end;
    if not ok then return false; end if;
  end loop;
  return true;
end $$;

-- Problems that stop a document from being submitted.
create function public.studio_doc_problems(scope text, doc jsonb) returns text[]
language plpgsql stable security definer set search_path = public as $$
declare
  out text[] := '{}';
  k text;
  v jsonb;
  r jsonb;
  s int;
  a int;
begin
  if jsonb_typeof(doc) <> 'object' then return array['the document is not an object']; end if;
  if coalesce((doc ->> 'v')::int, 0) <> 1 then out := out || 'unknown document version'::text; end if;
  -- No Arabic script anywhere: the Quran text comes only from the app's verified dataset.
  if doc::text ~ '[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]' then
    out := out || 'Arabic script is not allowed in edited content; the Quran text is locked'::text;
  end if;
  if scope ~ '^surah:' then
    for k, v in select key, value from jsonb_each(coalesce(doc -> 'set', '{}')) loop
      if k !~ '^[A-Za-z_][A-Za-z0-9_]*(\.([A-Za-z_][A-Za-z0-9_]*|[0-9]+|#[A-Za-z0-9_-]+))*$' and k !~ '^[A-Za-z_]+#[A-Za-z0-9_-]+(\.([A-Za-z_][A-Za-z0-9_]*|[0-9]+|#[A-Za-z0-9_-]+))*$' then
        out := out || ('not an editable field: ' || k);
      elsif k ~ '(^|\.)(surah|seed|id|kind|requires)$' or k ~ '^(ground\.base|mist)' then
        out := out || ('this field is locked: ' || k);
      end if;
    end loop;
    -- Every ayah reference must exist.
    for r in
      select e.value from jsonb_each(coalesce(doc -> 'set', '{}')) e where e.key ~ '(^|\.)ref$' or e.key ~ '\.refs\.[0-9]+$'
      union all
      select x.value from jsonb_each(coalesce(doc -> 'set', '{}')) e, jsonb_array_elements(case when jsonb_typeof(e.value) = 'array' then e.value else '[]' end) x
        where e.key ~ '(^|\.)refs$' and jsonb_typeof(e.value) = 'array'
      union all select jsonb_path_query(coalesce(doc -> 'add', '{}'), 'lax $.**.refs[*]')
      union all select jsonb_path_query(coalesce(doc -> 'add', '{}'), 'lax $.**.ref')
    loop
      begin
        s := (r ->> 0)::int;
        a := (r ->> 1)::int;
      exception when others then
        s := null;
      end;
      if jsonb_typeof(r) <> 'array' or s is null or a is null or jsonb_array_length(r) <> 2
         or not exists (select 1 from public.quran_surahs q where q.n = s and a between 1 and q.ayahs) then
        out := out || ('not a real ayah reference: ' || r::text);
      end if;
    end loop;
  end if;
  return out;
end $$;

-- --------------------------------------------------------------------------
-- Functions the studio calls
-- --------------------------------------------------------------------------

create function public.studio_whoami() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'user', auth.uid(),
    'aal', coalesce(auth.jwt() ->> 'aal', ''),
    'roles', to_jsonb(public.studio_my_roles()),
    'staff', public.studio_is_staff())
$$;

-- The published document for a scope (null if none), for staff.
create function public.studio_live_doc(p_scope text) returns jsonb
language sql stable security definer set search_path = public as $$
  select doc from public.live_content where scope = p_scope
$$;

create function public.studio_save_draft(p_scope text, p_doc jsonb, p_revision int) returns int
language plpgsql security definer set search_path = public as $$
declare
  cur public.content_drafts;
  base jsonb;
  classes text[];
begin
  if not public.studio_is_staff() then raise exception 'staff with a multi-factor session only' using errcode = '42501'; end if;
  if not public.studio_scope_ok(p_scope) then raise exception 'unknown scope %', p_scope; end if;
  if jsonb_typeof(p_doc) <> 'object' then raise exception 'the document must be an object'; end if;
  select * into cur from public.content_drafts where scope = p_scope for update;
  base := coalesce(cur.doc, public.studio_live_doc(p_scope), '{"v":1}'::jsonb);
  if cur.scope is not null and cur.revision <> p_revision then
    raise exception 'someone else saved this draft (revision % is newer than yours, %); reload it first', cur.revision, p_revision using errcode = 'PT409';
  end if;
  classes := public.studio_changes(p_scope, base, p_doc);
  if cardinality(classes) = 0 then return coalesce(cur.revision, 0); end if;
  if not public.studio_may_change(p_scope, classes) then
    raise exception 'your roles do not allow these changes (%)', array_to_string(classes, ', ') using errcode = '42501';
  end if;
  insert into public.content_drafts (scope, doc, base_version, revision, updated_by, updated_at)
  values (p_scope, p_doc, (select max(version_id) from public.publications where scope = p_scope), 1, auth.uid(), now())
  on conflict (scope) do update set doc = excluded.doc, revision = content_drafts.revision + 1, updated_by = auth.uid(), updated_at = now();
  perform public.studio_audit('draft.save', p_scope, jsonb_build_object('classes', classes, 'revision', coalesce(cur.revision, 0) + 1));
  return coalesce(cur.revision, 0) + 1;
end $$;

-- Throw the draft away and start again from what is published.
create function public.studio_discard_draft(p_scope text) returns void
language plpgsql security definer set search_path = public as $$
declare d public.content_drafts;
begin
  select * into d from public.content_drafts where scope = p_scope;
  if d.scope is null then return; end if;
  if not public.studio_may_change(p_scope, public.studio_changes(p_scope, coalesce(public.studio_live_doc(p_scope), '{"v":1}'), d.doc)) then
    raise exception 'your roles do not allow discarding this draft' using errcode = '42501';
  end if;
  delete from public.content_drafts where scope = p_scope;
  perform public.studio_audit('draft.discard', p_scope, jsonb_build_object('revision', d.revision));
end $$;

-- Freeze the draft as a numbered version and send it for review.
create function public.studio_submit(p_scope text, p_note text) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  d public.content_drafts;
  live jsonb;
  probs text[];
  classes text[];
  vid bigint;
  num int;
begin
  select * into d from public.content_drafts where scope = p_scope;
  if d.scope is null then raise exception 'there is no draft to submit'; end if;
  live := coalesce(public.studio_live_doc(p_scope), '{"v":1}'::jsonb);
  classes := public.studio_changes(p_scope, live, d.doc);
  if cardinality(classes) = 0 then raise exception 'the draft is the same as what is published'; end if;
  -- Each change was checked against its author's roles when it was saved;
  -- any content editor may send the draft on for review.
  if not (public.studio_has_role('story_editor') or public.studio_has_role('world_editor') or public.studio_has_role('audio_editor')
          or (p_scope = 'config:multiplayer' and public.studio_has_role('moderator'))) then
    raise exception 'editors only' using errcode = '42501';
  end if;
  probs := public.studio_doc_problems(p_scope, d.doc);
  if cardinality(probs) > 0 then raise exception 'the draft has problems: %', array_to_string(probs, '; '); end if;
  select coalesce(max(number), 0) + 1 into num from public.content_versions where scope = p_scope;
  -- Earlier versions still waiting are replaced by this one.
  update public.content_versions set state = 'withdrawn' where scope = p_scope and state in ('submitted', 'approved', 'changes_requested');
  insert into public.content_versions (scope, number, doc, hash, note, quran_linked, changed, created_by)
  values (p_scope, num, d.doc, md5(d.doc::text), coalesce(p_note, ''), 'quran' = any (classes), classes, auth.uid())
  returning id into vid;
  perform public.studio_audit('version.submit', p_scope, jsonb_build_object('version', vid, 'number', num, 'classes', classes));
  return vid;
end $$;

-- Record the result of a check. A content/collision check on a version's
-- exact document also counts as that version's validation.
create function public.studio_record_test(p_scope text, p_version bigint, p_kind text, p_ok boolean, p_summary text, p_report jsonb, p_hash text, p_env jsonb)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  tid bigint;
  v public.content_versions;
begin
  if not (public.studio_has_role('game_tester') or public.studio_has_role('world_editor') or public.studio_has_role('story_editor') or public.studio_has_role('quran_reviewer')) then
    raise exception 'testers and editors only' using errcode = '42501';
  end if;
  if p_version is not null then
    select * into v from public.content_versions where id = p_version;
    if v.id is null or v.scope <> p_scope then raise exception 'no such version for %', p_scope; end if;
  end if;
  insert into public.test_runs (scope, version_id, doc_hash, kind, ok, summary, report, source, environment, ran_by)
  values (p_scope, p_version, p_hash, p_kind, p_ok, coalesce(p_summary, ''), coalesce(p_report, '{}'), 'studio', coalesce(p_env, '{}'), auth.uid())
  returning id into tid;
  if v.id is not null and p_hash = v.hash and p_kind = 'content' then
    update public.content_versions set validation = p_report, validation_ok = p_ok, validated_at = now() where id = v.id;
  end if;
  perform public.studio_audit('test.record', p_scope, jsonb_build_object('test', tid, 'kind', p_kind, 'ok', p_ok, 'version', p_version));
  return tid;
end $$;

-- Approve a version or send it back. Quran-linked changes need a Quran
-- Content Reviewer (the role itself; Super Admin alone is not enough).
-- Nobody approves their own work, except a Super Admin on a change that
-- is not Quran-linked.
create function public.studio_review(p_version bigint, p_decision text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare v public.content_versions;
begin
  select * into v from public.content_versions where id = p_version for update;
  if v.id is null then raise exception 'no such version'; end if;
  if v.state not in ('submitted', 'changes_requested', 'approved') then raise exception 'this version is %, not waiting for review', v.state; end if;
  if p_decision not in ('approve', 'changes') then raise exception 'decision must be approve or changes'; end if;
  if v.quran_linked then
    if not public.studio_has_exact_role('quran_reviewer') then
      raise exception 'Quran-linked changes need a Quran Content Reviewer' using errcode = '42501';
    end if;
  elsif not (public.studio_has_role('quran_reviewer') or public.studio_has_role('super_admin')) then
    raise exception 'reviewers only' using errcode = '42501';
  end if;
  if v.created_by = auth.uid() and (v.quran_linked or not public.studio_has_exact_role('super_admin')) then
    raise exception 'you cannot approve your own change' using errcode = '42501';
  end if;
  update public.content_versions set
    state = case when p_decision = 'approve' then 'approved' else 'changes_requested' end,
    reviewed_by = auth.uid(), reviewer_roles = public.studio_my_roles(), reviewed_at = now(), review_note = coalesce(p_note, '')
  where id = p_version;
  perform public.studio_audit('version.' || p_decision, v.scope, jsonb_build_object('version', v.id, 'number', v.number, 'note', p_note));
end $$;

-- Publish an approved, validated version (now or at a later time).
create function public.studio_publish(p_version bigint, p_effective_at timestamptz, p_note text) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v public.content_versions;
  pid bigint;
begin
  if not public.studio_has_role('super_admin') then raise exception 'only a Super Admin publishes' using errcode = '42501'; end if;
  select * into v from public.content_versions where id = p_version for update;
  if v.id is null then raise exception 'no such version'; end if;
  if v.state <> 'approved' then raise exception 'version % is %, it must be approved first', v.number, v.state; end if;
  if v.validation_ok is not true then raise exception 'version % has not passed validation', v.number; end if;
  insert into public.publications (scope, version_id, action, by, effective_at, note)
  values (v.scope, v.id, 'publish', auth.uid(), greatest(coalesce(p_effective_at, now()), now()), coalesce(p_note, ''))
  returning id into pid;
  update public.content_versions set state = 'published' where id = v.id;
  -- The draft carries on from what was just published.
  update public.content_drafts set base_version = v.id where scope = v.scope;
  perform public.studio_audit('version.publish', v.scope, jsonb_build_object('version', v.id, 'number', v.number, 'publication', pid, 'effective_at', coalesce(p_effective_at, now())));
  return pid;
end $$;

-- Go back to a version that was published before. Only the published
-- pointer moves: player saves, drafts and other versions are untouched.
create function public.studio_rollback(p_scope text, p_version bigint, p_note text) returns bigint
language plpgsql security definer set search_path = public as $$
declare pid bigint;
begin
  if not public.studio_has_role('super_admin') then raise exception 'only a Super Admin rolls back' using errcode = '42501'; end if;
  if p_version is not null and not exists (
    select 1 from public.publications p where p.scope = p_scope and p.version_id = p_version and p.action in ('publish', 'rollback')) then
    raise exception 'you can only roll back to a version that was published before';
  end if;
  insert into public.publications (scope, version_id, action, by, note)
  values (p_scope, p_version, case when p_version is null then 'unpublish' else 'rollback' end, auth.uid(), coalesce(p_note, ''))
  returning id into pid;
  perform public.studio_audit(case when p_version is null then 'version.unpublish' else 'version.rollback' end, p_scope,
    jsonb_build_object('version', p_version, 'publication', pid));
  return pid;
end $$;

-- Staff management (Super Admin).
create function public.studio_staff() returns table (user_id uuid, email text, roles public.staff_role[], mfa boolean)
language sql stable security definer set search_path = public, auth as $$
  select u.id, u.email::text, array_agg(r.role order by r.role),
    exists (select 1 from auth.mfa_factors f where f.user_id = u.id and f.status = 'verified')
  from public.staff_roles r join auth.users u on u.id = r.user_id
  where public.studio_has_role('super_admin')
  group by u.id, u.email
$$;

create function public.studio_set_role(p_email text, p_role public.staff_role, p_on boolean) returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.studio_has_role('super_admin') then raise exception 'only a Super Admin manages staff' using errcode = '42501'; end if;
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then raise exception 'no account with that email; the person must sign up first'; end if;
  if p_on then
    insert into public.staff_roles (user_id, role, granted_by) values (uid, p_role, auth.uid()) on conflict do nothing;
  else
    if p_role = 'super_admin' and (select count(*) from public.staff_roles where role = 'super_admin') <= 1 then
      raise exception 'the last Super Admin cannot be removed';
    end if;
    delete from public.staff_roles where user_id = uid and role = p_role;
  end if;
  perform public.studio_audit(case when p_on then 'staff.grant' else 'staff.revoke' end, null, jsonb_build_object('user', uid, 'role', p_role));
end $$;

-- Run once from the Supabase SQL editor (as the database owner) to make the
-- first Super Admin. It cannot be called through the API.
create function public.studio_bootstrap_super_admin(p_email text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then raise exception 'no account with that email; sign up first'; end if;
  insert into public.staff_roles (user_id, role) values (uid, 'super_admin') on conflict do nothing;
  insert into public.audit_log (actor, action, detail) values (null, 'staff.bootstrap', jsonb_build_object('user', uid));
end $$;

-- Bugs.
create function public.studio_file_bug(p jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare bid bigint;
begin
  if not public.studio_is_staff() then raise exception 'staff only' using errcode = '42501'; end if;
  insert into public.bug_reports (surah, scene, object, title, description, severity, category, steps, device, diagnostics, needs_code, source, reported_by)
  values ((p ->> 'surah')::int, coalesce(p ->> 'scene', ''), coalesce(p ->> 'object', ''), p ->> 'title', coalesce(p ->> 'description', ''),
    coalesce(p ->> 'severity', 'medium'), coalesce(p ->> 'category', 'other'), coalesce(p ->> 'steps', ''), coalesce(p -> 'device', '{}'),
    coalesce(p -> 'diagnostics', '{}'), coalesce((p ->> 'needs_code')::boolean, false),
    case when p ->> 'source' = 'automated' then 'automated' else 'staff' end, auth.uid())
  returning id into bid;
  perform public.studio_audit('bug.file', case when p ? 'surah' then 'surah:' || (p ->> 'surah') end, jsonb_build_object('bug', bid));
  return bid;
end $$;

create function public.studio_update_bug(p_id bigint, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare b public.bug_reports;
begin
  if not public.studio_is_staff() then raise exception 'staff only' using errcode = '42501'; end if;
  select * into b from public.bug_reports where id = p_id for update;
  if b.id is null then raise exception 'no such bug'; end if;
  update public.bug_reports set
    status = coalesce(p ->> 'status', status),
    severity = coalesce(p ->> 'severity', severity),
    category = coalesce(p ->> 'category', category),
    needs_code = coalesce((p ->> 'needs_code')::boolean, needs_code),
    resolution = coalesce(p ->> 'resolution', resolution),
    assigned_to = case when p ? 'assigned_to' then (p ->> 'assigned_to')::uuid else assigned_to end,
    resolved_at = case when coalesce(p ->> 'status', status) in ('fixed', 'wont_fix', 'duplicate') then coalesce(resolved_at, now()) else null end,
    updated_at = now()
  where id = p_id;
  perform public.studio_audit('bug.update', case when b.surah is not null then 'surah:' || b.surah end, jsonb_build_object('bug', p_id, 'change', p));
end $$;

-- Players (signed in or not) report a problem with a fixed category only.
create function public.report_problem(p_surah int, p_category text, p_screen text) returns void
language plpgsql security definer set search_path = public as $$
begin
  -- A simple brake on floods: at most 30 reports a minute overall.
  if (select count(*) from public.player_problems where created_at > now() - interval '1 minute') >= 30 then return; end if;
  insert into public.player_problems (surah, category, screen) values (p_surah, p_category, p_screen);
end $$;

-- Execute rights: staff functions for signed-in users only (they check roles
-- themselves); the bootstrap only for the database owner; problem reports for all.
revoke all on function public.studio_mfa_ok(), public.studio_has_exact_role(public.staff_role), public.studio_has_role(public.staff_role),
  public.studio_is_staff(), public.studio_my_roles(), public.studio_audit(text, text, jsonb), public.studio_key_class(text, jsonb),
  public.studio_changes(text, jsonb, jsonb), public.studio_may_change(text, text[]), public.studio_doc_problems(text, jsonb),
  public.studio_whoami(), public.studio_live_doc(text), public.studio_save_draft(text, jsonb, int), public.studio_discard_draft(text),
  public.studio_submit(text, text), public.studio_record_test(text, bigint, text, boolean, text, jsonb, text, jsonb),
  public.studio_review(bigint, text, text), public.studio_publish(bigint, timestamptz, text), public.studio_rollback(text, bigint, text),
  public.studio_staff(), public.studio_set_role(text, public.staff_role, boolean), public.studio_bootstrap_super_admin(text),
  public.studio_file_bug(jsonb), public.studio_update_bug(bigint, jsonb), public.report_problem(int, text, text)
  from public, anon, authenticated;

grant execute on function public.studio_mfa_ok(), public.studio_has_exact_role(public.staff_role), public.studio_has_role(public.staff_role),
  public.studio_is_staff(), public.studio_my_roles(), public.studio_whoami(), public.studio_live_doc(text),
  public.studio_save_draft(text, jsonb, int), public.studio_discard_draft(text), public.studio_submit(text, text),
  public.studio_record_test(text, bigint, text, boolean, text, jsonb, text, jsonb), public.studio_review(bigint, text, text),
  public.studio_publish(bigint, timestamptz, text), public.studio_rollback(text, bigint, text), public.studio_staff(),
  public.studio_set_role(text, public.staff_role, boolean), public.studio_file_bug(jsonb), public.studio_update_bug(bigint, jsonb),
  public.studio_doc_problems(text, jsonb), public.studio_changes(text, jsonb, jsonb), public.studio_key_class(text, jsonb)
  to authenticated;
grant execute on function public.report_problem(int, text, text) to anon, authenticated;

-- Surah names and ayah counts (from content/quran/surahs.json).
insert into public.quran_surahs (n, name, ayahs) values
  (1, 'Al-Fātiḥah', 7),
  (2, 'Al-Baqarah', 286),
  (3, 'Āl-‘Imrān', 200),
  (4, 'An-Nisā’', 176),
  (5, 'Al-Mā’idah', 120),
  (6, 'Al-An‘ām', 165),
  (7, 'Al-A‘rāf', 206),
  (8, 'Al-Anfāl', 75),
  (9, 'At-Taubah', 129),
  (10, 'Yūnus', 109),
  (11, 'Hūd', 123),
  (12, 'Yūsuf', 111),
  (13, 'Ar-Ra‘d', 43),
  (14, 'Ibrāhīm', 52),
  (15, 'Al-Ḥijr', 99),
  (16, 'An-Naḥl', 128),
  (17, 'Al-Isrā’', 111),
  (18, 'Al-Kahf', 110),
  (19, 'Maryam', 98),
  (20, 'Ṭā-Hā', 135),
  (21, 'Al-Anbiyā’', 112),
  (22, 'Al-Ḥajj', 78),
  (23, 'Al-Mu’minūn', 118),
  (24, 'An-Nūr', 64),
  (25, 'Al-Furqān', 77),
  (26, 'Ash-Shu‘arā’', 227),
  (27, 'An-Naml', 93),
  (28, 'Al-Qaṣaṣ', 88),
  (29, 'Al-‘Ankabūt', 69),
  (30, 'Ar-Rūm', 60),
  (31, 'Luqmān', 34),
  (32, 'As-Sajdah', 30),
  (33, 'Al-Aḥzāb', 73),
  (34, 'Saba’', 54),
  (35, 'Fāṭir', 45),
  (36, 'Yā-Sīn', 83),
  (37, 'Aṣ-Ṣāffāt', 182),
  (38, 'Ṣād', 88),
  (39, 'Az-Zumar', 75),
  (40, 'Ghāfir', 85),
  (41, 'Fuṣṣilat', 54),
  (42, 'Ash-Shūra', 53),
  (43, 'Az-Zukhruf', 89),
  (44, 'Ad-Dukhān', 59),
  (45, 'Al-Jāthiyah', 37),
  (46, 'Al-Aḥqāf', 35),
  (47, 'Muḥammad', 38),
  (48, 'Al-Fatḥ', 29),
  (49, 'Al-Ḥujurāt', 18),
  (50, 'Qāf', 45),
  (51, 'Adh-Dhāriyāt', 60),
  (52, 'Aṭ-Ṭūr', 49),
  (53, 'An-Najm', 62),
  (54, 'Al-Qamar', 55),
  (55, 'Ar-Raḥmān', 78),
  (56, 'Al-Wāqi‘ah', 96),
  (57, 'Al-Ḥadīd', 29),
  (58, 'Al-Mujādilah', 22),
  (59, 'Al-Ḥashr', 24),
  (60, 'Al-Mumtaḥanah', 13),
  (61, 'Aṣ-Ṣaff', 14),
  (62, 'Al-Jumu‘ah', 11),
  (63, 'Al-Munāfiqūn', 11),
  (64, 'At-Taghābun', 18),
  (65, 'Aṭ-Ṭalāq', 12),
  (66, 'At-Taḥrīm', 12),
  (67, 'Al-Mulk', 30),
  (68, 'Al-Qalam', 52),
  (69, 'Al-Ḥāqqah', 52),
  (70, 'Al-Ma‘ārij', 44),
  (71, 'Nūḥ', 28),
  (72, 'Al-Jinn', 28),
  (73, 'Al-Muzzammil', 20),
  (74, 'Al-Muddaththir', 56),
  (75, 'Al-Qiyāmah', 40),
  (76, 'Al-Insān', 31),
  (77, 'Al-Mursalāt', 50),
  (78, 'An-Naba’', 40),
  (79, 'An-Nāzi‘āt', 46),
  (80, '‘Abasa', 42),
  (81, 'At-Takwīr', 29),
  (82, 'Al-Infiṭār', 19),
  (83, 'Al-Muṭaffifīn', 36),
  (84, 'Al-Inshiqāq', 25),
  (85, 'Al-Burūj', 22),
  (86, 'Aṭ-Ṭāriq', 17),
  (87, 'Al-A‘lā', 19),
  (88, 'Al-Ghāshiyah', 26),
  (89, 'Al-Fajr', 30),
  (90, 'Al-Balad', 20),
  (91, 'Ash-Shams', 15),
  (92, 'Al-Lail', 21),
  (93, 'Aḍ-Ḍuḥā', 11),
  (94, 'Ash-Sharḥ', 8),
  (95, 'At-Tīn', 8),
  (96, 'Al-‘Alaq', 19),
  (97, 'Al-Qadr', 5),
  (98, 'Al-Bayyinah', 8),
  (99, 'Az-Zalzalah', 8),
  (100, 'Al-‘Ādiyāt', 11),
  (101, 'Al-Qāri‘ah', 11),
  (102, 'At-Takāthur', 8),
  (103, 'Al-‘Aṣr', 3),
  (104, 'Al-Humazah', 9),
  (105, 'Al-Fīl', 5),
  (106, 'Quraish', 4),
  (107, 'Al-Mā‘ūn', 7),
  (108, 'Al-Kauthar', 3),
  (109, 'Al-Kāfirūn', 6),
  (110, 'An-Naṣr', 3),
  (111, 'Al-Masad', 5),
  (112, 'Al-Ikhlāṣ', 4),
  (113, 'Al-Falaq', 5),
  (114, 'An-Nās', 6);
