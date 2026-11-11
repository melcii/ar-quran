// Surah Al-Ahqaf (The Curving Sand Dunes): keep the path to the well open.
// The surah is named for the curving dunes where 'Ad lived (46:21). A path
// runs between the dunes to a well, and a windy spell is coming. Set up
// palm-frond windbreaks (only a few) at the posts beside the path, then wait
// out the spell at the well. Sand piles up on every stretch of path that has
// no windbreak upwind of it; if a stretch is buried, the spell starts again.
// Look at the windsock and at where the sand piled up to see which posts
// matter. The windbreaks and the spell are a game idea set in dune country;
// nothing of 'Ad or the wind that destroyed them (46:24-25) is played or shown.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { DunesTask } from '../types';
import { live, type Mechanic } from './base';

type Live = { up: number[]; phase: 'ready' | 'blowing'; t: number; sand: number[]; tries: number; ver: number };
const fresh = (task: DunesTask) => (): Live => ({ up: [], phase: 'ready', t: 0, sand: task.segments.map(() => 0), tries: 0, ver: 0 });
const S = (task: DunesTask, game: Parameters<typeof live>[0]) => live<Live>(game, task.id, fresh(task));

export const Dunes: Mechanic<DunesTask> = {
  total: () => 1,
  uses(task, env) {
    if (env.save.done.includes(task.id)) return [];
    const L = S(task, env.game);
    const out = task.spots.map((sp, i) => {
      const on = L.up.includes(i);
      return { key: `fence:${task.id}:${i}`, pos: env.v3(sp.at), label: on ? 'Take down this windbreak' : `Set up a windbreak here (${task.fences - L.up.length} left)`, reach: 2.4, run: () => {
        if (on) L.up = L.up.filter((k) => k !== i);
        else if (L.up.length >= task.fences) return env.api.hint(`You only have ${task.fences} windbreaks. Take one down somewhere else first.`);
        else L.up = [...L.up, i];
        L.ver++;
      } };
    });
    if (L.phase === 'ready')
      out.push({ key: `wait:${task.id}`, pos: env.v3(task.well), label: 'Wait out the windy spell at the well', reach: 3, run: () => {
        L.phase = 'blowing';
        L.t = 0;
        L.sand = task.segments.map(() => 0);
        L.ver++;
        env.api.hint('The wind rises. Sand starts to blow across the dunes.');
      } });
    return out;
  },
  frame(task, env) {
    const L = S(task, env.game);
    if (L.phase === 'ready') return `Windbreaks set up: ${L.up.length} of ${task.fences}. When you are ready, wait out the spell at the well.`;
    L.t += env.dt;
    const guarded = new Set(L.up.map((i) => task.spots[i].guards).filter((g) => g != null));
    task.segments.forEach((_, k) => {
      L.sand[k] = guarded.has(k) ? Math.max(0, L.sand[k] - env.dt * 0.05) : L.sand[k] + env.dt / (task.secs * 0.6);
    });
    const buried = L.sand.findIndex((v) => v >= 1);
    if (buried >= 0) {
      L.phase = 'ready';
      L.tries++;
      L.ver++;
      env.api.note(`${task.id}/x`, L.tries);
      env.api.hint('Sand has buried a stretch of the path. Look where it piled up and which way the windsock blows: a windbreak must stand on the windward side of that stretch. Then wait out the spell again.');
      return;
    }
    if (L.t >= task.secs) {
      L.phase = 'ready';
      L.ver++;
      env.api.progress(task.id, 0);
      return;
    }
    const worst = Math.max(...L.sand);
    return `Windy spell: ${Math.ceil(task.secs - L.t)} s left · path ${Math.round((1 - worst) * 100)}% clear`;
  },
  solve(task, api) {
    api.progress(task.id, 0);
  },
  View: DunesView,
};

function DunesView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<DunesTask>['View']>>[0]) {
  const L = S(task, game);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const done = data.done.includes(task.id);
  const mounds = useRef<(THREE.Mesh | null)[]>([]);
  const sock = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    mounds.current.forEach((m, k) => {
      if (m) m.scale.set(1, Math.max(0.01, L.sand[k] ?? 0), 1);
    });
    if (sock.current) sock.current.rotation.z = -Math.PI / 2 + (motion.reduced ? 0 : Math.sin(s.clock.elapsedTime * (L.phase === 'blowing' ? 9 : 3)) * (L.phase === 'blowing' ? 0.12 : 0.2));
  });
  const [wx, wz] = task.well;
  const wy = t.floorY(wx, wz);
  return (
    <group>
      {task.segments.map(([x, z], k) => (
        <mesh key={k} ref={(m) => void (mounds.current[k] = m)} material={M('#e8cc98')} position={[x, t.floorY(x, z), z]} scale={[1, 0.01, 1]}>
          <sphereGeometry args={[1.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
      {task.spots.map((sp, i) => {
        const [x, z] = sp.at;
        const y = t.floorY(x, z);
        const on = L.up.includes(i) || (done && sp.guards != null);
        return (
          <group key={i} position={[x, y, z]} rotation-y={task.wind} {...tap(() => act(`fence:${task.id}:${i}`))}>
            <mesh material={M('#6a4a2a')} position-y={0.4}>
              <cylinderGeometry args={[0.05, 0.06, 0.8, 6]} />
            </mesh>
            {on &&
              [-1, -0.5, 0, 0.5, 1].map((k) => (
                <mesh key={k} material={M('#8a7a3a')} position={[k * 0.5, 0.75, 0]} rotation-z={k * 0.05} castShadow>
                  <boxGeometry args={[0.45, 1.5, 0.08]} />
                </mesh>
              ))}
            {!done && <Halo on={active && !on} />}
          </group>
        );
      })}
      {/* The windsock at the well shows which way the wind blows. */}
      <group position={[wx + 1.4, wy, wz]} {...tap(() => act(`wait:${task.id}`))}>
        <mesh material={M('#6a4a2a')} position-y={1.4}>
          <cylinderGeometry args={[0.04, 0.05, 2.8, 6]} />
        </mesh>
        <group position-y={2.7} rotation-y={task.wind - Math.PI / 2}>
          <mesh ref={sock} material={M('#d86a3a')} position-x={0.45}>
            <coneGeometry args={[0.16, 0.9, 10, 1, true]} />
          </mesh>
        </group>
        {!done && L.phase === 'ready' && <Halo on={active} />}
      </group>
    </group>
  );
}
