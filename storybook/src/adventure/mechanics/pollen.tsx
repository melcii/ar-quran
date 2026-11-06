// Surah An-Nahl's own play: the meadow at flower height. The flowers stand
// taller than the explorer, and bees fly between them and a hive in a hollow
// tree (16:68, "among the trees"). Gather pollen from one flower and brush
// it onto another flower of the same kind; a flower of a different kind will
// not set fruit. Each pollinated flower swells into fruit and the bees visit
// it; when enough are done the comb in the hive fills with honey of
// different colours (16:69). The ayahs speak of the bee's homes, its eating
// from all the fruits and the drink of varying colours; that bees carry
// pollen between flowers is what people have learned by watching them. The
// child carrying pollen is a game idea.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { motion, player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import { rng } from '../terrain';
import type { PollenTask } from '../types';
import { live, type Mechanic } from './base';

type Live = { carry: number | null };

export const Pollen: Mechanic<PollenTask> = {
  total: (task) => task.n,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, () => ({ carry: null }));
    const set = env.save.prog[`${task.id}/f`] ?? [];
    const out = [];
    for (const [i, f] of task.flowers.entries()) {
      const kind = task.kinds[f.kind];
      if (L.carry == null) {
        out.push({ key: `gather:${task.id}:${i}`, pos: env.v3(f.at), label: `Gather pollen from the ${kind.label}`, reach: 2.8, run: () => {
          L.carry = i;
          env.api.hint(`You carry ${kind.label} pollen. Find another ${kind.label} and brush it on.`);
        } });
        continue;
      }
      if (L.carry === i) continue;
      const from = task.kinds[task.flowers[L.carry].kind];
      const match = f.kind === task.flowers[L.carry].kind && !set.includes(i);
      out.push({ key: match ? `brush:${task.id}:${i}` : `pmix|${task.id}|${i}`, pos: env.v3(f.at), label: `Brush the pollen onto the ${kind.label}`, reach: 2.8, run: () => {
        if (set.includes(i)) {
          env.api.hint(`This ${kind.label} has already been pollinated: see the fruit swelling. Find another one.`);
          return;
        }
        if (f.kind !== task.flowers[L.carry!].kind) {
          L.carry = i;
          env.api.hint(`That was ${from.label} pollen, and this is a ${kind.label}: they do not match, so no fruit would grow. You now carry ${kind.label} pollen instead.`);
          return;
        }
        L.carry = null;
        env.api.note(`${task.id}/f`, i);
        const n = (env.save.prog[task.id] ?? []).length;
        env.api.progress(task.id, n);
      } });
    }
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, () => ({ carry: null }));
    const n = env.prog.length;
    const what = L.carry == null ? 'gather pollen from a flower' : `carrying ${task.kinds[task.flowers[L.carry].kind].label} pollen: find the same kind`;
    return `Flowers pollinated: ${n} of ${task.n} · ${what}`;
  },
  solve(task, api) {
    for (let i = 0; i < task.n; i++) api.progress(task.id, i);
  },
  View: PollenView,
};

function Flower({ color, h, set, phase }: { color: string; h: number; set: boolean; phase: number }) {
  const head = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (head.current && !motion.reduced) head.current.rotation.z = Math.sin(st.clock.elapsedTime * 0.9 + phase) * 0.05;
  });
  const petal = M(color, { rough: 0.7 });
  return (
    <group ref={head}>
      <mesh material={M('#5c8a34')} position-y={h / 2} castShadow>
        <cylinderGeometry args={[0.07, 0.11, h, 6]} />
      </mesh>
      <mesh material={M('#5c8a34')} position={[0.35, h * 0.35, 0]} rotation-z={-0.9} scale={[0.5, 0.06, 0.22]}>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
      <group position-y={h} rotation-x={-0.5}>
        {Array.from({ length: 7 }, (_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <mesh key={i} material={petal} position={[Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55]} rotation-y={-a} scale={[0.55, 0.06, 0.3]} castShadow>
              <sphereGeometry args={[1, 10, 6]} />
            </mesh>
          );
        })}
        <mesh material={M(set ? '#8aa040' : '#f2c63a', { rough: 1 })} position-y={0.08} scale={set ? [0.45, 0.45, 0.45] : [0.32, 0.14, 0.32]}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      </group>
    </group>
  );
}

function PollenView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<PollenTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, () => ({ carry: null }));
  const set = data.prog[`${task.id}/f`] ?? [];
  const done = data.done.includes(task.id);
  const heights = useMemo(() => {
    const r = rng(16);
    return task.flowers.map(() => 2.4 + r() * 1.4);
  }, [task]);
  // Bees: each flies to a flower, hovers, and sometimes goes home to the hive.
  const N = 9;
  const bees = useMemo(() => {
    const r = rng(160);
    return Array.from({ length: N }, () => ({ pos: new THREE.Vector3(task.hive[0], 3, task.hive[1]), to: Math.floor(r() * task.flowers.length), wait: r() * 3, r }));
  }, [task]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const dust = useRef<THREE.Mesh>(null);
  const hy = t.floorY(task.hive[0], task.hive[1]);
  useFrame((st, dt0) => {
    const dt = Math.min(0.05, dt0);
    const time = st.clock.elapsedTime;
    bees.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      const home = b.to < 0;
      const f = home ? null : task.flowers[b.to];
      const tx = home ? task.hive[0] : f!.at[0];
      const tz = home ? task.hive[1] : f!.at[1];
      const ty = home ? hy + 3.2 : t.floorY(tx, tz) + heights[b.to] + 0.45;
      const d = Math.hypot(tx - b.pos.x, ty - b.pos.y, tz - b.pos.z);
      if (d > 0.3) {
        const sp = Math.min(d, 3.2 * dt);
        b.pos.x += ((tx - b.pos.x) / d) * sp;
        b.pos.y += ((ty - b.pos.y) / d) * sp;
        b.pos.z += ((tz - b.pos.z) / d) * sp;
        g.rotation.y = Math.atan2(tx - b.pos.x, tz - b.pos.z);
      } else {
        b.wait -= dt;
        if (b.wait <= 0) {
          // Bees favour flowers that have been pollinated (and so are setting fruit) once there are some.
          const pool = set.length && b.r() < 0.5 ? set : task.flowers.map((_, j) => j);
          b.to = b.r() < 0.2 ? -1 : pool[Math.floor(b.r() * pool.length)];
          b.wait = 1.5 + b.r() * 2.5;
        }
      }
      const wob = motion.reduced ? 0 : Math.sin(time * 6 + i) * 0.08;
      g.position.set(b.pos.x, b.pos.y + wob, b.pos.z);
      const w = g.children[1] as THREE.Mesh | undefined;
      if (w) w.rotation.z = motion.reduced ? 0.3 : Math.sin(time * 60 + i) * 0.6;
    });
    const m = dust.current;
    if (m) {
      m.visible = L.carry != null;
      m.position.set(player.pos.x + Math.sin(player.yaw) * 0.4, player.pos.y + 0.75, player.pos.z + Math.cos(player.yaw) * 0.4);
      if (L.carry != null) (m.material as THREE.MeshStandardMaterial).color.set(task.kinds[task.flowers[L.carry].kind].color).lerp(new THREE.Color('#f2c63a'), 0.55);
    }
  });
  const honey = ['#e8a830', '#c87a1e', '#f2d070', '#8a4a18'];
  const filled = done ? honey.length : Math.floor((set.length / task.n) * honey.length);
  return (
    <group>
      {task.flowers.map((f, i) => {
        const kind = task.kinds[f.kind];
        const key = L.carry == null ? `gather:${task.id}:${i}` : f.kind === task.flowers[L.carry].kind && !set.includes(i) ? `brush:${task.id}:${i}` : `pmix|${task.id}|${i}`;
        return (
          <group key={i} position={[f.at[0], t.floorY(f.at[0], f.at[1]), f.at[1]]} {...tap(() => act(key))}>
            <Flower color={kind.color} h={heights[i]} set={set.includes(i)} phase={i * 1.7} />
            {L.carry != null && L.carry !== i && f.kind === task.flowers[L.carry].kind && !set.includes(i) && <Halo on={active} />}
          </group>
        );
      })}
      {bees.map((_, i) => (
        <group
          key={i}
          ref={(g) => {
            refs.current[i] = g;
          }}
        >
          <mesh material={M('#e8b830')} scale={[0.11, 0.1, 0.17]}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
          <mesh position-y={0.09} scale={[0.16, 0.02, 0.08]}>
            <sphereGeometry args={[1, 6, 4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
      {/* The hive in a hollow tree; its comb fills with honey of different colours. */}
      <group position={[task.hive[0], hy, task.hive[1]]}>
        <mesh material={M('#6a4a30')} position-y={2} castShadow>
          <cylinderGeometry args={[0.7, 0.9, 4, 10]} />
        </mesh>
        <mesh material={M('#4f7a34')} position-y={4.6} scale={[2.2, 1.6, 2.2]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
        <mesh material={M('#2a1a10')} position={[0, 3.1, 0.62]} scale={[0.32, 0.42, 0.1]}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
        {honey.map((c, i) => (
          <mesh key={i} material={M(i < filled ? c : '#d8c8a0', { emissive: i < filled ? c : undefined, ei: i < filled ? 0.25 : 0 })} position={[-0.3 + (i % 2) * 0.3, 2.3 + Math.floor(i / 2) * 0.28, 0.82]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.15, 0.15, 0.06, 6]} />
          </mesh>
        ))}
      </group>
      <mesh ref={dust}>
        <icosahedronGeometry args={[0.12, 1]} />
        <meshStandardMaterial color="#f2c63a" roughness={1} />
      </mesh>
    </group>
  );
}
