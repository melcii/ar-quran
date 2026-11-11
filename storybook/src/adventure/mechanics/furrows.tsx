// Surah 'Abasa: let a person look at their food (80:24-32, "Let man look at
// his food: how We poured down water in torrents, then split the earth
// open, and made grain grow in it, and grapes and green herbs, and olives
// and date palms, and dense gardens, and fruit and pasture, as provision for
// you and your animals"). After the rain, a field in a river valley is ready
// to plough. Walk behind the hand plough from the stake at one end of each
// furrow to the stake at the other, keeping straight: if the furrow wanders
// too far, start it again. When every furrow is ploughed, seed goes in and
// the field comes up with the foods the surah names. The valley is a game;
// ploughing straight furrows is real. The Prophet is never shown.
import { useMemo } from 'react';
import { M } from '../kit';
import type { FurrowsTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { on: boolean; dev: number };
const fresh = (): Live => ({ on: false, dev: 0 });
const doneOf = (task: FurrowsTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.n }, (_, i) => i) : s.prog[task.id] ?? []);
const nextOf = (task: FurrowsTask, d: number[]) => Array.from({ length: task.n }, (_, i) => i).findIndex((i) => !d.includes(i));
export const laneX = (task: FurrowsTask, k: number) => task.x0 + k * task.gap;
/** Each furrow runs the other way from the last, as a ploughman turns at the end. */
export const ends = (task: FurrowsTask, k: number) => (k % 2 ? [task.z1, task.z0] : [task.z0, task.z1]);

export const Furrows: Mechanic<FurrowsTask> = {
  total: (task) => task.n,
  frame(task, env) {
    const d = doneOf(task, env.save);
    const k = nextOf(task, d);
    if (k < 0) return;
    const S = live<Live>(env.game, task.id, fresh);
    const x = laneX(task, k);
    const [from, to] = ends(task, k);
    const off = Math.abs(env.pp.x - x);
    if (!S.on) {
      if (off < task.tol && Math.abs(env.pp.z - from) < 1.6) {
        S.on = true;
        S.dev = 0;
        env.tell(`${task.id}/go`, 'The plough bites into the soft earth. Walk straight on to the stake at the far end.', 6);
      }
      return `Furrows ploughed: ${d.length} of ${task.n} · go to the start stake of the next furrow`;
    }
    S.dev = Math.max(S.dev, off);
    if (S.dev > task.tol) {
      S.on = false;
      env.api.note(`${task.id}/x`, k);
      env.api.hint('The furrow wandered off line. Go back to the start stake and walk it again, keeping your eyes on the far stake.');
      return;
    }
    if (Math.abs(env.pp.z - to) < 1.2) {
      S.on = false;
      env.api.progress(task.id, k);
      if (k + 1 < task.n) env.api.hint('A straight furrow! Turn round: the next one starts beside it.');
      return;
    }
    const left = Math.round(Math.abs(to - env.pp.z));
    return `Ploughing furrow ${k + 1} of ${task.n} · ${left} m to the far stake · ${S.dev < task.tol / 2 ? 'straight' : 'keep straight!'}`;
  },
  solve(task, api) {
    const k = nextOf(task, doneOf(task, api.save()));
    if (k >= 0) api.progress(task.id, k);
  },
  View: FurrowsView,
};

const CROPS = ['#d8b860', '#6a3a6a', '#5a9a4a', '#7a8a4a', '#4a7a3a'];

function FurrowsView({ task, t, data }: Parameters<NonNullable<Mechanic<FurrowsTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const k = nextOf(task, d);
  const all = k < 0;
  const len = Math.abs(task.z1 - task.z0);
  const zc = (task.z0 + task.z1) / 2;
  const soil = useMemo(() => M('#5a3a22', { rough: 1 }), []);
  return (
    <group>
      {Array.from({ length: task.n }, (_, i) => {
        const x = laneX(task, i);
        const y = t.floorY(x, zc);
        const done = d.includes(i);
        return (
          <group key={i}>
            {done && (
              <mesh material={soil} position={[x, y + 0.04, zc]} rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[0.7, len]} />
              </mesh>
            )}
            {/* Once every furrow is ploughed and sown, the foods of the surah come up along them. */}
            {all &&
              Array.from({ length: Math.floor(len / 1.6) }, (_, j) => (
                <mesh key={j} material={M(CROPS[i % CROPS.length])} position={[x, y + 0.3, Math.min(task.z0, task.z1) + 0.8 + j * 1.6]}>
                  <coneGeometry args={[0.22, 0.6, 6]} />
                </mesh>
              ))}
          </group>
        );
      })}
      {k >= 0 &&
        ends(task, k).map((z, j) => {
          const x = laneX(task, k);
          return (
            <group key={j} position={[x, t.floorY(x, z), z]}>
              <mesh material={M(j === 0 ? '#e8c860' : '#c8b090')} position-y={0.5}>
                <cylinderGeometry args={[0.05, 0.06, 1, 6]} />
              </mesh>
              {j === 0 && (
                <mesh material={M('#e8c860', { side: 2 })} position={[0.18, 0.9, 0]}>
                  <planeGeometry args={[0.3, 0.18]} />
                </mesh>
              )}
            </group>
          );
        })}
      {/* The hand plough waiting at the edge of the field. */}
      <group position={[task.x0 - 2, t.floorY(task.x0 - 2, task.z0), task.z0]} rotation-y={0.3}>
        <mesh material={M('#6a4a2a')} position={[0, 0.5, 0]} rotation-x={0.6}>
          <boxGeometry args={[0.08, 0.08, 1.6]} />
        </mesh>
        <mesh material={M('#8a8a8a', { metal: 0.6 })} position={[0, 0.12, 0.6]}>
          <coneGeometry args={[0.1, 0.3, 4]} />
        </mesh>
      </group>
    </group>
  );
}
