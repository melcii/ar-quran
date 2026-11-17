-- Admin Studio phase 4: Bug Control Center.
--
-- * Player problem reports (child-safe: a world, a fixed category, a screen
--   size; nothing else) can be grouped into a bug, or linked to one.
-- * Bugs keep a short history of status changes in their diagnostics.
-- * Automated health checks file bugs with source 'automated' through the
--   existing studio_file_bug, and record their runs in test_runs.
-- Same rules as before: writes only through checked functions, audited.

-- Link player reports to a bug (or make one from them).
create function public.studio_bug_from_problems(p_ids bigint[], p_bug bigint, p_title text) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  bid bigint := p_bug;
  s int;
  c text;
begin
  if not public.studio_is_staff() then raise exception 'staff only' using errcode = '42501'; end if;
  if coalesce(array_length(p_ids, 1), 0) = 0 then raise exception 'choose at least one report'; end if;
  if bid is null then
    select min(surah), min(category) into s, c from public.player_problems where id = any (p_ids);
    insert into public.bug_reports (surah, title, description, category, severity, source, reported_by, diagnostics)
    values (s, coalesce(nullif(trim(p_title), ''), 'Player reports'),
      'Made from ' || array_length(p_ids, 1) || ' player report(s). Player reports carry only a world, a category and a screen size.',
      case c when 'stuck' then 'movement' when 'cannot_finish' then 'activity' when 'sound' then 'audio' when 'looks_wrong' then 'visual' else 'other' end,
      case when array_length(p_ids, 1) >= 5 then 'high' else 'medium' end, 'player', auth.uid(),
      jsonb_build_object('player_reports', to_jsonb(p_ids)))
    returning id into bid;
  elsif not exists (select 1 from public.bug_reports where id = bid) then
    raise exception 'no such bug';
  end if;
  update public.player_problems set bug_id = bid where id = any (p_ids);
  perform public.studio_audit('bug.link_reports', case when s is not null then 'surah:' || s end, jsonb_build_object('bug', bid, 'reports', to_jsonb(p_ids)));
  return bid;
end $$;

-- Status history: keep who moved a bug to which status, and when.
create or replace function public.studio_update_bug(p_id bigint, p jsonb) returns void
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
    diagnostics = case when p ? 'status' and p ->> 'status' is distinct from b.status
      then jsonb_set(diagnostics, '{history}', coalesce(diagnostics -> 'history', '[]'::jsonb) || jsonb_build_object('at', now(), 'by', auth.uid(), 'from', b.status, 'to', p ->> 'status'))
      else diagnostics end,
    updated_at = now()
  where id = p_id;
  perform public.studio_audit('bug.update', case when b.surah is not null then 'surah:' || b.surah end, jsonb_build_object('bug', p_id, 'change', p));
end $$;

revoke all on function public.studio_bug_from_problems(bigint[], bigint, text) from public, anon, authenticated;
grant execute on function public.studio_bug_from_problems(bigint[], bigint, text) to authenticated;
