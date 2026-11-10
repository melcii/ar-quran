// Surah Adh-Dhariyat: the scattering winds (51:1, "By the winds that
// scatter"). In a wide valley the wind keeps turning, slowly, all the way
// round. At each launch post hangs a bundle of feathery seed puffs, and
// across the valley lies a bare bed waiting for them. Watch the pennant on
// the post: it streams the way the wind is going. Release the puffs when it
// points at the bed, and the wind carries them there; release them at the
// wrong moment and the wind carries them away somewhere else. The turning
// wind and the posts are a game idea; nothing of the angels in 51:4 is
// shown.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { ReleaseTask } from '../types';
import { live, type Mechanic, type MechGame, type MechSave } from './base';

type Puff = { from: [number, number]; to: [number, number]; t0: number; ok: boolean };
type Live = { puffs: Puff[]; ver: number };
const fresh = (): Live => ({ puffs: [], ver: 0 });
const OK = 0.32; // about 18 degrees either side

const doneOf = (task: ReleaseTask, s: MechSave) => (s.done.includes(task.id) ? task.posts.map((_, i) => i) : s.prog[task.id] ?? []);
/** Where the wind is blowing toward now (radians, the explorer's yaw sense). */
export const windNow = (task: ReleaseTask, game: MechGame) => game.clock * task.turn;
const bearing = (task: ReleaseTask, i: number) => Math.atan2(task.posts[i].bed[0] - task.posts[i].at[0], task.posts[i].bed[1] - task.posts[i].at[1]);
const diff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

export const Release: Mechanic<ReleaseTask> = {
  total: (task) => task.posts.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    const L = live<Live>(env.game, task.id, fresh);
    return task.posts.flatMap((p, i) =>
      d.includes(i)
        ? []
        : [{ key: `puff:${task.id}:${i}`, pos: env.v3(p.at), label: `Let the seed puffs go (${p.label})`, reach: 2.6, run: () => {
            const w = windNow(task, env.game);
            const ok = Math.abs(diff(w, bearing(task, i))) < OK;
            const dist = Math.hypot(p.bed[0] - p.at[0], p.bed[1] - p.at[1]);
            const to: [number, number] = ok ? p.bed : [p.at[0] + Math.sin(w) * dist, p.at[1] + Math.cos(w) * dist];
            L.puffs.push({ from: p.at, to, t0: env.game.clock, ok });
            L.ver++;
            if (ok) {
              env.api.progress(task.id, i);
              env.api.hint(`The wind carries the puffs across the valley, and they settle on ${p.label}.`);
            } else {
              env.api.note(`${task.id}/x`, i * 100 + L.puffs.length);
              env.api.hint('The wind carried the puffs off another way. Watch the pennant: let them go when it points at the bare bed.');
            }
          } }],
    );
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length < task.posts.length) return `Beds sown by the wind: ${d.length} of ${task.posts.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.posts.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: ReleaseView,
};

function Post({ task, i, game, done, active, act, y }: { task: ReleaseTask; i: number; game: MechGame; done: boolean; active: boolean; act: (k: string) => void; y: number }) {
  const p = task.posts[i];
  const flag = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (flag.current) flag.current.rotation.y = windNow(task, game) - Math.PI / 2 + (motion.reduced ? 0 : Math.sin(s.clock.elapsedTime * 7 + i) * 0.05);
  });
  return (
    <group position={[p.at[0], y, p.at[1]]} {...tap(() => act(`puff:${task.id}:${i}`))}>
      <mesh material={M('#6a4a2a')} position-y={1.2}>
        <cylinderGeometry args={[0.05, 0.06, 2.4, 6]} />
      </mesh>
      <group ref={flag} position-y={2.3}>
        <mesh material={M('#e8e0c8', { side: THREE.DoubleSide })} position-x={0.45}>
          <planeGeometry args={[0.9, 0.22]} />
        </mesh>
      </group>
      {!done &&
        [0, 1, 2, 3, 4].map((k) => (
          <mesh key={k} material={M('#f8f4e8')} position={[Math.sin(k * 1.3) * 0.12, 1.3 + k * 0.08, Math.cos(k * 1.3) * 0.12]}>
            <sphereGeometry args={[0.07, 6, 5]} />
          </mesh>
        ))}
      {!done && <Halo on={active} />}
    </group>
  );
}

function ReleaseView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<ReleaseTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const d = doneOf(task, data);
  const puffs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    L.puffs.forEach((pf, k) => {
      const g = puffs.current[k];
      if (!g) return;
      const u = Math.min(1, (game.clock - pf.t0) / 3);
      const x = pf.from[0] + (pf.to[0] - pf.from[0]) * u;
      const z = pf.from[1] + (pf.to[1] - pf.from[1]) * u;
      g.position.set(x, t.floorY(x, z) + 1.4 + Math.sin(u * Math.PI) * 3 - u * 1.3, z);
      g.visible = u < 1 || pf.ok;
    });
  });
  return (
    <group>
      {task.posts.map((p, i) => {
        const [bx, bz] = p.bed;
        const by = t.floorY(bx, bz);
        const ok = d.includes(i);
        return (
          <group key={i}>
            <Post task={task} i={i} game={game} done={ok} active={active} act={act} y={t.floorY(p.at[0], p.at[1])} />
            <mesh position={[bx, by + 0.04, bz]} rotation-x={-Math.PI / 2} receiveShadow>
              <circleGeometry args={[2.4, 24]} />
              <meshStandardMaterial color={ok ? '#7aa04a' : '#9a8060'} roughness={1} />
            </mesh>
            {ok &&
              Array.from({ length: 10 }, (_, k) => (
                <mesh key={k} material={M('#f0e8a0')} position={[bx + Math.sin(k * 2.4) * (0.4 + (k % 4) * 0.45), by + 0.25, bz + Math.cos(k * 2.4) * (0.4 + (k % 4) * 0.45)]}>
                  <sphereGeometry args={[0.12, 6, 5]} />
                </mesh>
              ))}
          </group>
        );
      })}
      {L.puffs.map((_, k) => (
        <group key={k} ref={(g) => void (puffs.current[k] = g)}>
          {[0, 1, 2].map((j) => (
            <mesh key={j} material={M('#fbf8ee')} position={[j * 0.15 - 0.15, Math.sin(j) * 0.1, 0]}>
              <sphereGeometry args={[0.09, 6, 5]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
