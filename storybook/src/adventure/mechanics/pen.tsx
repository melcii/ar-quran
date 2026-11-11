// Surah Al-Alaq: the pen (96:1-5, "Read in the name of your Lord who
// created ... Read, and your Lord is the Most Generous, who taught by the
// pen, taught man what he did not know"). In a village school courtyard in
// the morning, the children are learning to write. First make a reed pen:
// cut the reed at a slant and split its tip so the ink runs down. Then dip
// it in the ink pot and trace practice letter shapes, dot by dot, in the
// order the stroke runs; the reed holds only a little ink, so dip again
// when it runs dry. The shapes are plain practice letters, never ayahs: no
// Quran text is drawn or written by the game. The school is a game; reed
// pens are real. The Prophet and the first revelation are read only.
import { type ReactElement, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { PenTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: PenTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.letters.length + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
const BOX = 200;

export const Pen: Mechanic<PenTask> = {
  total: (task) => task.letters.length + 1,
  uses(task, env) {
    if (doneOf(task, env.save).length > task.letters.length) return [];
    return [{ key: `pen:${task.id}`, pos: env.v3(task.at), label: doneOf(task, env.save).includes(0) ? 'Practise the letters' : 'Cut a reed pen', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length > task.letters.length) return;
    return d.includes(0) ? `Letters traced: ${d.length - 1} of ${task.letters.length}` : 'Cut a reed pen at the writing bench';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: task.letters.length + 1 }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: PenView,
  Panel: PenPanel,
};

function PenPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<PenTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [cut, setCut] = useState<'' | 'straight' | 'slant'>('');
  const [msg, setMsg] = useState('');
  const [n, setN] = useState(0); // dots traced on this letter
  const [ink, setInk] = useState(0); // dots left before the reed runs dry
  if (d.length > task.letters.length) return null;
  const head = (title: string, text: string, body: ReactElement) => (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a writing game; reed pens are real; practice shapes only, no Quran text" />
      <Text style={st.cardTitle}>{title}</Text>
      <Text style={st.cardText}>{msg || text}</Text>
      {body}
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
  if (!d.includes(0))
    return head(
      'Cut a reed pen',
      'A reed pen needs a slanted tip, and a small split up the middle so the ink runs down to the point.',
      <View style={[st.row, { flexWrap: 'wrap', justifyContent: 'center' }]}>
        <Pressable style={cut === 'straight' ? st.btn : st.btnGhost} accessibilityLabel="Cut straight across" onPress={() => { setCut('straight'); setMsg('A flat cut makes a blunt tip: the lines will come out thick and blotchy.'); }}>
          <Text style={cut === 'straight' ? st.btnText : st.btnGhostText}>Cut straight across</Text>
        </Pressable>
        <Pressable style={cut === 'slant' ? st.btn : st.btnGhost} accessibilityLabel="Cut at a slant" onPress={() => { setCut('slant'); setMsg('A clean slanted tip. Now split it.'); }}>
          <Text style={cut === 'slant' ? st.btnText : st.btnGhostText}>Cut at a slant</Text>
        </Pressable>
        <Pressable style={st.btnGhost} accessibilityLabel="Split the tip" onPress={() => {
          if (cut !== 'slant') {
            api.note(`${task.id}/blunt`, cut === 'straight' ? 1 : 0);
            setMsg(cut ? 'Split a blunt tip and it still blots. Cut it at a slant first.' : 'Cut the tip first, then split it.');
            return;
          }
          api.progress(task.id, 0);
          setMsg('');
          setInk(0);
          api.hint('Your reed pen is ready: a slanted tip with a fine split to carry the ink.');
        }}>
          <Text style={st.btnGhostText}>Split the tip</Text>
        </Pressable>
      </View>,
    );
  const li = task.letters.findIndex((_, k) => !d.includes(k + 1));
  const L = task.letters[li];
  const sc = (p: [number, number]) => [10 + p[0] * (BOX - 20), 10 + p[1] * (BOX - 20)] as const;
  const drawn = L.pts.slice(0, n).map((p) => sc(p).join(',')).join(' ');
  return head(
    `Trace the ${L.name}`,
    'Tap the dots in the order the stroke runs, from dot 1. The reed holds only a little ink: dip it when it runs dry.',
    <>
      <View style={{ alignSelf: 'center', width: BOX, height: BOX, backgroundColor: '#f2e6c8', borderRadius: 8 }}>
        <Svg width={BOX} height={BOX} style={{ position: 'absolute' }}>
          {n > 1 && <Polyline points={drawn} stroke="#2a2018" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          {L.pts.map((p, k) => <Circle key={k} cx={sc(p)[0]} cy={sc(p)[1]} r={k < n ? 4 : 9} fill={k < n ? '#2a2018' : k === n ? '#c8a050' : '#d8c8a0'} />)}
        </Svg>
        {L.pts.map((p, k) =>
          k < n ? null : (
            <Pressable
              key={k}
              accessibilityLabel={`Dot ${k + 1}`}
              style={{ position: 'absolute', left: sc(p)[0] - 13, top: sc(p)[1] - 13, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => {
                if (k !== n) {
                  api.note(`${task.id}/order`, li * 100 + k);
                  setMsg(`That is dot ${k + 1}. The stroke runs on from dot ${n + 1}: follow it in order.`);
                  return;
                }
                if (ink <= 0) {
                  api.note(`${task.id}/dry`, li * 100 + k);
                  setMsg('The reed scratches but leaves no mark: it has run dry. Dip it in the ink.');
                  return;
                }
                setInk(ink - 1);
                const m = n + 1;
                setN(m);
                if (m >= L.pts.length) {
                  api.progress(task.id, li + 1);
                  setN(0);
                  setMsg(li + 1 >= task.letters.length ? '' : `A clean ${L.name}. On to the next shape.`);
                  if (li + 1 >= task.letters.length) {
                    api.hint('Every practice letter traced in clean, dark lines. Learning to write starts here.');
                    onClose();
                  }
                } else setMsg('');
              }}
            >
              <Text style={{ fontSize: 10, color: '#3a2a22' }}>{k + 1}</Text>
            </Pressable>
          ),
        )}
      </View>
      <View style={[st.row, { justifyContent: 'center' }]}>
        <Pressable style={st.btn} accessibilityLabel="Dip the pen" onPress={() => {
          if (ink > 0) {
            api.note(`${task.id}/flood`, li);
            setMsg('The reed is still wet: dip it again and it will drip and blot. Write until it runs dry.');
            return;
          }
          setInk(task.ink);
          setMsg('You dip the reed: it carries just enough ink for a few dots.');
        }}>
          <Text style={st.btnText}>Dip the pen</Text>
        </Pressable>
      </View>
      <Text style={[st.cardText, { textAlign: 'center' }]}>{ink > 0 ? `Ink on the reed: ${ink} dots` : 'The reed is dry'}</Text>
    </>,
  );
}

function PenView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<PenTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const all = d.length > task.letters.length;
  const [x, z] = task.at;
  return (
    <group position={[x, t.floorY(x, z), z]} {...(!all ? tap(() => act(`pen:${task.id}`)) : {})}>
      {/* The low writing bench, its ink pot, the reed, and a board of practice sheets. */}
      <mesh material={M('#7a5a3a')} position-y={0.35} castShadow>
        <boxGeometry args={[1.6, 0.12, 0.8]} />
      </mesh>
      {[-0.65, 0.65].map((px) => (
        <mesh key={px} material={M('#6a4a2a')} position={[px, 0.15, 0]}>
          <boxGeometry args={[0.1, 0.3, 0.7]} />
        </mesh>
      ))}
      <mesh material={M('#2a2a3a')} position={[0.55, 0.47, 0.2]}>
        <cylinderGeometry args={[0.08, 0.1, 0.14, 10]} />
      </mesh>
      {d.includes(0) && (
        <mesh material={M('#c8b070')} position={[0.3, 0.43, -0.1]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
        </mesh>
      )}
      {task.letters.map((_, k) => (
        <mesh key={k} material={M(d.includes(k + 1) ? '#f4ecd8' : '#d8ccb0')} position={[-0.5 + k * 0.32, 0.42, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.28, 0.36]} />
        </mesh>
      ))}
      {!all && <Halo on={active} />}
    </group>
  );
}
