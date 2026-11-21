// Checks for running the studio on Vercel (serverless functions, a hosted
// database, Vercel Blob), using a local database file and a stand-in blob
// store so no account or network is needed:
//
//   cd storybook/server && npm test
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, createServer } from '../index.mjs';
import { totpAt } from '../auth.mjs';

let failures = 0;
let passes = 0;
function check(name, ok, extra) {
  if (ok) passes++;
  else failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && extra ? `  (${extra})` : ''}`);
}
const dirs = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'studio-vercel-'));
  dirs.push(d);
  return d;
};
async function start(opts) {
  const { server, db } = createServer(opts);
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (token, method, path, body, headers = {}) => {
    const r = await fetch(base + path, {
      method,
      redirect: 'manual',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined && !(body instanceof Uint8Array) ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body === undefined ? undefined : body instanceof Uint8Array ? body : JSON.stringify(body),
    });
    const j = await r.json().catch(() => null);
    return { status: r.status, data: r.ok ? j : null, error: r.ok ? null : j?.error ?? { message: `HTTP ${r.status}` }, location: r.headers.get('location') };
  };
  return { server, db, call, base };
}
const PW = 'correct horse battery staple 9';
const code = (secret) => totpAt(secret, Math.floor(Date.now() / 30000));

// 1. Vercel sends every /api/* address to one function with the path in __p.
{
  const s = await start({ dataDir: tmp() });
  const h = await s.call(null, 'GET', '/api/studio?__p=api/health');
  const l = await s.call(null, 'GET', `/api/studio?__p=${encodeURIComponent('api/live')}&scope=surah:1`);
  check('requests rewritten by vercel.json reach the right route', h.data?.ok === true && Array.isArray(l.data), JSON.stringify([h, l]));
  s.server.close();
}

// 2. The function file Vercel runs (storybook/api/studio.mjs) loads and answers.
{
  process.env.STUDIO_DATA = tmp();
  const fn = (await import('../../api/studio.mjs')).default;
  const { server } = { server: (await import('node:http')).createServer(fn) };
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const r = await fetch(`http://127.0.0.1:${server.address().port}/api/studio?__p=api/live&scope=ark:slice`);
  check('the Vercel function answers', r.ok && Array.isArray(await r.json()));
  server.close();
}

// 3. First Super Admin over the network, only with the set-up key, only once.
{
  const off = await start({ dataDir: tmp() });
  const o = await off.call(null, 'POST', '/api/setup/first-admin', { key: 'x', email: 'a@b.test' });
  check('network set-up is off unless STUDIO_SETUP_KEY is set', o.status === 403, JSON.stringify(o));
  off.server.close();
  const s = await start({ dataDir: tmp(), setupKey: 'a long secret set-up key' });
  const bad = await s.call(null, 'POST', '/api/setup/first-admin', { key: 'wrong', email: 'owner@studio.test' });
  const ok = await s.call(null, 'POST', '/api/setup/first-admin', { key: 'a long secret set-up key', email: 'owner@studio.test' });
  const again = await s.call(null, 'POST', '/api/setup/first-admin', { key: 'a long secret set-up key', email: 'other@studio.test' });
  const signin = await s.call(null, 'POST', '/api/auth/signin', { email: 'owner@studio.test', password: ok.data?.password });
  const me = await s.call(signin.data?.token, 'GET', '/api/auth/me');
  check('a wrong set-up key is refused', bad.status === 403, JSON.stringify(bad));
  check('the right key makes the first Super Admin with a one-time password', !!ok.data?.password && me.data?.must_change_password === true, JSON.stringify(ok));
  check('once there is a Super Admin, the set-up key does nothing', again.status === 403 && !(await s.db.prepare("select 1 from users where email = 'other@studio.test'").get()));
  s.server.close();
}

// 4. Many requests at once (Vercel and browsers send them in parallel).
{
  const s = await start({ dataDir: tmp(), openSignup: true });
  const rs = await Promise.all([
    ...Array.from({ length: 15 }, (_, i) => s.call(null, 'POST', '/api/auth/signup', { email: `p${i}@studio.test`, password: PW })),
    ...Array.from({ length: 15 }, () => s.call(null, 'POST', '/api/report-problem', { p_surah: 2, p_category: 'stuck', p_screen: '800x600' })),
  ]);
  check('30 requests at once all succeed (no "database is locked")', rs.every((r) => !r.error), rs.filter((r) => r.error).map((r) => r.error.message).join('; '));
  s.server.close();
}

// 5. The brake on password guessing holds across server instances.
{
  const dir = tmp();
  const a = await start({ dataDir: dir, openSignup: true });
  await a.call(null, 'POST', '/api/auth/signup', { email: 'guess@studio.test', password: PW });
  for (let i = 0; i < 8; i++) await a.call(null, 'POST', '/api/auth/signin', { email: 'guess@studio.test', password: `wrong ${i}` });
  const b = await start({ dataDir: dir });
  const r = await b.call(null, 'POST', '/api/auth/signin', { email: 'guess@studio.test', password: PW });
  check('after 8 wrong passwords, another instance also says wait', r.status === 429, JSON.stringify(r));
  a.server.close();
  b.server.close();
}

// 6. Audio in Vercel Blob: the browser uploads straight to Blob with a
// one-file token; the server checks what arrived before it counts.
{
  const blobs = new Map();
  const tickets = [];
  const fake = {
    kind: 'blob',
    async save(req, rel, mime) {
      const parts = [];
      for await (const c of req) parts.push(c);
      const size = Buffer.concat(parts).length;
      blobs.set(rel, { size, mime, url: `https://blob.test/studio-audio/${rel}` });
      return { size, url: blobs.get(rel).url };
    },
    async ticket(rel, mime) {
      tickets.push({ rel, mime });
      return { pathname: `studio-audio/${rel}`, clientToken: `token-for-${rel}` };
    },
    async look(rel) {
      return blobs.get(rel) ?? null;
    },
    async remove(rel) {
      blobs.delete(rel);
    },
  };
  const s = await start({ dataDir: tmp(), openSignup: true, storage: fake });
  async function editor(name, roles) {
    const u = await s.call(null, 'POST', '/api/auth/signup', { email: `${name}@studio.test`, password: PW });
    const en = await s.call(u.data.token, 'POST', '/api/auth/mfa/enroll');
    await s.call(u.data.token, 'POST', '/api/auth/mfa/verify', { factorId: en.data.id, code: code(en.data.secret) });
    for (const r of roles) await s.db.prepare('insert into staff_roles (user_id, role, granted_at) values (?, ?, ?)').run(u.data.user, r, new Date().toISOString());
    return u.data.token;
  }
  const a = await editor('audio-a', ['audio_editor']);
  const b = await editor('audio-b', ['audio_editor']);
  const w = await editor('world', ['world_editor']);

  const ws = await s.call(w, 'POST', '/api/upload/studio-audio/start', { type: 'audio/mpeg', ext: 'mp3' });
  check('only Audio Editors get an upload token', ws.status === 403, JSON.stringify(ws));
  const html = await s.call(a, 'POST', '/api/upload/studio-audio/start', { type: 'text/html', ext: 'html' });
  check('no upload token for files that are not audio', !!html.error);
  const st = await s.call(a, 'POST', '/api/upload/studio-audio/start', { type: 'audio/mpeg', ext: 'mp3' });
  check('an Audio Editor gets a token for one path in their own folder', st.data?.mode === 'blob' && st.data.path.startsWith(`${(await s.call(a, 'GET', '/api/auth/me')).data.user}/`) && tickets.at(-1)?.mime === 'audio/mpeg', JSON.stringify(st));
  const early = await s.call(a, 'POST', '/api/upload/studio-audio/finish', { path: st.data.path });
  check('finishing before the file arrived is refused', !!early.error && /did not arrive/.test(early.error.message), JSON.stringify(early));
  blobs.set(st.data.path, { size: 20, mime: 'audio/mpeg', url: `https://blob.test/studio-audio/${st.data.path}` });
  const steal = await s.call(b, 'POST', '/api/upload/studio-audio/finish', { path: st.data.path });
  check('nobody can claim a file in someone else\'s folder', steal.status === 403, JSON.stringify(steal));
  const fin = await s.call(a, 'POST', '/api/upload/studio-audio/finish', { path: st.data.path });
  check('finishing records the upload', fin.data?.path === st.data.path, JSON.stringify(fin));
  const st2 = await s.call(a, 'POST', '/api/upload/studio-audio/start', { type: 'audio/mpeg', ext: 'mp3' });
  blobs.set(st2.data.path, { size: 20, mime: 'text/html', url: 'https://blob.test/x' });
  const wrong = await s.call(a, 'POST', '/api/upload/studio-audio/finish', { path: st2.data.path });
  check('a file that arrived as something other than audio is refused and deleted', !!wrong.error && !blobs.has(st2.data.path), JSON.stringify(wrong));

  const reg = await s.call(a, 'POST', '/api/rpc/studio_audio_register', { p: { kind: 'narration', path: st.data.path, title: 'Welcome line', origin: 'human_recording', licence: 'Our own recording', licence_confirmed: true, line_text: 'Welcome to the grove.' } });
  const appr = await s.call(b, 'POST', '/api/rpc/studio_audio_review', { p_id: reg.data, p_decision: 'approve', p_note: 'clear' });
  const file = await s.call(null, 'GET', `/files/studio-audio/${st.data.path}`);
  check('approved audio in Blob is registered, reviewed and served (redirect to Blob)', !reg.error && !appr.error && file.status === 302 && file.location === `https://blob.test/studio-audio/${st.data.path}`, JSON.stringify([reg.error, appr.error, file.status]));
  const small = await s.call(a, 'PUT', '/api/upload/studio-audio?ext=mp3', new Uint8Array(30), { 'Content-Type': 'audio/mpeg' });
  const small2 = await s.call(null, 'GET', `/files/studio-audio/${small.data?.path}`);
  check('small files can still go through the server into Blob', !small.error && small2.status === 302, JSON.stringify(small));
  const none = await s.call(null, 'GET', `/files/studio-audio/${st2.data.path}`);
  check('files never recorded are not served', none.status === 404);
  s.server.close();
}

// 7. createApp can be used without an http server (as the Vercel function does).
check('createApp gives a handler and a database', typeof createApp({ dataDir: tmp() }).handler === 'function');

console.log(`\n${passes} passed, ${failures} failed`);
for (const d of dirs) rmSync(d, { recursive: true, force: true });
process.exit(failures ? 1 : 0);
