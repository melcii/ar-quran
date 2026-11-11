// Surah Al-Ma'arij: the known share (70:24-25, "those within whose wealth
// is a known right for the one who asks and the one who is deprived").
// The surah says people are anxious: impatient when hardship touches them,
// and holding back when good touches them (70:19-21), except those who are
// steady. Through the year, harvests come in to your storehouse: a big one,
// a poor one, a middling one. From each, set aside the known share, one
// basket in every ten, into the share jar by the door, whether the harvest
// is big or small. Too little is holding back; the share is known. The
// storehouse and its harvests are a game idea; no one is shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { PortionTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: PortionTask, s: MechSave) => (s.done.includes(task.id) ? task.harvests.map((_, i) => i) : s.prog[task.id] ?? []);
const nextOf = (task: PortionTask, d: number[]) => task.harvests.findIndex((_, i) => !d.includes(i));
const shareOf = (task: PortionTask, i: number) => Math.round(task.harvests[i].n / task.part);
const jarOf = (task: PortionTask, d: number[]) => d.reduce((a, i) => a + shareOf(task, i), 0);

export const Portion: Mechanic<PortionTask> = {
  total: (task) => task.harvests.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (nextOf(task, d) < 0) return [];
    return [{ key: `store:${task.id}`, pos: env.v3(task.at), label: 'A harvest has come in', reach: 3, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const i = nextOf(task, d);
    if (i < 0) return;
    return `Harvests: ${d.length} of ${task.harvests.length} · in the share jar: ${jarOf(task, d)} baskets`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = nextOf(task, d);
    if (i >= 0) api.progress(task.id, i);
  },
  View: PortionView,
  Panel: PortionPanel,
};

function PortionPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<PortionTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = nextOf(task, d);
  const [n, setN] = useState(0);
  const [msg, setMsg] = useState('');
  if (i < 0) return null;
  const h = task.harvests[i];
  const want = shareOf(task, i);
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a sharing game written for this app" />
      <Text style={st.cardTitle}>{h.what}</Text>
      <Text style={st.cardText}>{msg || `${h.n} baskets have come in. The known share is one basket in every ${task.part}. How many go to the share jar?`}</Text>
      <View style={[st.row, { alignItems: 'center' }]}>
        <Pressable style={st.btnGhost} accessibilityLabel="One less" onPress={() => setN(Math.max(0, n - 1))}>
          <Text style={st.btnGhostText}>−</Text>
        </Pressable>
        <Text style={[st.cardTitle, { minWidth: 60, textAlign: 'center' }]} accessibilityLabel={`Baskets for the share jar: ${n}`}>
          {n}
        </Text>
        <Pressable style={st.btnGhost} accessibilityLabel="One more" onPress={() => setN(n + 1)}>
          <Text style={st.btnGhostText}>+</Text>
        </Pressable>
      </View>
      <View style={st.row}>
        <Pressable
          style={st.btn}
          accessibilityLabel="Set the share aside"
          onPress={() => {
            if (n < want) {
              api.note(`${task.id}/less`, i);
              setMsg(h.n < 40 ? `It is a poor year, and it is tempting to hold back. But the share is known: one in every ${task.part} of ${h.n}.` : `That is less than the known share: one in every ${task.part} of ${h.n}.`);
              return;
            }
            if (n > want) {
              setMsg(`Giving more is good, but the known share is one in every ${task.part}: count again. You can always give more from your own hand later.`);
              return;
            }
            api.progress(task.id, i);
            setN(0);
            setMsg(`${want} baskets go into the share jar by the door, for anyone who asks and anyone in need.`);
            if (i + 1 >= task.harvests.length) onClose();
          }}
        >
          <Text style={st.btnText}>Set the share aside</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PortionView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<PortionTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const i = nextOf(task, d);
  const [x, z] = task.at;
  const [jx, jz] = task.jar;
  const jar = jarOf(task, d);
  const total = task.harvests.reduce((a, _, k) => a + shareOf(task, k), 0);
  return (
    <group>
      <group position={[x, t.floorY(x, z), z]} {...(i >= 0 ? tap(() => act(`store:${task.id}`)) : {})}>
        {/* The harvest baskets waiting at the storehouse door. */}
        {i >= 0 &&
          Array.from({ length: Math.min(12, Math.ceil(task.harvests[i].n / 5)) }, (_, k) => (
            <mesh key={k} material={M('#a8784a')} position={[(k % 4) * 0.6 - 0.9, 0.2 + Math.floor(k / 4) * 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.2, 0.36, 10]} />
            </mesh>
          ))}
        {i >= 0 && <Halo on={active} />}
      </group>
      <group position={[jx, t.floorY(jx, jz), jz]}>
        <mesh material={M('#b86a3a')} position-y={0.6} castShadow>
          <cylinderGeometry args={[0.45, 0.35, 1.2, 14]} />
        </mesh>
        {/* Grain rising in the jar as shares are set aside. */}
        <mesh material={M('#e8c870')} position-y={0.1 + (1.05 * jar) / Math.max(1, total)}>
          <cylinderGeometry args={[0.4, 0.4, 0.06, 14]} />
        </mesh>
      </group>
    </group>
  );
}
