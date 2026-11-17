// World health checks for the Bug Control Center: for a world as players get
// it now (built-in recipe plus the published studio overlay), run the
// content checks and the collision/movement validator on the same physics
// space the game builds. Real checks only; nothing here estimates or guesses.
import { placeLand } from '@/adventure/land';
import { makeSpace } from '@/adventure/space';
import { makeTerrain } from '@/adventure/terrain';
import type { WorldDef } from '@/adventure/types';
import { loadPhysics, physicsReady } from '@/physics/space';
import { validateSpace, type Report } from '@/physics/validate';
import { quranIndex } from './facts';
import { applyOverlay, validateOverlay, type Overlay, type Problem } from './overlay';

export type Health = {
  n: number;
  content: Problem[];
  collision: Report;
  /** The player start was blocked; this is the nearest open spot the game itself would use. */
  openStart: [number, number] | null;
  summary: string;
  ok: boolean;
  ms: number;
};

export async function checkWorld(n: number, base: WorldDef, doc: Overlay | null): Promise<Health> {
  const t0 = performance.now();
  if (!physicsReady()) await loadPhysics();
  const def = applyOverlay(base, doc).def;
  const content = doc ? validateOverlay(base, doc, quranIndex) : [];
  const t = makeTerrain(def.ground);
  placeLand(def, t, () => false);
  const space = makeSpace(physicsReady()!, t);
  const zones = def.tasks.flatMap((tk: any) => [
    ...(tk.at && Array.isArray(tk.at) ? [{ key: tk.id, x: tk.at[0], z: tk.at[1], reach: 3 }] : []),
    ...((tk.points ?? []) as any[]).map((p, i) => ({ key: `${tk.id}#${i}`, x: p.at[0], z: p.at[1], reach: 2.5 })),
  ]);
  const collision = validateSpace(space, { spawn: def.start as [number, number], radius: t.radius, paths: (def.ground.paths ?? []) as [number, number][][], zones });
  const open = collision.spawn.ok ? null : (space.findOpen(def.start[0], def.start[1], 0.35, 12) as [number, number] | null);
  const errors = content.filter((p) => p.level === 'error');
  const r = collision;
  const summary = `content ${errors.length ? `${errors.length} error(s)` : 'ok'}; spawn ${r.spawn.ok ? 'ok' : 'blocked'}; solids entered ${r.solids.entered.length}/${r.solids.tested}; climbable cliffs ${r.slopes.climbs.length}; edge escapes ${r.edge.escaped.length}; paths stuck ${r.paths.stuck.length}/${r.paths.tested}; unreachable spots ${r.zones.unreachable.length}/${r.zones.tested}`;
  return { n, content, collision, openStart: open ? [+open[0].toFixed(2), +open[1].toFixed(2)] : null, summary, ok: !errors.length && r.ok, ms: Math.round(performance.now() - t0) };
}
