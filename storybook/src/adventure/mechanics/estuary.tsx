// Surah Ar-Rahman: the two seas that meet (55:19-20, "He released the two
// seas, meeting side by side; between them is a barrier, so neither of them
// transgresses"). A river runs out into the sea past a long pier, with
// buoys tied along it. At each buoy, lower the testing tube and look at the
// float inside: in salt water a float rides higher than in fresh water,
// because salt water is heavier. Write down fresh or salt at every buoy,
// then mark where along the pier the two waters meet. The pier and the test
// are a game idea; floats really do ride higher in salt water.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { EstuaryTask } from '../types';
import type { Mechanic, MechSave } from './base';

const all = (task: EstuaryTask) => task.buoys.length + 1;
const doneOf = (task: EstuaryTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const salty = (task: EstuaryTask, i: number) => i >= task.meet;
/** Which buoy's tube is open in the panel (shared by the 3D tap and the panel). */
const open: Record<string, number> = {};

export const Estuary: Mechanic<EstuaryTask> = {
  total: all,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= all(task)) return [];
    const out = task.buoys.flatMap((b, i) =>
      d.includes(i)
        ? []
        : [{ key: `dip:${task.id}:${i}`, pos: env.v3(b), label: `Test the water at buoy ${i + 1}`, reach: 2.4, run: () => {
            open[task.id] = i;
            env.api.panel(task);
          } }],
    );
    if (task.buoys.every((_, i) => d.includes(i)))
      out.push({ key: `meet:${task.id}`, pos: env.v3(task.buoys[task.buoys.length - 1]), label: 'Mark where the waters meet', reach: 3, run: () => {
        open[task.id] = -1;
        env.api.panel(task);
      } });
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const n = task.buoys.filter((_, i) => d.includes(i)).length;
    if (n < task.buoys.length) return `Buoys tested: ${n} of ${task.buoys.length}`;
    if (!d.includes(task.buoys.length)) return 'Every buoy is tested. Mark where along the pier the two waters meet.';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: all(task) }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: EstuaryView,
  Panel: EstuaryPanel,
};

function EstuaryPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<EstuaryTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = open[task.id] ?? -1;
  const [msg, setMsg] = useState('');
  if (i >= 0 && !d.includes(i)) {
    const s = salty(task, i);
    // The float rides higher in salt water.
    const top = s ? 18 : 52;
    return (
      <View style={[st.card, { width } as never, st.cardMid]}>
        <ContentLabel kind="activity" extra="a water test written for this app" />
        <Text style={st.cardTitle}>{`Buoy ${i + 1}`}</Text>
        <Text style={st.cardText}>{msg || 'You lower the clear tube and fill it. Look at the float: in salt water it rides high, in fresh water it sits low. The line marks the middle.'}</Text>
        <View style={{ alignSelf: 'center', width: 60, height: 140, borderRadius: 12, borderWidth: 3, borderColor: '#9ab0c0', backgroundColor: s ? '#bcd8e4' : '#cfe4dc', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 70, height: 2, backgroundColor: '#6a7a88' }} />
          <View style={{ position: 'absolute', left: 20, width: 20, top, height: 60, borderRadius: 8, backgroundColor: '#e86a3a' }} />
        </View>
        <View style={st.row}>
          {(['Fresh water', 'Salt water'] as const).map((name, k) => (
            <Pressable
              key={name}
              style={st.btnGhost}
              accessibilityLabel={`Buoy ${i + 1}: ${name}`}
              onPress={() => {
                if ((k === 1) !== s) {
                  api.note(`${task.id}/x`, i);
                  setMsg('Look again at the float: is it riding above the middle line, or below it?');
                  return;
                }
                api.progress(task.id, i);
                onClose();
              }}
            >
              <Text style={st.btnGhostText}>{name}</Text>
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
  if (!task.buoys.every((_, k) => d.includes(k)) || d.includes(task.buoys.length)) return null;
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a water test written for this app" />
      <Text style={st.cardText}>{msg || 'Your notes: ' + task.buoys.map((_, k) => `buoy ${k + 1} ${salty(task, k) ? 'salt' : 'fresh'}`).join(', ') + '. Where do the two waters meet?'}</Text>
      <View style={{ gap: 6 }}>
        {task.buoys.slice(1).map((_, k) => (
          <Pressable
            key={k}
            style={[st.btnGhost, { alignSelf: 'stretch' }]}
            accessibilityLabel={`Between buoy ${k + 1} and buoy ${k + 2}`}
            onPress={() => {
              if (k + 1 !== task.meet) {
                api.note(`${task.id}/x`, 100 + k);
                setMsg(`Not there: buoys ${k + 1} and ${k + 2} have the same water. Look at your notes for where fresh turns to salt.`);
                return;
              }
              api.progress(task.id, task.buoys.length);
              onClose();
            }}
          >
            <Text style={st.btnGhostText}>{`Between buoy ${k + 1} and buoy ${k + 2}`}</Text>
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

function EstuaryView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<EstuaryTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const found = d.includes(task.buoys.length);
  const a = task.buoys[task.meet - 1];
  const b = task.buoys[task.meet];
  const mx = (a[0] + b[0]) / 2;
  const mz = (a[1] + b[1]) / 2;
  const ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const wy = t.water ?? 0;
  return (
    <group>
      {task.buoys.map(([x, z], i) => (
        <group key={i} position={[x, wy, z]} {...tap(() => act(`dip:${task.id}:${i}`))}>
          <mesh material={M(d.includes(i) ? (salty(task, i) ? '#3a7ab8' : '#5aa86a') : '#e86a3a')} position-y={0.15}>
            <sphereGeometry args={[0.32, 12, 10]} />
          </mesh>
          <mesh material={M('#f0e8d8')} position-y={0.55}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
          </mesh>
          {!d.includes(i) && <Halo on={active} />}
        </group>
      ))}
      {/* Once found, a line of floats marks where the two waters meet. */}
      {found && (
        <group position={[mx, wy + 0.08, mz]} rotation-y={ang + Math.PI / 2}>
          {Array.from({ length: 13 }, (_, k) => (
            <mesh key={k} material={M('#f4f0e6')} position-x={(k - 6) * 1.4}>
              <sphereGeometry args={[0.18, 8, 6]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
