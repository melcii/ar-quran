// Surah Ar-Rum's own play: winds, clouds and rain on a dry land (30:48-50).
// Dry plots lie around a wind vane on parched ground. Watch the vane: the
// wind gets up, a cloud gathers on one side of the land and drifts with the
// wind. Read where it is going and sow seeds in the dry plot it will reach
// before the rain falls there. Sown and rained on, the plot comes to life.
// The player never makes the rain: the wind and the rain come by
// themselves, and the child's part is to watch, understand and sow.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2 } from '../terrain';
import type { RainTask } from '../types';
import { live, type Mechanic, type MechSave, type MechUse } from './base';

type Phase = 'idle' | 'drift' | 'rain';
type Live = { phase: Phase; t: number; rt: number; sown: number; wet: number[]; ver: number };
const fresh = (): Live => ({ phase: 'idle', t: 0, rt: 0, sown: -1, wet: [], ver: 0 });

const rounds = (task: RainTask, s: MechSave) => (s.done.includes(task.id) ? task.rounds.map((_, i) => i) : s.prog[task.id] ?? []);
const RAIN = 3;

/** The cloud's way: from upwind of the vane, over it, on past the plot. */
function course(task: RainTask, k: number) {
  const [vx, vz] = task.vane;
  const [px, pz] = task.plots[task.rounds[k].plot];
  const l = Math.hypot(px - vx, pz - vz) || 1;
  const dx = (px - vx) / l;
  const dz = (pz - vz) / l;
  const from: P2 = [vx - dx * 26, vz - dz * 26];
  return { from, to: [px, pz] as P2, dir: Math.atan2(dx, dz) };
}

const cloudAt = (task: RainTask, k: number, t: number): P2 => {
  const c = course(task, k);
  const f = Math.min(1, t / task.drift);
  return [c.from[0] + (c.to[0] - c.from[0]) * f, c.from[1] + (c.to[1] - c.from[1]) * f];
};

export const Sowing: Mechanic<RainTask> = {
  total: (task) => task.rounds.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const k = env.prog.length;
    const out: MechUse[] = [];
    if (!task.rounds[k]) return out;
    if (L.phase === 'idle')
      out.push({ key: `watch:${task.id}`, pos: env.v3(task.vane), label: 'Watch the wind vane', reach: 3, run: () => {
        L.phase = 'drift';
        L.t = 0;
        L.sown = -1;
        L.ver++;
        env.api.hint('The wind is rising. A cloud is gathering. Which way is the wind carrying it? Sow the dry plot it will reach, before it rains there.');
      } });
    if (L.phase === 'drift') {
      const green = rounds(task, env.save).map((i) => task.rounds[i].plot);
      task.plots.forEach((p, j) => {
        if (green.includes(j) || L.sown === j) return;
        out.push({ key: `sow:${task.id}:${j}`, pos: env.v3(p), label: L.sown < 0 ? 'Sow seeds in this dry plot' : 'Sow here instead', reach: 3, run: () => {
          L.sown = j;
          L.ver++;
        } });
      });
    }
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const k = env.prog.length;
    const r = task.rounds[k];
    if (!r) return;
    if (L.phase === 'drift') {
      L.t += env.dt;
      if (L.t >= task.drift) {
        L.phase = 'rain';
        L.rt = 0;
        L.ver++;
      }
      return `The wind is carrying a cloud${L.sown >= 0 ? ' · seeds sown' : ''}: sow the plot it will reach`;
    }
    if (L.phase === 'rain') {
      L.rt += env.dt;
      if (L.rt >= RAIN) {
        L.phase = 'idle';
        if (!L.wet.includes(r.plot)) L.wet.push(r.plot);
        L.ver++;
        if (L.sown === r.plot) {
          env.api.progress(task.id, k);
          env.api.open({ kind: 'reading', reading: r.reading });
        } else {
          env.api.note(`${task.id}/x`, k);
          env.api.hint(L.sown < 0 ? 'The rain fell, but no seeds were sown there. Watch the vane again and sow before the cloud arrives.' : 'The rain fell on another plot, and your seeds stayed dry. Watch which way the vane points and where the cloud is going, then try again.');
        }
        L.sown = -1;
      }
      return 'Rain is falling';
    }
    return `Round ${k + 1} of ${task.rounds.length}: watch the wind vane · Plots brought to life: ${k}`;
  },
  View: RainView,
};

function RainView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<RainTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const doneR = rounds(task, data);
  const k = doneR.length;
  const green = doneR.map((i) => task.rounds[i].plot);
  const [, setVer] = useState(0);
  const cloud = useRef<THREE.Group>(null);
  const drops = useRef<THREE.InstancedMesh>(null);
  const arrow = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const N = 60;
  const seeds = useMemo(() => Array.from({ length: N }, (_, i) => [Math.sin(i * 12.9898) * 2.6, Math.cos(i * 78.233) * 2.6, (i * 0.37) % 1] as const), []);
  useFrame((st) => {
    setVer((v) => (v === L.ver ? v : L.ver));
    const on = L.phase !== 'idle' && k < task.rounds.length;
    const c = cloud.current;
    const p = on ? cloudAt(task, k, L.t) : null;
    if (c) {
      c.visible = !!p;
      if (p) {
        const grow = Math.min(1, 0.4 + L.t / (task.drift * 0.5));
        c.position.set(p[0], t.floorY(p[0], p[1]) + 9, p[1]);
        c.scale.setScalar(grow);
      }
    }
    const a = arrow.current;
    if (a) {
      const want = on ? course(task, k).dir : 0;
      a.rotation.y += (want - a.rotation.y) * 0.05;
      if (!motion.reduced && on) a.rotation.y += Math.sin(st.clock.elapsedTime * 3) * 0.01;
    }
    const d = drops.current;
    if (d) {
      const raining = L.phase === 'rain' && p;
      seeds.forEach(([sx, sz, ph], i) => {
        const f = ((st.clock.elapsedTime * 1.4 + ph) % 1) * 8;
        tmp.position.set((p?.[0] ?? 0) + sx, (p ? t.floorY(p[0], p[1]) : 0) + 8 - f, (p?.[1] ?? 0) + sz);
        tmp.scale.setScalar(raining ? 1 : 0);
        tmp.updateMatrix();
        d.setMatrixAt(i, tmp.matrix);
      });
      d.instanceMatrix.needsUpdate = true;
    }
  });
  const [vx, vz] = task.vane;
  return (
    <group>
      <group position={[vx, t.floorY(vx, vz), vz]} {...tap(() => act(`watch:${task.id}`))}>
        <mesh material={M('#6a5a46')} position-y={1.6}>
          <cylinderGeometry args={[0.07, 0.09, 3.2, 8]} />
        </mesh>
        <group ref={arrow} position-y={3.2}>
          <mesh material={M('#b03a2e', { metal: 0.3 })} rotation-x={Math.PI / 2} position-z={0.4}>
            <coneGeometry args={[0.18, 0.5, 8]} />
          </mesh>
          <mesh material={M('#b03a2e', { metal: 0.3 })} position-z={-0.2}>
            <boxGeometry args={[0.05, 0.4, 1]} />
          </mesh>
        </group>
        {L.phase === 'idle' && k < task.rounds.length && <Halo on={active} />}
      </group>
      {task.plots.map((p, j) => {
        const y = t.floorY(p[0], p[1]);
        const grown = green.includes(j);
        const wet = L.wet.includes(j);
        return (
          <group key={j} position={[p[0], y, p[1]]} {...tap(() => act(`sow:${task.id}:${j}`))}>
            <mesh material={M(grown ? '#6a9a3a' : wet ? '#8a8a4a' : '#b08a5a')} position-y={0.05} rotation-x={-Math.PI / 2} receiveShadow>
              <circleGeometry args={[2.8, 24]} />
            </mesh>
            {(grown || L.sown === j) &&
              Array.from({ length: 12 }, (_, i) => (
                <mesh key={i} material={M(grown ? '#4f8a2a' : '#e8d8a0')} position={[Math.cos(i * 2.4) * (0.5 + (i % 4) * 0.5), grown ? 0.35 : 0.1, Math.sin(i * 2.4) * (0.5 + (i % 4) * 0.5)]}>
                  {grown ? <coneGeometry args={[0.12, 0.6, 5]} /> : <sphereGeometry args={[0.07, 6, 4]} />}
                </mesh>
              ))}
            {L.phase === 'drift' && !grown && L.sown !== j && <Halo on={active} />}
          </group>
        );
      })}
      <group ref={cloud}>
        {[[0, 0, 0, 2.2], [1.8, -0.3, 0.4, 1.6], [-1.7, -0.2, -0.3, 1.7], [0.6, 0.6, -1, 1.4], [-0.6, 0.4, 1.1, 1.4]].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[r, 14, 10]} />
            <meshStandardMaterial color={L.phase === 'rain' ? '#a8b0bc' : '#f4f6fa'} roughness={1} />
          </mesh>
        ))}
      </group>
      <instancedMesh ref={drops} args={[undefined, undefined, N]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 4]} />
        <meshBasicMaterial color="#9ac8ff" transparent opacity={0.8} />
      </instancedMesh>
    </group>
  );
}
