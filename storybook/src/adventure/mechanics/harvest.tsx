// Surah Az-Zumar's own play: the field's turning (39:21, "Allah sends down
// rain from the sky and makes it flow as springs in the earth; then He
// produces thereby crops of varying colors; then they dry and you see them
// turned yellow; then He makes them [scattered] debris"). Sow the field after
// the rain and watch each plot go from green to gold. Bring in each plot when
// it is golden: too early and the grain is still green and soft; too late and
// the dry stalks break and scatter in the wind. A lost plot is sown again
// (39:53, do not despair).
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2, Terrain } from '../terrain';
import type { HarvestTask } from '../types';
import { live, type Mechanic, type MechSave, type MechUse } from './base';

type Live = { sown: number[] | null; ver: number };
const fresh = (): Live => ({ sown: null, ver: 0 });

const brought = (task: HarvestTask, s: MechSave) => (s.done.includes(task.id) ? task.plots.map((_, i) => i) : s.prog[task.id] ?? []);
/** 0 sprouting, 1 green, 2 golden, 3 dry and breaking. */
export const stageOf = (task: HarvestTask, age: number) => (age < 0 ? -1 : Math.min(3, Math.floor(age / task.stage)));

export const Harvest: Mechanic<HarvestTask> = {
  total: (task) => task.plots.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const got = brought(task, env.save);
    const out: MechUse[] = [];
    if (got.length >= task.plots.length) return out;
    if (!L.sown) {
      out.push({ key: `sow:${task.id}`, pos: env.v3(task.bag), label: 'Sow the field after the rain', reach: 2.4, run: () => {
        L.sown = task.plots.map((_, i) => env.game.clock + i * task.stagger);
        L.ver++;
      } });
      return out;
    }
    task.plots.forEach((p, i) => {
      if (got.includes(i)) return;
      out.push({ key: `reap:${task.id}:${i}`, pos: env.v3(p), label: 'Bring in this plot', reach: 2.2, run: () => {
        const s = stageOf(task, env.game.clock - L.sown![i]);
        L.ver++;
        if (s === 2) {
          env.api.progress(task.id, i);
          return;
        }
        env.api.note(`${task.id}/x`, i);
        if (s >= 3) {
          L.sown![i] = env.game.clock;
          env.api.hint('Too late: the dry stalks broke and scattered in the wind. Do not lose hope: the plot is sown again. Watch for gold.');
        } else env.api.hint('Too early: the grain is still green and soft. Wait until the plot turns gold.');
      } });
    });
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const got = brought(task, env.save);
    if (got.length >= task.plots.length) return;
    if (!L.sown) return 'Sow the field after the rain';
    // Plots left too long break up and are sown again by themselves.
    L.sown.forEach((s, i) => {
      if (!got.includes(i) && env.game.clock - s > task.stage * 4.5) {
        L.sown![i] = env.game.clock;
        L.ver++;
        env.api.note(`${task.id}/x`, i);
        env.api.hint('A plot was left until it broke and scattered, so it is sown again. Watch for gold.');
      }
    });
    const gold = task.plots.filter((_, i) => !got.includes(i) && stageOf(task, env.game.clock - L.sown![i]) === 2).length;
    return `Plots brought in: ${got.length} of ${task.plots.length} · golden now: ${gold}`;
  },
  weather(task, game) {
    const L = live<Live>(game as never, task.id, fresh);
    if (!L.sown) return { rain: 0.6, storm: 0 };
    return game.clock - Math.min(...L.sown) < task.stage * 0.6 ? { rain: 0.4, storm: 0 } : null;
  },
  View: HarvestView,
};

const COLORS = ['#7aa84a', '#4f8a2a', '#d8b040', '#b89a6a'];

function Plot({ task, i, at, t, L, got, game }: { task: HarvestTask; i: number; at: P2; t: Terrain; L: Live; got: boolean; game: { clock: number } }) {
  const stalks = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const N = 48;
  const spots = useMemo(() => Array.from({ length: N }, (_, k) => [((k % 8) - 3.5) * 0.4 + Math.sin(k * 7.1) * 0.06, (Math.floor(k / 8) - 2.5) * 0.4 + Math.cos(k * 3.3) * 0.06] as const), []);
  useFrame(() => {
    const m = stalks.current;
    if (!m) return;
    const clock = game.clock;
    const age = L.sown ? clock - L.sown[i] : -1;
    const s = got ? -2 : stageOf(task, age);
    const grow = s === -2 ? 0.15 : s < 0 ? 0 : Math.min(1, age / (task.stage * 1.5));
    col.set(s === -2 ? '#b8a070' : COLORS[Math.max(0, s)]);
    spots.forEach(([x, z], k) => {
      tmp.position.set(at[0] + x, t.floorY(at[0] + x, at[1] + z), at[1] + z);
      const bent = s === 3 ? 0.9 : 0;
      tmp.rotation.set(bent * Math.sin(k), 0, bent * Math.cos(k));
      tmp.scale.set(1, 0.05 + grow * 0.95, 1);
      tmp.updateMatrix();
      m.setMatrixAt(k, tmp.matrix);
      m.setColorAt(k, col);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      <mesh material={M('#8a6a44')} position={[at[0], t.floorY(at[0], at[1]) + 0.03, at[1]]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[3.4, 2.6]} />
      </mesh>
      <instancedMesh ref={stalks} args={[undefined, undefined, N]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 1.1, 4]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </group>
  );
}

function HarvestView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<HarvestTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const got = brought(task, data);
  const all = got.length >= task.plots.length;
  const [bx, bz] = task.bag;
  return (
    <group>
      {task.plots.map((p, i) => (
        <group key={i} {...tap(() => act(`reap:${task.id}:${i}`))}>
          <Plot task={task} i={i} at={p} t={t} L={L} got={got.includes(i)} game={game} />
          {!all && L.sown && !got.includes(i) && (
            <group position={[p[0], t.floorY(p[0], p[1]), p[1]]}>
              <Halo on={active} />
            </group>
          )}
        </group>
      ))}
      <group position={[bx, t.floorY(bx, bz), bz]} {...tap(() => act(`sow:${task.id}`))}>
        <mesh material={M('#c8a868')} position-y={0.35} scale={[1, 1.2, 1]}>
          <sphereGeometry args={[0.35, 12, 10]} />
        </mesh>
        <mesh material={M('#8a6a42')} position-y={0.78}>
          <torusGeometry args={[0.12, 0.03, 6, 12]} />
        </mesh>
        {!all && !L.sown && <Halo on={active} />}
      </group>
      {/* Sheaves for each plot brought in. */}
      {got.map((i, n) => (
        <mesh key={i} material={M('#d8b040')} position={[bx + 1.2 + n * 0.6, t.floorY(bx, bz) + 0.45, bz + 0.6]}>
          <cylinderGeometry args={[0.18, 0.24, 0.9, 8]} />
        </mesh>
      ))}
    </group>
  );
}
