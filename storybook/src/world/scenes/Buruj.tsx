// Al-Buruj (85): large bright stars low over the path (85:1); an old empty
// trench overgrown with grass, long after the events of 85:4-8, with no fire and
// no people; and a reading stand with a closed, covered book for the honoured
// Quran (85:21). The Preserved Slate (85:22) is not pictured.
import { useMemo } from 'react';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { ReadingStand } from './Bayyinah';
import { beside, mat, rng, type V } from './kit';

export function BurujScene({ land, stops }: SceneProps) {
  const stars = stopNamed(stops, 'Great Stars');
  const trench = stopNamed(stops, 'The Trench');
  const quran = stopNamed(stops, 'The Honoured Quran');
  return (
    <group>
      {stars && <GreatStars at={stars.pos} />}
      {trench && <Trench land={land} at={trench.pos} />}
      {quran && <ReadingStand position={beside(land, quran.pos, 3.5, -2.5)} />}
    </group>
  );
}

function GreatStars({ at }: { at: V }) {
  const stars = useMemo(() => {
    const r = rng(85);
    return Array.from({ length: 12 }, () => [at.x + (r() - 0.5) * 120, 30 + r() * 30, at.z - 60 - r() * 40, 0.5 + r() * 0.6] as const);
  }, [at]);
  return (
    <group>
      {stars.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[s, 10, 8]} />
          <meshBasicMaterial color={i % 3 ? '#fff6e0' : '#d8e4ff'} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

/** A long, grassed-over ditch, shown by two raised earth banks with a green floor between them. */
function Trench({ land, at }: { land: Land; at: V }) {
  const grass = useMemo(() => mat('#4a6a3a'), []);
  const bank = useMemo(() => mat('#6a5a40'), []);
  const segs = 8;
  return (
    <group>
      {Array.from({ length: segs }, (_, i) => {
        const p = beside(land, at, 5.5, -1 - i * 1.5);
        return (
          <group key={i} position={p}>
            <mesh material={grass} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[1.6, 1.52]} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} material={bank} position={[s * 1.3, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.55]} castShadow receiveShadow>
                <cylinderGeometry args={[0.6, 0.6, 1.52, 10, 1, false, 0, Math.PI]} />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* A line of stones along each edge of the ditch. */}
      {Array.from({ length: 18 }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        const p = beside(land, at, 5.5 + side * 2.05, -1 - Math.floor(i / 2) * 1.4);
        return (
          <mesh key={`s${i}`} position={[p[0], p[1] + 0.1, p[2]]} scale={0.25}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#8a8070" />
          </mesh>
        );
      })}
    </group>
  );
}
