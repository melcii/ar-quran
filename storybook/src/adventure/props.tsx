// Things you use in an adventure world: reading lanterns, stone tablets,
// lecterns, signposts, garden plants that bloom when watered, leaf piles that
// clear, beacons, piles of things to carry and what they leave behind, boats
// you guide in, a soft wayfinding light, and doorways to other parts of the app.
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { motion, player } from '@/ark/shared';
import { Boat, Item, M, type ItemKind } from './kit';
import type { Marker } from './types';
import type { Terrain } from './terrain';

const tap = (fn?: () => void) => ({
  onClick: (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8 || !fn) return;
    e.stopPropagation();
    fn();
  },
});

const WOOD = '#6a4428';
const BRASS = '#b08a40';

/** A reading place: lantern post with a book stand, a stone tablet, a lectern, or a signpost. */
export function ReadingMarker({ kind = 'lantern', x, z, t, done, active, onTap, rot = 0 }: { kind?: Marker; x: number; z: number; t: Terrain; done: boolean; active: boolean; onTap?: () => void; rot?: number }) {
  const y = t.floorY(x, z);
  if (kind === 'none') return null;
  const glow = M('#ffe0a0', { emissive: '#ffb850', ei: active ? 4 : done ? 1.2 : 0.4 });
  return (
    <group position={[x, y, z]} rotation-y={rot} {...tap(onTap)}>
      {kind === 'lantern' && (
        <>
          <mesh material={M('#b8ad98', { map: 'stone' })} position-y={0.12} castShadow>
            <cylinderGeometry args={[0.45, 0.55, 0.24, 10]} />
          </mesh>
          <mesh material={M(WOOD)} position-y={1.1} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 2.0, 8]} />
          </mesh>
          <mesh material={M(WOOD)} position={[0.3, 2.05, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
          </mesh>
          <group position={[0.58, 1.7, 0]}>
            <mesh material={M(BRASS, { metal: 0.5, rough: 0.4 })} position-y={0.24}>
              <coneGeometry args={[0.2, 0.16, 10]} />
            </mesh>
            <mesh material={glow}>
              <cylinderGeometry args={[0.13, 0.15, 0.3, 10]} />
            </mesh>
          </group>
          <Lectern x={-0.35} z={0.25} />
        </>
      )}
      {kind === 'tablet' && (
        <>
          <mesh material={M('#cdbf9f', { map: 'stone' })} position-y={0.9} rotation-x={-0.12} castShadow receiveShadow>
            <boxGeometry args={[1.3, 1.8, 0.28]} />
          </mesh>
          {/* Carved lines suggest writing; no words are carved. */}
          {[0.35, 0.15, -0.05, -0.25].map((dy) => (
            <mesh key={dy} material={M('#a8987a')} position={[0, 0.95 + dy, 0.13]} rotation-x={-0.12}>
              <boxGeometry args={[0.9, 0.05, 0.04]} />
            </mesh>
          ))}
          <mesh material={glow} position={[0, 1.95, 0.05]}>
            <sphereGeometry args={[0.12, 12, 10]} />
          </mesh>
        </>
      )}
      {kind === 'scroll' && (
        <>
          <Lectern x={0} z={0} big />
          <mesh material={glow} position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.1, 12, 10]} />
          </mesh>
        </>
      )}
      {kind === 'sign' && (
        <>
          <mesh material={M(WOOD)} position-y={0.9} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 1.8, 8]} />
          </mesh>
          <mesh material={M('#c9a26a', { map: 'planks' })} position={[0, 1.55, 0.08]} castShadow>
            <boxGeometry args={[1.4, 0.6, 0.08]} />
          </mesh>
          <mesh material={glow} position={[0, 1.95, 0.08]}>
            <sphereGeometry args={[0.09, 10, 8]} />
          </mesh>
        </>
      )}
      <Halo on={active} />
    </group>
  );
}

function Lectern({ x, z, big }: { x: number; z: number; big?: boolean }) {
  const k = big ? 1.3 : 1;
  return (
    <group position={[x, 0, z]} rotation-y={0.5} scale={k}>
      <mesh material={M(WOOD)} position-y={0.47}>
        <cylinderGeometry args={[0.04, 0.06, 0.9, 6]} />
      </mesh>
      <mesh material={M(WOOD)} position-y={0.95} rotation-x={-0.5}>
        <boxGeometry args={[0.5, 0.04, 0.36]} />
      </mesh>
      <mesh material={M('#f4ead2')} position={[0, 0.985, 0.01]} rotation-x={-0.5}>
        <boxGeometry args={[0.44, 0.03, 0.3]} />
      </mesh>
    </group>
  );
}

/** A soft ring on the ground around the thing to use next. */
function Halo({ on }: { on: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    if (!ref.current) return;
    ref.current.visible = on;
    const s = 1 + (motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 2.5) * 0.06);
    ref.current.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position-y={0.06} renderOrder={2}>
      <ringGeometry args={[1.0, 1.25, 40]} />
      <meshBasicMaterial color="#fff2c0" transparent opacity={0.55} depthWrite={false} />
    </mesh>
  );
}

/** One spot in a points task. */
export function PointSpot({ style, x, z, t, done, active, onTap }: { style: 'lantern' | 'plant' | 'sweep' | 'sign' | 'beacon'; x: number; z: number; t: Terrain; done: boolean; active: boolean; onTap?: () => void }) {
  const y = t.floorY(x, z);
  const grow = useRef<THREE.Group>(null);
  const k = useRef(done ? 1 : 0);
  useFrame((_, dt) => {
    k.current += ((done ? 1 : 0) - k.current) * Math.min(1, dt * 1.5);
    const g = grow.current;
    if (g) {
      const s = 0.45 + k.current * 0.55;
      g.scale.set(s, s, s);
    }
  });
  if (style === 'lantern' || style === 'beacon') {
    const tall = style === 'beacon' ? 3.2 : 1.6;
    return (
      <group position={[x, y, z]} {...tap(onTap)}>
        <mesh material={M('#b8ad98', { map: 'stone' })} position-y={0.15} castShadow>
          <cylinderGeometry args={[0.35, 0.45, 0.3, 10]} />
        </mesh>
        <mesh material={M(WOOD)} position-y={tall / 2} castShadow>
          <cylinderGeometry args={[0.06, 0.08, tall, 8]} />
        </mesh>
        <group position-y={tall + 0.2}>
          <mesh material={M(BRASS, { metal: 0.5, rough: 0.4 })} position-y={0.24}>
            <coneGeometry args={[0.22, 0.18, 10]} />
          </mesh>
          <mesh material={done ? M('#ffe6b0', { emissive: '#ffb040', ei: 5 }) : M('#6e6250', { rough: 0.5 })}>
            <cylinderGeometry args={[0.15, 0.17, 0.32, 10]} />
          </mesh>
          <mesh material={M(BRASS, { metal: 0.5, rough: 0.4 })} position-y={-0.18}>
            <cylinderGeometry args={[0.19, 0.19, 0.04, 10]} />
          </mesh>
        </group>
        <Halo on={active} />
      </group>
    );
  }
  if (style === 'plant')
    return (
      <group position={[x, y, z]} {...tap(onTap)}>
        <mesh material={M('#7a5a3a', { rough: 1 })} position-y={0.05} scale={[1, 0.25, 1]}>
          <sphereGeometry args={[0.8, 14, 8]} />
        </mesh>
        <group ref={grow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} material={M(done ? '#5f9a3e' : '#a49a5a')} position={[Math.cos(i * 1.3) * 0.3, 0.45 + (i % 2) * 0.15, Math.sin(i * 1.3) * 0.3]} castShadow>
              <sphereGeometry args={[0.32, 10, 8]} />
            </mesh>
          ))}
          {done &&
            [0, 1, 2, 3, 4, 5].map((i) => (
              <mesh key={`f${i}`} material={M(['#f2a0b8', '#fff2d0', '#f6c64a'][i % 3])} position={[Math.cos(i * 1.05) * 0.42, 0.7 + (i % 2) * 0.12, Math.sin(i * 1.05) * 0.42]}>
                <sphereGeometry args={[0.08, 8, 6]} />
              </mesh>
            ))}
        </group>
        <Halo on={active} />
      </group>
    );
  if (style === 'sweep')
    return (
      <group position={[x, y, z]} {...tap(onTap)}>
        {!done &&
          [0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh key={i} material={M(['#b8642a', '#d89a3a', '#8a5a2a'][i % 3])} position={[Math.cos(i * 2.1) * 0.35, 0.06 + (i % 3) * 0.05, Math.sin(i * 2.1) * 0.35]} rotation={[-Math.PI / 2, 0, i]} scale={[1, 0.6, 1]}>
              <circleGeometry args={[0.22, 6]} />
            </mesh>
          ))}
        {!done && (
          <mesh material={M('#a86a32')} position-y={0.12} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[0.45, 10, 6]} />
          </mesh>
        )}
        {done && (
          <mesh material={M('#e8d6a8', { rough: 1 })} position-y={0.02} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.7, 20]} />
          </mesh>
        )}
        <Halo on={active} />
      </group>
    );
  // A small signpost with a glowing cap that brightens once read.
  return (
    <group position={[x, y, z]} {...tap(onTap)}>
      <mesh material={M('#cdbf9f', { map: 'stone' })} position-y={0.55} castShadow>
        <boxGeometry args={[0.7, 1.1, 0.3]} />
      </mesh>
      <mesh material={done ? M('#ffe6b0', { emissive: '#ffb040', ei: 4 }) : M('#8a8070')} position-y={1.25}>
        <sphereGeometry args={[0.16, 12, 10]} />
      </mesh>
      <Halo on={active} />
    </group>
  );
}

/** A pile of things to carry (shown while any are left). */
export function Pile({ x, z, t, item, color, n, active, onTap }: { x: number; z: number; t: Terrain; item: ItemKind; color?: string; n: number; active: boolean; onTap?: () => void }) {
  if (n <= 0) return null;
  const y = t.floorY(x, z);
  return (
    <group position={[x, y, z]} {...tap(onTap)}>
      {Array.from({ length: Math.min(n, 5) }, (_, i) => (
        <group key={i} position={[Math.cos(i * 2.4) * 0.55 * (i ? 1 : 0), 0, Math.sin(i * 2.4) * 0.55 * (i ? 1 : 0)]} rotation-y={i * 1.3}>
          <Item kind={item} color={color} />
        </group>
      ))}
      <Halo on={active} />
    </group>
  );
}

/** Where a load goes: a faint ring until it is there, then what it leaves. */
export function Slot({ x, z, t, item, color, result, filled, active, onTap, lift = 0 }: { x: number; z: number; t: Terrain; item: ItemKind; color?: string; result: 'item' | 'sprout' | 'stone' | 'patch'; filled: boolean; active: boolean; onTap?: () => void; lift?: number }) {
  const y = t.floorY(x, z) + lift;
  const grow = useRef<THREE.Group>(null);
  const k = useRef(filled ? 1 : 0);
  useFrame((_, dt) => {
    k.current += ((filled ? 1 : 0) - k.current) * Math.min(1, dt * 0.8);
    if (grow.current) {
      const s = Math.max(0.01, k.current);
      grow.current.scale.set(s, s, s);
    }
  });
  return (
    <group position={[x, y, z]} {...tap(onTap)}>
      {!filled && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.05} renderOrder={2}>
          <ringGeometry args={[0.5, 0.62, 28]} />
          <meshBasicMaterial color={active ? '#fff2c0' : '#f4e6c0'} transparent opacity={active ? 0.75 : 0.3} depthWrite={false} />
        </mesh>
      )}
      {filled && result === 'item' && <Item kind={item} color={color} />}
      {result === 'sprout' && (
        <group ref={grow}>
          <mesh material={M('#7a5a3a', { rough: 1 })} position-y={0.03} scale={[1, 0.3, 1]}>
            <sphereGeometry args={[0.45, 12, 6]} />
          </mesh>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <group key={i} position={[Math.cos(i * 0.9) * 0.18, 0, Math.sin(i * 0.9) * 0.18]} rotation={[Math.cos(i) * 0.25, 0, Math.sin(i) * 0.25]}>
              <mesh material={M('#7aa04a')} position-y={0.45}>
                <cylinderGeometry args={[0.015, 0.02, 0.9, 4]} />
              </mesh>
              <mesh material={M('#e0c060')} position-y={0.95} scale={[0.6, 1.6, 0.6]}>
                <sphereGeometry args={[0.07, 8, 6]} />
              </mesh>
            </group>
          ))}
        </group>
      )}
      {filled && result === 'stone' && (
        <mesh material={M(color ?? '#d8c8a4', { map: 'stone' })} position-y={0.35} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.7, 0.8]} />
        </mesh>
      )}
      {filled && result === 'patch' && (
        <mesh material={M(color ?? '#c9a26a', { map: 'planks' })} position-y={0.06} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.12, 1.0]} />
        </mesh>
      )}
      {active && <Halo on />}
    </group>
  );
}

/** What the explorer is carrying, held in front at chest height. */
export function Carried({ item, color }: { item: ItemKind | null; color?: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    g.visible = !!item;
    g.position.set(player.pos.x + Math.sin(player.yaw) * 0.45, player.pos.y + 0.55 + Math.abs(Math.sin(player.phase)) * 0.04, player.pos.z + Math.cos(player.yaw) * 0.45);
    g.rotation.y = player.yaw;
  });
  return <group ref={ref} scale={0.7}>{item && <Item kind={item} color={color} />}</group>;
}

/** A boat that can be guided along its channel. Position comes from the director. */
export function GuidedBoat({ state, color, sail, active, onTap }: { state: { pos: THREE.Vector3; yaw: number }; color?: string; sail?: string; active: boolean; onTap?: () => void }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime;
    g.position.copy(state.pos);
    g.position.y += motion.reduced ? 0 : Math.sin(t * 1.3 + state.pos.x) * 0.06;
    g.rotation.y = state.yaw;
    g.rotation.z = motion.reduced ? 0 : Math.sin(t * 0.9 + state.pos.z) * 0.03;
  });
  return (
    <group ref={ref} {...tap(onTap)}>
      <Boat color={color} sail={sail} />
      <Halo on={active} />
    </group>
  );
}

/** A tall soft light over the next place to go, so a child always knows where to head. */
export function Wayfinder({ at }: { at: React.MutableRefObject<THREE.Vector3 | null> }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, 'rgba(255,240,190,0)');
    grad.addColorStop(0.7, 'rgba(255,236,180,0.5)');
    grad.addColorStop(1, 'rgba(255,236,180,0.9)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 16, 128);
    const tex = new THREE.CanvasTexture(c);
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.55, fog: false });
  }, []);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const p = at.current;
    const d = p ? Math.hypot(p.x - player.pos.x, p.z - player.pos.z) : 0;
    g.visible = !!p && d > 6;
    if (p) g.position.copy(p);
    mat.opacity = Math.min(0.55, (d - 6) / 20) * (motion.reduced ? 1 : 0.85 + Math.sin(st.clock.elapsedTime * 2) * 0.15);
  });
  return (
    <group ref={ref}>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} material={mat} position-y={7} rotation-y={r}>
          <planeGeometry args={[0.9, 14]} />
        </mesh>
      ))}
    </group>
  );
}

/** A doorway to another part of the app: a small arch with a glowing curtain. */
export function Doorway({ x, z, t, rot = 0, onTap }: { x: number; z: number; t: Terrain; rot?: number; onTap?: () => void }) {
  const y = t.floorY(x, z);
  return (
    <group position={[x, y, z]} rotation-y={rot} {...tap(onTap)}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} material={M('#e6d2a8', { map: 'stone' })} position={[sd * 1.1, 1.2, 0]} castShadow>
          <boxGeometry args={[0.4, 2.4, 0.4]} />
        </mesh>
      ))}
      <mesh material={M('#e6d2a8', { map: 'stone' })} position-y={2.4} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[1.3, 1.3, 0.4, 20, 1, false, 0, Math.PI]} />
      </mesh>
      <mesh position-y={1.4}>
        <planeGeometry args={[1.8, 2.8]} />
        <meshBasicMaterial color="#ffe6a8" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Halo on />
    </group>
  );
}
