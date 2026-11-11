// Surah Al-Asr: by the time (103:1-3, "By time, indeed mankind is in loss,
// except those who believe and do righteous deeds and urge one another to
// the truth and urge one another to patience"). It is the late afternoon in
// a small town, and the sun is going down. Before sunset there are four
// things to do, the four the surah names: pray the afternoon prayer at the
// mosque (believe), carry water for the old neighbour (do good), tell the
// grocer kindly that his scale reads short (urge the truth), and sit with
// the friend whose kite has broken (urge patience). On the way, the town is
// full of ways to let the afternoon slip by: a juggler, a bench of gossip, a
// game of marbles. Each one eats the hour. If the sun sets first, the
// afternoon is lost and you start the next day over. The town is a game.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { HourglassTask } from '../types';
import type { Look } from '../Scenery';
import { LOOKS } from '../worlds/common';
import { live, type Mechanic, type MechSave } from './base';
import { dawnLook } from './dawn';

type Live = { left: number };
const doneOf = (task: HourglassTask, s: MechSave) => (s.done.includes(task.id) ? task.deeds.map((_, i) => i) : s.prog[task.id] ?? []);
const lives: Record<string, Live> = {};
const L = (game: { mech: Record<string, unknown> }, task: HourglassTask) => (lives[task.id] = live<Live>(game as never, task.id, () => ({ left: task.secs })));
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
/** The afternoon light: golden while there is time, reddening as the sun sinks. */
const skyAt = (k: number): Look => (k > 0.5 ? LOOKS.golden : k > 0.2 ? LOOKS.dusk : { ...dawnLook(0.15), sunI: 0.8 });

export const Hourglass: Mechanic<HourglassTask> = {
  total: (task) => task.deeds.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.deeds.length) return [];
    const S = L(env.game, task);
    const out = task.deeds.flatMap((x, i) =>
      d.includes(i)
        ? []
        : [{ key: `deed:${task.id}:${i}`, pos: env.v3(x.at), label: x.what, reach: 2.6, run: () => {
            env.api.progress(task.id, i);
            env.api.hint(x.done);
          } }],
    );
    for (const [i, x] of task.idle.entries())
      out.push({ key: `idle:${task.id}:${i}`, pos: env.v3(x.at), label: x.what, reach: 2.6, run: () => {
        S.left = Math.max(0, S.left - x.cost);
        env.api.note(`${task.id}/idle`, i);
        env.api.hint(`That was fun, but the sun has dropped while you stood there: ${mmss(S.left)} of the afternoon left.`);
      } });
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.deeds.length) return;
    const S = L(env.game, task);
    S.left -= env.dt;
    if (S.left <= 0) {
      env.api.note(`${task.id}/lost`, d.length);
      env.api.set(task.id, []);
      S.left = task.secs;
      env.api.hint('The sun has set, and the afternoon is gone with things still undone. By time, mankind is in loss. The next day, you start again.');
      return;
    }
    return `Before sunset: ${mmss(S.left)} left · done ${d.length} of ${task.deeds.length}: ${task.deeds.map((x, i) => (d.includes(i) ? '✓' : '○')).join(' ')}`;
  },
  look(task, data) {
    if (data.done.includes(task.id)) return undefined;
    const S = lives[task.id];
    return skyAt(S ? S.left / task.secs : 1);
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.deeds.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: HourglassView,
};

function HourglassView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<HourglassTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const all = d.length >= task.deeds.length;
  const S = L(game, task);
  // The sky follows the hour: redraw when it crosses a band.
  const [, bump] = useState(0);
  const band = useRef(-1);
  useFrame(() => {
    const b = Math.floor((S.left / task.secs) * 10);
    if (b !== band.current) {
      band.current = b;
      bump((n) => n + 1);
    }
  });
  return (
    <group>
      {task.deeds.map((x, i) => {
        const [px, pz] = x.at;
        const did = d.includes(i);
        return (
          <group key={`d${i}`} position={[px, t.floorY(px, pz), pz]} {...(!all && !did ? tap(() => act(`deed:${task.id}:${i}`)) : {})}>
            <mesh material={M(did ? '#e8c040' : '#f4ecd8', { emissive: did ? '#a07a20' : '#000000' })} position-y={0.08} rotation-x={-Math.PI / 2}>
              <circleGeometry args={[0.5, 16]} />
            </mesh>
            {!all && !did && <Halo on={active} />}
          </group>
        );
      })}
      {!all &&
        task.idle.map((x, i) => {
          const [px, pz] = x.at;
          return (
            <group key={`i${i}`} position={[px, t.floorY(px, pz), pz]} {...tap(() => act(`idle:${task.id}:${i}`))}>
              {/* Something bright and busy to look at: a juggler's balls, the gossip bench's cushions, the marbles. */}
              {[0, 1, 2].map((k) => (
                <mesh key={k} material={M(['#c84a3a', '#3a7ac8', '#e8c040'][k])} position={[(k - 1) * 0.3, 0.2 + (i === 0 ? k * 0.4 : 0), 0]}>
                  <sphereGeometry args={[0.09, 8, 6]} />
                </mesh>
              ))}
            </group>
          );
        })}
    </group>
  );
}
