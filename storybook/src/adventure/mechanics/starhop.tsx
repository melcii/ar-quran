// Surah An-Najm (The Star): finding Sirius by star-hopping. The surah says
// "it is He who is the Lord of Sirius" (53:49), the brightest star of the
// night sky. Lie on the mat on the hilltop and look up. Find three bright
// stars in a short straight row (the belt of the hunter-shaped group people
// call Orion), then follow the line they make down and to the left until you
// reach the brightest star of all. That is how people have always found
// Sirius. Stars are created things: the surah forbids worshipping them, and
// nothing here gives a star any power. The chart is drawn for this game.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { StarhopTask } from '../types';
import type { Mechanic, MechSave } from './base';

type Star = { x: number; y: number; m: number; c?: string; name: string };
// A simple chart of the winter sky around Orion (x right, y down; not to scale).
const SKY: Star[] = [
  { x: 95, y: 52, m: 5, c: '#ffc890', name: 'a reddish star at the top left' },
  { x: 178, y: 64, m: 4, name: 'a star at the top right' },
  { x: 156, y: 118, m: 4, name: 'belt star' },
  { x: 140, y: 126, m: 4, name: 'belt star' },
  { x: 124, y: 134, m: 4, name: 'belt star' },
  { x: 110, y: 196, m: 4, name: 'a star at the bottom left' },
  { x: 184, y: 190, m: 5, c: '#c8dcff', name: 'a bluish star at the bottom right' },
  { x: 26, y: 200, m: 7, c: '#eaf2ff', name: 'Sirius' },
  { x: 258, y: 62, m: 4, c: '#ffc080', name: 'an orange star far to the right' },
  { x: 40, y: 92, m: 4, name: 'a star far to the left' },
  { x: 220, y: 140, m: 2, name: 'a faint star' },
  { x: 70, y: 150, m: 2, name: 'a faint star' },
  { x: 200, y: 230, m: 2, name: 'a faint star' },
  { x: 60, y: 30, m: 2, name: 'a faint star' },
  { x: 240, y: 200, m: 3, name: 'a star low on the right' },
  { x: 130, y: 20, m: 2, name: 'a faint star' },
];
const BELT = [2, 3, 4];
const SIRIUS = 7;

const doneOf = (task: StarhopTask, s: MechSave) => (s.done.includes(task.id) ? [0, 1, 2, 3] : s.prog[task.id] ?? []);

export const Starhop: Mechanic<StarhopTask> = {
  total: () => 4,
  uses(task, env) {
    if (doneOf(task, env.save).length >= 4) return [];
    return [{ key: `sky:${task.id}`, pos: env.v3(task.at), label: 'Lie on the mat and look up at the stars', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const b = [0, 1, 2].filter((i) => d.includes(i)).length;
    if (b < 3) return `Stars of the short straight row found: ${b} of 3`;
    if (!d.includes(3)) return 'Now follow the row down and to the left, to the brightest star of all.';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = [0, 1, 2, 3].find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: StarhopView,
  Panel: StarhopPanel,
};

function StarhopPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<StarhopTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const belt = BELT.filter((_, k) => d.includes(k));
  const [msg, setMsg] = useState('Find three bright stars close together in a short, straight row. Tap each one.');
  const tapStar = (i: number) => {
    const k = BELT.indexOf(i);
    if (belt.length < 3) {
      if (k >= 0) {
        api.progress(task.id, k);
        setMsg(belt.length + 1 < 3 ? 'Yes, that is one of them. Find the others in the same short row.' : 'All three: the belt. Now follow its line down and to the left, past the faint stars, to the brightest star in the sky.');
      } else {
        api.note(`${task.id}/x`, i);
        setMsg(`That is ${SKY[i].name}. Look for three bright stars in a short straight row, close together.`);
      }
      return;
    }
    if (i === SIRIUS) {
      api.progress(task.id, 3);
      onClose();
      return;
    }
    api.note(`${task.id}/x`, 100 + i);
    setMsg(`That is ${SKY[i].name}. Follow the belt’s line further, down and to the left: the star you want is brighter than any other.`);
  };
  const W = 290;
  const H = 250;
  // The belt's line, drawn once found: from the right end through the left end and on toward Sirius.
  const a = SKY[BELT[0]];
  const z = SKY[SIRIUS];
  const len = Math.hypot(z.x - a.x, z.y - a.y);
  const ang = (Math.atan2(z.y - a.y, z.x - a.x) * 180) / Math.PI;
  return (
    <View style={[st.card, { width } as never, st.cardTall]}>
      <ContentLabel kind="activity" extra="a star chart drawn for this game" />
      <Text style={[st.cardText, { fontSize: 14 }]}>{msg}</Text>
      <View style={{ alignSelf: 'center', width: W, height: H, borderRadius: 16, backgroundColor: '#141a34', overflow: 'hidden' }}>
        {belt.length === 3 && (
          <View pointerEvents="none" style={{ position: 'absolute', left: a.x, top: a.y, width: len, height: 2, backgroundColor: 'rgba(255,232,160,0.35)', transformOrigin: 'left center', transform: [{ rotate: `${ang}deg` }] } as never} />
        )}
        {SKY.map((s, i) => {
          const r = s.m * 1.4 + 2;
          const found = belt.includes(i) || (i === SIRIUS && d.includes(3));
          return (
            <Pressable
              key={i}
              accessibilityLabel={s.name === 'belt star' ? `Star ${i + 1}, in a short row` : `Star ${i + 1}: ${s.name}`}
              onPress={() => tapStar(i)}
              style={{ position: 'absolute', left: s.x - 14, top: s.y - 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: r * 2, height: r * 2, borderRadius: r, backgroundColor: s.c ?? '#fff8e8', borderWidth: found ? 2 : 0, borderColor: '#ffd860' }} />
            </Pressable>
          );
        })}
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StarhopView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<StarhopTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const [x, z] = task.at;
  const y = t.floorY(x, z);
  return (
    <group position={[x, y, z]} {...tap(() => act(`sky:${task.id}`))}>
      <mesh material={M('#7a4a5a')} position-y={0.03} receiveShadow>
        <boxGeometry args={[1.2, 0.06, 2]} />
      </mesh>
      <mesh material={M('#c8a888')} position={[0, 0.1, -0.8]}>
        <boxGeometry args={[0.8, 0.14, 0.34]} />
      </mesh>
      {d.length < 4 && <Halo on={active} />}
    </group>
  );
}
