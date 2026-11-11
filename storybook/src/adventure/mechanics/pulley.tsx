// Surah Al-Layl: easing toward ease (92:5-7, "As for the one who gives and
// is mindful, and believes in the best, We will ease him toward ease"). At
// the village granary in the evening, loads given for the poor must be
// lifted up to the loft door: a sack of flour, a jar of oil, a millstone and
// a roof beam. You can pull only so hard. A rope over one pulley lifts what
// you can pull; with more pulleys, the load hangs on more strands of rope
// and each pull is lighter, but you pull more rope. Choose just as many
// pulleys as each load needs. The granary is a game; pulleys are real. The
// ease the ayah promises is from Allah; this is only a picture of help.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { PulleyTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: PulleyTask, s: MechSave) => (s.done.includes(task.id) ? task.loads.map((_, i) => i) : s.prog[task.id] ?? []);
const nextOf = (task: PulleyTask, d: number[]) => task.loads.findIndex((_, i) => !d.includes(i));
/** The fewest rope strands that bring a load within your strength. */
export const strands = (task: PulleyTask, kg: number) => Math.ceil(kg / task.strength - 1e-9);

export const Pulley: Mechanic<PulleyTask> = {
  total: (task) => task.loads.length,
  uses(task, env) {
    const i = nextOf(task, doneOf(task, env.save));
    if (i < 0) return [];
    return [{ key: `hoist:${task.id}`, pos: env.v3(task.at), label: `Lift the ${task.loads[i].what}`, reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (nextOf(task, d) < 0) return;
    return `Loads lifted to the loft: ${d.length} of ${task.loads.length} · you can pull ${task.strength} kg`;
  },
  solve(task, api) {
    const i = nextOf(task, doneOf(task, api.save()));
    if (i >= 0) api.progress(task.id, i);
  },
  View: PulleyView,
  Panel: PulleyPanel,
};

function PulleyPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<PulleyTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = nextOf(task, d);
  const [n, setN] = useState(1);
  const [msg, setMsg] = useState('');
  if (i < 0) return null;
  const L = task.loads[i];
  const need = strands(task, L.kg);
  const pull = Math.round((L.kg / n) * 10) / 10;
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a lifting game; pulleys are real" />
      <Text style={st.cardTitle}>{`Lift the ${L.what}`}</Text>
      <Text style={st.cardText}>{msg || `The ${L.what} weighs ${L.kg} kg. You can pull ${task.strength} kg. How many pulleys will you rig, so the load hangs on that many strands of rope?`}</Text>
      <View style={[st.row, { justifyContent: 'center' }]}>
        {[1, 2, 3, 4].map((k) => (
          <Pressable key={k} style={n === k ? st.btn : st.btnGhost} accessibilityLabel={`${k} ${k === 1 ? 'pulley' : 'pulleys'}`} onPress={() => { setN(k); setMsg(''); }}>
            <Text style={n === k ? st.btnText : st.btnGhostText}>{`${k} ${k === 1 ? 'pulley' : 'pulleys'}`}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[st.cardText, { textAlign: 'center' }]}>{`Each pull: ${pull} kg · rope to pull: ${n * 4} m to lift it 4 m`}</Text>
      <View style={st.row}>
        <Pressable
          style={st.btn}
          accessibilityLabel="Pull"
          onPress={() => {
            if (n < need) {
              api.note(`${task.id}/x`, i * 10 + n);
              setMsg(`You pull with all your strength, but ${pull} kg is more than you can pull. It will not budge. Spread the load over more strands.`);
              return;
            }
            if (n > need) {
              api.note(`${task.id}/more`, i * 10 + n);
              setMsg(`It would lift, but you would pull ${n * 4} m of rope when ${need * 4} m would do. Use only as many pulleys as you need.`);
              return;
            }
            api.progress(task.id, i);
            setN(1);
            setMsg(`Hand over hand, the ${L.what} rises to the loft door. Each pull is ${pull} kg: just within your strength.`);
            if (i + 1 >= task.loads.length) onClose();
          }}
        >
          <Text style={st.btnText}>Pull</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PulleyView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<PulleyTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const i = nextOf(task, d);
  const [x, z] = task.at;
  return (
    <group position={[x, t.floorY(x, z), z]}>
      {/* The hoist beam out from the loft, its pulley, and the rope. */}
      <mesh material={M('#6a4a2a')} position={[0, 4.4, 0.6]}>
        <boxGeometry args={[0.2, 0.2, 1.6]} />
      </mesh>
      <mesh material={M('#8a8a8a', { metal: 0.6 })} position={[0, 4.15, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.18, 0.18, 0.08, 14]} />
      </mesh>
      <mesh material={M('#d8c8a0')} position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3.4, 4]} />
      </mesh>
      <group {...(i >= 0 ? tap(() => act(`hoist:${task.id}`)) : {})}>
        {i >= 0 && (
          <mesh material={M('#a8784a')} position={[0, 0.35, 0]}>
            <boxGeometry args={[0.6, 0.7, 0.6]} />
          </mesh>
        )}
        {i >= 0 && <Halo on={active} />}
      </group>
      {/* What has been lifted waits in the loft door. */}
      {d.map((k) => (
        <mesh key={k} material={M('#a8784a')} position={[-0.6 + k * 0.4, 3.75, 1.05]}>
          <boxGeometry args={[0.32, 0.4, 0.32]} />
        </mesh>
      ))}
    </group>
  );
}
