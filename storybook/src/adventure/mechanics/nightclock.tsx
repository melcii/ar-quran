// Surah Al-Muzzammil: measuring the night (73:2-4, "Arise in the night,
// except for a little: half of it, or a little less, or a little more";
// 73:20, "your Lord knows that you stand almost two thirds of the night, or
// half of it, or a third of it ... and Allah determines the night and the
// day"). On a quiet rooftop stands a water clock: a tall jar that empties
// slowly from sunset to dawn, with a scale on its side. The night is
// longer or shorter through the year. Work out tonight's third, half and
// two thirds and set a peg at each, then keep watch as the water falls.
// The rooftop and the clock are a game idea; water clocks are real.
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { NightclockTask } from '../types';
import type { Mechanic, MechSave } from './base';

const all = (task: NightclockTask) => task.marks.length + 1;
const doneOf = (task: NightclockTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const len = (task: NightclockTask) => (task.dawn + 24 - task.dusk) % 24;
/** The time of a mark, to the nearest quarter hour. */
const at = (task: NightclockTask, frac: number) => Math.round((task.dusk + len(task) * frac) * 4) / 4;
export const clock = (h: number) => {
  const x = ((h % 24) + 24) % 24;
  const hh = Math.floor(x);
  const mm = Math.round((x - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export const Nightclock: Mechanic<NightclockTask> = {
  total: all,
  uses(task, env) {
    if (doneOf(task, env.save).length >= all(task)) return [];
    return [{ key: `clock:${task.id}`, pos: env.v3(task.at), label: 'Set the water clock', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= all(task)) return;
    const k = task.marks.filter((_, i) => d.includes(i)).length;
    return k < task.marks.length ? `Pegs set: ${k} of ${task.marks.length} · sunset ${clock(task.dusk)}, dawn ${clock(task.dawn)}` : 'The pegs are set. Keep watch through the night.';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: all(task) }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: NightclockView,
  Panel: NightclockPanel,
};

function NightclockPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<NightclockTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const k = task.marks.findIndex((_, i) => !d.includes(i));
  const [h, setH] = useState(task.dusk + 2);
  const [msg, setMsg] = useState('');
  const [watch, setWatch] = useState(-1);
  useEffect(() => {
    if (watch < 0) return;
    const id = setInterval(() => setWatch((w) => Math.min(1, w + 0.02)), 80);
    return () => clearInterval(id);
  }, [watch >= 0]);
  useEffect(() => {
    if (watch >= 1) {
      api.progress(task.id, task.marks.length);
      onClose();
    }
  }, [watch]);
  const L = len(task);
  if (k < 0) {
    const now = task.dusk + L * Math.max(0, watch);
    const passed = task.marks.filter((m) => watch >= m.frac).map((m) => m.name);
    return (
      <View style={[st.card, { width } as never, st.cardMid]}>
        <ContentLabel kind="activity" extra="a water-clock game; water clocks are real" />
        <Text style={st.cardTitle}>Keep watch</Text>
        <Text style={st.cardText}>{watch < 0 ? 'The pegs are set. Sit quietly and watch the water fall through the night.' : `${clock(now)} · ${passed.length ? `past ${passed[passed.length - 1]} of the night` : 'early in the night'}`}</Text>
        <View style={{ alignSelf: 'center', width: 70, height: 150, borderWidth: 3, borderColor: '#8a7a6a', borderRadius: 10, overflow: 'hidden', backgroundColor: '#1a2240' }}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${100 * (1 - Math.max(0, watch))}%` as never, backgroundColor: '#5a8ac8' }} />
          {task.marks.map((m) => (
            <View key={m.name} style={{ position: 'absolute', left: 0, right: 0, bottom: `${100 * (1 - m.frac)}%` as never, height: 2, backgroundColor: '#e8c860' }} />
          ))}
        </View>
        <View style={st.row}>
          {watch < 0 && (
            <Pressable style={st.btn} accessibilityLabel="Keep watch" onPress={() => setWatch(0)}>
              <Text style={st.btnText}>Keep watch</Text>
            </Pressable>
          )}
          <Pressable style={st.btnGhost} onPress={onClose}>
            <Text style={st.btnGhostText}>Close</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  const m = task.marks[k];
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a water-clock game; water clocks are real" />
      <Text style={st.cardTitle}>{`Set the peg for ${m.name} of the night`}</Text>
      <Text style={st.cardText}>{msg || `Tonight the sun sets at ${clock(task.dusk)} and dawn comes at ${clock(task.dawn)}: the night is ${Math.floor(L)} hours${L % 1 ? ` and ${Math.round((L % 1) * 60)} minutes` : ''} long. When will ${m.name} of the night have passed?`}</Text>
      <View style={[st.row, { alignItems: 'center' }]}>
        <Pressable style={st.btnGhost} accessibilityLabel="Earlier" onPress={() => setH(h - 0.25)}>
          <Text style={st.btnGhostText}>− 15 min</Text>
        </Pressable>
        <Text style={[st.cardTitle, { minWidth: 80, textAlign: 'center' }]} accessibilityLabel={`Peg at ${clock(h)}`}>
          {clock(h)}
        </Text>
        <Pressable style={st.btnGhost} accessibilityLabel="Later" onPress={() => setH(h + 0.25)}>
          <Text style={st.btnGhostText}>+ 15 min</Text>
        </Pressable>
      </View>
      <View style={st.row}>
        <Pressable
          style={st.btn}
          accessibilityLabel="Set the peg"
          onPress={() => {
            const want = at(task, m.frac);
            if (Math.abs(h - want) > 0.01) {
              api.note(`${task.id}/x`, k * 1000 + Math.round(h * 4));
              setMsg(`${clock(h)} is ${h < want ? 'too early' : 'too late'} for ${m.name}. The night is ${L} hours: what is ${m.name} of that, counted from sunset?`);
              return;
            }
            api.progress(task.id, k);
            setMsg('');
          }}
        >
          <Text style={st.btnText}>Set the peg</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NightclockView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<NightclockTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const [x, z] = task.at;
  const watched = d.includes(task.marks.length);
  return (
    <group position={[x, t.floorY(x, z), z]} {...tap(() => act(`clock:${task.id}`))}>
      <mesh material={M('#b8784a')} position-y={0.9} castShadow>
        <cylinderGeometry args={[0.35, 0.3, 1.8, 14]} />
      </mesh>
      <mesh material={M('#4a7ab8')} position-y={watched ? 0.15 : 1.6}>
        <cylinderGeometry args={[0.31, 0.31, 0.04, 14]} />
      </mesh>
      {task.marks.map((m, i) =>
        d.includes(i) ? (
          <mesh key={i} material={M('#e8c860')} position={[0.36, 1.75 - m.frac * 1.6, 0]}>
            <boxGeometry args={[0.12, 0.04, 0.04]} />
          </mesh>
        ) : null,
      )}
      <mesh material={M('#6a5a4a')} position-y={0.05}>
        <boxGeometry args={[1, 0.1, 1]} />
      </mesh>
      {d.length < all(task) && <Halo on={active} />}
    </group>
  );
}
