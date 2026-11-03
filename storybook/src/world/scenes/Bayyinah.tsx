// Al-Bayyinah (98): a reading stand under a small canopy holding a closed,
// covered book, for the purified scriptures (98:2-3); a clear spring in a
// stone basin for sincerity (98:5); and a prayer terrace with a box for giving
// (98:5). No person is shown; the Fire and the gardens (98:6-8) are not pictured.
import { useMemo } from 'react';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { PrayerTerrace } from './Kawthar';
import { beside, mat } from './kit';

export function BayyinahScene({ land, stops }: SceneProps) {
  const pages = stopNamed(stops, 'Purified Pages');
  const spring = stopNamed(stops, 'Spring of Sincerity');
  const terrace = stopNamed(stops, 'Prayer and Zakah');
  return (
    <group>
      {pages && <ReadingStand position={beside(land, pages.pos, 3.5, -2.5)} />}
      {spring && <Spring position={beside(land, spring.pos, 4, -3)} />}
      {terrace && (
        <group>
          <PrayerTerrace position={beside(land, terrace.pos, 4.5, -3.5)} />
          <GivingBox position={beside(land, terrace.pos, 2.2, -1.2)} />
        </group>
      )}
    </group>
  );
}

export function ReadingStand({ position }: { position: [number, number, number] }) {
  const wood = useMemo(() => mat('#6a4a2e', 0.7), []);
  const cloth = useMemo(() => mat('#2f5a4a', 1), []);
  return (
    <group position={position} rotation={[0, -0.5, 0]}>
      {[
        [-1.1, -1.1],
        [1.1, -1.1],
        [-1.1, 1.1],
        [1.1, 1.1],
      ].map(([x, z], i) => (
        <mesh key={i} material={wood} position={[x, 1.3, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 2.6, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 2.65, 0]} castShadow>
        <coneGeometry args={[1.9, 0.8, 4]} />
        <meshStandardMaterial color="#e8dcc0" roughness={0.9} />
      </mesh>
      {/* A folding stand (rehal) holding a closed book wrapped in green cloth. */}
      <mesh material={wood} position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.5, 0.9, 0.4]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={wood} position={[0, 1.0, s * 0.14]} rotation={[s * 0.55, 0, 0]}>
          <boxGeometry args={[0.7, 0.04, 0.42]} />
        </mesh>
      ))}
      <mesh material={cloth} position={[0, 1.12, 0]} castShadow>
        <boxGeometry args={[0.56, 0.12, 0.42]} />
      </mesh>
    </group>
  );
}

export function Spring({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#c4b8a2'), []);
  return (
    <group position={position}>
      <mesh material={stone} position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.4, 0.5, 32, 1, true]} />
      </mesh>
      <mesh material={stone} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.15, 8, 40]} />
      </mesh>
      {/* Clear water over pale pebbles. */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.15, 32]} />
        <meshStandardMaterial color="#d8d0b8" />
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.15, 32]} />
        <meshStandardMaterial color="#a8e0f0" transparent opacity={0.35} roughness={0.05} metalness={0.1} depthWrite={false} />
      </mesh>
    </group>
  );
}

function GivingBox({ position }: { position: [number, number, number] }) {
  const wood = useMemo(() => mat('#5a3e26', 0.75), []);
  return (
    <group position={position}>
      <mesh material={wood} position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.12, 1, 0.12]} />
      </mesh>
      <mesh material={wood} position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.4]} />
      </mesh>
      <mesh position={[0, 1.36, 0]}>
        <boxGeometry args={[0.25, 0.02, 0.04]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}
