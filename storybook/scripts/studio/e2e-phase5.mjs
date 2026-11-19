// Phase 5 acceptance run, in Chromium against the studio server (start
// both as described in e2e.mjs):
//  - a Moderator handles a report from a room: sees only what is needed,
//    pauses online play for a few days, and the server enforces it;
//  - a Moderator sets a break reminder and closes a world for repair; the
//    play test shows it; a Super Admin approves it and publishes it as a
//    release; players get it; undoing the release brings everything back;
//  - no AI calls.
import { APP, AI_HOSTS, SHOTS, account, browser, check, failures, firstAdmin, resetScope, sharing, signIn, sql, until } from './lib.mjs';

for (const sc of ['config:play', 'config:multiplayer']) resetScope(sc);
sql(`update releases set state = 'cancelled' where state = 'planned'`);
const owner = await account('p5-owner');
const mod = await account('p5-mod');
firstAdmin(owner.email);
await owner.c.rpc('studio_set_role', { p_email: mod.email, p_role: 'moderator', p_on: true });

// Two families (grown-up accounts without staff roles), friends, in a room; one reports the other.
const fam1 = await account('p5-family1', { mfa: false });
const fam2 = await account('p5-family2', { mfa: false });
for (const f of [fam1, fam2]) await f.c.fam('family_settings', { consent: true, multiplayer: true });
const nick = `Rumi${Date.now().toString(36).slice(-4)}`;
const a = (await fam1.c.fam('explorer_add', { nickname: nick })).data;
const bb = (await fam2.c.fam('explorer_add', { nickname: 'Lina' })).data;
await fam2.c.fam('request_friend', { me: bb, code: sql('select friend_code from explorers where id = ?', a) });
await fam1.c.fam('approve_friend', { me: a, other: bb });
const room = (await fam1.c.fam('open_room', { me: a, world: '19' })).data;
await fam1.c.fam('invite', { r: room, friend: bb });
const rid = String((await fam2.c.fam('report', { by_explorer: bb, about: a, reason: 'unkind', room })).data);

const { b, page, requests } = await browser();

/* ------------------------------ 1. moderation ------------------------------ */
const m = await page();
await signIn(m, mod);
await m.goto(`${APP}/admin/moderation`);
await m.getByTestId(`mod-${rid}`).last().waitFor({ timeout: 30000 });
const card = await m.getByTestId(`mod-${rid}`).last().textContent();
check('the moderator sees the reason, the world and the nickname', /Unkind/.test(card) && /Maryam|19\./.test(card) && card.includes(nick), card.slice(0, 200));
const pageText = await m.evaluate(() => document.body.innerText);
check('the moderation screen shows no email, friend code or family details', !pageText.includes(fam1.email) && !pageText.includes(fam2.email) && !pageText.includes(sql(`select friend_code from explorers where id = '${a}'`)));
await m.screenshot({ path: `${SHOTS}/p5-1-moderation.png` });
await m.getByTestId(`mod-${rid}-days-3`).last().click();
await m.getByTestId(`mod-${rid}-note`).last().fill('Unkind words in the room');
await m.getByTestId(`mod-${rid}-pause`).last().click();
await m.getByText('Online play paused for 3 day(s).').first().waitFor({ timeout: 15000 });
const until3 = sql(`select cast(round(julianday(online_paused_until) - julianday('now')) as integer) from explorers where id = '${a}'`);
const blocked = await fam1.c.fam('open_room', { me: a, world: '19' });
check('the pause is stored for 3 days and the server refuses rooms', until3 === '3' && !!blocked.error, `${until3} ${blocked.error?.message}`);
check('the report is marked as handled', sql(`select status || '|' || action from reports where id = ${rid}`) === 'actioned|pause_online');

/* ------------------------------ 2. play settings ------------------------------ */
await m.goto(`${APP}/admin/settings`);
await until(m, () => globalThis.__studioSettings?.scope === 'config:play', 30000);
await m.getByTestId('set-break-15').last().click();
await m.getByTestId('set-close-n').last().fill('7');
await m.getByTestId('set-close').last().click();
await until(m, () => /Draft saved/.test(document.querySelector('[data-testid="save-state"]')?.textContent ?? ''), 20000);
const d = JSON.parse(sql(`select doc from content_drafts where scope = 'config:play'`) || '{}');
check('the moderator\'s draft holds the break reminder and the closed world', d.set?.breakMinutes === 15 && JSON.stringify(d.set?.closedWorlds) === '[7]', JSON.stringify(d));
await m.screenshot({ path: `${SHOTS}/p5-2-play-settings.png` });
// Play test of the draft: world 7 is resting.
const pt = await sharing(page, m);
await pt.goto(`${APP}/adventure/7?studio=draft&q=low`);
await pt.getByTestId('world-resting').last().waitFor({ timeout: 60000 });
check('the play test of the draft shows world 7 resting', true);
await pt.close();
await m.getByTestId('submit-note').last().fill('Break reminder after 15 minutes; world 7 closed while the gate bug is fixed');
await m.getByTestId('submit').last().click();
await m.getByText('Submitted for review').first().waitFor({ timeout: 20000 });
const mp = await mod.c.rpc('studio_save_draft', { p_scope: 'config:multiplayer', p_doc: { v: 1, set: { roomMax: 9 } }, p_revision: 0 });
const mps = await mod.c.rpc('studio_submit', { p_scope: 'config:multiplayer', p_note: '' });
check('a room size out of range is refused by the server', !mp.error && !!mps.error, mps.error?.message);

/* ------------------------------ 3. release ------------------------------ */
const o = await page();
await signIn(o, owner);
await o.goto(`${APP}/admin/settings`);
await o.getByTestId('tab-versions').last().click();
const vt = await o.locator('[data-testid^="version-"]').first().getAttribute('data-testid', { timeout: 20000 });
const num = vt.split('-')[1];
await o.getByTestId(`check-${num}`).last().click();
await o.getByText('Content checks passed').first().waitFor({ timeout: 20000 });
await o.getByTestId(`approve-${num}`).last().click();
await o.getByText(`Version ${num} approved`).first().waitFor({ timeout: 20000 });
await o.goto(`${APP}/admin/releases`);
const vid = sql(`select id from content_versions where scope = 'config:play' and number = ${num}`);
await o.getByTestId(`rel-pick-${vid}`).last().click();
await o.getByTestId('rel-title').last().fill('Calmer play and a world repair');
await o.getByTestId('rel-notes').last().fill('Break reminder after 15 minutes. World 7 rests while the gate is fixed.');
await o.getByTestId('rel-create').last().click();
await o.getByText('Release planned').first().waitFor({ timeout: 15000 });
const relId = sql(`select max(id) from releases`);
await o.screenshot({ path: `${SHOTS}/p5-3-release-planned.png`, fullPage: true });
await o.getByTestId(`rel-${relId}-publish`).last().click();
await o.getByText('Release published').first().waitFor({ timeout: 15000 });
check('the release is published by the Super Admin', sql(`select state from releases where id = ${relId}`) === 'published');
// Players get it.
const p1 = await page();
await p1.goto(`${APP}/adventure/7?q=low`);
await p1.getByTestId('world-resting').last().waitFor({ timeout: 60000 });
check('players opening world 7 see that it is resting', true);
await p1.screenshot({ path: `${SHOTS}/p5-4-world-resting.png` });
await p1.goto(`${APP}/adventure/19?q=low`);
const bm = await until(p1, () => globalThis.__adv?.breakMinutes, 120000);
check('players get the 15-minute break reminder', bm === 15, String(bm));
await p1.evaluate(() => globalThis.__adv.showBreak());
await p1.getByTestId('break-reminder').last().waitFor({ timeout: 10000 });
await p1.waitForTimeout(800);
await p1.screenshot({ path: `${SHOTS}/p5-5-break-reminder.png` });
await p1.getByTestId('break-continue').last().click();
const gone = await until(p1, () => !document.querySelector('[data-testid="break-reminder"]'), 5000);
check('the child can keep exploring after the reminder', !!gone);
await p1.close();
// Undo the release.
await o.reload();
await o.getByTestId(`rel-${relId}-undo`).last().waitFor({ timeout: 20000 });
await o.getByTestId(`rel-${relId}-undo`).last().click();
await o.getByText('Release undone').first().waitFor({ timeout: 15000 });
const p2 = await page();
await p2.goto(`${APP}/adventure/7?q=low`);
const def7 = await until(p2, () => globalThis.__adv?.def?.surah, 120000);
check('after undoing the release, world 7 is open again', def7 === 7 && (await p2.getByTestId('world-resting').count()) === 0, String(def7));
await p2.close();
await o.evaluate(() => window.scrollTo(0, 0));
await o.screenshot({ path: `${SHOTS}/p5-6-releases.png`, fullPage: true });

const ai = requests.filter((u) => AI_HOSTS.test(u));
check('no request went to an AI model API', ai.length === 0, ai.join(', '));
console.log('  hosts:', [...new Set(requests.map((u) => new globalThis.URL(u).host))].join(', '));
await b.close();
console.log(failures() ? `\n${failures()} failed` : '\nall passed');
process.exit(failures() ? 1 : 0);
