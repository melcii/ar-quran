// Al-Falaq (113): a ridge with stone seats facing daybreak (113:1), and a
// hollow among rocks where darkness settles (113:3), with three lanterns to
// light. Nothing unseen is pictured; no person, knot or envier is shown.
import { useMemo, useState } from 'react';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, tapOnly, type V } from './kit';

export function FalaqScene({ land, stops, complete, hint }: SceneProps) {
  const ridge = stopNamed(stops, 'Daybreak Ridge');
  const hollow = stopNamed(stops, 'Settling Darkness');
  return (
    <group>
      {ridge && <Lookout position={beside(land, ridge.pos, 3.5, -3)} />}
      {hollow && (
        <Hollow
          land={land}
          at={hollow.pos}
          onLit={() => (complete('Light the hollow'), hint('All three lanterns are lit. "I seek refuge in the Lord of daybreak" (113:1).'))}
          hint={hint}
        />
      )}
    </group>
  );
}

/** A flat stone lookout with three seats, all facing the same way: ahead, toward the light. */
export function Lookout({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#d8c8b0'), []);
  return (
    <group position={position}>
      <mesh material={stone} position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[2.6, 2.8, 0.3, 28]} />
      </mesh>
      {[-1.2, 0, 1.2].map((x) => (
        <mesh key={x} material={stone} position={[x, 0.5, 0.6]} castShadow>
          <boxGeometry args={[0.8, 0.4, 0.5]} />
        </mesh>
      ))}
    </group>
  );
}

/** A ring of tall dark rocks with three lanterns on posts. Tap each to light it. */
function Hollow({ land, at, onLit, hint }: { land: Land; at: V; onLit: () => void; hint: (t: string) => void }) {
  const [lit, setLit] = useState<number[]>([]);
  const rock = useMemo(() => mat('#4a4650'), []);
  const rocks = useMemo(() => {
    const r = rng(113);
    return Array.from({ length: 11 }, (_, i) => {
      const a = 3.4 + (i / 10) * Math.PI * 1.55; // open on the side facing the path
      return { a, h: 1.4 + r() * 1.6, s: 0.8 + r() * 0.6 };
    });
  }, []);
  const light = (i: number) =>
    tapOnly(() => {
      if (lit.includes(i)) return;
      const next = [...lit, i];
      setLit(next);
      if (next.length === 3) onLit();
      else hint(`${3 - next.length} more lantern${3 - next.length > 1 ? 's' : ''} to light.`);
    });
  const cx = 5;
  const cz = -4;
  return (
    <group>
      {rocks.map(({ a, h, s }, i) => (
        <mesh key={i} material={rock} position={beside(land, at, cx + Math.cos(a) * 5, cz + Math.sin(a) * 5)} scale={[s, h, s]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      {[
        [cx - 1.6, cz + 0.8],
        [cx + 0.6, cz - 1.4],
        [cx + 1.8, cz + 1],
      ].map(([x, z], i) => {
        const on = lit.includes(i);
        return (
          <group key={i} position={beside(land, at, x, z)} onClick={light(i)}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.06, 1.2, 6]} />
              <meshStandardMaterial color="#2a2420" />
            </mesh>
            <mesh position={[0, 1.35, 0]}>
              <boxGeometry args={[0.36, 0.42, 0.36]} />
              <meshStandardMaterial color={on ? '#ffd890' : '#5a5048'} emissive={on ? '#ffb040' : '#000000'} emissiveIntensity={on ? 2.5 : 0} />
            </mesh>
            {on && <pointLight position={[0, 1.5, 0]} color="#ffb860" intensity={5} distance={6} />}
          </group>
        );
      })}
    </group>
  );
}
