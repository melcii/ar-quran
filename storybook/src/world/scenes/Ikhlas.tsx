// Al-Ikhlas (112): a quiet courtyard of geometric tiles where the surah is
// read (112:1), a shaded shelter to rest in (112:2, "the Eternal Refuge"),
// and an open terrace facing an empty sky (112:4). Nothing here is a symbol
// or image of Allah: the places are only where the ayahs are read.
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';

export function IkhlasScene({ land, stops }: SceneProps) {
  const path = stopNamed(stops, 'The Reading Courtyard');
  const refuge = stopNamed(stops, 'Eternal Refuge');
  const sky = stopNamed(stops, 'Nothing Like Him');
  return (
    <group>
      {path && <Tiles land={land} center={path.pos} />}
      {refuge && <Shelter land={land} near={refuge.pos} />}
      {sky && <Terrace land={land} near={sky.pos} />}
    </group>
  );
}

/** Eight-pointed star tiles (two crossed squares) set into the ground. */
function Tiles({ land, center }: { land: Land; center: THREE.Vector3 }) {
  const mesh = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = i % 2 ? 0.36 : 0.5;
      const px = Math.cos(a) * r;
      const pz = Math.sin(a) * r;
      if (i === 0) shape.moveTo(px, pz);
      else shape.lineTo(px, pz);
    }
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    const R = 5;
    const cells: [number, number][] = [];
    for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) if (i * i + j * j <= R * R) cells.push([i, j]);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }), cells.length);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    cells.forEach(([i, j], k) => {
      const x = center.x + 2 + i * 1.05;
      const z = center.z - 2 + j * 1.05;
      o.position.set(x, land.height(x, z) + 0.04, z);
      o.updateMatrix();
      m.setMatrixAt(k, o.matrix);
      m.setColorAt(k, col.set((i + j) % 2 ? '#2f6f8f' : '#e9dcc0'));
    });
    m.receiveShadow = true;
    return m;
  }, [land, center]);
  return <primitive object={mesh} />;
}

/** A small open shelter with four columns and a shallow dome. */
function Shelter({ land, near }: { land: Land; near: THREE.Vector3 }) {
  const x = near.x + 4;
  const z = near.z - 3;
  const y = land.height(x, z);
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#efe4cc', roughness: 0.8 }), []);
  return (
    <group position={[x, y, z]}>
      <mesh material={stone} position={[0, 0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.6, 2.8, 0.3, 32]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} material={stone} position={[Math.cos(a) * 1.9, 1.75, Math.sin(a) * 1.9]} castShadow>
            <cylinderGeometry args={[0.16, 0.2, 2.9, 12]} />
          </mesh>
        );
      })}
      <mesh material={stone} position={[0, 3.25, 0]} castShadow>
        <cylinderGeometry args={[2.5, 2.5, 0.25, 32]} />
      </mesh>
      <mesh position={[0, 3.35, 0]} castShadow>
        <sphereGeometry args={[2.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2f6f8f" roughness={0.5} />
      </mesh>
      <mesh material={stone} position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.6, 0.5, 0.5]} />
      </mesh>
    </group>
  );
}

/** A raised terrace with a low wall, looking out at open sky. */
function Terrace({ land, near }: { land: Land; near: THREE.Vector3 }) {
  const x = near.x - 4;
  const z = near.z - 4;
  const y = land.height(x, z);
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e6d8bb', roughness: 0.85 }), []);
  return (
    <group position={[x, y, z]}>
      <mesh material={stone} position={[0, 0.3, 0]} receiveShadow castShadow>
        <boxGeometry args={[6, 0.6, 4]} />
      </mesh>
      <mesh material={stone} position={[0, 0.95, -1.9]} castShadow>
        <boxGeometry args={[6, 0.7, 0.25]} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} material={stone} position={[sx * 2.95, 0.95, 0]} castShadow>
          <boxGeometry args={[0.25, 0.7, 4]} />
        </mesh>
      ))}
    </group>
  );
}
