// Surah As-Saff (The Row): a structure joined firmly (61:4, "as though they
// are a single structure joined firmly"). A garden wall has fallen, and its
// stones lie ready: long ones and short ones. Build it again course by
// course. The builder's rule: no joint may sit right above a joint in the
// course below, or a crack can run straight up the wall; overlapped joints
// lock the stones together. When the wall stands, push it: a well-bonded
// wall holds as one. The surah also asks "why do you say what you do not
// do?" (61:2): here you said you would rebuild it, and you do. The wall is a
// game idea; the bond is how real walls are built.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { BondTask } from '../types';
import type { Mechanic, MechSave } from './base';

const all = (task: BondTask) => task.courses + 1;
const doneOf = (task: BondTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const rowOf = (task: BondTask, s: MechSave, c: number) => s.prog[`${task.id}/c${c}`] ?? [];
/** The joints of a course: where one stone ends and the next begins. */
const joints = (row: number[], width: number) => {
  const out: number[] = [];
  let x = 0;
  for (const b of row) {
    x += b;
    if (x < width) out.push(x);
  }
  return out;
};
const lenOf = (row: number[]) => row.reduce((a, b) => a + b, 0);
const nextCourse = (task: BondTask, d: number[]) => Array.from({ length: task.courses }, (_, c) => c).findIndex((c) => !d.includes(c));
/** Stones the solver lays: alternate courses start with a short stone. */
const bondRow = (task: BondTask, c: number) => {
  const r: number[] = c % 2 ? [1] : [];
  while (lenOf(r) + 2 <= task.width) r.push(2);
  if (lenOf(r) < task.width) r.push(1);
  return r;
};

export const Bond: Mechanic<BondTask> = {
  total: all,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= all(task)) return [];
    const c = nextCourse(task, d);
    return [{ key: `wall:${task.id}`, pos: env.v3(task.at), label: c >= 0 ? 'Build the wall' : 'Push the wall', reach: 3.2, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const c = nextCourse(task, d);
    if (c >= 0) return `Courses laid: ${c} of ${task.courses}`;
    if (!d.includes(task.courses)) return 'The wall is built. Push it and see if it holds as one.';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const c = nextCourse(task, d);
    if (c >= 0) {
      api.set(`${task.id}/c${c}`, bondRow(task, c));
      api.progress(task.id, c);
    } else api.progress(task.id, task.courses);
  },
  View: BondView,
  Panel: BondPanel,
};

function Drawing({ task, data, c, row }: { task: BondTask; data: MechSave; c: number; row: number[] }) {
  const U = 30;
  const rows = Array.from({ length: task.courses }, (_, k) => (k < c ? rowOf(task, data, k) : k === c ? row : []));
  return (
    <View style={{ alignSelf: 'center', width: task.width * U + 4, height: task.courses * 20 + 4, borderWidth: 2, borderColor: '#c8b898', borderRadius: 4 }}>
      {rows.map((r, k) => {
        let x = 0;
        return r.map((b, j) => {
          const left = x;
          x += b;
          return <View key={`${k}-${j}`} style={{ position: 'absolute', left: left * U + 1, bottom: k * 20 + 1, width: b * U - 2, height: 18, borderRadius: 3, backgroundColor: k === c ? '#d8b878' : '#a89880' }} />;
        });
      })}
    </View>
  );
}

function BondPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<BondTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const c = nextCourse(task, d);
  const [row, setRow] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  if (c < 0) {
    return (
      <View style={[st.card, { width } as never, st.cardMid]}>
        <ContentLabel kind="activity" extra="a wall-building game; the bond is how real walls are built" />
        <Text style={st.cardTitle}>The wall stands</Text>
        <Text style={st.cardText}>Every joint is overlapped by a stone above it. Lean your weight against it and push.</Text>
        <View style={st.row}>
          <Pressable
            style={st.btn}
            accessibilityLabel="Push the wall"
            onPress={() => {
              api.progress(task.id, task.courses);
              onClose();
            }}
          >
            <Text style={st.btnText}>Push the wall</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  const below = c > 0 ? joints(rowOf(task, data, c - 1), task.width) : [];
  const place = (b: number) => {
    const end = lenOf(row) + b;
    if (end > task.width) {
      setMsg('That stone would stick out past the end of the wall. Try a short one.');
      return;
    }
    if (end < task.width && below.includes(end)) {
      api.note(`${task.id}/x`, c * 100 + end);
      setMsg('That would put a joint right above a joint in the course below. A crack could run straight up the wall there. Try the other stone.');
      return;
    }
    const r = [...row, b];
    setRow(r);
    setMsg('');
    if (end >= task.width) {
      api.set(`${task.id}/c${c}`, r);
      api.progress(task.id, c);
      setRow([]);
      setMsg(c + 1 < task.courses ? 'Course laid. Start the next one on top.' : 'The last course is laid.');
    }
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a wall-building game; the bond is how real walls are built" />
      <Text style={st.cardTitle}>{`Course ${c + 1} of ${task.courses}`}</Text>
      <Text style={st.cardText}>{msg || 'Lay stones from left to right. No joint may sit right above a joint in the course below.'}</Text>
      <Drawing task={task} data={data} c={c} row={row} />
      <View style={st.row}>
        <Pressable style={st.btn} accessibilityLabel="Long stone" onPress={() => place(2)}>
          <Text style={st.btnText}>Long stone</Text>
        </Pressable>
        <Pressable style={st.btn} accessibilityLabel="Short stone" onPress={() => place(1)}>
          <Text style={st.btnText}>Short stone</Text>
        </Pressable>
        {row.length > 0 && (
          <Pressable style={st.btnGhost} accessibilityLabel="Take the last stone back" onPress={() => setRow(row.slice(0, -1))}>
            <Text style={st.btnGhostText}>Take back</Text>
          </Pressable>
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

function BondView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<BondTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const [x, z] = task.at;
  const y = t.floorY(x, z);
  const U = 0.6;
  const H = 0.4;
  const c = nextCourse(task, d);
  return (
    <group position={[x, y, z]} rotation-y={task.rot ?? 0} {...tap(() => act(`wall:${task.id}`))}>
      {/* The footing, then each laid course. */}
      <mesh material={M('#8a8070', { map: 'stone' })} position-y={0.08} receiveShadow>
        <boxGeometry args={[task.width * U + 0.2, 0.16, 0.7]} />
      </mesh>
      {Array.from({ length: task.courses }, (_, k) => {
        if (!d.includes(k)) return null;
        let px = -(task.width * U) / 2;
        return rowOf(task, data, k).map((b, j) => {
          const cx = px + (b * U) / 2;
          px += b * U;
          return (
            <mesh key={`${k}-${j}`} material={M(j % 2 ? '#b8a888' : '#a89878', { map: 'stone' })} position={[cx, 0.16 + H / 2 + k * H, 0]} castShadow>
              <boxGeometry args={[b * U - 0.04, H - 0.04, 0.55]} />
            </mesh>
          );
        });
      })}
      {/* The pile of stones still to lay. */}
      {c >= 0 &&
        [0, 1, 2, 3].map((k) => (
          <mesh key={`p${k}`} material={M('#a89878', { map: 'stone' })} position={[(Math.floor(k / 2) - 0.5) * 1.5, 0.2 + (k % 2) * 0.4, 1.4]} castShadow>
            <boxGeometry args={[k % 2 ? 0.6 : 1.2, 0.36, 0.5]} />
          </mesh>
        ))}
      {d.length < all(task) && <Halo on={active} />}
    </group>
  );
}
