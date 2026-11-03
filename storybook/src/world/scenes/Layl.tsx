// Al-Layl (92): a courtyard in two halves, deep blue with lanterns for the
// night when it covers (92:1) and warm gold with sunflowers for the day when it
// appears (92:2), and a giving table (92:5, 92:18). No person is shown; the
// Fire (92:14) is not pictured.
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type V } from './kit';
import { BreadTable } from './Maun';

export function LaylScene({ land, stops, hint }: SceneProps) {
  const night = stopNamed(stops, 'Night Half');
  const day = stopNamed(stops, 'Day Half');
  const give = stopNamed(stops, 'The Giving Table');
  return (
    <group>
      {night && <Half land={land} at={night.pos} kind="night" />}
      {day && <Half land={land} at={day.pos} kind="day" />}
      {give && <BreadTable position={beside(land, give.pos, 4, -2.5)} hint={hint} />}
    </group>
  );
}

function Half({ land, at, kind }: { land: Land; at: V; kind: 'night' | 'day' }) {
  const tiles = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.95, 0.06, 0.95), new THREE.MeshStandardMaterial({ roughness: 0.6 }), 36);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < 36; i++) {
      const x = at.x + 3 + (i % 6);
      const z = at.z - 1 - Math.floor(i / 6);
      o.position.set(x, land.height(x, z) + 0.04, z);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(kind === 'night' ? ((i + Math.floor(i / 6)) % 2 ? '#1f2f5a' : '#2c3f72') : (i + Math.floor(i / 6)) % 2 ? '#e8c060' : '#f2d890'));
    }
    m.receiveShadow = true;
    return m;
  }, [land, at, kind]);
  const stem = useMemo(() => mat('#4f7a32'), []);
  const petals = useMemo(() => mat('#ffc020', 0.6), []);
  const items = useMemo(() => {
    const r = rng(kind === 'night' ? 921 : 922);
    return Array.from({ length: kind === 'night' ? 4 : 9 }, (_, i) => [3 + (i % 3) * 2.4 + r() * 0.5, -1.5 - Math.floor(i / 3) * 2 - r() * 0.5] as const);
  }, [kind]);
  return (
    <group>
      <primitive object={tiles} />
      {items.map(([dx, dz], i) => {
        const p = beside(land, at, dx, dz);
        return kind === 'night' ? (
          <group key={i} position={p}>
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.04, 0.05, 1.6, 6]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[0, 1.7, 0]}>
              <boxGeometry args={[0.3, 0.36, 0.3]} />
              <meshStandardMaterial color="#ffe0a0" emissive="#ffb850" emissiveIntensity={2.4} />
            </mesh>
            <pointLight position={[0, 1.7, 0]} color="#ffbf70" intensity={3} distance={5} />
          </group>
        ) : (
          <group key={i} position={p}>
            <mesh material={stem} position={[0, 0.9, 0]}>
              <cylinderGeometry args={[0.04, 0.05, 1.8, 6]} />
            </mesh>
            <mesh material={petals} position={[0, 1.85, 0.05]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 0.05, 14]} />
            </mesh>
            <mesh position={[0, 1.86, 0.09]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.06, 12]} />
              <meshStandardMaterial color="#5a3a1a" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
