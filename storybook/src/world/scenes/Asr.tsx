// Al-'Asr (103): a late-afternoon plain of sand. A great hourglass pours at
// the first place, "By time" (103:1); footprints fade across the plain of
// loss (103:2); and four gates stand at the last place, one for each quality
// the surah names in 103:3. The gates hold no figures or writing.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';

const LOOP = 90; // seconds for the hourglass to run through

export function AsrScene({ land, stops }: SceneProps) {
  const glass = stopNamed(stops, 'Hourglass Plain');
  const loss = stopNamed(stops, 'Plain of Loss');
  const gates = stopNamed(stops, 'Four Gates');
  return (
    <group>
      {glass && <Hourglass land={land} near={glass.pos} />}
      {loss && <FadingSteps land={land} center={loss.pos} />}
      {gates && <Gates land={land} near={gates.pos} />}
    </group>
  );
}

function Hourglass({ land, near }: { land: Land; near: THREE.Vector3 }) {
  const x = near.x + 5;
  const z = near.z - 3;
  const y = land.height(x, z);
  const top = useRef<THREE.Mesh>(null);
  const bottom = useRef<THREE.Mesh>(null);
  const stream = useRef<THREE.Mesh>(null);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b4a2e', roughness: 0.7 }), []);
  const sand = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9b46a', roughness: 1 }), []);
  useFrame(({ clock }) => {
    const k = (clock.elapsedTime % LOOP) / LOOP; // share of sand that has fallen
    if (top.current) {
      top.current.scale.set(Math.sqrt(1 - k) + 0.001, 1 - k + 0.001, Math.sqrt(1 - k) + 0.001);
    }
    if (bottom.current) bottom.current.scale.set(Math.sqrt(k) + 0.001, k + 0.001, Math.sqrt(k) + 0.001);
    if (stream.current) stream.current.visible = k < 0.995;
  });
  const H = 2.4; // height of each bulb
  const topSand = useMemo(() => {
    const g = new THREE.ConeGeometry(1.2, H * 0.85, 32);
    g.translate(0, -H * 0.425, 0);
    g.rotateX(Math.PI);
    return g;
  }, []);
  const bottomSand = useMemo(() => {
    const g = new THREE.ConeGeometry(1.3, H * 0.7, 32);
    g.translate(0, H * 0.35, 0);
    return g;
  }, []);
  return (
    <group position={[x, y, z]}>
      {/* Frame */}
      {[0, 2 * H + 0.4].map((py) => (
        <mesh key={py} material={wood} position={[0, py + 0.15, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.9, 1.9, 0.3, 32]} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} material={wood} position={[Math.cos(a) * 1.65, H + 0.2, Math.sin(a) * 1.65]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 2 * H + 0.1, 10]} />
          </mesh>
        );
      })}
      {/* Glass bulbs */}
      <mesh position={[0, H * 1.5 + 0.3, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.4, H, 32, 1, true]} />
        <meshStandardMaterial color="#e8f2f6" transparent opacity={0.22} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, H * 0.5 + 0.3, 0]}>
        <coneGeometry args={[1.4, H, 32, 1, true]} />
        <meshStandardMaterial color="#e8f2f6" transparent opacity={0.22} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Sand: the top cone empties into the bottom one */}
      <group position={[0, H + 0.3, 0]}>
        {/* An upside-down cone with its point at the neck: it shrinks toward the neck as it empties. */}
        <mesh ref={top} material={sand} geometry={topSand} />
      </group>
      <group position={[0, 0.3, 0]}>
        <mesh ref={bottom} material={sand} geometry={bottomSand} />
      </group>
      <mesh ref={stream} material={sand} position={[0, H * 0.65 + 0.3, 0]}>
        <cylinderGeometry args={[0.03, 0.03, H * 0.7, 6]} />
      </mesh>
    </group>
  );
}

/** Footprints across the sand that grow fainter the further they go. */
function FadingSteps({ land, center }: { land: Land; center: THREE.Vector3 }) {
  const group = useMemo(() => {
    const g = new THREE.Group();
    const geo = new THREE.CircleGeometry(0.14, 12);
    geo.rotateX(-Math.PI / 2);
    geo.scale(1, 1, 1.9);
    const n = 30;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const x = center.x - 2 - t * 18 + (i % 2 ? 0.25 : -0.25);
      const z = center.z - 4 - Math.sin(t * 3) * 3;
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#7a5a3a', transparent: true, opacity: 0.55 * (1 - t), depthWrite: false }));
      m.position.set(x, land.height(x, z) + 0.03, z);
      m.rotation.y = Math.PI / 2;
      g.add(m);
    }
    return g;
  }, [land, center]);
  return <primitive object={group} />;
}

/** Four plain stone gates in a row, each with a lamp above. */
function Gates({ land, near }: { land: Land; near: THREE.Vector3 }) {
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d8c7a4', roughness: 0.85 }), []);
  const lamps = ['#ffd27a', '#ffd27a', '#ffd27a', '#ffd27a'];
  return (
    <group>
      {lamps.map((c, i) => {
        const x = near.x - 4.5 + i * 3;
        const z = near.z - 6;
        const y = land.height(x, z);
        return (
          <group key={i} position={[x, y, z]}>
            <mesh material={stone} position={[-0.9, 1.4, 0]} castShadow>
              <boxGeometry args={[0.4, 2.8, 0.5]} />
            </mesh>
            <mesh material={stone} position={[0.9, 1.4, 0]} castShadow>
              <boxGeometry args={[0.4, 2.8, 0.5]} />
            </mesh>
            <mesh material={stone} position={[0, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.9, 0.2, 10, 24, Math.PI]} />
            </mesh>
            <mesh position={[0, 3.95, 0]}>
              <sphereGeometry args={[0.16, 14, 10]} />
              <meshStandardMaterial color="#fff2c8" emissive={c} emissiveIntensity={3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
