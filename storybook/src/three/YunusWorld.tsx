// The world of the story of Yunus, built in code: an open sea, a laden ship on
// the horizon, the deep with a great fish, the darkness, and an open shore with
// a gourd vine. Yunus is never shown, in any form. Every shape here is an
// artistic interpretation; the story text says so wherever it matters.
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { seeded } from '@/illustrations/paint';
import type { Env } from './environments';
import { sandTexture, woodTexture } from './textures';

export const SEA_RADIUS = 420;

/** Height of the land: below the sea in the south, open shore and dunes to the north. */
export function terrainHeight(x: number, z: number) {
  const t = THREE.MathUtils.smoothstep(-z, 80, 150);
  const dunes = Math.sin(x * 0.07) * 1.2 + Math.sin(x * 0.023 + z * 0.05) * 2.2 + Math.cos(z * 0.09 + x * 0.01) * 0.8;
  return -3 + t * 9 + t * t * dunes;
}

export const PLACES = {
  ship: new THREE.Vector3(70, 0, -30),
  fish: new THREE.Vector3(0, -12, -28),
  bubbles: new THREE.Vector3(-9, -20, -18),
  shore: new THREE.Vector3(-10, 0, -112),
  gourd: new THREE.Vector3(2, 0, -124),
  path: new THREE.Vector3(18, 0, -138),
  sun: new THREE.Vector3(0, 0, 0), // set from the environment
};
PLACES.shore.y = terrainHeight(PLACES.shore.x, PLACES.shore.z);
PLACES.gourd.y = terrainHeight(PLACES.gourd.x, PLACES.gourd.z);
PLACES.path.y = terrainHeight(PLACES.path.x, PLACES.path.z);

export type Pulses = Record<string, number>;

type WorldProps = {
  env: MutableRefObject<Env>;
  motion: boolean;
  pulses: Pulses;
  active: string[]; // element ids explorable in the current scene
  found: string[];
  onTap: (elementId: string) => void;
};

const tapHandler = (id: string, active: string[], onTap: (id: string) => void) => (e: ThreeEvent<MouseEvent>) => {
  if (e.delta > 8 || !active.includes(id)) return;
  e.stopPropagation();
  onTap(id);
};

/** How long ago (seconds) a pulse was triggered, or Infinity. */
const since = (pulses: Pulses, key: string) => (pulses[key] ? (performance.now() - pulses[key]) / 1000 : Infinity);

// ---------------------------------------------------------------------------

function Sea({ env, motion, pulses, onTapSea }: { env: MutableRefObject<Env>; motion: boolean; pulses: Pulses; onTapSea: (e: ThreeEvent<MouseEvent>) => void }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        fog: true,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uTime: { value: 0 },
            uAmp: { value: 1 },
            uDeep: { value: new THREE.Color('#1f4f63') },
            uShallow: { value: new THREE.Color('#6fa3b0') },
            uSky: { value: new THREE.Color('#f2dcb8') },
            uSunDir: { value: new THREE.Vector3(0, 0.3, -1).normalize() },
            uSunColor: { value: new THREE.Color('#ffe2b0') },
            uUnder: { value: new THREE.Color('#2f6f80') },
          },
        ]),
        vertexShader: `
          uniform float uTime; uniform float uAmp;
          varying vec3 vWorld; varying vec3 vNormal; varying float vR;
          #include <fog_pars_vertex>
          float h(vec2 p){
            return uAmp * (0.35*sin(p.x*0.09 + uTime*0.8) + 0.25*sin(p.y*0.12 - uTime*0.6)
              + 0.12*sin((p.x+p.y)*0.25 + uTime*1.3) + 0.06*sin((p.x-p.y)*0.6 + uTime*1.9));
          }
          void main(){
            vec3 p = position;
            vR = length(p.xz);
            float e = 0.4;
            float hc = h(p.xz);
            vec3 n = normalize(vec3(h(p.xz - vec2(e,0.0)) - h(p.xz + vec2(e,0.0)), 2.0*e, h(p.xz - vec2(0.0,e)) - h(p.xz + vec2(0.0,e))));
            p.y += hc;
            vNormal = normalize(mat3(modelMatrix) * n);
            vec4 wp = modelMatrix * vec4(p,1.0);
            vWorld = wp.xyz;
            vec4 mvPosition = viewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `
          uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uUnder;
          varying vec3 vWorld; varying vec3 vNormal; varying float vR;
          #include <fog_pars_fragment>
          void main(){
            if (vR > ${SEA_RADIUS.toFixed(1)}) discard;
            vec3 V = normalize(cameraPosition - vWorld);
            vec3 N = normalize(vNormal);
            vec3 col;
            if (gl_FrontFacing) {
              float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
              col = mix(uDeep, uShallow, clamp(N.y * 0.6 + 0.2, 0.0, 1.0));
              col = mix(col, uSky, fres * 0.7);
              vec3 R = reflect(-V, N);
              float spec = pow(max(dot(R, normalize(uSunDir)), 0.0), 180.0);
              col += uSunColor * spec * 1.4;
            } else {
              // Seen from below: a bright, rippling ceiling of light.
              float glow = pow(max(dot(-N, V), 0.0), 2.0);
              col = mix(uUnder * 0.6, uUnder * 1.8 + vec3(0.05), glow);
            }
            float edge = smoothstep(${SEA_RADIUS.toFixed(1)}, ${(SEA_RADIUS - 30).toFixed(1)}, vR);
            gl_FragColor = vec4(col, edge);
            #include <fog_fragment>
          }`,
      }),
    [],
  );
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(SEA_RADIUS * 2, SEA_RADIUS * 2, 220, 220);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  useFrame((state) => {
    const e = env.current;
    const u = mat.uniforms;
    if (motion) u.uTime.value = state.clock.elapsedTime;
    const ripple = since(pulses, 'ripple');
    u.uAmp.value = e.waveHeight * (1 + (ripple < 3 ? Math.sin((ripple / 3) * Math.PI) * 1.2 : 0));
    (u.uDeep.value as THREE.Color).copy(e.waterDeep);
    (u.uShallow.value as THREE.Color).copy(e.waterShallow);
    (u.uSky.value as THREE.Color).copy(e.skyHorizon);
    (u.uSunDir.value as THREE.Vector3).copy(e.sunDir);
    (u.uSunColor.value as THREE.Color).copy(e.sunColor).multiplyScalar(e.sunIntensity / 3);
    (u.uUnder.value as THREE.Color).copy(e.underwater);
  });
  return <mesh geometry={geo} material={mat} onClick={onTapSea} />;
}

function Seabed() {
  const sand = useMemo(() => sandTexture(), []);
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(SEA_RADIUS, 96, 0, Math.PI * 2);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const rnd = seeded(12);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.min(-26 + Math.sin(x * 0.05) * 2 + Math.cos(z * 0.04) * 2 + rnd() * 0.6, terrainHeight(x, z) - 0.5));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const rocks = useMemo(() => {
    const rnd = seeded(19);
    return Array.from({ length: 26 }, () => ({
      p: [(rnd() - 0.5) * 120, -25 + rnd() * 1.5, -rnd() * 90 + 20] as [number, number, number],
      s: 1 + rnd() * 3.5,
      r: rnd() * 3,
    }));
  }, []);
  return (
    <group>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial map={sand} color="#9c8a6a" roughness={1} />
      </mesh>
      {rocks.map((r, i) => (
        <mesh key={i} position={r.p} rotation={[r.r, r.r * 2, 0]} scale={[r.s, r.s * 0.6, r.s]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#4c5a5a" roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Sky({ env, opacity }: { env: MutableRefObject<Env>; opacity: MutableRefObject<number> }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uSunDir: { value: new THREE.Vector3(0, 0.2, -1) },
          uSunColor: { value: new THREE.Color() },
          uSun: { value: 1 },
          uOpacity: { value: 0 },
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSun; uniform float uOpacity;
          varying vec3 vDir;
          void main(){
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 col = mix(uHorizon, uTop, pow(max(h, 0.0), 0.55));
            float d = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
            col += uSunColor * (pow(d, 900.0) * 2.0 + pow(d, 12.0) * 0.25) * uSun;
            gl_FragColor = vec4(col, uOpacity);
          }`,
      }),
    [],
  );
  useFrame(() => {
    const e = env.current;
    const u = mat.uniforms;
    (u.uTop.value as THREE.Color).copy(e.skyTop);
    (u.uHorizon.value as THREE.Color).copy(e.skyHorizon);
    (u.uSunDir.value as THREE.Vector3).copy(e.sunDir);
    (u.uSunColor.value as THREE.Color).copy(e.sunColor);
    u.uSun.value = e.sunIntensity / 3;
    u.uOpacity.value = opacity.current;
  });
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[480, 48, 24]} />
    </mesh>
  );
}

/** Far ridges and the open shore with dunes and a path inland. */
function Land() {
  const sand = useMemo(() => sandTexture(), []);
  const terrain = useMemo(() => {
    const g = new THREE.PlaneGeometry(320, 220, 160, 110);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -200);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  const ridges = useMemo(() => {
    const rnd = seeded(23);
    return Array.from({ length: 9 }, (_, i) => ({
      p: [-200 + i * 50 + rnd() * 20, -2, -330 - rnd() * 40] as [number, number, number],
      s: [50 + rnd() * 40, 16 + rnd() * 18, 30 + rnd() * 20] as [number, number, number],
    }));
  }, []);
  const pathStones = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 18; i++) {
      const z = -116 - i * 4;
      const x = 6 + i * 1.6 + Math.sin(i * 0.6) * 2;
      pts.push([x, terrainHeight(x, z) + 0.05, z]);
    }
    return pts;
  }, []);
  return (
    <group>
      <mesh geometry={terrain} receiveShadow castShadow>
        <meshStandardMaterial map={sand} roughness={1} color="#e6cf9f" />
      </mesh>
      {ridges.map((r, i) => (
        <mesh key={i} position={r.p} scale={r.s}>
          <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#9a917c" roughness={1} />
        </mesh>
      ))}
      {pathStones.map((p, i) => (
        <mesh key={i} position={p} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[1.6, 10]} />
          <meshStandardMaterial color="#c7a974" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** A small wooden ship, far out. No people are shown. Its form is an artist's idea. */
function Ship({ motion, pulses, onTap }: { motion: boolean; pulses: Pulses; onTap: (e: ThreeEvent<MouseEvent>) => void }) {
  const wood = useMemo(() => woodTexture(14, '#6a4a32', '#3b2618'), []);
  const ref = useRef<THREE.Group>(null);
  const hull = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-5, 1.6);
    s.quadraticCurveTo(-4.6, -0.6, -2.5, -1.2);
    s.lineTo(2.8, -1.2);
    s.quadraticCurveTo(4.8, -0.6, 5.6, 2.0);
    s.lineTo(-5, 1.6);
    const g = new THREE.ExtrudeGeometry(s, { depth: 2.4, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.6, bevelSegments: 4 });
    g.translate(0, 0, -1.2);
    return g;
  }, []);
  const sail = useMemo(() => {
    const g = new THREE.PlaneGeometry(5.5, 6, 10, 10);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(((p.getX(i) + 2.75) / 5.5) * Math.PI) * 0.8);
    g.computeVertexNormals();
    return g;
  }, []);
  useFrame((state) => {
    if (!ref.current) return;
    const t = motion ? state.clock.elapsedTime : 0;
    const rock = since(pulses, 'bob');
    const extra = rock < 3 ? Math.sin(rock * 5) * (1 - rock / 3) * 0.08 : 0;
    ref.current.position.set(PLACES.ship.x + Math.sin(t * 0.03) * 6, Math.sin(t * 0.9) * 0.25, PLACES.ship.z);
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.03 + extra;
    ref.current.rotation.x = Math.sin(t * 0.55) * 0.02;
  });
  return (
    <group ref={ref} rotation-y={-0.5} onClick={onTap}>
      <mesh geometry={hull} castShadow>
        <meshStandardMaterial map={wood} roughness={0.8} />
      </mesh>
      <mesh position={[0.2, 6, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 9, 8]} />
        <meshStandardMaterial map={wood} roughness={0.8} />
      </mesh>
      <mesh geometry={sail} position={[0.2, 6.2, 0.4]} castShadow>
        <meshStandardMaterial color="#efe3c8" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Bundles and jars as cargo: the Quran calls it a laden ship. */}
      {[-2.5, -1.2, 1.4, 2.7].map((x, i) => (
        <mesh key={i} position={[x, 1.9, (i % 2) * 0.6 - 0.3]} castShadow>
          {i % 2 ? <cylinderGeometry args={[0.4, 0.5, 0.9, 10]} /> : <boxGeometry args={[1, 0.7, 0.9]} />}
          <meshStandardMaterial color={i % 2 ? '#a0603e' : '#8a7550'} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** The great fish: a smooth, dark, unspecific form. Not a documented species. */
function GreatFish({ motion, pulses, onTap }: { motion: boolean; pulses: Pulses; onTap: (e: ThreeEvent<MouseEvent>) => void }) {
  const ref = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const body = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push(new THREE.Vector2(Math.sin(t * Math.PI) * (1 - t * 0.35) * 1.0 + 0.02, (t - 0.5) * 7));
    }
    const g = new THREE.LatheGeometry(pts, 32);
    g.rotateZ(Math.PI / 2);
    g.scale(1, 0.85, 0.7);
    return g;
  }, []);
  const fin = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(-1.2, 1.6, -2.4, 2.2);
    s.quadraticCurveTo(-1.6, 0, -2.4, -2.2);
    s.quadraticCurveTo(-1.2, -1.6, 0, 0);
    return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06 });
  }, []);
  useFrame((state) => {
    if (!ref.current || !tail.current) return;
    const t = motion ? state.clock.elapsedTime : 0;
    const g = since(pulses, 'glide');
    const burst = g < 4 ? Math.sin((g / 4) * Math.PI) : 0;
    const a = t * 0.08 + burst * 0.4;
    ref.current.position.set(PLACES.fish.x + Math.sin(a) * 9, PLACES.fish.y + Math.sin(t * 0.4) * 0.6, PLACES.fish.z + Math.cos(a) * 5);
    ref.current.rotation.y = -a + Math.PI / 2;
    tail.current.rotation.y = Math.sin(t * (1.6 + burst * 3)) * 0.35;
  });
  const mat = <meshStandardMaterial color="#1c3440" roughness={0.55} metalness={0.1} />;
  return (
    <group ref={ref} scale={2.6} onClick={onTap}>
      <mesh geometry={body} castShadow>
        {mat}
      </mesh>
      <group ref={tail} position={[-3.3, 0, 0]}>
        <mesh geometry={fin} position={[0, 0, -0.06]}>
          {mat}
        </mesh>
      </group>
      <mesh geometry={fin} position={[0.4, 0.75, 0]} rotation-z={-1.9} scale={0.45}>
        {mat}
      </mesh>
      <mesh geometry={fin} position={[1.2, -0.45, 0.45]} rotation={[0.6, 0.4, -2.6]} scale={0.3}>
        {mat}
      </mesh>
    </group>
  );
}

function Bubbles({ motion, pulses, onTap }: { motion: boolean; pulses: Pulses; onTap: (e: ThreeEvent<MouseEvent>) => void }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = 60;
  const seeds = useMemo(() => {
    const rnd = seeded(31);
    return Array.from({ length: n }, () => ({ x: (rnd() - 0.5) * 3, z: (rnd() - 0.5) * 3, s: 0.05 + rnd() * 0.18, v: 0.6 + rnd(), o: rnd() * 20 }));
  }, []);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame((state) => {
    if (!ref.current) return;
    const t = motion ? state.clock.elapsedTime : 4;
    const burst = since(pulses, 'bubbles') < 4 ? 3 : 1;
    seeds.forEach((b, i) => {
      const y = ((t * b.v * burst + b.o) % 20) - 0;
      m.makeScale(b.s, b.s, b.s);
      m.setPosition(PLACES.bubbles.x + b.x + Math.sin(t + i) * 0.2, PLACES.bubbles.y + y, PLACES.bubbles.z + b.z);
      ref.current!.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, n]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#cfeef2" transparent opacity={0.45} roughness={0.1} />
      </instancedMesh>
      {/* A generous invisible target so the column is easy to tap. */}
      <mesh position={[PLACES.bubbles.x, PLACES.bubbles.y + 8, PLACES.bubbles.z]} onClick={onTap} visible={false}>
        <cylinderGeometry args={[3, 3, 18, 8]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

/** Soft shafts of light under the surface. */
function LightRays({ env }: { env: MutableRefObject<Env> }) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ color: '#bfe6ea', transparent: true, opacity: 0.06, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    [],
  );
  useFrame(() => {
    mat.opacity = 0.07 * env.current.rays;
  });
  const rays = useMemo(() => {
    const rnd = seeded(41);
    return Array.from({ length: 10 }, () => ({ x: (rnd() - 0.5) * 50, z: -rnd() * 50, r: rnd() }));
  }, []);
  return (
    <group>
      {rays.map((r, i) => (
        <mesh key={i} position={[r.x, -12, r.z]} rotation={[0.15, r.r * 3, 0.1]} material={mat}>
          <planeGeometry args={[3 + r.r * 3, 26]} />
        </mesh>
      ))}
    </group>
  );
}

/** A gourd vine: a curving stem with broad, lobed leaves that grow in turn. */
function GourdVine({ motion, pulses, onTap }: { motion: boolean; pulses: Pulses; onTap: (e: ThreeEvent<MouseEvent>) => void }) {
  const leaves = useRef<THREE.Group>(null);
  const { stem, leafSpots } = useMemo(() => {
    const rnd = seeded(51);
    const base = PLACES.gourd;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 9; i++) {
      const x = base.x - 6 + i * 1.6;
      const z = base.z + Math.sin(i * 0.9) * 1.6;
      pts.push(new THREE.Vector3(x, terrainHeight(x, z) + 0.25 + Math.sin(i) * 0.15, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const stem = new THREE.TubeGeometry(curve, 80, 0.07, 6, false);
    const leafSpots = Array.from({ length: 16 }, (_, i) => {
      const t = (i + 0.5) / 16;
      const p = curve.getPoint(t);
      return { p, r: rnd() * Math.PI * 2, s: 0.8 + rnd() * 0.6, tilt: 0.3 + rnd() * 0.5, t };
    });
    return { stem, leafSpots };
  }, []);
  const leafGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.5, 0.1, 0.9, 0.5, 0.8, 0.9);
    s.bezierCurveTo(0.7, 1.2, 0.3, 1.1, 0.0, 1.4);
    s.bezierCurveTo(-0.3, 1.1, -0.7, 1.2, -0.8, 0.9);
    s.bezierCurveTo(-0.9, 0.5, -0.5, 0.1, 0, 0);
    const g = new THREE.ShapeGeometry(s, 8);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  useFrame(() => {
    if (!leaves.current) return;
    const g = since(pulses, 'grow');
    const p = g < 4 && motion ? Math.min(1, g / 3.5) : 1;
    leaves.current.children.forEach((child, i) => {
      const local = THREE.MathUtils.clamp(p * 1.6 - leafSpots[i].t * 0.6, 0, 1);
      child.scale.setScalar(leafSpots[i].s * (0.05 + 0.95 * local));
    });
  });
  return (
    <group onClick={onTap}>
      <mesh geometry={stem} castShadow>
        <meshStandardMaterial color="#4f6b3c" roughness={0.8} />
      </mesh>
      <group ref={leaves}>
        {leafSpots.map((l, i) => (
          <group key={i} position={l.p} rotation={[l.tilt, l.r, 0]}>
            <mesh geometry={leafGeo} castShadow>
              <meshStandardMaterial color={i % 3 ? '#5f8a4b' : '#4c7340'} roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>
      {leafSpots
        .filter((_, i) => i % 5 === 2)
        .map((l, i) => (
          <mesh key={i} position={[l.p.x + 0.4, l.p.y + 0.35, l.p.z + 0.3]}>
            <sphereGeometry args={[0.16, 8, 6]} />
            <meshStandardMaterial color="#e5c457" roughness={0.6} />
          </mesh>
        ))}
    </group>
  );
}

/** A faint ring that marks something to discover. Subtle, never covering text. */
function Cue({ position, size, visible, found }: { position: THREE.Vector3; size: number; visible: boolean; found: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.visible = visible;
    ref.current.quaternion.copy(state.camera.quaternion);
    const t = (state.clock.elapsedTime % 2.4) / 2.4;
    ref.current.scale.setScalar(size * (found ? 1 : 0.8 + t * 0.5));
    (ref.current.material as THREE.MeshBasicMaterial).opacity = found ? 0.25 : 0.55 * (1 - t);
  });
  return (
    <mesh ref={ref} position={position} renderOrder={5}>
      <ringGeometry args={[0.9, 1, 48]} />
      <meshBasicMaterial color={found ? '#cfe3c4' : '#fff1cf'} transparent depthTest={false} toneMapped={false} />
    </mesh>
  );
}

export function YunusWorld({ env, motion, pulses, active, found, onTap, skyOpacity }: WorldProps & { skyOpacity: MutableRefObject<number> }) {
  const sun = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (sun.current) sun.current.position.copy(env.current.sunDir).multiplyScalar(380);
  });
  const h = (id: string) => tapHandler(id, active, onTap);
  const seaId = active.find((id) => id.endsWith('-sea') || id.endsWith('-waves'));
  const cues: { id: string; pos: THREE.Vector3; size: number }[] = [
    { id: 'yunus-2-ship', pos: PLACES.ship.clone().add(new THREE.Vector3(0, 5, 0)), size: 9 },
    { id: 'yunus-3-fish', pos: PLACES.fish, size: 12 },
    { id: 'yunus-3-deep', pos: PLACES.bubbles.clone().add(new THREE.Vector3(0, 6, 0)), size: 3.5 },
    { id: 'yunus-5-shore', pos: PLACES.shore.clone().add(new THREE.Vector3(0, 1, 0)), size: 3 },
    { id: 'yunus-5-gourd', pos: PLACES.gourd.clone().add(new THREE.Vector3(0, 1.2, 0)), size: 3.5 },
    { id: 'yunus-5-path', pos: PLACES.path.clone().add(new THREE.Vector3(0, 1.5, 0)), size: 3 },
    { id: 'yunus-1-sea', pos: new THREE.Vector3(-8, 0.6, -6), size: 4 },
    { id: 'yunus-2-waves', pos: new THREE.Vector3(6, 0.6, -6), size: 4 },
  ];
  return (
    <group>
      <Sky env={env} opacity={skyOpacity} />
      <mesh ref={sun} onClick={h('yunus-1-sun')}>
        <sphereGeometry args={[14, 16, 12]} />
        <meshBasicMaterial color="#fff2cf" transparent opacity={0} depthWrite={false} />
      </mesh>
      <Sea env={env} motion={motion} pulses={pulses} onTapSea={seaId ? h(seaId) : () => {}} />
      <Seabed />
      <LightRays env={env} />
      <Land />
      <Ship motion={motion} pulses={pulses} onTap={h('yunus-2-ship')} />
      <GreatFish motion={motion} pulses={pulses} onTap={h('yunus-3-fish')} />
      <Bubbles motion={motion} pulses={pulses} onTap={h('yunus-3-deep')} />
      <GourdVine motion={motion} pulses={pulses} onTap={h('yunus-5-gourd')} />
      <mesh position={[PLACES.shore.x, PLACES.shore.y + 0.5, PLACES.shore.z]} onClick={h('yunus-5-shore')} visible={false}>
        <sphereGeometry args={[4, 8, 6]} />
        <meshBasicMaterial />
      </mesh>
      <mesh position={[PLACES.path.x, PLACES.path.y + 0.5, PLACES.path.z]} onClick={h('yunus-5-path')} visible={false}>
        <sphereGeometry args={[4, 8, 6]} />
        <meshBasicMaterial />
      </mesh>
      {cues.map((c) => (
        <Cue key={c.id} position={c.pos} size={c.size} visible={active.includes(c.id)} found={found.includes(c.id)} />
      ))}
    </group>
  );
}
