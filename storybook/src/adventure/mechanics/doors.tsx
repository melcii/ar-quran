// Surah Al-Anbiya's own play: the hall of prayers answered (21:83-90). Three
// lecterns each hold a tablet with one verse in verified Arabic and its
// translation: the prayer of Ayyub, of Yunus and of Zakariyya. Three doors
// each carry a carved sign and a few words about a situation (a long
// hardship, deep darkness at sea, old age and a wish for an heir). Read a
// tablet, carry it, and set it in the door whose situation it answers: the
// door opens on the verse that tells how the prayer was answered. The wrong
// door does not take it. No prophet is shown or played: the doors and
// tablets stand for the verses, and the player only carries the text.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { DoorsTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { carry: number | null };
const fresh = (): Live => ({ carry: null });

const opened = (task: DoorsTask, s: MechSave) => (s.done.includes(task.id) ? task.doors.map((_, j) => j) : s.prog[task.id] ?? []);

export const Doors: Mechanic<DoorsTask> = {
  total: (task) => task.doors.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const done = opened(task, env.save);
    const placed = done.map((j) => task.doors[j].tablet);
    const out = [];
    for (const [i, tb] of task.tablets.entries()) {
      if (placed.includes(i) || L.carry === i) continue;
      out.push({ key: `take:${task.id}:${i}`, pos: env.v3(tb.at), label: L.carry == null ? 'Take the prayer tablet and read it' : 'Swap for this prayer tablet', reach: 2.6, run: () => {
        L.carry = i;
        env.api.open({ kind: 'reading', reading: { title: 'The prayer on this tablet', refs: [tb.ref], note: 'This prayer is from the Quran. Carry the tablet to the door whose situation it answers.' } });
      } });
    }
    if (L.carry != null)
      for (const [j, d] of task.doors.entries()) {
        if (done.includes(j)) continue;
        // Doors are not on the wayfinder's list while carrying: matching them is the play.
        out.push({ key: `door|${task.id}|${j}`, pos: env.v3(d.at), label: 'Set the tablet in this door', reach: 2.8, run: () => {
          if (d.tablet !== L.carry) {
            env.api.note(`${task.id}/x`, j);
            env.api.hint(`This door is about ${d.situation.toLowerCase()} The prayer you carry does not answer it. Read the tablet again, or try another door.`);
            return;
          }
          L.carry = null;
          env.api.progress(task.id, j);
          env.api.open({ kind: 'reading', reading: d.reading });
        } });
      }
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const done = opened(task, env.save);
    for (const [j, d] of task.doors.entries()) {
      if (Math.hypot(d.at[0] - env.pp.x, d.at[1] - env.pp.z) < 4.5) return done.includes(j) ? 'This door is open: its prayer was answered' : `This door: ${d.situation}`;
    }
    return L.carry != null ? 'Carrying a prayer tablet: which door does it answer?' : `Doors opened: ${done.length} of ${task.doors.length}. Take a tablet from a lectern.`;
  },
  View: DoorsView,
};

function Emblem({ kind }: { kind: DoorsTask['doors'][number]['emblem'] }) {
  const carve = M('#c8b48e', { map: 'stone' });
  if (kind === 'waves')
    return (
      <group>
        {[0, 1, 2].map((k) => (
          <mesh key={k} material={M(['#2a3450', '#1e2840', '#141c30'][k])} position={[0, -k * 0.22, 0.02 * k]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.55 - k * 0.08, 0.06, 6, 20, Math.PI]} />
          </mesh>
        ))}
      </group>
    );
  if (kind === 'lamp')
    return (
      <group>
        <mesh material={carve} position-y={-0.15}>
          <cylinderGeometry args={[0.18, 0.28, 0.25, 10]} />
        </mesh>
        <mesh material={M('#ffe0a0', { emissive: '#ffb850', ei: 2 })} position-y={0.12}>
          <coneGeometry args={[0.08, 0.28, 8]} />
        </mesh>
      </group>
    );
  // A bent stem with one new leaf: a long hardship, borne with patience.
  return (
    <group>
      <mesh material={M('#7a6a50')} position={[0, -0.05, 0]} rotation-z={0.5}>
        <cylinderGeometry args={[0.03, 0.04, 0.7, 6]} />
      </mesh>
      <mesh material={M('#6aa040')} position={[0.18, 0.25, 0]} scale={[0.14, 0.06, 0.08]}>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
    </group>
  );
}

function Door({ d, y, open, active, onTap }: { d: DoorsTask['doors'][number]; y: number; open: boolean; active: boolean; onTap: () => void }) {
  const leaf = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const l = leaf.current;
    if (!l) return;
    const to = open ? -1.9 : 0;
    l.rotation.y = motion.reduced ? to : l.rotation.y + (to - l.rotation.y) * Math.min(1, dt * 2);
  });
  const stone = M('#d8c8a6', { map: 'stone' });
  return (
    <group position={[d.at[0], y, d.at[1]]} rotation-y={d.rot} {...tap(onTap)}>
      {[-1.15, 1.15].map((x) => (
        <mesh key={x} material={stone} position={[x, 1.6, 0]} castShadow>
          <boxGeometry args={[0.5, 3.2, 0.6]} />
        </mesh>
      ))}
      <mesh material={stone} position={[0, 3.45, 0]} castShadow>
        <boxGeometry args={[2.8, 0.5, 0.6]} />
      </mesh>
      <group position={[0, 3.45, 0.32]}>
        <Emblem kind={d.emblem} />
      </group>
      {/* The door leaf, hinged on the left. */}
      <group ref={leaf} position={[-0.9, 0, 0]}>
        <mesh material={M('#7a5232', { map: 'planks' })} position={[0.9, 1.5, 0]} castShadow>
          <boxGeometry args={[1.8, 3, 0.12]} />
        </mesh>
        <mesh material={M('#c8a050', { metal: 0.4 })} position={[0.9, 1.5, 0.08]}>
          <boxGeometry args={[0.7, 0.9, 0.03]} />
        </mesh>
      </group>
      {open && <pointLight position={[0, 1.6, -1.2]} intensity={8} distance={8} color="#ffd890" />}
      {!open && <Halo on={active} />}
    </group>
  );
}

function DoorsView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<DoorsTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const done = opened(task, data);
  const placed = done.map((j) => task.doors[j].tablet);
  const held = useRef<THREE.Group>(null);
  const [carry, setCarry] = useState<number | null>(null);
  useFrame(() => {
    if (L.carry !== carry) setCarry(L.carry);
    const h = held.current;
    if (!h) return;
    h.visible = L.carry != null;
    h.position.set(player.pos.x + Math.sin(player.yaw) * 0.45, player.pos.y + 0.6, player.pos.z + Math.cos(player.yaw) * 0.45);
    h.rotation.y = player.yaw;
  });
  const tablet = M('#efe4c8', { map: 'stone' });
  return (
    <group>
      {task.tablets.map((tb, i) => (
        <group key={i} position={[tb.at[0], t.floorY(tb.at[0], tb.at[1]), tb.at[1]]} {...tap(() => act(`take:${task.id}:${i}`))}>
          <mesh material={M('#7a5232', { map: 'planks' })} position-y={0.55} castShadow>
            <boxGeometry args={[0.18, 1.1, 0.18]} />
          </mesh>
          <mesh material={M('#7a5232', { map: 'planks' })} position-y={1.12} rotation-x={-0.5}>
            <boxGeometry args={[0.8, 0.06, 0.6]} />
          </mesh>
          {!placed.includes(i) && carry !== i && (
            <mesh material={tablet} position={[0, 1.2, 0.02]} rotation-x={-0.5}>
              <boxGeometry args={[0.55, 0.05, 0.42]} />
            </mesh>
          )}
          {!placed.includes(i) && carry !== i && <Halo on={active} />}
        </group>
      ))}
      {task.doors.map((d, j) => (
        <Door key={j} d={d} y={t.floorY(d.at[0], d.at[1])} open={done.includes(j)} active={active && carry != null} onTap={() => act(`door|${task.id}|${j}`)} />
      ))}
      <group ref={held}>
        <mesh material={tablet} rotation-x={-1.1}>
          <boxGeometry args={[0.5, 0.05, 0.38]} />
        </mesh>
      </group>
    </group>
  );
}
