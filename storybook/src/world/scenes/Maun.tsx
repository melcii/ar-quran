// Al-Ma'un (107): a small morning street. A home with its door open and a
// bench outside (107:2), a table for bread and water (107:3) with three
// loaves to carry to it from a basket, and a shelf of small things to lend:
// a bucket, a pot, a coil of rope (107:7). No people are shown.
import { useMemo, useState } from 'react';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, tapOnly } from './kit';

export function MaunScene({ land, stops, complete, hint }: SceneProps) {
  const door = stopNamed(stops, 'The Open Door');
  const table = stopNamed(stops, 'The Bread Table');
  const shelf = stopNamed(stops, 'Lending Shelf');
  return (
    <group>
      {door && <OpenDoor position={beside(land, door.pos, 4.5, -3)} />}
      {table && (
        <BreadTable
          position={beside(land, table.pos, 4, -2.5)}
          onSet={() => (complete('Set the table'), hint('The table is set. Al-Ma’un warns against not encouraging "the feeding of the poor" (107:3).'))}
          hint={hint}
        />
      )}
      {shelf && <LendingShelf position={beside(land, shelf.pos, 4, -2.5)} />}
    </group>
  );
}

const wallCol = '#ecdcbc';

export function OpenDoor({ position }: { position: [number, number, number] }) {
  const wall = useMemo(() => mat(wallCol), []);
  const wood = useMemo(() => mat('#6a4a2e', 0.8), []);
  return (
    <group position={position} rotation={[0, -0.35, 0]}>
      {/* Front wall in three parts around the doorway, then the house behind. */}
      {[
        [-1.9, 1.5, 0, 2.2, 3, 0.3],
        [1.9, 1.5, 0, 2.2, 3, 0.3],
        [0, 2.65, 0, 1.6, 0.7, 0.3],
        [0, 1.5, -2, 6, 3, 0.3],
        [-2.85, 1.5, -1, 0.3, 3, 2],
        [2.85, 1.5, -1, 0.3, 3, 2],
        [0, 3.1, -1, 6.2, 0.2, 2.4],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} material={wall} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}
      {/* The door swung wide open, and warm light inside. */}
      <mesh material={wood} position={[-0.75, 1.15, 0.7]} rotation={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[1.5, 2.3, 0.08]} />
      </mesh>
      <pointLight position={[0, 1.6, -1]} color="#ffcf8a" intensity={4} distance={5} />
      <mesh material={wood} position={[2, 0.45, 0.7]} castShadow>
        <boxGeometry args={[1.6, 0.1, 0.45]} />
      </mesh>
      {[-0.65, 0.65].map((x) => (
        <mesh key={x} material={wood} position={[2 + x, 0.2, 0.7]}>
          <boxGeometry args={[0.1, 0.4, 0.4]} />
        </mesh>
      ))}
    </group>
  );
}

/** A table with a jug; three loaves wait in a basket. Tap a loaf to set it on the table. */
export function BreadTable({ position, onSet, hint }: { position: [number, number, number]; onSet?: () => void; hint: (t: string) => void }) {
  const [set, setSet] = useState<number[]>([]);
  const wood = useMemo(() => mat('#8a6440', 0.8), []);
  const bread = useMemo(() => mat('#c88a44', 0.7), []);
  const weave = useMemo(() => mat('#b08a50'), []);
  const carry = (i: number) =>
    tapOnly(() => {
      if (set.includes(i)) return;
      const next = [...set, i];
      setSet(next);
      if (next.length === 3) onSet?.();
      else hint(`${3 - next.length} more loa${3 - next.length > 1 ? 'ves' : 'f'} to carry to the table.`);
    });
  return (
    <group position={position}>
      <mesh material={wood} position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.1, 1.2]} />
      </mesh>
      {[
        [-1.05, -0.5],
        [1.05, -0.5],
        [-1.05, 0.5],
        [1.05, 0.5],
      ].map(([x, z], i) => (
        <mesh key={i} material={wood} position={[x, 0.4, z]}>
          <boxGeometry args={[0.1, 0.8, 0.1]} />
        </mesh>
      ))}
      <mesh position={[0.9, 1.1, 0.2]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.4, 12]} />
        <meshStandardMaterial color="#a65a34" roughness={0.8} />
      </mesh>
      <mesh material={weave} position={[-2.1, 0.22, 0.6]} castShadow>
        <cylinderGeometry args={[0.55, 0.42, 0.44, 14, 1, true]} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const on = set.includes(i);
        const p: [number, number, number] = on ? [-0.6 + i * 0.6, 1.0, -0.1] : [-2.1 + (i - 1) * 0.28, 0.48, 0.6 + (i % 2) * 0.1];
        return (
          <mesh key={i} material={bread} position={p} scale={[1.3, 0.6, 0.8]} onClick={carry(i)} castShadow>
            <sphereGeometry args={[0.2, 12, 8]} />
          </mesh>
        );
      })}
    </group>
  );
}

function LendingShelf({ position }: { position: [number, number, number] }) {
  const wood = useMemo(() => mat('#7a5634', 0.8), []);
  return (
    <group position={position} rotation={[0, -0.3, 0]}>
      {[0.5, 1.2, 1.9].map((y) => (
        <mesh key={y} material={wood} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.08, 0.6]} />
        </mesh>
      ))}
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} material={wood} position={[x, 1.1, 0]} castShadow>
          <boxGeometry args={[0.1, 2.2, 0.6]} />
        </mesh>
      ))}
      <mesh position={[-0.5, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.17, 0.42, 14, 1, true]} />
        <meshStandardMaterial color="#7a7f86" metalness={0.6} roughness={0.4} side={2} />
      </mesh>
      <mesh position={[0.45, 1.42, 0]} castShadow>
        <sphereGeometry args={[0.24, 14, 10]} />
        <meshStandardMaterial color="#a65a34" roughness={0.85} />
      </mesh>
      <mesh position={[-0.4, 2.0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.2, 0.06, 6, 16]} />
        <meshStandardMaterial color="#b39060" />
      </mesh>
      <mesh position={[0.5, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.16, 12]} />
        <meshStandardMaterial color="#3a3a3e" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}
