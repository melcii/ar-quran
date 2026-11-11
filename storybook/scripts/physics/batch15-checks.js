// Real-input checks for the kinds of play added with surahs 100-104, through
// their own panels and the explorer's position (no `solve`):
//  - gaits (Al-Adiyat): a wrong pace and watering a hot horse are refused; naming every pace and caring in order finishes it.
//  - carding (Al-Qari'ah): brushing an empty carder is refused; burrs out and each roll carded in order finishes it.
//  - errand (At-Takathur): too few and too many are refused; just enough at every stall finishes it.
//  - hourglass (Al-Asr): idling is noted, and idling past sunset loses the afternoon; the four deeds in time finish it.
//  - chalk (Al-Humazah): laughing, walking past and flattery are refused; scrubbing and kind true words finish it.
// Usage: node batch15-checks.js   (web build served on :8090, or PORT)
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
  /* ---- gaits (100) ---- */
  if (want('gaits')) {
    const { p, errs } = await open(100, 'paces');
    const t = await task(p, 'paces');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'rail:paces');
    await shot(p, 'gaits-hooves');
    const wrong = ['walk', 'trot', 'canter', 'gallop'].find((g) => g !== t.runs[0]);
    await press(p, `It is a ${wrong}`);
    r.wrongRefused = (await notes(p, 'paces/x')).length > 0 && (await prog(p, 'paces')).length === 0;
    for (const g of t.runs) await press(p, `It is a ${g}`);
    r.named = (await prog(p, 'paces')).length === t.runs.length;
    await press(p, 'Give it water');
    r.hotRefused = (await notes(p, 'paces/hot')).length > 0;
    for (const c of ['Walk it until its breathing slows', 'Give it water', 'Rub it down with straw']) await press(p, c);
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'paces');
    await closeAll(p);
    await shot(p, 'gaits-done');
    r.errors = errs;
    out.gaits = r;
    await p.close();
  }

  /* ---- carding (101) ---- */
  if (want('carding')) {
    const { p, errs } = await open(101, 'wool');
    const t = await task(p, 'wool');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'card:wool');
    for (let i = 0; i < t.burrs.length; i++) await press(p, `Burr ${i + 1}`);
    r.burrsOut = (await notes(p, 'wool/burrs')).length === t.burrs.length;
    await press(p, 'Brush the wool');
    r.emptyRefused = (await notes(p, 'wool/x')).length > 0;
    for (let b = 0; b < t.batches; b++) {
      await press(p, 'Load a tuft onto the carder');
      if (b === 0) { await press(p, 'Roll it off'); r.earlyRollRefused = (await notes(p, 'wool/x')).length > 1; }
      await press(p, 'Brush the wool', t.strokes);
      if (b === 0) await shot(p, 'carding-half');
      await press(p, 'Pass it to the other carder');
      await press(p, 'Brush the wool', t.strokes);
      await press(p, 'Roll it off');
    }
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'wool');
    await closeAll(p);
    await shot(p, 'carding-done');
    r.errors = errs;
    out.carding = r;
    await p.close();
  }

  /* ---- errand (102) ---- */
  if (want('errand')) {
    const { p, errs } = await open(102, 'list');
    const t = await task(p, 'list');
    const r = {};
    for (let i = 0; i < t.stalls.length; i++) {
      const s = t.stalls[i];
      await near(p, ...s.at);
      await act(p, `stall:list:${i}`);
      if (i === 0) {
        await press(p, 'Pay and take them');
        r.tooFewRefused = (await notes(p, 'list/few')).length > 0;
        await press(p, 'One more', s.need);
        await press(p, 'Pay and take them');
        r.tooManyRefused = (await notes(p, 'list/x')).length > 0 && (await prog(p, 'list')).length === 0;
        await press(p, 'One fewer');
      } else await press(p, 'One more', s.need - 1);
      await press(p, 'Pay and take them');
      await closeAll(p);
    }
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'list');
    await shot(p, 'errand-done');
    r.errors = errs;
    out.errand = r;
    await p.close();
  }

  /* ---- hourglass (103) ---- */
  if (want('hourglass')) {
    const { p, errs } = await open(103, 'afternoon');
    const t = await task(p, 'afternoon');
    const r = {};
    await near(p, ...t.deeds[0].at);
    await act(p, 'deed:afternoon:0');
    await closeAll(p);
    r.firstDeed = (await prog(p, 'afternoon')).length === 1;
    await near(p, ...t.idle[0].at);
    for (let k = 0; k < 3; k++) { await act(p, 'idle:afternoon:0'); await closeAll(p); }
    await clock(p, 1);
    await p.waitForTimeout(500);
    r.idleNoted = (await notes(p, 'afternoon/idle')).length > 0;
    r.lostAfternoon = (await notes(p, 'afternoon/lost')).length > 0 && (await prog(p, 'afternoon')).length === 0;
    await shot(p, 'hourglass-lost');
    for (let i = 0; i < t.deeds.length; i++) {
      await near(p, ...t.deeds[i].at);
      await act(p, `deed:afternoon:${i}`);
      await closeAll(p);
    }
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'afternoon');
    await shot(p, 'hourglass-done');
    r.errors = errs;
    out.hourglass = r;
    await p.close();
  }

  /* ---- chalk (104) ---- */
  if (want('chalk')) {
    const { p, errs } = await open(104, 'boards');
    const t = await task(p, 'boards');
    const r = {};
    for (let i = 0; i < t.boards.length; i++) {
      const b = t.boards[i];
      await near(p, ...b.at);
      await act(p, `board:boards:${i}`);
      if (i === 0) {
        await press(p, 'Laugh and add a line');
        await press(p, 'Walk past');
        r.mockRefused = (await notes(p, 'boards/x')).length > 0 && (await notes(p, 'boards/past')).length > 0;
        await shot(p, 'chalk-board');
      }
      await press(p, 'Scrub it off');
      if (i === 0) {
        await press(p, `Write: “${b.flatter}”`);
        r.flatterRefused = (await notes(p, 'boards/flatter')).length > 0 && (await prog(p, 'boards')).length === 0;
      }
      await press(p, `Write: “${b.good}”`);
      await closeAll(p);
    }
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'boards');
    await shot(p, 'chalk-done');
    r.errors = errs;
    out.chalk = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.gaits || (out.gaits.wrongRefused && out.gaits.hotRefused && out.gaits.done)) && (!out.carding || (out.carding.emptyRefused && out.carding.earlyRollRefused && out.carding.done)) && (!out.errand || (out.errand.tooFewRefused && out.errand.tooManyRefused && out.errand.done)) && (!out.hourglass || (out.hourglass.idleNoted && out.hourglass.lostAfternoon && out.hourglass.done)) && (!out.chalk || (out.chalk.mockRefused && out.chalk.flatterRefused && out.chalk.done));
  process.exit(ok ? 0 : 1);
})();
