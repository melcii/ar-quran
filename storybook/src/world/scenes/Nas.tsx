// An-Nas (114): a lane of tall reeds that rustle in the wind (114:4, the
// whisperer is not pictured: only reeds and wind) leading to a small stone
// shelter with a warm lamp, where the words of refuge are read (114:1).
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type V } from './kit';

export function NasScene({ land, stops, quality }: SceneProps) {
  const refuge = stopNamed(stops, 'The Refuge Shelter');
  const lane = stopNamed(stops, 'Whisper Lane');
  return (
    <group>
      {lane && <Reeds land={land} at={lane.pos} count={Math.round(500 + 900 * quality.vegetation)} />}
      {refuge && <Shelter position={beside(land, refuge.pos, 4, -3)} />}
    </group>
  );
}

/** Tall reeds on both sides of the path, swaying in the wind (vertex sway). */
function Reeds({ land, at, count }: { land: Land; at: V; count: number }) {
  const time = useRef({ value: 0 });
  const mesh = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.04, 2.6, 4, 4);
    geo.translate(0, 1.3, 0);
    const m = new THREE.MeshStandardMaterial({ color: '#a8a060', roughness: 0.9 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = time.current;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float h = position.y / 2.6;
        vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float s = sin(uTime * 1.7 + wp.x * 0.35 + wp.z * 0.2) + 0.4 * sin(uTime * 3.1 + wp.z);
        transformed.x += s * 0.28 * h * h;
        transformed.z += s * 0.12 * h * h;`,
      );
    };
    const im = new THREE.InstancedMesh(geo, m, count);
    const r = rng(114);
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      const x = at.x + side * (1.8 + r() * 4);
      const z = at.z + 10 - r() * 26;
      o.position.set(x, land.height(x, z), z);
      o.rotation.set(0, r() * 6, 0);
      o.scale.setScalar(0.7 + r() * 0.6);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    }
    im.castShadow = true;
    return im;
  }, [land, at, count]);
  useFrame(({ clock }) => {
    time.current.value = clock.elapsedTime;
  });
  return <primitive object={mesh} />;
}

/** A small stone shelter, open at the front, with a lamp and a bench. */
function Shelter({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#bfb39c'), []);
  const wood = useMemo(() => mat('#7a5634', 0.8), []);
  return (
    <group position={position} rotation={[0, -0.9, 0]}>
      <mesh material={stone} position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[4, 0.2, 3.4]} />
      </mesh>
      {[
        [0, 1.4, -1.6, 4, 2.6, 0.25],
        [-1.9, 1.4, 0, 0.25, 2.6, 3.4],
        [1.9, 1.4, 0, 0.25, 2.6, 3.4],
        [0, 2.8, 0, 4.4, 0.25, 3.8],
        [-1.55, 1.4, 1.6, 0.6, 2.6, 0.3],
        [1.55, 1.4, 1.6, 0.6, 2.6, 0.3],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} material={stone} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}
      {/* A shallow dome and a round arch over the opening. */}
      <mesh material={stone} position={[0, 2.9, 0]} castShadow>
        <sphereGeometry args={[1.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={stone} position={[0, 1.55, 1.6]} castShadow>
        <torusGeometry args={[1.1, 0.15, 8, 20, Math.PI]} />
      </mesh>
      <mesh material={wood} position={[0, 0.5, -1.1]} castShadow>
        <boxGeometry args={[2.4, 0.12, 0.5]} />
      </mesh>
      <mesh position={[0, 2.3, -1.2]}>
        <sphereGeometry args={[0.16, 14, 10]} />
        <meshStandardMaterial color="#ffd38a" emissive="#ffb050" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[0, 2.1, -0.8]} color="#ffbf70" intensity={6} distance={7} />
    </group>
  );
}
