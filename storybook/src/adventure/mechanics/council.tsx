// Surah Ash-Shura: "their affair is consultation among themselves" (42:38).
// A village of the game's own has one decision to make together. Walk to
// every household's door and hear what it needs (a lantern lights at each
// door you have heard). Then, at the long table in the square, choose a
// plan. A plan that leaves out a household is not agreed: the table shows
// whose need it misses. Only a plan that meets every need heard is agreed.
// The village, its families and its decision are an educational setting,
// not an event in the Quran. No one is shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { CouncilTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: CouncilTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.homes.length + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
const heard = (task: CouncilTask, d: number[]) => task.homes.map((_, i) => i).filter((i) => d.includes(i));

export const Council: Mechanic<CouncilTask> = {
  total: (task) => task.homes.length + 1,
  uses(task, env) {
    const d = doneOf(task, env.save);
    const out = task.homes.flatMap((h, i) =>
      d.includes(i)
        ? []
        : [{ key: `hear:${task.id}:${i}`, pos: env.v3(h.at), label: `Knock and listen: ${h.name}`, reach: 2.6, run: () => {
            env.api.progress(task.id, i);
            env.api.say(`${h.name}: ${h.need}`);
          } }],
    );
    if (!d.includes(task.homes.length)) out.push({ key: `table:${task.id}`, pos: env.v3(task.table), label: 'Sit at the council table', reach: 3, run: () => env.api.panel(task) });
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const n = heard(task, d).length;
    if (n < task.homes.length) return `Households heard: ${n} of ${task.homes.length}`;
    if (!d.includes(task.homes.length)) return 'Every household is heard. Go to the council table and agree a plan.';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.homes.findIndex((_, k) => !d.includes(k));
    api.progress(task.id, i >= 0 ? i : task.homes.length);
  },
  View: CouncilView,
  Panel: CouncilPanel,
};

function CouncilPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<CouncilTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const h = heard(task, d);
  const [shown, setShown] = useState<number | null>(null);
  const [msg, setMsg] = useState(h.length < task.homes.length ? '' : 'Every household has spoken. Which plan meets every need you heard?');
  if (h.length < task.homes.length)
    return (
      <View style={[st.card, { width } as never, st.cardMid]}>
        <ContentLabel kind="activity" extra="a village decision written for this app" />
        <Text style={st.cardText}>{`The table waits. ${task.homes.length - h.length} household${task.homes.length - h.length === 1 ? ' has' : 's have'} not been heard yet. A plan made without them would not be consultation. Walk to the doors with no lantern lit and listen first.`}</Text>
        <View style={st.row}>
          <Pressable style={st.btnGhost} onPress={onClose}>
            <Text style={st.btnGhostText}>Close</Text>
          </Pressable>
        </View>
      </View>
    );
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a village decision written for this app" />
      <Text style={st.cardText}>{msg}</Text>
      {task.homes.map((home, i) => {
        const ok = shown == null ? null : task.plans[shown].meets.includes(i);
        return <Text key={i} style={[st.cardText, { fontSize: 13, lineHeight: 18 }]}>{`${ok == null ? '•' : ok ? '✓' : '✗'} ${home.name}: ${home.need}`}</Text>;
      })}
      <View style={{ gap: 6 }}>
        {task.plans.map((p, k) => (
          <Pressable
            key={k}
            accessibilityLabel={`Plan: ${p.text}`}
            style={[st.btnGhost, { alignSelf: 'stretch' }]}
            onPress={() => {
              setShown(k);
              const miss = task.homes.filter((_, i) => !p.meets.includes(i));
              if (miss.length) {
                api.note(`${task.id}/x`, k);
                setMsg(`Not agreed: this plan leaves out ${miss.map((m) => m.name).join(' and ')}. Look at the list and try another plan.`);
                return;
              }
              api.progress(task.id, task.homes.length);
              onClose();
            }}
          >
            <Text style={[st.btnGhostText, { fontSize: 14 }]}>{p.text}</Text>
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

function CouncilView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<CouncilTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const h = heard(task, d);
  const agreed = d.includes(task.homes.length);
  const [tx, tz] = task.table;
  const ty = t.floorY(tx, tz);
  const seats = task.homes.length + 2;
  return (
    <group>
      {task.homes.map((home, i) => {
        const [x, z] = home.at;
        const y = t.floorY(x, z);
        const lit = h.includes(i);
        return (
          <group key={i} position={[x, y, z]} {...tap(() => act(`hear:${task.id}:${i}`))}>
            <mesh material={M('#5a3a22')} position-y={0.7}>
              <cylinderGeometry args={[0.05, 0.06, 1.4, 6]} />
            </mesh>
            <mesh position-y={1.5}>
              <sphereGeometry args={[0.16, 10, 8]} />
              {lit ? <meshBasicMaterial color="#ffd890" toneMapped={false} /> : <meshStandardMaterial color="#5a5048" />}
            </mesh>
            {!lit && <Halo on={active} />}
          </group>
        );
      })}
      <group position={[tx, ty, tz]} {...tap(() => act(`table:${task.id}`))}>
        <mesh material={M('#8a6a44', { map: 'planks' })} position-y={0.75} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.12, 1.3]} />
        </mesh>
        {[-1.8, 1.8].map((x) => (
          <mesh key={x} material={M('#6a4a2a')} position={[x, 0.36, 0]}>
            <boxGeometry args={[0.14, 0.72, 1]} />
          </mesh>
        ))}
        {/* One stool for each household, and two more: there is room for everyone. */}
        {Array.from({ length: seats }, (_, k) => {
          const side = k % 2 ? 1 : -1;
          const x = -1.6 + Math.floor(k / 2) * (3.2 / Math.max(1, Math.ceil(seats / 2) - 1));
          return (
            <mesh key={k} material={M('#7a5232')} position={[x, 0.25, side * 1.05]}>
              <cylinderGeometry args={[0.22, 0.22, 0.5, 8]} />
            </mesh>
          );
        })}
        {agreed && (
          <mesh material={M('#f0e2c0')} position={[0, 0.83, 0]} rotation-y={0.1}>
            <boxGeometry args={[0.7, 0.02, 0.5]} />
          </mesh>
        )}
        {h.length === task.homes.length && !agreed && <Halo on={active} />}
      </group>
    </group>
  );
}
