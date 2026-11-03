// At-Tariq (86): one star brighter than the rest with sharp, piercing rays
// (86:3); a small cloud that keeps returning rain onto a patch of ground
// (86:11), where the earth cracks open and sprouts push through (86:12). No
// person is shown; the Day (86:9) is not pictured.
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type V } from './kit';

export function TariqScene({ land, stops }: SceneProps) {
  const star = stopNamed(stops, 'Piercing Star');
  const rain = stopNamed(stops, 'Returning Rain');
  const earth = stopNamed(stops, 'Cracking Earth');
  return (
    <group>
      {star && <PiercingStar position={beside(land, star.pos, 20, -80)} />}
      {rain && <RainCloud land={land} at={rain.pos} />}
      {earth && <Cracks land={land} at={earth.pos} />}
    </group>
  );
}

function PiercingStar({ position }: { position: [number, number, number] }) {
  const rays = useMemo(() => new THREE.MeshBasicMaterial({ color: '#e8f0ff', transparent: true, opacity: 0.8, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }), []);
  return (
    <group position={[position[0], position[1] + 40, position[2]]}>
      <mesh>
        <sphereGeometry args={[0.8, 12, 10]} />
        <meshBasicMaterial color="#ffffff" fog={false} />
      </mesh>
      {[0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].map((a, i) => (
        <mesh key={i} material={rays} rotation={[0, 0, a]}>
          <planeGeometry args={[i < 2 ? 14 : 6, 0.18]} />
        </mesh>
      ))}
    </group>
  );
}

function RainCloud({ land, at }: { land: Land; at: V }) {
  const c = useMemo(() => new THREE.Vector3(...beside(land, at, 5, -4)), [land, at]);
  const cloud = useMemo(() => mat('#9aa4b4', 1), []);
  const N = 220;
  const { geo, seeds } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    const r = rng(86);
    return { geo: g, seeds: Array.from({ length: N }, () => [(r() - 0.5) * 4, (r() - 0.5) * 3, r()] as const) };
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = geo.getAttribute('position') as THREE.BufferAttribute;
    seeds.forEach(([x, z, ph], i) => {
      const y = 5.5 - ((t * 0.9 + ph) % 1) * 5.5;
      a.setXYZ(i * 2, c.x + x, c.y + y, c.z + z);
      a.setXYZ(i * 2 + 1, c.x + x, c.y + y + 0.25, c.z + z);
    });
    a.needsUpdate = true;
  });
  return (
    <group>
      {[
        [0, 0, 1.6],
        [1.4, 0.2, 1.2],
        [-1.4, 0.1, 1.3],
        [0.5, 0.6, 1.1],
      ].map(([x, y, s], i) => (
        <mesh key={i} material={cloud} position={[c.x + x, c.y + 6 + y, c.z]} scale={[s * 1.3, s * 0.7, s]}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ))}
      <lineSegments geometry={geo}>
        <lineBasicMaterial color="#b8d0e8" transparent opacity={0.7} />
      </lineSegments>
      <mesh position={[c.x, c.y + 0.03, c.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.4, 24]} />
        <meshStandardMaterial color="#3a3028" roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Dry ground split by cracks, with sprouts pushing up through them. */
export function Cracks({ land, at }: { land: Land; at: V }) {
  const c = beside(land, at, 4.5, -3);
  const dark = useMemo(() => new THREE.MeshBasicMaterial({ color: '#1a1410' }), []);
  const sprout = useMemo(() => mat('#7cc050', 0.7), []);
  const lines = useMemo(() => {
    const r = rng(8612);
    return Array.from({ length: 9 }, () => ({ x: (r() - 0.5) * 3.5, z: (r() - 0.5) * 3, a: r() * 3.14, len: 0.8 + r() * 1.4 }));
  }, []);
  return (
    <group position={c}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.6, 24]} />
        <meshStandardMaterial color="#9a7a5a" roughness={1} />
      </mesh>
      {lines.map((l, i) => (
        <group key={i} position={[l.x, 0.03, l.z]} rotation={[0, l.a, 0]}>
          <mesh material={dark} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[l.len, 0.06]} />
          </mesh>
          <mesh material={sprout} position={[0, 0.12, 0]}>
            <coneGeometry args={[0.04, 0.25, 4]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} material={sprout} position={[s * 0.06, 0.24, 0]} rotation={[0, 0, s * -0.7]} scale={[1, 0.35, 0.6]}>
              <sphereGeometry args={[0.07, 6, 5]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
