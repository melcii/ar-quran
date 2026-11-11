// Real-input checks for the kinds of play added with surahs 85-89, through
// their own panels and the explorer's position (no `solve`):
//  - shelves (Al-Buruj): a place that does not suit is refused; picking up again works; everything kept safe finishes it.
//  - still (At-Tariq): setups that cannot work are refused with the reason; the right one, then tasting, finishes it.
//  - lightbox (Al-A'la): the wrong window is noted; the gap side each time, then the top, finishes it.
//  - camel (Al-Ghashiyah): a wrong use is noted; sheltering upwind does nothing; the calm side finishes it.
//  - evenodd (Al-Fajr): declaring early does nothing; a wrong answer is noted; pairing and answering finishes it.
// Usage: node batch12-checks.js   (web build served on :8090, or PORT)
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

  /* ---- shelves (85) ---- */
  if (want('shelves')) {
    const { p, errs } = await open(85, 'keep');
    const t = await task(p, 'keep');
    const r = {};
    const take = async (i) => { await near(p, ...t.table); await act(p, `take:keep:${i}`); };
    const put = async (k) => { await stand(p, t.spots[k].at[0] + (t.spots[k].at[0] < 0 ? 1.2 : -1.2), t.spots[k].at[1]); await act(p, `put:keep:${k}`); await closeAll(p); };
    await take(0);
    await put(1);
    r.wrongRefused = (await notes(p, 'keep/x')).length > 0 && (await prog(p, 'keep')).length === 0;
    await put(0);
    await take(1);
    await put(3);
    await act(p, 'back:keep:3');
    r.pickedBack = !(await prog(p, 'keep')).includes(1);
    await act(p, 'put:keep:3');
    await take(2);
    await put(2);
    await take(3);
    await put(1);
    r.done = await isDone(p, 'keep');
    await shot(p, 'shelves-done');
    r.errors = errs;
    out.shelves = r;
    await p.close();
  }

  /* ---- still (86) ---- */
  if (want('still')) {
    const { p, errs } = await open(86, 'still');
    const r = {};
    await near(p, 0, 2);
    await act(p, 'still:still');
    await press(p, 'Wait and watch');
    await press(p, 'in full sun');
    await press(p, 'sloping away from the cup');
    await press(p, 'sealed with wet sand');
    await press(p, 'Wait and watch');
    r.badRefused = (await notes(p, 'still/x')).length >= 2 && (await prog(p, 'still')).length === 0;
    await press(p, 'gently sloping to the cup');
    await press(p, 'Wait and watch');
    await p.waitForTimeout(200);
    r.works = (await prog(p, 'still')).includes(0);
    await press(p, 'Fresh, like rain');
    await p.waitForTimeout(200);
    r.done = await isDone(p, 'still');
    await closeAll(p);
    await shot(p, 'still-done');
    r.errors = errs;
    out.still = r;
    await p.close();
  }

  /* ---- lightbox (87) ---- */
  if (want('lightbox')) {
    const { p, errs } = await open(87, 'box');
    const t = await task(p, 'box');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'box:box');
    await press(p, `Open the ${t.gaps[0] === 'left' ? 'right' : 'left'} window`);
    r.wrongNoted = (await notes(p, 'box/x')).length > 0 && (await prog(p, 'box')).length === 0;
    for (const g of t.gaps) await press(p, `Open the ${g} window`);
    await press(p, 'Open the top window');
    await p.waitForTimeout(200);
    r.done = await isDone(p, 'box');
    await closeAll(p);
    await shot(p, 'lightbox-done');
    r.errors = errs;
    out.lightbox = r;
    await p.close();
  }

  /* ---- camel (88) ---- */
  if (want('camel')) {
    const { p, errs } = await open(88, 'camel');
    const t = await task(p, 'camel');
    const r = {};
    await near(p, t.at[0] - 2, t.at[1] - 2);
    await act(p, 'camel:camel');
    for (let i = 0; i < t.parts.length; i++) {
      await press(p, `Look at its ${t.parts[i].name}`);
      if (i === 0) {
        await press(p, `For ${t.parts[1].use}`);
        r.wrongNoted = (await notes(p, 'camel/x')).length > 0 && (await prog(p, 'camel')).length === 0;
      }
      await press(p, `For ${t.parts[i].use}`);
    }
    await closeAll(p);
    r.looked = (await prog(p, 'camel')).length === t.parts.length;
    await stand(p, t.at[0] - 1.8, t.at[1]);
    await clock(p, t.secs + 1);
    r.upwindNothing = !(await isDone(p, 'camel'));
    await stand(p, t.at[0] + 1.7, t.at[1]);
    await clock(p, t.secs + 1);
    r.done = await isDone(p, 'camel');
    await closeAll(p);
    await shot(p, 'camel-done');
    r.errors = errs;
    out.camel = r;
    await p.close();
  }

  /* ---- evenodd (89) ---- */
  if (want('evenodd')) {
    const { p, errs } = await open(89, 'share');
    const t = await task(p, 'share');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'share:share');
    for (let i = 0; i < t.baskets.length; i++) {
      const n = t.baskets[i].n;
      if (i === 0) {
        await press(p, 'Even: none left over');
        r.earlyIgnored = (await prog(p, 'share')).length === 0 && (await notes(p, 'share/x')).length === 0;
      }
      await press(p, 'Pair two dates', Math.floor(n / 2));
      if (i === 0) {
        await press(p, n % 2 ? 'Even: none left over' : 'Odd: one left over');
        r.wrongNoted = (await notes(p, 'share/x')).length > 0;
      }
      await press(p, n % 2 ? 'Odd: one left over' : 'Even: none left over');
      await p.waitForTimeout(150);
    }
    r.done = await isDone(p, 'share');
    await closeAll(p);
    await shot(p, 'evenodd-done');
    r.errors = errs;
    out.evenodd = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.shelves || (out.shelves.wrongRefused && out.shelves.pickedBack && out.shelves.done)) && (!out.still || (out.still.badRefused && out.still.done)) && (!out.lightbox || (out.lightbox.wrongNoted && out.lightbox.done)) && (!out.camel || (out.camel.wrongNoted && out.camel.upwindNothing && out.camel.done)) && (!out.evenodd || (out.evenodd.earlyIgnored && out.evenodd.wrongNoted && out.evenodd.done));
  process.exit(ok ? 0 : 1);
})();
