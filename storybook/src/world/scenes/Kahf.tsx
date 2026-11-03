// Al-Kahf (18): four journeys along one valley. A cave in the mountainside
// with sunlight sliding past its mouth (18:10, 18:17); two walled gardens with
// a river between them (18:32-33); a shore where two waters meet (18:60) with
// a small ship holed in its side (18:71); a wall set straight (18:77); and a
// pass closed with iron and copper (18:96). The youths, Musa, the knowing
// servant and Dhul-Qarnayn are never shown, and no number of sleepers is given.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
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

export function KahfScene({ land, stops }: SceneProps) {
  const cave = stopNamed(stops, 'The Cave');
  const sun = stopNamed(stops, 'The Sliding Sun');
  const gardens = stopNamed(stops, 'The Two Gardens');
  const seas = stopNamed(stops, 'Junction of the Two Seas');
  const ship = stopNamed(stops, 'The Ship');
  const wall = stopNamed(stops, 'The Wall');
  const barrier = stopNamed(stops, 'The Iron Barrier');
  const cavePos = cave ? beside(land, cave.pos, 7, -6) : null;
  return (
    <group>
      {cavePos && <Cave position={cavePos} />}
      {cavePos && sun && <SlidingLight position={cavePos} />}
      {gardens && <TwoGardens land={land} at={gardens.pos} />}
      {seas && <TwoSeas position={beside(land, seas.pos, 6, -5)} />}
      {ship && <Ship position={beside(land, ship.pos, 4.5, -3)} />}
      {wall && <Wall position={beside(land, wall.pos, 4, -3.5)} />}
      {barrier && <Barrier position={beside(land, barrier.pos, 7, -7)} />}
    </group>
  );
}

/** A rocky mountainside with one dark cave mouth. */
function Cave({ position }: { position: [number, number, number] }) {
  const rock = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a7a64', roughness: 1, flatShading: true }), []);
  return (
    <group position={position} rotation={[0, -0.5, 0]}>
      <mesh material={rock} position={[0, 2.5, -1.5]} scale={[6, 4.2, 4]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 1]} />
      </mesh>
      <mesh material={rock} position={[-5, 1.6, -0.5]} scale={[3, 2.6, 3]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
      </mesh>
      <mesh material={rock} position={[5, 1.8, -0.8]} scale={[3.2, 3, 3]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
      </mesh>
      {/* The mouth: a dark arch set in front of the rock, framed by a ring of stone. */}
      <mesh position={[0, 0, 3.1]}>
        <circleGeometry args={[1.6, 24, 0, Math.PI]} />
        <meshBasicMaterial color="#0d0a08" side={THREE.DoubleSide} />
      </mesh>
      <mesh material={rock} position={[0, 0, 3.05]}>
        <torusGeometry args={[1.75, 0.35, 8, 20, Math.PI]} />
      </mesh>
    </group>
  );
}

/** A shaft of sunlight that sweeps from one side of the cave mouth to the other and never enters (18:17). */
function SlidingLight({ position }: { position: [number, number, number] }) {
  const beam = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime % 40) / 40; // a "day" every 40 seconds
    if (beam.current) {
      // Passes to the right of the mouth in the morning, to the left in the evening.
      beam.current.position.x = t < 0.5 ? 3.2 + t * 2 : -3.2 - (t - 0.5) * 2;
      beam.current.rotation.z = t < 0.5 ? -0.5 : 0.5;
    }
  });
  return (
    <group position={position} rotation={[0, -0.5, 0]}>
      <mesh ref={beam} position={[3.2, 3, 3]}>
        <cylinderGeometry args={[0.6, 1.4, 7, 16, 1, true]} />
        <meshBasicMaterial color="#fff0c0" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Two walled gardens of vines and palms with a river running between them. */
function TwoGardens({ land, at }: { land: Land; at: V }) {
  const wallM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c8b38c', roughness: 0.9 }), []);
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4f7a32', roughness: 0.9 }), []);
  const grape = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5a2a5a', roughness: 0.6 }), []);
  const garden = (cx: number, key: string) => {
    const [x, y, z] = beside(land, at, cx, -6);
    return (
      <group key={key} position={[x, y, z]}>
        {[
          [0, -3, 8, 0.2],
          [0, 3, 8, 0.2],
          [-4, 0, 0.2, 6],
          [4, 0, 0.2, 6],
        ].map(([px, pz, w, d], i) => (
          <mesh key={i} material={wallM} position={[px, 0.5, pz]} castShadow receiveShadow>
            <boxGeometry args={[w, 1, d]} />
          </mesh>
        ))}
        {[-2, 0, 2].map((rz) => (
          <group key={rz}>
            <mesh material={leaf} position={[0, 0.7, rz]} castShadow>
              <boxGeometry args={[6.5, 1, 0.5]} />
            </mesh>
            {[-2.5, -1, 0.5, 2].map((gx) => (
              <mesh key={gx} material={grape} position={[gx, 0.55, rz + 0.3]}>
                <sphereGeometry args={[0.14, 8, 6]} />
              </mesh>
            ))}
          </group>
        ))}
        {[-3.4, 3.4].map((px) => (
          <group key={px} position={[px, 0, 2.4]}>
            <mesh position={[0, 1.6, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.14, 3.2, 8]} />
              <meshStandardMaterial color="#7a5a3a" />
            </mesh>
            <mesh material={leaf} position={[0, 3.3, 0]} scale={[1.2, 0.35, 1.2]} castShadow>
              <sphereGeometry args={[1, 10, 6]} />
            </mesh>
          </group>
        ))}
      </group>
    );
  };
  const [rx, ry, rz] = beside(land, at, 9, -6);
  return (
    <group>
      {garden(4, 'a')}
      {garden(14, 'b')}
      <mesh position={[rx, ry + 0.06, rz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 9]} />
        <meshStandardMaterial color="#3f7f9a" roughness={0.15} metalness={0.2} />
      </mesh>
    </group>
  );
}

/** Two bodies of water side by side, one green-blue and one deep blue, with a pale line where they meet. */
function TwoSeas({ position }: { position: [number, number, number] }) {
  return (
    <group position={[position[0], position[1] + 0.08, position[2]]}>
      <mesh position={[-3, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4, 32, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#4f9a8f" roughness={0.12} metalness={0.25} />
      </mesh>
      <mesh position={[-3, 0.005, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <circleGeometry args={[4, 32, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#1f4f7a" roughness={0.12} metalness={0.25} />
      </mesh>
      <mesh position={[-3, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 8]} />
        <meshBasicMaterial color="#d8eef0" transparent opacity={0.6} />
      </mesh>
      <mesh position={[1.4, 0.4, 0.5]} scale={[1, 0.6, 0.8]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8a7a64" flatShading />
      </mesh>
    </group>
  );
}

/** A small wooden ship drawn up on the sand with a hole in its side. */
function Ship({ position }: { position: [number, number, number] }) {
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7a5634', roughness: 0.8 }), []);
  const hull = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 5, 20, 1, true, 0, Math.PI);
    g.rotateZ(Math.PI / 2);
    g.rotateX(Math.PI / 2);
    g.scale(1, 0.8, 1);
    return g;
  }, []);
  return (
    <group position={position} rotation={[0, 0.6, 0.06]}>
      <mesh geometry={hull} position={[0, 0.85, 0]} rotation={[0, Math.PI / 2, Math.PI]} castShadow>
        <meshStandardMaterial color="#7a5634" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 3.6, 8]} />
        <meshStandardMaterial color="#5a3e26" />
      </mesh>
      {/* The hole, on the near side of the hull */}
      <mesh position={[0.95, 0.45, 0.6]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.22, 12]} />
        <meshBasicMaterial color="#120c08" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** A stone wall standing straight, with fresh stones where it was mended. */
function Wall({ position }: { position: [number, number, number] }) {
  const old = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a8977a', roughness: 0.95 }), []);
  const fresh = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d8c8a4', roughness: 0.9 }), []);
  const blocks = useMemo(() => {
    const out: { x: number; y: number; fresh: boolean }[] = [];
    for (let row = 0; row < 5; row++)
      for (let i = 0; i < 9; i++) out.push({ x: -3.6 + i * 0.9 + (row % 2) * 0.45, y: 0.3 + row * 0.6, fresh: i >= 3 && i <= 5 && row >= 1 });
    return out;
  }, []);
  return (
    <group position={position} rotation={[0, -0.3, 0]}>
      {blocks.map((b, i) => (
        <mesh key={i} material={b.fresh ? fresh : old} position={[b.x, b.y, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.86, 0.56, 0.7]} />
        </mesh>
      ))}
    </group>
  );
}

/** Two cliffs with the gap between them filled with iron blocks and a copper seal (18:96). */
function Barrier({ position }: { position: [number, number, number] }) {
  const rock = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7d6a52', roughness: 1, flatShading: true }), []);
  const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a4c52', metalness: 0.8, roughness: 0.4 }), []);
  const copper = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b8703a', metalness: 0.9, roughness: 0.3, emissive: '#3a1a08' }), []);
  return (
    <group position={position} rotation={[0, -0.4, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} material={rock} position={[s * 4.2, 3.5, 0]} scale={[2.6, 4.6, 2.6]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4, 5].flatMap((row) =>
        [-1.5, -0.5, 0.5, 1.5].map((x) => (
          <mesh key={`${row}${x}`} material={iron} position={[x + (row % 2) * 0.25, 0.4 + row * 0.8, 0]} castShadow>
            <boxGeometry args={[0.95, 0.75, 1.4]} />
          </mesh>
        )),
      )}
      <mesh material={copper} position={[0, 5.1, 0]} castShadow>
        <boxGeometry args={[4.6, 0.3, 1.6]} />
      </mesh>
    </group>
  );
}
