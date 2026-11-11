// Surah An-Naba: the mountains as pegs (78:6-7, "Have We not made the
// earth a resting place, and the mountains as pegs?"; 78:9-11, "and made
// your sleep a rest, and made the night a covering, and made the day for
// livelihood"). On a wide, windy plain below the mountains, a tent flaps
// loose with its ropes out. Walk round it and drive the pegs. A tent stands
// firm only when each rope is pulled against the one opposite: drive a peg,
// then the one straight across from it, before starting another pair. Out
// of turn, the tent is pulled over to one side and the peg pulls out. When
// every peg holds, the wind cannot move it, and you can rest inside as the
// night covers the plain. The plain and the tent are a game.
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { PegsTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: PegsTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.n + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
export const pegAt = (task: PegsTask, i: number): [number, number] => {
  const a = (i / task.n) * Math.PI * 2;
  return [task.at[0] + Math.cos(a) * task.r, task.at[1] + Math.sin(a) * task.r];
};
/** The peg that must come next, if one does: the one opposite a peg whose pair is not yet driven. */
export const owed = (task: PegsTask, d: number[]) => {
  const half = task.n / 2;
  const lone = d.filter((i) => i < task.n && !d.includes((i + half) % task.n));
  return lone.length ? (lone[lone.length - 1] + half) % task.n : -1;
};

export const Pegs: Mechanic<PegsTask> = {
  total: (task) => task.n + 1,
  uses(task, env) {
    const d = doneOf(task, env.save);
    const pegs = d.filter((i) => i < task.n).length;
    if (pegs >= task.n) {
      if (d.includes(task.n)) return [];
      return [{ key: `rest:${task.id}`, pos: env.v3(task.at), label: 'Rest in the tent', reach: 2.6, run: () => {
        env.api.progress(task.id, task.n);
        env.api.open({ kind: 'reading', reading: task.rest });
      } }];
    }
    return Array.from({ length: task.n }, (_, i) => i)
      .filter((i) => !d.includes(i))
      .map((i) => ({ key: `peg:${task.id}:${i}`, pos: env.v3(pegAt(task, i)), label: 'Drive in the peg', reach: 1.8, run: () => {
        const need = owed(task, d);
        if (need >= 0 && need !== i) {
          env.api.note(`${task.id}/x`, i);
          env.api.hint('The tent is pulled over to one side and the peg slips out. Drive the peg straight across from the last one first, so each rope pulls against its pair.');
          return;
        }
        env.api.progress(task.id, i);
        if (need === i) env.api.hint('The pair of ropes pull against each other, and that side of the tent stands firm.');
      } }));
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const pegs = d.filter((i) => i < task.n).length;
    if (d.length >= task.n + 1) return;
    if (pegs >= task.n) return 'Every peg holds. The wind cannot move the tent: rest inside.';
    return `Pegs holding: ${pegs} of ${task.n}${owed(task, d) >= 0 ? ' · now the one straight across' : ''}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const need = owed(task, d);
    const i = need >= 0 ? need : Array.from({ length: task.n + 1 }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: PegsView,
};

function PegsView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<PegsTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const pegs = d.filter((i) => i < task.n).length;
  const firm = pegs >= task.n;
  const [x, z] = task.at;
  const y = t.floorY(x, z);
  const tent = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!tent.current) return;
    // Loose, the tent sways and flaps in the wind; held by every peg, it stands still.
    const k = (1 - pegs / task.n) * (motion.reduced ? 0.3 : 1);
    tent.current.rotation.z = Math.sin(clock.elapsedTime * 2.3) * 0.12 * k;
    tent.current.rotation.x = Math.sin(clock.elapsedTime * 1.7 + 1) * 0.08 * k;
  });
  return (
    <group>
      <group ref={tent} position={[x, y, z]} {...(firm && !d.includes(task.n) ? tap(() => act(`rest:${task.id}`)) : {})}>
        <mesh material={M('#8a5a3a', { side: 2 })} position-y={1.2} castShadow>
          <coneGeometry args={[2, 2.4, task.n, 1, true]} />
        </mesh>
        <mesh material={M('#6a4a2a')} position-y={1.4}>
          <cylinderGeometry args={[0.05, 0.05, 2.8, 6]} />
        </mesh>
        {firm && !d.includes(task.n) && <Halo on={active} />}
      </group>
      {Array.from({ length: task.n }, (_, i) => {
        const [px, pz] = pegAt(task, i);
        const held = d.includes(i);
        const py = t.floorY(px, pz);
        // The rope from the top of the tent down to its peg.
        const dx = px - x, dz = pz - z, dy = py - (y + 2.2);
        const len = Math.hypot(dx, dy, dz);
        return (
          <group key={i}>
            <group position={[px, py, pz]} {...(!held && !firm ? tap(() => act(`peg:${task.id}:${i}`)) : {})}>
              <mesh material={M('#c8b090')} position-y={held ? 0.12 : 0.05} rotation-z={held ? 0 : Math.PI / 2}>
                <cylinderGeometry args={[0.04, 0.02, held ? 0.25 : 0.45, 6]} />
              </mesh>
              {!held && !firm && <Halo on={active} />}
            </group>
            {held && (
              <group position={[(px + x) / 2, (py + y + 2.2) / 2, (pz + z) / 2]} rotation-y={Math.atan2(dx, dz)}>
                <mesh material={M('#e8dcc0')} rotation-x={Math.atan2(Math.hypot(dx, dz), dy)}>
                  <cylinderGeometry args={[0.012, 0.012, len, 4]} />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}
