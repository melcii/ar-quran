// Surah Ash-Sharh: with hardship comes ease (94:5-6, "So indeed, with
// hardship there is ease. Indeed, with hardship there is ease"; 94:7-8,
// "So when you are done, stand up and work, and to your Lord turn your
// longing"). On a quiet harbour at evening, the fishing net has come up in a
// terrible tangle. It looks impossible, but it is only knots, one over
// another. Look at which knot lies on top, undo it, and the one beneath
// comes free. Pull at a knot that is pinned under another, and it only
// tightens. Knot by knot, the hard tangle turns easy, and the net can be
// spread to dry. The harbour is a game; untangling nets is real. The
// Prophet, who is addressed in this surah, is never shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { KnotsTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: KnotsTask, s: MechSave) => (s.done.includes(task.id) ? task.knots.map((_, i) => i) : s.prog[task.id] ?? []);
/** The knots still pinned over knot i. */
const pinnedBy = (task: KnotsTask, d: number[], i: number) => task.knots[i].over.filter((j) => !d.includes(j));

export const Knots: Mechanic<KnotsTask> = {
  total: (task) => task.knots.length,
  uses(task, env) {
    if (doneOf(task, env.save).length >= task.knots.length) return [];
    return [{ key: `net:${task.id}`, pos: env.v3(task.at), label: 'Untangle the net', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.knots.length) return;
    return `Knots undone: ${d.length} of ${task.knots.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.knots.findIndex((_, k) => !d.includes(k) && pinnedBy(task, d, k).length === 0);
    if (i >= 0) api.progress(task.id, i);
  },
  View: KnotsView,
  Panel: KnotsPanel,
};

function KnotsPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<KnotsTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [msg, setMsg] = useState('');
  if (d.length >= task.knots.length) return null;
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="an untangling game written for this app" />
      <Text style={st.cardTitle}>The tangled net</Text>
      <Text style={st.cardText}>{msg || 'Each knot can only be undone when no other knot lies on top of it. Which one is free to undo?'}</Text>
      <View style={{ gap: 6 }}>
        {task.knots.map((k, i) => {
          if (d.includes(i)) return null;
          const over = task.knots
            .map((q, j) => (q.over.includes(i) && !d.includes(j) ? q.name : null))
            .filter(Boolean);
          return (
            <Pressable
              key={i}
              style={st.btnGhost}
              accessibilityLabel={`Undo the ${k.name}`}
              onPress={() => {
                const pin = pinnedBy(task, d, i);
                if (pin.length) {
                  api.note(`${task.id}/x`, i);
                  setMsg(`You pull at the ${k.name}, but it only tightens: the ${task.knots[pin[0]].name} is lying on top of it. Undo that one first.`);
                  return;
                }
                api.progress(task.id, i);
                const left = task.knots.length - d.length - 1;
                setMsg(left ? `The ${k.name} slips loose. ${left} to go, and each one is easier now.` : '');
                if (!left) {
                  api.hint('The last knot slips loose, and the whole net falls open. You spread it out to dry.');
                  onClose();
                }
              }}
            >
              <Text style={st.btnGhostText}>{`${k.name}${over.length ? ` (under the ${over.join(' and the ')})` : ''}`}</Text>
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

function KnotsView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<KnotsTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const free = d.length >= task.knots.length;
  const [x, z] = task.at;
  return (
    <group position={[x, t.floorY(x, z), z]} {...(!free ? tap(() => act(`net:${task.id}`)) : {})}>
      {free ? (
        // The net spread flat to dry.
        <mesh material={M('#6a8a7a', { side: 2 })} position-y={0.05} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[3, 2]} />
        </mesh>
      ) : (
        <>
          <mesh material={M('#6a8a7a')} position-y={0.35} scale={[1, 0.6, 1]}>
            <icosahedronGeometry args={[0.7, 1]} />
          </mesh>
          {task.knots.map((_, i) =>
            d.includes(i) ? null : (
              <mesh key={i} material={M('#d8c8a0')} position={[Math.cos(i * 1.7) * 0.6, 0.45 + (i % 3) * 0.12, Math.sin(i * 1.7) * 0.6]}>
                <sphereGeometry args={[0.1, 8, 6]} />
              </mesh>
            ),
          )}
          <Halo on={active} />
        </>
      )}
    </group>
  );
}
