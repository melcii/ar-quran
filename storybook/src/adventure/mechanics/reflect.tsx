// Surah Nuh: the sun a lamp, the moon a reflected light (71:16, "and made
// the moon therein a light and made the sun a burning lamp"). The moon has
// no light of its own: it shines with the sun's light, sent back. In a
// walled courtyard a beam of sunlight comes in through a gap in the wall,
// and one corner, where a seedling grows, stays dark. Mirrors on stands
// stand about the floor. Walk to each and turn it (slanted one way, slanted
// the other, or tipped flat so the light passes over it) until the light,
// sent back from mirror to mirror, reaches the seedling. The courtyard is a
// game; reflected light is real. Nuh and his people are never shown.
import { useMemo } from 'react';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { ReflectTask } from '../types';
import type { Mechanic, MechSave } from './base';

// Directions on the grid: 0 east (+x), 1 south (-z), 2 west (-x), 3 north (+z).
const DC = [1, 0, -1, 0];
const DR = [0, 1, 0, -1];
// Mirror states: 0 "/" , 1 "\" , 2 tipped flat (the light passes).
const SLASH = [3, 2, 1, 0];
const BACK = [1, 0, 3, 2];

const doneOf = (task: ReflectTask, s: MechSave) => (s.done.includes(task.id) ? [0] : s.prog[task.id] ?? []);
const statesOf = (task: ReflectTask, s: MechSave) => {
  const v = s.prog[`${task.id}/m`];
  return v && v.length === task.mirrors.length ? v : task.mirrors.map((m) => m.start);
};
export const cellPos = (task: ReflectTask, c: number, r: number): [number, number] => [task.origin[0] + c * task.cell, task.origin[1] - r * task.cell];

/** Follow the light from the gap in the wall. Returns the cells it crosses and whether it reaches the seedling. */
export function trace(task: ReflectTask, states: number[]) {
  let [c, r, dir] = task.sun;
  const path: [number, number][] = [[c, r]];
  for (let k = 0; k < 80; k++) {
    const m = task.mirrors.findIndex((q) => q.c === c && q.r === r);
    if (m >= 0 && states[m] !== 2) dir = states[m] === 0 ? SLASH[dir] : BACK[dir];
    c += DC[dir];
    r += DR[dir];
    if (c < 0 || r < 0 || c >= task.cols || r >= task.rows) return { path, hit: false };
    path.push([c, r]);
    if (c === task.target[0] && r === task.target[1]) return { path, hit: true };
  }
  return { path, hit: false };
}

export const Reflect: Mechanic<ReflectTask> = {
  total: () => 1,
  uses(task, env) {
    if (doneOf(task, env.save).length) return [];
    const states = statesOf(task, env.save);
    return task.mirrors.map((m, i) => ({ key: `turn:${task.id}:${i}`, pos: env.v3(cellPos(task, m.c, m.r)), label: 'Turn the mirror', reach: 1.8, run: () => {
      const next = states.slice();
      next[i] = (next[i] + 1) % 3;
      env.api.set(`${task.id}/m`, next);
      env.api.note(`${task.id}/turns`, (env.api.save().prog[`${task.id}/turns`] ?? []).length);
      if (trace(task, next).hit) {
        env.api.progress(task.id, 0);
        env.api.hint('The light, sent back from mirror to mirror, falls on the seedling in the dark corner.');
      }
    } }));
  },
  frame(task, env) {
    if (doneOf(task, env.save).length) return;
    return 'Turn the mirrors until the sunlight reaches the seedling in the dark corner.';
  },
  solve(task, api) {
    // Try every setting of the mirrors (three each).
    const n = task.mirrors.length;
    for (let k = 0; k < 3 ** n; k++) {
      const s = Array.from({ length: n }, (_, i) => Math.floor(k / 3 ** i) % 3);
      if (trace(task, s).hit) {
        api.set(`${task.id}/m`, s);
        api.progress(task.id, 0);
        return;
      }
    }
  },
  View: ReflectView,
};

function ReflectView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<ReflectTask>['View']>>[0]) {
  const done = doneOf(task, data).length > 0;
  const states = statesOf(task, data);
  const { path, hit } = useMemo(() => trace(task, states), [task, states]);
  const beam = useMemo(() => M('#fff0a0', { emissive: '#ffe070', ei: 1.4 }), []);
  const y0 = t.floorY(...cellPos(task, task.sun[0], task.sun[1])) + 1;
  const [tx, tz] = cellPos(task, task.target[0], task.target[1]);
  // Where the light comes in: half a cell back from the first cell, against the travel direction.
  const [sx, sz] = cellPos(task, task.sun[0] - DC[task.sun[2]] * 0.5, task.sun[1] - DR[task.sun[2]] * 0.5);
  return (
    <group>
      {/* The light, from cell to cell. */}
      {path.slice(0, -1).map(([c, r], i) => {
        const [ax, az] = cellPos(task, c, r);
        const [bx, bz] = cellPos(task, path[i + 1][0], path[i + 1][1]);
        return (
          <mesh key={i} material={beam} position={[(ax + bx) / 2, y0, (az + bz) / 2]} rotation-y={Math.atan2(bx - ax, bz - az)}>
            <boxGeometry args={[0.08, 0.08, task.cell]} />
          </mesh>
        );
      })}
      <mesh material={beam} position={[(sx + cellPos(task, task.sun[0], task.sun[1])[0]) / 2, y0, (sz + cellPos(task, task.sun[0], task.sun[1])[1]) / 2]} rotation-y={Math.atan2(DC[task.sun[2]], -DR[task.sun[2]])}>
        <boxGeometry args={[0.08, 0.08, task.cell / 2]} />
      </mesh>
      {task.mirrors.map((m, i) => {
        const [x, z] = cellPos(task, m.c, m.r);
        const s = states[i];
        return (
          <group key={i} position={[x, t.floorY(x, z), z]} {...(!done ? tap(() => act(`turn:${task.id}:${i}`)) : {})}>
            <mesh material={M('#6a4a2a')} position-y={0.45}>
              <cylinderGeometry args={[0.05, 0.07, 0.9, 6]} />
            </mesh>
            <group position-y={1} rotation-y={s === 0 ? -Math.PI / 4 : s === 1 ? Math.PI / 4 : 0} rotation-x={s === 2 ? -Math.PI / 2 : 0}>
              <mesh material={M('#c8d8e8', { metal: 0.9, rough: 0.1 })}>
                <boxGeometry args={[0.9, 0.7, 0.04]} />
              </mesh>
              <mesh material={M('#6a4a2a')} position-z={-0.03}>
                <boxGeometry args={[0.96, 0.76, 0.02]} />
              </mesh>
            </group>
            {!done && <Halo on={active} />}
          </group>
        );
      })}
      {/* The seedling in the dark corner. */}
      <group position={[tx, t.floorY(tx, tz), tz]}>
        <mesh material={M('#5a3a22')} position-y={0.15}>
          <cylinderGeometry args={[0.3, 0.25, 0.3, 10]} />
        </mesh>
        <mesh material={M(hit || done ? '#7ac04a' : '#5a6a4a')} position-y={0.45} scale={hit || done ? 1.4 : 0.8}>
          <coneGeometry args={[0.16, 0.4, 6]} />
        </mesh>
        {(hit || done) && <pointLight position-y={1} color="#fff0a0" intensity={2} distance={4} />}
      </group>
    </group>
  );
}
