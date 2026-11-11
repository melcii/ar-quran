// Surah Al-Muddaththir: "And your clothing purify" (74:4). At a washing
// stone by a stream on a windy hillside, garments wait in a basket. Wash
// each one properly, step by step: soak it, scrub it on the stone, then rinse
// it again and again until the water runs clear (stopping while the water is
// still cloudy is not clean yet), wring it out and hang it on the line to dry
// in the wind. The hillside and the basket are a game idea; washing clothes
// clean is a real part of keeping clean. No one from the surah is shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { WashTask } from '../types';
import type { Mechanic, MechSave } from './base';

const STEPS = ['soak', 'scrub', 'rinse', 'wring', 'hang'] as const;
type Step = (typeof STEPS)[number];
const doneOf = (task: WashTask, s: MechSave) => (s.done.includes(task.id) ? task.items.map((_, i) => i) : s.prog[task.id] ?? []);
const nextOf = (task: WashTask, d: number[]) => task.items.findIndex((_, i) => !d.includes(i));
/** How cloudy the rinse water is after r rinses (starts at 100, needs task.clear rinses). */
export const cloud = (task: WashTask, r: number) => Math.max(0, Math.round(100 * (1 - r / task.clear)));
const STEP_TEXT: Record<Step, string> = {
  soak: 'Soak it in the stream',
  scrub: 'Scrub it on the stone',
  rinse: 'Rinse it',
  wring: 'Wring it out',
  hang: 'Hang it on the line',
};

export const Wash: Mechanic<WashTask> = {
  total: (task) => task.items.length,
  uses(task, env) {
    if (nextOf(task, doneOf(task, env.save)) < 0) return [];
    return [{ key: `wash:${task.id}`, pos: env.v3(task.at), label: 'Wash at the stone', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (nextOf(task, d) < 0) return;
    return `Washed and hung to dry: ${d.length} of ${task.items.length}`;
  },
  solve(task, api) {
    const i = nextOf(task, doneOf(task, api.save()));
    if (i >= 0) api.progress(task.id, i);
  },
  View: WashView,
  Panel: WashPanel,
};

function WashPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<WashTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = nextOf(task, d);
  const [step, setStep] = useState(0); // index into STEPS reached so far
  const [rinses, setRinses] = useState(0);
  const [msg, setMsg] = useState('');
  if (i < 0) return null;
  const item = task.items[i];
  const c = cloud(task, rinses);
  const press = (s: Step) => {
    const k = STEPS.indexOf(s);
    if (s === 'rinse' && step >= 2 && step <= 3) {
      // Rinsing again is always allowed until the water runs clear.
      if (step === 2) setStep(3);
      const r = rinses + 1;
      setRinses(r);
      const left = cloud(task, r);
      setMsg(left > 0 ? `You rinse the ${item}. The water running out is still cloudy (${left} in 100). Rinse it again.` : `You rinse the ${item}, and now the water runs clear.`);
      return;
    }
    if (s === 'wring' && step === 3 && c > 0) {
      api.note(`${task.id}/early`, i);
      setMsg(`The water from the ${item} is still cloudy. It is not clean yet: keep rinsing until the water runs clear.`);
      return;
    }
    if (k !== step) {
      api.note(`${task.id}/x`, i * 10 + k);
      setMsg(`Not yet. Wash it step by step: first ${STEP_TEXT[STEPS[Math.min(step, 4)]].toLowerCase()}.`);
      return;
    }
    if (s === 'hang') {
      api.progress(task.id, i);
      setStep(0);
      setRinses(0);
      setMsg(`The clean ${item} hangs on the line and flaps dry in the wind.`);
      if (i + 1 >= task.items.length) onClose();
      return;
    }
    setStep(k + 1);
    setMsg(s === 'soak' ? `The ${item} soaks in the cold stream.` : s === 'scrub' ? `You scrub the ${item} on the flat stone. Now rinse the dirt out.` : `You wring the ${item} out. Now hang it up.`);
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a washing game written for this app" />
      <Text style={st.cardTitle}>{`Wash the ${item}`}</Text>
      <Text style={st.cardText}>{msg || `The ${item} is dusty from the road. Wash it properly, one step at a time.`}</Text>
      {step >= 3 && (
        <View style={{ alignSelf: 'center', width: 160, height: 14, borderRadius: 7, backgroundColor: '#5a8ac8', overflow: 'hidden' }} accessibilityLabel={`Rinse water cloudiness ${c} in 100`}>
          <View style={{ width: `${c}%` as never, height: 14, backgroundColor: '#8a7a5a' }} />
        </View>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {STEPS.map((s) => (
          <Pressable key={s} style={st.btnGhost} accessibilityLabel={STEP_TEXT[s]} onPress={() => press(s)}>
            <Text style={st.btnGhostText}>{STEP_TEXT[s]}</Text>
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

const COLORS = ['#e8e0d0', '#c8a878', '#8aa0b8', '#b88a6a', '#d0c8a8', '#a8b890'];

function WashView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<WashTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const left = nextOf(task, d) >= 0;
  const [x, z] = task.at;
  return (
    <group position={[x, t.floorY(x, z), z]}>
      <group {...(left ? tap(() => act(`wash:${task.id}`)) : {})}>
        {/* The flat washing stone. */}
        <mesh material={M('#9a9488', { map: 'stone' })} position-y={0.2} castShadow>
          <boxGeometry args={[1.4, 0.4, 0.9]} />
        </mesh>
        {/* The basket of garments still to wash. */}
        <mesh material={M('#a8784a')} position={[-1.2, 0.25, 0]}>
          <cylinderGeometry args={[0.4, 0.32, 0.5, 12]} />
        </mesh>
        {left && (
          <mesh material={M('#8a7a5a')} position={[-1.2, 0.5, 0]}>
            <sphereGeometry args={[0.3, 8, 6]} />
          </mesh>
        )}
        {left && <Halo on={active} />}
      </group>
      {/* The drying line between two posts, with each washed garment on it. */}
      {[1.2, 4.2].map((px) => (
        <mesh key={px} material={M('#6a4a2a')} position={[px, 0.9, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 1.8, 6]} />
        </mesh>
      ))}
      <mesh material={M('#d8d0c0')} position={[2.7, 1.75, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.01, 0.01, 3, 4]} />
      </mesh>
      {task.items.map((_, i) =>
        d.includes(i) ? (
          <mesh key={i} material={M(COLORS[i % COLORS.length], { side: 2 })} position={[1.6 + (i * 2.2) / Math.max(1, task.items.length - 1), 1.4, 0]}>
            <planeGeometry args={[0.5, 0.7]} />
          </mesh>
        ) : null,
      )}
    </group>
  );
}
