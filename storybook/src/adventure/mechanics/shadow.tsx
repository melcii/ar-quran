// Surah Al-Furqan's own play: the shadow and the sun (25:45-46). A tall pole
// stands in a stone plaza. The day is held still at a time; you are asked
// where the tip of the pole's shadow will be at a later time. Stand where
// you think it will be and put a stone down, then sit at the seat and let
// the day run: the sun moves across the sky, the shadow shortens or
// stretches and swings round, and stops at the time asked. If the tip lands
// by your stone, the round is done; if not, the day goes back and you try
// again. The sun here is a simple game model of a day, not an astronomical
// one.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import { sunLive } from '../Scenery';
import type { P2 } from '../terrain';
import type { ShadowTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

/** The sun's direction at a time of day (0 = sunrise in the east, +x; 1 = sunset in the west). */
export function sunAt(tau: number) {
  const f = Math.PI * Math.min(0.97, Math.max(0.03, tau));
  return new THREE.Vector3(Math.cos(f), 0.15 + 1.1 * Math.sin(f), 0.5 * Math.sin(f)).normalize();
}

/** Where the tip of the pole's shadow falls at a time of day. */
export function tipAt(task: ShadowTask, tau: number): P2 {
  const s = sunAt(tau);
  return [task.pole[0] - (task.height * s.x) / s.y, task.pole[1] - (task.height * s.z) / s.y];
}

type Live = { round: number; t: number; running: boolean; stone: P2 | null; ver: number; tip: (tau: number) => P2 };
const fresh = (task: ShadowTask) => (): Live => ({ round: -1, t: task.rounds[0].from, running: false, stone: null, ver: 0, tip: (tau) => tipAt(task, tau) });

const rounds = (task: ShadowTask, s: MechSave) => (s.done.includes(task.id) ? task.rounds.length : (s.prog[task.id] ?? []).length);

/** Keep the live state on the current round (after a reload, or when a round is done). */
function sync(task: ShadowTask, L: Live, k: number) {
  if (L.round === k) return;
  L.round = k;
  L.running = false;
  L.stone = null;
  L.t = k < task.rounds.length ? task.rounds[k].from : task.rounds[task.rounds.length - 1].to;
  L.ver++;
}

const PLAZA = 12;

export const Shadow: Mechanic<ShadowTask> = {
  total: (task) => task.rounds.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const k = env.prog.length;
    sync(task, L, k);
    const r = task.rounds[k];
    if (!r || L.running) return [];
    const out = [];
    const here: P2 = [env.pp.x, env.pp.z];
    if (Math.hypot(here[0] - task.pole[0], here[1] - task.pole[1]) < PLAZA)
      out.push({ key: `place:${task.id}`, pos: env.v3(here), label: L.stone ? 'Move your stone to here' : 'Put your stone here', reach: 3, run: () => {
        L.stone = [env.pp.x, env.pp.z];
        L.ver++;
        env.api.hint(`Stone down. When you are sure, sit at the seat and let the day run to ${r.label}.`);
      } });
    if (L.stone)
      out.push({ key: `run:${task.id}`, pos: env.v3(task.seat), label: `Let the day run to ${r.label}`, reach: 2.6, run: () => {
        L.running = true;
        L.ver++;
      } });
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const k = env.prog.length;
    sync(task, L, k);
    const r = task.rounds[k];
    if (!r) return;
    if (L.running) {
      L.t = Math.min(r.to, L.t + env.dt * 0.04);
      if (L.t >= r.to) {
        L.running = false;
        L.ver++;
        const [tx, tz] = tipAt(task, r.to);
        const d = L.stone ? Math.hypot(tx - L.stone[0], tz - L.stone[1]) : 99;
        if (d <= task.near) {
          env.api.progress(task.id, k);
          env.api.open({ kind: 'reading', reading: r.reading });
        } else {
          env.api.note(`${task.id}/x`, k);
          const tipLen = Math.hypot(tx - task.pole[0], tz - task.pole[1]);
          const stoneLen = L.stone ? Math.hypot(L.stone[0] - task.pole[0], L.stone[1] - task.pole[1]) : 0;
          const cue = Math.abs(tipLen - stoneLen) > task.near ? (tipLen < stoneLen ? 'The shadow was shorter than you thought.' : 'The shadow was longer than you thought.') : 'The length was close, but it pointed another way.';
          env.api.hint(`The shadow tip stopped ${Math.round(d)} m from your stone. ${cue} The day goes back: move your stone and try again.`);
          L.t = r.from;
        }
      }
      return `The day is running toward ${r.label}: watch the shadow`;
    }
    return `Round ${k + 1} of ${task.rounds.length}: where will the shadow tip be at ${r.label}? ${L.stone ? 'Then let the day run at the seat.' : 'Stand there and put your stone down.'}`;
  },
  View: ShadowView,
};

function ShadowView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<ShadowTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh(task));
  const k = rounds(task, data);
  const finished = k >= task.rounds.length;
  const [, setVer] = useState(0);
  const shadow = useRef<THREE.Mesh>(null);
  const tipRing = useRef<THREE.Mesh>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const [px, pz] = task.pole;
  const py = t.floorY(px, pz);
  useEffect(
    () => () => {
      sunLive.dir = null;
    },
    [],
  );
  useFrame((st) => {
    setVer((v) => (v === L.ver ? v : L.ver));
    const tau = finished ? task.rounds[task.rounds.length - 1].to : L.t;
    sunLive.dir = finished ? null : dir.copy(sunAt(tau));
    const [tx, tz] = tipAt(task, tau);
    const len = Math.hypot(tx - px, tz - pz);
    const s = shadow.current;
    if (s) {
      s.position.set((px + tx) / 2, py + 0.06, (pz + tz) / 2);
      s.rotation.set(-Math.PI / 2, 0, Math.atan2(tz - pz, tx - px) * -1);
      s.scale.set(len, 1, 1);
    }
    const r = tipRing.current;
    if (r) {
      r.position.set(tx, t.floorY(tx, tz) + 0.07, tz);
      r.scale.setScalar(1 + (motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 3) * 0.08));
    }
  });
  return (
    <group>
      <mesh material={M('#e0d0b0', { map: 'stone' })} position={[px, py + 0.03, pz]} receiveShadow>
        <cylinderGeometry args={[PLAZA, PLAZA, 0.06, 48]} />
      </mesh>
      {/* Hour lines on the plaza, to help guess. */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = -Math.PI / 2 + ((i - 4) / 4) * 1.3;
        return (
          <mesh key={i} material={M('#b8a888')} position={[px + Math.cos(a) * 6, py + 0.065, pz + Math.sin(a) * 6]} rotation={[-Math.PI / 2, 0, -a]}>
            <planeGeometry args={[11, 0.06]} />
          </mesh>
        );
      })}
      <mesh material={M('#6a5a46')} position={[px, py + task.height / 2, pz]}>
        <cylinderGeometry args={[0.12, 0.16, task.height, 10]} />
      </mesh>
      {/* The pole's shadow, drawn by the game so it follows the day exactly. */}
      <mesh ref={shadow} renderOrder={2}>
        <planeGeometry args={[1, 0.3]} />
        <meshBasicMaterial color="#2a2418" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh ref={tipRing} rotation-x={-Math.PI / 2} renderOrder={3}>
        <ringGeometry args={[0.18, 0.3, 20]} />
        <meshBasicMaterial color="#2a2418" transparent opacity={0.7} depthWrite={false} />
      </mesh>
      {L.stone && !finished && (
        <mesh material={M('#c8a46a', { map: 'stone' })} position={[L.stone[0], t.floorY(L.stone[0], L.stone[1]) + 0.25, L.stone[1]]} castShadow>
          <dodecahedronGeometry args={[0.32, 0]} />
        </mesh>
      )}
      <group position={[task.seat[0], t.floorY(task.seat[0], task.seat[1]), task.seat[1]]} {...tap(() => act(`run:${task.id}`))}>
        <mesh material={M('#b8a07a', { map: 'stone' })} position-y={0.25} castShadow>
          <boxGeometry args={[1.6, 0.5, 0.6]} />
        </mesh>
        {L.stone && !L.running && !finished && <Halo on={active} />}
      </group>
    </group>
  );
}
