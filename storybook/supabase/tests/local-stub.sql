do $$ begin if not exists (select 1 from pg_roles where rolname=$q$anon$q$) then create role anon nologin; create role authenticated nologin; end if; end $$;
create schema auth; create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create schema realtime; create table realtime.messages (id bigserial primary key, topic text, payload jsonb);
create function realtime.topic() returns text language sql stable as $$ select current_setting('test.topic', true) $$;
grant usage on schema public, auth, realtime to authenticated, anon;
grant execute on function auth.uid(), realtime.topic() to authenticated, anon;
