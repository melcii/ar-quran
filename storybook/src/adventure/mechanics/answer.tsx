// Surah Ad-Duha: do not turn away the one who asks (93:9-11, "So as for
// the orphan, do not oppress him; and as for the one who asks, do not turn
// him away; and as for the favour of your Lord, speak of it"). On a bright
// morning (93:1) in a hill village, you are baking the day's bread: knead
// the dough at the clay oven in the yard. While you work, people knock at
// the gate one after another: a child from the orphanage, a traveller, a
// neighbour. Each time, leave the dough and answer, and give what was
// asked; never close the gate on anyone. Then finish kneading and bake.
// The village is a game; no one at the gate is shown. The Prophet, who is
// addressed in this surah, is never shown.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { AnswerTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

const KNEAD = 3; // presses of kneading between knocks
type Live = { kneads: number };
const doneOf = (task: AnswerTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.callers.length + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
const answered = (task: AnswerTask, d: number[]) => task.callers.filter((_, i) => d.includes(i)).length;
/** Who is knocking now: the next caller, once enough kneading is done since the last one. */
const knocking = (task: AnswerTask, d: number[], L: Live) => {
  const a = answered(task, d);
  return a < task.callers.length && L.kneads >= (a + 1) * KNEAD ? a : -1;
};
const lives: Record<string, Live> = {};
const L = (game: { mech: Record<string, unknown> }, task: AnswerTask, d: number[]) => {
  const v = live<Live>(game as never, task.id, () => ({ kneads: answered(task, d) * KNEAD }));
  lives[task.id] = v;
  return v;
};

export const Answer: Mechanic<AnswerTask> = {
  total: (task) => task.callers.length + 1,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.includes(task.callers.length)) return [];
    const S = L(env.game, task, d);
    const k = knocking(task, d, S);
    const ready = answered(task, d) >= task.callers.length && S.kneads >= (task.callers.length + 1) * KNEAD;
    const out = [{ key: `knead:${task.id}`, pos: env.v3(task.oven), label: ready ? 'Bake the bread' : 'Knead the dough', reach: 2.6, run: () => {
      if (k >= 0) {
        env.api.note(`${task.id}/ignore`, k);
        env.api.hint('Someone is still knocking at the gate. Leave the dough: do not keep them waiting.');
        return;
      }
      if (ready) {
        env.api.progress(task.id, task.callers.length);
        env.api.hint('The bread comes out of the oven, golden and warm.');
        return;
      }
      S.kneads++;
      if (knocking(task, d, S) >= 0) env.api.hint('Knock, knock! Someone is at the gate.');
    } }];
    if (k >= 0) out.push({ key: `gate:${task.id}`, pos: env.v3(task.door), label: 'Open the gate', reach: 2.6, run: () => env.api.panel(task) });
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.includes(task.callers.length)) return;
    const S = L(env.game, task, d);
    if (knocking(task, d, S) >= 0) return 'Someone is knocking at the gate!';
    const all = (task.callers.length + 1) * KNEAD;
    return S.kneads >= all ? 'The dough is ready: bake the bread' : `Kneading the dough: ${Math.round((100 * S.kneads) / all)}% · callers answered: ${answered(task, d)}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: task.callers.length + 1 }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: AnswerView,
  Panel: AnswerPanel,
};

function AnswerPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<AnswerTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const S = lives[task.id];
  const [msg, setMsg] = useState('');
  const k = S ? knocking(task, d, S) : -1;
  if (k < 0) return null;
  const c = task.callers[k];
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a kindness game written for this app; no one at the gate is shown" />
      <Text style={st.cardTitle}>{`At the gate: ${c.who}`}</Text>
      <Text style={st.cardText}>{msg || `${c.who[0].toUpperCase()}${c.who.slice(1)} has come to ask for ${task.gifts[c.wants]}. What will you do?`}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {task.gifts.map((g, j) => (
          <Pressable
            key={j}
            style={st.btnGhost}
            accessibilityLabel={`Give ${g}`}
            onPress={() => {
              if (j !== c.wants) {
                api.note(`${task.id}/x`, k * 10 + j);
                setMsg(`That is kind, but ${c.who} asked for ${task.gifts[c.wants]}.`);
                return;
              }
              api.progress(task.id, k);
              api.hint(`You give ${g}, and ${c.who} goes away glad. Back to the dough.`);
              onClose();
            }}
          >
            <Text style={st.btnGhostText}>{`Give ${g}`}</Text>
          </Pressable>
        ))}
      </View>
      <View style={st.row}>
        <Pressable
          style={st.btnGhost}
          accessibilityLabel="Close the gate on them"
          onPress={() => {
            api.note(`${task.id}/repel`, k);
            setMsg('The surah says: as for the one who asks, do not turn them away. Give them what they asked for.');
          }}
        >
          <Text style={st.btnGhostText}>Close the gate on them</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AnswerView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<AnswerTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const S = L(game, task, d);
  const baked = d.includes(task.callers.length);
  // Kneading and knocking are live state: redraw when they change.
  const [, bump] = useState(0);
  const was = useRef(-1);
  useFrame(() => {
    if (S.kneads !== was.current) {
      was.current = S.kneads;
      bump((n) => n + 1);
    }
  });
  const k = knocking(task, d, S);
  const [ox, oz] = task.oven;
  const [gx, gz] = task.door;
  return (
    <group>
      <group position={[ox, t.floorY(ox, oz), oz]} {...(!baked ? tap(() => act(`knead:${task.id}`)) : {})}>
        <mesh material={M('#b86a3a')} position-y={0.7} castShadow>
          <sphereGeometry args={[0.9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={M('#8a6a44')} position={[1.4, 0.4, 0]}>
          <boxGeometry args={[1, 0.8, 0.7]} />
        </mesh>
        <mesh material={M(baked ? '#c88a3a' : '#f2e8d0')} position={[1.4, 0.88, 0]} scale={[1, 0.5 + Math.min(1, S.kneads / ((task.callers.length + 1) * KNEAD)) * 0.5, 1]}>
          <sphereGeometry args={[0.22, 10, 8]} />
        </mesh>
        {!baked && k < 0 && <Halo on={active} />}
      </group>
      <group position={[gx, t.floorY(gx, gz), gz]} {...(k >= 0 ? tap(() => act(`gate:${task.id}`)) : {})}>
        {k >= 0 && <pointLight position-y={1.6} color="#ffe0a0" intensity={1.6} distance={4} />}
        {k >= 0 && <Halo on={active} />}
      </group>
    </group>
  );
}
