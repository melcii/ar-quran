// Al-Inshiqaq (84): the oaths of 84:16-19. A twilight glow lingering on the
// horizon, a large full moon rising, and a row of eight stones carved with the
// moon's phases, state after state. The events of 84:1-15 are not pictured. No
// person is shown.
import { useMemo } from 'react';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { HorizonGlow, NightLight, SkyDisc } from './common';
import { beside, mat } from './kit';

export function InshiqaqScene({ land, stops }: SceneProps) {
  const glow = stopNamed(stops, 'Twilight Glow');
  const moon = stopNamed(stops, 'Full Moon');
  const phases = stopNamed(stops, 'State After State');
  return (
    <group>
      <NightLight />
      {glow && <HorizonGlow position={beside(land, glow.pos, 0, 0)} color="#ff9a60" />}
      {moon && <SkyDisc position={beside(land, moon.pos, 15, 0)} color="#f4f0e0" glow="#c8d0e8" radius={6} />}
      {phases && <PhaseStones position={beside(land, phases.pos, 3.5, -2)} />}
    </group>
  );
}

/** Eight upright stones, each with the lit part of the moon in pale inlay. */
function PhaseStones({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#5a5a66'), []);
  return (
    <group position={position} rotation={[0, -Math.PI / 2 + 0.2, 0]}>
      {Array.from({ length: 8 }, (_, i) => {
        // Phase 0 = new, 4 = full. The lit part is drawn as a disc partly covered by a dark disc.
        const d = 0.56 * (i <= 4 ? i / 4 : (8 - i) / 4); // how far the shadow disc has slid off
        return (
          <group key={i} position={[(i - 3.5) * 1.1, 0, 0]}>
            <mesh material={stone} position={[0, 0.75, 0]} castShadow>
              <boxGeometry args={[0.9, 1.5, 0.25]} />
            </mesh>
            <mesh position={[0, 1.0, 0.13]}>
              <circleGeometry args={[0.28, 24]} />
              <meshBasicMaterial color="#efeadb" />
            </mesh>
            {i !== 4 && (
              <mesh position={[(i < 4 ? -1 : 1) * d, 1.0, 0.135]}>
                <circleGeometry args={[0.29, 24]} />
                <meshBasicMaterial color="#5a5a66" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
