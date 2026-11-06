// An-Naml (27): a sunny valley with ant hills and ants hurrying into their
// dwellings (27:18); a tree of perched birds with one empty branch (27:20);
// a hoopoe waiting further down the road toward a far southern city (27:22);
// a palace floor of smooth glass over water (27:44); and mountains drifting
// like clouds at the world's edge (27:88). Sulayman, the Queen and every
// person are never shown. Animals act only as the ayahs say.
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
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

export function NamlScene({ land, stops, quality, complete, hint }: SceneProps) {
  const ants = stopNamed(stops, 'Valley of the Ants');
  const perch = stopNamed(stops, "The Hoopoe's Perch");
  const road = stopNamed(stops, 'Road to Sheba');
  const glass = stopNamed(stops, 'The Glass Floor');
  const hills = stopNamed(stops, 'Moving Mountains');
  return (
    <group>
      {ants && <AntValley land={land} at={ants.pos} count={Math.round(120 + 260 * quality.vegetation)} />}
      {perch && <BirdTree position={beside(land, perch.pos, 4, -3)} />}
      {road && <Hoopoe position={beside(land, road.pos, -3.2, -2.4)} onFind={() => (complete('Find the hoopoe'), hint('You found the hoopoe. Read 27:20-22 to hear what it brought.'))} />}
      {road && <FarCity position={beside(land, road.pos, 10, -40)} />}
      {glass && <GlassFloor position={beside(land, glass.pos, 6, -4)} />}
      {hills && <DriftingHills at={hills.pos} />}
    </group>
  );
}

/** Ant hills with ants walking in toward each entrance. */
function AntValley({ land, at, count }: { land: Land; at: V; count: number }) {
  const holes = useMemo(
    () =>
      [
        [3, -3],
        [6, -1],
        [5, -6],
        [8.5, -4],
      ]
        .map(([dx, dz]) => new THREE.Vector3(...beside(land, at, dx, dz)))
        // Ants live on dry ground: keep the hills out of the river.
        .filter((h) => land.waterLevel == null || h.y > land.waterLevel + 0.3),
    [land, at],
  );
  const { mesh, ants } = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.035, 6, 4);
    geo.scale(1, 0.7, 2.2);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#1a120c', roughness: 0.6 }), count);
    m.frustumCulled = false;
    let seed = 27;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const ants = Array.from({ length: holes.length ? count : 0 }, (_, i) => ({ hole: i % holes.length, a: r() * Math.PI * 2, speed: 0.08 + r() * 0.08, phase: r() }));
    return { mesh: m, ants };
  }, [count, holes.length]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ants.forEach((ant, i) => {
      const h = holes[ant.hole];
      // Each ant walks in from up to 3.5 m away, reaches the entrance, and a new one starts out on the trail.
      const k = (ant.phase + t * ant.speed) % 1;
      const d = 3.5 * (1 - k) + 0.25;
      const wob = Math.sin(t * 3 + i) * 0.08;
      const x = h.x + Math.cos(ant.a + wob) * d;
      const z = h.z + Math.sin(ant.a + wob) * d;
      o.position.set(x, land.height(x, z) + 0.03, z);
      o.rotation.set(0, -ant.a + Math.PI / 2, 0);
      o.scale.setScalar(k > 0.97 ? 0 : 1);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      {holes.map((h, i) => (
        <group key={i} position={h}>
          <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.7, 0.4, 16]} />
            <meshStandardMaterial color="#a8865a" roughness={1} />
          </mesh>
          <mesh position={[0, 0.39, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.1, 10]} />
            <meshBasicMaterial color="#1a120c" />
          </mesh>
        </group>
      ))}
      <primitive object={mesh} />
    </group>
  );
}

function birdGeometry() {
  const g = new THREE.SphereGeometry(0.16, 10, 8);
  g.scale(1, 0.9, 1.5);
  return g;
}

/** A tree full of perched birds, with one branch left empty (27:20). */
function BirdTree({ position }: { position: [number, number, number] }) {
  const body = useMemo(birdGeometry, []);
  const colours = ['#5a6a7a', '#8a5a3a', '#e8e0d0', '#3a4a3a', '#7a7a5a', '#c08a4a'];
  const branches = [
    [-1.2, 2.3, 0.2],
    [1.1, 2.6, -0.2],
    [-0.6, 3.2, 0.5],
    [0.8, 3.5, 0.3],
    [0, 4, -0.4],
    [-1.4, 3.7, -0.3],
    [1.5, 3.1, 0.4],
  ];
  return (
    <group position={position}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 2.8, 10]} />
        <meshStandardMaterial color="#6a4a2e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.3, 0]} scale={[2.2, 1.4, 2.2]} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color="#5a8a3a" roughness={0.9} transparent opacity={0.55} />
      </mesh>
      {branches.map(([x, y, z], i) => (
        <group key={i}>
          <mesh position={[x * 0.6, y - 0.12, z]} rotation={[0, 0, x > 0 ? -1.2 : 1.2]}>
            <cylinderGeometry args={[0.03, 0.04, Math.abs(x) * 1.4 + 0.4, 6]} />
            <meshStandardMaterial color="#6a4a2e" />
          </mesh>
          {/* The last branch stays empty: "Why do I not see the hoopoe?" */}
          {i < branches.length - 1 && (
            <mesh geometry={body} position={[x, y + 0.05, z]}>
              <meshStandardMaterial color={colours[i % colours.length]} roughness={0.7} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** The hoopoe: a small bird with an orange crest. Tap it to find it. */
function Hoopoe({ position, onFind }: { position: [number, number, number]; onFind: () => void }) {
  const [found, setFound] = useState(false);
  const head = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (head.current) head.current.rotation.y = Math.sin(clock.elapsedTime * 2.2) * 0.6;
  });
  const tap = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return;
    e.stopPropagation();
    setFound(true);
    onFind();
  };
  return (
    <group position={position} onClick={tap}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
        <meshStandardMaterial color="#8a7a64" />
      </mesh>
      <group position={[0, 0.62, 0]} scale={1.5}>
        <mesh scale={[1, 0.9, 1.5]} castShadow>
          <sphereGeometry args={[0.16, 12, 10]} />
          <meshStandardMaterial color="#d08a4a" roughness={0.7} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.15, 0.02, -0.06]} scale={[0.25, 0.6, 1.6]}>
            <sphereGeometry args={[0.13, 8, 6]} />
            <meshStandardMaterial color="#1c1814" />
          </mesh>
        ))}
        <group ref={head} position={[0, 0.16, 0.18]}>
          <mesh>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial color="#d08a4a" />
          </mesh>
          <mesh position={[0, 0.02, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.018, 0.22, 6]} />
            <meshStandardMaterial color="#2a2018" />
          </mesh>
          {[-0.08, -0.03, 0.02, 0.07].map((z, i) => (
            <mesh key={i} position={[0, 0.13, z - 0.02]} rotation={[-0.3, 0, 0]}>
              <coneGeometry args={[0.025, 0.16 - i * 0.015, 5]} />
              <meshStandardMaterial color={i % 2 ? '#1c1814' : '#e8903a'} />
            </mesh>
          ))}
        </group>
      </group>
      {/* A soft ring that glows until the hoopoe is found */}
      {!found && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.7, 24]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/** A far city of towers on the southern horizon, seen only from the road. */
function FarCity({ position }: { position: [number, number, number] }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d8c09a', roughness: 0.9 }), []);
  return (
    <group position={position}>
      {[
        [-6, 6, 3],
        [-2, 9, 3.5],
        [2, 7, 3],
        [6, 10, 2.6],
        [0, 4, 14],
      ].map(([x, h, w], i) => (
        <mesh key={i} material={mat} position={[x, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, 3]} />
        </mesh>
      ))}
    </group>
  );
}

/** A raised floor of clear glass over still water, framed in stone (27:44). */
function GlassFloor({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e6dcc8', roughness: 0.6 }), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 5]} />
        <meshStandardMaterial color="#2f6f9a" roughness={0.05} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[7, 0.05, 5]} />
        <meshStandardMaterial color="#e8f6ff" transparent opacity={0.2} roughness={0} metalness={0.1} depthWrite={false} />
      </mesh>
      {[
        [0, -2.6, 7.6, 0.4],
        [0, 2.6, 7.6, 0.4],
        [-3.7, 0, 0.4, 5.6],
        [3.7, 0, 0.4, 5.6],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} material={stone} position={[x, 0.3, z]} castShadow receiveShadow>
          <boxGeometry args={[w, 0.6, d]} />
        </mesh>
      ))}
      {[-3.7, 3.7].flatMap((x) =>
        [-2.6, 2.6].map((z) => (
          <mesh key={`${x}${z}`} material={stone} position={[x, 2, z]} castShadow>
            <cylinderGeometry args={[0.22, 0.26, 3.4, 12]} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Mountains on the far horizon that slowly drift, "passing as the clouds pass" (27:88). */
function DriftingHills({ at }: { at: V }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = at.x + Math.sin(clock.elapsedTime * 0.05) * 12;
  });
  return (
    <group ref={group} position={[at.x, at.y, at.z - 120]}>
      {[-40, -15, 10, 35].map((x, i) => (
        <mesh key={x} position={[x, 8 + (i % 2) * 4, 0]} scale={[14, 12 + (i % 2) * 6, 6]}>
          <coneGeometry args={[1, 1.4, 6]} />
          <meshStandardMaterial color="#b8c2cc" transparent opacity={0.55} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
