// Surah Al-Ikhlas: say, He is Allah, One (112:1-4, "Say: He is Allah, the
// One; Allah, the Eternal Refuge; He neither begets nor is born, and there
// is none comparable to Him"). A quiet reading room is being finished, and
// its floor will carry a six-fold geometric rosette, the kind craftsmen
// have long drawn with only a compass and a straightedge. Draw it the real
// way: one circle; keep the compass at the same width and step it round the
// edge, and it fits exactly six times; the arcs make a six-petalled
// rosette; join the points into a hexagon. The
// pattern is only floor decoration for a room to read in: no shape, line or
// pattern here stands for Allah, to whom none is comparable. The room is a
// game; the construction is real geometry.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { CompassTask } from '../types';
import type { Mechanic, MechSave } from './base';

const STEPS = 8; // circle, six steps round the edge, the hexagon
const doneOf = (task: CompassTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: STEPS }, (_, i) => i) : s.prog[task.id] ?? []);
const S = 200;
const R = 70;
const pt = (k: number) => [S / 2 + R * Math.cos(-Math.PI / 2 + (k * Math.PI) / 3), S / 2 + R * Math.sin(-Math.PI / 2 + (k * Math.PI) / 3)] as const;

export const Compass: Mechanic<CompassTask> = {
  total: () => STEPS,
  uses(task, env) {
    if (doneOf(task, env.save).length >= STEPS) return [];
    return [{ key: `draw:${task.id}`, pos: env.v3(task.at), label: 'Draw the floor pattern', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= STEPS) return;
    return d.length === 0 ? 'Draw the floor pattern: start with one circle' : d.length < 7 ? `Compass steps round the circle: ${d.length - 1} of 6` : 'Join the points with the straight edge';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    if (d.length < STEPS) api.progress(task.id, d.length);
  },
  View: CompassView,
  Panel: CompassPanel,
};

function CompassPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<CompassTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [msg, setMsg] = useState('');
  if (d.length >= STEPS) return null;
  const n = d.length;
  const marks = Math.max(0, n - 1);
  const btn = (label: string, run: () => void) => (
    <Pressable key={label} style={st.btnGhost} accessibilityLabel={label} onPress={run}>
      <Text style={st.btnGhostText}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a geometry game; compass-and-straightedge patterns are real; no shape stands for Allah" />
      <Text style={st.cardTitle}>The reading-room floor</Text>
      <Text style={st.cardText}>{msg || 'Draw one circle. Then, keeping the compass at the same width, step it round the edge. Then join the points.'}</Text>
      <View style={{ alignSelf: 'center', width: S, height: S, backgroundColor: '#f2ead6', borderRadius: 8 }}>
        <Svg width={S} height={S}>
          {n >= 1 && <Circle cx={S / 2} cy={S / 2} r={R} stroke="#5a4a3a" strokeWidth={1.5} fill="none" />}
          {Array.from({ length: marks }, (_, k) => (
            <Circle key={k} cx={pt(k + 1)[0]} cy={pt(k + 1)[1]} r={R} stroke="#c8b898" strokeWidth={0.8} fill="none" />
          ))}
          {Array.from({ length: Math.min(6, marks + (n >= 1 ? 1 : 0)) }, (_, k) => (
            <Circle key={`p${k}`} cx={pt(k)[0]} cy={pt(k)[1]} r={3.5} fill="#8a3a1a" />
          ))}
          {d.includes(7) && <Polygon points={[0, 1, 2, 3, 4, 5].map((k) => pt(k).join(',')).join(' ')} stroke="#2a5a7a" strokeWidth={2} fill="none" />}
        </Svg>
      </View>
      <View style={[st.row, { flexWrap: 'wrap', justifyContent: 'center' }]}>
        {btn('Draw a circle', () => {
          if (n > 0) {
            setMsg('The circle is drawn. Now step the compass round its edge.');
            return;
          }
          api.progress(task.id, 0);
          setMsg('One circle. Put the compass point on the top of the circle, at the same width.');
        })}
        {btn('Step the compass along the edge', () => {
          if (n === 0) {
            api.note(`${task.id}/early`, 0);
            setMsg('There is no circle yet to step round. Draw it first.');
            return;
          }
          if (n >= 7) {
            api.note(`${task.id}/over`, n);
            setMsg('The sixth step already landed exactly back on the first point. There are six points: no more fit.');
            return;
          }
          api.progress(task.id, n);
          setMsg(n < 6 ? `Step ${n}: a new point on the edge, exactly one compass-width along.` : 'The sixth step lands exactly on the point where you began. The same width fits round the circle exactly six times.');
        })}
        {btn('Change the compass width', () => {
          api.note(`${task.id}/width`, n);
          setMsg(n === 0 ? 'Any width will do for the circle, but once it is drawn, keep it: that is what makes the steps fit exactly.' : 'Keep the same width! The radius steps round the circle exactly six times; any other width and the points will not meet.');
        })}
        {btn('Join the points with the straight edge', () => {
          if (n < 7) {
            api.note(`${task.id}/x`, n);
            setMsg('Not all six points are marked yet. Keep stepping round the edge.');
            return;
          }
          api.progress(task.id, 7);
          api.hint('A six-petalled rosette in a perfect hexagon, drawn with nothing but a compass and a straight edge. The floor of the reading room is ready.');
          onClose();
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

function CompassView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<CompassTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const all = d.length >= STEPS;
  const [x, z] = task.at;
  return (
    <group position={[x, t.floorY(x, z), z]} {...(!all ? tap(() => act(`draw:${task.id}`)) : {})}>
      {/* The floor inlay: a circle, the marked points, and the hexagon once joined. */}
      {d.includes(0) && (
        <mesh material={M('#5a4a3a')} position-y={0.03} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[1.9, 2, 48]} />
        </mesh>
      )}
      {Array.from({ length: Math.max(0, d.length - 1) }, (_, k) => (
        <mesh key={k} material={M('#8a3a1a')} position={[Math.sin((k * Math.PI) / 3) * 2, 0.04, -Math.cos((k * Math.PI) / 3) * 2]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.1, 10]} />
        </mesh>
      ))}
      {d.includes(7) && (
        <mesh material={M('#2a5a7a')} position-y={0.035} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <ringGeometry args={[1.88, 1.98, 6]} />
        </mesh>
      )}
      {!all && <Halo on={active} />}
    </group>
  );
}
