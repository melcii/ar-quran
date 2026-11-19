// Shared helpers for the studio browser tests: throwaway accounts with real
// TOTP factors, signing in through the studio's own screens, and waiting.
// They talk to the studio server (storybook/server) over HTTP and read its
// SQLite file directly to check what was stored.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createUser } from '../../server/auth.mjs';
import { totpAt } from '../../server/auth.mjs';

const require = createRequire(import.meta.url);
export const { chromium } = require('playwright');
export const APP = process.env.APP_URL ?? 'http://localhost:8081';
export const STUDIO = (process.env.STUDIO_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '');
const root = new URL('../..', import.meta.url).pathname;
export const DATA = path.resolve(root, process.env.STUDIO_DATA ?? 'server/studio-data');
export const db = new DatabaseSync(path.join(DATA, 'studio.db'));
db.exec('pragma busy_timeout = 5000');
export const SHOTS = process.env.SHOTS ?? '/tmp/studio-shots';
fs.mkdirSync(SHOTS, { recursive: true });
export const run = Date.now().toString(36);
export const PW = 'correct horse battery staple 9';
/** Like psql -At: the rows' columns joined by | and rows by new lines (SQLite booleans are 1/0). */
export const sql = (q, ...args) => {
  if (!args.length && /;\s*\S/.test(q)) {
    db.exec(q);
    return '';
  }
  const st = db.prepare(q);
  if (!/^\s*(select|with)\b/i.test(q) && !/returning/i.test(q)) {
    st.run(...args);
    return '';
  }
  return st
    .all(...args)
    .map((r) => Object.values(r).map((v) => (v == null ? '' : String(v))).join('|'))
    .join('\n');
};

let fails = 0;
export const check = (name, ok, extra = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && extra ? `  (${extra})` : ''}`);
};
export const failures = () => fails;

export const totp = (secret, offset = 0) => totpAt(secret, Math.floor(Date.now() / 30000) + offset);

async function call(token, method, p, body, headers = {}) {
  const r = await fetch(STUDIO + p, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined && !(body instanceof Uint8Array) ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body === undefined ? undefined : body instanceof Uint8Array ? body : JSON.stringify(body),
  });
  const j = await r.json().catch(() => null);
  return r.ok ? { data: j, error: null } : { data: null, error: j?.error ?? { message: `HTTP ${r.status}` } };
}
/** An API client for one signed-in session (token null: anonymous). */
export const client = (token) => ({
  token,
  call: (method, p, body, headers) => call(token, method, p, body, headers),
  rpc: (name, args = {}) => call(token, 'POST', `/api/rpc/${name}`, args),
  read: (table, params = {}) => call(token, 'GET', `/api/read/${table}?${new URLSearchParams(params)}`),
  fam: (name, args = {}) => call(token, 'POST', `/api/family/${name}`, args),
});

/** A fresh account; with mfa, a verified authenticator and an aal2 session in `c`. */
export async function account(name, { mfa = true } = {}) {
  const email = `${name}-${run}@studio.test`;
  const id = createUser(db, email, PW);
  const s = await call(null, 'POST', '/api/auth/signin', { email, password: PW });
  if (s.error) throw new Error(s.error.message);
  const c = client(s.data.token);
  let secret = null;
  if (mfa) {
    const en = await c.call('POST', '/api/auth/mfa/enroll');
    secret = en.data.secret;
    const v = await c.call('POST', '/api/auth/mfa/verify', { factorId: en.data.id, code: totp(secret) });
    if (v.error) throw new Error(v.error.message);
  }
  return { id, email, secret, c };
}

/** Make the first Super Admin the way the person running the server does. */
export const firstAdmin = (email) =>
  execFileSync(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(root, 'server/admin.mjs'), 'first-admin', email], { env: { ...process.env, STUDIO_DATA: DATA }, encoding: 'utf8' });

/** Clear a scope's drafts, versions, publications and tests (repeatable runs). */
export const resetScope = (scope) =>
  db.exec(`delete from test_runs where scope = '${scope}'; update content_drafts set base_version = null where scope = '${scope}'; delete from publications where scope = '${scope}'; delete from content_drafts where scope = '${scope}'; update releases set state = 'cancelled' where state = 'planned'; delete from content_versions where scope = '${scope}'`);

export async function browser() {
  const b = await chromium.launch();
  const requests = [];
  const page = async () => {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    p.on('request', (r) => requests.push(r.url()));
    p.on('pageerror', (e) => console.log('  page error:', e.message.slice(0, 200)));
    return p;
  };
  return { b, page, requests };
}

export async function signIn(p, who) {
  await p.goto(`${APP}/admin`);
  await p.getByTestId('email').fill(who.email);
  await p.getByTestId('password').fill(PW);
  await p.getByTestId('sign-in').click();
  await p.getByTestId('mfa-code').waitFor({ timeout: 30000 });
  // A code can be used once: wait for a fresh one if this account just used the current one.
  await p.getByTestId('mfa-code').fill(await freshCode(who));
  await p.getByTestId('mfa-verify').click();
  await p.getByText('Total surahs').first().waitFor({ timeout: 30000 });
}

export const until = async (p, f, ms = 60000, arg) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const v = await p.evaluate(f, arg);
      if (v) return v;
    } catch {}
    await p.waitForTimeout(500);
  }
  return null;
};

/** Open a page that shares another page's studio sign-in (for play tests in a new tab). */
export async function sharing(page, from) {
  const p = await page();
  await p.goto(`${APP}/admin`);
  const store = await from.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await p.evaluate((s) => Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v)), store);
  return p;
}

export const AI_HOSTS = /anthropic|openai|generativelanguage|mistral|cohere|huggingface|replicate|groq|perplexity|elevenlabs/i;

/** The next authenticator code this account has not used yet (each code works once). */
export async function freshCode(who) {
  for (;;) {
    const step = Math.floor(Date.now() / 30000);
    const used = Number(sql('select max(last_step) from mfa_factors where user_id = ?', who.id) || 0);
    // The server accepts the next 30-second code too, so there is rarely a wait.
    if (step > used) return totp(who.secret);
    if (step + 1 > used) return totp(who.secret, 1);
    await new Promise((r) => setTimeout(r, 1000));
  }
}
