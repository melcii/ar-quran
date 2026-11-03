// An-Nasr (110): an open gateway (110:1), many roads from every direction
// meeting at it, lit by lanterns that come on one after another, standing for
// the multitudes of 110:2 (no people are shown), and a quiet terrace of praise
// (110:3).
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactElement } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, type V } from './kit';

export function NasrScene({ land, stops }: SceneProps) {
  const gate = stopNamed(stops, 'The Open Gate');
  const roads = stopNamed(stops, 'Converging Roads');
  const terrace = stopNamed(stops, 'Terrace of Praise');
  return (
    <group>
      {gate && <Gateway position={beside(land, gate.pos, 4, -2.5)} />}
      {roads && <Roads land={land} at={roads.pos} />}
      {terrace && <Terrace position={beside(land, terrace.pos, 4, -3)} />}
    </group>
  );
}

function Gateway({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#e6d6b8'), []);
  return (
    <group position={position} rotation={[0, -0.3, 0]}>
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} material={stone} position={[x, 1.8, 0]} castShadow>
          <boxGeometry args={[0.6, 3.6, 0.6]} />
        </mesh>
      ))}
      <mesh material={stone} position={[0, 3.6, 0]} castShadow>
        <torusGeometry args={[1.6, 0.3, 8, 24, Math.PI]} />
      </mesh>
      {/* Both doors folded wide open. */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.9, 1.5, 0.75]} rotation={[0, s * 1.4, 0]} castShadow>
          <boxGeometry args={[1.5, 2.9, 0.1]} />
          <meshStandardMaterial color="#6a4a2e" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Eight roads that meet at a round plaza; their lanterns light in waves toward the centre. */
function Roads({ land, at }: { land: Land; at: V }) {
  const N = 8;
  const L = 5;
  const center = useMemo(() => new THREE.Vector3(at.x + 6, 0, at.z - 6), [at]);
  const paving = useMemo(() => mat('#cdb68e'), []);
  const lamps = useRef<THREE.MeshStandardMaterial[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    lamps.current.forEach((m, k) => {
      const step = k % L; // 0 = far end, L-1 = next to the plaza
      const on = (t * 1.2) % (L + 3) >= step; // far lamps first, then nearer, then all rest
      m.emissiveIntensity = on ? 2.2 : 0.1;
    });
  });
  const items: ReactElement[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    const mx = center.x + dx * 9;
    const mz = center.z + dz * 9;
    items.push(
      <mesh key={`r${i}`} material={paving} position={[mx, land.height(mx, mz) + 0.03, mz]} rotation={[-Math.PI / 2, 0, -a]} receiveShadow>
        <planeGeometry args={[14, 1.3]} />
      </mesh>,
    );
    for (let k = 0; k < L; k++) {
      const d = 15 - k * 2.6;
      const x = center.x + dx * d - dz * 1;
      const z = center.z + dz * d + dx * 1;
      const y = land.height(x, z);
      items.push(
        <group key={`l${i}-${k}`} position={[x, y, z]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 1, 5]} />
            <meshStandardMaterial color="#2a2420" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshStandardMaterial ref={(m) => m && (lamps.current[i * L + k] = m)} color="#ffe2a8" emissive="#ffb850" emissiveIntensity={0.1} />
          </mesh>
        </group>,
      );
    }
  }
  return (
    <group>
      <mesh material={paving} position={[center.x, land.height(center.x, center.z) + 0.05, center.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3, 32]} />
      </mesh>
      {items}
    </group>
  );
}

function Terrace({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#e2d2b2'), []);
  return (
    <group position={position}>
      <mesh material={stone} position={[0, 0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[5, 0.4, 4]} />
      </mesh>
      {[
        [0, -1.9, 5, 0.2],
        [-2.4, 0, 0.2, 4],
        [2.4, 0, 0.2, 4],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} material={stone} position={[x, 0.7, z]} castShadow>
          <boxGeometry args={[w, 0.6, d]} />
        </mesh>
      ))}
    </group>
  );
}
