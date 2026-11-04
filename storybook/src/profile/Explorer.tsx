// The explorer figure, drawn in the same rounded, hand-made way as the rest of
// the worlds, dressed from a Look. With the default look it is the original
// explorer exactly. It can follow the player in a world, or play a chosen
// animation in the dressing room.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { motion, player, weather } from '@/ark/shared';
import type { Look, Pattern } from './look';

export type Anim = 'idle' | 'walk' | 'wave' | 'cheer' | 'sit' | 'point';

const m = (color: string, rough = 0.8) => new THREE.MeshStandardMaterial({ color, roughness: rough });

const shade = (hex: string, k: number) => {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return `#${c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + k))).getHexString()}`;
};

/** A soft woven pattern painted on a small canvas, in two tones of one colour. */
function fabric(color: string, pattern: Pattern): THREE.Texture | null {
  if (pattern === 'plain' || typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = color;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = shade(color, 0.14);
  if (pattern === 'stripes') for (let y = 0; y < 64; y += 16) g.fillRect(0, y, 64, 7);
  if (pattern === 'checks') {
    g.globalAlpha = 0.6;
    for (let y = 0; y < 64; y += 16) g.fillRect(0, y, 64, 7);
    for (let x = 0; x < 64; x += 16) g.fillRect(x, 0, 7, 64);
  }
  if (pattern === 'dots') for (let y = 8; y < 64; y += 16) for (let x = (y / 16) % 2 ? 0 : 8; x < 64; x += 16) g.beginPath(), g.arc(x, y, 3.5, 0, Math.PI * 2), g.fill();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function useMats(look: Look) {
  const key = JSON.stringify(look);
  const mats = useMemo(() => {
    const top = m(look.pattern === 'plain' ? look.topColor : '#ffffff');
    top.map = fabric(look.topColor, look.pattern);
    return {
      skin: m(look.skin, 0.7),
      hair: m(look.hairColor, 0.6),
      shirt: top,
      vest: m(look.outerColor),
      trousers: m(look.bottomColor),
      boots: m(look.shoesColor, 0.6),
      pack: m(look.packColor),
      roll: m('#e6d2a6'),
      strap: m('#5a3a26'),
      head: m(look.headColor, 0.85),
      eye: new THREE.MeshStandardMaterial({ color: look.eyes, roughness: 0.3 }),
      shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      cheek: new THREE.MeshStandardMaterial({ color: '#e08a70', roughness: 0.9, transparent: true, opacity: 0.5 }),
      freckle: new THREE.MeshStandardMaterial({ color: shade(look.skin, -0.18), roughness: 0.9 }),
      mouth: new THREE.MeshStandardMaterial({ color: '#8a3a2a', roughness: 0.8 }),
      frame: new THREE.MeshStandardMaterial({ color: '#3a2a1e', metalness: 0.3, roughness: 0.5 }),
      clip: m('#e8b04a', 0.5),
      glass: new THREE.MeshStandardMaterial({ color: '#ffd58a', emissive: '#ffb050', emissiveIntensity: 2.4 }),
      brass: new THREE.MeshStandardMaterial({ color: '#b08a40', metalness: 0.6, roughness: 0.4 }),
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => Object.values(mats).forEach((x) => (x.map?.dispose(), x.dispose())), [mats]);
  return mats;
}

const BUILD = { little: { s: 0.94, head: 1.08 }, middle: { s: 1.05, head: 1 }, older: { s: 1.16, head: 0.93 } };

/**
 * The explorer. `follow` makes it walk with the player in a world; otherwise
 * it stands at the origin and plays `anim` (read every frame from the ref, so
 * the dressing room can change it without re-rendering).
 */
export function Explorer({ look, follow, anim, lantern: withLantern = true }: { look: Look; follow?: boolean; anim?: { current: Anim }; lantern?: boolean }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const lantern = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const mats = useMats(look);
  const lookAround = useRef(0);
  const ph = useRef(0);
  useFrame((st, dt) => {
    const g = root.current;
    if (!g) return;
    const t = st.clock.elapsedTime;
    const a: Anim = follow ? 'walk' : anim?.current ?? 'idle';
    let sp = 0;
    let run = 0;
    if (follow) {
      g.position.copy(player.pos);
      let d = player.yaw - g.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      g.rotation.y += d * Math.min(1, dt * 12);
      sp = Math.min(1, player.speed / 4.2);
      run = Math.max(0, (player.speed - 4.5) / 3);
      ph.current = player.phase;
    } else if (a === 'walk') {
      sp = 0.8;
      ph.current += dt * 7;
    } else ph.current = 0;
    const swing = Math.sin(ph.current) * (0.55 + run * 0.35) * sp;
    const L = legL.current, R = legR.current, AL = armL.current, AR = armR.current;
    if (L && R && AL && AR) {
      L.rotation.x = swing;
      R.rotation.x = -swing;
      AL.rotation.x = -swing * 0.9;
      AR.rotation.x = swing * 0.6 - 0.25 * sp;
      AL.rotation.z = 0.12;
      AR.rotation.z = -0.12;
      const k = motion.reduced ? 0 : 1;
      if (a === 'wave') {
        AR.rotation.x = 0;
        AR.rotation.z = -2.6 + Math.sin(t * 8) * 0.35 * k;
      }
      if (a === 'point') {
        AR.rotation.x = -1.45;
        AR.rotation.z = -0.1;
      }
      if (a === 'cheer') {
        AL.rotation.z = 2.5 + Math.sin(t * 9) * 0.2 * k;
        AR.rotation.z = -2.5 - Math.sin(t * 9) * 0.2 * k;
      }
      if (a === 'sit') {
        L.rotation.x = R.rotation.x = -1.45;
        AL.rotation.x = AR.rotation.x = -0.5;
      }
    }
    if (body.current) {
      const bob = motion.reduced ? 0 : Math.abs(Math.sin(ph.current)) * 0.06 * sp;
      const breathe = Math.sin(t * 2.2) * 0.012 * (1 - sp);
      const hop = a === 'cheer' && !motion.reduced ? Math.abs(Math.sin(t * 4.5)) * 0.12 : 0;
      body.current.position.y = bob + breathe + hop + (a === 'sit' ? -0.38 : 0);
      body.current.rotation.x = a === 'sit' ? -0.05 : 0.08 * sp + run * 0.12;
    }
    if (head.current) {
      lookAround.current += ((sp < 0.1 && a === 'idle' ? Math.sin(t * 0.4) * 0.5 : 0) - lookAround.current) * Math.min(1, dt * 2);
      head.current.rotation.y = lookAround.current;
      head.current.rotation.x = -0.05 * sp;
    }
    if (lantern.current) lantern.current.rotation.x = -swing * 0.5 + Math.sin(t * 1.7) * 0.05;
    if (light.current) {
      const want = !follow ? 0.4 : player.inside || weather.storm > 0.3 ? 1 : 0.15;
      light.current.intensity += (want * 6 - light.current.intensity) * Math.min(1, dt * 2);
    }
  });
  const B = BUILD[look.build];
  const hijab = look.head === 'hijab';
  const long = look.top !== 'shirt' || look.bottom === 'skirt';
  const sleeve = look.outer === 'jacket' || look.outer === 'raincoat' ? mats.vest : mats.shirt;
  const tall = look.shoes === 'wellies' || look.shoes === 'sandboots';
  return (
    <group ref={root} scale={B.s}>
      {/* Soft contact shadow. */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.03} renderOrder={1}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#1a1208" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <group ref={body}>
        {/* Legs, pivoting at the hips. */}
        {[
          [legL, -0.1],
          [legR, 0.1],
        ].map(([ref, x]) => (
          <group key={x as number} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 0.58, 0]}>
            <mesh material={mats.trousers} position-y={-0.24} castShadow>
              <capsuleGeometry args={[0.085, 0.36, 4, 10]} />
            </mesh>
            {look.shoes === 'shoes' ? (
              <mesh material={mats.boots} position={[0, -0.55, 0.05]} scale={[0.95, 0.5, 1.4]} castShadow>
                <sphereGeometry args={[0.095, 12, 10]} />
              </mesh>
            ) : (
              <mesh material={mats.boots} position={[0, -0.53, 0.04]} scale={[1, 0.7, 1.35]} castShadow>
                <sphereGeometry args={[0.1, 12, 10]} />
              </mesh>
            )}
            {tall && (
              <mesh material={mats.boots} position-y={-0.4}>
                <cylinderGeometry args={[0.1, 0.1, look.shoes === 'wellies' ? 0.26 : 0.16, 12]} />
              </mesh>
            )}
          </group>
        ))}
        {/* Body: top and outer layer. */}
        <mesh material={mats.shirt} position-y={0.82} scale={[1, 1.05, 0.85]} castShadow>
          <capsuleGeometry args={[0.2, 0.26, 6, 14]} />
        </mesh>
        {look.top === 'tunic' && (
          <mesh material={mats.shirt} position-y={0.52} castShadow>
            <cylinderGeometry args={[0.19, 0.25, 0.36, 16, 1, true]} />
          </mesh>
        )}
        {look.top === 'dress' && (
          <mesh material={mats.shirt} position-y={0.36} castShadow>
            <cylinderGeometry args={[0.19, 0.31, 0.64, 18, 1, true]} />
          </mesh>
        )}
        {look.top !== 'dress' && look.bottom === 'skirt' && (
          <mesh material={mats.trousers} position-y={0.36} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 0.6, 18, 1, true]} />
          </mesh>
        )}
        {look.outer === 'vest' && (
          <mesh material={mats.vest} position={[0, 0.84, 0.02]} scale={[1.06, 0.9, 0.9]}>
            <capsuleGeometry args={[0.2, 0.2, 6, 14]} />
          </mesh>
        )}
        {(look.outer === 'jacket' || look.outer === 'raincoat') && (
          <group>
            <mesh material={mats.vest} position={[0, 0.83, 0]} scale={[1.08, 1.05, 0.92]} castShadow>
              <capsuleGeometry args={[0.2, 0.26, 6, 14]} />
            </mesh>
            <mesh material={mats.strap} position={[0, 0.82, 0.19]} scale={[0.06, 1, 0.2]}>
              <boxGeometry args={[0.4, 0.44, 0.1]} />
            </mesh>
            {look.outer === 'raincoat' && (
              <>
                <mesh material={mats.vest} position-y={0.5} castShadow>
                  <cylinderGeometry args={[0.22, long ? 0.33 : 0.27, 0.32, 16, 1, true]} />
                </mesh>
                {!hijab && look.head !== 'sunhat' && (
                  <mesh material={mats.vest} position={[0, 1.2, -0.17]} scale={[1, 0.8, 0.7]}>
                    <sphereGeometry args={[0.2, 14, 10]} />
                  </mesh>
                )}
              </>
            )}
          </group>
        )}
        {/* Arms, pivoting at the shoulders. */}
        {[
          [armL, -0.25],
          [armR, 0.25],
        ].map(([ref, x]) => (
          <group key={x as number} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 1.0, 0]}>
            <mesh material={sleeve} position-y={-0.2} castShadow>
              <capsuleGeometry args={[0.065, 0.3, 4, 10]} />
            </mesh>
            <mesh material={mats.skin} position-y={-0.42}>
              <sphereGeometry args={[0.07, 10, 8]} />
            </mesh>
            {(x as number) > 0 && withLantern && (
              <group ref={lantern} position={[0, -0.46, 0.05]}>
                <mesh material={mats.brass} position-y={-0.05}>
                  <torusGeometry args={[0.04, 0.008, 6, 12]} />
                </mesh>
                <mesh material={mats.glass} position-y={-0.16}>
                  <cylinderGeometry args={[0.05, 0.06, 0.12, 10]} />
                </mesh>
                <mesh material={mats.brass} position-y={-0.09}>
                  <coneGeometry args={[0.065, 0.05, 10]} />
                </mesh>
                <pointLight ref={light} color="#ffb860" intensity={1} distance={7} decay={1.6} position-y={-0.16} />
              </group>
            )}
          </group>
        ))}
        {/* Backpack with a rolled blanket, or a small bag on a strap. */}
        {look.pack === 'backpack' && (
          <group position={[0, 0.88, -0.22]}>
            <mesh material={mats.pack} scale={[1, 1.1, 0.7]} castShadow>
              <capsuleGeometry args={[0.17, 0.16, 6, 12]} />
            </mesh>
            <mesh material={mats.roll} position={[0, 0.26, -0.02]} rotation-z={Math.PI / 2}>
              <capsuleGeometry args={[0.07, 0.3, 4, 10]} />
            </mesh>
            <mesh material={mats.strap} position={[0, -0.02, -0.12]} scale={[1, 1, 0.4]}>
              <sphereGeometry args={[0.1, 10, 8]} />
            </mesh>
          </group>
        )}
        {look.pack === 'satchel' && (
          <group>
            <mesh material={mats.strap} position={[0, 0.86, 0]} rotation={[0, 0, 0.75]} scale={[1, 1, 0.9]}>
              <torusGeometry args={[0.27, 0.014, 6, 24]} />
            </mesh>
            <mesh material={mats.pack} position={[-0.24, 0.6, 0.06]} castShadow>
              <boxGeometry args={[0.1, 0.18, 0.22]} />
            </mesh>
          </group>
        )}
        {/* Neck scarf. */}
        {look.head === 'scarf' && (
          <group>
            <mesh material={mats.head} position-y={1.1} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.13, 0.05, 8, 18]} />
            </mesh>
            <mesh material={mats.head} position={[0.08, 0.98, 0.15]} rotation-z={0.2}>
              <capsuleGeometry args={[0.035, 0.14, 4, 8]} />
            </mesh>
          </group>
        )}
        {/* Hijab: covers the hair, neck and shoulders, leaving the face open. */}
        {hijab && (
          <mesh material={mats.head} position-y={1.07}>
            <cylinderGeometry args={[0.17, 0.3, 0.26, 20, 1, true]} />
          </mesh>
        )}
        {/* Head. */}
        <group ref={head} position-y={1.32} scale={B.head}>
          <mesh material={mats.skin} scale={[1, 1.02, 0.96]} castShadow>
            <sphereGeometry args={[0.25, 24, 18]} />
          </mesh>
          {hijab ? (
            <mesh position={[0, 0.0, -0.01]} scale={[1.12, 1.14, 1.08]}>
              <sphereGeometry args={[0.25, 24, 18, Math.PI / 2 + 0.75, Math.PI * 2 - 1.5]} />
              <meshStandardMaterial attach="material" color={look.headColor} roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
          ) : (
            <HairDo look={look} mats={mats} />
          )}
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh material={mats.eye} position={[s * 0.085, 0.0, 0.225]} scale={look.face === 'bright' ? [0.95, 1.25, 0.5] : [0.8, 1.1, 0.5]}>
                <sphereGeometry args={[0.04, 12, 10]} />
              </mesh>
              <mesh material={mats.shine} position={[s * 0.085 + 0.012, 0.018, 0.245]} scale={look.face === 'bright' ? 1.4 : 1}>
                <sphereGeometry args={[0.011, 6, 6]} />
              </mesh>
              {look.face !== 'soft' && (
                <mesh material={mats.cheek} position={[s * 0.14, -0.07, 0.19]} scale={[1, 0.6, 0.4]}>
                  <sphereGeometry args={[0.04, 10, 8]} />
                </mesh>
              )}
              {look.face === 'freckles' &&
                [0, 1, 2].map((k) => (
                  <mesh key={k} material={mats.freckle} position={[s * (0.11 + k * 0.025), -0.045 - (k % 2) * 0.02, 0.215 - k * 0.012]}>
                    <sphereGeometry args={[0.007, 5, 4]} />
                  </mesh>
                ))}
              {!hijab && (
                <mesh material={mats.skin} position={[s * 0.25, 0, 0]} scale={[0.5, 0.9, 0.7]}>
                  <sphereGeometry args={[0.06, 10, 8]} />
                </mesh>
              )}
              {look.glasses && (
                <mesh material={mats.frame} position={[s * 0.085, 0.0, 0.25]}>
                  <torusGeometry args={[0.052, 0.008, 6, 18]} />
                </mesh>
              )}
            </group>
          ))}
          {look.glasses && (
            <mesh material={mats.frame} position={[0, 0.005, 0.255]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.006, 0.006, 0.07, 5]} />
            </mesh>
          )}
          <mesh material={mats.skin} position={[0, -0.04, 0.245]}>
            <sphereGeometry args={[0.03, 10, 8]} />
          </mesh>
          {look.face === 'soft' && (
            <mesh material={mats.mouth} position={[0, -0.1, 0.225]} rotation={[0.25, 0, Math.PI]}>
              <torusGeometry args={[0.035, 0.007, 5, 12, Math.PI]} />
            </mesh>
          )}
          <HeadWear look={look} mats={mats} />
        </group>
      </group>
    </group>
  );
}

type Mats = ReturnType<typeof useMats>;

function HairDo({ look, mats }: { look: Look; mats: Mats }) {
  const cover = look.head === 'sunhat' || look.head === 'cap' || look.head === 'woolhat';
  const cap = (
    <mesh material={mats.hair} position={[0, 0.06, -0.03]} scale={look.hair === 'shaved' ? [1.02, 0.97, 1.0] : [1.08, 0.95, 1.06]}>
      <sphereGeometry args={[0.25, 22, 16, 0, Math.PI * 2, 0, Math.PI * (look.hair === 'shaved' ? 0.5 : 0.58)]} />
    </mesh>
  );
  return (
    <group>
      {cap}
      {look.hair !== 'shaved' && !cover && (
        <mesh material={mats.hair} position={[0, 0.13, 0.17]} rotation-x={0.5} scale={[1.3, 0.45, 0.6]}>
          <sphereGeometry args={[0.13, 14, 10]} />
        </mesh>
      )}
      {look.hair === 'curly' && !cover &&
        Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return (
            <mesh key={i} material={mats.hair} position={[Math.cos(a) * 0.2, 0.14 + Math.sin(i * 1.7) * 0.03, Math.sin(a) * 0.2 - 0.03]}>
              <sphereGeometry args={[0.075, 10, 8]} />
            </mesh>
          );
        })}
      {look.hair === 'long' && (
        <mesh material={mats.hair} position={[0, -0.08, -0.13]} scale={[1.05, 1, 0.55]}>
          <capsuleGeometry args={[0.2, 0.22, 6, 12]} />
        </mesh>
      )}
      {look.hair === 'bun' && !cover && (
        <mesh material={mats.hair} position={[0, 0.2, -0.2]}>
          <sphereGeometry args={[0.1, 12, 10]} />
        </mesh>
      )}
      {look.hair === 'braids' &&
        [-1, 1].map((s) => (
          <group key={s}>
            <mesh material={mats.hair} position={[s * 0.2, -0.16, -0.06]} rotation-z={s * 0.15}>
              <capsuleGeometry args={[0.045, 0.24, 4, 8]} />
            </mesh>
            <mesh material={mats.clip} position={[s * 0.22, -0.32, -0.06]}>
              <sphereGeometry args={[0.03, 8, 6]} />
            </mesh>
          </group>
        ))}
      {look.hairClip && !cover && (
        <mesh material={mats.clip} position={[0.17, 0.14, 0.12]} rotation-z={0.6} scale={[1.6, 0.6, 0.6]}>
          <sphereGeometry args={[0.035, 8, 6]} />
        </mesh>
      )}
    </group>
  );
}

function HeadWear({ look, mats }: { look: Look; mats: Mats }) {
  if (look.head === 'sunhat')
    return (
      <group position-y={0.15}>
        <mesh material={mats.head} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.02, 24]} />
        </mesh>
        <mesh material={mats.head} position-y={0.0} scale={[1, 0.75, 1]}>
          <sphereGeometry args={[0.235, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={mats.strap} position-y={0.025}>
          <cylinderGeometry args={[0.236, 0.236, 0.04, 20, 1, true]} />
        </mesh>
      </group>
    );
  if (look.head === 'cap')
    return (
      <group position-y={0.06}>
        <mesh material={mats.head}>
          <sphereGeometry args={[0.265, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={mats.head} position={[0, 0.0, 0.24]} scale={[1, 0.15, 1]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16, 1, false, -Math.PI / 2, Math.PI]} />
        </mesh>
      </group>
    );
  if (look.head === 'woolhat')
    return (
      <group position-y={0.05}>
        <mesh material={mats.head}>
          <sphereGeometry args={[0.27, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={mats.head} position-y={0.01} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.26, 0.035, 8, 22]} />
        </mesh>
        <mesh material={mats.roll} position-y={0.29}>
          <sphereGeometry args={[0.07, 10, 8]} />
        </mesh>
      </group>
    );
  return null;
}
