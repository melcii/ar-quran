// Real-input checks for the kinds of play added with surahs 105-109, through
// their own panels and the explorer's position (no `solve`):
//  - flock (Al-Fil): a wrong total is refused; counting every bunch and the right total finishes it.
//  - campfire (Quraysh): the wrong season's road and wood on a fire still burning are refused; the right roads and a night of fires finish it.
//  - lend (Al-Ma'un): the wrong thing at a door is refused; the right thing at every door finishes it.
//  - prune (Al-Kawthar): cutting a fruiting branch is refused; cutting the dead and crossing wood finishes it.
//  - courtyard (Al-Kafirun): rudeness and joining in worship are refused; kindness and a polite no finish it.
// Usage: node batch16-checks.js   (web build served on :8090, or PORT)
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

  const clock = (p, s) => p.evaluate(async (s) => { const g = globalThis.__adv.game; const c0 = g.clock, w0 = performance.now(); while (g.clock - c0 < s && performance.now() - w0 < 240000) await new Promise((r) => setTimeout(r, 60)); }, s);
  const notes = (p, k) => p.evaluate((k) => globalThis.__adv.save().prog[k] ?? [], k);


  const stand = async (p, x, z) => { await p.evaluate(([x, z]) => globalThis.__adv.teleport(x, z), [x, z]); await p.waitForTimeout(1200); };



  const press = async (p, label, n = 1) => { for (let k = 0; k < n; k++) { await p.getByLabel(label, { exact: true }).click(); await p.waitForTimeout(80); } };
  /* ---- flock (105) ---- */
  if (want('flock')) {
    const { p, errs } = await open(105, 'flocks');
    const t = await task(p, 'flocks');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'count:flocks');
    await press(p, `About ${t.flocks[0] * 10 - 20} birds`);
    r.wrongRefused = (await notes(p, 'flocks/x')).length > 0 && (await prog(p, 'flocks')).length === 0;
    for (const n of t.flocks) {
      for (let k = 1; k <= n; k++) await press(p, `Bunch ${k}`);
      if (n === t.flocks[0]) await shot(p, 'flock-counted');
      await press(p, `About ${n * 10} birds`);
    }
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'flocks');
    await closeAll(p);
    r.errors = errs;
    out.flock = r;
    await p.close();
  }

  /* ---- campfire (106) ---- */
  if (want('campfire')) {
    const { p, errs } = await open(106, 'camp');
    const t = await task(p, 'camp');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'map:camp');
    await press(p, 'North, to the cool lands of Sham');
    r.wrongRoadRefused = (await notes(p, 'camp/x')).length > 0 && (await prog(p, 'camp')).length === 0;
    await press(p, 'South, to the warm lands of Yemen');
    await press(p, 'North, to the cool lands of Sham');
    r.planned = (await prog(p, 'camp')).length === 2;
    await closeAll(p);
    await nearNow(p, ...t.fires[0]);
    await p.waitForTimeout(400);
    await act(p, 'fire:camp:0');
    r.wasteRefused = (await notes(p, 'camp/waste')).length > 0;
    let shotDone = false;
    for (let k = 0; k < 400 && !(await isDone(p, 'camp')); k++) {
      const fuel = await p.evaluate(() => globalThis.__adv.game.mech.camp?.fuel ?? []);
      let lo = -1;
      fuel.forEach((f, i) => { if (f < 0.5 && (lo < 0 || f < fuel[lo])) lo = i; });
      if (lo < 0) { await p.waitForTimeout(150); continue; }
      await nearNow(p, ...t.fires[lo]);
      await p.waitForTimeout(250);
      await act(p, `fire:camp:${lo}`);
      if (!shotDone) { await shot(p, 'campfire-night'); shotDone = true; }
    }
    r.outNoted = (await notes(p, 'camp/out')).length;
    r.done = await isDone(p, 'camp');
    await closeAll(p);
    await shot(p, 'campfire-dawn');
    r.errors = errs;
    out.campfire = r;
    await p.close();
  }

  /* ---- lend (107) ---- */
  if (want('lend')) {
    const { p, errs } = await open(107, 'neighbours');
    const t = await task(p, 'neighbours');
    const r = {};
    const chestOf = (w) => t.chests.findIndex((c) => c.holds.includes(w));
    for (let k = 0; k < t.asks.length; k++) {
      const a = t.asks[k];
      await near(p, ...a.at);
      await act(p, `door:neighbours:${k}`);
      await closeAll(p);
      if (k === 0) {
        await near(p, ...t.chests[0].at);
        await act(p, 'chest:neighbours:0');
        await press(p, 'Take the sieve');
        await near(p, ...a.at);
        await act(p, `door:neighbours:${k}`);
        r.wrongRefused = (await notes(p, 'neighbours/x')).length > 0 && (await prog(p, 'neighbours')).length === 0;
        await closeAll(p);
        await near(p, ...t.chests[0].at);
        await act(p, 'chest:neighbours:0');
        await press(p, 'Put back what you carry');
        await closeAll(p);
      }
      const c = chestOf(a.wants);
      await near(p, ...t.chests[c].at);
      await act(p, `chest:neighbours:${c}`);
      await press(p, `Take the ${a.wants}`);
      await near(p, ...a.at);
      await act(p, `door:neighbours:${k}`);
      await closeAll(p);
    }
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'neighbours');
    await shot(p, 'lend-done');
    r.errors = errs;
    out.lend = r;
    await p.close();
  }

  /* ---- prune (108) ---- */
  if (want('prune')) {
    const { p, errs } = await open(108, 'fig');
    const t = await task(p, 'fig');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'prune:fig');
    await shot(p, 'prune-tree');
    const keep = t.branches.findIndex((b) => b.is === 'fruiting');
    await press(p, `Cut branch ${keep + 1}`);
    r.fruitingRefused = (await notes(p, 'fig/x')).length > 0 && (await prog(p, 'fig')).length === 0;
    for (let i = 0; i < t.branches.length; i++) if (t.branches[i].is !== 'fruiting') await press(p, `Cut branch ${i + 1}`);
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'fig');
    await closeAll(p);
    await shot(p, 'prune-done');
    r.errors = errs;
    out.prune = r;
    await p.close();
  }

  /* ---- courtyard (109) ---- */
  if (want('courtyard')) {
    const { p, errs } = await open(109, 'neighbour');
    const t = await task(p, 'neighbour');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'neighbour:neighbour');
    await press(p, t.asks[0].rude);
    r.rudeRefused = (await notes(p, 'neighbour/rude')).length > 0 && (await prog(p, 'neighbour')).length === 0;
    for (const a of t.asks) {
      if (!a.ok && !r.joinRefused) { await press(p, a.yes); r.joinRefused = (await notes(p, 'neighbour/x')).length > 0; }
      await press(p, a.ok ? a.yes : a.no);
    }
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'neighbour');
    await closeAll(p);
    await shot(p, 'courtyard-done');
    r.errors = errs;
    out.courtyard = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.flock || (out.flock.wrongRefused && out.flock.done)) && (!out.campfire || (out.campfire.wrongRoadRefused && out.campfire.wasteRefused && out.campfire.done)) && (!out.lend || (out.lend.wrongRefused && out.lend.done)) && (!out.prune || (out.prune.fruitingRefused && out.prune.done)) && (!out.courtyard || (out.courtyard.rudeRefused && out.courtyard.joinRefused && out.courtyard.done));
  process.exit(ok ? 0 : 1);
})();
