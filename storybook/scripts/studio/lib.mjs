// Shared helpers for the studio browser tests: throwaway accounts with real
// TOTP factors, signing in through the studio's own screens, and waiting.
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const { chromium } = require('playwright');
export const APP = process.env.APP_URL ?? 'http://localhost:8081';
export const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
export const KEY = process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
export const DB = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
export const SHOTS = process.env.SHOTS ?? '/tmp/studio-shots';
fs.mkdirSync(SHOTS, { recursive: true });
export const run = Date.now().toString(36);
export const PW = 'correct horse battery staple 9';
export const sql = (q) => execFileSync('psql', [DB, '-Atc', q], { encoding: 'utf8' }).trim();

let fails = 0;
export const check = (name, ok, extra = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && extra ? `  (${extra})` : ''}`);
};
export const failures = () => fails;

export function totp(secret) {
  const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret) bits += a.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const ctr = Buffer.alloc(8);
  ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = crypto.createHmac('sha1', key).update(ctr).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}

/** A fresh account with a verified TOTP factor and an aal2 session in `c`. */
export async function account(name) {
  const c = createClient(URL, KEY, { auth: { persistSession: false } });
  const email = `${name}-${run}@studio.test`;
  await c.auth.signUp({ email, password: PW });
  const en = await c.auth.mfa.enroll({ factorType: 'totp' });
  const ch = await c.auth.mfa.challenge({ factorId: en.data.id });
  await c.auth.mfa.verify({ factorId: en.data.id, challengeId: ch.data.id, code: totp(en.data.totp.secret) });
  return { email, secret: en.data.totp.secret, c };
}

/** Clear a scope's drafts, versions, publications and tests (repeatable runs). */
export const resetScope = (scope) =>
  sql(`delete from public.test_runs where scope = '${scope}'; delete from public.publications where scope = '${scope}'; delete from public.content_drafts where scope = '${scope}'; delete from public.content_versions where scope = '${scope}'`);

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
  await p.getByTestId('mfa-code').fill(totp(who.secret));
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
