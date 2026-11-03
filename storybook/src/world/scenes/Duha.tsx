// Ad-Duha (93): bright morning light fills a meadow of flowers (93:1), while a
// thick grove nearby keeps the shade of the night (93:2). Further on, a home
// with its door open, a bench and a jug of water outside, for kindness to the
// orphan and the one who asks (93:9-10). No person is shown.
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type V } from './kit';
import { OpenDoor } from './Maun';

export function DuhaScene({ land, stops, quality }: SceneProps) {
  const bright = stopNamed(stops, 'Morning Brightness');
  const shade = stopNamed(stops, "Night's Shade");
  const door = stopNamed(stops, 'Open Door');
  return (
    <group>
      {bright && <Flowers land={land} at={bright.pos} count={Math.round(200 + 400 * quality.vegetation)} />}
      {shade && <Grove land={land} at={shade.pos} />}
      {door && (
        <group>
          <OpenDoor position={beside(land, door.pos, 4.5, -3)} />
          <mesh position={beside(land, door.pos, 2.4, -1.4).map((v, i) => (i === 1 ? v + 0.2 : v)) as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.14, 0.2, 0.4, 12]} />
            <meshStandardMaterial color="#a65a34" roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Flowers({ land, at, count }: { land: Land; at: V; count: number }) {
  const mesh = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.07, 6, 4);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.6 }), count);
    const r = rng(93);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    const cols = ['#ffd84a', '#ffffff', '#ff9a6a', '#f4b0d0'];
    for (let i = 0; i < count; i++) {
      const x = at.x + (r() > 0.5 ? 1 : -1) * (1.5 + r() * 7);
      const z = at.z + 4 - r() * 14;
      o.position.set(x, land.height(x, z) + 0.15 + r() * 0.15, z);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(cols[i % cols.length]));
    }
    return m;
  }, [land, at, count]);
  return <primitive object={mesh} />;
}

/** A dense ring of dark trees with its own dim, cool light inside. */
function Grove({ land, at }: { land: Land; at: V }) {
  const bark = useMemo(() => mat('#3a3028'), []);
  const leaf = useMemo(() => mat('#24402a'), []);
  const trees = useMemo(() => {
    const r = rng(932);
    return Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return { dx: 6 + Math.cos(a) * (3 + r()), dz: -5 + Math.sin(a) * (3 + r()), s: 1 + r() * 0.5 };
    });
  }, []);
  const c = beside(land, at, 6, -5);
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={beside(land, at, t.dx, t.dz)} scale={t.s}>
          <mesh material={bark} position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.25, 3, 7]} />
          </mesh>
          <mesh material={leaf} position={[0, 3.6, 0]} scale={[1.6, 1.4, 1.6]} castShadow>
            <icosahedronGeometry args={[1.2, 1]} />
          </mesh>
        </group>
      ))}
      <mesh position={[c[0], c[1] + 4.6, c[2]]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <circleGeometry args={[4.2, 20]} />
        <meshStandardMaterial color="#1e3422" side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[c[0], c[1] + 1.5, c[2]]} color="#7a90c0" intensity={1.5} distance={6} />
    </group>
  );
}
