// Surah Al-Humazah: the mocker (104:1, "Woe to every slanderer and
// mocker"; 104:2-3, "who gathers wealth and counts it, thinking his wealth
// will make him last forever"). In a village square on a windy afternoon,
// someone has chalked mocking words about people on the noticeboards by
// their doors: the baker, the old shepherd, the new girl from the next
// valley. Do not laugh along or walk past. Scrub each board clean and write
// something kind about that person in its place, and make it true: flattery
// that is not true is no kindness. The square is a game; the fire of
// 104:4-9 is read only, never shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { ChalkTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: ChalkTask, s: MechSave) => (s.done.includes(task.id) ? task.boards.map((_, i) => i) : s.prog[task.id] ?? []);
/** Boards scrubbed clean but not yet written on (saved). */
const scrubOf = (task: ChalkTask, s: MechSave) => s.prog[`${task.id}/clean`] ?? [];
/** Which board's panel is open (shared by the 3D tap and the panel). */
const at: Record<string, number> = {};

export const Chalk: Mechanic<ChalkTask> = {
  total: (task) => task.boards.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    return task.boards.flatMap((b, i) => (d.includes(i) ? [] : [{ key: `board:${task.id}:${i}`, pos: env.v3(b.at), label: `The board by ${b.who}'s door`, reach: 2.4, run: () => { at[task.id] = i; env.api.panel(task); } }]));
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.boards.length) return;
    return `Boards made kind: ${d.length} of ${task.boards.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.boards.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: ChalkView,
  Panel: ChalkPanel,
};

function ChalkPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<ChalkTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const clean = scrubOf(task, data);
  const i = at[task.id] ?? task.boards.findIndex((_, k) => !d.includes(k));
  const [msg, setMsg] = useState('');
  if (i < 0 || d.includes(i)) return null;
  const B = task.boards[i];
  const isClean = clean.includes(i);
  const opt = (label: string, run: () => void) => (
    <Pressable key={label} style={st.btnGhost} accessibilityLabel={label} onPress={run}>
      <Text style={st.btnGhostText}>{label}</Text>
    </Pressable>
  );
  // Kind-and-true first or second, so it is not always in the same place.
  const write = [
    opt(`Write: “${B.good}”`, () => {
      api.progress(task.id, i);
      const left = task.boards.length - d.length - 1;
      api.hint(left ? `Kind, and true. ${left} more board${left > 1 ? 's' : ''} to put right.` : 'Every board in the square now says something kind and true.');
      onClose();
    }),
    opt(`Write: “${B.flatter}”`, () => {
      api.note(`${task.id}/flatter`, i);
      setMsg('That sounds nice, but it is not true. Flattery is not kindness. Write something kind that is true.');
    }),
  ];
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a kindness game written for this app" />
      <Text style={st.cardTitle}>{`The board by ${B.who}'s door`}</Text>
      <Text style={st.cardText}>{msg || (isClean ? 'The board is clean. What kind thing will you write about them?' : `Someone has chalked: “${B.mock}”`)}</Text>
      <View style={{ gap: 6 }}>
        {isClean
          ? i % 2 ? write.reverse() : write
          : [
              opt('Laugh and add a line', () => {
                api.note(`${task.id}/x`, i);
                setMsg('Woe to every mocker, says the surah. Mocking someone, even as a joke on a board, hurts them.');
              }),
              opt('Walk past', () => {
                api.note(`${task.id}/past`, i);
                setMsg(`If it stays up, everyone who passes will read it, and ${B.who} will too. Will you leave it there?`);
              }),
              opt('Scrub it off', () => {
                api.set(`${task.id}/clean`, [...clean, i]);
                setMsg('');
              }),
            ]}
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ChalkView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<ChalkTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const clean = scrubOf(task, data);
  return (
    <group>
      {task.boards.map((b, i) => {
        const [x, z] = b.at;
        const kind = d.includes(i);
        return (
          <group key={i} position={[x, t.floorY(x, z), z]} {...(!kind ? tap(() => act(`board:${task.id}:${i}`)) : {})}>
            <mesh material={M('#6a4a2a')} position-y={0.6}>
              <boxGeometry args={[0.08, 1.2, 0.08]} />
            </mesh>
            <mesh material={M('#2a3a2e')} position-y={1.35}>
              <boxGeometry args={[0.9, 0.6, 0.05]} />
            </mesh>
            {/* Scrawled chalk while it mocks; neat lines once something kind is written. */}
            {(!clean.includes(i) || kind) &&
              [0, 1, 2].map((k) => (
                <mesh key={k} material={M(kind ? '#f4f0e0' : '#d8d8d0')} position={[0, 1.48 - k * 0.12, 0.03]} rotation-z={kind ? 0 : (k - 1) * 0.25}>
                  <planeGeometry args={[kind ? 0.6 : 0.5, 0.03]} />
                </mesh>
              ))}
            {!kind && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
