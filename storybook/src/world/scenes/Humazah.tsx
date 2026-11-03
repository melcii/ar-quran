// Al-Humazah (104): an empty counting room at dusk. A table heaped with coins,
// an open ledger and an abacus (104:2), and a row of locked chests: wealth
// that cannot make anyone live forever (104:3). No person is shown, and the
// Crusher and the Fire (104:4-9) are not pictured.
import { useMemo } from 'react';
import * as THREE from 'three';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng } from './kit';

export function HumazahScene({ land, stops }: SceneProps) {
  const table = stopNamed(stops, 'Counting Table');
  const chests = stopNamed(stops, 'Locked Chests');
  return (
    <group>
      {table && <CountingRoom position={beside(land, table.pos, 4.5, -3)} />}
      {chests && <Chests position={beside(land, chests.pos, 4, -2.5)} />}
    </group>
  );
}

function CountingRoom({ position }: { position: [number, number, number] }) {
  const wall = useMemo(() => mat('#c8b08a'), []);
  const wood = useMemo(() => mat('#5a3e26', 0.8), []);
  const coins = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.018, 10), new THREE.MeshStandardMaterial({ color: '#d4b050', metalness: 0.8, roughness: 0.35 }), 140);
    const r = rng(104);
    const o = new THREE.Object3D();
    for (let i = 0; i < 140; i++) {
      // Neat counted stacks on the left, a loose heap on the right.
      if (i < 60) o.position.set(-0.9 + (i % 6) * 0.14, 0.91 + (Math.floor(i / 6) % 5) * 0.02, -0.15 + Math.floor(i / 30) * 0.15);
      else {
        const a = r() * 6.28;
        const rad = Math.sqrt(r()) * 0.4;
        o.position.set(0.5 + Math.cos(a) * rad, 0.92 + (0.4 - rad) * 0.35 * r(), Math.sin(a) * rad * 0.7);
      }
      o.rotation.set((r() - 0.5) * (i < 60 ? 0 : 0.8), 0, (r() - 0.5) * (i < 60 ? 0 : 0.8));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.castShadow = true;
    return m;
  }, []);
  return (
    <group position={position} rotation={[0, -0.4, 0]}>
      {[
        [0, 1.5, -2, 5, 3, 0.25],
        [-2.5, 1.5, -0.5, 0.25, 3, 3.2],
        [2.5, 1.5, -0.5, 0.25, 3, 3.2],
        [0, 3.05, -0.5, 5.3, 0.15, 3.4],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} material={wall} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}
      <mesh material={wood} position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.1, 1.2]} />
      </mesh>
      {[
        [-1.2, -0.5],
        [1.2, -0.5],
        [-1.2, 0.5],
        [1.2, 0.5],
      ].map(([x, z], i) => (
        <mesh key={i} material={wood} position={[x, 0.4, z]}>
          <boxGeometry args={[0.1, 0.8, 0.1]} />
        </mesh>
      ))}
      <primitive object={coins} />
      {/* An open ledger */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-0.2 + s * 0.2, 0.92, 0.35]} rotation={[-Math.PI / 2, s * -0.08, 0]}>
          <planeGeometry args={[0.38, 0.5]} />
          <meshStandardMaterial color="#efe6d0" side={2} />
        </mesh>
      ))}
      {/* An abacus */}
      <group position={[0.9, 1.1, -0.4]}>
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} material={wood} position={[x, 0, 0]}>
            <boxGeometry args={[0.05, 0.45, 0.05]} />
          </mesh>
        ))}
        {[0, 1, 2, 3].map((k) => (
          <group key={k} position={[0, -0.15 + k * 0.1, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.008, 0.008, 0.7, 4]} />
              <meshStandardMaterial color="#888" />
            </mesh>
            {Array.from({ length: 5 }, (_, b) => (
              <mesh key={b} position={[-0.25 + b * 0.07 + (b > 2 - k % 3 ? 0.18 : 0), 0, 0]}>
                <sphereGeometry args={[0.03, 8, 6]} />
                <meshStandardMaterial color="#8a2a1a" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

function Chests({ position }: { position: [number, number, number] }) {
  const wood = useMemo(() => mat('#4a3020', 0.8), []);
  const iron = useMemo(() => mat('#2a2622', 0.5, 0.6), []);
  return (
    <group position={position} rotation={[0, -0.3, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[i * 1.3 - 2, 0, 0]}>
          <mesh material={wood} position={[0, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.1, 0.8, 0.7]} />
          </mesh>
          {[-0.35, 0.35].map((x) => (
            <mesh key={x} material={iron} position={[x, 0.4, 0]}>
              <boxGeometry args={[0.08, 0.84, 0.74]} />
            </mesh>
          ))}
          <mesh material={iron} position={[0, 0.6, 0.37]}>
            <boxGeometry args={[0.16, 0.2, 0.06]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
