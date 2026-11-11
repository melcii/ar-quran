// Surah Al-Inshiqaq: stage after stage (84:16-19, "I swear by the twilight
// glow, and by the night and what it gathers in, and by the moon when it
// grows full: you will surely travel from stage to stage"). A caravan camp
// at the edge of a long dry road. On the map, wells lie along the road at
// different distances; the camels can walk at most so far in a day, and
// every night must be spent at a well. Plan the stages: choose the wells to
// stop at so the caravan reaches the town in as few days as it can, with no
// stage too long. Then travel them, stage after stage, as the sky passes
// from twilight glow to night, to the full moon, to morning. The road and
// the caravan are a game; travelling by stages between wells is real.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { Look } from '../Scenery';
import type { StagesTask } from '../types';
import { LOOKS } from '../worlds/common';
import type { Mechanic, MechSave } from './base';
import { dawnLook } from './dawn';

/** The fewest stages that reach the last well with no stage longer than the camels can walk. */
export function fewest(task: StagesTask) {
  const w = task.wells;
  const best = w.map(() => Infinity);
  best[0] = 0;
  for (let i = 1; i < w.length; i++) for (let j = 0; j < i; j++) if (w[i] - w[j] <= task.reach) best[i] = Math.min(best[i], best[j] + 1);
  return best[w.length - 1];
}
const planOf = (task: StagesTask, s: MechSave) => s.prog[`${task.id}/plan`] ?? [];
const doneOf = (task: StagesTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: fewest(task) + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
/** Where along the road (0 = camp, 1 = town) a well lies. */
export const wellAt = (task: StagesTask, k: number): [number, number] => {
  const f = task.wells[k] / task.wells[task.wells.length - 1];
  const r = task.road;
  const seg = f * (r.length - 1);
  const a = Math.min(r.length - 2, Math.floor(seg));
  const u = seg - a;
  return [r[a][0] + (r[a + 1][0] - r[a][0]) * u, r[a][1] + (r[a + 1][1] - r[a][1]) * u];
};
/** The sky for each stage reached: twilight glow, night, the full moon, the last of the night, morning. */
const SKY: (() => Look)[] = [() => LOOKS.dusk, () => dawnLook(0), () => ({ ...dawnLook(0.1), moon: [0.2, 0.6, -0.7], stars: 0.6 }), () => dawnLook(0.55), () => dawnLook(1)];

export const Stages: Mechanic<StagesTask> = {
  total: (task) => fewest(task) + 1,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (!d.includes(0)) return [{ key: `plan:${task.id}`, pos: env.v3(task.at), label: 'Plan the stages', reach: 2.8, run: () => env.api.panel(task) }];
    const plan = planOf(task, env.save);
    const k = d.length - 1;
    if (k >= plan.length) return [];
    return [{ key: `camp:${task.id}`, pos: env.v3(wellAt(task, plan[k])), label: 'Make camp at the well', reach: 2.6, run: () => {
      env.api.progress(task.id, k + 1);
      if (k + 1 < plan.length) env.api.hint(['The twilight glow fades over the well where you camp.', 'Night gathers everything in: the camels kneel close by the well.', 'The moon is full and lights the road.', 'The last of the night: the stars grow faint.'][Math.min(3, k)]);
    } }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (!d.includes(0)) return 'Plan the caravan’s stages at the camp table';
    const plan = planOf(task, env.save);
    const k = d.length - 1;
    if (k >= plan.length) return;
    return `Stage ${k + 1} of ${plan.length}: walk the road to the well at ${task.wells[plan[k]]} km`;
  },
  look(task, data) {
    const d = doneOf(task, data);
    if (!d.includes(0) || data.done.includes(task.id)) return undefined;
    return SKY[Math.min(SKY.length - 1, d.length - 2)]?.();
  },
  solve(task, api) {
    const s = api.save();
    const d = doneOf(task, s);
    if (!d.includes(0)) {
      // The fewest stages, taking the farthest well in reach each day.
      const plan: number[] = [];
      let at = 0;
      while (at < task.wells.length - 1) {
        let n = at;
        for (let j = at + 1; j < task.wells.length; j++) if (task.wells[j] - task.wells[at] <= task.reach) n = j;
        plan.push(n);
        at = n;
      }
      api.set(`${task.id}/plan`, plan);
      api.progress(task.id, 0);
      return;
    }
    api.progress(task.id, d.length);
  },
  View: StagesView,
  Panel: StagesPanel,
};

function StagesPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<StagesTask>['Panel']>>[0]) {
  const [pick, setPick] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  if (doneOf(task, data).includes(0)) return null;
  const w = task.wells;
  const last = w.length - 1;
  const stops = [0, ...pick];
  const toggle = (k: number) => setPick((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k].sort((a, b) => a - b)));
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a route-planning game; travelling by stages is real" />
      <Text style={st.cardTitle}>Plan the stages</Text>
      <Text style={st.cardText}>{msg || `The town is ${w[last]} km away. The camels can walk at most ${task.reach} km in a day, and every night must be at a well. Choose where to stop, so you arrive in as few days as you can.`}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {w.map((km, k) =>
          k === 0 ? null : (
            <Pressable key={k} style={pick.includes(k) ? st.btn : st.btnGhost} accessibilityLabel={`Well at ${km} km`} onPress={() => toggle(k)}>
              <Text style={pick.includes(k) ? st.btnText : st.btnGhostText}>{k === last ? `${km} km: the town` : `${km} km`}</Text>
            </Pressable>
          ),
        )}
      </View>
      <Text style={[st.cardText, { textAlign: 'center' }]}>{pick.length ? `Stages: ${stops.slice(1).map((k, j) => `${w[k] - w[stops[j]]} km`).join(', ')}` : 'No stops chosen yet.'}</Text>
      <View style={st.row}>
        <Pressable
          style={st.btn}
          accessibilityLabel="Set out"
          onPress={() => {
            if (!pick.includes(last)) {
              setMsg('Your plan has to end at the town.');
              return;
            }
            const long = stops.slice(1).findIndex((k, j) => w[k] - w[stops[j]] > task.reach);
            if (long >= 0) {
              api.note(`${task.id}/long`, pick[long]);
              setMsg(`The stage to the well at ${w[pick[long]]} km is ${w[pick[long]] - w[stops[long]]} km: too far for the camels in one day.`);
              return;
            }
            if (pick.length > fewest(task)) {
              api.note(`${task.id}/slow`, pick.length);
              setMsg(`That works, but takes ${pick.length} days. The water will last longer if you go in fewer: can you make each day’s stage longer?`);
              return;
            }
            api.set(`${task.id}/plan`, pick);
            api.progress(task.id, 0);
            api.hint('The plan is set. Walk the road and make camp at each well in turn.');
            onClose();
          }}
        >
          <Text style={st.btnText}>Set out</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StagesView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<StagesTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const planned = d.includes(0);
  const plan = planOf(task, data);
  const next = planned ? plan[d.length - 1] : -1;
  const [x, z] = task.at;
  return (
    <group>
      <group position={[x, t.floorY(x, z), z]} {...(!planned ? tap(() => act(`plan:${task.id}`)) : {})}>
        <mesh material={M('#8a6a44')} position-y={0.4} castShadow>
          <boxGeometry args={[1.6, 0.8, 1]} />
        </mesh>
        <mesh material={M('#e8dcc0')} position-y={0.81} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.3, 0.8]} />
        </mesh>
        {!planned && <Halo on={active} />}
      </group>
      {task.wells.map((_, k) => {
        if (k === 0) return null;
        const [wx, wz] = wellAt(task, k);
        const stop = plan.includes(k);
        const camped = stop && plan.indexOf(k) < d.length - 1;
        return (
          <group key={k} position={[wx, t.floorY(wx, wz), wz]} {...(k === next ? tap(() => act(`camp:${task.id}`)) : {})}>
            {/* A small stone well-head at every well along the road. */}
            <mesh material={M('#a89c88', { map: 'stone' })} position-y={0.3}>
              <cylinderGeometry args={[0.5, 0.55, 0.6, 12, 1, true]} />
            </mesh>
            {stop && (
              <mesh material={M(camped ? '#c8643a' : '#e8c860')} position-y={1.4}>
                <coneGeometry args={[0.18, 0.4, 4]} />
              </mesh>
            )}
            {camped && <pointLight position={[0.8, 0.6, 0]} color="#ffb060" intensity={1.6} distance={5} />}
            {k === next && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
