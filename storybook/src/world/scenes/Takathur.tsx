// At-Takathur (102): towers of stacked crates and jars beside the path, each
// stacked higher than the last, a picture of competing for more (102:1), and
// a quiet walled graveyard with plain stones (102:2). No person is shown; the
// Fire and the Day are not pictured.
import { useMemo } from 'react';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type V } from './kit';

export function TakathurScene({ land, stops }: SceneProps) {
  const towers = stopNamed(stops, 'Towers of More');
  const yard = stopNamed(stops, 'The Quiet Graveyard');
  return (
    <group>
      {towers && <Towers land={land} at={towers.pos} />}
      {yard && <Graveyard land={land} at={yard.pos} />}
    </group>
  );
}

function Towers({ land, at }: { land: Land; at: V }) {
  const crate = useMemo(() => mat('#a07848'), []);
  const crate2 = useMemo(() => mat('#86603a'), []);
  const jar = useMemo(() => mat('#b0643a', 0.85), []);
  const towers = useMemo(() => {
    const r = rng(102);
    return [3, 5, 7, 9, 11].map((h, i) => ({ dx: 3 + i * 1.8, dz: -2 - i * 1.4, h, j: Array.from({ length: h }, () => [(r() - 0.5) * 0.15, (r() - 0.5) * 0.3] as const) }));
  }, []);
  return (
    <group>
      {towers.map((t, i) => (
        <group key={i} position={beside(land, at, t.dx, t.dz)}>
          {t.j.map(([dx, ry], k) => (
            <mesh key={k} material={k % 2 ? crate : crate2} position={[dx, 0.35 + k * 0.7, 0]} rotation={[0, ry, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.9, 0.68, 0.9]} />
            </mesh>
          ))}
          <mesh material={jar} position={[0, t.h * 0.7 + 0.3, 0]} castShadow>
            <sphereGeometry args={[0.32, 12, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Graveyard({ land, at }: { land: Land; at: V }) {
  const stone = useMemo(() => mat('#bdb5a6'), []);
  const wall = useMemo(() => mat('#a89c88'), []);
  const cx = 6;
  const cz = -5;
  const W = 8;
  const D = 6;
  const stones = useMemo(() => {
    const r = rng(1022);
    const s: [number, number, number][] = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if (r() > 0.2) s.push([cx - 2.6 + i * 1.7 + (r() - 0.5) * 0.3, cz - 1.6 + j * 1.6, r() * 0.2]);
    return s;
  }, []);
  const walls: [number, number, number, number][] = [
    [cx, cz - D / 2, W, 0.3],
    [cx - W / 2, cz, 0.3, D],
    [cx + W / 2, cz, 0.3, D],
    [cx - W / 4 - 0.6, cz + D / 2, W / 2 - 1.2, 0.3],
    [cx + W / 4 + 0.6, cz + D / 2, W / 2 - 1.2, 0.3],
  ];
  return (
    <group>
      {walls.map(([x, z, w, d], i) => {
        const p = beside(land, at, x, z);
        return (
          <mesh key={i} material={wall} position={[p[0], p[1] + 0.4, p[2]]} castShadow receiveShadow>
            <boxGeometry args={[w, 0.8, d]} />
          </mesh>
        );
      })}
      {stones.map(([x, z, ry], i) => {
        const p = beside(land, at, x, z);
        return (
          <mesh key={i} material={stone} position={[p[0], p[1] + 0.25, p[2]]} rotation={[0, ry, 0]} castShadow>
            <boxGeometry args={[0.35, 0.5, 0.12]} />
          </mesh>
        );
      })}
    </group>
  );
}
