// Surah Ash-Shams: the soul and the one who purifies it (91:7-10, "By the
// soul and the One who shaped it, and inspired it with its wrong and its
// right: successful is the one who purifies it, and failed is the one who
// buries it"). At sunset in a village hall, the big brass lamp that lights
// the evening is dull and green with tarnish. Polish it, patch by patch,
// with a soft cloth: most spots come clean with steady rubbing, but some
// stubborn ones need a little ash paste first. Paste on clean brass only
// scratches it. As each patch clears, the lamp shines a little brighter.
// The lamp is a game; it is only a picture of keeping something clean.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { PolishTask } from '../types';
import type { Mechanic, MechSave } from './base';

const cells = (task: PolishTask) => task.cols * task.rows;
const doneOf = (task: PolishTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: cells(task) }, (_, i) => i) : s.prog[task.id] ?? []);
/** How tarnished each patch is: 3 dull green, 0 shining. */
const levelsOf = (task: PolishTask, s: MechSave) => {
  const d = doneOf(task, s);
  const v = s.prog[`${task.id}/lv`];
  return Array.from({ length: cells(task) }, (_, i) => (d.includes(i) ? 0 : v && v.length === cells(task) ? v[i] : 3));
};
const TONE = ['#e8c860', '#b8a050', '#8a8a50', '#5a7a5a'];

export const Polish: Mechanic<PolishTask> = {
  total: cells,
  uses(task, env) {
    if (doneOf(task, env.save).length >= cells(task)) return [];
    return [{ key: `polish:${task.id}`, pos: env.v3(task.at), label: 'Polish the brass lamp', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= cells(task)) return;
    return `Patches polished bright: ${d.length} of ${cells(task)}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: cells(task) }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: PolishView,
  Panel: PolishPanel,
};

function PolishPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<PolishTask>['Panel']>>[0]) {
  const lv = levelsOf(task, data);
  const [paste, setPaste] = useState(false);
  const [msg, setMsg] = useState('');
  if (lv.every((v) => v === 0)) return null;
  const rub = (i: number) => {
    if (lv[i] === 0) return;
    const hard = task.hard.includes(i);
    if (paste && !hard) {
      api.note(`${task.id}/scratch`, i);
      setMsg('This patch is not stubborn: paste on it would only scratch the brass. Put the paste away and rub with the cloth.');
      return;
    }
    if (hard && !paste && lv[i] <= 2) {
      api.note(`${task.id}/x`, i);
      setMsg('This spot is stubborn: rubbing alone will not shift it. Try a little ash paste on it.');
      return;
    }
    const next = lv.slice();
    next[i] = hard && paste ? 0 : lv[i] - 1;
    api.set(`${task.id}/lv`, next);
    if (next[i] === 0) api.progress(task.id, i);
    setMsg(next[i] === 0 ? 'That patch shines.' : 'The tarnish is coming off. Keep rubbing.');
    if (next.every((v) => v === 0)) {
      api.hint('The whole lamp shines. Lit, it fills the hall with warm light.');
      onClose();
    }
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a polishing game written for this app" />
      <Text style={st.cardTitle}>Polish the brass lamp</Text>
      <Text style={st.cardText}>{msg || 'Tap a dull patch to rub it with the cloth. Stubborn spots need a little ash paste.'}</Text>
      <View style={{ alignSelf: 'center', width: task.cols * 46, flexDirection: 'row', flexWrap: 'wrap' }}>
        {lv.map((v, i) => (
          <Pressable key={i} accessibilityLabel={`Rub patch ${i + 1}`} onPress={() => rub(i)} style={{ width: 42, height: 42, margin: 2, borderRadius: 6, backgroundColor: TONE[v], borderWidth: task.hard.includes(i) && v > 0 ? 3 : 0, borderColor: '#3a4a3a' }} />
        ))}
      </View>
      <View style={st.row}>
        <Pressable style={paste ? st.btn : st.btnGhost} accessibilityLabel={paste ? 'Put the paste away' : 'Use ash paste'} onPress={() => { setPaste(!paste); setMsg(''); }}>
          <Text style={paste ? st.btnText : st.btnGhostText}>{paste ? 'Put the paste away' : 'Use ash paste'}</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PolishView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<PolishTask>['View']>>[0]) {
  const lv = levelsOf(task, data);
  const clean = lv.filter((v) => v === 0).length / cells(task);
  const [x, z] = task.at;
  const tone = TONE[Math.round((1 - clean) * 3)];
  return (
    <group position={[x, t.floorY(x, z), z]} {...(clean < 1 ? tap(() => act(`polish:${task.id}`)) : {})}>
      <mesh material={M('#6a4a2a')} position-y={0.4}>
        <boxGeometry args={[1, 0.8, 0.7]} />
      </mesh>
      {/* The lamp: its brass brightens as it is polished, and it glows when clean. */}
      <mesh material={M(tone, { metal: 0.3 + clean * 0.6, rough: 0.7 - clean * 0.5 })} position-y={1.05}>
        <sphereGeometry args={[0.3, 14, 10]} />
      </mesh>
      <mesh material={M(tone, { metal: 0.5 })} position={[0.32, 1.1, 0]} rotation-z={-1}>
        <coneGeometry args={[0.08, 0.36, 8]} />
      </mesh>
      {clean >= 1 && <pointLight position-y={1.4} color="#ffd890" intensity={3} distance={8} />}
      {clean < 1 && <Halo on={active} />}
    </group>
  );
}
