// Surah Al-Mumtahanah: a bridge between neighbours (60:7-8, "Perhaps Allah
// will put affection between you ... Allah does not forbid you from being
// righteous toward those who do not fight you ... and acting justly toward
// them"). Two villages face each other across a stream, and posts already
// stand in the water between them. Both villages have sent planks. Lay a
// plank across each gap, starting from your bank: a plank must rest a
// little on both posts, so one that is too short falls in. Use the longest
// planks carelessly and the widest gap will have none left; then lift a
// plank and think again. Each plank you lay can be walked on. The villages
// and the bridge are a game idea; no one is shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { SpanTask } from '../types';
import type { Mechanic, MechSave } from './base';

/** How far a plank must rest on each post. */
export const REST = 0.2;
const gapOf = (task: SpanTask, i: number) => Math.hypot(task.posts[i + 1][0] - task.posts[i][0], task.posts[i + 1][1] - task.posts[i][1]);
const gaps = (task: SpanTask) => task.posts.length - 1;
const doneOf = (task: SpanTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: gaps(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const laid = (task: SpanTask, d: number[]) => Array.from({ length: gaps(task) }, (_, i) => i).findIndex((i) => !d.includes(i));
const usedOf = (task: SpanTask, s: MechSave) => s.prog[`${task.id}/use`] ?? [];
const fits = (task: SpanTask, p: number, i: number) => task.planks[p].len >= gapOf(task, i) + REST * 2;
/** Can the gaps from k on still all be spanned with the planks left? */
function canFinish(task: SpanTask, k: number, free: number[]): boolean {
  if (k >= gaps(task)) return true;
  return free.some((p) => fits(task, p, k) && canFinish(task, k + 1, free.filter((q) => q !== p)));
}

export const Span: Mechanic<SpanTask> = {
  total: gaps,
  uses(task, env) {
    const d = doneOf(task, env.save);
    const k = laid(task, d);
    if (k < 0) return [];
    return [{ key: `span:${task.id}`, pos: env.v3(task.posts[k]), label: k === 0 ? 'Lay the first plank' : 'Lay the next plank', reach: 3, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (laid(task, d) < 0) return;
    return `Planks laid: ${d.length} of ${gaps(task)}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const k = laid(task, d);
    if (k < 0) return;
    const used = usedOf(task, api.save());
    const free = task.planks.map((_, p) => p).filter((p) => !used.includes(p));
    const p = free.filter((q) => fits(task, q, k)).sort((a, b) => task.planks[a].len - task.planks[b].len).find((q) => canFinish(task, k + 1, free.filter((x) => x !== q)));
    if (p == null) return;
    api.set(`${task.id}/use`, [...used, p]);
    api.progress(task.id, k);
  },
  View: SpanView,
  Panel: SpanPanel,
};

function SpanPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<SpanTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const k = laid(task, d);
  const used = usedOf(task, data);
  const [msg, setMsg] = useState('');
  if (k < 0) return null;
  const gap = gapOf(task, k);
  const free = task.planks.map((_, p) => p).filter((p) => !used.includes(p));
  const stuck = !free.some((p) => fits(task, p, k));
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a bridge-building game written for this app" />
      <Text style={st.cardTitle}>{`Gap ${k + 1} of ${gaps(task)}`}</Text>
      <Text style={st.cardText}>
        {msg ||
          (stuck
            ? `This gap is ${gap.toFixed(1)} m, and no plank left is long enough. One you laid earlier was longer than it needed to be. Lift planks back and think again.`
            : `You measure this gap with the knotted rope: ${gap.toFixed(1)} m from post to post. A plank must rest at least ${REST} m on each post. Which plank?`)}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {free.map((p) => (
          <Pressable
            key={p}
            style={st.btnGhost}
            accessibilityLabel={`Plank of ${task.planks[p].len.toFixed(1)} m`}
            onPress={() => {
              if (!fits(task, p, k)) {
                api.note(`${task.id}/x`, k * 10 + p);
                setMsg(`The ${task.planks[p].len.toFixed(1)} m plank does not rest on both posts: it would tip into the stream. You pull it back out. The gap is ${gap.toFixed(1)} m.`);
                return;
              }
              const rest = free.filter((q) => q !== p);
              if (!canFinish(task, k + 1, rest)) api.note(`${task.id}/waste`, k * 10 + p);
              api.set(`${task.id}/use`, [...used, p]);
              api.progress(task.id, k);
              setMsg(`The plank from ${task.planks[p].from} rests firmly on both posts. Step onto it.`);
              if (k + 1 >= gaps(task)) onClose();
            }}
          >
            <Text style={st.btnGhostText}>{`${task.planks[p].len.toFixed(1)} m · ${task.planks[p].from}`}</Text>
          </Pressable>
        ))}
      </View>
      <View style={st.row}>
        {k > 0 && (
          <Pressable
            style={st.btnGhost}
            accessibilityLabel="Lift the last plank"
            onPress={() => {
              api.set(task.id, d.filter((i) => i !== k - 1));
              api.set(`${task.id}/use`, used.slice(0, -1));
              setMsg('You lift the last plank back onto the pile.');
            }}
          >
            <Text style={st.btnGhostText}>Lift the last plank</Text>
          </Pressable>
        )}
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SpanView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<SpanTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const k = laid(task, d);
  const used = usedOf(task, data);
  const wy = t.water ?? -99;
  const [ax, az] = task.posts[0];
  const top = Math.max(t.floorY(ax, az), t.floorY(...task.posts[task.posts.length - 1])) + 0.3;
  return (
    <group>
      {task.posts.map(([x, z], i) => {
        const base = Math.min(t.y(x, z), wy) - 0.4;
        const h = top - base;
        return (
          <group key={i} position={[x, base, z]} {...(i === k ? tap(() => act(`span:${task.id}`)) : {})}>
            {[-0.6, 0.6].map((s) => (
              <mesh key={s} material={M('#6a4a2a')} position={[0, h / 2, s]} castShadow>
                <cylinderGeometry args={[0.12, 0.14, h, 7]} />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* The plank piles at each bank: the planks not yet laid. */}
      {[0, 1].map((side) => {
        const [px, pz] = side === 0 ? task.posts[0] : task.posts[task.posts.length - 1];
        const [qx, qz] = side === 0 ? task.posts[1] : task.posts[task.posts.length - 2];
        const L = Math.hypot(px - qx, pz - qz) || 1;
        const bx = px + ((px - qx) / L) * 2.2;
        const bz = pz + ((pz - qz) / L) * 2.2 + 1.6;
        const pile = task.planks.map((_, p) => p).filter((p) => !used.includes(p) && task.planks[p].from === task.ends[side]);
        return (
          <group key={side} position={[bx, t.floorY(bx, bz), bz]}>
            {pile.map((p, j) => (
              <mesh key={p} material={M('#a07a4a', { map: 'planks' })} position={[0, 0.06 + j * 0.1, 0]}>
                <boxGeometry args={[task.planks[p].len * 0.6, 0.08, 0.36]} />
              </mesh>
            ))}
          </group>
        );
      })}
      {k >= 0 && (
        <group position={[task.posts[k][0], top - 0.3, task.posts[k][1]]}>
          <Halo on={active} />
        </group>
      )}
    </group>
  );
}
