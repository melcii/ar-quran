// Ar-Rahman (55): a shore of favours. A brass orrery where the sun and moon
// run on their courses (55:5); a great balance to keep level (55:7-9); grain
// and fragrant plants beside the palms (55:11-12); clay pots on the bank
// (55:14); two waters lying side by side with a barrier between (55:19-20),
// pearls and coral in the shallows (55:22); and ships with sails raised like
// mountains (55:24). Nothing here depicts the unseen.
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { DragPlay, type DragItem, type DropSpot } from './drag';
import { labelTexture } from './props';

type V = THREE.Vector3;
function beside(land: Land, at: V, dx: number, dz: number): [number, number, number] {
  const x = at.x + dx;
  const z = at.z + dz;
  return [x, land.height(x, z), z];
}
/** The nearest point under the sea, searching outward from a place. */
function seaNear(land: Land, at: V): THREE.Vector3 | null {
  if (land.waterLevel == null) return null;
  // Look ahead first (the path runs toward -z), then to the sides, then behind.
  const angles = Array.from({ length: 16 }, (_, k) => (k / 16) * Math.PI * 2).sort((a, b) => Math.sin(a) - Math.sin(b));
  for (let r = 4; r < 80; r += 2)
    for (const a of angles) {
      const x = at.x + Math.cos(a) * r;
      const z = at.z + Math.sin(a) * r;
      if (land.height(x, z) < land.waterLevel - 0.4) return new THREE.Vector3(x, land.waterLevel, z);
    }
  return null;
}
const tapOnly = (fn: () => void) => (e: ThreeEvent<MouseEvent>) => {
  if (e.delta > 8) return;
  e.stopPropagation();
  fn();
};

export function RahmanScene({ land, stops, quality, complete, hint }: SceneProps) {
  const orbit = stopNamed(stops, 'Orbit of Sun and Moon');
  const balance = stopNamed(stops, 'The Balance');
  const grain = stopNamed(stops, 'Grain and Fragrance');
  const fruit = stopNamed(stops, 'Fruit and Palms');
  const clay = stopNamed(stops, 'Pottery Clay Bank');
  const seas = stopNamed(stops, 'Two Seas');
  const pearls = stopNamed(stops, 'Pearl and Coral');
  const ships = stopNamed(stops, 'Ships like Mountains');
  const seaC = useMemo(() => (ships ? seaNear(land, ships.pos) : null), [land, ships]);
  return (
    <group>
      {orbit && <Orrery position={beside(land, orbit.pos, 4, -3)} />}
      {balance && (
        <Balance
          position={beside(land, balance.pos, 3.5, -2.5)}
          onLevel={() => (complete('Keep the balance'), hint('Level! "And establish weight in justice and do not make deficient the balance" (55:9).'))}
          hint={hint}
        />
      )}
      {fruit && (
        <PlantBeds
          land={land}
          at={fruit.pos}
          hint={hint}
          onDone={() => (complete('Plant the garden'), hint('"Therein is fruit and palm trees having sheaths [of dates] and grain having husks and scented plants" (55:11-12).'))}
        />
      )}
      {grain && <Grain land={land} at={grain.pos} count={Math.round(300 + 700 * quality.vegetation)} />}
      {clay && <Pots land={land} at={clay.pos} />}
      {seas && <TwoWaters position={beside(land, seas.pos, 5, -3)} />}
      {pearls && (
        <PearlsAndCoral
          position={beside(land, pearls.pos, 4, -3)}
          onDone={() => (complete('Pearl and coral'), hint('You found pearl and coral, from both seas (55:22).'))}
          hint={hint}
        />
      )}
      {seaC && <Ships at={seaC} />}
    </group>
  );
}

/** A brass orrery: the sun and the moon each running on a ring (55:5). */
function Orrery({ position }: { position: [number, number, number] }) {
  const sun = useRef<THREE.Group>(null);
  const moon = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (sun.current) sun.current.rotation.y = t * 0.25;
    if (moon.current) moon.current.rotation.y = t * 0.9;
  });
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c8a050', metalness: 0.85, roughness: 0.3 }), []);
  return (
    <group position={position}>
      <mesh material={brass} position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.4, 1.2, 12]} />
      </mesh>
      <group position={[0, 1.6, 0]}>
        <mesh material={brass} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.8, 0.03, 6, 48]} />
        </mesh>
        <mesh material={brass} rotation={[Math.PI / 2, 0.2, 0]}>
          <torusGeometry args={[1.1, 0.025, 6, 40]} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.18, 12, 10]} />
          <meshStandardMaterial color="#5a6a7a" />
        </mesh>
        <group ref={sun}>
          <mesh position={[1.8, 0, 0]}>
            <sphereGeometry args={[0.28, 16, 12]} />
            <meshStandardMaterial color="#ffcf5a" emissive="#ffb030" emissiveIntensity={1.6} />
          </mesh>
        </group>
        <group ref={moon} rotation={[0.2, 0, 0]}>
          <mesh position={[1.1, 0, 0]}>
            <sphereGeometry args={[0.14, 12, 10]} />
            <meshStandardMaterial color="#e8eaf0" emissive="#9aa4b8" emissiveIntensity={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** A great balance. One pan holds three weights; tap the other pan to add or take away weights until it is level. */
function Balance({ position, onLevel, hint }: { position: [number, number, number]; onLevel: () => void; hint: (t: string) => void }) {
  const [right, setRight] = useState(0);
  const beam = useRef<THREE.Group>(null);
  const pans = useRef<THREE.Group[]>([]);
  const LEFT = 3;
  useFrame(() => {
    // The heavier side goes down; each pan hangs below its end of the beam.
    const target = THREE.MathUtils.clamp(-(right - LEFT) * 0.08, -0.24, 0.24);
    const b = beam.current;
    if (!b) return;
    b.rotation.z += (target - b.rotation.z) * 0.08;
    pans.current.forEach((p, i) => {
      if (!p) return;
      const end = i ? 1.6 : -1.6;
      p.position.x = Math.cos(b.rotation.z) * end;
      p.position.y = 2.8 + Math.sin(b.rotation.z) * end - 1.2;
    });
  });
  const tap = (delta: number) =>
    tapOnly(() => {
      const next = Math.max(0, Math.min(6, right + delta));
      setRight(next);
      if (next === LEFT) onLevel();
      else hint(next < LEFT ? 'The pan is too light. Tap the right pan to add a weight.' : 'Too heavy. Tap the left pan to take a weight away from the right.');
    });
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b8904a', metalness: 0.8, roughness: 0.35 }), []);
  const weight = (i: number, x: number) => (
    <mesh key={`${x}${i}`} position={[x + (i % 2 ? 0.18 : -0.18), 0.12 + Math.floor(i / 2) * 0.22, (i % 3) * 0.08 - 0.08]} castShadow>
      <cylinderGeometry args={[0.13, 0.13, 0.2, 12]} />
      <meshStandardMaterial color="#5a5a62" metalness={0.7} roughness={0.4} />
    </mesh>
  );
  return (
    <group position={position}>
      <mesh material={brass} position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.25, 2.8, 12]} />
      </mesh>
      <group ref={beam} position={[0, 2.8, 0]}>
        <mesh material={brass} castShadow>
          <boxGeometry args={[3.4, 0.1, 0.1]} />
        </mesh>
      </group>
      {[-1.6, 1.6].map((x, i) => (
        <group key={x} ref={(g) => g && (pans.current[i] = g)} position={[x, 1.6, 0]}>
          <group position={[0, 0, 0]}>
            <mesh material={brass} onClick={tap(i ? 1 : -1)} castShadow>
              <cylinderGeometry args={[0.6, 0.45, 0.1, 20]} />
            </mesh>
            {Array.from({ length: i ? right : LEFT }, (_, k) => weight(k, 0))}
          </group>
          {/* Three cords from the pan's rim up to the end of the beam. */}
          {[0, 2.09, 4.19].map((a) => {
            const rim = new THREE.Vector3(Math.cos(a) * 0.55, 0.05, Math.sin(a) * 0.55);
            const top = new THREE.Vector3(0, 1.2, 0);
            const mid = rim.clone().add(top).multiplyScalar(0.5);
            const len = rim.distanceTo(top);
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(rim).normalize());
            return (
              <mesh key={a} position={mid} quaternion={q}>
                <cylinderGeometry args={[0.012, 0.012, len, 4]} />
                <meshStandardMaterial color="#6a5a40" />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function Grain({ land, at, count }: { land: Land; at: V; count: number }) {
  const mesh = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.015, 0.02, 1, 4);
    geo.translate(0, 0.5, 0);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#d4b45a', roughness: 1 }), count);
    let seed = 55;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const x = at.x + 2 + r() * 6;
      const z = at.z - 1 - r() * 6;
      o.position.set(x, land.height(x, z), z);
      o.rotation.set((r() - 0.5) * 0.2, 0, (r() - 0.5) * 0.2);
      o.scale.set(1, 0.8 + r() * 0.5, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    return m;
  }, [land, at, count]);
  return <primitive object={mesh} />;
}

function Pots({ land, at }: { land: Land; at: V }) {
  const clay = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b0643a', roughness: 0.85 }), []);
  const pot = useMemo(() => {
    const pts = [0, 0.3, 0.42, 0.45, 0.38, 0.22, 0.2, 0.26].map((r, i) => new THREE.Vector2(r, i * 0.12));
    return new THREE.LatheGeometry(pts, 20);
  }, []);
  return (
    <group>
      {[
        [3, -2, 1],
        [3.8, -2.6, 0.8],
        [2.6, -3.2, 1.2],
        [4.2, -1.6, 0.6],
      ].map(([dx, dz, s], i) => (
        <mesh key={i} material={clay} geometry={pot} position={beside(land, at, dx, dz)} scale={s * 1.6} castShadow />
      ))}
    </group>
  );
}

/** Two waters side by side with a pale barrier between that neither crosses (55:19-20). */
function TwoWaters({ position }: { position: [number, number, number] }) {
  // A symbolic model, not the real place: two pools of different water side by
  // side, kept apart by a low barrier (55:19-20).
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a89c88', roughness: 0.95 }), []);
  return (
    <group position={position} rotation={[0, 0.3, 0]}>
      {[
        [0, -2.1, 8.6, 0.3],
        [0, 2.1, 8.6, 0.3],
        [-4.15, 0, 0.3, 4.5],
        [4.15, 0, 0.3, 4.5],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} material={stone} position={[x, 0.2, z]} castShadow receiveShadow>
          <boxGeometry args={[w, 0.5, d]} />
        </mesh>
      ))}
      <mesh position={[-2.05, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.9, 3.9]} />
        <meshStandardMaterial color="#7fd0c0" roughness={0.1} metalness={0.1} />
      </mesh>
      <mesh position={[2.05, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.9, 3.9]} />
        <meshStandardMaterial color="#1a3f7a" roughness={0.1} metalness={0.2} />
      </mesh>
      <mesh material={stone} position={[0, 0.33, 0]}>
        <boxGeometry args={[0.2, 0.12, 3.9]} />
      </mesh>
    </group>
  );
}

/** Pearls in open shells and branches of red coral in the shallows. Tap one of each. */
function PearlsAndCoral({ position, onDone, hint }: { position: [number, number, number]; onDone: () => void; hint: (t: string) => void }) {
  const [got, setGot] = useState({ pearl: false, coral: false });
  const take = (k: 'pearl' | 'coral') =>
    tapOnly(() => {
      const next = { ...got, [k]: true };
      setGot(next);
      if (next.pearl && next.coral) onDone();
      else hint(k === 'pearl' ? 'A pearl! Now find the coral.' : 'Coral! Now find a pearl.');
    });
  return (
    <group position={position}>
      {/* A shallow pool to hold them. */}
      <mesh position={[0, 0.05, 0.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#3f8fa8" transparent opacity={0.7} roughness={0.1} depthWrite={false} />
      </mesh>
      {[
        [-1.5, 0.5],
        [1.2, -0.8],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} onClick={take('pearl')}>
          <mesh rotation={[-0.6, 0, 0]} position={[0, 0.1, -0.1]}>
            <sphereGeometry args={[0.35, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#d8d0c0" side={THREE.DoubleSide} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.12, 0.05]}>
            <sphereGeometry args={[0.11, 14, 10]} />
            <meshStandardMaterial color="#fffaf2" metalness={0.3} roughness={0.15} emissive={got.pearl ? '#000' : '#4a4038'} />
          </mesh>
        </group>
      ))}
      <group position={[0.2, 0, 1.6]} onClick={take('coral')}>
        {[0, 0.9, -0.8, 1.7, -1.6].map((a, i) => (
          <mesh key={i} position={[Math.sin(a) * 0.2, 0.35 + (i % 2) * 0.1, Math.cos(a) * 0.1]} rotation={[0, a, (i - 2) * 0.35]}>
            <cylinderGeometry args={[0.04, 0.07, 0.8, 6]} />
            <meshStandardMaterial color="#d8503a" roughness={0.6} emissive={got.coral ? '#000' : '#401008'} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Ships with their sails raised high, like mountains on the sea (55:24). */
function Ships({ at }: { at: V }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    group.current?.children.forEach((c, i) => {
      c.position.y = Math.sin(clock.elapsedTime * 0.8 + i) * 0.15;
      c.rotation.z = Math.sin(clock.elapsedTime * 0.6 + i) * 0.03;
    });
  });
  return (
    <group position={[at.x, at.y, at.z]}>
      <group ref={group}>
        {[
          [-6, -8],
          [5, -14],
        ].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.4, 0]} scale={[1, 0.5, 3]} castShadow>
              <sphereGeometry args={[1.2, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              <meshStandardMaterial color="#6b4a2e" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 4, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 7, 8]} />
              <meshStandardMaterial color="#5a3e26" />
            </mesh>
            <mesh position={[0, 4.2, 0.1]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[4, 5.5]} />
              <meshStandardMaterial color="#f2ead8" side={THREE.DoubleSide} roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Four labelled beds and four young plants to set in them: fruit, palm, grain, scented plant (55:11-12). */
function PlantBeds({ land, at, hint, onDone }: { land: Land; at: V; hint: (t: string) => void; onDone: () => void }) {
  const soil = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6a4a32', roughness: 1 }), []);
  const kinds = ['fruit', 'palm', 'grain', 'scent'] as const;
  const labels = { fruit: 'fruit', palm: 'palm trees', grain: 'grain', scent: 'scented\nplants' };
  const signs = useMemo(() => kinds.map((k) => new THREE.MeshBasicMaterial({ map: labelTexture(labels[k], '#fbefd0', '#4a3a1a', 256, 128) })), []);
  const beds = kinds.map((_, i) => beside(land, at, 3.2 + (i % 2) * 2.6, -2.2 - Math.floor(i / 2) * 2.6));
  const spots: DropSpot[] = kinds.map((k, i) => ({ id: k, pos: beds[i], r: 1, slots: [beds[i]], color: '#c8f0a0' }));
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5a9a3a', roughness: 0.8 }), []);
  const node = (k: (typeof kinds)[number]) =>
    k === 'fruit' ? (
      <group>
        <mesh material={leaf} position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.38, 16, 12]} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.6, 8]} />
          <meshStandardMaterial color="#6a4a30" />
        </mesh>
        {[0, 2, 4].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.36, 0.62, Math.sin(a) * 0.36]}>
            <sphereGeometry args={[0.08, 10, 8]} />
            <meshStandardMaterial color="#e8503a" />
          </mesh>
        ))}
      </group>
    ) : k === 'palm' ? (
      <group>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.06, 0.09, 0.7, 10]} />
          <meshStandardMaterial color="#7a6040" />
        </mesh>
        {[0, 1, 2, 3, 4].map((a) => (
          <mesh key={a} material={leaf} position={[Math.cos(a * 1.26) * 0.25, 0.72, Math.sin(a * 1.26) * 0.25]} rotation={[0, -a * 1.26, 0.6]} scale={[1, 0.12, 0.3]}>
            <sphereGeometry args={[0.35, 10, 6]} />
          </mesh>
        ))}
      </group>
    ) : k === 'grain' ? (
      <group>
        {[-0.12, 0, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.4, x * 0.5]} rotation-z={x}>
            <capsuleGeometry args={[0.035, 0.7, 4, 6]} />
            <meshStandardMaterial color="#d8b450" />
          </mesh>
        ))}
      </group>
    ) : (
      <group>
        <mesh material={leaf} position={[0, 0.25, 0]} scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.3, 14, 10]} />
        </mesh>
        {[0, 1.5, 3, 4.5].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.2, 0.45, Math.sin(a) * 0.2]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshStandardMaterial color="#b07ad0" />
          </mesh>
        ))}
      </group>
    );
  const items: DragItem[] = [2, 0, 3, 1].map((i, k) => ({ id: kinds[i], home: beside(land, at, 1.2 + (k % 2) * 0.8, -0.3 - k * 0.6), fits: [kinds[i]], lift: 0.5, node: node(kinds[i]) }));
  return (
    <group>
      {beds.map((b, i) => (
        <group key={i} position={b}>
          <mesh material={soil} position={[0, 0.02, 0]} scale={[1, 0.12, 1]} receiveShadow>
            <sphereGeometry args={[0.9, 24, 10]} />
          </mesh>
          <mesh material={signs[i]} position={[0, 0.55, 0.95]}>
            <planeGeometry args={[0.8, 0.4]} />
          </mesh>
        </group>
      ))}
      <DragPlay items={items} spots={spots} testPrefix="plant-" onWrong={() => hint('Read the little sign on each bed.')} onDone={onDone} />
    </group>
  );
}
