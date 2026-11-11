// Surah At-Takwir: "So where are you going?" (81:26-28, "It is only a
// reminder to the worlds, for whoever of you wills to take a straight
// way"). Before dawn in the high hill country, cairns of piled stones stand
// on the bare tops, each with a compass rose carved on its base stone, and
// many tracks run between them. At each cairn you are told which way to
// head: north, south-east, west, and so on. Read the carved rose, choose the
// track that runs that way, and walk it to the next cairn. Take a wrong
// track and you will find yourself at the wrong cairn: go back and try
// again. The way ends at a lookout as the dawn breathes in (81:18). The hill
// country is a game; finding your way by a compass is real.
import { M } from '../kit';
import type { BearingsTask } from '../types';
import { type Mechanic, type MechSave } from './base';

const NAMES = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const doneOf = (task: BearingsTask, s: MechSave) => (s.done.includes(task.id) ? task.route.slice(1).map((_, i) => i) : s.prog[task.id] ?? []);
/** North is -z and east is +x, as carved on every rose. */
export const bearing = (a: [number, number], b: [number, number]) => {
  const deg = (Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180) / Math.PI;
  return NAMES[Math.round(((deg + 360) % 360) / 45) % 8];
};
const hereOf = (task: BearingsTask, d: number[]) => task.route[d.length];

export const Bearings: Mechanic<BearingsTask> = {
  total: (task) => task.route.length - 1,
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.route.length - 1) return;
    const here = task.cairns[hereOf(task, d)];
    const want = task.route[d.length + 1];
    const dir = bearing(here.at, task.cairns[want].at);
    // Reaching a cairn: the right one moves you on, a wrong one sends you back.
    for (let i = 0; i < task.cairns.length; i++) {
      if (i === hereOf(task, d)) continue;
      const c = task.cairns[i];
      if (Math.hypot(env.pp.x - c.at[0], env.pp.z - c.at[1]) > task.r) continue;
      if (i === want) {
        env.api.progress(task.id, d.length);
        if (d.length + 2 < task.route.length) env.api.hint(`You reach ${c.name}. From here, head ${bearing(c.at, task.cairns[task.route[d.length + 2]].at)}.`);
        return;
      }
      env.tell(`${task.id}/x${i}`, `This is ${c.name}, not the way you were told. Go back to ${here.name} and take the track that runs ${dir}.`, 8);
      if (env.game.hold[`${task.id}/x${i}`] == null) {
        env.game.hold[`${task.id}/x${i}`] = 1;
        env.api.note(`${task.id}/x`, d.length * 10 + i);
      }
    }
    return `From ${here.name}, head ${dir} · check the compass rose on the cairn · stage ${d.length + 1} of ${task.route.length - 1}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    if (d.length < task.route.length - 1) api.progress(task.id, d.length);
  },
  View: BearingsView,
};

function Rose() {
  // A compass rose carved on a flat base stone: a long gold point for north.
  return (
    <group position-y={0.13}>
      <mesh material={M('#8a8478', { map: 'stone' })}>
        <cylinderGeometry args={[1.1, 1.2, 0.24, 16]} />
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} material={M(k === 0 ? '#e8c860' : '#4a4038')} position={[Math.sin((k * Math.PI) / 2) * 0.55, 0.13, -Math.cos((k * Math.PI) / 2) * 0.55]} rotation-y={(-k * Math.PI) / 2}>
          <boxGeometry args={[0.12, 0.02, k === 0 ? 0.9 : 0.6]} />
        </mesh>
      ))}
    </group>
  );
}

function BearingsView({ task, t, data }: Parameters<NonNullable<Mechanic<BearingsTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const here = d.length < task.route.length - 1 ? hereOf(task, d) : -1;
  const visited = new Set(task.route.slice(0, d.length + 1));
  return (
    <group>
      {task.cairns.map((c, i) => {
        const [x, z] = c.at;
        return (
          <group key={i} position={[x, t.floorY(x, z), z]}>
            <Rose />
            {[0.55, 0.42, 0.3].map((r, k) => (
              <mesh key={k} material={M('#a89c88', { map: 'stone' })} position-y={0.4 + k * 0.42} castShadow>
                <dodecahedronGeometry args={[r]} />
              </mesh>
            ))}
            {(visited.has(i) || i === here) && (
              <mesh position-y={1.75}>
                <sphereGeometry args={[0.12, 8, 6]} />
                <meshBasicMaterial color={i === here ? '#ffe070' : '#c8b890'} toneMapped={false} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
