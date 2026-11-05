// The Ark valley's collision space for the physics engine (src/physics/space.ts):
// the hull with its doorway, the door itself while the ramp is raised, the
// ramp's rails, the low walls inside the hold, every trunk and rock, the cart,
// the river and the rim of hills.
import { Space, type R, type Solid } from '@/physics/space';
import { ARK, HOLD_WALLS, RAMP, RIVER_HALF, STALLS, WORLD_R, floorY, obstacles, riverZ, type BeastKind } from './land';
import { weather } from './shared';

/** Inner faces of the hold (ark-local), matching where the hold walls are drawn. */
const IN_X = ARK.len / 2 - 1.6;
const IN_Z = ARK.wid / 2 - 0.35;
const OUT_Z = ARK.wid / 2;
const END = ARK.len / 2 - 2.6;
const T = 0.15;
/** Half the width of a stall's gate (the gap in its fence, as drawn in Ark.tsx). */
const GATE = 1.05;

export const rampDown = () => weather.rampUp < 0.5;
export const arkFloor = (x: number, z: number) => floorY(x, z, weather.lift, rampDown());

/** A thin wall from (x0, z0) to (x1, z1). */
function seg(x0: number, z0: number, x1: number, z1: number, tag: string, active?: () => boolean): Solid {
  const len = Math.hypot(x1 - x0, z1 - z0);
  return { kind: 'box', x: (x0 + x1) / 2, z: (z0 + z1) / 2, hx: len / 2 + T * 0.5, hz: T, rot: -Math.atan2(z1 - z0, x1 - x0), tag, active };
}

export function arkSolids(cart: { x: number; z: number }, boarded: (k: BeastKind) => boolean): Solid[] {
  const ax = ARK.x;
  const az = ARK.z;
  const D = ARK.door;
  const out: Solid[] = [];
  // The hold: back wall, two end walls, and the front wall either side of the doorway.
  out.push(seg(ax - IN_X - T, az - IN_Z - T, ax + IN_X + T, az - IN_Z - T, 'hold back wall'));
  out.push(seg(ax - IN_X - T, az - IN_Z - T, ax - IN_X - T, az + IN_Z + T, 'hold bow wall'));
  out.push(seg(ax + IN_X + T, az - IN_Z - T, ax + IN_X + T, az + IN_Z + T, 'hold stern wall'));
  // The front of the hull is thick (inner face to outer planks), with the doorway through it.
  for (const sd of [-1, 1]) {
    const x0 = ax + sd * D;
    const x1 = ax + sd * (IN_X + T);
    out.push({ kind: 'box', x: (x0 + x1) / 2, z: az + (IN_Z + OUT_Z) / 2 + T / 2, hx: Math.abs(x1 - x0) / 2, hz: (OUT_Z - IN_Z) / 2 + T, tag: `hull front ${sd < 0 ? 'bow' : 'stern'} side` });
  }
  // The door itself: shut while the ramp is raised.
  out.push({ kind: 'box', x: ax, z: az + (IN_Z + OUT_Z) / 2 + T / 2, hx: D, hz: (OUT_Z - IN_Z) / 2 + T, tag: 'door (ramp raised)', active: () => !rampDown() });
  // The outside of the hull: straight sides and rounded bow and stern, as a ring of planks.
  const pts: [number, number][] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    pts.push([END + 2.6 * Math.sin((k * Math.PI) / 2), OUT_Z * Math.cos((k * Math.PI) / 2)]);
  }
  const stern = pts.map(([x, z]) => [x, z] as [number, number]);
  const ring: [number, number][] = [
    ...stern,
    ...stern
      .slice()
      .reverse()
      .map(([x, z]) => [x, -z] as [number, number]),
    ...stern.map(([x, z]) => [-x, -z] as [number, number]),
    ...stern
      .slice()
      .reverse()
      .map(([x, z]) => [-x, z] as [number, number]),
  ];
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i];
    const [x1, z1] = ring[(i + 1) % ring.length];
    if (Math.hypot(x1 - x0, z1 - z0) < 0.01) continue;
    // The front straight side is the thick wall above; skip it here so the doorway stays open.
    if (z0 > OUT_Z - 0.01 && z1 > OUT_Z - 0.01) continue;
    out.push(seg(ax + x0, az + z0, ax + x1, az + z1, `hull ${i}`));
  }
  // Rails along the ramp: on and off only at its foot or through the doorway.
  for (const sd of [-1, 1]) out.push(seg(RAMP.x + sd * (RAMP.half + T), RAMP.z0 + 0.1, RAMP.x + sd * (RAMP.half + T), RAMP.z1 - 1.2, `ramp rail ${sd < 0 ? 'left' : 'right'}`, rampDown));
  // Stall fences inside the hold. Each stall's gate stands open until its pair is aboard, then shuts.
  HOLD_WALLS.forEach(([x0, x1, z0, z1], i) => {
    const gates = (Object.keys(STALLS) as BeastKind[])
      .filter((k) => STALLS[k].x - GATE > x0 && STALLS[k].x + GATE < x1 && Math.sign(STALLS[k].z) === Math.sign(z0 + z1) && x1 - x0 > 3)
      .sort((a, b) => STALLS[a].x - STALLS[b].x);
    let from = x0;
    const piece = (a: number, b: number, tag: string, active?: () => boolean) =>
      b - a > 0.02 && out.push({ kind: 'box', x: ax + (a + b) / 2, z: az + (z0 + z1) / 2, hx: (b - a) / 2, hz: (z1 - z0) / 2, tag, active });
    for (const k of gates) {
      piece(from, STALLS[k].x - GATE, `stall fence ${i}`);
      piece(STALLS[k].x - GATE, STALLS[k].x + GATE, `${k} stall gate (shut once aboard)`, () => boarded(k));
      from = STALLS[k].x + GATE;
    }
    piece(from, x1, `stall fence ${i}`);
  });
  obstacles.forEach((o, i) => out.push({ kind: 'circle', x: o.x, z: o.z, r: o.r, tag: `tree or rock ${i}` }));
  out.push({ kind: 'box', x: cart.x, z: cart.z, hx: 1.3, hz: 0.75, rot: 0.3, tag: 'cart' });
  return out;
}

export function makeArkSpace(R: R, cart: { x: number; z: number }, boarded: (k: BeastKind) => boolean) {
  return new Space(R, {
    solids: arkSolids(cart, boarded),
    floor: arkFloor,
    extent: WORLD_R + 2,
    cell: 0.8,
    blocked: (x, z) => (Math.hypot(x, z) > WORLD_R || Math.abs(z - riverZ(x)) < RIVER_HALF - 0.5 ? 1 : 0),
  });
}
