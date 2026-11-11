// Surah Al-Bayyinah: the upright way (98:5, "And they were not commanded
// except to worship Allah, sincere to Him in religion, upright, and to
// establish prayer and give zakah. And that is the upright religion"). On a
// new orchard terrace, the first row of saplings must go in dead straight
// between two marker posts. Walk out from the first post and plant stakes
// along the line, sighting back each time: a stake that strays to one side
// is pulled up again. When every stake stands true, the row runs straight
// from post to post. The orchard is a game; sighting a straight line with
// stakes is real. It is only a picture of being upright.
import type * as THREE from 'three';
import { M } from '../kit';
import { Halo } from '../props';
import type { SightTask } from '../types';

type P2 = [number, number];
import type { Mechanic, MechSave } from './base';

const doneOf = (task: SightTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.stakes }, (_, i) => i) : s.prog[task.id] ?? []);
/** Where along the line A→B (0 at A, 1 at B) a point lies, and how far to its side (+ is right, looking from A). */
export function onLine(task: SightTask, x: number, z: number) {
  const [ax, az] = task.a;
  const dx = task.b[0] - ax;
  const dz = task.b[1] - az;
  const L = Math.hypot(dx, dz);
  const ux = dx / L;
  const uz = dz / L;
  const px = x - ax;
  const pz = z - az;
  // Right of the walking direction (ux, uz) is (-uz, ux) in this world's x/z.
  return { t: (px * ux + pz * uz) / L, side: px * -uz + pz * ux, L };
}
const planted = (task: SightTask, s: MechSave): P2[] => {
  const v = s.prog[`${task.id}/at`] ?? [];
  const out: P2[] = [];
  for (let k = 0; k + 1 < v.length; k += 2) out.push([v[k] / 10, v[k + 1] / 10]);
  return out;
};
/** The along-line place the next stake should come after. */
const lastT = (task: SightTask, s: MechSave) => {
  const p = planted(task, s);
  return p.length ? onLine(task, p[p.length - 1][0], p[p.length - 1][1]).t : 0;
};
const gap = (task: SightTask) => 1 / (task.stakes + 1);

export const Sight: Mechanic<SightTask> = {
  total: (task) => task.stakes,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.stakes) return [];
    const o = onLine(task, env.pp.x, env.pp.z);
    const lt = lastT(task, env.save);
    if (o.t < lt + gap(task) * 0.6 || o.t > 1 - gap(task) * 0.4 || Math.abs(o.side) > 4) return [];
    const pos = env.pp.clone() as THREE.Vector3;
    return [{ key: `stake:${task.id}`, pos, label: 'Plant a stake here', reach: 1.5, run: () => {
      const q = onLine(task, env.pp.x, env.pp.z);
      if (Math.abs(q.side) > task.tol) {
        env.api.note(`${task.id}/x`, Math.round(q.side * 10));
        env.api.hint(`You sight back to the first post: this stake stands about ${Math.abs(q.side).toFixed(1)} m to the ${q.side > 0 ? 'right' : 'left'} of the line. You pull it up. Step ${q.side > 0 ? 'left' : 'right'} and try again.`);
        return;
      }
      const at = (env.save.prog[`${task.id}/at`] ?? []).concat([Math.round(env.pp.x * 10), Math.round(env.pp.z * 10)]);
      env.api.set(`${task.id}/at`, at);
      env.api.progress(task.id, d.length);
      if (d.length + 1 < task.stakes) env.api.hint('You sight back past the stakes to the first post: they stand in one straight line.');
      else env.api.hint('The last stake goes in. From the first post, every stake hides behind the one before it: the row runs straight.');
    } }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.stakes) return;
    const o = onLine(task, env.pp.x, env.pp.z);
    const lt = lastT(task, env.save);
    const head = `Stakes planted in line: ${d.length} of ${task.stakes}`;
    if (o.t < 0 || o.t > 1 || Math.abs(o.side) > 4) return `${head} · walk out from the first post toward the far post`;
    const lean = Math.abs(o.side) <= task.tol ? 'you are on the line' : `sighting back, you are ${o.side > 0 ? 'right' : 'left'} of the line`;
    if (o.t < lt + gap(task) * 0.6) return `${head} · ${lean} · walk on a few more steps before the next stake`;
    return `${head} · ${lean}`;
  },
  solve(task, api) {
    const s = api.save();
    const d = doneOf(task, s);
    if (d.length >= task.stakes) return;
    const k = d.length + 1;
    const x = task.a[0] + (task.b[0] - task.a[0]) * k * gap(task);
    const z = task.a[1] + (task.b[1] - task.a[1]) * k * gap(task);
    api.set(`${task.id}/at`, (s.prog[`${task.id}/at`] ?? []).concat([Math.round(x * 10), Math.round(z * 10)]));
    api.progress(task.id, d.length);
  },
  View: SightView,
};

function SightView({ task, t, data }: Parameters<NonNullable<Mechanic<SightTask>['View']>>[0]) {
  const p = planted(task, data);
  const done = doneOf(task, data).length >= task.stakes;
  const post = (q: P2, c: string) => (
    <group position={[q[0], t.floorY(q[0], q[1]), q[1]]}>
      <mesh material={M('#6a4a2a')} position-y={0.9} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.8, 8]} />
      </mesh>
      <mesh material={M(c, { side: 2 })} position={[0.22, 1.6, 0]}>
        <planeGeometry args={[0.4, 0.26]} />
      </mesh>
    </group>
  );
  const o = onLine(task, task.b[0], task.b[1]);
  const yaw = Math.atan2(task.b[0] - task.a[0], task.b[1] - task.a[1]);
  const mx = (task.a[0] + task.b[0]) / 2;
  const mz = (task.a[1] + task.b[1]) / 2;
  return (
    <group>
      {post(task.a, '#c84a3a')}
      {post(task.b, '#e8c040')}
      {!done && (
        <group position={[task.a[0], t.floorY(task.a[0], task.a[1]), task.a[1]]}>
          <Halo on />
        </group>
      )}
      {p.map((q, k) => (
        <group key={k} position={[q[0], t.floorY(q[0], q[1]), q[1]]}>
          <mesh material={M('#a8884a')} position-y={0.45}>
            <cylinderGeometry args={[0.04, 0.05, 0.9, 6]} />
          </mesh>
          {done && (
            // A sapling tied to each stake once the row is straight.
            <mesh material={M('#5a8a3a')} position={[0.12, 0.6, 0]}>
              <sphereGeometry args={[0.22, 8, 6]} />
            </mesh>
          )}
        </group>
      ))}
      {done && (
        // The cord stretched straight from post to post.
        <mesh material={M('#e8e0c8')} position={[mx, t.floorY(mx, mz) + 0.5, mz]} rotation={[Math.PI / 2, 0, -yaw]}>
          <cylinderGeometry args={[0.012, 0.012, o.L, 4]} />
        </mesh>
      )}
    </group>
  );
}
