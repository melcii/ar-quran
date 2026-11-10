// Real-input checks for the kinds of play added with surahs 50-54, through
// their own panels, the explorer's walking and the game clock (no `solve`):
//  - rootbox (Qaf): a wrong depth is refused; waiting without water is refused; three days grow.
//  - release (Adh-Dhariyat): puffs let go at the wrong moment blow away; at the right moment they reach the bed.
//  - blazes (At-Tur): walking a branch without blazes is noted; walking the blazed way reaches every lookout.
//  - starhop (An-Najm): wrong stars are refused; the belt then Sirius finish it.
//  - recall (Al-Qamar): an out-of-order piece is refused; the refrain is rebuilt at all four stones.
// Usage: node batch5-checks.js   (web build served on :8090, or PORT)
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


  /* ---- rootbox (50) ---- */
  if (want('rootbox')) {
    const { p, errs } = await open(50, 'boxes');
    const t = await task(p, 'boxes');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'box:boxes');
    const DEPTH = ['Near the top', 'In the middle', 'Deep down'];
    await p.getByLabel(`Sow the ${t.seeds[0].name}: ${DEPTH[2]}`).click();
    await p.waitForTimeout(200);
    r.wrongDepthRefused = (await prog(p, 'boxes')).length === 0;
    for (const sd of t.seeds) {
      await p.getByLabel(`Sow the ${sd.name}: ${DEPTH[sd.depth - 1]}`).click();
      await p.waitForTimeout(250);
    }
    await p.getByLabel('Wait for tomorrow').click();
    await p.waitForTimeout(200);
    r.dryRefused = (await prog(p, 'boxes')).length === t.seeds.length;
    for (let k = 0; k < t.days; k++) {
      await p.getByLabel('Water the boxes').click();
      await p.waitForTimeout(200);
      await p.getByLabel('Wait for tomorrow').click();
      await p.waitForTimeout(400);
      if (k === 1) await shot(p, 'rootbox-day2');
    }
    r.done = await isDone(p, 'boxes');
    await closeAll(p);
    r.errors = errs;
    out.rootbox = r;
    await p.close();
  }

  /* ---- release (51) ---- */
  if (want('release')) {
    const { p, errs } = await open(51, 'sow');
    const t = await task(p, 'sow');
    const r = {};
    const wait = (i, ok) => p.waitForFunction(([turn, b, ok]) => {
      const w = globalThis.__adv.game.clock * turn;
      const d = Math.abs(Math.atan2(Math.sin(w - b), Math.cos(w - b)));
      return ok ? d < 0.12 : d > 1.2;
    }, [t.turn, Math.atan2(t.posts[i].bed[0] - t.posts[i].at[0], t.posts[i].bed[1] - t.posts[i].at[1]), ok], { timeout: 400000, polling: 30 });
    for (let i = 0; i < t.posts.length; i++) {
      await near(p, ...t.posts[i].at);
      if (i === 0) {
        await wait(0, false);
        await p.evaluate(() => globalThis.__adv.act('puff:sow:0'));
        await p.waitForTimeout(300);
        r.wrongMomentMissed = (await prog(p, 'sow')).length === 0;
        await shot(p, 'release-miss');
      }
      await wait(i, true);
      await p.evaluate((i) => globalThis.__adv.act(`puff:sow:${i}`), i);
      await p.waitForTimeout(300);
    }
    r.sown = (await prog(p, 'sow')).length;
    r.done = await isDone(p, 'sow');
    r.errors = errs;
    out.release = r;
    await p.close();
  }

  /* ---- blazes (52) ---- */
  if (want('blazes')) {
    const { p, errs } = await open(52, 'climb');
    const t = await task(p, 'climb');
    const r = { reached: [] };
    const walk = (x, z, until) => p.evaluate(async ([x, z, until]) => {
      const A = globalThis.__adv;
      A.go(x, z);
      const w0 = performance.now();
      while (performance.now() - w0 < 240000) {
        const s = A.save();
        if (until === 'note' ? (s.prog['climb/x'] ?? []).length > 0 : (s.prog.climb ?? []).length > until || s.done.includes('climb')) return true;
        if (Math.hypot(A.player.pos.x - x, A.player.pos.z - z) < 0.8 && until !== 'note') return false;
        await new Promise((res) => setTimeout(res, 200));
      }
      return false;
    }, [x, z, until]);
    r.reached.push(await walk(...t.lookouts[0].at, 0));
    await closeAll(p);
    r.deadEndNoted = await walk(...t.ends[0].at, 'note');
    await shot(p, 'blazes-deadend');
    for (let i = 1; i < t.lookouts.length; i++) {
      r.reached.push(await walk(...t.lookouts[i].at, i));
      await closeAll(p);
    }
    r.done = await isDone(p, 'climb');
    r.errors = errs;
    out.blazes = r;
    await p.close();
  }

  /* ---- starhop (53) ---- */
  if (want('starhop')) {
    const { p, errs } = await open(53, 'sirius');
    const t = await task(p, 'sirius');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'sky:sirius');
    await p.getByLabel('Star 1: a reddish star at the top left').click();
    await p.waitForTimeout(200);
    r.wrongStarRefused = (await prog(p, 'sirius')).length === 0;
    for (const n of [3, 4, 5]) {
      await p.getByLabel(`Star ${n}, in a short row`).click();
      await p.waitForTimeout(200);
    }
    r.belt = (await prog(p, 'sirius')).length;
    await shot(p, 'starhop-belt');
    await p.getByLabel('Star 9: an orange star far to the right').click();
    await p.waitForTimeout(200);
    r.wrongWayRefused = (await prog(p, 'sirius')).length === 3;
    await p.getByLabel('Star 8: Sirius').click();
    await p.waitForTimeout(400);
    r.done = await isDone(p, 'sirius');
    r.errors = errs;
    out.starhop = r;
    await p.close();
  }

  /* ---- recall (54) ---- */
  if (want('recall')) {
    const { p, errs } = await open(54, 'remember');
    const t = await task(p, 'remember');
    const r = { stones: [] };
    for (let k = 0; k < t.stones.length; k++) {
      await near(p, ...t.stones[k].at);
      await act(p, `stone:remember:${k}`);
      await closeAll(p);
      await act(p, `refrain:remember:${k}`);
      const first = t.pieces.length - Math.min(t.pieces.length, t.stones[k].hide);
      if (k === 0) {
        await p.getByLabel(`Piece: ${t.pieces[t.pieces.length - 1]}`).click();
        await p.waitForTimeout(200);
        r.outOfOrderRefused = !(await prog(p, 'remember')).includes(1);
      }
      if (k === t.stones.length - 1) await shot(p, 'recall-last');
      for (let j = first; j < t.pieces.length; j++) {
        await p.getByLabel(`Piece: ${t.pieces[j]}`).click();
        await p.waitForTimeout(200);
      }
      await p.waitForTimeout(300);
      r.stones.push((await prog(p, 'remember')).includes(k * 2 + 1));
    }
    r.done = await isDone(p, 'remember');
    r.errors = errs;
    out.recall = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.rootbox || (out.rootbox.wrongDepthRefused && out.rootbox.dryRefused && out.rootbox.done)) && (!out.release || (out.release.wrongMomentMissed && out.release.done)) && (!out.blazes || (out.blazes.deadEndNoted && out.blazes.done)) && (!out.starhop || (out.starhop.wrongStarRefused && out.starhop.wrongWayRefused && out.starhop.done)) && (!out.recall || (out.recall.outOfOrderRefused && out.recall.done));
  process.exit(ok ? 0 : 1);
})();
