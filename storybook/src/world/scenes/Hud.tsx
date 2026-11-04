// Hud (11): the ark coast. The ark-building and loading passages of Nuh's
// story are told most fully here (11:36-48). Along the path: a shipyard where
// the child fits the last planks to the ark (11:37), the loading ground where
// animals come aboard two by two (11:40) and the weather turns, a stormy bay of
// waves like mountains (11:42), the green slopes where the ark comes to rest
// (11:44), and an empty tent with a roasted calf for guests (11:69).
// Prophet Nuh, his family and the guests are never shown. The animal kinds are
// the artist's choice: the Quran says "of each [creature] two mates" without
// a list.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import { DragPlay, type DragItem, type DropSpot } from './drag';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, type P3, type V } from './kit';
import { Animal, Jar, RainCloud, hullGeometry, labelTexture, plankTexture, type AnimalKind } from './props';

export function HudScene({ land, stops, complete, hint }: SceneProps) {
  const yard = stopNamed(stops, 'Shipyard');
  const load = stopNamed(stops, 'Rising Waters');
  const waves = stopNamed(stops, 'Waves like Mountains');
  const judi = stopNamed(stops, 'Slopes of al-Judiyy');
  const tent = stopNamed(stops, 'Tent of Guests');
  return (
    <group>
      {yard && <Shipyard land={land} at={yard.pos} onBuilt={() => (complete('Build the ark'), hint('The ark is built. "And construct the ship under Our observation" (11:37).'))} hint={hint} />}
      {load && (
        <Loading
          land={land}
          at={load.pos}
          onLoaded={() => (complete('Two of each kind'), hint('All aboard. "Load upon the ship of each [creature] two mates" (11:40). The rain begins.'))}
          hint={hint}
        />
      )}
      {waves && <StormBay land={land} at={waves.pos} />}
      {judi && <Judiyy land={land} at={judi.pos} />}
      {tent && <Tent position={beside(land, tent.pos, 4.5, -3)} />}
    </group>
  );
}

const ARK = { length: 9, width: 3.2, height: 2.2 };

function useArkMaterials() {
  return useMemo(() => {
    const t = plankTexture('#8a5a34', '#4a2e18', 12);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 1);
    return {
      hull: new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }),
      deck: new THREE.MeshStandardMaterial({ color: '#b08458', roughness: 0.85 }),
      roof: new THREE.MeshStandardMaterial({ color: '#9a6a3e', roughness: 0.8 }),
      dark: mat('#5a3a22'),
    };
  }, []);
}

/** The finished ark: a rounded hull, a deck and a long cabin with a gently curved roof. Length along z. */
function Ark({ rot = 0, cabin = true }: { rot?: number; cabin?: boolean }) {
  const m = useArkMaterials();
  const hull = useMemo(() => hullGeometry(ARK.length, ARK.width, ARK.height), []);
  return (
    <group rotation-y={Math.PI / 2 + rot}>
      <mesh geometry={hull} material={m.hull} position={[0, ARK.height / 2, 0]} castShadow receiveShadow />
      <mesh material={m.deck} position={[0, ARK.height - 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[ARK.length * 0.82, 0.12, ARK.width * 0.86]} />
      </mesh>
      {cabin && (
        <group position={[0, ARK.height, 0]}>
          <mesh material={m.hull} position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[ARK.length * 0.55, 1.5, ARK.width * 0.62]} />
          </mesh>
          <mesh material={m.roof} position={[0, 1.55, 0]} rotation-z={Math.PI / 2} scale={[0.35, 1, 1]} castShadow>
            <cylinderGeometry args={[ARK.width * 0.42, ARK.width * 0.42, ARK.length * 0.6, 24, 1, false, 0, Math.PI]} />
          </mesh>
          {[-1.4, 0, 1.4].map((x) => (
            <mesh key={x} material={m.dark} position={[x, 0.85, ARK.width * 0.31 + 0.01]}>
              <boxGeometry args={[0.5, 0.45, 0.04]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

/** The shipyard: keel and ribs on wooden stocks, four planks to fit (11:37). */
function Shipyard({ land, at, onBuilt, hint }: { land: Land; at: V; onBuilt: () => void; hint: (t: string) => void }) {
  const m = useArkMaterials();
  const [built, setBuilt] = useState(false);
  const C = beside(land, at, 7, -7.5);
  const y0 = C[1] + 0.6;
  const items: DragItem[] = [0, 1, 2, 3].map((i) => ({
    id: `plank${i}`,
    home: beside(land, at, 1.6 + (i % 2) * 0.9, -1.2 - i * 0.7),
    fits: [`side${i}`],
    lift: 0.5,
    node: (
      <mesh material={m.hull} position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.35, 0.16, 3.4]} />
      </mesh>
    ),
  }));
  // Four gaps along the near side of the hull, bow to stern and low to high.
  const spots: DropSpot[] = [0, 1, 2, 3].map((i) => {
    const z = C[2] + (i % 2 === 0 ? 1.8 : -1.8);
    const y = y0 + 0.5 + Math.floor(i / 2) * 0.7;
    return { id: `side${i}`, pos: [C[0] - 2.3, land.height(C[0] - 2.3, z), z] as P3, r: 1.5, slots: [[C[0] - 1.45 - Math.floor(i / 2) * 0.05, y, z] as P3], color: '#ffd27a' };
  });
  return (
    <group>
      <group position={[C[0], y0, C[2]]}>
        {/* Stocks under the keel. */}
        {[-3, 0, 3].map((z) => (
          <mesh key={z} material={m.dark} position={[0, -0.3, z]} castShadow>
            <boxGeometry args={[2.4, 0.6, 0.4]} />
          </mesh>
        ))}
        <mesh material={m.dark} position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, ARK.length]} />
        </mesh>
        {/* Ribs: half-rings rising from the keel. */}
        {[-3.4, -2.2, -1.1, 0, 1.1, 2.2, 3.4].map((z, i) => (
          <mesh key={z} material={m.dark} position={[0, 1.6, z]} rotation-z={Math.PI} scale={[1, 1.3 - Math.abs(z) * 0.06, 1]} castShadow>
            <torusGeometry args={[1.5 - Math.abs(z) * 0.12, 0.08, 8, 24, Math.PI]} />
          </mesh>
        ))}
        <group visible={built} position={[0, -0.6, 0]} rotation-y={-Math.PI / 2 + Math.PI / 2}>
          <Ark cabin={false} />
        </group>
      </group>
      {/* A sawhorse and a stack of timber for a busy yard. */}
      <group position={beside(land, at, 3.5, -8.5)}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} material={m.hull} position={[0, 0.15 + i * 0.3, 0]} rotation-y={i * 0.08} castShadow>
            <boxGeometry args={[0.6, 0.28, 3.6]} />
          </mesh>
        ))}
      </group>
      <DragPlay
        items={items}
        spots={spots}
        testPrefix="ark-"
        onPlace={(_, __, n) => n < 4 && hint(`${4 - n} more plank${4 - n > 1 ? 's' : ''} to fit.`)}
        onWrong={() => hint('That plank belongs in another gap. Try the next glowing spot.')}
        onDone={() => (setBuilt(true), onBuilt())}
      />
    </group>
  );
}

const PAIRS: { kind: AnimalKind; scale: number; label: string }[] = [
  { kind: 'giraffe', scale: 0.55, label: 'giraffes' },
  { kind: 'camel', scale: 0.6, label: 'camels' },
  { kind: 'sheep', scale: 0.8, label: 'sheep' },
  { kind: 'elephant', scale: 0.55, label: 'elephants' },
];

/** The loading ground: the ark with a ramp, animals in pairs and supplies (11:40). */
function Loading({ land, at, onLoaded, hint }: { land: Land; at: V; onLoaded: () => void; hint: (t: string) => void }) {
  const [loaded, setLoaded] = useState(false);
  const A = beside(land, at, 9.5, -9);
  const deckY = A[1] + ARK.height + 0.05;
  const m = useArkMaterials();
  const signs = useMemo(() => PAIRS.map((p) => new THREE.MeshBasicMaterial({ map: labelTexture(`two\n${p.label}`) })), []);
  // Pens on the ground at the foot of the ramp; each takes one pair, which then stands on deck.
  const spots: DropSpot[] = PAIRS.map((p, i) => {
    const z = A[2] + 3 - i * 2;
    const x = A[0] - 4.2;
    return {
      id: p.kind,
      pos: [x, land.height(x, z), z] as P3,
      r: 1,
      slots: [
        [A[0] - 0.6, deckY, A[2] + 3.2 - i * 2.1],
        [A[0] + 0.6, deckY, A[2] + 3.2 - i * 2.1],
      ] as P3[],
    };
  });
  spots.push({ id: 'hold', pos: beside(land, at, 3.5, -9.2), r: 1, slots: [[A[0] - 1.3, deckY, A[2] - 4], [A[0] + 1.3, deckY, A[2] - 4]] as P3[], color: '#ffe7b0' });
  const items: DragItem[] = PAIRS.flatMap((p, i) =>
    [0, 1].map((k) => {
      const dx = 1.2 + ((i * 2 + k) % 4) * 0.9;
      const dz = 0.5 - Math.floor((i * 2 + k) / 4) * 2.2 - ((i + k) % 2) * 0.6;
      return { id: `${p.kind}${k}`, home: beside(land, at, dx, dz), fits: [p.kind], lift: 0.7, node: <Animal kind={p.kind} scale={p.scale} /> };
    }),
  );
  items.push(
    { id: 'jar', home: beside(land, at, 2.4, -5), fits: ['hold'], lift: 0.5, node: <Jar /> },
    {
      id: 'sack',
      home: beside(land, at, 1.4, -5.4),
      fits: ['hold'],
      lift: 0.5,
      node: (
        <mesh position={[0, 0.35, 0]} scale={[1, 1.2, 0.8]} castShadow>
          <sphereGeometry args={[0.32, 16, 12]} />
          <meshStandardMaterial color="#d8c08a" roughness={0.95} />
        </mesh>
      ),
    },
  );
  return (
    <group>
      <group position={A}>
        <Ark />
        {/* The ramp down the near side. */}
        <mesh material={m.deck} position={[-2.9, ARK.height / 2, 0]} rotation-z={-0.55} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.14, 1.6]} />
        </mesh>
      </group>
      {PAIRS.map((p, i) => (
        <mesh key={p.kind} material={signs[i]} position={[spots[i].pos[0] - 1.05, spots[i].pos[1] + 0.9, spots[i].pos[2]]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[0.9, 0.9]} />
        </mesh>
      ))}
      <DragPlay
        items={items}
        spots={spots}
        testPrefix="load-"
        onPlace={(it, sp, n) => {
          const left = items.length - n;
          if (!left) return;
          const pair = spots.find((s) => s.id === sp);
          hint(sp === 'hold' ? `Supplies stored. ${left} still to load.` : pair ? `${left} still to load. Each kind comes in a pair.` : '');
          void it;
        }}
        onWrong={(it, sp) => hint(sp === 'hold' ? 'The hold is for food and water. Animals go to their own pen.' : `That pen is for ${PAIRS.find((p) => p.kind === sp)?.label ?? 'another kind'}. Find the matching sign.`)}
        onDone={() => (setLoaded(true), onLoaded())}
      />
      {/* The weather turns once everyone is aboard: dark clouds, rain, water rising round the ark. */}
      <Weather on={loaded} at={A} />
    </group>
  );
}

function Weather({ on, at }: { on: boolean; at: P3 }) {
  const water = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current = THREE.MathUtils.damp(t.current, on ? 1 : 0, 0.5, dt);
    if (water.current) {
      water.current.position.y = at[1] - 0.6 + t.current * 1.1;
      water.current.visible = t.current > 0.02;
    }
    if (light.current) light.current.intensity = t.current * 2;
  });
  return (
    <group>
      {on && (
        <>
          <RainCloud position={[at[0] - 3, at[1] + 10, at[2] + 2]} width={9} dark={0.75} />
          <RainCloud position={[at[0] + 2, at[1] + 11, at[2] - 4]} width={11} dark={0.8} />
        </>
      )}
      <mesh ref={water} position={[at[0], at[1] - 0.6, at[2]]} rotation-x={-Math.PI / 2} visible={false}>
        <circleGeometry args={[7.5, 48]} />
        <meshStandardMaterial color="#4a7a88" roughness={0.25} metalness={0.1} transparent opacity={0.85} />
      </mesh>
      <pointLight ref={light} position={[at[0] - 4, at[1] + 6, at[2] + 4]} color="#a8c0e0" intensity={0} distance={20} />
    </group>
  );
}

/** A stormy bay where the ark rides waves like mountains (11:42). */
function StormBay({ land, at }: { land: Land; at: V }) {
  const C = beside(land, at, 22, -20);
  const geo = useMemo(() => new THREE.PlaneGeometry(40, 40, 60, 60).rotateX(-Math.PI / 2), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
  const ark = useRef<THREE.Group>(null);
  const wave = (x: number, z: number, t: number) => Math.sin(x * 0.28 + t * 0.9) * 1.3 + Math.sin(z * 0.21 - t * 0.7) * 1.1 + Math.sin((x + z) * 0.5 + t * 1.6) * 0.3;
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3];
      const z = base[i * 3 + 2];
      // Calmer at the rim so the basin edge stays hidden in the rocks.
      const edge = 1 - Math.min(1, Math.max(Math.abs(x), Math.abs(z)) / 20) ** 4;
      p.setY(i, wave(x, z, t) * edge);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    if (ark.current) {
      const y = wave(0, 0, t);
      ark.current.position.y = y - 0.9;
      ark.current.rotation.x = (wave(0, 1.5, t) - wave(0, -1.5, t)) * 0.12;
      ark.current.rotation.z = (wave(1.5, 0, t) - wave(-1.5, 0, t)) * 0.08;
    }
  });
  const rock = useMemo(() => mat('#8a7a66'), []);
  return (
    <group position={[C[0], C[1] + 0.4, C[2]]}>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#3e6a78" roughness={0.3} metalness={0.15} />
      </mesh>
      <group ref={ark} scale={0.7}>
        <Ark rot={0.6} />
      </group>
      {/* Rocks ring the bay. */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <mesh key={i} material={rock} position={[Math.cos(a) * 20, 0, Math.sin(a) * 20]} scale={[3, 1.8 + (i % 3) * 0.6, 3]} castShadow>
            <dodecahedronGeometry args={[1, 0]} />
          </mesh>
        );
      })}
      <RainCloud position={[0, 14, 0]} width={18} dark={0.85} />
      <RainCloud position={[-9, 13, 6]} width={12} dark={0.8} />
      <pointLight position={[0, 10, 0]} color="#c0d4f0" intensity={3} distance={40} />
    </group>
  );
}

/** The ark at rest on a green mountainside after the water subsided (11:44). */
function Judiyy({ land, at }: { land: Land; at: V }) {
  const C = beside(land, at, 12, -14);
  const grass = useMemo(() => mat('#6a9a48', 0.9), []);
  return (
    <group position={C}>
      <mesh material={grass} position={[0, -1, 0]} scale={[11, 6, 9]} receiveShadow castShadow>
        <sphereGeometry args={[1, 40, 24]} />
      </mesh>
      <group position={[0, 4.6, 0]} rotation={[0.08, -0.5, 0.06]} scale={0.85}>
        <Ark />
      </group>
      {/* Puddles shining in the sun on the lower slope. */}
      {[[-5, -6], [4, -5.5], [-1, -7.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3 + i * 0.2, -z]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.9 + i * 0.2, 24]} />
          <meshStandardMaterial color="#9ac4d8" roughness={0.1} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** An empty tent with a roasted calf on a platter, prepared for guests (11:69). */
function Tent({ position }: { position: P3 }) {
  const cloth = useMemo(() => mat('#7a4a3a', 0.95), []);
  const stripe = useMemo(() => mat('#e8d2a8', 0.95), []);
  const wood = useMemo(() => mat('#6a4a2e'), []);
  return (
    <group position={position} rotation-y={-0.4}>
      <mesh material={cloth} position={[0, 2.1, 0]} scale={[1, 0.35, 0.8]} castShadow receiveShadow>
        <sphereGeometry args={[3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={stripe} position={[0, 2.12, 0]} scale={[1.002, 0.352, 0.802]}>
        <sphereGeometry args={[3, 32, 16, 0, Math.PI * 2, 0.45, 0.12]} />
      </mesh>
      {[-2.2, 0, 2.2].map((x) => (
        <mesh key={x} material={wood} position={[x, 1.05, 1.7]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 2.1, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.03, 0.4]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[2.2, 32]} />
        <meshStandardMaterial color="#a8442e" roughness={1} />
      </mesh>
      <group position={[0, 0.1, 0.8]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.8, 0.7, 0.1, 32]} />
          <meshStandardMaterial color="#c8a050" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.32, 0]} rotation-z={Math.PI / 2} castShadow>
          <capsuleGeometry args={[0.3, 0.5, 6, 16]} />
          <meshStandardMaterial color="#8a4a22" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}
