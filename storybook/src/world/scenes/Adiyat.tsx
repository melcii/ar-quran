// Al-'Adiyat (100): at dawn, riderless horses gallop on a wide loop over the
// dunes, panting (100:1, 100:3); sparks fly where their hooves strike a rocky
// stretch (100:2) and dust rises in clouds behind them (100:4). The horses
// carry no riders; no person is shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type V } from './kit';

export function AdiyatScene({ land, stops }: SceneProps) {
  const racers = stopNamed(stops, 'The Racers');
  const sparks = stopNamed(stops, 'Sparks on Stone');
  const dust = stopNamed(stops, 'Clouds of Dust');
  const center = racers ?? sparks ?? dust;
  if (!center) return null;
  // One loop that passes all three places, to the right of the path.
  return <Track land={land} a={(racers ?? center).pos} b={(dust ?? center).pos} rocksAt={sparks?.pos} />;
}

const HORSES = 4;

function Track({ land, a, b, rocksAt }: { land: Land; a: V; b: V; rocksAt?: V }) {
  const cx = (a.x + b.x) / 2 + 22;
  const cz = (a.z + b.z) / 2;
  const rx = 9;
  const rz = Math.max(10, Math.abs(a.z - b.z) / 2 + 6);
  const at = (u: number): [number, number, number] => {
    const x = cx + Math.cos(u) * rx;
    const z = cz + Math.sin(u) * rz;
    return [x, land.height(x, z), z];
  };
  const horses = useRef<THREE.Group[]>([]);
  const legs = useRef<THREE.Object3D[][]>([]);
  const dustMesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#d8bf94', transparent: true, opacity: 0.25, depthWrite: false, roughness: 1 }), 40);
    return m;
  }, []);
  const sparkGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 3), 3));
    return g;
  }, []);
  const rocks = useMemo(() => {
    if (!rocksAt) return [];
    const r = rng(100);
    // Flat stones laid across the loop where it passes nearest the place.
    const near = Math.atan2((rocksAt.z - cz) / rz, (rocksAt.x - cx) / rx);
    return Array.from({ length: 14 }, (_, i) => ({ u: near - 0.35 + (i / 14) * 0.7, off: (r() - 0.5) * 2.2, s: 0.4 + r() * 0.4 }));
  }, [rocksAt, cx, cz, rx, rz]);
  const rockMat = useMemo(() => mat('#7a6a5a'), []);
  const hide = useMemo(() => ['#5a3a24', '#2a2018', '#8a6a4a', '#d8d0c4'].map((c) => mat(c, 0.7)), []);
  const o = useMemo(() => new THREE.Object3D(), []);
  const rockNear = rocks.length ? rocks[7].u : 99;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const sp = (sparkGeo.getAttribute('position') as THREE.BufferAttribute);
    let s = 0;
    for (let h = 0; h < HORSES; h++) {
      const u = t * 0.32 - h * 0.28;
      const p = at(u);
      const q = at(u + 0.01);
      const g = horses.current[h];
      if (g) {
        g.position.set(p[0], p[1] + 0.05 + Math.abs(Math.sin(t * 9 + h)) * 0.18, p[2]);
        g.lookAt(q[0], g.position.y, q[2]);
      }
      legs.current[h]?.forEach((l, k) => l && (l.rotation.x = Math.sin(t * 9 + h + (k < 2 ? 0 : Math.PI) + k * 0.5) * 0.7));
      // Dust: puffs left behind each horse, growing and fading as they fall back.
      for (let k = 0; k < 10; k++) {
        const back = (k + ((t * 3) % 1)) * 0.04;
        const d = at(u - back);
        o.position.set(d[0], d[1] + 0.3 + back * 1.5, d[2]);
        o.scale.setScalar(0.2 + back * 3);
        o.updateMatrix();
        dustMesh.setMatrixAt(h * 10 + k, o.matrix);
      }
      // Sparks: only where the loop crosses the stones.
      const wrapped = Math.atan2(Math.sin(u - rockNear), Math.cos(u - rockNear));
      for (let k = 0; k < 15; k++) {
        if (Math.abs(wrapped) < 0.35 && (k + Math.floor(t * 30)) % 3 === 0) sp.setXYZ(s, p[0] + Math.sin(k * 7 + t * 40) * 0.4, p[1] + 0.1 + ((k * 0.13 + t * 3) % 0.6), p[2] + Math.cos(k * 5 + t * 30) * 0.4);
        else sp.setXYZ(s, 0, -999, 0);
        s++;
      }
    }
    dustMesh.instanceMatrix.needsUpdate = true;
    sp.needsUpdate = true;
  });
  return (
    <group>
      {rocks.map(({ u, off, s }, i) => {
        const p = at(u);
        return (
          <mesh key={i} material={rockMat} position={[p[0] + off * 0.6, p[1] + 0.02, p[2] + off * 0.3]} scale={[s * 1.4, 0.12, s]} receiveShadow>
            <dodecahedronGeometry args={[1, 0]} />
          </mesh>
        );
      })}
      {Array.from({ length: HORSES }, (_, h) => (
        <group key={h} ref={(g) => g && (horses.current[h] = g)}>
          <Horse coat={hide[h]} legRefs={(arr) => (legs.current[h] = arr)} />
        </group>
      ))}
      <primitive object={dustMesh} />
      <points geometry={sparkGeo}>
        <pointsMaterial color="#ffd27a" size={0.09} />
      </points>
    </group>
  );
}

/** A simple horse made of rounded shapes, facing +z, with four legs that swing. No rider, no saddle. */
function Horse({ coat, legRefs }: { coat: THREE.Material; legRefs: (m: THREE.Object3D[]) => void }) {
  const arr = useRef<THREE.Object3D[]>([]);
  return (
    <group ref={() => legRefs(arr.current)}>
      <mesh material={coat} position={[0, 1.4, 0]} scale={[0.45, 0.45, 1.05]} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      <mesh material={coat} position={[0, 1.85, 0.95]} rotation={[0.7, 0, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.26, 0.9, 10]} />
      </mesh>
      <mesh material={coat} position={[0, 2.15, 1.35]} rotation={[1.3, 0, 0]} scale={[0.22, 0.5, 0.25]} castShadow>
        <sphereGeometry args={[1, 12, 8]} />
      </mesh>
      <mesh position={[0, 1.4, -1.1]} rotation={[-0.6, 0, 0]}>
        <coneGeometry args={[0.1, 0.8, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      {[
        [-0.22, 0.6],
        [0.22, 0.6],
        [-0.22, -0.65],
        [0.22, -0.65],
      ].map(([x, z], k) => (
        <group key={k} position={[x, 1.2, z]} ref={(g) => g && (arr.current[k] = g)}>
          <mesh material={coat} position={[0, -0.55, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.06, 1.1, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
