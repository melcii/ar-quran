// Real-input checks for the kinds of play added with surahs 40-44, through
// their own panels and buttons (no `solve`), plus the shared quiz panels
// (sort and order) used by Ta-Ha:
//  - clues (Ghafir): find each clue, a wrong pin is refused, the right pins finish it.
//  - scope (Fussilat): turn the telescope with the buttons until each sign is in the lens.
//  - council (Ash-Shura): a plan that leaves out a household is refused; the fair plan is agreed.
//  - adorn (Az-Zukhruf): silver is refused at a need; the plain useful things are accepted.
//  - survey (Ad-Dukhan): count everything, a wrong count is refused, the right counts finish it.
//  - quiz (Ta-Ha): sort the calf cards and order the Adam ayahs by tapping.
// Usage: node batch3-checks.js   (web build served on :8090)
const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS;
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 650 }, reducedMotion: 'no-preference' });
  const out = {};
  const open = async (w, upTo) => {
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(`http://localhost:${process.env.PORT || 8090}/adventure/${w}?q=low`, { timeout: 180000 });
    await p.waitForFunction(() => !!globalThis.__adv, null, { timeout: 400000 });
    await p.waitForTimeout(1500);
    await p.evaluate(async (upTo) => {
      const A = globalThis.__adv;
      A.speed(4);
      for (const t of A.def.tasks) {
        if (t.id === upTo) break;
        A.finish(t.id);
        await new Promise((r) => setTimeout(r, 60));
      }
    }, upTo);
    await closeAll(p);
    return { p, errs };
  };
  const closeAll = (p) => p.evaluate(async () => {
    const A = globalThis.__adv;
    for (let k = 0; k < 30 && A.cards().length; k++) {
      A.close();
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  const nearNow = (p, x, z) => p.evaluate(([x, z]) => {
    const A = globalThis.__adv;
    for (const d of [1.2, 0.6, 2])
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        if (A.game.space.okSpot(x + Math.cos(a) * d, z + Math.sin(a) * d, 0.4)) return A.teleport(x + Math.cos(a) * d, z + Math.sin(a) * d);
      }
    A.teleport(x, z);
  }, [x, z]);
  const near = async (p, x, z) => { await nearNow(p, x, z); await p.waitForTimeout(1200); };
  const act = async (p, key) => { await p.evaluate((k) => globalThis.__adv.act(k), key); await p.waitForTimeout(500); };
  const prog = (p, id) => p.evaluate((id) => globalThis.__adv.save().prog[id] ?? [], id);
  const isDone = (p, id) => p.evaluate((id) => globalThis.__adv.save().done.includes(id), id);
  const task = (p, id) => p.evaluate((id) => globalThis.__adv.def.tasks.find((t) => t.id === id), id);
  const want = (k) => !ONLY || ONLY.includes(k);
  const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 120000 }).catch(() => {}); };

  /* ---- clues (40) ---- */
  if (want('clues')) {
    const { p, errs } = await open(40, 'reasons');
    const t = await task(p, 'reasons');
    const r = {};
    for (let i = 0; i < t.clues.length; i++) {
      await near(p, ...t.clues[i].at);
      await act(p, `clue:reasons:${i}`);
      await closeAll(p);
    }
    r.found = (await prog(p, 'reasons')).length;
    await near(p, ...t.board);
    await act(p, 'board:reasons');
    await p.getByLabel('Pin the market stall').click(); // wrong for the first words
    await p.waitForTimeout(200);
    r.wrongRefused = (await prog(p, 'reasons')).length === t.clues.length;
    await shot(p, 'clues-board');
    for (const q of t.questions) {
      await p.getByLabel(`Pin the ${t.clues[q.answer].name}`).click();
      await p.waitForTimeout(250);
    }
    await p.waitForTimeout(400);
    r.done = await isDone(p, 'reasons');
    r.errors = errs;
    out.clues = r;
    await p.close();
  }

  /* ---- scope (41) ---- */
  if (want('scope')) {
    const { p, errs } = await open(41, 'horizons');
    const t = await task(p, 'horizons');
    const r = { turns: 0 };
    await near(p, ...t.at);
    await act(p, 'scope:horizons');
    for (let k = 0; k < 80 && (await prog(p, 'horizons')).length < t.signs.length; k++) {
      if (await p.getByLabel('Note this sign').count()) {
        await p.getByLabel('Note this sign').click();
        await p.waitForTimeout(250);
        // Noting opens the sign's reading in place of the telescope: read it, then look through again.
        r.readings = (r.readings ?? 0) + (await p.evaluate(() => globalThis.__adv.cards().filter((c) => c === 'reading').length));
        await closeAll(p);
        if ((await prog(p, 'horizons')).length < t.signs.length) await act(p, 'scope:horizons');
        continue;
      }
      await p.getByLabel('Turn left').click();
      r.turns++;
      await p.waitForTimeout(120);
    }
    r.noted = (await prog(p, 'horizons')).length;
    await act(p, 'scope:horizons');
    await shot(p, 'scope-panel');
    await p.getByLabel('Signs within ourselves').click();
    await p.waitForTimeout(400);
    r.done = await isDone(p, 'horizons');
    await closeAll(p);
    if (SHOTS) {
      await p.evaluate(() => { const A = globalThis.__adv; A.teleport(0, 6); A.view(Math.PI + 0.3, 0.3, 9); });
      await p.waitForTimeout(3000);
      await shot(p, 'scope-hill');
    }
    r.errors = errs;
    out.scope = r;
    await p.close();
  }

  /* ---- council (42) ---- */
  if (want('council')) {
    const { p, errs } = await open(42, 'well');
    const t = await task(p, 'well');
    const r = {};
    await near(p, ...t.table);
    await act(p, 'table:well');
    r.tableWaitsFirst = (await p.getByText('not been heard yet', { exact: false }).count()) > 0;
    await closeAll(p);
    for (let i = 0; i < t.homes.length; i++) {
      await near(p, ...t.homes[i].at);
      await act(p, `hear:well:${i}`);
      await closeAll(p);
    }
    r.heard = (await prog(p, 'well')).length;
    await near(p, ...t.table);
    await act(p, 'table:well');
    await p.getByLabel(`Plan: ${t.plans[0].text}`).click();
    await p.waitForTimeout(200);
    r.unfairRefused = !(await isDone(p, 'well')) && (await p.getByText('Not agreed', { exact: false }).count()) > 0;
    await shot(p, 'council-table');
    const fair = t.plans.findIndex((pl) => t.homes.every((_, i) => pl.meets.includes(i)));
    await p.getByLabel(`Plan: ${t.plans[fair].text}`).click();
    await p.waitForTimeout(400);
    r.done = await isDone(p, 'well');
    r.errors = errs;
    out.council = r;
    await p.close();
  }

  /* ---- adorn (43) ---- */
  if (want('adorn')) {
    const { p, errs } = await open(43, 'needs');
    const t = await task(p, 'needs');
    const r = {};
    const gold = t.items.findIndex((it) => it.gold);
    await near(p, ...t.items[gold].at);
    await act(p, `take:needs:${gold}`);
    await near(p, ...t.needs[0].at);
    await act(p, 'give:needs:0');
    r.goldRefused = (await prog(p, 'needs')).length === 0;
    for (let j = 0; j < t.needs.length; j++) {
      const i = t.needs[j].item;
      await near(p, ...t.items[i].at);
      await act(p, `take:needs:${i}`);
      await near(p, ...t.needs[j].at);
      await act(p, `give:needs:${j}`);
    }
    r.met = (await prog(p, 'needs')).length;
    r.done = await isDone(p, 'needs');
    await closeAll(p);
    await shot(p, 'adorn-need');
    r.errors = errs;
    out.adorn = r;
    await p.close();
  }

  /* ---- survey (44) ---- */
  if (want('survey')) {
    const { p, errs } = await open(44, 'count');
    const t = await task(p, 'count');
    const r = {};
    for (let i = 0; i < t.things.length; i++) {
      await near(p, ...t.things[i].at);
      await act(p, `count:count:${i}`);
    }
    r.counted = (await prog(p, 'count')).length;
    await near(p, ...t.ledger);
    await act(p, 'ledger:count');
    for (let c = 0; c < t.cats.length; c++) {
      const n = t.things.filter((th) => th.cat === c).length;
      if (c === 0) {
        await p.getByLabel(`${n + 1} ${t.cats[c].name}`).click();
        await p.waitForTimeout(200);
        r.wrongRefused = (await prog(p, 'count')).length === t.things.length;
        await shot(p, 'survey-ledger');
      }
      await p.getByLabel(`${n} ${t.cats[c].name}`).click();
      await p.waitForTimeout(250);
    }
    await p.waitForTimeout(400);
    r.done = await isDone(p, 'count');
    r.errors = errs;
    out.survey = r;
    await p.close();
  }

  /* ---- quiz panels (20: sort and order) ---- */
  if (want('quiz')) {
    const { p, errs } = await open(20, 'calf');
    const r = {};
    const calf = await task(p, 'calf');
    await near(p, ...calf.at);
    await act(p, 'quiz:calf');
    for (let k = 0; k < calf.game.cards.length; k++) {
      let c = null;
      for (const x of calf.game.cards) if (await p.getByText(x.text, { exact: true }).count()) c = x;
      if (!c) break;
      if (k === 0) {
        await p.getByText(calf.game.bins[1 - c.bin], { exact: true }).click();
        await p.waitForTimeout(200);
        r.sortWrongKept = (await p.getByText(c.text, { exact: true }).count()) > 0;
      }
      await p.getByText(calf.game.bins[c.bin], { exact: true }).click();
      await p.waitForTimeout(250);
    }
    await p.waitForTimeout(400);
    r.calfDone = await isDone(p, 'calf');
    await closeAll(p);
    const adam = await task(p, 'adam');
    await near(p, ...adam.at);
    await act(p, 'quiz:adam');
    const T = require('../../content/quran/translation-en-saheeh.json');
    const tr = adam.game.refs.map(([s, a]) => T[s - 1][a - 1].slice(0, 40));
    // A wrong first tap is refused (the tile stays); then tap them in order.
    await p.getByText(tr[tr.length - 1], { exact: false }).last().click();
    await p.waitForTimeout(200);
    r.orderWrongKept = (await prog(p, 'adam')).length === 0 && !(await isDone(p, 'adam'));
    for (let k = 0; k < tr.length; k++) {
      await p.getByText(tr[k], { exact: false }).last().click();
      await p.waitForTimeout(250);
    }
    await p.waitForTimeout(400);
    r.adamDone = await isDone(p, 'adam');
    r.errors = errs;
    out.quiz = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.clues || (out.clues.wrongRefused && out.clues.done)) && (!out.scope || out.scope.done) && (!out.council || (out.council.unfairRefused && out.council.done)) && (!out.adorn || (out.adorn.goldRefused && out.adorn.done)) && (!out.survey || (out.survey.wrongRefused && out.survey.done)) && (!out.quiz || (out.quiz.calfDone && out.quiz.adamDone));
  process.exit(ok ? 0 : 1);
})();
