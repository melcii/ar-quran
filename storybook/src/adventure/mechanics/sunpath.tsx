// Surah Al-Kahf's own play: the sun past the cave mouth (18:17). A day-dial
// beside a cave turns the whole world's light from sunrise to evening. At
// sunrise a patch of sunlight falls on the rock to one side of the cave
// mouth; at sunset it falls on the other side. Stand in each patch and set a
// marker stone there. With both marked you can see the light passes the
// cave by and never reaches inside. The young men of the cave are not
// shown; the cave is empty and quiet, and it is not a picture of the real
// cave.
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { Look } from '../Scenery';
import type { SunPathTask } from '../types';
import { LOOKS } from '../worlds/common';
import { type Mechanic, type MechSave } from './base';

/** Steps: 0 turn to sunrise, 1 mark the morning patch, 2 turn to evening, 3 mark the evening patch. */
const step = (task: SunPathTask, s: MechSave) => (s.done.includes(task.id) ? 4 : (s.prog[task.id] ?? []).length);

const MORNING: Look = { ...LOOKS.golden, zen: '#6a8ad0', mid: '#c8b0d0', hor: '#ffcf98', sunI: 2.8, stars: 0, birds: true };
const EVENING: Look = { ...LOOKS.dusk, stars: 0.3 };

export const SunPath: Mechanic<SunPathTask> = {
  total: () => 4,
  look(task, data) {
    const n = step(task, data);
    if (n === 0 || n >= 4) return undefined;
    const sun = task.patches[n < 2 ? 0 : 1].sun;
    return { ...(n < 2 ? MORNING : EVENING), sun };
  },
  uses(task, env) {
    const n = env.prog.length;
    if (n === 0 || n === 2)
      return [{ key: `dial:${task.id}`, pos: env.v3(task.dial), label: n === 0 ? 'Turn the day-dial to sunrise' : 'Turn the day-dial to evening', reach: 3, run: () => {
        env.api.progress(task.id, n);
        env.api.hint(n === 0 ? 'The sun is rising. Look for where its light falls by the cave mouth, and stand in it.' : 'The sun is setting. Where does its light fall now?');
      } }];
    if (n === 1 || n === 3) {
      const p = task.patches[n === 1 ? 0 : 1];
      return [{ key: `mark:${task.id}`, pos: env.v3(p.at), label: `Set a marker stone in the ${p.label}`, reach: 1.8, run: () => {
        env.api.progress(task.id, n);
        if (n === 3 && task.reading) env.api.open({ kind: 'reading', reading: task.reading });
        else env.api.hint('Marked. Now back to the dial.');
      } }];
    }
    return [];
  },
  frame(task, env) {
    const n = env.prog.length;
    const inCave = Math.hypot(task.cave[0] - env.pp.x, task.cave[1] - env.pp.z) < 2.2;
    if (inCave && (n === 1 || n === 3)) env.tell(`${task.id}in`, 'Inside the cave mouth it stays in shade. The sunlight is outside, to one side.', 8);
    return ['Turn the day-dial to sunrise', 'Find the morning light by the cave and mark it', 'Turn the day-dial to evening', 'Find the evening light by the cave and mark it'][n];
  },
  View: SunPathView,
};

function SunPathView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<SunPathTask>['View']>>[0]) {
  const n = step(task, data);
  const glow = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const g = glow.current;
    if (!g) return;
    const m = g.material as THREE.MeshBasicMaterial;
    m.opacity = 0.45 + (motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 2) * 0.08);
  });
  const [cx, cz] = task.cave;
  const cy = t.floorY(cx, cz);
  const showPatch = n === 1 || n === 3;
  const patch = task.patches[n < 2 ? 0 : 1];
  const [dx, dz] = task.dial;
  return (
    <group>
      {/* The rock and the cave mouth. */}
      <group position={[cx, cy, cz]} rotation-y={task.caveYaw}>
        <mesh material={M('#9a8a76', { map: 'stone' })} position={[0, 3.2, -3]} scale={[7, 4.2, 4]} castShadow receiveShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
        <mesh material={M('#1e1812')} position={[0, 1.3, 0.62]}>
          <boxGeometry args={[2.2, 2.6, 0.1]} />
        </mesh>
      </group>
      {showPatch && (
        <group position={[patch.at[0], t.floorY(patch.at[0], patch.at[1]), patch.at[1]]} {...tap(() => act(`mark:${task.id}`))}>
          <mesh ref={glow} rotation-x={-Math.PI / 2} position-y={0.06} renderOrder={3}>
            <circleGeometry args={[1.3, 28]} />
            <meshBasicMaterial color="#fff0b0" transparent opacity={0.5} depthWrite={false} />
          </mesh>
          <Halo on={active} />
        </group>
      )}
      {task.patches.map((p, i) =>
        n > (i === 0 ? 1 : 3) ? (
          <mesh key={i} material={M('#d8c8a6', { map: 'stone' })} position={[p.at[0], t.floorY(p.at[0], p.at[1]) + 0.35, p.at[1]]} castShadow>
            <dodecahedronGeometry args={[0.4, 0]} />
          </mesh>
        ) : null,
      )}
      {/* The day-dial: a stone disc with a pointer that turns. */}
      <group position={[dx, t.floorY(dx, dz), dz]} {...tap(() => act(`dial:${task.id}`))}>
        <mesh material={M('#c8b490', { map: 'stone' })} position-y={0.5} castShadow>
          <cylinderGeometry args={[0.7, 0.8, 1, 16]} />
        </mesh>
        <mesh material={M('#b08a40', { metal: 0.5 })} position-y={1.05} rotation-y={n < 2 ? 0.8 : -0.8}>
          <boxGeometry args={[1.1, 0.06, 0.12]} />
        </mesh>
        {(n === 0 || n === 2) && <Halo on={active} />}
      </group>
    </group>
  );
}
