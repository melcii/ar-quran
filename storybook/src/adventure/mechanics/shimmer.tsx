// Surah Ta-Ha's festival-ground chapter: what only seems to move (20:66,
// "their ropes and staffs seemed to him from their magic that they were
// moving"). On the open ground, ropes and staffs lie in the morning heat.
// From far away they seem to wriggle; walk up close and look, and each is
// only a rope or a stick lying still. Look closely at every one. An illusion
// does not hold up when you look closely, and "the magician will not succeed
// wherever he is" (20:69). Musa, the magicians and Pharaoh are never shown,
// and nothing is shown of the staff or of what Allah made it do: those ayahs
// are readings.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { Terrain } from '../terrain';
import type { ShimmerTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { ver: number };
const fresh = (): Live => ({ ver: 0 });

const seenOf = (task: ShimmerTask, s: MechSave) => (s.done.includes(task.id) ? task.things.map((_, i) => i) : s.prog[task.id] ?? []);

export const Shimmer: Mechanic<ShimmerTask> = {
  total: (task) => task.things.length,
  uses(task, env) {
    const seen = seenOf(task, env.save);
    return task.things.flatMap((th, i) => (seen.includes(i) ? [] : [{ key: `look:${task.id}:${i}`, pos: env.v3(th.at), label: `Look closely at the ${th.kind}`, reach: task.near * 0.8, run: () => {
      env.api.progress(task.id, i);
      live<Live>(env.game, task.id, fresh).ver++;
      env.api.hint(`Close up, it is only a ${th.kind} lying still on the ground. From far away it seemed to move.`);
    } }]));
  },
  frame(task, env) {
    const seen = seenOf(task, env.save);
    if (seen.length >= task.things.length) return;
    const far = task.things.every((th) => Math.hypot(th.at[0] - env.pp.x, th.at[1] - env.pp.z) > task.near * 2);
    if (far && seen.length === 0) env.tell(`${task.id}/far`, 'From here the ropes and staffs seem to wriggle. Walk right up to one and look closely.', 12);
    return `Looked at closely: ${seen.length} of ${task.things.length}`;
  },
  solve(task, api) {
    const seen = seenOf(task, api.save());
    const i = task.things.findIndex((_, j) => !seen.includes(j));
    if (i >= 0) api.progress(task.id, i);
  },
  View: ShimmerView,
};

const SEG = 12;

function Thing({ task, i, t, seen, active, act }: { task: ShimmerTask; i: number; t: Terrain; seen: boolean; active: boolean; act: (k: string) => void }) {
  const th = task.things[i];
  const [x, z] = th.at;
  const y = t.floorY(x, z);
  const parts = useRef<(THREE.Mesh | null)[]>([]);
  const len = th.kind === 'rope' ? 2.6 : 1.6;
  const r = th.kind === 'rope' ? 0.06 : 0.05;
  const mat = useMemo(() => M(th.kind === 'rope' ? '#c8a46a' : '#7a5232'), [th.kind]);
  const seed = i * 1.7;
  useFrame((s) => {
    // Seen from far away it seems to wriggle; up close (or once looked at) it lies still.
    const d = Math.hypot(player.pos.x - x, player.pos.z - z);
    const k = seen || motion.reduced ? 0 : THREE.MathUtils.smoothstep(d, task.near, task.near * 2.2);
    const time = s.clock.elapsedTime;
    parts.current.forEach((m, j) => {
      if (!m) return;
      const u = j / (SEG - 1) - 0.5;
      const wig = Math.sin(time * 4 + j * 0.9 + seed) * 0.22 * k * (th.kind === 'rope' ? 1 : 0.6);
      m.position.set(u * len, r + Math.max(0, Math.sin(time * 3 + j + seed)) * 0.04 * k, wig);
    });
  });
  return (
    <group position={[x, y, z]} rotation-y={th.rot ?? i * 1.3} {...tap(() => act(`look:${task.id}:${i}`))}>
      {Array.from({ length: SEG }, (_, j) => (
        <mesh key={j} ref={(m) => void (parts.current[j] = m)} material={mat} castShadow>
          <sphereGeometry args={[r * 1.25, 8, 6]} />
        </mesh>
      ))}
      {!seen && <Halo on={active} />}
    </group>
  );
}

function ShimmerView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<ShimmerTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const seen = seenOf(task, data);
  return (
    <group>
      {task.things.map((_, i) => (
        <Thing key={i} task={task} i={i} t={t} seen={seen.includes(i)} active={active} act={act} />
      ))}
    </group>
  );
}
