// Shared pieces for world recipes: rolling land with a closing rim, bumps,
// hollows, carved stream beds, and a few looks (golden evening, bright
// morning, desert noon, dusk with stars).
import { fbm, type P2 } from '../terrain';
import type { Structure } from '../kit';
import type { Look } from '../Scenery';

const sm = (t: number) => {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
};

export type Shape = { x: number; z: number; r: number; h: number };

/** Gentle hills that rise into a rim at the edge, plus hand-placed hills (h > 0) and hollows (h < 0). */
export function rolling(o: { radius: number; amp?: number; scale?: number; seed?: number; rim?: number; shapes?: Shape[]; streams?: { pts: P2[]; w: number; depth: number }[]; tilt?: [number, number] }) {
  const amp = o.amp ?? 4;
  const sc = o.scale ?? 34;
  const sd = o.seed ?? 0;
  const rim = o.rim ?? 1;
  return (x: number, z: number) => {
    const r = Math.hypot(x, z);
    let h = (fbm(x / sc + 7 + sd, z / sc + 3 + sd) - 0.5) * amp + (fbm(x / 11 + sd, z / 11) - 0.5) * 0.9;
    h += Math.min(16, Math.max(0, r - (o.radius - 6)) ** 1.3 * 0.22 * rim) + Math.max(0, r - o.radius - 35) * 0.12;
    for (const s of o.shapes ?? []) {
      const d = Math.hypot(x - s.x, z - s.z);
      h += s.h * sm(1 - d / s.r);
    }
    for (const s of o.streams ?? []) {
      let d = 99;
      for (let i = 0; i < s.pts.length - 1; i++) {
        const [ax, az] = s.pts[i];
        const [bx, bz] = s.pts[i + 1];
        const dx = bx - ax;
        const dz = bz - az;
        const l2 = dx * dx + dz * dz || 1;
        const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / l2));
        d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t));
      }
      h -= s.depth * sm(1 - (d - s.w * 0.5) / 5);
    }
    if (o.tilt) h += x * o.tilt[0] + z * o.tilt[1];
    return h;
  };
}

/** Points spaced along a polyline, offset to alternating sides. */
export function along(path: P2[], n: number, side = 2.6, from = 0.08, to = 0.92): P2[] {
  const seg: number[] = [0];
  for (let i = 1; i < path.length; i++) seg.push(seg[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const L = seg[seg.length - 1];
  const out: P2[] = [];
  for (let k = 0; k < n; k++) {
    const want = L * (from + ((to - from) * k) / Math.max(1, n - 1));
    let i = 1;
    while (i < seg.length - 1 && seg[i] < want) i++;
    const f = (want - seg[i - 1]) / (seg[i] - seg[i - 1] || 1);
    const [ax, az] = path[i - 1];
    const [bx, bz] = path[i];
    const x = ax + (bx - ax) * f;
    const z = az + (bz - az) * f;
    const l = Math.hypot(bx - ax, bz - az) || 1;
    const s = k % 2 ? side : -side;
    out.push([x + (-(bz - az) / l) * s, z + ((bx - ax) / l) * s]);
  }
  return out;
}

export const LOOKS: Record<'golden' | 'morning' | 'desert' | 'dusk' | 'sea' | 'blossom', Look> = {
  golden: {
    zen: '#6f8fd6', mid: '#b9b2e6', hor: '#ffd2a6', sun: [-0.55, 0.3, -0.78], sunColor: '#ffd29a', sunI: 3.2,
    hemiSky: '#c4cdf5', hemiGround: '#6c7a3e', hemiI: 1.25, fog: '#e9c7ae', fogDensity: 0.006, clouds: 1, birds: true,
  },
  blossom: {
    zen: '#7f98d8', mid: '#d4b6e2', hor: '#ffd8b8', sun: [0.5, 0.34, -0.8], sunColor: '#ffd6a4', sunI: 3.1,
    hemiSky: '#d0cdf2', hemiGround: '#6e7a44', hemiI: 1.3, fog: '#efcfc0', fogDensity: 0.0065, clouds: 1, birds: true,
  },
  morning: {
    zen: '#5f8fe0', mid: '#a8c4ee', hor: '#f4e2c8', sun: [0.6, 0.5, 0.5], sunColor: '#fff0d4', sunI: 3.0,
    hemiSky: '#cfe0ff', hemiGround: '#6c7a3e', hemiI: 1.35, fog: '#dfe6e4', fogDensity: 0.005, clouds: 1, birds: true,
  },
  desert: {
    zen: '#5a86d0', mid: '#a6bce0', hor: '#f6dcb4', sun: [0.45, 0.55, -0.6], sunColor: '#fff0cc', sunI: 3.4,
    hemiSky: '#d6e2fa', hemiGround: '#a8865a', hemiI: 1.3, fog: '#ecd8bc', fogDensity: 0.0045, clouds: 0.5, birds: true,
  },
  dusk: {
    zen: '#2c3a72', mid: '#8a74b0', hor: '#f4a87a', sun: [-0.7, 0.08, -0.7], sunColor: '#ffb884', sunI: 2.4,
    hemiSky: '#8c90c8', hemiGround: '#4a4a3a', hemiI: 1.1, fog: '#b89aa0', fogDensity: 0.006, stars: 0.8, moon: [0.5, 0.35, 0.8], clouds: 0.6, birds: false,
  },
  sea: {
    zen: '#5c8ad8', mid: '#a6c0ea', hor: '#ffe0bc', sun: [-0.4, 0.28, -0.85], sunColor: '#ffd8a8', sunI: 3.1,
    hemiSky: '#c8dafa', hemiGround: '#6a7a54', hemiI: 1.3, fog: '#e2d8cc', fogDensity: 0.004, clouds: 1, birds: true,
  },
};

export const PAL = {
  meadow: { lush: '#7aa24a', deep: '#4f7a34', warm: '#b8b05a', path: '#d8c49a', sand: '#e2cf9c', rock: '#9a8f80' },
  autumn: { lush: '#8aa24a', deep: '#5c7a34', warm: '#c8a050', path: '#d8c49a', sand: '#e2cf9c', rock: '#9a8f80' },
  dry: { lush: '#a8a45a', deep: '#7a8a44', warm: '#d0b070', path: '#e2cc9e', sand: '#e8d4a4', rock: '#b09a7e' },
  desert: { lush: '#d8b880', deep: '#c09a64', warm: '#e8cc94', path: '#eedcb0', sand: '#f0dcae', rock: '#b8946a' },
  coast: { lush: '#86a852', deep: '#5a8040', warm: '#c0b468', path: '#dcc8a0', sand: '#ecdcae', rock: '#a0968a' },
};

/** A point at radius r and angle a (degrees; 0 = east, 90 = south). */
export const polar = (r: number, a: number): P2 => [r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)];

/** A point near a region's centre: a = region angle, dr = along the radius, da = sideways in metres. */
export function near(center: [number, number], dr: number, da: number): P2 {
  const [r, a] = center;
  return polar(r + dr, a + (da / Math.max(1, r)) * (180 / Math.PI));
}

/** Steep ridges along rays from the centre, splitting the world into regions. A gap at passR leaves a pass. */
export function ridges(angles: { a: number; passR?: number }[], from = 30, to = 112, h = 15): Shape[] {
  const out: Shape[] = [];
  for (const { a, passR } of angles)
    for (let r = from; r <= to; r += 9) {
      if (passR != null && Math.abs(r - passR) < 8) continue;
      const [x, z] = polar(r, a);
      out.push({ x, z, r: 11, h });
    }
  return out;
}

/** A gate across a pass (opens when `task` is done), with short walls either side. */
export function passGate(a: number, r: number, task: string, color = '#d6c4a2'): Structure[] {
  const [x, z] = polar(r, a);
  const rot = (-a * Math.PI) / 180;
  return [
    { type: 'gate', x, z, rot, w: 5, hide: task, color },
    { type: 'wall', ...pt(polar(r + 2.6, a)), to: polar(r + 7, a), color },
    { type: 'wall', ...pt(polar(r - 2.6, a)), to: polar(r - 7, a), color },
  ];
}
const pt = ([x, z]: P2) => ({ x, z });

/** Points in a ring (for slots around a foundation or a table). */
export function ringPts(c: P2, r: number, n: number, a0 = 0): P2[] {
  return Array.from({ length: n }, (_, i) => [c[0] + Math.cos(a0 + (i / n) * Math.PI * 2) * r, c[1] + Math.sin(a0 + (i / n) * Math.PI * 2) * r] as P2);
}

/** Points on a square outline (for a foundation). */
export function squarePts(c: P2, half: number, perSide: number): P2[] {
  const out: P2[] = [];
  for (let s = 0; s < 4; s++)
    for (let i = 0; i < perSide; i++) {
      const t = -half + (2 * half * i) / perSide;
      const p: P2 = s === 0 ? [t, -half] : s === 1 ? [half, t] : s === 2 ? [-t, half] : [-half, -t];
      out.push([c[0] + p[0], c[1] + p[1]]);
    }
  return out;
}

/** A house at (x, z) turned so its door faces (cx, cz); returns its rotation and the spot just outside the door. */
export function facing(x: number, z: number, cx: number, cz: number, d = 5): { rot: number; door: P2 } {
  const rot = Math.atan2(cx - x, cz - z);
  return { rot, door: [x + Math.sin(rot) * (d / 2 + 1.6), z + Math.cos(rot) * (d / 2 + 1.6)] };
}

/** A ring of houses around a square, doors inward. */
export function homes(c: P2, r: number, n: number, a0: number, accents: string[], size: [number, number] = [6, 5]): { houses: Structure[]; doors: P2[] } {
  const houses: Structure[] = [];
  const doors: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const x = c[0] + Math.cos(a) * r;
    const z = c[1] + Math.sin(a) * r;
    const f = facing(x, z, c[0], c[1], size[1]);
    houses.push({ type: 'house', x, z, rot: f.rot, w: size[0], d: size[1], h: 3.2, accent: accents[i % accents.length] });
    doors.push(f.door);
  }
  return { houses, doors };
}
