// The Ark valley: one hand-shaped landscape for the Nuh's Ark slice.
// Everything here is plain math so the player, the animals, the plants and the
// tests all agree on where the ground, the river, the path and the ark are.
import * as THREE from 'three';

/* ---------------------------- noise ---------------------------- */

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}
/** Value noise in 0..1. */
export function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}
export function fbm(x: number, y: number, oct = 4) {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    v += amp * noise(x * f, y * f);
    f *= 2.03;
    amp *= 0.5;
  }
  return v / (1 - Math.pow(0.5, oct));
}
/** A small seeded random generator (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------- layout ---------------------------- */

export const WORLD_R = 78; // walkable radius
export const START = new THREE.Vector3(2, 0, 58);

/** The ark lies along x. Local floor of the hold is FLOOR above the ground it rests on. */
export const ARK = { x: 0, z: -20, len: 30, wid: 9.5, ground: 1.2, floor: 1.4, hold: 6.2, door: 1.7 };
export const ARK_FLOOR_Y = ARK.ground + ARK.floor;
/** Front (door) face of the hull, facing +z, and the ramp down to the meadow. */
export const RAMP = { x: 0, z0: ARK.z + ARK.wid / 2, z1: ARK.z + ARK.wid / 2 + 7.5, half: 1.6 };

/** The boarding area: one pad per pair, in an arc in front of the ramp. */
export const PADS: { kind: BeastKind; x: number; z: number }[] = [
  { kind: 'giraffe', x: -11, z: -6.5 },
  { kind: 'elephant', x: -6.5, z: -1.5 },
  { kind: 'camel', x: 6.5, z: -1.5 },
  { kind: 'sheep', x: 11, z: -6.5 },
  { kind: 'horse', x: 0, z: 2.5 },
];
export type BeastKind = 'giraffe' | 'elephant' | 'camel' | 'sheep' | 'horse';

/** Stalls inside the hold, in ark-local coordinates (x along the ark, z across). */
export const STALLS: Record<BeastKind, { x: number; z: number }> = {
  giraffe: { x: -10.5, z: -2.1 },
  elephant: { x: -4, z: -2.1 },
  horse: { x: 3, z: -2.1 },
  camel: { x: 9.5, z: -2.1 },
  sheep: { x: 9.5, z: 2.3 },
};
/** The store at the bow end of the hold (ark-local), where supplies are put away. */
export const STORE = { x: -10.5, z: 2.4 };

/** The river curves across the north of the valley. */
export function riverZ(x: number) {
  return -48 + 9 * Math.sin(x / 21) + 4 * Math.sin(x / 9 + 1.3);
}
export const RIVER_HALF = 5;
export const RIVER_Y = -1.1;

/** The dirt path winds from the start to the foot of the ramp. */
export function pathX(z: number) {
  return 5.5 * Math.sin(z / 11) * Math.min(1, Math.max(0, (z - 2) / 12));
}
export function pathDist(x: number, z: number) {
  if (z < RAMP.z1 - 1 || z > START.z + 6) return 99;
  return Math.abs(x - pathX(z));
}

/* ---------------------------- height ---------------------------- */

function bump(x: number, z: number, cx: number, cz: number, r: number, h: number) {
  const d = Math.hypot(x - cx, z - cz) / r;
  return d >= 1 ? 0 : h * smooth(1 - d);
}

/** The natural ground, ignoring the ark and its ramp. */
export function groundY(x: number, z: number) {
  const r = Math.hypot(x, z);
  let h = (fbm(x / 34 + 7, z / 34 + 3) - 0.5) * 7 + (fbm(x / 11, z / 11) - 0.5) * 1.1;
  // Hills rising at the rim close the valley in.
  h += Math.min(16, Math.max(0, r - 56) ** 1.3 * 0.22) + Math.max(0, r - 95) * 0.12;
  // A rise in the west for the rocks and the elephants; a long ridge in the east.
  h += bump(x, z, -46, 8, 22, 5) + bump(x, z, 42, 26, 20, 3.5) + bump(x, z, -28, 48, 18, 2.5);
  // The ark rests on a flat meadow, and the boarding area in front is level too.
  const flat = Math.max(
    smooth(Math.min(1, Math.max(0, 1 - (Math.abs(x - ARK.x) - ARK.len / 2 - 4) / 9))) * smooth(Math.min(1, Math.max(0, 1 - (Math.abs(z - ARK.z) - ARK.wid / 2 - 2) / 9))),
    smooth(Math.min(1, Math.max(0, 1 - (Math.hypot(x, z - (-2)) - 14) / 8))),
  );
  h = h * (1 - flat) + ARK.ground * flat;
  // The river channel, with soft banks.
  const dr = Math.abs(z - riverZ(x));
  const bank = smooth(Math.min(1, Math.max(0, (dr - RIVER_HALF + 1) / 7)));
  h = h * bank + (RIVER_Y - 1.6) * (1 - bank);
  // The path is pressed a little into the grass.
  const dp = pathDist(x, z);
  if (dp < 2.4) h -= 0.12 * smooth(1 - dp / 2.4);
  return h;
}

/** Ground colour: painterly patches of green, warm dry tops, the path and the river sand. */
export function groundColor(x: number, z: number, y: number, slope: number, out: THREE.Color) {
  const n1 = fbm(x / 16 + 2, z / 16 + 9);
  const n2 = noise(x / 3.2, z / 3.2);
  const lush = new THREE.Color('#5f9a3c');
  const deep = new THREE.Color('#3f7a33');
  const warm = new THREE.Color('#a9b552');
  out.copy(lush).lerp(deep, Math.max(0, 0.9 - n1 * 1.4)).lerp(warm, Math.max(0, (n1 - 0.55) * 1.8) + Math.max(0, y - 3) * 0.06);
  out.offsetHSL((n2 - 0.5) * 0.025, 0, (n2 - 0.5) * 0.06);
  // Rocky slopes go grey-green.
  if (slope > 0.35) out.lerp(new THREE.Color('#7d8a66'), Math.min(1, (slope - 0.35) * 2.2));
  // River sand and wet bank.
  const dr = Math.abs(z - riverZ(x));
  if (dr < RIVER_HALF + 4) out.lerp(new THREE.Color(y < RIVER_Y + 0.2 ? '#8a7a5a' : '#cdb98a'), smooth(Math.min(1, (RIVER_HALF + 4 - dr) / 3)));
  // The trodden path.
  const dp = pathDist(x, z);
  if (dp < 1.9) out.lerp(new THREE.Color('#c09a68').offsetHSL(0, 0, (n2 - 0.5) * 0.08), smooth(Math.min(1, (1.9 - dp) / 0.9)));
  // A trodden circle of earth where the animals board.
  const db = Math.hypot(x, z + 3);
  if (db < 9) out.lerp(new THREE.Color('#b8a070'), 0.55 * smooth(Math.min(1, (9 - db) / 4)) * (0.7 + n2 * 0.3));
  return out;
}

/* ---------------------------- walkable floor ---------------------------- */

export type Lift = { y: number };

/** Is a world point inside the hold (with a margin from the walls)? */
export function inHold(x: number, z: number, m = 0.45) {
  return Math.abs(x - ARK.x) < ARK.len / 2 - 1.6 - m && Math.abs(z - ARK.z) < ARK.wid / 2 - 0.35 - m;
}
/** Within the hull's footprint at all (walls included). */
export function inHull(x: number, z: number, m = 0.3) {
  const lx = Math.abs(x - ARK.x);
  const lz = Math.abs(z - ARK.z);
  // Rounded bow and stern.
  const end = ARK.len / 2 - 2.6;
  if (lx > end) {
    const k = (lx - end) / 2.6;
    return lx < ARK.len / 2 + m && lz < (ARK.wid / 2) * Math.sqrt(Math.max(0, 1 - k * k)) + m;
  }
  return lz < ARK.wid / 2 + m;
}
export function onRamp(x: number, z: number) {
  return Math.abs(x - RAMP.x) < RAMP.half && z >= RAMP.z0 - 0.6 && z <= RAMP.z1;
}
export function rampY(z: number, lift: number) {
  const t = Math.min(1, Math.max(0, (z - RAMP.z0) / (RAMP.z1 - RAMP.z0)));
  const top = ARK_FLOOR_Y + lift;
  const bottom = groundY(RAMP.x, RAMP.z1);
  return top + (bottom - top) * t;
}

/** Height of whatever you stand on: the hold floor, the ramp, or the grass. */
export function floorY(x: number, z: number, lift: number, rampDown: boolean) {
  if (inHull(x, z, 0)) return ARK_FLOOR_Y + lift;
  if (rampDown && onRamp(x, z)) return Math.max(rampY(z, lift), groundY(x, z));
  return groundY(x, z);
}

/** Round obstacles on the land (tree trunks, rocks), filled in by the scenery. */
export const obstacles: { x: number; z: number; r: number }[] = [];
/** Low walls inside the hold (ark-local boxes: x0, x1, z0, z1). */
export const HOLD_WALLS: [number, number, number, number][] = [];

/**
 * Can a walker step from a to b? Walls of the hull block except at the door
 * when the ramp is down; rocks and trunks block; the river and the rim block.
 */
export function canStep(ax: number, az: number, bx: number, bz: number, r: number, rampDown: boolean) {
  if (Math.hypot(bx, bz) > WORLD_R) return false;
  const aIn = inHull(ax, az, 0);
  const bIn = inHull(bx, bz, 0);
  const lz = bz - ARK.z;
  const atDoor = Math.abs(bx - ARK.x) < ARK.door - r * 0.6 && lz > 0;
  if (bIn) {
    // Inside: stay within the hold walls, except passing through the doorway.
    if (!inHold(bx, bz, r) && !(rampDown && atDoor && lz > ARK.wid / 2 - 1.4)) return false;
    if (!aIn && !(rampDown && atDoor)) return false;
    for (const [x0, x1, z0, z1] of HOLD_WALLS) {
      const lx = bx - ARK.x;
      if (lx > x0 - r && lx < x1 + r && lz > z0 - r && lz < z1 + r) {
        // Allow walking out of a wall you are somehow already in.
        const alx = ax - ARK.x;
        const alz = az - ARK.z;
        if (!(alx > x0 - r && alx < x1 + r && alz > z0 - r && alz < z1 + r)) return false;
      }
    }
    return true;
  }
  if (inHull(bx, bz, r) && !(rampDown && atDoor && onRamp(bx, bz))) return false;
  // The ramp has rails: get on and off at its foot, or from the doorway.
  if (rampDown && onRamp(bx, bz) !== onRamp(ax, az) && !onRamp(ax, az) && bz < RAMP.z1 - 1.2 && !aIn) return false;
  if (rampDown && onRamp(ax, az) && !onRamp(bx, bz) && !bIn && az < RAMP.z1 - 1.2) return false;
  if (Math.abs(bz - riverZ(bx)) < RIVER_HALF - 0.5) return false;
  for (const o of obstacles) if (Math.hypot(bx - o.x, bz - o.z) < o.r + r) return Math.hypot(ax - o.x, az - o.z) < o.r + r && Math.hypot(bx - o.x, bz - o.z) > Math.hypot(ax - o.x, az - o.z);
  return true;
}
