// Surah Ta-Ha's own play: the far light across the hills at night (20:10).
// A light burns far away on a mountain. The hills in between hide it from
// the hollows and show it from the heights: the 3D hills really do cover it.
// Piles of stones lie all over the hills; build a cairn only where the light
// can be seen, so the cairns make a way that keeps the light in view. From
// a hollow the light is hidden, and a cairn there is refused. Musa and his
// family are never shown, and the player never reaches the light: what
// happened at it (20:11-14) is read, not shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2, Terrain } from '../terrain';
import type { BeaconTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

/** Eye height of a child standing on the ground. */
const EYE = 1.5;

/** Can the light be seen from (x, z)? Samples the hills along the line of sight. */
export function inView(t: Terrain, task: BeaconTask, x: number, z: number) {
  const [lx, lz] = task.light;
  const y0 = t.floorY(x, z) + EYE;
  const y1 = t.y(lx, lz) + task.lightY;
  const n = 60;
  for (let i = 2; i < n - 1; i++) {
    const f = i / n;
    const ground = t.y(x + (lx - x) * f, z + (lz - z) * f);
    if (ground > y0 + (y1 - y0) * f + 0.15) return false;
  }
  return true;
}

type Live = { seen: boolean[] | null; view: boolean; at: number };
const fresh = (): Live => ({ seen: null, view: false, at: -1 });
const seenFrom = (task: BeaconTask, t: Terrain, L: Live) => (L.seen ??= task.piles.map(([x, z]) => inView(t, task, x, z)));

const built = (task: BeaconTask, s: MechSave) => s.prog[task.id] ?? [];

export const Beacon: Mechanic<BeaconTask> = {
  total: (task) => task.need,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const seen = seenFrom(task, env.t, L);
    const done = built(task, env.save);
    return task.piles.flatMap((p, i) => {
      if (done.includes(i)) return [];
      // Only the piles with the light in view are on the wayfinder's list; finding them is the play.
      const key = seen[i] ? `cairn:${task.id}:${i}` : `cairn|${task.id}|${i}`;
      return [{ key, pos: env.v3(p), label: 'Build a cairn here', reach: 2.6, run: () => {
        if (!seen[i]) {
          env.api.note(`${task.id}/x`, i);
          env.api.hint('From here the hills hide the light. A cairn here would lead the wrong way: find a place where you can see it.');
          return;
        }
        env.api.progress(task.id, i);
        const n = done.length + 1;
        if (n < task.need) env.api.hint(n === 1 ? 'A cairn, with the light in view. Find the next place where you can see it.' : `${n} cairns, each with the light in view.`);
      } }];
    });
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    if (env.game.clock - L.at > 0.25) {
      L.view = inView(env.t, task, env.pp.x, env.pp.z);
      L.at = env.game.clock;
    }
    const n = env.prog.length;
    return L.view ? `The light is in view · Cairns: ${n} of ${task.need}` : `The light is hidden behind the hills: climb higher to see it · Cairns: ${n} of ${task.need}`;
  },
  View: BeaconView,
};

function Pile({ p, t, on, active, onTap }: { p: P2; t: Terrain; on: boolean; active: boolean; onTap: () => void }) {
  const y = t.floorY(p[0], p[1]);
  const stone = M('#8a8478', { map: 'stone' });
  return (
    <group position={[p[0], y, p[1]]} {...tap(onTap)}>
      {on
        ? [0.55, 0.45, 0.36, 0.26].map((r, k) => (
            <mesh key={k} material={stone} position-y={0.3 + k * 0.42} rotation-y={k} castShadow>
              <dodecahedronGeometry args={[r, 0]} />
            </mesh>
          ))
        : [[0.5, 0, 0.3], [-0.4, 0.3, 0.25], [0.1, -0.5, 0.32], [-0.2, -0.1, 0.22]].map(([dx, dz, r], k) => (
            <mesh key={k} material={stone} position={[dx, r * 0.6, dz]} rotation-y={k * 1.3} castShadow>
              <dodecahedronGeometry args={[r, 0]} />
            </mesh>
          ))}
      {!on && <Halo on={active} />}
    </group>
  );
}

function BeaconView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<BeaconTask>['View']>>[0]) {
  const done = data.done.includes(task.id) ? null : built(task, data);
  const all = built(task, data);
  const seen = useMemo(() => task.piles.map(([x, z]) => inView(t, task, x, z)), [task, t]);
  const flame = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const f = flame.current;
    if (!f || motion.reduced) return;
    const k = 1 + Math.sin(st.clock.elapsedTime * 7) * 0.08 + Math.sin(st.clock.elapsedTime * 13) * 0.05;
    f.scale.setScalar(k);
  });
  const [lx, lz] = task.light;
  const ly = t.y(lx, lz) + task.lightY;
  return (
    <group>
      {/* The far light: no one is shown at it. It does not take the fog, so it reads across the hills. */}
      <group position={[lx, ly, lz]}>
        <mesh ref={flame}>
          <sphereGeometry args={[1.1, 16, 12]} />
          <meshBasicMaterial color="#ffd27a" fog={false} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.6, 16, 12]} />
          <meshBasicMaterial color="#ffb050" transparent opacity={0.25} fog={false} depthWrite={false} toneMapped={false} />
        </mesh>
        <pointLight intensity={40} distance={40} color="#ffc070" />
      </group>
      {task.piles.map((p, i) => (
        <Pile key={i} p={p} t={t} on={all.includes(i)} active={active && !!done} onTap={() => act(seen[i] ? `cairn:${task.id}:${i}` : `cairn|${task.id}|${i}`)} />
      ))}
    </group>
  );
}
