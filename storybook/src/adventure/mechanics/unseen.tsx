// Surah Al-Haqqah: what you see and what you do not see (69:38-39, "So I
// swear by what you see, and what you do not see"). In an old stone
// workshop on the cliff, there are things that are really there but that no
// eye can see: wind blowing through a crack, a stone that pulls on iron,
// warmth left in a rock by the sun, the scent of a flower behind a screen.
// Each one is found only with the right tool from the bench: a ribbon, a
// compass, the back of your hand, your nose. These are things of this
// world; the unseen the Quran speaks of, like the angels and the Day, can
// never be found with tools, and is never shown. The workshop is a game.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { UnseenTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: UnseenTask, s: MechSave) => (s.done.includes(task.id) ? task.stations.map((_, i) => i) : s.prog[task.id] ?? []);
/** Which station's panel is open (shared by the 3D tap and the panel). */
const at: Record<string, number> = {};

export const Unseen: Mechanic<UnseenTask> = {
  total: (task) => task.stations.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    return task.stations.flatMap((s, i) =>
      d.includes(i)
        ? []
        : [{ key: `probe:${task.id}:${i}`, pos: env.v3(s.at), label: `Look closely: ${s.thing}`, reach: 2.4, run: () => {
            at[task.id] = i;
            env.api.panel(task);
          } }],
    );
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length < task.stations.length) return `Unseen things found: ${d.length} of ${task.stations.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.stations.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: UnseenView,
  Panel: UnseenPanel,
};

function UnseenPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<UnseenTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = at[task.id] ?? 0;
  const s = task.stations[i];
  const [msg, setMsg] = useState('');
  if (!s || d.includes(i)) return null;
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a finding game; these are things of this world" />
      <Text style={st.cardTitle}>{s.thing}</Text>
      <Text style={st.cardText}>{msg || 'Your eyes see nothing here. Which tool from the bench would show you what is really there?'}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {task.tools.map((tool, k) => (
          <Pressable
            key={k}
            style={st.btnGhost}
            accessibilityLabel={`Use the ${tool}`}
            onPress={() => {
              if (k !== s.tool) {
                api.note(`${task.id}/x`, i * 10 + k);
                setMsg(`You try the ${tool}, but it shows nothing here. Think about what might be hidden in this place.`);
                return;
              }
              api.progress(task.id, i);
              api.hint(s.shows);
              onClose();
            }}
          >
            <Text style={st.btnGhostText}>{tool}</Text>
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

/** What each station shows once found, by the tool that finds it. */
function Shown({ tool }: { tool: number }) {
  const r = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = r.current;
    if (!m) return;
    const tt = clock.elapsedTime;
    if (tool === 0) m.rotation.x = 1.2 + Math.sin(tt * 9) * 0.25; // a ribbon fluttering in the draught
    else if (tool === 1) m.rotation.y = 0.9; // the compass needle swung to the stone
  });
  if (tool === 0)
    return (
      <mesh ref={r} material={M('#d84a4a', { side: 2 })} position={[0, 1.3, 0.3]}>
        <planeGeometry args={[0.08, 0.6]} />
      </mesh>
    );
  if (tool === 1)
    return (
      <mesh ref={r} material={M('#c83a2a')} position={[0, 1.02, 0]}>
        <boxGeometry args={[0.04, 0.02, 0.4]} />
      </mesh>
    );
  return (
    <mesh position-y={1.4}>
      <sphereGeometry args={[0.12, 8, 6]} />
      <meshBasicMaterial color={tool === 2 ? '#ff9a50' : '#e8a0d0'} toneMapped={false} transparent opacity={0.8} />
    </mesh>
  );
}

function UnseenView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<UnseenTask>['View']>>[0]) {
  const d = doneOf(task, data);
  return (
    <group>
      {task.stations.map((s, i) => {
        const [x, z] = s.at;
        const found = d.includes(i);
        return (
          <group key={i} position={[x, t.floorY(x, z), z]} {...(!found ? tap(() => act(`probe:${task.id}:${i}`)) : {})}>
            {/* A plain stone plinth: nothing to see until the right tool shows it. */}
            <mesh material={M('#9a9488', { map: 'stone' })} position-y={0.45} castShadow>
              <boxGeometry args={[0.8, 0.9, 0.8]} />
            </mesh>
            {found && <Shown tool={s.tool} />}
            {!found && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
