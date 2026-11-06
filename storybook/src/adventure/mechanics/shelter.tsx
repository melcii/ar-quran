// Surah Al-Ankabut's own play: the house of the spider (29:41). On a test
// stand a small lamp burns inside a shelter woven like a spider's web: a
// roof and two walls. Start the wind and rain test and watch: rain falls
// through the web and wind blows through it, and the lamp goes out. A web is
// wonderful work, strong for its weight and good for catching food, but as a
// house it gives no shelter. Then rebuild the shelter part by part from the
// piles of reeds and mud bricks and test again, until the lamp stays lit
// through the whole storm. The verse is about relying on anything other
// than Allah; the game only shows what a web can and cannot shelter from.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2 } from '../terrain';
import type { ShelterMat, ShelterTask } from '../types';
import { live, type Mechanic, type MechEnv, type MechSave, type MechUse } from './base';

const PARTS = ['roof', 'west wall', 'east wall'] as const;
const NAME: Record<ShelterMat, string> = { web: 'woven web', reed: 'reed', brick: 'mud brick' };

type Live = { parts: ShelterMat[]; carry: ShelterMat | null; test: number; out: boolean; ver: number };
const fresh = (): Live => ({ parts: ['web', 'web', 'web'], carry: null, test: -1, out: false, ver: 0 });

const steps = (task: ShelterTask, s: MechSave) => (s.done.includes(task.id) ? [0, 1] : s.prog[task.id] ?? []);

/** Where each part is fitted, around the stand. */
const slot = (task: ShelterTask, p: number): P2 => [task.stand[0] + [0, -1.7, 1.7][p], task.stand[1] + [1.4, 0, 0][p]];
const lever = (task: ShelterTask): P2 => [task.stand[0], task.stand[1] + 3];

/** When the storm first gets through, and how. */
function breach(parts: ShelterMat[]) {
  const out: { at: number; why: string }[] = [];
  if (parts[0] === 'web') out.push({ at: 1.5, why: 'Rain fell straight through the web roof onto the lamp.' });
  [1, 2].forEach((p) => {
    if (parts[p] === 'web') out.push({ at: 2, why: `The wind blew right through the web ${PARTS[p]}.` });
    if (parts[p] === 'reed') out.push({ at: 3.5, why: `A strong gust pushed between the reeds of the ${PARTS[p]}.` });
  });
  return out.sort((a, b) => a.at - b.at)[0];
}

function end(task: ShelterTask, env: MechEnv, L: Live, ok: boolean, why?: string) {
  L.test = -1;
  L.ver++;
  const first = !(env.save.prog[task.id] ?? []).includes(0);
  if (first) {
    env.api.progress(task.id, 0);
    env.api.open({ kind: 'reading', reading: task.web });
    env.api.hint(`${why ?? ''} A web is fine work, strong for its weight, but as a house it gives no shelter. Rebuild the shelter part by part and test again.`);
    return;
  }
  if (ok) env.api.progress(task.id, 1);
  else env.api.hint(`${why} The lamp went out. Change that part and test again.`);
}

export const Shelter: Mechanic<ShelterTask> = {
  total: () => 2,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const out: MechUse[] = [];
    if (L.test >= 0) return out;
    const tested = (env.save.prog[task.id] ?? []).includes(0);
    if (tested && L.carry == null)
      task.piles.forEach((p, k) =>
        out.push({ key: `take:${task.id}:${k}`, pos: env.v3(p.at), label: `Pick up a ${NAME[p.mat]} panel`, reach: 2.6, run: () => {
          L.carry = p.mat;
          L.ver++;
          env.api.hint('Fit it as the roof (in front of the stand) or as a wall (at either side).');
        } }),
      );
    if (L.carry)
      PARTS.forEach((name, p) =>
        out.push({ key: `fit:${task.id}:${p}`, pos: env.v3(slot(task, p)), label: `Fit the ${NAME[L.carry!]} panel as the ${name}`, reach: 1.6, run: () => {
          L.parts[p] = L.carry!;
          L.carry = null;
          L.ver++;
        } }),
      );
    if (L.carry == null)
      out.push({ key: `test:${task.id}`, pos: env.v3(lever(task)), label: 'Start the wind and rain test', reach: 2.4, run: () => {
        L.test = env.game.clock;
        L.out = false;
        L.ver++;
      } });
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    if (L.test >= 0) {
      const since = env.game.clock - L.test;
      const b = breach(L.parts);
      if (b && since >= b.at) {
        L.out = true;
        end(task, env, L, false, b.why);
      } else if (!b && since >= task.secs) end(task, env, L, true);
      return 'Wind and rain test: watch the lamp';
    }
    const tested = (env.save.prog[task.id] ?? []).includes(0);
    const shelter = PARTS.map((n, p) => `${n}: ${NAME[L.parts[p]]}`).join(' · ');
    if (L.carry) return `Carrying a ${NAME[L.carry]} panel · ${shelter}`;
    return tested ? `Rebuild the shelter, then test it · ${shelter}` : 'Test the web shelter: start the wind and rain';
  },
  weather(task, game) {
    const L = live<Live>(game as never, task.id, fresh);
    return L.test >= 0 ? { rain: 1, storm: 0.7 } : null;
  },
  View: ShelterView,
};

function Panel({ mat, roof }: { mat: ShelterMat; roof?: boolean }) {
  const size: [number, number, number] = roof ? [3.2, 0.08, 2.6] : [0.08, 2, 2.6];
  if (mat === 'web')
    return (
      <mesh position-y={roof ? 0 : 0}>
        <boxGeometry args={size} />
        <meshBasicMaterial color="#f4f4f0" wireframe transparent opacity={0.7} />
      </mesh>
    );
  return (
    <mesh material={M(mat === 'reed' ? '#c8b46a' : '#a8603a', { map: mat === 'brick' ? 'stone' : 'planks' })} castShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

function ShelterView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<ShelterTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const st = steps(task, data);
  const done = st.includes(1);
  const [, setVer] = useState(0);
  const flame = useRef<THREE.Mesh>(null);
  const held = useRef<THREE.Group>(null);
  useFrame((s) => {
    setVer((v) => (v === L.ver ? v : L.ver));
    const f = flame.current;
    if (f) {
      f.visible = !L.out;
      const k = motion.reduced ? 1 : 1 + Math.sin(s.clock.elapsedTime * 9) * (L.test >= 0 ? 0.25 : 0.08);
      f.scale.set(1, k, 1);
    }
    const h = held.current;
    if (h) {
      h.visible = L.carry != null;
      h.position.set(player.pos.x + Math.sin(player.yaw) * 0.5, player.pos.y + 0.7, player.pos.z + Math.cos(player.yaw) * 0.5);
      h.rotation.y = player.yaw;
    }
  });
  // A finished shelter shows bricks and a reed roof after a reload.
  const parts: ShelterMat[] = done && L.parts.every((p) => p === 'web') ? ['reed', 'brick', 'brick'] : L.parts;
  const [x, z] = task.stand;
  const y = t.floorY(x, z);
  const [lx, lz] = lever(task);
  return (
    <group>
      <group position={[x, y, z]}>
        <mesh material={M('#9a7a52', { map: 'planks' })} position-y={0.4} castShadow>
          <boxGeometry args={[3, 0.8, 2.4]} />
        </mesh>
        <mesh material={M('#c8a050', { metal: 0.4 })} position-y={0.95}>
          <cylinderGeometry args={[0.15, 0.2, 0.3, 10]} />
        </mesh>
        <mesh ref={flame} position-y={1.25}>
          <coneGeometry args={[0.07, 0.3, 8]} />
          <meshBasicMaterial color="#ffd060" toneMapped={false} />
        </mesh>
        {!L.out && <pointLight position-y={1.3} intensity={4} distance={6} color="#ffc070" />}
        <group position-y={2.9}>
          <Panel mat={parts[0]} roof />
        </group>
        <group position={[-1.55, 1.9, 0]}>
          <Panel mat={parts[1]} />
        </group>
        <group position={[1.55, 1.9, 0]}>
          <Panel mat={parts[2]} />
        </group>
      </group>
      {L.carry &&
        PARTS.map((_, p) => {
          const [sx, sz] = slot(task, p);
          return (
            <group key={p} position={[sx, t.floorY(sx, sz), sz]} {...tap(() => act(`fit:${task.id}:${p}`))}>
              <Halo on={active} />
            </group>
          );
        })}
      {task.piles.map((p, k) => (
        <group key={k} position={[p.at[0], t.floorY(p.at[0], p.at[1]), p.at[1]]} {...tap(() => act(`take:${task.id}:${k}`))}>
          {[0, 1, 2].map((n) => (
            <group key={n} position={[0, 0.1 + n * 0.12, 0]} rotation-z={Math.PI / 2}>
              <group scale={[1, 0.5, 0.5]}>
                <Panel mat={p.mat} />
              </group>
            </group>
          ))}
          {st.includes(0) && !done && L.carry == null && <Halo on={active} />}
        </group>
      ))}
      <group position={[lx, t.floorY(lx, lz), lz]} {...tap(() => act(`test:${task.id}`))}>
        <mesh material={M('#6a6a72', { metal: 0.5 })} position-y={0.5}>
          <boxGeometry args={[0.5, 1, 0.5]} />
        </mesh>
        <mesh material={M('#b03a2e')} position={[0, 1.1, 0]} rotation-z={L.test >= 0 ? -0.6 : 0.6}>
          <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
        </mesh>
        {!done && L.carry == null && L.test < 0 && <Halo on={active} />}
      </group>
      <group ref={held}>{L.carry && <group scale={[1, 0.4, 0.4]} rotation-z={Math.PI / 2}><Panel mat={L.carry} /></group>}</group>
    </group>
  );
}
