grant all on all tables in schema public to authenticated, anon;
grant all on all sequences in schema public to authenticated;
grant select, insert on realtime.messages to authenticated;
grant usage on all sequences in schema realtime to authenticated;
insert into auth.users values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b'), ('00000000-0000-0000-0000-00000000000c');
insert into guardians values ('00000000-0000-0000-0000-00000000000a', now(), now(), true, true), ('00000000-0000-0000-0000-00000000000b', now(), now(), true, true), ('00000000-0000-0000-0000-00000000000c', now(), null, false, true);
insert into explorers (id, guardian, nickname) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','Swift Falcon'), ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000b','Quiet Dove'), ('30000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000000c','Kind Fig');
select friend_code as bcode from explorers where id='20000000-0000-0000-0000-000000000002' \gset
select friend_code as ccode from explorers where id='30000000-0000-0000-0000-000000000003' \gset
set role authenticated;
set test.uid = '00000000-0000-0000-0000-00000000000a';
select request_friend('10000000-0000-0000-0000-000000000001', :'bcode') is not null as req;
select 'A asks C, multiplayer off (expect error)'; select request_friend('10000000-0000-0000-0000-000000000001', :'ccode');
select open_room('10000000-0000-0000-0000-000000000001', '11') as room \gset
set test.uid = '00000000-0000-0000-0000-00000000000b';
select approve_friend('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001');
set test.uid = '00000000-0000-0000-0000-00000000000a';
select invite(:'room', '20000000-0000-0000-0000-000000000002');
set test.uid = '00000000-0000-0000-0000-00000000000b';
select join_room('20000000-0000-0000-0000-000000000002', :'room');
select set_config('test.topic', 'room:' || :'room', false) is not null;
insert into realtime.messages (topic, payload) values (realtime.topic(), '{"x":1}');
select 'B sees channel msgs (expect 1)', count(*) from realtime.messages;
set test.uid = '00000000-0000-0000-0000-00000000000c';
select 'C sends (expect RLS error)'; insert into realtime.messages (topic, payload) values (realtime.topic(), '{"x":2}');
select 'C sees channel msgs (expect 0)', count(*) from realtime.messages;
set role anon;
select 'anon calls open_room (expect permission error)'; select open_room('10000000-0000-0000-0000-000000000001', '1');
