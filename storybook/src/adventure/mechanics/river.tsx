// Surah Al-Qasas's own play: the chest on the river (28:7-13). A river runs
// down from the hills and splits twice. At each fork a bundle of reeds can be
// moved to close one channel or the other. Let the empty chest go at the top
// and follow it along the bank: move the reeds ahead of it so it takes the
// channel to the quiet landing, and nudge it free where it catches on the
// bank. A wrong channel ends in a reed marsh, and the chest is brought back
// to try again. Musa, his mother and his sister are not shown: the chest
// floats empty, and the story is read.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2, Terrain } from '../terrain';
import type { RiverSeg, RiverTask } from '../types';
import { live, type Mechanic, type MechSave, type MechUse } from './base';

type State = 'ready' | 'float' | 'snag' | 'stopped';
type Live = { state: State; gates: number[]; seg: RiverSeg | null; d: number; pos: P2; freed: number[]; snag: number; wait: number; ver: number };
const fresh = (task: RiverTask) => (): Live => ({ state: 'ready', gates: task.gates.map((g) => g.start), seg: null, d: 0, pos: task.river.pts[0], freed: [], snag: -1, wait: 0, ver: 0 });

const landed = (task: RiverTask, s: MechSave) => s.done.includes(task.id);

const segLen = (seg: RiverSeg) => seg.pts.slice(1).reduce((a, b, i) => a + Math.hypot(b[0] - seg.pts[i][0], b[1] - seg.pts[i][1]), 0);

function pointAt(seg: RiverSeg, d: number): P2 {
  let left = d;
  for (let i = 0; i < seg.pts.length - 1; i++) {
    const a = seg.pts[i];
    const b = seg.pts[i + 1];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= l || i === seg.pts.length - 2) {
      const k = l ? Math.min(1, left / l) : 0;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    left -= l;
  }
  return seg.pts[seg.pts.length - 1];
}

/** Every fork, with its gate and its two channels. */
function forks(seg: RiverSeg, out: RiverSeg[] = []): RiverSeg[] {
  if (seg.kids) {
    out.push(seg);
    seg.kids.forEach((k) => forks(k, out));
  }
  return out;
}

function reset(task: RiverTask, L: Live) {
  L.state = 'ready';
  L.seg = null;
  L.d = 0;
  L.pos = task.river.pts[0];
  L.freed = [];
  L.snag = -1;
  L.ver++;
}

export const River: Mechanic<RiverTask> = {
  total: () => 1,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const out: MechUse[] = [];
    if (L.state === 'ready')
      out.push({ key: `release:${task.id}`, pos: env.v3(task.river.pts[0]), label: 'Let the chest go on the river', reach: 3.5, run: () => {
        L.state = 'float';
        L.seg = task.river;
        L.d = 0;
        L.ver++;
        env.api.hint('The current takes the chest. Follow it along the bank, and set the reeds at each fork before it gets there.');
      } });
    task.gates.forEach((g, i) => {
      out.push({ key: `gate:${task.id}:${i}`, pos: env.v3(g.at), label: `Move the reeds: ${g.labels[L.gates[i] ? 0 : 1]}`, reach: 3.5, run: () => {
        L.gates[i] = L.gates[i] ? 0 : 1;
        L.ver++;
      } });
    });
    if (L.state === 'snag')
      out.push({ key: `nudge:${task.id}`, pos: env.v3(task.snags[L.snag]), label: 'Nudge the chest free with a reed', reach: 3.5, run: () => {
        L.freed.push(L.snag);
        L.state = 'float';
        L.ver++;
      } });
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    if (L.state === 'float' && L.seg) {
      L.d += task.speed * env.dt;
      const len = segLen(L.seg);
      if (L.d >= len) {
        const seg = L.seg;
        if (seg.kids) {
          L.seg = seg.kids[L.gates[seg.gate ?? 0]];
          L.d -= len;
          L.ver++;
        } else if (seg.end === 'landing') {
          L.pos = seg.pts[seg.pts.length - 1];
          L.state = 'stopped';
          L.ver++;
          env.api.progress(task.id, 0);
          return;
        } else {
          L.state = 'stopped';
          L.wait = 2.5;
          L.ver++;
          env.api.note(`${task.id}/x`, 0);
          env.api.hint('The chest drifted into the reed marsh and stopped. It is brought back to the top: set the reeds so it reaches the quiet landing.');
        }
      }
      if (L.seg && L.state === 'float') L.pos = pointAt(L.seg, L.d);
      const k = task.snags.findIndex((p, i) => !L.freed.includes(i) && Math.hypot(p[0] - L.pos[0], p[1] - L.pos[1]) < 0.9);
      if (k >= 0) {
        L.state = 'snag';
        L.snag = k;
        L.ver++;
        env.api.hint('The chest has caught on the bank. Go and nudge it free.');
      }
    }
    if (L.state === 'stopped' && !landed(task, env.save)) {
      L.wait -= env.dt;
      if (L.wait <= 0) reset(task, L);
    }
    if (L.state === 'ready') return 'Set the reeds at the forks, then let the chest go at the top of the river';
    if (L.state === 'snag') return 'The chest is caught on the bank: nudge it free';
    if (L.state === 'float') {
      const f = !!L.seg?.kids && segLen(L.seg) - L.d < 8;
      return f ? 'The chest is coming to a fork: are the reeds set?' : 'The chest is floating down the river: follow it';
    }
  },
  View: RiverView,
};

function Reeds({ p, t }: { p: P2; t: Terrain }) {
  const y = t.water ?? t.floorY(p[0], p[1]);
  return (
    <group position={[p[0], y, p[1]]}>
      {Array.from({ length: 9 }, (_, k) => (
        <mesh key={k} material={M(k % 2 ? '#8aa04a' : '#a8b060')} position={[(k - 4) * 0.35, 0.9, Math.sin(k * 2.1) * 0.3]} rotation-z={(k - 4) * 0.04}>
          <cylinderGeometry args={[0.05, 0.07, 2.4, 5]} />
        </mesh>
      ))}
      <mesh material={M('#9a7a4a')} position-y={0.5} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.1, 0.1, 3.4, 6]} />
      </mesh>
    </group>
  );
}

function RiverView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<RiverTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh(task));
  const done = landed(task, data);
  const [, setVer] = useState(0);
  const chest = useRef<THREE.Group>(null);
  useFrame((st) => {
    setVer((v) => (v === L.ver ? v : L.ver));
    const c = chest.current;
    if (!c) return;
    const p = done ? lastLanding(task.river) : L.pos;
    const y = (t.water ?? t.floorY(p[0], p[1])) + 0.15 + (motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 2) * 0.05);
    c.position.set(p[0], y, p[1]);
    c.rotation.z = motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 1.3) * 0.06;
  });
  const fk = forks(task.river);
  const [sx, sz] = task.river.pts[0];
  return (
    <group>
      <group ref={chest} {...tap(() => act(L.state === 'snag' ? `nudge:${task.id}` : `release:${task.id}`))}>
        <mesh material={M('#8a5a32', { map: 'planks' })} position-y={0.25} castShadow>
          <boxGeometry args={[1.1, 0.5, 0.7]} />
        </mesh>
        <mesh material={M('#7a4a2a', { map: 'planks' })} position-y={0.55}>
          <boxGeometry args={[1.15, 0.12, 0.75]} />
        </mesh>
        {!done && (L.state === 'ready' || L.state === 'snag') && <Halo on={active} />}
      </group>
      {/* The landing stone at the top where the chest is let go. */}
      <mesh material={M('#c8b490', { map: 'stone' })} position={[sx + 1.6, t.floorY(sx + 1.6, sz) + 0.15, sz]}>
        <boxGeometry args={[1.4, 0.3, 1.4]} />
      </mesh>
      {fk.map((seg) => {
        const gi = seg.gate ?? 0;
        const closed = seg.kids![L.gates[gi] ? 0 : 1];
        const a = closed.pts[0];
        const b = closed.pts[1];
        const p: P2 = [a[0] + (b[0] - a[0]) * 0.35, a[1] + (b[1] - a[1]) * 0.35];
        const g = task.gates[gi];
        return (
          <group key={gi}>
            <Reeds p={p} t={t} />
            <group position={[g.at[0], t.floorY(g.at[0], g.at[1]), g.at[1]]} {...tap(() => act(`gate:${task.id}:${gi}`))}>
              <mesh material={M('#7a5232')} position-y={0.6}>
                <cylinderGeometry args={[0.08, 0.1, 1.2, 6]} />
              </mesh>
              {!done && <Halo on={active} />}
            </group>
          </group>
        );
      })}
      {task.snags.map((p, k) => (
        <mesh key={k} material={M('#7a6a54', { map: 'stone' })} position={[p[0], (t.water ?? t.floorY(p[0], p[1])) + 0.1, p[1]]}>
          <dodecahedronGeometry args={[0.45, 0]} />
        </mesh>
      ))}
    </group>
  );
}

function lastLanding(seg: RiverSeg): P2 {
  if (seg.end === 'landing') return seg.pts[seg.pts.length - 1];
  for (const k of seg.kids ?? []) {
    const p = lastLanding(k);
    if (p) return p;
  }
  return null as unknown as P2;
}
