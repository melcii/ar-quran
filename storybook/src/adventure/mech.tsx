// The things in the world for the newer kinds of play, each made for one
// surah's own game: stone plates to stand on, rings round the places to walk
// to, the field-journal rings round animals you watch quietly, the sky-dial,
// the explorer's own boat, the promise board and its candles, the balance in
// the market, rain channels with gates and cisterns, the house lamps that
// show a family has what it needs, and the prayer niche you come back to.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { motion, player } from '@/ark/shared';
import { Boat, Item, M } from './kit';
import { Halo, tap } from './props';
import type { P2, Terrain } from './terrain';

const STONE = '#d8c8a6';
const WOOD = '#6a4428';
const BRASS = '#b08a40';

/** A round stone plate that fills with light while you stand on it. `k` is read every frame (0..1). */
export function StandPlate({ x, z, t, r = 1.3, k, done, active, style = 'plate' }: { x: number; z: number; t: Terrain; r?: number; k: () => number; done: boolean; active: boolean; style?: 'plate' | 'rug' | 'none' }) {
  const fill = useRef<THREE.Mesh>(null);
  const y = t.floorY(x, z);
  useFrame(() => {
    const m = fill.current;
    if (!m) return;
    const v = done ? 1 : k();
    m.scale.setScalar(Math.max(0.001, v));
    (m.material as THREE.MeshBasicMaterial).opacity = 0.25 + v * 0.5;
  });
  return (
    <group position={[x, y, z]}>
      {style === 'plate' && (
        <mesh material={M(STONE, { map: 'stone' })} position-y={0.04} receiveShadow>
          <cylinderGeometry args={[r, r + 0.1, 0.08, 32]} />
        </mesh>
      )}
      {style === 'rug' && (
        <mesh material={M('#9a3a2e', { rough: 1 })} position-y={0.03} receiveShadow>
          <boxGeometry args={[1.2, 0.04, 2]} />
        </mesh>
      )}
      <mesh ref={fill} rotation-x={-Math.PI / 2} position-y={0.1} renderOrder={3}>
        <circleGeometry args={[r * 0.95, 32]} />
        <meshBasicMaterial color="#ffe9b0" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <Halo on={active} />
    </group>
  );
}

/** A soft ring on the ground (or on the water) round a place to reach. */
export function GoRing({ x, z, y, r = 2, active, color = '#fff2c0' }: { x: number; z: number; y: number; r?: number; active: boolean; color?: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    if (!ref.current) return;
    ref.current.visible = active;
    const s = 1 + (motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 2) * 0.05);
    ref.current.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} position={[x, y + 0.08, z]} rotation-x={-Math.PI / 2} renderOrder={3}>
      <ringGeometry args={[r - 0.25, r, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} />
    </mesh>
  );
}

/** A dashed ring round animals being watched; it fills as you keep still nearby. */
export function WatchRing({ x, z, t, r, k, done, active }: { x: number; z: number; t: Terrain; r: number; k: () => number; done: boolean; active: boolean }) {
  const arc = useRef<THREE.Mesh>(null);
  const y = t.floorY(x, z);
  const last = useRef(-1);
  useFrame(() => {
    const m = arc.current;
    if (!m) return;
    m.visible = active || done;
    const v = done ? 1 : k();
    if (Math.abs(v - last.current) > 0.01) {
      last.current = v;
      m.geometry.dispose();
      m.geometry = new THREE.RingGeometry(r - 0.2, r, 64, 1, Math.PI / 2, Math.max(0.01, v) * Math.PI * 2);
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.07} renderOrder={2} visible={active}>
        <ringGeometry args={[r - 0.12, r, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh ref={arc} rotation-x={-Math.PI / 2} position-y={0.09} renderOrder={3}>
        <ringGeometry args={[r - 0.2, r, 64, 1, 0, 0.01]} />
        <meshBasicMaterial color={done ? '#bfe6a0' : '#ffe6a0'} transparent opacity={0.75} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** A stone sky-dial on a hilltop: a disc with a pointer that turns to each phase. */
export function SkyDial({ x, z, t, phase, n, active, onTap }: { x: number; z: number; t: Terrain; phase: number; n: number; active: boolean; onTap?: () => void }) {
  const ptr = useRef<THREE.Group>(null);
  const y = t.floorY(x, z);
  useFrame((_, dt) => {
    const g = ptr.current;
    if (!g) return;
    const want = -(phase / Math.max(1, n)) * Math.PI * 2;
    g.rotation.y += (want - g.rotation.y) * Math.min(1, dt * 2);
  });
  return (
    <group position={[x, y, z]} {...tap(onTap)}>
      <mesh material={M(STONE, { map: 'stone' })} position-y={0.45} castShadow>
        <cylinderGeometry args={[0.55, 0.7, 0.9, 12]} />
      </mesh>
      <mesh material={M('#e8dcc0', { map: 'stone' })} position-y={0.95}>
        <cylinderGeometry args={[0.9, 0.9, 0.1, 32]} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} material={i < phase ? M('#ffe0a0', { emissive: '#ffb850', ei: 3 }) : M('#8a8070')} position={[Math.sin((-i / n) * Math.PI * 2) * 0.7, 1.03, Math.cos((-i / n) * Math.PI * 2) * 0.7]}>
          <sphereGeometry args={[0.08, 10, 8]} />
        </mesh>
      ))}
      <group ref={ptr} position-y={1.05}>
        <mesh material={M(BRASS, { metal: 0.6, rough: 0.35 })} position={[0, 0.25, 0.3]} rotation-x={0.6}>
          <boxGeometry args={[0.06, 0.6, 0.06]} />
        </mesh>
      </group>
      <Halo on={active} />
    </group>
  );
}

/** The explorer's own boat, drawn under the explorer while sailing. */
export function PlayerBoat({ boat, water }: { boat: { on: boolean; yaw: number; speed: number }; water: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    g.visible = boat.on;
    if (!boat.on) return;
    const tm = st.clock.elapsedTime;
    g.position.set(player.pos.x - Math.sin(boat.yaw) * 0.5, water + (motion.reduced ? 0 : Math.sin(tm * 1.4) * 0.05), player.pos.z - Math.cos(boat.yaw) * 0.5);
    g.rotation.set(motion.reduced ? 0 : Math.sin(tm * 0.8) * 0.02, boat.yaw, motion.reduced ? 0 : Math.sin(tm * 1.1) * 0.03 - boat.speed * 0.004);
  });
  return (
    <group ref={ref} visible={false}>
      <Boat color="#3f7f8a" sail="#f6eedc" />
    </group>
  );
}

/** A wooden board with promise cards pinned on it. */
export function PromiseBoard({ x, z, t, rot = 0, n, kept, active, onTap }: { x: number; z: number; t: Terrain; rot?: number; n: number; kept: number; active: boolean; onTap?: () => void }) {
  const y = t.floorY(x, z);
  return (
    <group position={[x, y, z]} rotation-y={rot} {...tap(onTap)}>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M(WOOD)} position={[s * 1.1, 1, 0]} castShadow>
          <boxGeometry args={[0.14, 2, 0.14]} />
        </mesh>
      ))}
      <mesh material={M('#b88a5a', { map: 'planks' })} position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[2.3, 1.2, 0.08]} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} material={M(i < kept ? '#d8ecc0' : '#fbf2dc')} position={[-0.75 + (i % 3) * 0.75, 1.7 - Math.floor(i / 3) * 0.5, 0.06]}>
          <planeGeometry args={[0.55, 0.38]} />
        </mesh>
      ))}
      <Halo on={active} />
    </group>
  );
}

/** A small candle that burns down while a promise is waiting to be kept. */
export function PromiseSpot({ x, z, t, left, live, kept, active, onTap }: { x: number; z: number; t: Terrain; left: () => number; live: boolean; kept: boolean; active: boolean; onTap?: () => void }) {
  const wax = useRef<THREE.Mesh>(null);
  const flame = useRef<THREE.Mesh>(null);
  const y = t.floorY(x, z);
  useFrame((st) => {
    const k = kept ? 1 : live ? Math.max(0, left()) : 1;
    if (wax.current) {
      wax.current.scale.y = 0.15 + k * 0.85;
      wax.current.position.y = 0.9 + (0.15 + k * 0.85) * 0.25;
    }
    if (flame.current) {
      flame.current.visible = live && !kept && k > 0;
      flame.current.position.y = 0.9 + (0.15 + k * 0.85) * 0.5 + 0.1;
      const s = 1 + (motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 13) * 0.12);
      flame.current.scale.set(1, s, 1);
    }
  });
  return (
    <group position={[x, y, z]} {...tap(onTap)}>
      <mesh material={M(STONE, { map: 'stone' })} position-y={0.45} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.9, 10]} />
      </mesh>
      <mesh ref={wax} material={M('#f6ecd4')}>
        <cylinderGeometry args={[0.09, 0.09, 0.5, 10]} />
      </mesh>
      <mesh ref={flame} material={M('#ffd890', { emissive: '#ffa040', ei: 6 })}>
        <coneGeometry args={[0.05, 0.16, 8]} />
      </mesh>
      {kept && (
        <mesh material={M('#c8e8a8', { emissive: '#a0d070', ei: 1.5 })} position-y={0.95}>
          <torusGeometry args={[0.22, 0.03, 8, 20]} />
        </mesh>
      )}
      <Halo on={active} />
    </group>
  );
}

/** A market balance on a stand, with a box of weights. */
export function Balance({ x, z, t, rot = 0, active, onTap }: { x: number; z: number; t: Terrain; rot?: number; active: boolean; onTap?: () => void }) {
  const beam = useRef<THREE.Group>(null);
  const y = t.floorY(x, z);
  useFrame((st) => {
    if (beam.current) beam.current.rotation.z = motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 0.7) * 0.05;
  });
  return (
    <group position={[x, y, z]} rotation-y={rot} {...tap(onTap)}>
      <mesh material={M('#a07a50', { map: 'planks' })} position-y={0.45} castShadow>
        <boxGeometry args={[2.2, 0.9, 1]} />
      </mesh>
      <mesh material={M(BRASS, { metal: 0.6, rough: 0.35 })} position-y={1.4}>
        <cylinderGeometry args={[0.04, 0.05, 1.1, 8]} />
      </mesh>
      <group ref={beam} position-y={1.95}>
        <mesh material={M(BRASS, { metal: 0.6, rough: 0.35 })} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position-x={s * 0.72}>
            <mesh material={M(BRASS, { metal: 0.6, rough: 0.35 })} position-y={-0.3}>
              <cylinderGeometry args={[0.008, 0.008, 0.6, 4]} />
            </mesh>
            <mesh material={M(BRASS, { metal: 0.6, rough: 0.35 })} position-y={-0.62}>
              <cylinderGeometry args={[0.28, 0.2, 0.06, 16]} />
            </mesh>
          </group>
        ))}
      </group>
      <group position={[0.75, 0.95, 0.2]}>
        {[0.12, 0.09, 0.07, 0.05].map((r, i) => (
          <mesh key={i} material={M('#5a5048', { metal: 0.4, rough: 0.5 })} position={[(i - 1.5) * 0.18, r, 0]}>
            <cylinderGeometry args={[r, r, r * 2, 10]} />
          </mesh>
        ))}
      </group>
      <group position={[-0.7, 0.95, 0.15]}>
        <Item kind="grain" />
      </group>
      <Halo on={active} />
    </group>
  );
}

/** A house lamp and a curl of chimney smoke, shown once a household has what it needs. */
export function HomeLamp({ x, z, t, on }: { x: number; z: number; t: Terrain; on: boolean }) {
  const smoke = useRef<THREE.Group>(null);
  const y = t.floorY(x, z);
  useFrame((st) => {
    const g = smoke.current;
    if (!g) return;
    g.visible = on;
    g.children.forEach((c, i) => {
      const k = ((motion.reduced ? 0.3 : st.clock.elapsedTime * 0.25) + i / 4) % 1;
      c.position.set(Math.sin(k * 5 + i) * 0.3, 3.8 + k * 3, -1.6);
      c.scale.setScalar(0.3 + k * 0.9);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - k);
    });
  });
  return (
    <group position={[x, y, z]}>
      <mesh material={M('#5a3a22')} position-y={0.6}>
        <cylinderGeometry args={[0.04, 0.05, 1.2, 6]} />
      </mesh>
      <mesh material={on ? M('#ffe6b0', { emissive: '#ffa840', ei: 5 }) : M('#6e6250', { rough: 0.5 })} position-y={1.3}>
        <cylinderGeometry args={[0.13, 0.15, 0.28, 10]} />
      </mesh>
      {on && <pointLight color="#ffc070" intensity={6} distance={7} position-y={1.4} />}
      <group ref={smoke}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.5, 10, 8]} />
            <meshBasicMaterial color="#efe8de" transparent opacity={0.3} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** A small sign of what a household lacks: an empty jar, a cold hearth, a bare cot. Disappears once shared with. */
export function NeedSign({ x, z, t, kind, on }: { x: number; z: number; t: Terrain; kind: string; on: boolean }) {
  if (!on) return null;
  const y = t.floorY(x, z);
  return (
    <group position={[x, y, z]}>
      {kind === 'jar' && (
        <mesh material={M('#b8784a')} position-y={0.3} castShadow>
          <sphereGeometry args={[0.3, 12, 10]} />
        </mesh>
      )}
      {kind === 'hearth' &&
        [0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} material={M('#6a6460', { map: 'stone' })} position={[Math.cos(i * 1.25) * 0.45, 0.1, Math.sin(i * 1.25) * 0.45]}>
            <sphereGeometry args={[0.16, 8, 6]} />
          </mesh>
        ))}
      {kind === 'cot' && (
        <mesh material={M('#8a6a4a', { map: 'planks' })} position-y={0.25}>
          <boxGeometry args={[0.8, 0.12, 1.4]} />
        </mesh>
      )}
      {kind === 'basket' && (
        <mesh material={M('#c49a5a')} position-y={0.18}>
          <cylinderGeometry args={[0.32, 0.26, 0.36, 12, 1, true]} />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------- rain channels ------------------------------- */

export type FlowState = { running: boolean; water: number; spill: number; filled: Record<string, number>; gates: Record<string, 'a' | 'b'> };

/** Dry channels, the gates on them, the cisterns and their water, and the moving water along the open way. */
export function FlowView({
  t,
  task,
  state,
  route,
  active,
  onGate,
  onSource,
}: {
  t: Terrain;
  task: { source: P2; gates: { id: string; at: P2; a: string; b: string }[]; cisterns: { id: string; at: P2; cap: number }[]; sand: { id: string; at: P2 }[]; channels: { from: P2; to: P2 }[] };
  state: FlowState;
  route: () => P2[];
  active: boolean;
  onGate: (id: string) => void;
  onSource: () => void;
}) {
  const water = useRef<THREE.Group>(null);
  const levels = useRef<(THREE.Mesh | null)[]>([]);
  const gates = useRef<(THREE.Group | null)[]>([]);
  const waterMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6ab4c4', emissive: '#2a6a7a', emissiveIntensity: 0.4, roughness: 0.2, transparent: true, opacity: 0.85 }), []);
  const ditch = useMemo(
    () =>
      task.channels.map((c) => {
        const dx = c.to[0] - c.from[0];
        const dz = c.to[1] - c.from[1];
        const len = Math.hypot(dx, dz);
        const mx = (c.from[0] + c.to[0]) / 2;
        const mz = (c.from[1] + c.to[1]) / 2;
        return { mx, mz, len, rot: Math.atan2(dx, dz), y: Math.max(t.floorY(c.from[0], c.from[1]), t.floorY(c.to[0], c.to[1])) };
      }),
    [task, t],
  );
  useFrame((st) => {
    task.cisterns.forEach((c, i) => {
      const m = levels.current[i];
      if (!m) return;
      const k = Math.min(1, (state.filled[c.id] ?? 0) / c.cap);
      m.visible = k > 0.01;
      m.scale.y = Math.max(0.01, k);
      m.position.y = 0.1 + k * 0.5;
    });
    task.gates.forEach((g, i) => {
      const o = gates.current[i];
      if (o) o.rotation.y += ((state.gates[g.id] === 'b' ? 0.9 : -0.9) - o.rotation.y) * 0.15;
    });
    const w = water.current;
    if (!w) return;
    w.visible = state.running;
    if (!state.running) return;
    const pts = route();
    w.children.forEach((c, i) => {
      const m = c as THREE.Mesh;
      if (i >= pts.length - 1) {
        m.visible = false;
        return;
      }
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      m.visible = true;
      m.position.set((ax + bx) / 2, Math.max(t.floorY(ax, az), t.floorY(bx, bz)) + 0.12, (az + bz) / 2);
      m.rotation.set(0, Math.atan2(bx - ax, bz - az), 0);
      m.scale.set(1, 1, len);
    });
    waterMat.emissiveIntensity = 0.35 + (motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 4) * 0.1);
  });
  return (
    <group>
      {ditch.map((d, i) => (
        <mesh key={i} material={M('#9a7a58', { rough: 1 })} position={[d.mx, d.y + 0.03, d.mz]} rotation-y={d.rot} receiveShadow>
          <boxGeometry args={[0.9, 0.06, d.len]} />
        </mesh>
      ))}
      <group ref={water}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} material={waterMat}>
            <boxGeometry args={[0.6, 0.08, 1]} />
          </mesh>
        ))}
      </group>
      <group position={[task.source[0], t.floorY(task.source[0], task.source[1]), task.source[1]]} {...tap(onSource)}>
        <mesh material={M(STONE, { map: 'stone' })} position-y={0.35} castShadow>
          <cylinderGeometry args={[2, 2.2, 0.7, 24, 1, true]} />
        </mesh>
        <mesh material={waterMat} position-y={0.5} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[1.95, 24]} />
        </mesh>
        <mesh material={M(WOOD, { map: 'planks' })} position={[0, 0.9, 2.1]}>
          <boxGeometry args={[1.2, 1.2, 0.12]} />
        </mesh>
        <Halo on={active && !state.running} />
      </group>
      {task.gates.map((g, i) => (
        <group key={g.id} position={[g.at[0], t.floorY(g.at[0], g.at[1]), g.at[1]]} {...tap(() => onGate(g.id))}>
          <mesh material={M(STONE, { map: 'stone' })} position-y={0.3}>
            <cylinderGeometry args={[0.5, 0.6, 0.6, 10]} />
          </mesh>
          <group ref={(o) => void (gates.current[i] = o)} position-y={0.75}>
            <mesh material={M(WOOD, { map: 'planks' })} position-z={0.6}>
              <boxGeometry args={[0.12, 0.7, 1.2]} />
            </mesh>
            <mesh material={M(BRASS, { metal: 0.5 })} position={[0, 0.55, 0]}>
              <sphereGeometry args={[0.12, 10, 8]} />
            </mesh>
          </group>
          <Halo on={active} />
        </group>
      ))}
      {task.cisterns.map((c, i) => (
        <group key={c.id} position={[c.at[0], t.floorY(c.at[0], c.at[1]), c.at[1]]}>
          <mesh material={M('#cdb894', { map: 'stone', side: THREE.DoubleSide })} position-y={0.55} castShadow>
            <cylinderGeometry args={[1.6, 1.7, 1.1, 24, 1, true]} />
          </mesh>
          <mesh material={M('#8a7a62')} position-y={0.04}>
            <cylinderGeometry args={[1.6, 1.6, 0.08, 24]} />
          </mesh>
          <mesh ref={(o) => void (levels.current[i] = o)} material={waterMat} position-y={0.1}>
            <cylinderGeometry args={[1.5, 1.5, 1, 24]} />
          </mesh>
        </group>
      ))}
      {task.sand.map((s) => (
        <mesh key={s.id} material={M('#d8c08a', { rough: 1 })} position={[s.at[0], t.floorY(s.at[0], s.at[1]) + 0.02, s.at[1]]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[1.8, 20]} />
        </mesh>
      ))}
    </group>
  );
}
