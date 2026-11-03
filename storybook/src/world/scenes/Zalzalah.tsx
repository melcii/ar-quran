// Az-Zalzalah (99): a morning garden where tiny specks drift in shafts of
// sunlight and rows of very small seedlings grow, to show how small an atom's
// weight is (99:7-8). Three empty pots wait for seedlings. The earthquake
// (99:1) and the Day are not pictured; no person is shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, tapOnly, type V } from './kit';

export function ZalzalahScene({ land, stops, complete, hint }: SceneProps) {
  const seeds = stopNamed(stops, 'Seeds of Good');
  const specks = stopNamed(stops, 'Specks in the Sunlight');
  return (
    <group>
      {seeds && (
        <group>
          <Seedlings land={land} at={seeds.pos} />
          <Pots
            position={beside(land, seeds.pos, 3, 0.5)}
            onDone={() => (complete('Plant the seedlings'), hint('All three are planted. "Whoever does an atom’s weight of good will see it" (99:7).'))}
            hint={hint}
          />
        </group>
      )}
      {specks && <Sunbeams land={land} at={specks.pos} />}
    </group>
  );
}

function Seedlings({ land, at }: { land: Land; at: V }) {
  const mesh = useMemo(() => {
    const stem = new THREE.ConeGeometry(0.035, 0.22, 4);
    stem.translate(0, 0.11, 0);
    const m = new THREE.InstancedMesh(stem, new THREE.MeshStandardMaterial({ color: '#6fb04a', roughness: 0.8 }), 6 * 22);
    const r = rng(99);
    const o = new THREE.Object3D();
    let k = 0;
    for (let row = 0; row < 6; row++)
      for (let i = 0; i < 22; i++) {
        const x = at.x + 4 + i * 0.32;
        const z = at.z - 1.5 - row * 0.8;
        o.position.set(x, land.height(x, z), z);
        o.scale.setScalar(0.6 + r() * 0.8);
        o.rotation.set((r() - 0.5) * 0.3, r() * 6, 0);
        o.updateMatrix();
        m.setMatrixAt(k++, o.matrix);
      }
    return m;
  }, [land, at]);
  const soil = useMemo(() => mat('#5a4030', 1), []);
  return (
    <group>
      {Array.from({ length: 6 }, (_, row) => {
        const p = beside(land, at, 4 + 3.4, -1.5 - row * 0.8);
        return (
          <mesh key={row} material={soil} position={[p[0], p[1] + 0.02, p[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[7.4, 0.45]} />
          </mesh>
        );
      })}
      <primitive object={mesh} />
    </group>
  );
}

function Pots({ position, onDone, hint }: { position: [number, number, number]; onDone: () => void; hint: (t: string) => void }) {
  const [planted, setPlanted] = useState<number[]>([]);
  const clay = useMemo(() => mat('#b0643a', 0.85), []);
  const plant = (i: number) =>
    tapOnly(() => {
      if (planted.includes(i)) return;
      const next = [...planted, i];
      setPlanted(next);
      if (next.length === 3) onDone();
      else hint(`${3 - next.length} more pot${3 - next.length > 1 ? 's' : ''} to plant. Even a small good is seen.`);
    });
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[i * 0.9, 0, (i % 2) * 0.4]} onClick={plant(i)}>
          <mesh material={clay} position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.22, 0.44, 14]} />
          </mesh>
          <mesh position={[0, 0.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.27, 14]} />
            <meshStandardMaterial color="#4a3426" />
          </mesh>
          {planted.includes(i) && (
            <group position={[0, 0.44, 0]}>
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.015, 0.02, 0.24, 5]} />
                <meshStandardMaterial color="#5a9a3a" />
              </mesh>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.07, 0.24, 0]} rotation={[0, 0, s * -0.6]} scale={[1, 0.4, 0.6]}>
                  <sphereGeometry args={[0.08, 8, 6]} />
                  <meshStandardMaterial color="#7cc050" />
                </mesh>
              ))}
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

/** Soft shafts of light with tiny drifting specks inside them. */
function Sunbeams({ land, at }: { land: Land; at: V }) {
  const beams: [number, number][] = [
    [3.5, -2.5],
    [5.5, -4.5],
  ];
  const points = useRef<THREE.Points>(null);
  const { geo, base } = useMemo(() => {
    const r = rng(998);
    const n = 260;
    const pos = new Float32Array(n * 3);
    const base: number[] = [];
    for (let i = 0; i < n; i++) {
      const [dx, dz] = beams[i % 2];
      const h = r() * 4;
      const x = at.x + dx + 1.05 + (r() - 0.5) * 0.9 - h * 0.25;
      const z = at.z + dz + (r() - 0.5) * 0.9;
      const y = land.height(x, z) + 0.3 + h;
      pos.set([x, y, z], i * 3);
      base.push(x, y, z, r() * 6.28);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geo: g, base };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [land, at]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < a.count; i++) {
      const ph = base[i * 4 + 3];
      a.setXYZ(i, base[i * 4] + Math.sin(t * 0.3 + ph) * 0.12, base[i * 4 + 1] + Math.sin(t * 0.2 + ph * 2) * 0.15, base[i * 4 + 2] + Math.cos(t * 0.25 + ph) * 0.12);
    }
    a.needsUpdate = true;
  });
  return (
    <group>
      {beams.map(([dx, dz], i) => {
        const p = beside(land, at, dx, dz);
        return (
          <mesh key={i} position={[p[0] + 0.5, p[1] + 2.3, p[2]]} rotation={[0, 0, 0.25]}>
            <cylinderGeometry args={[0.35, 0.6, 4.6, 16, 1, true]} />
            <meshBasicMaterial color="#fff2c0" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      <points ref={points} geometry={geo}>
        <pointsMaterial color="#fff6d8" size={0.035} transparent opacity={0.9} depthWrite={false} />
      </points>
    </group>
  );
}
