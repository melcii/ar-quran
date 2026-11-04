// Surah Al-Hajj's own play: the pilgrimage verses in their order (22:26-29).
// A map model stands on a plinth: a plain ringed by hills with passes, and
// a plain round marker for the site of the House (no replica of the Kaaba
// or of the Sacred Mosque). Four carved stones lie around it, one for each
// step the verses give: the House made ready (22:26), the call and the
// travellers from every distant pass (22:27), remembering Allah and feeding
// the poor (22:28), then vows kept and the ancient House (22:29). Carry each
// stone to the model and set it in the next place; a stone set too early is
// handed back. Each stone set changes the model. The order taught is the
// order of these verses only; the rites of the Hajj in full are for the
// child's teachers, not this game.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { OrderTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { carry: number | null };
const fresh = (): Live => ({ carry: null });

const set = (task: OrderTask, s: MechSave) => (s.done.includes(task.id) ? task.stones.map((_, i) => i) : s.prog[task.id] ?? []);

const STONE = ['#d8c8a6', '#c8b07a', '#b8a888', '#e0d0b0'];
const R = 4.4;
const TOP = 0.95;

export const Order: Mechanic<OrderTask> = {
  total: (task) => task.stones.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const done = set(task, env.save);
    const out = [];
    for (const [i, s] of task.stones.entries()) {
      if (done.includes(i) || L.carry === i) continue;
      out.push({ key: `stone:${task.id}:${i}`, pos: env.v3(s.at), label: `${L.carry == null ? 'Pick up' : 'Swap for'} the stone: ${s.label}`, reach: 2.6, run: () => {
        L.carry = i;
        env.api.hint('Carry it to the map model and set it in the next place.');
      } });
    }
    if (L.carry != null)
      out.push({ key: `place:${task.id}`, pos: env.v3(task.model), label: 'Set the stone in the next place on the model', reach: R + 2.2, run: () => {
        const i = L.carry!;
        const next = done.length;
        L.carry = null;
        if (i !== next) {
          env.api.note(`${task.id}/x`, i);
          env.api.hint(`Not yet. The verses tell of something before "${task.stones[i].label}". The stone goes back to its place: find the one that comes first.`);
          return;
        }
        env.api.progress(task.id, i);
        env.api.open({ kind: 'reading', reading: task.stones[i].reading });
      } });
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const n = set(task, env.save).length;
    return L.carry != null ? `Carrying: ${task.stones[L.carry].label}` : `Stones set on the model: ${n} of ${task.stones.length}`;
  },
  View: OrderView,
};

/** Tiny lights that travel along the passes to the middle: "from every distant pass" (22:27). No people are shown. */
function Travellers({ on }: { on: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 18;
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((st) => {
    const m = ref.current;
    if (!m) return;
    const time = motion.reduced ? 0 : st.clock.elapsedTime;
    for (let k = 0; k < N; k++) {
      const pass = k % 6;
      const a = (pass / 6) * Math.PI * 2 + 0.3;
      const f = ((time * 0.07 + k * 0.37) % 1);
      const r = (R - 0.5) * (1 - f) + 0.8 * f;
      tmp.position.set(Math.sin(a) * r, TOP + 0.08, Math.cos(a) * r);
      tmp.scale.setScalar(on ? 1 : 0);
      tmp.updateMatrix();
      m.setMatrixAt(k, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <sphereGeometry args={[0.06, 6, 4]} />
      <meshBasicMaterial color="#fff2c0" toneMapped={false} />
    </instancedMesh>
  );
}

function Model({ n, onTap, active }: { n: number; onTap: () => void; active: boolean }) {
  const plinth = M('#b8a07a', { map: 'stone' });
  const hill = M('#a08a6a');
  const plain = M(n >= 1 ? '#e8dcbc' : '#c8b490');
  return (
    <group {...tap(onTap)}>
      <mesh material={plinth} position-y={TOP / 2 - 0.05} castShadow receiveShadow>
        <cylinderGeometry args={[R + 0.3, R + 0.5, TOP - 0.1, 32]} />
      </mesh>
      <mesh material={plain} position-y={TOP} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[R, 32]} />
      </mesh>
      {/* Hills around the rim, with six passes between them. */}
      {Array.from({ length: 12 }, (_, k) => {
        const a = ((k + 0.5) / 12) * Math.PI * 2;
        return k % 2 ? (
          <mesh key={k} material={hill} position={[Math.sin(a) * (R - 0.4), TOP + 0.3, Math.cos(a) * (R - 0.4)]} castShadow>
            <coneGeometry args={[0.7, 0.8, 7]} />
          </mesh>
        ) : null;
      })}
      {/* Paths from each pass to the middle. */}
      {Array.from({ length: 6 }, (_, k) => {
        const a = (k / 6) * Math.PI * 2 + 0.3;
        return (
          <mesh key={`p${k}`} material={M('#d8c49a')} position={[Math.sin(a) * (R / 2 + 0.3), TOP + 0.01, Math.cos(a) * (R / 2 + 0.3)]} rotation={[-Math.PI / 2, 0, -a]}>
            <planeGeometry args={[0.18, R - 1.2]} />
          </mesh>
        );
      })}
      {/* The site of the House: a plain round marker, not a picture of the Kaaba. */}
      <mesh material={M(n >= 1 ? '#f6f0e0' : '#9a8a70', { map: 'stone' })} position-y={TOP + 0.05}>
        <cylinderGeometry args={[0.55, 0.6, 0.1, 24]} />
      </mesh>
      {n === 0 &&
        [[0.3, 0.2], [-0.25, 0.35], [0.1, -0.4], [-0.35, -0.15]].map(([x, z], k) => (
          <mesh key={`d${k}`} material={M('#8a7a5a')} position={[x, TOP + 0.13, z]}>
            <dodecahedronGeometry args={[0.07, 0]} />
          </mesh>
        ))}
      <Travellers on={n >= 2} />
      {/* Food set out to share: "eat of them and feed the miserable and poor" (22:28). */}
      {n >= 3 &&
        Array.from({ length: 6 }, (_, k) => {
          const a = (k / 6) * Math.PI * 2;
          return (
            <group key={`b${k}`} position={[Math.sin(a) * 1.6, TOP, Math.cos(a) * 1.6]}>
              <mesh material={M('#a86a3a')} position-y={0.06}>
                <cylinderGeometry args={[0.16, 0.1, 0.1, 10]} />
              </mesh>
              <mesh material={M('#e0b050')} position-y={0.12}>
                <sphereGeometry args={[0.1, 8, 6]} />
              </mesh>
            </group>
          );
        })}
      {n >= 4 && (
        <mesh position-y={TOP + 0.04} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.8, 1.05, 40]} />
          <meshBasicMaterial color="#ffe8a8" transparent opacity={0.8} toneMapped={false} />
        </mesh>
      )}
      {/* The four places for the stones, along the front of the plinth. */}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={`s${k}`} material={M(k < n ? STONE[k] : '#6a5a46', { map: 'stone' })} position={[(k - 1.5) * 1.1, TOP * 0.55, R + 0.42]} castShadow>
          <boxGeometry args={[0.8, k < n ? 0.55 : 0.12, 0.3]} />
        </mesh>
      ))}
      <Halo on={active} />
    </group>
  );
}

function OrderView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<OrderTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const done = set(task, data);
  const held = useRef<THREE.Group>(null);
  const [carry, setCarry] = useState<number | null>(null);
  useFrame(() => {
    if (L.carry !== carry) setCarry(L.carry);
    const h = held.current;
    if (!h) return;
    h.visible = L.carry != null;
    h.position.set(player.pos.x + Math.sin(player.yaw) * 0.45, player.pos.y + 0.55, player.pos.z + Math.cos(player.yaw) * 0.45);
    h.rotation.y = player.yaw;
  });
  const [mx, mz] = task.model;
  return (
    <group>
      <group position={[mx, t.floorY(mx, mz), mz]}>
        <Model n={done.length} active={active && carry != null} onTap={() => act(`place:${task.id}`)} />
      </group>
      {task.stones.map((s, i) =>
        done.includes(i) || carry === i ? null : (
          <group key={i} position={[s.at[0], t.floorY(s.at[0], s.at[1]), s.at[1]]} {...tap(() => act(`stone:${task.id}:${i}`))}>
            <mesh material={M(STONE[i % 4], { map: 'stone' })} position-y={0.3} rotation-y={i} castShadow>
              <boxGeometry args={[0.8, 0.6, 0.3]} />
            </mesh>
            <Halo on={active && carry == null} />
          </group>
        ),
      )}
      <group ref={held}>
        {carry != null && (
          <mesh material={M(STONE[carry % 4], { map: 'stone' })} scale={0.6}>
            <boxGeometry args={[0.8, 0.6, 0.3]} />
          </mesh>
        )}
      </group>
    </group>
  );
}
