// Surah Al-Balad: the steep pass (90:11-16, "But he has not attempted the
// steep pass. And what will make you know what the steep pass is? It is
// freeing a neck, or feeding on a day of hunger an orphan who is a
// relative, or a poor person in the dust"). It is a hard, hungry year in a
// mountain village. In the storehouse at the bottom of the valley is one
// sack of grain, and up the steep, zig-zag pass live three households. Share
// the cups of grain fairly, the same for every person in each house; then
// carry each share up the steep pass yourself. The village is a game; no one
// is shown. The freeing of a slave (90:13) is read only, never played.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { RationTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: RationTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.homes.length + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
export const fairShare = (task: RationTask) => {
  const people = task.homes.reduce((a, h) => a + h.people, 0);
  return task.homes.map((h) => (task.cups * h.people) / people);
};

export const Ration: Mechanic<RationTask> = {
  total: (task) => task.homes.length + 1,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (!d.includes(0)) return [{ key: `ration:${task.id}`, pos: env.v3(task.at), label: 'Share out the grain', reach: 2.8, run: () => env.api.panel(task) }];
    return task.homes.flatMap((h, i) =>
      d.includes(i + 1)
        ? []
        : [{ key: `bring:${task.id}:${i}`, pos: env.v3(h.at), label: `Leave the grain for ${h.who}`, reach: 2.6, run: () => {
            env.api.progress(task.id, i + 1);
            env.api.hint(`You leave ${fairShare(task)[i]} cups of grain at the door of ${h.who}.`);
          } }],
    );
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length > task.homes.length) return;
    if (!d.includes(0)) return 'Share out the sack of grain at the storehouse';
    return `Shares carried up the steep pass: ${d.length - 1} of ${task.homes.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: task.homes.length + 1 }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: RationView,
  Panel: RationPanel,
};

function RationPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<RationTask>['Panel']>>[0]) {
  const [n, setN] = useState(task.homes.map(() => 0));
  const [msg, setMsg] = useState('');
  if (doneOf(task, data).includes(0)) return null;
  const used = n.reduce((a, b) => a + b, 0);
  const fair = fairShare(task);
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a sharing game written for this app" />
      <Text style={st.cardTitle}>A day of hunger</Text>
      <Text style={st.cardText}>{msg || `There are ${task.cups} cups of grain in the sack. Share them so every person in every house gets the same.`}</Text>
      {task.homes.map((h, i) => (
        <View key={i} style={[st.row, { alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={[st.cardText, { flex: 1 }]}>{`${h.who} (${h.people} ${h.people === 1 ? 'person' : 'people'})`}</Text>
          <Pressable style={st.btnGhost} accessibilityLabel={`One cup less for ${h.who}`} onPress={() => setN(n.map((v, k) => (k === i ? Math.max(0, v - 1) : v)))}>
            <Text style={st.btnGhostText}>−</Text>
          </Pressable>
          <Text style={[st.cardTitle, { minWidth: 36, textAlign: 'center' }]} accessibilityLabel={`Cups for ${h.who}: ${n[i]}`}>
            {n[i]}
          </Text>
          <Pressable style={st.btnGhost} accessibilityLabel={`One cup more for ${h.who}`} onPress={() => setN(n.map((v, k) => (k === i ? v + 1 : v)))}>
            <Text style={st.btnGhostText}>+</Text>
          </Pressable>
        </View>
      ))}
      <Text style={[st.cardText, { textAlign: 'center' }]}>{`Cups shared: ${used} of ${task.cups}`}</Text>
      <View style={st.row}>
        <Pressable
          style={st.btn}
          accessibilityLabel="Share it out"
          onPress={() => {
            if (used !== task.cups) {
              setMsg(used < task.cups ? `There are still ${task.cups - used} cups left in the sack. On a day of hunger, share it all.` : `You have only ${task.cups} cups to share.`);
              return;
            }
            const off = n.findIndex((v, i) => Math.abs(v - fair[i]) > 0.01);
            if (off >= 0) {
              api.note(`${task.id}/x`, off);
              const per = n.map((v, i) => v / task.homes[i].people);
              setMsg(`Count it per person: ${task.homes.map((h, i) => `in ${h.who}, ${Number(per[i].toFixed(1))} cups each`).join('; ')}. Make it the same for everyone.`);
              return;
            }
            api.progress(task.id, 0);
            api.hint(`${task.cups / task.homes.reduce((a, h) => a + h.people, 0)} cups for every person. Now carry each share up the steep pass.`);
            onClose();
          }}
        >
          <Text style={st.btnText}>Share it out</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RationView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<RationTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const shared = d.includes(0);
  const [x, z] = task.at;
  return (
    <group>
      <group position={[x, t.floorY(x, z), z]} {...(!shared ? tap(() => act(`ration:${task.id}`)) : {})}>
        <mesh material={M('#c8a870')} position-y={0.45} castShadow>
          <cylinderGeometry args={[0.45, 0.55, 0.9, 12]} />
        </mesh>
        {!shared && <Halo on={active} />}
      </group>
      {task.homes.map((h, i) => {
        const [hx, hz] = h.at;
        const left = d.includes(i + 1);
        return (
          <group key={i} position={[hx, t.floorY(hx, hz), hz]} {...(shared && !left ? tap(() => act(`bring:${task.id}:${i}`)) : {})}>
            <mesh material={M('#a89c88', { map: 'stone' })} position-y={0.08}>
              <boxGeometry args={[1.2, 0.16, 0.7]} />
            </mesh>
            {left && (
              <mesh material={M('#c8a870')} position-y={0.35}>
                <cylinderGeometry args={[0.2, 0.25, 0.4, 10]} />
              </mesh>
            )}
            {shared && !left && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
