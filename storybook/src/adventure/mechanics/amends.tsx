// Surah At-Tahrim: turning back sincerely (66:8, "O you who have believed,
// repent to Allah with sincere repentance"). You came running through the
// village garden in a hurry this morning, and your muddy footprints are
// still there to see. Follow them back, and wherever you spoiled something
// on the way (a trampled flower bed, a knocked-over water jar, a gate left
// swinging open, a broken fence rail), stop and put it right. Repentance is
// between a person and Allah; putting right what you spoiled for others is
// one part of turning back sincerely. The garden is a game idea; no one is
// shown.
import { useMemo } from 'react';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { AmendsTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: AmendsTask, s: MechSave) => (s.done.includes(task.id) ? task.harms.map((_, i) => i) : s.prog[task.id] ?? []);

export const Amends: Mechanic<AmendsTask> = {
  total: (task) => task.harms.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    return task.harms.flatMap((h, i) =>
      d.includes(i)
        ? []
        : [{ key: `fix:${task.id}:${i}`, pos: env.v3(h.at), label: `Put it right: ${h.what}`, reach: 2.6, run: () => {
            env.api.progress(task.id, i);
            env.api.hint(h.fix);
          } }],
    );
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.harms.length) return;
    return `Put right: ${d.length} of ${task.harms.length} · follow your muddy footprints back`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.harms.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: AmendsView,
};

/** Footprints every 0.8 m along the trail, left and right in turn. */
function steps(trail: [number, number][]) {
  const out: { x: number; z: number; a: number; s: number }[] = [];
  let side = 1;
  for (let i = 0; i < trail.length - 1; i++) {
    const [ax, az] = trail[i];
    const [bx, bz] = trail[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const a = Math.atan2(bx - ax, bz - az);
    for (let d = 0; d < L; d += 0.8) {
      const k = d / L;
      side = -side;
      out.push({ x: ax + (bx - ax) * k + Math.cos(a) * 0.14 * side, z: az + (bz - az) * k - Math.sin(a) * 0.14 * side, a, s: side });
    }
  }
  return out;
}

function Harm({ what, fixed }: { what: string; fixed: boolean }) {
  const w = what.toLowerCase();
  if (w.includes('flower'))
    return (
      <group>
        {[-0.5, 0, 0.5].map((x, i) => (
          <group key={i} position={[x, 0, (i % 2) * 0.3]} rotation-z={fixed ? 0 : 1.2 * (i % 2 ? 1 : -1)}>
            <mesh material={M('#5a8a3a')} position-y={0.2}>
              <cylinderGeometry args={[0.02, 0.02, 0.4, 5]} />
            </mesh>
            <mesh material={M(['#e88a9a', '#f4d060', '#c8a0e0'][i])} position-y={0.42}>
              <sphereGeometry args={[0.08, 8, 6]} />
            </mesh>
          </group>
        ))}
      </group>
    );
  if (w.includes('jar'))
    return (
      <mesh material={M('#b8784a')} position-y={fixed ? 0.35 : 0.22} rotation-z={fixed ? 0 : Math.PI / 2}>
        <cylinderGeometry args={[0.18, 0.24, 0.7, 10]} />
      </mesh>
    );
  if (w.includes('gate'))
    return (
      <group>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} material={M('#6a4a2a')} position={[x, 0.6, 0]}>
            <boxGeometry args={[0.12, 1.2, 0.12]} />
          </mesh>
        ))}
        <group position={[-0.74, 0, 0]} rotation-y={fixed ? 0 : -1.3}>
          <mesh material={M('#8a6a44', { map: 'planks' })} position={[0.74, 0.55, 0]}>
            <boxGeometry args={[1.4, 0.8, 0.05]} />
          </mesh>
        </group>
      </group>
    );
  // A fence rail, whole or snapped.
  return (
    <group>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} material={M('#6a4a2a')} position={[x, 0.5, 0]}>
          <boxGeometry args={[0.12, 1, 0.12]} />
        </mesh>
      ))}
      <mesh material={M('#8a6a44')} position={[0, fixed ? 0.7 : 0.1, 0]} rotation-z={fixed ? 0 : 0.3}>
        <boxGeometry args={[1.8, 0.1, 0.06]} />
      </mesh>
    </group>
  );
}

function AmendsView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<AmendsTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const prints = useMemo(() => steps(task.trail as [number, number][]), [task.trail]);
  const mud = useMemo(() => M('#5a4030'), []);
  return (
    <group>
      {d.length < task.harms.length &&
        prints.map((p, i) => (
          <mesh key={i} material={mud} position={[p.x, t.floorY(p.x, p.z) + 0.02, p.z]} rotation={[-Math.PI / 2, 0, -p.a]}>
            <circleGeometry args={[0.09, 8]} />
          </mesh>
        ))}
      {task.harms.map((h, i) => {
        const [x, z] = h.at;
        const fixed = d.includes(i);
        return (
          <group key={i} position={[x, t.floorY(x, z), z]} {...(!fixed ? tap(() => act(`fix:${task.id}:${i}`)) : {})}>
            <Harm what={h.what} fixed={fixed} />
            {!fixed && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
