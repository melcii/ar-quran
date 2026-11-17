-- Admin Studio phase 3: activity logic links, the Ark animal-guiding
-- settings, character catalog checks, and the Audio Studio (uploaded
-- narration, recitation and sound-effect files with licence records and
-- review).
--
-- Rules kept from 0002: every write goes through a checked function that
-- tests the caller's roles (with a multi-factor session) and writes the
-- audit log; nothing here touches player saves.
--
-- Audio rules (from the brief and the audio system):
-- * Quran recitation must be a human recording by a named reciter, with a
--   confirmed licence, and approved by a Quran Content Reviewer. Text-to-
--   speech is refused for recitation by a check constraint.
-- * There is no music category, so background music cannot be added.
-- * Narration files are approved by an audio editor other than the uploader
--   (or a Super Admin). Only approved narration can be assigned to a line.

-- --------------------------------------------------------------------------
-- Scopes: the Ark slice's settings join the list.
-- --------------------------------------------------------------------------

create or replace function public.studio_scope_ok(scope text) returns boolean
language sql immutable as $$
  select scope ~ '^(surah:([1-9]|[1-9][0-9]|10[0-9]|11[0-4])|ark:slice|catalog:(avatar|room)|config:(multiplayer|audio))$'
$$;

-- --------------------------------------------------------------------------
-- Audio assets
-- --------------------------------------------------------------------------

create table public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('narration', 'recitation', 'effect')),
  title text not null check (length(title) between 1 and 200),
  language text not null default 'en' check (language ~ '^[a-z]{2}$'),
  path text not null unique check (path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,120}$'),
  mime text not null check (mime in ('audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/aac')),
  bytes int not null check (bytes > 0 and bytes <= 10485760),
  duration_s numeric check (duration_s is null or (duration_s > 0 and duration_s < 1800)),
  voice text not null default '' check (length(voice) <= 120),
  origin text not null check (origin in ('human_recording', 'licensed_tts', 'sound_library')),
  licence text not null check (length(licence) between 3 and 2000),
  licence_confirmed boolean not null default false,
  source text not null default '' check (length(source) <= 500),
  surah int references public.quran_surahs (n),
  ayah_from int,
  ayah_to int,
  line_text text check (line_text is null or length(line_text) <= 2000),
  status text not null default 'uploaded' check (status in ('uploaded', 'approved', 'rejected', 'retired')),
  uploaded_by uuid references auth.users (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewer_roles public.staff_role[],
  reviewed_at timestamptz,
  review_note text,
  -- Recitation: a named person's own recording of a real passage, never synthetic.
  constraint recitation_is_human check (kind <> 'recitation' or (origin = 'human_recording' and length(voice) > 1 and surah is not null and ayah_from >= 1 and ayah_to >= ayah_from)),
  constraint effects_from_library check (kind <> 'effect' or origin in ('sound_library', 'human_recording')),
  constraint narration_has_line check (kind <> 'narration' or length(coalesce(line_text, '')) > 0)
);
create index on public.audio_assets (kind, status);

alter table public.audio_assets enable row level security;
create policy "staff read audio" on public.audio_assets for select to authenticated using (public.studio_is_staff());
revoke insert, update, delete, truncate on public.audio_assets from anon, authenticated;

-- What players may fetch: approved files only, and only what is needed to play them.
create view public.live_audio with (security_invoker = false) as
  select id, kind, path, language from public.audio_assets where status = 'approved';
revoke all on public.live_audio from anon, authenticated;
grant select on public.live_audio to anon, authenticated;

-- The bucket. Public reads (players stream approved files by their random
-- path); uploads only by audio editors, and only into a folder named after
-- their own user id. Files are never overwritten or deleted through the API:
-- a bad file is retired instead, so published versions keep working.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studio-audio', 'studio-audio', true, 10485760,
  array['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/aac'])
on conflict (id) do nothing;

create policy "audio editors upload studio audio" on storage.objects for insert to authenticated
  with check (bucket_id = 'studio-audio' and public.studio_has_role('audio_editor') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "staff list studio audio" on storage.objects for select to authenticated
  using (bucket_id = 'studio-audio' and public.studio_is_staff());

create function public.studio_audio_register(p jsonb) returns uuid
language plpgsql security definer set search_path = public, storage as $$
declare
  aid uuid;
  obj record;
  s int;
  a1 int;
  a2 int;
begin
  if not public.studio_has_role('audio_editor') then raise exception 'audio editors only' using errcode = '42501'; end if;
  select o.name, o.owner, (o.metadata ->> 'size')::int as size, o.metadata ->> 'mimetype' as mime into obj
    from storage.objects o where o.bucket_id = 'studio-audio' and o.name = p ->> 'path';
  if obj.name is null then raise exception 'upload the file first'; end if;
  if obj.owner is distinct from auth.uid() then raise exception 'that file was uploaded by someone else' using errcode = '42501'; end if;
  if (p::text) ~ '[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]' then
    raise exception 'Arabic script is not allowed in audio records; the Quran text comes from the locked dataset';
  end if;
  s := (p ->> 'surah')::int;
  a1 := (p ->> 'ayah_from')::int;
  a2 := coalesce((p ->> 'ayah_to')::int, a1);
  if p ->> 'kind' = 'recitation' then
    if not exists (select 1 from public.quran_surahs q where q.n = s and a1 >= 1 and a2 <= q.ayahs and a2 >= a1) then
      raise exception 'not a real ayah range: %:%-%', s, a1, a2;
    end if;
  end if;
  insert into public.audio_assets (kind, title, language, path, mime, bytes, duration_s, voice, origin, licence, licence_confirmed, source, surah, ayah_from, ayah_to, line_text, uploaded_by)
  values (p ->> 'kind', p ->> 'title', coalesce(p ->> 'language', 'en'), p ->> 'path', coalesce(obj.mime, p ->> 'mime'), coalesce(obj.size, (p ->> 'bytes')::int),
    (p ->> 'duration_s')::numeric, coalesce(p ->> 'voice', ''), p ->> 'origin', coalesce(p ->> 'licence', ''), coalesce((p ->> 'licence_confirmed')::boolean, false),
    coalesce(p ->> 'source', ''), case when p ->> 'kind' in ('recitation', 'narration') then s end, case when p ->> 'kind' = 'recitation' then a1 end,
    case when p ->> 'kind' = 'recitation' then a2 end, case when p ->> 'kind' = 'narration' then p ->> 'line_text' end, auth.uid())
  returning id into aid;
  perform public.studio_audit('audio.register', null, jsonb_build_object('asset', aid, 'kind', p ->> 'kind', 'origin', p ->> 'origin'));
  return aid;
end $$;

-- Approve, reject or retire a file.
create function public.studio_audio_review(p_id uuid, p_decision text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare x public.audio_assets;
begin
  select * into x from public.audio_assets where id = p_id for update;
  if x.id is null then raise exception 'no such audio file'; end if;
  if p_decision not in ('approve', 'reject', 'retire') then raise exception 'decision must be approve, reject or retire'; end if;
  if p_decision = 'retire' then
    if not public.studio_has_role('audio_editor') then raise exception 'audio editors only' using errcode = '42501'; end if;
  elsif x.kind = 'recitation' then
    -- Recitation: a Quran Content Reviewer checks the recording against the text.
    if not public.studio_has_exact_role('quran_reviewer') then raise exception 'recitation is approved by a Quran Content Reviewer' using errcode = '42501'; end if;
    if p_decision = 'approve' and not x.licence_confirmed then raise exception 'the licence must be confirmed before a recitation is approved'; end if;
  else
    if not public.studio_has_role('audio_editor') then raise exception 'audio editors only' using errcode = '42501'; end if;
    if p_decision = 'approve' and not x.licence_confirmed then raise exception 'the licence must be confirmed first'; end if;
  end if;
  if p_decision <> 'retire' and x.uploaded_by = auth.uid() and not public.studio_has_exact_role('super_admin') then
    raise exception 'you cannot review your own upload' using errcode = '42501';
  end if;
  update public.audio_assets set
    status = case p_decision when 'approve' then 'approved' when 'reject' then 'rejected' else 'retired' end,
    reviewed_by = auth.uid(), reviewer_roles = public.studio_my_roles(), reviewed_at = now(), review_note = coalesce(p_note, '')
  where id = p_id;
  perform public.studio_audit('audio.' || p_decision, null, jsonb_build_object('asset', p_id, 'kind', x.kind, 'note', p_note));
end $$;

-- --------------------------------------------------------------------------
-- Change classes: the Ark settings are positions/numbers (world) and wording
-- (text); activity links are tasks.
-- --------------------------------------------------------------------------

create or replace function public.studio_changes(scope text, a jsonb, b jsonb) returns text[]
language plpgsql immutable as $$
declare
  out text[] := '{}';
  k text;
  sec text;
begin
  a := coalesce(a, '{}'::jsonb);
  b := coalesce(b, '{}'::jsonb);
  if scope !~ '^(surah:|ark:)' then
    if a is distinct from b then out := array[split_part(scope, ':', 1)]; end if;
    return out;
  end if;
  for k in select key from jsonb_each(coalesce(a -> 'set', '{}')) union select key from jsonb_each(coalesce(b -> 'set', '{}')) loop
    if (a -> 'set' -> k) is distinct from (b -> 'set' -> k) then
      out := out || public.studio_key_class(k, coalesce(b -> 'set' -> k, a -> 'set' -> k));
    end if;
  end loop;
  foreach sec in array array['place', 'add', 'order', 'links', 'record', 'audio'] loop
    if (a -> sec) is distinct from (b -> sec) then
      out := out || case sec
        when 'place' then 'world'
        when 'add' then (case when (b -> 'add' -> 'tasks') is distinct from (a -> 'add' -> 'tasks') then 'tasks' else 'world' end)
        when 'order' then 'tasks'
        when 'links' then 'tasks'
        when 'record' then 'record'
        else 'audio' end;
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

create or replace function public.studio_doc_problems(scope text, doc jsonb) returns text[]
language plpgsql stable security definer set search_path = public as $$
declare
  out text[] := '{}';
  k text;
  v jsonb;
  r jsonb;
  s int;
  a int;
  n numeric;
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
    -- Activity links: task id -> list of task ids it waits for.
    for k, v in select key, value from jsonb_each(coalesce(doc -> 'links', '{}')) loop
      if k !~ '^[A-Za-z0-9_-]+$' or jsonb_typeof(v) <> 'array' or exists (select 1 from jsonb_array_elements(v) x where jsonb_typeof(x) <> 'string') then
        out := out || ('not a valid activity link: ' || k);
      elsif v ? k then
        out := out || ('an activity cannot wait for itself: ' || k);
      end if;
    end loop;
    -- Narration audio: only approved narration files.
    for k, v in select key, value from jsonb_each(coalesce(doc -> 'audio', '{}')) loop
      if k !~ '^l[0-9a-z]{1,13}$' then
        out := out || ('not a narration line id: ' || k);
      elsif jsonb_typeof(v) <> 'string' or not exists (
        select 1 from public.audio_assets x where x.id::text = (v #>> '{}') and x.kind = 'narration' and x.status = 'approved') then
        out := out || ('line ' || k || ' is assigned a file that is not approved narration');
      end if;
    end loop;
  elsif scope = 'ark:slice' then
    for k, v in select key, value from jsonb_each(coalesce(doc -> 'set', '{}')) loop
      if k ~ '^(giraffe|elephant|camel|sheep|horse)\.(home|pad)$' then
        if jsonb_typeof(v) <> 'array' or jsonb_array_length(v) <> 2 or jsonb_typeof(v -> 0) <> 'number' or jsonb_typeof(v -> 1) <> 'number'
           or sqrt(((v ->> 0)::numeric) ^ 2 + ((v ->> 1)::numeric) ^ 2) > 74 then
          out := out || ('a place must be [x, z] inside the valley: ' || k);
        end if;
      elsif k ~ '^(giraffe|elephant|camel|sheep|horse)\.(notice|reach|arrive|speed|followMax)$' then
        if jsonb_typeof(v) <> 'number' then
          out := out || ('must be a number: ' || k);
        else
          n := (v #>> '{}')::numeric;
          if (k ~ '\.notice$' and not n between 2 and 15) or (k ~ '\.reach$' and not n between 1.5 and 6)
             or (k ~ '\.arrive$' and not n between 2 and 8) or (k ~ '\.speed$' and not n between 0.5 and 6)
             or (k ~ '\.followMax$' and not n between 1 and 10) then
            out := out || ('out of the allowed range: ' || k);
          end if;
        end if;
      elsif k ~ '^(giraffe|elephant|camel|sheep|horse)\.(instruction|done)$' or k ~ '^narration\.(welcome|ark|animals|giraffe|supplies|ready|rain|calm)$' then
        if jsonb_typeof(v) <> 'string' or length(v #>> '{}') not between 1 and 600 then
          out := out || ('text must be 1 to 600 characters: ' || k);
        end if;
      else
        out := out || ('not an editable Ark setting: ' || k);
      end if;
    end loop;
  elsif scope = 'catalog:avatar' then
    for k, v in select key, value from jsonb_each(coalesce(doc -> 'hide', '{}')) loop
      if k !~ '^(build|hair|faceShape|eyeShape|brows|top|pattern|bottom|outer|head|shoes|pack)$' or jsonb_typeof(v) <> 'array' then
        out := out || ('not a character option group: ' || k);
      end if;
    end loop;
    for k, v in select key, value from jsonb_each(coalesce(doc -> 'labels', '{}')) loop
      if k !~ '^[a-zA-Z]+\.[a-z]+$' or jsonb_typeof(v) <> 'string' or length(v #>> '{}') not between 1 and 40 then
        out := out || ('labels are 1 to 40 characters: ' || k);
      end if;
    end loop;
  end if;
  return out;
end $$;

-- Audio editors record checks on their own versions too.
create or replace function public.studio_record_test(p_scope text, p_version bigint, p_kind text, p_ok boolean, p_summary text, p_report jsonb, p_hash text, p_env jsonb)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  tid bigint;
  v public.content_versions;
begin
  if not (public.studio_has_role('game_tester') or public.studio_has_role('world_editor') or public.studio_has_role('story_editor')
          or public.studio_has_role('quran_reviewer') or public.studio_has_role('audio_editor')) then
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

-- Execute rights, as in 0002: the new staff functions for signed-in users
-- only (they check roles themselves), never for anonymous callers.
revoke all on function public.studio_audio_register(jsonb), public.studio_audio_review(uuid, text, text) from public, anon, authenticated;
grant execute on function public.studio_audio_register(jsonb), public.studio_audio_review(uuid, text, text) to authenticated;
