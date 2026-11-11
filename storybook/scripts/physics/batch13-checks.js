// Real-input checks for the kinds of play added with surahs 90-94, through
// their own panels and the explorer's position (no `solve`):
//  - ration (Al-Balad): an unfair share is refused; the fair share, carried to each door, finishes it.
//  - polish (Ash-Shams): rubbing a stubborn spot without paste and paste on clean brass are refused; polishing all finishes it.
//  - pulley (Al-Layl): too few and too many pulleys are refused; the fewest that work finish it.
//  - answer (Ad-Duha): kneading through a knock and closing the gate are refused; answering each and baking finishes it.
//  - knots (Ash-Sharh): a pinned knot is refused; undoing them top first finishes it.
// Usage: node batch13-checks.js   (web build served on :8090, or PORT)
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

  /* ---- ration (90) ---- */
  if (want('ration')) {
    const { p, errs } = await open(90, 'grain');
    const t = await task(p, 'grain');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'ration:grain');
    const who = t.homes.map((h) => h.who);
    await press(p, `One cup more for ${who[0]}`, 6);
    await press(p, `One cup more for ${who[1]}`, 3);
    await press(p, `One cup more for ${who[2]}`, 9);
    await press(p, 'Share it out');
    r.unfairRefused = (await notes(p, 'grain/x')).length > 0 && (await prog(p, 'grain')).length === 0;
    await press(p, `One cup less for ${who[1]}`);
    await press(p, `One cup more for ${who[2]}`);
    await press(p, 'Share it out');
    await p.waitForTimeout(200);
    r.shared = (await prog(p, 'grain')).includes(0);
    await closeAll(p);
    for (let i = 0; i < t.homes.length; i++) {
      await near(p, ...t.homes[i].at);
      await act(p, `bring:grain:${i}`);
      await closeAll(p);
    }
    r.done = await isDone(p, 'grain');
    await shot(p, 'ration-done');
    r.errors = errs;
    out.ration = r;
    await p.close();
  }

  /* ---- polish (91) ---- */
  if (want('polish')) {
    const { p, errs } = await open(91, 'lamp');
    const t = await task(p, 'lamp');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'polish:lamp');
    const h0 = t.hard[0];
    await press(p, `Rub patch ${h0 + 1}`, 2);
    r.stubbornRefused = (await notes(p, 'lamp/x')).length > 0;
    await press(p, 'Use ash paste');
    const plain = [...Array(t.cols * t.rows).keys()].filter((i) => !t.hard.includes(i));
    await press(p, `Rub patch ${plain[0] + 1}`);
    r.scratchRefused = (await notes(p, 'lamp/scratch')).length > 0;
    for (const h of t.hard) await press(p, `Rub patch ${h + 1}`);
    await press(p, 'Put the paste away');
    for (const i of plain) await press(p, `Rub patch ${i + 1}`, 3);
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'lamp');
    await closeAll(p);
    await shot(p, 'polish-done');
    r.errors = errs;
    out.polish = r;
    await p.close();
  }

  /* ---- pulley (92) ---- */
  if (want('pulley')) {
    const { p, errs } = await open(92, 'hoist');
    const t = await task(p, 'hoist');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'hoist:hoist');
    const lab = (k) => `${k} ${k === 1 ? 'pulley' : 'pulleys'}`;
    for (let i = 0; i < t.loads.length; i++) {
      const need = Math.ceil(t.loads[i].kg / t.strength - 1e-9);
      if (i === 1) {
        await press(p, lab(need - 1));
        await press(p, 'Pull');
        r.tooFewRefused = (await notes(p, 'hoist/x')).length > 0;
        await press(p, lab(4));
        await press(p, 'Pull');
        r.tooManyRefused = (await notes(p, 'hoist/more')).length > 0 && !(await prog(p, 'hoist')).includes(1);
      }
      await press(p, lab(need));
      await press(p, 'Pull');
      await p.waitForTimeout(150);
    }
    r.done = await isDone(p, 'hoist');
    await closeAll(p);
    await shot(p, 'pulley-done');
    r.errors = errs;
    out.pulley = r;
    await p.close();
  }

  /* ---- answer (93) ---- */
  if (want('answer')) {
    const { p, errs } = await open(93, 'bake');
    const t = await task(p, 'bake');
    const r = {};
    const knead = async (n) => { await near(p, ...t.oven); for (let k = 0; k < n; k++) { await act(p, 'knead:bake'); await closeAll(p); } };
    for (let c = 0; c < t.callers.length; c++) {
      await knead(3);
      if (c === 0) {
        await knead(1);
        r.ignoreRefused = (await notes(p, 'bake/ignore')).length > 0;
      }
      await near(p, ...t.door);
      await act(p, 'gate:bake');
      if (c === 0) {
        await press(p, 'Close the gate on them');
        r.repelRefused = (await notes(p, 'bake/repel')).length > 0 && (await prog(p, 'bake')).length === 0;
        await press(p, `Give ${t.gifts[(t.callers[c].wants + 1) % t.gifts.length]}`);
        r.wrongGiftNoted = (await notes(p, 'bake/x')).length > 0;
      }
      await press(p, `Give ${t.gifts[t.callers[c].wants]}`);
      await closeAll(p);
    }
    await knead(3);
    await knead(1);
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'bake');
    await closeAll(p);
    await shot(p, 'answer-done');
    r.errors = errs;
    out.answer = r;
    await p.close();
  }

  /* ---- knots (94) ---- */
  if (want('knots')) {
    const { p, errs } = await open(94, 'net');
    const t = await task(p, 'net');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'net:net');
    const pinned = t.knots.findIndex((k) => k.over.length);
    await press(p, `Undo the ${t.knots[pinned].name}`);
    r.pinnedRefused = (await notes(p, 'net/x')).length > 0 && (await prog(p, 'net')).length === 0;
    for (const k of t.knots) await press(p, `Undo the ${k.name}`);
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'net');
    await closeAll(p);
    await shot(p, 'knots-done');
    r.errors = errs;
    out.knots = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.ration || (out.ration.unfairRefused && out.ration.done)) && (!out.polish || (out.polish.stubbornRefused && out.polish.scratchRefused && out.polish.done)) && (!out.pulley || (out.pulley.tooFewRefused && out.pulley.tooManyRefused && out.pulley.done)) && (!out.answer || (out.answer.ignoreRefused && out.answer.repelRefused && out.answer.done)) && (!out.knots || (out.knots.pinnedRefused && out.knots.done));
  process.exit(ok ? 0 : 1);
})();
