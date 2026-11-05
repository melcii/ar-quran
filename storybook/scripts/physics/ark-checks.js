// Ark acceptance checks: giraffes through the doorway (height and path), ramp rails, the door shut while the ramp is raised, the floor lifting with the flood.
const { chromium, devices } = require('playwright');
const DEV = process.env.DEV || 'desktop';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext(DEV === 'phone' ? { ...devices['Pixel 7'] } : { viewport: { width: 1000, height: 650 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { try { if (!sessionStorage.getItem('x')) { localStorage.clear(); sessionStorage.setItem('x', '1'); } } catch {} });
  await p.goto('http://localhost:8090/ark?q=low', { timeout: 180000 });
  await p.waitForFunction(() => !!globalThis.__ark && !!globalThis.__arkGame, null, { timeout: 400000 });
  await p.waitForTimeout(2500);
  const res = await p.evaluate(async () => {
    const A = __ark, G = __arkGame, g = A.game, sp = g.space, W = G.weather;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // Wait for game time (the headless renderer is slow, so real time means little).
    const waitClk = async (sec, until) => { const c0 = g.clock, t0 = performance.now(); while (g.clock - c0 < sec && performance.now() - t0 < 240000) { if (until?.()) return true; await sleep(50); } return !!until?.(); };
    const THREE_Box = G.scene.children.length && Object.getPrototypeOf(G.scene).constructor; // unused
    const out = {};
    A.speed(3);
    // --- Giraffes board.
    const gir = g.agents.filter((a) => a.kind === 'giraffe');
    const ARKz = -20, wid = 9.5, door = 1.7, floorY = 1.2 + 1.4;
    // Their path, checked against every solid (the door is open: the ramp is down).
    sp.sync();
    G.board('giraffe');
    let pathBad = [];
    for (const a of gir) {
      const pts = [a.pos, ...a.path];
      // Start them at the foot of the ramp, as after standing on their pad.
      a.pos.set(a.path[0].x, a.pos.y, a.path[0].z);
      for (let i = 0; i < a.path.length - 1; i++) {
        const P = a.path[i], Q = a.path[i + 1];
        const n = Math.ceil(P.distanceTo(Q) / 0.1);
        for (let k = 0; k <= n; k++) {
          const x = P.x + (Q.x - P.x) * (k / n), z = P.z + (Q.z - P.z) * (k / n);
          if (sp.blockedAt(x, z, 0.3)) { pathBad.push([a.id, i, +x.toFixed(2), +z.toFixed(2)]); break; }
        }
      }
    }
    out.giraffePathBlocked = pathBad;
    let maxAtDoor = -99, doorTop = floorY + 3.3, minDuck = 1, seenDoor = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < 400000 && !gir.every((a) => a.state === 'stall')) {
      await sleep(80);
      for (const a of gir) {
        const lz = a.pos.z - ARKz;
        const o = G.scene.getObjectByName(`beast-${a.id}`);
        if (!o) continue;
        // Whole body near the door plane: its top must be below the lintel.
        if (Math.abs(a.pos.x) < door + 0.5 && Math.abs(lz - wid / 2) < 1.2) {
          seenDoor++;
          o.updateWorldMatrix(true, true);
          let top = -99;
          o.traverse((m) => { if (m.isMesh && m.geometry) { m.geometry.computeBoundingBox?.(); const bb = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld); top = Math.max(top, bb.max.y); } });
          maxAtDoor = Math.max(maxAtDoor, top);
          minDuck = Math.min(minDuck, a.duck ?? 0);
        }
      }
    }
    out.giraffesInStall = gir.every((a) => a.state === 'stall');
    out.giraffeTopAtDoor = +maxAtDoor.toFixed(2);
    out.doorTop = doorTop;
    out.giraffeFitsDoor = seenDoor > 0 && maxAtDoor < doorTop;
    out.doorSamples = seenDoor;
    // Upright giraffe height out in the meadow, for comparison.
    const o2 = g.agents.find((a) => a.kind === 'camel');
    // --- Ramp rails: from beside the ramp, walk sideways at it.
    const RAMPz0 = ARKz + wid / 2, RAMPz1 = RAMPz0 + 7.5;
    let onRampFromSide = 0;
    for (const sd of [-1, 1]) {
      await waitClk(0.1); A.teleport(sd * 3.2, (RAMPz0 + RAMPz1) / 2 - 1);
      await waitClk(0.15);
      g.cam.yaw = Math.atan2(-sd, 0) + Math.PI;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      await waitClk(2.5, () => { if (Math.abs(g.me.x) < 1.6) onRampFromSide++; });
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
      await waitClk(0.15);
    }
    out.railsHold = onRampFromSide === 0;
    // --- Door shut while the ramp is raised.
    W.rampUp = 1;
    await waitClk(0.1); A.teleport(0, RAMPz0 + 2.5);
    await waitClk(0.15);
    g.cam.yaw = 0; // forward (w) walks toward -z, into the doorway
    let gotIn = 0;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    await waitClk(3, () => { if (g.me.z < RAMPz0 - 0.4) gotIn++; });
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
    out.doorShut = gotIn === 0;
    W.rampUp = 0;
    await waitClk(0.15);
    // ... and open again with the ramp down: walk up the ramp and in.
    await waitClk(0.1); A.teleport(0, RAMPz1 + 1);
    await waitClk(0.15);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    let inside = false;
    inside = await waitClk(8, () => A.player.inside && g.me.z < RAMPz0 - 1.5);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
    out.walksUpRampInside = inside;
    // --- The floor lifts with the flood: feet stay on it.
    W.lift = 3;
    await waitClk(0.6);
    out.feetOnLiftedFloor = Math.abs(A.player.pos.y - (floorY + 3)) < 0.05;
    W.lift = 0;
    await sleep(500);
    out.recovered = g.recovered;
    return out;
  });
  res.errors = errs;
  await p.screenshot({ path: `out/ark-${DEV}.png` });
  console.log(JSON.stringify(res));
  await b.close();
})();
