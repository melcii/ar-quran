// Al-Masad (111): beside a dusk road, an abandoned heap of chests and coins
// half sunk in the sand, wealth that did not help its owner (111:2), and a
// bundle of firewood tied with a rope of twisted fibre (111:4-5). No person
// is shown, and the Fire (111:3) is not pictured.
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type V } from './kit';

export function MasadScene({ land, stops }: SceneProps) {
  const wealth = stopNamed(stops, 'Wealth That Will Not Avail');
  const wood = stopNamed(stops, 'Firewood and Rope');
  return (
    <group>
      {wealth && <Wealth land={land} at={wealth.pos} />}
      {wood && <Firewood position={beside(land, wood.pos, 3.5, -2.5)} />}
    </group>
  );
}

function Wealth({ land, at }: { land: Land; at: V }) {
  const wood = useMemo(() => mat('#5a3a22', 0.85), []);
  const brass = useMemo(() => mat('#8a7040', 0.5, 0.6), []);
  const coins = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 10);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#b89a48', metalness: 0.7, roughness: 0.55 }), 160);
    const r = rng(111);
    const o = new THREE.Object3D();
    for (let i = 0; i < 160; i++) {
      const rad = Math.sqrt(r()) * 2.6;
      const a = r() * Math.PI * 2;
      const x = at.x + 4 + Math.cos(a) * rad;
      const z = at.z - 3 + Math.sin(a) * rad;
      o.position.set(x, land.height(x, z) + 0.01, z);
      o.rotation.set((r() - 0.5) * 0.6, 0, (r() - 0.5) * 0.6);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    return m;
  }, [land, at]);
  const chests = [
    [3.2, -2.6, 0.3, 0.35],
    [5, -3.6, -0.5, 0.5],
    [4.2, -4.6, 1.2, 0.25],
  ] as const;
  return (
    <group>
      <primitive object={coins} />
      {chests.map(([dx, dz, ry, sink], i) => (
        <group key={i} position={beside(land, at, dx, dz)} rotation={[0.12 * (i - 1), ry, 0.1]}>
          {/* Half sunk in sand, the lid fallen open, dull with dust. */}
          <mesh material={wood} position={[0, 0.4 - sink, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.8, 0.75]} />
          </mesh>
          <mesh material={brass} position={[0, 0.4 - sink, 0]}>
            <boxGeometry args={[1.24, 0.1, 0.79]} />
          </mesh>
          <mesh material={wood} position={[0, 0.95 - sink, -0.5]} rotation={[-1.1, 0, 0]} castShadow>
            <boxGeometry args={[1.2, 0.08, 0.75]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Firewood({ position }: { position: [number, number, number] }) {
  const bark = useMemo(() => mat('#6a4a2c'), []);
  const fibre = useMemo(() => mat('#b39060', 1), []);
  const logs = useMemo(() => {
    const r = rng(1114);
    return Array.from({ length: 13 }, (_, i) => ({ x: ((i % 4) - 1.5) * 0.17 + (r() - 0.5) * 0.04, y: 0.12 + Math.floor(i / 4) * 0.15, len: 1.5 + r() * 0.4, t: r() * 6 }));
  }, []);
  // A rope of twisted fibre: two strands wound around each other in a loop.
  const rope = useMemo(() => {
    class Twist extends THREE.Curve<THREE.Vector3> {
      constructor(private phase: number) {
        super();
      }
      getPoint(t: number) {
        const a = t * Math.PI * 2;
        const w = 0.025 * Math.cos(t * Math.PI * 2 * 18 + this.phase);
        const v = 0.025 * Math.sin(t * Math.PI * 2 * 18 + this.phase);
        return new THREE.Vector3((0.42 + w) * Math.cos(a), (0.42 + w) * Math.sin(a), v);
      }
    }
    return [0, Math.PI].map((ph) => new THREE.TubeGeometry(new Twist(ph), 200, 0.022, 5, true));
  }, []);
  return (
    <group position={position} rotation={[0, 0.6, 0]} scale={1.6}>
      {logs.map((l, i) => (
        <mesh key={i} material={bark} position={[l.x, l.y, 0]} rotation={[Math.PI / 2, l.t, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, l.len, 7]} />
        </mesh>
      ))}
      {[-0.4, 0.4].map((z) =>
        rope.map((g, k) => <mesh key={`${z}${k}`} geometry={g} material={fibre} position={[0, 0.32, z]} rotation={[0, 0, 0]} scale={[0.95, 0.75, 1]} />),
      )}
    </group>
  );
}
