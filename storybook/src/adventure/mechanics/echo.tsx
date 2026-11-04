// Surah Ash-Shu'ara's own play: the echo amphitheatre. Seven chapters in
// the surah each end with the same refrain: "Indeed in that is a sign, but
// most of them were not to be believers. And indeed, your Lord, He is the
// Exalted in Might, the Merciful" (26:8-9, 67-68, 103-104 ...). Seven
// standing stones ring a rock amphitheatre, one for each chapter, each with
// a small light that pulses at its own beat. Strike the chime in the middle:
// a ring of sound goes out, bounces off each stone and comes back. A stone
// farther away sends its echo back later. Slide each stone out, place by place,
// until its echo comes back exactly on its beat; then it rings in tune and
// its chapter is read. Sound here is drawn as rings; there is no music. The
// prophets and their peoples are not shown; the stones carry only names.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2 } from '../terrain';
import type { EchoTask } from '../types';
import { live, type Mechanic, type MechEnv, type MechSave } from './base';

type Live = { slot: number[]; strike: number; pending: number[]; ver: number };
const fresh = (task: EchoTask) => (): Live => ({ slot: task.stones.map((s) => s.start), strike: -1, pending: [], ver: 0 });

const tuned = (task: EchoTask, s: MechSave) => (s.done.includes(task.id) ? task.stones.map((_, i) => i) : s.prog[task.id] ?? []);

/** Where a stone stands at a slot. */
const spot = (task: EchoTask, i: number, slot: number): P2 => {
  const a = task.stones[i].angle;
  const d = task.slots[slot];
  return [task.centre[0] + Math.sin(a) * d, task.centre[1] - Math.cos(a) * d];
};
/** How long the echo from a stone takes to come back. */
const delay = (task: EchoTask, slot: number) => (2 * task.slots[slot]) / task.speed;
/** The beat a stone's light keeps: the echo time from its right place. */
const beat = (task: EchoTask, i: number) => delay(task, task.stones[i].slot);

function judge(task: EchoTask, env: MechEnv, L: Live, i: number) {
  const s = task.stones[i];
  const d = delay(task, L.slot[i]);
  const b = beat(task, i);
  if (Math.abs(d - b) < 0.01) {
    env.api.progress(task.id, i);
    env.api.open({ kind: 'reading', reading: s.reading });
    return `${s.label}: in time`;
  }
  return `${s.label}: ${d < b ? 'too soon' : 'too late'}`;
}

export const Echo: Mechanic<EchoTask> = {
  total: (task) => task.stones.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const done = tuned(task, env.save);
    const out = [];
    if (L.strike < 0)
      out.push({ key: `strike:${task.id}`, pos: env.v3(task.centre), label: 'Strike the chime and listen', reach: 2.6, run: () => {
        L.strike = env.game.clock;
        L.pending = task.stones.map((_, i) => i).filter((i) => !done.includes(i));
        L.ver++;
      } });
    for (const [i, s] of task.stones.entries()) {
      if (done.includes(i) || L.strike >= 0) continue;
      const p = env.v3(spot(task, i, L.slot[i]));
      // One action per stone: slide it out to the next place, and from the farthest back to the nearest.
      const last = L.slot[i] >= task.slots.length - 1;
      out.push({ key: `slide:${task.id}:${i}`, pos: p, label: last ? `Slide ${s.label} back to the nearest place` : `Slide ${s.label} farther away`, reach: 2.6, run: () => {
        L.slot[i] = last ? 0 : L.slot[i] + 1;
        L.ver++;
      } });
    }
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const done = tuned(task, env.save);
    if (L.strike >= 0) {
      // Game seconds since the strike (the clock runs at game speed).
      const since = env.game.clock - L.strike;
      const heard: string[] = [];
      for (const i of [...L.pending]) {
        if (since >= delay(task, L.slot[i])) {
          L.pending = L.pending.filter((x) => x !== i);
          heard.push(judge(task, env, L, i));
          L.ver++;
        }
      }
      if (heard.length) env.api.hint(heard.join(' · '));
      if (!L.pending.length) {
        L.strike = -1;
        L.ver++;
      }
      return 'Listening for the echoes…';
    }
    for (const [i, s] of task.stones.entries()) {
      if (done.includes(i)) continue;
      const [x, z] = spot(task, i, L.slot[i]);
      if (Math.hypot(x - env.pp.x, z - env.pp.z) < 3)
        return `${s.label}: its light beats every ${beat(task, i).toFixed(1)} s · its echo now takes ${delay(task, L.slot[i]).toFixed(1)} s`;
    }
    return `Stones in time: ${done.length} of ${task.stones.length}`;
  },
  View: EchoView,
};

function Stone({ task, i, L, on, active, act }: { task: EchoTask; i: number; L: Live; on: boolean; active: boolean; act: (k: string) => void }) {
  const g = useRef<THREE.Group>(null);
  const light = useRef<THREE.Mesh>(null);
  const s = task.stones[i];
  const b = beat(task, i);
  // A stone in time stays at its right place (also after a reload).
  const at = () => (on ? s.slot : L.slot[i]);
  useFrame((st, dt) => {
    const [x, z] = spot(task, i, at());
    const gg = g.current;
    if (gg) {
      gg.position.x += (x - gg.position.x) * Math.min(1, dt * 4);
      gg.position.z += (z - gg.position.z) * Math.min(1, dt * 4);
    }
    const m = light.current?.material as THREE.MeshBasicMaterial | undefined;
    if (m) {
      const ph = (st.clock.elapsedTime % b) / b;
      m.opacity = on ? 1 : motion.reduced ? 0.6 : ph < 0.15 ? 1 : 0.25;
    }
  });
  const [x0, z0] = spot(task, i, at());
  return (
    <group ref={g} position={[x0, 0, z0]} rotation-y={-s.angle} {...tap(() => act(`slide:${task.id}:${i}`))}>
      <mesh material={M(on ? '#e8d8b0' : '#a89a80', { map: 'stone' })} position-y={1.4} castShadow>
        <boxGeometry args={[1.4, 2.8, 0.5]} />
      </mesh>
      <mesh ref={light} position={[0, 3.05, 0]}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshBasicMaterial color={on ? '#ffe7a0' : '#ffd070'} transparent opacity={0.5} toneMapped={false} />
      </mesh>
      {!on && <Halo on={active} />}
    </group>
  );
}

function Rings({ task, L, game, y }: { task: EchoTask; L: Live; game: { clock: number }; y: number }) {
  const out = useRef<THREE.Mesh>(null);
  const back = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const o = out.current;
    const b = back.current;
    if (!o || !b) return;
    const on = L.strike >= 0;
    // The rings follow the same game clock the echoes are judged by.
    const r = on ? (game.clock - L.strike) * task.speed : 0;
    o.visible = on;
    o.scale.setScalar(Math.max(0.01, Math.min(r, task.slots[task.slots.length - 1] + 1)));
    task.stones.forEach((_, i) => {
      const d = task.slots[L.slot[i]];
      const [sx, sz] = spot(task, i, L.slot[i]);
      // After reaching the stone, a bright bead comes back toward the centre: the echo.
      const f = on && r > d && r < 2 * d ? (2 * d - r) / d : -1;
      tmp.position.set(task.centre[0] + (sx - task.centre[0]) * f, y + 1, task.centre[1] + (sz - task.centre[1]) * f);
      tmp.scale.setScalar(f >= 0 ? 1 : 0);
      tmp.updateMatrix();
      b.setMatrixAt(i, tmp.matrix);
    });
    b.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <mesh ref={out} position={[task.centre[0], y + 0.15, task.centre[1]]} rotation-x={-Math.PI / 2} renderOrder={3}>
        <ringGeometry args={[0.96, 1, 64]} />
        <meshBasicMaterial color="#fff2c0" transparent opacity={0.7} depthWrite={false} toneMapped={false} />
      </mesh>
      <instancedMesh ref={back} args={[undefined, undefined, task.stones.length]}>
        <sphereGeometry args={[0.25, 10, 8]} />
        <meshBasicMaterial color="#ffe08a" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function EchoView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<EchoTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh(task));
  const done = tuned(task, data);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const [cx, cz] = task.centre;
  const y = t.floorY(cx, cz);
  return (
    <group>
      {/* Tracks the stones slide along, with a mark at each place. */}
      {task.stones.map((s, i) => (
        <group key={`t${i}`}>
          {task.slots.map((_, k) => {
            const [x, z] = spot(task, i, k);
            return (
              <mesh key={k} material={M('#8a7a62')} position={[x, t.floorY(x, z) + 0.04, z]} rotation-x={-Math.PI / 2}>
                <circleGeometry args={[0.35, 12]} />
              </mesh>
            );
          })}
        </group>
      ))}
      {task.stones.map((_, i) => (
        <group key={i} position-y={y}>
          <Stone task={task} i={i} L={L} on={done.includes(i)} active={active && L.strike < 0} act={act} />
        </group>
      ))}
      <group position={[cx, y, cz]} {...tap(() => act(`strike:${task.id}`))}>
        <mesh material={M('#6a5a46')} position-y={0.6}>
          <cylinderGeometry args={[0.1, 0.12, 1.2, 8]} />
        </mesh>
        <mesh material={M('#c8a050', { metal: 0.6 })} position-y={1.35} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.35, 0.05, 8, 24]} />
        </mesh>
        {L.strike < 0 && <Halo on={active} />}
      </group>
      <Rings task={task} L={L} game={game} y={y} />
    </group>
  );
}
