// Surah Ya-Sin's own play: the moon's stages (36:39, "And the moon - We have
// determined for it phases, until it returns [appearing] like the old date
// stalk"). It is night on a quiet hilltop. Look up at the moon, choose the
// disc on the rack that shows the same shape, and hang it on the calendar
// board for that night. Then the nights pass and the moon changes, from a
// thin new crescent to full and back to a thin old crescent.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2 } from '../terrain';
import type { MoonTask } from '../types';
import { live, type Mechanic, type MechSave, type MechUse } from './base';

type Live = { carry: number | null; ver: number };
const fresh = (): Live => ({ carry: null, ver: 0 });

const nightsDone = (task: MoonTask, s: MechSave) => (s.done.includes(task.id) ? task.nights.map((_, i) => i) : s.prog[task.id] ?? []);

/** Words for a phase (0 new, 0.5 full, 1 new again). Lit on the right while it grows. */
export function phaseName(p: number) {
  const side = p < 0.5 ? 'right' : 'left';
  if (Math.abs(p - 0.5) < 0.03) return 'full moon';
  const k = (1 - Math.cos(2 * Math.PI * p)) / 2;
  if (k < 0.2) return p < 0.5 ? `thin new crescent, lit on the ${side}` : `thin old crescent, lit on the ${side}`;
  if (k < 0.65) return `half moon, lit on the ${side}`;
  return `almost full, lit on the ${side}`;
}

const tex = new Map<number, THREE.Texture>();
/** The moon's face at a phase, painted on a canvas. */
export function moonTexture(p: number): THREE.Texture {
  const key = Math.round(p * 100);
  const hit = tex.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const r = 56;
  g.translate(64, 64);
  g.fillStyle = '#3a3e52';
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.fill();
  const lit = '#f6eccc';
  const waxing = p < 0.5;
  const cs = Math.cos(2 * Math.PI * p);
  // The lit half, on the right while waxing and on the left while waning.
  g.fillStyle = lit;
  g.beginPath();
  g.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, !waxing);
  g.fill();
  // The terminator: an ellipse that darkens (crescent) or lights (gibbous) the other half.
  g.fillStyle = cs > 0 ? '#3a3e52' : lit;
  g.beginPath();
  g.ellipse(0, 0, Math.abs(cs) * r + 0.5, r + 0.5, 0, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  tex.set(key, t);
  return t;
}

/** The order the discs sit on the rack: shuffled, the same every visit. */
const rackOrder = (task: MoonTask) => task.nights.map((_, i) => i).sort((a, b) => ((a * 7 + 3) % task.nights.length) - ((b * 7 + 3) % task.nights.length));
export const discAt = (task: MoonTask, slot: number): P2 => [task.rack[0] + (slot - (task.nights.length - 1) / 2) * 1.1, task.rack[1]];
export const hookAt = (task: MoonTask, k: number): P2 => [task.board[0] + (k - (task.nights.length - 1) / 2) * 1.1, task.board[1] + 0.9];

export const Moon: Mechanic<MoonTask> = {
  total: (task) => task.nights.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const done = nightsDone(task, env.save);
    const k = done.length;
    const out: MechUse[] = [];
    if (k >= task.nights.length) return out;
    const order = rackOrder(task);
    order.forEach((d, slot) => {
      if (done.some((n) => n === d) || L.carry === d) return;
      out.push({ key: `disc:${task.id}:${d}`, pos: env.v3(discAt(task, slot)), label: `${L.carry == null ? 'Take' : 'Swap for'} the disc: ${phaseName(task.nights[d])}`, reach: 0.75, run: () => {
        L.carry = d;
        L.ver++;
      } });
    });
    if (L.carry != null)
      out.push({ key: `hang:${task.id}`, pos: env.v3(hookAt(task, k)), label: `Hang the disc for night ${k + 1}`, reach: 2.4, run: () => {
        const d = L.carry!;
        L.carry = null;
        L.ver++;
        if (Math.abs(task.nights[d] - task.nights[k]) < 0.001) {
          env.api.progress(task.id, k);
          if (k + 1 < task.nights.length) env.api.hint(`Night ${k + 1}: ${phaseName(task.nights[k])}. The nights pass... look up: the moon has changed.`);
          return;
        }
        env.api.note(`${task.id}/x`, k);
        env.api.hint('That disc does not match the moon tonight, so it goes back on the rack. Look up again: is it thin or round, and which side is lit?');
      } });
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const k = nightsDone(task, env.save).length;
    if (k >= task.nights.length) return;
    const c = L.carry != null ? ` · carrying the disc: ${phaseName(task.nights[L.carry])}` : '';
    return `Night ${k + 1} of ${task.nights.length}: look up at the moon and hang the disc that matches${c}`;
  },
  View: MoonView,
};

function Disc({ p, r = 0.38 }: { p: number; r?: number }) {
  const t = useMemo(() => moonTexture(p), [p]);
  return (
    <mesh>
      <circleGeometry args={[r, 32]} />
      <meshBasicMaterial map={t} toneMapped={false} transparent />
    </mesh>
  );
}

function MoonView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<MoonTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  const done = nightsDone(task, data);
  const k = Math.min(done.length, task.nights.length - 1);
  const sky = useRef<THREE.Group>(null);
  const held = useRef<THREE.Group>(null);
  useFrame((st) => {
    setVer((v) => (v === L.ver ? v : L.ver));
    // The moon hangs high in the south-east sky, always facing the explorer.
    if (sky.current) {
      sky.current.position.set(player.pos.x + 60, player.pos.y + 70, player.pos.z - 90);
      sky.current.lookAt(st.camera.position);
    }
    const h = held.current;
    if (h) {
      h.visible = L.carry != null;
      h.position.set(player.pos.x + Math.sin(player.yaw) * 0.5, player.pos.y + 0.9, player.pos.z + Math.cos(player.yaw) * 0.5);
      h.rotation.y = player.yaw + Math.PI;
    }
  });
  const order = rackOrder(task);
  const [bx, bz] = task.board;
  const by = t.floorY(bx, bz);
  const [rx, rz] = task.rack;
  const ry = t.floorY(rx, rz);
  const w = task.nights.length * 1.1 + 0.6;
  return (
    <group>
      <group ref={sky}>
        <Disc p={task.nights[k]} r={9} />
      </group>
      {/* The calendar board with a hook for each night. */}
      <group position={[bx, by, bz]}>
        <mesh material={M('#7a5a3a', { map: 'planks' })} position-y={1.7}>
          <boxGeometry args={[w, 1.4, 0.12]} />
        </mesh>
        {[-w / 2 + 0.2, w / 2 - 0.2].map((x) => (
          <mesh key={x} material={M('#5a3e26')} position={[x, 0.9, 0]}>
            <cylinderGeometry args={[0.07, 0.08, 1.8, 6]} />
          </mesh>
        ))}
      </group>
      {task.nights.map((p, n) => {
        const [hx, hz] = hookAt(task, n);
        const shown = done.includes(n);
        return (
          <group key={n} position={[hx, by + 1.75, bz + 0.08]} {...tap(() => act(`hang:${task.id}`))}>
            {shown ? <Disc p={p} /> : <mesh><circleGeometry args={[0.36, 24]} /><meshBasicMaterial color="#4a3a2a" transparent opacity={0.5} /></mesh>}
            {n === done.length && L.carry != null && <Halo on={active} />}
          </group>
        );
      })}
      {/* The rack of discs. */}
      <mesh material={M('#8a6a42', { map: 'planks' })} position={[rx, ry + 0.5, rz - 0.15]}>
        <boxGeometry args={[w, 1, 0.12]} />
      </mesh>
      {order.map((d, slot) => {
        if (done.includes(d) || L.carry === d) return null;
        const [x, z] = discAt(task, slot);
        return (
          <group key={d} position={[x, ry + 0.75, z - 0.05]} {...tap(() => act(`disc:${task.id}:${d}`))}>
            <Disc p={task.nights[d]} />
            {L.carry == null && <Halo on={active} />}
          </group>
        );
      })}
      <group ref={held}>{L.carry != null && <Disc p={task.nights[L.carry]} r={0.3} />}</group>
    </group>
  );
}
