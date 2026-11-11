// Surah Al-Jumu'ah (Friday): leave trade at the call (62:9-10, "When the
// call is made for the prayer on Friday, hasten to the remembrance of Allah
// and leave trade ... and when the prayer has ended, disperse in the land
// and seek from the bounty of Allah"). It is Friday morning and you keep a
// fruit stall in the market. Customers (never shown) ask for things; give
// each the right one. In the middle of a sale, the call for the Friday
// prayer is heard (shown as words: no voice is made). Close the stall and
// go to the mosque, even with a customer waiting. After the prayer, go back
// and open the stall again. The market and its customers are a game idea;
// no one is shown, and the prayer itself is not played.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { FridayTask } from '../types';
import type { Mechanic, MechSave } from './base';

// Progress: sales before the call 0..S-1, closing at the call S, the prayer
// S+1, sales after S+2..2S+1.
const all = (task: FridayTask) => task.sales * 2 + 2;
const doneOf = (task: FridayTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const stage = (task: FridayTask, d: number[]) => {
  const S = task.sales;
  const n = Array.from({ length: all(task) }, (_, i) => i).findIndex((i) => !d.includes(i));
  if (n < 0) return { k: 'done' as const, n };
  if (n < S) return { k: 'morning' as const, n };
  if (n === S) return { k: 'call' as const, n };
  if (n === S + 1) return { k: 'prayer' as const, n };
  return { k: 'after' as const, n };
};

export const Friday: Mechanic<FridayTask> = {
  total: all,
  uses(task, env) {
    const d = doneOf(task, env.save);
    const s = stage(task, d);
    if (s.k === 'done') return [];
    if (s.k === 'prayer')
      return [{ key: `mosque:${task.id}`, pos: env.v3(task.mosque), label: 'Go in for the Friday prayer', reach: 3.4, run: () => {
        env.api.progress(task.id, task.sales + 1);
        env.api.open({ kind: 'reading', reading: { title: 'Leave trade', refs: [[62, 9], [62, 10]], note: 'When the call is made for the prayer on Friday, hurry to the remembrance of Allah and leave your trade. That is better for you, if you only knew. And when the prayer is over, spread out in the land and seek Allah’s bounty, and remember Allah often so that you may succeed.' } });
      } }];
    return [{ key: `stall:${task.id}`, pos: env.v3(task.stall), label: s.k === 'after' ? 'Open the stall again' : 'Keep the stall', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const s = stage(task, d);
    if (s.k === 'morning') return `Friday morning at the market · sold: ${s.n} of ${task.sales}`;
    if (s.k === 'call') return 'Back to the stall: a customer is waiting.';
    if (s.k === 'prayer') return 'The call has come: walk to the mosque.';
    if (s.k === 'after') return `After the prayer · sold: ${s.n - task.sales - 2} of ${task.sales}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const s = stage(task, d);
    if (s.k !== 'done') api.progress(task.id, s.n);
  },
  View: FridayView,
  Panel: FridayPanel,
};

function FridayPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<FridayTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const s = stage(task, d);
  const [msg, setMsg] = useState('');
  if (s.k === 'done' || s.k === 'prayer') return null;
  // Which customer is at the stall now.
  const q = s.k === 'after' ? s.n - task.sales - 2 + task.sales + 1 : s.n;
  const want = task.orders[q % task.orders.length];
  const called = s.k === 'call';
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a market game; the customers are fictional and not shown" />
      <Text style={st.cardTitle}>{called ? 'The call for the Friday prayer' : s.k === 'after' ? 'The stall, after the prayer' : 'Your stall on Friday morning'}</Text>
      {called && <Text style={[st.cardText, { fontWeight: '700' }]}>The call for the Friday prayer is heard across the market.</Text>}
      <Text style={st.cardText}>{msg || `A customer asks for ${task.goods[want]}.`}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {task.goods.map((g, k) => (
          <Pressable
            key={k}
            style={st.btnGhost}
            accessibilityLabel={`Sell ${g}`}
            onPress={() => {
              if (called) {
                api.note(`${task.id}/x`, k);
                setMsg('The call has come. "Hurry to the remembrance of Allah and leave trade" (62:9). The customer can come back after the prayer.');
                return;
              }
              if (k !== want) {
                setMsg(`That is ${g}, but they asked for ${task.goods[want]}.`);
                return;
              }
              api.progress(task.id, s.n);
              setMsg(`You hand over the ${g}.`);
              if (s.k === 'after' && s.n + 1 >= all(task)) onClose();
            }}
          >
            <Text style={st.btnGhostText}>{g}</Text>
          </Pressable>
        ))}
      </View>
      <View style={st.row}>
        {called && (
          <Pressable
            style={st.btn}
            accessibilityLabel="Close the stall"
            onPress={() => {
              api.progress(task.id, task.sales);
              api.hint('You cover the fruit and close the stall. Walk to the mosque.');
              onClose();
            }}
          >
            <Text style={st.btnText}>Close the stall</Text>
          </Pressable>
        )}
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const FRUIT = ['#7a3a2a', '#e8a040', '#6a8a3a', '#8a4a7a', '#c8a050'];

function FridayView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<FridayTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const s = stage(task, d);
  const shut = s.k === 'prayer';
  const [x, z] = task.stall;
  const [mx, mz] = task.mosque;
  return (
    <group>
      <group position={[x, t.floorY(x, z), z]} {...tap(() => act(`stall:${task.id}`))}>
        <mesh material={M('#8a6a44', { map: 'planks' })} position-y={0.45} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.9, 1]} />
        </mesh>
        {task.goods.map((_, k) => (
          <mesh key={k} material={M(FRUIT[k % FRUIT.length])} position={[-0.9 + k * (1.8 / Math.max(1, task.goods.length - 1)), 1, 0]} visible={!shut}>
            <sphereGeometry args={[0.2, 10, 8]} />
          </mesh>
        ))}
        {/* A cloth over the fruit while the stall is shut. */}
        <mesh material={M('#c8b090')} position-y={1.02} visible={shut}>
          <boxGeometry args={[2.4, 0.12, 1]} />
        </mesh>
        <mesh material={M('#d8664a')} position-y={2.1}>
          <boxGeometry args={[2.8, 0.08, 1.4]} />
        </mesh>
        {[-1.2, 1.2].map((px) => (
          <mesh key={px} material={M('#6a4a2a')} position={[px, 1.05, -0.45]}>
            <cylinderGeometry args={[0.05, 0.05, 2.1, 6]} />
          </mesh>
        ))}
        {s.k !== 'prayer' && s.k !== 'done' && <Halo on={active} />}
      </group>
      {s.k === 'prayer' && (
        <group position={[mx, t.floorY(mx, mz), mz]} {...tap(() => act(`mosque:${task.id}`))}>
          <Halo on={active} />
        </group>
      )}
    </group>
  );
}
