// Surah Al-Masad: a rope of palm fibre (111:5, "around her neck is a rope
// of twisted palm fibre"). The surah's warning is read only, and no one it
// speaks of is shown. Here, in a date grove, the old well rope has frayed
// through, and a new one must be made from palm fibre the way rope has
// long been made: twist each strand the same way, then lay the strands
// together the opposite way, so each twist holds the other and the rope
// cannot unwind. Lay them the same way and it springs apart. Then tie the
// bucket on and lower it into the well. The grove is a game; rope-making
// is real.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { RopeTask } from '../types';
import type { Mechanic, MechSave } from './base';

const STRANDS = 3;
const doneOf = (task: RopeTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: STRANDS + 2 }, (_, i) => i) : s.prog[task.id] ?? []);
/** Twists on each strand, and the way they go: +1 right, -1 left (saved). */
const twistsOf = (task: RopeTask, s: MechSave) => {
  const v = s.prog[`${task.id}/tw`];
  return v && v.length === STRANDS + 1 ? v : [0, 0, 0, 0];
};

export const Rope: Mechanic<RopeTask> = {
  total: () => STRANDS + 2,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.includes(STRANDS + 1)) return [];
    if (!d.includes(STRANDS)) return [{ key: `twist:${task.id}`, pos: env.v3(task.at), label: 'Make the palm-fibre rope', reach: 2.6, run: () => env.api.panel(task) }];
    return [{ key: `well:${task.id}`, pos: env.v3(task.well), label: 'Tie on the bucket and lower it', reach: 2.4, run: () => {
      env.api.progress(task.id, STRANDS + 1);
      env.api.hint('Hand over hand, the bucket goes down on the new rope and comes up full. The rope holds.');
    } }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.includes(STRANDS + 1)) return;
    if (d.includes(STRANDS)) return 'The rope is made: take it to the well';
    return `Strands twisted: ${d.filter((k) => k < STRANDS).length} of ${STRANDS}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: STRANDS + 2 }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: RopeView,
  Panel: RopePanel,
};

function RopePanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<RopeTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const tw = twistsOf(task, data);
  const [msg, setMsg] = useState('');
  if (d.includes(STRANDS)) return null;
  const way = tw[STRANDS]; // the way the strands are twisted, once the first twist is made
  const strand = d.filter((k) => k < STRANDS).length;
  const twist = (dir: 1 | -1) => {
    if (strand >= STRANDS) {
      setMsg('All three strands are twisted. Now lay them together.');
      return;
    }
    if (way && dir !== way) {
      api.note(`${task.id}/mixed`, strand);
      setMsg(`The other strands are twisted to the ${way > 0 ? 'right' : 'left'}. Twist every strand the same way, or they will not lie together.`);
      return;
    }
    const next = tw.slice();
    next[strand] += 1;
    next[STRANDS] = dir;
    api.set(`${task.id}/tw`, next);
    if (next[strand] >= task.twists) {
      api.progress(task.id, strand);
      setMsg(strand + 1 < STRANDS ? `Strand ${strand + 1} is tight and springy. Now the next strand, the same way.` : 'Three tight strands, all twisted the same way. Now lay them together.');
    } else setMsg(`Strand ${strand + 1}: ${next[strand]} of ${task.twists} twists.`);
  };
  const lay = (dir: 1 | -1) => {
    if (strand < STRANDS) {
      api.note(`${task.id}/early`, strand);
      setMsg('Twist all three strands first.');
      return;
    }
    if (dir === way) {
      api.note(`${task.id}/x`, 0);
      setMsg('You lay them together the same way they are twisted, and the moment you let go, the rope springs apart. Lay them the opposite way, so each twist holds against the other.');
      return;
    }
    api.progress(task.id, STRANDS);
    api.hint('Laid the opposite way, the strands lock together into one strong rope. Take it to the well.');
    onClose();
  };
  const btn = (label: string, run: () => void) => (
    <Pressable key={label} style={st.btnGhost} accessibilityLabel={label} onPress={run}>
      <Text style={st.btnGhostText}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a rope-making game; making rope this way is real" />
      <Text style={st.cardTitle}>A rope of palm fibre</Text>
      <Text style={st.cardText}>{msg || `Twist each of three strands of palm fibre ${task.twists} times, all the same way. Then lay the three together into a rope.`}</Text>
      <Text style={[st.cardText, { textAlign: 'center' }]}>{Array.from({ length: STRANDS }, (_, k) => `Strand ${k + 1}: ${tw[k]}`).join(' · ')}</Text>
      <View style={[st.row, { flexWrap: 'wrap', justifyContent: 'center' }]}>
        {strand < STRANDS ? [btn('Twist the strand to the right', () => twist(1)), btn('Twist the strand to the left', () => twist(-1))] : [btn('Lay the strands together to the right', () => lay(1)), btn('Lay the strands together to the left', () => lay(-1))]}
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RopeView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<RopeTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const made = d.includes(STRANDS);
  const used = d.includes(STRANDS + 1);
  const [x, z] = task.at;
  const [wx, wz] = task.well;
  return (
    <group>
      <group position={[x, t.floorY(x, z), z]} {...(!made ? tap(() => act(`twist:${task.id}`)) : {})}>
        {/* A low work bench with the bundle of palm fibre and the strands as they are twisted. */}
        <mesh material={M('#7a5a3a')} position-y={0.4}>
          <boxGeometry args={[1.6, 0.1, 0.6]} />
        </mesh>
        <mesh material={M('#a8784a')} position={[-0.5, 0.6, 0]} scale={[1, 0.5, 0.7]}>
          <icosahedronGeometry args={[0.3, 1]} />
        </mesh>
        {d.filter((k) => k < STRANDS).map((k) => (
          <mesh key={k} material={M('#8a5a2a')} position={[0.3, 0.48, -0.15 + k * 0.15]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.025, 0.025, 1, 6]} />
          </mesh>
        ))}
        {!made && <Halo on={active} />}
      </group>
      <group position={[wx, t.floorY(wx, wz), wz]} {...(made && !used ? tap(() => act(`well:${task.id}`)) : {})}>
        {made && (
          <mesh material={M('#8a5a2a')} position-y={1.4}>
            <cylinderGeometry args={[0.03, 0.03, used ? 1.6 : 0.8, 6]} />
          </mesh>
        )}
        {made && !used && <Halo on={active} />}
      </group>
    </group>
  );
}
