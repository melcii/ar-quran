// Ground shape and the walking path for a surah's world. Deterministic: the
// same surah always gives the same landscape.
import * as THREE from 'three';
import { seeded } from '@/illustrations/paint';
import type { Preset } from './settings';

/** Smooth 2D value noise. */
function makeNoise(seed: number) {
  const rnd = seeded(seed);
  const perm = Array.from({ length: 512 }, () => rnd());
  const at = (i: number, j: number) => perm[((i * 73856093) ^ (j * 19349663)) & 511];
  return (x: number, y: number) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * sx;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * sx;
    return a + (b - a) * sy;
  };
}

export type Land = {
  height: (x: number, z: number) => number;
  path: THREE.CatmullRomCurve3;
  /** Distance from (x, z) to the path, roughly. */
  pathDistance: (x: number, z: number) => number;
  waterLevel: number | null;
  size: number;
};

export function makeLand(preset: Preset, seed: number, stops: number): Land {
  const n1 = makeNoise(seed);
  const n2 = makeNoise(seed + 7);
  const fbm = (x: number, z: number) => n1(x, z) * 0.6 + n2(x * 2.1, z * 2.1) * 0.3 + n1(x * 4.3 + 9, z * 4.3) * 0.1;
  const rnd = seeded(seed + 3);
  const length = Math.min(150, 34 + stops * 9);
  const pts: THREE.Vector3[] = [];
  const steps = Math.max(5, Math.round(length / 12));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 1.6 + rnd() * 0.6) * (6 + rnd() * 5) * (i ? 1 : 0), 0, -t * length));
  }
  const path = new THREE.CatmullRomCurve3(pts);
  const samples = path.getSpacedPoints(160);
  const pathDistance = (x: number, z: number) => {
    let d = Infinity;
    for (const p of samples) d = Math.min(d, (p.x - x) ** 2 + (p.z - z) ** 2);
    return Math.sqrt(d);
  };

  const t = preset.terrain;
  const raw = (x: number, z: number) => {
    const u = x / 40;
    const v = z / 40;
    switch (t) {
      case 'dunes':
        return (Math.sin(x * 0.09 + n1(u, v) * 3) * 0.5 + 0.5) * 4.5 + fbm(u, v) * 5 - 2;
      case 'hills':
        return fbm(u * 0.8, v * 0.8) * 9 - 3;
      case 'mountains': {
        const far = Math.max(0, Math.hypot(x, z + length / 2) - 45);
        return fbm(u, v) * 6 + Math.pow(far / 30, 1.6) * 22 * (0.5 + n2(u * 1.5, v * 1.5));
      }
      case 'valley':
        return Math.pow(Math.abs(x) / 22, 2) * 9 + fbm(u, v) * 4 - 1;
      case 'shore':
        // Land to the west, sea to the east.
        return fbm(u, v) * 3 + 1.2 - Math.max(0, x - 14) * 0.18;
      default:
        return fbm(u * 0.5, v * 0.5) * 2.4 - 0.6;
    }
  };
  // The path and its edges are smoothed so walking feels level.
  const height = (x: number, z: number) => {
    const h = raw(x, z);
    const d = pathDistance(x, z);
    const k = THREE.MathUtils.smoothstep(d, 2.5, 9);
    const along = raw(x, z) * 0.35 + 0.4;
    return along + (h - along) * k;
  };
  const waterLevel = preset.water === 'sea' ? 0 : preset.water === 'rivers' ? -0.6 : null;
  return { height, path, pathDistance, waterLevel, size: 260 };
}
