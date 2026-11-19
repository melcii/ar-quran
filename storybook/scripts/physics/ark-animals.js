// Each Ark animal kind tested on its own (giraffe, elephant, camel, horse, sheep):
// the pair is sent aboard from where they graze, and every frame we check that
// neither animal is inside a solid, the two never walk through each other, they
// keep their size, their whole body passes under the doorway lintel, they stay
// a pair (arrive together, end in the same stall) and neither gets stuck.
// Usage: node ark-animals.js  (serve the web build on :8090 first)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { try { if (!sessionStorage.getItem('x')) { localStorage.clear(); sessionStorage.setItem('x', '1'); } } catch {} });
  await p.goto(`http://localhost:${process.env.PORT || 8090}/ark?q=low`, { timeout: 180000 });
  await p.waitForFunction(() => !!globalThis.__ark && !!globalThis.__arkGame, null, { timeout: 400000 });
  await p.waitForTimeout(2500);
  const out = { kinds: {}, errors: errs };
  for (const kind of (process.env.KINDS || 'giraffe elephant camel horse sheep').split(' ')) {
    const r = await p.evaluate(async ([kind, LIMIT]) => {
      const A = __ark, G = __arkGame, g = A.game, sp = g.space;
      const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
      A.speed(3);
      const two = g.agents.filter((a) => a.kind === kind);
      const R = { n: two.length, inside: 0, overlap: 0, frames: 0, scaleDev: 0, topAtDoor: -99, doorTop: 1.2 + 1.4 + 3.3, maxStuck: 0, apartMax: 0 };
      if (two.length !== 2) return { ...R, note: 'not a pair' };
      const s0 = two.map((a) => a.scale);
      // The two animals' own colliders (the walkers nearest each).
      const wk = () => two.map((a) => sp.walkers.filter((w) => w.kind === 'animal').sort((u, v) => Math.hypot(u.x - a.pos.x, u.z - a.pos.z) - Math.hypot(v.x - a.pos.x, v.z - a.pos.z))[0]);
      // The real way aboard: the pair is called to its pad from wherever it grazes
      // (walking round trees, rocks and the river), then boards up the ramp.
      G.sendToPad(kind);
      const c0 = g.clock;
      const t0 = performance.now();
      let arrived = [null, null];
      while (performance.now() - t0 < (LIMIT * 1000) && !two.every((a) => a.state === 'stall')) {
        await sleep(80);
        R.frames++;
        two.forEach((a, i) => {
          const w = wk()[i];
          if (w && sp.blockedAt(w.x, w.z, w.r * 0.8, w.collider)) (R.inside++, R.insideAt ??= [], R.insideAt.length < 6 && R.insideAt.push([a.state, +w.x.toFixed(1), +w.z.toFixed(1)]));
          R.scaleDev = Math.max(R.scaleDev, Math.abs(a.scale - s0[i]));
          if ((a.stuck ?? 0) > R.maxStuck) (R.maxStuck = a.stuck, R.stuckAt = [a.state, +a.pos.x.toFixed(1), +a.pos.z.toFixed(1)]);
          if (a.state === 'stall' && arrived[i] == null) arrived[i] = (performance.now() - t0) / 1000;
          // Under the doorway: the top of the whole body must be below the lintel.
          if (Math.abs(a.pos.x) < 2.2 && Math.abs(a.pos.z - (-20 + 4.75)) < 1.2) {
            const o = G.scene.getObjectByName(`beast-${a.id}`);
            if (o) {
              o.updateWorldMatrix(true, true);
              o.traverse((m) => { if (m.isMesh && m.geometry) { m.geometry.computeBoundingBox?.(); const bb = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld); R.topAtDoor = Math.max(R.topAtDoor, bb.max.y); } });
            }
          }
        });
        const [a, c] = wk();
        if (a && c && Math.hypot(a.x - c.x, a.z - c.z) < (a.r + c.r) * 0.8) (R.overlap++, R.overlapAt ??= [], R.overlapAt.length < 8 && R.overlap % 20 === 1 && R.overlapAt.push([two[0].state, two[1].state, +a.x.toFixed(1), +a.z.toFixed(1), +c.x.toFixed(1), +c.z.toFixed(1)]));
        R.apartMax = Math.max(R.apartMax, two[0].pos.distanceTo(two[1].pos));
      }
      R.bothInStall = two.every((a) => a.state === 'stall');
      R.secs = +((performance.now() - t0) / 1000).toFixed(0);
      R.gameSecs = +(g.clock - c0).toFixed(1);
      R.sameStall = two[0].pos.distanceTo(two[1].pos) < 4;
      R.fitsDoor = R.topAtDoor < R.doorTop;
      R.scaleDev = +R.scaleDev.toFixed(4);
      R.topAtDoor = +R.topAtDoor.toFixed(2);
      R.boarded = arrived;
      R.ok = R.bothInStall && !R.inside && !R.overlap && R.scaleDev < 1e-3 && R.fitsDoor && R.sameStall;
      return R;
    }, [kind, +(process.env.LIMIT || 1500)]);
    out.kinds[kind] = r;
    process.stderr.write(`${kind} ${JSON.stringify(r)}\n`);
  }
  out.ok = Object.values(out.kinds).every((k) => k.ok) && !errs.length;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
