// An-Nahl (16), "The Bee": a valley of blessings. Cliffs and trees with bees'
// homes and wooden hives "that which they construct" (16:68); the child
// follows a bee from flower to flower and back home (16:69). Jars of honey in
// different colours (16:69). A pasture where the child brings the flock in for
// the evening (16:5-6, 16:66). A lagoon with a moored boat and pearl shells
// (16:14), and birds held up in the sky (16:79). No person is shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import { DragPlay, type DragItem, type DropSpot } from './drag';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, tapOnly, type P3, type V } from './kit';
import { Animal, hullGeometry, labelTexture, plankTexture } from './props';

export function NahlScene({ land, stops, complete, hint }: SceneProps) {
  const hives = stopNamed(stops, 'Hive Cliffs');
  const honey = stopNamed(stops, 'Honey Spring');
  const pasture = stopNamed(stops, 'Pasture of Milk');
  const coast = stopNamed(stops, 'Coast of Ornaments');
  const birds = stopNamed(stops, 'Sky of Birds');
  return (
    <group>
      {hives && (
        <HiveCliffs
          land={land}
          at={hives.pos}
          hint={hint}
          onHome={() => (complete('Follow the bee'), hint('Home to the hive. "Then eat from all the fruits and follow the ways of your Lord laid down [for you]" (16:69).'))}
        />
      )}
      {honey && <HoneyJars position={beside(land, honey.pos, 4, -2.5)} />}
      {pasture && (
        <Pasture
          land={land}
          at={pasture.pos}
          hint={hint}
          onDone={() => (complete('Bring the flock home'), hint('All home for the evening. "And for you in them is [the enjoyment of] beauty when you bring them in" (16:6).'))}
        />
      )}
      {coast && <Lagoon land={land} at={coast.pos} />}
      {birds && <Birds center={beside(land, birds.pos, 2, -8)} />}
    </group>
  );
}

function Bee({ scale = 1 }: { scale?: number }) {
  const wing = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (wing.current) wing.current.rotation.z = Math.sin(st.clock.elapsedTime * 40) * 0.5;
  });
  return (
    <group scale={scale}>
      <mesh scale={[0.8, 0.8, 1.2]}>
        <sphereGeometry args={[0.12, 14, 10]} />
        <meshStandardMaterial color="#f2b81a" roughness={0.5} />
      </mesh>
      {[-0.04, 0.05].map((z) => (
        <mesh key={z} position={[0, 0, z]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.095, 0.022, 6, 18]} />
          <meshStandardMaterial color="#2a2018" />
        </mesh>
      ))}
      <group ref={wing}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.1, 0.1, 0]} rotation-z={s * 0.5} scale={[0.5, 0.1, 1]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** A big flower on a stem: tapping it when the bee is there sends the bee on. */
function BigFlower({ position, color, onTap }: { position: P3; color: string; onTap: (e: never) => void }) {
  const petal = useMemo(() => mat(color, 0.6), [color]);
  const stem = useMemo(() => mat('#4f8a34'), []);
  return (
    <group position={position} onClick={onTap}>
      <mesh material={stem} position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 1, 8]} />
      </mesh>
      <mesh material={stem} position={[0.12, 0.35, 0]} rotation-z={-0.8} scale={[1, 0.35, 0.6]}>
        <sphereGeometry args={[0.16, 10, 8]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} material={petal} position={[Math.cos((i / 6) * Math.PI * 2) * 0.18, 1.02, Math.sin((i / 6) * Math.PI * 2) * 0.18]} scale={[1, 0.3, 1]}>
          <sphereGeometry args={[0.14, 12, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 1.06, 0]}>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshStandardMaterial color="#f0c030" />
      </mesh>
    </group>
  );
}

/** Rounded cliffs with honeycomb, a hive in a tree, wooden hive boxes, and a bee to follow. */
function HiveCliffs({ land, at, hint, onHome }: { land: Land; at: V; hint: (t: string) => void; onHome: () => void }) {
  const rock = useMemo(() => mat('#c8a882'), []);
  const comb = useMemo(() => mat('#e8a830', 0.45, 0.1), []);
  const wood = useMemo(() => mat('#c89a64'), []);
  const roof = useMemo(() => mat('#8a5a3a'), []);
  const bark = useMemo(() => mat('#6a4a30'), []);
  const leaf = useMemo(() => mat('#5f9a40', 0.8), []);
  const C = beside(land, at, 9, -8);
  const T = beside(land, at, 4.5, -7);
  const B = beside(land, at, 6, -2);
  const flowers = useMemo(() => {
    const r = rng(16);
    const cols = ['#f4a0c0', '#ffffff', '#c890e8', '#ff9a50', '#f6e060'];
    return Array.from({ length: 5 }, (_, i) => ({ p: beside(land, at, 1.6 + (i % 2) * 1.8 + r() * 0.5, -0.5 - i * 1.4), c: cols[i] }));
  }, [land, at]);
  const [step, setStep] = useState(0);
  const bee = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const hivePos: P3 = [B[0], B[1] + 1.25, B[2] + 0.45];
  useFrame((st, dt) => {
    const b = bee.current;
    if (!b) return;
    const f = step < 5 ? flowers[step].p : hivePos;
    target.set(f[0] + Math.sin(st.clock.elapsedTime * 3) * 0.12, f[1] + (step < 5 ? 1.25 : 0) + Math.sin(st.clock.elapsedTime * 5) * 0.06, f[2] + Math.cos(st.clock.elapsedTime * 3) * 0.12);
    b.position.lerp(target, 1 - Math.exp(-dt * 2.5));
  });
  const tap = (i: number) =>
    tapOnly(() => {
      if (i !== step) return hint(step < 5 ? 'Look for the flower where the bee is sitting.' : '');
      const next = step + 1;
      setStep(next);
      if (next === 5) onHome();
      else hint(`The bee flies on. ${5 - next} more flower${5 - next > 1 ? 's' : ''}.`);
    });
  // Test hook: follow the bee one flower at a time.
  const g = globalThis as { __taps?: Record<string, () => void> };
  (g.__taps ??= {}).bee = () => tap(step)({ delta: 0, stopPropagation() {} } as never);
  return (
    <group>
      {/* Cliffs: soft rounded boulders piled high, combs hanging in the hollows. */}
      <group position={C}>
        {[[0, 2, 0, 4.5, 4, 3], [-4, 1.2, 1, 3, 2.8, 2.6], [3.8, 1.5, 0.5, 3.2, 3.4, 2.8], [0.5, 5.2, -0.5, 3, 2.4, 2.4]].map(([x, y, z, sx, sy, sz], i) => (
          <mesh key={i} material={rock} position={[x, y, z]} scale={[sx, sy, sz]} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} />
          </mesh>
        ))}
        {[[-1.5, 2.2, 2.6], [1.2, 3.4, 2.4], [-3.2, 1.4, 3.1]].map((p, i) => (
          <group key={i} position={p as P3}>
            {[0, 1, 2].map((k) => (
              <mesh key={k} material={comb} position={[k * 0.22 - 0.22, -k * 0.25, 0]} rotation-x={Math.PI / 2} scale={[1, 0.6, 1.4 - k * 0.3]}>
                <cylinderGeometry args={[0.3, 0.3, 0.6, 6]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      {/* A tree with a round wild hive hanging from a branch. */}
      <group position={T}>
        <mesh material={bark} position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.3, 3, 12]} />
        </mesh>
        <mesh material={leaf} position={[0, 3.6, 0]} castShadow>
          <sphereGeometry args={[1.5, 24, 16]} />
        </mesh>
        <mesh material={comb} position={[0.9, 2.4, 0.4]} scale={[0.7, 1, 0.7]}>
          <sphereGeometry args={[0.4, 16, 12]} />
        </mesh>
      </group>
      {/* Wooden hive boxes on a stand: "that which they construct". */}
      <group position={B}>
        {[-0.9, 0.9].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh material={wood} position={[0, 0.85, 0]} castShadow>
              <boxGeometry args={[0.9, 0.8, 0.9]} />
            </mesh>
            <mesh material={roof} position={[0, 1.35, 0]} castShadow>
              <boxGeometry args={[1.05, 0.18, 1.05]} />
            </mesh>
            <mesh material={roof} position={[0, 0.2, 0]}>
              <boxGeometry args={[0.7, 0.4, 0.7]} />
            </mesh>
          </group>
        ))}
      </group>
      {flowers.map((f, i) => (
        <BigFlower key={i} position={f.p} color={f.c} onTap={tap(i) as never} />
      ))}
      <group ref={bee} position={[flowers[0].p[0], flowers[0].p[1] + 1.3, flowers[0].p[2]]}>
        <Bee scale={1.3} />
      </group>
      <Buzz center={[C[0] - 1, C[1] + 3, C[2] + 2.5]} />
    </group>
  );
}

/** A little cloud of bees circling near the combs. */
function Buzz({ center }: { center: P3 }) {
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    g.current?.children.forEach((c, i) => {
      const t = st.clock.elapsedTime * (0.8 + i * 0.13) + i;
      c.position.set(Math.cos(t) * (1 + (i % 3) * 0.5), Math.sin(t * 1.7) * 0.5, Math.sin(t) * (1 + (i % 2) * 0.6));
      c.rotation.y = -t;
    });
  });
  return (
    <group ref={g} position={center}>
      {Array.from({ length: 9 }, (_, i) => (
        <group key={i}>
          <Bee scale={0.8} />
        </group>
      ))}
    </group>
  );
}

/** Jars of honey in different colours on a wooden shelf (16:69). */
function HoneyJars({ position }: { position: P3 }) {
  const wood = useMemo(() => mat('#9a6a40'), []);
  const tones = ['#f6d36a', '#eab040', '#d08a20', '#a85a14', '#7a3a10', '#e8c070'];
  const sign = useMemo(() => new THREE.MeshBasicMaterial({ map: labelTexture('"varying\nin colors"', '#fbefd0', '#7a4a14', 512, 256) }), []);
  return (
    <group position={position} rotation-y={-0.3}>
      {[0.6, 1.4].map((y) => (
        <mesh key={y} material={wood} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.1, 0.7]} />
        </mesh>
      ))}
      {[-1.55, 1.55].map((x) => (
        <mesh key={x} material={wood} position={[x, 0.75, 0]} castShadow>
          <boxGeometry args={[0.1, 1.5, 0.7]} />
        </mesh>
      ))}
      {tones.map((c, i) => (
        <group key={i} position={[-1.1 + (i % 3) * 1.1, (i < 3 ? 0.65 : 1.45) + 0.02, 0]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.48, 20]} />
            <meshPhysicalMaterial color={c} roughness={0.15} transmission={0.2} thickness={0.4} emissive={c} emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[0, 0.53, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 20]} />
            <meshStandardMaterial color="#c8b080" />
          </mesh>
        </group>
      ))}
      <mesh material={sign} position={[0, 2.05, 0]}>
        <planeGeometry args={[1.6, 0.8]} />
      </mesh>
    </group>
  );
}

/** A pasture: sheep and cows to bring in for the evening, a fold and a barn (16:5-6). */
function Pasture({ land, at, hint, onDone }: { land: Land; at: V; hint: (t: string) => void; onDone: () => void }) {
  const wood = useMemo(() => mat('#9a7048'), []);
  const wall = useMemo(() => mat('#e6d2a8'), []);
  const roof = useMemo(() => mat('#a4553a'), []);
  const signs = useMemo(() => ({ fold: new THREE.MeshBasicMaterial({ map: labelTexture('sheep', '#fbefd0', '#5a3a1a', 256, 128) }), barn: new THREE.MeshBasicMaterial({ map: labelTexture('cows', '#fbefd0', '#5a3a1a', 256, 128) }) }), []);
  const F = beside(land, at, 4.5, -6.5);
  const Bn = beside(land, at, 9, -3);
  const fold: DropSpot = { id: 'fold', pos: F, r: 2.2, slots: [[F[0] - 0.8, F[1], F[2] - 0.6], [F[0] + 0.8, F[1], F[2] - 0.6], [F[0], F[1], F[2] + 0.7]] as P3[] };
  const barn: DropSpot = { id: 'barn', pos: [Bn[0] - 1.5, Bn[1], Bn[2] + 2.4], r: 1.8, slots: [[Bn[0] - 0.8, Bn[1], Bn[2] + 0.3], [Bn[0] + 0.8, Bn[1], Bn[2] + 0.3]] as P3[], color: '#ffd8a0' };
  const items: DragItem[] = [
    ...[0, 1, 2].map((i) => ({ id: `sheep${i}`, home: beside(land, at, 1.2 + i * 1.3, -1 - (i % 2) * 1.2), fits: ['fold'], node: <Animal kind="sheep" scale={0.8} /> })),
    ...[0, 1].map((i) => ({ id: `cow${i}`, home: beside(land, at, 2 + i * 2.2, -3.4), fits: ['barn'], node: <Animal kind="cow" scale={0.7} /> })),
  ];
  return (
    <group>
      {/* The fold: a ring of posts and rails. */}
      <group position={F}>
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          if (i === 3 || i === 4) return null; // the gate gap faces the path
          return (
            <group key={i} position={[Math.cos(a) * 2, 0, Math.sin(a) * 2]} rotation-y={-a}>
              <mesh material={wood} position={[0, 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.07, 1, 10]} />
              </mesh>
              <mesh material={wood} position={[0, 0.75, 0.45]} rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.035, 0.035, 0.9, 8]} />
              </mesh>
            </group>
          );
        })}
        <mesh material={signs.fold} position={[1.4, 1.2, 1.6]}>
          <planeGeometry args={[0.8, 0.4]} />
        </mesh>
      </group>
      {/* A small barn with a rounded roof. */}
      <group position={Bn}>
        <mesh material={wall} position={[0, 1.1, -0.6]} castShadow receiveShadow>
          <boxGeometry args={[3.4, 2.2, 2.4]} />
        </mesh>
        <mesh material={roof} position={[0, 2.2, -0.6]} rotation-z={Math.PI / 2} scale={[0.5, 1, 1]} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 3.6, 24, 1, false, 0, Math.PI]} />
        </mesh>
        <mesh position={[0, 0.9, 0.61]}>
          <boxGeometry args={[1.4, 1.8, 0.05]} />
          <meshStandardMaterial color="#3a2a1e" />
        </mesh>
        <mesh material={signs.barn} position={[0, 2.15, 0.65]}>
          <planeGeometry args={[0.8, 0.4]} />
        </mesh>
      </group>
      <DragPlay
        items={items}
        spots={[fold, barn]}
        testPrefix="flock-"
        onPlace={(_, __, n) => n < 5 && hint(`${5 - n} still out in the pasture.`)}
        onWrong={(it) => hint(it.startsWith('sheep') ? 'Sheep sleep in the round fold.' : 'Cows go to the barn.')}
        onDone={onDone}
      />
    </group>
  );
}

/** A lagoon with a moored boat and open shells holding pearls on the shore (16:14). */
function Lagoon({ land, at }: { land: Land; at: V }) {
  const L = beside(land, at, 9, -6);
  const hull = useMemo(() => hullGeometry(3.4, 1.3, 0.8), []);
  const wood = useMemo(() => {
    const t = plankTexture('#7a5a3a', '#4a3020', 8);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 });
  }, []);
  const shell = useMemo(() => mat('#f0d8d0', 0.5), []);
  const pearl = useMemo(() => mat('#fffaf0', 0.2, 0.3), []);
  const sail = useMemo(() => mat('#f6efe0', 0.9), []);
  const bob = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (bob.current) {
      bob.current.position.y = 0.15 + Math.sin(st.clock.elapsedTime * 1.2) * 0.06;
      bob.current.rotation.z = Math.sin(st.clock.elapsedTime * 0.9) * 0.04;
    }
  });
  return (
    <group position={[L[0], L[1], L[2]]}>
      <mesh position={[0, 0.08, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[6, 48]} />
        <meshStandardMaterial color="#4aa0b8" roughness={0.12} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[5.8, 7, 48]} />
        <meshStandardMaterial color="#e8d4a8" roughness={1} />
      </mesh>
      <group ref={bob} position={[0.5, 0.15, -1]} rotation-y={0.6}>
        <mesh geometry={hull} material={wood} position={[0, 0.4, 0]} castShadow />
        <mesh material={wood} position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 2.4, 10]} />
        </mesh>
        <mesh material={sail} position={[0.45, 1.7, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[0.05, 1.8]} />
        </mesh>
        <mesh material={sail} position={[0.5, 1.75, 0]} scale={[0.9, 1.6, 0.1]}>
          <sphereGeometry args={[0.6, 16, 10, 0, Math.PI]} />
        </mesh>
      </group>
      {[[-4.6, 3.5], [-5.6, 1.5], [-3.8, 5]].map(([x, z], i) => (
        <group key={i} position={[x, 0.12, z]} rotation-y={i}>
          <mesh material={shell} scale={[1, 0.3, 0.9]}>
            <sphereGeometry args={[0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh material={shell} position={[0, 0.1, -0.3]} rotation-x={-1.1} scale={[1, 0.3, 0.9]}>
            <sphereGeometry args={[0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh material={pearl} position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.1, 16, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Birds gliding in wide circles high above, wings barely moving (16:79). */
function Birds({ center }: { center: P3 }) {
  const g = useRef<THREE.Group>(null);
  const wing = useMemo(() => mat('#f6f2ea', 0.8), []);
  useFrame((st) => {
    g.current?.children.forEach((b, i) => {
      const t = st.clock.elapsedTime * 0.25 + (i / 7) * Math.PI * 2;
      const r = 6 + (i % 3) * 2;
      b.position.set(Math.cos(t) * r, 9 + (i % 4) * 1.4 + Math.sin(t * 2) * 0.3, Math.sin(t) * r);
      b.rotation.set(0, -t, 0.25);
      const w = Math.sin(st.clock.elapsedTime * 2 + i) * 0.12;
      (b.children[1] as THREE.Object3D).rotation.z = w;
      (b.children[2] as THREE.Object3D).rotation.z = -w;
    });
  });
  return (
    <group ref={g} position={center}>
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i}>
          <mesh material={wing} scale={[0.3, 0.3, 1]}>
            <sphereGeometry args={[0.3, 12, 8]} />
          </mesh>
          <mesh material={wing} position={[0.45, 0, 0]} scale={[1, 0.08, 0.35]}>
            <sphereGeometry args={[0.45, 12, 8]} />
          </mesh>
          <mesh material={wing} position={[-0.45, 0, 0]} scale={[1, 0.08, 0.35]}>
            <sphereGeometry args={[0.45, 12, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
