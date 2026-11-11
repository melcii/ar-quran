// Surah Al-Falaq: the Lord of daybreak (113:1-5, "Say: I seek refuge in the
// Lord of daybreak, from the evil of what He created, and from the evil of
// darkness when it settles ..."). Before dawn, the path home runs through a
// dark wood. Along it stand old lanterns on posts. Light them one by one,
// in order along the path: hold your flame still at each wick until it
// catches. With every lantern lit, the sky grows a little paler, until the
// last one at the edge of the wood is lit as day breaks. The refuge the
// surah teaches is in Allah, the Lord of daybreak; the lanterns are only a
// picture of light coming after dark. Nothing frightening is shown: no
// creature, no magic, no one who envies.
import { M } from '../kit';
import { Halo } from '../props';
import type { LanternsTask } from '../types';
import type { Look } from '../Scenery';
import { live, type Mechanic, type MechSave } from './base';
import { dawnLook } from './dawn';

type Live = { t: number; at: number };
const doneOf = (task: LanternsTask, s: MechSave) => (s.done.includes(task.id) ? task.lamps.map((_, i) => i) : s.prog[task.id] ?? []);
const nextOf = (task: LanternsTask, d: number[]) => task.lamps.findIndex((_, i) => !d.includes(i));

export const Lanterns: Mechanic<LanternsTask> = {
  total: (task) => task.lamps.length,
  frame(task, env) {
    const d = doneOf(task, env.save);
    const i = nextOf(task, d);
    if (i < 0) return;
    const S = live<Live>(env.game, task.id, () => ({ t: 0, at: -1 }));
    const near = task.lamps.findIndex((p) => Math.hypot(env.pp.x - p[0], env.pp.z - p[1]) < 1.4);
    if (near < 0 || d.includes(near)) {
      S.t = 0;
      S.at = -1;
      return `Lanterns lit: ${d.length} of ${task.lamps.length} · walk on to the next dark lantern`;
    }
    if (near !== i) {
      env.api.note(`${task.id}/order`, near);
      env.tell(`order:${task.id}`, 'Light the lanterns in order along the path: there is a darker one back the way you came.', 5);
      S.t = 0;
      return `Lanterns lit: ${d.length} of ${task.lamps.length} · light them in order`;
    }
    if (S.at !== i) {
      S.at = i;
      S.t = 0;
    }
    if (env.still) S.t += env.dt;
    if (S.t >= task.secs) {
      S.t = 0;
      env.api.progress(task.id, i);
      if (i + 1 < task.lamps.length) env.api.hint(['The wick catches, and a warm light spreads over the path.', 'Another lantern glows. Is the sky a little paler between the trees?', 'The path behind you is a line of lights. The birds are starting to wake.'][Math.min(2, i)]);
      else env.api.hint('The last lantern is lit at the edge of the wood, and day breaks over the fields. Say: I seek refuge in the Lord of daybreak.');
      return;
    }
    return `Hold the flame still at the wick: ${Math.round((100 * S.t) / task.secs)}%${env.still ? '' : ' · keep still'}`;
  },
  look(task, data) {
    if (data.done.includes(task.id)) return undefined;
    const k = doneOf(task, data).length / task.lamps.length;
    return { ...dawnLook(k * 0.85), stars: Math.max(0, 1 - k * 1.4) } as Look;
  },
  solve(task, api) {
    const i = nextOf(task, doneOf(task, api.save()));
    if (i >= 0) api.progress(task.id, i);
  },
  View: LanternsView,
};

function LanternsView({ task, t, data }: Parameters<NonNullable<Mechanic<LanternsTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const i = nextOf(task, d);
  return (
    <group>
      {task.lamps.map((p, k) => {
        const lit = d.includes(k);
        return (
          <group key={k} position={[p[0], t.floorY(p[0], p[1]), p[1]]}>
            <mesh material={M('#4a3a2a')} position-y={0.9}>
              <cylinderGeometry args={[0.05, 0.06, 1.8, 6]} />
            </mesh>
            <mesh material={M(lit ? '#ffe0a0' : '#5a5a5a', lit ? { emissive: '#ffb050', ei: 1.5 } : {})} position-y={1.9}>
              <boxGeometry args={[0.24, 0.3, 0.24]} />
            </mesh>
            {lit && <pointLight position-y={1.9} color="#ffcf80" intensity={2} distance={8} />}
            {k === i && <Halo on />}
          </group>
        );
      })}
    </group>
  );
}
