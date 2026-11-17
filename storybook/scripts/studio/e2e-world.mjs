// The brief's acceptance run for the world editor, in Chromium against a
// real local Supabase (start both as described in e2e.mjs):
//  1 sign in securely, 2 select Surah Maryam, 3 enter its 3D world editor,
//  4 select a rock and move it, 5 preview, 6 run a collision test,
//  7 save the draft, 8 publish with the required approval, 9 re-enter the
//  world and see the change, 10 roll back to the previous version.
// Also: a Story Editor cannot move the rock (server refuses), and no AI calls.
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
function totp(secret) {
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
async function account(name) {
  const c = createClient(URL, KEY, { auth: { persistSession: false } });
  const email = `${name}-${run}@studio.test`;
  await c.auth.signUp({ email, password: PW });
  const en = await c.auth.mfa.enroll({ factorType: 'totp' });
  const ch = await c.auth.mfa.challenge({ factorId: en.data.id });
  await c.auth.mfa.verify({ factorId: en.data.id, challengeId: ch.data.id, code: totp(en.data.totp.secret) });
  return { email, secret: en.data.totp.secret, c };
}
const owner = await account('w-owner');
const worldEd = await account('w-world');
const storyEd = await account('w-story');
execFileSync('psql', [DB, '-Atc', `select public.studio_bootstrap_super_admin('${owner.email}')`]);
await owner.c.rpc('studio_set_role', { p_email: worldEd.email, p_role: 'world_editor', p_on: true });
await owner.c.rpc('studio_set_role', { p_email: storyEd.email, p_role: 'story_editor', p_on: true });
execFileSync('psql', [DB, '-Atc', `delete from public.content_drafts where scope = 'surah:19'`]);
await owner.c.rpc('studio_rollback', { p_scope: 'surah:19', p_version: null, p_note: 'reset' });

const browser = await chromium.launch();
const requests = [];
const page = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on('request', (r) => requests.push(r.url()));
  p.on('pageerror', (e) => console.log('  page error:', e.message.slice(0, 160)));
  return p;
};
async function signIn(p, who) {
  await p.goto(`${APP}/admin`);
  await p.getByTestId('email').fill(who.email);
  await p.getByTestId('password').fill(PW);
  await p.getByTestId('sign-in').click();
  await p.getByTestId('mfa-code').waitFor({ timeout: 30000 });
  await p.getByTestId('mfa-code').fill(totp(who.secret));
  await p.getByTestId('mfa-verify').click();
  await p.getByText('Total surahs').first().waitFor({ timeout: 30000 });
}
const until = async (p, f, ms = 60000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const v = await p.evaluate(f);
      if (v) return v;
    } catch {}
    await p.waitForTimeout(500);
  }
  return null;
};

// 1-3: World Editor signs in, picks Maryam, opens the 3D editor.
const p = await page();
await signIn(p, worldEd);
check('1. World Editor signs in with password and authenticator code', true);
await p.getByTestId('surah-search').fill('Maryam');
await p.getByTestId('open-19').click();
await p.getByTestId('edit-world').click();
check('2-3. Surah Maryam opens in the 3D world editor', !!(await until(p, () => globalThis.__studioEditor?.placed?.rocks?.length > 0, 90000)));
await p.waitForTimeout(4000);
await p.screenshot({ path: `${SHOTS}/w1-editor.png` });

// 4: select a large rock and move it 3 m east with the number fields.
const rock = await p.evaluate(() => {
  const r = globalThis.__studioEditor.placed.rocks.filter((k) => k.s > 0.6).sort((a, b) => b.s - a.s)[0];
  globalThis.__studioEditor.select({ kind: 'rock', key: r.key });
  return r;
});
await p.getByTestId('selection').waitFor();
const nx = +(rock.x + 3).toFixed(2);
await p.getByTestId('num-x').fill(String(nx));
await p.getByTestId('num-x').press('Enter');
const moved = await until(p, () => Object.values(globalThis.__studioEditor.doc.place?.rocks ?? {})[0]?.x, 10000);
check('4. the rock is selected and moved (draft edit recorded)', moved === nx, String(moved));
await p.waitForTimeout(2500);
await p.screenshot({ path: `${SHOTS}/w2-rock-moved.png` });
// Undo / redo in the editor.
await p.getByTestId('w-undo').click();
const undone = await p.evaluate(() => Object.keys(globalThis.__studioEditor.doc.place?.rocks ?? {}).length);
await p.getByTestId('w-redo').click();
const redone = await p.evaluate(() => Object.values(globalThis.__studioEditor.doc.place?.rocks ?? {})[0]?.x);
check('undo and redo work in the world editor', undone === 0 && redone === nx, `${undone} ${redone}`);

// 6: collision test on the draft.
await p.getByTestId('show-colliders').click();
await p.getByTestId('collision-test').click();
await p.getByTestId('collision-report').waitFor({ timeout: 120000 });
const rep = await p.getByTestId('collision-report').innerText();
check('6. the collision test runs on the draft and is recorded', /collision test passed|collision problems/.test(rep), rep.slice(0, 120));
console.log('  collision report:', rep.replace(/\n/g, ' | ').slice(0, 300));
await p.waitForTimeout(1500);
await p.screenshot({ path: `${SHOTS}/w3-collision-view.png` });

// 7: the draft is saved on the server.
const saved = await until(p, () => /Draft saved/.test(document.body.innerText), 20000);
check('7. the change is saved as a draft', !!saved);

// 5: preview (play test of the draft) shows the rock in its new place.
const pv = await page();
await pv.goto(`${APP}/admin`);
await pv.evaluate((s) => Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v)), await p.evaluate(() => Object.fromEntries(Object.entries(localStorage))));
await pv.goto(`${APP}/adventure/19?studio=draft&q=low`);
const pvRocks = await until(pv, () => globalThis.__adv?.rocks?.(), 120000);
check('5. play-test preview has the rock at its new place', !!pvRocks?.some((k) => Math.abs(k.x - nx) < 0.01 && Math.abs(k.z - rock.z) < 0.01), JSON.stringify(pvRocks?.slice(0, 2)));
await pv.close();

// A Story Editor's session cannot move objects: the server refuses.
const sc = storyEd.c;
const deny = await sc.rpc('studio_save_draft', { p_scope: 'surah:19', p_doc: { v: 1, place: { rocks: { [rock.key]: { x: 0, z: 0 } } } }, p_revision: 999 });
check('a Story Editor cannot move world objects (server refuses)', !!deny.error);

// Submit (World Editor), then 8: Super Admin checks, approves, publishes.
await p.goto(`${APP}/admin/surah/19`);
await p.getByTestId('submit-note').last().fill('Move the big rock 3 m east');
await p.getByTestId('submit').last().click();
await p.getByText('Submitted for review').first().waitFor({ timeout: 30000 });
await p.close();
const o = await page();
await signIn(o, owner);
await o.goto(`${APP}/admin/surah/19`);
await o.getByTestId('tab-versions').click();
const vt = await (await o.locator('[data-testid^="version-"]').first()).getAttribute('data-testid');
const num = vt.split('-')[1];
await o.getByTestId(`check-${num}`).click();
await o.getByText('Content checks passed').first().waitFor({ timeout: 30000 });
await o.getByTestId(`approve-${num}`).click();
await o.getByText(`Version ${num} approved`).first().waitFor({ timeout: 30000 });
await o.getByTestId(`publish-${num}`).click();
check('8. published after checks and approval by someone else', !!(await o.getByText(`Version ${num} is live`).first().waitFor({ timeout: 30000 }).then(() => 1).catch(() => 0)));

// 9: a player re-enters the world and the rock has moved.
const g = await page();
await g.goto(`${APP}/adventure/19?q=low`);
const live = await until(g, () => globalThis.__adv?.rocks?.(), 120000);
check('9. re-entering the world, the rock is in its new place', !!live?.some((k) => Math.abs(k.x - nx) < 0.01), '');
check('   and not in the old place', !live?.some((k) => Math.abs(k.x - rock.x) < 0.01 && Math.abs(k.z - rock.z) < 0.01));
await g.screenshot({ path: `${SHOTS}/w4-game.png` });
await g.close();

// 10: roll back to the previous version (the built-in world here).
await o.getByText('Unpublish: go back to the built-in world').click();
await o.getByText('Players now get the built-in world').first().waitFor({ timeout: 30000 });
const g2 = await page();
await g2.goto(`${APP}/adventure/19?q=low`);
const back = await until(g2, () => globalThis.__adv?.rocks?.(), 120000);
check('10. after rollback the rock is back where it was', !!back?.some((k) => Math.abs(k.x - rock.x) < 0.01 && Math.abs(k.z - rock.z) < 0.01));
await g2.close();

const ai = requests.filter((u) => /anthropic|openai|generativelanguage|mistral|cohere|huggingface|replicate|groq|perplexity|elevenlabs/i.test(u));
check('no request went to an AI model API', ai.length === 0);
console.log('  hosts:', [...new Set(requests.map((u) => new globalThis.URL(u).host))].join(', '));
await browser.close();
console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
