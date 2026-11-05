// The adventure worlds' collision space: every solid the terrain knows about
// (trunks, rocks, walls, houses, gates, pillars, fences) plus deep water and
// the world's edge, handed to the physics engine (src/physics/space.ts).
import { Space, type R, type Solid } from '@/physics/space';
import type { Terrain } from './terrain';

export function makeSpace(R: R, t: Terrain) {
  const solids: Solid[] = [
    ...t.obstacles.map((o, i): Solid => ({ kind: 'circle', x: o.x, z: o.z, r: o.r, tag: `obstacle ${i}`, active: o.active })),
    ...t.blocks.map((b, i): Solid => ({ kind: 'box', x: b.x, z: b.z, hx: b.hx, hz: b.hz, rot: b.rot, tag: `block ${i}`, active: b.active })),
  ];
  return new Space(R, {
    solids,
    floor: t.floorY,
    extent: t.radius + 2,
    cell: 0.7,
    blocked: (x, z) => {
      if (Math.hypot(x, z) > t.radius) return 1;
      if (!t.isWater(x, z)) return 0;
      return t.covered(x, z) ? 2 : 1;
    },
    openNow: (x, z) => t.floorY(x, z) > t.y(x, z) + 0.05,
  });
}
