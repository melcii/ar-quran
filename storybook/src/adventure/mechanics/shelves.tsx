// Surah Al-Buruj: a glorious Quran in a preserved tablet (85:21-22, "But
// this is a glorious Quran, in a Preserved Tablet"). Allah Himself keeps the
// Quran safe. We look after our own copies with care too. In an old town
// library under a night sky of great stars (85:1), the roof has started to
// leak and the afternoon sun comes in at the window. On the table wait an
// old handwritten copy of the Quran, a box of new paper, a tray of ink pots
// and a pile of cloth covers. Carry each to a place that keeps it safe: dry,
// out of the sun, or up off the floor, as it needs. Each place holds one
// thing. The library is a game; caring for books is real. The people of the
// trench (85:4-8) are read only, never shown.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { ShelvesTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { carry: number };
const fresh = (): Live => ({ carry: -1 });
const doneOf = (task: ShelvesTask, s: MechSave) => (s.done.includes(task.id) ? task.items.map((_, i) => i) : s.prog[task.id] ?? []);
/** Where each placed thing went (the spot index), or -1. */
const placedOf = (task: ShelvesTask, s: MechSave) => {
  const v = s.prog[`${task.id}/at`];
  return v && v.length === task.items.length ? v : task.items.map(() => -1);
};
const WORD = { dry: 'dry', shade: 'out of the sun', high: 'up off the floor' } as const;

export const Shelves: Mechanic<ShelvesTask> = {
  total: (task) => task.items.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.items.length) return [];
    const S = live<Live>(env.game, task.id, fresh);
    const at = placedOf(task, env.save);
    if (S.carry < 0) {
      const out = task.items.flatMap((it, i) => (d.includes(i) ? [] : [{ key: `take:${task.id}:${i}`, pos: env.v3(task.table), label: `Pick up ${it.name}`, reach: 2.6, run: () => { S.carry = i; } }]));
      // Something already placed can be picked up again, to make room.
      task.spots.forEach((sp, k) => {
        const i = at.indexOf(k);
        if (i >= 0) out.push({ key: `back:${task.id}:${k}`, pos: env.v3(sp.at), label: `Pick up ${task.items[i].name} again`, reach: 2, run: () => {
          const next = at.slice();
          next[i] = -1;
          env.api.set(`${task.id}/at`, next);
          env.api.set(task.id, d.filter((x) => x !== i));
          S.carry = i;
        } });
      });
      return out;
    }
    const it = task.items[S.carry];
    return task.spots.flatMap((sp, k) =>
      at.includes(k)
        ? []
        : [{ key: `put:${task.id}:${k}`, pos: env.v3(sp.at), label: `Put ${it.name} here`, reach: 2, run: () => {
            const miss = it.needs.find((n) => !sp.has.includes(n));
            if (miss) {
              env.api.note(`${task.id}/x`, S.carry * 10 + k);
              env.api.hint(`Not here: ${sp.why}. ${it.name[0].toUpperCase()}${it.name.slice(1)} needs to be kept ${it.needs.map((n) => WORD[n]).join(' and ')}.`);
              return;
            }
            const next = at.slice();
            next[S.carry] = k;
            env.api.set(`${task.id}/at`, next);
            env.api.progress(task.id, S.carry);
            S.carry = -1;
          } }],
    );
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.items.length) return;
    const S = live<Live>(env.game, task.id, fresh);
    if (S.carry >= 0) {
      const it = task.items[S.carry];
      return `Carrying ${it.name}: keep it ${it.needs.length ? it.needs.map((n) => WORD[n]).join(', ') : 'anywhere safe'} · kept safe: ${d.length} of ${task.items.length}`;
    }
    return `Kept safe: ${d.length} of ${task.items.length} · pick something up from the table`;
  },
  solve(task, api) {
    // Place each thing, the most demanding first, in the first free place that suits it.
    const s = api.save();
    const at = placedOf(task, s).slice();
    const order = task.items.map((_, i) => i).sort((a, b) => task.items[b].needs.length - task.items[a].needs.length);
    for (const i of order) {
      if (at[i] >= 0) continue;
      const k = task.spots.findIndex((sp, j) => !at.includes(j) && task.items[i].needs.every((n) => sp.has.includes(n)) && sp.has.length === Math.min(...task.spots.filter((q, jj) => !at.includes(jj) && task.items[i].needs.every((n) => q.has.includes(n))).map((q) => q.has.length)));
      if (k < 0) continue;
      at[i] = k;
      api.set(`${task.id}/at`, at);
      api.progress(task.id, i);
      return;
    }
  },
  View: ShelvesView,
};

const COL = ['#c8a050', '#f2ead8', '#3a3a5a', '#8a3a3a', '#5a7a4a'];

function ShelvesView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<ShelvesTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const at = placedOf(task, data);
  const S = live<Live>(game, task.id, fresh);
  const [, bump] = useState(0);
  const was = useRef(-2);
  useFrame(() => {
    if (S.carry !== was.current) {
      was.current = S.carry;
      bump((n) => n + 1);
    }
  });
  const [tx, tz] = task.table;
  return (
    <group>
      <group position={[tx, t.floorY(tx, tz), tz]}>
        <mesh material={M('#8a6a44')} position-y={0.4} castShadow>
          <boxGeometry args={[2, 0.8, 1]} />
        </mesh>
        {task.items.map((_, i) =>
          d.includes(i) || S.carry === i ? null : (
            <mesh key={i} material={M(COL[i % COL.length])} position={[-0.7 + i * 0.45, 0.92, 0]} onClick={(e) => { e.stopPropagation(); act(`take:${task.id}:${i}`); }}>
              <boxGeometry args={[0.32, 0.2, 0.42]} />
            </mesh>
          ),
        )}
        {S.carry < 0 && d.length < task.items.length && <Halo on={active} />}
      </group>
      {task.spots.map((sp, k) => {
        const [x, z] = sp.at;
        const i = at.indexOf(k);
        const high = sp.has.includes('high');
        return (
          <group key={k} position={[x, t.floorY(x, z), z]} {...(S.carry >= 0 && i < 0 ? tap(() => act(`put:${task.id}:${k}`)) : {})}>
            <mesh material={M(sp.has.includes('dry') ? '#7a5a3a' : '#5a5a4a')} position-y={high ? 1.3 : 0.25}>
              <boxGeometry args={[1, 0.08, 0.6]} />
            </mesh>
            {high && (
              <mesh material={M('#6a4a2a')} position-y={0.65}>
                <boxGeometry args={[0.08, 1.3, 0.08]} />
              </mesh>
            )}
            {!sp.has.includes('dry') && (
              <mesh material={M('#4a7ab8', { metal: 0.3, rough: 0.2 })} position={[0, 0.02, 0.5]} rotation-x={-Math.PI / 2}>
                <circleGeometry args={[0.4, 12]} />
              </mesh>
            )}
            {i >= 0 && (
              <mesh material={M(COL[i % COL.length])} position-y={(high ? 1.3 : 0.25) + 0.15}>
                <boxGeometry args={[0.32, 0.2, 0.42]} />
              </mesh>
            )}
            {S.carry >= 0 && i < 0 && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
