// A world's ground, worked out once from its recipe: the height and painted
// colour everywhere, paths pressed into the grass, levelled plazas, water,
// raised walkways (bridges, docks, terraces) and what blocks a walker.
import * as THREE from 'three';
import { fbm, noise, rng } from '@/ark/land';

export { fbm, noise, rng };

export type P2 = [number, number];

/** A raised surface you can walk on: a bridge, a dock, a terrace, a floor. */
export type Floor = { x0: number; x1: number; z0: number; z1: number; y: number | ((x: number, z: number) => number); rot?: number; cx?: number; cz?: number };
/** A box that blocks walking (a wall, a house), optionally only while active() is true. */
export type Block = { x: number; z: number; hx: number; hz: number; rot?: number; active?: () => boolean };
export type Obstacle = { x: number; z: number; r: number };

export type Palette = {
  lush: string;
  deep: string;
  warm: string;
  path: string;
  sand: string;
  rock: string;
};

export type Ground = {
  /** Base height before paths, plazas and water carving. */
  base: (x: number, z: number) => number;
  palette: Palette;
  /** Paths as polylines; they are pressed in and painted. */
  paths?: P2[][];
  pathWidth?: number;
  /** Levelled areas for buildings and plazas. */
  flats?: { x: number; z: number; r: number; y?: number; paint?: string }[];
  /** Still water (sea, lake, pools, streams carved by base) at this height. */
  water?: number;
  /** Optional colour for land just above the water line (beaches). */
  shore?: string;
  /** Override the painted colour (deserts, snow, flowers fields). */
  tint?: (x: number, z: number, y: number, c: THREE.Color) => void;
  radius: number;
};

export type Terrain = {
  y: (x: number, z: number) => number;
  color: (x: number, z: number, y: number, slope: number, out: THREE.Color) => THREE.Color;
  pathDist: (x: number, z: number) => number;
  isWater: (x: number, z: number) => boolean;
  water: number | null;
  radius: number;
  obstacles: Obstacle[];
  blocks: Block[];
  floors: Floor[];
  shade: { x: number; z: number; r: number; k: number }[];
  /** Places kept free of trees and rocks (buildings, activity spots). */
  keepClear: { x: number; z: number; r: number }[];
  clear: (x: number, z: number, room: number) => boolean;
  floorY: (x: number, z: number) => number;
  canStep: (ax: number, az: number, bx: number, bz: number, r: number) => boolean;
};

function smooth(t: number) {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
}

function segDist(px: number, pz: number, a: P2, b: P2) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz || 1;
  const t = Math.min(1, Math.max(0, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
  return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t);
}

/** A smooth path through points (Catmull-Rom), sampled into a polyline. */
export function curve(pts: P2[], step = 2): P2[] {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const n = Math.max(4, Math.round(c.getLength() / step));
  return c.getSpacedPoints(n).map((v) => [v.x, v.z]);
}

function inBox(x: number, z: number, b: { x: number; z: number; hx: number; hz: number; rot?: number }, m = 0) {
  let lx = x - b.x;
  let lz = z - b.z;
  if (b.rot) {
    const c = Math.cos(-b.rot);
    const s = Math.sin(-b.rot);
    [lx, lz] = [lx * c - lz * s, lx * s + lz * c];
  }
  return Math.abs(lx) < b.hx + m && Math.abs(lz) < b.hz + m;
}

function inFloor(x: number, z: number, f: Floor) {
  let lx = x;
  let lz = z;
  if (f.rot) {
    const cx = f.cx ?? (f.x0 + f.x1) / 2;
    const cz = f.cz ?? (f.z0 + f.z1) / 2;
    const c = Math.cos(-f.rot);
    const s = Math.sin(-f.rot);
    const dx = x - cx;
    const dz = z - cz;
    lx = cx + dx * c - dz * s;
    lz = cz + dx * s + dz * c;
  }
  return lx >= f.x0 && lx <= f.x1 && lz >= f.z0 && lz <= f.z1;
}

export function makeTerrain(g: Ground): Terrain {
  const paths = (g.paths ?? []).map((p) => p);
  const pw = g.pathWidth ?? 1.9;
  const flats = g.flats ?? [];
  const pal = {
    lush: new THREE.Color(g.palette.lush),
    deep: new THREE.Color(g.palette.deep),
    warm: new THREE.Color(g.palette.warm),
    path: new THREE.Color(g.palette.path),
    sand: new THREE.Color(g.palette.sand),
    rock: new THREE.Color(g.palette.rock),
  };
  const shore = g.shore ? new THREE.Color(g.shore) : pal.sand;
  const pathDist = (x: number, z: number) => {
    let d = 99;
    for (const p of paths) for (let i = 0; i < p.length - 1; i++) d = Math.min(d, segDist(x, z, p[i], p[i + 1]));
    return d;
  };
  const y = (x: number, z: number) => {
    let h = g.base(x, z);
    for (const f of flats) {
      const d = Math.hypot(x - f.x, z - f.z);
      const k = smooth((f.r + 5 - d) / 5);
      if (k > 0) h = h * (1 - k) + (f.y ?? g.base(f.x, f.z)) * k;
    }
    const dp = pathDist(x, z);
    if (dp < pw + 0.6) h -= 0.1 * smooth(1 - dp / (pw + 0.6));
    return h;
  };
  const isWater = (x: number, z: number) => g.water != null && y(x, z) < g.water - 0.25;
  const t: Terrain = {
    y,
    pathDist,
    water: g.water ?? null,
    radius: g.radius,
    isWater,
    obstacles: [],
    blocks: [],
    floors: [],
    shade: [],
    keepClear: [],
    color: (x, z, hy, slope, out) => {
      const n1 = fbm(x / 16 + 2, z / 16 + 9);
      const n2 = noise(x / 3.2, z / 3.2);
      out.copy(pal.lush).lerp(pal.deep, Math.max(0, 0.9 - n1 * 1.4)).lerp(pal.warm, Math.max(0, (n1 - 0.55) * 1.8));
      out.offsetHSL((n2 - 0.5) * 0.025, 0, (n2 - 0.5) * 0.06);
      if (slope > 0.35) out.lerp(pal.rock, Math.min(1, (slope - 0.35) * 2.2));
      if (g.water != null && hy < g.water + 1.2) out.lerp(hy < g.water - 0.1 ? pal.sand.clone().multiplyScalar(0.7) : shore, smooth((g.water + 1.2 - hy) / 1.0));
      g.tint?.(x, z, hy, out);
      const dp = pathDist(x, z);
      if (dp < pw) out.lerp(pal.path.clone().offsetHSL(0, 0, (n2 - 0.5) * 0.08), smooth((pw - dp) / 0.9));
      for (const f of flats)
        if (f.paint) {
          const d = Math.hypot(x - f.x, z - f.z);
          if (d < f.r) out.lerp(new THREE.Color(f.paint).offsetHSL(0, 0, (n2 - 0.5) * 0.06), 0.85 * smooth((f.r - d) / 2));
        }
      return out;
    },
    clear: (x, z, room) => {
      if (Math.hypot(x, z) > g.radius + 30) return true;
      if (pathDist(x, z) < pw + 0.8 + room * 0.4) return false;
      if (isWater(x, z) || (g.water != null && y(x, z) < g.water + 0.3)) return false;
      for (const f of flats) if (Math.hypot(x - f.x, z - f.z) < f.r + room) return false;
      for (const k of t.keepClear) if (Math.hypot(x - k.x, z - k.z) < k.r + room) return false;
      for (const b of t.blocks) if (inBox(x, z, b, 1.5 + room)) return false;
      return true;
    },
    floorY: (x, z) => {
      let h = y(x, z);
      for (const f of t.floors) if (inFloor(x, z, f)) h = Math.max(h, typeof f.y === 'number' ? f.y : f.y(x, z));
      return h;
    },
    canStep: (ax, az, bx, bz, r) => {
      if (Math.hypot(bx, bz) > g.radius) return false;
      const onFloor = t.floors.some((f) => inFloor(bx, bz, f));
      if (!onFloor && isWater(bx, bz)) return false;
      // Steep climbs are walls.
      if (!onFloor && y(bx, bz) - y(ax, az) > 0.9 * Math.hypot(bx - ax, bz - az) + 0.25) return false;
      for (const b of t.blocks) if ((!b.active || b.active()) && inBox(bx, bz, b, r) && !inBox(ax, az, b, r)) return false;
      for (const o of t.obstacles) {
        const db = Math.hypot(bx - o.x, bz - o.z);
        if (db < o.r + r) return Math.hypot(ax - o.x, az - o.z) < o.r + r && db > Math.hypot(ax - o.x, az - o.z);
      }
      return true;
    },
  };
  return t;
}
