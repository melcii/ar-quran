// Frame-by-frame motion trace while walking with real input. Records, after
// every rendered frame: frame time, the drawn figure's position, scale and
// facing, where the game thinks the explorer is, the walk-cycle phase, the
// camera, and the figure's place on screen. Then reports discontinuities:
// figure drawn behind the game position (lag), jerky steps, screen jitter,
// scale changes, feet off the ground, camera jumps, walk cycle not matching
// speed.
//
// Headless rendering is slow, so the page's clock is replaced by a virtual one
// that advances a fixed amount per drawn frame: FRAMES=60 (steady 60 Hz),
// j60 (60 Hz with ±5 ms jitter, like a real phone), 30, 120, or spike (60 Hz
// with a 120 ms hitch every second). The game then runs exactly as it would at
// that frame rate. Input is held for a number of frames.
//   W=19 FRAMES=j60 node motion-trace.js
const { chromium, devices } = require('playwright');
const W = process.env.W || '19';
const DEV = process.env.DEV || 'desktop';
const [VW, VH] = (process.env.SIZE || '900x600').split('x').map(Number);
const BASE = process.env.BASE || 'http://localhost:8090';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext(DEV === 'phone' ? { ...devices['Pixel 7'] } : { viewport: { width: VW, height: VH } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const FR = process.env.FRAMES || 'j60';
  await p.addInitScript((FR) => {
    // Virtual frame clock.
    const realRAF = window.requestAnimationFrame.bind(window);
    const realNow = performance.now.bind(performance);
    const base = realNow();
    let vt = 0;
    let frame = 0;
    let rnd = 12345;
    const r = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
    const step = () => {
      if (FR === '30') return 1000 / 30;
      if (FR === '120') return 1000 / 120;
      if (FR === 'spike') return frame % 60 === 0 ? 120 : 1000 / 60;
      if (FR === 'j60') return 1000 / 60 + (r() - 0.5) * 10;
      return 1000 / 60;
    };
    performance.now = () => base + vt;
    const tick = () => {
      vt += step();
      frame++;
      globalThis.__vframe = frame;
      realRAF(tick);
    };
    realRAF(tick);
    window.requestAnimationFrame = (cb) => realRAF(() => cb(base + vt));
    globalThis.__frames = (n) => new Promise((res) => { const f0 = frame; const w = () => (frame - f0 >= n ? res() : realRAF(w)); realRAF(w); });
    globalThis.__figProbe = {};
    try { if (!sessionStorage.getItem('x')) { localStorage.clear(); sessionStorage.setItem('x', '1'); } } catch {}
  }, FR);
  await p.goto(`${BASE}/adventure/${W}?q=low`, { timeout: 180000 });
  await p.waitForFunction(() => !!globalThis.__adv && globalThis.__adv.game.clock > 1.5 && globalThis.__figProbe.obj, null, { timeout: 400000 });
  for (let i = 0; i < 6 && (await p.evaluate(() => globalThis.__adv.cards().length)); i++) {
    const btn = p.getByRole('button', { name: /^(Continue|Close|OK)/ }).first();
    if (!(await btn.count())) break;
    DEV === 'phone' ? await btn.tap() : await btn.click();
    await p.waitForTimeout(500);
  }
  await p.evaluate(() => {
    const A = globalThis.__adv;
    const rec = (globalThis.__trace = []);
    const V = A.player.pos.constructor;
    const v = new V();
    const loop = () => {
      const g = A.game, f = globalThis.__figProbe.obj, cam = g.camera;
      if (f && cam) {
        f.updateWorldMatrix(true, false);
        f.getWorldPosition(v);
        const ws = new V();
        f.getWorldScale(ws);
        const sc = v.clone().setY(v.y + 1.0).project(cam);
        rec.push({
          t: performance.now(), clk: g.clock,
          fx: v.x, fy: v.y, fz: v.z, px: A.player.pos.x, pz: A.player.pos.z, floor: g.space.spec.floor(v.x, v.z),
          s: ws.x, ry: f.rotation.y, yaw: A.player.yaw, sp: A.player.speed, ph: globalThis.__figProbe.ph,
          cx: cam.position.x, cy: cam.position.y, cz: cam.position.z, sx: sc.x, sy: sc.y,
        });
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  // Input held for whole frames (key events through the game's own handlers).
  const fps = FR === '30' ? 30 : FR === '120' ? 120 : 60;
  const hold = (keys, secs) => p.evaluate(async ([keys, n]) => {
    for (const k of keys) window.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
    await globalThis.__frames(n);
    for (const k of keys) window.dispatchEvent(new KeyboardEvent('keyup', { key: k }));
  }, [keys, Math.round(secs * fps)]);
  const idle = (secs) => p.evaluate((n) => globalThis.__frames(n), Math.round(secs * fps));
  const t0 = Date.now();
  await p.evaluate(() => (globalThis.__trace.length = 0));
  await hold(['w'], 3);
  await idle(0.6);
  await hold(['w', 'd'], 1.5);
  await hold(['a'], 1.5);
  await idle(0.6);
  await hold(['w'], 0.5);
  await idle(0.3);
  await hold(['w', 'shift'], 2);
  await idle(1);
  const tr = await p.evaluate(() => globalThis.__trace);
  // Analysis.
  const n = tr.length;
  const dts = [];
  const res = { world: W, dev: DEV, size: `${VW}x${VH}`, frames: n, fps: 0, secs: (Date.now() - t0) / 1000 };
  let lagMax = 0, scaleDev = 0, feetMax = 0, camJump = 0, rev = 0, speedJerk = 0, scrJit = [], phRatio = [], dupFrames = 0, turnSnap = 0;
  for (let i = 1; i < n; i++) {
    const a = tr[i - 1], c = tr[i];
    const dt = c.clk - a.clk;
    dts.push(c.t - a.t);
    lagMax = Math.max(lagMax, Math.hypot(c.fx - c.px, c.fz - c.pz));
    scaleDev = Math.max(scaleDev, Math.abs(c.s - 1));
    feetMax = Math.max(feetMax, Math.abs(c.fy - c.floor));
    const cj = Math.hypot(c.cx - a.cx, c.cy - a.cy, c.cz - a.cz);
    if (dt > 0 && cj > Math.max(0.5, 14 * dt)) camJump++;
    let dry = c.ry - a.ry; dry = Math.atan2(Math.sin(dry), Math.cos(dry));
    if (Math.abs(dry) > 1.0) turnSnap++;
    if (dt <= 0) { if (Math.hypot(c.fx - a.fx, c.fz - a.fz) > 0.001) dupFrames++; continue; }
    // Walk cycle vs real ground speed.
    const step = Math.hypot(c.fx - a.fx, c.fz - a.fz);
    const stride = 0.55 + 0.45 * Math.max(0, Math.min(1, (c.sp - 4.2) / 2.5)); // as in pose.ts
    if (c.sp > 1 && step / dt > 1) phRatio.push(((c.ph - a.ph) / dt) / ((step / dt / stride) * Math.PI));
    if (i > 1) {
      const z = tr[i - 2];
      const dt0 = a.clk - z.clk;
      if (dt0 > 0) {
        const v0 = Math.hypot(a.fx - z.fx, a.fz - z.fz) / dt0, v1 = step / dt;
        if (v0 > 1 && v1 > 1 && Math.abs(v1 - v0) / Math.max(v0, v1) > 0.35) speedJerk++;
        // Moving backwards against the direction of travel.
        if ((c.fx - a.fx) * (a.fx - z.fx) + (c.fz - a.fz) * (a.fz - z.fz) < -1e-6) rev++;
        // Screen-space jitter of the figure: second difference, in pixels.
        const ddx = (c.sx - 2 * a.sx + z.sx) * VW / 2, ddy = (c.sy - 2 * a.sy + z.sy) * VH / 2;
        scrJit.push(Math.hypot(ddx, ddy));
      }
    }
  }
  const q = (arr, k) => { const s = arr.slice().sort((x, y) => x - y); return s.length ? +s[Math.floor((s.length - 1) * k)].toFixed(3) : null; };
  res.fps = +(1000 / (dts.reduce((x, y) => x + y, 0) / Math.max(1, dts.length))).toFixed(1);
  Object.assign(res, {
    dtMs: { p50: q(dts, 0.5), p95: q(dts, 0.95), max: q(dts, 1) },
    lagMax: +lagMax.toFixed(3), scaleDev, feetMax: +feetMax.toFixed(3), camJump, reversals: rev, speedJerk, turnSnap, dupFrames,
    screenJitterPx: { p50: q(scrJit, 0.5), p95: q(scrJit, 0.95), max: q(scrJit, 1) },
    cycleVsSpeed: { p05: q(phRatio, 0.05), p50: q(phRatio, 0.5), p95: q(phRatio, 0.95) },
    errors: errs,
  });
  console.log(JSON.stringify(res));
  if (process.env.DUMP) require('fs').writeFileSync(process.env.DUMP, JSON.stringify(tr));
  await b.close();
})();
