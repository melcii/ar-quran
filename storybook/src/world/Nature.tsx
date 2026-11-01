// The pieces of a surah's world: ground, water, sky, plants, rocks and drifting
// particles. All shapes are built here; the sky uses three's physical sky model.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Sky as SkyImpl } from 'three/examples/jsm/objects/Sky.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { seeded } from '@/illustrations/paint';
import { canvas, noiseField, toTexture } from '@/three/textures';
import type { Preset } from './settings';
import type { Land } from './terrain';

export const sunVector = (p: Preset) => {
  const [el, az] = p.sun;
  return new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - el), THREE.MathUtils.degToRad(az));
};

export function Sky({ preset }: { preset: Preset }) {
  const sky = useMemo(() => {
    const s = new SkyImpl();
    s.scale.setScalar(4000);
    // The physical sun disc is thousands of times brighter than the screen can
    // show; cap it so bloom gives a soft glow instead of whiting out the view.
    s.material.fragmentShader = s.material.fragmentShader.replace(
      'gl_FragColor = vec4( texColor, 1.0 );',
      'gl_FragColor = vec4( min( texColor * 0.6, vec3( 1.6 ) ), 1.0 );',
    );
    return s;
  }, []);
  useEffect(() => {
    const u = sky.material.uniforms;
    u.turbidity.value = preset.turbidity;
    u.rayleigh.value = preset.rayleigh;
    u.mieCoefficient.value = 0.005;
    u.mieDirectionalG.value = 0.8;
    u.sunPosition.value.copy(sunVector(preset));
  }, [sky, preset]);
  return <primitive object={sky} />;
}

/** A canvas detail map for the ground: speckle, pebbles and fine grain. */
function groundDetail(seed: number) {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#d2d2d2';
  ctx.fillRect(0, 0, 512, 512);
  noiseField(ctx, 512, 512, seed, 0.18, 2.2);
  noiseField(ctx, 512, 512, seed + 1, 0.12, 9, '40,40,40', '255,255,255');
  return toTexture(c, 40);
}

export function Ground({ land, preset, segments }: { land: Land; preset: Preset; segments: number }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(land.size, land.size, segments, segments);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -land.size / 2 + 40);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const a = new THREE.Color(preset.ground[0]);
    const b = new THREE.Color(preset.ground[1]);
    const pathCol = new THREE.Color(preset.ground[0]).lerp(new THREE.Color('#d8c49a'), 0.45);
    const sand = new THREE.Color('#d9c49a');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = land.height(x, z);
      pos.setY(i, y);
      c.copy(a).lerp(b, THREE.MathUtils.clamp((Math.sin(x * 0.11) * Math.cos(z * 0.07) + 1) / 2, 0, 1));
      const d = land.pathDistance(x, z);
      c.lerp(pathCol, 1 - THREE.MathUtils.smoothstep(d, 1.2, 2.6));
      if (land.waterLevel != null) c.lerp(sand, 1 - THREE.MathUtils.smoothstep(y - land.waterLevel, 0.1, 1.2));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [land, preset, segments]);
  const detail = useMemo(() => groundDetail(11), []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors map={detail} roughness={0.96} />
    </mesh>
  );
}

/** Water with moving waves, a sky-tinted fresnel and a sun glint. */
export function Water({ y, size, preset, center = [0, -60] }: { y: number; size: number; preset: Preset; center?: [number, number] }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        fog: true,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uTime: { value: 0 },
            uSun: { value: sunVector(preset) },
            uDeep: { value: new THREE.Color(preset.night ? '#06101c' : '#1d4a5a') },
            uShallow: { value: new THREE.Color(preset.night ? '#16263a' : '#5c9aa4') },
            uSky: { value: new THREE.Color(preset.night ? '#1a2440' : '#cfe0e6') },
          },
        ]),
        vertexShader: `
          varying vec3 vWorld; varying vec3 vView;
          #include <fog_pars_vertex>
          void main(){
            vec4 w = modelMatrix * vec4(position,1.0);
            vWorld = w.xyz;
            vec4 mvPosition = viewMatrix * w;
            vView = cameraPosition - w.xyz;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `
          uniform float uTime; uniform vec3 uSun, uDeep, uShallow, uSky;
          varying vec3 vWorld; varying vec3 vView;
          #include <fog_pars_fragment>
          vec2 wave(vec2 p, vec2 d, float f, float s){ float ph = dot(p,d)*f + uTime*s; return d * cos(ph) * f; }
          void main(){
            vec2 p = vWorld.xz;
            vec2 g = wave(p, normalize(vec2(1.0,0.3)), 0.35, 1.1)*0.18 + wave(p, normalize(vec2(-0.4,1.0)), 0.9, 1.7)*0.08
                   + wave(p, normalize(vec2(0.7,-0.7)), 2.3, 2.6)*0.03 + wave(p, normalize(vec2(-1.0,-0.2)), 5.1, 3.4)*0.012;
            vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
            vec3 v = normalize(vView);
            float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
            vec3 col = mix(uDeep, uShallow, 0.35 + 0.3*n.y);
            col = mix(col, uSky, clamp(fres*0.85, 0.0, 1.0));
            vec3 h = normalize(uSun + v);
            col += vec3(1.0,0.92,0.75) * pow(max(dot(n,h),0.0), 180.0) * 2.2 * step(0.0, uSun.y);
            gl_FragColor = vec4(col, 0.92);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    [preset],
  );
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return (
    <mesh rotation-x={-Math.PI / 2} position={[center[0], y, center[1]]} material={mat}>
      <planeGeometry args={[size, size, 1, 1]} />
    </mesh>
  );
}

type Spot = { x: number; z: number; y: number; s: number; r: number };

/** Scatter points over the land, off the path and above any water. */
export function scatter(land: Land, count: number, seed: number, opts: { minPath?: number; spread?: number; maxSlope?: number } = {}): Spot[] {
  const rnd = seeded(seed);
  const out: Spot[] = [];
  const spread = opts.spread ?? 70;
  let tries = 0;
  while (out.length < count && tries++ < count * 8) {
    const z = 20 - rnd() * (spread * 2.4);
    const x = (rnd() - 0.5) * spread * 2;
    const y = land.height(x, z);
    if (land.pathDistance(x, z) < (opts.minPath ?? 3)) continue;
    if (land.waterLevel != null && y < land.waterLevel + 0.4) continue;
    out.push({ x, z, y, s: 0.75 + rnd() * 0.6, r: rnd() * Math.PI * 2 });
  }
  return out;
}

function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, spots: Spot[], build: (s: Spot, m: THREE.Matrix4, i: number) => void) {
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    spots.forEach((s, i) => {
      build(s, m, i);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, spots, build]);
}

/** Date palms: a curved trunk and a crown of drooping fronds. */
export function Palms({ spots }: { spots: Spot[] }) {
  const trunk = useRef<THREE.InstancedMesh>(null);
  const fronds = useRef<THREE.InstancedMesh>(null);
  const FRONDS = 11;
  const trunkGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.16, 0.26, 7, 8, 12);
    g.translate(0, 3.5, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setX(i, p.getX(i) + Math.pow(y / 7, 2) * 0.9);
      // Ring scars along the trunk
      const k = 1 + 0.06 * Math.sin(y * 9);
      p.setX(i, p.getX(i) * k);
      p.setZ(i, p.getZ(i) * k);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const frondGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.7, 3.2, 1, 8);
    g.translate(0, 1.6, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const t = y / 3.2;
      p.setZ(i, -t * t * 1.6);
      p.setX(i, p.getX(i) * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)));
    }
    g.rotateX(-Math.PI / 2 + 0.5);
    g.computeVertexNormals();
    return g;
  }, []);
  const buildTrunk = useMemo(
    () => (s: Spot, m: THREE.Matrix4) => m.compose(new THREE.Vector3(s.x, s.y - 0.1, s.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.r, 0)), new THREE.Vector3(s.s, s.s, s.s)),
    [],
  );
  useInstances(trunk, spots, buildTrunk);
  useEffect(() => {
    const mesh = fronds.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    spots.forEach((s, i) => {
      const top = new THREE.Vector3(0.9 * s.s, 7 * s.s - 0.1, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.r).add(new THREE.Vector3(s.x, s.y, s.z));
      for (let f = 0; f < FRONDS; f++) {
        q.setFromEuler(new THREE.Euler(0.25 * Math.sin(f * 2.3), s.r + (f / FRONDS) * Math.PI * 2, 0, 'YXZ'));
        m.compose(top, q, new THREE.Vector3(s.s, s.s, s.s));
        mesh.setMatrixAt(i * FRONDS + f, m);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [spots]);
  if (!spots.length) return null;
  return (
    <>
      <instancedMesh ref={trunk} args={[trunkGeo, undefined, spots.length]} castShadow receiveShadow>
        <meshStandardMaterial color="#6f5a40" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={fronds} args={[frondGeo, undefined, spots.length * FRONDS]} castShadow>
        <meshStandardMaterial color="#4f6a2e" roughness={0.8} side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}

/** Broadleaf trees (and olives in grey-green): trunk plus clustered foliage. */
export function Trees({ spots, olive = false }: { spots: Spot[]; olive?: boolean }) {
  const trunk = useRef<THREE.InstancedMesh>(null);
  const crown = useRef<THREE.InstancedMesh>(null);
  const BLOBS = 5;
  const trunkGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.12, olive ? 0.32 : 0.22, olive ? 2.2 : 3.2, 7, 4);
    g.translate(0, olive ? 1.1 : 1.6, 0);
    return g;
  }, [olive]);
  const blobGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const p = g.attributes.position;
    const rnd = seeded(olive ? 71 : 17);
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
      v.multiplyScalar(0.85 + rnd() * 0.3);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, [olive]);
  const buildTrunk = useMemo(
    () => (s: Spot, m: THREE.Matrix4) => m.compose(new THREE.Vector3(s.x, s.y - 0.1, s.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.r, 0)), new THREE.Vector3(s.s, s.s, s.s)),
    [],
  );
  useInstances(trunk, spots, buildTrunk);
  useEffect(() => {
    const mesh = crown.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const rnd = seeded(5);
    spots.forEach((s, i) => {
      for (let b = 0; b < BLOBS; b++) {
        const a = (b / BLOBS) * Math.PI * 2 + s.r;
        const r = b === 0 ? 0 : (olive ? 0.9 : 1.1) * s.s;
        const h = (olive ? 2.4 : 3.6) * s.s + (b === 0 ? 0.7 : rnd() * 0.6);
        const sc = (olive ? 0.95 : 1.3) * s.s * (0.8 + rnd() * 0.4);
        m.compose(new THREE.Vector3(s.x + Math.cos(a) * r, s.y + h, s.z + Math.sin(a) * r), new THREE.Quaternion(), new THREE.Vector3(sc, sc * 0.8, sc));
        mesh.setMatrixAt(i * BLOBS + b, m);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [spots, olive]);
  if (!spots.length) return null;
  return (
    <>
      <instancedMesh ref={trunk} args={[trunkGeo, undefined, spots.length]} castShadow>
        <meshStandardMaterial color={olive ? '#6d6458' : '#5a4632'} roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={crown} args={[blobGeo, undefined, spots.length * BLOBS]} castShadow receiveShadow>
        <meshStandardMaterial color={olive ? '#7d8a68' : '#3f6430'} roughness={0.85} flatShading />
      </instancedMesh>
    </>
  );
}

export function Rocks({ spots }: { spots: Spot[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(1, 1);
    const p = g.attributes.position;
    const rnd = seeded(91);
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.8 + rnd() * 0.4), p.getY(i) * (0.55 + rnd() * 0.3), p.getZ(i) * (0.8 + rnd() * 0.4));
    g.computeVertexNormals();
    return g;
  }, []);
  const build = useMemo(
    () => (s: Spot, m: THREE.Matrix4) =>
      m.compose(new THREE.Vector3(s.x, s.y + 0.1, s.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(s.r * 0.3, s.r, 0)), new THREE.Vector3(s.s * 1.4, s.s * 1.1, s.s * 1.3)),
    [],
  );
  useInstances(ref, spots, build);
  if (!spots.length) return null;
  return (
    <instancedMesh ref={ref} args={[geo, undefined, spots.length]} castShadow receiveShadow>
      <meshStandardMaterial color="#8c8174" roughness={0.9} flatShading />
    </instancedMesh>
  );
}

/** One tuft: seven tapered blades leaning out from a point, dark at the root
 * and sunlit at the tip. Normals point up so blades read as lit from either side. */
function tuftGeometry() {
  const rnd = seeded(5);
  const parts: THREE.BufferGeometry[] = [];
  for (let b = 0; b < 7; b++) {
    const h = 0.38 + rnd() * 0.42;
    const g = new THREE.PlaneGeometry(0.06, h, 1, 3);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) + h / 2) / h;
      p.setX(i, p.getX(i) * (1 - t * 0.95) + t * t * 0.12);
    }
    g.translate(0, h / 2, 0);
    g.rotateZ((rnd() - 0.5) * 0.5);
    g.rotateY(rnd() * Math.PI);
    g.translate((rnd() - 0.5) * 0.18, 0, (rnd() - 0.5) * 0.18);
    parts.push(g);
  }
  const g = mergeGeometries(parts)!;
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  const root = new THREE.Color('#3d5a22');
  const tip = new THREE.Color('#a9c45a');
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    c.copy(root).lerp(tip, Math.min(1, p.getY(i) / 0.6));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return g;
}

/** A flower: a thin green stem and a five-petal head, coloured per instance. */
function flowerGeometry() {
  const stem = new THREE.PlaneGeometry(0.025, 0.36, 1, 2);
  stem.translate(0, 0.18, 0);
  const head = new THREE.CircleGeometry(0.075, 5);
  head.rotateX(-Math.PI / 2 + 0.3);
  head.translate(0, 0.37, 0);
  const centre = new THREE.CircleGeometry(0.025, 8);
  centre.rotateX(-Math.PI / 2 + 0.3);
  centre.translate(0, 0.372, 0.003);
  const paint = (g: THREE.BufferGeometry, hex: string) => {
    const c = new THREE.Color(hex);
    const a = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < a.length; i += 3) a.set([c.r, c.g, c.b], i);
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    g.deleteAttribute('uv');
    return g;
  };
  // Instance colour tints the petals; the stem and centre are darkened to stay green and gold.
  const g = mergeGeometries([paint(stem.toNonIndexed(), '#2f4a1c'), paint(head.toNonIndexed(), '#ffffff'), paint(centre.toNonIndexed(), '#5a4210')])!;
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return g;
}

/** Grass tufts and flowers that sway in the wind (vertex shader). */
export function Grass({ spots, flowers = false }: { spots: Spot[]; flowers?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const time = useRef({ value: 0 });
  const geo = useMemo(() => (flowers ? flowerGeometry() : tuftGeometry()), [flowers]);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = time.current;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vec4 iw = instanceMatrix * vec4(0.0,0.0,0.0,1.0);
           float sway = sin(uTime*1.7 + iw.x*0.35 + iw.z*0.21) * 0.12 * position.y;
           transformed.x += sway; transformed.z += sway*0.5;`,
        );
    };
    return m;
  }, [flowers]);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    const palette = ['#e8c547', '#d9534f', '#f2e6d0', '#b07cc6', '#f0a050'];
    spots.forEach((s, i) => {
      m.compose(new THREE.Vector3(s.x, s.y - 0.03, s.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.r, 0)), new THREE.Vector3(s.s * 1.3, s.s * (flowers ? 1 : 1.2), s.s * 1.3));
      mesh.setMatrixAt(i, m);
      if (flowers) mesh.setColorAt(i, c.set(palette[i % palette.length]));
      else mesh.setColorAt(i, c.set('#ffffff').offsetHSL(0, 0, (s.r / Math.PI - 1) * 0.1));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [spots, flowers]);
  useFrame((s) => (time.current.value = s.clock.elapsedTime));
  if (!spots.length) return null;
  return <instancedMesh ref={ref} args={[geo, mat, spots.length]} receiveShadow />;
}

/** Drifting light motes, fireflies, dust, sand or rain around the viewer. */
export function Particles({ kind, count }: { kind: Preset['particles']; count: number }) {
  const { camera } = useThree();
  const pts = useRef<THREE.Points>(null);
  const mat = useMemo(() => {
    const color = { motes: '#ffe8b0', fireflies: '#d6ff8a', dust: '#e8d6b8', sand: '#e0b880', rain: '#c8d8e8', none: '#ffffff' }[kind];
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: kind === 'rain' || kind === 'dust' || kind === 'sand' ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uKind: { value: ['motes', 'fireflies', 'dust', 'sand', 'rain'].indexOf(kind) } },
      vertexShader: `
        uniform float uTime; uniform float uKind; attribute float aSeed; varying float vA;
        void main(){
          vec3 p = position;
          float t = uTime;
          if (uKind == 4.0) { p.y = mod(p.y - t*14.0*(0.8+aSeed*0.4), 24.0) - 4.0; }
          else if (uKind == 2.0 || uKind == 3.0) { p.x = mod(p.x + t*(uKind==3.0?3.5:1.2)*(0.6+aSeed), 60.0) - 30.0; p.y += sin(t*0.7+aSeed*20.0)*0.4; }
          else { p += vec3(sin(t*0.3+aSeed*30.0), sin(t*0.5+aSeed*17.0)*0.6, cos(t*0.27+aSeed*11.0)) * 0.8; }
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float sz = uKind == 4.0 ? 2.0 : (uKind == 1.0 ? 5.0 : (uKind == 0.0 ? 3.5 : 2.4));
          gl_PointSize = sz * (40.0 / -mv.z);
          vA = uKind == 1.0 ? 0.5 + 0.5*sin(t*2.2 + aSeed*40.0) : (uKind == 4.0 ? 0.45 : 0.7);
        }`,
      fragmentShader: `
        uniform vec3 uColor; varying float vA;
        void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; gl_FragColor = vec4(uColor, vA * smoothstep(0.5, 0.0, d)); }`,
    });
  }, [kind]);
  const geo = useMemo(() => {
    const rnd = seeded(13);
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set([(rnd() - 0.5) * 60, rnd() * (kind === 'rain' ? 24 : 7), (rnd() - 0.5) * 60], i * 3);
      seed[i] = rnd();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count, kind]);
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    // The particle field travels with the viewer.
    if (pts.current) pts.current.position.set(camera.position.x, kind === 'rain' ? camera.position.y - 6 : camera.position.y - 2, camera.position.z);
  });
  if (kind === 'none') return null;
  return <points ref={pts} geometry={geo} material={mat} frustumCulled={false} />;
}

export function Moon({ preset }: { preset: Preset }) {
  const tex = useMemo(() => {
    const [c, ctx] = canvas(256, 256);
    ctx.fillStyle = '#e9e6dc';
    ctx.fillRect(0, 0, 256, 256);
    noiseField(ctx, 256, 256, 3, 0.25, 14, '120,120,130', '255,255,250');
    return toTexture(c);
  }, []);
  const dir = sunVector({ ...preset, sun: [24, preset.sun[1] + 160] });
  return (
    <mesh position={dir.multiplyScalar(900)}>
      <sphereGeometry args={[34, 32, 16]} />
      <meshBasicMaterial map={tex} color="#fffbe8" fog={false} />
    </mesh>
  );
}
