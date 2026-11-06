// Validate one world: missing-collider audit, the collision space (solids, slopes,
// edge, every footpath, every activity spot), then live checks: walking into
// solids, the camera, recovery, scale.
const { chromium, devices } = require('playwright');
const W = process.env.W || '1';
const DEV = process.env.DEV || 'desktop';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext(DEV === 'phone' ? { ...devices['Pixel 7'] } : { viewport: { width: 1000, height: 650 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { globalThis.__figProbe = {}; });
  const ark = W === 'ark';
  const H = ark ? '__ark' : '__adv';
  await p.goto(ark ? 'http://localhost:8090/ark?q=low' : `http://localhost:8090/adventure/${W}?q=low`, { timeout: 180000 });
  await p.waitForFunction((h) => !!globalThis[h], H, { timeout: 400000 });
  await p.waitForTimeout(2500);
  // Let the activity props register their colliders (twice a second of game time).
  await p.waitForFunction((h) => (globalThis[h].game.clock ?? 99) > 1.2, H, { timeout: 300000 }).catch(() => {});
  const out = { world: W, dev: DEV };
  out.audit = await p.evaluate((h) => { const a = globalThis[h].audit?.(); if (!a) return null; const ex = globalThis[h].game.space.extra.get('props'); return { parts: a.parts, props: ex ? ex.solids.length : 0, uncoveredN: a.uncovered.length, uncovered: a.uncovered.slice(0, 25), wide: a.wide.slice(0, 10) }; }, H);
  const t0 = Date.now();
  out.report = await p.evaluate((h) => globalThis[h].validate(), H);
  out.graded = await p.evaluate((h) => globalThis[h].t?.graded ?? null, H);
  out.validateMs = Date.now() - t0;
  // Live: walk into the nearest solids with the keyboard, check never inside one, then the camera at 8 angles.
  const live = await p.evaluate(async (h) => {
    const A = globalThis[h];
    const g = A.game;
    const sp = g.space;
    const me = g.me;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitClk = async (sec, each) => { const c0 = g.clock, t0 = performance.now(); while (g.clock - c0 < sec && performance.now() - t0 < 120000) { each?.(); await sleep(50); } };
    A.speed(4);
    const res = { inside: 0, under: 0, camInside: 0, camUnder: 0, frames: 0, maxScaleDev: 0, figH: null };
    const sol = sp.solids.filter((s) => !s.active || s.active()).map((s) => ({ s, d: Math.hypot(s.x - me.x, s.z - me.z) })).sort((a, b) => a.d - b.d).slice(0, 4);
    for (const { s } of sol) {
      const ext = s.kind === 'circle' ? s.r : Math.max(s.hx, s.hz);
      for (const k of [0, 2, 4, 6]) {
        const a = (k / 8) * Math.PI * 2;
        const x = s.x + Math.cos(a) * (ext + 2.5), z = s.z + Math.sin(a) * (ext + 2.5);
        if (!sp.okSpot(x, z, me.r)) continue;
        A.teleport(x, z);
        await waitClk(0.1);
        g.target = null;
        const yaw = Math.atan2(s.x - x, s.z - z);
        // Steer with the camera-relative stick: point the camera so "up" walks at the solid.
        g.cam.yaw = yaw + Math.PI;
        const kd = new KeyboardEvent('keydown', { key: 'w' });
        window.dispatchEvent(kd);
        await waitClk(1.5, () => {
          res.frames++;
          if (sp.blockedAt(me.x, me.z, me.r * 0.8, me.collider)) res.inside++;
          if (A.player.pos.y < sp.spec.floor(A.player.pos.x, A.player.pos.z) - 0.25) res.under++;
          const pr = globalThis.__figProbe;
          if (pr && pr.scale) res.maxScaleDev = Math.max(res.maxScaleDev, Math.abs(pr.scale - 1));
        });
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
        await sleep(200);
      }
    }
    for (let k = 0; k < 8; k++) {
      A.view(k * 0.785, 0.25, 9);
      await waitClk(0.4);
      const c = g.cam.pos;
      if (c.y < sp.spec.floor(c.x, c.z) + 0.2) res.camUnder++;
      let realHit = false; sp.world.intersectionsWithShape({ x: c.x, y: 0, z: c.z }, { x: 0, y: 0, z: 0, w: 1 }, new sp.R.Ball(0.05), (h) => { const top = sp.camTop.get(h.handle) ?? 2.4; if (!sp.ground.has(h.handle) && top >= 0 && c.y < sp.spec.floor(c.x, c.z) + top) realHit = true; return !realHit; }, undefined, (4 << 16) | 1); if (realHit && c.y < sp.spec.floor(c.x, c.z) + 2.4 && !A.player.inside) { res.camInside++; (res.camAt ??= []).push([k, +c.x.toFixed(1), +c.y.toFixed(1), +c.z.toFixed(1), +me.x.toFixed(1), +me.z.toFixed(1)]); }
    }
    // Return to safe ground keeps story progress.
    const before = JSON.stringify(A.save().done ?? A.save().boarded);
    A.toSafeGround();
    await waitClk(0.2);
    res.safeOk = sp.okSpot(me.x, me.z, me.r) && JSON.stringify(A.save().done ?? A.save().boarded) === before;
    res.figH = globalThis.__figProbe?.h ?? null;
    res.recovered = g.recovered;
    res.walkInPlaceMaxSec = +g.wipMax.toFixed(2);
    return res;
  }, H);
  out.live = live;
  out.errors = errs;
  console.log(JSON.stringify(out));
  await p.screenshot({ path: `out/val-${W}-${DEV}.png`, timeout: 120000 }).catch(() => {});
  await b.close();
})();
