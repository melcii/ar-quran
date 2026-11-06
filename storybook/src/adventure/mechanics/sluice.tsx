// Surah Saba's own play: the two gardens (34:15, "two [fields of] gardens on
// the right and on the left ... Eat from the provisions of your Lord and be
// grateful to Him"). A stone dam holds back the rain water between two hills;
// below it lie a garden on the left and a garden on the right. Through a
// season of changing rain, open and close each garden's sluice so both stay
// green, keep the dam from running dry, and patch cracks before they drain
// it. If a garden wilts, that month starts again. The flood of the dam
// (34:16) is only read, never played or shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2 } from '../terrain';
import type { SluiceTask } from '../types';
import { live, type Mechanic, type MechSave, type MechUse } from './base';

type Live = { started: boolean; t: number; lvl: number; g: [number, number]; open: [boolean, boolean]; cracks: number[]; seen: number[]; snap: { lvl: number; g: [number, number] }; spill: number; ver: number };
const fresh = (): Live => ({ started: false, t: 0, lvl: 0.5, g: [0.6, 0.6], open: [false, false], cracks: [], seen: [], snap: { lvl: 0.5, g: [0.6, 0.6] }, spill: 0, ver: 0 });

const months = (task: SluiceTask, s: MechSave) => (s.done.includes(task.id) ? task.months : (s.prog[task.id] ?? []).length);
const SIDE = ['left', 'right'] as const;
/** Rates per second. */
const R = { rain: 0.035, swing: 0.028, draw: 0.03, water: 0.065, dry: 0.025, leak: 0.03 };

export const sluiceAt = (task: SluiceTask, i: number): P2 => [task.dam[0] + (i ? 3.2 : -3.2), task.dam[1] + 1.6];
export const crackAt = (task: SluiceTask, k: number): P2 => [task.dam[0] + [-1.6, 1.4, 0][k % 3], task.dam[1] + 1.4];
const startAt = (task: SluiceTask): P2 => [task.dam[0], task.dam[1] + 3.2];

export const Sluice: Mechanic<SluiceTask> = {
  total: (task) => task.months,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const out: MechUse[] = [];
    if (months(task, env.save) >= task.months) return out;
    if (!L.started)
      out.push({ key: `begin:${task.id}`, pos: env.v3(startAt(task)), label: 'Begin the season at the dam', reach: 2.6, run: () => {
        L.started = true;
        L.ver++;
      } });
    [0, 1].forEach((i) =>
      out.push({ key: `gate:${task.id}:${i}`, pos: env.v3(sluiceAt(task, i)), label: `${L.open[i] ? 'Close' : 'Open'} the sluice to the ${SIDE[i]} garden`, reach: 2.2, run: () => {
        L.open[i] = !L.open[i];
        L.ver++;
      } }),
    );
    L.cracks.forEach((k) =>
      out.push({ key: `patch:${task.id}:${k}`, pos: env.v3(crackAt(task, k)), label: 'Patch the crack with stones and clay', reach: 2, run: () => {
        L.cracks = L.cracks.filter((x) => x !== k);
        L.ver++;
      } }),
    );
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const m = months(task, env.save);
    if (m >= task.months) return;
    if (!L.started) return `Month ${m + 1} of ${task.months}: begin the season at the dam`;
    const dt = env.dt;
    L.t += dt;
    const season = m * task.monthLen + L.t;
    // Rain comes and goes; each open sluice draws water to its garden.
    L.lvl += (R.rain + R.swing * Math.sin(season * 0.35)) * dt;
    L.lvl -= L.cracks.length * R.leak * dt;
    [0, 1].forEach((i) => {
      const flowing = L.open[i] && L.lvl > 0.04;
      if (flowing) L.lvl -= R.draw * dt;
      L.g[i] = Math.min(1, L.g[i] + ((flowing ? R.water : 0) - R.dry) * dt);
    });
    L.spill = L.lvl > 1 ? 1 : Math.max(0, L.spill - dt);
    L.lvl = Math.max(0, Math.min(1, L.lvl));
    task.cracks.forEach((at, k) => {
      if (season >= at && !L.seen.includes(k)) {
        L.seen.push(k);
        L.cracks.push(k);
        L.ver++;
        env.api.hint('A crack has opened in the dam and water is seeping out. Patch it with stones and clay.');
      }
    });
    const dead = [0, 1].find((i) => L.g[i] <= 0);
    if (dead != null) {
      env.api.note(`${task.id}/x`, m);
      env.api.hint(`The ${SIDE[dead]} garden dried out and wilted. This month starts again: open each sluice before its garden gets too dry.`);
      L.t = 0;
      L.lvl = L.snap.lvl;
      L.g = [...L.snap.g];
      L.open = [false, false];
      L.cracks = [];
      L.seen = L.seen.filter((k) => task.cracks[k] < m * task.monthLen);
      L.started = false;
      L.ver++;
      return;
    }
    if (L.t >= task.monthLen) {
      L.t = 0;
      L.snap = { lvl: L.lvl, g: [...L.g] };
      L.ver++;
      env.api.progress(task.id, m);
      if (m + 1 < task.months) env.api.hint(`Month ${m + 1} is over and both gardens are green.`);
      return;
    }
    const pc = (v: number) => `${Math.round(v * 100)}%`;
    const warn = L.lvl <= 0.05 ? ' · the dam is nearly empty' : L.spill > 0 ? ' · the dam is full and spilling over the side' : L.cracks.length ? ' · a crack is leaking' : '';
    return `Month ${m + 1} of ${task.months} · ${Math.ceil(task.monthLen - L.t)} s left · dam ${pc(L.lvl)} · left garden ${pc(L.g[0])} · right garden ${pc(L.g[1])}${warn}`;
  },
  View: SluiceView,
};

function Garden({ at, i, L, t }: { at: P2; i: number; L: Live; t: { floorY: (x: number, z: number) => number } }) {
  const ground = useRef<THREE.Mesh>(null);
  const crowns = useRef<THREE.Group>(null);
  const dry = useMemo(() => new THREE.Color('#b8a070'), []);
  const wet = useMemo(() => new THREE.Color('#5f9a3a'), []);
  const leafDry = useMemo(() => new THREE.Color('#a89a5a'), []);
  const leafWet = useMemo(() => new THREE.Color('#3f7a2a'), []);
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3f7a2a', roughness: 1 }), []);
  useFrame(() => {
    const g = Math.max(0, Math.min(1, L.g[i]));
    (ground.current?.material as THREE.MeshStandardMaterial | undefined)?.color.copy(dry).lerp(wet, g);
    leaf.color.copy(leafDry).lerp(leafWet, g);
    if (crowns.current) crowns.current.children.forEach((c) => c.scale.setScalar(0.65 + 0.35 * g));
  });
  const trees: P2[] = [[-3, -2], [0, -3], [3, -2], [-3, 2], [0, 1], [3, 2], [-1.5, 4], [1.5, 4]];
  const y = t.floorY(at[0], at[1]);
  return (
    <group>
      <mesh ref={ground} position={[at[0], y + 0.06, at[1]]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[5.5, 32]} />
        <meshStandardMaterial color="#5f9a3a" roughness={1} />
      </mesh>
      <group ref={crowns}>
        {trees.map(([dx, dz], k) => {
          const x = at[0] + dx;
          const z = at[1] + dz;
          return (
            <group key={k} position={[x, t.floorY(x, z), z]}>
              <mesh material={M('#6a4a2e')} position-y={0.7}>
                <cylinderGeometry args={[0.1, 0.14, 1.4, 6]} />
              </mesh>
              <mesh material={leaf} position-y={1.7} castShadow>
                <sphereGeometry args={[0.8, 12, 10]} />
              </mesh>
              {[0, 1, 2].map((f) => (
                <mesh key={f} material={M(k % 2 ? '#e8a040' : '#c84a3a')} position={[Math.cos(f * 2.1 + k) * 0.7, 1.5 + (f % 2) * 0.3, Math.sin(f * 2.1 + k) * 0.7]}>
                  <sphereGeometry args={[0.1, 8, 6]} />
                </mesh>
              ))}
            </group>
          );
        })}
      </group>
    </group>
  );
}

function SluiceView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<SluiceTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  const water = useRef<THREE.Mesh>(null);
  const spill = useRef<THREE.Mesh>(null);
  const flows = useRef<(THREE.Mesh | null)[]>([]);
  const boards = useRef<(THREE.Mesh | null)[]>([]);
  const done = months(task, data) >= task.months;
  const [dx, dz] = task.dam;
  const y = t.floorY(dx, dz);
  useFrame((st) => {
    setVer((v) => (v === L.ver ? v : L.ver));
    const lv = done ? 0.6 : L.lvl;
    if (water.current) water.current.position.y = y + 0.3 + lv * 2.6;
    if (spill.current) spill.current.visible = !done && L.spill > 0;
    [0, 1].forEach((i) => {
      const on = !done && L.open[i] && L.lvl > 0.04;
      const f = flows.current[i];
      if (f) {
        f.visible = on;
        const m = f.material as THREE.MeshStandardMaterial;
        if (m.map) m.map.offset.y = motion.reduced ? 0 : -st.clock.elapsedTime * 0.6;
      }
      const b = boards.current[i];
      if (b) b.position.y = L.open[i] ? 1.6 : 0.6;
    });
  });
  const flowTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 32;
    const g = c.getContext('2d')!;
    for (let k = 0; k < 32; k++) {
      g.fillStyle = k % 8 < 4 ? '#6aa8c8' : '#8ac0dc';
      g.fillRect(0, k, 8, 1);
    }
    const tx = new THREE.CanvasTexture(c);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(1, 4);
    return tx;
  }, []);
  const [bx, bz] = startAt(task);
  return (
    <group>
      {/* The dam wall and the water held behind it. */}
      <mesh material={M('#b8a480', { map: 'stone' })} position={[dx, y + 1.6, dz]} castShadow receiveShadow>
        <boxGeometry args={[12, 3.2, 1.6]} />
      </mesh>
      <mesh ref={water} position={[dx, y + 1.6, dz - 6]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[11.6, 10]} />
        <meshStandardMaterial color="#5a98b8" roughness={0.2} metalness={0.1} transparent opacity={0.85} />
      </mesh>
      {/* The spillway at the east end: water pours over it when the dam is full. */}
      <mesh ref={spill} position={[dx + 5.4, y + 1.6, dz + 0.85]}>
        <planeGeometry args={[1, 3.2]} />
        <meshStandardMaterial color="#8ac0dc" transparent opacity={0.8} map={flowTex} />
      </mesh>
      {/* Two sluices and their channels to the gardens. */}
      {[0, 1].map((i) => {
        const [sx, sz] = sluiceAt(task, i);
        const [gx, gz] = task.gardens[i];
        const cx = (sx + gx) / 2;
        const cz = (sz + gz) / 2;
        const len = Math.hypot(gx - sx, gz - sz);
        const rot = Math.atan2(gx - sx, gz - sz);
        return (
          <group key={i}>
            <group position={[sx, t.floorY(sx, sz), sz]} {...tap(() => act(`gate:${task.id}:${i}`))}>
              <mesh material={M('#6a4a2e')} position={[-0.7, 1, -0.7]}>
                <boxGeometry args={[0.15, 2, 0.15]} />
              </mesh>
              <mesh material={M('#6a4a2e')} position={[0.7, 1, -0.7]}>
                <boxGeometry args={[0.15, 2, 0.15]} />
              </mesh>
              <mesh ref={(m) => void (boards.current[i] = m)} material={M('#8a6a42', { map: 'planks' })} position={[0, 0.6, -0.7]}>
                <boxGeometry args={[1.3, 1, 0.1]} />
              </mesh>
              <mesh material={M('#7a5a3a')} position={[0, 2.1, -0.7]} rotation-x={Math.PI / 2}>
                <torusGeometry args={[0.3, 0.05, 6, 16]} />
              </mesh>
              {!done && <Halo on={active} />}
            </group>
            <mesh material={M('#9a8a6a', { map: 'stone' })} position={[cx, t.floorY(cx, cz) + 0.04, cz]} rotation={[-Math.PI / 2, 0, rot]}>
              <planeGeometry args={[1.2, len]} />
            </mesh>
            <mesh ref={(m) => void (flows.current[i] = m)} position={[cx, t.floorY(cx, cz) + 0.08, cz]} rotation={[-Math.PI / 2, 0, rot]}>
              <planeGeometry args={[0.8, len]} />
              <meshStandardMaterial color="#ffffff" map={flowTex} transparent opacity={0.85} />
            </mesh>
            <Garden at={task.gardens[i]} i={i} L={L} t={t} />
          </group>
        );
      })}
      {L.cracks.map((k) => {
        const [cx, cz] = crackAt(task, k);
        return (
          <group key={k} position={[cx, y, dz + 0.82]} {...tap(() => act(`patch:${task.id}:${k}`))}>
            <mesh position-y={1.4} rotation-z={0.5}>
              <boxGeometry args={[0.08, 1.2, 0.02]} />
              <meshBasicMaterial color="#3a2a1e" />
            </mesh>
            <mesh position={[0, 0.7, 0.3]} rotation-x={0.6}>
              <cylinderGeometry args={[0.04, 0.08, 1.2, 6]} />
              <meshStandardMaterial color="#8ac0dc" transparent opacity={0.8} />
            </mesh>
            <Halo on={active} />
          </group>
        );
      })}
      <group position={[bx, t.floorY(bx, bz), bz]} {...tap(() => act(`begin:${task.id}`))}>
        <mesh material={M('#c8b490', { map: 'stone' })} position-y={0.5}>
          <boxGeometry args={[0.6, 1, 0.6]} />
        </mesh>
        {!done && !L.started && <Halo on={active} />}
      </group>
    </group>
  );
}
