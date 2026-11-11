// Surah Al-Hashr: giving others preference (59:9, "they give [them]
// preference over themselves, even though they are in privation"). New
// families have come to the town with nothing, and empty houses wait for
// them. The town store has some bread, blankets, water jars and lamps, but
// not enough of everything for every house. Make each house ready: give
// what the store has, and when the store runs out of something, go to your
// own house and give your own. The town, the houses and the store are a
// game idea based on the ayah; no one is shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { WelcomeTask } from '../types';
import type { Mechanic, MechSave } from './base';

// Progress: home h given item k is h * items + k. Your own item k given is
// homes * items + k (only for items the store has too few of).
const H = (task: WelcomeTask) => task.homes.length;
const I = (task: WelcomeTask) => task.items.length;
const short = (task: WelcomeTask) => task.items.map((_, k) => k).filter((k) => task.stock[k] < H(task));
const all = (task: WelcomeTask) => H(task) * I(task) + short(task).length;
const doneOf = (task: WelcomeTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const ownIdx = (task: WelcomeTask, k: number) => H(task) * I(task) + k;
const givenTo = (task: WelcomeTask, d: number[], k: number) => task.homes.filter((_, h) => d.includes(h * I(task) + k)).length;
const ownGiven = (task: WelcomeTask, d: number[], k: number) => d.includes(ownIdx(task, k));
/** How many of item k are left in the store. */
const left = (task: WelcomeTask, d: number[], k: number) => Math.max(0, task.stock[k] - (givenTo(task, d, k) - (ownGiven(task, d, k) ? 1 : 0)));
const homeReady = (task: WelcomeTask, d: number[], h: number) => task.items.every((_, k) => d.includes(h * I(task) + k));

/** Which panel is open, and what you carry from your own house (shared by the 3D taps and the panel). */
const at: Record<string, number> = {};
const carry: Record<string, number[]> = {};
const OWN = -1;

export const Welcome: Mechanic<WelcomeTask> = {
  total: all,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= all(task)) return [];
    const out = task.homes.flatMap((hm, h) =>
      homeReady(task, d, h) ? [] : [{ key: `home:${task.id}:${h}`, pos: env.v3(hm.at), label: `Make ready ${hm.name}`, reach: 2.8, run: () => {
        at[task.id] = h;
        env.api.panel(task);
      } }],
    );
    out.push({ key: `own:${task.id}`, pos: env.v3(task.own), label: 'Go into your own house', reach: 2.8, run: () => {
      at[task.id] = OWN;
      env.api.panel(task);
    } });
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= all(task)) return;
    const ready = task.homes.filter((_, h) => homeReady(task, d, h)).length;
    const c = carry[task.id] ?? [];
    return `Houses made ready: ${ready} of ${H(task)}${c.length ? ` · carrying your own ${c.map((k) => task.items[k]).join(', ')}` : ''}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: all(task) }, (_, j) => j).find((j) => !d.includes(j));
    if (i != null) api.progress(task.id, i);
  },
  View: WelcomeView,
  Panel: WelcomePanel,
};

function WelcomePanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<WelcomeTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const h = at[task.id] ?? 0;
  const [msg, setMsg] = useState('');
  const [, setV] = useState(0);
  const c = (carry[task.id] ??= []);
  if (h === OWN) {
    const need = short(task).filter((k) => left(task, d, k) === 0 && !ownGiven(task, d, k) && givenTo(task, d, k) < H(task));
    return (
      <View style={[st.card, { width } as never, st.cardMid]}>
        <ContentLabel kind="activity" extra="a sharing game based on 59:9" />
        <Text style={st.cardTitle}>Your own house</Text>
        <Text style={st.cardText}>
          {msg ||
            (need.length
              ? `Your house has one of each thing, and that is all you have. A house still waits for: ${need.map((k) => task.items[k]).join(', ')}.`
              : 'Your house has one of each thing, and that is all you have. The store still has what the houses need, so give from there first.')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {need
            .filter((k) => !c.includes(k))
            .map((k) => (
              <Pressable
                key={k}
                style={st.btn}
                accessibilityLabel={`Take your own ${task.items[k]}`}
                onPress={() => {
                  c.push(k);
                  setMsg(`You take your own ${task.items[k]}. Now bring it to the house that needs it.`);
                  setV((v) => v + 1);
                }}
              >
                <Text style={st.btnText}>{`Take your own ${task.items[k]}`}</Text>
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
  const hm = task.homes[h];
  const missing = task.items.map((_, k) => k).filter((k) => !d.includes(h * I(task) + k));
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a sharing game based on 59:9" />
      <Text style={st.cardTitle}>{`Make ready ${hm.name}`}</Text>
      <Text style={st.cardText}>{msg || (missing.length ? `A family will live here. It still needs: ${missing.map((k) => task.items[k]).join(', ')}.` : 'This house is ready.')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {missing.map((k) => {
          const n = left(task, d, k);
          const mine = c.includes(k);
          const label = mine ? `Give your own ${task.items[k]}` : `Give a ${task.items[k]} from the store (${n} left)`;
          return (
            <Pressable
              key={k}
              style={mine || n > 0 ? st.btn : st.btnGhost}
              accessibilityLabel={label}
              onPress={() => {
                if (mine) {
                  c.splice(c.indexOf(k), 1);
                  api.progress(task.id, ownIdx(task, k));
                  api.progress(task.id, h * I(task) + k);
                  setMsg(`You give your own ${task.items[k]}, though it was all you had. "They give others preference over themselves, even though they are in need" (59:9).`);
                } else if (n > 0) {
                  api.progress(task.id, h * I(task) + k);
                  setMsg(`A ${task.items[k]} from the store.`);
                } else {
                  api.note(`${task.id}/x`, h * 10 + k);
                  setMsg(`The store has no more ${task.items[k]}s. Is there one anywhere else in the town? Think of your own house.`);
                }
                setV((v) => v + 1);
              }}
            >
              <Text style={mine || n > 0 ? st.btnText : st.btnGhostText}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const ITEM_COLOR = ['#d8a868', '#8a5a6a', '#b8784a', '#e8c070'];

function House({ ready, own }: { ready: boolean; own?: boolean }) {
  return (
    <group>
      <mesh material={M(own ? '#d8c4a0' : '#e4d8c0', { map: 'stone' })} position-y={1.1} castShadow receiveShadow>
        <boxGeometry args={[3, 2.2, 2.6]} />
      </mesh>
      <mesh material={M('#9a6a44')} position-y={2.32}>
        <boxGeometry args={[3.2, 0.24, 2.8]} />
      </mesh>
      {/* The door faces the street (+z). */}
      <mesh material={M('#6a4a2a')} position={[0, 0.8, 1.31]}>
        <boxGeometry args={[0.8, 1.6, 0.04]} />
      </mesh>
      {/* A lit window once the house is ready. */}
      <mesh position={[0.95, 1.3, 1.31]}>
        <boxGeometry args={[0.5, 0.5, 0.04]} />
        <meshBasicMaterial color={ready ? '#ffd890' : '#3a3430'} toneMapped={false} />
      </mesh>
    </group>
  );
}

function WelcomeView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<WelcomeTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const done = d.length >= all(task);
  const [sx, sz] = task.store;
  const [ox, oz] = task.own;
  return (
    <group>
      {/* The store: crates of each thing, fewer as they are given. */}
      <group position={[sx, t.floorY(sx, sz), sz]}>
        <mesh material={M('#8a6a44', { map: 'planks' })} position-y={0.9} castShadow receiveShadow>
          <boxGeometry args={[3.4, 1.8, 2]} />
        </mesh>
        <mesh material={M('#a07a50')} position-y={1.9}>
          <boxGeometry args={[3.8, 0.2, 2.4]} />
        </mesh>
        {task.items.map((_, k) =>
          Array.from({ length: left(task, d, k) }, (_, n) => (
            <mesh key={`${k}-${n}`} material={M(ITEM_COLOR[k % ITEM_COLOR.length])} position={[-1.2 + k * 0.8, 0.18 + n * 0.32, 1.3]} castShadow>
              <boxGeometry args={[0.5, 0.3, 0.4]} />
            </mesh>
          )),
        )}
      </group>
      <group position={[ox, t.floorY(ox, oz), oz]} {...tap(() => act(`own:${task.id}`))}>
        <House ready own />
        {!done && <Halo on={active} />}
      </group>
      {task.homes.map((hm, h) => {
        const [x, z] = hm.at;
        const ready = homeReady(task, d, h);
        return (
          <group key={h} position={[x, t.floorY(x, z), z]} {...tap(() => act(`home:${task.id}:${h}`))}>
            <House ready={ready} />
            {task.items.map((_, k) =>
              d.includes(h * I(task) + k) ? (
                <mesh key={k} material={M(ITEM_COLOR[k % ITEM_COLOR.length])} position={[-1.1 + k * 0.4, 0.15, 1.7]}>
                  <boxGeometry args={[0.3, 0.3, 0.3]} />
                </mesh>
              ) : null,
            )}
            {!ready && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
