// Surah An-Nur's own play: houses, permission and light (24:27-28, 24:61).
// Each house has a courtyard that is dark inside. Knock at its door and wait
// for an answer, as 24:27 teaches; one house answers "please come back
// later", and you go back and come again (24:28). Once welcomed, turn the
// mirror stands in the courtyard so the sunbeam coming in at the west
// opening bounces through to the reading window. The light here is
// sunlight in a courtyard only. The parable of light in 24:35 is about
// Allah and stays a reading: no mirror, lamp or light in the game stands
// for Allah. The people inside are not shown; the voice is written text.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2, Terrain } from '../terrain';
import type { MirrorHouse, MirrorTask } from '../types';
import { live, type Mechanic, type MechEnv, type MechSave } from './base';

type Knock = 'none' | 'waiting' | 'later' | 'welcome';
type Live = { knock: Knock[]; wait: number[]; told: boolean[]; turns: (0 | 1)[][]; ver: number };
const fresh = (task: MirrorTask) => (): Live => ({
  knock: task.houses.map(() => 'none'),
  wait: task.houses.map(() => 0),
  told: task.houses.map(() => false),
  turns: task.houses.map((h) => h.mirrors.map((m) => m.turn)),
  ver: 0,
});

const lit = (task: MirrorTask, s: MechSave) => (s.done.includes(task.id) ? task.houses.map((_, i) => i) : s.prog[task.id] ?? []);

/** World position of a grid point (cell units; 0.5 = cell centre). */
const at = (h: MirrorHouse, cs: number, i: number, j: number): P2 => [h.origin[0] + i * cs, h.origin[1] - j * cs];

/** Follow the sunbeam through the grid. Returns the points it passes and whether it leaves by the target window. */
export function trace(h: MirrorHouse, turns: (0 | 1)[]) {
  let i = -1;
  let j = h.sun;
  let di = 1;
  let dj = 0;
  const pts: [number, number][] = [[0, h.sun + 0.5]];
  for (let step = 0; step < h.n * h.n * 4; step++) {
    i += di;
    j += dj;
    if (i < 0 || j < 0 || i >= h.n || j >= h.n) {
      const side = i >= h.n ? 'e' : j >= h.n ? 'n' : j < 0 ? 's' : 'w';
      const ci = Math.min(h.n - 1, Math.max(0, i));
      const cj = Math.min(h.n - 1, Math.max(0, j));
      pts.push([ci + 0.5 + di * 0.5, cj + 0.5 + dj * 0.5]);
      return { pts, hit: side === h.target.side && ci === h.target.cell[0] && cj === h.target.cell[1] };
    }
    const k = h.mirrors.findIndex((m) => m.cell[0] === i && m.cell[1] === j);
    if (k >= 0) {
      pts.push([i + 0.5, j + 0.5]);
      [di, dj] = turns[k] === 0 ? [dj, di] : [-dj, -di];
    }
  }
  return { pts, hit: false };
}

/** A set of turns that lights the window (shown for a courtyard already lit, after a reload). */
export function solution(h: MirrorHouse): (0 | 1)[] {
  const m = h.mirrors.length;
  for (let b = 0; b < 1 << m; b++) {
    const turns = h.mirrors.map((_, k) => ((b >> k) & 1) as 0 | 1);
    if (trace(h, turns).hit) return turns;
  }
  return h.mirrors.map((x) => x.turn);
}

const near = (p: P2, env: MechEnv, r: number) => Math.hypot(p[0] - env.pp.x, p[1] - env.pp.z) < r;

export const Mirror: Mechanic<MirrorTask> = {
  total: (task) => task.houses.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const done = lit(task, env.save);
    const out = [];
    for (const [hi, h] of task.houses.entries()) {
      if (done.includes(hi)) continue;
      if (L.knock[hi] === 'none')
        out.push({ key: `knock:${task.id}:${hi}`, pos: env.v3(h.door), label: 'Knock and wait for an answer', reach: 2.6, run: () => {
          L.knock[hi] = 'waiting';
          L.wait[hi] = 0;
          L.ver++;
          env.api.hint('You knocked. Now wait by the door for an answer.');
        } });
      if (L.knock[hi] === 'welcome')
        h.mirrors.forEach((m, k) => {
          const [x, z] = at(h, task.cell, m.cell[0] + 0.5, m.cell[1] + 0.5);
          out.push({ key: `turn:${task.id}:${hi}:${k}`, pos: env.v3([x, z]), label: 'Turn the mirror', reach: 2, run: () => {
            L.turns[hi][k] = L.turns[hi][k] ? 0 : 1;
            L.ver++;
            if (trace(h, L.turns[hi]).hit) {
              env.api.progress(task.id, hi);
              env.api.open({ kind: 'reading', reading: h.reading });
            }
          } });
        });
    }
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const done = lit(task, env.save);
    let line = `Courtyards lit: ${done.length} of ${task.houses.length}`;
    for (const [hi, h] of task.houses.entries()) {
      if (done.includes(hi)) continue;
      const k = L.knock[hi];
      if (k === 'waiting') {
        if (!near(h.door, env, 3.5)) {
          L.knock[hi] = 'none';
          L.ver++;
          env.api.hint('You walked away before an answer came. Knock again and wait.');
          continue;
        }
        L.wait[hi] += env.dt;
        line = `Waiting at the door of ${h.label} for an answer`;
        if (L.wait[hi] > 2.5) {
          L.ver++;
          if (h.later && !L.told[hi]) {
            L.told[hi] = true;
            L.knock[hi] = 'later';
            env.api.note(`${task.id}/l`, hi);
            env.api.hint('A voice from inside: "Please come back later." So you go back, and come again another time (24:28).');
          } else {
            L.knock[hi] = 'welcome';
            env.api.say('A voice from inside: "Peace be upon you. Come in." Inside, the courtyard is dark. Turn the mirrors so the sunlight reaches the reading window.');
          }
        }
      } else if (k === 'later') {
        if (!near(h.door, env, 12)) {
          L.knock[hi] = 'none';
          L.ver++;
          env.api.hint(`Some time has passed. You can go back to ${h.label} and knock again.`);
        } else if (near(h.door, env, 6)) line = 'You were asked to come back later: go away for now';
      } else if (k === 'welcome' && near(at(h, task.cell, h.n / 2, h.n / 2), env, (h.n * task.cell) / 1.4)) line = `Turn the mirrors to bring the sunlight to the window · Courtyards lit: ${done.length} of ${task.houses.length}`;
    }
    return line;
  },
  View: MirrorView,
};

function Beam({ pts, h, cs, t, on }: { pts: [number, number][]; h: MirrorHouse; cs: number; t: Terrain; on: boolean }) {
  const y = t.floorY(...at(h, cs, h.n / 2, h.n / 2)) + 1.2;
  return (
    <group>
      {pts.slice(1).map((b, k) => {
        const a = pts[k];
        const [ax, az] = at(h, cs, a[0], a[1]);
        const [bx, bz] = at(h, cs, b[0], b[1]);
        const len = Math.hypot(bx - ax, bz - az);
        return (
          <mesh key={k} position={[(ax + bx) / 2, y, (az + bz) / 2]} rotation-y={Math.atan2(-(bz - az), bx - ax)} renderOrder={4}>
            <boxGeometry args={[len, 0.12, 0.12]} />
            <meshBasicMaterial color={on ? '#fff4c0' : '#ffe08a'} transparent opacity={0.85} toneMapped={false} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function House({ task, h, hi, t, L, done, active, act }: { task: MirrorTask; h: MirrorHouse; hi: number; t: Terrain; L: Live; done: boolean; active: boolean; act: (k: string) => void }) {
  const cs = task.cell;
  const turns = done && !trace(h, L.turns[hi]).hit ? solution(h) : L.turns[hi];
  const beam = useMemo(() => trace(h, turns), [h, turns, L.ver]); // eslint-disable-line react-hooks/exhaustive-deps
  const welcome = done || L.knock[hi] === 'welcome';
  const glow = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    if (glow.current) (glow.current.material as THREE.MeshBasicMaterial).opacity = done ? 0.9 : 0.25 + (motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 2) * 0.05);
  });
  const [tx, tz] = (() => {
    const [ci, cj] = h.target.cell;
    const s = h.target.side;
    return at(h, cs, ci + 0.5 + (s === 'e' ? 0.5 : 0), cj + 0.5 + (s === 'n' ? 0.5 : s === 's' ? -0.5 : 0));
  })();
  const [sx, sz] = at(h, cs, 0, h.sun + 0.5);
  const floor = M(welcome ? '#d8c8a8' : '#8a8070', { map: 'stone' });
  const [cx, cz] = at(h, cs, h.n / 2, h.n / 2);
  return (
    <group>
      <mesh material={floor} position={[cx, t.floorY(cx, cz) + 0.04, cz]} receiveShadow>
        <boxGeometry args={[h.n * cs, 0.08, h.n * cs]} />
      </mesh>
      {/* The door to knock at. */}
      <group position={[h.door[0], t.floorY(h.door[0], h.door[1]), h.door[1]]} {...tap(() => act(`knock:${task.id}:${hi}`))}>
        <mesh material={M('#6a4a2e', { map: 'planks' })} position-y={1.2} castShadow>
          <boxGeometry args={[1.4, 2.4, 0.12]} />
        </mesh>
        <mesh material={M('#c8a050', { metal: 0.5 })} position={[0.4, 1.2, 0.08]}>
          <torusGeometry args={[0.1, 0.025, 6, 12]} />
        </mesh>
        {!done && L.knock[hi] === 'none' && <Halo on={active} />}
      </group>
      {/* The sun's way in on the west side. */}
      <mesh position={[sx - 0.3, t.floorY(sx, sz) + 1.2, sz]}>
        <sphereGeometry args={[0.25, 10, 8]} />
        <meshBasicMaterial color="#fff0b0" toneMapped={false} />
      </mesh>
      {/* The reading window. */}
      <mesh ref={glow} position={[tx, t.floorY(tx, tz) + 1.2, tz]} rotation-y={h.target.side === 'e' ? Math.PI / 2 : 0}>
        <planeGeometry args={[1.4, 1.2]} />
        <meshBasicMaterial color="#ffe6a0" transparent opacity={0.3} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {done && <pointLight position={[tx, t.floorY(tx, tz) + 1.6, tz]} intensity={12} distance={9} color="#ffe0a0" />}
      {welcome && <Beam pts={beam.pts} h={h} cs={cs} t={t} on={done} />}
      {h.mirrors.map((m, k) => {
        const [x, z] = at(h, cs, m.cell[0] + 0.5, m.cell[1] + 0.5);
        return (
          <group key={k} position={[x, t.floorY(x, z), z]} {...tap(() => act(`turn:${task.id}:${hi}:${k}`))}>
            <mesh material={M('#7a5232', { map: 'planks' })} position-y={0.55}>
              <cylinderGeometry args={[0.08, 0.1, 1.1, 8]} />
            </mesh>
            <mesh position-y={1.2} rotation-y={turns[k] === 0 ? Math.PI / 4 : -Math.PI / 4}>
              <boxGeometry args={[1.3, 0.8, 0.05]} />
              <meshStandardMaterial color="#cfe0ea" metalness={0.9} roughness={0.08} />
            </mesh>
            {welcome && !done && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}

function MirrorView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<MirrorTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh(task));
  const done = lit(task, data);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  return (
    <group>
      {task.houses.map((h, hi) => (
        <House key={hi} task={task} h={h} hi={hi} t={t} L={L} done={done.includes(hi)} active={active} act={act} />
      ))}
    </group>
  );
}
