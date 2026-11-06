// Al-Balad (90): the path forks into two ways (90:10), an easy path that
// wanders off and a steep, narrow pass between rocks with rough steps (90:11);
// at the top of the pass a table is set for feeding on a day of hunger (90:14).
// No person is shown; the fire (90:20) is not pictured.
import { useMemo } from 'react';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type V } from './kit';
import { BreadTable } from './Maun';

export function BaladScene({ land, stops, hint }: SceneProps) {
  const fork = stopNamed(stops, 'Two Ways');
  const pass = stopNamed(stops, 'The Difficult Pass');
  const feed = stopNamed(stops, 'Feeding in Hunger');
  return (
    <group>
      {fork && <Fork land={land} at={fork.pos} />}
      {pass && <Pass land={land} at={pass.pos} />}
      {feed && <BreadTable position={beside(land, feed.pos, 4, -2.5)} hint={hint} />}
    </group>
  );
}

/** A signpost where a side path splits off: one arm points to the easy way, one up to the steep way. */
function Fork({ land, at }: { land: Land; at: V }) {
  const wood = useMemo(() => mat('#6a4a2e', 0.8), []);
  const pave = useMemo(() => mat('#d4c09a'), []);
  const p = beside(land, at, 2.5, -1.5);
  const steps = Array.from({ length: 10 }, (_, i) => beside(land, at, 3 + i * 1.3, -2 - i * 0.6));
  return (
    <group>
      <group position={p}>
        <mesh material={wood} position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 2.2, 8]} />
        </mesh>
        <mesh material={wood} position={[0.4, 1.8, 0]} rotation={[0, 0.4, 0.1]}>
          <boxGeometry args={[0.9, 0.22, 0.05]} />
        </mesh>
        <mesh material={wood} position={[-0.3, 1.45, 0]} rotation={[0, -0.6, -0.15]}>
          <boxGeometry args={[0.8, 0.22, 0.05]} />
        </mesh>
      </group>
      {steps.map((s, i) => (
        <mesh key={i} material={pave} position={[s[0], s[1] + 0.03, s[2]]} rotation={[-Math.PI / 2, 0, -0.43]} receiveShadow>
          <planeGeometry args={[1.4, 1.1]} />
        </mesh>
      ))}
    </group>
  );
}

/** Two walls of tall rock with a narrow climb of rough steps between them. */
function Pass({ land, at }: { land: Land; at: V }) {
  const rock = useMemo(() => mat('#86786a'), []);
  const step = useMemo(() => mat('#a49888'), []);
  const rocks = useMemo(() => {
    const r = rng(90);
    return Array.from({ length: 12 }, (_, i) => ({ side: i % 2 ? 1 : -1, dz: -1 - Math.floor(i / 2) * 1.6, h: 3 + r() * 3, s: 1 + r() * 0.6 }));
  }, []);
  return (
    <group>
      {rocks.map((k, i) => (
        <mesh key={i} material={rock} position={beside(land, at, 5 + k.side * 1.9, k.dz)} scale={[k.s, k.h, k.s * 1.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => {
        const p = beside(land, at, 5, -0.5 - i * 1.2);
        return (
          <mesh key={i} material={step} position={[p[0], p[1] + 0.12 + i * 0.22, p[2]]} castShadow receiveShadow>
            <boxGeometry args={[1.6, 0.24 + i * 0.44, 1.2]} />
          </mesh>
        );
      })}
    </group>
  );
}
