-- Quran Adventure: grown-up accounts, explorer profiles, saves, friends and
-- private rooms. Draft, waiting for legal and technical review: nothing here
-- is a claim of compliance with any child-privacy law.
--
-- Design:
-- * Only grown-ups sign in (Supabase Auth). Children never get credentials;
--   each child is an explorer profile under a grown-up.
-- * An explorer is a nickname and a look. No real name, birthday, photo,
--   school, contact detail or location is stored anywhere.
-- * Children are never findable: there is no search and no public list.
--   Friends join only by a code the grown-ups exchange, and both grown-ups
--   approve. Rooms are invitation only, 2 to 4 explorers, friends only.
-- * Every write that involves another family goes through a checked
--   function (security definer). Tables only allow a family its own rows.
-- * Deleting the grown-up's account deletes everything (on delete cascade).

create extension if not exists pgcrypto;

create table public.guardians (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  consent_at timestamptz,                        -- when the grown-up confirmed the consent text
  multiplayer boolean not null default false,    -- off until the grown-up turns it on
  phrases_only boolean not null default true     -- children talk only with preset phrases and gestures
);

create table public.explorers (
  id uuid primary key default gen_random_uuid(),
  guardian uuid not null references public.guardians (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 16 and nickname ~ '^[[:alnum:] ]+$'),
  look jsonb not null default '{}'::jsonb check (octet_length(look::text) < 4000),
  friend_code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  created_at timestamptz not null default now()
);
create index on public.explorers (guardian);

-- Per-explorer saves, mirroring the keys the app already keeps on the device.
create table public.saves (
  explorer uuid not null references public.explorers (id) on delete cascade,
  key text not null check (key ~ '^(quran-adventure\.|quran-storybook/)' and key !~ '^quran-adventure\.profile'),
  value text not null check (octet_length(value) < 200000),
  updated_at timestamptz not null default now(),
  primary key (explorer, key)
);

-- A friendship is one row per pair (a < b); it counts only when both grown-ups approve.
create table public.friendships (
  a uuid not null references public.explorers (id) on delete cascade,
  b uuid not null references public.explorers (id) on delete cascade,
  a_ok boolean not null default false,
  b_ok boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);

create table public.blocks (
  explorer uuid not null references public.explorers (id) on delete cascade,
  blocked uuid not null references public.explorers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (explorer, blocked)
);

create table public.reports (
  id bigint generated always as identity primary key,
  by_explorer uuid references public.explorers (id) on delete set null,
  about uuid references public.explorers (id) on delete set null,
  reason text not null check (reason in ('unkind', 'unsafe', 'other')),
  room uuid,
  created_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  host uuid not null references public.explorers (id) on delete cascade,
  world text not null check (world ~ '^(ark|[0-9]{1,3})$'),
  created_at timestamptz not null default now(),
  closed boolean not null default false
);

create table public.room_members (
  room uuid not null references public.rooms (id) on delete cascade,
  explorer uuid not null references public.explorers (id) on delete cascade,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  primary key (room, explorer)
);

-- Helpers -------------------------------------------------------------------

create function public.my_explorers() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from explorers where guardian = auth.uid()
$$;

create function public.is_mine(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from explorers where id = e and guardian = auth.uid())
$$;

create function public.are_friends(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from friendships f
    where f.a = least(x, y) and f.b = greatest(x, y) and f.a_ok and f.b_ok
  ) and not exists (
    select 1 from blocks k where (k.explorer = x and k.blocked = y) or (k.explorer = y and k.blocked = x)
  )
$$;

create function public.may_play_online(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select g.multiplayer and g.consent_at is not null from explorers x join guardians g on g.id = x.guardian where x.id = e), false)
$$;

create function public.my_rooms() returns setof uuid
language sql stable security definer set search_path = public as $$
  select room from room_members where explorer in (select my_explorers())
$$;

-- Row level security: a family sees and changes only its own rows. -----------

alter table public.guardians enable row level security;
alter table public.explorers enable row level security;
alter table public.saves enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;

create policy "own guardian row" on public.guardians for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "own explorers" on public.explorers for all to authenticated
  using (guardian = auth.uid()) with check (guardian = auth.uid());

create policy "own saves" on public.saves for all to authenticated
  using (explorer in (select public.my_explorers())) with check (explorer in (select public.my_explorers()));

create policy "see own friendships" on public.friendships for select to authenticated
  using (a in (select public.my_explorers()) or b in (select public.my_explorers()));
create policy "end own friendships" on public.friendships for delete to authenticated
  using (a in (select public.my_explorers()) or b in (select public.my_explorers()));

create policy "own blocks" on public.blocks for all to authenticated
  using (explorer in (select public.my_explorers())) with check (explorer in (select public.my_explorers()));

create policy "file reports" on public.reports for insert to authenticated
  with check (by_explorer in (select public.my_explorers()));

create policy "see rooms I am in" on public.rooms for select to authenticated
  using (id in (select public.my_rooms()));

create policy "see members of my rooms" on public.room_members for select to authenticated
  using (room in (select public.my_rooms()));

-- Checked actions -------------------------------------------------------------

-- A grown-up asks to be friends using the other family's code; their own side is approved.
create function public.request_friend(me uuid, code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare other uuid;
begin
  if not is_mine(me) then raise exception 'not your explorer'; end if;
  if not may_play_online(me) then raise exception 'multiplayer is off for this explorer'; end if;
  select id into other from explorers where friend_code = upper(trim(code));
  -- The same answer whether the code is wrong, blocked or the other family has multiplayer off.
  if other is null or other = me or not may_play_online(other) then raise exception 'no explorer with that code'; end if;
  if exists (select 1 from blocks where (explorer = me and blocked = other) or (explorer = other and blocked = me)) then
    raise exception 'no explorer with that code';
  end if;
  insert into friendships (a, b, a_ok, b_ok)
  values (least(me, other), greatest(me, other), me < other, me > other)
  on conflict (a, b) do update set a_ok = friendships.a_ok or excluded.a_ok, b_ok = friendships.b_ok or excluded.b_ok;
  return other;
end $$;

-- The other grown-up approves a waiting request for their explorer.
create function public.approve_friend(me uuid, other uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_mine(me) then raise exception 'not your explorer'; end if;
  if not may_play_online(me) then raise exception 'multiplayer is off for this explorer'; end if;
  update friendships set a_ok = a_ok or (a = me), b_ok = b_ok or (b = me)
  where a = least(me, other) and b = greatest(me, other);
  if not found then raise exception 'no request'; end if;
end $$;

-- What a family may see of friends and requests: nickname and look only.
create function public.friend_list(me uuid)
returns table (explorer uuid, nickname text, look jsonb, approved boolean, waiting_for_me boolean)
language sql stable security definer set search_path = public as $$
  select x.id, x.nickname, x.look, f.a_ok and f.b_ok,
         (f.a = me and not f.a_ok) or (f.b = me and not f.b_ok)
  from friendships f join explorers x on x.id = case when f.a = me then f.b else f.a end
  where is_mine(me) and (f.a = me or f.b = me)
$$;

create function public.open_room(me uuid, world text) returns uuid
language plpgsql security definer set search_path = public as $$
declare r uuid;
begin
  if not is_mine(me) then raise exception 'not your explorer'; end if;
  if not may_play_online(me) then raise exception 'multiplayer is off for this explorer'; end if;
  insert into rooms (host, world) values (me, world) returning id into r;
  insert into room_members (room, explorer, joined_at) values (r, me, now());
  return r;
end $$;

-- Only the host invites, only approved friends, at most four in a room.
create function public.invite(r uuid, friend uuid) returns void
language plpgsql security definer set search_path = public as $$
declare h uuid;
begin
  select host into h from rooms where id = r and not closed;
  if h is null or not is_mine(h) then raise exception 'not your room'; end if;
  if not are_friends(h, friend) then raise exception 'only approved friends can be invited'; end if;
  if not may_play_online(friend) then raise exception 'multiplayer is off for that explorer'; end if;
  if (select count(*) from room_members where room = r) >= 4 then raise exception 'the room is full'; end if;
  insert into room_members (room, explorer) values (r, friend) on conflict do nothing;
end $$;

create function public.join_room(me uuid, r uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_mine(me) then raise exception 'not your explorer'; end if;
  update room_members set joined_at = now()
  where room = r and explorer = me and exists (select 1 from rooms where id = r and not closed);
  if not found then raise exception 'not invited'; end if;
end $$;

create function public.leave_room(me uuid, r uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_mine(me) then raise exception 'not your explorer'; end if;
  delete from room_members where room = r and explorer = me;
  update rooms set closed = true where id = r and (host = me or not exists (select 1 from room_members where room = r));
end $$;

-- The room's roster: nickname and look of each member, for the people in it.
create function public.room_roster(r uuid)
returns table (explorer uuid, nickname text, look jsonb, joined boolean)
language sql stable security definer set search_path = public as $$
  select x.id, x.nickname, x.look, m.joined_at is not null
  from room_members m join explorers x on x.id = m.explorer
  where m.room = r and exists (select 1 from room_members me where me.room = r and me.explorer in (select my_explorers()))
$$;

-- Live movement and shared objects go over a Realtime channel named
-- 'room:<id>'. Only members of the room may read or send on it.
create function public.in_room_topic(topic text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from room_members m join rooms r on r.id = m.room
    where 'room:' || m.room::text = topic and not r.closed and m.joined_at is not null
      and m.explorer in (select my_explorers())
  )
$$;

alter table realtime.messages enable row level security;
create policy "room members listen" on realtime.messages for select to authenticated
  using (public.in_room_topic(realtime.topic()));
create policy "room members send" on realtime.messages for insert to authenticated
  with check (public.in_room_topic(realtime.topic()));

-- Lock down: the checked functions are the only way across families.
revoke all on function public.request_friend(uuid, text), public.approve_friend(uuid, uuid), public.open_room(uuid, text),
  public.invite(uuid, uuid), public.join_room(uuid, uuid), public.leave_room(uuid, uuid),
  public.friend_list(uuid), public.room_roster(uuid), public.my_explorers(), public.my_rooms(), public.is_mine(uuid),
  public.are_friends(uuid, uuid), public.may_play_online(uuid), public.in_room_topic(text) from public, anon;
grant execute on function public.request_friend(uuid, text), public.approve_friend(uuid, uuid), public.open_room(uuid, text),
  public.invite(uuid, uuid), public.join_room(uuid, uuid), public.leave_room(uuid, uuid),
  public.friend_list(uuid), public.room_roster(uuid), public.my_explorers(), public.my_rooms(), public.is_mine(uuid),
  public.are_friends(uuid, uuid), public.may_play_online(uuid), public.in_room_topic(text) to authenticated;
