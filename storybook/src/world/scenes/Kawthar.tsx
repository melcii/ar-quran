// Al-Kawthar (108): an orchard heavy with fruit, with full baskets, as a sign
// of good things given (108:1). It is not a picture of al-Kawthar, which is
// not shown. At its edge, a clean stone terrace for prayer (108:2).
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type V } from './kit';

export function KawtharScene({ land, stops }: SceneProps) {
  const orchard = stopNamed(stops, 'Orchard of Plenty');
  const terrace = stopNamed(stops, 'Prayer Terrace');
  return (
    <group>
      {orchard && <Orchard land={land} at={orchard.pos} />}
      {terrace && <PrayerTerrace position={beside(land, terrace.pos, 4, -3)} />}
    </group>
  );
}

export function Orchard({ land, at }: { land: Land; at: V }) {
  const bark = useMemo(() => mat('#5e4430'), []);
  const leaf = useMemo(() => mat('#4f7f3a'), []);
  const weave = useMemo(() => mat('#b08a50'), []);
  const fruitMats = useMemo(() => ['#e0502a', '#f0b030', '#8a2a5a'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })), []);
  const trees = useMemo(() => {
    const r = rng(108);
    const t: { dx: number; dz: number; s: number; fruit: [number, number, number][] }[] = [];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const fruit: [number, number, number][] = Array.from({ length: 12 }, () => {
          const a = r() * Math.PI * 2;
          const e = r() * 1.2 - 0.3;
          return [Math.cos(a) * 1.25 * Math.cos(e), 2.6 + Math.sin(e) * 1.1, Math.sin(a) * 1.25 * Math.cos(e)] as [number, number, number];
        });
        t.push({ dx: 4 + i * 3.4 + (r() - 0.5), dz: -2 - j * 3.4 + (r() - 0.5), s: 0.85 + r() * 0.3, fruit });
      }
    return t;
  }, []);
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={beside(land, at, t.dx, t.dz)} scale={t.s}>
          <mesh material={bark} position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.2, 2.2, 8]} />
          </mesh>
          <mesh material={leaf} position={[0, 2.7, 0]} castShadow>
            <icosahedronGeometry args={[1.3, 1]} />
          </mesh>
          {t.fruit.map((f, k) => (
            <mesh key={k} material={fruitMats[i % 3]} position={f}>
              <sphereGeometry args={[0.12, 8, 6]} />
            </mesh>
          ))}
        </group>
      ))}
      {[
        [3, 0.5],
        [5.5, 0.8],
        [8, 0.4],
      ].map(([dx, dz], i) => (
        <group key={i} position={beside(land, at, dx, dz)}>
          <mesh material={weave} position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.35, 0.5, 14, 1, true]} />
          </mesh>
          {Array.from({ length: 7 }, (_, k) => (
            <mesh key={k} material={fruitMats[(i + k) % 3]} position={[Math.cos(k) * 0.22, 0.5 + (k % 2) * 0.08, Math.sin(k) * 0.22]}>
              <sphereGeometry args={[0.13, 8, 6]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function PrayerTerrace({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#ece2cc', 0.7), []);
  const edge = useMemo(() => mat('#b8a888'), []);
  return (
    <group position={position}>
      <mesh material={stone} position={[0, 0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.4, 0.5, 4.4]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={edge} position={[0, 0.65, s * 2.1]} castShadow>
          <boxGeometry args={[4.4, 0.3, 0.2]} />
        </mesh>
      ))}
      <mesh material={edge} position={[-2.1, 0.65, 0]} castShadow>
        <boxGeometry args={[0.2, 0.3, 4.4]} />
      </mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} material={edge} position={[2.6 + k * 0.35, 0.08 + (2 - k) * 0.14, 0]}>
          <boxGeometry args={[0.35, 0.16 + (2 - k) * 0.28, 1.4]} />
        </mesh>
      ))}
    </group>
  );
}
