// Al-'Alaq (96): a high rocky hill with a small cave on its side. The surah
// does not describe the place; the cave follows the hadith of the first
// revelation. A writing desk with a reed pen, ink and blank paper (96:4), and
// a quiet terrace for prayer (96:19). No person is shown.
import { useMemo } from 'react';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { PrayerTerrace } from './Kawthar';
import { beside, mat } from './kit';

export function AlaqScene({ land, stops }: SceneProps) {
  const hill = stopNamed(stops, 'Hill of Revelation');
  const pen = stopNamed(stops, 'The Pen');
  const near = stopNamed(stops, 'Draw Near');
  return (
    <group>
      {hill && <CaveHill position={beside(land, hill.pos, 14, -12)} />}
      {pen && <WritingDesk position={beside(land, pen.pos, 3.5, -2.5)} />}
      {near && <PrayerTerrace position={beside(land, near.pos, 4.5, -3.5)} />}
    </group>
  );
}

function CaveHill({ position }: { position: [number, number, number] }) {
  const rock = useMemo(() => mat('#7a6a58'), []);
  return (
    <group position={position}>
      <mesh material={rock} position={[0, 4, 0]} scale={[7, 9, 6]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 1]} />
      </mesh>
      <mesh material={rock} position={[-5, 2, 2]} scale={[4, 4, 4]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
      </mesh>
      {/* A small dark cave mouth high on the side facing the path. */}
      <mesh position={[-4.6, 8.2, 3.2]} rotation={[0, -0.9, 0]}>
        <circleGeometry args={[0.9, 16]} />
        <meshBasicMaterial color="#0c0a08" />
      </mesh>
    </group>
  );
}

function WritingDesk({ position }: { position: [number, number, number] }) {
  const wood = useMemo(() => mat('#6a4a2e', 0.7), []);
  return (
    <group position={position} rotation={[0, -0.4, 0]}>
      {/* A low desk, tilted top, as used for writing while seated. */}
      <mesh material={wood} position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.4, 0.6, 0.8]} />
      </mesh>
      <mesh material={wood} position={[0, 0.66, 0]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.06, 0.9]} />
      </mesh>
      <mesh position={[-0.15, 0.7, 0.02]} rotation={[0.25 - Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.55]} />
        <meshStandardMaterial color="#f2e8d0" side={2} />
      </mesh>
      <mesh position={[0.5, 0.74, -0.2]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.14, 12]} />
        <meshStandardMaterial color="#1a1a22" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* A reed pen resting across the paper. */}
      <mesh position={[0.15, 0.76, 0.05]} rotation={[0.25 - Math.PI / 2, 0, 1.0]} castShadow>
        <cylinderGeometry args={[0.012, 0.016, 0.5, 6]} />
        <meshStandardMaterial color="#c8a868" />
      </mesh>
    </group>
  );
}
