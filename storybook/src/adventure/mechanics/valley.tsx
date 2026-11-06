// Surah Ar-Ra'd's own play: the storm valley. Clouds gather and a storm
// comes on its own; the child shelters under a rock overhang while the
// lightning flashes (13:12). The rain fills each valley by its own size: the
// small one holds a little, the wide one a lot (13:17, "valleys flow
// according to their capacity"). The torrent leaves foam on top. The child
// casts the foam off onto the bank, as the ayah says the foam is cast away
// while what benefits people remains. Each cleared valley then waters its
// field. Making the rain, or showing anything striking anyone, is never
// part of it; the storm simply comes and goes.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import { rng } from '../terrain';
import type { ValleyTask } from '../types';
import { live, type MechGame, type Mechanic } from './base';

type Foam = { x: number; z: number; v: number };
type Live = { phase: 'wait' | 'storm' | 'after'; t: number; fill: number[]; foam: Foam[][]; flash: number; nextFlash: number; outside: number; seed: number };

const SHELTER_R = 3.4;

function state(task: ValleyTask, game: MechGame, cleared: number[]): Live {
  return live<Live>(game, task.id, () => ({
    phase: 'wait',
    t: 0,
    fill: task.valleys.map((_, i) => (cleared.includes(i) ? 1 : 0.08)),
    foam: task.valleys.map(() => []),
    flash: 0,
    nextFlash: 3,
    outside: 0,
    seed: 1,
  }));
}

function spawnFoam(task: ValleyTask, L: Live, cleared: number[]) {
  const r = rng(13 + L.seed++);
  L.foam = task.valleys.map((v, i) => {
    if (cleared.includes(i)) return [];
    const n = Math.max(2, Math.round(v.cap / 2));
    return Array.from({ length: n }, () => {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * v.r * 0.7;
      return { x: v.at[0] + Math.cos(a) * d, z: v.at[1] + Math.sin(a) * d, v: 1 };
    });
  });
}

export const Valley: Mechanic<ValleyTask> = {
  total: (task) => task.valleys.length,
  weather(task, game) {
    const L = game.mech[task.id] as Live | undefined;
    if (!L) return null;
    if (L.phase === 'storm') return { rain: 1, storm: 0.85 };
    if (L.phase === 'wait' && L.t > 0) return { rain: 0, storm: Math.min(0.5, L.t / 8) };
    return { rain: 0, storm: 0 };
  },
  uses(task, env) {
    const L = state(task, env.game, env.prog);
    const out = [];
    if (L.phase !== 'after') out.push({ key: `go:${task.id}`, pos: env.v3(task.shelter), label: 'Shelter under the rock overhang', reach: 0, run: () => undefined });
    else
      task.valleys.forEach((v, i) => {
        const left = L.foam[i].filter((f) => f.v > 0).length;
        if (!left || env.prog.includes(i)) return;
        out.push({ key: `foam:${task.id}:${i}`, pos: env.v3(v.at), label: `Cast off the foam: ${v.label} (${left} left)`, reach: v.r + 2.8, run: () => {
          let best = -1;
          let bd = 1e9;
          L.foam[i].forEach((f, j) => {
            const d = Math.hypot(f.x - env.pp.x, f.z - env.pp.z);
            if (f.v > 0 && d < bd) {
              bd = d;
              best = j;
            }
          });
          if (best >= 0) L.foam[i][best].v = -1;
        } });
      });
    return out;
  },
  frame(task, env) {
    const L = state(task, env.game, env.prog);
    const dt = env.dt;
    const dShelter = Math.hypot(task.shelter[0] - env.pp.x, task.shelter[1] - env.pp.z);
    if (L.phase === 'wait') {
      if (dShelter < 26 || L.t > 0) L.t += dt;
      if (L.t > 0 && L.t < dt * 1.5) env.api.hint('Dark clouds are gathering over the valleys. Go and shelter under the rock overhang.');
      if (L.t > 8) {
        L.phase = 'storm';
        L.t = 0;
        L.outside = 0;
      }
      return L.t > 0 ? 'Clouds gathering: go to the shelter' : undefined;
    }
    if (L.phase === 'storm') {
      L.t += dt;
      L.nextFlash -= dt;
      L.flash = Math.max(0, L.flash - dt * 3);
      if (L.nextFlash <= 0) {
        L.flash = motion.reduced ? 0.4 : 1;
        L.nextFlash = 3.5 + ((L.t * 7.3) % 2.5);
        if (dShelter > SHELTER_R) env.tell(`${task.id}light`, 'Lightning! In a storm, shelter is the safe place to be. Go under the rock overhang until it passes.', 6);
      }
      if (dShelter > SHELTER_R) L.outside += dt;
      task.valleys.forEach((_, i) => (L.fill[i] = Math.min(1, L.fill[i] + dt / task.rain)));
      if (L.t >= task.rain) {
        L.phase = 'after';
        L.flash = 0;
        spawnFoam(task, L, env.prog);
        if (task.reading) env.api.open({ kind: 'reading', reading: task.reading });
        env.api.say(
          L.outside < 2
            ? 'The storm has passed, and you waited it out in shelter. Look at the valleys: each one filled by its own size, and the torrent has left foam floating on top. Cast the foam off onto the bank.'
            : 'The storm has passed. Next time, wait it out under the overhang. Look at the valleys: each one filled by its own size, and the torrent has left foam floating on top. Cast the foam off onto the bank.',
        );
      }
      return `Storm: ${Math.max(0, Math.ceil(task.rain - L.t))}s · ${dShelter > SHELTER_R ? 'go under the overhang' : 'sheltered'} · ${task.valleys.map((v, i) => `${v.label} ${Math.round(L.fill[i] * v.cap)}/${v.cap}`).join(' · ')}`;
    }
    // After the storm: foam slowly breaks up on its own too ("it vanishes"), much faster when cast off.
    const parts: string[] = [];
    task.valleys.forEach((v, i) => {
      if (env.prog.includes(i)) return;
      for (const f of L.foam[i]) if (f.v > 0) f.v -= dt / 150;
      const left = L.foam[i].filter((f) => f.v > 0).length;
      if (!left) {
        env.api.say(v.note);
        env.api.progress(task.id, i);
      } else parts.push(`${v.label}: ${left} foam`);
    });
    return parts.length ? `Holds by size: ${task.valleys.map((v) => `${v.label} ${v.cap}`).join(', ')} · ${parts.join(' · ')}` : undefined;
  },
  solve(task, api) {
    task.valleys.forEach((_, i) => api.progress(task.id, i));
  },
  View: ValleyView,
};

function ValleyView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<ValleyTask>['View']>>[0]) {
  const prog = data.prog[task.id] ?? [];
  const done = data.done.includes(task.id);
  const L = state(task, game, prog);
  const flash = useRef<THREE.AmbientLight>(null);
  const water = useRef<(THREE.Mesh | null)[]>([]);
  const foamRef = useRef<THREE.InstancedMesh>(null);
  const deep = useMemo(
    () =>
      task.valleys.map((v) => {
        const b = t.floorY(v.at[0], v.at[1]);
        const rim = Math.min(t.floorY(v.at[0] + v.r, v.at[1]), t.floorY(v.at[0] - v.r, v.at[1]), t.floorY(v.at[0], v.at[1] + v.r), t.floorY(v.at[0], v.at[1] - v.r));
        return { b, d: Math.max(0.4, rim - b - 0.15) };
      }),
    [task, t],
  );
  const foamGeo = useMemo(() => new THREE.IcosahedronGeometry(0.42, 1), []);
  const foamMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f0e6', roughness: 1 }), []);
  useFrame((st) => {
    if (flash.current) flash.current.intensity = L.flash * 2.6;
    task.valleys.forEach((v, i) => {
      const m = water.current[i];
      if (!m) return;
      const f = done || prog.includes(i) ? 1 : L.fill[i];
      m.position.y = deep[i].b + 0.05 + f * deep[i].d;
      const s = Math.max(0.05, Math.sqrt(f));
      m.scale.set(s, s, 1);
    });
    const im = foamRef.current;
    if (!im) return;
    const mx = new THREE.Matrix4();
    let n = 0;
    L.foam.forEach((list, i) => {
      const y = deep[i].b + 0.1 + L.fill[i] * deep[i].d;
      for (const [j, f] of list.entries()) {
        if (f.v <= 0 || n >= 80) continue;
        const bob = motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 1.4 + j) * 0.04;
        const s = 0.5 + f.v * 0.7;
        mx.makeScale(s, s * 0.35, s).setPosition(f.x, y + bob, f.z);
        im.setMatrixAt(n++, mx);
      }
    });
    im.count = n;
    im.instanceMatrix.needsUpdate = true;
  });
  const [hx, hz] = task.shelter;
  const hy = t.floorY(hx, hz);
  return (
    <group>
      <ambientLight ref={flash} intensity={0} color="#dfe6ff" />
      {/* The rock overhang. */}
      <group position={[hx, hy, hz]}>
        <mesh material={M('#8e8678', { map: 'stone' })} position={[0, 2.6, -0.6]} rotation-x={0.12} castShadow receiveShadow>
          <boxGeometry args={[5.2, 0.7, 4.2]} />
        </mesh>
        <mesh material={M('#8a8274', { map: 'stone' })} position={[-2.3, 1.3, -1.2]} castShadow>
          <boxGeometry args={[0.9, 2.6, 2.8]} />
        </mesh>
        <mesh material={M('#8a8274', { map: 'stone' })} position={[0, 1.3, -2.4]} castShadow>
          <boxGeometry args={[5, 2.6, 0.8]} />
        </mesh>
        <Halo on={active && L.phase !== 'after'} />
      </group>
      {task.valleys.map((v, i) => {
        const green = done || prog.includes(i);
        const [fx, fz] = v.field;
        return (
          <group key={i}>
            <mesh
              ref={(m) => {
                water.current[i] = m;
              }}
              position={[v.at[0], deep[i].b, v.at[1]]}
              rotation-x={-Math.PI / 2}
              renderOrder={2}
              {...tap(() => act(`foam:${task.id}:${i}`))}
            >
              <circleGeometry args={[v.r * 0.92, 40]} />
              <meshStandardMaterial color="#5a8c96" roughness={0.15} metalness={0.1} transparent opacity={0.82} />
            </mesh>
            <group position={[fx, t.floorY(fx, fz), fz]}>
              <mesh material={M(green ? '#6f9e3a' : '#a08a66', { rough: 1 })} position-y={0.06} receiveShadow>
                <boxGeometry args={[6, 0.12, 4]} />
              </mesh>
              {green &&
                [-2, -1, 0, 1, 2].map((k) => (
                  <mesh key={k} material={M('#4f8a2e')} position={[k * 1.1, 0.4, 0]} castShadow>
                    <coneGeometry args={[0.32, 0.7, 6]} />
                  </mesh>
                ))}
            </group>
          </group>
        );
      })}
      <instancedMesh ref={foamRef} args={[foamGeo, foamMat, 80]} frustumCulled={false} />
    </group>
  );
}
