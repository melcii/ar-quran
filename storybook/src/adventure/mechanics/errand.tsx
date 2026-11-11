// Surah At-Takathur: enough (102:1-2, "Competition in piling up distracts
// you, until you visit the graves"; 102:8, "Then you will surely be asked
// that Day about the blessings"). It is market morning in a busy town, and
// you are sent with the household's list: so many loaves, so many eggs,
// and so on. Every stallholder calls out to buy more ("Take five! Your
// neighbour bought five!"). Buy just what the household needs at each
// stall: too few leaves someone without, and more is only piling up. The
// market is a game; the graves and the Day are read only, never shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { ErrandTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: ErrandTask, s: MechSave) => (s.done.includes(task.id) ? task.stalls.map((_, i) => i) : s.prog[task.id] ?? []);
/** Which stall's panel is open (shared by the 3D tap and the panel). */
const at: Record<string, number> = {};

export const Errand: Mechanic<ErrandTask> = {
  total: (task) => task.stalls.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    return task.stalls.flatMap((s, i) => (d.includes(i) ? [] : [{ key: `stall:${task.id}:${i}`, pos: env.v3(s.at), label: `Buy ${s.what}`, reach: 2.6, run: () => { at[task.id] = i; env.api.panel(task); } }]));
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.stalls.length) return;
    return `The list: ${task.stalls.map((s, i) => `${d.includes(i) ? '✓ ' : ''}${s.need} ${s.what}`).join(' · ')}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.stalls.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: ErrandView,
  Panel: ErrandPanel,
};

function ErrandPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<ErrandTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = at[task.id] ?? task.stalls.findIndex((_, k) => !d.includes(k));
  const [n, setN] = useState(1);
  const [msg, setMsg] = useState('');
  if (i < 0 || d.includes(i)) return null;
  const S = task.stalls[i];
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a market game written for this app" />
      <Text style={st.cardTitle}>{`The ${S.what} stall`}</Text>
      <Text style={st.cardText}>{msg || `The list says ${S.need} ${S.what}. The stallholder calls out: “${S.push}”`}</Text>
      <Text style={[st.cardTitle, { textAlign: 'center' }]}>{`${n} ${S.what}`}</Text>
      <View style={[st.row, { justifyContent: 'center' }]}>
        <Pressable style={st.btnGhost} accessibilityLabel="One fewer" onPress={() => { setN(Math.max(1, n - 1)); setMsg(''); }}>
          <Text style={st.btnGhostText}>One fewer</Text>
        </Pressable>
        <Pressable style={st.btnGhost} accessibilityLabel="One more" onPress={() => { setN(n + 1); setMsg(''); }}>
          <Text style={st.btnGhostText}>One more</Text>
        </Pressable>
      </View>
      <View style={st.row}>
        <Pressable style={st.btn} accessibilityLabel="Pay and take them" onPress={() => {
          if (n < S.need) {
            api.note(`${task.id}/few`, i * 10 + n);
            setMsg(`Only ${n}? The list says ${S.need}: someone at home would go without.`);
            return;
          }
          if (n > S.need) {
            api.note(`${task.id}/x`, i * 10 + n);
            setMsg(`${n} is more than the household needs. Buying more only because others do is piling up, and it distracts. Take just ${S.need}.`);
            return;
          }
          api.progress(task.id, i);
          setN(1);
          const left = task.stalls.length - d.length - 1;
          api.hint(left ? `${S.need} ${S.what}: just enough. ${left} more on the list.` : 'Everything on the list, and not one thing more. Home with a light basket.');
          onClose();
        }}>
          <Text style={st.btnText}>Pay and take them</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ErrandView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<ErrandTask>['View']>>[0]) {
  const d = doneOf(task, data);
  return (
    <group>
      {task.stalls.map((s, i) => {
        const [x, z] = s.at;
        const got = d.includes(i);
        return (
          <group key={i} position={[x, t.floorY(x, z), z]} {...(!got ? tap(() => act(`stall:${task.id}:${i}`)) : {})}>
            {/* A crate heaped with goods: the heap that calls you to buy more. */}
            <mesh material={M('#8a6a44', { map: 'planks' })} position-y={0.45}>
              <boxGeometry args={[0.8, 0.9, 0.5]} />
            </mesh>
            {Array.from({ length: 6 }, (_, k) => (
              <mesh key={k} material={M(['#d8a860', '#f2ead8', '#c84a3a', '#8a6a3a', '#e8c040'][i % 5])} position={[(k % 3) * 0.22 - 0.22, 1.0 + Math.floor(k / 3) * 0.14, 0]}>
                <sphereGeometry args={[0.1, 8, 6]} />
              </mesh>
            ))}
            {got && (
              <mesh material={M('#8a6a3a')} position={[0, 1.1, 0.5]}>
                <torusGeometry args={[0.16, 0.03, 6, 12, Math.PI]} />
              </mesh>
            )}
            {!got && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
