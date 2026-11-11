// Surah An-Nazi'at: water and pasture from the earth (79:30-33, "And after
// that He spread the earth. He brought out from it its water and its
// pasture, and the mountains He set firm, as provision for you and your
// grazing animals"). On a dry upland by a shepherds' track, the ground
// looks bare, but water lies deep below. Dig a well metre by metre: a spade
// for soft ground, a pick for rock, and line the walls with stones as you
// go, or the sides will crumble in. When water comes, fill the trough, and
// the dry ground around it turns green. The upland is a game idea; digging
// wells and lining them with stone is real. Musa and Pharaoh (79:15-26) are
// read only, never shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { DigTask } from '../types';
import type { Mechanic, MechSave } from './base';

const deepest = (task: DigTask) => task.layers[task.layers.length - 1].to;
const doneOf = (task: DigTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: deepest(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const depthOf = (task: DigTask, s: MechSave) => doneOf(task, s).length;
const linedOf = (task: DigTask, s: MechSave) => (s.done.includes(task.id) ? deepest(task) : s.prog[`${task.id}/lined`]?.[0] ?? 0);
export const layerAt = (task: DigTask, m: number) => task.layers.find((l) => l.to > m) ?? task.layers[task.layers.length - 1];

export const Dig: Mechanic<DigTask> = {
  total: deepest,
  uses(task, env) {
    if (depthOf(task, env.save) >= deepest(task)) return [];
    return [{ key: `dig:${task.id}`, pos: env.v3(task.at), label: 'Dig the well', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const m = depthOf(task, env.save);
    if (m >= deepest(task)) return;
    return `The well is ${m} m deep · lined to ${linedOf(task, env.save)} m · digging through ${layerAt(task, m).name}`;
  },
  solve(task, api) {
    const m = depthOf(task, api.save());
    if (m < deepest(task)) {
      api.set(`${task.id}/lined`, [m]);
      api.progress(task.id, m);
    }
  },
  View: DigView,
  Panel: DigPanel,
};

function DigPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<DigTask>['Panel']>>[0]) {
  const m = depthOf(task, data);
  const lined = linedOf(task, data);
  const [msg, setMsg] = useState('');
  if (m >= deepest(task)) return null;
  const layer = layerAt(task, m);
  const dig = (tool: 'spade' | 'pick') => {
    if (tool !== layer.tool) {
      api.note(`${task.id}/x`, m * 10 + (tool === 'pick' ? 1 : 0));
      setMsg(tool === 'spade' ? `The spade rings on the ${layer.name} and will not go in. This needs the pick.` : `The ${layer.name} is soft: the pick just sticks in it. Use the spade.`);
      return;
    }
    if (m - lined >= task.line) {
      api.note(`${task.id}/crumble`, m);
      setMsg(`Bits of the wall are crumbling down around you. Line the sides with stones before you dig any deeper.`);
      return;
    }
    api.progress(task.id, m);
    if (m + 1 >= deepest(task)) {
      api.hint('The sand is wet, then water seeps in and rises in the bottom of the well. You haul up the first bucket and fill the trough.');
      onClose();
      return;
    }
    const next = layerAt(task, m + 1);
    setMsg(next !== layer ? `${m + 1} m down. Below the ${layer.name} you reach ${next.name}.` : `${m + 1} m down, still in ${layer.name}.`);
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a well-digging game; lined wells are real" />
      <Text style={st.cardTitle}>Dig the well</Text>
      <Text style={st.cardText}>{msg || `The well is ${m} m deep. You are digging through ${layer.name}. Choose the right tool, and line the walls with stones as you go.`}</Text>
      <View style={{ alignSelf: 'center', width: 60, height: 140, backgroundColor: '#c8a878', borderRadius: 4, overflow: 'hidden' }} accessibilityLabel={`Well ${m} metres deep, lined to ${lined} metres`}>
        {task.layers.map((l, k) => {
          const top = k ? task.layers[k - 1].to : 0;
          return <View key={k} style={{ position: 'absolute', left: 0, right: 0, top: `${(100 * top) / deepest(task)}%` as never, height: `${(100 * (l.to - top)) / deepest(task)}%` as never, backgroundColor: ['#8a6a44', '#a8784a', '#8a8a8a', '#b8a888', '#c8b890'][k % 5] }} />;
        })}
        <View style={{ position: 'absolute', left: 18, width: 24, top: 0, height: `${(100 * m) / deepest(task)}%` as never, backgroundColor: '#2a2018' }} />
        <View style={{ position: 'absolute', left: 14, width: 4, top: 0, height: `${(100 * lined) / deepest(task)}%` as never, backgroundColor: '#e8e0d0' }} />
        <View style={{ position: 'absolute', left: 42, width: 4, top: 0, height: `${(100 * lined) / deepest(task)}%` as never, backgroundColor: '#e8e0d0' }} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        <Pressable style={st.btnGhost} accessibilityLabel="Dig with the spade" onPress={() => dig('spade')}>
          <Text style={st.btnGhostText}>Dig with the spade</Text>
        </Pressable>
        <Pressable style={st.btnGhost} accessibilityLabel="Break with the pick" onPress={() => dig('pick')}>
          <Text style={st.btnGhostText}>Break with the pick</Text>
        </Pressable>
        <Pressable
          style={st.btnGhost}
          accessibilityLabel="Line the walls with stones"
          onPress={() => {
            if (lined >= m) {
              setMsg('The walls are already lined as far down as you have dug.');
              return;
            }
            api.set(`${task.id}/lined`, [m]);
            setMsg(`You line the walls with stones down to ${m} m. They will not crumble now.`);
          }}
        >
          <Text style={st.btnGhostText}>Line the walls</Text>
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

function DigView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<DigTask>['View']>>[0]) {
  const m = depthOf(task, data);
  const water = m >= deepest(task);
  const [x, z] = task.at;
  return (
    <group position={[x, t.floorY(x, z), z]}>
      <group {...(!water ? tap(() => act(`dig:${task.id}`)) : {})}>
        {/* The well mouth: a heap of dug earth, then a stone ring once lined. */}
        <mesh material={M('#2a2018')} position-y={0.02} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.6, 16]} />
        </mesh>
        {m > 0 && (
          <mesh material={M('#9a9488', { map: 'stone' })} position-y={0.25}>
            <cylinderGeometry args={[0.85, 0.9, 0.5, 16, 1, true]} />
          </mesh>
        )}
        <mesh material={M('#a8784a')} position={[1.6, 0.1, 0]} scale={[1, 0.3 + (m / deepest(task)) * 1.2, 1]}>
          <coneGeometry args={[0.8, 0.6, 10]} />
        </mesh>
        {water && (
          <mesh material={M('#4a7ab8', { metal: 0.3, rough: 0.2 })} position-y={0.08} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.58, 16]} />
          </mesh>
        )}
        {!water && <Halo on={active} />}
      </group>
      {/* The trough, and the pasture that greens around it once water comes. */}
      <mesh material={M('#8a8070', { map: 'stone' })} position={[-2.2, 0.25, 0]}>
        <boxGeometry args={[0.6, 0.5, 2]} />
      </mesh>
      {water && (
        <>
          <mesh material={M('#4a7ab8')} position={[-2.2, 0.46, 0]}>
            <boxGeometry args={[0.45, 0.05, 1.85]} />
          </mesh>
          <mesh material={M('#7aa24a')} position-y={0.04} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[1, 6, 32]} />
          </mesh>
        </>
      )}
    </group>
  );
}
