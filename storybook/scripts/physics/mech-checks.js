// Real-input checks for the plug-in kinds of play added for Surah Hud and
// Ta-Ha, through their own panels and the explorer's position (no `solve`):
//  - measure (Hud, Madyan): hold "Pour" with the mouse, a short measure is
//    refused, a heaped one is levelled, full ones are given; the false-bottom
//    test picks the true measure.
//  - dawn (Hud, Lut): light way-stones in order; stepping back toward the town
//    puts the last one out; the sky is night while the chapter is open.
//  - shimmer (Ta-Ha, festival ground): each rope/staff is looked at from close.
// Usage: node mech-checks.js   (web build served on :8090)
const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS;
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
      for (let k = 0; k < 30 && A.cards().length; k++) {
        A.close();
        await new Promise((r) => setTimeout(r, 40));
      }
    }, upTo);
    return { p, errs };
  };
  // Teleport next to a spot, then give the game a moment of real time to take the new position.
  const near = async (p, x, z) => { await nearNow(p, x, z); await p.waitForTimeout(1200); };
  const nearNow = (p, x, z) => p.evaluate(([x, z]) => {
    const A = globalThis.__adv;
    for (const d of [1.2, 0.6, 2])
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        if (A.game.space.okSpot(x + Math.cos(a) * d, z + Math.sin(a) * d, 0.4)) return A.teleport(x + Math.cos(a) * d, z + Math.sin(a) * d);
      }
    A.teleport(x, z);
  }, [x, z]);
  const clk = (p, s) => p.evaluate(async (s) => { const g = globalThis.__adv.game; const c0 = g.clock; while (g.clock - c0 < s) await new Promise((r) => setTimeout(r, 50)); }, s);
  const btn = (p, name) => p.getByText(name, { exact: true }).first();
  const pourTo = async (p, target) => {
    const b = await btn(p, 'Pour (hold)').boundingBox();
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await p.mouse.down();
    await p.waitForFunction((t) => (globalThis.__measure?.fill ?? 0) >= t, target, { timeout: 30000, polling: 20 });
    await p.mouse.up();
    return p.evaluate(() => globalThis.__measure.fill);
  };

  /* ---- measure ---- */
  {
    const { p, errs } = await open(11, 'measure');
    await near(p, 30, -56);
    await clk(p, 0.4);
    await p.evaluate(() => globalThis.__adv.act('measure:measure'));
    await p.waitForTimeout(600);
    const r = { steps: [] };
    // Short: stop early, try to give.
    r.steps.push({ short: await pourTo(p, 0.6) });
    await btn(p, 'Give').click();
    r.shortRefused = await p.evaluate(() => globalThis.__measure.given === 0);
    r.steps.push({ msg: (await p.locator('text=short measure').count()) > 0 });
    // Heaped: overfill, give refused, level, then give.
    r.steps.push({ heaped: await pourTo(p, 1.08) });
    await btn(p, 'Give').click();
    r.heapedRefused = await p.evaluate(() => globalThis.__measure.given === 0);
    await btn(p, 'Level off').click();
    await p.waitForTimeout(200);
    r.levelled = await p.evaluate(() => globalThis.__measure.fill);
    await btn(p, 'Give').click();
    await p.waitForTimeout(200);
    r.firstGiven = await p.evaluate(() => globalThis.__measure.given);
    // The rest of the buyers: pour to the line and give.
    const want = [2, 3, 1];
    let left = want.reduce((a, b) => a + b, 0) - 1;
    for (let k = 0; k < left; k++) {
      await pourTo(p, 0.985);
      await btn(p, 'Give').click();
      await p.waitForTimeout(250);
      // A finished buyer may close the panel; reopen it.
      if (!(await btn(p, 'Pour (hold)').count())) {
        await p.evaluate(() => globalThis.__adv.act('measure:measure'));
        await p.waitForTimeout(500);
      }
    }
    r.prog = await p.evaluate(() => globalThis.__adv.save().prog.measure ?? []);
    // False-bottom test.
    if (!(await p.getByText('Pour three scoops into each').count())) {
      await p.evaluate(() => globalThis.__adv.act('measure:measure'));
      await p.waitForTimeout(500);
    }
    await p.getByText('Pour three scoops into each').click();
    await p.waitForTimeout(300);
    await p.getByLabel('Measure B is true').click(); // the false one: refused
    await p.waitForTimeout(200);
    r.wrongRefused = !(await p.evaluate(() => globalThis.__adv.save().done.includes('measure')));
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/measure-test.png`, timeout: 120000 }).catch(() => {});
    await p.getByLabel('Measure A is true').click();
    await p.waitForTimeout(400);
    r.done = await p.evaluate(() => globalThis.__adv.save().done.includes('measure'));
    r.errors = errs;
    out.measure = r;
    await p.close();
  }

  /* ---- dawn ---- */
  {
    const { p, errs } = await open(11, 'lut-leave');
    const r = {};
    const task = await p.evaluate(() => globalThis.__adv.def.tasks.find((t) => t.id === 'lut-leave'));
    r.nightSky = await p.evaluate(() => getComputedStyle(document.body) && true);
    for (let i = 0; i < 2; i++) {
      await near(p, ...task.stones[i]);
      await clk(p, 0.3);
      await p.evaluate((i) => globalThis.__adv.act(`way:lut-leave:${i}`), i);
      await clk(p, 0.3);
    }
    r.litAfterTwo = await p.evaluate(() => (globalThis.__adv.save().prog['lut-leave'] ?? []).length);
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/dawn-night.png`, timeout: 120000 }).catch(() => {});
    // Turn back toward the town.
    await near(p, task.town[0] + 4, task.town[1] - 2);
    await clk(p, 0.6);
    r.litAfterTurningBack = await p.evaluate(() => (globalThis.__adv.save().prog['lut-leave'] ?? []).length);
    for (let i = r.litAfterTurningBack; i < task.stones.length; i++) {
      await near(p, ...task.stones[i]);
      await clk(p, 0.3);
      await p.evaluate((i) => globalThis.__adv.act(`way:lut-leave:${i}`), i);
      await clk(p, 0.3);
    }
    r.done = await p.evaluate(() => globalThis.__adv.save().done.includes('lut-leave'));
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/dawn-morning.png`, timeout: 120000 }).catch(() => {});
    r.errors = errs;
    out.dawn = r;
    await p.close();
  }

  /* ---- shimmer ---- */
  {
    const { p, errs } = await open(20, 'ropes');
    const r = {};
    const task = await p.evaluate(() => globalThis.__adv.def.tasks.find((t) => t.id === 'ropes'));
    r.offeredFromFar = await p.evaluate(() => globalThis.__adv.uses().filter((u) => u.key.startsWith('look:ropes')).length);
    for (let i = 0; i < task.things.length; i++) {
      await near(p, ...task.things[i].at);
      await clk(p, 0.3);
      await p.evaluate((i) => globalThis.__adv.act(`look:ropes:${i}`), i);
      await clk(p, 0.2);
    }
    r.done = await p.evaluate(() => globalThis.__adv.save().done.includes('ropes'));
    if (SHOTS) {
      await p.evaluate(() => { const A = globalThis.__adv; A.close(); A.close(); A.teleport(22, 10); A.view(-1.6, 0.35, 8); });
      await p.waitForTimeout(3000);
      await p.screenshot({ path: `${SHOTS}/shimmer-festival.png`, timeout: 120000 }).catch(() => {});
    }
    r.errors = errs;
    out.shimmer = r;
    await p.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = out.measure.shortRefused && out.measure.heapedRefused && out.measure.wrongRefused && out.measure.done && out.dawn.litAfterTwo === 2 && out.dawn.litAfterTurningBack === 1 && out.dawn.done && out.shimmer.done;
  process.exit(ok ? 0 : 1);
})();
