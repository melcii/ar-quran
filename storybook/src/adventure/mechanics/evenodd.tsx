// Surah Al-Fajr: the even and the odd (89:1-3, "By the dawn, and ten
// nights, and the even and the odd"), and honouring the orphan (89:17-18,
// "No! But you do not honour the orphan, and you do not urge one another to
// feed the poor"). At dawn in a palm grove, baskets of dates wait to be
// shared between two orphan sisters who live by the grove. Share each
// basket fairly: pair the dates, one for each sister. If none is left over,
// the count was even; if one is left over, it was odd, and the last date
// goes in the basket for the poor family at the gate. The grove is a game;
// no one is shown. 'Ad, Thamud and Pharaoh (89:6-14) are read only.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { EvenOddTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: EvenOddTask, s: MechSave) => (s.done.includes(task.id) ? task.baskets.map((_, i) => i) : s.prog[task.id] ?? []);
const nextOf = (task: EvenOddTask, d: number[]) => task.baskets.findIndex((_, i) => !d.includes(i));

export const EvenOdd: Mechanic<EvenOddTask> = {
  total: (task) => task.baskets.length,
  uses(task, env) {
    const i = nextOf(task, doneOf(task, env.save));
    if (i < 0) return [];
    return [{ key: `share:${task.id}`, pos: env.v3(task.at), label: 'Share out a basket of dates', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (nextOf(task, d) < 0) return;
    const odd = d.filter((i) => task.baskets[i].n % 2).length;
    return `Baskets shared: ${d.length} of ${task.baskets.length} · dates for the poor family’s basket: ${odd}`;
  },
  solve(task, api) {
    const i = nextOf(task, doneOf(task, api.save()));
    if (i >= 0) api.progress(task.id, i);
  },
  View: EvenOddView,
  Panel: EvenOddPanel,
};

function EvenOddPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<EvenOddTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = nextOf(task, d);
  const [pairs, setPairs] = useState(0);
  const [msg, setMsg] = useState('');
  if (i < 0) return null;
  const b = task.baskets[i];
  const left = b.n - pairs * 2;
  const say = (odd: boolean) => {
    if (left > 1) {
      setMsg('There are still dates to pair up. Keep pairing, one for each sister, until you cannot make another pair.');
      return;
    }
    if (odd !== (left === 1)) {
      api.note(`${task.id}/x`, i);
      setMsg(left === 1 ? 'Look: one date is left over with no partner. That means the count was odd.' : 'Look: every date has a partner, and none is left over. That means the count was even.');
      return;
    }
    api.progress(task.id, i);
    setPairs(0);
    setMsg(`${b.n} is ${odd ? 'odd' : 'even'}: ${pairs} dates for each sister${odd ? ', and the one left over goes in the basket for the poor family' : ''}.`);
    if (i + 1 >= task.baskets.length) onClose();
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a counting game written for this app" />
      <Text style={st.cardTitle}>{b.what}</Text>
      <Text style={st.cardText}>{msg || `Share the dates between the two sisters: pair them up, one for each. Then say whether the count is even or odd.`}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center', minHeight: 30 }} accessibilityLabel={`Dates still to pair: ${left}. Pairs made: ${pairs}`}>
        {Array.from({ length: pairs }, (_, k) => (
          <View key={`p${k}`} style={{ flexDirection: 'row', gap: 1, padding: 2, borderRadius: 6, backgroundColor: '#e8dcc0' }}>
            <View style={{ width: 10, height: 16, borderRadius: 5, backgroundColor: '#7a3a1a' }} />
            <View style={{ width: 10, height: 16, borderRadius: 5, backgroundColor: '#7a3a1a' }} />
          </View>
        ))}
        {Array.from({ length: left }, (_, k) => (
          <View key={`l${k}`} style={{ width: 10, height: 16, margin: 2, borderRadius: 5, backgroundColor: '#a8582a' }} />
        ))}
      </View>
      <View style={[st.row, { justifyContent: 'center' }]}>
        <Pressable style={st.btnGhost} accessibilityLabel="Pair two dates" onPress={() => (left >= 2 ? setPairs(pairs + 1) : setMsg('There are not two dates left to pair.'))}>
          <Text style={st.btnGhostText}>Pair two dates</Text>
        </Pressable>
      </View>
      <View style={st.row}>
        <Pressable style={st.btn} accessibilityLabel="Even: none left over" onPress={() => say(false)}>
          <Text style={st.btnText}>Even: none left over</Text>
        </Pressable>
        <Pressable style={st.btn} accessibilityLabel="Odd: one left over" onPress={() => say(true)}>
          <Text style={st.btnText}>Odd: one left over</Text>
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

function EvenOddView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<EvenOddTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const i = nextOf(task, d);
  const [x, z] = task.at;
  const odd = d.filter((k) => task.baskets[k].n % 2).length;
  return (
    <group position={[x, t.floorY(x, z), z]}>
      <group {...(i >= 0 ? tap(() => act(`share:${task.id}`)) : {})}>
        {/* The baskets still to share, on a mat. */}
        <mesh material={M('#c8a870')} position-y={0.02} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[2.4, 1.4]} />
        </mesh>
        {task.baskets.map((_, k) =>
          d.includes(k) ? null : (
            <mesh key={k} material={M('#a8784a')} position={[-0.8 + k * 0.55, 0.18, 0]}>
              <cylinderGeometry args={[0.22, 0.18, 0.3, 10]} />
            </mesh>
          ),
        )}
        {i >= 0 && <Halo on={active} />}
      </group>
      {/* Two sisters' bowls fill as the dates are shared, and the poor family's basket by the gate. */}
      {[-0.6, 0.6].map((bx, k) => (
        <group key={k} position={[bx, 0, 1.4]}>
          <mesh material={M('#b86a3a')} position-y={0.1}>
            <cylinderGeometry args={[0.3, 0.2, 0.2, 12]} />
          </mesh>
          <mesh material={M('#7a3a1a')} position-y={0.12 + 0.02 * d.length} scale={[1, 0.3 + 0.2 * d.length, 1]}>
            <sphereGeometry args={[0.22, 8, 6]} />
          </mesh>
        </group>
      ))}
      <mesh material={M('#a8784a')} position={[2, 0.2, 0]}>
        <cylinderGeometry args={[0.3, 0.25, 0.4, 10]} />
      </mesh>
      {odd > 0 && (
        <mesh material={M('#7a3a1a')} position={[2, 0.42, 0]} scale={0.6 + odd * 0.2}>
          <sphereGeometry args={[0.15, 8, 6]} />
        </mesh>
      )}
    </group>
  );
}
