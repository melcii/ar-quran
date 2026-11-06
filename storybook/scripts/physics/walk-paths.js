// Walk every footpath of a world with real input, then go to every activity
// spot that is open now. Desktop drives with the keyboard (W A S D, relative to
// the camera, as a child would); DEV=phone drives the on-screen walking stick
// with real touch events on an emulated Pixel 7. Every frame it checks:
// inside a solid, under or above the ground, figure scale, the camera inside a
// solid or under the ground, sudden jumps, and getting stuck.
//
//   W=19 DEV=phone node scripts/physics/walk-paths.js   (server on :8090)
const { chromium, devices } = require('playwright');
const W = process.env.W || '19';
const DEV = process.env.DEV || 'desktop';
const BASE = process.env.BASE || 'http://localhost:8090';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext(DEV === 'phone' ? { ...devices['Pixel 7'] } : { viewport: { width: 1000, height: 650 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => {
    globalThis.__figProbe = {};
    try { if (!sessionStorage.getItem('x')) { localStorage.clear(); sessionStorage.setItem('x', '1'); } } catch {}
  });
  await p.goto(`${BASE}/adventure/${W}?q=low`, { timeout: 180000 });
  await p.waitForFunction(() => !!globalThis.__adv && globalThis.__adv.game.clock > 1.2, null, { timeout: 400000 });
  await p.evaluate(() => globalThis.__adv.speed(3));
  // Close the welcome narration the way a child would: tap or click Continue.
  for (let i = 0; i < 6 && (await p.evaluate(() => globalThis.__adv.cards().length)); i++) {
    const btn = p.getByRole('button', { name: /^(Continue|Close|OK|Got it|Start)/ }).first();
    if (!(await btn.count())) break;
    DEV === 'phone' ? await btn.tap() : await btn.click();
    await p.waitForTimeout(600);
  }
  const cdp = DEV === 'phone' ? await ctx.newCDPSession(p) : null;
  // The walking stick's centre on screen.
  let stick = null;
  if (cdp) {
    const box = await p.getByLabel(/^Walking stick/).boundingBox();
    stick = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
  const R = 48;
  let held = new Set();
  let touching = false;
  /** Push the input toward world direction (wx, wz), or let go if null. */
  async function steer(dir, cy) {
    if (!dir) {
      if (cdp && touching) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); touching = false; }
      for (const k of held) await p.keyboard.up(k);
      held = new Set();
      return;
    }
    const [wx, wz] = dir;
    const ix = Math.cos(cy) * wx - Math.sin(cy) * wz;
    const iy = -Math.sin(cy) * wx - Math.cos(cy) * wz;
    if (cdp) {
      const pt = { x: stick.x + ix * R * 0.9, y: stick.y - iy * R * 0.9 };
      if (!touching) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: stick.x, y: stick.y }] }); touching = true; }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt] });
    } else {
      const want = new Set();
      if (iy > 0.38) want.add('w');
      if (iy < -0.38) want.add('s');
      if (ix > 0.38) want.add('d');
      if (ix < -0.38) want.add('a');
      for (const k of held) if (!want.has(k)) await p.keyboard.up(k);
      for (const k of want) if (!held.has(k)) await p.keyboard.down(k);
      held = want;
    }
  }
  const state = () =>
    p.evaluate(() => {
      const A = globalThis.__adv, g = A.game, sp = g.space, me = g.me, P = A.player.pos, c = g.cam.pos, f = sp.spec.floor;
      let camHit = false;
      sp.world.intersectionsWithShape({ x: c.x, y: 0, z: c.z }, { x: 0, y: 0, z: 0, w: 1 }, new sp.R.Ball(0.05), (h) => { if (!sp.ground.has(h.handle)) camHit = true; return !camHit; }, undefined, (4 << 16) | 1);
      return {
        x: P.x, z: P.z, feet: P.y - f(P.x, P.z), clock: g.clock, cy: g.cam.yaw,
        inside: sp.blockedAt(me.x, me.z, me.r * 0.8, me.collider), scale: globalThis.__figProbe?.scale ?? 1,
        camUnder: c.y < f(c.x, c.z) + 0.15, camHit: camHit && c.y < f(c.x, c.z) + 2.2,
        speed: A.player.speed, recovered: g.recovered, cards: A.cards().length, boat: g.boat.on,
      };
    });
  const res = { world: W, dev: DEV, legs: 0, metres: 0, frames: 0, inside: 0, feetOff: 0, scaleDev: 0, camUnder: 0, camHit: 0, jumps: 0, stuck: [], zones: [], animMismatch: 0 };
  const paths = await p.evaluate(() => (globalThis.__adv.def.ground.paths ?? []).map((pts) => pts));
  // Thin each path to points about 3 m apart.
  const thin = (pts) => pts.reduce((a, q) => (!a.length || Math.hypot(q[0] - a[a.length - 1][0], q[1] - a[a.length - 1][1]) > 3 || q === pts[pts.length - 1] ? [...a, q] : a), []);
  let last = await state();
  const watch = (s) => {
    res.frames++;
    if (s.inside) res.inside++;
    if (Math.abs(s.feet) > 0.3 && !s.boat) res.feetOff++;
    res.scaleDev = Math.max(res.scaleDev, Math.abs(s.scale - 1));
    if (s.camUnder) res.camUnder++;
    if (s.camHit) res.camHit++;
    const step = Math.hypot(s.x - last.x, s.z - last.z);
    const dt = s.clock - last.clock;
    if (dt > 0 && step > Math.max(1.5, 7 * dt * 1.6) && s.recovered === last.recovered) res.jumps++;
    // Walking animation follows real movement: no strides while stopped against a wall.
    if (dt > 0.05 && step / dt < 0.1 && s.speed > 0.6) res.animMismatch++;
    res.metres += step;
    last = s;
  };
  async function goTo(tx, tz, near, limitSec) {
    let s = await state();
    const t0 = s.clock;
    let best = Math.hypot(tx - s.x, tz - s.z);
    let bestAt = s.clock;
    while (s.clock - t0 < limitSec) {
      const d = Math.hypot(tx - s.x, tz - s.z);
      if (d < near) return true;
      if (d < best - 0.1) (best = d), (bestAt = s.clock);
      if (s.clock - bestAt > 4) return false;
      await steer([(tx - s.x) / d, (tz - s.z) / d], s.cy);
      await p.waitForTimeout(60);
      s = await state();
      watch(s);
    }
    return false;
  }
  for (let pi = 0; pi < paths.length; pi++) {
    for (const way of [thin(paths[pi]), thin(paths[pi]).reverse()]) {
      const start = await p.evaluate(([x, z]) => globalThis.__adv.game.space.findOpen(x, z, 0.35, 4), way[0]);
      if (!start) continue;
      await p.evaluate(([x, z]) => globalThis.__adv.teleport(x, z), start);
      await p.waitForTimeout(300);
      last = await state();
      for (let i = 1; i < way.length; i++) {
        // A point on top of a solid (a bench across the path): aim for the next one.
        const blocked = await p.evaluate(([x, z]) => globalThis.__adv.game.space.blockedAt(x, z, 0.35), way[i]);
        if (blocked && i < way.length - 1) continue;
        res.legs++;
        const ok = await goTo(way[i][0], way[i][1], i === way.length - 1 ? 2.6 : 1.0, 40);
        if (!ok) {
          const s = await state();
          // Shut by a gate that opens later in the story: not a fault.
          const gate = await p.evaluate(([x, z]) => { const sp = globalThis.__adv.game.space; const g = sp.solids.find((q) => q.active && q.active() && Math.hypot(q.x - x, q.z - z) < (q.kind === 'circle' ? q.r : Math.hypot(q.hx, q.hz)) + 1.2); return g ? g.tag : null; }, [s.x, s.z]);
          if (gate) { (res.gated ??= []).push({ path: pi, tag: gate }); break; }
          res.stuck.push({ path: pi, at: [+s.x.toFixed(1), +s.z.toFixed(1)], to: way[i].map((v) => +v.toFixed(1)) });
          break;
        }
      }
      await steer(null);
    }
  }
  // A tour of every place the world's activities and buildings use (open now or later), from the spawn.
  const spots = await p.evaluate(() => {
    const A = globalThis.__adv, out = [], seen = new Set();
    const add = (q, what) => {
      if (!Array.isArray(q) || q.length !== 2 || typeof q[0] !== 'number' || typeof q[1] !== 'number') return;
      const k = `${Math.round(q[0])},${Math.round(q[1])}`;
      if (seen.has(k) || Math.hypot(q[0], q[1]) > A.t.radius - 1) return;
      seen.add(k);
      out.push({ x: q[0], z: q[1], what });
    };
    const scan = (o, what, depth) => {
      if (!o || typeof o !== 'object' || depth > 3) return;
      for (const [k, v] of Object.entries(o)) {
        if (['at', 'pen', 'dock', 'source', 'from', 'to', 'launch', 'home', 'door'].includes(k)) add(v, `${what}.${k}`);
        else if (Array.isArray(v) || (v && typeof v === 'object')) scan(v, what, depth + 1);
      }
    };
    for (const t of A.def.tasks) scan(t, `task ${t.id}`, 0);
    for (const s of A.def.structures) add([s.x, s.z], s.type);
    return out;
  });
  res.tour = { spots: spots.length, walked: 0, tapped: 0, unreached: [] };
  for (const q of spots) {
    const back = await p.evaluate(() => globalThis.__adv.game.spawn);
    await p.evaluate(([x, z]) => globalThis.__adv.teleport(x, z), back);
    await p.waitForTimeout(250);
    last = await state();
    // Close is enough: the spot may be inside the thing (a house, a well).
    const near = await p.evaluate(([x, z]) => { const o = globalThis.__adv.game.space.findOpen(x, z, 0.35, 10); return o ? Math.hypot(o[0] - x, o[1] - z) : 10; }, [q.x, q.z]);
    if (await goTo(q.x, q.z, near + 1.6, 60)) { res.tour.walked++; continue; }
    await steer(null);
    // Something in the way: tap the ground by it, as a child would, and let the route go round.
    await p.evaluate(([x, z]) => globalThis.__adv.go(x, z), [q.x, q.z]);
    const t0 = Date.now();
    let s, best = 1e9, bestAt = Date.now();
    do {
      await p.waitForTimeout(250);
      s = await state();
      watch(s);
      const d = Math.hypot(q.x - s.x, q.z - s.z);
      if (d < best - 0.1) (best = d), (bestAt = Date.now());
    } while (Math.hypot(q.x - s.x, q.z - s.z) > near + 1.6 && Date.now() - t0 < 120000 && Date.now() - bestAt < 20000);
    if (Math.hypot(q.x - s.x, q.z - s.z) <= near + 1.6) res.tour.tapped++;
    else res.tour.unreached.push({ what: q.what, at: [+q.x.toFixed(1), +q.z.toFixed(1)], got: [+s.x.toFixed(1), +s.z.toFixed(1)] });
  }

  // Every activity spot open now: walk to it with the real input, then check the action button is offered.
  const zones = await p.evaluate(() => globalThis.__adv.uses().filter((u) => u.reach > 0 && !/^(ani|boat|ashore|link):/.test(u.key)));
  for (const u of zones) {
    const back = await p.evaluate(() => globalThis.__adv.game.spawn);
    await p.evaluate(([x, z]) => globalThis.__adv.teleport(x, z), back);
    await p.waitForTimeout(300);
    last = await state();
    // Walk straight at it; where something is in the way, tap the ground near it instead (tap-to-go routes round).
    let ok = await goTo(u.x, u.z, Math.min(u.reach, 2.6), 60);
    let how = 'walked';
    if (!ok) {
      await steer(null);
      await p.evaluate((k) => globalThis.__adv.act(k), u.key);
      const t0 = Date.now();
      let s;
      do { await p.waitForTimeout(250); s = await state(); watch(s); } while (Math.hypot(u.x - s.x, u.z - s.z) > u.reach + 0.3 && Date.now() - t0 < 120000 && s.cards === 0);
      ok = Math.hypot(u.x - s.x, u.z - s.z) <= u.reach + 0.3 || s.cards > 0;
      how = 'tap-to-go';
    }
    await steer(null);
    await p.waitForTimeout(300);
    const btn = await p.getByRole('button', { name: new RegExp(u.label.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).count();
    res.zones.push({ key: u.key, ok, how, button: btn > 0 });
    for (let i = 0; i < 6 && (await p.evaluate(() => globalThis.__adv.cards().length)); i++) {
      await p.evaluate(() => globalThis.__adv.close());
      await p.waitForTimeout(400);
    }
  }
  await steer(null);
  res.metres = Math.round(res.metres);
  res.recovered = last.recovered;
  res.errors = errs;
  res.ok = !res.inside && !res.feetOff && res.scaleDev < 1e-6 && !res.camUnder && !res.camHit && !res.jumps && !res.stuck.length && res.zones.every((z) => z.ok) && !res.tour.unreached.length && !errs.length;
  console.log(JSON.stringify(res));
  await b.close();
})();
