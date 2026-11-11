// Surah Al-Qiyamah: the fingertips (75:3-4, "Does man think that We will
// not assemble his bones? Yes, We are able to put together even his
// fingertips"; 75:14-15, "a person will be a witness against himself, even
// if he presents his excuses"). In a potter's yard, clay tablets lie drying
// in the sun. Yesterday you and others pressed them by hand, and each one
// carries a fingerprint. On the bench is an ink card with your own five
// prints. Look closely at each tablet: the ridges make a loop, a whorl or an
// arch, and every print has its own small mark. Say which of your fingers
// made it, or that it is not yours. No two people's fingertips are the same.
// The yard and the tablets are a game; fingerprints are real.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { PrintsTask } from '../types';
import type { Mechanic, MechSave } from './base';

type Kind = PrintsTask['mine'][number]['type'];
const doneOf = (task: PrintsTask, s: MechSave) => (s.done.includes(task.id) ? task.tablets.map((_, i) => i) : s.prog[task.id] ?? []);
/** Which tablet's panel is open (shared by the 3D tap and the panel). */
const at: Record<string, number> = {};
/** Where each print's own small mark (an island in the ridges) sits. */
const MARKS: [number, number][] = [[30, 30], [70, 30], [30, 70], [70, 70]];

/** A fingerprint drawn in ridges: a loop, a whorl or an arch, with its small mark. */
export function Print({ type, mark, size = 64 }: { type: Kind; mark: number; size?: number }) {
  const ink = '#3a2a22';
  const ridges: string[] = [];
  if (type === 'loop')
    for (let k = 0; k < 6; k++) {
      const w = 8 + k * 6;
      ridges.push(`M ${50 - w} 92 L ${50 - w} ${50} A ${w} ${w} 0 0 1 ${50 + w} 50 L ${50 + w} 92`);
    }
  else if (type === 'arch')
    for (let k = 0; k < 7; k++) ridges.push(`M 8 ${88 - k * 9} Q 50 ${60 - k * 11} 92 ${88 - k * 9}`);
  const [mx, my] = MARKS[mark % MARKS.length];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={46} fill="#e8d2b0" />
      {type === 'whorl' && [8, 15, 22, 29, 36, 43].map((r) => <Circle key={r} cx={50} cy={50} r={r} stroke={ink} strokeWidth={2.4} fill="none" />)}
      {ridges.map((d, i) => (
        <Path key={i} d={d} stroke={ink} strokeWidth={2.4} fill="none" />
      ))}
      <Circle cx={mx} cy={my} r={5} fill="#e8d2b0" />
      <Circle cx={mx} cy={my} r={2.4} fill={ink} />
    </Svg>
  );
}

export const Prints: Mechanic<PrintsTask> = {
  total: (task) => task.tablets.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    return task.tablets.flatMap((tb, i) =>
      d.includes(i)
        ? []
        : [{ key: `tablet:${task.id}:${i}`, pos: env.v3(tb.at), label: 'Look at the print in the clay', reach: 2.2, run: () => {
            at[task.id] = i;
            env.api.panel(task);
          } }],
    );
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length < task.tablets.length) return `Clay tablets looked at: ${d.length} of ${task.tablets.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.tablets.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: PrintsView,
  Panel: PrintsPanel,
};

function PrintsPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<PrintsTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = at[task.id] ?? 0;
  const tb = task.tablets[i];
  const [msg, setMsg] = useState('');
  if (!tb || d.includes(i)) return null;
  const answer = (k: number) => {
    if (k !== tb.of) {
      api.note(`${task.id}/x`, i * 10 + (k + 1));
      const f = k >= 0 ? task.mine[k] : null;
      setMsg(
        f && f.type !== tb.type
          ? `Look at the ridges: your ${f.finger} makes ${f.type === 'arch' ? 'an arch' : `a ${f.type}`}, but this print does not.`
          : f
            ? `The ridges match your ${f.finger}, but look at the small mark: is it in the same place?`
            : 'Look again: one of your own fingers has this pattern, with its mark in the same place.',
      );
      return;
    }
    api.progress(task.id, i);
    api.hint(k >= 0 ? `Yes: your own ${task.mine[k].finger} made this print.` : 'Yes: someone else made this one. No two people’s fingertips are the same.');
    onClose();
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a matching game; fingerprints are real" />
      <Text style={st.cardTitle}>A print in the clay</Text>
      <Text style={st.cardText}>{msg || 'Whose fingertip pressed this tablet? Compare it with your own five prints on the ink card.'}</Text>
      <View style={{ alignSelf: 'center' }} accessibilityLabel={`The print in the clay: ${tb.type === 'arch' ? 'an arch' : `a ${tb.type}`}`}>
        <Print type={tb.type} mark={tb.mark} size={110} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {task.mine.map((f, k) => (
          <Pressable key={k} style={[st.btnGhost, { alignItems: 'center' }]} accessibilityLabel={`My ${f.finger}`} onPress={() => answer(k)}>
            <Print type={f.type} mark={f.mark} size={52} />
            <Text style={st.btnGhostText}>{f.finger}</Text>
          </Pressable>
        ))}
      </View>
      <View style={st.row}>
        <Pressable style={st.btn} accessibilityLabel="Not mine" onPress={() => answer(-1)}>
          <Text style={st.btnText}>Not mine</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PrintsView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<PrintsTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const [bx, bz] = task.at;
  return (
    <group>
      {/* The bench with the ink card of your own prints. */}
      <group position={[bx, t.floorY(bx, bz), bz]}>
        <mesh material={M('#8a6a44')} position-y={0.4} castShadow>
          <boxGeometry args={[1.6, 0.8, 0.7]} />
        </mesh>
        <mesh material={M('#f2ead8')} position-y={0.81} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.8, 0.5]} />
        </mesh>
        {task.mine.map((_, k) => (
          <mesh key={k} material={M('#3a2a22')} position={[-0.3 + k * 0.15, 0.815, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.05, 10]} />
          </mesh>
        ))}
      </group>
      {task.tablets.map((tb, i) => {
        const [x, z] = tb.at;
        const seen = d.includes(i);
        return (
          <group key={i} position={[x, t.floorY(x, z), z]} {...(!seen ? tap(() => act(`tablet:${task.id}:${i}`)) : {})}>
            <mesh material={M('#6a5040')} position-y={0.2}>
              <boxGeometry args={[0.9, 0.4, 0.9]} />
            </mesh>
            <mesh material={M(seen ? (tb.of >= 0 ? '#c88a5a' : '#a89a8a') : '#b87a50')} position-y={0.45} castShadow>
              <boxGeometry args={[0.6, 0.1, 0.45]} />
            </mesh>
            <mesh material={M('#7a5038')} position={[0, 0.505, 0]} rotation-x={-Math.PI / 2}>
              <circleGeometry args={[0.1, 12]} />
            </mesh>
            {!seen && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
