# Supabase backend (draft)

Accounts, explorer profiles, saves, friends and private rooms for Quran Adventure.
Not connected yet: it needs the project's URL and publishable key.

- `migrations/0001_accounts_rooms.sql`: tables, row-level access rules and the
  checked functions (friend requests, approvals, rooms of 2 to 4, invites,
  joining, the Realtime channel rule for `room:<id>`).
- Only grown-ups sign in. Each child is an explorer profile with a nickname and
  a look; no real name, birthday, photo, contact detail or location is stored.
- Children cannot be searched for. Friends are added by a code the grown-ups
  exchange, and both grown-ups must approve. Multiplayer is off until a
  grown-up turns it on and confirms consent.
- Deleting the grown-up's account deletes all their explorers, saves and rooms.

This is a draft for legal and technical review. It makes no claim of
compliance with any child-privacy law.

## Checking it on a local Postgres

`tests/local-stub.sql` stands in for Supabase's `auth` and `realtime` schemas.
Run it, then the migration, then `tests/access-checks.sql`; each line says what
to expect (checked 2026-11-04 on Postgres 16).
