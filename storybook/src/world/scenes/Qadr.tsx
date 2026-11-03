// Al-Qadr (97): a long low wall holding a thousand tiny lamps, one for each
// month (97:3), and a hilltop with seats facing east where the sky slowly
// brightens toward dawn (97:5). The angels and the Spirit (97:4) are not
// pictured; no person is shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, type V } from './kit';

export function QadrScene({ land, stops }: SceneProps) {
  const wall = stopNamed(stops, 'Thousand Months Wall');
  const dawn = stopNamed(stops, 'Peace Until Dawn');
  return (
    <group>
      {wall && <LampWall land={land} at={wall.pos} />}
      {dawn && <DawnHill position={beside(land, dawn.pos, 4, -3)} />}
    </group>
  );
}

/** 1000 lamps in 8 rows of 125 along a wall 20 m long. */
function LampWall({ land, at }: { land: Land; at: V }) {
  const LEN = 20;
  const stone = useMemo(() => mat('#3a3a48'), []);
  const lamps = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffd890' }), 1000);
    const o = new THREE.Object3D();
    const cols = 125;
    for (let i = 0; i < 1000; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols); // 8 rows
      const x = at.x + 3.2;
      const z = at.z + 2 - (c / (cols - 1)) * LEN;
      o.position.set(x - 0.2, land.height(x, z) + 0.35 + r * 0.17, z);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    return m;
  }, [land, at]);
  const segs = 10;
  return (
    <group>
      {Array.from({ length: segs }, (_, i) => {
        const z = at.z + 2 - (i + 0.5) * (LEN / segs);
        const x = at.x + 3.2;
        const y = land.height(x, z);
        return (
          <mesh key={i} material={stone} position={[x, y + 0.85, z]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 1.7, LEN / segs + 0.02]} />
          </mesh>
        );
      })}
      <primitive object={lamps} />
      <pointLight position={[at.x + 2.5, land.height(at.x + 3, at.z - 8) + 1.2, at.z - 8]} color="#ffcf80" intensity={6} distance={16} />
    </group>
  );
}

/** Low seats facing east, and a band of glow on the horizon that slowly grows. */
function DawnHill({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#8a8494'), []);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.opacity = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 0.15));
  });
  return (
    <group position={position}>
      {[-1, 0, 1].map((k) => (
        <mesh key={k} material={stone} position={[k * 1.3, 0.25, 0]} castShadow>
          <boxGeometry args={[0.9, 0.5, 0.5]} />
        </mesh>
      ))}
      <mesh position={[0, 6, -90]}>
        <planeGeometry args={[220, 18]} />
        <meshBasicMaterial ref={glow} color="#ffb070" transparent opacity={0.3} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}
