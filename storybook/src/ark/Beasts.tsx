// Stylized but believable animals with jointed legs and a walk cycle: hips and
// knees swing in a four-beat walk, the body bobs, necks and heads follow the
// stride, tails swish, ears flick, and idle animals graze. One rig, five kinds.
import { Outlines } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BeastKind } from './land';
import { coatTexture } from './paint';
import { motion } from './shared';

export type BeastState = 'wander' | 'follow' | 'drag' | 'pad' | 'board' | 'stall';

export type Animal = BeastKind | 'cow' | 'goat';

export type Agent<K extends Animal = Animal> = {
  id: string;
  kind: K;
  mate: 0 | 1;
  pos: THREE.Vector3;
  yaw: number;
  speed: number;
  phase: number;
  state: BeastState;
  target: THREE.Vector3 | null;
  home: THREE.Vector3;
  path: THREE.Vector3[];
  found: boolean;
  /** 0 head up, 1 head down grazing. */
  graze: number;
  timer: number;
  highlight: boolean;
  scale: number;
  /** Per-animal looks: coat colours, patches, a work yoke (used to tell animals apart). */
  look?: { coat?: string; mark?: string; patches?: boolean; yoke?: boolean; grey?: boolean };
};

type Spec = {
  name: string;
  hip: number; // hip height
  len: number; // body length
  r: number; // body radius
  legR: number;
  neck: number;
  neckTilt: number; // radians forward from vertical
  head: number;
  snout: number;
  coat: string;
  coat2: string;
  mark: string;
  dark: string;
  stride: number; // metres per walk cycle
  speed: number;
};

export const SPECS: Record<Animal, Spec> = {
  giraffe: { name: 'giraffe', hip: 1.9, len: 1.55, r: 0.52, legR: 0.09, neck: 2.0, neckTilt: 0.42, head: 0.24, snout: 0.26, coat: '#ebbd68', coat2: '#e2ae58', mark: '#a0602e', dark: '#4a3020', stride: 2.6, speed: 2.2 },
  elephant: { name: 'elephant', hip: 1.15, len: 2.0, r: 1.0, legR: 0.27, neck: 0.25, neckTilt: 1.25, head: 0.62, snout: 0, coat: '#9a9aa6', coat2: '#8e8e9a', mark: '#7c7c88', dark: '#3a3a44', stride: 2.2, speed: 1.6 },
  camel: { name: 'camel', hip: 1.35, len: 1.45, r: 0.5, legR: 0.08, neck: 1.15, neckTilt: 0.95, head: 0.22, snout: 0.26, coat: '#d4a464', coat2: '#c89858', mark: '#b08048', dark: '#4a3424', stride: 2.2, speed: 2.0 },
  horse: { name: 'horse', hip: 0.95, len: 1.35, r: 0.42, legR: 0.075, neck: 0.8, neckTilt: 0.62, head: 0.2, snout: 0.3, coat: '#8a5634', coat2: '#d8cab4', mark: '#6a4024', dark: '#2a1c14', stride: 2.0, speed: 2.6 },
  cow: { name: 'cow', hip: 0.78, len: 1.5, r: 0.5, legR: 0.08, neck: 0.42, neckTilt: 1.05, head: 0.22, snout: 0.22, coat: '#a8754a', coat2: '#b8865a', mark: '#f2ead8', dark: '#3a2a20', stride: 1.7, speed: 1.5 },
  goat: { name: 'goat', hip: 0.46, len: 0.78, r: 0.27, legR: 0.045, neck: 0.32, neckTilt: 0.7, head: 0.15, snout: 0.16, coat: '#e8ddc8', coat2: '#6a4a34', mark: '#3a2a20', dark: '#2a201a', stride: 1.0, speed: 1.8 },
  sheep: { name: 'sheep', hip: 0.42, len: 0.78, r: 0.4, legR: 0.05, neck: 0.18, neckTilt: 0.9, head: 0.16, snout: 0.12, coat: '#f3eee2', coat2: '#e8e0d0', mark: '#d8d0c0', dark: '#3a302a', stride: 0.9, speed: 1.6 },
};

/** A simple painted icon of each kind, for the boarding pads. */
export function drawBeastIcon(g: CanvasRenderingContext2D, kind: BeastKind) {
  g.fillStyle = '#6a4426';
  const el = (x: number, y: number, rx: number, ry: number, rot = 0) => {
    g.beginPath();
    g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    g.fill();
  };
  const leg = (x: number, y: number, w: number, h: number) => g.fillRect(x - w / 2, y, w, h);
  if (kind === 'giraffe') {
    el(110, 150, 38, 22);
    [86, 100, 122, 136].forEach((x) => leg(x, 160, 7, 52));
    g.save();
    g.translate(140, 140);
    g.rotate(0.35);
    g.fillRect(-6, -90, 13, 92);
    g.restore();
    el(176, 58, 20, 11, 0.4);
    leg(170, 36, 4, 12);
  } else if (kind === 'elephant') {
    el(118, 138, 58, 42);
    [80, 100, 136, 156].forEach((x) => leg(x, 160, 18, 44));
    el(178, 118, 26, 26);
    el(166, 112, 16, 26);
    g.lineWidth = 12;
    g.strokeStyle = '#6a4426';
    g.beginPath();
    g.moveTo(196, 124);
    g.quadraticCurveTo(212, 170, 196, 190);
    g.stroke();
  } else if (kind === 'camel') {
    el(120, 140, 44, 24);
    el(116, 116, 22, 20);
    [90, 104, 134, 148].forEach((x) => leg(x, 150, 7, 56));
    g.save();
    g.translate(158, 136);
    g.rotate(-0.9);
    g.fillRect(-6, -50, 12, 54);
    g.restore();
    el(196, 92, 18, 10, 0.2);
  } else if (kind === 'sheep') {
    for (const [x, y, r] of [[100, 132, 28], [130, 126, 30], [156, 136, 26], [124, 150, 30], [94, 152, 22]] as const) el(x, y, r, r * 0.85);
    [100, 116, 140, 156].forEach((x) => leg(x, 160, 7, 34));
    el(184, 128, 18, 14, 0.3);
  } else {
    el(120, 136, 46, 24);
    [88, 102, 138, 152].forEach((x) => leg(x, 150, 8, 50));
    g.save();
    g.translate(160, 122);
    g.rotate(0.6);
    g.fillRect(-10, -48, 20, 52);
    g.restore();
    el(190, 82, 24, 12, 0.6);
    g.save();
    g.translate(66, 130);
    g.rotate(0.5);
    g.fillRect(-5, 0, 10, 42);
    g.restore();
  }
}

const mat = (c: string, map?: THREE.Texture, rough = 0.85) => new THREE.MeshStandardMaterial(map ? { color: '#ffffff', map, roughness: rough } : { color: c, roughness: rough });

const HL = '#fff2c0';
function Hl({ on, k = 1 }: { on: boolean; k?: number }) {
  return on ? <Outlines thickness={0.035 * k} color={HL} /> : null;
}

export function Beast<K extends Animal>({ agent, highlight = false, onDown, onTap }: { agent: Agent<K>; highlight?: boolean; onDown?: (a: Agent<K>, e: ThreeEvent<PointerEvent>) => void; onTap?: (a: Agent<K>) => void }) {
  const s = SPECS[agent.kind];
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Group>(null);
  const headG = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const ears = useRef<THREE.Group[]>([]);
  const trunk = useRef<THREE.Group[]>([]);
  const legs = useRef<{ hip: THREE.Group | null; knee: THREE.Group | null }[]>([0, 1, 2, 3].map(() => ({ hip: null, knee: null })));
  const shadowRef = useRef<THREE.Mesh>(null);
  const flick = useRef(0);
  const mats = useMemo(() => {
    const lk = agent.look ?? {};
    const base = lk.coat ?? (agent.mate ? s.coat2 : s.coat);
    const tex =
      agent.kind === 'giraffe' || agent.kind === 'elephant' || agent.kind === 'horse' || agent.kind === 'cow' || agent.kind === 'goat'
        ? coatTexture(lk.patches ? 'patches' : agent.kind, base, lk.mark ?? s.mark)
        : undefined;
    if (tex) tex.repeat.set(agent.kind === 'giraffe' ? 2 : 1, agent.kind === 'giraffe' ? 2 : 1);
    return {
      coat: mat(base, tex),
      plain: mat(base),
      dark: mat(s.dark, undefined, 0.7),
      mark: mat(s.mark),
      hoof: mat('#3a2a20', undefined, 0.6),
      eye: new THREE.MeshStandardMaterial({ color: '#16100c', roughness: 0.2 }),
      shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      ivory: mat('#f2ead8'),
      pink: mat('#d89a90'),
      wood: mat('#7a5232', undefined, 0.8),
    };
  }, [agent.kind, agent.mate, agent.look, s]);

  // Layout of the rig.
  const hx = s.r * (agent.kind === 'elephant' ? 0.55 : 0.5);
  const hz = s.len * 0.42;
  const upper = s.hip * 0.52;
  const lower = s.hip * 0.5;
  const bodyY = s.hip + s.r * 0.35;
  const legSpots: [number, number, boolean][] = [
    [-hx, hz, true],
    [hx, hz, true],
    [-hx, -hz, false],
    [hx, -hz, false],
  ];
  // Four-beat walk: back-left, front-left, back-right, front-right.
  const legPhase = [Math.PI * 0.5, Math.PI * 1.5, 0, Math.PI];

  useFrame((st, dt) => {
    const g = root.current;
    if (!g) return;
    g.position.copy(agent.pos);
    // Free animals (see creatures/mind.ts) turn their heads to watch and lie down to rest.
    const mind = (agent as { mind?: { look: number; rest: number } }).mind;
    const rest = mind?.rest ?? 0;
    const look = mind?.look ?? 0;
    g.position.y -= rest * s.hip * 0.62;
    let d = agent.yaw - g.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    g.rotation.y += d * Math.min(1, dt * 5);
    const t = st.clock.elapsedTime + agent.scale * 13;
    const sf = Math.min(1, agent.speed / (s.speed * 0.8));
    const ph = agent.phase;
    for (let i = 0; i < 4; i++) {
      const L = legs.current[i];
      if (!L.hip || !L.knee) continue;
      const p = ph + legPhase[i];
      const front = legSpots[i][2];
      L.hip.rotation.x = Math.sin(p) * 0.42 * sf + rest * (front ? 1.35 : -1.35);
      // Knees fold while the foot swings forward (front knees bend back, hocks forward); lying down tucks them under.
      L.knee.rotation.x = Math.max(0, Math.sin(p + Math.PI / 2)) * 0.75 * sf * (front ? 1 : -1) + rest * (front ? -2.5 : 2.5);
    }
    if (torso.current) {
      torso.current.position.y = motion.reduced ? 0 : Math.abs(Math.sin(ph)) * 0.035 * sf * s.hip;
      torso.current.rotation.z = motion.reduced ? 0 : Math.sin(ph) * 0.025 * sf;
    }
    if (neck.current) {
      const down = agent.graze;
      const bob = Math.sin(ph * 2) * 0.05 * sf;
      // Positive x tilts the neck forward (the animal faces +z); grazing bends it down.
      neck.current.rotation.x = s.neckTilt * (1 - down) + (agent.kind === 'giraffe' ? 1.0 : agent.kind === 'elephant' ? 1.35 : 1.75) * down + bob;
      neck.current.rotation.order = 'YXZ';
      neck.current.rotation.y = look * 0.75;
    }
    if (headG.current && neck.current) {
      headG.current.rotation.x = -neck.current.rotation.x + 0.12 + 0.75 * agent.graze + Math.sin(t * 0.7) * 0.04;
      headG.current.rotation.y = Math.sin(t * 0.33) * 0.18 * (1 - sf) * (1 - Math.min(1, Math.abs(look) * 2)) + look * 0.25;
    }
    if (tail.current) tail.current.rotation.z = Math.sin(t * 2.3) * 0.35 + Math.sin(t * 5.1) * 0.08;
    flick.current -= dt;
    if (flick.current < -3 - (agent.scale * 7) % 3) flick.current = 0.25;
    ears.current.forEach((e, i) => {
      if (!e) return;
      const f = flick.current > 0 && i === 0 ? Math.sin(flick.current * 25) * 0.4 : 0;
      if (agent.kind === 'elephant') e.rotation.y = (i ? -1 : 1) * (0.2 + Math.sin(t * 1.3 + i) * 0.18);
      else e.rotation.z = (i ? -1 : 1) * (0.9 + f);
    });
    trunk.current.forEach((seg, i) => {
      if (seg) seg.rotation.x = 0.18 + Math.sin(t * 1.1 - i * 0.6) * 0.16 + agent.graze * 0.12;
    });
    if (shadowRef.current) shadowRef.current.position.y = 0.04 + rest * s.hip * 0.62;
  });

  const tapProps = {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onDown?.(agent, e);
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (e.delta > 8) return;
      e.stopPropagation();
      onTap?.(agent);
    },
  };

  const k = agent.kind;
  const hl = highlight;
  const eyes = (y: number, z: number, w: number, r: number) =>
    [-1, 1].map((sd) => (
      <group key={sd} position={[sd * w, y, z]}>
        <mesh material={mats.eye}>
          <sphereGeometry args={[r, 10, 8]} />
        </mesh>
        <mesh material={mats.shine} position={[sd * r * 0.2, r * 0.35, r * 0.75]}>
          <sphereGeometry args={[r * 0.28, 6, 6]} />
        </mesh>
      </group>
    ));

  return (
    <group ref={root} scale={agent.scale} name={`beast-${agent.id}`} {...tapProps}>
      <mesh ref={shadowRef} rotation-x={-Math.PI / 2} renderOrder={1}>
        <circleGeometry args={[Math.max(s.r * 1.4, s.len * 0.75), 24]} />
        <meshBasicMaterial color="#1a1208" transparent opacity={0.26} depthWrite={false} />
      </mesh>
      {/* Legs: hip joint, upper leg, knee joint, lower leg, hoof. */}
      {legSpots.map(([x, z, front], i) => (
        <group key={i} position={[x, s.hip, z]} ref={(r) => void (legs.current[i].hip = r)}>
          <mesh material={k === 'sheep' ? mats.dark : mats.coat} position-y={-upper / 2} castShadow>
            <capsuleGeometry args={[s.legR * (k === 'elephant' ? 1.1 : 1.35), upper, 4, 10]} />
          </mesh>
          <group position-y={-upper} ref={(r) => void (legs.current[i].knee = r)}>
            <mesh material={k === 'sheep' || k === 'horse' ? mats.dark : mats.coat} position-y={-lower / 2} castShadow>
              <capsuleGeometry args={[s.legR, lower, 4, 10]} />
            </mesh>
            <mesh material={k === 'elephant' ? mats.ivory : mats.hoof} position={[0, -lower + 0.02, front ? 0.01 : 0]} scale={[1, 0.5, 1.1]}>
              <sphereGeometry args={[s.legR * (k === 'elephant' ? 1.15 : 1.15), 10, 8]} />
            </mesh>
          </group>
        </group>
      ))}
      <group ref={torso}>
        {/* Body. */}
        {k === 'sheep' ? (
          <>
            {[[0, 0, 0, 0.42], [0.2, 0.1, 0.2, 0.3], [-0.2, 0.1, 0.2, 0.3], [0.21, 0.08, -0.22, 0.3], [-0.21, 0.08, -0.22, 0.3], [0, 0.24, 0.02, 0.32], [0, 0.05, 0.36, 0.26], [0, 0.04, -0.38, 0.26]].map(([x, y, z, r], i) => (
              <mesh key={i} material={mats.plain} position={[x, bodyY + y, z]} castShadow>
                <sphereGeometry args={[r, 14, 10]} />
                <Hl on={hl} />
              </mesh>
            ))}
          </>
        ) : (
          <mesh material={mats.coat} position={[0, bodyY, 0]} rotation-x={Math.PI / 2} scale={[1, 1, k === 'giraffe' ? 1.0 : 0.92]} castShadow>
            <capsuleGeometry args={[s.r, s.len - s.r * (k === 'elephant' ? 0.6 : 0.4), 8, 18]} />
            <Hl on={hl} />
          </mesh>
        )}
        {k === 'camel' && (
          <mesh material={mats.plain} position={[0, bodyY + s.r * 0.75, -0.05]} scale={[0.75, 0.85, 1]} castShadow>
            <sphereGeometry args={[0.42, 16, 12]} />
            <Hl on={hl} />
          </mesh>
        )}
        {/* Tail. */}
        <group ref={tail} position={[0, bodyY + s.r * 0.35, -s.len / 2 - s.r * 0.3]} rotation-x={-0.35}>
          <mesh material={k === 'horse' ? mats.dark : mats.plain} position-y={-(k === 'horse' ? 0.35 : 0.22) * (k === 'elephant' ? 1.4 : 1)} scale={k === 'horse' ? [1.6, 1, 1.2] : [1, 1, 1]}>
            <capsuleGeometry args={[k === 'horse' ? 0.07 : 0.035, k === 'horse' ? 0.62 : k === 'sheep' ? 0.12 : 0.42, 4, 8]} />
          </mesh>
          {(k === 'giraffe' || k === 'elephant' || k === 'camel') && (
            <mesh material={mats.dark} position-y={-0.5 * (k === 'elephant' ? 1.4 : 1)}>
              <sphereGeometry args={[0.07, 8, 6]} />
            </mesh>
          )}
        </group>
        {agent.look?.yoke && (
          <group position={[0, bodyY + s.r * 0.75, s.len / 2 - s.r * 0.35]}>
            <mesh material={mats.wood} rotation-z={Math.PI / 2} castShadow>
              <capsuleGeometry args={[0.06, s.r * 2.6, 4, 8]} />
            </mesh>
            {[-1, 1].map((sd) => (
              <mesh key={sd} material={mats.wood} position={[sd * s.r * 0.55, -s.r * 0.45, 0]}>
                <cylinderGeometry args={[0.03, 0.03, s.r * 0.9, 6]} />
              </mesh>
            ))}
          </group>
        )}
        {/* Neck and head. */}
        <group ref={neck} position={[0, bodyY + s.r * 0.35, s.len / 2 - s.r * 0.2]} rotation-x={s.neckTilt}>
          {s.neck > 0.3 && (
            <mesh material={mats.coat} position-y={s.neck / 2} castShadow>
              <capsuleGeometry args={[k === 'giraffe' ? 0.13 : k === 'horse' ? 0.17 : 0.15, s.neck, 6, 12]} />
              <Hl on={hl} k={0.8} />
            </mesh>
          )}
          {k === 'horse' && (
            <mesh material={mats.dark} position={[0, s.neck / 2 + 0.05, -0.12]} scale={[0.35, 1, 0.5]}>
              <capsuleGeometry args={[0.13, s.neck, 4, 8]} />
            </mesh>
          )}
          {k === 'giraffe' && (
            <mesh material={mats.mark} position={[0, s.neck / 2, -0.11]} scale={[0.3, 1, 0.4]}>
              <capsuleGeometry args={[0.1, s.neck * 0.95, 4, 8]} />
            </mesh>
          )}
          <group ref={headG} position-y={Math.max(s.neck, 0.1)}>
            {/* Skull and muzzle. */}
            <mesh material={k === 'sheep' ? mats.dark : mats.coat} scale={[1, 0.95, 1.1]} castShadow>
              <sphereGeometry args={[s.head, 18, 14]} />
              <Hl on={hl} k={0.7} />
            </mesh>
            {s.snout > 0 && (
              <mesh material={k === 'sheep' ? mats.dark : mats.plain} position={[0, -s.head * 0.25, s.head * 0.9]} rotation-x={Math.PI / 2 - 0.25} scale={[0.85, 1, 0.8]}>
                <capsuleGeometry args={[s.head * 0.62, s.snout, 6, 12]} />
              </mesh>
            )}
            {k === 'sheep' && (
              <mesh material={mats.plain} position={[0, s.head * 0.65, -0.02]}>
                <sphereGeometry args={[s.head * 0.75, 12, 10]} />
              </mesh>
            )}
            {eyes(s.head * 0.25, s.head * 0.72, s.head * (k === 'elephant' ? 0.55 : 0.6), s.head * (k === 'elephant' ? 0.09 : 0.17))}
            {/* Ears. */}
            {[-1, 1].map((sd, i) => (
              <group key={sd} ref={(r) => void (r && (ears.current[i] = r))} position={[sd * s.head * (k === 'elephant' ? 0.85 : 0.75), s.head * (k === 'elephant' ? 0.1 : 0.55), -s.head * 0.1]}>
                {k === 'elephant' ? (
                  <mesh material={mats.coat} position={[sd * 0.32, -0.1, -0.12]} scale={[0.85, 1.1, 0.12]}>
                    <sphereGeometry args={[0.5, 16, 12]} />
                  </mesh>
                ) : (
                  <mesh material={k === 'sheep' ? mats.dark : mats.coat} position-y={s.head * 0.35} scale={[0.45, 1, 0.25]}>
                    <sphereGeometry args={[s.head * 0.45, 10, 8]} />
                  </mesh>
                )}
              </group>
            ))}
            {k === 'giraffe' &&
              [-1, 1].map((sd) => (
                <group key={sd} position={[sd * 0.08, s.head * 0.9, -0.05]}>
                  <mesh material={mats.coat} position-y={0.08}>
                    <capsuleGeometry args={[0.025, 0.14, 4, 6]} />
                  </mesh>
                  <mesh material={mats.dark} position-y={0.18}>
                    <sphereGeometry args={[0.04, 8, 6]} />
                  </mesh>
                </group>
              ))}
            {k === 'elephant' && (
              <>
                {[0, 1, 2].reduceRight<React.ReactNode>(
                  (inner, i) => (
                    <group ref={(r) => void (r && (trunk.current[i] = r))} position={i === 0 ? [0, -s.head * 0.35, s.head * 0.8] : [0, -0.34, 0]} rotation-x={0.2}>
                      <mesh material={mats.coat} position-y={-0.17} castShadow>
                        <capsuleGeometry args={[0.15 - i * 0.03, 0.26, 4, 10]} />
                      </mesh>
                      {inner}
                    </group>
                  ),
                  null,
                )}
                {[-1, 1].map((sd) => (
                  <mesh key={sd} material={mats.ivory} position={[sd * 0.2, -s.head * 0.55, s.head * 0.7]} rotation-x={0.9}>
                    <coneGeometry args={[0.05, 0.32, 8]} />
                  </mesh>
                ))}
              </>
            )}
            {(k === 'cow' || k === 'goat') &&
              [-1, 1].map((sd) => (
                <mesh key={sd} material={k === 'cow' ? mats.ivory : mats.dark} position={[sd * s.head * 0.45, s.head * 0.85, -s.head * 0.15]} rotation={[k === 'goat' ? -0.7 : -0.2, 0, sd * (k === 'cow' ? -1.1 : -0.25)]}>
                  <coneGeometry args={[s.head * 0.14, s.head * (k === 'cow' ? 0.7 : 1.1), 8]} />
                </mesh>
              ))}
            {k === 'goat' && (
              <mesh material={mats.dark} position={[0, -s.head * 0.85, s.head * 0.95]} scale={[0.5, 1, 0.5]}>
                <coneGeometry args={[0.05, 0.16, 6]} />
              </mesh>
            )}
            {agent.look?.grey && (
              <mesh material={mats.ivory} position={[0, -s.head * 0.25, s.head * 1.05]} scale={[0.9, 0.9, 0.8]}>
                <sphereGeometry args={[s.head * 0.62, 10, 8]} />
              </mesh>
            )}
            {k === 'horse' && (
              <mesh material={mats.dark} position={[0, s.head * 0.7, s.head * 0.35]} rotation-x={-0.3} scale={[0.4, 0.8, 1]}>
                <sphereGeometry args={[0.12, 8, 6]} />
              </mesh>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}
