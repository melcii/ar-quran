-- Admin Studio phase 5: moderation, play settings (family and educator
-- controls), and release management.
--
-- * Moderation is privacy-limited: Moderators see a report's reason, when it
--   was made, the room's world and the reported explorer's nickname (to judge
--   an unkind nickname) and how often that explorer was reported. Never the
--   grown-up's email, the friend code, the look, saves or who reported. The
--   actions are small and reversible: pause online play for 1 to 30 days,
--   replace the nickname with a neutral one, close the room, or dismiss.
-- * config:multiplayer (Moderators): online play on/off for everyone and the
--   room size (2 to 4), enforced by the room functions themselves.
-- * config:play (Moderators): a gentle break reminder and worlds closed for
--   repair. Both go through review and publishing like any change.
-- * Releases group approved versions of several scopes and publish them
--   together (now or at a set time), and can be undone together. Only the
--   published pointer moves; player saves are never touched.

-- --------------------------------------------------------------------------
-- Scopes: play settings join the list.
-- --------------------------------------------------------------------------

create or replace function public.studio_scope_ok(scope text) returns boolean
language sql immutable as $$
  select scope ~ '^(surah:([1-9]|[1-9][0-9]|10[0-9]|11[0-4])|ark:slice|catalog:(avatar|room)|config:(multiplayer|audio|play))$'
$$;

create or replace function public.studio_may_change(scope text, classes text[]) returns boolean
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
      when 'config' then case when scope in ('config:multiplayer', 'config:play') then public.studio_has_role('moderator') else public.studio_has_role('audio_editor') end
      else false end;
    if not ok then return false; end if;
  end loop;
  return true;
end $$;

-- Moderators may send their settings drafts on for review.
create or replace function public.studio_submit(p_scope text, p_note text) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  d public.content_drafts;
  live jsonb;
  classes text[];
  probs text[];
  vid bigint;
  num int;
begin
  select * into d from public.content_drafts where scope = p_scope;
  if d.scope is null then raise exception 'there is no draft to submit'; end if;
  live := coalesce(public.studio_live_doc(p_scope), '{"v":1}'::jsonb);
  classes := public.studio_changes(p_scope, live, d.doc);
  if cardinality(classes) = 0 then raise exception 'the draft is the same as what is published'; end if;
  if not (public.studio_has_role('story_editor') or public.studio_has_role('world_editor') or public.studio_has_role('audio_editor')
          or (p_scope in ('config:multiplayer', 'config:play') and public.studio_has_role('moderator'))) then
    raise exception 'editors only' using errcode = '42501';
  end if;
  probs := public.studio_doc_problems(p_scope, d.doc);
  if cardinality(probs) > 0 then raise exception 'the draft has problems: %', array_to_string(probs, '; '); end if;
  select coalesce(max(number), 0) + 1 into num from public.content_versions where scope = p_scope;
  update public.content_versions set state = 'withdrawn' where scope = p_scope and state in ('submitted', 'approved', 'changes_requested');
  insert into public.content_versions (scope, number, doc, hash, note, quran_linked, changed, created_by)
  values (p_scope, num, d.doc, md5(d.doc::text), coalesce(p_note, ''), 'quran' = any (classes), classes, auth.uid())
  returning id into vid;
  perform public.studio_audit('version.submit', p_scope, jsonb_build_object('version', vid, 'number', num, 'classes', classes));
  return vid;
end $$;

-- Settings documents: only known keys, in range. Everything else as before
-- (the phase 3 checks run first).
create or replace function public.studio_settings_problems(scope text, doc jsonb) returns text[]
language plpgsql immutable as $$
declare
  out text[] := '{}';
  k text;
  v jsonb;
begin
  if scope in ('config:multiplayer', 'config:play') and (doc - 'v' - 'set') <> '{}'::jsonb then
    out := out || 'settings documents hold only settings'::text;
  end if;
  if scope = 'config:multiplayer' then
    for k, v in select key, value from jsonb_each(coalesce(doc -> 'set', '{}')) loop
      if k = 'enabled' then
        if jsonb_typeof(v) <> 'boolean' then out := out || 'enabled must be true or false'::text; end if;
      elsif k = 'roomMax' then
        if jsonb_typeof(v) <> 'number' or (v #>> '{}')::numeric not in (2, 3, 4) then out := out || 'rooms hold 2, 3 or 4 explorers'::text; end if;
      else
        out := out || ('not an online play setting: ' || k);
      end if;
    end loop;
  elsif scope = 'config:play' then
    for k, v in select key, value from jsonb_each(coalesce(doc -> 'set', '{}')) loop
      if k = 'breakMinutes' then
        if jsonb_typeof(v) <> 'number' or not ((v #>> '{}')::numeric = 0 or (v #>> '{}')::numeric between 10 and 120) then
          out := out || 'the break reminder is off (0) or 10 to 120 minutes'::text;
        end if;
      elsif k = 'closedWorlds' then
        if jsonb_typeof(v) <> 'array' or exists (select 1 from jsonb_array_elements(v) x where jsonb_typeof(x) <> 'number' or (x #>> '{}')::numeric not between 1 and 114 or (x #>> '{}')::numeric <> trunc((x #>> '{}')::numeric)) then
          out := out || 'closed worlds are surah numbers 1 to 114'::text;
        end if;
      else
        out := out || ('not a play setting: ' || k);
      end if;
    end loop;
  end if;
  return out;
end $$;

-- Wrap the phase 3 checks: keep them, add the settings checks.
alter function public.studio_doc_problems(text, jsonb) rename to studio_doc_problems_p3;
create function public.studio_doc_problems(scope text, doc jsonb) returns text[]
language sql stable security definer set search_path = public as $$
  select public.studio_doc_problems_p3(scope, doc) || public.studio_settings_problems(scope, doc)
$$;
revoke all on function public.studio_doc_problems_p3(text, jsonb), public.studio_settings_problems(text, jsonb), public.studio_doc_problems(text, jsonb) from public, anon, authenticated;
grant execute on function public.studio_doc_problems(text, jsonb) to authenticated;

-- The live value of one setting (null when not set).
create function public.live_setting(p_scope text, p_key text) returns jsonb
language sql stable security definer set search_path = public as $$
  select doc -> 'set' -> p_key from public.live_content where scope = p_scope
$$;
revoke all on function public.live_setting(text, text) from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- Moderation
-- --------------------------------------------------------------------------

alter table public.reports
  add column status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  add column action text check (action in ('pause_online', 'reset_nickname', 'close_room', 'dismiss')),
  add column note text not null default '' check (char_length(note) <= 1000),
  add column handled_by uuid references auth.users (id) on delete set null,
  add column handled_at timestamptz;
alter table public.explorers add column online_paused_until timestamptz;

-- Online play: the family's choice, not paused by a moderator, and online
-- play switched on for everyone (on unless a published setting says off).
create or replace function public.may_play_online(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select g.multiplayer and g.consent_at is not null and (x.online_paused_until is null or x.online_paused_until <= now())
                   from explorers x join guardians g on g.id = x.guardian where x.id = e), false)
     and coalesce((public.live_setting('config:multiplayer', 'enabled'))::boolean, true)
$$;

-- Room size from the published setting (2 to 4; 4 when not set).
create or replace function public.invite(r uuid, friend uuid) returns void
language plpgsql security definer set search_path = public as $$
declare h uuid;
begin
  select host into h from rooms where id = r and not closed;
  if h is null or not is_mine(h) then raise exception 'not your room'; end if;
  if not are_friends(h, friend) then raise exception 'only approved friends can be invited'; end if;
  if not may_play_online(friend) then raise exception 'multiplayer is off for that explorer'; end if;
  if (select count(*) from room_members where room = r) >= least(4, greatest(2, coalesce((public.live_setting('config:multiplayer', 'roomMax') #>> '{}')::int, 4))) then
    raise exception 'the room is full';
  end if;
  insert into room_members (room, explorer) values (r, friend) on conflict do nothing;
end $$;

-- Joining needs online play too (a paused explorer cannot join).
create or replace function public.join_room(me uuid, r uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_mine(me) then raise exception 'not your explorer'; end if;
  if not may_play_online(me) then raise exception 'multiplayer is off for this explorer'; end if;
  update room_members set joined_at = now()
  where room = r and explorer = me and exists (select 1 from rooms where id = r and not closed);
  if not found then raise exception 'not invited'; end if;
end $$;

-- The queue: only what a moderator needs to decide.
create function public.studio_mod_queue() returns table (
  id bigint, reason text, created_at timestamptz, status text, action text, note text, handled_at timestamptz,
  room uuid, room_world text, room_closed boolean,
  about uuid, about_nickname text, about_reports bigint, about_paused_until timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.studio_has_role('moderator') then raise exception 'moderators only' using errcode = '42501'; end if;
  return query
    select r.id, r.reason, r.created_at, r.status, r.action, r.note, r.handled_at,
      r.room, rm.world, rm.closed,
      r.about, x.nickname, (select count(*) from public.reports r2 where r2.about = r.about), x.online_paused_until
    from public.reports r
    left join public.rooms rm on rm.id = r.room
    left join public.explorers x on x.id = r.about
    order by (r.status = 'open') desc, r.created_at desc
    limit 500;
end $$;

create function public.studio_mod_act(p_report bigint, p_action text, p_days int, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare
  r public.reports;
  nick text;
begin
  if not public.studio_has_role('moderator') then raise exception 'moderators only' using errcode = '42501'; end if;
  select * into r from public.reports where id = p_report for update;
  if r.id is null then raise exception 'no such report'; end if;
  if p_action = 'pause_online' then
    if r.about is null then raise exception 'this report is not about an explorer'; end if;
    if p_days is null or p_days not between 1 and 30 then raise exception 'pause online play for 1 to 30 days'; end if;
    update public.explorers set online_paused_until = greatest(coalesce(online_paused_until, now()), now()) + make_interval(days => p_days) where id = r.about;
    -- Leave any open room straight away.
    delete from public.room_members m using public.rooms rm where m.room = rm.id and not rm.closed and m.explorer = r.about;
  elsif p_action = 'reset_nickname' then
    if r.about is null then raise exception 'this report is not about an explorer'; end if;
    nick := 'Explorer ' || lpad((floor(random() * 10000))::int::text, 4, '0');
    update public.explorers set nickname = nick where id = r.about;
  elsif p_action = 'close_room' then
    if r.room is null then raise exception 'this report is not about a room'; end if;
    update public.rooms set closed = true where id = r.room;
  elsif p_action <> 'dismiss' then
    raise exception 'unknown action';
  end if;
  update public.reports set status = case when p_action = 'dismiss' then 'dismissed' else 'actioned' end, action = p_action,
    note = left(coalesce(p_note, ''), 1000), handled_by = auth.uid(), handled_at = now()
  where id = p_report;
  -- The audit names the report and the action, not the child.
  perform public.studio_audit('moderation.' || p_action, null, jsonb_build_object('report', p_report, 'days', p_days));
end $$;

-- Lift a pause early.
create function public.studio_mod_unpause(p_report bigint) returns void
language plpgsql security definer set search_path = public as $$
declare a uuid;
begin
  if not public.studio_has_role('moderator') then raise exception 'moderators only' using errcode = '42501'; end if;
  select about into a from public.reports where id = p_report;
  if a is null then raise exception 'no such report'; end if;
  update public.explorers set online_paused_until = null where id = a;
  perform public.studio_audit('moderation.unpause', null, jsonb_build_object('report', p_report));
end $$;

-- --------------------------------------------------------------------------
-- Releases
-- --------------------------------------------------------------------------

create table public.releases (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 3 and 120),
  notes text not null default '' check (char_length(notes) <= 4000),
  versions bigint[] not null check (cardinality(versions) between 1 and 200),
  state text not null default 'planned' check (state in ('planned', 'published', 'undone', 'cancelled')),
  effective_at timestamptz,
  previous jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  undone_at timestamptz
);
alter table public.releases enable row level security;
create policy "staff read releases" on public.releases for select to authenticated using (public.studio_is_staff());
revoke insert, update, delete on public.releases from anon, authenticated;

create function public.studio_release_create(p_title text, p_notes text, p_versions bigint[]) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  rid bigint;
  bad text;
begin
  if not public.studio_has_role('super_admin') then raise exception 'only a Super Admin plans releases' using errcode = '42501'; end if;
  if coalesce(cardinality(p_versions), 0) = 0 then raise exception 'choose at least one approved version'; end if;
  select string_agg(coalesce(v.scope || ' v' || v.number || ' is ' || v.state, 'version ' || x || ' does not exist'), '; ') into bad
  from unnest(p_versions) x left join public.content_versions v on v.id = x
  where v.id is null or v.state <> 'approved' or v.validation_ok is not true;
  if bad is not null then raise exception 'only approved, validated versions can be released: %', bad; end if;
  if (select count(distinct scope) from public.content_versions where id = any (p_versions)) <> cardinality(p_versions) then
    raise exception 'a release holds one version per world or setting';
  end if;
  insert into public.releases (title, notes, versions, created_by) values (trim(p_title), coalesce(p_notes, ''), p_versions, auth.uid()) returning id into rid;
  perform public.studio_audit('release.create', null, jsonb_build_object('release', rid, 'versions', to_jsonb(p_versions)));
  return rid;
end $$;

-- Publish every version of a release at once (all or nothing).
create function public.studio_release_publish(p_id bigint, p_at timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare
  rel public.releases;
  v public.content_versions;
  prev jsonb := '{}'::jsonb;
  v_at timestamptz := greatest(coalesce(p_at, now()), now());
begin
  if not public.studio_has_role('super_admin') then raise exception 'only a Super Admin publishes' using errcode = '42501'; end if;
  select * into rel from public.releases where id = p_id for update;
  if rel.id is null then raise exception 'no such release'; end if;
  if rel.state <> 'planned' then raise exception 'this release is already %', rel.state; end if;
  for v in select * from public.content_versions where id = any (rel.versions) loop
    -- What was live in this scope just before (null: the built-in content).
    prev := prev || jsonb_build_object(v.scope, (select p.version_id from public.publications p where p.scope = v.scope and p.effective_at <= v_at order by p.effective_at desc, p.id desc limit 1));
    perform public.studio_publish(v.id, v_at, 'Release: ' || rel.title);
  end loop;
  update public.releases set state = 'published', effective_at = v_at, previous = prev, published_by = auth.uid(), published_at = now() where id = p_id;
  perform public.studio_audit('release.publish', null, jsonb_build_object('release', p_id, 'effective_at', v_at));
end $$;

-- Undo a release: every scope goes back to what was live before it.
create function public.studio_release_undo(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare
  rel public.releases;
  k text;
  val jsonb;
begin
  if not public.studio_has_role('super_admin') then raise exception 'only a Super Admin rolls back' using errcode = '42501'; end if;
  select * into rel from public.releases where id = p_id for update;
  if rel.id is null then raise exception 'no such release'; end if;
  if rel.state <> 'published' then raise exception 'only a published release can be undone'; end if;
  for k, val in select key, value from jsonb_each(rel.previous) loop
    perform public.studio_rollback(k, case when jsonb_typeof(val) = 'number' then (val #>> '{}')::bigint end, 'Undo release: ' || rel.title);
  end loop;
  update public.releases set state = 'undone', undone_at = now() where id = p_id;
  perform public.studio_audit('release.undo', null, jsonb_build_object('release', p_id));
end $$;

create function public.studio_release_cancel(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.studio_has_role('super_admin') then raise exception 'only a Super Admin plans releases' using errcode = '42501'; end if;
  update public.releases set state = 'cancelled' where id = p_id and state = 'planned';
  if not found then raise exception 'only a planned release can be cancelled'; end if;
  perform public.studio_audit('release.cancel', null, jsonb_build_object('release', p_id));
end $$;

revoke all on function public.studio_mod_queue(), public.studio_mod_act(bigint, text, int, text), public.studio_mod_unpause(bigint),
  public.studio_release_create(text, text, bigint[]), public.studio_release_publish(bigint, timestamptz), public.studio_release_undo(bigint),
  public.studio_release_cancel(bigint) from public, anon, authenticated;
grant execute on function public.studio_mod_queue(), public.studio_mod_act(bigint, text, int, text), public.studio_mod_unpause(bigint),
  public.studio_release_create(text, text, bigint[]), public.studio_release_publish(bigint, timestamptz), public.studio_release_undo(bigint),
  public.studio_release_cancel(bigint) to authenticated;
