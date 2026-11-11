// Surah Al-Fath (The Opening): patience at a closed gate. The surah tells
// that Allah "sent down His tranquillity" upon the believers when others
// were full of the angry pride of ignorance (48:26), and that He held hands
// back from fighting (48:24). Here a closed gate stands across the road. It
// does not open for pushing. Wait in the circle before it, still and calm;
// while you wait, things happen that tempt you to push or shout, and each
// time you can keep calm or not. The gate opens only to calm patience. The
// gate and what happens at it are a game idea, not the events of the
// surah, which are read separately; no one is shown.
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import type { CalmTask } from '../types';
import { live, type Mechanic } from './base';

type Live = { c: number; s: number; stir: boolean; told: boolean };
const fresh = (): Live => ({ c: 0, s: 0, stir: false, told: false });

export const Calm: Mechanic<CalmTask> = {
  total: () => 1,
  uses(task, env) {
    if (env.save.done.includes(task.id)) return [];
    const L = live<Live>(env.game, task.id, fresh);
    const pos = env.v3(task.gate);
    if (L.stir) {
      const s = task.stirs[L.s];
      return [
        { key: `keep:${task.id}`, pos, label: s.calm, reach: task.r + 1, run: () => {
          L.stir = false;
          L.s++;
          env.api.hint('You stayed calm. Keep waiting.');
        } },
        { key: `push:${task.id}`, pos, label: s.push, reach: task.r + 1, run: () => {
          L.stir = false;
          L.c = Math.max(0, L.c - task.secs * 0.5);
          env.api.note(`${task.id}/x`, L.s);
          env.api.hint('Anger makes the waiting longer, and the gate stays shut. Breathe, and wait calmly again.');
        } },
      ];
    }
    return [{ key: `push:${task.id}`, pos, label: 'Push at the gate', reach: task.r + 1, run: () => {
      L.c = Math.max(0, L.c - task.secs * 0.3);
      env.api.note(`${task.id}/x`, 99);
      env.api.hint('The gate does not move for pushing. Wait in the circle, still and calm.');
    } }];
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const d = Math.hypot(env.pp.x - task.gate[0], env.pp.z - task.gate[1]);
    if (d > task.r) {
      if (L.c > 0) L.c = Math.max(0, L.c - env.dt * 0.5);
      return `Wait calmly in the circle before the gate · calm ${Math.round((L.c / task.secs) * 100)}%`;
    }
    if (!L.told) {
      L.told = true;
      env.api.hint('Stand still in the circle and wait. The gate does not open for pushing.');
    }
    if (L.stir) return `${task.stirs[L.s].text} · calm ${Math.round((L.c / task.secs) * 100)}%`;
    if (env.still) L.c = Math.min(task.secs, L.c + env.dt);
    // Things happen while you wait: one stir at each step of the waiting.
    if (L.s < task.stirs.length && L.c >= (task.secs * (L.s + 1)) / (task.stirs.length + 1)) {
      L.stir = true;
      env.api.hint(task.stirs[L.s].text);
    }
    if (L.c >= task.secs && L.s >= task.stirs.length) {
      env.api.progress(task.id, 0);
      return;
    }
    return `${env.still ? 'Waiting calmly' : 'Stand still to wait'} · calm ${Math.round((L.c / task.secs) * 100)}%`;
  },
  solve(task, api) {
    api.progress(task.id, 0);
  },
  View: CalmView,
};

function CalmView({ task, t, data, game }: Parameters<NonNullable<Mechanic<CalmTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const done = data.done.includes(task.id);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const fill = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const k = done ? 1 : L.c / task.secs;
    if (fill.current) fill.current.scale.setScalar(Math.max(0.01, k));
    if (ring.current) ring.current.opacity = 0.35 + (L.stir && !motion.reduced ? Math.abs(Math.sin(s.clock.elapsedTime * 6)) * 0.4 : 0.2);
  });
  const [x, z] = task.gate;
  const y = t.floorY(x, z);
  return (
    <group position={[x, y + 0.04, z]}>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[task.r - 0.15, task.r, 40]} />
        <meshBasicMaterial ref={ring} color="#f0e2b0" transparent opacity={0.5} toneMapped={false} />
      </mesh>
      <mesh ref={fill} rotation-x={-Math.PI / 2} position-y={0.01}>
        <circleGeometry args={[task.r - 0.2, 40]} />
        <meshBasicMaterial color="#cfe6d0" transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </group>
  );
}
