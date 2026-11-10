// Surah Hud's Lut chapter: leaving by night (11:81, "So set out with your
// family during a portion of the night and let not any among you look back
// ... Indeed, their appointment is [in] the morning. Is not the morning
// near?"). The chapter is played at night. Way-stones lead out of the valley
// away from the town; light each one in turn and keep going forward. Walk
// back toward the town and the last stone you lit goes dark again: do not
// turn back. With every stone the sky pales a little, until the morning
// comes. Lut and his family are not shown, and nothing of what happened to
// the town is shown: the town stays behind you, quiet and dark.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { Look } from '../Scenery';
import type { DawnTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { ver: number };
const fresh = (): Live => ({ ver: 0 });

const litOf = (task: DawnTask, s: MechSave) => (s.done.includes(task.id) ? task.stones.length : (s.prog[task.id] ?? []).length);
const open = (task: DawnTask, s: MechSave) => !s.done.includes(task.id) && (task.requires ?? []).every((r) => s.done.includes(r));

const NIGHT: Look = {
  zen: '#0c1430', mid: '#1c2650', hor: '#3a3a64', sun: [-0.6, 0.12, -0.7], sunColor: '#8a94c8', sunI: 0.55,
  hemiSky: '#4a5890', hemiGround: '#24242c', hemiI: 0.8, fog: '#252b48', fogDensity: 0.007, stars: 1, moon: [0.4, 0.5, 0.7], clouds: 0.2, birds: false,
};
const DAWN: Look = {
  zen: '#5a74b8', mid: '#c2a0c0', hor: '#ffc89a', sun: [0.75, 0.08, -0.6], sunColor: '#ffc890', sunI: 2.2,
  hemiSky: '#b4bce8', hemiGround: '#5a5a44', hemiI: 1.1, fog: '#d8b8b0', fogDensity: 0.006, stars: 0, clouds: 0.7, birds: true,
};
const cA = new THREE.Color();
const cB = new THREE.Color();
const mix = (a: string, b: string, k: number) => '#' + cA.set(a).lerp(cB.set(b), k).getHexString();
/** The sky between night (0) and dawn (1). */
export function dawnLook(k: number): Look {
  const n = (a: number, b: number) => a + (b - a) * k;
  return {
    zen: mix(NIGHT.zen, DAWN.zen, k), mid: mix(NIGHT.mid, DAWN.mid, k), hor: mix(NIGHT.hor, DAWN.hor, k),
    sun: [n(NIGHT.sun[0], DAWN.sun[0]), n(NIGHT.sun[1], DAWN.sun[1]), n(NIGHT.sun[2], DAWN.sun[2])],
    sunColor: mix(NIGHT.sunColor, DAWN.sunColor, k), sunI: n(NIGHT.sunI, DAWN.sunI),
    hemiSky: mix(NIGHT.hemiSky, DAWN.hemiSky, k), hemiGround: mix(NIGHT.hemiGround, DAWN.hemiGround, k), hemiI: n(NIGHT.hemiI, DAWN.hemiI),
    fog: mix(NIGHT.fog, DAWN.fog, k), fogDensity: n(NIGHT.fogDensity, DAWN.fogDensity), stars: 1 - k, moon: k < 0.6 ? NIGHT.moon : undefined, clouds: n(0.2, 0.7), birds: k > 0.8,
  };
}

export const Dawn: Mechanic<DawnTask> = {
  total: (task) => task.stones.length,
  uses(task, env) {
    const n = litOf(task, env.save);
    if (n >= task.stones.length) return [];
    return [{ key: `way:${task.id}:${n}`, pos: env.v3(task.stones[n]), label: 'Light the way-stone', reach: 2.4, run: () => {
      env.api.progress(task.id, n);
      live<Live>(env.game, task.id, fresh).ver++;
      if (n === 0) env.api.say('Keep going forward, away from the town, and do not turn back.');
    } }];
  },
  frame(task, env) {
    const n = litOf(task, env.save);
    if (n >= task.stones.length) return;
    // Turning back: coming nearer the town than the last lit stone (by a margin) puts that stone out.
    if (n > 0) {
      const [tx, tz] = task.town;
      const [lx, lz] = task.stones[n - 1];
      const back = Math.hypot(env.pp.x - tx, env.pp.z - tz) < Math.hypot(lx - tx, lz - tz) - task.slack;
      if (back) {
        const p = (env.save.prog[task.id] ?? []).filter((k) => k !== n - 1);
        env.api.set(task.id, p);
        env.api.note(`${task.id}/x`, n - 1);
        live<Live>(env.game, task.id, fresh).ver++;
        env.api.hint('You turned back toward the town, and the last way-stone went dark. "Let not any among you look back" (11:81). Go forward and light it again.');
      }
    }
    return `Way-stones lit: ${n} of ${task.stones.length} · the morning is near`;
  },
  look(task, data) {
    if (!open(task, data)) return undefined;
    return dawnLook(Math.min(1, litOf(task, data) / task.stones.length) * 0.85);
  },
  solve(task, api) {
    const n = litOf(task, api.save());
    if (n < task.stones.length) api.progress(task.id, n);
  },
  View: DawnView,
};

function Stone({ lit, next, active }: { lit: boolean; next: boolean; active: boolean }) {
  const flame = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (flame.current) flame.current.scale.setScalar(lit ? 1 + Math.sin(s.clock.elapsedTime * 9) * 0.08 : 0.001);
  });
  return (
    <group>
      <mesh material={M('#a89a86', { map: 'stone' })} position-y={0.35} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.42, 0.7, 7]} />
      </mesh>
      <mesh material={M('#6a5a48')} position-y={0.74}>
        <cylinderGeometry args={[0.2, 0.16, 0.1, 10]} />
      </mesh>
      <mesh ref={flame} position-y={0.92}>
        <coneGeometry args={[0.09, 0.28, 8]} />
        <meshBasicMaterial color="#ffc860" toneMapped={false} />
      </mesh>
      {lit && <pointLight position-y={1.1} intensity={3} distance={7} color="#ffb860" />}
      {next && <Halo on={active} />}
    </group>
  );
}

function DawnView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<DawnTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const n = litOf(task, data);
  const lit = new Set(data.done.includes(task.id) ? task.stones.map((_, i) => i) : data.prog[task.id] ?? []);
  return (
    <group>
      {task.stones.map(([x, z], i) => (
        <group key={i} position={[x, t.floorY(x, z), z]} {...tap(() => act(`way:${task.id}:${i}`))}>
          <Stone lit={lit.has(i)} next={i === n} active={active} />
        </group>
      ))}
    </group>
  );
}
