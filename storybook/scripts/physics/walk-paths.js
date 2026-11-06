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
  const ctx = await b.newContext(DEV === 'phone' ? { ...devices['Pixel 7'] } : { viewport: { width: 480, height: 320 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => {
    globalThis.__figProbe = {};
    try { if (!sessionStorage.getItem('x')) { localStorage.clear(); sessionStorage.setItem('x', '1'); } } catch {}
  });
  await p.goto(`${BASE}/adventure/${W}?q=low`, { timeout: 180000 });
  await p.waitForFunction(() => !!globalThis.__adv && globalThis.__adv.game.clock > 1.2, null, { timeout: 400000 });
  await p.evaluate((k) => globalThis.__adv.speed(k), +(process.env.SPEED || 5));
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
      sp.world.intersectionsWithShape({ x: c.x, y: 0, z: c.z }, { x: 0, y: 0, z: 0, w: 1 }, new sp.R.Ball(0.05), (h) => { const top = sp.camTop.get(h.handle) ?? 2.4; if (!sp.ground.has(h.handle) && top >= 0 && c.y < f(c.x, c.z) + top) camHit = { cam: [+c.x.toFixed(1), +c.y.toFixed(1), +c.z.toFixed(1)], me: [+P.x.toFixed(1), +P.z.toFixed(1)], top, floor: +f(c.x, c.z).toFixed(1), near: sp.solids.map((q) => ({ q, d: Math.hypot(q.x - c.x, q.z - c.z) })).sort((a, b) => a.d - b.d)[0]?.q.tag }; return !camHit; }, undefined, (4 << 16) | 1);
      return {
        x: P.x, z: P.z, feet: P.y - f(P.x, P.z), clock: g.clock, cy: g.cam.yaw,
        inside: sp.blockedAt(me.x, me.z, me.r * 0.8, me.collider), scale: globalThis.__figProbe?.scale ?? 1,
        camUnder: c.y < f(c.x, c.z) + 0.15, camHit,
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
    if (s.camHit) (res.camHit++, res.camHit < 4 && (res.camAt ??= []).push(s.camHit));
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
  const spots = await p.evaluate((TOUR) => {
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
    // Buildings are covered by the validator (every solid pushed from eight sides); set TOUR=all to visit them too.
    if (TOUR === 'all') for (const s of A.def.structures) add([s.x, s.z], s.type);
    return out;
  }, process.env.TOUR || 'tasks');
  // Which spots can be reached on foot now, and which only once a story gate opens.
  const reach = await p.evaluate((spots) => {
    const A = globalThis.__adv, sp = A.game.space, t = A.t, C = 0.7;
    const fill = () => {
      const s0 = sp.findOpen(A.game.spawn[0], A.game.spawn[1], 0.35) ?? A.game.spawn;
      const key = (i, j) => `${i},${j}`;
      // Breadth first, so each cell knows how far it is on foot from the spawn.
      const seen = new Map([[key(0, 0), 0]]);
      const q = [[0, 0]];
      for (let h = 0; h < q.length; h++) {
        const [i, j] = q[h];
        const ax = s0[0] + i * C, az = s0[1] + j * C;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = key(i + di, j + dj);
          if (seen.has(k)) continue;
          const bx = ax + di * C, bz = az + dj * C;
          if (Math.hypot(bx, bz) > t.radius || sp.blockedAt(bx, bz, 0.3) || !t.canStep(ax, az, bx, bz, 0.3)) continue;
          seen.set(k, seen.get(key(i, j)) + 1);
          q.push([i + di, j + dj]);
        }
      }
      // A spot counts as reachable if ground reached on foot lies within 2.5 m of
      // it with a walker-wide way in between (not the other side of a wall or a
      // row of trunks).
      const clear = (ax, az, bx, bz) => { const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.2); for (let k = 1; k < n; k++) { const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n; if (Math.hypot(bx - x, bz - z) > 0.6 && sp.blockedAt(x, z, 0.3)) return false; } return true; };
      return spots.map((p) => {
        let best = null;
        for (const [k, n] of seen) {
          const [i, j] = k.split(',').map(Number);
          const x = s0[0] + i * C, z = s0[1] + j * C, d = Math.hypot(x - p.x, z - p.z);
          if (d <= 2.5 && (!best || d < best.d) && clear(x, z, p.x, p.z)) best = { x, z, d, walk: n * C };
        }
        // Spots inside a solid (a well, a house): the nearest reached ground counts.
        if (!best && sp.blockedAt(p.x, p.z, 0.05))
          for (const [k, n] of seen) {
            const [i, j] = k.split(',').map(Number);
            const x = s0[0] + i * C, z = s0[1] + j * C, d = Math.hypot(x - p.x, z - p.z);
            if (d <= 4 && (!best || d < best.d)) best = { x, z, d, walk: n * C };
          }
        return best;
      });
    };
    sp.sync();
    const now = fill();
    // Every gate open: switch off the gate colliders and the terrain's own gate rules.
    const saved = [];
    for (const b of [...t.blocks, ...t.obstacles]) if (b.active) (saved.push([b, b.active]), (b.active = () => false));
    for (const g of sp.toggles) g.c.setEnabled(false);
    sp.world.step();
    const open = fill();
    for (const [b, f] of saved) b.active = f;
    sp.sync();
    return { now, open };
  }, spots);
  res.tour = { spots: spots.length, reachableNow: reach.now.filter(Boolean).length, walked: 0, tapped: 0, unreached: [], farOnly: [], gated: [], closed: [] };
  const tourSpots = [];
  spots.forEach((q, i) => {
    // Walk to the ground beside it that the flood fill reached.
    if (reach.now[i]) tourSpots.push({ ...q, gx: reach.now[i].x, gz: reach.now[i].z, walk: reach.now[i].walk });
    else if (reach.open[i]) res.tour.gated.push(q.what);
    else res.tour.closed.push({ what: q.what, at: [+q.x.toFixed(1), +q.z.toFixed(1)] });
  });
  spots.length = 0;
  spots.push(...tourSpots);
  // Visit them nearest-first, one after another, as a child exploring would.
  let here = await state();
  const order = [];
  const left = spots.slice();
  while (left.length) {
    left.sort((a, b2) => Math.hypot(a.x - here.x, a.z - here.z) - Math.hypot(b2.x - here.x, b2.z - here.z));
    const q = left.shift();
    order.push(q);
    here = { x: q.x, z: q.z };
  }
  let lost = false;
  const budget = Date.now() + +(process.env.TOUR_MIN || 12) * 60000;
  for (const q of order) {
    if (Date.now() > budget) { res.tour.timedOut = (res.tour.timedOut ?? 0) + 1; continue; }
    if (lost) {
      const back = await p.evaluate(() => globalThis.__adv.game.spawn);
      await p.evaluate(([x, z]) => globalThis.__adv.teleport(x, z), back);
      await p.waitForTimeout(250);
      lost = false;
    }
    last = await state();
    // Close is enough: the spot may be inside the thing (a house, a well).
    const near = 0;
    if (await goTo(q.gx, q.gz, near + 1.2, 60)) { res.tour.walked++; continue; }
    await steer(null);
    // Something in the way: tap the ground by it, as a child would, and let the route go round.
    await p.evaluate(([x, z]) => globalThis.__adv.go(x, z), [q.gx, q.gz]);
    const t0 = Date.now();
    let s, best = 1e9, bestAt = Date.now();
    do {
      await p.waitForTimeout(250);
      s = await state();
      watch(s);
      const d = Math.hypot(q.gx - s.x, q.gz - s.z);
      if (d < best - 0.1) (best = d), (bestAt = Date.now());
    } while (Math.hypot(q.gx - s.x, q.gz - s.z) > near + 1.2 && Date.now() - t0 < 90000 && Date.now() - bestAt < 15000);
    if (Math.hypot(q.gx - s.x, q.gz - s.z) <= near + 1.2 || Math.hypot(q.x - s.x, q.z - s.z) <= 2.6) res.tour.tapped++;
    else {
      lost = true;
      // Only reachable the long way round (outside the walls, the far side of a
      // lake): tap-to-go plans routes of a few dozen metres, so note it apart.
      const item = { what: q.what, at: [+q.x.toFixed(1), +q.z.toFixed(1)], got: [+s.x.toFixed(1), +s.z.toFixed(1)], onFoot: Math.round(q.walk) };
      if (q.walk > 70) res.tour.farOnly.push(item);
      else res.tour.unreached.push(item);
    }
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
  res.ok = !res.inside && !res.feetOff && res.scaleDev < 1e-6 && !res.camUnder && !res.camHit && !res.jumps && !res.stuck.length && res.zones.every((z) => z.ok) && !res.tour.unreached.length && !res.tour.closed.length && !errs.length;
  console.log(JSON.stringify(res));
  await b.close();
})();
