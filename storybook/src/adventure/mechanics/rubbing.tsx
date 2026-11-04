// Surah Al-Hijr's own play: mapping the carved valley. The cliffs hold
// doorways carved into the rock, each with its own carved pattern over the
// door. Stand at a doorway, press paper to the carving and keep still while
// the rubbing comes through. Then, at the map table, fit each rubbing onto
// the map at the place where its doorway is, using the landmarks drawn on
// the map and your memory of the valley. The ayahs say the people of al-Hijr
// carved houses in the mountains and felt secure (15:82), and that the ruins
// lie on a road people still travel, as a sign (15:76-77). No one is shown,
// and what happened to them is read, never pictured.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { RubbingTask } from '../types';
import { live, type Mechanic } from './base';

type Live = { at: number; k: number };

export const GLYPH: Record<RubbingTask['doors'][number]['pattern'], string> = { diamond: '◆', ring: '◯', bars: '|||', steps: '▟', sun: '✺' };
const NAME: Record<RubbingTask['doors'][number]['pattern'], string> = { diamond: 'diamond', ring: 'ring', bars: 'three bars', steps: 'steps', sun: 'sun' };

const rubbed = (task: RubbingTask, s: { prog: Record<string, number[]> }) => s.prog[`${task.id}/r`] ?? [];

export const Rubbing: Mechanic<RubbingTask> = {
  total: (task) => task.doors.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, () => ({ at: -1, k: 0 }));
    const got = rubbed(task, env.save);
    const out = [];
    task.doors.forEach((d, i) => {
      if (got.includes(i)) return;
      out.push({ key: `rub:${task.id}:${i}`, pos: env.v3(d.at), label: L.at === i ? 'Keep still: the rubbing is coming through' : `Take a rubbing: ${d.label}`, reach: 2.6, run: () => {
        L.at = i;
        L.k = 0;
        env.api.hint('Press the paper to the carving and keep still.');
      } });
    });
    if (got.length > env.prog.length) out.push({ key: `map:${task.id}`, pos: env.v3(task.table), label: 'Fit your rubbings onto the map', reach: 3.2, run: () => env.api.panel(task) });
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, () => ({ at: -1, k: 0 }));
    const got = rubbed(task, env.save);
    if (L.at >= 0) {
      const d = task.doors[L.at];
      const near = Math.hypot(d.at[0] - env.pp.x, d.at[1] - env.pp.z) < 3;
      if (!near) {
        L.at = -1;
        env.tell(`${task.id}moved`, 'You moved away, and the rubbing smudged. Go back and keep still while you rub.', 4);
      } else if (!env.still) {
        L.k = Math.max(0, L.k - env.dt * 2);
        env.tell(`${task.id}still`, 'Keep still while the rubbing comes through.', 4);
      } else {
        L.k += env.dt;
        if (L.k >= task.secs) {
          env.api.note(`${task.id}/r`, L.at);
          env.api.hint(`You have a rubbing of the ${NAME[d.pattern]} pattern from ${d.label}. Remember where you found it.`);
          L.at = -1;
        } else return `Rubbing: ${Math.round((L.k / task.secs) * 100)}%`;
      }
    }
    return `Rubbings: ${got.length} of ${task.doors.length} · on the map: ${env.prog.length}`;
  },
  solve(task, api) {
    task.doors.forEach((_, i) => api.progress(task.id, i));
  },
  View: RubbingView,
  Panel: MapPanel,
};

function Carving({ pattern }: { pattern: RubbingTask['doors'][number]['pattern'] }) {
  const m = M('#b89a78', { map: 'stone' });
  switch (pattern) {
    case 'diamond':
      return (
        <mesh material={m} rotation-z={Math.PI / 4}>
          <boxGeometry args={[0.5, 0.5, 0.12]} />
        </mesh>
      );
    case 'ring':
      return (
        <mesh material={m}>
          <torusGeometry args={[0.3, 0.07, 8, 20]} />
        </mesh>
      );
    case 'bars':
      return (
        <group>
          {[-0.3, 0, 0.3].map((x) => (
            <mesh key={x} material={m} position-x={x}>
              <boxGeometry args={[0.12, 0.6, 0.12]} />
            </mesh>
          ))}
        </group>
      );
    case 'steps':
      return (
        <group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} material={m} position={[-0.25 + i * 0.25, -0.2 + i * 0.12, 0]}>
              <boxGeometry args={[0.24, 0.2 + i * 0.24, 0.12]} />
            </mesh>
          ))}
        </group>
      );
    case 'sun':
      return (
        <group>
          <mesh material={m}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 14]} />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} material={m} rotation-z={(i / 8) * Math.PI * 2} position={[Math.cos((i / 8) * Math.PI * 2) * 0.34, Math.sin((i / 8) * Math.PI * 2) * 0.34, 0]}>
              <boxGeometry args={[0.16, 0.05, 0.1]} />
            </mesh>
          ))}
        </group>
      );
  }
}

function RubbingView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<RubbingTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, () => ({ at: -1, k: 0 }));
  const got = rubbed(task, data);
  const paper = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const p = paper.current;
    if (!p) return;
    p.visible = L.at >= 0;
    if (L.at >= 0) {
      const d = task.doors[L.at];
      p.position.set(d.at[0] + Math.sin(d.rot) * 0.2, t.floorY(d.at[0], d.at[1]) + 3.1, d.at[1] + Math.cos(d.rot) * 0.2);
      p.rotation.y = d.rot;
      (p.material as THREE.MeshStandardMaterial).color.setScalar(0.75 + Math.min(1, L.k / task.secs) * 0.25);
    }
  });
  const [tx, tz] = task.table;
  return (
    <group>
      {task.doors.map((d, i) => (
        <group key={i} position={[d.at[0], t.floorY(d.at[0], d.at[1]), d.at[1]]} rotation-y={d.rot} {...tap(() => act(`rub:${task.id}:${i}`))}>
          {/* The carved front: a rock face, a dark doorway and the pattern over it. */}
          <mesh material={M('#c8a888', { map: 'stone' })} position={[0, 2.4, -0.5]} castShadow receiveShadow>
            <boxGeometry args={[4.2, 4.8, 1]} />
          </mesh>
          <mesh material={M('#2a1e16')} position={[0, 1.1, -0.02]}>
            <boxGeometry args={[1.3, 2.2, 0.06]} />
          </mesh>
          <mesh material={M('#b89a78', { map: 'stone' })} position={[0, 2.35, 0.02]}>
            <boxGeometry args={[1.9, 0.18, 0.2]} />
          </mesh>
          <group position={[0, 3.1, 0.06]}>
            <Carving pattern={d.pattern} />
          </group>
          {!got.includes(i) && <Halo on={active} />}
        </group>
      ))}
      <mesh ref={paper}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial color="#f4eedc" side={THREE.DoubleSide} />
      </mesh>
      <group position={[tx, t.floorY(tx, tz), tz]} {...tap(() => act(`map:${task.id}`))}>
        <mesh material={M('#7a5a3a', { map: 'planks' })} position-y={0.8} castShadow>
          <boxGeometry args={[2, 0.1, 1.3]} />
        </mesh>
        <mesh material={M('#efe2c0')} position-y={0.86}>
          <boxGeometry args={[1.7, 0.02, 1.05]} />
        </mesh>
        {[-0.85, 0.85].map((x) =>
          [-0.5, 0.5].map((z) => (
            <mesh key={`${x}${z}`} material={M('#5a3a24')} position={[x, 0.4, z]}>
              <boxGeometry args={[0.1, 0.8, 0.1]} />
            </mesh>
          )),
        )}
        <Halo on={active && got.length > (data.prog[task.id] ?? []).length} />
      </group>
    </group>
  );
}

function MapPanel({ task, data, api, width, portrait, onClose }: Parameters<NonNullable<Mechanic<RubbingTask>['Panel']>>[0]) {
  const got = rubbed(task, data);
  const placed = data.prog[task.id] ?? [];
  const [pick, setPick] = useState<number | null>(null);
  const [msg, setMsg] = useState('Choose a rubbing, then tap the place on the map where you found it.');
  const size = portrait ? 290 : 320;
  const all = [...task.doors.map((d) => d.at), ...task.marks.map((m) => m.at)];
  const xs = all.map((p) => p[0]);
  const zs = all.map((p) => p[1]);
  const x0 = Math.min(...xs) - 6;
  const z0 = Math.min(...zs) - 6;
  const span = Math.max(Math.max(...xs) - x0 + 6, Math.max(...zs) - z0 + 6);
  const at = (p: [number, number]) => ({ left: ((p[0] - x0) / span) * size, top: ((p[1] - z0) / span) * size });
  const tryPlace = (spot: number) => {
    if (pick == null) {
      setMsg('First choose one of your rubbings.');
      return;
    }
    if (spot === pick) {
      api.progress(task.id, spot);
      setMsg(`Yes: the ${NAME[task.doors[spot].pattern]} doorway is ${task.doors[spot].label}.`);
      setPick(null);
    } else setMsg(`Not there. Think about where you stood when you took the ${NAME[task.doors[pick].pattern]} rubbing, and which landmarks were near it.`);
  };
  return (
    <View style={[st.card, { width } as never, st.cardTall]}>
      <ScrollView style={{ maxHeight: portrait ? 560 : 500 }} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
        <ContentLabel kind="activity" extra="a mapping game written for this app" />
        <Text style={st.small}>{msg}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {got
            .filter((i) => !placed.includes(i))
            .map((i) => (
              <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Rubbing: ${NAME[task.doors[i].pattern]}`} style={[st.tile, pick === i && st.tilePick]} onPress={() => setPick(i)}>
                <Text style={[st.tileText, { fontSize: 22, textAlign: 'center' }]}>{GLYPH[task.doors[i].pattern]}</Text>
              </Pressable>
            ))}
        </View>
        <View style={{ width: size, height: size, backgroundColor: '#efe2c0', borderRadius: 12, borderWidth: 1, borderColor: '#cbb894' }}>
          {task.marks.map((m, i) => (
            <Text key={`m${i}`} style={[st.small, { position: 'absolute', ...at(m.at), transform: [{ translateX: -30 }, { translateY: -8 }], width: 60, textAlign: 'center' }]}>
              {m.label}
            </Text>
          ))}
          {task.doors.map((d, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={placed.includes(i) ? `Map place ${i + 1}: ${NAME[d.pattern]}` : `Map place ${i + 1}`}
              onPress={() => !placed.includes(i) && tryPlace(i)}
              style={{ position: 'absolute', ...at(d.at), transform: [{ translateX: -18 }, { translateY: -18 }], width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#8a6a44', backgroundColor: placed.includes(i) ? '#e8d4a0' : '#fff8e8', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={st.tileText}>{placed.includes(i) ? GLYPH[d.pattern] : i + 1}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={st.row}>
        <Pressable style={st.btn} onPress={onClose} accessibilityRole="button">
          <Text style={st.btnText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}
