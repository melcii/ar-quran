// Surah An-Naml's own play: the valley of the ants (27:18). Here you are
// ant-sized: grass blades tower overhead and a pebble is a boulder. Groups of
// ants are out on their paths, and footsteps are coming. An ant called out:
// "O ants, enter your dwellings" (27:18). Start at the nest, and the
// footsteps start coming: clear what blocks each path (roll a pebble aside,
// drag a twig, lift a leaf) so each group can march home in time. If the
// footsteps come first, the ants not home scatter safely into the grass and
// you try again. Sulayman and his soldiers are never shown, and nor are the
// footsteps: only a count on the status line. The ants are animals only.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import { rng, type P2, type Terrain } from '../terrain';
import type { AntsTask } from '../types';
import { live, type Mechanic, type MechSave, type MechUse } from './base';

type Live = { started: boolean; left: number; cleared: string[]; walking: Record<number, number>; ver: number };
const fresh = (): Live => ({ started: false, left: 0, cleared: [], walking: {}, ver: 0 });

const home = (task: AntsTask, s: MechSave) => (s.done.includes(task.id) ? task.groups.map((_, i) => i) : s.prog[task.id] ?? []);

const WALK = 6;
const PER = 8;

const VERB = { pebble: 'Roll the pebble aside', twig: 'Drag the twig off the path', leaf: 'Lift the leaf off the path' };

/** A point a fraction of the way along a path. */
function along(path: P2[], f: number): P2 {
  const segs = path.slice(1).map((b, i) => Math.hypot(b[0] - path[i][0], b[1] - path[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = Math.min(1, Math.max(0, f)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? d / segs[i] : 0;
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k];
    }
    d -= segs[i];
  }
  return path[path.length - 1];
}

export const Ants: Mechanic<AntsTask> = {
  total: (task) => task.groups.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const done = home(task, env.save);
    if (!L.started)
      return [{ key: `warn:${task.id}`, pos: env.v3(task.nest), label: 'Help the ants home before the footsteps come', reach: 3.8, run: () => {
        L.started = true;
        L.left = task.time;
        L.ver++;
        env.api.hint('"O ants, enter your dwellings!" Clear the blocked paths so every group can get home in time.');
      } }];
    const out: MechUse[] = [];
    for (const [g, gr] of task.groups.entries()) {
      if (done.includes(g) || g in L.walking) continue;
      gr.blocks.forEach((b, k) => {
        const id = `${g}:${k}`;
        if (L.cleared.includes(id)) return;
        out.push({ key: `clear:${task.id}:${id}`, pos: env.v3(b.at), label: VERB[b.what], reach: 2.6, run: () => {
          L.cleared.push(id);
          L.ver++;
          if (gr.blocks.every((_, j) => L.cleared.includes(`${g}:${j}`))) {
            L.walking[g] = 0;
            env.api.hint('That path is clear: the ants are marching home.');
          }
        } });
      });
    }
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const done = home(task, env.save);
    if (!L.started) return `Ant groups home: ${done.length} of ${task.groups.length}. Start at the nest.`;
    L.left -= env.dt;
    for (const k of Object.keys(L.walking)) {
      const g = +k;
      L.walking[g] += env.dt / WALK;
      if (L.walking[g] >= 1) {
        delete L.walking[g];
        L.ver++;
        env.api.progress(task.id, g);
      }
    }
    const now = home(task, env.save).length + 0;
    if (L.left <= 0 && now < task.groups.length && !Object.keys(L.walking).length) {
      L.started = false;
      L.cleared = L.cleared.filter((id) => done.includes(+id.split(':')[0]));
      L.ver++;
      env.api.note(`${task.id}/x`, done.length);
      env.api.hint('The footsteps came near, and the ants not yet home scattered into the grass to hide. They are safe. Try again: start at the nest.');
      return;
    }
    return `Footsteps coming in ${Math.max(0, Math.ceil(L.left))} s · Ant groups home: ${done.length} of ${task.groups.length}`;
  },
  View: AntsView,
};

/** Giant grass blades, so the world reads as ant-sized. */
function Blades({ task, t }: { task: AntsTask; t: Terrain }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 160;
  const mats = useMemo(() => {
    const r = rng(2727);
    const tmp = new THREE.Object3D();
    const out: THREE.Matrix4[] = [];
    const pts = task.groups.flatMap((g) => g.path);
    let tries = 0;
    while (out.length < N && tries++ < 4000) {
      const a = r() * Math.PI * 2;
      const d = 4 + r() * 30;
      const x = task.nest[0] + Math.cos(a) * d;
      const z = task.nest[1] + Math.sin(a) * d;
      // Keep the blades off the paths.
      if (pts.some((p, i) => i < pts.length - 1 && Math.hypot(p[0] - x, p[1] - z) < 2.6)) continue;
      const h = 3 + r() * 4;
      tmp.position.set(x, t.floorY(x, z) + h / 2, z);
      tmp.rotation.set((r() - 0.5) * 0.3, r() * Math.PI, (r() - 0.5) * 0.3);
      tmp.scale.set(1, h, 1);
      tmp.updateMatrix();
      out.push(tmp.matrix.clone());
    }
    return out;
  }, [task, t]);
  useFrame(() => {
    const m = ref.current;
    if (!m || m.userData.set) return;
    mats.forEach((x, i) => m.setMatrixAt(i, x));
    m.count = mats.length;
    m.instanceMatrix.needsUpdate = true;
    m.userData.set = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} castShadow>
      <coneGeometry args={[0.18, 1, 4]} />
      <meshStandardMaterial color="#5f9a3a" roughness={0.9} />
    </instancedMesh>
  );
}

function Block({ b, y, onTap, active }: { b: AntsTask['groups'][number]['blocks'][number]; y: number; onTap: () => void; active: boolean }) {
  return (
    <group position={[b.at[0], y, b.at[1]]} {...tap(onTap)}>
      {b.what === 'pebble' && (
        <mesh material={M('#9a948a', { map: 'stone' })} position-y={0.7} castShadow>
          <dodecahedronGeometry args={[0.9, 1]} />
        </mesh>
      )}
      {b.what === 'twig' && (
        <mesh material={M('#7a5a3a')} position-y={0.3} rotation={[0, 0.6, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 3.4, 8]} />
        </mesh>
      )}
      {b.what === 'leaf' && (
        <mesh material={M('#7aa84a')} position-y={0.15} rotation-y={0.4} scale={[1.6, 0.08, 1]} castShadow>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      )}
      <Halo on={active} />
    </group>
  );
}

function AntsView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<AntsTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const done = home(task, data);
  const [, setVer] = useState(0);
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => {
    const o = new THREE.Object3D();
    o.rotation.order = 'YXZ';
    return o;
  }, []);
  const N = task.groups.length * PER;
  useFrame((st) => {
    setVer((v) => (v === L.ver ? v : L.ver));
    const m = ref.current;
    if (!m) return;
    const time = motion.reduced ? 0 : st.clock.elapsedTime;
    task.groups.forEach((g, gi) => {
      const walking = L.walking[gi];
      for (let k = 0; k < PER; k++) {
        const idx = gi * PER + k;
        let p: P2;
        let yaw = 0;
        let show = !done.includes(gi);
        if (walking != null) {
          const f = walking * 1.15 - k * 0.02;
          p = along(g.path, f);
          const q = along(g.path, f + 0.02);
          yaw = Math.atan2(q[0] - p[0], q[1] - p[1]);
          if (f >= 1) show = false;
        } else {
          // Waiting at the start of the path, milling about.
          const a = k * 0.8 + time * 0.6;
          p = [g.path[0][0] + Math.cos(a) * 0.9, g.path[0][1] + Math.sin(a * 1.3) * 0.9];
          yaw = a + Math.PI / 2;
        }
        tmp.position.set(p[0], t.floorY(p[0], p[1]) + 0.18, p[1]);
        tmp.rotation.set(Math.PI / 2, yaw, 0);
        tmp.scale.setScalar(show ? 1 : 0);
        tmp.updateMatrix();
        m.setMatrixAt(idx, tmp.matrix);
      }
    });
    m.instanceMatrix.needsUpdate = true;
  });
  const [nx, nz] = task.nest;
  return (
    <group>
      <Blades task={task} t={t} />
      <group position={[nx, t.floorY(nx, nz), nz]} {...tap(() => act(`warn:${task.id}`))}>
        <mesh material={M('#a8865a')} position-y={0.6} castShadow receiveShadow>
          <coneGeometry args={[2.6, 1.4, 20]} />
        </mesh>
        <mesh material={M('#2a1e12')} position-y={1.25}>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 14]} />
        </mesh>
        {!L.started && done.length < task.groups.length && <Halo on={active} />}
      </group>
      {task.groups.map((g, gi) =>
        g.blocks.map((b, k) =>
          done.includes(gi) || L.cleared.includes(`${gi}:${k}`) || gi in L.walking ? null : (
            <Block key={`${gi}:${k}`} b={b} y={t.floorY(b.at[0], b.at[1])} active={active && L.started} onTap={() => act(`clear:${task.id}:${gi}:${k}`)} />
          ),
        ),
      )}
      {/* The ants: one small body shape, placed many times. */}
      <instancedMesh ref={ref} args={[undefined, undefined, N]}>
        <capsuleGeometry args={[0.1, 0.45, 4, 8]} />
        <meshStandardMaterial color="#2a1a14" roughness={0.6} />
      </instancedMesh>
    </group>
  );
}
