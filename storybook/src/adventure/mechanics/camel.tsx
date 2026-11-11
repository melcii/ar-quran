// Surah Al-Ghashiyah: look at the camel, how it is made (88:17-20, "Do
// they not look at the camels, how they are created? And at the sky, how it
// is raised? And at the mountains, how they are set firm? And at the earth,
// how it is spread out?"). At a desert well among the dunes, a camel rests.
// Look closely at it: its long double eyelashes, its nostrils that can
// close, its hump, its broad padded feet, the tough pads on its knees and
// chest. Say what each is for. Then the wind gets up and a sandstorm
// blows in: the camel kneels and shuts its eyes and nostrils, and you must
// shelter on the side of it away from the wind. The well is a game; camels
// and the ways they are made for the desert are real.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type * as THREE from 'three';
import { motion } from '@/ark/shared';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { CamelTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { still: number };
const fresh = (): Live => ({ still: 0 });
const doneOf = (task: CamelTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.parts.length + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
const looked = (task: CamelTask, d: number[]) => task.parts.every((_, i) => d.includes(i));
/** The calm side of the camel: downwind of it. */
export const lee = (task: CamelTask): [number, number] => {
  const l = Math.hypot(task.wind[0], task.wind[1]) || 1;
  return [task.at[0] + (task.wind[0] / l) * 1.7, task.at[1] + (task.wind[1] / l) * 1.7];
};

export const Camel: Mechanic<CamelTask> = {
  total: (task) => task.parts.length + 1,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (looked(task, d)) return [];
    return [{ key: `camel:${task.id}`, pos: env.v3(task.at), label: 'Look closely at the camel', reach: 3, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (!looked(task, d)) return `Looked at closely: ${d.length} of ${task.parts.length} parts of the camel`;
    if (d.includes(task.parts.length)) return;
    const S = live<Live>(env.game, task.id, fresh);
    const [lx, lz] = lee(task);
    const safe = Math.hypot(env.pp.x - lx, env.pp.z - lz) < 1.5;
    if (safe && env.still) S.still += env.dt;
    else S.still = 0;
    if (S.still >= task.secs) {
      env.api.progress(task.id, task.parts.length);
      env.api.hint('The storm blows over. The camel opens its eyes, shakes the sand from its coat and gets up.');
      return;
    }
    env.tell(`${task.id}/storm`, 'A sandstorm is blowing in! The camel kneels and closes its eyes and nostrils. Shelter on the side of it away from the wind, and keep still.', 30);
    return safe ? 'Sheltering behind the camel: keep still…' : 'Sandstorm! Shelter on the side of the camel away from the wind';
  },
  weather(task, game) {
    const s = (game as unknown as { mech: Record<string, unknown> }).mech[`${task.id}/storm`];
    return s ? { rain: 0, storm: 1 } : null;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: task.parts.length + 1 }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: CamelView,
  Panel: CamelPanel,
};

function CamelPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<CamelTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [part, setPart] = useState(-1);
  const [msg, setMsg] = useState('');
  // The uses in a fixed mixed-up order, so they do not sit beside their parts.
  const uses = useMemo(() => task.parts.map((_, i) => i).sort((a, b) => ((a * 7 + 3) % 11) - ((b * 7 + 3) % 11)), [task]);
  if (looked(task, d)) return null;
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a looking game; these are real features of camels" />
      <Text style={st.cardTitle}>How is the camel made?</Text>
      <Text style={st.cardText}>{msg || (part < 0 ? 'Choose a part of the camel to look at closely.' : `What are its ${task.parts[part].name} for?`)}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {task.parts.map((p, i) =>
          d.includes(i) ? null : (
            <Pressable key={i} style={part === i ? st.btn : st.btnGhost} accessibilityLabel={`Look at its ${p.name}`} onPress={() => { setPart(i); setMsg(''); }}>
              <Text style={part === i ? st.btnText : st.btnGhostText}>{p.name}</Text>
            </Pressable>
          ),
        )}
      </View>
      {part >= 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {uses.map((u) =>
            d.includes(u) ? null : (
              <Pressable
                key={u}
                style={st.btnGhost}
                accessibilityLabel={`For ${task.parts[u].use}`}
                onPress={() => {
                  if (u !== part) {
                    api.note(`${task.id}/x`, part * 10 + u);
                    setMsg(`Look again at its ${task.parts[part].name}. How would they help in the desert?`);
                    return;
                  }
                  api.progress(task.id, part);
                  setMsg(`Yes: its ${task.parts[part].name} are for ${task.parts[part].use}.`);
                  setPart(-1);
                  if (task.parts.filter((_, k) => !d.includes(k)).length <= 1) {
                    onClose();
                  }
                }}
              >
                <Text style={st.btnGhostText}>{task.parts[u].use}</Text>
              </Pressable>
            ),
          )}
        </View>
      )}
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CamelView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<CamelTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const storm = looked(task, d) && !d.includes(task.parts.length);
  // The weather hook reads this flag: the storm blows while you shelter.
  game.mech[`${task.id}/storm`] = storm || undefined;
  const [x, z] = task.at;
  const yaw = Math.atan2(task.wind[0], task.wind[1]) + Math.PI / 2;
  const kneel = storm;
  const sand = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!sand.current) return;
    sand.current.visible = storm;
    if (!storm) return;
    const l = Math.hypot(task.wind[0], task.wind[1]) || 1;
    sand.current.children.forEach((c, k) => {
      const f = (clock.elapsedTime * (motion.reduced ? 0.2 : 0.6) + k * 0.071) % 1;
      const side = ((k * 37) % 13) / 13 - 0.5;
      c.position.set((task.wind[0] / l) * (f * 16 - 8) - (task.wind[1] / l) * side * 10, 0.3 + ((k * 17) % 7) * 0.25, (task.wind[1] / l) * (f * 16 - 8) + (task.wind[0] / l) * side * 10);
    });
  });
  const coat = M('#c8a070');
  return (
    <group position={[x, t.floorY(x, z), z]}>
      <group rotation-y={yaw} {...(!looked(task, d) ? tap(() => act(`camel:${task.id}`)) : {})}>
        <group position-y={kneel ? -0.7 : 0}>
          <mesh material={coat} position-y={1.6} castShadow>
            <boxGeometry args={[1.8, 0.8, 0.7]} />
          </mesh>
          <mesh material={coat} position={[0, 2.1, 0]}>
            <sphereGeometry args={[0.42, 10, 8]} />
          </mesh>
          <mesh material={coat} position={[1.05, 2.1, 0]} rotation-z={-0.6}>
            <boxGeometry args={[0.3, 1, 0.3]} />
          </mesh>
          <mesh material={coat} position={[1.45, 2.55, 0]}>
            <boxGeometry args={[0.55, 0.28, 0.3]} />
          </mesh>
        </group>
        {(kneel ? [] : [[-0.65, 0.2], [-0.65, -0.2], [0.65, 0.2], [0.65, -0.2]]).map(([lx, lz], k) => (
          <mesh key={k} material={coat} position={[lx, 0.62, lz]}>
            <boxGeometry args={[0.16, 1.24, 0.16]} />
          </mesh>
        ))}
        {!looked(task, d) && <Halo on={active} />}
      </group>
      <group ref={sand}>
        {Array.from({ length: 24 }, (_, k) => (
          <mesh key={k} material={M('#e0c890')}>
            <boxGeometry args={[0.3, 0.04, 0.04]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
