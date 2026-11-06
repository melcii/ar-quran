// Surah As-Saffat's own play: the gourd vine on the shore (37:145-146, "We
// threw him onto the open shore while he was ill. And We caused to grow over
// him a gourd vine"). On a hot beach an empty shade frame stands over a
// resting mat; a young gourd vine grows from the sand nearby. A vine climbs
// only what it can reach: carry stakes from the bundle and plant them in a
// line so the vine can climb from stake to stake up onto the frame and shade
// it. A stake planted too far from the vine is out of its reach. Yunus is not
// shown; the mat is empty and the story is read.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2, Terrain } from '../terrain';
import type { VineTask } from '../types';
import { live, type Mechanic, type MechSave, type MechUse } from './base';

type Live = { reached: P2[]; stakes: P2[]; target: P2 | null; grow: number; carry: boolean; covered: boolean; ver: number };
const fresh = (task: VineTask) => (): Live => ({ reached: [task.root], stakes: [], target: null, grow: 0, carry: false, covered: false, ver: 0 });

const shaded = (task: VineTask, s: MechSave) => s.done.includes(task.id);
const dist = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** The frame's near post, where the vine climbs on. */
const post = (task: VineTask): P2 => [task.frame[0], task.frame[1] + 1.8];

export const Vine: Mechanic<VineTask> = {
  total: () => 1,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const out: MechUse[] = [];
    if (shaded(task, env.save) || L.covered) return out;
    if (!L.carry)
      out.push({ key: `stake:${task.id}`, pos: env.v3(task.bundle), label: 'Take a stake from the bundle', reach: 2, run: () => {
        L.carry = true;
        L.ver++;
      } });
    else {
      const here: P2 = [env.pp.x, env.pp.z];
      out.push({ key: `plant|${task.id}`, pos: env.pp.clone(), label: 'Plant the stake here', reach: 5, run: () => {
        const from = [...L.reached, ...L.stakes].reduce((a, b) => (dist(b, here) < dist(a, here) ? b : a));
        if (dist(from, here) > task.gap) {
          env.api.note(`${task.id}/x`, L.stakes.length);
          env.api.hint(`That is too far for the vine to reach: about ${Math.round(dist(from, here))} steps from the nearest stake. Plant it closer, no more than ${task.gap} steps.`);
          return;
        }
        L.stakes.push(here);
        L.carry = false;
        L.ver++;
      } });
    }
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    if (shaded(task, env.save)) return;
    const tip = L.reached[L.reached.length - 1];
    if (!L.target) {
      // Climb on to the frame if it is in reach, else to the next stake, nearer the frame.
      if (dist(tip, post(task)) <= task.gap) L.target = post(task);
      else {
        const next = L.stakes.filter((s) => !L.reached.includes(s) && dist(s, tip) <= task.gap && dist(s, post(task)) < dist(tip, post(task))).sort((a, b) => dist(a, post(task)) - dist(b, post(task)))[0];
        if (next) L.target = next;
      }
      if (L.target) {
        L.grow = 0;
        L.ver++;
      }
    }
    if (L.target) {
      L.grow += (task.speed * env.dt) / Math.max(0.5, dist(tip, L.target));
      if (L.grow >= 1) {
        L.reached.push(L.target);
        const onFrame = dist(L.target, post(task)) < 0.01;
        L.target = null;
        L.grow = 0;
        L.ver++;
        if (onFrame) {
          L.covered = true;
          env.api.progress(task.id, 0);
          return;
        }
      }
      return `The vine is climbing · stakes reached: ${L.reached.length - 1}${L.carry ? ' · carrying a stake' : ''}`;
    }
    const left = Math.max(0, dist(tip, post(task)) - task.gap);
    return `The vine needs something to climb · ${Math.round(left)} steps more to the shade frame · plant stakes no more than ${task.gap} steps apart${L.carry ? ' · carrying a stake' : ''}`;
  },
  View: VineView,
};

function Stem({ a, b, f, t }: { a: P2; b: P2; f: number; t: Terrain }) {
  const ya = t.floorY(a[0], a[1]) + 0.9;
  const yb = t.floorY(b[0], b[1]) + 0.9;
  const ex = a[0] + (b[0] - a[0]) * f;
  const ez = a[1] + (b[1] - a[1]) * f;
  const ey = ya + (yb - ya) * f;
  const len = Math.hypot(ex - a[0], ey - ya, ez - a[1]);
  if (len < 0.01) return null;
  const mid = new THREE.Vector3((a[0] + ex) / 2, (ya + ey) / 2, (a[1] + ez) / 2);
  const dir = new THREE.Vector3(ex - a[0], ey - ya, ez - a[1]).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const leaves = Math.floor(len / 0.6);
  return (
    <group>
      <mesh material={M('#5a8a2a')} position={mid} quaternion={q}>
        <cylinderGeometry args={[0.045, 0.055, len, 6]} />
      </mesh>
      {Array.from({ length: leaves }, (_, i) => {
        const k = (i + 0.5) / leaves;
        return (
          <mesh key={i} material={M('#6a9a34')} position={[a[0] + (ex - a[0]) * k, ya + (ey - ya) * k + 0.12, a[1] + (ez - a[1]) * k]} rotation={[0.4, i * 1.7, 0.3]} scale={[1, 0.25, 1]}>
            <sphereGeometry args={[0.24, 8, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}

function VineView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<VineTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh(task));
  const [, setVer] = useState(0);
  const [, setTick] = useState(0);
  const held = useRef<THREE.Group>(null);
  const done = shaded(task, data) || L.covered;
  useFrame(() => {
    setVer((v) => (v === L.ver ? v : L.ver));
    if (L.target) setTick((n) => (n + 1) % 1000);
    const h = held.current;
    if (h) {
      h.visible = L.carry;
      h.position.set(player.pos.x + Math.sin(player.yaw) * 0.45, player.pos.y + 0.2, player.pos.z + Math.cos(player.yaw) * 0.45);
    }
  });
  const [fx, fz] = task.frame;
  const fy = t.floorY(fx, fz);
  const pts = done && L.reached.length < 2 ? [task.root, post(task)] : L.reached;
  const tip = pts[pts.length - 1];
  const leafRoof = useMemo(() => Array.from({ length: 14 }, (_, i) => [((i * 0.37) % 1) * 3 - 1.5, ((i * 0.61) % 1) * 2.4 - 1.2] as const), []);
  const [bx, bz] = task.bundle;
  return (
    <group>
      {/* The shade frame over an empty resting mat. */}
      <group position={[fx, fy, fz]}>
        {[[-1.6, -1.3], [1.6, -1.3], [-1.6, 1.3], [1.6, 1.3]].map(([x, z], i) => (
          <mesh key={i} material={M('#8a6a42')} position={[x, 1.2, z]}>
            <cylinderGeometry args={[0.07, 0.08, 2.4, 6]} />
          </mesh>
        ))}
        {[-1.3, 0, 1.3].map((z) => (
          <mesh key={z} material={M('#8a6a42')} position={[0, 2.4, z]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.04, 0.04, 3.4, 6]} />
          </mesh>
        ))}
        <mesh material={M('#c8a868')} position-y={0.03} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[2.2, 1.4]} />
        </mesh>
        {done &&
          leafRoof.map(([x, z], i) => (
            <group key={i}>
              <mesh material={M('#5f9a34')} position={[x, 2.5, z]} scale={[1, 0.3, 1]} castShadow>
                <sphereGeometry args={[0.55, 10, 8]} />
              </mesh>
              {i % 4 === 0 && (
                <mesh material={M('#c8c060')} position={[x, 2.2, z]} scale={[0.8, 1.2, 0.8]}>
                  <sphereGeometry args={[0.16, 10, 8]} />
                </mesh>
              )}
            </group>
          ))}
      </group>
      {/* The young vine at its root. */}
      <mesh material={M('#6a9a34')} position={[task.root[0], t.floorY(task.root[0], task.root[1]) + 0.3, task.root[1]]}>
        <sphereGeometry args={[0.35, 10, 8]} />
      </mesh>
      {pts.slice(1).map((b, i) => (
        <Stem key={i} a={pts[i]} b={b} f={1} t={t} />
      ))}
      {!done && L.target && <Stem a={tip} b={L.target} f={L.grow} t={t} />}
      {L.stakes.map((s, i) => (
        <mesh key={i} material={M('#9a7a4a')} position={[s[0], t.floorY(s[0], s[1]) + 0.6, s[1]]}>
          <cylinderGeometry args={[0.04, 0.05, 1.2, 6]} />
        </mesh>
      ))}
      <group position={[bx, t.floorY(bx, bz), bz]} {...tap(() => act(`stake:${task.id}`))}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} material={M('#9a7a4a')} position={[Math.cos(i * 1.3) * 0.12, 0.6, Math.sin(i * 1.3) * 0.12]} rotation-z={Math.cos(i) * 0.12}>
            <cylinderGeometry args={[0.035, 0.045, 1.2, 6]} />
          </mesh>
        ))}
        {!done && !L.carry && <Halo on={active} />}
      </group>
      <group ref={held}>
        <mesh material={M('#9a7a4a')} rotation-x={1.2}>
          <cylinderGeometry args={[0.035, 0.045, 1.2, 6]} />
        </mesh>
      </group>
    </group>
  );
}
