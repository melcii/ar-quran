// Real-input check for Al-Qasas's river (surah 28), which the walker bot
// cannot play because the chest moves on its own. Through the explorer's
// position and the world's own uses (no `solve`, no `finish` on the task):
//  - letting the chest go with the reeds as they start sends it into a reed
//    marsh: noted, and the chest comes back to the top;
//  - setting both forks for the landing, letting it go, following it and
//    nudging it free at each snag brings it to the quiet landing.
// Usage: node river-checks.js   (web build served on :8090, or PORT)
const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 650 }, reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${process.env.PORT || 8090}/adventure/28?q=low`, { timeout: 180000 });
  await p.waitForFunction(() => !!globalThis.__adv, null, { timeout: 400000 });
  await p.waitForTimeout(1500);
  const closeAll = () => p.evaluate(async () => {
    const A = globalThis.__adv;
    for (let k = 0; k < 30 && A.cards().length; k++) {
      A.close();
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await p.evaluate(() => {
    const A = globalThis.__adv;
    A.speed(4);
    A.finish('promise');
  });
  await p.waitForTimeout(800);
  await closeAll();
  const near = async (x, z) => {
    await p.evaluate(([x, z]) => {
      const A = globalThis.__adv;
      for (const d of [1.5, 2.2, 2.8])
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2;
          if (A.game.space.okSpot(x + Math.cos(a) * d, z + Math.sin(a) * d, 0.4)) return A.teleport(x + Math.cos(a) * d, z + Math.sin(a) * d);
        }
      A.teleport(x, z);
    }, [x, z]);
    await p.waitForTimeout(1000);
  };
  const act = async (key) => { await p.evaluate((k) => globalThis.__adv.act(k), key); await p.waitForTimeout(400); };
  const L = () => p.evaluate(() => { const s = globalThis.__adv.game.mech.chest; return s ? { state: s.state, gates: s.gates, snag: s.snag, pos: s.pos } : null; });
  const done = () => p.evaluate(() => globalThis.__adv.save().done.includes('chest'));
  const notes = () => p.evaluate(() => globalThis.__adv.save().prog['chest/x'] ?? []);
  const wait = async (pred, secs) => {
    const t0 = Date.now();
    while (Date.now() - t0 < secs * 1000) {
      const s = await L();
      if (await pred(s)) return s;
      await p.waitForTimeout(300);
    }
    return L();
  };
  const task = await p.evaluate(() => globalThis.__adv.def.tasks.find((t) => t.id === 'chest'));
  const top = task.river.pts[0];
  const out = { wrong: {}, right: {} };

  // 1. As the reeds start, the chest takes the first channel into a marsh.
  await near(top[0], top[1]);
  await act('release:chest');
  out.wrong.released = (await L())?.state;
  const back = await wait(async (s) => (await notes()).length > 0 && s?.state === 'ready', 240);
  out.wrong.noted = (await notes()).length > 0;
  out.wrong.backAtTop = back?.state === 'ready';
  out.wrong.done = await done();

  // 2. Set both forks for the landing, let it go, follow it, nudge it free.
  await near(task.gates[0].at[0], task.gates[0].at[1]);
  await act('gate:chest:0');
  await near(task.gates[1].at[0], task.gates[1].at[1]);
  await act('gate:chest:1');
  out.right.gates = (await L())?.gates;
  await near(top[0], top[1]);
  await act('release:chest');
  out.right.nudged = [];
  for (let k = 0; k < 4; k++) {
    const s = await wait(async (s) => s?.state === 'snag' || (await done()), 240);
    if (await done()) break;
    if (s?.state !== 'snag') break;
    const at = task.snags[s.snag];
    await near(at[0], at[1]);
    for (let n = 0; n < 4 && (await L())?.state === 'snag'; n++) {
      await act('nudge:chest');
      await p.waitForTimeout(400);
    }
    if (!out.right.nudged.includes(s.snag)) out.right.nudged.push(s.snag);
    if (SHOTS && k === 0) await p.screenshot({ path: `${SHOTS}/river-nudge.png`, timeout: 120000 }).catch(() => {});
  }
  await wait(async () => done(), 240);
  out.right.done = await done();
  out.right.final = await L();
  out.errors = errs;
  out.ok = out.wrong.noted && out.wrong.backAtTop && !out.wrong.done && JSON.stringify(out.right.gates) === '[1,0]' && out.right.nudged.length === task.snags.length && out.right.done && !errs.length;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
  process.exit(out.ok ? 0 : 1);
})();
