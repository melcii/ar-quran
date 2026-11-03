// Al-Kafirun (109): four pairs of standing stones, one pair for each of the
// ayahs that answer each other (109:2-5), and a path that divides into two
// paths running side by side to the horizon without crossing (109:6). No
// people are shown.
import { useMemo, type ReactElement } from 'react';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, type V } from './kit';

export function KafirunScene({ land, stops }: SceneProps) {
  const stones = stopNamed(stops, 'The Paired Stones');
  const paths = stopNamed(stops, 'Two Paths');
  return (
    <group>
      {stones && <PairedStones land={land} at={stones.pos} />}
      {paths && <TwoPaths land={land} at={paths.pos} />}
    </group>
  );
}

function PairedStones({ land, at }: { land: Land; at: V }) {
  const a = useMemo(() => mat('#cfc6b4'), []);
  const b = useMemo(() => mat('#8f9aa6'), []);
  return (
    <group>
      {[0, 1, 2, 3].map((k) =>
        [0, 1].map((side) => (
          <mesh
            key={`${k}${side}`}
            material={side ? b : a}
            position={beside(land, at, 3 + side * 1.6, -1 - k * 2.2).map((v, i) => (i === 1 ? v + 0.9 : v)) as [number, number, number]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.7, 1.8, 0.35]} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Two paved paths, a low wall between them, running straight on for a long way. */
function TwoPaths({ land, at }: { land: Land; at: V }) {
  const paveA = useMemo(() => mat('#d8c8a0'), []);
  const paveB = useMemo(() => mat('#a8b0b8'), []);
  const wall = useMemo(() => mat('#9a8f80'), []);
  const segs = 24;
  const out: ReactElement[] = [];
  for (let i = 0; i < segs; i++) {
    const dz = -2 - i * 2;
    const spread = Math.min(1, i / 4) * 1.4;
    [
      [-spread - 0.4, paveA],
      [spread + 0.4, paveB],
    ].forEach(([dx, m], s) => {
      const p = beside(land, at, 5 + (dx as number), dz);
      out.push(
        <mesh key={`${i}${s}`} material={m as typeof paveA} position={[p[0], p[1] + 0.04, p[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.4, 2.05]} />
        </mesh>,
      );
    });
    if (i >= 3) {
      const p = beside(land, at, 5, dz);
      out.push(
        <mesh key={`w${i}`} material={wall} position={[p[0], p[1] + 0.25, p[2]]} castShadow>
          <boxGeometry args={[0.25, 0.5, 2.05]} />
        </mesh>,
      );
    }
  }
  return <group>{out}</group>;
}
