// Ash-Shams (91): a sundial whose shadow moves (91:1) and a still pool for
// the moon when it follows the sun (91:2); an old well with an empty trough
// (91:13) and cliffs with carved doorways for Thamud (91:11). No person and no
// she-camel are shown; the destruction (91:14) is not pictured.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { CarvedCliff } from './common';
import { beside, mat } from './kit';
import { Well } from './Yusuf';

export function ShamsScene({ land, stops }: SceneProps) {
  const dial = stopNamed(stops, 'The Sundial');
  const pool = stopNamed(stops, 'Moon Pool');
  const well = stopNamed(stops, 'The Well');
  const cliffs = stopNamed(stops, 'Carved Cliffs');
  return (
    <group>
      {dial && <Sundial position={beside(land, dial.pos, 3.5, -2.5)} />}
      {pool && <MoonPool position={beside(land, pool.pos, 4, -3)} />}
      {well && (
        <group>
          <Well position={beside(land, well.pos, 4, -2.5)} />
          <Trough position={beside(land, well.pos, 6.3, -1.2)} />
        </group>
      )}
      {cliffs && <CarvedCliff position={beside(land, cliffs.pos, 8, -14)} rotation={-0.3} seed={91} />}
    </group>
  );
}

function Sundial({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#e8dcc4', 0.7), []);
  const shadow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (shadow.current) shadow.current.rotation.y = -0.8 + ((clock.elapsedTime * 0.05) % 1.6);
  });
  return (
    <group position={position}>
      <mesh material={stone} position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.4, 1.5, 0.8, 32]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.15, 0.81, Math.sin(a) * 1.15]} rotation={[-Math.PI / 2, 0, -a]}>
            <planeGeometry args={[0.25, 0.04]} />
            <meshBasicMaterial color="#6a5a40" />
          </mesh>
        );
      })}
      <mesh material={stone} position={[0, 1.2, 0.2]} rotation={[0.6, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 0.9, 0.6]} />
      </mesh>
      {/* The gnomon's shadow, turning slowly round the face. */}
      <group ref={shadow} position={[0, 0.81, 0]}>
        <mesh position={[0, 0, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.07, 1.1]} />
          <meshBasicMaterial color="#3a3226" transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  );
}

export function MoonPool({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#bfb4a0'), []);
  return (
    <group position={position}>
      <mesh material={stone} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[2.4, 0.25, 8, 40]} />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.3, 40]} />
        <meshStandardMaterial color="#20384a" roughness={0.02} metalness={0.6} />
      </mesh>
      {/* A pale disc in the water: the moon as the pool shows it. */}
      <mesh position={[0.7, 0.16, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 24]} />
        <meshBasicMaterial color="#e8eaf0" transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

function Trough({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#a89a84'), []);
  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      {[
        [0, 0.1, 0, 2.2, 0.2, 0.8],
        [0, 0.35, -0.35, 2.2, 0.5, 0.1],
        [0, 0.35, 0.35, 2.2, 0.5, 0.1],
        [-1.05, 0.35, 0, 0.1, 0.5, 0.8],
        [1.05, 0.35, 0, 0.1, 0.5, 0.8],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} material={stone} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}
    </group>
  );
}
