// The building kit: warm plastered houses with beam ends and shutters, domed
// halls, arches, market stalls, wells, tents, bridges, docks, boats, a beacon
// tower, broken columns, shared tables, pens, garden beds, carved cliff faces,
// strings of lanterns and the small things people carry. Rounded and
// hand-made looking; drawn in code. Placed from each world's recipe.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { planksTexture, stoneTexture } from '@/ark/paint';
import { Supply } from '@/ark/Ark';
import { motion } from '@/ark/shared';
import type { Terrain } from './terrain';

export type StructureType =
  | 'house'
  | 'dome'
  | 'arch'
  | 'wall'
  | 'stall'
  | 'well'
  | 'tent'
  | 'bridge'
  | 'dock'
  | 'boat'
  | 'tower'
  | 'columns'
  | 'table'
  | 'bench'
  | 'pen'
  | 'bed'
  | 'cliff'
  | 'festoon'
  | 'terrace'
  | 'fence'
  | 'gate'
  | 'pool'
  | 'stones'
  | 'cart'
  | 'rug';

export type Structure = {
  type: StructureType;
  x: number;
  z: number;
  rot?: number;
  w?: number;
  d?: number;
  h?: number;
  color?: string;
  accent?: string;
  /** For walls, fences, bridges, festoons: the far end. */
  to?: [number, number];
  /** Shown only while this returns true (gates that open, bridges that appear). */
  show?: string;
  hide?: string;
  y?: number;
  n?: number;
};

const mats = new Map<string, THREE.Material>();
export function M(color: string, o: { rough?: number; map?: 'planks' | 'planks2' | 'stone'; emissive?: string; ei?: number; metal?: number; side?: THREE.Side } = {}) {
  const key = `${color}|${o.rough}|${o.map}|${o.emissive}|${o.ei}|${o.metal}|${o.side}`;
  let m = mats.get(key);
  if (!m) {
    const map = o.map === 'planks' ? planksTexture(0) : o.map === 'planks2' ? planksTexture(2) : o.map === 'stone' ? stoneTexture() : undefined;
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.rough ?? 0.85,
      metalness: o.metal ?? 0,
      ...(map ? { map } : {}),
      ...(o.emissive ? { emissive: o.emissive, emissiveIntensity: o.ei ?? 2 } : {}),
      ...(o.side ? { side: o.side } : {}),
    });
    mats.set(key, m);
  }
  return m;
}

const WOOD = '#8a5a34';
const DARK = '#5a3a22';
const PLASTER = '#ecd8b6';
const STONE = '#d6c4a2';

/** Blocks, floors and clear zones a structure needs; registered before scenery is placed. */
export function footprint(s: Structure, t: Terrain, isOn: (id?: string) => boolean) {
  const rot = s.rot ?? 0;
  const w = s.w ?? 6;
  const d = s.d ?? 5;
  const keep = (r: number) => t.keepClear.push({ x: s.x, z: s.z, r });
  const block = (hx: number, hz: number, active?: () => boolean) => t.blocks.push({ x: s.x, z: s.z, hx, hz, rot, active });
  switch (s.type) {
    case 'house':
    case 'dome':
    case 'tower':
    case 'cliff':
      block(w / 2, d / 2);
      keep(Math.max(w, d) * 0.7);
      break;
    case 'stall':
    case 'table':
    case 'tent':
    case 'well':
    case 'cart':
      block(w * 0.42, d * 0.42);
      keep(Math.max(w, d) * 0.7);
      break;
    case 'arch':
      // Two pillars; walk between them.
      for (const sd of [-1, 1]) t.obstacles.push({ x: s.x + Math.cos(rot) * sd * (w / 2), z: s.z - Math.sin(rot) * sd * (w / 2), r: 0.6 });
      keep(w * 0.6);
      break;
    case 'wall':
    case 'fence': {
      const [x1, z1] = s.to ?? [s.x + 4, s.z];
      const len = Math.hypot(x1 - s.x, z1 - s.z);
      const a = Math.atan2(-(z1 - s.z), x1 - s.x);
      t.blocks.push({ x: (s.x + x1) / 2, z: (s.z + z1) / 2, hx: len / 2, hz: 0.3, rot: a });
      for (let i = 0; i <= Math.ceil(len / 3); i++) t.keepClear.push({ x: s.x + ((x1 - s.x) * i) / Math.ceil(len / 3), z: s.z + ((z1 - s.z) * i) / Math.ceil(len / 3), r: 1.2 });
      break;
    }
    case 'gate':
      block(w / 2, 0.4, () => !isOn(s.hide));
      keep(w * 0.6);
      break;
    case 'bridge':
    case 'dock': {
      const [x1, z1] = s.to ?? [s.x + 8, s.z];
      const len = Math.hypot(x1 - s.x, z1 - s.z);
      const a = Math.atan2(-(z1 - s.z), x1 - s.x);
      const cx = (s.x + x1) / 2;
      const cz = (s.z + z1) / 2;
      const top = s.y ?? Math.max(t.y(s.x, s.z), t.y(x1, z1), t.water ?? -99) + 0.35;
      const ww = (s.w ?? 2.6) / 2;
      const on = () => (s.show ? isOn(s.show) : true);
      const y0 = t.y(s.x, s.z) + 0.1;
      const y1 = t.y(x1, z1) + 0.1;
      t.floors.push({
        x0: cx - len / 2 - 0.3,
        x1: cx + len / 2 + 0.3,
        z0: cz - ww,
        z1: cz + ww,
        rot: a,
        cx,
        cz,
        y: (x, z) => {
          if (!on()) return -99;
          if (s.type === 'dock') return top;
          // A gentle hump: ends meet the banks, the middle rises.
          const k = Math.min(1, Math.max(0, ((x - s.x) * (x1 - s.x) + (z - s.z) * (z1 - s.z)) / (len * len)));
          return Math.max(y0 + (y1 - y0) * k, top + Math.sin(k * Math.PI) * 0.6 - (1 - Math.sin(k * Math.PI)) * 0.2);
        },
      });
      break;
    }
    case 'terrace':
      t.floors.push({ x0: s.x - w / 2, x1: s.x + w / 2, z0: s.z - d / 2, z1: s.z + d / 2, y: s.y ?? t.y(s.x, s.z) + (s.h ?? 0.4) });
      keep(Math.max(w, d) * 0.6);
      break;
    case 'pen':
      keep((s.w ?? 6) * 0.6);
      break;
    case 'bed':
    case 'pool':
    case 'stones':
    case 'rug':
    case 'columns':
    case 'bench':
    case 'boat':
    case 'festoon':
      keep(Math.max(w, d) * 0.55);
      break;
  }
}

/* ------------------------------- pieces ------------------------------- */

function Beams({ w, d, y, n }: { w: number; d: number; y: number; n: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => -w / 2 + ((i + 0.5) * w) / n).map((x) => (
        <mesh key={x} material={M(DARK)} position={[x, y, d / 2 + 0.15]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.09, 0.09, 0.5, 6]} />
        </mesh>
      ))}
    </>
  );
}

function Window({ x, y, z, ry = 0, shutter = '#3f7f8a' }: { x: number; y: number; z: number; ry?: number; shutter?: string }) {
  return (
    <group position={[x, y, z]} rotation-y={ry}>
      <mesh material={M('#2a1a10')}>
        <boxGeometry args={[0.7, 0.9, 0.08]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M(shutter)} position={[s * 0.58, 0, 0.06]} rotation-y={s * 0.5}>
          <boxGeometry args={[0.36, 0.92, 0.05]} />
        </mesh>
      ))}
      <mesh material={M(WOOD)} position={[0, -0.52, 0.1]}>
        <boxGeometry args={[0.9, 0.08, 0.2]} />
      </mesh>
    </group>
  );
}

function House({ s }: { s: Structure }) {
  const w = s.w ?? 6;
  const d = s.d ?? 5;
  const h = s.h ?? 3.4;
  const wall = M(s.color ?? PLASTER, { rough: 0.95 });
  const acc = s.accent ?? '#3f7f8a';
  return (
    <group>
      <mesh material={M('#b8a080', { map: 'stone' })} position-y={0.2} castShadow receiveShadow>
        <boxGeometry args={[w + 0.3, 0.4, d + 0.3]} />
      </mesh>
      <mesh material={wall} position-y={h / 2 + 0.3} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {/* Parapet with soft crenellation. */}
      <mesh material={wall} position-y={h + 0.45} castShadow>
        <boxGeometry args={[w + 0.15, 0.35, d + 0.15]} />
      </mesh>
      <mesh material={M('#d8c0a0', { rough: 1 })} position-y={h + 0.5}>
        <boxGeometry args={[w - 0.5, 0.3, d - 0.5]} />
      </mesh>
      <Beams w={w} d={d} y={h} n={Math.round(w / 1.2)} />
      {/* Door with an arched top and a step. */}
      <group position={[0, 0.3, d / 2 + 0.01]}>
        <mesh material={M(WOOD, { map: 'planks' })} position-y={1.0}>
          <boxGeometry args={[1.1, 2.0, 0.1]} />
        </mesh>
        <mesh material={M(WOOD, { map: 'planks' })} position-y={2.0} rotation-z={Math.PI / 2} rotation-y={Math.PI / 2}>
          <cylinderGeometry args={[0.55, 0.55, 0.1, 16, 1, false, 0, Math.PI]} />
        </mesh>
        <mesh material={M('#c8a870')} position={[0.35, 1.0, 0.08]}>
          <sphereGeometry args={[0.05, 8, 6]} />
        </mesh>
        <mesh material={M('#b8a080', { map: 'stone' })} position={[0, -0.1, 0.35]}>
          <boxGeometry args={[1.6, 0.2, 0.6]} />
        </mesh>
      </group>
      <Window x={-w / 2 + 1.1} y={h * 0.62 + 0.3} z={d / 2 + 0.02} shutter={acc} />
      {w > 4.5 && <Window x={w / 2 - 1.1} y={h * 0.62 + 0.3} z={d / 2 + 0.02} shutter={acc} />}
      <Window x={w / 2 + 0.02} y={h * 0.62 + 0.3} z={0} ry={Math.PI / 2} shutter={acc} />
      {/* A cloth awning over the door. */}
      <group position={[0, h * 0.78 + 0.3, d / 2 + 0.6]} rotation-x={0.35}>
        <mesh material={M(s.accent ?? '#c8644a', { side: THREE.DoubleSide })}>
          <boxGeometry args={[2.2, 0.05, 1.2]} />
        </mesh>
      </group>
      {[-1, 1].map((sd) => (
        <mesh key={sd} material={M(DARK)} position={[sd * 1.05, (h * 0.78 + 0.3) / 2, d / 2 + 1.1]}>
          <cylinderGeometry args={[0.05, 0.05, h * 0.78 + 0.3, 6]} />
        </mesh>
      ))}
      {/* Pots by the door. */}
      {[-1.6, 1.7].map((x) => (
        <mesh key={x} material={M('#c27a48')} position={[x, 0.65, d / 2 + 0.5]} castShadow>
          <sphereGeometry args={[0.32, 12, 10]} />
        </mesh>
      ))}
    </group>
  );
}

function Dome({ s }: { s: Structure }) {
  const w = s.w ?? 7;
  const h = s.h ?? 4;
  const wall = M(s.color ?? '#f1e2c4', { rough: 0.95 });
  const dome = M(s.accent ?? '#5f9aa0', { rough: 0.6 });
  return (
    <group>
      <mesh material={M('#b8a080', { map: 'stone' })} position-y={0.25} receiveShadow castShadow>
        <boxGeometry args={[w + 1.2, 0.5, w + 1.2]} />
      </mesh>
      <mesh material={wall} position-y={h / 2 + 0.5} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
      </mesh>
      <mesh material={wall} position-y={h + 0.8} castShadow>
        <cylinderGeometry args={[w * 0.38, w * 0.42, 0.7, 24]} />
      </mesh>
      <mesh material={dome} position-y={h + 1.1} castShadow>
        <sphereGeometry args={[w * 0.38, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={M('#d8b060', { metal: 0.5, rough: 0.35 })} position-y={h + 1.15 + w * 0.38}>
        <sphereGeometry args={[0.18, 10, 8]} />
      </mesh>
      {/* Arched doorway on each side, and arched windows. */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} rotation-y={(i * Math.PI) / 2}>
          <group position={[0, 0.5, w / 2 + 0.02]}>
            <mesh material={M(i === 0 ? WOOD : '#3a2a1c', i === 0 ? { map: 'planks' } : {})} position-y={1.1}>
              <boxGeometry args={[1.5, 2.2, 0.1]} />
            </mesh>
            <mesh material={M(i === 0 ? WOOD : '#3a2a1c')} position-y={2.2} rotation-z={Math.PI / 2} rotation-y={Math.PI / 2}>
              <cylinderGeometry args={[0.75, 0.75, 0.1, 16, 1, false, 0, Math.PI]} />
            </mesh>
            <mesh material={M('#c9a76a', { map: 'stone' })} position={[0, 2.25, 0.05]}>
              <torusGeometry args={[0.92, 0.12, 6, 20, Math.PI]} />
            </mesh>
          </group>
          {[-1, 1].map((sd) => (
            <group key={sd} position={[sd * w * 0.32, h * 0.62 + 0.5, w / 2 + 0.02]}>
              <mesh material={M('#2a1a10')}>
                <boxGeometry args={[0.6, 1.0, 0.06]} />
              </mesh>
              <mesh material={M('#2a1a10')} position-y={0.5} rotation-z={Math.PI / 2} rotation-y={Math.PI / 2}>
                <cylinderGeometry args={[0.3, 0.3, 0.06, 12, 1, false, 0, Math.PI]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* Carved band under the roofline. */}
      <mesh material={M('#c9a76a', { map: 'stone' })} position-y={h + 0.45}>
        <boxGeometry args={[w + 0.25, 0.25, w + 0.25]} />
      </mesh>
    </group>
  );
}

function ArchGate({ s }: { s: Structure }) {
  const w = s.w ?? 4;
  const h = s.h ?? 4;
  const stone = M(s.color ?? STONE, { map: 'stone' });
  return (
    <group>
      {[-1, 1].map((sd) => (
        <group key={sd} position-x={(sd * w) / 2}>
          <mesh material={stone} position-y={h / 2} castShadow>
            <boxGeometry args={[0.8, h, 0.8]} />
          </mesh>
          <mesh material={stone} position-y={h + 0.1}>
            <boxGeometry args={[1.0, 0.25, 1.0]} />
          </mesh>
        </group>
      ))}
      <mesh material={stone} position-y={h} castShadow>
        <torusGeometry args={[w / 2, 0.4, 8, 24, Math.PI]} />
      </mesh>
      {s.accent && (
        <mesh material={M(s.accent, { side: THREE.DoubleSide })} position={[0, h + w / 2 - 0.2, 0.42]}>
          <boxGeometry args={[w * 0.5, 0.6, 0.04]} />
        </mesh>
      )}
    </group>
  );
}

function Segment({ s, t, kind }: { s: Structure; t: Terrain; kind: 'wall' | 'fence' }) {
  const [x1, z1] = s.to ?? [s.x + 4, s.z];
  const len = Math.hypot(x1 - s.x, z1 - s.z);
  const a = Math.atan2(-(z1 - s.z), x1 - s.x);
  const n = Math.max(1, Math.round(len / (kind === 'wall' ? 1.4 : 1.8)));
  return (
    <group rotation-y={a}>
      {Array.from({ length: n }, (_, i) => {
        const k = (i + 0.5) / n;
        const wx = s.x + (x1 - s.x) * k;
        const wz = s.z + (z1 - s.z) * k;
        const y = t.y(wx, wz) - t.y(s.x, s.z);
        return kind === 'wall' ? (
          <mesh key={i} material={M(s.color ?? STONE, { map: 'stone' })} position={[k * len, y + (s.h ?? 1.1) / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[len / n + 0.05, (s.h ?? 1.1) * (0.9 + (i % 3) * 0.06), 0.7]} />
          </mesh>
        ) : (
          <group key={i} position={[k * len, y, 0]}>
            <mesh material={M(WOOD)} position-y={0.55} castShadow>
              <cylinderGeometry args={[0.07, 0.08, 1.1, 6]} />
            </mesh>
            {[0.4, 0.85].map((h) => (
              <mesh key={h} material={M(WOOD)} position={[len / n / 2, h, 0]} rotation-z={Math.PI / 2}>
                <cylinderGeometry args={[0.04, 0.04, len / n, 5]} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Stall({ s }: { s: Structure }) {
  const w = s.w ?? 3;
  const d = s.d ?? 2;
  const cloth = M(s.color ?? '#d8664a', { side: THREE.DoubleSide });
  const stripe = M(s.accent ?? '#f2e2c0', { side: THREE.DoubleSide });
  return (
    <group>
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} material={M(WOOD)} position={[(x * w) / 2, 1.2, (z * d) / 2]} castShadow>
            <cylinderGeometry args={[0.07, 0.08, 2.4, 6]} />
          </mesh>
        )),
      )}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} material={i % 2 ? stripe : cloth} position={[-w / 2 + (i + 0.5) * (w / 6), 2.45, 0]} rotation-x={0.12}>
          <boxGeometry args={[w / 6, 0.05, d + 0.5]} />
        </mesh>
      ))}
      <mesh material={M(WOOD, { map: 'planks' })} position-y={0.85} castShadow receiveShadow>
        <boxGeometry args={[w * 0.95, 0.12, d * 0.8]} />
      </mesh>
      <mesh material={M(DARK)} position-y={0.42}>
        <boxGeometry args={[w * 0.9, 0.84, d * 0.6]} />
      </mesh>
      {/* Goods: fruit and jars. */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} material={M(['#e0a030', '#c84030', '#7aa040', '#e8c070', '#a05aa0'][i])} position={[-w / 2 + 0.4 + i * (w - 0.8) / 4, 1.05, 0]} castShadow>
          <sphereGeometry args={[0.22, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function Well({ s }: { s: Structure }) {
  return (
    <group>
      <mesh material={M(STONE, { map: 'stone' })} position-y={0.45} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.1, 0.9, 20, 1, true]} />
      </mesh>
      <mesh material={M(STONE, { map: 'stone' })} position-y={0.92}>
        <torusGeometry args={[1.0, 0.14, 8, 24]} />
      </mesh>
      <mesh material={M('#2a5a66', { rough: 0.2 })} position-y={0.6} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.9, 20]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} material={M(WOOD)} position={[sd * 0.9, 1.6, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 1.6, 6]} />
        </mesh>
      ))}
      <mesh material={M(WOOD)} position-y={2.35} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.09, 0.09, 2.1, 8]} />
      </mesh>
      <mesh material={M('#7a5434')} position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.2, 0.16, 0.3, 10]} />
      </mesh>
      <mesh material={M('#c8a870')} position={[0, 1.95, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.8, 4]} />
      </mesh>
      {s.accent && (
        <mesh material={M(s.accent, { side: THREE.DoubleSide })} position-y={2.7} rotation-y={Math.PI / 4}>
          <coneGeometry args={[1.5, 0.8, 4, 1, true]} />
        </mesh>
      )}
    </group>
  );
}

function Tent({ s }: { s: Structure }) {
  const w = s.w ?? 5;
  const d = s.d ?? 4;
  const h = s.h ?? 2.4;
  const geo = useMemo(() => {
    // A cloth draped over three ridge poles: sagging between them.
    const g = new THREE.PlaneGeometry(w, d + 1.2, 24, 12);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const ridge = Math.cos((y / (d + 1.2)) * Math.PI);
      const sag = 1 - 0.25 * Math.pow(Math.sin(((x / w) * 2 + 1) * Math.PI), 2);
      p.setXYZ(i, x, Math.max(0.3, h * ridge * sag), y);
    }
    g.computeVertexNormals();
    return g;
  }, [w, d, h]);
  const cloth = M(s.color ?? '#6a4a3a', { side: THREE.DoubleSide, rough: 1 });
  return (
    <group>
      <mesh geometry={geo} material={cloth} castShadow receiveShadow />
      {[-w / 2 + 0.2, 0, w / 2 - 0.2].map((x) => (
        <mesh key={x} material={M(WOOD)} position={[x, h / 2, 0]}>
          <cylinderGeometry args={[0.06, 0.07, h, 6]} />
        </mesh>
      ))}
      <mesh material={M(s.accent ?? '#b84a3a', { rough: 1 })} position={[0, 0.03, d / 2 + 0.8]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w * 0.6, 1.6]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} material={M('#c8a870')} position={[sd * (w / 2 + 0.8), h * 0.35, 0]} rotation-z={sd * -0.9}>
          <cylinderGeometry args={[0.015, 0.015, h * 1.2, 4]} />
        </mesh>
      ))}
    </group>
  );
}

function Bridge({ s, t, dock }: { s: Structure; t: Terrain; dock?: boolean }) {
  const [x1, z1] = s.to ?? [s.x + 8, s.z];
  const len = Math.hypot(x1 - s.x, z1 - s.z);
  const a = Math.atan2(-(z1 - s.z), x1 - s.x);
  const w = s.w ?? 2.6;
  const top = s.y ?? Math.max(t.y(s.x, s.z), t.y(x1, z1), t.water ?? -99) + 0.35;
  const y0 = t.y(s.x, s.z) + 0.1;
  const y1 = t.y(x1, z1) + 0.1;
  const n = Math.round(len / 0.5);
  const base = t.y(s.x, s.z);
  return (
    <group rotation-y={a}>
      {Array.from({ length: n }, (_, i) => {
        const k = (i + 0.5) / n;
        const y = dock ? top : Math.max(y0 + (y1 - y0) * k, top + Math.sin(k * Math.PI) * 0.6 - (1 - Math.sin(k * Math.PI)) * 0.2);
        return (
          <mesh key={i} material={M(i % 3 ? WOOD : '#7a4e2e', { map: 'planks' })} position={[k * len, y - base - 0.06, 0]} rotation-z={dock ? 0 : -Math.cos(k * Math.PI) * 0.1} castShadow receiveShadow>
            <boxGeometry args={[0.46, 0.12, w]} />
          </mesh>
        );
      })}
      {Array.from({ length: Math.round(len / 2) + 1 }, (_, i) => {
        const k = i / Math.round(len / 2);
        const y = dock ? top : Math.max(y0 + (y1 - y0) * k, top + Math.sin(k * Math.PI) * 0.6 - (1 - Math.sin(k * Math.PI)) * 0.2);
        return [-1, 1].map((sd) => (
          <group key={`${i}${sd}`} position={[k * len, y - base, (sd * w) / 2]}>
            <mesh material={M(DARK)} position-y={dock ? -0.8 : 0.45}>
              <cylinderGeometry args={[0.09, 0.1, dock ? 2.6 : 1.0, 6]} />
            </mesh>
          </group>
        ));
      })}
      {!dock &&
        [-1, 1].map((sd) => (
          <mesh key={sd} material={M('#c8a870')} position={[len / 2, top - base + 0.95, (sd * w) / 2]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.04, 0.04, len, 5]} />
          </mesh>
        ))}
    </group>
  );
}

export function Boat({ color = '#b0603a', sail = '#f2e8d4', scale = 1 }: { color?: string; sail?: string; scale?: number }) {
  const hull = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    g.scale(0.9, 0.55, 2.2);
    return g;
  }, []);
  return (
    <group scale={scale}>
      <mesh geometry={hull} material={M(color, { map: 'planks', side: THREE.DoubleSide })} position-y={0.4} castShadow />
      <mesh material={M(WOOD, { map: 'planks2' })} position-y={0.32} rotation-x={-Math.PI / 2} scale={[0.85, 2.1, 1]}>
        <circleGeometry args={[0.85, 16]} />
      </mesh>
      <mesh material={M(DARK)} position-y={1.9}>
        <cylinderGeometry args={[0.05, 0.06, 3.2, 6]} />
      </mesh>
      <mesh material={M(sail, { side: THREE.DoubleSide, rough: 1 })} position={[0, 2.0, -0.55]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.0, 2.4]} />
      </mesh>
    </group>
  );
}

function Tower({ s, lit }: { s: Structure; lit: boolean }) {
  const h = s.h ?? 7;
  const light = useRef<THREE.PointLight>(null);
  useFrame((st) => {
    if (light.current) light.current.intensity = lit ? 18 + (motion.reduced ? 0 : Math.sin(st.clock.elapsedTime * 2) * 2) : 0;
  });
  return (
    <group>
      <mesh material={M(s.color ?? STONE, { map: 'stone' })} position-y={h / 2} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.5, h, 16]} />
      </mesh>
      {[0.25, 0.55, 0.85].map((k) => (
        <mesh key={k} material={M('#c9a76a')} position-y={h * k}>
          <torusGeometry args={[1.5 - k * 0.5 + 0.02, 0.08, 6, 20]} />
        </mesh>
      ))}
      <mesh material={M(WOOD)} position-y={h + 0.1}>
        <cylinderGeometry args={[1.3, 1.3, 0.2, 16]} />
      </mesh>
      <mesh material={M(lit ? '#ffe2a0' : '#6a5a48', lit ? { emissive: '#ffb040', ei: 5 } : {})} position-y={h + 0.75}>
        <cylinderGeometry args={[0.5, 0.55, 1.1, 12]} />
      </mesh>
      <mesh material={M(s.accent ?? '#5f9aa0')} position-y={h + 1.6}>
        <coneGeometry args={[0.9, 0.9, 12]} />
      </mesh>
      <pointLight ref={light} position-y={h + 0.8} color="#ffb860" intensity={0} distance={40} decay={1.4} />
    </group>
  );
}

function Columns({ s }: { s: Structure }) {
  const n = s.n ?? 4;
  const w = s.w ?? 8;
  return (
    <group>
      <mesh material={M(STONE, { map: 'stone' })} position-y={0.2} receiveShadow>
        <boxGeometry args={[w + 1, 0.4, 3]} />
      </mesh>
      {Array.from({ length: n }, (_, i) => {
        const h = [3.6, 2.2, 3.6, 1.4, 3.0][i % 5];
        return (
          <group key={i} position-x={-w / 2 + (i * w) / (n - 1)}>
            <mesh material={M(STONE, { map: 'stone' })} position-y={0.4 + h / 2} castShadow>
              <cylinderGeometry args={[0.38, 0.45, h, 14]} />
            </mesh>
            {h > 3 && (
              <mesh material={M(STONE, { map: 'stone' })} position-y={0.5 + h}>
                <boxGeometry args={[1.0, 0.3, 1.0]} />
              </mesh>
            )}
          </group>
        );
      })}
      <mesh material={M(STONE, { map: 'stone' })} position={[w * 0.3, 0.3, 1.6]} rotation={[0.1, 0.4, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.38, 0.4, 2.2, 12]} />
      </mesh>
    </group>
  );
}

function Table({ s }: { s: Structure }) {
  const w = s.w ?? 3;
  return (
    <group>
      <mesh material={M(s.color ?? '#b8463a', { rough: 1 })} position-y={0.02} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w + 2.2, 3.4]} />
      </mesh>
      <mesh material={M(s.accent ?? '#f2dcb0', { rough: 1 })} position-y={0.03} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w + 1.6, 2.8]} />
      </mesh>
      <mesh material={M(WOOD, { map: 'planks' })} position-y={0.45} castShadow receiveShadow>
        <boxGeometry args={[w, 0.1, 1.2]} />
      </mesh>
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} material={M(DARK)} position={[(x * w) / 2.3, 0.2, z * 0.45]}>
            <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
          </mesh>
        )),
      )}
      {[-1, 1].map((sd) => (
        <mesh key={sd} material={M('#c8a46a', { rough: 1 })} position={[0, 0.12, sd * 1.15]} scale={[w / 1.4, 0.25, 0.5]}>
          <sphereGeometry args={[0.7, 14, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function Pen({ s }: { s: Structure }) {
  const r = (s.w ?? 6) / 2;
  const n = 14;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        if (i === 0) return null; // the opening
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation-y={-a}>
            <mesh material={M(WOOD)} position-y={0.55} castShadow>
              <cylinderGeometry args={[0.07, 0.08, 1.1, 6]} />
            </mesh>
            {[0.45, 0.9].map((h) => (
              <mesh key={h} material={M(WOOD)} position={[0, h, (Math.PI * r) / n]} rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.04, 0.04, (2 * Math.PI * r) / n, 5]} />
              </mesh>
            ))}
          </group>
        );
      })}
      <mesh material={M('#c8b070', { rough: 1 })} position-y={0.03} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[r * 0.9, 24]} />
      </mesh>
    </group>
  );
}

function Bed({ s }: { s: Structure }) {
  const w = s.w ?? 3;
  const d = s.d ?? 2;
  return (
    <group>
      <mesh material={M('#6a4a30', { rough: 1 })} position-y={0.12} receiveShadow>
        <boxGeometry args={[w, 0.25, d]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={`a${sd}`} material={M(WOOD, { map: 'planks' })} position={[0, 0.18, (sd * d) / 2]}>
          <boxGeometry args={[w + 0.2, 0.36, 0.14]} />
        </mesh>
      ))}
      {[-1, 1].map((sd) => (
        <mesh key={`b${sd}`} material={M(WOOD, { map: 'planks' })} position={[(sd * w) / 2, 0.18, 0]}>
          <boxGeometry args={[0.14, 0.36, d]} />
        </mesh>
      ))}
    </group>
  );
}

function Cliff({ s }: { s: Structure }) {
  const w = s.w ?? 14;
  const h = s.h ?? 9;
  const d = s.d ?? 6;
  const rock = M(s.color ?? '#c89a72', { map: 'stone' });
  return (
    <group>
      <mesh material={rock} position-y={h / 2} castShadow receiveShadow scale={[w / 2, h / 2, d / 2]}>
        <dodecahedronGeometry args={[1, 1]} />
      </mesh>
      {/* Doorways carved into the face, with lintels: no people, quiet and empty. */}
      {Array.from({ length: s.n ?? 3 }, (_, i) => (
        <group key={i} position={[-w / 3 + (i * (w / 1.5)) / Math.max(1, (s.n ?? 3) - 1), 0.4 + (i % 2) * 2.4, d * 0.42]}>
          <mesh material={M('#3a2418')} position-y={1.2}>
            <boxGeometry args={[1.2, 2.2, 0.4]} />
          </mesh>
          <mesh material={M('#e0b88a', { map: 'stone' })} position={[0, 2.5, 0.12]}>
            <boxGeometry args={[1.9, 0.35, 0.3]} />
          </mesh>
          {[-1, 1].map((sd) => (
            <mesh key={sd} material={M('#e0b88a', { map: 'stone' })} position={[sd * 0.85, 1.2, 0.12]}>
              <boxGeometry args={[0.3, 2.4, 0.3]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Festoon({ s, t }: { s: Structure; t: Terrain }) {
  const [x1, z1] = s.to ?? [s.x + 8, s.z];
  const len = Math.hypot(x1 - s.x, z1 - s.z);
  const a = Math.atan2(-(z1 - s.z), x1 - s.x);
  const h = s.h ?? 3.4;
  const y1 = t.y(x1, z1) - t.y(s.x, s.z);
  const n = Math.round(len / 0.9);
  const colors = ['#ffd27a', '#ff9a6a', '#fff0b0', '#9ad0ff', '#ffb0c8'];
  return (
    <group rotation-y={a}>
      {[0, 1].map((e) => (
        <mesh key={e} material={M(WOOD)} position={[e * len, (e ? y1 : 0) + h / 2, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, h, 6]} />
        </mesh>
      ))}
      {Array.from({ length: n }, (_, i) => {
        const k = (i + 0.5) / n;
        const y = h - 0.15 + y1 * k - Math.sin(k * Math.PI) * 0.7;
        return (
          <mesh key={i} position={[k * len, y, 0]} material={M(colors[i % colors.length], { emissive: colors[i % colors.length], ei: 2.2 })}>
            <sphereGeometry args={[0.09, 8, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}

function Terrace({ s }: { s: Structure }) {
  const w = s.w ?? 6;
  const d = s.d ?? 6;
  const h = s.h ?? 0.4;
  return (
    <group>
      <mesh material={M(s.color ?? STONE, { map: 'stone' })} position-y={h / 2 - 0.3} receiveShadow castShadow>
        <boxGeometry args={[w, h + 0.6, d]} />
      </mesh>
      {s.accent && (
        <mesh material={M(s.accent, { rough: 1 })} position-y={h + 0.01} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[w * 0.7, d * 0.7]} />
        </mesh>
      )}
    </group>
  );
}

function Gate({ s, open }: { s: Structure; open: boolean }) {
  const w = s.w ?? 4;
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const want = open ? 1.5 : 0;
    for (const [g, sd] of [
      [left.current, 1],
      [right.current, -1],
    ] as const)
      if (g) g.rotation.y += (sd * want - g.rotation.y) * Math.min(1, dt * (motion.reduced ? 20 : 2.5));
  });
  return (
    <group>
      {[-1, 1].map((sd) => (
        <mesh key={sd} material={M(STONE, { map: 'stone' })} position={[(sd * (w + 0.8)) / 2, 1.3, 0]} castShadow>
          <boxGeometry args={[0.8, 2.6, 0.8]} />
        </mesh>
      ))}
      {[
        [left, -1],
        [right, 1],
      ].map(([ref, sd]) => (
        <group key={sd as number} ref={ref as React.RefObject<THREE.Group>} position={[((sd as number) * w) / 2, 0, 0]}>
          <mesh material={M(WOOD, { map: 'planks' })} position={[(-(sd as number) * w) / 4, 1.0, 0]} castShadow>
            <boxGeometry args={[w / 2 - 0.05, 1.8, 0.12]} />
          </mesh>
          <mesh material={M(DARK)} position={[(-(sd as number) * w) / 4, 1.0, 0.08]} rotation-z={(sd as number) * 0.7}>
            <boxGeometry args={[w / 2, 0.12, 0.05]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Pool({ s }: { s: Structure }) {
  const r = (s.w ?? 4) / 2;
  return (
    <group>
      <mesh material={M(STONE, { map: 'stone' })} position-y={0.2}>
        <torusGeometry args={[r, 0.28, 8, 28]} />
      </mesh>
      <mesh material={M('#4aa0a8', { rough: 0.15 })} position-y={0.22} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[r, 28]} />
      </mesh>
      <mesh material={M(STONE, { map: 'stone' })} position-y={0.6}>
        <cylinderGeometry args={[0.18, 0.3, 0.8, 10]} />
      </mesh>
    </group>
  );
}

function Stones({ s }: { s: Structure }) {
  const n = s.n ?? 6;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} material={M(STONE, { map: 'stone' })} position={[i * 1.1 - (n * 1.1) / 2, 0.05, Math.sin(i * 1.7) * 0.4]} rotation-y={i} scale={[1, 0.25, 0.8]}>
          <sphereGeometry args={[0.45, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function Cart({ s }: { s: Structure }) {
  return (
    <group>
      <mesh material={M(WOOD, { map: 'planks' })} position-y={0.6} castShadow>
        <boxGeometry args={[2.6, 0.14, 1.3]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh material={M(WOOD, { map: 'planks' })} position={[0, 0.85, sd * 0.62]}>
            <boxGeometry args={[2.6, 0.4, 0.08]} />
          </mesh>
          <mesh material={M(DARK)} position={[0.2, 0.45, sd * 0.75]} rotation-x={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.1, 18]} />
          </mesh>
        </group>
      ))}
      <mesh material={M(WOOD)} position={[-1.9, 0.55, 0]} rotation-z={0.15}>
        <boxGeometry args={[1.4, 0.08, 0.08]} />
      </mesh>
      {s.accent && (
        <mesh material={M(s.accent, { rough: 1 })} position={[0, 0.9, 0]} scale={[1.1, 0.35, 0.5]}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      )}
    </group>
  );
}

function Rug({ s }: { s: Structure }) {
  return (
    <group>
      <mesh material={M(s.color ?? '#9a3a3a', { rough: 1 })} position-y={0.02} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[s.w ?? 3, s.d ?? 2]} />
      </mesh>
      <mesh material={M(s.accent ?? '#e8c070', { rough: 1 })} position-y={0.025} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[(s.w ?? 3) * 0.7, (s.d ?? 2) * 0.6]} />
      </mesh>
    </group>
  );
}

function Bench({ s }: { s: Structure }) {
  const w = s.w ?? 2.4;
  return (
    <group>
      <mesh material={M(WOOD, { map: 'planks' })} position-y={0.45} castShadow>
        <boxGeometry args={[w, 0.1, 0.5]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} material={M(STONE, { map: 'stone' })} position={[(sd * w) / 2.6, 0.2, 0]}>
          <boxGeometry args={[0.3, 0.4, 0.45]} />
        </mesh>
      ))}
    </group>
  );
}

/** Render one structure in place. `isOn` answers whether a named activity is done. */
export function StructureView({ s, t, isOn }: { s: Structure; t: Terrain; isOn: (id?: string) => boolean }) {
  if (s.show && !isOn(s.show)) return null;
  const y = s.type === 'bridge' || s.type === 'dock' || s.type === 'boat' ? t.y(s.x, s.z) : s.y ?? t.y(s.x, s.z);
  const rot = s.type === 'wall' || s.type === 'fence' || s.type === 'bridge' || s.type === 'dock' || s.type === 'festoon' ? 0 : s.rot ?? 0;
  let body: React.ReactNode = null;
  switch (s.type) {
    case 'house':
      body = <House s={s} />;
      break;
    case 'dome':
      body = <Dome s={s} />;
      break;
    case 'arch':
      body = <ArchGate s={s} />;
      break;
    case 'wall':
      body = <Segment s={s} t={t} kind="wall" />;
      break;
    case 'fence':
      body = <Segment s={s} t={t} kind="fence" />;
      break;
    case 'stall':
      body = <Stall s={s} />;
      break;
    case 'well':
      body = <Well s={s} />;
      break;
    case 'tent':
      body = <Tent s={s} />;
      break;
    case 'bridge':
      body = <Bridge s={s} t={t} />;
      break;
    case 'dock':
      body = <Bridge s={s} t={t} dock />;
      break;
    case 'boat':
      return (
        <group position={[s.x, (t.water ?? y) + 0.05, s.z]} rotation-y={rot}>
          <Boat color={s.color} sail={s.accent} />
        </group>
      );
    case 'tower':
      body = <Tower s={s} lit={isOn(s.show ?? s.hide)} />;
      break;
    case 'columns':
      body = <Columns s={s} />;
      break;
    case 'table':
      body = <Table s={s} />;
      break;
    case 'bench':
      body = <Bench s={s} />;
      break;
    case 'pen':
      body = <Pen s={s} />;
      break;
    case 'bed':
      body = <Bed s={s} />;
      break;
    case 'cliff':
      body = <Cliff s={s} />;
      break;
    case 'festoon':
      body = <Festoon s={s} t={t} />;
      break;
    case 'terrace':
      body = <Terrace s={s} />;
      return (
        <group position={[s.x, t.y(s.x, s.z), s.z]} rotation-y={rot}>
          <Terrace s={{ ...s, h: (s.y ?? t.y(s.x, s.z) + (s.h ?? 0.4)) - t.y(s.x, s.z) }} />
        </group>
      );
    case 'gate':
      body = <Gate s={s} open={isOn(s.hide)} />;
      break;
    case 'pool':
      body = <Pool s={s} />;
      break;
    case 'stones':
      body = <Stones s={s} />;
      break;
    case 'cart':
      body = <Cart s={s} />;
      break;
    case 'rug':
      body = <Rug s={s} />;
      break;
  }
  return (
    <group position={[s.x, y, s.z]} rotation-y={rot}>
      {body}
    </group>
  );
}

/* ------------------------------- carried things ------------------------------- */

export type ItemKind = 'grain' | 'hay' | 'water' | 'basket' | 'stone' | 'plank' | 'seedling' | 'bread' | 'fruit' | 'bundle' | 'lamp' | 'cloth' | 'pot' | 'scroll' | 'dates' | 'milk';

export function Item({ kind, color }: { kind: ItemKind; color?: string }) {
  switch (kind) {
    case 'grain':
    case 'hay':
    case 'water':
      return <Supply kind={kind} />;
    case 'basket':
    case 'fruit':
    case 'bread':
    case 'dates':
      return (
        <group>
          <mesh material={M('#c8a060', { rough: 1 })} position-y={0.22} castShadow>
            <cylinderGeometry args={[0.38, 0.28, 0.42, 14, 1, true]} />
          </mesh>
          <mesh material={M('#a07840')} position-y={0.44}>
            <torusGeometry args={[0.38, 0.04, 6, 16]} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh
              key={i}
              material={M(kind === 'bread' ? '#d8a050' : kind === 'dates' ? '#7a3a1a' : color ?? ['#e0a030', '#c84030', '#7aa040'][i % 3])}
              position={[Math.cos(i) * 0.18, 0.45 + (i % 2) * 0.08, Math.sin(i) * 0.18]}
              scale={kind === 'bread' ? [1.4, 0.7, 1] : kind === 'dates' ? [0.6, 1, 0.6] : [1, 1, 1]}
            >
              <sphereGeometry args={[0.12, 8, 6]} />
            </mesh>
          ))}
        </group>
      );
    case 'stone':
      return (
        <mesh material={M(color ?? STONE, { map: 'stone' })} position-y={0.25} castShadow>
          <boxGeometry args={[0.8, 0.5, 0.6]} />
        </mesh>
      );
    case 'plank':
      return (
        <mesh material={M(WOOD, { map: 'planks' })} position-y={0.1} castShadow>
          <boxGeometry args={[2.0, 0.12, 0.4]} />
        </mesh>
      );
    case 'seedling':
      return (
        <group>
          <mesh material={M('#a0603a')} position-y={0.18} castShadow>
            <cylinderGeometry args={[0.22, 0.16, 0.36, 12]} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} material={M('#6aa040')} position={[Math.cos(i * 2.1) * 0.08, 0.5, Math.sin(i * 2.1) * 0.08]} rotation-z={Math.cos(i * 2.1) * 0.6} scale={[0.5, 1, 0.3]}>
              <sphereGeometry args={[0.12, 8, 6]} />
            </mesh>
          ))}
        </group>
      );
    case 'bundle':
    case 'cloth':
      return (
        <mesh material={M(color ?? '#c8644a', { rough: 1 })} position-y={0.25} scale={[1, 0.6, 0.8]} castShadow>
          <sphereGeometry args={[0.4, 12, 10]} />
        </mesh>
      );
    case 'lamp':
      return (
        <group>
          <mesh material={M('#b08a40', { metal: 0.5, rough: 0.4 })} position-y={0.1}>
            <cylinderGeometry args={[0.18, 0.2, 0.2, 10]} />
          </mesh>
          <mesh material={M('#ffe0a0', { emissive: '#ffb050', ei: 3 })} position-y={0.32}>
            <cylinderGeometry args={[0.12, 0.14, 0.26, 10]} />
          </mesh>
        </group>
      );
    case 'pot':
    case 'milk':
      return (
        <mesh material={M(kind === 'milk' ? '#f2ead8' : '#c27a48')} position-y={0.3} castShadow>
          <sphereGeometry args={[0.3, 12, 10]} />
        </mesh>
      );
    case 'scroll':
      return (
        <mesh material={M('#efe0bc')} position-y={0.15} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.6, 10]} />
        </mesh>
      );
  }
  return null;
}
