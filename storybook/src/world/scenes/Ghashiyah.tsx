// Al-Ghashiyah (88): a walk past the four things 88:17-20 asks us to look at:
// resting camels, a high platform for the raised sky, tall mountains and a
// wide plain spread out to the horizon. The Day and the Garden (88:1-16) are
// not pictured. No person is shown.
import { useMemo } from 'react';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat } from './kit';
import { Caravan } from './Yusuf';

export function GhashiyahScene({ land, stops }: SceneProps) {
  const camels = stopNamed(stops, 'Camels');
  const sky = stopNamed(stops, 'Raised Sky');
  const mountains = stopNamed(stops, 'Erected Mountains');
  const earth = stopNamed(stops, 'Spread Earth');
  return (
    <group>
      {camels && <Caravan land={land} at={camels.pos} />}
      {sky && <SkyPlatform position={beside(land, sky.pos, 4, -3)} />}
      {mountains && <Peaks position={beside(land, mountains.pos, 10, -40)} />}
      {earth && <Plain position={beside(land, earth.pos, 3, -2)} />}
    </group>
  );
}

/** A raised round platform with steps and a low rail, for looking up. */
export function SkyPlatform({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#e0d0b0'), []);
  return (
    <group position={position}>
      <mesh material={stone} position={[0, 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2.2, 2, 24]} />
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} material={stone} position={[-2.4, 0.25 + k * 0.5, 0.6 - k * 0.5]} castShadow>
          <boxGeometry args={[0.9, 0.5 + k * 1.0, 0.5]} />
        </mesh>
      ))}
      <mesh material={stone} position={[0, 2.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.95, 0.06, 6, 32]} />
      </mesh>
    </group>
  );
}

export function Peaks({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[
        [0, 0, 10, 30],
        [-14, 6, 8, 22],
        [13, -4, 9, 26],
      ].map(([x, z, r, h], i) => (
        <mesh key={i} position={[x, h / 2 - 2, z]}>
          <coneGeometry args={[r, h, 6]} />
          <meshStandardMaterial color={['#7a6a5a', '#8a7866', '#6e6050'][i]} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** A low wall with a viewing gap, looking out over open land. */
function Plain({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#c8b48e'), []);
  return (
    <group position={position}>
      {[-1.8, 1.8].map((x) => (
        <mesh key={x} material={stone} position={[x, 0.45, 0]} castShadow>
          <boxGeometry args={[2.2, 0.9, 0.4]} />
        </mesh>
      ))}
    </group>
  );
}
