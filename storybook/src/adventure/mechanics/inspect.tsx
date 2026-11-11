// Surah Al-Mutaffifin: those who give short measure (83:1-3, "Woe to
// those who give less than due: who, when they take a measure from people,
// take in full; but when they measure or weigh for them, give less"). In a
// busy covered market, each grain and oil stall keeps two measures: one it
// buys with and one it sells with. You carry the market's true measure, a
// stamped copper cup. At each stall, test both measures: pour your true
// measure into each and see whether it fills exactly, overflows (a small
// measure) or leaves room (a big one). Then say whether the stall is honest,
// or takes in full and gives short. The market is a game; no merchant is
// shown, and no one real is accused.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { InspectTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: InspectTask, s: MechSave) => (s.done.includes(task.id) ? task.stalls.map((_, i) => i) : s.prog[task.id] ?? []);
/** Which stall's panel is open (shared by the 3D tap and the panel). */
const at: Record<string, number> = {};
const honest = (s: InspectTask['stalls'][number]) => Math.abs(s.buy - 1) < 0.01 && Math.abs(s.sell - 1) < 0.01;
const result = (v: number) => (Math.abs(v - 1) < 0.01 ? 'fills it exactly to the brim' : v < 1 ? 'overflows: this measure holds less than the true one' : 'leaves room at the top: this measure holds more than the true one');

export const Inspect: Mechanic<InspectTask> = {
  total: (task) => task.stalls.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    return task.stalls.flatMap((s, i) =>
      d.includes(i)
        ? []
        : [{ key: `stall:${task.id}:${i}`, pos: env.v3(s.at), label: `Test the measures: ${s.what}`, reach: 2.6, run: () => {
            at[task.id] = i;
            env.api.panel(task);
          } }],
    );
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length < task.stalls.length) return `Stalls tested: ${d.length} of ${task.stalls.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.stalls.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: InspectView,
  Panel: InspectPanel,
};

function Cup({ v, poured }: { v: number; poured: boolean }) {
  // The stall's measure, drawn to its size, with the true measure poured in.
  const h = 60 * v;
  const fill = poured ? Math.min(60, h) : 0;
  return (
    <View style={{ width: 60, height: 76, justifyContent: 'flex-end', alignItems: 'center' }}>
      {poured && v < 0.99 && <View style={{ position: 'absolute', top: 76 - h - 10, width: 70, height: 8, borderRadius: 4, backgroundColor: '#d8b860' }} />}
      <View style={{ width: 44, height: h, borderWidth: 3, borderTopWidth: 0, borderColor: '#8a5a3a', justifyContent: 'flex-end' }}>
        <View style={{ height: fill - 3 > 0 ? fill - 3 : 0, backgroundColor: '#d8b860' }} />
      </View>
    </View>
  );
}

function InspectPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<InspectTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = at[task.id] ?? 0;
  const s = task.stalls[i];
  const [tested, setTested] = useState<{ buy: boolean; sell: boolean; i: number }>({ buy: false, sell: false, i });
  const [msg, setMsg] = useState('');
  if (!s || d.includes(i)) return null;
  const T = tested.i === i ? tested : { buy: false, sell: false, i };
  const judge = (says: boolean) => {
    if (!T.buy || !T.sell) {
      setMsg('Test both measures with your true cup before you decide.');
      return;
    }
    if (says !== honest(s)) {
      api.note(`${task.id}/x`, i);
      setMsg(says ? 'Look again at what happened when you poured your true measure into each one.' : 'Both measures held your true measure exactly. This stall is honest.');
      return;
    }
    api.progress(task.id, i);
    api.hint(says ? `The ${s.what} stall is honest: it buys and sells with the same true measure.` : `The ${s.what} stall buys with a big measure and sells with a small one: it takes in full and gives short.`);
    onClose();
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a market game; no real merchant is shown" />
      <Text style={st.cardTitle}>{`The ${s.what} stall`}</Text>
      <Text style={st.cardText}>
        {msg ||
          [
            T.buy ? `Into the buying measure, your true measure ${result(s.buy)}.` : 'Pour your true measure into the stall’s buying measure.',
            T.sell ? `Into the selling measure, it ${result(s.sell)}.` : 'Then into its selling measure.',
          ].join(' ')}
      </Text>
      <View style={[st.row, { justifyContent: 'center', alignItems: 'flex-end' }]}>
        <View style={{ alignItems: 'center' }}>
          <Cup v={s.buy} poured={T.buy} />
          <Pressable style={st.btnGhost} accessibilityLabel="Test the buying measure" onPress={() => setTested({ ...T, buy: true })}>
            <Text style={st.btnGhostText}>Test the buying measure</Text>
          </Pressable>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Cup v={s.sell} poured={T.sell} />
          <Pressable style={st.btnGhost} accessibilityLabel="Test the selling measure" onPress={() => setTested({ ...T, sell: true })}>
            <Text style={st.btnGhostText}>Test the selling measure</Text>
          </Pressable>
        </View>
      </View>
      <View style={st.row}>
        <Pressable style={st.btn} accessibilityLabel="Honest measures" onPress={() => judge(true)}>
          <Text style={st.btnText}>Honest measures</Text>
        </Pressable>
        <Pressable style={st.btn} accessibilityLabel="Takes in full, gives short" onPress={() => judge(false)}>
          <Text style={st.btnText}>Takes in full, gives short</Text>
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

function InspectView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<InspectTask>['View']>>[0]) {
  const d = doneOf(task, data);
  return (
    <group>
      {task.stalls.map((s, i) => {
        const [x, z] = s.at;
        const seen = d.includes(i);
        return (
          <group key={i} position={[x, t.floorY(x, z), z]} {...(!seen ? tap(() => act(`stall:${task.id}:${i}`)) : {})}>
            {/* The stall's two measures on its counter, each sized to what it really holds. */}
            {[s.buy, s.sell].map((v, k) => (
              <mesh key={k} material={M('#8a5a3a')} position={[k ? 0.35 : -0.35, 1.0 + 0.15 * v, 0]}>
                <cylinderGeometry args={[0.14 * Math.cbrt(v), 0.12 * Math.cbrt(v), 0.3 * v, 10]} />
              </mesh>
            ))}
            {seen && (
              <mesh material={M(honest(s) ? '#7ac04a' : '#c84a3a')} position={[0, 1.7, 0]}>
                <boxGeometry args={[0.3, 0.2, 0.04]} />
              </mesh>
            )}
            {!seen && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
