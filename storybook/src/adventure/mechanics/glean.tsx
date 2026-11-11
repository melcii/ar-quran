// Surah Al-Qalam: the owners of the garden (68:17-33). They swore to pick
// their whole harvest early in the morning, quietly, so that no poor person
// would come in, and they woke to find it gone. Here it is harvest morning
// in your orchard. Do the opposite: first open the gate and ring the bell,
// so that anyone in need knows they may come in and gather. Then pick the
// fruit from the branches into your basket, and leave the fruit that has
// fallen on the ground for those who come to glean. The orchard is a game
// idea; the owners of the story and the gleaners are never shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { GleanTask } from '../types';
import type { Mechanic, MechSave } from './base';

// Progress: 0 the gate opened and the bell rung, then tree i picked as i + 1.
const all = (task: GleanTask) => task.trees.length + 1;
const doneOf = (task: GleanTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);

export const Glean: Mechanic<GleanTask> = {
  total: all,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= all(task)) return [];
    const open = d.includes(0);
    const out = open ? [] : [{ key: `gate:${task.id}`, pos: env.v3(task.gate), label: 'Open the gate and ring the bell', reach: 2.8, run: () => {
      env.api.progress(task.id, 0);
      env.api.hint('The gate swings open and the bell rings out over the lane: anyone in need may come in and gather.');
    } }];
    task.trees.forEach((tr, i) => {
      if (d.includes(i + 1)) return;
      out.push({ key: `pick:${task.id}:${i}`, pos: env.v3(tr), label: 'Pick from the branches', reach: 2.4, run: () => {
        if (!open) {
          env.api.note(`${task.id}/early`, i);
          env.api.hint('Not yet. The owners in the surah meant to pick it all before anyone in need could come. Open the gate and ring the bell first.');
          return;
        }
        env.api.progress(task.id, i + 1);
      } });
      out.push({ key: `fallen:${task.id}:${i}`, pos: env.v3([tr[0] + 1.1, tr[1] + 0.6]), label: 'Pick up the fallen fruit', reach: 1.6, run: () => {
        env.api.note(`${task.id}/x`, i);
        env.api.hint('That fruit has fallen. Leave it on the ground for those who come to glean.');
      } });
    });
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= all(task)) return;
    if (!d.includes(0)) return 'Before you pick: open the gate and ring the bell.';
    return `Trees picked: ${d.length - 1} of ${task.trees.length} · pick from the branches, leave what has fallen`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: all(task) }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: GleanView,
};

function Gate({ open }: { open: boolean }) {
  const leaf = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = leaf.current;
    if (g) g.rotation.y += ((open ? -1.4 : 0) - g.rotation.y) * Math.min(1, dt * 3);
  });
  return (
    <group>
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} material={M('#8a8070', { map: 'stone' })} position={[x, 0.9, 0]} castShadow>
          <boxGeometry args={[0.4, 1.8, 0.4]} />
        </mesh>
      ))}
      <group ref={leaf} position={[-1, 0, 0]}>
        <mesh material={M('#7a5a3a', { map: 'planks' })} position={[1, 0.75, 0]}>
          <boxGeometry args={[2, 1.3, 0.08]} />
        </mesh>
      </group>
      {/* The bell on its post. */}
      <mesh material={M('#6a4a2a')} position={[1.8, 1.1, 0.3]}>
        <cylinderGeometry args={[0.05, 0.05, 2.2, 6]} />
      </mesh>
      <mesh material={M('#c8a040', { metal: 0.7, rough: 0.3 })} position={[1.8, 2.05, 0.45]}>
        <coneGeometry args={[0.16, 0.3, 10]} />
      </mesh>
    </group>
  );
}

function GleanView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<GleanTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const open = d.includes(0);
  const fruitM = useMemo(() => M('#b8402e'), []);
  const [gx, gz] = task.gate;
  return (
    <group>
      <group position={[gx, t.floorY(gx, gz), gz]} {...(!open ? tap(() => act(`gate:${task.id}`)) : {})}>
        <Gate open={open} />
        {!open && <Halo on={active} />}
      </group>
      {task.trees.map(([x, z], i) => {
        const picked = d.includes(i + 1);
        return (
          <group key={i}>
            <group position={[x, t.floorY(x, z), z]} {...(!picked ? tap(() => act(`pick:${task.id}:${i}`)) : {})}>
              {/* Fruit on the branches, until picked. The tree itself is part of the orchard. */}
              {!picked &&
                Array.from({ length: 7 }, (_, k) => (
                  <mesh key={k} material={fruitM} position={[Math.cos(k * 0.9) * 1.1, 2.2 + (k % 3) * 0.35, Math.sin(k * 0.9) * 1.1]}>
                    <sphereGeometry args={[0.11, 8, 6]} />
                  </mesh>
                ))}
              {!picked && open && <Halo on={active} />}
            </group>
            {/* Fallen fruit on the ground: left for the gleaners. */}
            <group position={[x + 1.1, t.floorY(x + 1.1, z + 0.6), z + 0.6]} {...tap(() => act(`fallen:${task.id}:${i}`))}>
              {[0, 1, 2].map((k) => (
                <mesh key={k} material={fruitM} position={[k * 0.22 - 0.2, 0.09, (k % 2) * 0.2]}>
                  <sphereGeometry args={[0.1, 8, 6]} />
                </mesh>
              ))}
            </group>
          </group>
        );
      })}
    </group>
  );
}
