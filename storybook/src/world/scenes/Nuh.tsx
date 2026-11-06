// Nuh (71): the call to ask forgiveness and the promise in 71:10-12 of rain
// in showers, gardens and rivers. The child carries rain clouds over three
// dry fields; they turn green and the dry riverbed by the gardens fills
// (an adaptation of the promise, not an event narrated in the surah). Then
// the moon and the sun are set on their pedestals: "a [reflected] light" and
// "a burning lamp" (71:16). Last, roads wind through a wide land (71:19-20).
// Prophet Nuh and his people are never shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import { DragPlay, type DragItem, type DropSpot } from './drag';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type P3, type V } from './kit';
import { RainCloud, labelTexture } from './props';

export function NuhScene({ land, stops, complete, hint }: SceneProps) {
  const showers = stopNamed(stops, 'Showers of Forgiveness');
  const gardens = stopNamed(stops, 'Gardens and Rivers');
  const lamp = stopNamed(stops, 'Seven Heavens and Lamp');
  const roads = stopNamed(stops, 'Roads of the Expanse');
  const [rained, setRained] = useState(false);
  return (
    <group>
      {showers && (
        <Showers
          land={land}
          at={showers.pos}
          hint={hint}
          onDone={() => (setRained(true), complete('Ask forgiveness'), hint('"He will send [rain from] the sky upon you in [continuing] showers" (71:11). Walk on to see the river.'))}
        />
      )}
      {gardens && <GardensAndRiver land={land} at={gardens.pos} flowing={rained} />}
      {lamp && (
        <LampAndLight
          land={land}
          at={lamp.pos}
          hint={hint}
          onDone={() => (complete('Sun and moon'), hint('"And made the moon therein a [reflected] light and made the sun a burning lamp" (71:16).'))}
        />
      )}
      {roads && <Roads land={land} at={roads.pos} />}
    </group>
  );
}

/** A field that is cracked and pale until rain comes, then green rows grow. */
function Field({ position, wet }: { position: P3; wet: boolean }) {
  const g = useRef(0);
  const crops = useRef<THREE.Group>(null);
  const soil = useRef<THREE.MeshStandardMaterial>(null);
  const dry = useMemo(() => new THREE.Color('#c9ab7a'), []);
  const green = useMemo(() => new THREE.Color('#6a9a40'), []);
  useFrame((_, dt) => {
    g.current = THREE.MathUtils.damp(g.current, wet ? 1 : 0, 0.8, dt);
    if (crops.current) crops.current.scale.set(1, Math.max(0.02, g.current), 1);
    soil.current?.color.copy(dry).lerp(green, g.current * 0.8);
  });
  const leaf = useMemo(() => mat('#5f9a3a', 0.8), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} scale={[2.2, 0.1, 1.6]} receiveShadow>
        <sphereGeometry args={[1, 28, 10]} />
        <meshStandardMaterial ref={soil} color="#c9ab7a" roughness={1} />
      </mesh>
      <group ref={crops} position={[0, 0.1, 0]}>
        {Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 6 }, (_, c) => (
            <mesh key={`${r}-${c}`} material={leaf} position={[-1.5 + c * 0.6, 0.22, -0.9 + r * 0.6]} scale={[1, 1.6, 1]} castShadow>
              <sphereGeometry args={[0.16, 10, 8]} />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}

function Showers({ land, at, hint, onDone }: { land: Land; at: V; hint: (t: string) => void; onDone: () => void }) {
  const [wet, setWet] = useState<string[]>([]);
  const fields: P3[] = [beside(land, at, 4.5, -2.5), beside(land, at, 8, -6), beside(land, at, 3.5, -8.5)];
  const H = 4.2;
  const spots: DropSpot[] = fields.map((p, i) => ({ id: `field${i}`, pos: p, r: 2.2, slots: [[p[0], p[1] + H, p[2]]] as P3[], color: '#bfe4ff' }));
  const items: DragItem[] = [0, 1, 2].map((i) => {
    const h = beside(land, at, -2 + i * 2, -3 - i * 0.8);
    return {
      id: `cloud${i}`,
      home: [h[0], h[1] + H - 1, h[2]] as P3,
      fits: ['field0', 'field1', 'field2'],
      lift: 0.4,
      node: <RainCloud position={[0, 0, 0]} width={2.4} rain={false} dark={0.15} />,
    };
  });
  return (
    <group>
      {fields.map((p, i) => (
        <group key={i}>
          <Field position={p} wet={wet.includes(`field${i}`)} />
          {wet.includes(`field${i}`) && <RainCloud position={[p[0], p[1] + H, p[2]]} width={2.4} dark={0.3} />}
        </group>
      ))}
      <DragPlay
        items={items}
        spots={spots}
        testPrefix="rain-"
        onPlace={(_, sp, n) => (setWet((w) => [...w, sp]), n < 3 && hint(`Rain on the dry field. ${3 - n} still waiting.`))}
        onDone={onDone}
      />
    </group>
  );
}

/** Fruit trees along a riverbed that is dry until the rain has come (71:12). */
function GardensAndRiver({ land, at, flowing }: { land: Land; at: V; flowing: boolean }) {
  const water = useRef<THREE.Mesh>(null);
  const f = useRef(0);
  const R = beside(land, at, 5, -3);
  useFrame((_, dt) => {
    f.current = THREE.MathUtils.damp(f.current, flowing ? 1 : 0, 0.6, dt);
    if (water.current) {
      water.current.scale.set(1, Math.max(0.01, f.current), 1);
      water.current.visible = f.current > 0.02;
    }
  });
  const bed = useMemo(() => mat('#a8916c'), []);
  const pebble = useMemo(() => mat('#bcae98'), []);
  const trees = useMemo(() => {
    const r = rng(71);
    return Array.from({ length: 6 }, (_, i) => ({ dx: (i % 2 ? 3.2 : -2.6) + (r() - 0.5), dz: 4 - i * 2.2, s: 0.8 + r() * 0.3, fruit: ['#e85a3a', '#f0b030', '#d04a6a'][i % 3] }));
  }, []);
  return (
    <group>
      <group position={R} rotation-y={0.15}>
        {/* The riverbed: a long shallow trough lined with pebbles. */}
        <mesh material={bed} position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[2.2, 16]} />
        </mesh>
        {Array.from({ length: 18 }, (_, i) => (
          <mesh key={i} material={pebble} position={[(i % 2 ? 1 : -1) * (1.15 + (i % 3) * 0.1), 0.1, -7.5 + i * 0.9]} scale={[0.3, 0.16, 0.3]}>
            <dodecahedronGeometry args={[1, 0]} />
          </mesh>
        ))}
        <mesh ref={water} position={[0, 0.1, 0]} visible={false}>
          <boxGeometry args={[2.1, 0.12, 16]} />
          <meshStandardMaterial color="#5aa6c8" roughness={0.15} metalness={0.15} transparent opacity={0.9} />
        </mesh>
        {trees.map((t, i) => (
          <FruitTree key={i} position={[t.dx, land.height(R[0] + t.dx, R[2] + t.dz) - R[1], t.dz]} scale={t.s} fruit={t.fruit} />
        ))}
      </group>
    </group>
  );
}

export function FruitTree({ position, scale = 1, fruit = '#e85a3a' }: { position: P3; scale?: number; fruit?: string }) {
  const bark = useMemo(() => mat('#6a4a30'), []);
  const leaf = useMemo(() => mat('#5a9a40', 0.8), []);
  const fr = useMemo(() => mat(fruit, 0.5), [fruit]);
  const puffs = useMemo(() => {
    const r = rng(Math.round(scale * 1000));
    return Array.from({ length: 6 }, (_, i) => ({ p: [Math.cos(i) * 0.8, 2.6 + (i % 3) * 0.35, Math.sin(i) * 0.8] as P3, s: 0.75 + r() * 0.3 }));
  }, [scale]);
  return (
    <group position={position} scale={scale}>
      <mesh material={bark} position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.24, 2.2, 12]} />
      </mesh>
      <mesh material={leaf} position={[0, 3.1, 0]} castShadow>
        <sphereGeometry args={[1.05, 20, 14]} />
      </mesh>
      {puffs.map((p, i) => (
        <mesh key={i} material={leaf} position={p.p} scale={p.s} castShadow>
          <sphereGeometry args={[0.7, 16, 12]} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} material={fr} position={[Math.cos(i * 2.4) * 1.05, 2.6 + (i % 4) * 0.3, Math.sin(i * 2.4) * 1.05]}>
          <sphereGeometry args={[0.12, 12, 8]} />
        </mesh>
      ))}
    </group>
  );
}

/** Two pedestals and two discs: the sun goes to "a burning lamp", the moon to "a [reflected] light" (71:16). */
function LampAndLight({ land, at, hint, onDone }: { land: Land; at: V; hint: (t: string) => void; onDone: () => void }) {
  const stone = useMemo(() => mat('#e8dcc6'), []);
  const plates = useMemo(() => ({ sun: new THREE.MeshBasicMaterial({ map: labelTexture('a burning\nlamp', '#fbe7c2', '#7a3a10', 512, 256) }), moon: new THREE.MeshBasicMaterial({ map: labelTexture('a [reflected]\nlight', '#e6ecf6', '#2a3a5a', 512, 256) }) }), []);
  const P = { sun: beside(land, at, 3.2, -3.5), moon: beside(land, at, 6.2, -3.5) };
  const top = 1.25;
  const spots: DropSpot[] = (['sun', 'moon'] as const).map((k) => ({ id: k, pos: [P[k][0], P[k][1], P[k][2] + 1.3] as P3, r: 1.1, slots: [[P[k][0], P[k][1] + top + 0.5, P[k][2]]] as P3[] }));
  const items: DragItem[] = [
    {
      id: 'moon',
      home: beside(land, at, 1.6, -1.2),
      fits: ['moon'],
      node: (
        <mesh position={[0, 0.45, 0]} castShadow>
          <sphereGeometry args={[0.42, 28, 18]} />
          <meshStandardMaterial color="#dfe4ee" roughness={0.9} />
        </mesh>
      ),
    },
    {
      id: 'sun',
      home: beside(land, at, 0.5, -2.2),
      fits: ['sun'],
      node: (
        <group position={[0, 0.45, 0]}>
          <mesh>
            <sphereGeometry args={[0.45, 28, 18]} />
            <meshStandardMaterial color="#ffb040" emissive="#ff8a20" emissiveIntensity={2.2} />
          </mesh>
          <pointLight color="#ffb060" intensity={3} distance={6} />
        </group>
      ),
    },
  ];
  return (
    <group>
      {(['sun', 'moon'] as const).map((k) => (
        <group key={k} position={P[k]}>
          <mesh material={stone} position={[0, top / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.45, 0.6, top, 24]} />
          </mesh>
          <mesh material={stone} position={[0, top, 0]}>
            <cylinderGeometry args={[0.7, 0.6, 0.12, 24]} />
          </mesh>
          <mesh material={plates[k]} position={[0, 0.6, 0.62]} rotation-x={-0.1}>
            <planeGeometry args={[1.1, 0.55]} />
          </mesh>
        </group>
      ))}
      <DragPlay items={items} spots={spots} testPrefix="sky-" onWrong={(it) => hint(it === 'sun' ? 'The sun is the one that burns and shines by itself.' : 'The moon gives back light it receives.')} onDone={onDone} />
    </group>
  );
}

/** Rolling green hills with roads winding between them into the distance (71:19-20). */
function Roads({ land, at }: { land: Land; at: V }) {
  const hill = useMemo(() => mat('#7aa055', 0.9), []);
  const road = useMemo(() => mat('#d8c49a', 1), []);
  const C = beside(land, at, 14, -16);
  const hills = useMemo(() => {
    const r = rng(20);
    return Array.from({ length: 9 }, (_, i) => ({ x: (i % 3) * 12 - 12 + (r() - 0.5) * 4, z: -Math.floor(i / 3) * 12 + (r() - 0.5) * 4, s: 4 + r() * 3 }));
  }, []);
  // Two roads, drawn as rows of flat stones that weave between the hills.
  const dots = useMemo(
    () =>
      [0, 1].flatMap((k) =>
        Array.from({ length: 60 }, (_, i) => {
          const z = 8 - i * 0.7;
          return [Math.sin(i * 0.12 + k * 2) * 5 + (k ? 6 : -6), z] as [number, number];
        }),
      ),
    [],
  );
  return (
    <group position={C}>
      {hills.map((h, i) => (
        <mesh key={i} material={hill} position={[h.x, -h.s * 0.45, h.z]} scale={[h.s, h.s * 0.7, h.s]} castShadow receiveShadow>
          <sphereGeometry args={[1, 28, 16]} />
        </mesh>
      ))}
      {dots.map(([x, z], i) => (
        <mesh key={i} material={road} position={[x, land.height(C[0] + x, C[2] + z) - C[1] + 0.06, z]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.55, 14]} />
        </mesh>
      ))}
    </group>
  );
}
