// The walkable world of one surah. A path winds through a symbolic landscape;
// lanterns along it mark the surah's designed areas (or its passages), in order. A
// doorway at the start leads back to the library, one at the end leads on.
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { designFor } from '@/content/designs';
import { getSurah, parseRef } from '@/content/quran';
import { Ground, Grass, Moon, Palms, Particles, Rocks, Sky, Trees, Water, scatter, sunVector } from './Nature';
import type { Quality } from './quality';
import { PRESETS, worldFor } from './settings';
import { makeLand, type Land } from './terrain';
import { SCENES } from './scenes';

/** One stop on the world's path. When the surah has a design record, each stop
 * is one of its designed areas, tied to an ayah; otherwise the surah is split
 * into up to twelve passages in order. */
export type Passage = {
  index: number;
  from: number;
  to: number;
  /** The designed area this stop stands for (artistic setting, not scripture). */
  area?: { name: string; description: string; design: number };
};

export function passagesOf(surah: number): Passage[] {
  const design = designFor(surah);
  if (design?.areas.length) {
    return design.areas
      .map((a, design) => ({ a, design, ref: parseRef(a.reference) }))
      .filter((x) => x.ref && x.ref.surah === surah)
      .sort((x, y) => x.ref!.from - y.ref!.from || x.design - y.design)
      .map((x, index) => ({ index, from: x.ref!.from, to: x.ref!.to, area: { name: x.a.name, description: x.a.description, design: x.design } }));
  }
  const count = getSurah(surah)?.ayahCount ?? 0;
  const stops = Math.min(count, 12);
  return Array.from({ length: stops }, (_, k) => ({
    index: k,
    from: Math.floor((k * count) / stops) + 1,
    to: Math.floor(((k + 1) * count) / stops),
  }));
}

export type Move = { x: number; y: number; run: boolean };

export function SurahWorld({
  surah,
  quality,
  found,
  move,
  look,
  onLantern,
  onNear,
  onPortal,
  onHint,
  onSceneActivity,
}: {
  surah: number;
  quality: Quality;
  found: number[];
  move: MutableRefObject<Move>;
  look: { yaw: number; pitch: number };
  onLantern: (p: Passage) => void;
  onNear: (p: Passage | null) => void;
  onPortal: (where: 'library' | 'next' | 'story' | 'book') => void;
  onHint: (text: string) => void;
  onSceneActivity?: (name: string) => void;
}) {
  const info = worldFor(surah);
  const preset = PRESETS[info.setting];
  const passages = useMemo(() => passagesOf(surah), [surah]);
  const land = useMemo(() => makeLand(preset, surah * 101 + 7, passages.length), [preset, surah, passages.length]);
  const q = quality.vegetation;
  const spots = useMemo(
    () => ({
      palms: scatter(land, Math.round(preset.veg.palms * q), surah + 1, { minPath: 4 }),
      trees: scatter(land, Math.round(preset.veg.trees * q), surah + 2, { minPath: 5 }),
      olives: scatter(land, Math.round(preset.veg.olives * q), surah + 3, { minPath: 4 }),
      rocks: scatter(land, Math.round(preset.veg.rocks * q), surah + 4, { minPath: 3, spread: 90 }),
      grass: scatter(land, Math.round(preset.veg.grass * q), surah + 5, { minPath: 1.6, spread: 40 }),
      flowers: scatter(land, Math.round(preset.veg.flowers * q), surah + 6, { minPath: 1.8, spread: 36 }),
    }),
    [land, preset, q, surah],
  );
  const stops = useMemo(() => {
    const L = land.path.getLength();
    return passages.map((p, i) => {
      const t = (i + 1) / (passages.length + 1);
      const at = land.path.getPointAt(t);
      const tan = land.path.getTangentAt(t);
      const side = i % 2 ? 1 : -1;
      const x = at.x + tan.z * 2.2 * side;
      const z = at.z - tan.x * 2.2 * side;
      return { p, pos: new THREE.Vector3(x, land.height(x, z), z), L };
    });
  }, [land, passages]);
  const end = useMemo(() => {
    const p = land.path.getPointAt(1);
    return new THREE.Vector3(p.x, land.height(p.x, p.z), p.z - 4);
  }, [land]);
  const sun = sunVector(preset);
  const { scene, gl } = useThree();

  useEffect(() => {
    scene.fog = new THREE.FogExp2(preset.fog, preset.fogDensity);
    gl.toneMappingExposure = preset.exposure;
    return () => {
      scene.fog = null;
      gl.toneMappingExposure = 1;
    };
  }, [scene, gl, preset]);

  const tapLantern = (p: Passage, pos: THREE.Vector3) => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return;
    e.stopPropagation();
    if (e.camera.position.distanceTo(pos) > 16) onHint('Walk closer to the lantern to open it.');
    else onLantern(p);
  };
  const tapPortal = (where: 'library' | 'next' | 'story' | 'book') => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return;
    e.stopPropagation();
    onPortal(where);
  };

  const sunPos = sun.clone().multiplyScalar(80);
  const Scene = SCENES[surah];
  return (
    <group>
      <Sky preset={preset} />
      {preset.moon && <Moon preset={preset} />}
      {preset.stars && <Stars count={Math.round(2500 * quality.vegetation + 500)} />}
      <hemisphereLight intensity={preset.night ? 0.25 : 0.55} color={preset.night ? '#5a6a9a' : '#fff1dc'} groundColor={preset.ground[1]} />
      <directionalLight
        position={preset.night ? [-40, 60, 20] : [sunPos.x, Math.max(8, sunPos.y), sunPos.z]}
        intensity={preset.night ? 0.35 : 2.4}
        color={preset.night ? '#9fb2e0' : preset.sun[0] < 10 ? '#ffc890' : '#fff2dd'}
        castShadow={quality.shadows}
        shadow-mapSize={[quality.shadowMap, quality.shadowMap]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-far={300}
        shadow-bias={-0.0005}
      />
      <Ground land={land} preset={preset} segments={quality.terrainSegments} />
      {land.waterLevel != null && <Water y={land.waterLevel} size={land.size * 2} preset={preset} />}
      {preset.water === 'pool' && <Pool land={land} preset={preset} />}
      <Palms spots={spots.palms} />
      <Trees spots={spots.trees} />
      <Trees spots={spots.olives} olive />
      <Rocks spots={spots.rocks} />
      <Grass spots={spots.grass} />
      <Grass spots={spots.flowers} flowers />
      <Particles kind={preset.particles} count={Math.round((preset.particles === 'rain' ? 2400 : 500) * quality.vegetation)} />
      {preset.lamps && <Lamps land={land} />}
      {Scene && <Scene land={land} stops={stops} quality={quality} complete={(n) => onSceneActivity?.(n)} hint={onHint} />}

      {stops.map(({ p, pos }) => (
        <Lantern key={p.index} position={pos} found={found.includes(p.index)} onClick={tapLantern(p, pos)} />
      ))}
      <Portal position={new THREE.Vector3(0, land.height(0, 9), 9)} rotation={0} label="library" onClick={tapPortal('library')} />
      <Portal position={end} rotation={Math.PI} label="next" onClick={tapPortal('next')} />
      {info.story && <Portal position={new THREE.Vector3(-7, land.height(-7, 2), 2)} rotation={Math.PI / 4} label="story" onClick={tapPortal('story')} />}

      <Walker land={land} move={move} look={look} stops={stops} onNear={onNear} />
    </group>
  );
}

function Stars({ count }: { count: number }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const v = new THREE.Vector3();
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      v.setFromSphericalCoords(1500, Math.acos(rnd() * 0.95), rnd() * Math.PI * 2);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#fffaf0" size={2.2} sizeAttenuation={false} fog={false} transparent opacity={0.9} />
    </points>
  );
}

/** A reflecting pool with a stone rim near the start of the path. */
function Pool({ land, preset }: { land: Land; preset: (typeof PRESETS)['garden'] }) {
  const x = 6.5;
  const z = -6;
  const y = land.height(x, z) + 0.25;
  return (
    <group position={[x, y, z]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[4.4, 0.5, 8.4]} />
        <meshStandardMaterial color="#cbb894" roughness={0.7} />
      </mesh>
      <Water y={0.26} size={7.6} preset={preset} center={[0, 0]} />
    </group>
  );
}

/** Standing lamps along the path for the setting of light. */
function Lamps({ land }: { land: Land }) {
  const pts = useMemo(() => land.path.getSpacedPoints(14).slice(1), [land]);
  return (
    <group>
      {pts.map((p, i) => {
        const x = p.x + (i % 2 ? 2.8 : -2.8);
        const y = land.height(x, p.z);
        return (
          <group key={i} position={[x, y, p.z]}>
            <mesh position={[0, 1.1, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.08, 2.2, 8]} />
              <meshStandardMaterial color="#3a3026" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.35, 0]}>
              <sphereGeometry args={[0.2, 16, 12]} />
              <meshStandardMaterial color="#fff0c8" emissive="#ffc870" emissiveIntensity={3} />
            </mesh>
            {i % 3 === 0 && <pointLight position={[0, 2.4, 0]} intensity={6} distance={12} color="#ffcf88" />}
          </group>
        );
      })}
    </group>
  );
}

/** A passage lantern: lit and pulsing until found, then a steady soft glow. */
function Lantern({ position, found, onClick }: { position: THREE.Vector3; found: boolean; onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  const glass = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (glass.current) glass.current.emissiveIntensity = found ? 1.2 : 2.2 + Math.sin(t * 2.4 + position.x) * 0.9;
    if (halo.current) {
      halo.current.lookAt(s.camera.position);
      const k = found ? 1 : 1.2 + Math.sin(t * 2.4 + position.x) * 0.15;
      halo.current.scale.setScalar(k);
    }
  });
  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 1.5, 8]} />
        <meshStandardMaterial color="#4a3a28" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.72, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.44, 8]} />
        <meshStandardMaterial ref={glass} color={found ? '#f6e7b8' : '#fff1c8'} emissive={found ? '#d8b860' : '#ffb84a'} emissiveIntensity={2} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 2.06, 0]} castShadow>
        <coneGeometry args={[0.27, 0.26, 8]} />
        <meshStandardMaterial color="#4a3a28" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh ref={halo} position={[0, 1.72, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshBasicMaterial color={found ? '#e8d49a' : '#ffc060'} transparent opacity={found ? 0.08 : 0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* A larger invisible target, so small fingers can tap it */}
      <mesh position={[0, 1.4, 0]} visible={false}>
        <cylinderGeometry args={[0.8, 0.8, 2.8, 8]} />
      </mesh>
    </group>
  );
}

const PORTAL_TINT = { library: '#ffd49a', next: '#b8e0ff', story: '#9fe8d0', book: '#ffd49a' } as const;

/** A stone pointed arch whose opening shimmers with light. */
function Portal({ position, rotation, label, onClick }: { position: THREE.Vector3; rotation: number; label: keyof typeof PORTAL_TINT; onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uTint: { value: new THREE.Color(PORTAL_TINT[label]) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `
          uniform float uTime; uniform vec3 uTint; varying vec2 vUv;
          void main(){
            vec2 c = vUv - vec2(0.5, 0.42);
            float r = length(c * vec2(1.0, 0.7));
            float swirl = sin(atan(c.y, c.x) * 6.0 + uTime * 1.3 - r * 18.0) * 0.5 + 0.5;
            float a = smoothstep(0.75, 0.0, r) * (0.55 + 0.35 * swirl);
            gl_FragColor = vec4(uTint * (0.9 + swirl * 0.5), a);
          }`,
      }),
    [label],
  );
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  const arch = useMemo(() => {
    const s = new THREE.Shape();
    const w = 1.1;
    s.moveTo(-w, 0);
    s.lineTo(w, 0);
    s.lineTo(w, 2.2);
    s.quadraticCurveTo(w, 3.3, 0, 3.7);
    s.quadraticCurveTo(-w, 3.3, -w, 2.2);
    s.lineTo(-w, 0);
    return s;
  }, []);
  const frame = useMemo(() => {
    const outer = new THREE.Shape();
    const w = 1.45;
    outer.moveTo(-w, 0);
    outer.lineTo(w, 0);
    outer.lineTo(w, 2.3);
    outer.quadraticCurveTo(w, 3.6, 0, 4.15);
    outer.quadraticCurveTo(-w, 3.6, -w, 2.3);
    outer.lineTo(-w, 0);
    outer.holes.push(arch as unknown as THREE.Path);
    const g = new THREE.ExtrudeGeometry(outer, { depth: 0.5, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 });
    g.translate(0, 0, -0.25);
    return g;
  }, [arch]);
  return (
    <group position={position} rotation-y={rotation} onClick={onClick}>
      <mesh geometry={frame} castShadow receiveShadow>
        <meshStandardMaterial color="#d6c4a0" roughness={0.75} />
      </mesh>
      <mesh material={mat}>
        <shapeGeometry args={[arch]} />
      </mesh>
    </group>
  );
}

/** First-person walking: keys or the on-screen stick to move, drag to look. */
function Walker({
  land,
  move,
  look,
  stops,
  onNear,
}: {
  land: Land;
  move: MutableRefObject<Move>;
  look: { yaw: number; pitch: number };
  stops: { p: Passage; pos: THREE.Vector3 }[];
  onNear: (p: Passage | null) => void;
}) {
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3(0, 0, 4));
  const keys = useRef(new Set<string>());
  const near = useRef<number | null>(null);
  useEffect(() => {
    pos.current.set(0, 0, 4);
    look.yaw = 0;
    look.pitch = -0.05;
    const dn = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    // Test hook: stand a few steps in front of a stop, facing it. Software-rendered
    // test browsers walk far too slowly to reach later places by key presses.
    (globalThis as { __goToStop?: (i: number) => void }).__goToStop = (i: number) => {
      const st = stops[i];
      if (!st) return;
      pos.current.set(st.pos.x, 0, st.pos.z + 5);
      look.yaw = 0;
      look.pitch = -0.1;
    };
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', up);
    };
  }, [land, look, stops]);
  useFrame((_, dt) => {
    const k = keys.current;
    let fx = move.current.x;
    let fz = move.current.y;
    if (k.has('w') || k.has('arrowup')) fz += 1;
    if (k.has('s') || k.has('arrowdown')) fz -= 1;
    if (k.has('a') || k.has('arrowleft')) fx -= 1;
    if (k.has('d') || k.has('arrowright')) fx += 1;
    const len = Math.hypot(fx, fz);
    if (len > 1) {
      fx /= len;
      fz /= len;
    }
    const speed = (move.current.run || k.has('shift') ? 7 : 3.6) * Math.min(dt, 0.1);
    const fwd = new THREE.Vector3(Math.sin(look.yaw), 0, -Math.cos(look.yaw));
    const right = new THREE.Vector3(Math.cos(look.yaw), 0, Math.sin(look.yaw));
    const next = pos.current.clone().addScaledVector(fwd, fz * speed).addScaledVector(right, fx * speed);
    next.x = THREE.MathUtils.clamp(next.x, -95, 95);
    next.z = THREE.MathUtils.clamp(next.z, -land.size + 50, 30);
    const h = land.height(next.x, next.z);
    if (land.waterLevel == null || h > land.waterLevel + 0.15) pos.current.copy(next);
    const eye = land.height(pos.current.x, pos.current.z) + 1.62;
    camera.position.set(pos.current.x, camera.position.y + (eye - camera.position.y) * Math.min(1, dt * 10), pos.current.z);
    const dir = new THREE.Vector3(Math.sin(look.yaw) * Math.cos(look.pitch), Math.sin(look.pitch), -Math.cos(look.yaw) * Math.cos(look.pitch));
    camera.lookAt(camera.position.clone().add(dir));
    // Tell the interface when a lantern is within reach.
    let best: { p: Passage; d: number } | null = null;
    for (const s of stops) {
      const d = s.pos.distanceTo(camera.position);
      if (d < 5 && (!best || d < best.d)) best = { p: s.p, d };
    }
    const idx = best ? best.p.index : null;
    if (idx !== near.current) {
      near.current = idx;
      onNear(best ? best.p : null);
    }
  });
  return null;
}
