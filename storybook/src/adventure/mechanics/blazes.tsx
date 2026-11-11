// Surah At-Tur (The Mount): climbing by the blazes. The surah opens "By the
// Mount" (52:1). A mountain rises over the valley, and the way up has
// branches. The right way is marked by painted blazes, white over red, on
// rocks beside the trail; a branch with no blazes ends at a drop with no way
// through. Climb from lookout to lookout by following the blazes. At each
// lookout a question of the surah waits (52:35-36, "Or were they created by
// nothing?"), to think about while you look out over the land. The trail and
// its blazes are a game idea; no prophet is shown.
import { useMemo } from 'react';
import { M } from '../kit';
import { Halo } from '../props';
import type { BlazesTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { at: number };
const fresh = (): Live => ({ at: -1 });

const doneOf = (task: BlazesTask, s: MechSave) => (s.done.includes(task.id) ? task.lookouts.map((_, i) => i) : s.prog[task.id] ?? []);
const nextOf = (task: BlazesTask, d: number[]) => task.lookouts.findIndex((_, i) => !d.includes(i));

export const Blazes: Mechanic<BlazesTask> = {
  total: (task) => task.lookouts.length,
  frame(task, env) {
    const d = doneOf(task, env.save);
    const n = nextOf(task, d);
    if (n < 0) return;
    const L = live<Live>(env.game, task.id, fresh);
    const lk = task.lookouts[n];
    if (Math.hypot(env.pp.x - lk.at[0], env.pp.z - lk.at[1]) < lk.r) {
      env.api.progress(task.id, n);
      env.api.open({ kind: 'reading', reading: lk.reading });
      return;
    }
    // A branch with no blazes: it ends at a drop.
    const e = task.ends.findIndex((x) => Math.hypot(env.pp.x - x.at[0], env.pp.z - x.at[1]) < x.r);
    if (e >= 0 && L.at !== e) {
      L.at = e;
      env.api.note(`${task.id}/x`, e);
      env.api.hint('No blazes here, and no way through: the path ends at a drop. Go back to the last painted blaze and take the other way.');
    } else if (e < 0) L.at = -1;
    return `Lookouts reached: ${d.length} of ${task.lookouts.length} · next: ${lk.label}. Follow the white-over-red blazes.`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const n = nextOf(task, d);
    if (n >= 0) api.progress(task.id, n);
  },
  View: BlazesView,
};

function BlazesView({ task, t, data, active }: Parameters<NonNullable<Mechanic<BlazesTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const n = nextOf(task, d);
  const [white, red] = useMemo(() => [M('#f4f0e6'), M('#c0402e')], []);
  return (
    <group>
      {task.blazes.map((b, i) => {
        const [x, z] = b.at;
        const y = t.floorY(x, z);
        return (
          <group key={i} position={[x, y, z]} rotation-y={b.rot}>
            <mesh material={M('#9a9488', { map: 'stone' })} position-y={0.35} castShadow>
              <boxGeometry args={[0.7, 0.7, 0.5]} />
            </mesh>
            <mesh material={white} position={[0, 0.5, 0.26]}>
              <planeGeometry args={[0.36, 0.12]} />
            </mesh>
            <mesh material={red} position={[0, 0.37, 0.26]}>
              <planeGeometry args={[0.36, 0.12]} />
            </mesh>
            <mesh material={white} position={[0, 0.5, -0.26]} rotation-y={Math.PI}>
              <planeGeometry args={[0.36, 0.12]} />
            </mesh>
            <mesh material={red} position={[0, 0.37, -0.26]} rotation-y={Math.PI}>
              <planeGeometry args={[0.36, 0.12]} />
            </mesh>
          </group>
        );
      })}
      {task.ends.map((e, i) => {
        const [x, z] = e.at;
        const y = t.floorY(x, z);
        return (
          <group key={`e${i}`} position={[x, y, z]}>
            {[-1, 1].map((s) => (
              <mesh key={s} material={M('#7a5232')} position-y={0.5} rotation-z={s * 0.7}>
                <boxGeometry args={[0.1, 1.2, 0.1]} />
              </mesh>
            ))}
          </group>
        );
      })}
      {task.lookouts.map((lk, i) => {
        const [x, z] = lk.at;
        const y = t.floorY(x, z);
        const reached = d.includes(i);
        return (
          <group key={`l${i}`} position={[x, y, z]}>
            {[0, 1, 2, 3].map((k) => (
              <mesh key={k} material={M('#a8a090', { map: 'stone' })} position-y={0.18 + k * 0.3} scale={1 - k * 0.18} castShadow>
                <dodecahedronGeometry args={[0.38]} />
              </mesh>
            ))}
            {reached && (
              <mesh position-y={1.4}>
                <sphereGeometry args={[0.1, 8, 6]} />
                <meshBasicMaterial color="#ffe8a0" toneMapped={false} />
              </mesh>
            )}
            {i === n && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}

