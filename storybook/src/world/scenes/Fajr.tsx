// Al-Fajr (89): a lookout facing the dawn (89:1); weathered ruins of very tall
// pillars, an artistic stand-in for Iram (89:7); and a rock valley with carved
// doorways for Thamud (89:9). Empty and quiet, not the real places. No person
// is shown; the punishment (89:13) and the Day (89:21-26) are not pictured.
import { useMemo } from 'react';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { CarvedCliff } from './common';
import { Lookout } from './Falaq';
import { beside, mat, rng, type V } from './kit';

export function FajrScene({ land, stops }: SceneProps) {
  const dawn = stopNamed(stops, 'Dawn Lookout');
  const pillars = stopNamed(stops, 'Lofty Pillars');
  const rocks = stopNamed(stops, 'Carved Rocks');
  return (
    <group>
      {dawn && <Lookout position={beside(land, dawn.pos, 3.5, -3)} />}
      {pillars && <Pillars land={land} at={pillars.pos} />}
      {rocks && <CarvedCliff position={beside(land, rocks.pos, 7, -10)} rotation={-0.35} seed={89} />}
    </group>
  );
}

function Pillars({ land, at }: { land: Land; at: V }) {
  const stone = useMemo(() => mat('#cdb48a'), []);
  const cols = useMemo(() => {
    const r = rng(897);
    return Array.from({ length: 8 }, (_, i) => ({ dx: 4 + (i % 4) * 2.6, dz: -3 - Math.floor(i / 4) * 3.5, h: i % 3 === 1 ? 3 + r() * 3 : 12 + r() * 5, tilt: (r() - 0.5) * 0.06 }));
  }, []);
  const base = beside(land, at, 7.9, -4.75);
  return (
    <group>
      <mesh material={stone} position={[base[0], base[1] + 0.3, base[2]]} receiveShadow castShadow>
        <boxGeometry args={[11, 0.6, 6]} />
      </mesh>
      {cols.map((c, i) => {
        const p = beside(land, at, c.dx, c.dz);
        return (
          <group key={i} position={[p[0], base[1] + 0.6, p[2]]} rotation={[c.tilt, 0, c.tilt]}>
            <mesh material={stone} position={[0, c.h / 2, 0]} castShadow>
              <cylinderGeometry args={[0.5, 0.6, c.h, 12]} />
            </mesh>
            <mesh material={stone} position={[0, 0.2, 0]}>
              <boxGeometry args={[1.5, 0.4, 1.5]} />
            </mesh>
            {c.h > 8 && (
              <mesh material={stone} position={[0, c.h + 0.2, 0]}>
                <boxGeometry args={[1.4, 0.4, 1.4]} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
