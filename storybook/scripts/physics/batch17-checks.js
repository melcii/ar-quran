// Real-input checks for the kinds of play added with surahs 110-114, through
// their own panels and the explorer's position (no `solve`):
//  - arch (An-Nasr): the keystone early, the frame early, a leaning side and boasting are refused; building in turn and praising finishes it.
//  - rope (Al-Masad): laying early, mixed twists and laying the same way are refused; a proper rope and the bucket finish it.
//  - compass (Al-Ikhlas): joining early, stepping with no circle, changing width and a seventh step are refused; the construction finishes it.
//  - lanterns (Al-Falaq): a lantern out of order is noted; lighting them in order finishes it.
//  - whisper (An-Nas): listening thickens the mist, obeying and delivering early are refused; seeking refuge each time and delivering finishes it.
// Usage: node batch17-checks.js   (web build served on :8090, or PORT)
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
  /* ---- arch (110) ---- */
  if (want('arch')) {
    const { p, errs } = await open(110, 'arch');
    const t = await task(p, 'arch');
    const r = {};
    await near(p, t.at[0], t.at[1] + 3);
    await act(p, 'arch:arch');
    await press(p, 'Set the keystone');
    await press(p, 'Take away the wooden frame');
    r.earlyRefused = (await notes(p, 'arch/early')).length > 0 && (await notes(p, 'arch/frame')).length > 0;
    await press(p, 'Set a stone on the left');
    await press(p, 'Set a stone on the left');
    r.leanRefused = (await notes(p, 'arch/lean')).length > 0 && (await prog(p, 'arch')).length === 1;
    for (let k = 1; k < t.stones; k++) await press(p, k % 2 ? 'Set a stone on the right' : 'Set a stone on the left');
    await press(p, 'Set the keystone');
    await shot(p, 'arch-keystone');
    await press(p, 'Take away the wooden frame');
    await press(p, 'Tell everyone how clever we were');
    r.boastRefused = (await notes(p, 'arch/boast')).length > 0;
    await press(p, 'Glorify Allah with praise, and ask His forgiveness');
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'arch');
    await closeAll(p);
    await shot(p, 'arch-done');
    r.errors = errs;
    out.arch = r;
    await p.close();
  }

  /* ---- rope (111) ---- */
  if (want('rope')) {
    const { p, errs } = await open(111, 'rope');
    const t = await task(p, 'rope');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'twist:rope');
    await press(p, 'Twist the strand to the right');
    await press(p, 'Twist the strand to the left');
    r.mixedRefused = (await notes(p, 'rope/mixed')).length > 0;
    await press(p, 'Twist the strand to the right', t.twists * 3 - 1);
    r.strands = (await prog(p, 'rope')).length === 3;
    await press(p, 'Lay the strands together to the right');
    r.sameWayRefused = (await notes(p, 'rope/x')).length > 0 && (await prog(p, 'rope')).length === 3;
    await press(p, 'Lay the strands together to the left');
    await closeAll(p);
    await near(p, ...t.well);
    await act(p, 'well:rope');
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'rope');
    await shot(p, 'rope-done');
    r.errors = errs;
    out.rope = r;
    await p.close();
  }

  /* ---- compass (112) ---- */
  if (want('compass')) {
    const { p, errs } = await open(112, 'floor');
    const t = await task(p, 'floor');
    const r = {};
    await near(p, t.at[0], t.at[1] + 2.4);
    await act(p, 'draw:floor');
    await press(p, 'Join the points with the straight edge');
    await press(p, 'Step the compass along the edge');
    r.earlyRefused = (await notes(p, 'floor/x')).length > 0 && (await notes(p, 'floor/early')).length > 0;
    await press(p, 'Draw a circle');
    await press(p, 'Change the compass width');
    r.widthRefused = (await notes(p, 'floor/width')).length > 0;
    await press(p, 'Step the compass along the edge', 6);
    await press(p, 'Step the compass along the edge');
    r.seventhRefused = (await notes(p, 'floor/over')).length > 0;
    await shot(p, 'compass-rosette');
    await press(p, 'Join the points with the straight edge');
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'floor');
    await closeAll(p);
    await shot(p, 'compass-done');
    r.errors = errs;
    out.compass = r;
    await p.close();
  }

  /* ---- lanterns (113) ---- */
  if (want('lanterns')) {
    const { p, errs } = await open(113, 'lamps');
    const t = await task(p, 'lamps');
    const r = {};
    await stand(p, t.lamps[1][0] + 0.8, t.lamps[1][1]);
    await clock(p, 1);
    r.orderNoted = (await notes(p, 'lamps/order')).length > 0 && (await prog(p, 'lamps')).length === 0;
    for (let i = 0; i < t.lamps.length; i++) {
      await stand(p, t.lamps[i][0] + 0.8, t.lamps[i][1]);
      await clock(p, t.secs + 1.5);
      if (i === 2) await shot(p, 'lanterns-mid');
    }
    await p.waitForTimeout(300);
    r.lit = (await prog(p, 'lamps')).length;
    r.done = await isDone(p, 'lamps');
    await closeAll(p);
    await shot(p, 'lanterns-dawn');
    r.errors = errs;
    out.lanterns = r;
    await p.close();
  }

  /* ---- whisper (114) ---- */
  if (want('whisper')) {
    const { p, errs } = await open(114, 'letter');
    const t = await task(p, 'letter');
    const r = {};
    await near(p, ...t.stops[0].at);
    await act(p, 'stop:letter:0');
    await press(p, 'Listen to it a little longer');
    r.listenThickens = (await notes(p, 'letter/mist'))[0] === 2;
    await press(p, 'Do what it says');
    r.obeyRefused = (await notes(p, 'letter/x')).length > 0 && (await prog(p, 'letter')).length === 0;
    await shot(p, 'whisper-mist');
    await closeAll(p);
    await near(p, ...t.end);
    await act(p, 'deliver:letter');
    r.earlyRefused = (await notes(p, 'letter/early')).length > 0;
    await closeAll(p);
    for (let i = 0; i < t.stops.length; i++) {
      await near(p, ...t.stops[i].at);
      await act(p, `stop:letter:${i}`);
      await press(p, 'I seek refuge in the Lord of people. Walk on');
      await closeAll(p);
    }
    await near(p, ...t.end);
    await act(p, 'deliver:letter');
    await p.waitForTimeout(300);
    r.done = await isDone(p, 'letter');
    await shot(p, 'whisper-done');
    r.errors = errs;
    out.whisper = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.arch || (out.arch.earlyRefused && out.arch.leanRefused && out.arch.boastRefused && out.arch.done)) && (!out.rope || (out.rope.mixedRefused && out.rope.sameWayRefused && out.rope.done)) && (!out.compass || (out.compass.earlyRefused && out.compass.widthRefused && out.compass.seventhRefused && out.compass.done)) && (!out.lanterns || (out.lanterns.orderNoted && out.lanterns.done)) && (!out.whisper || (out.whisper.listenThickens && out.whisper.obeyRefused && out.whisper.earlyRefused && out.whisper.done));
  process.exit(ok ? 0 : 1);
})();
