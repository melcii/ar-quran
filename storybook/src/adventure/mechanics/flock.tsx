// Surah Al-Fil: birds in flocks (105:3, "And He sent against them birds in
// flocks"). From a hill lookout above a dry valley at evening, flocks of
// birds stream past on their way to roost. Count each flock the way bird
// counters really do: there are too many to count one by one, so count a
// block of ten, see how many blocks the flock makes, and multiply. The
// lookout is a game; block counting is real. The army of the elephant and
// what befell it (105:1-5) are read only, never shown: the birds here are
// ordinary birds going home, and nothing is struck.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { FlockTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: FlockTask, s: MechSave) => (s.done.includes(task.id) ? task.flocks.map((_, i) => i) : s.prog[task.id] ?? []);
const W = 260;
const H = 150;
/** Where each block of ten birds sits in the sky (a loose stream, fixed per flock). */
const blocks = (n: number, seed: number) =>
  Array.from({ length: n }, (_, k) => {
    const cols = Math.ceil(Math.sqrt(n * 2));
    const c = k % cols;
    const r = Math.floor(k / cols);
    const j = Math.sin((k + 1) * 12.9898 + seed * 78.233) * 43758.5453;
    const jx = (j - Math.floor(j) - 0.5) * 10;
    return [18 + (c * (W - 36)) / Math.max(1, cols - 1) + jx, 22 + r * 34 + (c % 2) * 10] as const;
  });
/** The answers offered: the right count and two near misses, in a fixed shuffled order. */
const choices = (n: number, i: number) => {
  const right = n * 10;
  const opts = [right, right - 20, right + 30];
  return i % 3 === 0 ? opts : i % 3 === 1 ? [opts[1], opts[0], opts[2]] : [opts[2], opts[1], opts[0]];
};

export const Flock: Mechanic<FlockTask> = {
  total: (task) => task.flocks.length,
  uses(task, env) {
    if (doneOf(task, env.save).length >= task.flocks.length) return [];
    return [{ key: `count:${task.id}`, pos: env.v3(task.at), label: 'Count the flock', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.flocks.length) return;
    return `Flocks counted: ${d.length} of ${task.flocks.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.flocks.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: FlockView,
  Panel: FlockPanel,
};

/** One small bird, wings out, as seen against the sky. */
const bird = (x: number, y: number) => `M${x - 3} ${y} q 1.5 -2.4 3 0 q 1.5 -2.4 3 0`;

function FlockPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<FlockTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = task.flocks.findIndex((_, k) => !d.includes(k));
  const [marked, setMarked] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  if (i < 0) return null;
  const n = task.flocks[i];
  const B = blocks(n, i + 1);
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a bird-counting game; counting in blocks of ten is real" />
      <Text style={st.cardTitle}>{`Flock ${i + 1} of ${task.flocks.length}`}</Text>
      <Text style={st.cardText}>{msg || 'Too many birds to count one by one. Each little bunch is about ten birds: tap each bunch as you count it, then say how many birds there are.'}</Text>
      <View style={{ alignSelf: 'center', width: W, height: H, backgroundColor: '#f0c890', borderRadius: 8 }}>
        <Svg width={W} height={H} style={{ position: 'absolute' }}>
          {B.map(([bx, by], k) =>
            Array.from({ length: 10 }, (_, q) => {
              const a = (q / 10) * Math.PI * 2;
              const rr = 4 + (q % 3) * 3;
              return <Path key={`${k}-${q}`} d={bird(bx + Math.cos(a) * rr, by + Math.sin(a) * rr * 0.6)} stroke={marked.includes(k) ? '#8a3a1a' : '#2a2018'} strokeWidth={1.2} fill="none" />;
            }),
          )}
        </Svg>
        {B.map(([bx, by], k) => (
          <Pressable
            key={k}
            accessibilityLabel={`Bunch ${k + 1}`}
            onPress={() => {
              if (!marked.includes(k)) setMarked([...marked, k]);
              setMsg('');
            }}
            style={{ position: 'absolute', left: bx - 14, top: by - 12, width: 28, height: 24, borderRadius: 12, borderWidth: marked.includes(k) ? 2 : 0, borderColor: '#8a3a1a' }}
          />
        ))}
      </View>
      <Text style={[st.cardText, { textAlign: 'center' }]}>{`Bunches counted: ${marked.length}`}</Text>
      <View style={[st.row, { justifyContent: 'center' }]}>
        {choices(n, i).map((c) => (
          <Pressable key={c} style={st.btnGhost} accessibilityLabel={`About ${c} birds`} onPress={() => {
            if (c !== n * 10) {
              api.note(`${task.id}/x`, i * 1000 + c);
              setMsg(marked.length < n ? 'Count every bunch first: tap each one as you count it.' : `You counted ${marked.length} bunches of about ten. How many birds is that?`);
              return;
            }
            api.progress(task.id, i);
            setMarked([]);
            setMsg(i + 1 < task.flocks.length ? `${n} bunches of ten: about ${c} birds. Here comes the next flock.` : '');
            if (i + 1 >= task.flocks.length) {
              api.hint(`About ${task.flocks.reduce((a, b) => a + b, 0) * 10} birds in all, flock after flock, going home to roost.`);
              onClose();
            }
          }}>
            <Text style={st.btnGhostText}>{`About ${c} birds`}</Text>
          </Pressable>
        ))}
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FlockView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<FlockTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const all = d.length >= task.flocks.length;
  const [x, z] = task.at;
  const birds = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = birds.current;
    if (!g) return;
    g.children.forEach((b, k) => {
      const a = clock.elapsedTime * 0.25 + (k % 12) * 0.05 + Math.floor(k / 12) * 2.1;
      const R = 14 + (k % 5);
      b.position.set(Math.cos(a) * R, 9 + (k % 4) * 0.6 + Math.sin(clock.elapsedTime * 3 + k) * 0.15, Math.sin(a) * R - 10);
      b.rotation.y = -a;
    });
  });
  return (
    <group position={[x, t.floorY(x, z), z]}>
      <group {...(!all ? tap(() => act(`count:${task.id}`)) : {})}>
        {/* The lookout: a low stone seat and a tally post. */}
        <mesh material={M('#9a9080', { map: 'stone' })} position-y={0.25}>
          <boxGeometry args={[1.4, 0.5, 0.6]} />
        </mesh>
        <mesh material={M('#6a4a2a')} position={[0.9, 0.7, 0]}>
          <boxGeometry args={[0.12, 1.4, 0.12]} />
        </mesh>
        {d.map((k) => (
          <mesh key={k} material={M('#e8dcc0')} position={[0.97, 0.5 + k * 0.2, 0]}>
            <boxGeometry args={[0.02, 0.04, 0.14]} />
          </mesh>
        ))}
        {!all && <Halo on={active} />}
      </group>
      <group ref={birds}>
        {Array.from({ length: 36 }, (_, k) => (
          <mesh key={k} material={M('#2a2420', { side: 2 })}>
            <planeGeometry args={[0.35, 0.08]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
