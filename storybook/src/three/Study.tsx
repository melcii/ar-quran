// The quiet room: plaster arch, a window shaft of light with dust, a carpet,
// and the Quran on a carved wooden rehal. All geometry and materials are
// built here in code.
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { seeded } from '@/illustrations/paint';
import { grainBump, leatherTexture, pageEdgeTexture, plasterTexture, woodTexture } from './textures';

export const BOOK = {
  W: 0.3, // page width
  H: 0.42, // page height
  T: 0.06, // total thickness
  position: new THREE.Vector3(0, 0.428, 0),
  /** Each open half rests on one arm of the rehal, rising from the spine. */
  spread: 0.36,
};

const TABLE_H = 0.28;
const REHAL = { L: 0.7, D: 0.27, lean: Math.PI / 2 - 0.37 };

function carpetTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#5d2a22';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#2e2a3d';
  ctx.lineWidth = 26;
  ctx.strokeRect(20, 20, 472, 472);
  ctx.strokeStyle = '#b48a5a';
  ctx.lineWidth = 3;
  ctx.strokeRect(46, 46, 420, 420);
  ctx.fillStyle = '#2e2a3d';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const x = 106 + i * 100;
      const y = 106 + j * 100;
      ctx.beginPath();
      ctx.moveTo(x, y - 30);
      ctx.lineTo(x + 30, y);
      ctx.lineTo(x, y + 30);
      ctx.lineTo(x - 30, y);
      ctx.closePath();
      ctx.fill();
    }
  }
  const rnd = seeded(5);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(${rnd() > 0.5 ? '0,0,0' : '255,220,190'},${rnd() * 0.08})`;
    ctx.fillRect(rnd() * 512, rnd() * 512, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Room({ dim }: { dim: MutableRefObject<number> }) {
  const plaster = useMemo(() => plasterTexture(), []);
  const floorWood = useMemo(() => woodTexture(9, '#4a2f1d', '#2a180d', 3), []);
  const carpet = useMemo(() => carpetTexture(), []);
  const group = useRef<THREE.Group>(null);

  // Back wall with a pointed-arch niche cut out of it.
  const wallGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-6, 0);
    s.lineTo(6, 0);
    s.lineTo(6, 5);
    s.lineTo(-6, 5);
    s.lineTo(-6, 0);
    const arch = new THREE.Path();
    arch.moveTo(-1.1, 0);
    arch.lineTo(-1.1, 2.1);
    arch.quadraticCurveTo(-1.1, 3.0, 0, 3.5);
    arch.quadraticCurveTo(1.1, 3.0, 1.1, 2.1);
    arch.lineTo(1.1, 0);
    arch.lineTo(-1.1, 0);
    s.holes.push(arch);
    return new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: false });
  }, []);

  useFrame(() => {
    if (group.current) group.current.visible = dim.current < 0.98;
  });

  return (
    <group ref={group}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial map={floorWood} roughness={0.75} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0.1]} receiveShadow>
        <planeGeometry args={[2.2, 2.2]} />
        <meshStandardMaterial map={carpet} roughness={1} />
      </mesh>
      <mesh geometry={wallGeo} position={[0, 0, -2.6]} receiveShadow>
        <meshStandardMaterial map={plaster} roughness={0.95} />
      </mesh>
      {/* The niche's back, a little darker and recessed. */}
      <mesh position={[0, 1.75, -2.75]} receiveShadow>
        <planeGeometry args={[2.4, 3.6]} />
        <meshStandardMaterial map={plaster} color="#8d7558" roughness={1} />
      </mesh>
      <mesh position={[-3.2, 2.5, 0]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial map={plaster} color="#a08868" roughness={1} />
      </mesh>
      <mesh position={[3.2, 2.5, 0]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial map={plaster} color="#a08868" roughness={1} />
      </mesh>
      {/* Window opening, high on the left wall, glowing softly. */}
      <mesh position={[-3.18, 3.0, -0.6]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[0.9, 1.4]} />
        <meshBasicMaterial color="#ffe6bf" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A shaft of window light with dust drifting through it. */
function LightShaft({ motion, dim }: { motion: boolean; dim: MutableRefObject<number> }) {
  const shaft = useRef<THREE.Mesh>(null);
  const dust = useRef<THREE.Points>(null);
  const from = new THREE.Vector3(-3.1, 3.0, -0.6);
  const to = new THREE.Vector3(0, 0.3, 0.1);
  const len = from.distanceTo(to);

  const shaftMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uOpacity: { value: 0.16 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uOpacity; varying vec2 vUv;
          void main(){ float edge = sin(vUv.x * 3.14159); float fade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
          gl_FragColor = vec4(1.0, 0.86, 0.62, uOpacity * edge * edge * fade); }`,
      }),
    [],
  );

  const { positions, speeds } = useMemo(() => {
    const rnd = seeded(77);
    const n = 260;
    const positions = new Float32Array(n * 3);
    const speeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = rnd();
      const p = from.clone().lerp(to, t);
      positions[i * 3] = p.x + (rnd() - 0.5) * 0.7;
      positions[i * 3 + 1] = p.y + (rnd() - 0.5) * 0.7;
      positions[i * 3 + 2] = p.z + (rnd() - 0.5) * 0.7;
      speeds[i] = 0.3 + rnd();
    }
    return { positions, speeds };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dustTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,240,210,1)');
    g.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((state, dt) => {
    const visible = 1 - dim.current;
    shaftMat.uniforms.uOpacity.value = 0.16 * visible;
    if (shaft.current) shaft.current.visible = visible > 0.02;
    if (dust.current) {
      dust.current.visible = visible > 0.02;
      (dust.current.material as THREE.PointsMaterial).opacity = 0.7 * visible;
      if (motion) {
        const arr = dust.current.geometry.attributes.position.array as Float32Array;
        const t = state.clock.elapsedTime;
        for (let i = 0; i < speeds.length; i++) {
          arr[i * 3] += Math.sin(t * 0.2 + i) * 0.0006 * speeds[i];
          arr[i * 3 + 1] += Math.cos(t * 0.15 + i * 1.7) * 0.0005 * speeds[i] - dt * 0.004;
          if (arr[i * 3 + 1] < 0.1) arr[i * 3 + 1] = 2.6;
        }
        dust.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  const mid = from.clone().add(to).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), from.clone().sub(to).normalize());

  return (
    <>
      <mesh ref={shaft} position={mid} quaternion={quat} material={shaftMat}>
        <cylinderGeometry args={[0.55, 0.35, len, 24, 1, true]} />
      </mesh>
      <points ref={dust}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial map={dustTex} size={0.018} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.7} />
      </points>
    </>
  );
}

/** A folding X-shaped Quran stand with a pointed-arch cut-out in each leaf. */
function Rehal() {
  const wood = useMemo(() => woodTexture(4, '#6b4429', '#3d2414'), []);
  const geo = useMemo(() => {
    // One board, drawn flat: its depth across x and its length up y, with a
    // pointed arch cut near each end. The two boards cross at the middle.
    const { L, D } = REHAL;
    const s = new THREE.Shape();
    s.moveTo(-D / 2, 0);
    s.lineTo(D / 2, 0);
    s.lineTo(D / 2, L);
    s.lineTo(-D / 2, L);
    s.lineTo(-D / 2, 0);
    const arch = (y0: number, flip: number) => {
      const h = new THREE.Path();
      const y = (v: number) => y0 + v * flip;
      h.moveTo(-0.06, y(0));
      h.lineTo(0.06, y(0));
      h.lineTo(0.06, y(0.08));
      h.quadraticCurveTo(0.06, y(0.14), 0, y(0.17));
      h.quadraticCurveTo(-0.06, y(0.14), -0.06, y(0.08));
      h.lineTo(-0.06, y(0));
      return h;
    };
    s.holes.push(arch(0.06, 1), arch(L - 0.06, -1));
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.016, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 });
    g.translate(0, -L / 2, -0.008);
    g.rotateY(Math.PI / 2); // depth now runs front to back, thickness left to right
    return g;
  }, []);
  const tableTop = useMemo(() => woodTexture(2, '#5a3a24', '#2f1c10'), []);
  const mat = <meshStandardMaterial map={wood} roughness={0.55} metalness={0.02} />;
  const cross = TABLE_H + (REHAL.L / 2) * Math.cos(REHAL.lean);
  return (
    <group>
      {/* A low reading table. */}
      <mesh position={[0, TABLE_H - 0.015, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.78, 0.03, 0.46]} />
        <meshStandardMaterial map={tableTop} roughness={0.6} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.35, (TABLE_H - 0.03) / 2, sz * 0.19]} castShadow>
            <boxGeometry args={[0.04, TABLE_H - 0.03, 0.04]} />
            <meshStandardMaterial map={tableTop} roughness={0.6} />
          </mesh>
        )),
      )}
      {/* Two boards crossing in an X; the open book rests in the upper V. */}
      <mesh geometry={geo} position={[0, cross, 0]} rotation-z={REHAL.lean} castShadow receiveShadow>
        {mat}
      </mesh>
      <mesh geometry={geo} position={[0, cross, 0]} rotation-z={-REHAL.lean} castShadow receiveShadow>
        {mat}
      </mesh>
    </group>
  );
}

type BookProps = {
  open: MutableRefObject<number>; // 0 closed → 1 cover open → 2 leaves turned
  rightPage: THREE.Texture | null;
  leftPage: THREE.Texture | null;
  glow: MutableRefObject<number>;
  onTap: () => void;
};

/** A bent leaf: plane whose vertices curl as it turns. */
function useLeafGeometry() {
  return useMemo(() => {
    const g = new THREE.PlaneGeometry(BOOK.W, BOOK.H, 16, 1);
    g.rotateX(-Math.PI / 2);
    g.translate(-BOOK.W / 2, 0, 0);
    return g;
  }, []);
}

function bendLeaf(geo: THREE.BufferGeometry, base: Float32Array, amount: number) {
  const pos = geo.attributes.position.array as Float32Array;
  for (let i = 0; i < pos.length; i += 3) {
    const x = base[i]; // from -W to 0
    const t = -x / BOOK.W;
    pos[i] = x;
    pos[i + 1] = base[i + 1] + Math.sin(t * Math.PI) * 0.05 * amount;
  }
  geo.attributes.position.needsUpdate = true;
}

export function QuranBook({ open, rightPage, leftPage, glow, onTap }: BookProps) {
  const leather = useMemo(() => leatherTexture(), []);
  const bump = useMemo(() => grainBump(), []);
  const edges = useMemo(() => pageEdgeTexture(), []);
  const front = useRef<THREE.Group>(null);
  const leaves = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const leafGeos = [useLeafGeometry(), useLeafGeometry()];
  const leafBase = useMemo(() => leafGeos.map((g) => (g.attributes.position.array as Float32Array).slice()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const pageMatR = useRef<THREE.MeshStandardMaterial>(null);
  const pageMatL = useRef<THREE.MeshStandardMaterial>(null);

  const { W, H, T } = BOOK;
  const half = T / 2;
  const cover = 0.006;

  useEffect(() => {
    if (rightPage) {
      // The right page is on the underside of the half that turns over, so
      // it is drawn rotated half a turn.
      rightPage.wrapS = THREE.RepeatWrapping;
      rightPage.wrapT = THREE.RepeatWrapping;
      rightPage.repeat.set(-1, -1);
      rightPage.offset.set(1, 1);
      rightPage.needsUpdate = true;
    }
  }, [rightPage]);

  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  useFrame(() => {
    const o = open.current;
    const a = BOOK.spread;
    const turn = (p: number) => -a + (-Math.PI + 2 * a) * ease(p);
    if (front.current) front.current.rotation.z = turn(Math.min(1, Math.max(0, o)));
    leaves.forEach((ref, i) => {
      const p = Math.min(1, Math.max(0, o - 1 - i * 0.35) / 0.65);
      if (ref.current) {
        ref.current.rotation.z = turn(p);
        ref.current.visible = o > 1 && p < 1;
      }
      bendLeaf(leafGeos[i], leafBase[i], Math.sin(p * Math.PI));
    });
    const g = 0.12 * glow.current;
    pageMatR.current?.emissive.setRGB(g, g * 0.85, g * 0.55);
    pageMatL.current?.emissive.setRGB(g, g * 0.85, g * 0.55);
  });

  const tap = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return;
    e.stopPropagation();
    onTap();
  };

  const coverMat = <meshStandardMaterial map={leather} bumpMap={bump} bumpScale={0.6} roughness={0.7} />;
  const edgeMat = <meshStandardMaterial map={edges} roughness={0.9} />;

  return (
    <group position={BOOK.position} onClick={tap}>
      {/* Back half: back cover and the left page block. */}
      <group rotation-z={-BOOK.spread}>
      <mesh position={[-W / 2, cover / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.012, cover, H + 0.012]} />
        {coverMat}
      </mesh>
      <mesh position={[-W / 2, cover + (half - cover) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, half - cover, H]} />
        {edgeMat}
      </mesh>
      <mesh position={[-W / 2, half + 0.0005, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[W - 0.004, H - 0.004]} />
        <meshStandardMaterial ref={pageMatL} map={leftPage ?? undefined} color={leftPage ? '#ffffff' : '#efe4c8'} roughness={0.92} />
      </mesh>
      </group>

      {/* Front half: front cover and the right page block, hinged at the spine. */}
      <group position={[0, half, 0]}>
        <group ref={front}>
          <mesh position={[-W / 2, half - cover / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[W + 0.012, cover, H + 0.012]} />
            {coverMat}
          </mesh>
          <mesh position={[-W / 2, (half - cover) / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[W, half - cover, H]} />
            {edgeMat}
          </mesh>
          <mesh position={[-W / 2, -0.0005, 0]} rotation-x={Math.PI / 2} receiveShadow>
            <planeGeometry args={[W - 0.004, H - 0.004]} />
            <meshStandardMaterial ref={pageMatR} map={rightPage ?? undefined} color={rightPage ? '#ffffff' : '#efe4c8'} roughness={0.92} />
          </mesh>
        </group>
        {/* Blank endpaper leaves that turn after the cover. */}
        {leaves.map((ref, i) => (
          <group ref={ref} key={i} visible={false}>
            <mesh geometry={leafGeos[i]} position={[0, 0.001 + i * 0.0006, 0]}>
              <meshStandardMaterial color="#f1e6cc" roughness={0.95} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Spine */}
      <mesh position={[0, half, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[half, half, H + 0.012, 16, 1, true, Math.PI, Math.PI]} />
        {coverMat}
      </mesh>
      {/* Silk ribbon marker hanging from the top edge */}
      <mesh position={[0.02, half + 0.001, H / 2 + 0.05]} rotation-x={-Math.PI / 2 + 0.3}>
        <planeGeometry args={[0.012, 0.13]} />
        <meshStandardMaterial color="#7b2230" roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Study({ motion, dim, children }: { motion: boolean; dim: MutableRefObject<number>; children?: React.ReactNode }) {
  const lamp = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 0.4, 0);
    return o;
  }, []);
  useFrame(() => {
    const v = 1 - dim.current;
    if (lamp.current) lamp.current.intensity = 60 * v;
    if (fill.current) fill.current.intensity = 1.4 * v;
  });
  return (
    <group>
      <primitive object={target} />
      <spotLight
        ref={lamp}
        position={[-3.0, 3.0, -0.6]}
        target={target}
        angle={0.32}
        penumbra={0.7}
        decay={1.6}
        intensity={60}
        color="#ffd9a8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />
      <pointLight ref={fill} position={[0.8, 1.2, 1.6]} intensity={1.4} color="#ffb980" distance={6} />
      <Room dim={dim} />
      <LightShaft motion={motion} dim={dim} />
      <Rehal />
      {children}
    </group>
  );
}
