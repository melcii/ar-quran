// Al-Mutaffifin (83): a morning market stall with a pair of honest scales and
// brass weights (83:3), and sacks of grain beside an empty wooden measure that
// can be filled right to the brim (83:2). No person is shown; the Day, the
// registers and the next life (83:4-36) are not pictured.
import { useMemo, useState } from 'react';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, tapOnly } from './kit';

export function MutaffifinScene({ land, stops, complete, hint }: SceneProps) {
  const scales = stopNamed(stops, 'Honest Scales');
  const measure = stopNamed(stops, 'Full Measure');
  return (
    <group>
      {scales && <Stall position={beside(land, scales.pos, 4, -2.5)} />}
      {measure && (
        <Measure
          position={beside(land, measure.pos, 3.5, -2)}
          onFull={() => (complete('Fill the measure'), hint('Full to the brim. Give full measure and weight (83:1-3).'))}
          hint={hint}
        />
      )}
    </group>
  );
}

function Stall({ position }: { position: [number, number, number] }) {
  const wood = useMemo(() => mat('#7a5634', 0.8), []);
  const brass = useMemo(() => mat('#c8a050', 0.35, 0.8), []);
  return (
    <group position={position} rotation={[0, -0.3, 0]}>
      <mesh material={wood} position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.1, 1.2]} />
      </mesh>
      <mesh material={wood} position={[0, 0.45, -0.55]}>
        <boxGeometry args={[2.6, 0.9, 0.08]} />
      </mesh>
      {[-1.25, 1.25].map((x) =>
        [-0.55, 0.55].map((z) => (
          <mesh key={`${x}${z}`} material={wood} position={[x, 1.2, z]} castShadow>
            <boxGeometry args={[0.08, 2.4, 0.08]} />
          </mesh>
        )),
      )}
      <mesh position={[0, 2.45, 0]} rotation={[-Math.PI / 2 + 0.15, 0, 0]} castShadow>
        <planeGeometry args={[2.9, 1.5]} />
        <meshStandardMaterial color="#d8b060" side={2} roughness={0.9} />
      </mesh>
      {/* Level balance: post, beam, two pans on cords. */}
      <group position={[-0.3, 0.95, 0]}>
        <mesh material={brass} position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.03, 0.06, 0.9, 8]} />
        </mesh>
        <mesh material={brass} position={[0, 0.9, 0]}>
          <boxGeometry args={[1, 0.03, 0.03]} />
        </mesh>
        {[-0.48, 0.48].map((x) => (
          <group key={x} position={[x, 0.5, 0]}>
            <mesh material={brass}>
              <cylinderGeometry args={[0.2, 0.15, 0.03, 16]} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.4, 3]} />
              <meshStandardMaterial color="#555" />
            </mesh>
            <mesh material={brass} position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.05, 0.06, 0.1, 10]} />
            </mesh>
          </group>
        ))}
      </group>
      {[0.6, 0.78, 0.92].map((x, i) => (
        <mesh key={x} material={brass} position={[x, 0.98, 0.2]}>
          <cylinderGeometry args={[0.05 - i * 0.012, 0.06 - i * 0.012, 0.12 - i * 0.03, 10]} />
        </mesh>
      ))}
    </group>
  );
}

/** A grain sack and a wooden measure. Each tap on the sack pours some in; three fill it to the brim. */
function Measure({ position, onFull, hint }: { position: [number, number, number]; onFull: () => void; hint: (t: string) => void }) {
  const [level, setLevel] = useState(0);
  const sack = useMemo(() => mat('#c8b080', 1), []);
  const wood = useMemo(() => mat('#8a6440', 0.8), []);
  const grain = useMemo(() => mat('#d8b860', 0.9), []);
  const pour = tapOnly(() => {
    if (level >= 3) return;
    const next = level + 1;
    setLevel(next);
    if (next === 3) onFull();
    else hint(next === 1 ? 'Keep going: the measure is not full yet.' : 'Almost full. One more.');
  });
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={sack} position={[1.2 + i * 0.7, 0.45, (i % 2) * 0.4]} scale={[0.4, 0.5, 0.35]} onClick={pour} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ))}
      <mesh material={wood} position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.6, 20, 1, true]} />
      </mesh>
      <mesh material={wood} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.04, 20]} />
      </mesh>
      {level > 0 && (
        <mesh material={grain} position={[0, 0.04 + level * 0.09, 0]}>
          <cylinderGeometry args={[0.38, 0.38, level * 0.18, 20]} />
        </mesh>
      )}
      {level === 3 && (
        <mesh material={grain} position={[0, 0.6, 0]} scale={[1, 0.25, 1]}>
          <sphereGeometry args={[0.38, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      )}
    </group>
  );
}
