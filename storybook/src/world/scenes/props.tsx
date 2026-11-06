// Soft, rounded storybook props shared by the hands-on worlds: animals,
// a wooden hull, rain clouds, numbered stones and blooming flower beds.
// Animals only: no person, prophet or angel is ever shown.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { canvas, toTexture } from '@/three/textures';
import { mat } from './kit';

export type AnimalKind = 'giraffe' | 'camel' | 'sheep' | 'cow' | 'goat' | 'horse' | 'bird' | 'elephant' | 'lion';

const COAT: Record<AnimalKind, string> = {
  giraffe: '#e8b45a',
  camel: '#cfa36a',
  sheep: '#f4efe4',
  cow: '#f1ece2',
  goat: '#8a6a4a',
  horse: '#8a5a3a',
  bird: '#f2f2f2',
  elephant: '#9a9aa2',
  lion: '#d9a24e',
};

/** A friendly round animal, gently breathing. Faces +z. About 1 m to 4 m tall. */
export function Animal({ kind, scale = 1, color }: { kind: AnimalKind; scale?: number; color?: string }) {
  const g = useRef<THREE.Group>(null);
  const seed = useMemo(() => Math.random() * 10, []);
  const coat = useMemo(() => mat(color ?? COAT[kind], 0.85), [kind, color]);
  const dark = useMemo(() => mat(kind === 'sheep' ? '#4a3c34' : '#4a3426', 0.8), [kind]);
  const spot = useMemo(() => mat(kind === 'cow' ? '#3a2f2a' : '#9a5a24', 0.85), [kind]);
  useFrame((st) => {
    if (g.current) g.current.scale.y = scale * (1 + Math.sin(st.clock.elapsedTime * 2 + seed) * 0.015);
  });
  const leg = (x: number, z: number, h: number, r = 0.09) => (
    <mesh key={`${x}${z}`} material={kind === 'sheep' ? dark : coat} position={[x, h / 2, z]} castShadow>
      <capsuleGeometry args={[r, h - 2 * r, 4, 10]} />
    </mesh>
  );
  const eyes = (y: number, z: number, w: number) =>
    [-w, w].map((x) => (
      <mesh key={x} position={[x, y, z]} material={dark}>
        <sphereGeometry args={[0.035, 8, 8]} />
      </mesh>
    ));
  let body: React.ReactNode = null;
  if (kind === 'bird')
    body = (
      <group position={[0, 0.25, 0]}>
        <mesh material={coat} scale={[0.7, 0.75, 1]} castShadow>
          <sphereGeometry args={[0.22, 16, 12]} />
        </mesh>
        <mesh material={coat} position={[0, 0.18, 0.14]}>
          <sphereGeometry args={[0.12, 14, 10]} />
        </mesh>
        <mesh position={[0, 0.17, 0.27]} rotation-x={Math.PI / 2}>
          <coneGeometry args={[0.04, 0.1, 10]} />
          <meshStandardMaterial color="#e8a040" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={coat} position={[s * 0.15, 0.02, -0.02]} rotation-z={s * 0.5} scale={[0.25, 0.6, 1]}>
            <sphereGeometry args={[0.2, 12, 8]} />
          </mesh>
        ))}
        {eyes(0.21, 0.24, 0.05)}
      </group>
    );
  else {
    const tall = kind === 'giraffe' ? 1.6 : kind === 'camel' ? 1.15 : kind === 'horse' ? 0.9 : kind === 'elephant' ? 0.85 : kind === 'cow' ? 0.6 : 0.42;
    const bodyLen = kind === 'elephant' ? 0.9 : kind === 'giraffe' ? 0.6 : 0.55;
    const bodyR = kind === 'elephant' ? 0.62 : kind === 'cow' ? 0.4 : kind === 'sheep' ? 0.36 : 0.32;
    const by = tall + bodyR * 0.7;
    const neck = kind === 'giraffe' ? 1.7 : kind === 'camel' ? 0.75 : kind === 'horse' ? 0.6 : kind === 'elephant' ? 0.05 : 0.25;
    const headY = by + neck * 0.9 + 0.1;
    const headZ = bodyLen * 0.5 + bodyR * 0.6 + (kind === 'camel' ? 0.35 : kind === 'giraffe' ? 0.05 : 0.15);
    const legR = kind === 'elephant' ? 0.2 : kind === 'giraffe' || kind === 'camel' ? 0.08 : 0.09;
    body = (
      <>
        {leg(-bodyR * 0.55, bodyLen * 0.45, tall + 0.2, legR)}
        {leg(bodyR * 0.55, bodyLen * 0.45, tall + 0.2, legR)}
        {leg(-bodyR * 0.55, -bodyLen * 0.45, tall + 0.2, legR)}
        {leg(bodyR * 0.55, -bodyLen * 0.45, tall + 0.2, legR)}
        {kind === 'sheep' ? (
          // A fleece of woolly puffs.
          [[0, 0, 0, 0.38], [0.2, 0.12, 0.22, 0.26], [-0.2, 0.12, 0.22, 0.26], [0.2, 0.1, -0.24, 0.27], [-0.2, 0.1, -0.24, 0.27], [0, 0.26, 0, 0.3]].map(([x, y, z, r], i) => (
            <mesh key={i} material={coat} position={[x, by + y, z]} castShadow>
              <sphereGeometry args={[r, 14, 10]} />
            </mesh>
          ))
        ) : (
          <mesh material={coat} position={[0, by, 0]} rotation-x={Math.PI / 2} castShadow>
            <capsuleGeometry args={[bodyR, bodyLen, 6, 16]} />
          </mesh>
        )}
        {kind === 'camel' && (
          <mesh material={coat} position={[0, by + bodyR * 0.75, -0.05]} scale={[0.8, 0.9, 1]} castShadow>
            <sphereGeometry args={[0.32, 14, 10]} />
          </mesh>
        )}
        {kind === 'giraffe' &&
          [[0.2, 0.1, 0.2], [-0.25, 0.05, -0.1], [0.28, -0.05, -0.25], [-0.15, 0.2, 0.3], [0.0, 0.3, -0.05]].map(([x, y, z], i) => (
            <mesh key={i} material={spot} position={[x, by + y, z]} scale={[0.14, 0.14, 0.03]} rotation-y={Math.atan2(x, z)}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          ))}
        {kind === 'cow' &&
          [[0.32, 0.05, 0.1], [-0.3, 0.1, -0.15]].map(([x, y, z], i) => (
            <mesh key={i} material={spot} position={[x, by + y, z]} scale={[0.04, 0.2, 0.26]}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          ))}
        {neck > 0.1 && (
          <mesh material={coat} position={[0, by + neck * 0.45, bodyLen * 0.5 + 0.1]} rotation-x={kind === 'camel' ? 0.7 : 0.25} castShadow>
            <capsuleGeometry args={[kind === 'giraffe' ? 0.11 : 0.13, neck, 4, 10]} />
          </mesh>
        )}
        <group position={[0, headY, headZ]}>
          <mesh material={kind === 'sheep' ? dark : coat} scale={[1, 0.9, kind === 'elephant' ? 1 : 1.35]} castShadow>
            <sphereGeometry args={[kind === 'elephant' ? 0.42 : 0.2, 16, 12]} />
          </mesh>
          {kind === 'elephant' && (
            <>
              <mesh material={coat} position={[0, -0.4, 0.38]} rotation-x={0.3}>
                <capsuleGeometry args={[0.1, 0.6, 4, 10]} />
              </mesh>
              {[-1, 1].map((s) => (
                <mesh key={s} material={coat} position={[s * 0.42, 0, -0.05]} scale={[0.1, 0.42, 0.36]}>
                  <sphereGeometry args={[1, 14, 10]} />
                </mesh>
              ))}
            </>
          )}
          {kind === 'lion' && (
            <mesh position={[0, 0, -0.08]} material={dark}>
              <sphereGeometry args={[0.3, 16, 12]} />
            </mesh>
          )}
          {(kind === 'giraffe' || kind === 'goat' || kind === 'cow') &&
            [-1, 1].map((s) => (
              <mesh key={s} material={kind === 'giraffe' ? coat : dark} position={[s * 0.09, 0.2, -0.05]}>
                <capsuleGeometry args={[0.03, 0.12, 4, 6]} />
              </mesh>
            ))}
          {kind !== 'elephant' &&
            [-1, 1].map((s) => (
              <mesh key={s} material={coat} position={[s * 0.17, 0.08, -0.06]} rotation-z={s * -0.9} scale={[0.5, 1, 0.3]}>
                <sphereGeometry args={[0.1, 10, 8]} />
              </mesh>
            ))}
          {eyes(0.06, kind === 'elephant' ? 0.36 : 0.2, kind === 'elephant' ? 0.18 : 0.11)}
        </group>
        <mesh material={kind === 'lion' || kind === 'cow' ? dark : coat} position={[0, by + 0.05, -bodyLen * 0.5 - bodyR * 0.9]} rotation-x={-0.6}>
          <capsuleGeometry args={[0.035, 0.35, 4, 6]} />
        </mesh>
      </>
    );
  }
  return (
    <group ref={g} scale={scale}>
      {body}
    </group>
  );
}

/** A plank-built hull: rounded bilge, raised bow and stern. Length along x. */
export function hullGeometry(length: number, width: number, height: number) {
  const g = new THREE.BoxGeometry(length, height, width, 28, 6, 10);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    const t = (2 * x) / length;
    const v = (y + height / 2) / height; // 0 at the keel, 1 at the rail
    // Narrow toward bow and stern; round the bottom into a bilge.
    const beam = Math.sqrt(Math.max(0.02, 1 - Math.pow(Math.abs(t), 2.6)));
    z *= beam * (0.35 + 0.65 * Math.sin((Math.min(v, 1) * Math.PI) / 2));
    // Sheer: the rail sweeps up at both ends.
    y += Math.pow(Math.abs(t), 3) * height * 0.55 * v;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/** A plank texture for hulls and decks. */
export function plankTexture(base = '#8a5a34', line = '#5a3a20', rows = 10) {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < rows; r++) {
    const y = (r * 256) / rows;
    ctx.fillStyle = `rgba(255,240,210,${0.05 + (r % 3) * 0.03})`;
    ctx.fillRect(0, y, 256, 256 / rows);
    ctx.fillStyle = line;
    ctx.fillRect(0, y, 256, 2);
    ctx.fillRect(((r * 97) % 200) + 20, y, 2, 256 / rows);
  }
  return toTexture(c, 1);
}

/** A round label: a number or a few words painted on a disc texture. */
export function labelTexture(text: string, bg = '#f6e7c4', fg = '#5a3a1a', w = 256, h = 256) {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = text.split('\n');
  const size = text.length <= 2 ? h * 0.6 : Math.min(h / (words.length + 0.6), (w * 1.6) / Math.max(...words.map((l) => l.length)));
  ctx.font = `bold ${size}px Nunito, Arial, sans-serif`;
  words.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (words.length - 1) / 2) * size * 1.05));
  return toTexture(c);
}

/** A soft grey rain cloud with falling streaks below it. */
export function RainCloud({ position, width = 6, rain = true, dark = 0.5 }: { position: [number, number, number]; width?: number; rain?: boolean; dark?: number }) {
  const col = useMemo(() => new THREE.Color('#ffffff').lerp(new THREE.Color('#6a7482'), dark), [dark]);
  const cloud = useMemo(() => new THREE.MeshLambertMaterial({ color: col }), [col]);
  const streaks = useRef<THREE.InstancedMesh>(null);
  const N = 80;
  const drops = useMemo(() => Array.from({ length: N }, () => [(Math.random() - 0.5) * width, Math.random() * 4, (Math.random() - 0.5) * width * 0.5]), [width]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame((_, dt) => {
    const s = streaks.current;
    if (!s) return;
    drops.forEach((d, i) => {
      d[1] -= dt * 9;
      if (d[1] < -4.2) d[1] = 0;
      m.makeTranslation(d[0], d[1] - 0.2, d[2]);
      s.setMatrixAt(i, m);
    });
    s.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={position}>
      {[-0.35, -0.12, 0.12, 0.35, 0].map((t, i) => (
        <mesh key={i} material={cloud} position={[t * width, i === 4 ? 0.5 : (i % 2) * 0.25, (i % 3) * 0.2 - 0.2]} scale={[1, 0.75, 0.9]}>
          <sphereGeometry args={[width * (i === 4 ? 0.26 : 0.2), 16, 12]} />
        </mesh>
      ))}
      {rain && (
        <instancedMesh ref={streaks} args={[undefined, undefined, N]} frustumCulled={false}>
          <cylinderGeometry args={[0.012, 0.012, 0.4, 4]} />
          <meshBasicMaterial color="#b8cce0" transparent opacity={0.6} />
        </instancedMesh>
      )}
    </group>
  );
}

/** A flower bed that is bare earth until `bloom`, then grows green and flowers. */
export function FlowerBed({ position, bloom, seed = 1, colors = ['#f2a0b8', '#f6d260', '#ffffff', '#c890e0'] }: { position: [number, number, number]; bloom: boolean; seed?: number; colors?: string[] }) {
  const grow = useRef(0);
  const g = useRef<THREE.Group>(null);
  const plants = useMemo(() => {
    let s = seed * 9301 + 49297;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: 14 }, (_, i) => ({ x: (r() - 0.5) * 2.2, z: (r() - 0.5) * 1.4, h: 0.35 + r() * 0.35, c: colors[i % colors.length] }));
  }, [seed, colors]);
  useFrame((_, dt) => {
    grow.current = THREE.MathUtils.damp(grow.current, bloom ? 1 : 0.02, 1.6, dt);
    if (g.current) g.current.scale.setScalar(grow.current);
  });
  const soil = useMemo(() => mat(bloom ? '#5a4030' : '#9a7a5a'), [bloom]);
  const leaf = useMemo(() => mat('#5a9a3a', 0.8), []);
  return (
    <group position={position}>
      <mesh material={soil} position={[0, 0.08, 0]} scale={[1.4, 0.18, 0.95]} receiveShadow>
        <sphereGeometry args={[1, 24, 12]} />
      </mesh>
      <group ref={g} position={[0, 0.15, 0]}>
        {plants.map((p, i) => (
          <group key={i} position={[p.x, 0, p.z]}>
            <mesh material={leaf} position={[0, p.h / 2, 0]}>
              <cylinderGeometry args={[0.02, 0.03, p.h, 6]} />
            </mesh>
            <mesh material={leaf} position={[0.06, p.h * 0.4, 0]} scale={[1, 0.4, 0.6]}>
              <sphereGeometry args={[0.09, 10, 8]} />
            </mesh>
            <mesh position={[0, p.h + 0.04, 0]} scale={[1, 0.6, 1]}>
              <sphereGeometry args={[0.1, 12, 8]} />
              <meshStandardMaterial color={p.c} roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** A clay water jar with a painted band. */
export function Jar({ color = '#c27a48', band = '#f2dcb0', scale = 1 }: { color?: string; band?: string; scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.32, 0]} scale={[1, 1.15, 1]} castShadow>
        <sphereGeometry args={[0.28, 18, 14]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.16, 16]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.38, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.31, 0.025, 8, 28]} />
        <meshStandardMaterial color={band} roughness={0.7} />
      </mesh>
    </group>
  );
}
