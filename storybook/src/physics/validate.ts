// Automated checks of a world's collision space, run by the test scripts
// (scripts call it through the world's test hook). It drives a probe capsule
// with the same controller the explorer uses and reports anything wrong:
// a spawn inside something, a solid you can walk into, a cliff you can climb,
// a way off the edge of the world.
import { MAX_SLOPE, MAX_STEP, type Space } from './space';

export type Report = {
  spawn: { ok: boolean; x: number; z: number };
  solids: { tested: number; pushes: number; entered: { tag: string; x: number; z: number }[] };
  slopes: { tested: number; climbs: { x: number; z: number; rise: number; run: number }[] };
  edge: { tested: number; escaped: { x: number; z: number }[] };
  ok: boolean;
};

export function validateSpace(sp: Space, opts: { spawn: [number, number]; r?: number; radius: number; seed?: number }): Report {
  const r = opts.r ?? 0.35;
  let seed = opts.seed ?? 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  sp.sync();
  const probe = sp.addWalker('player', r, opts.spawn[0], opts.spawn[1]);
  const H = 1 / 60;
  const walk = (dx: number, dz: number, n: number, each?: () => boolean | void) => {
    for (let i = 0; i < n; i++) {
      sp.move(probe, dx, dz, H);
      if (each?.()) return true;
    }
    return false;
  };

  // 1. The spawn point.
  const spawn = { ok: sp.okSpot(opts.spawn[0], opts.spawn[1], r), x: opts.spawn[0], z: opts.spawn[1] };

  // 2. Run at every solid from eight sides, for two seconds each.
  const entered: Report['solids']['entered'] = [];
  let pushes = 0;
  const solids = sp.solids.filter((s) => !s.active || s.active());
  for (const s of solids) {
    const ext = s.kind === 'circle' ? s.r : Math.hypot(s.hx, s.hz);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const sx = s.x + Math.cos(a) * (ext + r + 1.5);
      const sz = s.z + Math.sin(a) * (ext + r + 1.5);
      if (!sp.okSpot(sx, sz, r)) continue;
      sp.place(probe, sx, sz);
      pushes++;
      const l = Math.hypot(s.x - sx, s.z - sz) || 1;
      const hit = walk(((s.x - sx) / l) * 4.2 * H, ((s.z - sz) / l) * 4.2 * H, 120, () => sp.blockedAt(probe.x, probe.z, r * 0.8, probe.collider));
      if (hit) {
        entered.push({ tag: s.tag, x: +probe.x.toFixed(2), z: +probe.z.toFixed(2) });
        break;
      }
    }
  }

  // 3. Slopes: from random open spots, walk eight ways for a second and check
  // the climb never beats what a child could walk up.
  const climbs: Report['slopes']['climbs'] = [];
  let tested = 0;
  for (let i = 0; i < 160 && climbs.length < 12; i++) {
    const a0 = rnd() * Math.PI * 2;
    const d0 = Math.sqrt(rnd()) * (opts.radius - 3);
    const x0 = Math.cos(a0) * d0;
    const z0 = Math.sin(a0) * d0;
    if (!sp.okSpot(x0, z0, r)) continue;
    for (let k = 0; k < 8; k++) {
      sp.place(probe, x0, z0);
      tested++;
      const a = (k / 8) * Math.PI * 2;
      let lastY = probe.y;
      let lx = probe.x;
      let lz = probe.z;
      let bad: { rise: number; run: number } | null = null;
      // Track the climb over each 0.5 m of real travel.
      walk(Math.cos(a) * 4.2 * H, Math.sin(a) * 4.2 * H, 60, () => {
        const run = Math.hypot(probe.x - lx, probe.z - lz);
        const rise = probe.y - lastY;
        if (rise > MAX_STEP + 0.02 && run < 0.2) bad = { rise, run };
        if (run >= 0.5) {
          if (rise / run > MAX_SLOPE * 1.25 + MAX_STEP / run) bad = { rise, run };
          lastY = probe.y;
          lx = probe.x;
          lz = probe.z;
        }
        return !!bad;
      });
      if (bad) climbs.push({ x: +x0.toFixed(1), z: +z0.toFixed(1), rise: +(bad as { rise: number }).rise.toFixed(2), run: +(bad as { run: number }).run.toFixed(2) });
    }
  }

  // 4. The edge: walk straight out from near the middle in 16 directions.
  const escaped: Report['edge']['escaped'] = [];
  const o = sp.findOpen(opts.spawn[0], opts.spawn[1], r) ?? opts.spawn;
  for (let k = 0; k < 16; k++) {
    sp.place(probe, o[0], o[1]);
    const a = (k / 16) * Math.PI * 2;
    walk(Math.cos(a) * 7 * H, Math.sin(a) * 7 * H, 60 * 40);
    if (Math.hypot(probe.x, probe.z) > opts.radius + 0.5) escaped.push({ x: +probe.x.toFixed(1), z: +probe.z.toFixed(1) });
  }

  sp.removeWalker(probe);
  return {
    spawn,
    solids: { tested: solids.length, pushes, entered },
    slopes: { tested, climbs },
    edge: { tested: 16, escaped },
    ok: spawn.ok && !entered.length && !climbs.length && !escaped.length,
  };
}
