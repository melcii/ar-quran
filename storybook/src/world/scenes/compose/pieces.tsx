// A library of soft, rounded landmarks for the composed worlds (the longer
// surahs). Each piece is drawn in its own frame at a ground point beside a
// designed place; a world is a list of pieces and hands-on activities in
// content/worlds/compose.json. Pieces show land, water, sky, plants, animals
// and things people make, never a person, a prophet, an angel or the unseen.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { Land } from '../../terrain';
import { BreadTable, OpenDoor } from '../Maun';
import { ReadingStand, Spring } from '../Bayyinah';
import { Well } from '../Yusuf';
import { CarvedCliff, SkyDisc, HorizonGlow } from '../common';
import { FruitTree } from '../Nuh';
import { Animal, RainCloud, hullGeometry, plankTexture, type AnimalKind } from '../props';
import { rng, type P3, type V } from '../kit';

export type PieceProps = { land: Land; at: V; p: P3; r: number; s: number; o: Record<string, unknown> };

const cache = new Map<string, THREE.MeshStandardMaterial>();
/** A shared soft material. */
export const C = (color: string, rough = 0.85, metal = 0, emissive?: string, ei = 1) => {
  const k = `${color}|${rough}|${metal}|${emissive}|${ei}`;
  let m = cache.get(k);
  if (!m) cache.set(k, (m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...(emissive ? { emissive, emissiveIntensity: ei } : {}) })));
  return m;
};
const str = (o: Record<string, unknown>, k: string, d: string) => (typeof o[k] === 'string' ? (o[k] as string) : d);
const num = (o: Record<string, unknown>, k: string, d: number) => (typeof o[k] === 'number' ? (o[k] as number) : d);
const bool = (o: Record<string, unknown>, k: string) => o[k] === true;

function G({ p, r, s, children }: { p: P3; r: number; s: number; children: ReactNode }) {
  return (
    <group position={p} rotation-y={r} scale={s}>
      {children}
    </group>
  );
}
const Ball = ({ c, pos, sc, args = 1 }: { c: THREE.Material; pos: P3; sc: P3 | number; args?: number }) => (
  <mesh material={c} position={pos} scale={sc} castShadow receiveShadow>
    <sphereGeometry args={[args, 28, 18]} />
  </mesh>
);
const Box = ({ c, pos, size, rot }: { c: THREE.Material; pos: P3; size: P3; rot?: P3 }) => (
  <mesh material={c} position={pos} rotation={rot} castShadow receiveShadow>
    <boxGeometry args={size} />
  </mesh>
);
const Cyl = ({ c, pos, a, rot }: { c: THREE.Material; pos: P3; a: [number, number, number, number?]; rot?: P3 }) => (
  <mesh material={c} position={pos} rotation={rot} castShadow receiveShadow>
    <cylinderGeometry args={[a[0], a[1], a[2], a[3] ?? 24]} />
  </mesh>
);

/* ---------- Land and water ---------- */

/** Rounded mountains (o.color, o.h, o.n). */
function Mountain({ p, r, s, o }: PieceProps) {
  const c = C(str(o, 'color', '#9a8a72'), 0.95);
  const snow = bool(o, 'snow') ? C('#f4f2ec') : null;
  const h = num(o, 'h', 9);
  const n = num(o, 'n', 3);
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: n }, (_, i) => {
        const x = (i - (n - 1) / 2) * h * 0.9;
        const hh = h * (i % 2 ? 0.75 : 1);
        return (
          <group key={i}>
            <Ball c={c} pos={[x, 0, -i * 1.5]} sc={[h * 0.65, hh, h * 0.6]} />
            {snow && <Ball c={snow} pos={[x, hh * 0.86, -i * 1.5]} sc={[h * 0.3, hh * 0.18, h * 0.28]} />}
          </group>
        );
      })}
    </G>
  );
}

/** A mountain in white, red and black bands (35:27). */
function Streaked({ p, r, s }: PieceProps) {
  const cols = ['#f2ece0', '#c0563a', '#e6d8c0', '#3a3236', '#d27a50', '#f2ece0'];
  return (
    <G p={p} r={r} s={s}>
      {cols.map((c, i) => (
        <mesh key={i} material={C(c, 0.95)} position={[0, i * 1.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[6.5 - i * 1.05, 7 - i * 1.05, 1.32, 32]} />
        </mesh>
      ))}
      <Ball c={C(cols[5])} pos={[0, 7.6, 0]} sc={[1.3, 0.8, 1.3]} />
    </G>
  );
}

/** Smooth wind-curved dunes (46:21). */
function Dunes({ p, r, s }: PieceProps) {
  const c = C('#e0b47a', 1);
  return (
    <G p={p} r={r} s={s}>
      {[[0, 0, 7, 2.6, 4], [8, -4, 6, 2, 3.5], [-7, -5, 8, 3, 4.5]].map(([x, z, a, b, d], i) => (
        <Ball key={i} c={c} pos={[x, -0.4, z]} sc={[a, b, d]} />
      ))}
    </G>
  );
}

/** A water surface with a sandy rim (o.r). */
function Sea({ p, r, s, o }: PieceProps) {
  const rad = num(o, 'r', 7);
  return (
    <G p={p} r={r} s={s}>
      <mesh position={[0, 0.06, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[rad, 48]} />
        <meshStandardMaterial color={str(o, 'color', '#4aa0b8')} roughness={0.12} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[rad - 0.2, rad + 1.2, 48]} />
        <meshStandardMaterial color="#e6d2a6" roughness={1} />
      </mesh>
    </G>
  );
}

/** A river running between soft banks (o.len). */
function River({ p, r, s, o }: PieceProps) {
  const len = num(o, 'len', 16);
  return (
    <G p={p} r={r} s={s}>
      <mesh position={[0, 0.07, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.4, len]} />
        <meshStandardMaterial color="#5aa6c8" roughness={0.12} metalness={0.15} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} material={C('#8a7a5a')} position={[k * 1.35, 0.05, 0]} scale={[0.35, 0.2, len / 2]}>
          <sphereGeometry args={[1, 16, 10]} />
        </mesh>
      ))}
    </G>
  );
}

/** Two pools side by side, one fresh and clear, one salt and deep, with a stone strip between (25:53, 35:12). */
function TwoSeas({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      {[
        [-2.1, '#7ccbe0'],
        [2.1, '#2a6a8a'],
      ].map(([x, c]) => (
        <group key={x as number} position={[x as number, 0, 0]}>
          <Cyl c={C('#d8c8a8')} pos={[0, 0.15, 0]} a={[2.1, 2.2, 0.3, 32]} />
          <mesh position={[0, 0.32, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[1.85, 32]} />
            <meshStandardMaterial color={c as string} roughness={0.1} metalness={0.2} />
          </mesh>
        </group>
      ))}
      <Box c={C('#a8987a')} pos={[0, 0.3, 0]} size={[0.4, 0.5, 4]} />
    </G>
  );
}

/** A bubbling spring in a stone ring. */
function SpringPiece({ p }: PieceProps) {
  return <Spring position={p} />;
}

/** A spring of glowing molten copper in a dark stone basin (34:12). */
function Copper({ p, r, s }: PieceProps) {
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((st) => glow.current && (glow.current.emissiveIntensity = 1.2 + Math.sin(st.clock.elapsedTime * 2) * 0.3));
  return (
    <G p={p} r={r} s={s}>
      <Cyl c={C('#4a3a32')} pos={[0, 0.3, 0]} a={[2, 2.3, 0.6, 32]} />
      <mesh position={[0, 0.62, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.7, 32]} />
        <meshStandardMaterial ref={glow} color="#e07a30" emissive="#d05a10" emissiveIntensity={1.2} metalness={0.6} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#ff9a50" intensity={4} distance={8} />
    </G>
  );
}

/** Great stone basins like reservoirs (34:13). */
function Bowls({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      {[-2.4, 0, 2.4].map((x, i) => (
        <group key={x} position={[x, 0, -i * 0.6]}>
          <mesh material={C('#c8b490')} position={[0, 0.8, 0]} castShadow>
            <sphereGeometry args={[1.2, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.78, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[1.1, 28]} />
            <meshStandardMaterial color="#6ab0c8" roughness={0.1} />
          </mesh>
          <Cyl c={C('#b09c78')} pos={[0, 0.2, 0]} a={[0.4, 0.6, 0.4]} />
        </group>
      ))}
    </G>
  );
}

/** A dam across a valley with gardens on both sides (34:15-16). */
function Dam({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <Box c={C('#c8b08a')} pos={[0, 1.5, 0]} size={[10, 3, 1.4]} />
      <mesh position={[0, 2.2, -3]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[9, 5]} />
        <meshStandardMaterial color="#4a9ab8" roughness={0.1} />
      </mesh>
      {[-1, 1].map((k) =>
        [0, 1, 2].map((i) => <FruitTree key={`${k}${i}`} position={[k * (6.5 + i * 1.6), 0, 2 + i * 1.5]} scale={0.8} fruit={['#e85a3a', '#f0b030', '#a03a6a'][i]} />),
      )}
    </G>
  );
}

/* ---------- Plants ---------- */

/** A grove of date palms, with hanging clusters of dates when o.dates. */
function Palms({ p, r, s, o }: PieceProps) {
  const n = num(o, 'n', 4);
  const trunk = C('#8a6a48');
  const leaf = C('#4f8a34', 0.8);
  const date = C('#a8541e', 0.6);
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: n }, (_, i) => {
        const x = (i % 3) * 2.4 - 2.4 + (i > 2 ? 1.2 : 0);
        const z = -Math.floor(i / 3) * 2.4;
        const h = 4.5 + (i % 2) * 1.2;
        return (
          <group key={i} position={[x, 0, z]} rotation-z={(i % 2 ? 1 : -1) * 0.05}>
            <Cyl c={trunk} pos={[0, h / 2, 0]} a={[0.15, 0.25, h, 12]} />
            {Array.from({ length: 8 }, (_, k) => (
              <mesh key={k} material={leaf} position={[Math.cos(k * 0.785) * 0.9, h + 0.1, Math.sin(k * 0.785) * 0.9]} rotation={[0, -k * 0.785, -0.45]} scale={[1.6, 0.08, 0.4]} castShadow>
                <sphereGeometry args={[0.7, 12, 6]} />
              </mesh>
            ))}
            {bool(o, 'dates') && [0, 2, 4].map((k) => <Ball key={k} c={date} pos={[Math.cos(k) * 0.35, h - 0.45, Math.sin(k) * 0.35]} sc={[0.22, 0.38, 0.22]} />)}
          </group>
        );
      })}
    </G>
  );
}

/** Fruit trees in several colours (o.colors). */
function Orchard({ p, r, s, o }: PieceProps) {
  const cols = (o.colors as string[]) ?? ['#e85a3a', '#f0b030', '#a03a6a', '#7ab030', '#f07a20'];
  return (
    <G p={p} r={r} s={s}>
      {cols.map((c, i) => (
        <FruitTree key={i} position={[(i % 3) * 3 - 3, 0, -Math.floor(i / 3) * 3]} scale={0.85 + (i % 2) * 0.15} fruit={c} />
      ))}
    </G>
  );
}

/** Olive trees: silvery crowns on gnarled trunks. */
function Olives({ p, r, s, o }: PieceProps) {
  const n = num(o, 'n', 3);
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[(i - (n - 1) / 2) * 3.2, 0, (i % 2) * -1.5]} scale={n === 1 ? 1.6 : 1}>
          <Cyl c={C('#6d6458')} pos={[0, 0.9, 0]} a={[0.22, 0.38, 1.8, 12]} rot={[0, 0, 0.1]} />
          {[[0, 2.4, 0, 1.1], [0.8, 2.1, 0.3, 0.8], [-0.7, 2.2, -0.2, 0.85], [0.1, 2.9, -0.3, 0.75]].map(([x, y, z, sc], k) => (
            <Ball key={k} c={C('#8a9a6a', 0.8)} pos={[x, y, z]} sc={sc} />
          ))}
          {Array.from({ length: 6 }, (_, k) => (
            <Ball key={`o${k}`} c={C('#3a4a2a', 0.5)} pos={[Math.cos(k) * 1.05, 2.2 + (k % 3) * 0.25, Math.sin(k) * 1.05]} sc={0.07} />
          ))}
        </group>
      ))}
    </G>
  );
}

/** One great tree with spreading branches (14:24, 28:24, 48:18). */
function BigTree({ p, r, s, o }: PieceProps) {
  const leaf = C(str(o, 'leaf', '#4f8a3a'), 0.8);
  return (
    <G p={p} r={r} s={s}>
      <Cyl c={C('#6a4a30')} pos={[0, 1.6, 0]} a={[0.35, 0.6, 3.2, 16]} />
      {bool(o, 'roots') &&
        [0, 1, 2, 3, 4].map((k) => <Cyl key={k} c={C('#6a4a30')} pos={[Math.cos(k * 1.26) * 0.7, 0.15, Math.sin(k * 1.26) * 0.7]} a={[0.08, 0.2, 1.4, 8]} rot={[Math.sin(k * 1.26) * 1.2, 0, -Math.cos(k * 1.26) * 1.2]} />)}
      {[[0, 4.6, 0, 2.2], [1.8, 4, 0.4, 1.5], [-1.7, 4.1, -0.3, 1.6], [0.4, 5.6, -0.6, 1.5], [-0.5, 4.2, 1.5, 1.4], [0.6, 4.1, -1.6, 1.4]].map(([x, y, z, sc], k) => (
        <Ball key={k} c={leaf} pos={[x, y, z]} sc={[sc, sc * 0.85, sc]} />
      ))}
      {bool(o, 'shade') && (
        <mesh position={[0.6, 0.04, 0.6]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[3, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      )}
    </G>
  );
}

/** A dead tree lying uprooted, or hollow palm trunks fallen in a row (14:26, 54:20, 69:7). */
function Fallen({ p, r, s, o }: PieceProps) {
  const n = num(o, 'n', 3);
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[i * 1.4 - n * 0.7, 0.3, i * 0.8]} rotation={[0, 0.4 + i * 0.3, Math.PI / 2]}>
          <Cyl c={C('#7a6248')} pos={[0, 0, 0]} a={[0.28, 0.32, 5, 14]} />
          <mesh position={[0, 2.5, 0]} rotation-x={Math.PI / 2}>
            <ringGeometry args={[0.12, 0.3, 16]} />
            <meshStandardMaterial color="#3a2a1e" side={THREE.DoubleSide} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <Cyl key={k} c={C('#5a4630')} pos={[Math.cos(k * 2) * 0.3, -2.7, Math.sin(k * 2) * 0.3]} a={[0.03, 0.08, 0.8, 6]} rot={[Math.sin(k * 2), 0, Math.cos(k * 2)]} />
          ))}
        </group>
      ))}
    </G>
  );
}

/** A green field of ripe grain (or a dry pale one when o.dry). */
function Grain({ p, r, s, o }: PieceProps) {
  const dry = bool(o, 'dry');
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 220;
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const R = rng(7);
    const t = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      t.position.set((R() - 0.5) * 6, 0.45, (R() - 0.5) * 4);
      t.rotation.set((R() - 0.5) * 0.2, R() * 6, (R() - 0.5) * 0.2);
      t.scale.setScalar(0.8 + R() * 0.4);
      t.updateMatrix();
      m.setMatrixAt(i, t.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <G p={p} r={r} s={s}>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[6.6, 4.6]} />
        <meshStandardMaterial color={dry ? '#c8a878' : '#7a6a3a'} roughness={1} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, N]} castShadow>
        <capsuleGeometry args={[0.035, 0.8, 3, 5]} />
        <meshStandardMaterial color={dry ? '#c8a050' : '#d8bc5a'} roughness={0.9} />
      </instancedMesh>
    </G>
  );
}

/** A gourd vine climbing a trellis over a shady seat (37:146). */
function VinePiece({ p, r, s }: PieceProps) {
  const wood = C('#8a6a48');
  const leaf = C('#5a9a3a', 0.8);
  return (
    <G p={p} r={r} s={s}>
      {[[-1.4, -1.2], [1.4, -1.2], [-1.4, 1.2], [1.4, 1.2]].map(([x, z], i) => (
        <Cyl key={i} c={wood} pos={[x, 1.2, z]} a={[0.07, 0.08, 2.4, 8]} />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <Ball key={i} c={leaf} pos={[(i % 6) * 0.55 - 1.4, 2.5 + (i % 2) * 0.15, Math.floor(i / 6) * 1.1 - 1.1]} sc={[0.45, 0.2, 0.45]} />
      ))}
      {[[-0.6, 1.9, 0.3], [0.7, 1.95, -0.5], [0.1, 1.85, 0.8]].map((q, i) => (
        <Ball key={i} c={C('#d8c06a', 0.6)} pos={q as P3} sc={[0.22, 0.32, 0.22]} />
      ))}
    </G>
  );
}

/** A young shoot growing strong on its stalk (48:29). */
function Shoot({ p, r, s }: PieceProps) {
  const g = useRef<THREE.Group>(null);
  useFrame((st) => g.current && (g.current.rotation.z = Math.sin(st.clock.elapsedTime) * 0.04));
  return (
    <G p={p} r={r} s={s}>
      <Ball c={C('#6a4a32', 1)} pos={[0, 0, 0]} sc={[1, 0.25, 1]} />
      <group ref={g}>
        <Cyl c={C('#6a9a3a')} pos={[0, 1, 0]} a={[0.05, 0.09, 2, 10]} />
        {[0.5, 1, 1.5].map((y, i) => (
          <Ball key={y} c={C('#7ab04a', 0.8)} pos={[(i % 2 ? 0.25 : -0.25), y, 0]} sc={[0.3, 0.08, 0.14]} />
        ))}
        <Ball c={C('#d8bc5a')} pos={[0, 2.15, 0]} sc={[0.12, 0.3, 0.12]} />
      </group>
    </G>
  );
}

/** A big rock with one tiny seed beside it (31:16). */
function RockSeed({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <mesh material={C('#9a8e80')} position={[0, 1.4, 0]} scale={[2.2, 1.6, 1.8]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
      </mesh>
      <Ball c={C('#c8a050', 0.5)} pos={[2.3, 0.08, 1.4]} sc={0.07} />
      <mesh position={[2.3, 0.03, 1.4]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.15, 0.22, 24]} />
        <meshBasicMaterial color="#fff2b0" transparent opacity={0.8} />
      </mesh>
    </G>
  );
}

/* ---------- Built places ---------- */

/** Small rounded houses (o.n), with warm lit windows at night (o.lit). */
function Village({ p, r, s, o }: PieceProps) {
  const n = num(o, 'n', 4);
  const lit = bool(o, 'lit');
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[(i % 3) * 4 - 4, 0, -Math.floor(i / 3) * 4 - (i % 2)]} rotation-y={(i - 1) * 0.25}>
          <Box c={C(['#ecdcbc', '#e4cfa8', '#f0e2c6'][i % 3])} pos={[0, 1.2, 0]} size={[3, 2.4, 2.6]} />
          <Ball c={C('#d8c4a0')} pos={[0, 2.4, 0]} sc={[1.2, 0.7, 1.1]} />
          <mesh position={[0, 0.8, 1.31]}>
            <planeGeometry args={[0.8, 1.6]} />
            <meshStandardMaterial color="#4a3020" />
          </mesh>
          <mesh position={[0.95, 1.5, 1.31]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshStandardMaterial color={lit ? '#ffd48a' : '#5a4a3a'} emissive={lit ? '#ffb050' : '#000000'} emissiveIntensity={lit ? 2 : 0} />
          </mesh>
          {lit && i % 2 === 0 && <pointLight position={[0.95, 1.5, 2]} color="#ffc070" intensity={2} distance={5} />}
        </group>
      ))}
    </G>
  );
}

function House({ p }: PieceProps) {
  return <OpenDoor position={p} />;
}

function Doorway({ p, at, land }: PieceProps) {
  void at;
  void land;
  return (
    <group>
      <OpenDoor position={p} />
      <BreadTable position={[p[0] - 4, p[1], p[2] + 2]} hint={() => {}} />
    </group>
  );
}

/** Market stalls with striped awnings and a hanging balance (o.closed shuts them for prayer). */
function Market({ p, r, s, o }: PieceProps) {
  const closed = bool(o, 'closed');
  const awn = ['#c0563a', '#3a7a9a', '#d8a030'];
  return (
    <G p={p} r={r} s={s}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[i * 3.2 - 3.2, 0, (i % 2) * -0.8]}>
          <Box c={C('#a07850')} pos={[0, 0.5, 0]} size={[2.6, 1, 1.2]} />
          {[-1.2, 1.2].map((x) => (
            <Cyl key={x} c={C('#7a5a3a')} pos={[x, 1.3, -0.5]} a={[0.06, 0.06, 2.6, 8]} />
          ))}
          <Box c={C(awn[i])} pos={[0, 2.5, 0]} size={[2.8, 0.12, 1.6]} rot={[0.25, 0, 0]} />
          {closed ? (
            <Box c={C('#8a6a48')} pos={[0, 1.2, 0.62]} size={[2.5, 1.4, 0.06]} />
          ) : (
            [[-0.7, '#e85a3a'], [0, '#f0b030'], [0.7, '#7ab030']].map(([x, c]) => <Ball key={x as number} c={C(c as string)} pos={[x as number, 1.15, 0.1]} sc={[0.32, 0.18, 0.3]} />)
          )}
        </group>
      ))}
      <Scale p={[4.8, 0, 0.8]} r={0} s={0.8} land={null as never} at={null as never} o={{}} />
    </G>
  );
}

/** A tall balance with two pans on a stand. */
function Scale({ p, r, s }: PieceProps) {
  const brass = C('#c8a050', 0.4, 0.6);
  return (
    <G p={p} r={r} s={s}>
      <Cyl c={C('#6a4a30')} pos={[0, 0.1, 0]} a={[0.5, 0.6, 0.2]} />
      <Cyl c={brass} pos={[0, 1.3, 0]} a={[0.06, 0.08, 2.4, 10]} />
      <Box c={brass} pos={[0, 2.45, 0]} size={[2.4, 0.08, 0.1]} />
      {[-1.1, 1.1].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Cyl c={brass} pos={[0, 2, 0]} a={[0.01, 0.01, 0.9, 4]} />
          <mesh material={brass} position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.38, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          </mesh>
        </group>
      ))}
    </G>
  );
}

/** Great foundation stones laid in a square, plain and quiet (2:127, 22:26). */
function Foundations({ p, r, s }: PieceProps) {
  const st = C('#b8a688');
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: 12 }, (_, i) => {
        const side = Math.floor(i / 3);
        const t = (i % 3) - 1;
        const x = side % 2 === 0 ? t * 1.6 : side === 1 ? 2.6 : -2.6;
        const z = side % 2 === 1 ? t * 1.6 : side === 0 ? 2.6 : -2.6;
        return <Box key={i} c={st} pos={[x, 0.35, z]} size={[1.5, 0.7, 1.5]} />;
      })}
    </G>
  );
}

/** A simple domed prayer hall with an arched door (9:108). */
function Mosque({ p, r, s }: PieceProps) {
  const wall = C('#f0e6d2');
  return (
    <G p={p} r={r} s={s}>
      <Box c={C('#c8b490')} pos={[0, 0.2, 0]} size={[7, 0.4, 6]} />
      <Box c={wall} pos={[0, 1.8, 0]} size={[6, 2.8, 5]} />
      <mesh material={wall} position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <Ball c={C('#c8a050', 0.4, 0.5)} pos={[0, 5.3, 0]} sc={0.18} />
      <mesh position={[0, 1.3, 2.51]}>
        <planeGeometry args={[1.2, 1.9]} />
        <meshStandardMaterial color="#5a4030" />
      </mesh>
      <mesh position={[0, 2.25, 2.51]}>
        <circleGeometry args={[0.6, 24, 0, Math.PI]} />
        <meshStandardMaterial color="#5a4030" />
      </mesh>
    </G>
  );
}

/** A ring of standing stones (o.n), glowing softly when o.glow (8:2, 9:122). */
function Stones({ p, r, s, o }: PieceProps) {
  const n = num(o, 'n', 8);
  const glow = bool(o, 'glow');
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <mesh key={i} material={glow ? C('#e8dcc0', 0.6, 0, '#ffd890', 0.35) : C('#bcae98')} position={[Math.cos(a) * 3, 0.6, Math.sin(a) * 3]} scale={[0.5, 0.8, 0.4]} castShadow>
            <dodecahedronGeometry args={[1, 0]} />
          </mesh>
        );
      })}
    </G>
  );
}

/** A circle of low seats around a mat, for deciding together (42:38). */
function Council({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[2.2, 32]} />
        <meshStandardMaterial color="#a8443a" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Box key={i} c={C(['#d8b880', '#c09060'][i % 2])} pos={[Math.cos(a) * 2.7, 0.25, Math.sin(a) * 2.7]} size={[0.9, 0.5, 0.9]} rot={[0, -a, 0]} />;
      })}
    </G>
  );
}

/** A row of lamps on posts along a night path (17:1, 32:16). */
function Lamps({ p, r, s, o }: PieceProps) {
  const n = num(o, 'n', 5);
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[(i % 2 ? 1.2 : -1.2), 0, -i * 2.4]}>
          <Cyl c={C('#5a4a3a')} pos={[0, 0.9, 0]} a={[0.05, 0.07, 1.8, 8]} />
          <Ball c={C('#ffe0a0', 0.4, 0, '#ffb040', 2)} pos={[0, 1.95, 0]} sc={0.22} />
          {i % 2 === 0 && <pointLight position={[0, 2, 0]} color="#ffc070" intensity={2.5} distance={6} />}
        </group>
      ))}
    </G>
  );
}

/** A wall niche holding a glass lamp shining like a bright star (24:35). */
function Niche({ p, r, s }: PieceProps) {
  const pulse = useRef<THREE.PointLight>(null);
  useFrame((st) => pulse.current && (pulse.current.intensity = 6 + Math.sin(st.clock.elapsedTime * 1.5) * 0.8));
  return (
    <G p={p} r={r} s={s}>
      <Box c={C('#e8dcc4')} pos={[0, 1.8, 0]} size={[4, 3.6, 0.8]} />
      <mesh position={[0, 1.9, 0.41]}>
        <planeGeometry args={[1.2, 1.4]} />
        <meshStandardMaterial color="#3a2a20" />
      </mesh>
      <mesh position={[0, 2.6, 0.41]}>
        <circleGeometry args={[0.6, 24, 0, Math.PI]} />
        <meshStandardMaterial color="#3a2a20" />
      </mesh>
      <mesh position={[0, 1.75, 0.55]}>
        <sphereGeometry args={[0.32, 24, 16]} />
        <meshPhysicalMaterial color="#fff8e0" emissive="#ffe0a0" emissiveIntensity={3} roughness={0.05} transmission={0.4} />
      </mesh>
      <pointLight ref={pulse} position={[0, 1.8, 1.2]} color="#ffe6b0" intensity={6} distance={10} />
    </G>
  );
}

/** A small room with a lit niche and a bowl of fruit; no one is there (3:37, 19:11, 66:11-12). */
function Chamber({ p, r, s, o }: PieceProps) {
  const fruit = bool(o, 'fruit');
  const wall = C(str(o, 'color', '#efe2c8'));
  return (
    <G p={p} r={r} s={s}>
      <Box c={wall} pos={[0, 1.6, -1.6]} size={[4.4, 3.2, 0.3]} />
      <Box c={wall} pos={[-2.1, 1.6, 0]} size={[0.3, 3.2, 3.4]} />
      <Box c={wall} pos={[2.1, 1.6, 0]} size={[0.3, 3.2, 3.4]} />
      <mesh position={[0, 0.05, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[4, 3.2]} />
        <meshStandardMaterial color="#a8443a" />
      </mesh>
      <mesh position={[0, 1.8, -1.44]}>
        <circleGeometry args={[0.55, 24]} />
        <meshStandardMaterial color="#ffe0a0" emissive="#ffc060" emissiveIntensity={1.6} />
      </mesh>
      <pointLight position={[0, 1.8, -0.8]} color="#ffd090" intensity={3} distance={6} />
      {fruit && (
        <group position={[0, 0.3, -0.6]}>
          <mesh material={C('#c8a050', 0.4, 0.5)}>
            <sphereGeometry args={[0.45, 24, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          </mesh>
          {[['#e85a3a', -0.15, 0], ['#f0b030', 0.15, 0.05], ['#7a3a8a', 0, -0.15], ['#7ab030', 0.05, 0.15]].map(([c, x, z], i) => (
            <Ball key={i} c={C(c as string, 0.5)} pos={[x as number, 0.05, z as number]} sc={0.14} />
          ))}
        </group>
      )}
    </G>
  );
}

/** A rounded arch on two pillars (gateway, 3:96; arch of the table, 5:114). */
function Arch({ p, r, s, o }: PieceProps) {
  const st = C(str(o, 'color', '#efe2c8'));
  return (
    <G p={p} r={r} s={s}>
      {[-1.8, 1.8].map((x) => (
        <Cyl key={x} c={st} pos={[x, 1.8, 0]} a={[0.35, 0.42, 3.6, 20]} />
      ))}
      <mesh material={st} position={[0, 3.6, 0]} castShadow>
        <torusGeometry args={[1.8, 0.32, 14, 32, Math.PI]} />
      </mesh>
    </G>
  );
}

/** A colonnade hall: pillars and a roof (5:1, 58:11). */
function Hall({ p, r, s, o }: PieceProps) {
  const n = num(o, 'n', 4);
  const st = C('#efe4cc');
  return (
    <G p={p} r={r} s={s}>
      <Box c={C('#d8c8a8')} pos={[0, 0.15, -2]} size={[n * 2.4 + 1, 0.3, 6]} />
      {Array.from({ length: n }, (_, i) =>
        [-0.5, -3.5].map((z) => <Cyl key={`${i}${z}`} c={st} pos={[i * 2.4 - (n - 1) * 1.2, 1.9, z]} a={[0.28, 0.32, 3.4, 18]} />),
      )}
      <Box c={st} pos={[0, 3.8, -2]} size={[n * 2.4 + 0.8, 0.4, 4.4]} />
    </G>
  );
}

/** A long table under an arch, spread with a cloth and empty dishes (5:114). */
function Table({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <Box c={C('#8a6440')} pos={[0, 0.8, 0]} size={[4.6, 0.12, 1.4]} />
      {[[-2.1, -0.55], [2.1, -0.55], [-2.1, 0.55], [2.1, 0.55]].map(([x, z], i) => (
        <Cyl key={i} c={C('#7a5434')} pos={[x, 0.4, z]} a={[0.06, 0.07, 0.8, 8]} />
      ))}
      <Box c={C('#f4ecda', 0.95)} pos={[0, 0.87, 0]} size={[4.8, 0.03, 1.2]} />
      {[-1.6, -0.5, 0.6, 1.7].map((x) => (
        <Cyl key={x} c={C('#c8a050', 0.4, 0.5)} pos={[x, 0.93, 0]} a={[0.35, 0.28, 0.08]} />
      ))}
      <Arch p={[0, 0, 0]} r={0} s={1.1} land={null as never} at={null as never} o={{}} />
    </G>
  );
}

/** One bright lantern lighting a whole hall (5:32). */
function Lantern({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <Cyl c={C('#6a4a30')} pos={[0, 1.4, 0]} a={[0.08, 0.1, 2.8, 10]} />
      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.4, 24, 16]} />
        <meshStandardMaterial color="#fff0c0" emissive="#ffc060" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[0, 3.1, 0]} color="#ffd090" intensity={8} distance={18} />
    </G>
  );
}

/** Pillars bound together by one rope (3:103). */
function Rope({ p, r, s }: PieceProps) {
  const n = 7;
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return <Cyl key={i} c={C('#efe2c8')} pos={[Math.cos(a) * 2.6, 1.2, Math.sin(a) * 2.6]} a={[0.25, 0.3, 2.4, 16]} />;
      })}
      <mesh material={C('#b08a50')} position={[0, 1.7, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[2.6, 0.07, 8, 48]} />
      </mesh>
    </G>
  );
}

/** A stone bridge arching over a stream (60:8). */
function Bridge({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <mesh position={[0, 0.05, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.4, 10]} />
        <meshStandardMaterial color="#5aa6c8" roughness={0.12} />
      </mesh>
      <mesh material={C('#d8c8a6')} position={[0, 0, 0]} rotation-y={Math.PI / 2} scale={[1, 0.9, 1]}>
        <torusGeometry args={[2.2, 0.5, 12, 32, Math.PI]} />
      </mesh>
    </G>
  );
}

/** A wall of tightly fitted stones (61:4). */
function Wall({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 8 }, (_, i) => <Box key={`${row}-${i}`} c={C(['#cbb894', '#d8c8a4', '#bfae8c'][(i + row) % 3])} pos={[i * 0.9 - 3.15 + (row % 2) * 0.45, 0.3 + row * 0.6, 0]} size={[0.88, 0.58, 0.8]} />),
      )}
    </G>
  );
}

/** A brick tower that stops short, with scaffolding, still far from the sky (40:36-37). */
function Tower({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: 7 }, (_, i) => (
        <Cyl key={i} c={C(i % 2 ? '#c87a50' : '#b86a44')} pos={[0, 0.7 + i * 1.4, 0]} a={[2.2 - i * 0.18, 2.3 - i * 0.18, 1.4, 20]} />
      ))}
      {[-1, 1].map((k) => (
        <Cyl key={k} c={C('#8a6a48')} pos={[k * 2.2, 6, 0.8]} a={[0.06, 0.06, 12, 6]} />
      ))}
      {[3, 6, 9].map((y) => (
        <Box key={y} c={C('#8a6a48')} pos={[0, y, 0.8]} size={[4.6, 0.08, 0.3]} />
      ))}
    </G>
  );
}

/** A smithy: a glowing furnace, an anvil and iron bars (57:25). */
function Forge({ p, r, s }: PieceProps) {
  const fire = useRef<THREE.PointLight>(null);
  useFrame((st) => fire.current && (fire.current.intensity = 4 + Math.sin(st.clock.elapsedTime * 9) * 0.6));
  return (
    <G p={p} r={r} s={s}>
      <mesh material={C('#8a6a5a')} position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[1.4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
      </mesh>
      <mesh position={[0, 0.7, 1.2]}>
        <circleGeometry args={[0.5, 20]} />
        <meshStandardMaterial color="#ff8a30" emissive="#ff6010" emissiveIntensity={2.5} />
      </mesh>
      <pointLight ref={fire} position={[0, 0.8, 1.8]} color="#ff9040" intensity={4} distance={7} />
      <group position={[2.2, 0, 1]}>
        <Cyl c={C('#6a4a30')} pos={[0, 0.35, 0]} a={[0.35, 0.45, 0.7, 14]} />
        <Box c={C('#4a4c52', 0.4, 0.8)} pos={[0, 0.85, 0]} size={[0.9, 0.3, 0.4]} />
      </group>
      {[0, 1, 2].map((i) => (
        <Box key={i} c={C('#5a5c62', 0.4, 0.8)} pos={[-2 + i * 0.3, 0.12, 1.4]} size={[0.2, 0.2, 1.2]} />
      ))}
    </G>
  );
}

/** A reed pen resting by an inkwell on a writing board (68:1). */
function Pen({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <Box c={C('#a07a50')} pos={[0, 0.6, 0]} size={[2.4, 0.15, 1.6]} />
      <Cyl c={C('#7a5a3a')} pos={[0, 0.3, 0]} a={[0.25, 0.35, 0.6, 10]} />
      <Box c={C('#f4ecd8', 0.95)} pos={[-0.2, 0.7, 0]} size={[1.4, 0.02, 1]} />
      <Cyl c={C('#2a2430', 0.3, 0.2)} pos={[0.85, 0.8, -0.4]} a={[0.16, 0.18, 0.3, 16]} />
      <mesh material={C('#c8a46a')} position={[0.5, 0.75, 0.2]} rotation={[0, 0.5, Math.PI / 2 - 0.1]}>
        <cylinderGeometry args={[0.025, 0.035, 1.3, 8]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} c={C('#3a3040')} pos={[-0.25, 0.715, -0.3 + i * 0.2]} size={[1.1, 0.005, 0.02]} />
      ))}
    </G>
  );
}

/** An open scroll on a flat stone (52:3). */
function Scroll({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <Box c={C('#bcae98')} pos={[0, 0.4, 0]} size={[2.6, 0.8, 1.6]} />
      <Box c={C('#f2e6c8', 0.95)} pos={[0, 0.82, 0]} size={[1.8, 0.02, 1.1]} />
      {[-0.95, 0.95].map((x) => (
        <Cyl key={x} c={C('#e8d8b0')} pos={[x, 0.9, 0]} a={[0.1, 0.1, 1.2, 14]} rot={[Math.PI / 2, 0, 0]} />
      ))}
    </G>
  );
}

function Lectern({ p }: PieceProps) {
  return <ReadingStand position={p} />;
}

/** A sundial whose shadow slowly turns (25:45-46). */
function Sundial({ p, r, s }: PieceProps) {
  const sh = useRef<THREE.Group>(null);
  useFrame((st) => sh.current && (sh.current.rotation.y = -0.8 + ((st.clock.elapsedTime * 0.08) % 1.6)));
  return (
    <G p={p} r={r} s={s}>
      <Cyl c={C('#e8dcc4')} pos={[0, 0.2, 0]} a={[2.4, 2.5, 0.4, 40]} />
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} c={C('#8a7a5a')} pos={[Math.cos(i * 0.26 + Math.PI) * 2, 0.42, Math.sin(i * 0.26 + Math.PI) * 2]} size={[0.06, 0.02, 0.35]} rot={[0, -(i * 0.26 + Math.PI), 0]} />
      ))}
      <mesh material={C('#a08050', 0.5, 0.4)} position={[0, 0.9, 0]} rotation-z={0.6}>
        <boxGeometry args={[0.08, 1.4, 0.08]} />
      </mesh>
      <group ref={sh} position={[0, 0.42, 0]}>
        <mesh position={[0, 0, -1]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.12, 2]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>
    </G>
  );
}

/** A row of moons showing the phases, new to full (10:5, 36:39). */
function Moons({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i} position={[(i - 3) * 1.3, 2.2 + Math.sin((i / 6) * Math.PI) * 1.2, 0]}>
          <mesh>
            <sphereGeometry args={[0.5, 24, 16]} />
            <meshStandardMaterial color="#f2eee0" emissive="#f2eee0" emissiveIntensity={0.6} />
          </mesh>
          {/* The dark part, a slightly larger dark sphere slid sideways. */}
          <mesh position={[(3 - i) * 0.16, 0, 0.08]}>
            <sphereGeometry args={[0.51, 24, 16]} />
            <meshBasicMaterial color="#1a2034" transparent opacity={i === 3 ? 0 : 0.92} />
          </mesh>
        </group>
      ))}
      <Box c={C('#bcae98')} pos={[0, 0.3, 0]} size={[9, 0.6, 1]} />
    </G>
  );
}

/** Bright stars joined by faint lines in the night sky (15:16), or one bright star (53:49, o.one). */
function Constellation({ p, r, s, o }: PieceProps) {
  const pts = useMemo(() => {
    const R = rng(num(o, 'seed', 3));
    return bool(o, 'one') ? [[0, 14, -10] as P3] : Array.from({ length: 7 }, (_, i) => [i * 2.2 - 6.6 + R() * 1.2, 12 + R() * 5, -10 - R() * 3] as P3);
  }, [o]);
  const line = useMemo(() => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map((q) => new THREE.Vector3(...q))), new THREE.LineBasicMaterial({ color: '#c8d4ff', transparent: true, opacity: 0.35, fog: false })), [pts]);
  return (
    <G p={p} r={r} s={s}>
      {pts.map((q, i) => (
        <mesh key={i} position={q}>
          <sphereGeometry args={[bool(o, 'one') ? 0.55 : 0.28, 16, 12]} />
          <meshBasicMaterial color="#fff6d8" fog={false} />
        </mesh>
      ))}
      {!bool(o, 'one') && (
<primitive object={line} />
      )}
    </G>
  );
}

/** Streaks of light crossing the night sky (72:8). */
function ShootingStars({ p }: PieceProps) {
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    g.current?.children.forEach((c, i) => {
      const t = (st.clock.elapsedTime * 0.5 + i * 0.37) % 1;
      c.position.set(-12 + t * 24 + i * 3, 22 - t * 8 - i, -18 - i * 3);
      (c as THREE.Mesh).visible = t < 0.6;
    });
  });
  return (
    <group ref={g} position={p}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation-z={-0.32}>
          <boxGeometry args={[3, 0.06, 0.06]} />
          <meshBasicMaterial color="#fff4d0" fog={false} />
        </mesh>
      ))}
    </group>
  );
}

function Disc({ p, o }: PieceProps) {
  return <SkyDisc position={p} color={str(o, 'color', '#fff4d8')} radius={num(o, 'radius', 6)} glow={str(o, 'glow', '#ffe0a0')} />;
}

function Horizon({ p, o }: PieceProps) {
  return <HorizonGlow position={p} color={str(o, 'color', '#ffc890')} />;
}

/** A heavy cloud drifting over the valley (46:24, 51:2), raining when o.rain. */
function Cloud({ p, o }: PieceProps) {
  const g = useRef<THREE.Group>(null);
  useFrame((st) => g.current && (g.current.position.x = Math.sin(st.clock.elapsedTime * 0.1) * 2));
  return (
    <group ref={g}>
      <RainCloud position={[p[0], p[1] + num(o, 'h', 9), p[2]]} width={num(o, 'w', 10)} rain={bool(o, 'rain')} dark={num(o, 'dark', 0.4)} />
    </group>
  );
}

/** Gusts of wind: pale ribbons sweeping past, bending grass (51:1, 69:6, 77:1). */
function Wind({ p, r, s }: PieceProps) {
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    g.current?.children.forEach((c, i) => {
      const t = (st.clock.elapsedTime * (0.3 + i * 0.05) + i * 0.21) % 1;
      c.position.set(-10 + t * 20, 0.8 + (i % 4) * 0.7 + Math.sin(t * 6 + i) * 0.3, (i % 5) * 1.6 - 4);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI) * 0.45;
    });
  });
  return (
    <group ref={g} position={p} rotation-y={r} scale={s}>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} rotation-y={Math.PI / 2}>
          <torusGeometry args={[1.2, 0.03, 4, 24, 1.6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Birds gliding in wide slow circles (24:41, 67:19, 38:19). */
function Birds({ p, o }: PieceProps) {
  const g = useRef<THREE.Group>(null);
  const n = num(o, 'n', 7);
  useFrame((st) => {
    g.current?.children.forEach((b, i) => {
      const t = st.clock.elapsedTime * 0.25 + (i / n) * Math.PI * 2;
      const rr = 5 + (i % 3) * 2;
      b.position.set(Math.cos(t) * rr, num(o, 'h', 9) + (i % 4) * 1.2, Math.sin(t) * rr);
      b.rotation.set(0, -t, 0.25);
    });
  });
  const w = C('#f6f2ea', 0.8);
  return (
    <group ref={g} position={p}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i}>
          <Ball c={w} pos={[0, 0, 0]} sc={[0.09, 0.09, 0.3]} />
          <Ball c={w} pos={[0.4, 0, 0]} sc={[0.45, 0.04, 0.16]} />
          <Ball c={w} pos={[-0.4, 0, 0]} sc={[0.45, 0.04, 0.16]} />
        </group>
      ))}
    </group>
  );
}

/** A small herd grazing (o.kinds). */
function Herd({ p, r, s, o }: PieceProps) {
  const kinds = (o.kinds as AnimalKind[]) ?? ['sheep', 'sheep', 'cow', 'goat'];
  return (
    <G p={p} r={r} s={s}>
      {kinds.map((k, i) => (
        <group key={i} position={[(i % 3) * 2.2 - 2.2, 0, -Math.floor(i / 3) * 2.2 + (i % 2) * 0.6]} rotation-y={i * 1.3}>
          <Animal kind={k} scale={k === 'camel' || k === 'horse' ? 0.75 : 0.85} />
        </group>
      ))}
    </G>
  );
}

/** A sailing ship bobbing on a patch of water (o.big: ships like mountains; o.still: no swell). */
function Ships({ p, r, s, o }: PieceProps) {
  const n = num(o, 'n', 1);
  const big = bool(o, 'big');
  const still = bool(o, 'still');
  const hull = useMemo(() => hullGeometry(big ? 7 : 3.6, big ? 2.6 : 1.4, big ? 1.8 : 0.9), [big]);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ map: plankTexture('#7a5a3a', '#4a3020', 8), roughness: 0.8 }), []);
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (still) return;
    g.current?.children.forEach((c, i) => {
      if (i === 0) return;
      c.position.y = Math.sin(st.clock.elapsedTime * 1.1 + i) * 0.08;
      c.rotation.z = Math.sin(st.clock.elapsedTime * 0.9 + i) * 0.04;
    });
  });
  const sail = C('#f6efe0', 0.9);
  const H = big ? 1.8 : 0.9;
  return (
    <G p={p} r={r} s={s}>
      <group ref={g}>
        <Sea p={[0, 0, 0]} r={0} s={1} land={null as never} at={null as never} o={{ r: big ? 11 : 7 }} />
        {Array.from({ length: n }, (_, i) => (
          <group key={i} position={[(i - (n - 1) / 2) * (big ? 9 : 4.5), 0.1, -i * 1.5]} rotation-y={0.4 + i * 0.5}>
            <mesh geometry={hull} material={wood} position={[0, H / 2, 0]} castShadow />
            <Cyl c={wood} pos={[0, H + (big ? 2.6 : 1.3), 0]} a={[0.06, 0.08, big ? 5.2 : 2.6, 8]} />
            {/* A full sail, or furled thin when the wind is still. */}
            <mesh material={sail} position={[0.3, H + (big ? 2.8 : 1.4), 0]} scale={still ? [0.15, big ? 2.6 : 1.3, 0.1] : [big ? 1.8 : 0.9, big ? 2.6 : 1.3, 0.1]} castShadow>
              <sphereGeometry args={[1, 18, 10, 0, Math.PI]} />
            </mesh>
            {bool(o, 'cargo') && [-1, 0, 1].map((k) => <Box key={k} c={C('#c8a46a')} pos={[k * 0.8, H + 0.25, 0]} size={[0.6, 0.5, 0.6]} />)}
          </group>
        ))}
      </group>
    </G>
  );
}

/** An empty wooden ark resting on a ridge (29:15, 7:64, 54:13). */
function ArkPiece({ p, r, s, o }: PieceProps) {
  const hull = useMemo(() => hullGeometry(8, 3, 2), []);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ map: plankTexture('#8a5a34', '#4a2e18', 12), roughness: 0.8 }), []);
  return (
    <G p={p} r={r} s={s}>
      {bool(o, 'ridge') && <Ball c={C('#7a9a58')} pos={[0, -1.2, 0]} sc={[7, 3, 5]} />}
      <group position={[0, bool(o, 'ridge') ? 1.5 : 0, 0]} rotation-z={0.05}>
        <mesh geometry={hull} material={wood} position={[0, 1, 0]} castShadow />
        {!bool(o, 'frame') && <Box c={wood} pos={[0, 2.6, 0]} size={[4, 1.2, 1.8]} />}
      </group>
    </G>
  );
}

/** Empty tents, flapping in the wind when o.windy (33:9). */
function Tents({ p, r, s, o }: PieceProps) {
  const n = num(o, 'n', 3);
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (!bool(o, 'windy')) return;
    g.current?.children.forEach((c, i) => (c.rotation.z = Math.sin(st.clock.elapsedTime * 6 + i) * 0.04));
  });
  return (
    <group ref={g} position={p} rotation-y={r} scale={s}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[i * 4 - (n - 1) * 2, 0, (i % 2) * -2]}>
          <mesh material={C(['#e8d4b0', '#c8a078', '#d8c0a0'][i % 3], 0.95)} position={[0, 0.9, 0]} rotation-y={Math.PI / 4} castShadow>
            <coneGeometry args={[1.8, 2.2, 4]} />
          </mesh>
          <mesh position={[0, 0.6, 1.25]}>
            <planeGeometry args={[0.7, 1.1]} />
            <meshStandardMaterial color="#3a2a1e" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A dark cave mouth in a rounded hill (9:40). */
function Cave({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <Ball c={C('#9a8a70', 1)} pos={[0, 0, 0]} sc={[6, 4.5, 5]} />
      <mesh position={[0, 1.1, 4.6]} scale={[1, 1.3, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial color="#1a1410" />
      </mesh>
    </G>
  );
}

/** Homes cut into the cliff, empty (7:74, 15:82, 26:149). */
function Carved({ p, r }: PieceProps) {
  return <CarvedCliff position={p} rotation={r} />;
}

/** A wooden chest drifting in the reeds by a river bank (20:39). */
function Chest({ p, r, s }: PieceProps) {
  const g = useRef<THREE.Group>(null);
  useFrame((st) => g.current && (g.current.position.y = 0.18 + Math.sin(st.clock.elapsedTime * 1.4) * 0.04));
  return (
    <G p={p} r={r} s={s}>
      <River p={[0, 0, 0]} r={Math.PI / 2} s={1} land={null as never} at={null as never} o={{ len: 14 }} />
      <group ref={g} position={[0, 0.18, 0]}>
        <Box c={C('#8a5a34')} pos={[0, 0.2, 0]} size={[1, 0.45, 0.6]} />
        <mesh material={C('#9a6a40')} position={[0, 0.45, 0]} rotation-z={Math.PI / 2} scale={[0.25, 1, 0.6]}>
          <cylinderGeometry args={[0.5, 0.5, 1, 16, 1, false, 0, Math.PI]} />
        </mesh>
      </group>
      {Array.from({ length: 14 }, (_, i) => (
        <Cyl key={i} c={C('#7a9a48')} pos={[-3 + i * 0.45, 0.7, 1.3 + (i % 3) * 0.15]} a={[0.02, 0.03, 1.4 + (i % 4) * 0.2, 5]} />
      ))}
    </G>
  );
}

/** Two towering walls of water with a dry path between, foam along their tops (20:77, 26:63). */
function SeaPath({ p, r, s }: PieceProps) {
  const w = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2f86a6', roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.88 }), []);
  const foam = C('#f2f8fa', 0.6);
  const g = useRef<THREE.Group>(null);
  useFrame((st) => g.current?.children.forEach((c, i) => (c.position.y = 6.1 + Math.sin(st.clock.elapsedTime * 1.5 + i) * 0.08)));
  return (
    <G p={p} r={r} s={s}>
      {[-1, 1].map((k) => (
        <mesh key={k} material={w} position={[k * 3.4, 3, -8]}>
          <boxGeometry args={[3, 6, 18]} />
        </mesh>
      ))}
      <group ref={g}>
        {[-1, 1].map((k) => (
          <mesh key={k} material={foam} position={[k * 3.4, 6.1, -8]}>
            <boxGeometry args={[3.1, 0.3, 18.1]} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.04, -8]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.6, 18]} />
        <meshStandardMaterial color="#c8b08a" roughness={1} />
      </mesh>
    </G>
  );
}

/** A small fire burning far off on a dark slope (20:10, 28:29). */
function Fire({ p, r, s }: PieceProps) {
  const l = useRef<THREE.PointLight>(null);
  const f = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (l.current) l.current.intensity = 5 + Math.sin(t * 11) * 1 + Math.sin(t * 7) * 0.6;
    if (f.current) f.current.scale.y = 1 + Math.sin(t * 9) * 0.12;
  });
  return (
    <G p={p} r={r} s={s}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Cyl key={i} c={C('#5a3a22')} pos={[0, 0.15, 0]} a={[0.06, 0.08, 1.2, 6]} rot={[Math.PI / 2, (i * Math.PI) / 5, 0]} />
      ))}
      <mesh ref={f} position={[0, 0.6, 0]}>
        <coneGeometry args={[0.35, 1.1, 16]} />
        <meshBasicMaterial color="#ffb040" />
      </mesh>
      <pointLight ref={l} position={[0, 1.2, 0]} color="#ff9a40" intensity={5} distance={14} />
    </G>
  );
}

/** A pair of sandals left at the edge of the valley (20:12). */
function Sandals({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      {[-0.18, 0.18].map((x) => (
        <mesh key={x} material={C('#8a5a34')} position={[x, 0.03, 0]} scale={[0.12, 0.03, 0.3]}>
          <sphereGeometry args={[1, 16, 8]} />
        </mesh>
      ))}
    </G>
  );
}

/** A treasure house sinking into the ground, chests spilling (28:81). */
function Sunken({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <group position={[0, -1.4, 0]} rotation={[0.15, 0, 0.12]}>
        <Box c={C('#e0cca0')} pos={[0, 1.8, 0]} size={[5, 3.6, 4]} />
        <Ball c={C('#c8a050', 0.4, 0.5)} pos={[0, 3.8, 0]} sc={[1.6, 0.9, 1.4]} />
      </group>
      {[[-2.6, 2], [2.4, 2.4]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0.3, i, 0.2]}>
          <Box c={C('#6a4a2e')} pos={[0, 0.25, 0]} size={[0.9, 0.5, 0.6]} />
          <Ball c={C('#e8c050', 0.3, 0.8)} pos={[0, 0.55, 0]} sc={[0.35, 0.12, 0.25]} />
        </group>
      ))}
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[2.8, 4.2, 40]} />
        <meshStandardMaterial color="#5a4632" roughness={1} />
      </mesh>
    </G>
  );
}

/** A spider's web strung between two branches: large and fine, and easily torn (29:41). */
function Web({ p, r, s }: PieceProps) {
  const silk = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6 }), []);
  return (
    <G p={p} r={r} s={s}>
      {[-2.6, 2.6].map((x) => (
        <Cyl key={x} c={C('#6a4a30')} pos={[x, 2, 0]} a={[0.12, 0.18, 4, 10]} rot={[0, 0, x > 0 ? -0.15 : 0.15]} />
      ))}
      <group position={[0, 2.4, 0]}>
        {[0.4, 0.8, 1.2, 1.6, 2].map((rr) => (
          <mesh key={rr} material={silk}>
            <torusGeometry args={[rr, 0.012, 3, 8]} />
          </mesh>
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} material={silk} rotation-z={(i * Math.PI) / 8}>
            <boxGeometry args={[4.4, 0.02, 0.02]} />
          </mesh>
        ))}
        <Ball c={C('#2a2228')} pos={[0.3, 0.2, 0.05]} sc={0.12} />
      </group>
    </G>
  );
}

/** A pattern of fingertip whorls in light on a smooth stone (75:4). */
function Fingerprint({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <Cyl c={C('#d8ccb8')} pos={[0, 0.2, 0]} a={[2.2, 2.3, 0.4, 40]} />
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[0, 0.42, 0]} rotation-x={-Math.PI / 2} scale={[1, 1.35, 1]}>
          <ringGeometry args={[0.15 + i * 0.17, 0.2 + i * 0.17, 40, 1, 0.3 * i, Math.PI * 2 - 0.5]} />
          <meshBasicMaterial color="#ffe6a0" transparent opacity={0.85} />
        </mesh>
      ))}
    </G>
  );
}

/** A dial of the night hours on a terrace (73:2-4). */
function Dial({ p, r, s }: PieceProps) {
  const hand = useRef<THREE.Mesh>(null);
  useFrame((st) => hand.current && (hand.current.rotation.z = -st.clock.elapsedTime * 0.1));
  return (
    <G p={p} r={r} s={s}>
      <Cyl c={C('#2a3050')} pos={[0, 1.8, 0]} a={[1.8, 1.8, 0.2, 40]} rot={[Math.PI / 2, 0, 0]} />
      {Array.from({ length: 12 }, (_, i) => (
        <Ball key={i} c={C('#e8e0c8', 0.5, 0, '#ffe0a0', 0.6)} pos={[Math.cos((i / 12) * Math.PI * 2) * 1.5, 1.8 + Math.sin((i / 12) * Math.PI * 2) * 1.5, 0.15]} sc={i % 3 ? 0.06 : 0.12} />
      ))}
      <mesh ref={hand} position={[0, 1.8, 0.16]}>
        <boxGeometry args={[0.06, 1.3, 0.03]} />
        <meshStandardMaterial color="#f2d27a" />
      </mesh>
      <Cyl c={C('#8a7a5a')} pos={[0, 0.4, 0]} a={[0.15, 0.25, 0.8]} />
    </G>
  );
}

/** A stone washing basin with water and a folded cloth (74:4). */
function Basin({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <Cyl c={C('#d8ccb4')} pos={[0, 0.45, 0]} a={[0.9, 0.7, 0.9, 28]} />
      <mesh position={[0, 0.91, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.8, 28]} />
        <meshStandardMaterial color="#7ac0e0" roughness={0.1} />
      </mesh>
      <Box c={C('#f6f2ea', 0.95)} pos={[1.4, 0.15, 0.2]} size={[0.8, 0.3, 0.6]} />
    </G>
  );
}

/** Woven baskets of fruit and bread, ready to share (63:10). */
function Baskets({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[i * 1.2 - 1.8, 0, (i % 2) * 0.6]}>
          <mesh material={C('#b08a50')} position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.45, 0.35, 0.5, 18, 1, true]} />
          </mesh>
          <Ball c={C(['#e85a3a', '#f0b030', '#c88a44', '#7ab030'][i], 0.6)} pos={[0, 0.5, 0]} sc={[0.38, 0.18, 0.38]} />
        </group>
      ))}
    </G>
  );
}

/** A path of steps up a gentle slope (31:19, 64:16, 25:63). */
function StepPath({ p, r, s, o }: PieceProps) {
  const n = num(o, 'n', 8);
  return (
    <G p={p} r={r} s={s}>
      {Array.from({ length: n }, (_, i) => (
        <Cyl key={i} c={C(i % 2 ? '#e2d4b8' : '#d4c4a4')} pos={[Math.sin(i * 0.5) * 0.8, 0.08 + i * (num(o, 'rise', 0) as number), -i * 1.2]} a={[0.55, 0.6, 0.16, 20]} />
      ))}
    </G>
  );
}

/** A riverbank of red clay with pots drying (32:7). */
function Clay({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <Ball c={C('#b8643e', 1)} pos={[0, -0.6, 0]} sc={[5, 1.6, 3]} />
      {[[-1.5, 0], [0, 0.5], [1.4, -0.2]].map(([x, z], i) => (
        <group key={i} position={[x, 0.9, z]}>
          <Ball c={C('#c8784a', 0.8)} pos={[0, 0.3, 0]} sc={[0.35, 0.4, 0.35]} />
          <Cyl c={C('#c8784a', 0.8)} pos={[0, 0.72, 0]} a={[0.12, 0.15, 0.18, 14]} />
        </group>
      ))}
    </G>
  );
}

/** A circle of pale stones for a well of fresh water with a bucket (56:68-70). */
function WellPiece({ p }: PieceProps) {
  return <Well position={p} />;
}

/** A pair of round "light" and "lamp" globes on stands: the sun and the moon (25:61). */
function SunMoon({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s}>
      <Cyl c={C('#e8dcc6')} pos={[-1.2, 0.6, 0]} a={[0.4, 0.5, 1.2]} />
      <Cyl c={C('#e8dcc6')} pos={[1.2, 0.6, 0]} a={[0.4, 0.5, 1.2]} />
      <mesh position={[-1.2, 1.65, 0]}>
        <sphereGeometry args={[0.45, 24, 16]} />
        <meshStandardMaterial color="#ffb040" emissive="#ff8a20" emissiveIntensity={2} />
      </mesh>
      <mesh position={[1.2, 1.65, 0]}>
        <sphereGeometry args={[0.42, 24, 16]} />
        <meshStandardMaterial color="#e6eaf2" />
      </mesh>
    </G>
  );
}

/** A black crow on the ground (5:31). */
function Crow({ p, r, s }: PieceProps) {
  return (
    <G p={p} r={r} s={s * 1.6}>
      <Animal kind="bird" color="#2a2a32" />
    </G>
  );
}

export const PIECES: Record<string, (p: PieceProps) => ReactNode> = {
  mountain: Mountain,
  streaked: Streaked,
  dunes: Dunes,
  sea: Sea,
  river: River,
  twoSeas: TwoSeas,
  spring: SpringPiece,
  copper: Copper,
  bowls: Bowls,
  dam: Dam,
  palms: Palms,
  orchard: Orchard,
  olives: Olives,
  tree: BigTree,
  fallen: Fallen,
  grain: Grain,
  vine: VinePiece,
  shoot: Shoot,
  rockSeed: RockSeed,
  village: Village,
  house: House,
  doorway: Doorway,
  market: Market,
  scale: Scale,
  foundations: Foundations,
  mosque: Mosque,
  stones: Stones,
  council: Council,
  lamps: Lamps,
  niche: Niche,
  chamber: Chamber,
  arch: Arch,
  hall: Hall,
  table: Table,
  lantern: Lantern,
  rope: Rope,
  bridge: Bridge,
  wall: Wall,
  tower: Tower,
  forge: Forge,
  pen: Pen,
  scroll: Scroll,
  lectern: Lectern,
  sundial: Sundial,
  moons: Moons,
  constellation: Constellation,
  shootingStars: ShootingStars,
  disc: Disc,
  horizon: Horizon,
  cloud: Cloud,
  wind: Wind,
  birds: Birds,
  herd: Herd,
  ships: Ships,
  ark: ArkPiece,
  tents: Tents,
  cave: Cave,
  carved: Carved,
  chest: Chest,
  seaPath: SeaPath,
  fire: Fire,
  sandals: Sandals,
  sunken: Sunken,
  web: Web,
  fingerprint: Fingerprint,
  dial: Dial,
  basin: Basin,
  baskets: Baskets,
  steps: StepPath,
  clay: Clay,
  well: WellPiece,
  sunMoon: SunMoon,
  crow: Crow,
};
