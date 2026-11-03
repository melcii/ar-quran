// At-Takwir (81): the oaths of 81:15-18. Stars running low and slipping below
// the horizon, mirrored in a still pool; a dark grove where the night closes
// in; and a dawn glow with grass moving in a soft breeze, the dawn as it
// breathes. The events of 81:1-14 are not pictured. No person is shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { HorizonGlow } from './common';
import { beside, mat, rng, type V } from './kit';
import { MoonPool } from './Shams';

export function TakwirScene({ land, stops }: SceneProps) {
  const stars = stopNamed(stops, 'Retreating Stars');
  const night = stopNamed(stops, 'Night Closing In');
  const dawn = stopNamed(stops, 'Dawn Breathing');
  return (
    <group>
      {stars && (
        <group>
          <SettingStars at={stars.pos} />
          <MoonPool position={beside(land, stars.pos, 4, -3)} />
        </group>
      )}
      {night && <DarkGrove land={land} at={night.pos} />}
      {dawn && (
        <group>
          <HorizonGlow position={beside(land, dawn.pos, 0, 0)} color="#ffc890" />
          <Breeze land={land} at={dawn.pos} />
        </group>
      )}
    </group>
  );
}

/** A few bright stars that sink slowly toward the horizon and fade, then rise again. */
function SettingStars({ at }: { at: V }) {
  const g = useRef<THREE.Group>(null);
  const stars = useMemo(() => {
    const r = rng(815);
    return Array.from({ length: 10 }, () => [(r() - 0.5) * 100, r(), 0.3 + r() * 0.4] as const);
  }, []);
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      const [, ph] = stars[i];
      const t = (clock.elapsedTime / 60 + ph) % 1;
      c.position.y = 30 - t * 32;
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = t < 0.85 ? 1 : (1 - t) / 0.15;
    });
  });
  return (
    <group ref={g} position={[at.x, 0, at.z - 90]}>
      {stars.map(([x, , s], i) => (
        <mesh key={i} position={[x, 20, 0]}>
          <sphereGeometry args={[s, 8, 6]} />
          <meshBasicMaterial color="#f4f0ff" transparent fog={false} />
        </mesh>
      ))}
    </group>
  );
}

function DarkGrove({ land, at }: { land: Land; at: V }) {
  const bark = useMemo(() => mat('#2a2420'), []);
  const leaf = useMemo(() => mat('#1a2a22'), []);
  const trees = useMemo(() => {
    const r = rng(817);
    return Array.from({ length: 12 }, () => ({ dx: 3 + r() * 8, dz: -1 - r() * 8, s: 0.9 + r() * 0.6 }));
  }, []);
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={beside(land, at, t.dx, t.dz)} scale={t.s}>
          <mesh material={bark} position={[0, 1.6, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.24, 3.2, 7]} />
          </mesh>
          <mesh material={leaf} position={[0, 3.8, 0]} scale={[1.4, 1.6, 1.4]} castShadow>
            <icosahedronGeometry args={[1.2, 1]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Tall grass bending in slow waves, like breathing. */
function Breeze({ land, at }: { land: Land; at: V }) {
  const time = useRef({ value: 0 });
  const mesh = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.03, 1.1, 3, 3);
    geo.translate(0, 0.55, 0);
    const m = new THREE.MeshStandardMaterial({ color: '#8a9a5a', roughness: 0.9 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = time.current;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float h = position.y / 1.1;
        vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float s = 0.5 + 0.5 * sin(uTime * 0.9 - wp.z * 0.4);
        transformed.x += s * 0.35 * h * h;`,
      );
    };
    const n = 700;
    const im = new THREE.InstancedMesh(geo, m, n);
    const r = rng(818);
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      const x = at.x + (r() > 0.5 ? 1 : -1) * (1.6 + r() * 6);
      const z = at.z + 3 - r() * 14;
      o.position.set(x, land.height(x, z), z);
      o.rotation.y = r() * 6;
      o.scale.setScalar(0.7 + r() * 0.6);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    }
    return im;
  }, [land, at]);
  useFrame(({ clock }) => {
    time.current.value = clock.elapsedTime;
  });
  return <primitive object={mesh} />;
}
