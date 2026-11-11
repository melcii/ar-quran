// Surah Al-Jathiyah: a weather station on a headland (45:5, "in the
// alternation of night and day, and what Allah sends down from the sky of
// provision, and gives life thereby to the earth after its lifelessness, and
// in His directing of the winds are signs for a people who reason"). Keep the
// field ledger through one day: morning, noon and evening. At each reading,
// look at the wind vane (its arrow points into the wind) and the rain gauge,
// then write down where the wind comes from and how much rain fell. The panel
// never tells you: you have to look. The day moves on after each reading, the
// wind turns and the rain comes. The station and ledger are a game idea.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { motion } from '@/ark/shared';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { StationTask } from '../types';
import { LOOKS } from '../worlds/common';
import { live, type Mechanic, type MechSave } from './base';

type Live = { k: number };
const fresh = (): Live => ({ k: 0 });
const RAIN = ['None', 'A little', 'Full'];
const TIME: Record<StationTask['readings'][number]['time'], string> = { morning: 'Morning', noon: 'Noon', evening: 'Evening' };

const all = (task: StationTask) => task.readings.length * 2;
const doneOf = (task: StationTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
/** The reading the day is at: the first with an entry still to write. */
const phase = (task: StationTask, d: number[]) => {
  const k = task.readings.findIndex((_, j) => !d.includes(j * 2) || !d.includes(j * 2 + 1));
  return k < 0 ? task.readings.length : k;
};
const windAt = (task: StationTask, k: number) => task.readings[Math.min(k, task.readings.length - 1)];

export const Station: Mechanic<StationTask> = {
  total: all,
  uses(task, env) {
    if (phase(task, doneOf(task, env.save)) >= task.readings.length) return [];
    return [{ key: `station:${task.id}`, pos: env.v3(task.at), label: 'Write the field ledger', reach: 3, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const k = phase(task, d);
    live<Live>(env.game, task.id, fresh).k = k;
    if (k < task.readings.length) return `${TIME[task.readings[k].time]} reading · ledger entries: ${d.length} of ${all(task)}`;
  },
  look(task, data) {
    const k = phase(task, doneOf(task, data));
    if (k >= task.readings.length) return undefined;
    const time = task.readings[k].time;
    return time === 'morning' ? LOOKS.morning : time === 'noon' ? { ...LOOKS.desert, sun: [0.2, 0.9, -0.3] } : LOOKS.dusk;
  },
  weather(task, game) {
    const L = live<Live>(game, task.id, fresh);
    if (L.k >= task.readings.length) return null;
    const r = task.readings[L.k].rain;
    return r ? { rain: r === 2 ? 1 : 0.45, storm: 0 } : null;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: all(task) }, (_, j) => j).find((j) => !d.includes(j));
    if (i != null) api.progress(task.id, i);
  },
  View: StationView,
  Panel: StationPanel,
};

function StationPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<StationTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const k = phase(task, d);
  const [msg, setMsg] = useState('Look at the wind vane and the rain gauge beside the desk, then write what you see.');
  if (k >= task.readings.length) return null;
  const r = task.readings[k];
  const windDone = d.includes(k * 2);
  const rainDone = d.includes(k * 2 + 1);
  const after = (both: boolean) => {
    if (!both) return;
    if (k + 1 < task.readings.length) setMsg(`${TIME[r.time]} is written. Close the ledger and wait: the day moves on to ${TIME[task.readings[k + 1].time].toLowerCase()}. Look again before the next reading.`);
    else onClose();
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a weather station game written for this app" />
      <Text style={st.cardTitle}>{`Field ledger: ${TIME[r.time]}`}</Text>
      {task.readings.slice(0, k).map((p, j) => (
        <Text key={j} style={[st.cardText, { fontSize: 13, lineHeight: 18 }]}>{`${TIME[p.time]}: wind from ${task.landmarks[p.wind].name}; rain: ${RAIN[p.rain].toLowerCase()}`}</Text>
      ))}
      <Text style={[st.cardText, { fontSize: 14 }]}>{msg}</Text>
      {!windDone && (
        <>
          <Text style={[st.cardText, { fontSize: 14 }]}>Where does the wind come from? (The vane’s arrow points into the wind.)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {task.landmarks.map((l, i) => (
              <Pressable
                key={i}
                style={st.btnGhost}
                accessibilityLabel={`Wind from ${l.name}`}
                onPress={() => {
                  if (i !== r.wind) {
                    api.note(`${task.id}/x`, k * 2);
                    setMsg('Look at the vane again: which way does its arrow point?');
                    return;
                  }
                  api.progress(task.id, k * 2);
                  setMsg(`Written: wind from ${l.name}.`);
                  after(rainDone);
                }}
              >
                <Text style={st.btnGhostText}>{`From ${l.name}`}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      {!rainDone && (
        <>
          <Text style={[st.cardText, { fontSize: 14 }]}>How much rain is in the gauge?</Text>
          <View style={st.row}>
            {RAIN.map((name, i) => (
              <Pressable
                key={i}
                style={st.btnGhost}
                accessibilityLabel={`Rain: ${name}`}
                onPress={() => {
                  if (i !== r.rain) {
                    api.note(`${task.id}/x`, k * 2 + 1);
                    setMsg('Look at the glass gauge again: how high is the water in it?');
                    return;
                  }
                  api.progress(task.id, k * 2 + 1);
                  setMsg(`Written: rain, ${name.toLowerCase()}.`);
                  after(windDone);
                }}
              >
                <Text style={st.btnGhostText}>{name}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StationView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<StationTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const k = phase(task, d);
  const r = windAt(task, k);
  const [x, z] = task.at;
  const y = t.floorY(x, z);
  const vane = useRef<THREE.Group>(null);
  const water = useRef<THREE.Mesh>(null);
  const lv = useRef(0);
  useFrame((s, dt) => {
    const l = task.landmarks[r.wind].at;
    // The arrow points into the wind: toward where it comes from, with a little flutter.
    const want = Math.atan2(l[0] - (x + 1.6), l[1] - z) + (motion.reduced ? 0 : Math.sin(s.clock.elapsedTime * 3) * 0.06);
    const v = vane.current;
    if (v) v.rotation.y += Math.atan2(Math.sin(want - v.rotation.y), Math.cos(want - v.rotation.y)) * Math.min(1, dt * 2);
    const target = k >= task.readings.length ? 0.2 : r.rain / 2;
    lv.current += (target - lv.current) * Math.min(1, dt * (motion.reduced ? 10 : 0.6));
    const w = water.current;
    if (w) {
      w.scale.y = Math.max(0.02, lv.current);
      w.position.y = 0.05 + (0.7 * w.scale.y) / 2;
    }
  });
  return (
    <group position={[x, y, z]} {...tap(() => act(`station:${task.id}`))}>
      {/* The ledger desk */}
      <mesh material={M('#8a6a44', { map: 'planks' })} position-y={0.85} rotation-x={-0.2} castShadow>
        <boxGeometry args={[1.2, 0.08, 0.8]} />
      </mesh>
      <mesh material={M('#6a4a2a')} position-y={0.42}>
        <boxGeometry args={[0.12, 0.84, 0.12]} />
      </mesh>
      <mesh material={M('#f0e2c0')} position-y={0.92} rotation-x={-0.2}>
        <boxGeometry args={[0.7, 0.02, 0.5]} />
      </mesh>
      {/* The wind vane on its mast */}
      <group position={[1.6, 0, 0]}>
        <mesh material={M('#5a5a64', { metal: 0.6, rough: 0.4 })} position-y={1.5}>
          <cylinderGeometry args={[0.04, 0.05, 3, 6]} />
        </mesh>
        <group ref={vane} position-y={3.05}>
          <mesh material={M('#b83a2a')} position-z={0.5} rotation-x={Math.PI / 2}>
            <coneGeometry args={[0.12, 0.4, 6]} />
          </mesh>
          <mesh material={M('#3a3a44')}>
            <boxGeometry args={[0.04, 0.04, 1.2]} />
          </mesh>
          <mesh material={M('#3a3a44')} position-z={-0.55}>
            <boxGeometry args={[0.02, 0.36, 0.3]} />
          </mesh>
        </group>
      </group>
      {/* The rain gauge: a glass tube on a post, filling with what fell */}
      <group position={[-1.3, 0.8, 0.2]}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.16, 0.8, 12, 1, true]} />
          <meshStandardMaterial color="#d8e8f0" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={water}>
          <cylinderGeometry args={[0.14, 0.14, 0.7, 12]} />
          <meshStandardMaterial color="#4a8ab8" />
        </mesh>
        <mesh material={M('#6a4a2a')} position-y={-0.6}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
        </mesh>
      </group>
      {k < task.readings.length && <Halo on={active} />}
    </group>
  );
}
