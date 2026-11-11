// Real-input checks for the kinds of play added with surahs 70-74, through
// their own panels and the explorer's position (no `solve`):
//  - portion (Al-Ma'arij): too small a share is refused; the known share of each harvest finishes it.
//  - reflect (Nuh): the light starts off the seedling; turning the mirrors to the one fit finishes it.
//  - hush (Al-Jinn): standing still somewhere loud does nothing; a quiet place in each round finishes it.
//  - nightclock (Al-Muzzammil): a wrong time is refused; the third, half and two thirds, then the watch, finish it.
//  - wash (Al-Muddaththir): steps out of order and wringing while the water is cloudy are refused; washing all finishes it.
// Usage: node batch9-checks.js   (web build served on :8090, or PORT)
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

  /* ---- loads (65) ---- */

  const press = async (p, label, n = 1) => { for (let k = 0; k < n; k++) { await p.getByLabel(label, { exact: true }).click(); await p.waitForTimeout(80); } };

  /* ---- portion (70) ---- */
  if (want('portion')) {
    const { p, errs } = await open(70, 'share');
    const t = await task(p, 'share');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'store:share');
    for (let i = 0; i < t.harvests.length; i++) {
      const w = Math.round(t.harvests[i].n / t.part);
      if (i === 1) {
        await press(p, 'One more', w - 1);
        await press(p, 'Set the share aside');
        r.lessRefused = (await notes(p, 'share/less')).length > 0 && !(await prog(p, 'share')).includes(1);
        await press(p, 'One more');
      } else await press(p, 'One more', w);
      await press(p, 'Set the share aside');
      await p.waitForTimeout(150);
    }
    r.done = await isDone(p, 'share');
    await closeAll(p);
    await shot(p, 'portion-done');
    r.errors = errs;
    out.portion = r;
    await p.close();
  }

  /* ---- reflect (71) ---- */
  if (want('reflect')) {
    const { p, errs } = await open(71, 'light');
    const t = await task(p, 'light');
    const r = {};
    const fit = [1, 0, 0, 2];
    r.notAtStart = !(await isDone(p, 'light'));
    for (let i = 0; i < t.mirrors.length; i++) {
      const m = t.mirrors[i];
      await stand(p, t.origin[0] + m.c * t.cell + 0.9, t.origin[1] - m.r * t.cell - 0.9);
      const n = (fit[i] - m.start + 3) % 3;
      for (let k = 0; k < n; k++) await act(p, `turn:light:${i}`);
    }
    await p.waitForTimeout(300);
    r.turns = (await notes(p, 'light/turns')).length;
    r.done = await isDone(p, 'light');
    await closeAll(p);
    await shot(p, 'reflect-done');
    r.errors = errs;
    out.reflect = r;
    await p.close();
  }

  /* ---- hush (72) ---- */
  if (want('hush')) {
    const { p, errs } = await open(72, 'listen');
    const t = await task(p, 'listen');
    const r = { rounds: [] };
    const noise = (rd, x, z) => t.sources.reduce((a, s) => (s.rounds.includes(rd) ? a + s.loud / (1 + (Math.hypot(x - s.at[0], z - s.at[1]) / 6) ** 2) : a), 0);
    // Somewhere loud: beside the stream stones.
    await stand(p, 14 - 2.5, -14 + 2.5);
    await clock(p, 4.5);
    r.loudNothing = (await prog(p, 'listen')).length === 0;
    for (let rd = 0; rd < t.rounds; rd++) {
      // Pick the quietest open spot this round, as a player following the meter would.
      const spots = [];
      for (let x = -36; x <= 36; x += 3) for (let z = -36; z <= 36; z += 3) if (noise(rd, x, z) < t.quiet * 0.8) spots.push([x, z, noise(rd, x, z)]);
      spots.sort((a, b) => a[2] - b[2]);
      let at = null;
      for (const [x, z] of spots) if (await p.evaluate(([x, z]) => globalThis.__adv.game.space.okSpot(x, z, 0.4), [x, z])) { at = [x, z]; break; }
      r.rounds.push({ at, spots: spots.length });
      if (!at) break;
      await stand(p, ...at);
      await clock(p, 4.5);
      await closeAll(p);
    }
    r.done = await isDone(p, 'listen');
    await closeAll(p);
    await shot(p, 'hush-done');
    r.errors = errs;
    out.hush = r;
    await p.close();
  }

  /* ---- nightclock (73) ---- */
  if (want('nightclock')) {
    const { p, errs } = await open(73, 'clock');
    const t = await task(p, 'clock');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'clock:clock');
    const len = (t.dawn + 24 - t.dusk) % 24;
    let h = t.dusk + 2;
    await press(p, 'Set the peg');
    r.wrongRefused = (await notes(p, 'clock/x')).length > 0 && (await prog(p, 'clock')).length === 0;
    for (const m of t.marks) {
      const w = Math.round((t.dusk + len * m.frac) * 4) / 4;
      const steps = Math.round((w - h) * 4);
      await press(p, steps > 0 ? 'Later' : 'Earlier', Math.abs(steps));
      h = w;
      await press(p, 'Set the peg');
      await p.waitForTimeout(150);
    }
    r.pegs = (await prog(p, 'clock')).length;
    await press(p, 'Keep watch');
    await p.waitForTimeout(7000);
    r.done = await isDone(p, 'clock');
    await closeAll(p);
    await shot(p, 'nightclock-done');
    r.errors = errs;
    out.nightclock = r;
    await p.close();
  }

  /* ---- wash (74) ---- */
  if (want('wash')) {
    const { p, errs } = await open(74, 'wash');
    const t = await task(p, 'wash');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'wash:wash');
    await press(p, 'Rinse it');
    r.orderRefused = (await notes(p, 'wash/x')).length > 0;
    for (let i = 0; i < t.items.length; i++) {
      await press(p, 'Soak it in the stream');
      await press(p, 'Scrub it on the stone');
      await press(p, 'Rinse it');
      if (i === 0) {
        await press(p, 'Wring it out');
        r.earlyRefused = (await notes(p, 'wash/early')).length > 0;
      }
      await press(p, 'Rinse it', t.clear - 1);
      await press(p, 'Wring it out');
      await press(p, 'Hang it on the line');
      await p.waitForTimeout(150);
    }
    r.done = await isDone(p, 'wash');
    await closeAll(p);
    await shot(p, 'wash-done');
    r.errors = errs;
    out.wash = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.portion || (out.portion.lessRefused && out.portion.done)) && (!out.reflect || (out.reflect.notAtStart && out.reflect.done)) && (!out.hush || (out.hush.loudNothing && out.hush.done)) && (!out.nightclock || (out.nightclock.wrongRefused && out.nightclock.pegs === 3 && out.nightclock.done)) && (!out.wash || (out.wash.orderRefused && out.wash.earlyRefused && out.wash.done));
  process.exit(ok ? 0 : 1);
})();
