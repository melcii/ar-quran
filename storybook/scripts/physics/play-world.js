// Play one adventure world from start to finish the way a careful child
// would, through the game's own actions: walk up to whatever the open
// activity needs (teleporting next to it, then pressing its action), answer
// panels with the plug-in's own `solve`, keep still where a task asks for
// stillness. Prints every step, the save after a reload, and any page errors.
// Usage: W=11 node play-world.js  (serve the web build on :8090 first)
const { chromium, devices } = require('playwright');
const W = process.env.W || '1';
const DEV = process.env.DEV || 'desktop';
const SHOTS = process.env.SHOTS; // a folder: a screenshot after each finished task
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext(DEV === 'phone' ? { ...devices['Pixel 7'], reducedMotion: 'no-preference' } : { viewport: { width: 1000, height: 650 }, reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const url = `http://localhost:${process.env.PORT || 8090}/adventure/${W}?q=low`;
  await p.goto(url, { timeout: 180000 });
  await p.waitForFunction(() => !!globalThis.__adv, null, { timeout: 400000 });
  await p.waitForTimeout(2000);
  const log = [];
  const t0 = Date.now();
  let lastDone = -1;
  let stuck = 0;
  for (let step = 0; step < 400; step++) {
    const r = await p.evaluate(async () => {
      const A = globalThis.__adv;
      const g = A.game;
      const sp = g.space;
      const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
      const waitClk = async (sec) => { const c0 = g.clock, w0 = performance.now(); while (g.clock - c0 < sec && performance.now() - w0 < 90000) await sleep(60); };
      A.speed(4);
      const s = A.save();
      // Close readings and narration; answer decision panels as a careful child.
      for (let k = 0; k < 6 && A.cards().length; k++) {
        if (!A.solve()) A.close();
        await sleep(150);
      }
      const open = A.def.tasks.filter((t) => !s.done.includes(t.id) && (t.requires ?? []).every((q) => s.done.includes(q)));
      if (!open.length) return { done: s.done.length, finished: !!s.finished || s.done.length === A.def.tasks.length, note: 'nothing open' };
      const task = open[0];
      const near = (x, z, reach) => {
        for (const d of [Math.min(1.2, reach * 0.6), 0.3, reach * 0.85])
          for (let k = 0; k < 16; k++) {
            const a = (k / 16) * Math.PI * 2;
            const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
            if (sp.okSpot(px, pz, 0.4)) return [px, pz];
          }
        return [x, z];
      };
      const go = async (x, z, reach = 2) => {
        const [px, pz] = near(x, z, reach);
        A.teleport(px, pz);
        await waitClk(0.3);
      };
      // Tasks with no button: be there, keep still.
      if (task.kind === 'stand' || task.kind === 'reach') {
        await go(task.at[0], task.at[1], (task.r ?? 1.5) * 0.8);
        if (task.face) A.player.yaw = Math.atan2(task.face[0] - A.player.pos.x, task.face[1] - A.player.pos.z);
        await waitClk((task.secs ?? 0.5) * 1.6 + 1.5);
        return { task: task.id, kind: task.kind, did: 'stood' };
      }
      if (task.kind === 'observe') {
        const got = s.prog[task.id] ?? [];
        const i = task.subjects.findIndex((_, j) => !got.includes(j));
        const sub = task.subjects[Math.max(0, i)];
        await go(sub.at[0], sub.at[1], sub.r * 0.7);
        await waitClk(task.secs + 2);
        return { task: task.id, kind: task.kind, did: `watched ${sub.label}` };
      }
      // Leading animals home: tap one so it follows, then walk (routed) to the pen.
      if (task.kind === 'lead') {
        const a = A.uses().find((x) => x.key.startsWith(`ani:${task.id}-`));
        if (!a) { await waitClk(2); return { task: task.id, kind: task.kind, did: 'waited (no animal offered)' }; }
        await go(a.x, a.z, a.reach);
        A.act(a.key);
        await waitClk(0.5);
        const before = (A.save().prog[task.id] ?? []).length;
        A.go(task.pen[0], task.pen[1]);
        const w0 = performance.now();
        while ((A.save().prog[task.id] ?? []).length === before && !A.save().done.includes(task.id) && performance.now() - w0 < 150000) await sleep(200);
        return { task: task.id, kind: task.kind, did: `led ${a.key} to ${task.penLabel}` };
      }
      // Everything else: use the first thing the game offers for this task.
      const uses = A.uses().filter((u) => !/^(ani|boat|ashore|link|go|warp):/.test(u.key));
      // Carrying: if something is in hand, the drop spot comes first.
      // A child tries something else when an answer is refused: walk through this task's offers in turn.
      const tries = (globalThis.__tries ??= {});
      const mine = uses.filter((x) => x.key.includes(task.id));
      const drop = mine.find((x) => /^dst:|drop|put|place|give/i.test(x.key + x.label));
      const u = drop ?? (mine.length ? mine[(tries[task.id] = (tries[task.id] ?? -1) + 1) % mine.length] : uses[0]);
      if (!u) {
        await waitClk(2);
        return { task: task.id, kind: task.kind, did: 'waited (nothing to use)', uses: A.uses().map((x) => x.key).slice(0, 6) };
      }
      await go(u.x, u.z, u.reach);
      A.act(u.key);
      await waitClk(0.6);
      for (let k = 0; k < 4 && A.cards().length; k++) {
        if (!A.solve()) A.close();
        await sleep(150);
      }
      // Timed plug-ins (crops ripening and the like) get a little game time.
      await waitClk(1);
      return { task: task.id, kind: task.kind, did: u.key, label: u.label };
    });
    const s = await p.evaluate(() => globalThis.__adv.save());
    log.push({ step, ...r, doneN: s.done.length });
    process.stderr.write(`${r.task ?? ''} ${r.did ?? r.note ?? ''} → ${s.done.length}\n`);
    if (r.finished) break;
    if (s.done.length === lastDone) stuck++;
    else {
      stuck = 0;
      if (SHOTS) await p.screenshot({ path: `${SHOTS}/w${W}-${String(s.done.length).padStart(2, '0')}.png` });
    }
    lastDone = s.done.length;
    if (stuck > 40) {
      log.push({ stuck: true });
      break;
    }
  }
  const before = await p.evaluate(() => globalThis.__adv.save());
  await p.reload();
  await p.waitForFunction(() => !!globalThis.__adv, null, { timeout: 400000 });
  const after = await p.evaluate(() => globalThis.__adv.save());
  const tasks = await p.evaluate(() => globalThis.__adv.def.tasks.map((t) => t.id));
  const out = {
    world: W,
    dev: DEV,
    secs: Math.round((Date.now() - t0) / 1000),
    tasks: tasks.length,
    done: before.done,
    allDone: tasks.every((t) => before.done.includes(t)),
    savedAfterReload: JSON.stringify(after.done) === JSON.stringify(before.done),
    notes: before.notes ?? null,
    errors: errs,
    log: log.filter((l) => l.did || l.stuck || l.note).map((l) => `${l.task ?? ''} ${l.kind ?? ''} ${l.did ?? l.note ?? 'STUCK'} ${l.uses ? JSON.stringify(l.uses) : ''} → ${l.doneN}`),
  };
  console.log(JSON.stringify(out, null, 1));
  await b.close();
  process.exit(out.allDone && out.savedAfterReload && !errs.length ? 0 : 1);
})();
