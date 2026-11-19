# Admin Studio server

The Admin Studio's backend: one Node process, one SQLite database file and one
folder of uploaded audio. It replaces Supabase; there is no other service to
sign up for. The children's game works without it (it always has its built-in
worlds) and only reads published content, approved audio and the child-safe
problem reports through it.

Needs Node 22.13 or newer (it uses the built-in `node:sqlite`). The only
package it installs is `qrcode`, for the authenticator set-up picture.

## Running it on your computer

```bash
cd storybook/server
npm install
npm start                      # http://localhost:8787
```

Then make yourself the first Super Admin (this can only be done by the person
running the server, never over the network):

```bash
npm run admin -- first-admin you@example.org
```

It prints a one-time password. Point the app at the server and open `/admin`:

```bash
cd storybook
echo "EXPO_PUBLIC_STUDIO_URL=http://localhost:8787" > .env.local
npx expo start --web
```

Sign in with the one-time password, choose your own password, and scan the
QR code with an authenticator app (Google Authenticator, Microsoft
Authenticator, 1Password...). Add other staff from **Staff & roles**: giving a
role to a new email makes their account and shows you a one-time password to
pass on.

Other jobs for the person running the server:

```bash
npm run admin -- reset-password someone@example.org
npm run admin -- reset-authenticator someone@example.org   # lost phone
```

## Putting it online

Any host that runs a Node app and keeps files between restarts works (a small
VPS, Hostinger Node.js hosting, Railway, Fly.io with a volume, ...).

- Start command: `node --disable-warning=ExperimentalWarning index.mjs` in
  `storybook/server` (after `npm install`).
- `STUDIO_DATA` is the folder for `studio.db` and the uploaded files. It must
  survive restarts and redeploys. **Back it up**: copying that folder is the
  whole backup.
- `PORT` (default 8787) and `HOST` (default 0.0.0.0).
- Serve it over HTTPS (the host's certificate or a proxy in front).
- Build the app with `EXPO_PUBLIC_STUDIO_URL=https://your-studio-address`.
- Optional: `STATIC_DIR=../dist` also serves the exported web app
  (`npx expo export --platform web`) from the same address, so one process
  hosts both the game and the studio.
- Optional: `CORS_ORIGINS=https://your-game-address` limits which web pages
  may call the API (default: any, since sign-in uses tokens, not cookies).
- Optional: `OPEN_SIGNUP=1` lets anyone create an account (off by default;
  only needed once family accounts come to the game).

## What the server enforces

The same rules the Supabase version had; the studio screens only decide what
to show.

- Accounts: email and password (scrypt hashes), session tokens (12 hours),
  authenticator codes (TOTP, each code works once). Repeated wrong passwords
  or codes are slowed down.
- Every staff permission needs a session that has passed the authenticator
  code. Without it a staff member sees their own role names, nothing else.
- All writes go through checked actions (`studio.mjs`) that test roles and
  write the audit log. The audit log cannot be changed or deleted, not even
  directly in the database file (triggers refuse it).
- Story Editors change wording, ayah references and records; World Editors
  change positions, sizes, colours and scenery; Moderators cannot edit
  content. Quran-linked changes need a Quran Content Reviewer, and nobody
  approves their own Quran-linked change. Only a Super Admin publishes or
  rolls back.
- Arabic script is refused in edited content: the Quran text comes only from
  the app's verified dataset. Ayah references must exist.
- Publishing and rollback only move the published pointer; player saves are
  never touched.
- Audio: only Audio Editors upload, into a folder of their own; files are
  never overwritten. Recitation must be a named human reciter's recording
  with a confirmed licence, approved only by a Quran Content Reviewer. There
  is no music category. Nobody approves their own upload. Players get only
  approved files.
- Bugs: player reports are child-safe (a world, one of six fixed choices, a
  screen size; no text, no account), at most 30 a minute, readable only by
  staff.
- Moderation, settings and releases: Moderators see only a report's reason,
  time, room world and the reported nickname; they can pause online play (1
  to 30 days), replace a nickname or close a room. Online play settings and
  the room actions obey what is published.
- Family accounts, explorers, friends and rooms (`families.mjs`) are a draft
  for legal and technical review, as before. The game has no family sign-in
  or multiplayer screens yet; the live room channel (Supabase Realtime in the
  old draft) is not part of this server and would be added with multiplayer.

## API (for the app)

| | |
|---|---|
| `GET /api/live?scope=surah:19` | published overlay for a world (players) |
| `GET /api/live-audio?ids=...&kind=narration` | approved audio (players) |
| `GET /files/studio-audio/<path>` | an audio file (players) |
| `POST /api/report-problem` | child-safe problem report (players) |
| `POST /api/auth/signin`, `/signout`, `/password`, `/mfa/enroll`, `/mfa/verify`; `GET /api/auth/me` | sign-in |
| `POST /api/rpc/<action>` | studio actions (`studio_save_draft`, `studio_publish`, ...) |
| `GET /api/read/<table>?scope=&id=&limit=` | staff reads |
| `PUT /api/upload/studio-audio?ext=mp3` | audio upload (Audio Editors) |
| `POST /api/family/<action>` | family accounts (draft) |

## Tests

```bash
cd storybook/server && npm test        # 100+ access checks on a throwaway server
```

The browser tests (`npm run studio:e2e`, `studio:e2e-phase3`/`4`/`5` from
`storybook/`) run against a server started with `npm start` and the app
started with `EXPO_PUBLIC_STUDIO_URL` pointing at it; see
`scripts/studio/e2e.mjs`.
