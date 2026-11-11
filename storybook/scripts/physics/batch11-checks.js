// Real-input checks for the kinds of play added with surahs 80-84, through
// their own panels and the explorer's position (no `solve`):
//  - furrows ('Abasa): a furrow that wanders is refused; walking each straight finishes it.
//  - bearings (At-Takwir): reaching a wrong cairn is noted; the right cairns in turn finish it.
//  - beam (Al-Infitar): not leaning tips you off; leaning against the tip crosses every log.
//  - inspect (Al-Mutaffifin): judging before testing does nothing; a wrong verdict is noted; right verdicts finish it.
//  - stages (Al-Inshiqaq): a too-long stage and a slow plan are refused; the fewest stages, then camping at each, finish it.
// Usage: node batch11-checks.js   (web build served on :8090, or PORT)
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
  const waitFor = (p, fn, arg, ms = 60000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 200 }).then(() => true, () => false);

  /* ---- furrows (80) ---- */
  if (want('furrows')) {
    const { p, errs } = await open(80, 'plough');
    const t = await task(p, 'plough');
    const r = { lanes: [] };
    const lx = (k) => t.x0 + k * t.gap;
    const ends = (k) => (k % 2 ? [t.z1, t.z0] : [t.z0, t.z1]);
    // A wandering furrow first.
    await stand(p, lx(0), ends(0)[0]);
    await p.evaluate(([x, z]) => globalThis.__adv.go(x, z), [lx(0) + 3.5, (t.z0 + t.z1) / 2]);
    r.wanderRefused = await waitFor(p, () => (globalThis.__adv.save().prog['plough/x'] ?? []).length > 0, null, 40000);
    await closeAll(p);
    for (let k = 0; k < t.n; k++) {
      const [a, b] = ends(k);
      await closeAll(p);
      // Face down the furrow first, as a player turns before setting off.
      await stand(p, lx(k) - 3, a);
      await p.evaluate(([x, z]) => globalThis.__adv.go(x, z), [lx(k) - 3, a + (b > a ? 2 : -2)]);
      await p.waitForTimeout(1500);
      await stand(p, lx(k), a);
      await p.evaluate(([x, z]) => globalThis.__adv.go(x, z), [lx(k), b + (b > a ? 0.6 : -0.6)]);
      r.lanes.push(await waitFor(p, (k) => (globalThis.__adv.save().prog.plough ?? []).includes(k) || globalThis.__adv.save().done.includes('plough'), k, 60000));
    }
    r.done = await isDone(p, 'plough');
    await closeAll(p);
    await shot(p, 'furrows-done');
    r.errors = errs;
    out.furrows = r;
    await p.close();
  }

  /* ---- bearings (81) ---- */
  if (want('bearings')) {
    const { p, errs } = await open(81, 'way');
    const t = await task(p, 'way');
    const r = {};
    await near(p, ...t.cairns[t.route[0]].at);
    await stand(p, t.cairns[5].at[0] + 0.8, t.cairns[5].at[1]);
    await clock(p, 1);
    r.wrongNoted = (await notes(p, 'way/x')).length > 0 && (await prog(p, 'way')).length === 0;
    for (let k = 1; k < t.route.length; k++) {
      const c = t.cairns[t.route[k]];
      await stand(p, c.at[0] + 0.8, c.at[1]);
      await clock(p, 1);
      await closeAll(p);
    }
    r.done = await isDone(p, 'way');
    await shot(p, 'bearings-done');
    r.errors = errs;
    out.bearings = r;
    await p.close();
  }

  /* ---- beam (82) ---- */
  if (want('beam')) {
    const { p, errs } = await open(82, 'logs');
    const t = await task(p, 'logs');
    const r = { logs: [] };
    for (let i = 0; i < t.logs.length; i++) {
      await near(p, ...t.logs[i].at);
      await act(p, 'beam:logs');
      if (i === 0) {
        await press(p, 'Start across');
        r.tippedOff = await waitFor(p, () => (globalThis.__adv.save().prog['logs/x'] ?? []).length > 0, null, 30000);
      }
      await press(p, 'Start across');
      // Lean against the tip as a player watching the meter would.
      r.logs.push(await p.evaluate(async (i) => {
        const w0 = performance.now();
        while (performance.now() - w0 < 40000) {
          const s = globalThis.__adv.save();
          if ((s.prog.logs ?? []).includes(i) || s.done.includes('logs')) return true;
          const b = globalThis.__beam;
          if (b && b.tilt > 0.12) document.querySelector('[aria-label="Lean left"]')?.click();
          else if (b && b.tilt < -0.12) document.querySelector('[aria-label="Lean right"]')?.click();
          await new Promise((r) => setTimeout(r, 50));
        }
        return false;
      }, i));
      await closeAll(p);
    }
    r.done = await isDone(p, 'logs');
    await shot(p, 'beam-done');
    r.errors = errs;
    out.beam = r;
    await p.close();
  }

  /* ---- inspect (83) ---- */
  if (want('inspect')) {
    const { p, errs } = await open(83, 'measures');
    const t = await task(p, 'measures');
    const r = {};
    for (let i = 0; i < t.stalls.length; i++) {
      const s = t.stalls[i];
      await stand(p, s.at[0] + (s.at[0] < 0 ? 1.4 : -1.4), s.at[1]);
      await act(p, `stall:measures:${i}`);
      const honest = s.buy === 1 && s.sell === 1;
      if (i === 0) {
        await press(p, 'Honest measures');
        r.untestedIgnored = (await prog(p, 'measures')).length === 0;
      }
      await press(p, 'Test the buying measure');
      await press(p, 'Test the selling measure');
      if (i === 1) {
        await press(p, 'Honest measures');
        r.wrongNoted = (await notes(p, 'measures/x')).length > 0 && !(await prog(p, 'measures')).includes(1);
      }
      await press(p, honest ? 'Honest measures' : 'Takes in full, gives short');
      await p.waitForTimeout(200);
      await closeAll(p);
    }
    r.done = await isDone(p, 'measures');
    await shot(p, 'inspect-done');
    r.errors = errs;
    out.inspect = r;
    await p.close();
  }

  /* ---- stages (84) ---- */
  if (want('stages')) {
    const { p, errs } = await open(84, 'road');
    const t = await task(p, 'road');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'plan:road');
    const tog = (km) => press(p, `Well at ${km} km`);
    await tog(90);
    await press(p, 'Set out');
    r.longRefused = (await notes(p, 'road/long')).length > 0;
    for (const km of [18, 30, 41, 55, 62, 78]) await tog(km);
    await press(p, 'Set out');
    r.slowRefused = (await notes(p, 'road/slow')).length > 0 && (await prog(p, 'road')).length === 0;
    await tog(30);
    await tog(55);
    await press(p, 'Set out');
    await p.waitForTimeout(300);
    r.planned = (await prog(p, 'road')).includes(0);
    const plan = await notes(p, 'road/plan');
    r.plan = plan;
    const at = (k) => { const f = t.wells[k] / t.wells[t.wells.length - 1], R = t.road, seg = f * (R.length - 1), a = Math.min(R.length - 2, Math.floor(seg)), u = seg - a; return [R[a][0] + (R[a + 1][0] - R[a][0]) * u, R[a][1] + (R[a + 1][1] - R[a][1]) * u]; };
    for (const k of plan) {
      await near(p, ...at(k));
      await act(p, 'camp:road');
      await closeAll(p);
    }
    r.done = await isDone(p, 'road');
    await shot(p, 'stages-done');
    r.errors = errs;
    out.stages = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.furrows || (out.furrows.wanderRefused && out.furrows.done)) && (!out.bearings || (out.bearings.wrongNoted && out.bearings.done)) && (!out.beam || (out.beam.tippedOff && out.beam.done)) && (!out.inspect || (out.inspect.untestedIgnored && out.inspect.wrongNoted && out.inspect.done)) && (!out.stages || (out.stages.longRefused && out.stages.slowRefused && out.stages.done));
  process.exit(ok ? 0 : 1);
})();
