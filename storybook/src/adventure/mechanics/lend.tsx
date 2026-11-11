// Surah Al-Ma'un: small kindnesses (107:1-3, "Have you seen the one who
// denies the Recompense? That is the one who drives away the orphan, and
// does not urge the feeding of the poor"; 107:7, "and withhold small
// kindnesses"). Al-ma'un is the small everyday help neighbours give: a pot,
// a pinch of salt, a needle. On a busy evening in a terrace of houses, the
// neighbours come to your door one after another, each needing to borrow a
// small thing. Find it in the house (open the chests and the cupboard to see
// what is in each) and take it round to the right door. The street is a
// game; no one at the doors is shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { LendTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { hand: string };
const doneOf = (task: LendTask, s: MechSave) => (s.done.includes(task.id) ? task.asks.map((_, i) => i) : s.prog[task.id] ?? []);
/** Which chest's panel is open (shared by the 3D tap and the panel). */
const at: Record<string, number> = {};
const lives: Record<string, Live> = {};
const L = (game: { mech: Record<string, unknown> }, task: LendTask) => (lives[task.id] = live<Live>(game as never, task.id, () => ({ hand: '' })));

export const Lend: Mechanic<LendTask> = {
  total: (task) => task.asks.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.asks.length) return [];
    const S = L(env.game, task);
    const out = task.chests.map((c, i) => ({ key: `chest:${task.id}:${i}`, pos: env.v3(c.at), label: 'Open and look inside', reach: 2, run: () => { at[task.id] = i; env.api.panel(task); } }));
    for (const [k, a] of task.asks.entries()) {
      if (d.includes(k)) continue;
      out.push({ key: `door:${task.id}:${k}`, pos: env.v3(a.at), label: S.hand ? `Give ${a.who} the ${S.hand}` : `Ask what ${a.who} needs`, reach: 2.4, run: () => {
        if (!S.hand) {
          env.api.hint(`${a.who[0].toUpperCase()}${a.who.slice(1)} asks: could you lend us a ${a.wants}?`);
          return;
        }
        if (S.hand !== a.wants) {
          env.api.note(`${task.id}/x`, k);
          env.api.hint(`That is kind, but ${a.who} needs a ${a.wants}, not a ${S.hand}. Keep it for whoever does.`);
          return;
        }
        S.hand = '';
        env.api.progress(task.id, k);
        const left = task.asks.length - d.length - 1;
        env.api.hint(left ? `${a.who[0].toUpperCase()}${a.who.slice(1)} takes the ${a.wants} with thanks. ${left} more neighbour${left > 1 ? 's' : ''} need something.` : 'Every neighbour helped with the small thing they needed.');
      } });
    }
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.asks.length) return;
    const S = L(env.game, task);
    const open = task.asks.filter((_, k) => !d.includes(k)).map((a) => a.wants);
    return `Neighbours helped: ${d.length} of ${task.asks.length}${S.hand ? ` · carrying the ${S.hand}` : ''} · still needed: ${open.join(', ')}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.asks.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: LendView,
  Panel: LendPanel,
};

function LendPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<LendTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = at[task.id] ?? 0;
  const [msg, setMsg] = useState('');
  const S = lives[task.id];
  if (d.length >= task.asks.length || !S) return null;
  const C = task.chests[i];
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a neighbourly game written for this app" />
      <Text style={st.cardTitle}>Inside</Text>
      <Text style={st.cardText}>{msg || (S.hand ? `You are carrying the ${S.hand}. Take one thing at a time.` : 'What will you take round?')}</Text>
      <View style={{ gap: 6 }}>
        {C.holds.map((h) => (
          <Pressable key={h} style={st.btnGhost} accessibilityLabel={`Take the ${h}`} onPress={() => {
            if (S.hand && S.hand !== h) {
              setMsg(`Your hands are full with the ${S.hand}. Put it back first, or take it round.`);
              return;
            }
            S.hand = h;
            onClose();
          }}>
            <Text style={st.btnGhostText}>{`Take the ${h}`}</Text>
          </Pressable>
        ))}
      </View>
      <View style={st.row}>
        {!!S.hand && (
          <Pressable style={st.btnGhost} accessibilityLabel="Put back what you carry" onPress={() => { S.hand = ''; setMsg('Your hands are free.'); }}>
            <Text style={st.btnGhostText}>Put back what you carry</Text>
          </Pressable>
        )}
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LendView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<LendTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const all = d.length >= task.asks.length;
  return (
    <group>
      {task.chests.map((c, i) => {
        const [x, z] = c.at;
        return (
          <group key={`c${i}`} position={[x, t.floorY(x, z), z]} {...(!all ? tap(() => act(`chest:${task.id}:${i}`)) : {})}>
            <mesh material={M(i % 2 ? '#7a4a2a' : '#8a6a44', { map: 'planks' })} position-y={i === 0 ? 0.9 : 0.3}>
              <boxGeometry args={i === 0 ? [1.2, 1.8, 0.5] : [0.9, 0.6, 0.55]} />
            </mesh>
            {!all && <Halo on={active} />}
          </group>
        );
      })}
      {task.asks.map((a, k) => {
        const [x, z] = a.at;
        const ok = d.includes(k);
        return (
          <group key={`a${k}`} position={[x, t.floorY(x, z), z]} {...(!ok ? tap(() => act(`door:${task.id}:${k}`)) : {})}>
            {/* A lamp at each door that needs something; it glows warm once helped. */}
            <mesh material={M(ok ? '#ffd890' : '#a89878', { emissive: ok ? '#c89030' : '#000000' })} position-y={1.9}>
              <sphereGeometry args={[0.1, 8, 6]} />
            </mesh>
            {ok && <pointLight position-y={1.9} color="#ffd890" intensity={0.8} distance={3} />}
            {!ok && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
