// The Ark valley's scenery: sky, sculpted ground, wind-blown grass and flowers,
// trees with curved trunks and leafy canopies, sculpted rock outcrops, the river,
// the flood water, distant mountains, clouds and birds.
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ARK, PADS, RIVER_HALF, RIVER_Y, START, WORLD_R, fbm, groundColor, groundY, inHull, noise, obstacles, pathDist, rng, riverZ } from './land';
import { barkTexture, brushTexture, cloudTexture, leafTexture, stoneTexture } from './paint';
import { SUN_DIR, motion, player, weather } from './shared';

export type SceneQuality = { grass: number; segments: number; shadows: boolean; shadowMap: number };

const lin = (hex: string) => new THREE.Color(hex);

/* ------------------------------- sky ------------------------------- */

const SKY = {
  zen: [lin('#6f8fd6'), lin('#4c535e')],
  mid: [lin('#b9b2e6'), lin('#6c727a')],
  hor: [lin('#ffd2a6'), lin('#8a8e92')],
};

export function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          sunDir: { value: SUN_DIR },
          storm: { value: 0 },
          zen0: { value: SKY.zen[0] }, zen1: { value: SKY.zen[1] },
          mid0: { value: SKY.mid[0] }, mid1: { value: SKY.mid[1] },
          hor0: { value: SKY.hor[0] }, hor1: { value: SKY.hor[1] },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 sunDir; uniform float storm;
          uniform vec3 zen0, zen1, mid0, mid1, hor0, hor1;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 zen = mix(zen0, zen1, storm), mid = mix(mid0, mid1, storm), hor = mix(hor0, hor1, storm);
            vec3 c = mix(hor, mid, smoothstep(0.0, 0.22, h));
            c = mix(c, zen, smoothstep(0.18, 0.8, h));
            float s = max(dot(d, sunDir), 0.0);
            float clear = 1.0 - storm * 0.9;
            c += vec3(1.0, 0.78, 0.5) * (pow(s, 6.0) * 0.45 + pow(s, 40.0) * 0.6) * clear;
            c += vec3(6.0, 5.0, 3.6) * smoothstep(0.9990, 0.9995, s) * clear;
            c = mix(c, hor * 0.92, smoothstep(0.0, -0.2, h));
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.storm.value = weather.storm;
  });
  return (
    <mesh material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1500, 32, 16]} />
    </mesh>
  );
}

/** Lights, fog and their change as the storm gathers. */
export function Lighting({ q }: { q: SceneQuality }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const scene = useThree((s) => s.scene);
  const fogClear = useMemo(() => lin('#e9c7ae'), []);
  const fogStorm = useMemo(() => lin('#70757b'), []);
  useLayoutEffect(() => {
    scene.fog = new THREE.FogExp2(fogClear.clone(), 0.006);
    return () => {
      scene.fog = null;
    };
  }, [scene, fogClear]);
  useFrame(() => {
    const s = weather.storm;
    const fog = scene.fog as THREE.FogExp2;
    fog.color.copy(fogClear).lerp(fogStorm, s);
    fog.density = 0.006 + s * 0.012;
    if (sun.current) {
      sun.current.intensity = 3.2 * (1 - s * 0.82);
      // Keep the shadow box around the explorer.
      sun.current.position.copy(player.pos).addScaledVector(SUN_DIR, 60);
      sun.current.target.position.copy(player.pos);
      sun.current.target.updateMatrixWorld();
    }
    if (hemi.current) hemi.current.intensity = 1.25 - s * 0.45;
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#c4cdf5', '#6c7a3e', 1.25]} />
      <directionalLight
        ref={sun}
        color="#ffd29a"
        intensity={3.2}
        castShadow={q.shadows}
        shadow-mapSize={[q.shadowMap, q.shadowMap]}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={38}
        shadow-camera-bottom={-38}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={4}
      />
    </>
  );
}

/* ------------------------------- ground ------------------------------- */

/** Soft dark circles under trees and rocks: painted-in contact shade. */
const shade: { x: number; z: number; r: number; k: number }[] = [];

export function Ground({ q, onTap }: { q: SceneQuality; onTap?: (p: THREE.Vector3) => void }) {
  const geo = useMemo(() => {
    const size = 240;
    const seg = q.segments;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      p.setY(i, groundY(x, z));
    }
    g.computeVertexNormals();
    const n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      groundColor(x, z, p.getY(i), 1 - n.getY(i), c);
      let ao = 1;
      for (const s of shade) {
        const d = Math.hypot(x - s.x, z - s.z);
        if (d < s.r) ao *= 1 - s.k * (1 - d / s.r) ** 2;
      }
      col[i * 3] = c.r * ao;
      col[i * 3 + 1] = c.g * ao;
      col[i * 3 + 2] = c.b * ao;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 26, uv.getY(i) * 26);
    return g;
  }, [q.segments]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, map: brushTexture(), roughness: 1, metalness: 0 }), []);
  return (
    <mesh
      geometry={geo}
      material={mat}
      receiveShadow
      name="ground"
      onClick={(e) => {
        if (e.delta > 8 || !onTap) return;
        e.stopPropagation();
        onTap(e.point);
      }}
    />
  );
}

/* ------------------------------- placement ------------------------------- */

type Spot = { x: number; z: number; y: number };

function clearOf(x: number, z: number, room: number) {
  if (pathDist(x, z) < 2.6 + room * 0.4) return false;
  if (inHull(x, z, 3 + room)) return false;
  if (Math.hypot(x, z + 2) < 15 + room) return false;
  if (Math.abs(z - riverZ(x)) < RIVER_HALF + 1.5 + room * 0.3) return false;
  if (Math.hypot(x - START.x, z - START.z) < 4 + room) return false;
  return true;
}

type TreeKind = 'oak' | 'autumn' | 'blossom' | 'pine';
type TreeSpec = { x: number; z: number; kind: TreeKind; size: number; seed: number; solid: boolean };

/** Every tree in the valley, chosen once (deterministic). */
function plantTrees(): TreeSpec[] {
  const r = rng(11);
  const out: TreeSpec[] = [];
  const ok = (x: number, z: number, d: number) => out.every((t) => Math.hypot(t.x - x, t.z - z) > d);
  const add = (x: number, z: number, kind: TreeKind, size: number, solid = true) => {
    if (!clearOf(x, z, size * 2) || !ok(x, z, 5 * size)) return false;
    out.push({ x, z, kind, size, seed: Math.floor(r() * 1e6), solid });
    return true;
  };
  // The great autumn trees, where the giraffes browse.
  for (const [x, z, s] of [[30, 12, 1.5], [44, 20, 1.35], [33, 31, 1.2], [47, 6, 1.1], [24, 24, 1.0]] as const) add(x, z, 'autumn', s);
  // Blossom trees by the river.
  for (const [x, z, s] of [[-26, -30, 1.0], [-16, -36, 0.9], [-36, -22, 1.05], [24, -32, 0.95], [12, -38, 0.85]] as const) add(x, z, 'blossom', s);
  // Round green trees scattered over the meadows.
  let tries = 0;
  while (out.length < 46 && tries++ < 2000) {
    const a = r() * Math.PI * 2;
    const d = 14 + Math.sqrt(r()) * 58;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (fbm(x / 30 + 40, z / 30) < 0.42) continue; // leave open meadows
    add(x, z, r() < 0.12 ? 'autumn' : 'oak', 0.75 + r() * 0.45);
  }
  // A ring of trees on the rim hills, for a full skyline (not reachable).
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + r() * 0.1;
    const d = 84 + r() * 22;
    out.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, kind: r() < 0.25 ? 'pine' : r() < 0.15 ? 'autumn' : 'oak', size: 0.9 + r() * 0.6, seed: Math.floor(r() * 1e6), solid: false });
  }
  return out;
}

type RockSpec = { x: number; z: number; s: number; sy: number; rot: number; v: number };
function placeRocks(): RockSpec[] {
  const r = rng(29);
  const out: RockSpec[] = [];
  const cluster = (cx: number, cz: number, n: number, big: number, spread: number) => {
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - 0.5) * spread;
      const z = cz + (r() - 0.5) * spread;
      if (!clearOf(x, z, 0)) continue;
      const s = big * (0.45 + r() * 0.75);
      out.push({ x, z, s, sy: 0.55 + r() * 0.6, rot: r() * 6.28, v: Math.floor(r() * 4) });
    }
  };
  cluster(-50, 4, 9, 3.6, 16);
  cluster(-44, 22, 5, 2.6, 10);
  cluster(-12, 68, 5, 2.2, 10);
  cluster(18, 70, 4, 2.4, 9);
  cluster(52, -12, 5, 2.8, 12);
  cluster(-58, -30, 6, 3.4, 14);
  cluster(8, -32, 3, 1.4, 8);
  cluster(-20, 30, 3, 1.3, 6);
  for (let i = 0; i < 22; i++) {
    const a = r() * 6.28;
    const d = 66 + r() * 30;
    out.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, s: 3 + r() * 5, sy: 0.6 + r() * 0.8, rot: r() * 6.28, v: Math.floor(r() * 4) });
  }
  for (let i = 0; i < 40; i++) {
    const x = (r() - 0.5) * 140;
    const z = (r() - 0.5) * 140;
    if (Math.hypot(x, z) > WORLD_R - 4 || !clearOf(x, z, 0)) continue;
    out.push({ x, z, s: 0.25 + r() * 0.5, sy: 0.5 + r() * 0.4, rot: r() * 6.28, v: Math.floor(r() * 4) });
  }
  return out;
}

export const TREES = plantTrees();
export const ROCKS = placeRocks();
for (const t of TREES) {
  if (t.solid) obstacles.push({ x: t.x, z: t.z, r: 0.55 * t.size + (t.kind === 'autumn' ? 0.5 : 0.2) });
  shade.push({ x: t.x, z: t.z, r: (t.kind === 'autumn' ? 7 : 4.5) * t.size, k: 0.32 });
}
for (const k of ROCKS) {
  if (k.s > 0.6 && Math.hypot(k.x, k.z) < WORLD_R + 2) obstacles.push({ x: k.x, z: k.z, r: k.s * 0.85 });
  shade.push({ x: k.x, z: k.z, r: k.s * 1.7, k: 0.35 });
}
for (const p of PADS) shade.push({ x: p.x, z: p.z, r: 2.2, k: 0.1 });
shade.push({ x: ARK.x, z: ARK.z, r: 17, k: 0.18 });

/* ------------------------------- wind shader ------------------------------- */

const windUniforms = { uTime: { value: 0 }, uPlayer: { value: new THREE.Vector3() }, uGust: { value: 1 } };

/** Make a material sway in the wind: displacement grows with local height. */
function windy<T extends THREE.Material>(m: T, strength: number, pushable: boolean, noFlip = false) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, windUniforms);
    // Leaf cards: light both faces as if facing outward from the canopy.
    if (noFlip) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0'));
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; uniform vec3 uPlayer; uniform float uGust;')
      .replace(
        '#include <project_vertex>',
        /* glsl */ `
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition = modelMatrix * mvPosition;
        float k = max(position.y, 0.0);
        k = k * k * ${strength.toFixed(3)};
        float w = sin(uTime * 1.6 + mvPosition.x * 0.31 + mvPosition.z * 0.17) * 0.6 + sin(uTime * 3.1 + mvPosition.x * 1.3) * 0.25 + 0.35;
        mvPosition.x += w * k * uGust;
        mvPosition.z += w * k * 0.4 * uGust;
        ${pushable ? `
        vec2 dp = mvPosition.xz - uPlayer.xz;
        float dd = length(dp);
        if (dd < 1.3) { mvPosition.xz += normalize(dp + 1e-4) * (1.3 - dd) * k * 3.0; mvPosition.y -= (1.3 - dd) * k * 1.2; }` : ''}
        mvPosition = viewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`,
      );
  };
  m.customProgramCacheKey = () => `windy${strength}${pushable}${noFlip}`;
  return m;
}

export function Wind() {
  useFrame((st) => {
    windUniforms.uTime.value = motion.reduced ? 0 : st.clock.elapsedTime;
    windUniforms.uGust.value = 1 + weather.storm * 2.2;
    windUniforms.uPlayer.value.copy(player.pos);
  });
  return null;
}

/* ------------------------------- grass ------------------------------- */

function tuftGeometry() {
  const blades: THREE.BufferGeometry[] = [];
  const r = rng(5);
  for (let b = 0; b < 9; b++) {
    const h = 0.38 + r() * 0.32;
    const w = 0.028 + r() * 0.014;
    const segs = 4;
    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const lean = (r() - 0.5) * 0.5;
    const a = r() * Math.PI;
    const ox = (r() - 0.5) * 0.3;
    const oz = (r() - 0.5) * 0.3;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const y = t * h;
      const ww = w * (1 - t * 0.92);
      const bend = lean * t * t;
      for (const s of [-1, 1]) {
        pos.push(ox + Math.cos(a) * ww * s + bend * Math.cos(a + 1.57), y, oz + Math.sin(a) * ww * s + bend * Math.sin(a + 1.57));
        const v = 0.42 + t * 0.62;
        col.push(v, v, v * 0.95);
      }
      if (i < segs) {
        const k = i * 2;
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    blades.push(g);
  }
  const g = mergeGeometries(blades)!;
  const n = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < n.length; i += 3) n[i + 1] = 1;
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}

export function Grass({ q }: { q: SceneQuality }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geo, mat, count, mats, cols } = useMemo(() => {
    const r = rng(77);
    const mats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const target = Math.floor(30000 * q.grass);
    const m = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const c = new THREE.Color();
    let tries = 0;
    while (mats.length < target && tries++ < target * 4) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * (WORLD_R + 14);
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (pathDist(x, z) < 1.4) continue;
      if (inHull(x, z, 0.6)) continue;
      if (Math.abs(z - riverZ(x)) < RIVER_HALF + 1.2) continue;
      if (Math.hypot(x, z + 3) < 6.5 && r() < 0.85) continue;
      const lush = fbm(x / 16 + 2, z / 16 + 9);
      if (r() > 0.55 + (1 - lush) * 0.7) continue;
      const y = groundY(x, z);
      const tall = fbm(x / 9 + 50, z / 9 + 20) > 0.62 ? 1.4 + r() * 0.5 : 1;
      const s = (0.55 + r() * 0.45) * tall;
      quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * Math.PI * 2);
      m.compose(new THREE.Vector3(x, y - 0.03, z), quat, new THREE.Vector3(s, s * (0.8 + r() * 0.5), s));
      mats.push(m.clone());
      groundColor(x, z, y, 0, c);
      c.offsetHSL(0.01 + (r() - 0.5) * 0.03, 0.06, 0.04 + (tall > 1 ? 0.06 : 0));
      if (tall > 1) c.lerp(new THREE.Color('#c9c060'), 0.35);
      cols.push(c.clone());
    }
    const mat = windy(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 0.9, true);
    return { geo: tuftGeometry(), mat, count: mats.length, mats, cols };
  }, [q.grass]);
  useLayoutEffect(() => {
    const im = ref.current!;
    mats.forEach((m, i) => {
      im.setMatrixAt(i, m);
      im.setColorAt(i, cols[i]);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
  }, [mats, cols]);
  return <instancedMesh ref={ref} args={[geo, mat, count]} receiveShadow frustumCulled={false} />;
}

/* ------------------------------- flowers ------------------------------- */

function flowerGeometry() {
  const stem = new THREE.CylinderGeometry(0.008, 0.012, 0.32, 4, 1, true).translate(0, 0.16, 0);
  const sc = new Float32Array(stem.attributes.position.count * 3).fill(0);
  for (let i = 0; i < sc.length; i += 3) {
    sc[i] = 0.25;
    sc[i + 1] = 0.45;
    sc[i + 2] = 0.18;
  }
  stem.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  const petals: THREE.BufferGeometry[] = [stem.toNonIndexed()];
  for (let i = 0; i < 6; i++) {
    const p = new THREE.SphereGeometry(0.045, 6, 4).scale(1, 0.25, 0.5).translate(0, 0, 0.05).rotateY((i / 6) * Math.PI * 2).translate(0, 0.33, 0);
    const c = new Float32Array(p.attributes.position.count * 3).fill(1);
    p.setAttribute('color', new THREE.BufferAttribute(c, 3));
    petals.push(p.toNonIndexed());
  }
  const mid = new THREE.SphereGeometry(0.025, 6, 4).translate(0, 0.34, 0);
  const mc = new Float32Array(mid.attributes.position.count * 3);
  for (let i = 0; i < mc.length; i += 3) {
    mc[i] = 1;
    mc[i + 1] = 0.75;
    mc[i + 2] = 0.2;
  }
  mid.setAttribute('color', new THREE.BufferAttribute(mc, 3));
  petals.push(mid.toNonIndexed());
  for (const g of petals) g.deleteAttribute('uv');
  return mergeGeometries(petals)!;
}

export function Flowers({ q }: { q: SceneQuality }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geo, mat, list } = useMemo(() => {
    const r = rng(303);
    const palette = ['#ffffff', '#fff3a8', '#f7a8c8', '#f0d050', '#c9a0f0', '#ff9a7a'].map((h) => new THREE.Color(h));
    const list: { m: THREE.Matrix4; c: THREE.Color }[] = [];
    const target = Math.floor(2200 * q.grass);
    let tries = 0;
    while (list.length < target && tries++ < target * 8) {
      // Flowers grow in drifts.
      const cx = (r() - 0.5) * 140;
      const cz = (r() - 0.5) * 140;
      if (noise(cx / 14 + 9, cz / 14) < 0.62) continue;
      const pick = palette[Math.floor(noise(cx / 20, cz / 20 + 4) * palette.length * 0.999)];
      for (let k = 0; k < 6; k++) {
        const x = cx + (r() - 0.5) * 3;
        const z = cz + (r() - 0.5) * 3;
        if (Math.hypot(x, z) > WORLD_R + 6 || !clearOf(x, z, -2)) continue;
        const s = 0.8 + r() * 0.7;
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, groundY(x, z) - 0.02, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3)), new THREE.Vector3(s, s, s));
        list.push({ m, c: pick });
      }
    }
    return { geo: flowerGeometry(), mat: windy(new THREE.MeshLambertMaterial({ vertexColors: true }), 1.2, true), list };
  }, [q.grass]);
  useLayoutEffect(() => {
    const im = ref.current!;
    list.forEach((f, i) => {
      im.setMatrixAt(i, f.m);
      im.setColorAt(i, f.c);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }, [list]);
  return <instancedMesh ref={ref} args={[geo, mat, list.length]} frustumCulled={false} />;
}

/* ------------------------------- trees ------------------------------- */

/** A tapered, curving tube along a path of points. */
function limb(points: THREE.Vector3[], r0: number, r1: number, radial = 9, flare = 0) {
  const curve = new THREE.CatmullRomCurve3(points);
  const tub = Math.max(6, points.length * 4);
  const g = new THREE.TubeGeometry(curve, tub, 1, radial, false);
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  const c = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= tub; i++) {
    const t = i / tub;
    curve.getPointAt(t, c);
    let rad = r0 + (r1 - r0) * t;
    if (flare) rad *= 1 + flare * Math.pow(1 - t, 6);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(p, k).sub(c);
      // TubeGeometry is made at radius 1: scale the ring, with a little lumpiness.
      const lump = 1 + 0.08 * Math.sin(j * 2.1 + i * 0.7);
      v.multiplyScalar(rad * lump).add(c);
      p.setXYZ(k, v.x, v.y, v.z);
      uv.setXY(k, (j / radial) * 2, t * 3 * (points[0].distanceTo(points[points.length - 1]) / 3));
    }
  }
  g.computeVertexNormals();
  return g;
}

/** A soft lumpy blob for canopies. */
function blobGeometry(seed: number) {
  const base = new THREE.IcosahedronGeometry(1, 3);
  base.deleteAttribute('normal');
  base.deleteAttribute('uv');
  const g = mergeVertices(base);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const n = 1 + 0.13 * Math.sin(v.x * 4 + seed) * Math.sin(v.z * 3.6 + seed * 2) + 0.07 * Math.sin(v.y * 7 + seed);
    v.multiplyScalar(n);
    p.setXYZ(i, v.x, v.y * 0.82, v.z);
    // Darker underneath and inside: soft self-shade.
    const shadeY = 0.5 + 0.5 * Math.max(-1, Math.min(1, v.y * 1.2 + 0.2));
    const l = 0.62 + shadeY * 0.45;
    col[i * 3] = l;
    col[i * 3 + 1] = l;
    col[i * 3 + 2] = l;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

const CANOPY: Record<TreeKind, string[]> = {
  oak: ['#5e9a3a', '#4f8a34', '#76ad44', '#689f3c'],
  autumn: ['#e0702e', '#d2582a', '#ee9a3c', '#c84a26'],
  blossom: ['#f2a0c0', '#e889b0', '#f8c0d4', '#d878a8'],
  pine: ['#3f6e3a', '#365f34', '#4a7a40', '#3a6838'],
};

type Built = { trunks: THREE.BufferGeometry; blobs: { m: THREE.Matrix4; c: THREE.Color }[]; cards: { m: THREE.Matrix4; c: THREE.Color }[] };

function buildForest(trees: TreeSpec[]): Built {
  const trunks: THREE.BufferGeometry[] = [];
  const blobs: Built['blobs'] = [];
  const cards: Built['cards'] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (const t of trees) {
    const r = rng(t.seed);
    const y0 = groundY(t.x, t.z) - 0.25;
    const s = t.size;
    const pal = CANOPY[t.kind].map((h) => new THREE.Color(h));
    const crown: { p: THREE.Vector3; rad: number }[] = [];
    if (t.kind === 'pine') {
      trunks.push(limb([new THREE.Vector3(t.x, y0, t.z), new THREE.Vector3(t.x, y0 + 9 * s, t.z)], 0.35 * s, 0.1 * s, 7));
      for (let i = 0; i < 4; i++) crown.push({ p: new THREE.Vector3(t.x, y0 + (3 + i * 1.9) * s, t.z), rad: (2.4 - i * 0.5) * s });
    } else {
      const big = t.kind === 'autumn';
      const h = (big ? 6.5 : t.kind === 'blossom' ? 4.2 : 5) * s;
      const lean = new THREE.Vector3(r() - 0.5, 0, r() - 0.5).normalize().multiplyScalar((big ? 1.6 : 0.8) * s);
      const pts = [0, 0.3, 0.62, 1].map((k, i) => new THREE.Vector3(t.x + lean.x * k * k + (i === 2 ? (r() - 0.5) * 0.6 * s : 0), y0 + h * k, t.z + lean.z * k * k));
      const r0 = (big ? 0.75 : 0.36) * s;
      trunks.push(limb(pts, r0, r0 * 0.5, 10, big ? 0.8 : 0.45));
      const top = pts[3];
      const nb = big ? 5 : 3 + Math.floor(r() * 2);
      for (let b = 0; b < nb; b++) {
        const a = (b / nb) * Math.PI * 2 + r() * 0.8;
        const reach = (big ? 4.5 : 2.4) * s * (0.75 + r() * 0.4);
        const start = pts[2].clone().lerp(top, 0.3 + r() * 0.6);
        const end = new THREE.Vector3(start.x + Math.cos(a) * reach, start.y + (big ? 1.2 : 1.6) * s + r() * s, start.z + Math.sin(a) * reach);
        const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, big ? -0.6 * s : 0.3 * s, 0));
        trunks.push(limb([start, mid, end], r0 * (big ? 0.42 : 0.38), r0 * 0.14, 7));
        crown.push({ p: end.clone().add(new THREE.Vector3(0, (big ? 0.7 : 0.6) * s, 0)), rad: (big ? 2.6 : 1.8) * s * (0.8 + r() * 0.3) });
      }
      crown.push({ p: top.clone().add(new THREE.Vector3(0, (big ? 1.6 : 1.4) * s, 0)), rad: (big ? 3.0 : 2.2) * s });
    }
    const blobQ = new THREE.Quaternion();
    // Keep canopies well above head height so the camera can walk beneath.
    for (const c of crown) c.p.y = Math.max(c.p.y, y0 + 3.4 * Math.min(1.2, s) + c.rad * 0.75);
    for (const c of crown) {
      const col = pal[Math.floor(r() * pal.length)].clone();
      blobQ.setFromAxisAngle(up, r() * 6.28);
      blobs.push({ m: new THREE.Matrix4().compose(c.p, blobQ, new THREE.Vector3(c.rad, c.rad, c.rad)), c: col });
      // Leaf cards around the blob give it a leafy edge.
      const nCards = Math.round(c.rad * 11);
      for (let k = 0; k < nCards; k++) {
        const dir = new THREE.Vector3(r() - 0.5, r() * 0.9 - 0.25, r() - 0.5).normalize();
        const at = c.p.clone().addScaledVector(dir, c.rad * (0.98 + r() * 0.16));
        const look = new THREE.Matrix4().lookAt(at, c.p.clone().addScaledVector(dir, -2), up);
        const q = new THREE.Quaternion().setFromRotationMatrix(look);
        q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), r() * 6.28));
        const sc = c.rad * (0.32 + r() * 0.22);
        const lc = pal[Math.floor(r() * pal.length)].clone().multiplyScalar(0.85 + 0.4 * Math.max(0, dir.y + 0.4));
        cards.push({ m: new THREE.Matrix4().compose(at, q, new THREE.Vector3(sc, sc, sc)), c: lc });
      }
    }
  }
  const merged = mergeGeometries(trunks.map((g) => g.toNonIndexed()))!;
  return { trunks: merged, blobs, cards };
}

export function Forest({ q }: { q: SceneQuality }) {
  const blobRef = useRef<THREE.InstancedMesh>(null);
  const cardRef = useRef<THREE.InstancedMesh>(null);
  const built = useMemo(() => buildForest(TREES), []);
  const blobGeo = useMemo(() => blobGeometry(2), []);
  const cardGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    const n = g.attributes.normal;
    for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 0, 1);
    return g;
  }, []);
  const mats = useMemo(() => {
    const bark = barkTexture();
    return {
      trunk: new THREE.MeshStandardMaterial({ map: bark, color: '#c8b8a8', roughness: 0.95 }),
      blob: windy(new THREE.MeshLambertMaterial({ vertexColors: true }), 0.0, false),
      card: windy(new THREE.MeshLambertMaterial({ map: leafTexture(), alphaTest: 0.45, side: THREE.DoubleSide }), 0.02, false, true),
    };
  }, []);
  useLayoutEffect(() => {
    const b = blobRef.current!;
    built.blobs.forEach((x, i) => {
      b.setMatrixAt(i, x.m);
      b.setColorAt(i, x.c);
    });
    const c = cardRef.current!;
    built.cards.forEach((x, i) => {
      c.setMatrixAt(i, x.m);
      c.setColorAt(i, x.c);
    });
    for (const im of [b, c]) {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
    }
  }, [built]);
  return (
    <group>
      <mesh geometry={built.trunks} material={mats.trunk} castShadow={q.shadows} receiveShadow />
      <instancedMesh ref={blobRef} args={[blobGeo, mats.blob, built.blobs.length]} castShadow={q.shadows} receiveShadow />
      <instancedMesh ref={cardRef} args={[cardGeo, mats.card, built.cards.length]} receiveShadow />
    </group>
  );
}

/* ------------------------------- rocks ------------------------------- */

function rockGeometry(seed: number) {
  const base = new THREE.IcosahedronGeometry(1, 2);
  base.deleteAttribute('normal');
  const g = mergeVertices(base, 1e-4);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  const col = new Float32Array(p.count * 3);
  const r = rng(seed);
  // A few flat cuts give sculpted planes without looking like blocks.
  const cuts = Array.from({ length: 5 }, () => ({ n: new THREE.Vector3(r() - 0.5, r() * 0.8, r() - 0.5).normalize(), d: 0.7 + r() * 0.2 }));
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let len = 1 + 0.12 * Math.sin(v.x * 3 + seed) * Math.cos(v.z * 2.6 - seed) + 0.06 * Math.sin(v.y * 6 + seed);
    for (const c of cuts) {
      const dd = v.dot(c.n) * len;
      if (dd > c.d) len *= c.d / dd + (1 - c.d / dd) * 0.25;
    }
    v.multiplyScalar(len);
    if (v.y < -0.3) v.y = -0.3 - (v.y + 0.3) * 0.2;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const up = n.getY(i);
    const moss = Math.max(0, (up - 0.55) * 2.2);
    const base = new THREE.Color('#a4a196').lerp(new THREE.Color('#7f8a5a'), Math.min(1, moss)).multiplyScalar(0.75 + 0.3 * Math.max(0, p.getY(i)));
    col[i * 3] = base.r;
    col[i * 3 + 1] = base.g;
    col[i * 3 + 2] = base.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export function Rocks({ q }: { q: SceneQuality }) {
  const geos = useMemo(() => [1, 2, 3, 4].map(rockGeometry), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, map: stoneTexture(), roughness: 0.92 }), []);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const groups = useMemo(() => [0, 1, 2, 3].map((v) => ROCKS.filter((k) => k.v === v)), []);
  useLayoutEffect(() => {
    groups.forEach((list, v) => {
      const im = refs.current[v];
      if (!im) return;
      list.forEach((k, i) => {
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(k.x, groundY(k.x, k.z) + k.s * k.sy * 0.15, k.z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, k.rot, 0)),
          new THREE.Vector3(k.s, k.s * k.sy, k.s * (0.8 + (i % 3) * 0.15)),
        );
        im.setMatrixAt(i, m);
      });
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
    });
  }, [groups]);
  return (
    <group>
      {groups.map((list, v) => (
        <instancedMesh key={v} ref={(r) => void (refs.current[v] = r)} args={[geos[v], mat, list.length]} castShadow={q.shadows} receiveShadow />
      ))}
    </group>
  );
}

/* ------------------------------- water ------------------------------- */

function waterMaterial(flow: number, alpha: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    fog: true,
    depthWrite: false,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        time: { value: 0 },
        storm: { value: 0 },
        sunDir: { value: SUN_DIR },
        deep: { value: lin('#2f7f8f') },
        shallow: { value: lin('#7cc7b8') },
        foam: { value: lin('#eef6ee') },
        sky: { value: lin('#d8c8e8') },
        murk: { value: lin('#5d6a66') },
        flow: { value: flow },
        alpha: { value: alpha },
      },
    ]),
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      attribute float edge;
      varying vec3 vWorld; varying float vEdge;
      uniform float time; uniform float flow;
      void main() {
        vEdge = edge;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        if (flow < 0.01) wp.y += sin(wp.x * 0.25 + time * 1.3) * 0.12 + sin(wp.z * 0.31 - time * 1.1) * 0.1;
        vWorld = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform float time, storm, flow, alpha;
      uniform vec3 sunDir, deep, shallow, foam, sky, murk;
      varying vec3 vWorld; varying float vEdge;
      float hsh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hsh(i), hsh(i + vec2(1, 0)), f.x), mix(hsh(i + vec2(0, 1)), hsh(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec2 p = vWorld.xz;
        float t = time;
        float r = vn(p * 0.32 + vec2(t * flow, t * 0.05)) * 0.6 + vn(p * 1.05 - vec2(t * flow * 1.7, -t * 0.12)) * 0.4;
        vec3 c = mix(deep, shallow, clamp(vEdge * 0.85 + r * 0.3 - 0.1, 0.0, 1.0));
        c = mix(c, murk, storm * 0.6);
        float lines = smoothstep(0.78, 0.9, vn(vec2(p.x * 0.5 - t * flow * 2.5, p.y * 1.8 + sin(p.x * 0.2))));
        c = mix(c, foam, lines * 0.28);
        c = mix(c, foam, smoothstep(0.78, 1.0, vEdge + r * 0.18) * 0.85);
        vec3 V = normalize(cameraPosition - vWorld);
        vec3 N = normalize(vec3((r - 0.5) * 0.35, 1.0, (vn(p * 0.8 + t * 0.4) - 0.5) * 0.35));
        vec3 R = reflect(-V, N);
        float fres = pow(1.0 - max(V.y, 0.0), 3.0);
        c = mix(c, sky * (1.0 - storm * 0.5), fres * 0.45);
        float s = pow(max(dot(R, sunDir), 0.0), 80.0);
        c += vec3(1.6, 1.3, 0.9) * s * (1.0 - storm);
        gl_FragColor = vec4(c, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

export function River() {
  const geo = useMemo(() => {
    const xs = 120;
    const pos: number[] = [];
    const edge: number[] = [];
    const idx: number[] = [];
    const across = 6;
    const half = RIVER_HALF + 1.6;
    for (let i = 0; i <= xs; i++) {
      const x = -130 + (i / xs) * 260;
      const zc = riverZ(x);
      for (let j = 0; j <= across; j++) {
        const t = j / across;
        pos.push(x, RIVER_Y, zc - half + t * half * 2);
        edge.push(Math.abs(t - 0.5) * 2);
        if (i < xs && j < across) {
          const k = i * (across + 1) + j;
          idx.push(k, k + 1, k + across + 1, k + 1, k + across + 2, k + across + 1);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('edge', new THREE.Float32BufferAttribute(edge, 1));
    g.setIndex(idx);
    return g;
  }, []);
  const mat = useMemo(() => waterMaterial(0.35, 0.92), []);
  useFrame((st) => {
    mat.uniforms.time.value = motion.reduced ? 0 : st.clock.elapsedTime;
    mat.uniforms.storm.value = weather.storm;
  });
  return <mesh geometry={geo} material={mat} renderOrder={1} />;
}

/** The flood: a wide sea that rises from the river as the story goes on. */
export function Flood() {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(420, 420, 90, 90).rotateX(-Math.PI / 2);
    g.setAttribute('edge', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(0.25), 1));
    return g;
  }, []);
  const mat = useMemo(() => {
    const m = waterMaterial(0, 0.96);
    m.uniforms.deep.value = lin('#3d6f7a');
    m.uniforms.shallow.value = lin('#6f9a96');
    return m;
  }, []);
  useFrame((st) => {
    const on = weather.water > RIVER_Y + 0.15;
    if (!ref.current) return;
    ref.current.visible = on;
    ref.current.position.y = weather.water;
    mat.uniforms.time.value = motion.reduced ? 0 : st.clock.elapsedTime;
    mat.uniforms.storm.value = weather.storm;
  });
  return <mesh ref={ref} geometry={geo} material={mat} renderOrder={2} visible={false} />;
}

/* ------------------------------- far hills ------------------------------- */

/** Rolling land beyond the valley, out to the mountains, so nothing floats. */
export function FarLand() {
  const geo = useMemo(() => {
    const g = new THREE.RingGeometry(112, 1100, 96, 14);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const r = Math.hypot(x, z);
      const y = r < 115 ? groundY(x, z) - 0.5 : groundY((x / r) * 115, (z / r) * 115) * (1 - Math.min(1, (r - 115) / 300)) + 14 + fbm(x / 60, z / 60) * 26;
      p.setY(i, y);
      c.set('#5f8a40').lerp(new THREE.Color('#7f9a6a'), Math.min(1, r / 700)).offsetHSL(0, 0, (noise(x / 40, z / 40) - 0.5) * 0.08);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true }), []);
  return <mesh geometry={geo} material={mat} />;
}

export function Mountains() {
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const r = rng(91);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + r() * 0.2;
      const d = 260 + r() * 120;
      const h = 35 + r() * 55 + (Math.abs(a - 4.3) < 0.3 ? 50 : 0);
      const g = rockGeometry(100 + i);
      g.scale(60 + r() * 50, h, 50 + r() * 40);
      g.translate(Math.cos(a) * d, 14, Math.sin(a) * d);
      parts.push(g);
    }
    return mergeGeometries(parts)!;
  }, []);
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true, color: '#7d86a6' }), []);
  return <mesh geometry={geo} material={mat} />;
}

/* ------------------------------- clouds ------------------------------- */

export function Clouds() {
  const tex = useMemo(() => cloudTexture(), []);
  const list = useMemo(() => {
    const r = rng(17);
    return Array.from({ length: 22 }, (_, i) => {
      const a = r() * Math.PI * 2;
      const d = 300 + r() * 300;
      return { pos: new THREE.Vector3(Math.cos(a) * d, 90 + r() * 140, Math.sin(a) * d), w: 160 + r() * 200, storm: i >= 12, spin: r() };
    });
  }, []);
  const mats = useMemo(
    () => list.map((c) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, color: c.storm ? '#8a8f99' : '#fff1e6', opacity: c.storm ? 0 : 0.92 })),
    [list, tex],
  );
  const group = useRef<THREE.Group>(null);
  const cam = useThree((s) => s.camera);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.children.forEach((m, i) => {
      m.quaternion.copy(cam.quaternion);
      const c = list[i];
      if (!motion.reduced) m.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.002);
      const mt = mats[i];
      if (c.storm) mt.opacity = Math.min(1, weather.storm * 1.2);
      else mt.color.set('#fff1e6').lerp(new THREE.Color('#7a7f88'), weather.storm);
    });
  });
  return (
    <group ref={group}>
      {list.map((c, i) => (
        <mesh key={i} position={c.pos} material={mats[i]} renderOrder={-5}>
          <planeGeometry args={[c.w, c.w * 0.45]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------- birds ------------------------------- */

export function Birds() {
  const g = useRef<THREE.Group>(null);
  const birds = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ r: 30 + (i % 3) * 8, h: 22 + i * 1.3, sp: 0.12 + (i % 4) * 0.02, ph: i * 0.7 })), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#3a3440', side: THREE.DoubleSide, fog: true }), []);
  const wing = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -0.25), new THREE.Vector3(0, 0, 0.25), new THREE.Vector3(0.9, 0.1, 0)]), []);
  useFrame((st) => {
    const t = motion.reduced ? 0 : st.clock.elapsedTime;
    g.current?.children.forEach((b, i) => {
      const d = birds[i];
      const a = t * d.sp + d.ph;
      b.position.set(-10 + Math.cos(a) * d.r, d.h + Math.sin(t * 0.5 + i) * 1.5, 10 + Math.sin(a) * d.r);
      b.rotation.y = -a;
      b.visible = weather.storm < 0.6;
      const flap = Math.sin(t * 9 + i) * 0.6;
      b.children[0].rotation.z = flap;
      b.children[1].rotation.z = -flap;
    });
  });
  return (
    <group ref={g}>
      {birds.map((_, i) => (
        <group key={i}>
          <mesh geometry={wing} material={mat} />
          <mesh geometry={wing} material={mat} scale={[-1, 1, 1]} />
        </group>
      ))}
    </group>
  );
}

/* ------------------------------- rain ------------------------------- */

export function Rain() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 1400;
  const drops = useMemo(() => {
    const r = rng(4);
    return Array.from({ length: N }, () => ({ x: (r() - 0.5) * 60, y: r() * 30, z: (r() - 0.5) * 60, v: 18 + r() * 8 }));
  }, []);
  const geo = useMemo(() => new THREE.CylinderGeometry(0.005, 0.005, 0.6, 3, 1, true), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#c8d4e0', transparent: true, opacity: 0.32, depthWrite: false }), []);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const tilt = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, 0, 0.08)), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  useFrame((_, dt) => {
    const im = ref.current;
    if (!im) return;
    const n = Math.floor(N * weather.rain);
    im.count = n;
    im.visible = n > 0;
    if (!n) return;
    for (let i = 0; i < n; i++) {
      const d = drops[i];
      d.y -= d.v * Math.min(dt, 0.05) * (motion.reduced ? 0.5 : 1);
      if (d.y < -2) d.y += 30;
      v.set(player.pos.x + d.x, player.pos.y + d.y - 4, player.pos.z + d.z);
      m.compose(v, tilt, one);
      im.setMatrixAt(i, m);
    }
    im.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, N]} frustumCulled={false} />;
}
