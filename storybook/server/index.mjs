// The Admin Studio server: one Node process, one SQLite file, one folder of
// uploaded audio. Replaces Supabase. No other services and no AI calls.
//
//   node server/index.mjs            (from storybook/; see server/README.md)
//
// Settings (environment variables):
//   PORT=8787            where to listen
//   STUDIO_DATA=./studio-data   folder for studio.db and uploaded files
//   STATIC_DIR=dist      optional: also serve the exported web app from here
//   OPEN_SIGNUP=1        optional: let anyone create an account (off by default;
//                        staff accounts are made by a Super Admin)
//   CORS_ORIGINS=*       which web origins may call the API (comma separated)
import http from 'node:http';
import crypto from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { openDb, tx } from './db.mjs';
import { E } from './errors.mjs';
import * as auth from './auth.mjs';
import { act, live, liveAudio, read, reportProblem, who as roleCheck } from './studio.mjs';
import { familyAct } from './families.mjs';

const MAX_JSON = 2 * 1024 * 1024;
const MAX_AUDIO = 10 * 1024 * 1024;
const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/aac']);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm', '.webp': 'image/webp' };

export function createServer({ dataDir = process.env.STUDIO_DATA ?? './studio-data', staticDir = process.env.STATIC_DIR, openSignup = process.env.OPEN_SIGNUP === '1', origins = process.env.CORS_ORIGINS ?? '*' } = {}) {
  const data = resolve(dataDir);
  const files = join(data, 'files');
  mkdirSync(files, { recursive: true });
  const db = openDb(join(data, 'studio.db'));
  const allowed = origins.split(',').map((x) => x.trim()).filter(Boolean);
  const deps = { createUser: auth.createUser, tempPassword: auth.tempPassword };

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
    res.end(JSON.stringify(body));
  };
  const fail = (res, e) => {
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
    const path = url.pathname;
    const origin = req.headers.origin;
    if (origin && (allowed.includes('*') || allowed.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', allowed.includes('*') ? '*' : origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') return res.writeHead(204).end();
    const who = auth.caller(db, req);
    const ip = req.socket.remoteAddress ?? '';

    // ---- for the children's game: published content, approved audio, problem reports
    if (path === '/api/health') return send(res, 200, { ok: true });
    if (path === '/api/live' && req.method === 'GET') return send(res, 200, live(db, url.searchParams.get('scope') ?? ''), { 'Cache-Control': 'no-cache' });
    if (path === '/api/live-audio' && req.method === 'GET') return send(res, 200, liveAudio(db, (url.searchParams.get('ids') ?? '').split(','), url.searchParams.get('kind')));
    if (path === '/api/report-problem' && req.method === 'POST') return send(res, 200, reportProblem(db, await body(req, 4096)));
    if (path.startsWith('/files/studio-audio/') && req.method === 'GET') {
      // Public by random path, like the old public bucket.
      const rel = path.slice('/files/studio-audio/'.length);
      const full = /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/.test(rel) ? inside(join(files, 'studio-audio'), rel) : null;
      if (!full || !existsSync(full)) return send(res, 404, { error: { code: 'not_found', message: 'no such file' } });
      return serveFile(res, full, 'public, max-age=31536000, immutable');
    }

    // ---- sign-in
    if (path === '/api/auth/signin' && req.method === 'POST') {
      const b = await body(req);
      return send(res, 200, auth.signIn(db, b.email, b.password, ip));
    }
    if (path === '/api/auth/signup' && req.method === 'POST') {
      if (!openSignup) throw new E('New accounts are made by a Super Admin from Staff & roles.', '42501');
      const b = await body(req);
      return send(res, 200, auth.signUp(db, b.email, b.password));
    }
    if (path === '/api/auth/signout' && req.method === 'POST') return send(res, 200, (auth.signOut(db, who), {}));
    if (path === '/api/auth/me' && req.method === 'GET') return send(res, 200, auth.me(db, who));
    if (path === '/api/auth/password' && req.method === 'POST') return send(res, 200, (auth.changePassword(db, who, (await body(req)).password), {}));
    if (path === '/api/auth/mfa/enroll' && req.method === 'POST') return send(res, 200, await auth.enrol(db, who));
    if (path === '/api/auth/mfa/verify' && req.method === 'POST') {
      const b = await body(req);
      return send(res, 200, (auth.verify(db, who, b.code, b.factorId), {}));
    }

    // ---- the studio
    let m;
    if ((m = /^\/api\/rpc\/([a-z_]+)$/.exec(path)) && req.method === 'POST') return send(res, 200, act(db, who, m[1], await body(req), deps) ?? null);
    if ((m = /^\/api\/read\/([a-z_]+)$/.exec(path)) && req.method === 'GET') return send(res, 200, read(db, who, m[1], url.searchParams));
    if ((m = /^\/api\/family\/([a-z_]+)$/.exec(path)) && req.method === 'POST') return send(res, 200, familyAct(db, who, m[1], await body(req)) ?? null);
    if (path === '/api/upload/studio-audio' && (req.method === 'PUT' || req.method === 'POST')) return upload(req, res, who);

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

  // Audio files: only Audio Editors (with an authenticator session), only
  // into a folder named after their own account; never overwritten.
  async function upload(req, res, who) {
    const w = roleCheck(db, who);
    if (!w.has('audio_editor')) throw new E('audio editors only', '42501');
    const mime = String(req.headers['content-type'] ?? '').split(';')[0].trim();
    if (!AUDIO_TYPES.has(mime)) throw new E('only audio files (mp3, m4a, ogg, wav, webm, aac)');
    const len = Number(req.headers['content-length'] ?? 0);
    if (len > MAX_AUDIO) throw new E('files are at most 10 MB', 'PT413', 413);
    const ext = (new URL(req.url, 'http://x').searchParams.get('ext') ?? 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp3';
    const rel = `${w.uid}/${crypto.randomUUID()}.${ext}`;
    const dir = join(files, 'studio-audio', w.uid);
    mkdirSync(dir, { recursive: true });
    const tmp = join(dir, `.${crypto.randomUUID()}.part`);
    let size = 0;
    await new Promise((ok, no) => {
      const out = createWriteStream(tmp, { flags: 'wx' });
      req.on('data', (c) => {
        size += c.length;
        if (size > MAX_AUDIO) {
          req.destroy();
          out.destroy();
          no(new E('files are at most 10 MB', 'PT413', 413));
        }
      });
      req.pipe(out);
      out.on('finish', ok);
      out.on('error', no);
      req.on('error', no);
    }).catch(async (e) => {
      await rm(tmp, { force: true });
      throw e;
    });
    if (!size) {
      await rm(tmp, { force: true });
      throw new E('the file is empty');
    }
    await rename(tmp, join(files, 'studio-audio', rel));
    tx(db, () => db.prepare('insert into storage_objects (bucket, path, owner, size, mime, created_at) values (?, ?, ?, ?, ?, ?)').run('studio-audio', rel, w.uid, size, mime, new Date().toISOString()));
    send(res, 200, { path: rel });
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((e) => fail(res, e));
  });
  return { server, db };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 8787);
  const host = process.env.HOST ?? '0.0.0.0';
  const { server } = createServer();
  server.listen(port, host, () => console.log(`Admin Studio server on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`));
}
