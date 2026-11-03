// An-Nazi'at (79): creation signs of 79:27-32. A high platform under the wide
// raised sky (79:28), a spring bubbling into green pasture (79:31) and
// mountains set firmly around the valley (79:32). The story of 79:15-26 is
// only read, not shown, and the Day (79:34-46) is not pictured. No person is
// shown.
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { Spring } from './Bayyinah';
import { Peaks, SkyPlatform } from './Ghashiyah';
import { beside, rng, type V } from './kit';

export function NaziatScene({ land, stops }: SceneProps) {
  const sky = stopNamed(stops, 'Raised Ceiling');
  const water = stopNamed(stops, 'Water and Pasture');
  const mountains = stopNamed(stops, 'Firm Mountains');
  return (
    <group>
      {sky && <SkyPlatform position={beside(land, sky.pos, 4, -3)} />}
      {water && (
        <group>
          <Spring position={beside(land, water.pos, 4, -3)} />
          <Pasture land={land} at={water.pos} />
        </group>
      )}
      {mountains && <Peaks position={beside(land, mountains.pos, 12, -45)} />}
    </group>
  );
}

function Pasture({ land, at }: { land: Land; at: V }) {
  const mesh = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.03, 0.5, 3);
    geo.translate(0, 0.25, 0);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#6ab048' }), 700);
    const r = rng(7931);
    const o = new THREE.Object3D();
    for (let i = 0; i < 700; i++) {
      const a = r() * 6.28;
      const rad = 2.6 + r() * 4;
      const x = at.x + 4 + Math.cos(a) * rad;
      const z = at.z - 3 + Math.sin(a) * rad;
      o.position.set(x, land.height(x, z), z);
      o.rotation.y = r() * 6;
      o.scale.setScalar(0.7 + r() * 0.8);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    return m;
  }, [land, at]);
  return <primitive object={mesh} />;
}
