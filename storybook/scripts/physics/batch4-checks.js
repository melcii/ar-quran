// Real-input checks for the kinds of play added with surahs 45-49, through
// their own panels, the explorer's position and the game clock (no `solve`):
//  - station (Al-Jathiyah): a wrong ledger entry is refused; three readings through the day.
//  - dunes (Al-Ahqaf): a windbreak on the wrong side lets the path be buried; the right ones keep it open.
//  - channels (Muhammad): the wrong tool is refused; the right tools clear every channel.
//  - calm (Al-Fath): pushing is refused; waiting still, with one push and then calm answers, opens the gate.
//  - rumour (Al-Hujurat): an unchecked claim cannot be marked; a wrong mark is refused.
// Usage: node batch4-checks.js   (web build served on :8090, or PORT)
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

  /* ---- station (45) ---- */
  if (want('station')) {
    const { p, errs } = await open(45, 'ledger');
    const t = await task(p, 'ledger');
    const r = { phases: [] };
    await near(p, ...t.at);
    for (let k = 0; k < t.readings.length; k++) {
      await act(p, 'station:ledger');
      const R = t.readings[k];
      if (k === 0) {
        await p.getByLabel(`Wind from ${t.landmarks[(R.wind + 1) % t.landmarks.length].name}`).click();
        await p.waitForTimeout(200);
        r.wrongRefused = (await prog(p, 'ledger')).length === 0;
        await shot(p, 'station-ledger');
      }
      await p.getByLabel(`Wind from ${t.landmarks[R.wind].name}`).click();
      await p.waitForTimeout(200);
      await p.getByLabel(`Rain: ${['None', 'A little', 'Full'][R.rain]}`).click();
      await p.waitForTimeout(300);
      r.phases.push((await prog(p, 'ledger')).length);
      await closeAll(p);
      await clock(p, 1);
    }
    r.done = await isDone(p, 'ledger');
    r.errors = errs;
    out.station = r;
    await p.close();
  }

  /* ---- dunes (46) ---- */
  if (want('dunes')) {
    const { p, errs } = await open(46, 'road');
    const t = await task(p, 'road');
    const r = {};
    const good = t.spots.map((s, i) => (s.guards != null ? i : -1)).filter((i) => i >= 0);
    const bad = t.spots.findIndex((s) => s.guards == null);
    // Three on the windward side, one on the wrong side.
    for (const i of [...good.slice(0, 3), bad]) {
      await near(p, ...t.spots[i].at);
      await act(p, `fence:road:${i}`);
    }
    await near(p, ...t.well);
    await act(p, 'wait:road');
    await p.waitForFunction(() => (globalThis.__adv.save().prog['road/x'] ?? []).length > 0 || globalThis.__adv.save().done.includes('road'), null, { timeout: 400000, polling: 200 });
    r.buriedWithWrongFence = (await notes(p, 'road/x')).length > 0 && !(await isDone(p, 'road'));
    await shot(p, 'dunes-buried');
    // Move the wrong one to the last windward post.
    await near(p, ...t.spots[bad].at);
    await act(p, `fence:road:${bad}`);
    await near(p, ...t.spots[good[3]].at);
    await act(p, `fence:road:${good[3]}`);
    await near(p, ...t.well);
    await act(p, 'wait:road');
    await p.waitForFunction(() => globalThis.__adv.save().done.includes('road') || (globalThis.__adv.save().prog['road/x'] ?? []).length > 1, null, { timeout: 400000, polling: 200 });
    r.done = await isDone(p, 'road');
    r.errors = errs;
    out.dunes = r;
    await p.close();
  }

  /* ---- channels (47) ---- */
  if (want('channels')) {
    const { p, errs } = await open(47, 'water');
    const t = await task(p, 'water');
    const r = {};
    const at = (c, b) => { const ch = t.channels[c]; const k = ch.blocks[b].t; return [ch.from[0] + (ch.to[0] - ch.from[0]) * k, ch.from[1] + (ch.to[1] - ch.from[1]) * k]; };
    // The first block of channel 0, with the wrong tool.
    const order = (c) => t.channels[c].blocks.map((_, b) => b).sort((a, b) => t.channels[c].blocks[a].t - t.channels[c].blocks[b].t);
    const b0 = order(0)[0];
    await near(p, ...t.rack);
    await act(p, `tool:water:${(t.channels[0].blocks[b0].tool + 1) % t.tools.length}`);
    await near(p, ...at(0, b0));
    await act(p, `clear:water:0:${b0}`);
    r.wrongToolRefused = (await prog(p, 'water')).length === 0;
    for (let c = 0; c < t.channels.length; c++)
      for (const b of order(c)) {
        await near(p, ...t.rack);
        await act(p, `tool:water:${t.channels[c].blocks[b].tool}`);
        await near(p, ...at(c, b));
        await act(p, `clear:water:${c}:${b}`);
      }
    r.cleared = (await prog(p, 'water')).length;
    r.done = await isDone(p, 'water');
    await shot(p, 'channels-clear');
    r.errors = errs;
    out.channels = r;
    await p.close();
  }

  /* ---- calm (48) ---- */
  if (want('calm')) {
    const { p, errs } = await open(48, 'gate');
    const t = await task(p, 'gate');
    const r = {};
    await nearNow(p, t.gate[0], t.gate[1] + 1);
    await p.waitForTimeout(1200);
    await act(p, 'push:gate');
    r.pushRefused = !(await isDone(p, 'gate'));
    const stirOn = () => p.evaluate(() => globalThis.__adv.uses().some((u) => u.key === 'keep:gate'));
    let pushed = false;
    for (let k = 0; k < t.stirs.length + 1; k++) {
      await p.waitForFunction(() => globalThis.__adv.uses().some((u) => u.key === 'keep:gate') || globalThis.__adv.save().done.includes('gate'), null, { timeout: 400000, polling: 200 });
      if (await isDone(p, 'gate')) break;
      if (!pushed) {
        // Give in once: the waiting is set back.
        pushed = true;
        await act(p, 'push:gate');
        r.pushAtStirNoted = (await notes(p, 'gate/x')).length >= 2;
        k--;
        continue;
      }
      if (k === 1) await shot(p, 'calm-stir');
      if (await stirOn()) await act(p, 'keep:gate');
    }
    await p.waitForFunction(() => globalThis.__adv.save().done.includes('gate'), null, { timeout: 400000, polling: 200 });
    r.done = await isDone(p, 'gate');
    r.errors = errs;
    out.calm = r;
    await p.close();
  }

  /* ---- rumour (49) ---- */
  if (want('rumour')) {
    const { p, errs } = await open(49, 'rumour');
    const t = await task(p, 'rumour');
    const r = {};
    const n = t.claims.length;
    await near(p, ...t.board);
    await act(p, 'board:rumour');
    await p.getByLabel('Claim 1 is true').click();
    await p.waitForTimeout(200);
    r.uncheckedRefused = !(await prog(p, 'rumour')).includes(n) && (await p.getByText('not checked that claim', { exact: false }).count()) > 0;
    await closeAll(p);
    for (let i = 0; i < n; i++) {
      await near(p, ...t.claims[i].at);
      await act(p, `check:rumour:${i}`);
    }
    await near(p, ...t.board);
    await act(p, 'board:rumour');
    await p.getByLabel(`Claim 1 is ${t.claims[0].true ? 'not true' : 'true'}`).click();
    await p.waitForTimeout(200);
    r.wrongMarkRefused = !(await prog(p, 'rumour')).includes(n);
    await shot(p, 'rumour-board');
    for (let i = 0; i < n; i++) {
      await p.getByLabel(`Claim ${i + 1} is ${t.claims[i].true ? 'true' : 'not true'}`).click();
      await p.waitForTimeout(250);
    }
    await p.waitForTimeout(400);
    r.done = await isDone(p, 'rumour');
    r.errors = errs;
    out.rumour = r;
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = Object.values(out).every((r) => !r.errors?.length) && (!out.station || (out.station.wrongRefused && out.station.done)) && (!out.dunes || (out.dunes.buriedWithWrongFence && out.dunes.done)) && (!out.channels || (out.channels.wrongToolRefused && out.channels.done)) && (!out.calm || (out.calm.pushRefused && out.calm.pushAtStirNoted && out.calm.done)) && (!out.rumour || (out.rumour.uncheckedRefused && out.rumour.wrongMarkRefused && out.rumour.done));
  process.exit(ok ? 0 : 1);
})();
