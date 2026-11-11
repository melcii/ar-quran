// Surah Al-Jinn: listening (72:1, "It has been revealed to me that a group
// of the jinn listened and said, 'Indeed, we have heard an amazing
// Quran'"). In a wide desert valley at evening, noises carry: wind singing
// through a rock arch, a stream over stones, goat bells, a creaking well
// wheel. Find a quiet place to sit and listen: the hush meter shows how
// loud it is where you stand, louder near each noise. Follow it to a quiet
// spot and keep still. The noises change as the evening goes on, so each
// time you must find a new quiet place. The jinn are never shown or
// imagined; only the ayahs are read. The valley is a game.
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import type { HushTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { still: number };
const fresh = (): Live => ({ still: 0 });
const STILL = 3; // seconds of keeping still in a quiet place
const doneOf = (task: HushTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.rounds }, (_, i) => i) : s.prog[task.id] ?? []);
const roundOf = (task: HushTask, d: number[]) => Array.from({ length: task.rounds }, (_, i) => i).findIndex((i) => !d.includes(i));
/** How loud it is at (x, z) in this round: each noise fades with distance. */
export const noise = (task: HushTask, r: number, x: number, z: number) =>
  task.sources.reduce((a, s) => (s.rounds.includes(r) ? a + s.loud / (1 + (Math.hypot(x - s.at[0], z - s.at[1]) / 6) ** 2) : a), 0);

export const Hush: Mechanic<HushTask> = {
  total: (task) => task.rounds,
  frame(task, env) {
    const d = doneOf(task, env.save);
    const r = roundOf(task, d);
    if (r < 0) return;
    const L = live<Live>(env.game, task.id, fresh);
    const n = noise(task, r, env.pp.x, env.pp.z);
    const quiet = n < task.quiet;
    if (quiet && env.still) L.still += env.dt;
    else L.still = 0;
    if (L.still >= STILL) {
      L.still = 0;
      env.api.progress(task.id, r);
      if (r + 1 >= task.rounds) env.api.open({ kind: 'reading', reading: task.reading });
      else env.api.hint('It is quiet here, and you listen. But the evening is changing: listen, the noises are moving. Find a new quiet place.');
      return;
    }
    const bars = Math.min(10, Math.round((n / task.quiet) * 3));
    const loudest = task.sources.filter((s) => s.rounds.includes(r)).sort((a, b) => noise({ ...task, sources: [b] }, r, env.pp.x, env.pp.z) - noise({ ...task, sources: [a] }, r, env.pp.x, env.pp.z))[0];
    return `Hush meter ${'▮'.repeat(bars)}${'▯'.repeat(Math.max(0, 10 - bars))} · ${quiet ? (env.still ? 'quiet: keep still and listen…' : 'quiet here: stand still') : `too loud: ${loudest?.name ?? 'noise'} nearby`} · quiet places found: ${d.length} of ${task.rounds}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const r = roundOf(task, d);
    if (r >= 0) api.progress(task.id, r);
  },
  View: HushView,
};

function Rings({ loud }: { loud: number }) {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const tt = clock.elapsedTime * (motion.reduced ? 0.3 : 1);
    [a.current, b.current].forEach((m, k) => {
      if (!m) return;
      const f = (tt * 0.6 + k * 0.5) % 1;
      m.scale.setScalar(0.5 + f * 3 * loud);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - f);
    });
  });
  return (
    <group position-y={0.15} rotation-x={-Math.PI / 2}>
      {[a, b].map((r, k) => (
        <mesh key={k} ref={r}>
          <ringGeometry args={[0.9, 1, 32]} />
          <meshBasicMaterial color="#fff2d0" transparent opacity={0.3} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function HushView({ task, t, data }: Parameters<NonNullable<Mechanic<HushTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const r = roundOf(task, d);
  return (
    <group>
      {task.sources.map((s, i) => {
        const [x, z] = s.at;
        const on = r >= 0 && s.rounds.includes(r);
        return (
          <group key={i} position={[x, t.floorY(x, z), z]}>
            {/* A small marker stone for each noise; the sound rings show while it is heard. */}
            <mesh material={M('#a89070', { map: 'stone' })} position-y={0.2}>
              <dodecahedronGeometry args={[0.3]} />
            </mesh>
            {on && <Rings loud={s.loud} />}
          </group>
        );
      })}
    </group>
  );
}
