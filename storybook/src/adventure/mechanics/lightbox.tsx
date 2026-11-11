// Surah Al-A'la: measured and guided (87:2-3, "who created and
// proportioned, and who measured out and guided"; 87:4-5, "who brings out
// the pasture, then makes it dark stubble"). In a hillside garden shed
// stands a tall wooden box with a bean seedling at the bottom and shelves
// inside, each with a gap at one end. There are small windows in the sides
// and one in the top. A seedling grows toward the light. Open one window at
// a time to guide the shoot round each shelf and up to the top: open the
// side where the gap is, and the shoot bends that way and climbs through.
// The wrong window leads it under the shelf, pale and stretched. The shed is
// a game; seedlings growing toward light is real.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Line, Polyline, Rect } from 'react-native-svg';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { LightboxTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: LightboxTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.gaps.length + 1 }, (_, i) => i) : s.prog[task.id] ?? []);

export const Lightbox: Mechanic<LightboxTask> = {
  total: (task) => task.gaps.length + 1,
  uses(task, env) {
    if (doneOf(task, env.save).length > task.gaps.length) return [];
    return [{ key: `box:${task.id}`, pos: env.v3(task.at), label: 'Guide the seedling', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length > task.gaps.length) return;
    return `The shoot has climbed past ${d.length} of ${task.gaps.length} shelves`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    if (d.length <= task.gaps.length) api.progress(task.id, d.length);
  },
  View: LightboxView,
  Panel: LightboxPanel,
};

/** The box drawn from the side: shelves with their gaps, and the shoot so far. */
function Box({ task, k, bad }: { task: LightboxTask; k: number; bad: 'left' | 'right' | null }) {
  const W = 120, H = 200, n = task.gaps.length;
  const lv = (i: number) => H - ((i + 1) * H) / (n + 1);
  const pts: [number, number][] = [[W / 2, H - 4]];
  for (let i = 0; i < Math.min(k, n); i++) {
    const gx = task.gaps[i] === 'left' ? 16 : W - 16;
    pts.push([W / 2, lv(i) + 14], [gx, lv(i) + 10], [gx, lv(i) - 10], [W / 2, lv(i) - 16]);
  }
  if (k > n) pts.push([W / 2, 4]);
  if (bad) {
    const y = k < n ? lv(k) + 8 : 10;
    pts.push([bad === 'left' ? 30 : W - 30, y]);
  }
  return (
    <Svg width={W} height={H}>
      <Rect x={1} y={1} width={W - 2} height={H - 2} stroke="#6a4a2a" strokeWidth={3} fill="#2a2018" />
      {task.gaps.map((g, i) => (
        <Line key={i} x1={g === 'left' ? 32 : 0} x2={g === 'left' ? W : W - 32} y1={lv(i)} y2={lv(i)} stroke="#a8784a" strokeWidth={5} />
      ))}
      <Polyline points={pts.map(([x, y]) => `${x},${y}`).join(' ')} stroke={bad ? '#c8c890' : '#6ac04a'} strokeWidth={4} fill="none" />
    </Svg>
  );
}

function LightboxPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<LightboxTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const k = d.length;
  const n = task.gaps.length;
  const [bad, setBad] = useState<'left' | 'right' | null>(null);
  const [msg, setMsg] = useState('');
  if (k > n) return null;
  const open = (w: 'left' | 'right' | 'top') => {
    const want = k < n ? task.gaps[k] : 'top';
    if (w !== want) {
      api.note(`${task.id}/x`, k * 10 + (w === 'left' ? 0 : w === 'right' ? 1 : 2));
      setBad(w === 'top' ? null : w);
      setMsg(
        w === 'top'
          ? 'The top window is too far away: the shoot cannot reach it past the shelf. Open a side window nearer to it.'
          : `The shoot bends ${w}, toward the light, but there is no gap on that side: it grows pale and stretched under the shelf. Close it and open the other window.`,
      );
      return;
    }
    setBad(null);
    api.progress(task.id, k);
    if (k >= n) {
      setMsg('');
      api.hint('The shoot climbs out of the top of the box into the sunlight, green and strong.');
      onClose();
      return;
    }
    setMsg(`The shoot bends ${w} toward the light, finds the gap and climbs through.`);
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a growing game; seedlings grow toward light" />
      <Text style={st.cardTitle}>Guide the seedling</Text>
      <Text style={st.cardText}>{msg || 'The seedling grows toward the light. Open one window at a time to lead it round each shelf, up to the top.'}</Text>
      <View style={{ alignSelf: 'center' }} accessibilityLabel={`The light box: the shoot is past ${k} of ${n} shelves`}>
        <Box task={task} k={k} bad={bad} />
      </View>
      <View style={[st.row, { justifyContent: 'center' }]}>
        <Pressable style={st.btnGhost} accessibilityLabel="Open the left window" onPress={() => open('left')}>
          <Text style={st.btnGhostText}>◀ Left window</Text>
        </Pressable>
        <Pressable style={st.btnGhost} accessibilityLabel="Open the top window" onPress={() => open('top')}>
          <Text style={st.btnGhostText}>Top window</Text>
        </Pressable>
        <Pressable style={st.btnGhost} accessibilityLabel="Open the right window" onPress={() => open('right')}>
          <Text style={st.btnGhostText}>Right window ▶</Text>
        </Pressable>
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LightboxView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<LightboxTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const out = d.length > task.gaps.length;
  const [x, z] = task.at;
  return (
    <group position={[x, t.floorY(x, z), z]} {...(!out ? tap(() => act(`box:${task.id}`)) : {})}>
      <mesh material={M('#8a6a44', { map: 'planks' })} position-y={1} castShadow>
        <boxGeometry args={[0.8, 2, 0.6]} />
      </mesh>
      {/* The shoot climbs out of the top once guided all the way. */}
      <mesh material={M('#6ac04a')} position-y={out ? 2.35 : 2.02} scale={out ? 1 : 0.3}>
        <coneGeometry args={[0.12, 0.7, 6]} />
      </mesh>
      {!out && <Halo on={active} />}
    </group>
  );
}
