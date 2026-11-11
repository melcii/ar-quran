// Surah Al-Mursalat: the winds sent forth (77:1-3, "By those sent forth
// one after another, and those that blow violently, and those that spread
// far and wide"; many explain these as winds). On a hilltop threshing
// floor, the grain has been threshed but is still mixed with chaff. Watch
// the flag on its pole: the wind comes and goes in gusts. Toss the grain up
// from the winnowing basket when the wind is just right: too calm and the
// chaff falls back with the grain; too strong and the grain blows away too;
// a steady breeze carries off the light chaff and lets the heavy grain fall
// clean. The hilltop is a game; winnowing is real. Nothing unseen is shown.
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { WinnowTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: WinnowTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.tosses }, (_, i) => i) : s.prog[task.id] ?? []);
/** The wind now, 0 (calm) to 1 (a strong gust): gusts that come and go. */
export const wind = (secs = performance.now() / 1000) => Math.min(1, Math.max(0, 0.48 + 0.3 * Math.sin(secs * 0.55) + 0.18 * Math.sin(secs * 1.7 + 1.3) + 0.06 * Math.sin(secs * 4.1)));
(globalThis as { __wind?: typeof wind }).__wind = wind;

export const Winnow: Mechanic<WinnowTask> = {
  total: (task) => task.tosses,
  uses(task, env) {
    if (doneOf(task, env.save).length >= task.tosses) return [];
    return [{ key: `winnow:${task.id}`, pos: env.v3(task.at), label: 'Winnow the grain', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.tosses) return;
    return `Clean tosses: ${d.length} of ${task.tosses} · watch the flag for a steady breeze`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    if (d.length < task.tosses) api.progress(task.id, d.length);
  },
  View: WinnowView,
  Panel: WinnowPanel,
};

function WinnowPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<WinnowTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [w, setW] = useState(wind());
  const [msg, setMsg] = useState('');
  useEffect(() => {
    const id = setInterval(() => setW(wind()), 100);
    return () => clearInterval(id);
  }, []);
  if (d.length >= task.tosses) return null;
  const word = w < task.lo ? 'calm' : w > task.hi ? 'a strong gust' : 'a steady breeze';
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a winnowing game; winnowing is real" />
      <Text style={st.cardTitle}>Winnow the grain</Text>
      <Text style={st.cardText}>{msg || 'Watch the wind. Toss the grain up when a steady breeze is blowing: the light chaff blows away and the heavy grain falls back clean.'}</Text>
      <View style={{ alignSelf: 'center', width: 200, height: 16, borderRadius: 8, backgroundColor: '#e8e0d0', overflow: 'hidden' }} accessibilityLabel={`The wind: ${word}`}>
        <View style={{ position: 'absolute', left: `${task.lo * 100}%` as never, width: `${(task.hi - task.lo) * 100}%` as never, top: 0, bottom: 0, backgroundColor: '#b8d8a0' }} />
        <View style={{ position: 'absolute', left: `${w * 100}%` as never, width: 4, top: 0, bottom: 0, backgroundColor: '#3a4a6a' }} />
      </View>
      <Text style={[st.cardText, { textAlign: 'center' }]}>{`The wind: ${word} · clean tosses ${d.length} of ${task.tosses}`}</Text>
      <View style={st.row}>
        <Pressable
          style={st.btn}
          accessibilityLabel="Toss the grain"
          onPress={() => {
            const now = wind();
            if (now < task.lo) {
              api.note(`${task.id}/calm`, d.length);
              setMsg('The air is too still: the chaff falls straight back down with the grain. Wait for the breeze.');
              return;
            }
            if (now > task.hi) {
              api.note(`${task.id}/gust`, d.length);
              setMsg('A strong gust! The grain blows away with the chaff. Wait for the wind to settle into a steady breeze.');
              return;
            }
            api.progress(task.id, d.length);
            setMsg(d.length + 1 >= task.tosses ? 'The grain is clean.' : 'The chaff streams away on the breeze and the clean grain falls back into the basket.');
            if (d.length + 1 >= task.tosses) onClose();
          }}
        >
          <Text style={st.btnText}>Toss the grain</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function WinnowView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<WinnowTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const left = d.length < task.tosses;
  const [x, z] = task.at;
  const flag = useRef<THREE.Group>(null);
  const chaff = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const w = wind();
    if (flag.current) {
      // The flag droops when calm and streams out in a gust.
      flag.current.rotation.z = w * 1.5;
      flag.current.rotation.y = Math.sin(clock.elapsedTime * (3 + w * 6)) * 0.15 * w;
    }
    if (chaff.current) chaff.current.children.forEach((c, k) => {
      const f = (clock.elapsedTime * (0.3 + w) + k * 0.17) % 1;
      c.position.set(f * 4 * w, 0.6 + Math.sin(f * 3 + k) * 0.3, (k % 3) * 0.2 - 0.2);
      c.visible = w > 0.15;
    });
  });
  return (
    <group position={[x, t.floorY(x, z), z]}>
      {/* The round threshing floor with the grain heap. */}
      <mesh material={M('#c8b48a', { map: 'stone' })} position-y={0.05}>
        <cylinderGeometry args={[2.4, 2.4, 0.1, 24]} />
      </mesh>
      <group {...(left ? tap(() => act(`winnow:${task.id}`)) : {})}>
        <mesh material={M('#d8b860')} position-y={0.25} scale={[1, 0.5 + 0.5 * (d.length / task.tosses), 1]}>
          <coneGeometry args={[0.8, 0.5, 14]} />
        </mesh>
        <mesh material={M('#a8784a')} position={[1, 0.18, 0.6]} rotation-x={0.4}>
          <cylinderGeometry args={[0.45, 0.3, 0.16, 14]} />
        </mesh>
        {left && <Halo on={active} />}
      </group>
      {/* The flag on its pole shows the wind. */}
      <mesh material={M('#6a4a2a')} position={[-2.8, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 3, 6]} />
      </mesh>
      <group ref={flag} position={[-2.8, 2.9, 0]}>
        <mesh material={M('#c84a3a', { side: 2 })} position-y={-0.55}>
          <planeGeometry args={[0.12, 1.1]} />
        </mesh>
      </group>
      <group ref={chaff}>
        {Array.from({ length: 9 }, (_, k) => (
          <mesh key={k} material={M('#e8d8a8')}>
            <boxGeometry args={[0.05, 0.02, 0.05]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
