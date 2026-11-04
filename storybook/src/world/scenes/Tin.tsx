// At-Tin (95): the path runs between a fig orchard and an olive grove (95:1).
// Far off, a tall mountain stands for Mount Sinai (95:2) and a small walled
// city in a valley for the secure city (95:3): simple stand-ins seen from far
// away, not their real shapes. No person is shown.
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type V } from './kit';

export function TinScene({ land, stops }: SceneProps) {
  const fig = stopNamed(stops, 'Fig Orchard');
  const olive = stopNamed(stops, 'Olive Grove');
  const sinai = stopNamed(stops, 'Mount Sinai');
  const city = stopNamed(stops, 'Secure City');
  return (
    <group>
      {fig && <Trees land={land} at={fig.pos} kind="fig" />}
      {olive && <Trees land={land} at={olive.pos} kind="olive" />}
      {sinai && <FarMountain position={beside(land, sinai.pos, 30, -70)} />}
      {city && <FarCity position={beside(land, city.pos, -25, -60)} />}
    </group>
  );
}

export function Trees({ land, at, kind }: { land: Land; at: V; kind: 'fig' | 'olive' }) {
  const bark = useMemo(() => mat(kind === 'fig' ? '#8a8070' : '#5a5044'), [kind]);
  const leaf = useMemo(() => mat(kind === 'fig' ? '#3f7a32' : '#8aa088'), [kind]);
  const fruit = useMemo(() => new THREE.MeshStandardMaterial({ color: kind === 'fig' ? '#5a2a4a' : '#3a4a22', roughness: 0.5 }), [kind]);
  const trees = useMemo(() => {
    const r = rng(kind === 'fig' ? 951 : 952);
    return Array.from({ length: 7 }, (_, i) => ({
      dx: (i % 2 ? 1 : -1) * (3.5 + r() * 3),
      dz: 2 - i * 2.2 + (r() - 0.5),
      s: 0.8 + r() * 0.4,
      fr: Array.from({ length: kind === 'fig' ? 10 : 22 }, () => {
        const a = r() * 6.28;
        const e = r() * 1.0 - 0.2;
        return [Math.cos(a) * Math.cos(e) * 1.3, 2.4 + Math.sin(e) * 0.9, Math.sin(a) * Math.cos(e) * 1.3] as [number, number, number];
      }),
    }));
  }, [kind]);
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={beside(land, at, t.dx, t.dz)} scale={t.s}>
          {/* Olives have twisted, leaning trunks; figs a smooth pale one. */}
          <mesh material={bark} position={[0, 1, 0]} rotation={[0, 0, kind === 'olive' ? 0.25 * (i % 2 ? 1 : -1) : 0]} castShadow>
            <cylinderGeometry args={[kind === 'olive' ? 0.18 : 0.14, 0.3, 2, 7]} />
          </mesh>
          <mesh material={leaf} position={[0, 2.4, 0]} scale={kind === 'olive' ? [1.4, 0.8, 1.4] : [1.2, 0.95, 1.2]} castShadow>
            <icosahedronGeometry args={[1.1, 1]} />
          </mesh>
          {t.fr.map((p, k) => (
            <mesh key={k} material={fruit} position={p} scale={kind === 'fig' ? [1, 1.2, 1] : [0.6, 0.8, 0.6]}>
              <sphereGeometry args={[0.1, 8, 6]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function FarMountain({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={[position[0], position[1] + 8, position[2]]} scale={[18, 26, 14]}>
      <coneGeometry args={[1, 1, 7]} />
      <meshStandardMaterial color="#8a6a58" roughness={1} />
    </mesh>
  );
}

function FarCity({ position }: { position: [number, number, number] }) {
  const wall = useMemo(() => mat('#d8c8a8'), []);
  const blocks = useMemo(() => {
    const r = rng(953);
    return Array.from({ length: 16 }, () => [(r() - 0.5) * 9, 1 + r() * 2, (r() - 0.5) * 9, 1.2 + r()] as const);
  }, []);
  return (
    <group position={position}>
      {[
        [0, -6, 12.4, 0.5],
        [0, 6, 12.4, 0.5],
        [-6, 0, 0.5, 12.4],
        [6, 0, 0.5, 12.4],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} material={wall} position={[x, 1.2, z]}>
          <boxGeometry args={[w, 2.4, d]} />
        </mesh>
      ))}
      {blocks.map(([x, h, z, w], i) => (
        <mesh key={i} material={wall} position={[x, h / 2, z]}>
          <boxGeometry args={[w, h, w]} />
        </mesh>
      ))}
    </group>
  );
}
