// Al-Fatihah (1): the opening path. Al-Fatihah has no story, so the world is
// symbolic: a gate of praise hung with flowers (1:2), a garden where the child
// brings water to dry beds and they bloom, a sign of mercy (1:3, and 30:50 on
// the earth given life after it was lifeless), a quiet terrace facing a wide
// dawn horizon (1:4: nothing of the Day itself is pictured) and a fork where
// one road runs straight and bright; the child lays its seven stepping stones,
// one for each ayah (1:6). No person and no representation of Allah.
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import { HorizonGlow } from './common';
import { DragPlay, type DragItem, type DropSpot } from './drag';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat, rng, type P3, type V } from './kit';
import { FlowerBed, Jar, labelTexture } from './props';

export function FatihaScene({ land, stops, complete, hint }: SceneProps) {
  const gate = stopNamed(stops, 'Gate of Praise');
  const garden = stopNamed(stops, 'Garden of Mercy');
  const horizon = stopNamed(stops, 'Horizon of Recompense');
  const fork = stopNamed(stops, 'Fork of the Straight Path');
  return (
    <group>
      {gate && <Gate position={beside(land, gate.pos, 0, -3.5)} />}
      {garden && (
        <MercyGarden
          land={land}
          at={garden.pos}
          hint={hint}
          onDone={() => (complete('Bring the garden to life'), hint('The garden blooms. "So observe the effects of the mercy of Allah, how He gives life to the earth after its lifelessness" (30:50).'))}
        />
      )}
      {horizon && <Terrace land={land} at={horizon.pos} />}
      {fork && (
        <SevenSteps
          land={land}
          at={fork.pos}
          hint={hint}
          onDone={() => (complete('Seven-step walk'), hint('All seven stones are laid: the seven ayahs of Al-Fatihah. "Guide us to the straight path" (1:6).'))}
        />
      )}
    </group>
  );
}

/** A tall rounded arch over the path, its pillars wound with flowering vines. */
function Gate({ position }: { position: P3 }) {
  const stone = useMemo(() => mat('#efe2c8', 0.8), []);
  const trim = useMemo(() => mat('#c9a86a', 0.5, 0.3), []);
  const leaf = useMemo(() => mat('#5f9a45', 0.8), []);
  const blooms = useMemo(() => {
    const r = rng(4);
    const cols = ['#f4a6c0', '#ffffff', '#f6d36a', '#c99be8'];
    return Array.from({ length: 46 }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      const t = r();
      // Up the pillars, then over the arch.
      const onArch = t > 0.6;
      const a = ((t - 0.6) / 0.4) * Math.PI;
      const x = onArch ? Math.cos(Math.PI - a) * 2.6 : side * 2.6;
      const y = onArch ? 5 + Math.sin(a) * 2.6 : t * 8.3;
      return { p: [x + (r() - 0.5) * 0.6, y + (r() - 0.5) * 0.4, 0.45 + (r() - 0.5) * 0.3] as P3, c: cols[i % 4], s: 0.14 + r() * 0.12 };
    });
  }, []);
  return (
    <group position={position}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 2.6, 0, 0]}>
          <mesh material={stone} position={[0, 2.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 5.2, 0.9]} />
          </mesh>
          <mesh material={trim} position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[1.2, 0.5, 1.2]} />
          </mesh>
        </group>
      ))}
      <mesh material={stone} position={[0, 5, 0]} castShadow>
        <torusGeometry args={[2.6, 0.45, 16, 40, Math.PI]} />
      </mesh>
      <mesh material={trim} position={[0, 7.75, 0]} castShadow>
        <sphereGeometry args={[0.4, 20, 14]} />
      </mesh>
      {blooms.map((b, i) => (
        <group key={i} position={b.p}>
          <mesh material={leaf} position={[0.1, -0.08, -0.05]} scale={[1.4, 0.7, 0.8]}>
            <sphereGeometry args={[b.s, 10, 8]} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <sphereGeometry args={[b.s * 0.8, 12, 8]} />
            <meshStandardMaterial color={b.c} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Three dry beds and three water jars: carry each jar to a bed and it blooms. */
function MercyGarden({ land, at, hint, onDone }: { land: Land; at: V; hint: (t: string) => void; onDone: () => void }) {
  const [wet, setWet] = useState<string[]>([]);
  const beds: P3[] = [beside(land, at, 4, -2), beside(land, at, 6.5, -5), beside(land, at, 3.5, -7)];
  const spots: DropSpot[] = beds.map((p, i) => ({ id: `bed${i}`, pos: p, r: 1.6, slots: [[p[0] + 1.3, p[1], p[2] + 0.4]] as P3[], color: '#9ad8ff' }));
  const items: DragItem[] = [0, 1, 2].map((i) => ({
    id: `jar${i}`,
    home: beside(land, at, 1.4 + i * 0.7, -0.6 - i * 0.4),
    fits: ['bed0', 'bed1', 'bed2'],
    node: <Jar color={['#c27a48', '#4a8ab0', '#b0623a'][i]} scale={0.9} />,
  }));
  const water = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7ac0e0', roughness: 0.1, metalness: 0.2 }), []);
  const stone = useMemo(() => mat('#e6d8bc'), []);
  const F = beside(land, at, 8.5, -1);
  return (
    <group>
      {beds.map((p, i) => (
        <FlowerBed key={i} position={p} bloom={wet.includes(`bed${i}`)} seed={i + 1} />
      ))}
      {/* A small round fountain the jars were filled from. */}
      <group position={F}>
        <mesh material={stone} position={[0, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.3, 1.4, 0.6, 32]} />
        </mesh>
        <mesh material={water} position={[0, 0.58, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[1.15, 32]} />
        </mesh>
        <mesh material={stone} position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.25, 1.1, 16]} />
        </mesh>
        <mesh material={stone} position={[0, 1.7, 0]} scale={[1, 0.4, 1]}>
          <sphereGeometry args={[0.5, 20, 12]} />
        </mesh>
      </group>
      <DragPlay
        items={items}
        spots={spots}
        testPrefix="water-"
        onPlace={(_, sp, n) => (setWet((w) => [...w, sp]), n < 3 && hint(`Water for the dry earth. ${3 - n} bed${3 - n > 1 ? 's' : ''} still dry.`))}
        onDone={onDone}
      />
    </group>
  );
}

/** A quiet terrace with a low wall facing a wide horizon at first light (1:4). */
function Terrace({ land, at }: { land: Land; at: V }) {
  const stone = useMemo(() => mat('#e8dcc4', 0.85), []);
  const P = beside(land, at, 4, -4);
  return (
    <group>
      <group position={P}>
        <mesh material={stone} position={[0, -0.6, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[3.2, 3.4, 1.6, 40]} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI * 1.15 + (i / 8) * Math.PI * 0.7;
          return (
            <mesh key={i} material={stone} position={[Math.cos(a) * 3, 0.55, Math.sin(a) * 3]} rotation-y={-a} castShadow>
              <boxGeometry args={[0.35, 0.7, 1.1]} />
            </mesh>
          );
        })}
      </group>
      <HorizonGlow position={P} color="#ffc890" />
    </group>
  );
}

/** Seven numbered stepping stones to lay, in order, along the straight road (1:1-7). */
function SevenSteps({ land, at, hint, onDone }: { land: Land; at: V; hint: (t: string) => void; onDone: () => void }) {
  const faces = useMemo(() => Array.from({ length: 7 }, (_, i) => new THREE.MeshStandardMaterial({ map: labelTexture(String(i + 1), '#f3e6c8', '#7a5020'), roughness: 0.7 })), []);
  const side = useMemo(() => mat('#d8c8a6'), []);
  const fogPath = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b8ae9a', transparent: true, opacity: 0.55, roughness: 1 }), []);
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff0c0', transparent: true, opacity: 0.35, depthWrite: false }), []);
  const X = at.x + 3.2;
  const slotP = (i: number): P3 => [X, land.height(X, at.z - 1.5 - i * 1.7) + 0.05, at.z - 1.5 - i * 1.7];
  const spots: DropSpot[] = Array.from({ length: 7 }, (_, i) => ({ id: `step${i}`, pos: slotP(i), r: 0.8, slots: [slotP(i)] }));
  const order = [3, 0, 5, 2, 6, 1, 4];
  const items: DragItem[] = order.map((n, k) => ({
    id: `stone${n}`,
    home: beside(land, at, -1.6 - (k % 2) * 0.9, -0.5 - k * 0.8),
    fits: [`step${n}`],
    lift: 0.5,
    node: (
      <group>
        <mesh material={side} position={[0, 0.09, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.6, 0.18, 28]} />
        </mesh>
        <mesh material={faces[n]} position={[0, 0.185, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.5, 28]} />
        </mesh>
      </group>
    ),
  }));
  const end = slotP(7);
  return (
    <group>
      {/* The bright straight road, and two side roads that wander off and fade. */}
      <mesh material={glow} position={[X, slotP(3)[1] + 0.03, at.z - 1.5 - 3 * 1.7]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.6, 13]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          {Array.from({ length: 6 }, (_, i) => {
            const x = X + s * (1.8 + i * i * 0.35);
            const z = at.z - 1 - i * 1.2;
            return (
              <mesh key={i} material={fogPath} position={[x, land.height(x, z) + 0.04, z]} rotation-x={-Math.PI / 2} scale={1 - i * 0.12}>
                <circleGeometry args={[0.5, 20]} />
              </mesh>
            );
          })}
        </group>
      ))}
      <group position={[end[0], end[1], end[2] - 0.6]}>
        {[-1, 1].map((s) => (
          <mesh key={s} material={side} position={[s * 1.1, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 2.6, 16]} />
          </mesh>
        ))}
        <mesh material={side} position={[0, 2.6, 0]}>
          <torusGeometry args={[1.1, 0.16, 12, 28, Math.PI]} />
        </mesh>
        <pointLight position={[0, 1.6, 0.4]} color="#ffe6b0" intensity={4} distance={7} />
      </group>
      <DragPlay
        items={items}
        spots={spots}
        testPrefix="step-"
        onPlace={(_, __, n) => n < 7 && hint(`${7 - n} stone${7 - n > 1 ? 's' : ''} to go.`)}
        onWrong={(it, sp) => hint(`That is stone ${Number(it.slice(5)) + 1}. This spot is for stone ${Number(sp.slice(4)) + 1}.`)}
        onDone={onDone}
      />
    </group>
  );
}
