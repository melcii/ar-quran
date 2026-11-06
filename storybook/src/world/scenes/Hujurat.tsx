// Al-Hujurat (49): a friendly village of courtyard homes. A gate where news is
// checked before it comes in (49:6); a footbridge between two quarters with
// planks missing, to mend (49:9-10); a street and a lane of quiet homes for
// the manners of 49:11-12; and a market of stalls in many colours where
// peoples and tribes meet (49:13). No person is shown.
import { type ThreeEvent } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';

type V = THREE.Vector3;
function beside(land: Land, at: V, dx: number, dz: number): [number, number, number] {
  const x = at.x + dx;
  const z = at.z + dz;
  return [x, land.height(x, z), z];
}

export function HujuratScene({ land, stops, complete, hint }: SceneProps) {
  const gate = stopNamed(stops, "Messenger's Gate");
  const bridge = stopNamed(stops, 'Peace Bridge');
  const street = stopNamed(stops, 'Mockery-free Street');
  const lane = stopNamed(stops, 'Hidden-whispers Lane');
  const market = stopNamed(stops, 'Market of Nations');
  return (
    <group>
      {gate && <Gate position={beside(land, gate.pos, 3, -2)} />}
      {bridge && (
        <Bridge
          position={beside(land, bridge.pos, 4.5, -3)}
          onMended={() => (complete('Mend the bridge'), hint('The bridge is whole again. "So make settlement between your brothers" (49:10).'))}
          hint={hint}
        />
      )}
      {street && <Homes land={land} at={street.pos} seed={11} />}
      {lane && <Homes land={land} at={lane.pos} seed={12} />}
      {market && <Market land={land} at={market.pos} />}
    </group>
  );
}

const wallMat = () => new THREE.MeshStandardMaterial({ color: '#e8d6b4', roughness: 0.9 });

function Gate({ position }: { position: [number, number, number] }) {
  const mat = useMemo(wallMat, []);
  return (
    <group position={position} rotation={[0, -0.3, 0]}>
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} material={mat} position={[x, 1.6, 0]} castShadow>
          <boxGeometry args={[0.8, 3.2, 0.8]} />
        </mesh>
      ))}
      <mesh material={mat} position={[0, 3.4, 0]} castShadow>
        <boxGeometry args={[4.2, 0.6, 0.9]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.6, 1.3, 0.3]} rotation={[0, s * 0.9, 0]}>
          <boxGeometry args={[1.2, 2.6, 0.08]} />
          <meshStandardMaterial color="#6a4a2e" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** A footbridge over a channel with three planks missing. Tap each gap to lay a plank. */
function Bridge({ position, onMended, hint }: { position: [number, number, number]; onMended: () => void; hint: (t: string) => void }) {
  const N = 9;
  const missing = [2, 4, 6];
  const [laid, setLaid] = useState<number[]>([]);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a6038', roughness: 0.85 }), []);
  const lay = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return;
    e.stopPropagation();
    if (laid.includes(i)) return;
    const next = [...laid, i];
    setLaid(next);
    if (next.length === missing.length) onMended();
    else hint(`${missing.length - next.length} more plank${missing.length - next.length > 1 ? 's' : ''} to mend the bridge.`);
  };
  return (
    <group position={position} rotation={[0, -0.4, 0]}>
      {/* A stone-lined stream crossing under the bridge. */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.4, 10]} />
        <meshStandardMaterial color="#3f7f9a" roughness={0.15} metalness={0.2} />
      </mesh>
      {[-1.35, 1.35].map((x) => (
        <mesh key={x} position={[x, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.35, 0.45, 10]} />
          <meshStandardMaterial color="#9a8f80" roughness={0.95} />
        </mesh>
      ))}
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.4, 2]} />
          <meshStandardMaterial color="#9a8f80" roughness={0.95} />
        </mesh>
      ))}
      {Array.from({ length: N }, (_, i) => {
        const x = -2.4 + (i * 4.8) / (N - 1);
        const y = 0.35 + Math.sin((i / (N - 1)) * Math.PI) * 0.5;
        const gap = missing.includes(i);
        const done = laid.includes(i);
        return (
          <group key={i} position={[x, y, 0]}>
            {(!gap || done) && (
              <mesh material={wood} castShadow receiveShadow>
                <boxGeometry args={[0.52, 0.08, 1.6]} />
              </mesh>
            )}
            {gap && !done && (
              <mesh onClick={lay(i)}>
                <boxGeometry args={[0.52, 0.08, 1.6]} />
                <meshBasicMaterial color="#ffd27a" transparent opacity={0.35} depthWrite={false} />
              </mesh>
            )}
          </group>
        );
      })}
      {/* Posts at every plank and a rail that follows the arch. */}
      {[-0.75, 0.75].map((z) =>
        Array.from({ length: N }, (_, i) => {
          const x = -2.4 + (i * 4.8) / (N - 1);
          const y = 0.35 + Math.sin((i / (N - 1)) * Math.PI) * 0.5;
          const nx = -2.4 + ((i + 1) * 4.8) / (N - 1);
          const ny = 0.35 + Math.sin(((i + 1) / (N - 1)) * Math.PI) * 0.5;
          const len = Math.hypot(nx - x, ny - y);
          return (
            <group key={`${z}${i}`}>
              <mesh material={wood} position={[x, y + 0.3, z]} castShadow>
                <boxGeometry args={[0.07, 0.6, 0.07]} />
              </mesh>
              {i < N - 1 && (
                <mesh material={wood} position={[(x + nx) / 2, (y + ny) / 2 + 0.58, z]} rotation={[0, 0, Math.atan2(ny - y, nx - x)]}>
                  <boxGeometry args={[len, 0.06, 0.06]} />
                </mesh>
              )}
            </group>
          );
        }),
      )}
    </group>
  );
}

/** Courtyard homes with low walls and doors, along one side of the path. */
function Homes({ land, at, seed }: { land: Land; at: V; seed: number }) {
  const mat = useMemo(wallMat, []);
  const homes = useMemo(() => {
    let s = seed * 977;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: 3 }, (_, i) => ({ dx: 4 + i * 4.2, dz: -3 - r() * 2, h: 2.4 + r() * 1.2, w: 3 + r() }));
  }, [seed]);
  return (
    <group>
      {homes.map((h, i) => (
        <group key={i} position={beside(land, at, h.dx, h.dz)}>
          <mesh material={mat} position={[0, h.h / 2, -1]} castShadow receiveShadow>
            <boxGeometry args={[h.w, h.h, 2.6]} />
          </mesh>
          <mesh material={mat} position={[0, 0.5, 1.2]} castShadow>
            <boxGeometry args={[h.w, 1, 0.25]} />
          </mesh>
          <mesh position={[0, 0.95, 0.31]}>
            <boxGeometry args={[0.8, 1.7, 0.05]} />
            <meshStandardMaterial color={['#3f6d8f', '#7a4a2e', '#4f7a3a'][i % 3]} roughness={0.7} />
          </mesh>
          <mesh position={[h.w / 3, h.h * 0.65, 0.31]}>
            <boxGeometry args={[0.5, 0.5, 0.05]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Market stalls with awnings in many colours (49:13). */
function Market({ land, at }: { land: Land; at: V }) {
  const colours = ['#c0392b', '#2f6f8f', '#e0a030', '#3f8f5f', '#8e44ad', '#d35400'];
  return (
    <group>
      {colours.map((c, i) => {
        const pos = beside(land, at, 3 + (i % 3) * 3.2, -2.5 - Math.floor(i / 3) * 4);
        return (
          <group key={i} position={pos}>
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.2, 1, 1]} />
              <meshStandardMaterial color="#a8865a" roughness={0.9} />
            </mesh>
            {[-1, 1].flatMap((sx) =>
              [-0.5, 0.5].map((sz) => (
                <mesh key={`${sx}${sz}`} position={[sx * 1.05, 1.2, sz]}>
                  <cylinderGeometry args={[0.04, 0.04, 2.4, 6]} />
                  <meshStandardMaterial color="#5a3e26" />
                </mesh>
              )),
            )}
            <mesh position={[0, 2.45, 0]} rotation={[0.25, 0, 0]} castShadow>
              <boxGeometry args={[2.5, 0.06, 1.5]} />
              <meshStandardMaterial color={c} roughness={0.8} />
            </mesh>
            {[-0.6, 0, 0.6].map((x) => (
              <mesh key={x} position={[x, 1.12, 0]}>
                <sphereGeometry args={[0.16, 10, 8]} />
                <meshStandardMaterial color={['#e8c040', '#c84030', '#6a9a3a'][Math.abs(x * 10) % 3]} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
