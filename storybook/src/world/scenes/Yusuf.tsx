// Yusuf (12): one road through the whole story, in the surah's order. Each
// place holds only objects and land: eleven stars with the sun and the moon in
// the dusk sky (12:4), a stone well in the wilderness (12:15), a caravan's
// resting camels and a water bucket (12:19), a prison courtyard (12:36),
// granaries with grain kept in its spikes (12:47), a folded shirt (12:93) and
// an empty hall (12:100). Yusuf, his family and everyone else are never shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { DragPlay, type DragItem, type DropSpot } from './drag';
import type { P3 } from './kit';

type V = THREE.Vector3;
const stone = () => new THREE.MeshStandardMaterial({ color: '#cbb894', roughness: 0.9 });

/** Put something beside a stop, on the ground, away from the path. */
function beside(land: Land, at: V, dx: number, dz: number): [number, number, number] {
  const x = at.x + dx;
  const z = at.z + dz;
  return [x, land.height(x, z), z];
}

export function YusufScene({ land, stops, complete, hint }: SceneProps) {
  const stars = stopNamed(stops, 'Night of Eleven Stars');
  const well = stopNamed(stops, 'The Well');
  const road = stopNamed(stops, 'Caravan Road');
  const prison = stopNamed(stops, 'The Prison');
  const store = stopNamed(stops, 'The Storehouses');
  const shirt = stopNamed(stops, 'The Shirt');
  const hall = stopNamed(stops, 'Hall of Reunion');
  return (
    <group>
      {stars && <ElevenStars at={stars.pos} toward={land.path.getPointAt(1)} />}
      {well && <Well position={beside(land, well.pos, 3.5, -2.5)} />}
      {road && <Caravan land={land} at={road.pos} />}
      {prison && <Prison position={beside(land, prison.pos, 5, -4)} />}
      {store && (
        <Granaries
          land={land}
          at={store.pos}
          hint={hint}
          onDone={() => (complete('Carry the sheaves'), hint('Stored for the hard years: "what you harvest leave in its spikes, except a little from which you will eat" (12:47).'))}
        />
      )}
      {shirt && <Shirt position={beside(land, shirt.pos, 2.2, -1.8)} />}
      {hall && <Hall position={beside(land, hall.pos, 6, -5)} />}
    </group>
  );
}

/** Eleven bright stars, the sun and the moon, low in the sky over the first place. */
function ElevenStars({ at, toward }: { at: V; toward: V }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    group.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.75 + Math.sin(clock.elapsedTime * 1.3 + i) * 0.25;
    });
  });
  // Low in the sky ahead, down the valley, where the walls leave it open.
  const yaw = Math.atan2(toward.x - at.x, -(toward.z - at.z));
  const items = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const a = -0.22 + (i / 10) * 0.44;
        return new THREE.Vector3(Math.sin(a) * 110, 30 + Math.cos(a * 7) * 5, -Math.cos(a) * 110);
      }),
    [],
  );
  return (
    <group position={[at.x, at.y, at.z]} rotation={[0, -yaw, 0]}>
      <group ref={group}>
        {items.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.9, 12, 8]} />
            <meshBasicMaterial color="#fffbe8" transparent fog={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh position={[-20, 20, -112]}>
        <sphereGeometry args={[3, 24, 16]} />
        <meshBasicMaterial color="#ffd27a" fog={false} toneMapped={false} />
      </mesh>
      <mesh position={[20, 22, -112]}>
        <sphereGeometry args={[2.3, 24, 16]} />
        <meshBasicMaterial color="#eef0f8" fog={false} />
      </mesh>
    </group>
  );
}

export function Well({ position }: { position: [number, number, number] }) {
  const mat = useMemo(stone, []);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b4a2e', roughness: 0.8 }), []);
  return (
    <group position={position}>
      <mesh material={mat} position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.3, 1, 24, 1, true]} />
      </mesh>
      <mesh material={mat} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[1.2, 0.14, 8, 28]} />
      </mesh>
      <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.12, 24]} />
        <meshStandardMaterial color="#0c0a08" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={wood} position={[s * 1.15, 1.6, 0]} castShadow>
          <boxGeometry args={[0.14, 1.3, 0.14]} />
        </mesh>
      ))}
      <mesh material={wood} position={[0, 2.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 2.5, 8]} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.3, 4]} />
        <meshStandardMaterial color="#b89a6a" />
      </mesh>
    </group>
  );
}

/** Resting camels with packs and a water bucket on a rope, by the road. */
export function Caravan({ land, at }: { land: Land; at: V }) {
  const hide = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b98a55', roughness: 0.95 }), []);
  const pack = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7a3a2a', roughness: 0.9 }), []);
  const camels = [
    [4, -3, 0.4],
    [6.5, -1.5, -0.3],
    [5.5, -5.5, 1.1],
  ] as const;
  return (
    <group>
      {camels.map(([dx, dz, r], i) => (
        <group key={i} position={beside(land, at, dx, dz)} rotation={[0, r, 0]}>
          {/* Lying down: body low on folded legs */}
          <mesh material={hide} position={[0, 0.65, 0]} scale={[0.75, 0.55, 1.4]} castShadow>
            <sphereGeometry args={[1, 18, 12]} />
          </mesh>
          <mesh material={hide} position={[0, 1.25, 0.1]} scale={[0.45, 0.45, 0.55]} castShadow>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          <mesh material={pack} position={[0, 1.35, -0.45]} scale={[0.85, 0.3, 0.4]} castShadow>
            <boxGeometry args={[1.4, 1, 1]} />
          </mesh>
          <mesh material={hide} position={[0, 1.2, 1.35]} rotation={[-0.7, 0, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.18, 1.3, 10]} />
          </mesh>
          <mesh material={hide} position={[0, 1.7, 1.75]} scale={[0.22, 0.2, 0.38]} castShadow>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        </group>
      ))}
      <mesh position={beside(land, at, 2.4, 0.8)} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.42, 14]} />
        <meshStandardMaterial color="#6b4a2e" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** A walled courtyard with a barred window and a heavy door, empty. */
function Prison({ position }: { position: [number, number, number] }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9a8a74', roughness: 0.95 }), []);
  const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2622', metalness: 0.6, roughness: 0.5 }), []);
  return (
    <group position={position} rotation={[0, -0.4, 0]}>
      <mesh material={mat} position={[0, 1.6, -3]} castShadow receiveShadow>
        <boxGeometry args={[8, 3.2, 0.6]} />
      </mesh>
      <mesh material={mat} position={[-4, 1.6, 0]} castShadow>
        <boxGeometry args={[0.6, 3.2, 6]} />
      </mesh>
      <mesh material={mat} position={[4, 1.6, 0]} castShadow>
        <boxGeometry args={[0.6, 3.2, 6]} />
      </mesh>
      <mesh position={[1.8, 2.2, -2.68]}>
        <boxGeometry args={[1.2, 0.8, 0.05]} />
        <meshStandardMaterial color="#141210" />
      </mesh>
      {[-0.4, -0.13, 0.13, 0.4].map((b) => (
        <mesh key={b} material={iron} position={[1.8 + b, 2.2, -2.62]}>
          <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
        </mesh>
      ))}
      <mesh position={[-1.6, 1.05, -2.66]}>
        <boxGeometry args={[1.3, 2.1, 0.1]} />
        <meshStandardMaterial color="#4a3422" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Round granaries and sheaves of grain kept in their spikes (12:47). */
function Granaries({ land, at, hint, onDone }: { land: Land; at: V; hint: (t: string) => void; onDone: () => void }) {
  const sheaf = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e0bc68', roughness: 1 }), []);
  const doors: [number, number][] = [
    [4, -3],
    [6.6, -2],
    [5.6, -5.6],
    [8.2, -4.6],
  ];
  // Each granary takes one sheaf at its door; the sheaves wait in the field by the path.
  const spots: DropSpot[] = doors.map(([dx, dz], i) => {
    const d = beside(land, at, dx, dz + 1.9);
    return { id: `door${i}`, pos: d, r: 1, slots: [[d[0], d[1], d[2] - 0.5]] as P3[], color: '#ffe2a0' };
  });
  const items: DragItem[] = [0, 1, 2, 3].map((i) => ({
    id: `sheaf${i}`,
    home: beside(land, at, 1.3 + (i % 2) * 0.8, -0.4 - i * 0.7),
    fits: spots.map((s) => s.id),
    lift: 0.5,
    node: (
      <group>
        <mesh material={sheaf} position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.3, 1.1, 14]} />
        </mesh>
        <mesh material={sheaf} position={[0, 1.15, 0]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.32, 14, 10]} />
        </mesh>
        <mesh position={[0, 0.6, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.27, 0.035, 6, 20]} />
          <meshStandardMaterial color="#8a5a2a" />
        </mesh>
      </group>
    ),
  }));
  const mud = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c9a878', roughness: 0.95 }), []);
  const thatch = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a8874e', roughness: 1 }), []);
  const sheaves = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.22, 0.32, 1.1, 10);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#d8b664', roughness: 1 }), 14);
    const o = new THREE.Object3D();
    for (let i = 0; i < 14; i++) {
      const [x, y, z] = beside(land, at, -3 - (i % 7) * 0.7, -2 - Math.floor(i / 7) * 0.8);
      o.position.set(x, y + 0.55, z);
      o.rotation.set(0, i, (i % 3) * 0.05);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.castShadow = true;
    return m;
  }, [land, at]);
  return (
    <group>
      {[
        [4, -3],
        [6.6, -2],
        [5.6, -5.6],
        [8.2, -4.6],
      ].map(([dx, dz], i) => (
        <group key={i} position={beside(land, at, dx, dz)}>
          <mesh material={mud} position={[0, 1.4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.1, 1.25, 2.8, 20]} />
          </mesh>
          <mesh material={thatch} position={[0, 3.35, 0]} castShadow>
            <coneGeometry args={[1.45, 1.2, 20]} />
          </mesh>
          <mesh position={[0, 1.5, 1.19]}>
            <boxGeometry args={[0.5, 0.7, 0.05]} />
            <meshStandardMaterial color="#3a2a1a" />
          </mesh>
        </group>
      ))}
      <primitive object={sheaves} />
      <DragPlay items={items} spots={spots} testPrefix="sheaf-" onPlace={(_, __, n) => n < 4 && hint(`${4 - n} more sheaf${4 - n > 1 ? 'ves' : ''} to store.`)} onDone={onDone} />
    </group>
  );
}

/** A folded shirt resting on a low stone. */
function Shirt({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.6, 0.9]} />
        <meshStandardMaterial color="#b8a888" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.66, 0]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.7, 0.12, 0.55]} />
        <meshStandardMaterial color="#efe6d4" roughness={1} />
      </mesh>
    </group>
  );
}

/** An empty hall of columns at the end of the road. */
function Hall({ position }: { position: [number, number, number] }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e6d8b8', roughness: 0.75 }), []);
  return (
    <group position={position} rotation={[0, -0.3, 0]}>
      <mesh material={mat} position={[0, 0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[10, 0.5, 7]} />
      </mesh>
      {[-4, -2, 0, 2, 4].flatMap((x) =>
        [-3, 3].map((z) => (
          <mesh key={`${x}${z}`} material={mat} position={[x, 2.5, z]} castShadow>
            <cylinderGeometry args={[0.28, 0.32, 4, 14]} />
          </mesh>
        )),
      )}
      <mesh material={mat} position={[0, 4.7, 0]} castShadow>
        <boxGeometry args={[10.4, 0.5, 7.4]} />
      </mesh>
      <mesh material={mat} position={[0, 0.75, -2]} castShadow>
        <boxGeometry args={[3, 0.5, 1.6]} />
      </mesh>
    </group>
  );
}
