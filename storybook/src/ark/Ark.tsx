// The ark: a plank-built hull with a raised bow and stern, a long deck house
// with a pitched roof, a ramp that closes as the door, and a hold you can walk
// through, with stalls for the pairs and a store for supplies. Its shape and
// size are an artist's idea for a children's game, not a claim about the real ship.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ARK, RAMP, STALLS, STORE, HOLD_WALLS, groundY, type BeastKind } from './land';
import { planksTexture } from './paint';
import { motion, weather } from './shared';

export const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 999);

export type SupplyKind = 'grain' | 'hay' | 'water';
export const SUPPLY_SPOTS: Record<SupplyKind, { x: number; z: number }> = {
  grain: { x: STORE.x - 1.7, z: STORE.z + 0.9 },
  hay: { x: STORE.x, z: STORE.z + 0.9 },
  water: { x: STORE.x + 1.7, z: STORE.z + 0.9 },
};

const H = 5.6; // rail height above the ark's ground level
const FL = ARK.floor;
const L = ARK.len;
const W = ARK.wid;
const HOUSE = { x: 11.2, z: W / 2 - 0.7, top: 8.1, ridge: 9.9 };

// Stall fences, for the explorer's footing (ark-local boxes).
HOLD_WALLS.push([-13.4, 13.0, -1.0, -0.7], [6.9, 13.0, 0.7, 1.0], [6.8, 7.1, 0.7, 4.6]);

function halfWidth(t: number) {
  return (W / 2) * Math.sqrt(Math.max(0.0, 1 - Math.pow(Math.abs(t), 2.4)));
}

function hullGeometry() {
  const nu = 64;
  const nv = 22;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu;
    const t = u * 2 - 1;
    const x = t * (L / 2);
    const w = Math.max(0.05, halfWidth(t));
    const top = H + 1.6 * Math.pow(Math.abs(t), 3);
    const keel = -0.25 + 1.6 * Math.pow(Math.abs(t), 4);
    for (let j = 0; j <= nv; j++) {
      const th = (j / nv) * Math.PI - Math.PI / 2;
      const sn = Math.sin(th);
      const z = w * Math.sign(sn) * Math.pow(Math.abs(sn), 0.55);
      const y = top - (top - keel) * Math.pow(Math.abs(Math.cos(th)), 1.5);
      pos.push(x, y, z);
      uv.push(u * (L / 3.2), (j / nv) * 4.2);
    }
  }
  const at = (i: number, j: number) => i * (nv + 1) + j;
  const door = (i: number, j: number) => {
    const k = at(i, j) * 3;
    const x = pos[k];
    const y = pos[k + 1];
    const z = pos[k + 2];
    return z > 0 && Math.abs(x) < ARK.door && y > FL - 0.05 && y < FL + 3.3;
  };
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      if (door(i, j) && door(i + 1, j) && door(i, j + 1) && door(i + 1, j + 1)) continue;
      idx.push(at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** The rail along the top of the hull, as a rounded cap. */
function railGeometry(side: 1 | -1) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * 2 - 1;
    pts.push(new THREE.Vector3(t * (L / 2) * 0.995, H + 1.6 * Math.pow(Math.abs(t), 3) + 0.05, side * Math.max(0.05, halfWidth(t))));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.12, 6, false);
}

function deckShape() {
  const s = new THREE.Shape();
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 2 - 1;
    const p = [t * (L / 2) * 0.97, halfWidth(t) * 0.97] as const;
    if (i === 0) s.moveTo(p[0], p[1]);
    else s.lineTo(p[0], p[1]);
  }
  for (let i = n; i >= 0; i--) {
    const t = (i / n) * 2 - 1;
    s.lineTo(t * (L / 2) * 0.97, -halfWidth(t) * 0.97);
  }
  const hole = new THREE.Path();
  hole.moveTo(-HOUSE.x, -HOUSE.z);
  hole.lineTo(HOUSE.x, -HOUSE.z);
  hole.lineTo(HOUSE.x, HOUSE.z);
  hole.lineTo(-HOUSE.x, HOUSE.z);
  hole.lineTo(-HOUSE.x, -HOUSE.z);
  s.holes.push(hole);
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(Math.PI / 2);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3.2, uv.getY(i) / 3.2);
  return g;
}

function roofGeometry() {
  const g = new THREE.BufferGeometry();
  const x = HOUSE.x + 0.6;
  const e = HOUSE.z + 0.55;
  const y0 = HOUSE.top - 0.15;
  const y1 = HOUSE.ridge;
  const v = [
    // two slopes
    -x, y0, e, x, y0, e, x, y1, 0, -x, y0, e, x, y1, 0, -x, y1, 0,
    -x, y0, -e, -x, y1, 0, x, y1, 0, -x, y0, -e, x, y1, 0, x, y0, -e,
  ];
  const uv = [0, 0, 7, 0, 7, 1.6, 0, 0, 7, 1.6, 0, 1.6, 0, 0, 0, 1.6, 7, 1.6, 0, 0, 7, 1.6, 7, 0];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

function gableGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-HOUSE.z, 0);
  s.lineTo(HOUSE.z, 0);
  s.lineTo(0, HOUSE.ridge - HOUSE.top + 0.1);
  s.lineTo(-HOUSE.z, 0);
  const g = new THREE.ShapeGeometry(s);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3);
  return g;
}

function sackGeometry() {
  const g = new THREE.SphereGeometry(0.42, 16, 12);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const k = 1 - Math.max(0, y - 0.15) * 1.6;
    p.setXYZ(i, p.getX(i) * k * 0.95, y * 1.25 + (y > 0.3 ? 0.06 : 0), p.getZ(i) * k * 0.8);
  }
  g.translate(0, 0.45, 0);
  g.computeVertexNormals();
  return g;
}

function jarGeometry() {
  const pts = [
    [0, 0], [0.22, 0.02], [0.34, 0.25], [0.36, 0.5], [0.28, 0.75], [0.15, 0.88], [0.14, 0.98], [0.19, 1.04], [0.0, 1.04],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 20);
}

export function Supply({ kind }: { kind: SupplyKind }) {
  const m = useMemo(
    () => ({
      sack: new THREE.MeshStandardMaterial({ color: '#d8c08e', roughness: 1 }),
      tie: new THREE.MeshStandardMaterial({ color: '#7a5434' }),
      hay: new THREE.MeshStandardMaterial({ color: '#e0c060', roughness: 1 }),
      band: new THREE.MeshStandardMaterial({ color: '#8a6a2a' }),
      jar: new THREE.MeshStandardMaterial({ color: '#c27a48', roughness: 0.7 }),
      jarBand: new THREE.MeshStandardMaterial({ color: '#f0dcb0' }),
    }),
    [],
  );
  const sack = useMemo(sackGeometry, []);
  const jar = useMemo(jarGeometry, []);
  if (kind === 'grain')
    return (
      <group>
        <mesh geometry={sack} material={m.sack} castShadow />
        <mesh material={m.tie} position-y={0.92}>
          <torusGeometry args={[0.1, 0.03, 6, 12]} />
        </mesh>
      </group>
    );
  if (kind === 'hay')
    return (
      <group position-y={0.32}>
        <mesh material={m.hay} castShadow>
          <boxGeometry args={[0.95, 0.62, 0.6]} />
        </mesh>
        {[-0.22, 0.22].map((x) => (
          <mesh key={x} material={m.band} position-x={x} rotation-y={Math.PI / 2}>
            <torusGeometry args={[0.37, 0.022, 4, 4, Math.PI * 2]} />
          </mesh>
        ))}
      </group>
    );
  return (
    <group>
      <mesh geometry={jar} material={m.jar} castShadow />
      <mesh material={m.jarBand} position-y={0.55}>
        <torusGeometry args={[0.355, 0.02, 6, 20]} />
      </mesh>
    </group>
  );
}

function Fence({ from, to, gate, open, mat }: { from: [number, number]; to: [number, number]; gate?: number; open?: boolean; mat: THREE.Material }) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const ang = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const posts = Math.max(2, Math.round(len / 1.6) + 1);
  const gateRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (gateRef.current) gateRef.current.rotation.y += ((open ? -1.4 : 0) - gateRef.current.rotation.y) * Math.min(1, dt * (motion.reduced ? 20 : 3));
  });
  const gx = gate ?? -99;
  return (
    <group position={[from[0], FL, from[1]]} rotation-y={-ang}>
      {Array.from({ length: posts }, (_, i) => {
        const x = (i / (posts - 1)) * len;
        if (Math.abs(x - gx) < 1.0) return null;
        return (
          <mesh key={i} material={mat} position={[x, 0.6, 0]} castShadow>
            <boxGeometry args={[0.16, 1.2, 0.16]} />
          </mesh>
        );
      })}
      {[0.45, 0.95].map((y) =>
        (gate == null ? [[0, len]] : [[0, gx - 1.05], [gx + 1.05, len]]).map(([a, b], k) =>
          b - a > 0.1 ? (
            <mesh key={`${y}${k}`} material={mat} position={[(a + b) / 2, y, 0]}>
              <boxGeometry args={[b - a, 0.12, 0.08]} />
            </mesh>
          ) : null,
        ),
      )}
      {gate != null && (
        <group ref={gateRef} position={[gx - 1.0, 0, 0]}>
          {[0.4, 0.9].map((y) => (
            <mesh key={y} material={mat} position={[1.0, y, 0]}>
              <boxGeometry args={[2.0, 0.12, 0.08]} />
            </mesh>
          ))}
          <mesh material={mat} position={[1.0, 0.65, 0]} rotation-z={0.42}>
            <boxGeometry args={[2.1, 0.1, 0.07]} />
          </mesh>
          <mesh material={mat} position={[0.05, 0.6, 0]}>
            <boxGeometry args={[0.12, 1.15, 0.12]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Lamp({ x, z, mats }: { x: number; z: number; mats: Record<string, THREE.Material> }) {
  return (
    <group position={[x, FL, z]}>
      <mesh material={mats.beam} position-y={1.0} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 2.0, 8]} />
      </mesh>
      <mesh material={mats.brass} position-y={2.06}>
        <coneGeometry args={[0.2, 0.16, 10]} />
      </mesh>
      <mesh material={mats.glow} position-y={1.86}>
        <cylinderGeometry args={[0.13, 0.15, 0.26, 10]} />
      </mesh>
    </group>
  );
}

export function Ark({ boarded, stored, inside }: { boarded: BeastKind[]; stored: SupplyKind[]; inside: boolean }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);
  const ship = useRef<THREE.Group>(null);
  const ramp = useRef<THREE.Group>(null);
  const lights = useRef<THREE.Group>(null);
  const geos = useMemo(
    () => ({ hull: hullGeometry(), railA: railGeometry(1), railB: railGeometry(-1), deck: deckShape(), roof: roofGeometry(), gable: gableGeometry() }),
    [],
  );
  const mats = useMemo(() => {
    const cl = [clip];
    const p0 = planksTexture(0);
    const p1 = planksTexture(1);
    const p2 = planksTexture(2);
    const floorTex = p2.clone();
    floorTex.repeat.set(7, 2.5);
    floorTex.needsUpdate = true;
    const roofTex = planksTexture(3).clone();
    roofTex.needsUpdate = true;
    const mk = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, clippingPlanes: cl, clipShadows: true, ...o });
    return {
      hull: mk({ map: p0, side: THREE.DoubleSide }),
      house: mk({ map: p1, side: THREE.DoubleSide, color: '#e8d8c0' }),
      deck: mk({ map: p2, side: THREE.DoubleSide, color: '#d8c0a0' }),
      roof: mk({ map: roofTex, side: THREE.DoubleSide, color: '#9a6a4a' }),
      floor: mk({ map: floorTex, color: '#d8c0a0' }),
      beam: mk({ color: '#6a4428' }),
      rail: mk({ color: '#7a5032' }),
      dark: mk({ color: '#3a2414' }),
      rope: mk({ color: '#c8a870', roughness: 1 }),
      brass: mk({ color: '#b08a40', metalness: 0.5, roughness: 0.4 }),
      glow: new THREE.MeshStandardMaterial({ color: '#ffd890', emissive: '#ffb050', emissiveIntensity: 3 }),
      hay: mk({ color: '#d8b860', roughness: 1 }),
      window: mk({ color: '#2a1a10' }),
      sign: mk({ color: '#e9d3a6' }),
    };
  }, []);
  const rampLen = useMemo(() => {
    const drop = ARK.ground + FL - groundY(RAMP.x, RAMP.z1);
    return { len: Math.hypot(RAMP.z1 - RAMP.z0, drop), ang: Math.atan2(drop, RAMP.z1 - RAMP.z0) };
  }, []);
  useFrame((st, dt) => {
    const lift = weather.lift;
    if (ship.current) {
      ship.current.position.y = ARK.ground + lift;
      const rock = motion.reduced ? 0 : Math.min(1, lift / 2);
      ship.current.rotation.x = Math.sin(st.clock.elapsedTime * 0.45) * 0.012 * rock;
      ship.current.rotation.z = Math.sin(st.clock.elapsedTime * 0.31) * 0.008 * rock;
    }
    if (ramp.current) ramp.current.rotation.x = rampLen.ang + (-Math.PI / 2 - rampLen.ang) * weather.rampUp;
    // The cutaway: everything above the plane is hidden while you are inside.
    const want = inside ? ARK.ground + FL + lift + 2.7 : 999;
    if (want > 500) clip.constant = clip.constant > 500 ? 999 : clip.constant + dt * 8;
    else clip.constant = clip.constant > 500 ? ARK.ground + FL + lift + 9 : clip.constant;
    if (want < 500) clip.constant += (want - clip.constant) * Math.min(1, dt * (motion.reduced ? 30 : 4));
    if (clip.constant > ARK.ground + 12 + lift && want > 500) clip.constant = 999;
    weather.cut = clip.constant;
    if (lights.current) lights.current.visible = inside || weather.storm > 0.2;
  });

  const stallSign = (k: BeastKind) => STALLS[k];
  return (
    <group position={[ARK.x, 0, ARK.z]}>
      {/* The cradle the ark was built on: it stays on the ground when the ark floats. */}
      <group position-y={ARK.ground}>
        {[-10, -5, 0, 5, 10].map((x) =>
          [-1, 1].map((sd) => (
            <mesh key={`${x}${sd}`} material={mats.beam} position={[x, 1.0, sd * (W / 2 + 0.9)]} rotation-x={sd * 0.55} castShadow>
              <boxGeometry args={[0.28, 2.6, 0.28]} />
            </mesh>
          )),
        )}
        {[-8, 0, 8].map((x) => (
          <mesh key={x} material={mats.beam} position={[x, 0.05, 0]} castShadow>
            <boxGeometry args={[0.6, 0.5, W * 0.6]} />
          </mesh>
        ))}
      </group>
      <group ref={ship} position-y={ARK.ground}>
        <mesh geometry={geos.hull} material={mats.hull} castShadow receiveShadow />
        <mesh geometry={geos.railA} material={mats.rail} castShadow />
        <mesh geometry={geos.railB} material={mats.rail} castShadow />
        {/* Ribs showing on the outside of the planking: rhythm and detail. */}
        {Array.from({ length: 11 }, (_, i) => -12.5 + i * 2.5).map((x) =>
          [-1, 1].map((sd) => {
            const t = (x / L) * 2;
            const w = halfWidth(t);
            return (
              <mesh key={`${x}${sd}`} material={mats.beam} position={[x, H - 1.6, sd * (w + 0.04)]} castShadow>
                <boxGeometry args={[0.22, 3.0, 0.12]} />
              </mesh>
            );
          }),
        )}
        <mesh geometry={geos.deck} material={mats.deck} position-y={H - 0.05} receiveShadow />
        {/* Hold floor. */}
        <mesh material={mats.floor} position={[0, FL - 0.1, 0]} receiveShadow>
          <boxGeometry args={[L - 3.0, 0.2, W - 0.5]} />
        </mesh>
        {/* Deck house walls, with round windows. */}
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh material={mats.house} position={[0, (H + HOUSE.top) / 2, sd * HOUSE.z]} castShadow receiveShadow>
              <boxGeometry args={[HOUSE.x * 2, HOUSE.top - H, 0.2]} />
            </mesh>
            {[-8, -4, 0, 4, 8].map((x) => (
              <group key={x} position={[x, H + 1.3, sd * (HOUSE.z + 0.11)]} rotation-y={sd > 0 ? 0 : Math.PI}>
                <mesh material={mats.window}>
                  <circleGeometry args={[0.42, 18]} />
                </mesh>
                <mesh material={mats.rail} position-z={0.02}>
                  <torusGeometry args={[0.44, 0.07, 6, 20]} />
                </mesh>
              </group>
            ))}
            <mesh material={mats.house} position={[sd * HOUSE.x, (H + HOUSE.top) / 2, 0]} rotation-y={Math.PI / 2} castShadow>
              <boxGeometry args={[HOUSE.z * 2, HOUSE.top - H, 0.2]} />
            </mesh>
            <mesh geometry={geos.gable} material={mats.house} position={[sd * HOUSE.x, HOUSE.top - 0.05, 0]} rotation-y={Math.PI / 2} />
            {/* Corner posts and the beam along the eaves. */}
            {[-1, 1].map((sx) => (
              <mesh key={sx} material={mats.beam} position={[sx * HOUSE.x, (H + HOUSE.top) / 2, sd * HOUSE.z]} castShadow>
                <boxGeometry args={[0.32, HOUSE.top - H + 0.2, 0.32]} />
              </mesh>
            ))}
            <mesh material={mats.beam} position={[0, HOUSE.top, sd * HOUSE.z]}>
              <boxGeometry args={[HOUSE.x * 2 + 0.6, 0.26, 0.3]} />
            </mesh>
          </group>
        ))}
        <mesh geometry={geos.roof} material={mats.roof} castShadow receiveShadow />
        <mesh material={mats.beam} position={[0, HOUSE.ridge + 0.05, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.16, 0.16, HOUSE.x * 2 + 1.4, 8]} />
        </mesh>
        {/* Posts carrying the roof beams, inside the hold. */}
        {[-7.6, -0.4, 6.2].map((x) => (
          <mesh key={x} material={mats.beam} position={[x, (FL + HOUSE.top) / 2, -0.85]} castShadow>
            <boxGeometry args={[0.3, HOUSE.top - FL, 0.3]} />
          </mesh>
        ))}
        {/* Door frame. */}
        <group position={[0, FL, W / 2 - 0.05]}>
          {[-1, 1].map((sd) => (
            <mesh key={sd} material={mats.beam} position={[sd * (ARK.door + 0.12), 1.7, 0]} castShadow>
              <boxGeometry args={[0.3, 3.5, 0.4]} />
            </mesh>
          ))}
          <mesh material={mats.beam} position={[0, 3.45, 0]}>
            <boxGeometry args={[ARK.door * 2 + 0.6, 0.34, 0.42]} />
          </mesh>
        </group>
        {/* The ramp, hinged at the doorway; it swings up to close the door. */}
        <group ref={ramp} position={[0, FL, W / 2 + 0.1]}>
          <mesh material={mats.deck} position={[0, -0.09, rampLen.len / 2]} castShadow receiveShadow>
            <boxGeometry args={[RAMP.half * 2, 0.18, rampLen.len]} />
          </mesh>
          {Array.from({ length: Math.floor(rampLen.len / 0.7) }, (_, i) => (
            <mesh key={i} material={mats.beam} position={[0, 0.03, 0.5 + i * 0.7]}>
              <boxGeometry args={[RAMP.half * 2 - 0.2, 0.07, 0.1]} />
            </mesh>
          ))}
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <mesh material={mats.beam} position={[sd * RAMP.half, 0.0, rampLen.len / 2]}>
                <boxGeometry args={[0.16, 0.3, rampLen.len]} />
              </mesh>
              {[0.25, 0.55, 0.85].map((f) => (
                <mesh key={f} material={mats.beam} position={[sd * RAMP.half, 0.5, rampLen.len * f]}>
                  <boxGeometry args={[0.1, 1.0, 0.1]} />
                </mesh>
              ))}
              <mesh material={mats.rope} position={[sd * RAMP.half, 0.95, rampLen.len * 0.55]} rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.035, 0.035, rampLen.len * 0.62, 6]} />
              </mesh>
            </group>
          ))}
        </group>
        {/* Inside: stalls with gates, hay, troughs, the store and lamps. */}
        {[[-13.2, -11.7], [-9.3, -5.2], [-2.8, 1.8], [4.2, 8.3], [10.7, 12.9]].map(([a, b]) => (
          <Fence key={a} from={[a, -0.85]} to={[b, -0.85]} mat={mats.beam} />
        ))}
        {(['giraffe', 'elephant', 'horse', 'camel'] as BeastKind[]).map((k) => (
          <Fence key={k} from={[stallSign(k).x - 1.2, -0.84]} to={[stallSign(k).x + 1.2, -0.84]} gate={1.2} open={!boarded.includes(k)} mat={mats.rail} />
        ))}
        <Fence from={[7.0, 0.85]} to={[12.9, 0.85]} gate={2.5} open={!boarded.includes('sheep')} mat={mats.beam} />
        <Fence from={[7.0, 0.85]} to={[7.0, 4.3]} mat={mats.beam} />
        {(Object.keys(STALLS) as BeastKind[]).map((k) => (
          <group key={k} position={[STALLS[k].x, FL, STALLS[k].z + (STALLS[k].z < 0 ? -1.0 : 1.0)]}>
            <mesh material={mats.hay} position={[1.2, 0.08, 0]} scale={[1.4, 0.25, 0.8]}>
              <sphereGeometry args={[0.6, 12, 8]} />
            </mesh>
            <mesh material={mats.beam} position={[-1.4, 0.3, 0]}>
              <boxGeometry args={[1.2, 0.5, 0.5]} />
            </mesh>
            {boarded.includes(k) && (
              <mesh material={mats.hay} position={[-1.4, 0.55, 0]} scale={[1, 0.3, 0.6]}>
                <sphereGeometry args={[0.4, 10, 8]} />
              </mesh>
            )}
          </group>
        ))}
        {/* Store shelves along the bow end. */}
        <group position={[STORE.x, FL, STORE.z + 1.55]}>
          {[0.9, 1.8].map((y) => (
            <mesh key={y} material={mats.beam} position-y={y}>
              <boxGeometry args={[5.4, 0.1, 0.6]} />
            </mesh>
          ))}
          {[-2.6, 0, 2.6].map((x) => (
            <mesh key={x} material={mats.beam} position={[x, 1.0, 0]}>
              <boxGeometry args={[0.14, 2.0, 0.6]} />
            </mesh>
          ))}
          {/* Spare jars and baskets on the shelves. */}
          {[-2, -1.2, 0.6, 1.6].map((x, i) => (
            <mesh key={x} material={i % 2 ? mats.hay : mats.rope} position={[x, 1.08, 0]} scale={[1, 0.8, 1]}>
              <sphereGeometry args={[0.2, 10, 8]} />
            </mesh>
          ))}
        </group>
        {(Object.keys(SUPPLY_SPOTS) as SupplyKind[]).map((k) =>
          stored.includes(k) ? (
            <group key={k} position={[SUPPLY_SPOTS[k].x, FL, SUPPLY_SPOTS[k].z]}>
              <Supply kind={k} />
            </group>
          ) : null,
        )}
        <Lamp x={-7.6} z={-0.55} mats={mats} />
        <Lamp x={6.2} z={-0.55} mats={mats} />
        <Lamp x={-3} z={3.6} mats={mats} />
        <group ref={lights} visible={false}>
          <pointLight position={[-7.6, FL + 1.9, -0.3]} color="#ffb060" intensity={5} distance={12} decay={1.6} />
          <pointLight position={[6.2, FL + 1.9, -0.3]} color="#ffb060" intensity={5} distance={12} decay={1.6} />
          <pointLight position={[-3, FL + 1.9, 3.3]} color="#ffb060" intensity={4} distance={10} decay={1.6} />
        </group>
        {/* A coil of rope and a little lamp by the door. */}
        <mesh material={mats.rope} position={[3.4, H + 0.15, W / 2 - 0.7]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.35, 0.1, 8, 20]} />
        </mesh>
      </group>
    </group>
  );
}

/** Barrels and crates at the ramp's foot: the shipyard just finished. */
export function Yard() {
  const m = useMemo(
    () => ({
      wood: new THREE.MeshStandardMaterial({ map: planksTexture(1), roughness: 0.9 }),
      band: new THREE.MeshStandardMaterial({ color: '#4a3020' }),
      chip: new THREE.MeshStandardMaterial({ color: '#d8b888', roughness: 1 }),
    }),
    [],
  );
  const spots: [number, number, number, 'barrel' | 'crate' | 'logs'][] = [
    [-5.2, -9.2, 0.3, 'barrel'],
    [-6.0, -8.4, 1.1, 'barrel'],
    [5.4, -9.0, 0.4, 'crate'],
    [6.4, -9.4, 0.9, 'crate'],
    [16.5, -12, 0.2, 'logs'],
    [-17.5, -12, 2.2, 'logs'],
  ];
  return (
    <group>
      {spots.map(([x, z, r, k], i) => {
        const y = groundY(x, z);
        if (k === 'barrel')
          return (
            <group key={i} position={[x, y, z]} rotation-y={r}>
              <mesh material={m.wood} position-y={0.5} castShadow>
                <cylinderGeometry args={[0.38, 0.38, 1.0, 16]} />
              </mesh>
              {[0.2, 0.8].map((h) => (
                <mesh key={h} material={m.band} position-y={h}>
                  <torusGeometry args={[0.39, 0.025, 6, 20]} />
                </mesh>
              ))}
            </group>
          );
        if (k === 'crate')
          return (
            <mesh key={i} material={m.wood} position={[x, y + 0.4, z]} rotation-y={r} castShadow>
              <boxGeometry args={[0.8, 0.8, 0.8]} />
            </mesh>
          );
        return (
          <group key={i} position={[x, y, z]} rotation-y={r}>
            {[[0, 0.25, 0], [0, 0.25, 0.52], [0, 0.25, -0.52], [0, 0.7, 0.26], [0, 0.7, -0.26]].map(([a, b, c], j) => (
              <mesh key={j} material={m.wood} position={[a, b, c]} rotation-z={Math.PI / 2} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 4, 10]} />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* Wood shavings left from the building. */}
      {Array.from({ length: 30 }, (_, i) => {
        const a = i * 2.4;
        const d = 10 + (i % 7);
        const x = Math.cos(a) * d;
        const z = ARK.z + Math.sin(a) * 6;
        return (
          <mesh key={`c${i}`} material={m.chip} position={[x, groundY(x, z) + 0.02, z]} rotation={[-Math.PI / 2, 0, a]}>
            <circleGeometry args={[0.12 + (i % 3) * 0.05, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}
