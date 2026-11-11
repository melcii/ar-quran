// Surah Al-Kawthar: abundance, and the one cut off (108:1-3, "Indeed, We
// have given you al-Kawthar. So pray to your Lord and sacrifice. Indeed,
// your enemy is the one cut off"). In a walled garden in late winter, the
// old fig tree needs pruning before spring. A good gardener cuts away what
// takes without giving: the dead wood, and the branches growing inward
// across the middle that rub and shade the rest. The healthy branches that
// will bear fruit stay. Cut well, and the tree bears more. The garden is a
// game; pruning is real. It is not a picture of al-Kawthar, which is never
// shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { PruneTask } from '../types';
import type { Mechanic, MechSave } from './base';

const cuts = (task: PruneTask) => task.branches.map((b, i) => (b.is === 'fruiting' ? -1 : i)).filter((i) => i >= 0);
const doneOf = (task: PruneTask, s: MechSave) => (s.done.includes(task.id) ? cuts(task) : s.prog[task.id] ?? []);
const W = 240;
const H = 200;
/** Where each branch leaves the trunk and where it ends, in the drawing. */
const geom = (task: PruneTask, i: number) => {
  const b = task.branches[i];
  const side = i % 2 ? 1 : -1;
  const y0 = 170 - (i * 120) / task.branches.length;
  const len = 70 + ((i * 17) % 25);
  // A crossing branch grows inward, across the trunk; the others grow outward and up.
  const dir = b.is === 'crossing' ? -side : side;
  const x1 = W / 2 + dir * len * 0.9;
  const y1 = y0 - len * (b.is === 'crossing' ? 0.25 : 0.55);
  return { x0: W / 2, y0, x1, y1 };
};

export const Prune: Mechanic<PruneTask> = {
  total: (task) => cuts(task).length,
  uses(task, env) {
    if (doneOf(task, env.save).length >= cuts(task).length) return [];
    return [{ key: `prune:${task.id}`, pos: env.v3(task.at), label: 'Prune the fig tree', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= cuts(task).length) return;
    return `Pruning cuts made: ${d.length} of ${cuts(task).length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = cuts(task).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: PruneView,
  Panel: PrunePanel,
};

function PrunePanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<PruneTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [msg, setMsg] = useState('');
  if (d.length >= cuts(task).length) return null;
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a pruning game; pruning a fig tree is real" />
      <Text style={st.cardTitle}>Prune the fig tree</Text>
      <Text style={st.cardText}>{msg || 'Cut away the dead wood (grey and bare) and any branch growing inward across the middle. Leave the healthy branches with buds: they will bear the figs.'}</Text>
      <View style={{ alignSelf: 'center', width: W, height: H, backgroundColor: '#e8eedc', borderRadius: 8 }}>
        <Svg width={W} height={H} style={{ position: 'absolute' }}>
          <Line x1={W / 2} y1={H} x2={W / 2} y2={40} stroke="#6a5038" strokeWidth={10} strokeLinecap="round" />
          {task.branches.map((b, i) => {
            if (d.includes(i)) return null;
            const g = geom(task, i);
            const dead = b.is === 'dead';
            return [
              <Line key={`l${i}`} x1={g.x0} y1={g.y0} x2={g.x1} y2={g.y1} stroke={dead ? '#a8a49c' : '#7a5a3a'} strokeWidth={dead ? 3 : 5} strokeLinecap="round" />,
              ...(dead ? [] : [0.45, 0.7, 0.95].map((u) => <Circle key={`b${i}-${u}`} cx={g.x0 + (g.x1 - g.x0) * u} cy={g.y0 + (g.y1 - g.y0) * u - 5} r={4} fill="#7aa04a" />)),
              <Circle key={`n${i}`} cx={g.x1} cy={g.y1} r={9} fill="#fff8e8" stroke="#6a5038" />,
            ];
          })}
        </Svg>
        {task.branches.map((b, i) => {
          if (d.includes(i)) return null;
          const g = geom(task, i);
          return (
            <Text key={i} style={{ position: 'absolute', left: g.x1 - 4, top: g.y1 - 8, fontSize: 11, color: '#3a2a1a' }}>{i + 1}</Text>
          );
        })}
      </View>
      <View style={[st.row, { flexWrap: 'wrap', justifyContent: 'center' }]}>
        {task.branches.map((b, i) =>
          d.includes(i) ? null : (
            <Pressable key={i} style={st.btnGhost} accessibilityLabel={`Cut branch ${i + 1}`} onPress={() => {
              if (b.is === 'fruiting') {
                api.note(`${task.id}/x`, i);
                setMsg(`Branch ${i + 1} is healthy, with buds along it: those buds are this year's figs. Leave it, and cut what gives nothing.`);
                return;
              }
              api.progress(task.id, i);
              const left = cuts(task).length - d.length - 1;
              setMsg(left ? (b.is === 'dead' ? 'Snip: the dead wood comes away. Now the tree can put its strength into the living branches.' : 'Snip: that branch was rubbing and shading the middle. Now light and air can get in.') : '');
              if (!left) {
                api.hint('The fig tree stands open and clean, all its strength in the branches that will bear fruit.');
                onClose();
              }
            }}>
              <Text style={st.btnGhostText}>{`Cut branch ${i + 1}`}</Text>
            </Pressable>
          ),
        )}
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PruneView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<PruneTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const all = d.length >= cuts(task).length;
  const [x, z] = task.at;
  return (
    <group position={[x, t.floorY(x, z), z]} {...(!all ? tap(() => act(`prune:${task.id}`)) : {})}>
      <mesh material={M('#6a5038')} position-y={1} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 2, 8]} />
      </mesh>
      {task.branches.map((b, i) => {
        if (d.includes(i)) return null;
        const side = i % 2 ? 1 : -1;
        const dir = b.is === 'crossing' ? -side : side;
        const a = (i / task.branches.length) * Math.PI * 2;
        const y = 1.2 + (i / task.branches.length) * 1.2;
        return (
          <group key={i} position-y={y} rotation-y={a}>
            <mesh material={M(b.is === 'dead' ? '#a8a49c' : '#7a5a3a')} position-x={dir * 0.6} rotation-z={dir * -1.1}>
              <cylinderGeometry args={[0.04, 0.06, 1.3, 6]} />
            </mesh>
            {b.is !== 'dead' && (
              <mesh material={M('#6a9a3a')} position={[dir * 1.1, 0.45, 0]}>
                <sphereGeometry args={[0.32, 8, 6]} />
              </mesh>
            )}
          </group>
        );
      })}
      {!all && <Halo on={active} />}
    </group>
  );
}
