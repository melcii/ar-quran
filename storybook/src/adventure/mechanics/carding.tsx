// Surah Al-Qari'ah: like carded wool (101:4-5, "the Day when people will be
// like scattered moths, and the mountains like carded wool"). On the porch
// of a shepherd's house at dusk, with moths circling the lantern, the
// spring fleece is waiting to be carded. First pick out every burr, or the
// carders will drag it through the wool. Load a tuft onto the carder, brush
// it with the other until the fibres lie straight, pass it across, brush
// again, then roll it off as a soft, light roll of wool. Do it in the wrong
// order and the wool knots. The porch is a game; carding wool is real. The
// Day itself and the scales of 101:6-9 are read only, never shown.
import { type ReactElement, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { CardingTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: CardingTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.batches }, (_, i) => i) : s.prog[task.id] ?? []);
/** Burrs picked so far (saved, so they stay picked). */
const pickedOf = (task: CardingTask, s: MechSave) => (s.done.includes(task.id) ? task.burrs.map((_, i) => i) : s.prog[`${task.id}/burrs`] ?? []);
const BOX = 220;
type Step = 'load' | 'brush1' | 'pass' | 'brush2' | 'roll';

export const Carding: Mechanic<CardingTask> = {
  total: (task) => task.batches,
  uses(task, env) {
    if (doneOf(task, env.save).length >= task.batches) return [];
    return [{ key: `card:${task.id}`, pos: env.v3(task.at), label: 'Card the fleece', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.batches) return;
    const p = pickedOf(task, env.save).length;
    return p < task.burrs.length ? `Burrs picked from the fleece: ${p} of ${task.burrs.length}` : `Rolls of carded wool: ${d.length} of ${task.batches}`;
  },
  solve(task, api) {
    const s = api.save();
    api.set(`${task.id}/burrs`, task.burrs.map((_, i) => i));
    const d = doneOf(task, s);
    if (d.length < task.batches) api.progress(task.id, d.length);
  },
  View: CardingView,
  Panel: CardingPanel,
};

/** A tuft of fleece: tangled curls before carding, straight fibres after. */
function Tuft({ combed, size }: { combed: number; size: number }) {
  const lines = Array.from({ length: 9 }, (_, k) => {
    const y = 20 + k * 7;
    const wob = (1 - combed) * 9;
    return `M10 ${y} C 30 ${y - wob}, 50 ${y + wob}, 70 ${y} S 110 ${y - wob}, 130 ${y}`;
  });
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 140 84">
      {lines.map((d, k) => <Path key={k} d={d} stroke="#c8b898" strokeWidth={3} fill="none" />)}
    </Svg>
  );
}

function CardingPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<CardingTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const picked = pickedOf(task, data);
  const [step, setStep] = useState<Step>('load');
  const [n, setN] = useState(0);
  const [msg, setMsg] = useState('');
  if (d.length >= task.batches) return null;
  const head = (title: string, text: string, body: ReactElement) => (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a carding game; carding wool is real" />
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
  if (picked.length < task.burrs.length)
    return head(
      'Pick out the burrs',
      'The fleece is full of prickly burrs from the hillside. Find and pick out every one before carding.',
      <View style={{ alignSelf: 'center', width: BOX, height: BOX * 0.7, backgroundColor: '#efe4cc', borderRadius: 12 }}>
        <Svg width={BOX} height={BOX * 0.7} style={{ position: 'absolute' }}>
          {Array.from({ length: 40 }, (_, k) => (
            <Circle key={k} cx={12 + ((k * 37) % (BOX - 24))} cy={12 + ((k * 23) % (BOX * 0.7 - 24))} r={12} fill="#e2d6ba" />
          ))}
        </Svg>
        {task.burrs.map((b, i) =>
          picked.includes(i) ? null : (
            <Pressable
              key={i}
              accessibilityLabel={`Burr ${i + 1}`}
              onPress={() => {
                api.set(`${task.id}/burrs`, [...picked, i]);
                setMsg(picked.length + 1 < task.burrs.length ? 'Got it. There are more in there.' : 'Every burr is out. Now the carding.');
              }}
              style={{ position: 'absolute', left: b[0] * (BOX - 24), top: b[1] * (BOX * 0.7 - 24), width: 24, height: 24, borderRadius: 12, backgroundColor: '#7a5a2a', borderWidth: 2, borderColor: '#4a3418' }}
            />
          ),
        )}
      </View>,
    );
  const combed = step === 'load' ? 0 : step === 'brush1' ? (n / task.strokes) * 0.6 : step === 'pass' ? 0.6 : step === 'brush2' ? 0.6 + (n / task.strokes) * 0.4 : 1;
  const want: Record<Step, string> = { load: 'Load a tuft onto the carder', brush1: 'Brush the wool', pass: 'Pass it to the other carder', brush2: 'Brush the wool', roll: 'Roll it off' };
  const doStep = (label: string) => {
    if (label === 'Brush the wool' && (step === 'brush1' || step === 'brush2')) {
      const k = n + 1;
      setN(k);
      if (k >= task.strokes) {
        setN(0);
        setStep(step === 'brush1' ? 'pass' : 'roll');
        setMsg(step === 'brush1' ? 'The fibres on this side lie straight. Pass the wool across to the other carder.' : 'Straight and soft all through. Roll it off.');
      } else setMsg(`Brush ${k} of ${task.strokes}: the fibres are straightening.`);
      return;
    }
    if (label !== want[step]) {
      api.note(`${task.id}/x`, d.length * 10 + Object.keys(want).indexOf(step));
      setMsg(step === 'load' ? 'There is no wool on the carder yet: load a tuft first.' : step === 'pass' || step === 'roll' ? 'Brush any more and you will only break the fibres. ' + (step === 'pass' ? 'Pass it across.' : 'Roll it off.') : 'The fibres are still tangled: brush it until they lie straight.');
      return;
    }
    if (step === 'load') { setStep('brush1'); setMsg('A tuft of fleece sits on the carder\'s teeth. Brush it with the other carder.'); return; }
    if (step === 'pass') { setStep('brush2'); setMsg('Now the other side. Brush again.'); return; }
    api.progress(task.id, d.length);
    setStep('load');
    setMsg(d.length + 1 < task.batches ? 'A soft, light roll of wool, so light it hardly weighs anything. Load the next tuft.' : '');
    if (d.length + 1 >= task.batches) {
      api.hint('A basket of soft carded rolls, light as air. Like the mountains on that Day, says the surah: carded wool.');
      onClose();
    }
  };
  return head(
    `Card the wool (${d.length + 1} of ${task.batches})`,
    'Load a tuft onto one carder, brush it with the other until the fibres lie straight, pass it across, brush again, then roll it off.',
    <>
      <View style={{ alignSelf: 'center' }}>{step === 'load' ? <Text style={st.cardText}>The carders are empty.</Text> : <Tuft combed={combed} size={BOX} />}</View>
      <View style={[st.row, { flexWrap: 'wrap', justifyContent: 'center' }]}>
        {['Load a tuft onto the carder', 'Brush the wool', 'Pass it to the other carder', 'Roll it off'].map((l) => (
          <Pressable key={l} style={st.btnGhost} accessibilityLabel={l} onPress={() => doStep(l)}>
            <Text style={st.btnGhostText}>{l}</Text>
          </Pressable>
        ))}
      </View>
    </>,
  );
}

function CardingView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<CardingTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const all = d.length >= task.batches;
  const [x, z] = task.at;
  const moths = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = moths.current;
    if (!g) return;
    g.children.forEach((m, k) => {
      const a = clock.elapsedTime * (1.6 + k * 0.3) + k * 1.7;
      m.position.set(Math.cos(a) * (0.3 + (k % 3) * 0.12), 2.1 + Math.sin(a * 1.3) * 0.2, Math.sin(a) * (0.3 + (k % 2) * 0.15));
    });
  });
  return (
    <group position={[x, t.floorY(x, z), z]} {...(!all ? tap(() => act(`card:${task.id}`)) : {})}>
      {/* The bench, the fleece heap, the carded rolls, and the lantern with moths about it. */}
      <mesh material={M('#7a5a3a')} position-y={0.4}>
        <boxGeometry args={[1.8, 0.1, 0.7]} />
      </mesh>
      <mesh material={M('#e8dcc0')} position={[-0.5, 0.6, 0]} scale={[1, 0.5, 0.8]}>
        <icosahedronGeometry args={[0.35, 1]} />
      </mesh>
      {d.map((k) => (
        <mesh key={k} material={M('#f8f2e4')} position={[0.2 + k * 0.22, 0.52, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
        </mesh>
      ))}
      <mesh material={M('#3a3a3a')} position={[0, 1.9, -0.2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.4, 4]} />
      </mesh>
      <mesh material={M('#ffe0a0', { emissive: '#ffb050', ei: 1.4 })} position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.12, 10, 8]} />
      </mesh>
      <pointLight position-y={2.1} color="#ffcf80" intensity={1.4} distance={6} />
      <group ref={moths}>
        {Array.from({ length: 6 }, (_, k) => (
          <mesh key={k} material={M('#e8e0d0', { side: 2 })}>
            <planeGeometry args={[0.06, 0.04]} />
          </mesh>
        ))}
      </group>
      {!all && <Halo on={active} />}
    </group>
  );
}
