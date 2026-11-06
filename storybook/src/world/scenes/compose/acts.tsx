// Hands-on activity templates for the composed worlds. Each is a small game
// played in the scene with the drag-and-place system: carry things to a place,
// sort them into labelled spots, bring rain to dry fields, plant seeds that
// grow, lay numbered stones in order, bring animals in pairs, or tap to find.
// When it is done, the hint shows the verified translation of the ayah it
// comes from (never paraphrased).
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { getVerse } from '@/content/quran';
import type { Land } from '../../terrain';
import { DragPlay, type DragItem, type DropSpot } from '../drag';
import { beside, tapOnly, type P3, type V } from '../kit';
import { Animal, FlowerBed, Jar, RainCloud, labelTexture, type AnimalKind } from '../props';
import { C } from './pieces';

export type ActSpec = {
  name: string;
  ref: string;
  area: string;
  mech: 'carry' | 'sort' | 'rain' | 'plant' | 'order' | 'pairs' | 'tap';
  /** The ayah ("s:a") whose translation is shown when the activity is done. */
  quote: string;
  desc: string;
  item?: string;
  n?: number;
  label?: string;
  groups?: { item: string; n: number; label: string }[];
  grow?: 'grain' | 'flowers' | 'tree' | 'vine' | 'shoot';
  kinds?: AnimalKind[];
  start?: number;
  /** Shift the whole activity from its place (metres right, forward). */
  dx?: number;
  dz?: number;
};

/** The verified translation of one ayah, quoted with its reference. */
export function quoteOf(ref: string) {
  const [s, a] = ref.split(':').map(Number);
  const t = getVerse(s, a)?.translation_text;
  return t ? `"${t.trim()}" (${s}:${a})` : `(${ref})`;
}

const sign = (text: string) => new THREE.MeshBasicMaterial({ map: labelTexture(text, '#fbefd0', '#4a3a1a', 256, 128) });

/** What a carried thing looks like. */
export function propNode(item: string): ReactNode {
  if (item.startsWith('animal:')) return <Animal kind={item.slice(7) as AnimalKind} scale={0.7} />;
  switch (item) {
    case 'jar':
      return <Jar scale={0.9} />;
    case 'stone':
    case 'block':
      return (
        <mesh material={C(item === 'stone' ? '#cbb894' : '#d8c8a4')} position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.8, 0.55, 0.7]} />
        </mesh>
      );
    case 'brick':
      return (
        <mesh material={C('#c0704a')} position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.7, 0.35, 0.4]} />
        </mesh>
      );
    case 'plank':
      return (
        <mesh material={C('#9a6a40')} position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.35, 0.16, 2.6]} />
        </mesh>
      );
    case 'iron':
      return (
        <mesh material={C('#4a4c52', 0.4, 0.8)} position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.9, 0.35, 0.5]} />
        </mesh>
      );
    case 'sheaf':
      return (
        <group>
          <mesh material={C('#e0bc68', 1)} position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.26, 1, 14]} />
          </mesh>
          <mesh material={C('#e0bc68', 1)} position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.28, 14, 10]} />
          </mesh>
        </group>
      );
    case 'basket':
    case 'fruit':
    case 'bread':
      return (
        <group>
          <mesh material={C('#b08a50')} position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.4, 0.3, 0.44, 18, 1, true]} />
          </mesh>
          <mesh material={C(item === 'bread' ? '#c88a44' : item === 'fruit' ? '#e85a3a' : '#f0b030', 0.6)} position={[0, 0.44, 0]} scale={[1, 0.5, 1]}>
            <sphereGeometry args={[0.34, 16, 10]} />
          </mesh>
        </group>
      );
    case 'sack':
    case 'seed':
      return (
        <mesh material={C(item === 'seed' ? '#c8a070' : '#d8c08a', 0.95)} position={[0, item === 'seed' ? 0.2 : 0.35, 0]} scale={item === 'seed' ? 0.55 : 1} castShadow>
          <sphereGeometry args={[0.34, 16, 12]} />
        </mesh>
      );
    case 'lamp':
      return (
        <group>
          <mesh material={C('#c8a050', 0.4, 0.5)} position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.25, 0.3, 0.24, 16]} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.16, 16, 12]} />
            <meshStandardMaterial color="#fff0c0" emissive="#ffb040" emissiveIntensity={2.5} />
          </mesh>
        </group>
      );
    case 'chest':
      return (
        <mesh material={C('#7a5030')} position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.8, 0.5, 0.55]} />
        </mesh>
      );
    case 'weight':
      return (
        <mesh material={C('#c8a050', 0.35, 0.7)} position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.25, 0.4, 16]} />
        </mesh>
      );
    case 'pearl':
      return (
        <mesh material={C('#fffaf0', 0.15, 0.3)} position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.22, 20, 14]} />
        </mesh>
      );
    case 'star':
      return (
        <mesh position={[0, 0.4, 0]}>
          <icosahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#fff2c0" emissive="#ffd060" emissiveIntensity={2} />
        </mesh>
      );
    case 'sapling':
      return (
        <group>
          <mesh material={C('#6a4a32', 1)} position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.22, 0.18, 0.3, 14]} />
          </mesh>
          <mesh material={C('#5a9a3a', 0.8)} position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.3, 16, 12]} />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh material={C('#d8c8a4')} position={[0, 0.3, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 12]} />
        </mesh>
      );
  }
}

type Props = { land: Land; at: V; a: ActSpec; done: () => void; hint: (t: string) => void; prefix: string };

/** Home spots for n items, in a loose cluster beside the path near the viewer. */
const homes = (land: Land, at: V, n: number, ox: number, oz: number) => Array.from({ length: n }, (_, i) => beside(land, at, ox + 1.2 + (i % 3) * 0.95, oz - 0.3 - Math.floor(i / 3) * 1.0 - (i % 2) * 0.3));

/** Carry n things to one place, where they settle in a neat row (stones to foundations, lamps to a niche...). */
function Carry({ land, at, a, done, hint, prefix }: Props) {
  const n = a.n ?? 4;
  const ox = a.dx ?? 0;
  const oz = a.dz ?? 0;
  const T = beside(land, at, ox + 5.5, oz - 4.5);
  const label = useMemo(() => (a.label ? sign(a.label) : null), [a.label]);
  const spots: DropSpot[] = [{ id: 'there', pos: T, r: 2, slots: Array.from({ length: n }, (_, i) => [T[0] + ((i % 4) - 1.5) * 0.95, land.height(T[0], T[2]), T[2] + Math.floor(i / 4) * 0.9 - 0.4] as P3) }];
  const items: DragItem[] = homes(land, at, n, ox, oz).map((h, i) => ({ id: `${a.item}${i}`, home: h, fits: ['there'], node: propNode(a.item ?? 'stone') }));
  return (
    <group>
      {label && (
        <mesh material={label} position={[T[0], T[1] + 1.1, T[2] + 1.6]}>
          <planeGeometry args={[1.2, 0.6]} />
        </mesh>
      )}
      <DragPlay items={items} spots={spots} testPrefix={prefix} onPlace={(_, __, k) => k < n && hint(`${n - k} more to carry.`)} onDone={done} />
    </group>
  );
}

/** Sort things into labelled spots (each group to its own sign). */
function Sort({ land, at, a, done, hint, prefix }: Props) {
  const groups = a.groups ?? [];
  const ox = a.dx ?? 0;
  const oz = a.dz ?? 0;
  const signs = useMemo(() => groups.map((g) => sign(g.label)), [groups]);
  const spotPos = groups.map((_, i) => beside(land, at, ox + 4.6 + (i % 2) * 2.8, oz - 2.6 - Math.floor(i / 2) * 2.8 - (i % 2) * 0.8));
  const spots: DropSpot[] = groups.map((g, i) => ({ id: `g${i}`, pos: spotPos[i], r: 1.2, slots: Array.from({ length: g.n }, (_, k) => [spotPos[i][0] + (k - (g.n - 1) / 2) * 0.8, spotPos[i][1], spotPos[i][2] - 0.2] as P3), color: '#c8f0a0' }));
  const total = groups.reduce((t, g) => t + g.n, 0);
  const hs = homes(land, at, total, ox, oz);
  // Mix the groups so the child has to sort them.
  const flat = groups.flatMap((g, gi) => Array.from({ length: g.n }, (_, k) => ({ g, gi, k })));
  const mixed = flat.map((_, i) => flat[(i * 7) % flat.length]);
  const items: DragItem[] = mixed.map(({ g, gi, k }, i) => ({ id: `${gi}-${k}`, home: hs[i], fits: [`g${gi}`], node: propNode(g.item) }));
  return (
    <group>
      {spotPos.map((q, i) => (
        <mesh key={i} material={signs[i]} position={[q[0], q[1] + 1, q[2] + 1.15]}>
          <planeGeometry args={[1.1, 0.55]} />
        </mesh>
      ))}
      <DragPlay items={items} spots={spots} testPrefix={prefix} onPlace={(_, __, k) => k < total && hint(`${total - k} still to sort.`)} onWrong={() => hint('Read the sign on each spot.')} onDone={done} />
    </group>
  );
}

/** A field that is pale and dry until rain comes, then grows green. */
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
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} scale={[2, 0.1, 1.5]} receiveShadow>
        <sphereGeometry args={[1, 28, 10]} />
        <meshStandardMaterial ref={soil} color="#c9ab7a" roughness={1} />
      </mesh>
      <group ref={crops} position={[0, 0.1, 0]}>
        {Array.from({ length: 15 }, (_, i) => (
          <mesh key={i} material={C('#5f9a3a', 0.8)} position={[-1.2 + (i % 5) * 0.6, 0.22, -0.6 + Math.floor(i / 5) * 0.6]} scale={[1, 1.6, 1]} castShadow>
            <sphereGeometry args={[0.16, 10, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Carry rain clouds over dry fields; each turns green. */
function Rain({ land, at, a, done, hint, prefix }: Props) {
  const n = a.n ?? 3;
  const ox = a.dx ?? 0;
  const oz = a.dz ?? 0;
  const [wet, setWet] = useState<string[]>([]);
  const H = 4.2;
  const fields = Array.from({ length: n }, (_, i) => beside(land, at, ox + 4.5 + (i % 2) * 3.4, oz - 2.5 - i * 2.6));
  const spots: DropSpot[] = fields.map((p, i) => ({ id: `f${i}`, pos: p, r: 2, slots: [[p[0], p[1] + H, p[2]]] as P3[], color: '#bfe4ff' }));
  const items: DragItem[] = Array.from({ length: n }, (_, i) => {
    const h = beside(land, at, ox - 2 + i * 2, oz - 3 - i * 0.8);
    return { id: `cloud${i}`, home: [h[0], h[1] + H - 1, h[2]] as P3, fits: spots.map((s) => s.id), lift: 0.4, node: <RainCloud position={[0, 0, 0]} width={2.4} rain={false} dark={0.15} /> };
  });
  return (
    <group>
      {fields.map((p, i) => (
        <group key={i}>
          <Field position={p} wet={wet.includes(`f${i}`)} />
          {wet.includes(`f${i}`) && <RainCloud position={[p[0], p[1] + H, p[2]]} width={2.4} dark={0.3} />}
        </group>
      ))}
      <DragPlay items={items} spots={spots} testPrefix={prefix} onPlace={(_, sp, k) => (setWet((w) => [...w, sp]), k < n && hint(`Rain on the dry earth. ${n - k} field${n - k > 1 ? 's' : ''} still waiting.`))} onDone={done} />
    </group>
  );
}

/** Something that grows from a bed once a seed is planted in it. */
function Grow({ position, on, kind, seed }: { position: P3; on: boolean; kind: NonNullable<ActSpec['grow']>; seed: number }) {
  const g = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current = THREE.MathUtils.damp(t.current, on ? 1 : 0, 1.2, dt);
    if (g.current) g.current.scale.setScalar(Math.max(0.01, t.current));
  });
  if (kind === 'flowers') return <FlowerBed position={position} bloom={on} seed={seed} />;
  const leaf = C('#5a9a3a', 0.8);
  return (
    <group position={position}>
      <mesh material={C('#6a4a32', 1)} position={[0, 0.05, 0]} scale={[0.9, 0.12, 0.9]} receiveShadow>
        <sphereGeometry args={[1, 24, 10]} />
      </mesh>
      <group ref={g}>
        {kind === 'grain' &&
          // One seed, seven spikes (2:261).
          Array.from({ length: 7 }, (_, i) => (
            <group key={i} rotation-z={(i - 3) * 0.12}>
              <mesh material={C('#9ab04a')} position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.02, 0.03, 1.2, 6]} />
              </mesh>
              <mesh material={C('#e0c060', 0.8)} position={[0, 1.3, 0]}>
                <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
              </mesh>
            </group>
          ))}
        {(kind === 'tree' || kind === 'shoot') && (
          <>
            <mesh material={C('#6a4a30')} position={[0, kind === 'tree' ? 0.9 : 0.6, 0]}>
              <cylinderGeometry args={[0.06, 0.12, kind === 'tree' ? 1.8 : 1.2, 10]} />
            </mesh>
            <mesh material={leaf} position={[0, kind === 'tree' ? 2.1 : 1.3, 0]} scale={kind === 'tree' ? 1 : 0.5}>
              <sphereGeometry args={[0.8, 20, 14]} />
            </mesh>
          </>
        )}
        {kind === 'vine' &&
          Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} material={leaf} position={[Math.sin(i) * 0.3, 0.3 + i * 0.25, Math.cos(i) * 0.3]} scale={[0.35, 0.15, 0.35]}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          ))}
      </group>
    </group>
  );
}

/** Plant seeds in beds; each one grows. */
function Plant({ land, at, a, done, hint, prefix }: Props) {
  const n = a.n ?? 3;
  const ox = a.dx ?? 0;
  const oz = a.dz ?? 0;
  const [grown, setGrown] = useState<string[]>([]);
  const beds = Array.from({ length: n }, (_, i) => beside(land, at, ox + 4.2 + (i % 2) * 2.6, oz - 2.2 - i * 1.9));
  const spots: DropSpot[] = beds.map((p, i) => ({ id: `b${i}`, pos: p, r: 1, slots: [[p[0] - 1, p[1], p[2] + 0.6]] as P3[], color: '#c8f0a0' }));
  const items: DragItem[] = homes(land, at, n, ox, oz).map((h, i) => ({ id: `seed${i}`, home: h, fits: spots.map((s) => s.id), node: propNode(a.item ?? 'seed') }));
  return (
    <group>
      {beds.map((p, i) => (
        <Grow key={i} position={p} on={grown.includes(`b${i}`)} kind={a.grow ?? 'flowers'} seed={i + 1} />
      ))}
      <DragPlay items={items} spots={spots} testPrefix={prefix} onPlace={(_, sp, k) => (setGrown((g) => [...g, sp]), k < n && hint(`It grows. ${n - k} more to plant.`))} onDone={done} />
    </group>
  );
}

/** Lay numbered stones in order along a row. */
function Order({ land, at, a, done, hint, prefix }: Props) {
  const n = a.n ?? 5;
  const start = a.start ?? 1;
  const ox = a.dx ?? 0;
  const oz = a.dz ?? 0;
  const faces = useMemo(() => Array.from({ length: n }, (_, i) => new THREE.MeshStandardMaterial({ map: labelTexture(String(start + i), '#f3e6c8', '#7a5020'), roughness: 0.7 })), [n, start]);
  const X = at.x + ox + 3.4;
  const slotP = (i: number): P3 => [X, land.height(X, at.z + oz - 1.5 - i * 1.5) + 0.05, at.z + oz - 1.5 - i * 1.5];
  const spots: DropSpot[] = Array.from({ length: n }, (_, i) => ({ id: `s${i}`, pos: slotP(i), r: 0.7, slots: [slotP(i)] }));
  const perm = Array.from({ length: n }, (_, i) => (i * 3 + 1) % n);
  const items: DragItem[] = perm.map((k, j) => ({
    id: `n${k}`,
    home: beside(land, at, ox - 1.6 - (j % 2) * 0.9, oz - 0.5 - j * 0.7),
    fits: [`s${k}`],
    lift: 0.5,
    node: (
      <group>
        <mesh material={C('#d8c8a6')} position={[0, 0.09, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.55, 0.18, 28]} />
        </mesh>
        <mesh material={faces[k]} position={[0, 0.185, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.45, 28]} />
        </mesh>
      </group>
    ),
  }));
  return <DragPlay items={items} spots={spots} testPrefix={prefix} onPlace={(_, __, k) => k < n && hint(`${n - k} to go.`)} onWrong={(it, sp) => hint(`That is ${start + Number(it.slice(1))}. This spot is for ${start + Number(sp.slice(1))}.`)} onDone={done} />;
}

/** Bring animals in pairs to their pens. */
function Pairs({ land, at, a, done, hint, prefix }: Props) {
  const kinds = a.kinds ?? ['sheep', 'camel', 'cow'];
  const ox = a.dx ?? 0;
  const oz = a.dz ?? 0;
  const signs = useMemo(() => kinds.map((k) => sign(`two ${k}s`.replace('sheeps', 'sheep'))), [kinds]);
  const pens = kinds.map((_, i) => beside(land, at, ox + 5 + (i % 2) * 2.8, oz - 2.4 - i * 2.2));
  const spots: DropSpot[] = kinds.map((k, i) => ({ id: k, pos: pens[i], r: 1.3, slots: [[pens[i][0] - 0.6, pens[i][1], pens[i][2]], [pens[i][0] + 0.6, pens[i][1], pens[i][2]]] as P3[] }));
  const hs = homes(land, at, kinds.length * 2, ox, oz);
  const items: DragItem[] = kinds.flatMap((k, i) => [0, 1].map((j) => ({ id: `${k}${j}`, home: hs[(i * 2 + j * 3) % hs.length], fits: [k], node: <Animal kind={k} scale={0.6} /> })));
  return (
    <group>
      {pens.map((q, i) => (
        <mesh key={i} material={signs[i]} position={[q[0], q[1] + 1.1, q[2] + 1.2]}>
          <planeGeometry args={[1.1, 0.55]} />
        </mesh>
      ))}
      <DragPlay items={items} spots={spots} testPrefix={prefix} onPlace={(_, __, k) => k < items.length && hint(`${items.length - k} still to bring. Each goes to its own pair.`)} onWrong={(it) => hint(`Find the pen for the ${it.replace(/\d$/, '')}.`)} onDone={done} />
    </group>
  );
}

/** Find and tap n glowing things hidden around the place. */
function Tap({ land, at, a, done, hint, prefix }: Props) {
  const n = a.n ?? 4;
  const ox = a.dx ?? 0;
  const oz = a.dz ?? 0;
  const [found, setFound] = useState<number[]>([]);
  const spots = useMemo(() => Array.from({ length: n }, (_, i) => beside(land, at, ox + 2 + Math.cos(i * 2.1) * 3 + 2, oz - 3 + Math.sin(i * 2.1) * 2.5)), [land, at, n, ox, oz]);
  const g = useRef<THREE.Group>(null);
  useFrame((st) => g.current?.children.forEach((c, i) => (c.position.y = spots[i][1] + 0.6 + Math.sin(st.clock.elapsedTime * 2 + i) * 0.12)));
  const tap = (i: number) =>
    tapOnly(() => {
      if (found.includes(i)) return;
      const next = [...found, i];
      setFound(next);
      if (next.length === n) done();
      else hint(`Found ${next.length} of ${n}.`);
    }, `${prefix}${i}`);
  const sky = a.item === 'star';
  return (
    <group ref={g}>
      {spots.map((q, i) => (
        <group key={i} position={[q[0], q[1] + 0.6 + (sky ? 3 : 0), q[2]]} onClick={tap(i)}>
          {found.includes(i) ? (
            <mesh>
              <sphereGeometry args={[0.18, 12, 8]} />
              <meshBasicMaterial color="#9ad89a" />
            </mesh>
          ) : (
            propNode(a.item ?? 'star')
          )}
        </group>
      ))}
    </group>
  );
}

const MECH = { carry: Carry, sort: Sort, rain: Rain, plant: Plant, order: Order, pairs: Pairs, tap: Tap };

export function Activity(p: Props) {
  const M = MECH[p.a.mech];
  return <M {...p} />;
}
