// Surah At-Taghabun: what is worth carrying (64:15-16, "Your wealth and
// your children are only a test ... so be mindful of Allah as much as you
// are able, and listen and obey and spend; that is better for yourselves").
// You are walking a long way over the hills to visit a family, and your bag
// is small. On the table are useful things and shining things. Choose what
// fits; then set off. On the way you will be thirsty, hungry and cold, and
// at the end you arrive as a guest. What you packed decides whether you can
// meet each need; if you cannot, walk back and pack again. The walk and the
// bag are a game idea; no one is shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { PackTask } from '../types';
import type { Mechanic, MechSave } from './base';

// Progress: each stop k, then (last) having packed at all.
const all = (task: PackTask) => task.stops.length + 1;
const doneOf = (task: PackTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const bagOf = (task: PackTask, s: MechSave) => s.prog[`${task.id}/bag`] ?? [];
const sizeOf = (task: PackTask, bag: number[]) => bag.reduce((a, i) => a + task.items[i].size, 0);
const packed = (task: PackTask, d: number[]) => d.includes(task.stops.length);
const nextStop = (task: PackTask, d: number[]) => task.stops.findIndex((_, k) => !d.includes(k));

export const Pack: Mechanic<PackTask> = {
  total: all,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= all(task)) return [];
    const out = [{ key: `bag:${task.id}`, pos: env.v3(task.at), label: packed(task, d) ? 'Pack the bag again' : 'Pack your bag', reach: 2.8, run: () => env.api.panel(task) }];
    const k = nextStop(task, d);
    if (packed(task, d) && k >= 0) {
      const sp = task.stops[k];
      out.push({ key: `stop:${task.id}:${k}`, pos: env.v3(sp.at), label: sp.need, reach: 3, run: () => {
        const bag = bagOf(task, env.api.save());
        const it = bag.find((i) => task.items[i].use === k);
        if (it == null) {
          env.api.note(`${task.id}/x`, k);
          env.api.hint(`${sp.need} You look in your bag, but there is nothing for this. Walk back to the house and pack again: what is in the bag that you do not need?`);
          return;
        }
        env.api.progress(task.id, k);
        env.api.hint(sp.ok);
      } });
    }
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (!packed(task, d)) return 'Pack your bag for the walk: it cannot hold everything.';
    const k = nextStop(task, d);
    if (k >= 0) return `On the way: ${k} of ${task.stops.length} stops · follow the path over the hills`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    if (!packed(task, d)) {
      api.set(`${task.id}/bag`, task.items.map((_, i) => i).filter((i) => task.items[i].use != null));
      api.progress(task.id, task.stops.length);
      return;
    }
    const k = nextStop(task, d);
    if (k >= 0) api.progress(task.id, k);
  },
  View: PackView,
  Panel: PackPanel,
};

function PackPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<PackTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [bag, setBag] = useState<number[]>(bagOf(task, data));
  const [msg, setMsg] = useState('');
  const used = sizeOf(task, bag);
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a packing game written for this app" />
      <Text style={st.cardTitle}>{`Your bag: ${used} of ${task.room} spaces`}</Text>
      <Text style={st.cardText}>{msg || 'It is a long walk over the hills to the family you are visiting. Tap things to put them in the bag or take them out.'}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {task.items.map((it, i) => {
          const inBag = bag.includes(i);
          return (
            <Pressable
              key={i}
              style={inBag ? st.btn : st.btnGhost}
              accessibilityLabel={`${inBag ? 'Take out' : 'Pack'} the ${it.name}`}
              onPress={() => {
                if (inBag) {
                  setBag(bag.filter((x) => x !== i));
                  setMsg('');
                  return;
                }
                if (used + it.size > task.room) {
                  setMsg(`The ${it.name} takes ${it.size} spaces, and there are only ${task.room - used} left. Take something out first.`);
                  return;
                }
                setBag([...bag, i]);
                setMsg('');
              }}
            >
              <Text style={inBag ? st.btnText : st.btnGhostText}>{`${it.name} (${it.size})`}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={st.row}>
        <Pressable
          style={st.btn}
          accessibilityLabel="Set off"
          onPress={() => {
            api.set(`${task.id}/bag`, bag);
            if (!packed(task, d)) api.progress(task.id, task.stops.length);
            api.hint('You shoulder the bag and set off along the path.');
            onClose();
          }}
        >
          <Text style={st.btnText}>Set off</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PackView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<PackTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const [x, z] = task.at;
  const k = nextStop(task, d);
  const bag = bagOf(task, data);
  return (
    <group>
      <group position={[x, t.floorY(x, z), z]} {...tap(() => act(`bag:${task.id}`))}>
        <mesh material={M('#8a6a44', { map: 'planks' })} position-y={0.4} castShadow>
          <boxGeometry args={[2, 0.8, 1]} />
        </mesh>
        {task.items.map((it, i) =>
          packed(task, d) && bag.includes(i) ? null : (
            <mesh key={i} material={M(it.use == null ? '#e8c050' : '#a08060', it.use == null ? { metal: 0.8, rough: 0.25 } : {})} position={[-0.8 + (i % 4) * 0.53, 0.88, -0.25 + Math.floor(i / 4) * 0.5]}>
              <boxGeometry args={[0.1 + it.size * 0.1, 0.16, 0.3]} />
            </mesh>
          ),
        )}
        {!packed(task, d) && <Halo on={active} />}
      </group>
      {task.stops.map((sp, i) => {
        const [sx, sz] = sp.at;
        const ok = d.includes(i);
        return (
          <group key={i} position={[sx, t.floorY(sx, sz), sz]} {...tap(() => act(`stop:${task.id}:${i}`))}>
            <mesh material={M('#9a9488', { map: 'stone' })} position-y={0.3}>
              <boxGeometry args={[0.9, 0.6, 0.6]} />
            </mesh>
            <mesh position-y={0.75}>
              <sphereGeometry args={[0.09, 8, 6]} />
              <meshBasicMaterial color={ok ? '#9ae07a' : '#6a6050'} toneMapped={false} />
            </mesh>
            {packed(task, d) && i === k && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
