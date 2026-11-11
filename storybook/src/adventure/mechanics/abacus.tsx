// Surah Al-Qadr: better than a thousand months (97:1-5, "Indeed, We sent it
// down on the Night of Decree ... The Night of Decree is better than a
// thousand months ... Peace it is, until the rise of dawn"). On a flat
// rooftop in the last nights of Ramadan, an old counting frame sits by the
// prayer mat. First see how long a thousand months is: slide the beads a
// year (12 months) or ten years (120 months) at a time, and a month at a
// time at the end, to reach exactly 1000. It is 83 years and 4 months, a
// whole long life. Then keep the night: sit still on the mat while the
// stars turn, until the first light of dawn. Moving off the mat breaks the
// stillness of that watch. The rooftop is a game; the angels and the Spirit
// who descend that night (97:4) are never shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { AbacusTask } from '../types';
import type { Look } from '../Scenery';
import { live, type Mechanic, type MechSave } from './base';
import { dawnLook } from './dawn';

const WATCHES = 3; // the night, the deep night, the last of the night
const doneOf = (task: AbacusTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: WATCHES + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
type Live = { t: number; was: boolean };
const SKY: (() => Look)[] = [() => ({ ...dawnLook(0), stars: 1 }), () => ({ ...dawnLook(0), moon: [0.3, 0.5, -0.8], stars: 1 }), () => ({ ...dawnLook(0.1), stars: 0.8 }), () => dawnLook(0.5)];
export const yearsOf = (m: number) => [Math.floor(m / 12), m % 12] as const;

export const Abacus: Mechanic<AbacusTask> = {
  total: () => WATCHES + 1,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.includes(0)) return [];
    return [{ key: `count:${task.id}`, pos: env.v3(task.at), label: 'Count a thousand months', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length > WATCHES) return;
    if (!d.includes(0)) return 'Count a thousand months on the beads';
    const S = live<Live>(env.game, task.id, () => ({ t: 0, was: false }));
    const on = Math.hypot(env.pp.x - task.mat[0], env.pp.z - task.mat[1]) < 1.3;
    const part = task.secs / WATCHES;
    if (!on) {
      if (S.was && S.t > 0.5) {
        env.api.note(`${task.id}/stir`, d.length);
        env.tell(`stir:${task.id}`, 'You stepped off the mat: this watch of the night starts again. Sit still on the mat.', 4);
      }
      S.t = 0;
      S.was = false;
      return d.length === 1 ? 'Sit on the prayer mat and keep the night' : `Return to the mat: ${d.length - 1} of ${WATCHES} watches kept`;
    }
    S.was = true;
    if (env.still) S.t += env.dt;
    if (S.t >= part) {
      S.t = 0;
      env.api.progress(task.id, d.length);
      if (d.length < WATCHES) env.api.hint(['The night deepens. The moon has climbed high over the rooftops.', 'The last of the night: the stars are growing faint in the east.'][d.length - 1]);
      else env.api.hint('The first light of dawn. Peace it is, until the rise of dawn.');
      return;
    }
    return `Keeping the night: watch ${d.length} of ${WATCHES}, ${Math.round((100 * S.t) / part)}%${env.still ? '' : ' · be still'}`;
  },
  look(task, data) {
    if (data.done.includes(task.id)) return undefined;
    return SKY[Math.min(SKY.length - 1, doneOf(task, data).length)]();
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: WATCHES + 1 }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: AbacusView,
  Panel: AbacusPanel,
};

function AbacusPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<AbacusTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [m, setM] = useState(0);
  const [msg, setMsg] = useState('');
  if (d.includes(0)) return null;
  const [y, mo] = yearsOf(m);
  const add = (k: number) => {
    const v = m + k;
    if (v > task.months) {
      api.note(`${task.id}/over`, v);
      setMsg(`That would be ${v} months: past a thousand. Take some back, or add a smaller step.`);
      return;
    }
    if (v < 0) return;
    setM(v);
    setMsg(v === task.months ? `Exactly ${task.months} months. How long is that?` : '');
  };
  const btn = (label: string, k: number) => (
    <Pressable key={label} style={st.btnGhost} accessibilityLabel={label} onPress={() => add(k)}>
      <Text style={st.btnGhostText}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a counting game written for this app" />
      <Text style={st.cardTitle}>A thousand months</Text>
      <Text style={st.cardText}>{msg || 'The surah says this one night is better than a thousand months. Slide the beads to count up to exactly a thousand months.'}</Text>
      <Text style={[st.cardTitle, { textAlign: 'center' }]}>{`${m} months = ${y} years and ${mo} months`}</Text>
      <View style={[st.row, { flexWrap: 'wrap', justifyContent: 'center' }]}>
        {btn('Add ten years', 120)}
        {btn('Add a year', 12)}
        {btn('Add a month', 1)}
        {btn('Take back a year', -12)}
      </View>
      <View style={st.row}>
        <Pressable style={st.btn} accessibilityLabel="That is a thousand months" onPress={() => {
          if (m !== task.months) {
            api.note(`${task.id}/x`, m);
            setMsg(`Not yet: the beads show ${m} months. Keep counting to exactly ${task.months}.`);
            return;
          }
          api.progress(task.id, 0);
          api.hint(`A thousand months is ${y} years and ${mo} months: longer than many whole lives. Now keep the night on the prayer mat.`);
          onClose();
        }}>
          <Text style={st.btnText}>That is a thousand months</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AbacusView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<AbacusTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const counted = d.includes(0);
  const kept = d.length > WATCHES;
  const [x, z] = task.at;
  const [mx, mz] = task.mat;
  return (
    <group>
      <group position={[x, t.floorY(x, z), z]} {...(!counted ? tap(() => act(`count:${task.id}`)) : {})}>
        {/* The counting frame: a wooden frame with rows of beads. */}
        <mesh material={M('#6a4a2a')} position-y={0.3}>
          <boxGeometry args={[0.9, 0.6, 0.08]} />
        </mesh>
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4].map((b) => (
            <mesh key={`${r}-${b}`} material={M(r === 0 ? '#c84a3a' : '#e8d8a8')} position={[(counted ? 0.3 : -0.3) + b * 0.06 - 0.12, 0.12 + r * 0.12, 0.06]}>
              <sphereGeometry args={[0.03, 8, 6]} />
            </mesh>
          )),
        )}
        {!counted && <Halo on={active} />}
      </group>
      <group position={[mx, t.floorY(mx, mz) + 0.03, mz]}>
        <mesh material={M('#7a2a3a')} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1, 1.9]} />
        </mesh>
        {counted && !kept && <pointLight position-y={1.2} color="#ffe8b0" intensity={0.8} distance={3} />}
        {counted && !kept && <Halo on />}
      </group>
    </group>
  );
}
