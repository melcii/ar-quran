// Surah Maryam's own play: a quiet world answered only by pointing. A
// question appears, and the child answers by pointing at something in the
// world (tapping it, from wherever they stand), never by choosing words. It
// recalls the vow not to speak and the pointing in 19:26-29. The palm, the
// little stream, the prayer niche and the pavilion facing the sunrise are
// quiet places; no one in the story is shown in them.
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { PointTask } from '../types';
import { type Mechanic } from './base';

export const Point: Mechanic<PointTask> = {
  total: (task) => task.asks.length,
  uses(task, env) {
    const k = env.prog.length;
    const ask = task.asks[k];
    if (!ask) return [];
    // Pointing reaches far: anything in sight can be pointed at.
    return task.things.map((th, i) => ({ key: `point|${task.id}|${i}`, pos: env.v3(th.at), label: `Point at the ${th.label}`, reach: 40, run: () => {
      if (i === ask.thing) {
        env.api.progress(task.id, k);
        env.api.say(ask.yes);
        if (ask.reading) env.api.open({ kind: 'reading', reading: ask.reading });
      } else env.api.hint(ask.no);
    } }));
  },
  frame(task, env) {
    const ask = task.asks[env.prog.length];
    return ask ? `Point to answer: ${ask.prompt}` : undefined;
  },
  View: PointView,
};

function Thing({ model }: { model: PointTask['things'][number]['model'] }) {
  const fronds = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (fronds.current && !motion.reduced) fronds.current.rotation.y = Math.sin(st.clock.elapsedTime * 0.4) * 0.08;
  });
  switch (model) {
    case 'palm':
      return (
        <group>
          <mesh material={M('#8a6a44')} position-y={2.6} rotation-z={0.06} castShadow>
            <cylinderGeometry args={[0.18, 0.28, 5.2, 8]} />
          </mesh>
          <group ref={fronds} position-y={5.2}>
            {Array.from({ length: 8 }, (_, i) => (
              <mesh key={i} material={M('#4f8a34')} rotation={[0.9, (i / 8) * Math.PI * 2, 0]} position={[Math.sin((i / 8) * Math.PI * 2) * 0.9, -0.2, Math.cos((i / 8) * Math.PI * 2) * 0.9]} scale={[0.3, 0.05, 1.6]} castShadow>
                <sphereGeometry args={[1, 8, 4]} />
              </mesh>
            ))}
            {[0, 1, 2, 3].map((i) => (
              <mesh key={`d${i}`} material={M('#a85a2a')} position={[Math.cos(i * 1.6) * 0.35, -0.5, Math.sin(i * 1.6) * 0.35]}>
                <sphereGeometry args={[0.16, 8, 6]} />
              </mesh>
            ))}
          </group>
        </group>
      );
    case 'stream':
      return (
        <group>
          <mesh rotation-x={-Math.PI / 2} position-y={0.05} renderOrder={2}>
            <planeGeometry args={[1.4, 7]} />
            <meshStandardMaterial color="#5aa0b8" roughness={0.1} transparent opacity={0.85} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} material={M('#a89a80', { map: 'stone' })} position={[s * 0.9, 0.1, 0]}>
              <boxGeometry args={[0.35, 0.2, 7]} />
            </mesh>
          ))}
        </group>
      );
    case 'niche':
      return (
        <group>
          <mesh material={M('#e8dcc4', { map: 'stone' })} position={[0, 1.6, -0.3]} castShadow>
            <boxGeometry args={[3, 3.2, 0.6]} />
          </mesh>
          <mesh material={M('#b8a888')} position={[0, 1.3, 0.02]}>
            <boxGeometry args={[1.1, 2, 0.1]} />
          </mesh>
          <mesh material={M('#b8a888')} position={[0, 2.3, 0.02]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.55, 0.55, 0.1, 16, 1, false, 0, Math.PI]} />
          </mesh>
          <mesh material={M('#9a3a2e', { rough: 1 })} position={[0, 0.03, 1]}>
            <boxGeometry args={[1, 0.04, 1.6]} />
          </mesh>
        </group>
      );
    case 'pavilion':
      return (
        <group>
          {[-1, 1].map((x) =>
            [-1, 1].map((z) => (
              <mesh key={`${x}${z}`} material={M('#e8dcc4', { map: 'stone' })} position={[x * 1.3, 1.3, z * 1.3]} castShadow>
                <cylinderGeometry args={[0.15, 0.18, 2.6, 10]} />
              </mesh>
            )),
          )}
          <mesh material={M('#c8a46a')} position-y={2.75} castShadow>
            <boxGeometry args={[3.2, 0.3, 3.2]} />
          </mesh>
          <mesh material={M('#c8a46a')} position-y={3.3}>
            <coneGeometry args={[2.2, 0.9, 4]} />
          </mesh>
        </group>
      );
  }
}

function PointView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<PointTask>['View']>>[0]) {
  const k = data.done.includes(task.id) ? task.asks.length : (data.prog[task.id] ?? []).length;
  const asking = k < task.asks.length;
  return (
    <group>
      {task.things.map((th, i) => (
        <group key={i} position={[th.at[0], t.floorY(th.at[0], th.at[1]), th.at[1]]} {...tap(() => act(`point|${task.id}|${i}`))}>
          <Thing model={th.model} />
          {asking && <Halo on={active} />}
        </group>
      ))}
    </group>
  );
}
