// Real-input checks for the kinds of play added with surahs 65-69, through
// their own panels and the explorer's position (no `solve`):
//  - loads (At-Talaq): overloading a carrier is refused; the exact fit sets off, and arriving finishes it.
//  - amends (At-Tahrim): each spoiled thing along the footprints is put right.
//  - wings (Al-Mulk): a wrong reading of the marked bird is refused; watching five finishes it.
//  - glean (Al-Qalam): picking before the gate is open is refused; picking fallen fruit is refused; the branches finish it.
//  - unseen (Al-Haqqah): a wrong tool is refused; the right tools finish it.
// Usage: node batch8-checks.js   (web build served on :8090, or PORT)
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
  if (want('loads')) {
    const { p, errs } = await open(65, 'move');
    const t = await task(p, 'move');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'load:move');
    const put = async (parcel, cart) => { await p.getByLabel(`Parcel: ${parcel}`).click(); await p.getByLabel(new RegExp(`^Carrier: ${cart}$`)).click(); await p.waitForTimeout(120); };
    await p.getByLabel('Parcel: wooden chest').click();
    await p.getByLabel('Carrier: handcart').click();
    await p.waitForTimeout(150);
    r.overloadRefused = (await notes(p, 'move/x')).length > 0;
    const plan = [['wooden chest', 'big cart'], ['flour sack', 'big cart'], ['cooking pots', 'big cart'], ['grain sack', 'small cart'], ['water jars', 'small cart'], ['bedding', 'donkey'], ['olive oil', 'donkey'], ['lamps', 'handcart'], ['books', 'handcart']];
    for (const [a, c] of plan) await put(a, c);
    await shot(p, 'loads-full');
    await p.getByLabel('Set off').click();
    await p.waitForTimeout(300);
    r.loaded = (await prog(p, 'move')).includes(0);
    await closeAll(p);
    await near(p, ...t.to);
    await act(p, 'arrive:move');
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'move');
    await closeAll(p);
    r.errors = errs;
    out.loads = r;
    await p.close();
  }

  /* ---- amends (66) ---- */
  if (want('amends')) {
    const { p, errs } = await open(66, 'turn');
    const t = await task(p, 'turn');
    const r = { fixed: [] };
    await shot(p, 'amends-trail');
    for (let i = 0; i < t.harms.length; i++) {
      await near(p, ...t.harms[i].at);
      await act(p, `fix:turn:${i}`);
      r.fixed.push((await prog(p, 'turn')).includes(i) || (await isDone(p, 'turn')));
    }
    r.done = await isDone(p, 'turn');
    await closeAll(p);
    r.errors = errs;
    out.amends = r;
    await p.close();
  }

  /* ---- wings (67) ---- */
  if (want('wings')) {
    const { p, errs } = await open(67, 'birds');
    const t = await task(p, 'birds');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'watch:birds');
    await p.waitForTimeout(800);
    await shot(p, 'wings-watch');
    const kind = () => p.evaluate(() => globalThis.__wings?.kind ?? 0);
    const label = (k) => (k === 0 ? 'Wings spread' : 'Beating and folding');
    await p.getByLabel(label(1 - (await kind()))).click();
    await p.waitForTimeout(200);
    r.wrongRefused = (await notes(p, 'birds/x')).length > 0 && (await prog(p, 'birds')).length === 0;
    for (let k = 0; k < t.rounds && !(await isDone(p, 'birds')); k++) {
      await p.waitForTimeout(400);
      await p.getByLabel(label(await kind())).click();
      await p.waitForTimeout(300);
    }
    r.done = await isDone(p, 'birds');
    await closeAll(p);
    r.errors = errs;
    out.wings = r;
    await p.close();
  }

  /* ---- glean (68) ---- */
  if (want('glean')) {
    const { p, errs } = await open(68, 'harvest');
    const t = await task(p, 'harvest');
    const r = {};
    await stand(p, t.trees[0][0] - 1.6, t.trees[0][1]);
    await act(p, 'pick:harvest:0');
    r.earlyRefused = (await notes(p, 'harvest/early')).length > 0 && (await prog(p, 'harvest')).length === 0;
    await stand(p, t.gate[0], t.gate[1] + 1.6);
    await act(p, 'gate:harvest');
    r.opened = (await prog(p, 'harvest')).includes(0);
    await stand(p, t.trees[0][0] + 1.1, t.trees[0][1] + 1.4);
    await act(p, 'fallen:harvest:0');
    r.fallenRefused = (await notes(p, 'harvest/x')).length > 0;
    for (let i = 0; i < t.trees.length; i++) {
      await stand(p, t.trees[i][0] - 1.6, t.trees[i][1]);
      await act(p, `pick:harvest:${i}`);
    }
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'harvest');
    await closeAll(p);
    await shot(p, 'glean-done');
    r.errors = errs;
    out.glean = r;
    await p.close();
  }

  /* ---- unseen (69) ---- */
  if (want('unseen')) {
    const { p, errs } = await open(69, 'unseen');
    const t = await task(p, 'unseen');
    const r = {};
    for (let i = 0; i < t.stations.length; i++) {
      const s = t.stations[i];
      await stand(p, s.at[0], s.at[1] + 1.4);
      await act(p, `probe:unseen:${i}`);
      if (i === 0) {
        await p.getByLabel(`Use the ${t.tools[(s.tool + 1) % t.tools.length]}`).click();
        await p.waitForTimeout(200);
        r.wrongRefused = (await notes(p, 'unseen/x')).length > 0 && (await prog(p, 'unseen')).length === 0;
      }
      await p.getByLabel(`Use the ${t.tools[s.tool]}`).click();
      await p.waitForTimeout(300);
      await closeAll(p);
    }
    r.done = await isDone(p, 'unseen');
    await shot(p, 'unseen-done');
    r.errors = errs;
    out.unseen = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.loads || (out.loads.overloadRefused && out.loads.loaded && out.loads.done)) && (!out.amends || out.amends.done) && (!out.wings || (out.wings.wrongRefused && out.wings.done)) && (!out.glean || (out.glean.earlyRefused && out.glean.fallenRefused && out.glean.done)) && (!out.unseen || (out.unseen.wrongRefused && out.unseen.done));
  process.exit(ok ? 0 : 1);
})();
