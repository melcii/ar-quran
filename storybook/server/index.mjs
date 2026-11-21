// The Admin Studio server. Replaces Supabase. No AI calls.
//
// It runs two ways with the same code:
//   - as one Node process on your computer or a server: `npm start` here
//     (data in a SQLite file and a folder of uploaded audio);
//   - on Vercel, as one serverless function (storybook/api/studio.mjs), with a
//     hosted Turso database and Vercel Blob for audio. See README.md.
//
// Settings (environment variables):
//   PORT=8787            where to listen (own server only)
//   STUDIO_DATA=./studio-data   folder for studio.db and uploaded files
//   TURSO_DATABASE_URL, TURSO_AUTH_TOKEN   use a hosted Turso database instead
//   BLOB_READ_WRITE_TOKEN                  keep uploaded audio in Vercel Blob
//   STATIC_DIR=dist      optional: also serve the exported web app from here
//   OPEN_SIGNUP=1        optional: let anyone create an account (off by default;
//                        staff accounts are made by a Super Admin)
//   CORS_ORIGINS=*       which web origins may call the API (comma separated)
//   STUDIO_SETUP_KEY     optional: lets the owner make the first Super Admin over
//                        the network, once, with this secret (for Vercel, where
//                        there is no server to log in to). Remove it afterwards.
import http from 'node:http';
import crypto from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { dataDir as defaultDataDir, openStudioDb } from './config.mjs';
import { tx } from './db.mjs';
import { E } from './errors.mjs';
import * as auth from './auth.mjs';
import { act, live, liveAudio, read, reportProblem, who as roleCheck } from './studio.mjs';
import { familyAct } from './families.mjs';
import { AUDIO_TYPES, FILE_PATH, MAX_AUDIO, blobStorage, diskStorage } from './storage.mjs';
import { firstAdmin } from './admin.mjs';

const MAX_JSON = 2 * 1024 * 1024;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.webm': 'audio/webm', '.aac': 'audio/aac', '.wasm': 'application/wasm', '.webp': 'image/webp' };

/**
 * The request handler and its database.
 * dataDir given: a local SQLite file and folder (tests, own server).
 * dataDir left out: TURSO_DATABASE_URL if set, else STUDIO_DATA.
 */
export function createApp({
  dataDir,
  staticDir = process.env.STATIC_DIR,
  openSignup = process.env.OPEN_SIGNUP === '1',
  origins = process.env.CORS_ORIGINS ?? '*',
  setupKey = process.env.STUDIO_SETUP_KEY,
  blobToken = process.env.BLOB_READ_WRITE_TOKEN,
  storage, // tests only: a stand-in for the file store
} = {}) {
  const db = openStudioDb(dataDir);
  const files = Promise.resolve(storage ?? (blobToken ? blobStorage(blobToken) : diskStorage(join(defaultDataDir(dataDir), 'files'))));
  const allowed = origins.split(',').map((x) => x.trim()).filter(Boolean);
  const deps = { createUser: auth.createUser, tempPassword: auth.tempPassword };

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
    res.end(JSON.stringify(body));
  };
  const fail = (res, e) => {
    if (res.headersSent) return res.end();
    if (e instanceof E) return send(res, e.status, { error: { code: e.code, message: e.message } });
    // SQLite check constraints and the like: the caller sent something not allowed.
    if (e?.code === 'ERR_SQLITE_ERROR') return send(res, 400, { error: { code: 'P0001', message: String(e.message).replace(/^.*?: /, '') } });
    console.error(e);
    send(res, 500, { error: { code: 'internal', message: 'Something went wrong on the server.' } });
  };
  const body = (req, limit = MAX_JSON) =>
    new Promise((ok, no) => {
      let size = 0;
      const parts = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > limit) {
          no(new E('too large', 'PT413', 413));
          req.destroy();
        } else parts.push(c);
      });
      req.on('end', () => {
        if (!parts.length) return ok({});
        try {
          ok(JSON.parse(Buffer.concat(parts).toString('utf8')));
        } catch {
          no(new E('the request body is not JSON'));
        }
      });
      req.on('error', no);
    });

  function serveFile(res, path, cache) {
    const st = statSync(path);
    res.writeHead(200, { 'Content-Type': MIME[extname(path).toLowerCase()] ?? 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache });
    createReadStream(path).pipe(res);
  }
  const inside = (root, p) => {
    const full = resolve(root, '.' + sep + p);
    return full.startsWith(resolve(root) + sep) ? full : null;
  };

  async function handle(req, res) {
    const url = new URL(req.url, 'http://x');
    // On Vercel every /api/* and /files/* address is sent to one function with
    // the original path in __p (see vercel.json).
    let path = url.pathname;
    if (url.searchParams.has('__p')) {
      path = '/' + url.searchParams.get('__p').replace(/^\/+/, '');
      url.searchParams.delete('__p');
    }
    const origin = req.headers.origin;
    if (origin && (allowed.includes('*') || allowed.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', allowed.includes('*') ? '*' : origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') return res.writeHead(204).end();
    if (path === '/api/health') return send(res, 200, { ok: true });
    const who = await auth.caller(db, req);
    // Behind Vercel's proxy the caller's address is the first x-forwarded-for entry.
    const ip = (process.env.VERCEL ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '') || req.socket?.remoteAddress || '';

    // ---- for the children's game: published content, approved audio, problem reports
    if (path === '/api/live' && req.method === 'GET') return send(res, 200, await live(db, url.searchParams.get('scope') ?? ''), { 'Cache-Control': 'no-cache' });
    if (path === '/api/live-audio' && req.method === 'GET') return send(res, 200, await liveAudio(db, (url.searchParams.get('ids') ?? '').split(','), url.searchParams.get('kind')));
    if (path === '/api/report-problem' && req.method === 'POST') return send(res, 200, await reportProblem(db, await body(req, 4096)));
    if (path.startsWith('/files/studio-audio/') && req.method === 'GET') {
      // Public by random path, like the old public bucket.
      const rel = path.slice('/files/studio-audio/'.length);
      const store = await files;
      if (FILE_PATH.test(rel)) {
        if (store.kind === 'disk' && store.send(res, rel, MIME[extname(rel).toLowerCase()])) return;
        if (store.kind === 'blob') {
          const u = (await db.prepare("select url from storage_urls where bucket = 'studio-audio' and path = ?").get(rel))?.url;
          if (u) return res.writeHead(302, { Location: u, 'Cache-Control': 'public, max-age=86400' }).end();
        }
      }
      return send(res, 404, { error: { code: 'not_found', message: 'no such file' } });
    }

    // ---- sign-in
    if (path === '/api/auth/signin' && req.method === 'POST') {
      const b = await body(req);
      return send(res, 200, await auth.signIn(db, b.email, b.password, ip));
    }
    if (path === '/api/auth/signup' && req.method === 'POST') {
      if (!openSignup) throw new E('New accounts are made by a Super Admin from Staff & roles.', '42501');
      const b = await body(req);
      return send(res, 200, await auth.signUp(db, b.email, b.password));
    }
    if (path === '/api/auth/signout' && req.method === 'POST') return send(res, 200, (await auth.signOut(db, who), {}));
    if (path === '/api/auth/me' && req.method === 'GET') return send(res, 200, await auth.me(db, who));
    if (path === '/api/auth/password' && req.method === 'POST') return send(res, 200, (await auth.changePassword(db, who, (await body(req)).password), {}));
    if (path === '/api/auth/mfa/enroll' && req.method === 'POST') return send(res, 200, await auth.enrol(db, who));
    if (path === '/api/auth/mfa/verify' && req.method === 'POST') {
      const b = await body(req);
      return send(res, 200, (await auth.verify(db, who, b.code, b.factorId), {}));
    }
    if (path === '/api/setup/first-admin' && req.method === 'POST') return send(res, 200, await setup(await body(req, 4096), ip));

    // ---- the studio
    let m;
    if ((m = /^\/api\/rpc\/([a-z_]+)$/.exec(path)) && req.method === 'POST') return send(res, 200, (await act(db, who, m[1], await body(req), deps)) ?? null);
    if ((m = /^\/api\/read\/([a-z_]+)$/.exec(path)) && req.method === 'GET') return send(res, 200, await read(db, who, m[1], url.searchParams));
    if ((m = /^\/api\/family\/([a-z_]+)$/.exec(path)) && req.method === 'POST') return send(res, 200, (await familyAct(db, who, m[1], await body(req))) ?? null);
    if (path === '/api/upload/studio-audio' && (req.method === 'PUT' || req.method === 'POST')) return upload(req, res, who, url);
    if (path === '/api/upload/studio-audio/start' && req.method === 'POST') return send(res, 200, await uploadStart(who, await body(req, 4096)));
    if (path === '/api/upload/studio-audio/finish' && req.method === 'POST') return send(res, 200, await uploadFinish(who, await body(req, 4096)));

    // ---- the exported web app, if asked to serve it
    if (staticDir && req.method === 'GET' && !path.startsWith('/api/')) {
      const root = resolve(staticDir);
      const p = decodeURIComponent(path);
      for (const cand of [p, `${p}.html`, `${p.replace(/\/$/, '')}/index.html`]) {
        const full = inside(root, cand);
        if (full && existsSync(full) && statSync(full).isFile()) return serveFile(res, full, /\.html$/.test(full) ? 'no-cache' : 'public, max-age=3600');
      }
      const fallback = join(root, 'index.html');
      if (existsSync(fallback)) return serveFile(res, fallback, 'no-cache');
    }
    send(res, 404, { error: { code: 'not_found', message: 'not found' } });
  }

  // The first Super Admin, over the network: only with STUDIO_SETUP_KEY, and
  // only while there is no Super Admin yet.
  async function setup({ key, email }, ip) {
    if (!setupKey) throw new E('Setting up over the network is off. Use npm run admin -- first-admin <email>.', '42501');
    const miss = await auth.brake(db, `setup:${ip}`);
    const a = Buffer.from(crypto.createHash('sha256').update(String(key ?? '')).digest());
    const b = Buffer.from(crypto.createHash('sha256').update(setupKey).digest());
    if (!crypto.timingSafeEqual(a, b)) {
      await miss();
      throw new E('That set-up key is not right.', '42501');
    }
    if (await db.prepare("select 1 from staff_roles where role = 'super_admin'").get()) throw new E('There is already a Super Admin. Add other staff from Staff & roles.', '42501');
    const e = String(email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new E('That does not look like an email address.');
    const pw = await firstAdmin(db, e);
    return { email: e, password: pw, note: pw ? 'Sign in at /admin with this one-time password, then remove STUDIO_SETUP_KEY from the Vercel settings.' : 'That account already existed; it is now a Super Admin.' };
  }

  // Audio files: only Audio Editors (with an authenticator session), only
  // into a folder named after their own account; never overwritten.
  async function editor(who) {
    const w = await roleCheck(db, who);
    if (!w.has('audio_editor')) throw new E('audio editors only', '42501');
    return w;
  }
  const extOf = (x) => String(x ?? 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp3';
  const record = (rel, owner, size, mime, fileUrl) =>
    tx(db, async () => {
      await db.prepare('insert into storage_objects (bucket, path, owner, size, mime, created_at) values (?, ?, ?, ?, ?, ?)').run('studio-audio', rel, owner, size, mime, new Date().toISOString());
      if (fileUrl) await db.prepare('insert into storage_urls (bucket, path, url) values (?, ?, ?)').run('studio-audio', rel, fileUrl);
    });

  // Through the server (own server; small files on Vercel).
  async function upload(req, res, who, url) {
    const w = await editor(who);
    const mime = String(req.headers['content-type'] ?? '').split(';')[0].trim();
    if (!AUDIO_TYPES.has(mime)) throw new E('only audio files (mp3, m4a, ogg, wav, webm, aac)');
    const len = Number(req.headers['content-length'] ?? 0);
    if (len > MAX_AUDIO) throw new E('files are at most 10 MB', 'PT413', 413);
    const rel = `${w.uid}/${crypto.randomUUID()}.${extOf(url.searchParams.get('ext'))}`;
    const store = await files;
    const out = await store.save(req, rel, mime);
    await record(rel, w.uid, out.size, mime, out.url);
    send(res, 200, { path: rel });
  }

  // Straight to Vercel Blob from the browser: start gives a one-file token...
  async function uploadStart(who, { type, ext }) {
    const w = await editor(who);
    const mime = String(type ?? '').split(';')[0].trim();
    if (!AUDIO_TYPES.has(mime)) throw new E('only audio files (mp3, m4a, ogg, wav, webm, aac)');
    const store = await files;
    if (store.kind !== 'blob') return { mode: 'server' };
    const rel = `${w.uid}/${crypto.randomUUID()}.${extOf(ext)}`;
    return { mode: 'blob', path: rel, ...(await store.ticket(rel, mime)) };
  }
  // ...and finish checks what arrived before it counts as uploaded.
  async function uploadFinish(who, { path: rel }) {
    const w = await editor(who);
    const store = await files;
    if (store.kind !== 'blob') throw new E('uploads go through the server here');
    rel = String(rel ?? '');
    if (!FILE_PATH.test(rel) || rel.split('/')[0] !== w.uid) throw new E('that file was uploaded by someone else', '42501');
    const had = await db.prepare("select owner from storage_objects where bucket = 'studio-audio' and path = ?").get(rel);
    if (had) return { path: rel };
    const got = await store.look(rel);
    if (!got) throw new E('the file did not arrive; try the upload again');
    if (!got.size || got.size > MAX_AUDIO || !AUDIO_TYPES.has(got.mime)) {
      await store.remove(rel);
      throw new E('only audio files of at most 10 MB');
    }
    await record(rel, w.uid, got.size, got.mime, got.url);
    return { path: rel };
  }

  const handler = (req, res) => handle(req, res).catch((e) => fail(res, e));
  return { handler, db };
}

/** The own-server form: an http.Server around the handler. */
export function createServer(opts) {
  const { handler, db } = createApp(opts);
  return { server: http.createServer(handler), db };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 8787);
  const host = process.env.HOST ?? '0.0.0.0';
  const { server } = createServer();
  server.listen(port, host, () => console.log(`Admin Studio server on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`));
}
