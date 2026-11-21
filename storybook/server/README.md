# Admin Studio server

The Admin Studio's backend: one Node process, one SQLite database file and one
folder of uploaded audio. It replaces Supabase; there is no other service to
sign up for. The children's game works without it (it always has its built-in
worlds) and only reads published content, approved audio and the child-safe
problem reports through it.

Needs Node 20 or newer. It installs three packages: `@libsql/client` (SQLite,
as a local file or a hosted Turso database), `@vercel/blob` (audio files when
hosted on Vercel) and `qrcode` (the authenticator set-up picture).

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

## Putting it online (your own server)

Any host that runs a Node app and keeps files between restarts works (a small
VPS, Hostinger Node.js hosting, Railway, Fly.io with a volume, ...).

- Start command: `node index.mjs` in
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

## Putting it on Vercel

Vercel runs the web app (game and `/admin`) as static files and this server
as one serverless function (`storybook/api/studio.mjs`, wired up by
`storybook/vercel.json`). Vercel functions have no disk that lasts, so on
Vercel the data lives in two hosted services instead of `studio-data/`:

- **Turso** (hosted libSQL, which is SQLite): the same tables and rules as
  `studio.db`, nothing translated. The server creates the tables on first use.
- **Vercel Blob**: uploaded audio. The browser sends a file straight to Blob
  with a token that allows only that one path, one audio type and 10 MB
  (Vercel functions refuse request bodies over 4.5 MB); the server then checks
  what arrived before it counts as uploaded.

Steps (about 15 minutes, all in the browser):

1. **Database.** Make a free database at https://turso.tech (or add "Turso
   Cloud" from the Vercel Marketplace, which fills in the two variables for
   you). Pick the region nearest your Vercel functions (Vercel's default is
   Washington, D.C. `iad1`, so AWS `us-east-1`): each studio action makes
   several database calls. Copy the database URL (`libsql://...`) and make an
   auth token.
2. **Project.** In Vercel: Add New → Project → import `melcii/ar-quran`.
   Set **Root Directory** to `storybook`. Leave the framework as "Other";
   `vercel.json` sets the install and build commands and the output folder.
   The studio code is not on `main` yet: until it is merged, set
   Settings → Git → **Production Branch** to the branch holding this change,
   or use the preview deployment Vercel makes for it.
3. **Environment variables** (Settings → Environment Variables):

   | Name | Value | Needed |
   | --- | --- | --- |
   | `TURSO_DATABASE_URL` | `libsql://your-db-your-org.turso.io` | yes |
   | `TURSO_AUTH_TOKEN` | the token from step 1 | yes |
   | `BLOB_READ_WRITE_TOKEN` | added for you by step 4 | for audio uploads |
   | `STUDIO_SETUP_KEY` | a long random phrase you make up | once, for step 5 |
   | `EXPO_PUBLIC_STUDIO_URL` | leave unset (means "this same site") | no |
   | `CORS_ORIGINS` | e.g. `https://your-site.vercel.app` | no (default: any) |

4. **Audio storage.** Storage → Create → Blob → connect it to this project.
   That adds `BLOB_READ_WRITE_TOKEN`. Then Deployments → Redeploy.
5. **First Super Admin.** With `STUDIO_SETUP_KEY` set and deployed, run once
   (any terminal; on Windows use PowerShell's `curl.exe`):

   ```bash
   curl -X POST https://YOUR-SITE.vercel.app/api/setup/first-admin \
     -H 'Content-Type: application/json' \
     -d '{"key":"YOUR SETUP KEY","email":"you@example.org"}'
   ```

   It answers with a one-time password. It only works while there is no Super
   Admin yet, and wrong keys are slowed down. Then **delete
   `STUDIO_SETUP_KEY`** from Vercel and redeploy. (Or, from a computer with
   this repository: put the two `TURSO_` variables in your shell and run
   `npm run admin -- first-admin you@example.org` in `storybook/server`; the
   password and authenticator reset commands work the same way.)
6. Open `https://YOUR-SITE.vercel.app/admin`, sign in, choose a password and
   set up the authenticator app.

Backups: Turso keeps point-in-time copies on its paid plans; on the free plan,
`turso db shell your-db .dump > backup.sql` saves everything. Audio files stay
in the Blob store.

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
