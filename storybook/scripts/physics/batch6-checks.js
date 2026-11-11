// Real-input checks for the kinds of play added with surahs 55-59, through
// their own panels (no `solve`):
//  - estuary (Ar-Rahman): a wrong reading of the float is refused; every buoy, then the meeting point.
//  - firedrill (Al-Waqi'ah): strokes that are too fast are noted; steady strokes make an ember; hurried breaths are noted; gentle ones flame.
//  - forge (Al-Hadid): striking cold iron is refused; held bellows heat it; strikes at working heat make all three tools.
//  - listen (Al-Mujadilah): answering early is noted; a wrong repeat is refused; accurate repeats finish it.
//  - welcome (Al-Hashr): the store runs out; giving from your own house finishes every home.
// Usage: node batch6-checks.js   (web build served on :8090, or PORT)
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

  /* ---- estuary (55) ---- */
  if (want('estuary')) {
    const { p, errs } = await open(55, 'seas');
    const t = await task(p, 'seas');
    const r = { buoys: [] };
    for (let i = 0; i < t.buoys.length; i++) {
      await stand(p, t.buoys[i][0] - 2.2, t.buoys[i][1]);
      await act(p, `dip:seas:${i}`);
      const salt = i >= t.meet;
      if (i === 0) {
        await p.getByLabel(`Buoy 1: ${salt ? 'Fresh water' : 'Salt water'}`).click();
        await p.waitForTimeout(200);
        r.wrongRefused = !(await prog(p, 'seas')).includes(0);
        if (i === 0) await shot(p, 'estuary-tube');
      }
      await p.getByLabel(`Buoy ${i + 1}: ${salt ? 'Salt water' : 'Fresh water'}`).click();
      await p.waitForTimeout(300);
      r.buoys.push((await prog(p, 'seas')).includes(i));
    }
    await act(p, 'meet:seas');
    await p.getByLabel(`Between buoy ${t.meet} and buoy ${t.meet + 1}`).click();
    await p.waitForTimeout(400);
    r.done = await isDone(p, 'seas');
    await closeAll(p);
    await shot(p, 'estuary-done');
    r.errors = errs;
    out.estuary = r;
    await p.close();
  }

  /* ---- firedrill (56) ---- */
  if (want('firedrill')) {
    const { p, errs } = await open(56, 'fire');
    const t = await task(p, 'fire');
    const r = {};
    await near(p, ...t.at);
    await act(p, 'fire:fire');
    const press = async (label) => {
      const bx = await p.getByLabel(label).boundingBox();
      await p.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2);
    };
    // Two strokes far quicker than a steady rhythm, sent inside the page so the browser's own delay does not slow them.
    const quick = (labels, gap) => p.evaluate(async ([labels, gap]) => {
      for (const l of labels) {
        const el = document.querySelector(`[aria-label="${l}"]`);
        const r = el.getBoundingClientRect();
        const o = { bubbles: true, cancelable: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
        el.dispatchEvent(new PointerEvent('pointerdown', o));
        el.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 }));
        el.dispatchEvent(new MouseEvent('click', o));
        await new Promise((res) => setTimeout(res, gap));
      }
    }, [labels, gap]);
    await quick(['Push the bow', 'Pull the bow'], 60);
    await p.waitForTimeout(200);
    r.fastNoted = (await notes(p, 'fire/fast')).length > 0;
    // Steady strokes about half a second apart, counting the browser's own click time.
    let t0 = Date.now();
    for (let k = 0; k < 40 && !(await prog(p, 'fire')).includes(0); k++) {
      await p.waitForTimeout(Math.max(0, 480 - (Date.now() - t0)));
      t0 = Date.now();
      await press(k % 2 ? 'Push the bow' : 'Pull the bow');
    }
    r.strokeMs = Date.now() - t0;
    r.ember = (await prog(p, 'fire')).includes(0);
    await shot(p, 'firedrill-ember');
    await quick(['Blow gently', 'Blow gently'], 150);
    await p.waitForTimeout(200);
    r.hardNoted = (await notes(p, 'fire/hard')).length > 0;
    for (let k = 0; k < 3 && !(await isDone(p, 'fire')); k++) {
      await p.waitForTimeout(900);
      await p.getByLabel('Blow gently').click();
    }
    await p.waitForTimeout(400);
    r.done = await isDone(p, 'fire');
    await closeAll(p);
    await shot(p, 'firedrill-done');
    r.errors = errs;
    out.firedrill = r;
    await p.close();
  }

  /* ---- forge (57) ---- */
  if (want('forge')) {
    const { p, errs } = await open(57, 'iron');
    const t = await task(p, 'iron');
    const r = { items: [] };
    await near(p, ...t.at);
    await act(p, 'forge:iron');
    await p.getByLabel('Strike').click();
    await p.waitForTimeout(200);
    r.coldNoted = (await notes(p, 'iron/cold')).length > 0;
    const heat = () => p.evaluate(() => globalThis.__forge?.heat ?? 0);
    const pump = async (to) => {
      const bx = await p.getByLabel('Pump the bellows').boundingBox();
      await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2);
      await p.mouse.down();
      const w0 = Date.now();
      while ((await heat()) < to && Date.now() - w0 < 20000) await p.waitForTimeout(40);
      await p.mouse.up();
    };
    for (let i = 0; i < t.items.length; i++) {
      for (let s = 0; s < 12 && !(await prog(p, 'iron')).includes(i); s++) {
        if ((await heat()) < 56) await pump(70);
        if (i === 0 && s === 0) await shot(p, 'forge-glow');
        await p.getByLabel('Strike').click();
        await p.waitForTimeout(150);
      }
      r.items.push((await prog(p, 'iron')).includes(i));
    }
    await p.waitForTimeout(400);
    r.done = await isDone(p, 'iron');
    await closeAll(p);
    await shot(p, 'forge-done');
    r.errors = errs;
    out.forge = r;
    await p.close();
  }

  /* ---- listen (58) ---- */
  if (want('listen')) {
    const { p, errs } = await open(58, 'listen');
    const t = await task(p, 'listen');
    const r = { heard: [] };
    await near(p, ...t.at);
    await act(p, 'listen:listen');
    for (let i = 0; i < t.speakers.length; i++) {
      const sp = t.speakers[i];
      if (i === 0) {
        await p.waitForTimeout(400);
        await p.getByLabel('Answer now').click();
        await p.waitForTimeout(200);
        r.interruptNoted = (await notes(p, 'listen/interrupt')).length > 0;
        await shot(p, 'listen-speaking');
      }
      await p.getByLabel('Repeat 1').waitFor({ timeout: 60000 });
      const ok = sp.repeats.findIndex((x) => x.ok);
      if (i === 0) {
        const bad = sp.repeats.findIndex((x) => !x.ok);
        await p.getByLabel(`Repeat ${bad + 1}`).click();
        await p.waitForTimeout(200);
        r.wrongRefused = !(await prog(p, 'listen')).includes(0);
      }
      await p.getByLabel(`Repeat ${ok + 1}`).click();
      await p.waitForTimeout(400);
      r.heard.push((await prog(p, 'listen')).includes(i));
    }
    r.done = await isDone(p, 'listen');
    r.errors = errs;
    out.listen = r;
    await p.close();
  }

  /* ---- welcome (59) ---- */
  if (want('welcome')) {
    const { p, errs } = await open(59, 'welcome');
    const t = await task(p, 'welcome');
    const r = {};
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const close = async () => { await closeAll(p); };
    for (let h = 0; h < t.homes.length; h++) {
      await stand(p, t.homes[h].at[0], t.homes[h].at[1] + 2.2);
      await act(p, `home:welcome:${h}`);
      for (const it of t.items) {
        const b = p.getByLabel(new RegExp(`^Give a ${esc(it)} from the store`));
        if (await b.count()) await b.click();
        await p.waitForTimeout(150);
      }
      if (h === t.homes.length - 1) await shot(p, 'welcome-empty-store');
      await close();
    }
    const d0 = await prog(p, 'welcome');
    r.storeRanOut = d0.length < t.homes.length * t.items.length && !(await isDone(p, 'welcome'));
    r.outNoted = (await notes(p, 'welcome/x')).length > 0;
    await stand(p, t.own[0], t.own[1] + 2.2);
    await act(p, 'own:welcome');
    const short = t.items.filter((_, k) => t.stock[k] < t.homes.length);
    for (const it of short) await p.getByLabel(`Take your own ${it}`).click();
    await close();
    const last = t.homes.length - 1;
    await stand(p, t.homes[last].at[0], t.homes[last].at[1] + 2.2);
    await act(p, `home:welcome:${last}`);
    for (const it of short) {
      await p.getByLabel(`Give your own ${it}`).click();
      await p.waitForTimeout(200);
    }
    await p.waitForTimeout(400);
    r.done = await isDone(p, 'welcome');
    await close();
    await shot(p, 'welcome-done');
    r.errors = errs;
    out.welcome = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.estuary || (out.estuary.wrongRefused && out.estuary.done)) && (!out.firedrill || (out.firedrill.fastNoted && out.firedrill.hardNoted && out.firedrill.done)) && (!out.forge || (out.forge.coldNoted && out.forge.done)) && (!out.listen || (out.listen.interruptNoted && out.listen.wrongRefused && out.listen.done)) && (!out.welcome || (out.welcome.storeRanOut && out.welcome.done)) ;
  process.exit(ok ? 0 : 1);
})();
