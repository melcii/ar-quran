// Surah Muhammad: water that does not go stale. The surah describes the
// Garden promised to the righteous with "rivers of water unaltered" (47:15);
// that Garden is of the unseen and is never pictured. Here, in an ordinary
// garden of this world, water only stays fresh while it runs. Four channels
// run from a spring to four pools, and each is blocked: by a mat of leaves,
// a fallen stone, a bank of mud. Take the right tool from the rack (a rake,
// a lever bar, a scoop) and clear each channel from the spring down; the
// water runs on as far as the next block, and a pool turns clear once its
// channel runs all the way. The garden and the tools are a game idea.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { Terrain } from '../terrain';
import type { ChannelsTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { held: number; ver: number };
const fresh = (): Live => ({ held: -1, ver: 0 });

/** Every block in every channel gets one index, channel by channel. */
const index = (task: ChannelsTask, c: number, b: number) => task.channels.slice(0, c).reduce((n, ch) => n + ch.blocks.length, 0) + b;
const all = (task: ChannelsTask) => task.channels.reduce((n, ch) => n + ch.blocks.length, 0);
const doneOf = (task: ChannelsTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
/** Blocks are cleared from the spring down; this is the first one still in the way, or -1. */
const nextBlock = (task: ChannelsTask, c: number, d: number[]) => {
  const ch = task.channels[c];
  const order = ch.blocks.map((_, b) => b).sort((a, b) => ch.blocks[a].t - ch.blocks[b].t);
  return order.find((b) => !d.includes(index(task, c, b))) ?? -1;
};
const lerp2 = (a: [number, number], b: [number, number], k: number): [number, number] => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

export const Channels: Mechanic<ChannelsTask> = {
  total: all,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const d = doneOf(task, env.save);
    if (d.length >= all(task)) return [];
    const out = task.tools.flatMap((name, k) => (L.held === k ? [] : [{ key: `tool:${task.id}:${k}`, pos: env.v3(task.rack), label: `Take the ${name} from the rack`, reach: 2.6, run: () => {
      L.held = k;
      L.ver++;
    } }]));
    task.channels.forEach((ch, c) => {
      const b = nextBlock(task, c, d);
      if (b < 0) return;
      const bl = ch.blocks[b];
      out.push({ key: `clear:${task.id}:${c}:${b}`, pos: env.v3(lerp2(ch.from, ch.to, bl.t)), label: L.held < 0 ? `Clear ${bl.name} (take a tool first)` : `Clear ${bl.name} with the ${task.tools[L.held]}`, reach: 2.6, run: () => {
        if (L.held < 0) return env.api.hint('You need a tool from the rack by the spring.');
        if (L.held !== bl.tool) {
          env.api.note(`${task.id}/x`, index(task, c, b));
          return env.api.hint(`The ${task.tools[L.held]} will not clear ${bl.name}. Which tool on the rack would?`);
        }
        env.api.progress(task.id, index(task, c, b));
        env.api.hint(nextBlock(task, c, [...d, index(task, c, b)]) < 0 ? 'The water runs all the way down, and the pool turns clear.' : 'Cleared. The water runs on, as far as the next block.');
      } });
    });
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const d = doneOf(task, env.save);
    const clear = task.channels.filter((_, c) => nextBlock(task, c, d) < 0).length;
    if (clear < task.channels.length) return `Channels running clear: ${clear} of ${task.channels.length}${L.held >= 0 ? ` · holding the ${task.tools[L.held]}` : ''}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: all(task) }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: ChannelsView,
};

function Tool({ k }: { k: number }) {
  // 0: rake, 1: lever bar, 2: scoop
  return (
    <group>
      <mesh material={M('#8a6a44')} position-y={0.6}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
      </mesh>
      {k === 0 && (
        <mesh material={M('#6a6a70', { metal: 0.5 })} position-y={1.2}>
          <boxGeometry args={[0.45, 0.06, 0.06]} />
        </mesh>
      )}
      {k === 1 && (
        <mesh material={M('#5a5a64', { metal: 0.6 })} position-y={0.6}>
          <cylinderGeometry args={[0.035, 0.035, 1.3, 6]} />
        </mesh>
      )}
      {k === 2 && (
        <mesh material={M('#7a7a84', { metal: 0.5 })} position-y={1.2} rotation-x={Math.PI}>
          <sphereGeometry args={[0.18, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      )}
    </group>
  );
}

function Channel({ task, c, t, d }: { task: ChannelsTask; c: number; t: Terrain; d: number[] }) {
  const ch = task.channels[c];
  const [ax, az] = ch.from;
  const [bx, bz] = ch.to;
  const len = Math.hypot(bx - ax, bz - az);
  const yaw = Math.atan2(bx - ax, bz - az);
  const b = nextBlock(task, c, d);
  const reach = b < 0 ? 1 : ch.blocks[b].t;
  const water = useRef<THREE.Mesh>(null);
  const pool = useRef<THREE.MeshStandardMaterial>(null);
  const k = useRef(reach);
  useFrame((s, dt) => {
    k.current += (reach - k.current) * Math.min(1, dt * (motion.reduced ? 10 : 1.2));
    const w = water.current;
    if (w) {
      w.scale.z = Math.max(0.01, k.current);
      w.position.z = (len * k.current) / 2;
    }
    pool.current?.color.set(b < 0 ? '#5aa0c8' : '#7a7048');
    if (pool.current) pool.current.opacity = b < 0 ? 0.85 + (motion.reduced ? 0 : Math.sin(s.clock.elapsedTime * 2) * 0.05) : 0.95;
  });
  const y0 = (t.floorY(ax, az) + t.floorY(bx, bz)) / 2;
  return (
    <group>
      <group position={[ax, y0 + 0.02, az]} rotation-y={yaw}>
        {[-0.45, 0.45].map((s) => (
          <mesh key={s} material={M('#b0a088', { map: 'stone' })} position={[s, 0.08, len / 2]} receiveShadow>
            <boxGeometry args={[0.18, 0.18, len]} />
          </mesh>
        ))}
        <mesh ref={water} position-y={0.06}>
          <boxGeometry args={[0.72, 0.04, len]} />
          <meshStandardMaterial color="#5aa0c8" roughness={0.15} />
        </mesh>
      </group>
      {ch.blocks.map((bl, j) => {
        if (d.includes(index(task, c, j))) return null;
        const [x, z] = lerp2(ch.from, ch.to, bl.t);
        const y = t.floorY(x, z);
        return (
          <mesh key={j} position={[x, y + 0.2, z]} material={M(bl.tool === 0 ? '#8a7a3a' : bl.tool === 1 ? '#8a8a84' : '#6a5038', bl.tool === 1 ? { map: 'stone' } : {})} castShadow>
            {bl.tool === 1 ? <dodecahedronGeometry args={[0.42]} /> : <boxGeometry args={[0.8, bl.tool === 0 ? 0.18 : 0.32, 0.6]} />}
          </mesh>
        );
      })}
      <mesh position={[bx, t.floorY(bx, bz) + 0.05, bz]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.6, 20]} />
        <meshStandardMaterial ref={pool} color="#7a7048" transparent roughness={0.2} />
      </mesh>
    </group>
  );
}

function ChannelsView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<ChannelsTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const d = doneOf(task, data);
  const hand = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = hand.current;
    if (!g) return;
    g.position.set(player.pos.x + Math.sin(player.yaw + 0.5) * 0.5, player.pos.y - 0.2, player.pos.z + Math.cos(player.yaw + 0.5) * 0.5);
    g.rotation.y = player.yaw;
  });
  const [rx, rz] = task.rack;
  const ry = t.floorY(rx, rz);
  return (
    <group>
      {task.channels.map((_, c) => (
        <Channel key={c} task={task} c={c} t={t} d={d} />
      ))}
      <group position={[rx, ry, rz]} {...tap(() => act(`tool:${task.id}:${(L.held + 1) % task.tools.length}`))}>
        <mesh material={M('#6a4a2a')} position-y={1.3}>
          <boxGeometry args={[1.6, 0.08, 0.08]} />
        </mesh>
        {[-0.75, 0.75].map((x) => (
          <mesh key={x} material={M('#6a4a2a')} position={[x, 0.65, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.3, 6]} />
          </mesh>
        ))}
        {task.tools.map((_, k) =>
          L.held === k ? null : (
            <group key={k} position={[-0.45 + k * 0.45, 0.05, 0.1]} rotation-z={0.08}>
              <Tool k={k} />
            </group>
          ),
        )}
        {d.length < all(task) && <Halo on={active && L.held < 0} />}
      </group>
      <group ref={hand} scale={0.8}>
        {L.held >= 0 && <Tool k={L.held} />}
      </group>
    </group>
  );
}
