// Surah Ghafir: the believing man's reasoning (40:28-44). A believing man
// from Pharaoh's own family spoke up for Musa. His words point to things the
// people could see for themselves: the ruins of peoples before them (40:31),
// what was left from Yusuf's time (40:34), the tower that could never reach
// the heavens (40:36-37), and the market whose goods do not last (40:39).
// Walk the city, find each clue and read what it points to; then, at the
// board, pin each clue under the words of his that it belongs to. No one is
// shown: not Musa, not the believing man, not Pharaoh.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { Terrain } from '../terrain';
import type { CluesTask } from '../types';
import type { Mechanic, MechSave } from './base';

const all = (task: CluesTask) => task.clues.length + task.questions.length;
const doneOf = (task: CluesTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const found = (task: CluesTask, d: number[]) => task.clues.map((_, i) => i).filter((i) => d.includes(i));
const pinned = (task: CluesTask, d: number[]) => task.questions.map((_, j) => j).filter((j) => d.includes(task.clues.length + j));

export const Clues: Mechanic<CluesTask> = {
  total: all,
  uses(task, env) {
    const d = doneOf(task, env.save);
    const out = task.clues.flatMap((c, i) =>
      d.includes(i)
        ? []
        : [{ key: `clue:${task.id}:${i}`, pos: env.v3(c.at), label: `Look at the ${c.name}`, reach: 3, run: () => {
            env.api.progress(task.id, i);
            env.api.open({ kind: 'reading', reading: c.reading });
          } }],
    );
    if (found(task, d).length === task.clues.length && pinned(task, d).length < task.questions.length)
      out.push({ key: `board:${task.id}`, pos: env.v3(task.board), label: 'Pin each clue to its ayah', reach: 2.8, run: () => env.api.panel(task) });
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const f = found(task, d).length;
    if (f < task.clues.length) return `Clues found: ${f} of ${task.clues.length}`;
    const p = pinned(task, d).length;
    if (p < task.questions.length) return p ? `Clues pinned: ${p} of ${task.questions.length}` : 'Every clue is found. Go to the board and pin each one to the ayah it belongs to.';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.clues.findIndex((_, k) => !d.includes(k));
    if (i >= 0) return api.progress(task.id, i);
    const j = task.questions.findIndex((_, k) => !d.includes(task.clues.length + k));
    if (j >= 0) api.progress(task.id, task.clues.length + j);
  },
  View: CluesView,
  Panel: CluesPanel,
};

function CluesPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<CluesTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const j = task.questions.findIndex((_, k) => !d.includes(task.clues.length + k));
  const [msg, setMsg] = useState('The believing man pointed to things the people could see for themselves. Which clue belongs to these words?');
  if (j < 0) return null;
  const q = task.questions[j];
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a clue board written for this app; his words are from the ayahs" />
      <Text style={[st.cardText, { fontStyle: 'italic' }]}>{`“${q.q}” (${q.ref[0]}:${q.ref[1]})`}</Text>
      <Text style={[st.cardText, { fontSize: 14 }]}>{msg}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {task.clues.map((c, i) => (
          <Pressable
            key={i}
            accessibilityLabel={`Pin the ${c.name}`}
            style={st.btnGhost}
            onPress={() => {
              if (i !== q.answer) {
                api.note(`${task.id}/x`, j);
                setMsg(q.wrong);
                return;
              }
              api.progress(task.id, task.clues.length + j);
              setMsg(`Pinned: the ${c.name}. ${j + 1 < task.questions.length ? 'Next words:' : ''}`);
              if (j + 1 >= task.questions.length) onClose();
            }}
          >
            <Text style={st.btnGhostText}>{c.name}</Text>
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

/** A small clay tablet that marks a clue until it has been looked at. */
function Tablet({ x, z, t, on, active, onTap }: { x: number; z: number; t: Terrain; on: boolean; active: boolean; onTap: () => void }) {
  const y = t.floorY(x, z);
  return (
    <group position={[x, y, z]} {...tap(onTap)}>
      <mesh material={M('#6a4a2a')} position-y={0.45}>
        <cylinderGeometry args={[0.05, 0.06, 0.9, 6]} />
      </mesh>
      <mesh material={M(on ? '#e8d4a8' : '#b89a6a', on ? { emissive: '#ffd890', ei: 0.35 } : {})} position-y={1} rotation-x={-0.3}>
        <boxGeometry args={[0.5, 0.36, 0.06]} />
      </mesh>
      {on && <Halo on={active} />}
    </group>
  );
}

function CluesView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<CluesTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const f = found(task, d);
  const p = pinned(task, d);
  const [bx, bz] = task.board;
  const by = t.floorY(bx, bz);
  return (
    <group>
      {task.clues.map((c, i) => (
        <Tablet key={i} x={c.at[0]} z={c.at[1]} t={t} on={!d.includes(i)} active={active} onTap={() => act(`clue:${task.id}:${i}`)} />
      ))}
      <group position={[bx, by, bz]} {...tap(() => act(`board:${task.id}`))}>
        <mesh material={M('#8a6a44', { map: 'planks' })} position-y={1.3} castShadow>
          <boxGeometry args={[2.4, 1.4, 0.12]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={M('#5a3a22')} position={[s * 1.05, 0.6, 0]}>
            <cylinderGeometry args={[0.06, 0.07, 1.2, 6]} />
          </mesh>
        ))}
        {/* A card for each clue found; pinned ones sit in the top row with a red thread to their words. */}
        {f.map((i, k) => {
          const on = task.questions.some((q, j) => q.answer === i && p.includes(j));
          const x = -0.85 + k * (1.7 / Math.max(1, task.clues.length - 1));
          return (
            <group key={i} position={[x, on ? 1.65 : 1.0, 0.08]}>
              <mesh material={M('#f0e2c0')}>
                <boxGeometry args={[0.36, 0.26, 0.02]} />
              </mesh>
              {on && (
                <mesh material={M('#b83a2a')} position={[0, 0.16, 0.02]}>
                  <sphereGeometry args={[0.04, 8, 6]} />
                </mesh>
              )}
            </group>
          );
        })}
        {f.length === task.clues.length && p.length < task.questions.length && <Halo on={active} />}
      </group>
    </group>
  );
}
