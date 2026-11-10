// Surah Al-Mulk: the birds above (67:19, "Do they not see the birds above
// them with wings spread and folding? None holds them up except the Most
// Merciful"). Lie on the hilltop and watch the birds circling overhead. One
// at a time, a bird is marked by a soft light. Watch it closely: is it
// gliding with its wings held out wide and still, or beating and folding
// them? Real birds do both: big birds soar on rising warm air with wings
// spread, and smaller ones beat their wings and fold them between beats.
// The birds and the hilltop are a game; the flying is real.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { motion } from '@/ark/shared';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { WingsTask } from '../types';
import type { Mechanic, MechSave } from './base';

/** Which way the marked bird flies in each round: 0 wings spread (gliding), 1 beating and folding. */
const SEQ = [0, 1, 1, 0, 1, 0, 0, 1];
const doneOf = (task: WingsTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.rounds }, (_, i) => i) : s.prog[task.id] ?? []);
const roundOf = (task: WingsTask, d: number[]) => Array.from({ length: task.rounds }, (_, i) => i).findIndex((i) => !d.includes(i));
const kindOf = (r: number) => SEQ[r % SEQ.length];

export const Wings: Mechanic<WingsTask> = {
  total: (task) => task.rounds,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (roundOf(task, d) < 0) return [];
    return [{ key: `watch:${task.id}`, pos: env.v3(task.at), label: 'Lie down and watch the birds', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const r = roundOf(task, d);
    if (r < 0) return;
    (globalThis as Record<string, unknown>).__wings = { round: r, kind: kindOf(r) };
    return `Birds watched: ${d.length} of ${task.rounds} · the marked bird has a soft light around it`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const r = roundOf(task, d);
    if (r >= 0) api.progress(task.id, r);
  },
  View: WingsView,
  Panel: WingsPanel,
};

function WingsPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<WingsTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const r = roundOf(task, d);
  const [msg, setMsg] = useState('');
  if (r < 0) return null;
  const say = (k: number) => {
    if (k !== kindOf(r)) {
      api.note(`${task.id}/x`, r);
      setMsg('Watch it a little longer. Are its wings still and wide, or do they beat and fold in?');
      return;
    }
    api.progress(task.id, r);
    setMsg(k === 0 ? 'Yes: it glides on wide, still wings, held up on the air.' : 'Yes: it beats its wings, folding them in between beats.');
    if (r + 1 >= task.rounds) onClose();
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid, { backgroundColor: 'rgba(255,250,240,0.9)' }]}>
      <ContentLabel kind="activity" extra="a bird-watching game; the flying is real" />
      <Text style={st.cardTitle}>{`Bird ${r + 1} of ${task.rounds}`}</Text>
      <Text style={st.cardText}>{msg || 'Look up at the bird with the soft light around it. How is it flying?'}</Text>
      <View style={st.row}>
        <Pressable style={st.btn} accessibilityLabel="Wings spread" onPress={() => say(0)}>
          <Text style={st.btnText}>Wings spread, gliding</Text>
        </Pressable>
        <Pressable style={st.btn} accessibilityLabel="Beating and folding" onPress={() => say(1)}>
          <Text style={st.btnText}>Beating and folding</Text>
        </Pressable>
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Bird({ cx, cy, cz, r, speed, phase, kind, marked, size }: { cx: number; cy: number; cz: number; r: number; speed: number; phase: number; kind: number; marked: boolean; size: number }) {
  const g = useRef<THREE.Group>(null);
  const L = useRef<THREE.Group>(null);
  const R = useRef<THREE.Group>(null);
  const mat = useMemo(() => M(kind === 0 ? '#4a3a30' : '#6a6a70'), [kind]);
  useFrame(({ clock }) => {
    const tt = clock.elapsedTime * (motion.reduced ? 0.4 : 1);
    const a = phase + tt * speed;
    const o = g.current;
    if (o) {
      o.position.set(cx + Math.cos(a) * r, cy + Math.sin(a * 2) * 0.8, cz + Math.sin(a) * r);
      o.rotation.y = -a;
      o.rotation.z = kind === 0 ? 0.25 : 0;
    }
    // Gliding: wings held out still. Beating: wings flap fast, then fold in for a moment.
    const beat = kind === 0 ? 0.05 : (tt * 2) % 3 < 2 ? Math.sin(tt * 18) * 0.7 : 1.3;
    if (L.current) L.current.rotation.z = Math.PI / 2 - beat;
    if (R.current) R.current.rotation.z = -Math.PI / 2 + beat;
  });
  return (
    <group ref={g} scale={size}>
      <mesh material={mat}>
        <boxGeometry args={[0.18, 0.12, 0.5]} />
      </mesh>
      <group ref={L} position={[0, 0.02, 0]} rotation-z={Math.PI / 2}>
        <mesh material={mat} position={[0, 0.45, 0]}>
          <boxGeometry args={[0.02, 0.9, 0.3]} />
        </mesh>
      </group>
      <group ref={R} position={[0, 0.02, 0]} rotation-z={-Math.PI / 2}>
        <mesh material={mat} position={[0, 0.45, 0]}>
          <boxGeometry args={[0.02, 0.9, 0.3]} />
        </mesh>
      </group>
      {marked && (
        <mesh>
          <sphereGeometry args={[0.9, 12, 8]} />
          <meshBasicMaterial color="#fff2c0" transparent opacity={0.25} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function WingsView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<WingsTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const r = roundOf(task, d);
  const [x, z] = task.at;
  const y = t.floorY(x, z);
  // A flock of others that keep circling, and the marked bird of this round.
  const flock = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ r: 8 + (i % 3) * 4, speed: 0.12 + (i % 4) * 0.05, phase: i * 0.9, kind: i % 2, h: 12 + (i % 3) * 3, size: i % 2 ? 0.7 : 1.3 })), []);
  return (
    <group>
      <group position={[x, y, z]} {...tap(() => act(`watch:${task.id}`))}>
        <mesh material={M('#6a7a4a')} position-y={0.03} receiveShadow>
          <boxGeometry args={[1.2, 0.06, 2]} />
        </mesh>
        {r >= 0 && <Halo on={active} />}
      </group>
      {flock.map((b, i) => (
        <Bird key={i} cx={x} cy={y + b.h} cz={z} r={b.r} speed={b.speed} phase={b.phase} kind={b.kind} marked={false} size={b.size} />
      ))}
      {r >= 0 && <Bird key={`m${r}`} cx={x} cy={y + 9} cz={z - 2} r={6} speed={0.18} phase={r * 1.7} kind={kindOf(r)} marked size={kindOf(r) === 0 ? 1.4 : 0.8} />}
    </group>
  );
}
