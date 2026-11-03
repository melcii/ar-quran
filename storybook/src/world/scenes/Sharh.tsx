// Ash-Sharh (94): the path climbs a steep, stony stretch, then opens onto an
// easy, level meadow path (94:5-6). A heavy pack lies set down beside the way,
// a picture of a burden removed (94:2). Three stones block part of the path;
// tap them to roll them aside. No person is shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, tapOnly, type V } from './kit';

export function SharhScene({ land, stops, complete, hint }: SceneProps) {
  const burden = stopNamed(stops, 'The Burden Set Down');
  const ease = stopNamed(stops, 'Hardship and Ease');
  return (
    <group>
      {burden && <Pack position={beside(land, burden.pos, 3, -2)} />}
      {ease && (
        <group>
          <Boulders land={land} at={ease.pos} />
          <BlockingStones
            land={land}
            at={ease.pos}
            onClear={() => (complete('Clear the path'), hint('The way is clear. "For indeed, with hardship will be ease" (94:5).'))}
            hint={hint}
          />
        </group>
      )}
    </group>
  );
}

function Pack({ position }: { position: [number, number, number] }) {
  const canvas = useMemo(() => mat('#7a5a3a'), []);
  const stone = useMemo(() => mat('#9a9080'), []);
  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      <mesh material={stone} position={[0, 0.3, 0]} scale={[1, 0.6, 0.8]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.8, 0]} />
      </mesh>
      <mesh material={canvas} position={[0.9, 0.5, 0.2]} rotation={[0, 0, 0.3]} castShadow>
        <boxGeometry args={[0.8, 1, 0.5]} />
      </mesh>
      <mesh material={canvas} position={[0.9, 1.05, 0.2]} castShadow>
        <cylinderGeometry args={[0.28, 0.4, 0.2, 10]} />
      </mesh>
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[0.9 + x, 0.55, 0.47]} rotation={[0, 0, 0.3]}>
          <torusGeometry args={[0.28, 0.03, 4, 12, Math.PI]} />
          <meshStandardMaterial color="#4a3422" />
        </mesh>
      ))}
    </group>
  );
}

/** Rough boulders crowding the near part of the path; beyond, the way is open. */
function Boulders({ land, at }: { land: Land; at: V }) {
  const rock = useMemo(() => mat('#8a8070'), []);
  const rocks = useMemo(() => {
    const r = rng(94);
    return Array.from({ length: 16 }, () => ({ dx: (r() > 0.5 ? 1 : -1) * (1.6 + r() * 2.5), dz: 3 - r() * 6, s: 0.5 + r() * 0.9, ry: r() * 6 }));
  }, []);
  return (
    <group>
      {rocks.map((k, i) => (
        <mesh key={i} material={rock} position={beside(land, at, k.dx, k.dz)} rotation={[0, k.ry, 0]} scale={k.s} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </group>
  );
}

function BlockingStones({ land, at, onClear, hint }: { land: Land; at: V; onClear: () => void; hint: (t: string) => void }) {
  const [moved, setMoved] = useState<number[]>([]);
  const rock = useMemo(() => mat('#a09484'), []);
  const spots: [number, number, number][] = [
    [-0.6, -2, 2.6],
    [0.7, -3.4, 2.8],
    [-0.2, -4.8, -2.7],
  ];
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame(() => {
    spots.forEach(([x, z, aside], i) => {
      const m = refs.current[i];
      if (!m) return;
      const targetX = moved.includes(i) ? aside : x;
      const cur: number = m.userData.x ?? x;
      const nx = cur + (targetX - cur) * 0.06;
      m.userData.x = nx;
      const p = beside(land, at, nx, z);
      m.position.set(p[0], p[1] + 0.45, p[2]);
      m.rotation.z -= (targetX - nx) * 0.05;
    });
  });
  const roll = (i: number) =>
    tapOnly(() => {
      if (moved.includes(i)) return;
      const next = [...moved, i];
      setMoved(next);
      if (next.length === 3) onClear();
      else hint(`${3 - next.length} more stone${3 - next.length > 1 ? 's' : ''} to roll aside.`);
    });
  return (
    <group>
      {spots.map(([x, z], i) => (
        <mesh key={i} ref={(m) => m && (refs.current[i] = m)} material={rock} position={beside(land, at, x, z)} onClick={roll(i)} castShadow>
          <icosahedronGeometry args={[0.5, 0]} />
        </mesh>
      ))}
    </group>
  );
}
