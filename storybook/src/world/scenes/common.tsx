// Scenery pieces shared by several surah scenes.
import { useMemo } from 'react';
import * as THREE from 'three';
import { mat, rng } from './kit';

/** A sandstone cliff with empty doorways carved into it (Thamud: 89:9, 91:11). */
export function CarvedCliff({ position, rotation = 0, seed = 1 }: { position: [number, number, number]; rotation?: number; seed?: number }) {
  const rock = useMemo(() => mat('#c08a5a'), []);
  const dark = useMemo(() => new THREE.MeshBasicMaterial({ color: '#2a1a12' }), []);
  const doors = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: 5 }, (_, i) => ({ x: -6 + i * 3 + (r() - 0.5), y: 0 + (i % 2) * 2.5, h: 2 + r() * 0.8 }));
  }, [seed]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh material={rock} position={[0, 4, -1.5]} castShadow receiveShadow>
        <boxGeometry args={[18, 8, 3]} />
      </mesh>
      {[-6, -1, 4].map((x, i) => (
        <mesh key={x} material={rock} position={[x, 8, -1.8]} scale={[3.5, 2 + i * 0.6, 2]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      {doors.map((d, i) => (
        <group key={i} position={[d.x, d.y, 0.15]}>
          {/* A carved frame and a dark doorway with a triangular top. */}
          <mesh material={rock} position={[0, d.h / 2 + 0.3, -0.05]}>
            <boxGeometry args={[1.6, d.h + 0.8, 0.3]} />
          </mesh>
          <mesh material={dark} position={[0, d.h / 2, 0.11]}>
            <planeGeometry args={[0.9, d.h]} />
          </mesh>
          <mesh material={rock} position={[0, d.h + 0.55, 0.05]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.6, 0.6, 0.25]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A band of glow low on the horizon, far ahead (dawn or twilight). It slowly brightens and fades. */
export function HorizonGlow({ position, color = '#ffb070' }: { position: [number, number, number]; color?: string }) {
  return (
    <mesh position={[position[0], position[1] + 6, position[2] - 90]}>
      <planeGeometry args={[220, 18]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} fog={false} />
    </mesh>
  );
}

/** A large disc low in the sky, far ahead (the full moon, or the sun as a lamp). */
export function SkyDisc({ position, color, radius = 7, glow }: { position: [number, number, number]; color: string; radius?: number; glow?: string }) {
  return (
    <group position={[position[0], position[1] + 22, position[2] - 110]}>
      <mesh>
        <circleGeometry args={[radius, 40]} />
        <meshBasicMaterial color={color} fog={false} />
      </mesh>
      {glow && (
        <mesh position={[0, 0, -0.1]}>
          <circleGeometry args={[radius * 1.8, 40]} />
          <meshBasicMaterial color={glow} transparent opacity={0.25} depthWrite={false} fog={false} />
        </mesh>
      )}
    </group>
  );
}
