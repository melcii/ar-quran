// Real-input checks for the kinds of play added with surahs 60-64, through
// their own panels and the explorer's position (no `solve`):
//  - span (Al-Mumtahanah): a short plank is refused; spending a long plank on a narrow gap leaves no way on, and planks can be lifted; the right planks finish the bridge, which can then be walked on.
//  - bond (As-Saff): a joint over a joint is refused; four bonded courses and a push finish the wall.
//  - friday (Al-Jumu'ah): the wrong fruit is refused; selling after the call is refused; closing, the mosque, and selling again finish it.
//  - chances (Al-Munafiqun): a lantern left too long goes out (noted); reaching the lit ones finishes it.
//  - pack (At-Taghabun): a stop you did not pack for is refused; repacking and walking on finishes it.
// Usage: node batch7-checks.js   (web build served on :8090, or PORT)
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

  /* ---- span (60) ---- */
  if (want('span')) {
    const { p, errs } = await open(60, 'bridge');
    const t = await task(p, 'bridge');
    const r = {};
    const ok = (x, z) => p.evaluate(([x, z]) => globalThis.__adv.game.space.okSpot(x, z, 0.35), [x, z]);
    r.waterBefore = !(await ok(0, 0));
    await stand(p, t.posts[0][0] - 1.5, t.posts[0][1]);
    await act(p, 'span:bridge');
    const plank = (len) => p.getByLabel(`Plank of ${len.toFixed(1)} m`).click().then(() => p.waitForTimeout(250));
    await plank(2.9);
    r.shortRefused = (await prog(p, 'bridge')).length === 0;
    // Careless: the longest plank on the first, narrow gap.
    await plank(4.5);
    await plank(4.1);
    await plank(3.3);
    r.wasteNoted = (await notes(p, 'bridge/waste')).length > 0;
    await shot(p, 'span-stuck');
    for (let k = 0; k < 3; k++) {
      await p.getByLabel('Lift the last plank').click();
      await p.waitForTimeout(250);
    }
    r.lifted = (await prog(p, 'bridge')).length === 0;
    for (const len of [3.1, 4.1, 3.3, 4.5, 3.5]) await plank(len);
    r.done = await isDone(p, 'bridge');
    await closeAll(p);
    await p.waitForTimeout(800);
    r.walkable = await ok(0, 0);
    await stand(p, 6.5, 0);
    await shot(p, 'span-done');
    r.errors = errs;
    out.span = r;
    await p.close();
  }

  /* ---- bond (61) ---- */
  if (want('bond')) {
    const { p, errs } = await open(61, 'wall');
    const t = await task(p, 'wall');
    const r = { courses: [] };
    await stand(p, t.at[0], t.at[1] + 2.4);
    await act(p, 'wall:wall');
    const lay = async (seq) => { for (const b of seq) { await p.getByLabel(b === 2 ? 'Long stone' : 'Short stone').click(); await p.waitForTimeout(120); } };
    await lay([2, 2, 2, 2, 1]);
    r.courses.push((await prog(p, 'wall')).includes(0));
    await lay([2]);
    r.jointRefused = (await notes(p, 'wall/x')).length > 0 && !(await prog(p, 'wall')).includes(1);
    await shot(p, 'bond-refused');
    await p.getByLabel('Take the last stone back').count().then(async (c) => { if (c) await p.getByLabel('Take the last stone back').click(); });
    await lay([1, 2, 2, 2, 2]);
    r.courses.push((await prog(p, 'wall')).includes(1));
    await lay([2, 2, 2, 2, 1]);
    r.courses.push((await prog(p, 'wall')).includes(2));
    await lay([1, 2, 2, 2, 2]);
    r.courses.push((await prog(p, 'wall')).includes(3));
    await p.getByLabel('Push the wall').click();
    await p.waitForTimeout(400);
    r.done = await isDone(p, 'wall');
    await closeAll(p);
    await shot(p, 'bond-done');
    r.errors = errs;
    out.bond = r;
    await p.close();
  }

  /* ---- friday (62) ---- */
  if (want('friday')) {
    const { p, errs } = await open(62, 'friday');
    const t = await task(p, 'friday');
    const r = {};
    const S = t.sales;
    const sell = async (n) => { const q = n >= S + 2 ? n - 1 : n; await p.getByLabel(`Sell ${t.goods[t.orders[q % t.orders.length]]}`).click(); await p.waitForTimeout(250); };
    await stand(p, t.stall[0] + 1.6, t.stall[1]);
    await act(p, 'stall:friday');
    await p.getByLabel(`Sell ${t.goods[(t.orders[0] + 1) % t.goods.length]}`).click();
    await p.waitForTimeout(200);
    r.wrongRefused = (await prog(p, 'friday')).length === 0;
    for (let n = 0; n < S; n++) await sell(n);
    r.morning = (await prog(p, 'friday')).length === S;
    await shot(p, 'friday-call');
    await p.getByLabel(`Sell ${t.goods[0]}`).click();
    await p.waitForTimeout(200);
    r.afterCallRefused = (await notes(p, 'friday/x')).length > 0 && (await prog(p, 'friday')).length === S;
    await p.getByLabel('Close the stall').click();
    await p.waitForTimeout(300);
    await closeAll(p);
    await stand(p, t.mosque[0], t.mosque[1] + 1.5);
    await act(p, 'mosque:friday');
    r.prayer = (await prog(p, 'friday')).includes(S + 1);
    await closeAll(p);
    await stand(p, t.stall[0] + 1.6, t.stall[1]);
    await act(p, 'stall:friday');
    for (let n = S + 2; n < 2 * S + 2; n++) await sell(n);
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'friday');
    await closeAll(p);
    r.errors = errs;
    out.friday = r;
    await p.close();
  }

  /* ---- chances (63) ---- */
  if (want('chances')) {
    const { p, errs } = await open(63, 'now');
    const t = await task(p, 'now');
    const r = { taken: 0 };
    const cur = () => p.evaluate(() => globalThis.__adv.game.mech.now?.cur ?? -1);
    // Let the first lantern burn out.
    await stand(p, 0, 26);
    const w0 = Date.now();
    while ((await notes(p, 'now/passed')).length === 0 && Date.now() - w0 < 300000) await p.waitForTimeout(500);
    r.passedNoted = (await notes(p, 'now/passed')).length > 0;
    for (let k = 0; k < 12 && !(await isDone(p, 'now')); k++) {
      let c = await cur();
      const w1 = Date.now();
      while (c < 0 && Date.now() - w1 < 60000) { await p.waitForTimeout(300); c = await cur(); }
      const sp = t.spots[c];
      await nearNow(p, sp.at[0], sp.at[1]);
      await p.waitForTimeout(500);
      if (k === 0) await shot(p, 'chances-lit');
      await act(p, 'help:now');
      if ((await prog(p, 'now')).includes(c)) r.taken++;
    }
    r.done = await isDone(p, 'now');
    await closeAll(p);
    r.errors = errs;
    out.chances = r;
    await p.close();
  }

  /* ---- pack (64) ---- */
  if (want('pack')) {
    const { p, errs } = await open(64, 'walk');
    const t = await task(p, 'walk');
    const r = {};
    const tog = async (name, inBag) => { await p.getByLabel(`${inBag ? 'Take out' : 'Pack'} the ${name}`).click(); await p.waitForTimeout(150); };
    await near(p, ...t.at);
    await act(p, 'bag:walk');
    await tog('gold bangles', false);
    await tog('silver mirror', false);
    await tog('water skin', false);
    await shot(p, 'pack-shiny');
    await p.getByLabel('Set off').click();
    await p.waitForTimeout(300);
    await closeAll(p);
    await near(p, ...t.stops[0].at);
    await act(p, 'stop:walk:0');
    r.stop0 = (await prog(p, 'walk')).includes(0);
    await near(p, ...t.stops[1].at);
    await act(p, 'stop:walk:1');
    r.unpackedRefused = (await notes(p, 'walk/x')).length > 0 && !(await prog(p, 'walk')).includes(1);
    await near(p, ...t.at);
    await act(p, 'bag:walk');
    await tog('gold bangles', true);
    await tog('silver mirror', true);
    await tog('bread and cheese', false);
    await tog('warm cloak', false);
    await tog('jar of honey for the family', false);
    await p.getByLabel('Set off').click();
    await p.waitForTimeout(300);
    await closeAll(p);
    for (let k = 1; k < t.stops.length; k++) {
      await near(p, ...t.stops[k].at);
      await act(p, `stop:walk:${k}`);
    }
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'walk');
    await closeAll(p);
    r.errors = errs;
    out.pack = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.span || (out.span.shortRefused && out.span.wasteNoted && out.span.lifted && out.span.done && out.span.waterBefore && out.span.walkable)) && (!out.bond || (out.bond.jointRefused && out.bond.done)) && (!out.friday || (out.friday.wrongRefused && out.friday.afterCallRefused && out.friday.prayer && out.friday.done)) && (!out.chances || (out.chances.passedNoted && out.chances.done)) && (!out.pack || (out.pack.unpackedRefused && out.pack.done));
  process.exit(ok ? 0 : 1);
})();
