// Surah As-Sajdah's own play: grazing hills (32:27, "crops from which their
// livestock eat"). A small flock waits in the fold among three paddocks of
// grass. Lead the flock from paddock to paddock: where it grazes the grass
// goes down, and where it has left the grass grows back. Keep the flock fed
// through the days without letting any paddock be eaten down to bare soil.
// If one is, the flock goes back to the fold, the hills rest and the day
// starts again. The rain and the growing are only watched, never made.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Beast, type Agent } from '@/ark/Beasts';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2, Terrain } from '../terrain';
import type { PastureTask } from '../types';
import { live, type Mechanic, type MechSave, type MechUse } from './base';

type Live = { grass: number[]; snap: number[]; at: number; going: number; started: boolean; t: number; ver: number; agents: Agent<'sheep'>[] | null };
const fresh = (task: PastureTask) => (): Live => ({ grass: task.paddocks.map(() => 1), snap: task.paddocks.map(() => 1), at: -1, going: 0, started: false, t: 0, ver: 0, agents: null });

const days = (task: PastureTask, s: MechSave) => (s.done.includes(task.id) ? task.days : (s.prog[task.id] ?? []).length);
const WALK = 4;

/** Where the gate of a paddock stands: on its edge, facing the fold. */
export function gate(task: PastureTask, k: number): P2 {
  const p = task.paddocks[k];
  const dx = task.fold[0] - p.at[0];
  const dz = task.fold[1] - p.at[1];
  const l = Math.hypot(dx, dz) || 1;
  return [p.at[0] + (dx / l) * p.r, p.at[1] + (dz / l) * p.r];
}

function lead(L: Live, k: number) {
  L.at = k;
  L.going = WALK;
  L.started = true;
  L.ver++;
}

export const Pasture: Mechanic<PastureTask> = {
  total: (task) => task.days,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const out: MechUse[] = [];
    if (L.going > 0 || days(task, env.save) >= task.days) return out;
    task.paddocks.forEach((p, k) => {
      if (k === L.at) return;
      out.push({ key: `lead:${task.id}:${k}`, pos: env.v3(gate(task, k)), label: `Open the gate and lead the flock into the ${p.name}`, reach: 3, run: () => lead(L, k) });
    });
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const d = days(task, env.save);
    if (d >= task.days) return;
    if (!L.started) return `Day ${d + 1} of ${task.days}: open a paddock gate and lead the flock out of the fold`;
    const dt = env.dt;
    L.grass = L.grass.map((g, k) => (k === L.at && L.going <= 0 ? g - task.eat * dt : Math.min(1, g + task.grow * dt)));
    if (L.going > 0) L.going -= dt;
    L.t += dt;
    const here = L.grass[L.at];
    if (here <= 0) {
      env.api.note(`${task.id}/x`, d);
      env.api.hint(`The flock ate the grass in the ${task.paddocks[L.at].name} right down to the soil. The flock goes back to the fold and the hills rest; the day starts again. Lead the flock on before a paddock is bare.`);
      L.grass = [...L.snap];
      L.at = -1;
      L.started = false;
      L.t = 0;
      L.ver++;
      return;
    }
    if (L.t >= task.dayLen) {
      L.t = 0;
      L.snap = [...L.grass];
      L.ver++;
      env.api.progress(task.id, d);
      if (d + 1 < task.days) env.api.hint(`The flock is well fed: day ${d + 1} is done. Keep moving it so every paddock can grow back.`);
      return;
    }
    const name = task.paddocks[L.at].name;
    const left = Math.ceil(task.dayLen - L.t);
    if (L.going > 0) return `The flock is walking into the ${name}`;
    const warn = here < 0.3 ? ' · the grass here is getting short: lead the flock on' : '';
    return `Day ${d + 1} of ${task.days} · ${left} s to evening · flock in the ${name} · grass here ${Math.round(here * 100)}%${warn}`;
  },
  View: PastureView,
};

function Paddock({ task, k, t, L }: { task: PastureTask; k: number; t: Terrain; L: Live }) {
  const p = task.paddocks[k];
  const disc = useRef<THREE.Mesh>(null);
  const tufts = useRef<THREE.InstancedMesh>(null);
  const N = 40;
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const spots = useMemo(() => Array.from({ length: N }, (_, i) => {
    const a = i * 2.39996;
    const r = p.r * 0.92 * Math.sqrt((i + 0.5) / N);
    const x = p.at[0] + Math.cos(a) * r;
    const z = p.at[1] + Math.sin(a) * r;
    return [x, t.floorY(x, z), z] as const;
  }), [p, t]);
  const bare = useMemo(() => new THREE.Color('#b89a6a'), []);
  const lush = useMemo(() => new THREE.Color('#6a9a3a'), []);
  useFrame(() => {
    const g = Math.max(0, L.grass[k]);
    const m = disc.current?.material as THREE.MeshStandardMaterial | undefined;
    if (m) m.color.copy(bare).lerp(lush, g);
    const tf = tufts.current;
    if (tf) {
      spots.forEach(([x, y, z], i) => {
        tmp.position.set(x, y + 0.02, z);
        tmp.scale.set(1, 0.15 + g * 1.1, 1);
        tmp.rotation.y = i;
        tmp.updateMatrix();
        tf.setMatrixAt(i, tmp.matrix);
      });
      tf.instanceMatrix.needsUpdate = true;
    }
  });
  const y = t.floorY(p.at[0], p.at[1]);
  const posts = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const x = p.at[0] + Math.cos(a) * p.r;
    const z = p.at[1] + Math.sin(a) * p.r;
    return [x, t.floorY(x, z), z] as const;
  });
  return (
    <group>
      <mesh ref={disc} position={[p.at[0], y + 0.05, p.at[1]]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[p.r, 32]} />
        <meshStandardMaterial color="#6a9a3a" roughness={1} />
      </mesh>
      <instancedMesh ref={tufts} args={[undefined, undefined, N]}>
        <coneGeometry args={[0.18, 0.5, 5]} />
        <meshStandardMaterial color="#5f8f34" roughness={1} />
      </instancedMesh>
      {posts.map(([x, py, z], i) => (
        <mesh key={i} material={M('#7a5a3a')} position={[x, py + 0.5, z]}>
          <cylinderGeometry args={[0.07, 0.09, 1, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function PastureView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<PastureTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh(task));
  const [, setVer] = useState(0);
  const finished = days(task, data) >= task.days;
  if (!L.agents) {
    L.agents = Array.from({ length: task.sheep }, (_, i) => {
      const a = i * 2.4;
      const at = new THREE.Vector3(task.fold[0] + Math.cos(a) * 1.4, 0, task.fold[1] + Math.sin(a) * 1.4);
      at.y = t.floorY(at.x, at.z);
      return { id: `${task.id}-s${i}`, kind: 'sheep', mate: (i % 2) as 0 | 1, pos: at.clone(), yaw: a, speed: 0, phase: i, state: 'wander', target: null, home: at.clone(), path: [], found: true, graze: 0, timer: i, highlight: false, scale: 0.85 + (i % 3) * 0.08 };
    });
  }
  useFrame((st, dtRaw) => {
    setVer((v) => (v === L.ver ? v : L.ver));
    const dt = Math.min(0.05, dtRaw);
    const c = L.at >= 0 ? task.paddocks[L.at] : { at: task.fold, r: 2.4 };
    L.agents!.forEach((a, i) => {
      const ang = i * 2.4 + 0.3;
      const rr = c.r * (0.25 + ((i * 0.37) % 0.5));
      const tx = c.at[0] + Math.cos(ang) * rr;
      const tz = c.at[1] + Math.sin(ang) * rr;
      const dx = tx - a.pos.x;
      const dz = tz - a.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.3) {
        const sp = Math.min(2.4, d * 1.5);
        a.pos.x += (dx / d) * sp * dt;
        a.pos.z += (dz / d) * sp * dt;
        a.yaw = Math.atan2(dx, dz);
        a.speed = sp;
        a.phase += sp * dt * 3;
        a.graze += (0 - a.graze) * Math.min(1, dt * 4);
      } else {
        a.speed = 0;
        const want = motion.reduced ? 1 : 0.5 + 0.5 * Math.sin(st.clock.elapsedTime * 0.7 + i);
        a.graze += (want - a.graze) * Math.min(1, dt * 2);
      }
      a.pos.y = t.floorY(a.pos.x, a.pos.z);
    });
  });
  const [fx, fz] = task.fold;
  const fy = t.floorY(fx, fz);
  return (
    <group>
      {task.paddocks.map((_, k) => (
        <Paddock key={k} task={task} k={k} t={t} L={L} />
      ))}
      {task.paddocks.map((p, k) => {
        const [gx, gz] = gate(task, k);
        return (
          <group key={`g${k}`} position={[gx, t.floorY(gx, gz), gz]} rotation-y={-(Math.atan2(gz - p.at[1], gx - p.at[0]) + Math.PI / 2)} {...tap(() => act(`lead:${task.id}:${k}`))}>
            <mesh material={M('#8a6a42', { map: 'planks' })} position-y={0.55}>
              <boxGeometry args={[1.8, 0.9, 0.12]} />
            </mesh>
            {!finished && L.going <= 0 && k !== L.at && <Halo on={active} />}
          </group>
        );
      })}
      {/* The fold: a low stone ring. */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <mesh key={`f${i}`} material={M('#a89a80', { map: 'stone' })} position={[fx + Math.cos(a) * 2.6, fy + 0.3, fz + Math.sin(a) * 2.6]} rotation-y={-(a + Math.PI / 2)}>
            <boxGeometry args={[1.1, 0.6, 0.5]} />
          </mesh>
        );
      })}
      {L.agents!.map((a) => (
        <Beast key={a.id} agent={a} />
      ))}
    </group>
  );
}
