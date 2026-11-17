// Browser test of the Admin Studio against a real local Supabase.
//
//   npx supabase start
//   EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local key> npx expo start --web --port 8081
//   node scripts/studio/e2e.mjs
//
// It makes fresh accounts with real TOTP factors, then in Chromium: an
// ordinary account is turned away; a Story Editor signs in with MFA, opens
// Surah Maryam, edits the welcome narration, autosaves and submits; a Super
// Admin runs the checks, approves and publishes; the game then shows the
// new narration; rollback brings the old one back; play-test progress stays
// apart from player saves. Every network request is recorded, and any call
// to an AI model's API fails the test.
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const APP = process.env.APP_URL ?? 'http://localhost:8081';
const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const KEY = process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const DB = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const SHOTS = process.env.SHOTS ?? '/tmp/studio-shots';
fs.mkdirSync(SHOTS, { recursive: true });
const run = Date.now().toString(36);
const PW = 'correct horse battery staple 9';

let fails = 0;
const check = (name, ok, extra = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && extra ? `  (${extra})` : ''}`);
};

function totp(secret, offset = 0) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret.replace(/=+$/, '').toUpperCase()) bits += alpha.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const ctr = Buffer.alloc(8);
  ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offset));
  const h = crypto.createHmac('sha1', key).update(ctr).digest();
  const o = h[h.length - 1] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0');
}

async function account(name, mfa = true) {
  const c = createClient(URL, KEY, { auth: { persistSession: false } });
  const email = `${name}-${run}@studio.test`;
  const r = await c.auth.signUp({ email, password: PW });
  if (r.error) throw r.error;
  let secret = null;
  if (mfa) {
    const en = await c.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'e2e' });
    secret = en.data.totp.secret;
    const ch = await c.auth.mfa.challenge({ factorId: en.data.id });
    await c.auth.mfa.verify({ factorId: en.data.id, challengeId: ch.data.id, code: totp(secret) });
  }
  return { email, secret, c };
}

const owner = await account('e2e-owner');
const editor = await account('e2e-editor');
const plain = await account('e2e-parent', false);
execFileSync('psql', [DB, '-Atc', `select public.studio_bootstrap_super_admin('${owner.email}')`]);
await owner.c.rpc('studio_set_role', { p_email: editor.email, p_role: 'story_editor', p_on: true });
// Start from a clean slate for Maryam so the test is repeatable.
execFileSync('psql', [DB, '-Atc', `delete from public.content_drafts where scope = 'surah:19'`]);
await owner.c.rpc('studio_rollback', { p_scope: 'surah:19', p_version: null, p_note: 'e2e reset' });

const browser = await chromium.launch();
const requests = [];
async function page() {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  p.on('request', (r) => requests.push(r.url()));
  p.on('pageerror', (e) => console.log('  page error:', e.message.slice(0, 200)));
  return p;
}
async function signIn(p, who) {
  await p.goto(`${APP}/admin`);
  await p.getByTestId('email').fill(who.email);
  await p.getByTestId('password').fill(PW);
  await p.getByTestId('sign-in').click();
  if (who.secret) {
    await p.getByTestId('mfa-code').waitFor({ timeout: 30000 });
    await p.getByTestId('mfa-code').fill(totp(who.secret));
    await p.getByTestId('mfa-verify').click();
  }
}
const textOn = async (p, t, ms = 30000) => {
  try {
    await p.getByText(t, { exact: false }).first().waitFor({ timeout: ms });
    return true;
  } catch {
    return false;
  }
};

const NEW_WELCOME = `Welcome to the Quiet Grove (studio edit ${run}). Answer without words: point at what the story speaks of.`;

// 1. The children's game shows no studio tools.
{
  const p = await page();
  await p.goto(`${APP}/`);
  await p.waitForTimeout(4000);
  const html = await p.content();
  check('the home screen has no link to the studio', !/\/admin|Admin Studio/.test(html));
  await p.close();
}

// 2. An account without a role is turned away.
{
  const p = await page();
  await signIn(p, plain);
  check('an ordinary account sees "no studio role" and no dashboard', (await textOn(p, 'no studio role')) && !(await p.getByText('Dashboard').count()));
  await p.screenshot({ path: `${SHOTS}/0-not-staff.png` });
  await p.close();
}

// 3. The Story Editor signs in with MFA and edits Maryam's narration.
let welcomeOld = '';
{
  const p = await page();
  await signIn(p, editor);
  check('Story Editor reaches the dashboard after the authenticator code', await textOn(p, 'Total surahs'));
  const total = await p.getByTestId('tile-Total surahs').innerText();
  check('dashboard shows 114 surahs from the dataset', total.trim() === '114', total);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${SHOTS}/1-dashboard.png`, fullPage: true });
  await p.getByTestId('surah-search').fill('Maryam');
  await p.getByTestId('open-19').click();
  check('Surah Maryam opens', await textOn(p, 'The Quiet Grove'));
  const field = p.getByTestId('field-welcome');
  await field.waitFor({ timeout: 20000 });
  welcomeOld = await field.inputValue();
  await field.fill(NEW_WELCOME);
  check('the edit autosaves as a draft', await textOn(p, 'Draft saved', 15000), await p.getByTestId('save-state').innerText());
  await p.screenshot({ path: `${SHOTS}/2-story-editor.png` });
  // Undo and redo.
  await p.getByTestId('undo').click();
  check('undo restores the previous text', (await field.inputValue()) === welcomeOld);
  await p.getByTestId('redo').click();
  check('redo brings the edit back', (await field.inputValue()) === NEW_WELCOME);
  await textOn(p, 'Draft saved', 15000);
  // Arabic cannot be typed into narration.
  await field.fill(NEW_WELCOME + ' بسم');
  check('Arabic script in narration is flagged before submitting', await textOn(p, 'Arabic script is not allowed', 5000));
  await field.fill(NEW_WELCOME);
  await textOn(p, 'Draft saved', 15000);
  await p.getByTestId('submit-note').fill('Clearer welcome for Maryam');
  await p.getByTestId('submit').click();
  check('the draft is submitted for review', await textOn(p, 'Submitted for review'));
  check('the editor sees no publish button', (await p.getByTestId('publish-1').count()) === 0 && !(await p.getByText('Publish now').count()));
  await p.close();
}

// 4. The Super Admin checks, approves and publishes.
{
  const p = await page();
  await signIn(p, owner);
  await textOn(p, 'Total surahs');
  await p.goto(`${APP}/admin/surah/19`);
  await p.getByTestId('tab-versions').click();
  const ver = p.locator('[data-testid^="version-"]').first();
  await ver.waitFor({ timeout: 20000 });
  const vt = await ver.getAttribute('data-testid');
  const num = vt.split('-')[1];
  await p.getByTestId(`check-${num}`).click();
  check('content checks pass and are recorded', await textOn(p, 'Content checks passed'));
  await p.getByTestId(`approve-${num}`).click();
  check('Super Admin approves the change', await textOn(p, `Version ${num} approved`));
  await p.getByTestId(`publish-${num}`).click();
  check('the version is published', await textOn(p, `Version ${num} is live`));
  await p.screenshot({ path: `${SHOTS}/3-versions.png`, fullPage: true });

  // 5. The game shows it.
  const g = await page();
  await g.goto(`${APP}/adventure/19`);
  check('a player opening Maryam gets the published narration', await textOn(g, `studio edit ${run}`, 90000));
  const badge = await g.getByTestId('studio-badge').count();
  check('players see no studio badge', badge === 0);
  await g.screenshot({ path: `${SHOTS}/4-game-published.png` });
  const saveKey = await g.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('quran-adventure.world-19')));
  await g.close();

  // 6. Play test keeps its own saves.
  const t = await page();
  await t.goto(`${APP}/admin`);
  await t.evaluate((s) => Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v)), await p.evaluate(() => Object.fromEntries(Object.entries(localStorage))));
  await t.evaluate(() => localStorage.setItem('quran-adventure.world-19.v1', JSON.stringify({ done: ['quiet'], prog: {}, seen: [] })));
  await t.goto(`${APP}/adventure/19?studio=draft`);
  check('play test shows the studio badge', await textOn(t, 'Play Test: draft', 90000));
  await t.waitForTimeout(3000);
  const saves = await t.evaluate(() => ({ player: localStorage.getItem('quran-adventure.world-19.v1'), test: Object.keys(localStorage).filter((k) => k.startsWith('quran-studio.playtest')) }));
  check('play test does not touch the player save', saves.player === JSON.stringify({ done: ['quiet'], prog: {}, seen: [] }), saves.player);
  await t.screenshot({ path: `${SHOTS}/5-playtest.png` });
  await t.close();

  // 7. Rollback.
  await p.goto(`${APP}/admin/surah/19`);
  await p.getByTestId('tab-versions').click();
  await p.getByText('Unpublish: go back to the built-in world').click();
  check('Super Admin can go back to the built-in world', await textOn(p, 'built-in world'));
  const g2 = await page();
  await g2.goto(`${APP}/adventure/19`);
  check('after rollback players get the original narration again', await textOn(g2, welcomeOld.slice(0, 40), 90000));
  await g2.close();
  console.log('  player save keys seen:', saveKey.join(', '));
  await p.close();
}

// 8. No AI calls.
const hosts = [...new Set(requests.map((u) => new globalThis.URL(u).host))];
const ai = requests.filter((u) => /anthropic|openai|generativelanguage|googleapis\.com\/v1beta|mistral|cohere|huggingface|replicate|groq|perplexity|elevenlabs/i.test(u));
check('no request went to an AI model API', ai.length === 0, ai.slice(0, 3).join(' '));
console.log('  hosts contacted:', hosts.join(', '));
await browser.close();
console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
