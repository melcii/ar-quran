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

# Admin Studio (0002_admin_studio.sql)

Staff roles, the audit log, versioned content (draft, submitted, approved,
published), publishing, rollback, test results and bug reports.

## Setting it up on the real project

1. Apply the migrations: `npx supabase link --project-ref <ref>` then
   `npx supabase db push` (or paste each file into the SQL editor, in order).
   Take a backup first (Database > Backups).
2. Turn on TOTP multi-factor sign-in (Authentication > Multi-Factor; it is on
   by default on hosted projects).
3. Sign up once at `/admin` with the email you want as the first Super Admin
   (or create the user under Authentication > Users), then in the SQL editor:
   `select public.studio_bootstrap_super_admin('you@example.org');`
   This function cannot be called through the API.
4. Sign in at `/admin`, set up your authenticator, and add other staff from
   Staff & roles (they sign up first).
5. Give the app `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.local.example`). Never put
   the secret / service-role key in the app.

## Rules the database enforces

- Every staff permission needs a multi-factor (aal2) session.
- Tables are read through row-level policies; all writes go through checked
  functions that test roles and write the audit log. The audit log cannot be
  updated or deleted, even by the database owner.
- Story Editors change wording, ayah references and records; World Editors
  change positions, sizes, colours and scenery; Moderators cannot edit
  content. Quran-linked changes (references and the readings that explain
  them) need a Quran Content Reviewer, and nobody approves their own
  Quran-linked change. Only a Super Admin publishes or rolls back.
- Arabic script is refused in edited content: the Quran text comes only from
  the app's verified dataset. Ayah references must exist.
- Publishing and rollback only move the published pointer; `saves` (player
  progress) is never touched.
- Audio (0003): files go to the `studio-audio` bucket, uploaded only by Audio
  Editors into their own folder. Recitation must be a named human reciter's
  recording with a confirmed licence and is approved only by a Quran Content
  Reviewer; synthetic recitation is refused by a check constraint. There is
  no music category. Nobody approves their own upload. Players can read only
  approved files (the `live_audio` view).
- The Ark settings (scope `ark:slice`): positions and numbers are World
  Editor changes, wording is Story Editor changes, with limits checked on the
  server.

## Checking it locally

Apply every migration in order (0001 to 0004).

`npx supabase start` (from `storybook/`), then:

- `npm run studio:access`: 61 server-side checks with real accounts and TOTP.
- `npm run studio:e2e` with the web app running against the local stack
  (see the header of `scripts/studio/e2e.mjs`): sign-in with MFA, edit,
  autosave, undo/redo, submit, check, approve, publish, see it in the game,
  play test without touching saves, roll back, and no AI requests.
- `node scripts/studio/e2e-world.mjs`: the Maryam rock acceptance run
  (3D world editor, collision test, publish, re-enter, roll back).
- `npm run studio:e2e-phase3`: activity from a template with the logic
  editor, the Ark giraffe settings end to end, audio upload / review /
  assignment, recitation rules, and the Character Studio.
- `npm run studio:no-ai`: no AI SDK or API host in the studio code.

In this cloud container the realtime image needed an IPv4 patch and images
came from Docker Hub (`SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`); neither
is needed on an ordinary machine.
