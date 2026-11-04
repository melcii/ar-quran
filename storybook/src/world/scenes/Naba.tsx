// An-Naba' (78): the signs of 78:6-16. A meadow bench for the earth as a
// resting place (78:6), tall narrow peaks standing like stakes (78:7), a dark
// starry canopy that covers like clothing (78:10), a bright sun disc like a
// burning lamp (78:13), and arbours of vines grown thickly together (78:16).
// The Day (78:17-40) is not pictured. No person is shown.
import { useMemo } from 'react';
import * as THREE from 'three';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { Vines } from './Abasa';
import { SkyDisc } from './common';
import { beside, mat, rng } from './kit';

export function NabaScene({ land, stops }: SceneProps) {
  const rest = stopNamed(stops, 'Resting Place');
  const stakes = stopNamed(stops, 'Mountains as Stakes');
  const night = stopNamed(stops, 'Night as Clothing');
  const lamp = stopNamed(stops, 'Burning Lamp');
  const gardens = stopNamed(stops, 'Gardens of Entwined Growth');
  return (
    <group>
      {rest && <Bench position={beside(land, rest.pos, 3, -2)} />}
      {stakes && <Stakes position={beside(land, stakes.pos, 48, -15)} />}
      {night && <Canopy position={beside(land, night.pos, 4.5, -3.5)} />}
      {lamp && <SkyDisc position={beside(land, lamp.pos, -20, 0)} color="#fff4c8" glow="#ffd060" radius={5} />}
      {gardens && <Vines land={land} at={gardens.pos} />}
    </group>
  );
}

function Bench({ position }: { position: [number, number, number] }) {
  const wood = useMemo(() => mat('#7a5634', 0.8), []);
  const moss = useMemo(() => mat('#5a8a3a', 1), []);
  return (
    <group position={position} rotation={[0, -0.6, 0]}>
      <mesh material={wood} position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.8, 0.1, 0.55]} />
      </mesh>
      <mesh material={wood} position={[0, 0.85, -0.25]} castShadow>
        <boxGeometry args={[1.8, 0.5, 0.06]} />
      </mesh>
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} material={wood} position={[x, 0.22, 0]}>
          <boxGeometry args={[0.1, 0.44, 0.5]} />
        </mesh>
      ))}
      <mesh material={moss} position={[0, 0.03, 0.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.4, 24]} />
      </mesh>
    </group>
  );
}

/** Tall, narrow peaks that stand like tent stakes driven into the land. */
function Stakes({ position }: { position: [number, number, number] }) {
  const peaks = useMemo(() => {
    const r = rng(787);
    return Array.from({ length: 6 }, (_, i) => [(i - 2.5) * 9 + (r() - 0.5) * 4, (r() - 0.5) * 8, 3 + r() * 2, 26 + r() * 14] as const);
  }, []);
  return (
    <group position={position}>
      {peaks.map(([x, z, r, h], i) => (
        <mesh key={i} position={[x, h / 2 - 3, z]}>
          <coneGeometry args={[r, h, 5]} />
          <meshStandardMaterial color={i % 2 ? '#7a6e60' : '#6a6054'} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** A dark cloth dome on poles, sewn with small bright stars inside. */
function Canopy({ position }: { position: [number, number, number] }) {
  const pole = useMemo(() => mat('#3a2a1e'), []);
  const dots = useMemo(() => {
    const r = rng(7810);
    return Array.from({ length: 70 }, () => {
      const a = r() * Math.PI * 2;
      const e = 0.15 + r() * 1.3;
      return [Math.cos(a) * Math.cos(e) * 2.85, Math.sin(e) * 2.85, Math.sin(a) * Math.cos(e) * 2.85] as [number, number, number];
    });
  }, []);
  return (
    <group position={position}>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} material={pole} position={[Math.cos(a) * 2.9, 1.2, Math.sin(a) * 2.9]}>
            <cylinderGeometry args={[0.05, 0.05, 2.4, 6]} />
          </mesh>
        );
      })}
      <group position={[0, 2.2, 0]}>
        <mesh>
          <sphereGeometry args={[3, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#141a30" side={THREE.DoubleSide} roughness={1} />
        </mesh>
        {dots.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.035, 5, 4]} />
            <meshBasicMaterial color="#fff6d0" />
          </mesh>
        ))}
      </group>
    </group>
  );
}
