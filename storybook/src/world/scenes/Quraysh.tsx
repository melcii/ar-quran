// Quraysh (106): two resting caravans by a desert road, one with heavy wraps
// for winter and one with light shades for summer (106:2); a well and baskets
// of food (106:4); and, far off in a valley, the House of 106:3, shown simply
// and only from a distance. No people are shown.
import { useMemo } from 'react';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat } from './kit';
import { Caravan, Well } from './Yusuf';

export function QurayshScene({ land, stops }: SceneProps) {
  const winter = stopNamed(stops, 'Winter Caravan');
  const summer = stopNamed(stops, 'Summer Caravan');
  const house = stopNamed(stops, 'Lord of this House');
  const fed = stopNamed(stops, 'Fed and Safe');
  return (
    <group>
      {winter && (
        <group>
          <Caravan land={land} at={winter.pos} />
          <Wraps position={beside(land, winter.pos, 3, 1)} />
        </group>
      )}
      {summer && (
        <group>
          <Caravan land={land} at={summer.pos} />
          <Shade position={beside(land, summer.pos, 3, 0.8)} />
        </group>
      )}
      {house && <FarHouse position={beside(land, house.pos, 0, -70)} />}
      {fed && (
        <group>
          <Well position={beside(land, fed.pos, 4, -2.5)} />
          <Baskets position={beside(land, fed.pos, 6.5, -0.5)} />
        </group>
      )}
    </group>
  );
}

/** Folded heavy wool wraps, stacked by the winter camp. */
function Wraps({ position }: { position: [number, number, number] }) {
  const cols = ['#5a3a3a', '#3a4a5a', '#6a5a3a'];
  return (
    <group position={position}>
      {cols.map((c, i) => (
        <mesh key={c} position={[0, 0.15 + i * 0.28, 0]} rotation={[0, i * 0.3, 0]} castShadow>
          <boxGeometry args={[1.1, 0.26, 0.8]} />
          <meshStandardMaterial color={c} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** A light cloth shade on four poles, for the summer camp. */
function Shade({ position }: { position: [number, number, number] }) {
  const pole = useMemo(() => mat('#6b4a2e', 0.8), []);
  return (
    <group position={position}>
      {[
        [-1.2, -1],
        [1.2, -1],
        [-1.2, 1],
        [1.2, 1],
      ].map(([x, z], i) => (
        <mesh key={i} material={pole} position={[x, 1.1, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 2.2, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 2.2, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[2.8, 2.4]} />
        <meshStandardMaterial color="#f2ead8" side={2} roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Seen only from far away: a simple cube house with a band, in a valley. */
function FarHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[4.5, 5, 4]} />
        <meshStandardMaterial color="#1c1a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.9, 0]}>
        <boxGeometry args={[4.56, 0.35, 4.06]} />
        <meshStandardMaterial color="#b8984a" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

function Baskets({ position }: { position: [number, number, number] }) {
  const weave = useMemo(() => mat('#b08a50'), []);
  const fills = ['#6a3a22', '#e0c070', '#8a4a2a'];
  return (
    <group position={position}>
      {fills.map((c, i) => (
        <group key={c} position={[i * 1.1 - 1.1, 0, (i % 2) * 0.5]}>
          <mesh material={weave} position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.35, 0.5, 14]} />
          </mesh>
          <mesh position={[0, 0.5, 0]} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[0.42, 14, 8]} />
            <meshStandardMaterial color={c} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
