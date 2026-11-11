// Surah Az-Zalzalah: an atom's weight (99:7-8, "So whoever does an atom's
// weight of good will see it, and whoever does an atom's weight of evil
// will see it"). Walking through a hill village one ordinary afternoon,
// you come on small moments, one after another: a dropped coin, a thirsty
// cat, a queue at the well. Each offers a tiny good or a tiny wrong, so
// small no one would notice. Choose. A small wrong is not waved away:
// even a speck counts, and you make it right. The village is a game; the
// Day of the earthquake (99:1-6) is read only and never shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { SpeckTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: SpeckTask, s: MechSave) => (s.done.includes(task.id) ? task.spots.map((_, i) => i) : s.prog[task.id] ?? []);
/** Which spot's panel is open (shared by the 3D tap and the panel). */
const at: Record<string, number> = {};
/** Whether the good choice is shown first at spot i (fixed, so it is not always on the same side). */
const goodFirst = (i: number) => i % 2 === 1;

export const Speck: Mechanic<SpeckTask> = {
  total: (task) => task.spots.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    return task.spots.flatMap((s, i) =>
      d.includes(i)
        ? []
        : [{ key: `spot:${task.id}:${i}`, pos: env.v3(s.at), label: s.what, reach: 2.4, run: () => { at[task.id] = i; env.api.panel(task); } }],
    );
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.spots.length) return;
    return `Small moments met: ${d.length} of ${task.spots.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.spots.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: SpeckView,
  Panel: SpeckPanel,
};

function SpeckPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<SpeckTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = at[task.id] ?? task.spots.findIndex((_, k) => !d.includes(k));
  const [msg, setMsg] = useState('');
  if (i < 0 || d.includes(i)) return null;
  const S = task.spots[i];
  const good = (
    <Pressable key="g" style={st.btnGhost} accessibilityLabel={S.good} onPress={() => {
      api.progress(task.id, i);
      const left = task.spots.length - d.length - 1;
      api.hint(left ? `A small thing, and no one saw. But not one speck of good is lost. ${left} more to find in the village.` : 'Every small moment met. Not one speck of good is too small to count.');
      onClose();
    }}>
      <Text style={st.btnGhostText}>{S.good}</Text>
    </Pressable>
  );
  const bad = (
    <Pressable key="b" style={st.btnGhost} accessibilityLabel={S.bad} onPress={() => {
      api.note(`${task.id}/x`, i);
      setMsg('It is tiny, and no one would ever know. But the surah says even an atom’s weight of wrong will be seen. Think again, and choose the good.');
    }}>
      <Text style={st.btnGhostText}>{S.bad}</Text>
    </Pressable>
  );
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a choices game written for this app" />
      <Text style={st.cardTitle}>{S.what}</Text>
      <Text style={st.cardText}>{msg || 'Something very small. What will you do?'}</Text>
      <View style={{ gap: 6 }}>{goodFirst(i) ? [good, bad] : [bad, good]}</View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SpeckView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<SpeckTask>['View']>>[0]) {
  const d = doneOf(task, data);
  return (
    <group>
      {task.spots.map((s, i) => {
        const [x, z] = s.at;
        const met = d.includes(i);
        return (
          <group key={i} position={[x, t.floorY(x, z), z]} {...(!met ? tap(() => act(`spot:${task.id}:${i}`)) : {})}>
            {/* A tiny mote of light marks each small moment; it settles golden once met. */}
            <mesh material={M(met ? '#f0c850' : '#fff4d8', { emissive: met ? '#a07a20' : '#887a60' })} position-y={met ? 0.15 : 0.9}>
              <sphereGeometry args={[met ? 0.06 : 0.09, 8, 6]} />
            </mesh>
            {!met && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
