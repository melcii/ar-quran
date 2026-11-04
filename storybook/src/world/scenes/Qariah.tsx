// Al-Qari'ah (101): the surah's two comparisons, shown only as ordinary things
// of this world. Moths fluttering and scattering around lamps at night (101:4)
// and soft heaps of fluffed wool at the foot of round hills (101:5). The Day
// itself, the scales and the Fire are not pictured; no person is shown.
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { NightLight } from './common';
import { beside, mat, rng, type V } from './kit';

export function QariahScene({ land, stops }: SceneProps) {
  const moths = stopNamed(stops, 'Scattered Moths');
  const wool = stopNamed(stops, 'Fluffed Wool');
  return (
    <group>
      <NightLight />
      {moths && <MothLamps land={land} at={moths.pos} />}
      {wool && <Wool land={land} at={wool.pos} />}
    </group>
  );
}

const LAMPS: [number, number][] = [
  [3.5, -2],
  [6, -5],
  [3, -7.5],
];
const PER = 18;

function MothLamps({ land, at }: { land: Land; at: V }) {
  const lamps = useMemo(() => LAMPS.map(([dx, dz]) => new THREE.Vector3(...beside(land, at, dx, dz))), [land, at]);
  const { mesh, seeds } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.12, 0.08);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#e8dcc0', side: THREE.DoubleSide }), LAMPS.length * PER);
    const r = rng(101);
    return { mesh: m, seeds: Array.from({ length: LAMPS.length * PER }, () => [r() * 6.28, 0.5 + r() * 1.2, 0.8 + r() * 1.6, r() * 6.28] as const) };
  }, []);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seeds.forEach(([ph, rad, sp, tilt], i) => {
      const c = lamps[Math.floor(i / PER)];
      // Each moth circles its lamp, now and then darting further out and back.
      const scatter = 1 + 0.9 * Math.max(0, Math.sin(t * 0.4 + ph * 3));
      const a = t * sp + ph;
      o.position.set(c.x + Math.cos(a) * rad * scatter, c.y + 2.3 + Math.sin(t * 2.3 + ph) * 0.4 * scatter, c.z + Math.sin(a) * rad * scatter);
      o.rotation.set(Math.sin(t * 20 + ph) * 0.8, -a, tilt);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      {lamps.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.07, 2, 6]} />
            <meshStandardMaterial color="#2a2420" />
          </mesh>
          <mesh position={[0, 2.15, 0]}>
            <sphereGeometry args={[0.2, 14, 10]} />
            <meshStandardMaterial color="#fff0c8" emissive="#ffc870" emissiveIntensity={3} />
          </mesh>
          <pointLight position={[0, 2.1, 0]} color="#ffcf80" intensity={5} distance={7} />
        </group>
      ))}
      <primitive object={mesh} />
    </group>
  );
}

/** Round hills with heaps of fluffed wool at their feet. */
function Wool({ land, at }: { land: Land; at: V }) {
  const hill = useMemo(() => mat('#5f6a4a'), []);
  const wool = useMemo(() => mat('#f4efe6', 1), []);
  const puffs = useMemo(() => {
    const r = rng(1015);
    return Array.from({ length: 5 }, (_, h) =>
      Array.from({ length: 9 }, () => [(r() - 0.5) * 1.6, r() * 0.6, (r() - 0.5) * 1.2, 0.35 + r() * 0.35] as const).map((p) => ({ h, p })),
    ).flat();
  }, []);
  return (
    <group>
      {[
        [9, -10, 5],
        [16, -6, 4],
        [13, -16, 6],
      ].map(([dx, dz, s], i) => {
        const p = beside(land, at, dx, dz);
        return (
          <mesh key={i} material={hill} position={[p[0], p[1] - s * 0.35, p[2]]} scale={[s, s * 0.7, s]} receiveShadow>
            <sphereGeometry args={[1, 20, 12]} />
          </mesh>
        );
      })}
      {puffs.map(({ h, p: [x, y, z, s] }, i) => {
        const base = beside(land, at, 3.5 + (h % 3) * 1.8, -2 - Math.floor(h / 2) * 2.2 - (h % 2));
        return (
          <mesh key={i} material={wool} position={[base[0] + x, base[1] + 0.25 + y, base[2] + z]} scale={s} castShadow>
            <icosahedronGeometry args={[1, 1]} />
          </mesh>
        );
      })}
    </group>
  );
}
