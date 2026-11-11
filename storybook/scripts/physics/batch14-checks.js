// Real-input checks for the kinds of play added with surahs 95-99, through
// their own panels and the explorer's position (no `solve`):
//  - oilpress (At-Tin): tightening too soon, skimming early and pouring from the bottom are refused; the full pressing finishes it.
//  - pen (Al-Alaq): a blunt pen, a dry reed, a dot out of order and dipping a wet reed are refused; cutting and tracing all finishes it.
//  - abacus (Al-Qadr): a wrong count and going past 1000 are refused; stepping off the mat is noted; counting and keeping the night finishes it.
//  - sight (Al-Bayyinah): a stake off the line is refused; stakes on the line finish it.
//  - speck (Az-Zalzalah): the small wrong is refused; the small good at every spot finishes it.
// Usage: node batch14-checks.js   (web build served on :8090, or PORT)
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
  /* ---- oilpress (95) ---- */
  if (want('oilpress')) {
    const { p, errs } = await open(95, 'press');
    const t = await task(p, 'press');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'press:press');
    await press(p, 'Turn the millstone', t.turns);
    await press(p, 'Spread paste on a mat', t.mats);
    r.milledAndSpread = (await prog(p, 'press')).length === 2;
    await press(p, 'Tighten the press');
    await press(p, 'Tighten the press');
    r.tooSoonRefused = (await notes(p, 'press/x')).length > 0;
    await shot(p, 'oilpress-tighten');
    for (let k = 1; k < t.presses; k++) { await p.waitForTimeout(1800); await press(p, 'Tighten the press'); }
    r.pressed = (await prog(p, 'press')).length === 3;
    await press(p, 'Skim the top layer');
    r.earlyRefused = (await notes(p, 'press/early')).length > 0 && (await prog(p, 'press')).length === 3;
    await press(p, 'Pour from the bottom');
    r.bottomRefused = (await notes(p, 'press/bottom')).length > 0;
    await p.waitForTimeout(t.settle * 1000 + 600);
    await shot(p, 'oilpress-settled');
    await press(p, 'Skim the top layer');
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'press');
    await closeAll(p);
    await shot(p, 'oilpress-done');
    r.errors = errs;
    out.oilpress = r;
    await p.close();
  }

  /* ---- pen (96) ---- */
  if (want('pen')) {
    const { p, errs } = await open(96, 'pen');
    const t = await task(p, 'pen');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'pen:pen');
    await press(p, 'Split the tip');
    await press(p, 'Cut straight across');
    await press(p, 'Split the tip');
    r.bluntRefused = (await notes(p, 'pen/blunt')).length >= 2 && (await prog(p, 'pen')).length === 0;
    await press(p, 'Cut at a slant');
    await press(p, 'Split the tip');
    r.cut = (await prog(p, 'pen')).includes(0);
    await press(p, 'Dot 1');
    r.dryRefused = (await notes(p, 'pen/dry')).length > 0;
    await press(p, 'Dip the pen');
    let ink = t.ink;
    await press(p, 'Dip the pen');
    r.floodRefused = (await notes(p, 'pen/flood')).length > 0;
    await press(p, 'Dot 2');
    r.orderRefused = (await notes(p, 'pen/order')).length > 0;
    for (const L of t.letters) {
      for (let k = 0; k < L.pts.length; k++) {
        if (ink === 0) { await press(p, 'Dip the pen'); ink = t.ink; }
        await press(p, `Dot ${k + 1}`);
        ink--;
      }
      await shot(p, `pen-${L.name.replace(/ /g, '-')}`);
    }
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'pen');
    await closeAll(p);
    await shot(p, 'pen-done');
    r.errors = errs;
    out.pen = r;
    await p.close();
  }

  /* ---- abacus (97) ---- */
  if (want('abacus')) {
    const { p, errs } = await open(97, 'night');
    const t = await task(p, 'night');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'count:night');
    await press(p, 'That is a thousand months');
    r.wrongCountRefused = (await notes(p, 'night/x')).length > 0;
    await press(p, 'Add ten years', 8);
    await press(p, 'Add a year', 4);
    r.overRefused = (await notes(p, 'night/over')).length > 0;
    await press(p, 'Add a month', 4);
    await press(p, 'That is a thousand months');
    r.counted = (await prog(p, 'night')).includes(0);
    await closeAll(p);
    await stand(p, ...t.mat);
    await clock(p, 3);
    await stand(p, t.mat[0] + 4, t.mat[1] + 3);
    await clock(p, 1);
    r.stirNoted = (await notes(p, 'night/stir')).length > 0;
    await stand(p, ...t.mat);
    await clock(p, t.secs / 3 + 1);
    await shot(p, 'abacus-watch1');
    await clock(p, (t.secs * 2) / 3 + 2);
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'night');
    await closeAll(p);
    await shot(p, 'abacus-dawn');
    r.errors = errs;
    out.abacus = r;
    await p.close();
  }

  /* ---- sight (98) ---- */
  if (want('sight')) {
    const { p, errs } = await open(98, 'row');
    const t = await task(p, 'row');
    const r = {};
    const at = (u, side) => [t.a[0] + (t.b[0] - t.a[0]) * u, t.a[1] + (t.b[1] - t.a[1]) * u + side];
    await stand(p, ...at(0.2, 1.6));
    await act(p, 'stake:row');
    r.offLineRefused = (await notes(p, 'row/x')).length > 0 && (await prog(p, 'row')).length === 0;
    for (let k = 1; k <= t.stakes; k++) {
      await stand(p, ...at(k / (t.stakes + 1), 0.2));
      await act(p, 'stake:row');
      await closeAll(p);
    }
    await p.waitForTimeout(300);
    r.planted = (await prog(p, 'row')).length;
    r.done = await isDone(p, 'row');
    await closeAll(p);
    await stand(p, t.a[0] - 3, t.a[1] + 1);
    await shot(p, 'sight-done');
    r.errors = errs;
    out.sight = r;
    await p.close();
  }

  /* ---- speck (99) ---- */
  if (want('speck')) {
    const { p, errs } = await open(99, 'moments');
    const t = await task(p, 'moments');
    const r = {};
    for (let i = 0; i < t.spots.length; i++) {
      const s = t.spots[i];
      await near(p, ...s.at);
      await act(p, `spot:moments:${i}`);
      if (i === 0) {
        await press(p, s.bad);
        r.wrongRefused = (await notes(p, 'moments/x')).length > 0 && (await prog(p, 'moments')).length === 0;
      }
      await press(p, s.good);
      await closeAll(p);
    }
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'moments');
    await shot(p, 'speck-done');
    r.errors = errs;
    out.speck = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.oilpress || (out.oilpress.tooSoonRefused && out.oilpress.earlyRefused && out.oilpress.bottomRefused && out.oilpress.done)) && (!out.pen || (out.pen.bluntRefused && out.pen.dryRefused && out.pen.floodRefused && out.pen.orderRefused && out.pen.done)) && (!out.abacus || (out.abacus.wrongCountRefused && out.abacus.overRefused && out.abacus.stirNoted && out.abacus.done)) && (!out.sight || (out.sight.offLineRefused && out.sight.done)) && (!out.speck || (out.speck.wrongRefused && out.speck.done));
  process.exit(ok ? 0 : 1);
})();
