// Surah Al-Munafiqun: give before it is too late (63:10, "spend from what
// We have provided you before death comes to one of you and he says, 'My
// Lord, if only You would delay me a little, I would give charity'"). Around
// the village, chances to do good light up one at a time: a lantern glows
// where someone needs a hand, and slowly burns down. Get there while it is
// still lit and help. Leave it for later and the lantern goes out: that
// chance has passed, and another lights somewhere else. The village and its
// chances are a game idea; no one is shown.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type * as THREE from 'three';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { ChancesTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { cur: number; last: number; t0: number; ver: number };
const fresh = (): Live => ({ cur: -1, last: -1, t0: 0, ver: 0 });
const doneOf = (task: ChancesTask, s: MechSave) => (s.done.includes(task.id) ? task.spots.map((_, i) => i).slice(0, task.need) : s.prog[task.id] ?? []);
/** The next chance after `from` that has not been taken. */
const nextAfter = (task: ChancesTask, d: number[], from: number) => {
  for (let k = 1; k <= task.spots.length; k++) {
    const i = (from + k) % task.spots.length;
    if (!d.includes(i)) return i;
  }
  return -1;
};

export const Chances: Mechanic<ChancesTask> = {
  total: (task) => task.need,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const d = doneOf(task, env.save);
    if (d.length >= task.need || L.cur < 0) return [];
    const sp = task.spots[L.cur];
    return [{ key: `help:${task.id}`, pos: env.v3(sp.at), label: `Help now: ${sp.what}`, reach: 2.8, run: () => {
      const i = L.cur;
      env.api.progress(task.id, i);
      env.api.hint(task.spots[i].done);
      L.last = i;
      L.cur = -1;
      L.t0 = env.game.clock + 3; // a short pause before the next lights
      L.ver++;
    } }];
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const d = doneOf(task, env.save);
    if (d.length >= task.need) return;
    const now = env.game.clock;
    if (L.cur < 0) {
      if (now < L.t0) return `Chances taken: ${d.length} of ${task.need} · watch for the next lantern`;
      L.cur = nextAfter(task, d, L.last);
      L.t0 = now;
      L.ver++;
    }
    const left = task.life - (now - L.t0);
    if (left <= 0) {
      env.api.note(`${task.id}/passed`, L.cur);
      env.api.hint('The lantern has gone out: that chance has passed. "My Lord, if only You would delay me a little, I would give" (63:10). Another lantern is lighting. Go sooner.');
      L.last = L.cur;
      L.cur = -1;
      L.t0 = now + 2;
      L.ver++;
      return;
    }
    return `Chances taken: ${d.length} of ${task.need} · ${task.spots[L.cur].what} · the lantern burns ${Math.ceil(left)} s more`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.spots.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: ChancesView,
};

function Lantern({ on, part }: { on: boolean; part: number }) {
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const f = flame.current;
    if (!f) return;
    f.scale.setScalar(on ? (0.4 + 0.6 * part) * (1 + Math.sin(clock.elapsedTime * 9) * 0.06) : 0.001);
  });
  return (
    <group>
      <mesh material={M('#5a4a3a')} position-y={0.9}>
        <cylinderGeometry args={[0.05, 0.06, 1.8, 6]} />
      </mesh>
      <mesh material={M('#7a6a4a', { metal: 0.4 })} position-y={1.9}>
        <boxGeometry args={[0.32, 0.36, 0.32]} />
      </mesh>
      <mesh ref={flame} position-y={1.9}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshBasicMaterial color="#ffc860" toneMapped={false} />
      </mesh>
      {on && <pointLight position-y={1.9} color="#ffb850" distance={7} intensity={2 * part + 0.4} />}
    </group>
  );
}

function ChancesView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<ChancesTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setV] = useState(0);
  const [part, setPart] = useState(1);
  useFrame(() => {
    setV((v) => (v === L.ver ? v : L.ver));
    if (L.cur >= 0) {
      const p = Math.max(0, Math.min(1, 1 - (game.clock - L.t0) / task.life));
      setPart((q) => (Math.abs(q - p) > 0.04 ? p : q));
    }
  });
  const d = doneOf(task, data);
  return (
    <group>
      {task.spots.map((sp, i) => {
        const [x, z] = sp.at;
        const on = L.cur === i;
        return (
          <group key={i} position={[x, t.floorY(x, z), z]} {...(on ? tap(() => act(`help:${task.id}`)) : {})}>
            <Lantern on={on} part={part} />
            {d.includes(i) && (
              <mesh position-y={2.25}>
                <sphereGeometry args={[0.07, 8, 6]} />
                <meshBasicMaterial color="#9ae07a" toneMapped={false} />
              </mesh>
            )}
            {on && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
