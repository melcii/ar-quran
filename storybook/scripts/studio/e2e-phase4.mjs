// Phase 4 acceptance run, in Chromium against the studio server (start
// both as described in e2e.mjs):
//  - a player taps "Something not working?" in a world and picks a fixed
//    choice; only the world, the choice and the screen size are sent;
//  - staff group player reports into a bug, triage it (status history,
//    needs a developer), file a bug by hand and filter the list;
//  - world health checks run the game's collision validator on a draft with
//    a blocked player start, file an automated bug (once), apply the safe fix
//    in the draft and pass on the re-run; then check worlds 1-10 as players
//    get them and record the results (each world takes about 20 s in
//    headless Chromium, so the full 114 is left to the studio page);
//  - studio play tests never send player reports; no AI calls.
import { APP, AI_HOSTS, SHOTS, STUDIO, account, browser, check, failures, firstAdmin, resetScope, sharing, signIn, sql, until } from './lib.mjs';

resetScope('surah:19');
sql(`delete from player_problems where surah in (11, 19); delete from bug_reports where surah in (11, 19)`);
const owner = await account('p4-owner');
const tester = await account('p4-tester');
const world = await account('p4-world');
firstAdmin(owner.email);
await owner.c.rpc('studio_set_role', { p_email: tester.email, p_role: 'game_tester', p_on: true });
await owner.c.rpc('studio_set_role', { p_email: world.email, p_role: 'world_editor', p_on: true });

const { b, page, requests } = await browser();

/* ------------------------------ 1. a player reports a problem ------------------------------ */
const kid = await page();
const bodies = [];
kid.on('request', (r) => /api\/report-problem/.test(r.url()) && bodies.push(r.postData()));
await kid.goto(`${APP}/adventure/19?q=low`);
await until(kid, () => globalThis.__adv?.def, 120000);
await kid.getByTestId('report-open').last().click();
const choices = await kid.evaluate(() => document.querySelectorAll('[data-testid="report-sheet"] [data-testid^="report-"]:not([data-testid="report-close"])').length);
const inputs = await kid.evaluate(() => document.querySelectorAll('[data-testid="report-sheet"] input, [data-testid="report-sheet"] textarea').length);
check('the report sheet offers six fixed choices and nothing to type', choices === 6 && inputs === 0, `${choices} choices, ${inputs} inputs`);
await kid.screenshot({ path: `${SHOTS}/p4-1-player-report.png` });
await kid.getByTestId('report-stuck').last().click();
await kid.getByText('Thank you!').last().waitFor({ timeout: 10000 });
const row = sql(`select surah || '|' || category || '|' || coalesce(screen, '') from player_problems where surah = 19 order by id desc limit 1`);
check('the report is stored with the world, the choice and the screen size only', row === '19|stuck|1440x900', row);
const body = bodies[0] ? JSON.parse(bodies[0]) : {};
check('nothing else is sent: no name, account, explorer or position', JSON.stringify(Object.keys(body).sort()) === '["p_category","p_screen","p_surah"]', bodies[0]);
// Four more players report the same thing (through the same public function).
for (let i = 0; i < 4; i++)
  await fetch(`${STUDIO}/api/report-problem`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p_surah: 19, p_category: 'stuck', p_screen: '390x844' }) });
await kid.goto(`${APP}/ark?q=low`);
await until(kid, () => globalThis.__arkGame, 120000);
await kid.getByTestId('report-open').last().click();
await kid.getByTestId('report-sound').last().click();
await kid.getByText('Thank you!').last().waitFor({ timeout: 10000 });
check('the Nuh\'s Ark valley has the same report button (filed under Hud)', sql(`select count(*) from player_problems where surah = 11 and category = 'sound'`) === '1');

/* ------------------------------ 2. Bug Control Center ------------------------------ */
const t = await page();
await signIn(t, tester);
await t.goto(`${APP}/admin/bugs`);
await t.getByTestId('pp-19-stuck').last().waitFor({ timeout: 30000 });
const groupText = await t.getByTestId('pp-19-stuck').last().textContent();
check('the five player reports are grouped by world and choice', /5 reports/.test(groupText), groupText);
await t.screenshot({ path: `${SHOTS}/p4-2-player-reports.png` });
await t.getByTestId('pp-19-stuck-new').last().click();
await until(t, () => !document.querySelector('[data-testid="pp-19-stuck"]'), 15000);
const made = sql(`select id || '|' || source || '|' || severity || '|' || category from bug_reports where surah = 19 and source = 'player'`);
const bugId = made.split('|')[0];
check('a bug is made from them: from players, high (5 or more reports), movement', /^\d+\|player\|high\|movement$/.test(made), made);
check('all five reports are linked to it', sql(`select count(*) from player_problems where bug_id = ${Number(bugId) || 0}`) === '5');
await t.getByTestId(`bug-${bugId}`).last().waitFor({ timeout: 10000 });
// Triage: confirm it, then mark it as needing a developer.
const sel = await t.getByTestId('bd-save').count();
if (!sel) await t.getByTestId(`bug-${bugId}`).last().click();
await t.getByTestId('bd-status-confirmed').last().click();
await t.getByTestId('bd-save').last().click();
await until(t, (id) => globalThis.__studioBugs?.list?.find((x) => x.id === Number(id))?.status === 'confirmed', 15000, bugId);
await t.getByTestId('bd-status-needs_developer').last().click();
await t.getByTestId('bd-resolution').last().fill('The fence by the bench has a gap the walker squeezes into; the fence model needs a code change.');
await t.getByTestId('bd-save').last().click();
await until(t, (id) => globalThis.__studioBugs?.list?.find((x) => x.id === Number(id))?.status === 'needs_developer', 15000, bugId);
const hist = JSON.parse(sql(`select json_extract(diagnostics, '$.history') from bug_reports where id = ${bugId}`) || '[]');
check('status changes are kept in the history with who and when', hist.length === 2 && hist[0].from === 'new' && hist[0].to === 'confirmed' && hist[1].to === 'needs_developer' && !!hist[1].by && !!hist[1].at, JSON.stringify(hist));
check('needing a developer is recorded on the bug', sql(`select needs_code from bug_reports where id = ${bugId}`) === '1');
await t.getByTestId('bd-history-1').last().waitFor({ timeout: 10000 });
check('the history is shown on the bug', /confirmed → needs developer/.test(await t.getByTestId('bd-history-1').last().textContent()));
check('the bug says where it can be fixed without code', (await t.getByTestId('bug-fix-open').count()) > 0);
await t.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await t.screenshot({ path: `${SHOTS}/p4-3-bug-detail.png`, fullPage: true });
// File one by hand.
await t.getByTestId('bug-file-open').last().click();
await t.getByTestId('nb-title').last().fill('Narration for the palm tree cuts off');
await t.getByTestId('nb-surah').last().fill('19');
await t.getByTestId('nb-description').last().fill('The welcome narration stops halfway on a phone.');
await t.getByTestId('nb-category-audio').last().click();
await t.getByTestId('nb-severity-low').last().click();
await t.getByTestId('nb-submit').last().click();
const filed = await until(t, () => globalThis.__studioBugs?.list?.find((x) => x.title === 'Narration for the palm tree cuts off'), 15000);
check('staff can file a bug by hand; it records the screen size', filed?.source === 'staff' && filed?.category === 'audio' && /^\d+x\d+$/.test(filed?.device?.screen ?? ''), JSON.stringify(filed)?.slice(0, 200));
await t.getByTestId('bf-category-audio').last().click();
const audioRows = await t.evaluate(() => [...document.querySelectorAll('[data-testid^="bug-"]')].filter((e) => /^bug-\d+$/.test(e.getAttribute('data-testid'))).length);
await t.getByTestId('bf-status-fixed').last().click();
const fixedRows = await t.evaluate(() => [...document.querySelectorAll('[data-testid^="bug-"]')].filter((e) => /^bug-\d+$/.test(e.getAttribute('data-testid'))).length);
check('the list filters by category and status', audioRows >= 1 && fixedRows === 0 + Number(sql(`select count(*) from bug_reports where status = 'fixed' and category = 'audio'`)), `${audioRows} audio, ${fixedRows} fixed audio`);
const anonRead = await (await fetch(`${STUDIO}/api/read/bug_reports`)).json();
const anonPp = await (await fetch(`${STUDIO}/api/read/player_problems`)).json();
check('players cannot read bugs or reports', Array.isArray(anonRead) && !anonRead.length && Array.isArray(anonPp) && !anonPp.length, JSON.stringify([anonRead, anonPp]).slice(0, 120));

/* ------------------------------ 3. world health checks ------------------------------ */
// A world editor's draft puts the player start inside the bench.
const sv = await world.c.rpc('studio_save_draft', { p_scope: 'surah:19', p_doc: { v: 1, set: { start: [4, 18] } }, p_revision: 0 });
check('(setup) a draft with the start on the bench', !sv.error, sv.error?.message);
const h = await page();
await signIn(h, world);
await h.goto(`${APP}/admin/health`);
await h.getByTestId('hc-range').last().fill('19');
await h.getByTestId('hc-mode-draft').last().click();
await h.getByTestId('hc-run').last().click();
const r1 = await until(h, () => !globalThis.__studioHealth?.running && globalThis.__studioHealth?.rows?.[0], 120000);
check('the health check finds the blocked start in the draft', r1 && !r1.ok && !r1.collision.spawn.ok && Array.isArray(r1.openStart), JSON.stringify(r1 && { ok: r1.ok, spawn: r1.collision.spawn, open: r1.openStart, sum: r1.summary }));
check('the result is recorded as a collision test of the world', sql(`select count(*) from test_runs where scope = 'surah:19' and kind = 'collision' and not ok`) === '1');
await h.screenshot({ path: `${SHOTS}/p4-4-health-problem.png` });
await h.getByTestId('hc-file-19').last().click();
await until(h, () => globalThis.__studioHealth?.rows?.[0]?.bug, 15000);
const auto = sql(`select count(*) || '|' || min(severity) || '|' || min(json_extract(diagnostics, '$.check')) from bug_reports where surah = 19 and source = 'automated'`);
check('an automated bug is filed with the check\'s findings', auto === '1|high|world-health', auto);
await h.getByTestId('hc-run').last().click();
await until(h, () => !globalThis.__studioHealth?.running && globalThis.__studioHealth?.rows?.length, 120000);
await h.getByTestId('hc-file-all').last().click();
await h.getByText(/already had an open health bug/).last().waitFor({ timeout: 15000 });
check('filing again does not duplicate the open bug', sql(`select count(*) from bug_reports where surah = 19 and source = 'automated'`) === '1');
// The safe fix: move the start to the nearest open spot, in the draft.
await h.getByTestId('hc-fix-start-19').last().click();
await h.getByText(/was moved to the nearest open spot/).last().waitFor({ timeout: 15000 });
const st = JSON.parse(sql(`select json_extract(doc, '$.set.start') from content_drafts where scope = 'surah:19'`));
check('the safe fix moves the start in the draft only (nothing is published)', JSON.stringify(st) === JSON.stringify(r1.openStart) && sql(`select count(*) from publications where scope = 'surah:19'`) === '0', JSON.stringify(st));
await h.getByTestId('hc-run').last().click();
const r2 = await until(h, () => !globalThis.__studioHealth?.running && globalThis.__studioHealth?.rows?.[0]?.collision && globalThis.__studioHealth.rows[0], 120000);
check('after the fix the draft passes the health check', r2?.ok === true, r2?.summary);
// Worlds 1-10 as players get them, recorded.
await h.getByTestId('hc-range').last().fill('1-10');
await h.getByTestId('hc-mode-published').last().click();
const t0 = Date.now();
await h.getByTestId('hc-run').last().click();
await h.waitForTimeout(1500);
const all = await until(h, () => !globalThis.__studioHealth?.running && globalThis.__studioHealth?.rows?.length === 10 && globalThis.__studioHealth.rows, 600000);
const secs = Math.round((Date.now() - t0) / 1000);
const unhealthy = (all ?? []).filter((r) => !r.ok).map((r) => `${r.n}: ${r.summary}`);
check('worlds 1-10 are checked as players get them and recorded', all?.length === 10 && all.every((r) => r.recorded), `${all?.length}`);
console.log(`  10 worlds in ${secs}s; ${unhealthy.length} with problems${unhealthy.length ? ':\n    ' + unhealthy.join('\n    ') : ''}`);
await h.evaluate(() => window.scrollTo(0, 0));
await h.screenshot({ path: `${SHOTS}/p4-5-health-all.png` });

/* ------------------------------ 4. play tests never send reports ------------------------------ */
const pt = await sharing(page, h);
const ptBodies = [];
pt.on('request', (r) => /rpc\/report_problem/.test(r.url()) && ptBodies.push(r.url()));
await pt.goto(`${APP}/adventure/19?studio=draft&q=low`);
await until(pt, () => globalThis.__adv?.def, 120000);
await pt.getByTestId('report-open').last().click();
await pt.getByTestId('report-looks_wrong').last().click();
await pt.getByText('Thank you!').last().waitFor({ timeout: 10000 });
check('a studio play test does not send player reports', ptBodies.length === 0 && sql(`select count(*) from player_problems where category = 'looks_wrong' and surah = 19`) === '0');

const ai = requests.filter((u) => AI_HOSTS.test(u));
check('no request went to an AI model API', ai.length === 0, ai.join(', '));
console.log('  hosts:', [...new Set(requests.map((u) => new globalThis.URL(u).host))].join(', '));
await b.close();
console.log(failures() ? `\n${failures()} failed` : '\nall passed');
process.exit(failures() ? 1 : 0);
