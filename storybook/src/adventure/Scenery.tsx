// Scenery for any adventure world, driven by its recipe: sky and light, the
// painted ground, grass and flowers, trees (oak, autumn, blossom, palm, olive,
// cypress, fig, pine), rock outcrops, still water, far land and mountains,
// clouds, birds, and at night the stars and the moon.
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CANOPY, blobGeometry, buildForest, flowerGeometry, rockGeometry, tuftGeometry, waterMaterial, windy, type TreeKind, type TreeSpec } from '@/ark/Scenery';
import { barkTexture, brushTexture, cloudTexture, leafTexture, stoneTexture } from '@/ark/paint';
import { motion, player, weather } from '@/ark/shared';
import { fbm, noise, rng, type P2, type Terrain } from './terrain';

export type SceneQuality = { grass: number; segments: number; shadows: boolean; shadowMap: number };
export { CANOPY };
export type { TreeKind };

export type Look = {
  zen: string;
  mid: string;
  hor: string;
  sun: [number, number, number];
  sunColor: string;
  sunI: number;
  hemiSky: string;
  hemiGround: string;
  hemiI: number;
  fog: string;
  fogDensity: number;
  stars?: number; // 0..1
  moon?: [number, number, number];
  clouds?: number;
  cloudTint?: string;
  birds?: boolean;
};

export type Veg = {
  grass: number;
  flowers?: string[];
  flowerDensity?: number;
  trees: { kind: TreeKind; at?: P2[]; area?: { x: number; z: number; r: number }; count?: number; size?: [number, number]; solid?: boolean }[];
  rocks: { x: number; z: number; n: number; big: number; spread: number }[];
  pebbles?: number;
  rim?: TreeKind[] | false;
  dryGrass?: boolean;
  /** Where grass and flowers grow (0 bare, 1 full), for worlds with sand or stone areas. */
  lush?: (x: number, z: number) => number;
};

const lin = (hex: string) => new THREE.Color(hex);
const STORM = { zen: lin('#4c535e'), mid: lin('#6c727a'), hor: lin('#8a8e92'), fog: lin('#70757b') };

export function sunDir(look: Look) {
  return new THREE.Vector3(...look.sun).normalize();
}

/* ------------------------------- sky ------------------------------- */

export function Sky({ look }: { look: Look }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          sunDir: { value: sunDir(look) },
          storm: { value: 0 },
          stars: { value: look.stars ?? 0 },
          zen0: { value: lin(look.zen) }, zen1: { value: STORM.zen },
          mid0: { value: lin(look.mid) }, mid1: { value: STORM.mid },
          hor0: { value: lin(look.hor) }, hor1: { value: STORM.hor },
          sunCol: { value: lin(look.sunColor) },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 sunDir, sunCol; uniform float storm, stars;
          uniform vec3 zen0, zen1, mid0, mid1, hor0, hor1;
          varying vec3 vDir;
          float h21(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 zen = mix(zen0, zen1, storm), mid = mix(mid0, mid1, storm), hor = mix(hor0, hor1, storm);
            vec3 c = mix(hor, mid, smoothstep(0.0, 0.22, h));
            c = mix(c, zen, smoothstep(0.18, 0.8, h));
            float s = max(dot(d, sunDir), 0.0);
            float clear = (1.0 - storm * 0.9) * smoothstep(-0.05, 0.05, sunDir.y);
            c += sunCol * (pow(s, 6.0) * 0.45 + pow(s, 40.0) * 0.6) * clear;
            c += sunCol * 5.0 * smoothstep(0.9990, 0.9995, s) * clear;
            if (stars > 0.0) {
              vec3 q = floor(d * 260.0);
              float st = step(0.9965, h21(q)) * smoothstep(0.02, 0.3, h);
              c += vec3(1.0, 0.95, 0.85) * st * stars * (0.6 + h21(q + 3.1) * 1.6);
            }
            c = mix(c, hor * 0.92, smoothstep(0.0, -0.2, h));
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [look],
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

export function Moon({ look }: { look: Look }) {
  if (!look.moon) return null;
  const d = new THREE.Vector3(...look.moon).normalize().multiplyScalar(900);
  return (
    <group position={d}>
      <mesh>
        <sphereGeometry args={[22, 24, 16]} />
        <meshBasicMaterial color="#fff6dc" fog={false} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[46, 24, 16]} />
        <meshBasicMaterial color="#c8d4ff" transparent opacity={0.12} fog={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function Lighting({ q, look }: { q: SceneQuality; look: Look }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const scene = useThree((s) => s.scene);
  const dir = useMemo(() => sunDir(look), [look]);
  const fogClear = useMemo(() => lin(look.fog), [look]);
  useLayoutEffect(() => {
    scene.fog = new THREE.FogExp2(fogClear.clone(), look.fogDensity);
    return () => {
      scene.fog = null;
    };
  }, [scene, fogClear, look]);
  useFrame(() => {
    const s = weather.storm;
    const fog = scene.fog as THREE.FogExp2;
    if (fog) {
      fog.color.copy(fogClear).lerp(STORM.fog, s);
      fog.density = look.fogDensity + s * 0.012;
    }
    if (sun.current) {
      sun.current.intensity = look.sunI * (1 - s * 0.82);
      sun.current.position.copy(player.pos).addScaledVector(dir, 60);
      sun.current.target.position.copy(player.pos);
      sun.current.target.updateMatrixWorld();
    }
    if (hemi.current) hemi.current.intensity = look.hemiI * (1 - s * 0.35);
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={[look.hemiSky, look.hemiGround, look.hemiI]} />
      <directionalLight
        ref={sun}
        color={look.sunColor}
        intensity={look.sunI}
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
      />
    </>
  );
}

/* ------------------------------- ground ------------------------------- */

export function GroundMesh({ t, q, onTap }: { t: Terrain; q: SceneQuality; onTap?: (p: THREE.Vector3) => void }) {
  const geo = useMemo(() => {
    const size = (t.radius + 45) * 2;
    const seg = q.segments;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) p.setY(i, t.y(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    const n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      t.color(x, z, p.getY(i), 1 - n.getY(i), c);
      let ao = 1;
      for (const s of t.shade) {
        const d = Math.hypot(x - s.x, z - s.z);
        if (d < s.r) ao *= 1 - s.k * (1 - d / s.r) ** 2;
      }
      col[i * 3] = c.r * ao;
      col[i * 3 + 1] = c.g * ao;
      col[i * 3 + 2] = c.b * ao;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * size / 9, uv.getY(i) * size / 9);
    return g;
  }, [t, q.segments]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, map: brushTexture(), roughness: 1 }), []);
  return (
    <mesh
      geometry={geo}
      material={mat}
      receiveShadow
      onClick={(e) => {
        if (e.delta > 8 || !onTap) return;
        e.stopPropagation();
        onTap(e.point);
      }}
    />
  );
}

/** Rolling land beyond the playable area, so the horizon never floats. */
export function FarLand({ t, tint = '#6f9248' }: { t: Terrain; tint?: string }) {
  const geo = useMemo(() => {
    const r0 = t.radius + 40;
    const g = new THREE.RingGeometry(r0, 1100, 96, 14);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const r = Math.hypot(x, z);
      const edge = t.y((x / r) * (r0 + 2), (z / r) * (r0 + 2));
      const y = r < r0 + 4 ? t.y(x, z) - 0.3 : edge * (1 - Math.min(1, (r - r0) / 300)) + Math.min(1, (r - r0) / 120) * (8 + fbm(x / 60, z / 60) * 26);
      p.setY(i, y);
      c.set(tint).lerp(new THREE.Color('#8a9a7a'), Math.min(1, r / 700)).offsetHSL(0, 0, (noise(x / 40, z / 40) - 0.5) * 0.08);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, [t, tint]);
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true }), []);
  return <mesh geometry={geo} material={mat} />;
}

export function Mountains({ color = '#7d86a6', seed = 91, height = 1 }: { color?: string; seed?: number; height?: number }) {
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const r = rng(seed);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + r() * 0.2;
      const d = 280 + r() * 120;
      const h = (35 + r() * 55) * height;
      const g = rockGeometry(100 + i + seed);
      g.scale(60 + r() * 50, h, 50 + r() * 40);
      g.translate(Math.cos(a) * d, 14, Math.sin(a) * d);
      parts.push(g);
    }
    return mergeGeometries(parts)!;
  }, [seed, height]);
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true, color }), [color]);
  return <mesh geometry={geo} material={mat} />;
}

/* ------------------------------- placement ------------------------------- */

export type Placed = { trees: TreeSpec[]; rocks: { x: number; z: number; s: number; sy: number; rot: number; v: number }[] };

/** Choose every tree and rock once, and register trunks and boulders as obstacles. */
export function place(t: Terrain, veg: Veg, seed: number): Placed {
  const r = rng(seed);
  const trees: TreeSpec[] = [];
  const ok = (x: number, z: number, d: number) => trees.every((k) => Math.hypot(k.x - x, k.z - z) > d);
  for (const grp of veg.trees) {
    const [s0, s1] = grp.size ?? [0.8, 1.2];
    const add = (x: number, z: number) => {
      const size = s0 + r() * (s1 - s0);
      if (!t.clear(x, z, size * 1.5) || !ok(x, z, (grp.kind === 'palm' || grp.kind === 'cypress' ? 2.5 : 4.5) * size)) return;
      trees.push({ x, z, kind: grp.kind, size, seed: Math.floor(r() * 1e6), solid: grp.solid !== false });
    };
    if (grp.at) for (const [x, z] of grp.at) add(x, z);
    if (grp.area)
      for (let i = 0; i < (grp.count ?? 8) * 4 && trees.filter((k) => k.kind === grp.kind).length < (grp.count ?? 8) + (grp.at?.length ?? 0); i++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * grp.area.r;
        add(grp.area.x + Math.cos(a) * d, grp.area.z + Math.sin(a) * d);
      }
  }
  if (veg.rim !== false) {
    const kinds = veg.rim ?? ['oak', 'oak', 'autumn', 'pine'];
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + r() * 0.1;
      const d = t.radius + 6 + r() * 26;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (t.water != null && t.y(x, z) < t.water + 0.3) continue;
      trees.push({ x, z, kind: kinds[Math.floor(r() * kinds.length)], size: 0.9 + r() * 0.6, seed: Math.floor(r() * 1e6), solid: false });
    }
  }
  const rocks: Placed['rocks'] = [];
  for (const c of veg.rocks)
    for (let i = 0; i < c.n; i++) {
      const x = c.x + (r() - 0.5) * c.spread;
      const z = c.z + (r() - 0.5) * c.spread;
      if (!t.clear(x, z, 0)) continue;
      rocks.push({ x, z, s: c.big * (0.45 + r() * 0.75), sy: 0.55 + r() * 0.6, rot: r() * 6.28, v: Math.floor(r() * 4) });
    }
  for (let i = 0; i < (veg.pebbles ?? 30); i++) {
    const x = (r() - 0.5) * t.radius * 1.8;
    const z = (r() - 0.5) * t.radius * 1.8;
    if (Math.hypot(x, z) > t.radius - 4 || !t.clear(x, z, 0)) continue;
    rocks.push({ x, z, s: 0.25 + r() * 0.45, sy: 0.5 + r() * 0.4, rot: r() * 6.28, v: Math.floor(r() * 4) });
  }
  for (const k of trees) {
    if (k.solid) t.obstacles.push({ x: k.x, z: k.z, r: 0.5 * k.size + (k.kind === 'autumn' ? 0.5 : 0.15) });
    t.shade.push({ x: k.x, z: k.z, r: (k.kind === 'autumn' ? 7 : k.kind === 'palm' ? 2.5 : 4.5) * k.size, k: 0.3 });
  }
  for (const k of rocks) {
    if (k.s > 0.6 && Math.hypot(k.x, k.z) < t.radius + 2) t.obstacles.push({ x: k.x, z: k.z, r: k.s * 0.85 });
    t.shade.push({ x: k.x, z: k.z, r: k.s * 1.7, k: 0.35 });
  }
  return { trees, rocks };
}

/* ------------------------------- grass and flowers ------------------------------- */

export function GrassField({ t, veg, q }: { t: Terrain; veg: Veg; q: SceneQuality }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geo, mat, mats, cols } = useMemo(() => {
    const r = rng(77);
    const mats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const target = Math.floor(30000 * q.grass * veg.grass * Math.min(2.6, Math.max(1, (t.radius / 62) ** 2)));
    const m = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const c = new THREE.Color();
    const up = new THREE.Vector3(0, 1, 0);
    let tries = 0;
    while (mats.length < target && tries++ < target * 4) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * (t.radius + 12);
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (t.pathDist(x, z) < 1.3) continue;
      if (veg.lush && r() > veg.lush(x, z)) continue;
      if (t.water != null && t.y(x, z) < t.water + 0.15) continue;
      if (!t.clear(x, z, -1.4) && r() < 0.85) continue;
      const lush = fbm(x / 16 + 2, z / 16 + 9);
      if (r() > 0.55 + (1 - lush) * 0.7) continue;
      const y = t.y(x, z);
      const tall = fbm(x / 9 + 50, z / 9 + 20) > 0.62 ? 1.4 + r() * 0.5 : 1;
      const s = (0.55 + r() * 0.45) * tall;
      quat.setFromAxisAngle(up, r() * Math.PI * 2);
      m.compose(new THREE.Vector3(x, y - 0.03, z), quat, new THREE.Vector3(s, s * (0.8 + r() * 0.5), s));
      mats.push(m.clone());
      t.color(x, z, y, 0, c);
      c.offsetHSL(0.01 + (r() - 0.5) * 0.03, 0.06, 0.04 + (tall > 1 ? 0.06 : 0));
      if (tall > 1 || veg.dryGrass) c.lerp(new THREE.Color('#c9c060'), veg.dryGrass ? 0.5 : 0.35);
      cols.push(c.clone());
    }
    const mat = windy(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 0.9, true);
    return { geo: tuftGeometry(), mat, mats, cols };
  }, [t, veg, q.grass]);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    mats.forEach((m, i) => {
      im.setMatrixAt(i, m);
      im.setColorAt(i, cols[i]);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }, [mats, cols]);
  if (!mats.length) return null;
  return <instancedMesh ref={ref} args={[geo, mat, mats.length]} receiveShadow frustumCulled={false} />;
}

export function FlowerField({ t, veg, q }: { t: Terrain; veg: Veg; q: SceneQuality }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geo, mat, list } = useMemo(() => {
    const r = rng(303);
    const palette = (veg.flowers ?? []).map((h) => new THREE.Color(h));
    const list: { m: THREE.Matrix4; c: THREE.Color }[] = [];
    const target = Math.floor(2200 * q.grass * (veg.flowerDensity ?? 1) * Math.min(2.6, Math.max(1, (t.radius / 62) ** 2)));
    let tries = 0;
    while (palette.length && list.length < target && tries++ < target * 8) {
      const cx = (r() - 0.5) * t.radius * 1.9;
      const cz = (r() - 0.5) * t.radius * 1.9;
      if (noise(cx / 14 + 9, cz / 14) < 0.6) continue;
      const pick = palette[Math.floor(noise(cx / 20, cz / 20 + 4) * palette.length * 0.999)];
      for (let k = 0; k < 6; k++) {
        const x = cx + (r() - 0.5) * 3;
        const z = cz + (r() - 0.5) * 3;
        if (Math.hypot(x, z) > t.radius + 6 || !t.clear(x, z, -2) || (veg.lush && veg.lush(x, z) < 0.6)) continue;
        const s = 0.8 + r() * 0.7;
        list.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(x, t.y(x, z) - 0.02, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3)), new THREE.Vector3(s, s, s)), c: pick });
      }
    }
    return { geo: flowerGeometry(), mat: windy(new THREE.MeshLambertMaterial({ vertexColors: true }), 1.2, true), list };
  }, [t, veg, q.grass]);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    list.forEach((f, i) => {
      im.setMatrixAt(i, f.m);
      im.setColorAt(i, f.c);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }, [list]);
  if (!list.length) return null;
  return <instancedMesh ref={ref} args={[geo, mat, list.length]} frustumCulled={false} />;
}

/* ------------------------------- trees and rocks ------------------------------- */

export function Trees({ t, placed, q }: { t: Terrain; placed: Placed; q: SceneQuality }) {
  const blobRef = useRef<THREE.InstancedMesh>(null);
  const cardRef = useRef<THREE.InstancedMesh>(null);
  const built = useMemo(() => buildForest(placed.trees, t.y), [placed, t]);
  const blobGeo = useMemo(() => blobGeometry(2), []);
  const cardGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    const n = g.attributes.normal;
    for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 0, 1);
    return g;
  }, []);
  const mats = useMemo(
    () => ({
      trunk: new THREE.MeshStandardMaterial({ map: barkTexture(), color: '#c8b8a8', roughness: 0.95 }),
      blob: windy(new THREE.MeshLambertMaterial({ vertexColors: true }), 0.0, false),
      card: windy(new THREE.MeshLambertMaterial({ map: leafTexture(), alphaTest: 0.45, side: THREE.DoubleSide }), 0.02, false, true),
      frond: windy(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 0.01, false, true),
    }),
    [],
  );
  useLayoutEffect(() => {
    const b = blobRef.current;
    const c = cardRef.current;
    if (!b || !c) return;
    built.blobs.forEach((x, i) => {
      b.setMatrixAt(i, x.m);
      b.setColorAt(i, x.c);
    });
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
      {built.fronds && <mesh geometry={built.fronds} material={mats.frond} castShadow={q.shadows} />}
      <instancedMesh ref={blobRef} args={[blobGeo, mats.blob, Math.max(1, built.blobs.length)]} castShadow={q.shadows} receiveShadow />
      <instancedMesh ref={cardRef} args={[cardGeo, mats.card, Math.max(1, built.cards.length)]} receiveShadow />
    </group>
  );
}

export function RockField({ t, placed, q, tint = '#ffffff' }: { t: Terrain; placed: Placed; q: SceneQuality; tint?: string }) {
  const geos = useMemo(() => [1, 2, 3, 4].map(rockGeometry), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, map: stoneTexture(), roughness: 0.92, color: tint }), [tint]);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const groups = useMemo(() => [0, 1, 2, 3].map((v) => placed.rocks.filter((k) => k.v === v)), [placed]);
  useLayoutEffect(() => {
    groups.forEach((list, v) => {
      const im = refs.current[v];
      if (!im) return;
      list.forEach((k, i) => {
        im.setMatrixAt(
          i,
          new THREE.Matrix4().compose(
            new THREE.Vector3(k.x, t.y(k.x, k.z) + k.s * k.sy * 0.15, k.z),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, k.rot, 0)),
            new THREE.Vector3(k.s, k.s * k.sy, k.s * (0.8 + (i % 3) * 0.15)),
          ),
        );
      });
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
    });
  }, [groups, t]);
  return (
    <group>
      {groups.map((list, v) =>
        list.length ? <instancedMesh key={v} ref={(r) => void (refs.current[v] = r)} args={[geos[v], mat, list.length]} castShadow={q.shadows} receiveShadow /> : null,
      )}
    </group>
  );
}

/* ------------------------------- water ------------------------------- */

export function StillWater({ t, look, deep = '#2f7f8f', shallow = '#7cc7b8' }: { t: Terrain; look: Look; deep?: string; shallow?: string }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2400, 2400, 120, 120).rotateX(-Math.PI / 2);
    g.setAttribute('edge', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(0.3), 1));
    return g;
  }, []);
  const mat = useMemo(() => {
    const m = waterMaterial(0, 0.92);
    m.uniforms.sunDir.value = sunDir(look);
    m.uniforms.deep.value = lin(deep);
    m.uniforms.shallow.value = lin(shallow);
    m.uniforms.sky.value = lin(look.mid);
    return m;
  }, [look, deep, shallow]);
  useFrame((st) => {
    mat.uniforms.time.value = motion.reduced ? 0 : st.clock.elapsedTime;
    mat.uniforms.storm.value = weather.storm;
  });
  if (t.water == null) return null;
  return <mesh geometry={geo} material={mat} position-y={t.water} renderOrder={2} />;
}

/* ------------------------------- sky life ------------------------------- */

export function CloudLayer({ look }: { look: Look }) {
  const tex = useMemo(() => cloudTexture(), []);
  const n = look.clouds ?? 14;
  const list = useMemo(() => {
    const r = rng(17);
    return Array.from({ length: n }, () => {
      const a = r() * Math.PI * 2;
      const d = 300 + r() * 300;
      return { pos: new THREE.Vector3(Math.cos(a) * d, 90 + r() * 140, Math.sin(a) * d), w: 160 + r() * 200 };
    });
  }, [n]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, color: look.cloudTint ?? '#fff1e6', opacity: 0.92 }), [tex, look]);
  const group = useRef<THREE.Group>(null);
  const cam = useThree((s) => s.camera);
  const base = useMemo(() => new THREE.Color(look.cloudTint ?? '#fff1e6'), [look]);
  useFrame(() => {
    group.current?.children.forEach((m) => m.quaternion.copy(cam.quaternion));
    mat.color.copy(base).lerp(STORM.mid, weather.storm);
  });
  return (
    <group ref={group}>
      {list.map((c, i) => (
        <mesh key={i} position={c.pos} material={mat} renderOrder={-5}>
          <planeGeometry args={[c.w, c.w * 0.45]} />
        </mesh>
      ))}
    </group>
  );
}

export function Flock({ center = [0, 0] as P2, height = 24 }: { center?: P2; height?: number }) {
  const g = useRef<THREE.Group>(null);
  const birds = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ r: 26 + (i % 3) * 8, h: height + i * 1.3, sp: 0.12 + (i % 4) * 0.02, ph: i * 0.7 })), [height]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#3a3440', side: THREE.DoubleSide }), []);
  const wing = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -0.25), new THREE.Vector3(0, 0, 0.25), new THREE.Vector3(0.9, 0.1, 0)]), []);
  useFrame((st) => {
    const t = motion.reduced ? 0 : st.clock.elapsedTime;
    g.current?.children.forEach((b, i) => {
      const d = birds[i];
      const a = t * d.sp + d.ph;
      b.position.set(center[0] + Math.cos(a) * d.r, d.h + Math.sin(t * 0.5 + i) * 1.5, center[1] + Math.sin(a) * d.r);
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

/** Fireflies or drifting motes: small glowing points near the ground. */
export function Motes({ center, r = 20, n = 60, color = '#ffe8a0', height = 2.5 }: { center: P2; r?: number; n?: number; color?: string; height?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const rr = rng(n * 7 + Math.round(center[0]));
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = center[0] + (rr() - 0.5) * r * 2;
      pos[i * 3 + 1] = 0.5 + rr() * height;
      pos[i * 3 + 2] = center[1] + (rr() - 0.5) * r * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [center, r, n, height]);
  useFrame((st) => {
    if (ref.current && !motion.reduced) ref.current.position.y = Math.sin(st.clock.elapsedTime * 0.6) * 0.3;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={color} size={0.14} transparent opacity={0.85} depthWrite={false} toneMapped={false} />
    </points>
  );
}
