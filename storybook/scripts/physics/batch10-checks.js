// Real-input checks for the kinds of play added with surahs 75-79, through
// their own panels and the explorer's position (no `solve`):
//  - prints (Al-Qiyamah): a wrong finger is refused; naming each tablet's maker finishes it.
//  - doorstep (Al-Insan): stale food is refused; lingering at the door is noted; slipping away finishes each.
//  - winnow (Al-Mursalat): a toss in calm air is refused; five tosses in a steady breeze finish it.
//  - pegs (An-Naba): a peg out of turn is refused; pairs then resting finish it.
//  - dig (An-Nazi'at): digging past the lining and the wrong tool are refused; lining as you go reaches water.
// Usage: node batch10-checks.js   (web build served on :8090, or PORT)
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

  /* ---- prints (75) ---- */
  if (want('prints')) {
    const { p, errs } = await open(75, 'prints');
    const t = await task(p, 'prints');
    const r = {};
    for (let i = 0; i < t.tablets.length; i++) {
      const tb = t.tablets[i];
      await stand(p, tb.at[0], tb.at[1] - 1.2);
      await act(p, `tablet:prints:${i}`);
      if (i === 0) {
        await press(p, `My ${t.mine[(tb.of + 1) % t.mine.length].finger}`);
        r.wrongRefused = (await notes(p, 'prints/x')).length > 0 && (await prog(p, 'prints')).length === 0;
      }
      await press(p, tb.of >= 0 ? `My ${t.mine[tb.of].finger}` : 'Not mine');
      await p.waitForTimeout(200);
      await closeAll(p);
    }
    r.done = await isDone(p, 'prints');
    await shot(p, 'prints-done');
    r.errors = errs;
    out.prints = r;
    await p.close();
  }

  /* ---- doorstep (76) ---- */
  if (want('doorstep')) {
    const { p, errs } = await open(76, 'give');
    const t = await task(p, 'give');
    const r = {};
    for (let i = 0; i < t.doors.length; i++) {
      const door = t.doors[i];
      await near(p, ...t.pantry);
      await act(p, 'pantry:give');
      if (i === 0) {
        await press(p, 'Pack: stale bread');
        r.staleRefused = (await notes(p, 'give/x')).length > 0;
      }
      await press(p, `Pack: ${t.foods.find((f) => f.includes(door.wants))}`);
      await closeAll(p);
      await near(p, door.at[0], door.at[1] - 1);
      await act(p, 'knock:give');
      if (i === 0) {
        await clock(p, t.secs + 1.5);
        r.lingerNoted = (await notes(p, 'give/linger')).length > 0 && !(await prog(p, 'give')).includes(0);
      }
      await stand(p, door.at[0], door.at[1] - t.away - 3);
      await clock(p, t.secs + 1);
      await closeAll(p);
    }
    r.done = await isDone(p, 'give');
    await shot(p, 'doorstep-done');
    r.errors = errs;
    out.doorstep = r;
    await p.close();
  }

  /* ---- winnow (77) ---- */
  if (want('winnow')) {
    const { p, errs } = await open(77, 'winnow');
    const t = await task(p, 'winnow');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'winnow:winnow');
    // Wait for the wind as a player watching the flag would, then toss.
    const tossWhen = (lo, hi) => p.evaluate(async ([lo, hi]) => {
      const w0 = performance.now();
      while (performance.now() - w0 < 60000) {
        const w = globalThis.__wind();
        if (w >= lo && w <= hi) { document.querySelector('[aria-label="Toss the grain"]').click(); return w; }
        await new Promise((r) => setTimeout(r, 30));
      }
      return null;
    }, [lo, hi]);
    r.calmAt = await tossWhen(0, t.lo - 0.08);
    await p.waitForTimeout(200);
    r.calmRefused = (await notes(p, 'winnow/calm')).length > 0 && (await prog(p, 'winnow')).length === 0;
    r.tosses = [];
    for (let k = 0; k < t.tosses; k++) {
      r.tosses.push(await tossWhen(t.lo + 0.05, t.hi - 0.05));
      await p.waitForTimeout(400);
    }
    r.done = await isDone(p, 'winnow');
    await closeAll(p);
    await shot(p, 'winnow-done');
    r.errors = errs;
    out.winnow = r;
    await p.close();
  }

  /* ---- pegs (78) ---- */
  if (want('pegs')) {
    const { p, errs } = await open(78, 'tent');
    const t = await task(p, 'tent');
    const r = {};
    const pegAt = (i) => { const a = (i / t.n) * Math.PI * 2; return [t.at[0] + Math.cos(a) * t.r, t.at[1] + Math.sin(a) * t.r]; };
    const drive = async (i) => { const [x, z] = pegAt(i); await stand(p, x + (x - t.at[0]) * 0.25, z + (z - t.at[1]) * 0.25); await act(p, `peg:tent:${i}`); };
    await drive(0);
    await drive(1);
    r.outOfTurnRefused = (await notes(p, 'tent/x')).length > 0 && !(await prog(p, 'tent')).includes(1);
    for (const i of [3, 1, 4, 2, 5]) await drive(i);
    r.pegs = (await prog(p, 'tent')).length;
    await near(p, ...t.at);
    await act(p, 'rest:tent');
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'tent');
    await closeAll(p);
    await shot(p, 'pegs-done');
    r.errors = errs;
    out.pegs = r;
    await p.close();
  }

  /* ---- dig (79) ---- */
  if (want('dig')) {
    const { p, errs } = await open(79, 'well');
    const r = {};
    await near(p, 0, 0);
    await act(p, 'dig:well');
    const S = 'Dig with the spade', P = 'Break with the pick', L = 'Line the walls with stones';
    await press(p, S, 2);
    await press(p, S);
    r.crumbleRefused = (await notes(p, 'well/crumble')).length > 0 && (await prog(p, 'well')).length === 2;
    await press(p, L);
    await press(p, P);
    r.wrongToolRefused = (await notes(p, 'well/x')).length > 0 && (await prog(p, 'well')).length === 2;
    await press(p, S); // 3 m, down to the rock
    await press(p, P); // 4 m
    await press(p, L);
    await press(p, S, 2); // 6 m
    await press(p, L);
    await press(p, S); // 7 m: water
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'well');
    await closeAll(p);
    await shot(p, 'dig-done');
    r.errors = errs;
    out.dig = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.prints || (out.prints.wrongRefused && out.prints.done)) && (!out.doorstep || (out.doorstep.staleRefused && out.doorstep.lingerNoted && out.doorstep.done)) && (!out.winnow || (out.winnow.calmRefused && out.winnow.done)) && (!out.pegs || (out.pegs.outOfTurnRefused && out.pegs.done)) && (!out.dig || (out.dig.crumbleRefused && out.dig.wrongToolRefused && out.dig.done));
  process.exit(ok ? 0 : 1);
})();
