// Surah Al-Ahzab's own play: a true wall (33:70, "speak words of appropriate
// justice", words that are straight and sound). In a mason's yard a short
// wall stands on a sloping footing. Lay it course by course from the stone
// piles: some stones are thicker on one side and tip the wall, some are flat.
// Watch the plumb line and the level: if the wall leans too far, the top
// stone slides off. Finish with the wall standing true. The wall is only a
// picture for straight, sound words; the verse is read.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { PlumbTask } from '../types';
import { live, type Mechanic, type MechSave, type MechUse } from './base';

type Live = { stones: number[]; carry: number | null; ver: number };
const fresh = (): Live => ({ stones: [], carry: null, ver: 0 });

const built = (task: PlumbTask, s: MechSave) => s.done.includes(task.id);
export const lean = (task: PlumbTask, L: Live) => task.tilt0 + L.stones.reduce((a, k) => a + task.piles[k].wedge, 0);
const says = (d: number) => (d === 0 ? 'standing true' : `leaning ${Math.abs(d)}° to the ${d > 0 ? 'right' : 'left'}`);

export const Plumb: Mechanic<PlumbTask> = {
  total: () => 1,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const out: MechUse[] = [];
    if (built(task, env.save)) return out;
    task.piles.forEach((p, k) => {
      if (L.carry === k) return;
      out.push({ key: `take:${task.id}:${k}`, pos: env.v3(p.at), label: L.carry == null ? `Pick up a ${p.label}` : `Swap it for a ${p.label}`, reach: 2.4, run: () => {
        L.carry = k;
        L.ver++;
      } });
    });
    if (L.carry != null)
      out.push({ key: `lay:${task.id}`, pos: env.v3(task.wall), label: `Lay the ${task.piles[L.carry].label} as the next course`, reach: 3.2, run: () => {
        L.stones.push(L.carry!);
        L.carry = null;
        L.ver++;
        const d = lean(task, L);
        if (Math.abs(d) > task.limit) {
          L.stones.pop();
          env.api.note(`${task.id}/x`, L.stones.length);
          env.api.hint(`The wall leaned ${Math.abs(d)}° and the new stone slid off. Look at the plumb line: pick a stone that tips the wall back the other way.`);
          return;
        }
        if (L.stones.length >= task.courses) {
          if (d === 0) {
            env.api.set(`${task.id}/s`, [...L.stones]);
            env.api.progress(task.id, 0);
            return;
          }
          L.stones.pop();
          env.api.note(`${task.id}/x`, L.stones.length);
          env.api.hint(`The wall is full height but it is ${says(d)}, so the top course was lifted off again. Choose the last stone so the wall stands true.`);
        }
      } });
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    if (built(task, env.save)) return;
    const c = L.carry != null ? ` · carrying a ${task.piles[L.carry].label}` : '';
    return `Courses laid: ${L.stones.length} of ${task.courses} · the wall is ${says(lean(task, L))}${c}`;
  },
  View: PlumbView,
};

/** A stone course: a block whose top is tipped by its wedge. */
function Course({ wedge, w, color }: { wedge: number; w: number; color: string }) {
  const a = (wedge * Math.PI) / 180;
  return (
    <group>
      <mesh material={M(color, { map: 'stone' })} position-y={0.22} castShadow receiveShadow>
        <boxGeometry args={[w, 0.4, 0.7]} />
      </mesh>
      {wedge !== 0 && (
        <mesh material={M(color, { map: 'stone' })} position={[0, 0.42 + Math.abs(Math.tan(a)) * w * 0.25, 0]} rotation-z={-a}>
          <boxGeometry args={[w, 0.06 + Math.abs(Math.tan(a)) * w * 0.5, 0.7]} />
        </mesh>
      )}
    </group>
  );
}

function PlumbView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<PlumbTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  const held = useRef<THREE.Group>(null);
  const bubble = useRef<THREE.Mesh>(null);
  const done = built(task, data);
  // A finished wall shows straight after a reload.
  const stones = done && L.stones.length < task.courses ? data.prog[`${task.id}/s`] ?? [] : L.stones;
  useFrame(() => {
    setVer((v) => (v === L.ver ? v : L.ver));
    const h = held.current;
    if (h) {
      h.visible = L.carry != null;
      h.position.set(player.pos.x + Math.sin(player.yaw) * 0.6, player.pos.y + 0.7, player.pos.z + Math.cos(player.yaw) * 0.6);
      h.rotation.y = player.yaw;
    }
  });
  const [wx, wz] = task.wall;
  const y = t.floorY(wx, wz);
  // Stack the courses, each tipped by everything below it.
  let ang = (task.tilt0 * Math.PI) / 180;
  let px = 0;
  let py = 0.3;
  const placed = stones.map((k, i) => {
    const g = { x: px, y: py, a: ang, k, i };
    const w = (task.piles[k].wedge * Math.PI) / 180;
    px += -Math.sin(ang) * 0.45;
    py += Math.cos(ang) * 0.45;
    ang += w;
    return g;
  });
  const d = done ? 0 : lean(task, L);
  const topX = px;
  const topY = py;
  return (
    <group>
      <group position={[wx, y, wz]} rotation-y={task.rot} {...tap(() => act(`lay:${task.id}`))}>
        {/* The sloping footing. */}
        <mesh material={M('#8a7a62', { map: 'stone' })} position-y={0.15} rotation-z={-(task.tilt0 * Math.PI) / 180} receiveShadow>
          <boxGeometry args={[3.4, 0.3, 1]} />
        </mesh>
        {placed.map((g) => (
          <group key={g.i} position={[g.x, g.y, 0]} rotation-z={-g.a}>
            <Course wedge={task.piles[g.k].wedge} w={3} color={g.i % 2 ? '#c8b490' : '#b8a480'} />
          </group>
        ))}
        {/* The plumb line: a post with an arm, a string hanging straight down and a bob. */}
        <group position={[2.4, 0, 0.5]}>
          <mesh material={M('#6a4a2e')} position-y={1.8}>
            <cylinderGeometry args={[0.05, 0.06, 3.6, 6]} />
          </mesh>
          <mesh material={M('#6a4a2e')} position={[-0.9, 3.55, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.035, 0.035, 1.8, 6]} />
          </mesh>
          <mesh position={[-1.75, 2.1, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 2.9, 4]} />
            <meshBasicMaterial color="#f4ead0" />
          </mesh>
          <mesh material={M('#b08a40', { metal: 0.6 })} position={[-1.75, 0.6, 0]} rotation-x={Math.PI}>
            <coneGeometry args={[0.08, 0.2, 10]} />
          </mesh>
        </group>
        {/* A level on top of the wall: the bubble slides with the lean. */}
        <group position={[topX, topY + 0.05, 0.3]} rotation-z={-(d * Math.PI) / 180}>
          <mesh material={M('#c8a050', { metal: 0.3 })}>
            <boxGeometry args={[1.2, 0.1, 0.12]} />
          </mesh>
          <mesh ref={bubble} position={[Math.max(-0.5, Math.min(0.5, -d * 0.06)), 0.06, 0.04]}>
            <sphereGeometry args={[0.05, 10, 8]} />
            <meshBasicMaterial color={d === 0 ? '#9ae07a' : '#e8f4c0'} toneMapped={false} />
          </mesh>
        </group>
        {!done && L.carry != null && <Halo on={active} />}
      </group>
      {task.piles.map((p, k) => (
        <group key={k} position={[p.at[0], t.floorY(p.at[0], p.at[1]), p.at[1]]} rotation-y={task.rot} {...tap(() => act(`take:${task.id}:${k}`))}>
          {[0, 1, 2].map((n) => (
            <group key={n} position={[0, n * 0.5, 0]} scale={0.45}>
              <Course wedge={p.wedge} w={3} color="#c8b490" />
            </group>
          ))}
          {!done && L.carry !== k && <Halo on={active} />}
        </group>
      ))}
      <group ref={held}>{L.carry != null && <group scale={0.25}><Course wedge={task.piles[L.carry].wedge} w={3} color="#c8b490" /></group>}</group>
    </group>
  );
}
