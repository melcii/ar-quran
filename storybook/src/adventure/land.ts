// Laying out a world's land: building footprints first, then clear spots for
// every activity, then trees and rocks around them. Shared by the game and
// the studio's world editor so both see exactly the same placement.
import { footprint } from './kit';
import { place, type Placed } from './Scenery';
import type { P2, Terrain } from './terrain';
import type { WorldDef } from './types';
import { placedEdits } from '@/studio/overlay';

export function placeLand(def: WorldDef, t: Terrain, isOn: (id?: string) => boolean): Placed {
  // Buildings first, so trees keep clear of them and of every activity spot.
  for (const s of def.structures) footprint(s, t, isOn);
  const spot = (p: P2, r: number) => t.keepClear.push({ x: p[0], z: p[1], r });
  for (const task of def.tasks) {
    if (task.kind === 'read' || task.kind === 'quiz') spot(task.at, 3);
    if (task.kind === 'points') task.points.forEach((p) => spot(p.at, 2.5));
    if (task.kind === 'carry') task.loads.forEach((L) => (spot(L.from, 2.5), spot(L.to, 1.8)));
    if (task.kind === 'lead') (spot(task.pen, 5), spot(task.herd.at, task.herd.r * 0.6));
    if (task.kind === 'pick') task.choices.forEach((c) => spot(c.at, 2.5));
  }
  for (const l of def.links ?? []) spot(l.at, 3);
  spot(def.start, 4);
  return place(t, def.veg, def.seed, placedEdits(def));
}
