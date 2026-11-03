// 'Abasa (80): "let mankind look at his food" (80:24). A torrent of water down
// a rocky fall (80:25), earth split open by sprouts (80:26), grain rows and a
// grapevine trellis (80:27-28), olive trees (80:29) and fruit trees over grass
// (80:31). The event of 80:1-10 and the Day (80:33-42) are not pictured. No
// person is shown.
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { Orchard } from './Kawthar';
import { beside, mat, rng, type V } from './kit';
import { Cracks } from './Tariq';
import { Trees } from './Tin';

export function AbasaScene({ land, stops }: SceneProps) {
  const water = stopNamed(stops, 'Torrents');
  const split = stopNamed(stops, 'Split Earth');
  const vines = stopNamed(stops, 'Grain and Grapes');
  const olives = stopNamed(stops, 'Olives and Palms');
  const fruit = stopNamed(stops, 'Fruit and Grass');
  return (
    <group>
      {water && <Waterfall position={beside(land, water.pos, 5, -4)} />}
      {split && <Cracks land={land} at={split.pos} />}
      {vines && <Vines land={land} at={vines.pos} />}
      {olives && <Trees land={land} at={olives.pos} kind="olive" />}
      {fruit && <Orchard land={land} at={fruit.pos} />}
    </group>
  );
}

function Waterfall({ position }: { position: [number, number, number] }) {
  const rock = useMemo(() => mat('#7a7468'), []);
  const stripes = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 64;
    const g = c.getContext('2d')!;
    for (let y = 0; y < 64; y++) {
      g.fillStyle = `rgba(230,245,255,${0.5 + 0.5 * Math.abs(Math.sin(y * 12.9898) % 1)})`;
      g.fillRect(0, y, 16, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 3);
    return t;
  }, []);
  useFrame((_, dt) => {
    stripes.offset.y += dt * 1.2;
  });
  return (
    <group position={position} rotation={[0, -0.4, 0]}>
      <mesh material={rock} position={[0, 2.5, -1.2]} scale={[3, 3, 1.5]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
      </mesh>
      <mesh position={[0, 2.3, 0.1]}>
        <planeGeometry args={[1.2, 4.6]} />
        <meshStandardMaterial map={stripes} color="#cfe8f8" transparent opacity={0.85} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.05, 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 24]} />
        <meshStandardMaterial color="#5a9ac0" roughness={0.1} metalness={0.2} />
      </mesh>
    </group>
  );
}

/** Rows of grain, and grapevines on a wooden trellis with hanging bunches. */
export function Vines({ land, at }: { land: Land; at: V }) {
  const wood = useMemo(() => mat('#6a4a2e', 0.8), []);
  const leaf = useMemo(() => mat('#4a7a32'), []);
  const grape = useMemo(() => mat('#5a2a5a', 0.4), []);
  const grain = useMemo(() => {
    const g = new THREE.ConeGeometry(0.025, 0.9, 3);
    g.translate(0, 0.45, 0);
    const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: '#d8b860' }), 400);
    const r = rng(8027);
    const o = new THREE.Object3D();
    for (let i = 0; i < 400; i++) {
      const x = at.x - 3 - (i % 5) * 0.5 - r() * 0.2;
      const z = at.z + 2 - Math.floor(i / 5) * 0.12;
      o.position.set(x, land.height(x, z), z);
      o.rotation.set((r() - 0.5) * 0.2, 0, (r() - 0.5) * 0.2);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    return m;
  }, [land, at]);
  return (
    <group>
      <primitive object={grain} />
      {[0, 1, 2, 3].map((k) => {
        const p = beside(land, at, 4, -1 - k * 2);
        return (
          <group key={k} position={p}>
            {[-0.9, 0.9].map((x) => (
              <mesh key={x} material={wood} position={[x, 1, 0]} castShadow>
                <boxGeometry args={[0.08, 2, 0.08]} />
              </mesh>
            ))}
            <mesh material={wood} position={[0, 2, 0]}>
              <boxGeometry args={[2, 0.06, 0.06]} />
            </mesh>
            <mesh material={leaf} position={[0, 2.1, 0]} scale={[1.2, 0.35, 1.1]} castShadow>
              <icosahedronGeometry args={[0.9, 1]} />
            </mesh>
            {[-0.5, 0.1, 0.6].map((x) => (
              <mesh key={x} material={grape} position={[x, 1.7, 0.2]} scale={[0.6, 1, 0.6]}>
                <icosahedronGeometry args={[0.16, 1]} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
