// The child explorer the player walks around as: a made-up modern visitor to
// the story's world, not anyone from the story. Rounded, friendly, modestly
// dressed (long sleeves and trousers), with a backpack and a small lantern.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { motion, player, weather } from './shared';

const m = (color: string, rough = 0.8) => new THREE.MeshStandardMaterial({ color, roughness: rough });

export function Child() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const lantern = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const mats = useMemo(
    () => ({
      skin: m('#c98c62', 0.7),
      hair: m('#3a2618', 0.6),
      shirt: m('#3f8a8c'),
      vest: m('#d9a55a'),
      trousers: m('#6a5a48'),
      boots: m('#5a3a26', 0.6),
      pack: m('#b0603a'),
      roll: m('#e6d2a6'),
      strap: m('#5a3a26'),
      eye: new THREE.MeshStandardMaterial({ color: '#241812', roughness: 0.3 }),
      shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      cheek: new THREE.MeshStandardMaterial({ color: '#e08a70', roughness: 0.9, transparent: true, opacity: 0.5 }),
      glass: new THREE.MeshStandardMaterial({ color: '#ffd58a', emissive: '#ffb050', emissiveIntensity: 2.4 }),
      brass: new THREE.MeshStandardMaterial({ color: '#b08a40', metalness: 0.6, roughness: 0.4 }),
    }),
    [],
  );
  const look = useRef(0);
  useFrame((st, dt) => {
    const g = root.current;
    if (!g) return;
    g.position.copy(player.pos);
    // Turn smoothly toward the facing direction.
    let d = player.yaw - g.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    g.rotation.y += d * Math.min(1, dt * 12);
    const t = st.clock.elapsedTime;
    const sp = Math.min(1, player.speed / 4.2);
    const run = Math.max(0, (player.speed - 4.5) / 3);
    const ph = player.phase;
    const swing = Math.sin(ph) * (0.55 + run * 0.35) * sp;
    if (legL.current && legR.current && armL.current && armR.current) {
      legL.current.rotation.x = swing;
      legR.current.rotation.x = -swing;
      armL.current.rotation.x = -swing * 0.9;
      armR.current.rotation.x = swing * 0.6 - 0.25 * sp;
      armL.current.rotation.z = 0.12;
      armR.current.rotation.z = -0.12;
    }
    if (body.current) {
      const bob = motion.reduced ? 0 : Math.abs(Math.sin(ph)) * 0.06 * sp;
      const breathe = Math.sin(t * 2.2) * 0.012 * (1 - sp);
      body.current.position.y = bob + breathe;
      body.current.rotation.x = 0.08 * sp + run * 0.12;
    }
    if (head.current) {
      // When standing, the explorer looks around now and then.
      look.current += ((sp < 0.1 ? Math.sin(t * 0.4) * 0.5 : 0) - look.current) * Math.min(1, dt * 2);
      head.current.rotation.y = look.current;
      head.current.rotation.x = -0.05 * sp;
    }
    if (lantern.current) lantern.current.rotation.x = -swing * 0.5 + Math.sin(t * 1.7) * 0.05;
    if (light.current) {
      const want = player.inside || weather.storm > 0.3 ? 1 : 0.15;
      light.current.intensity += (want * 6 - light.current.intensity) * Math.min(1, dt * 2);
    }
  });
  const S = 1.05; // about 1.3 m tall
  return (
    <group ref={root} scale={S}>
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
            <mesh material={mats.boots} position={[0, -0.53, 0.04]} scale={[1, 0.7, 1.35]} castShadow>
              <sphereGeometry args={[0.1, 12, 10]} />
            </mesh>
          </group>
        ))}
        {/* Body: shirt and an explorer's vest. */}
        <mesh material={mats.shirt} position-y={0.82} scale={[1, 1.05, 0.85]} castShadow>
          <capsuleGeometry args={[0.2, 0.26, 6, 14]} />
        </mesh>
        <mesh material={mats.vest} position={[0, 0.84, 0.02]} scale={[1.06, 0.9, 0.9]}>
          <capsuleGeometry args={[0.2, 0.2, 6, 14]} />
        </mesh>
        {/* Arms, pivoting at the shoulders. */}
        {[
          [armL, -0.25],
          [armR, 0.25],
        ].map(([ref, x]) => (
          <group key={x as number} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 1.0, 0]}>
            <mesh material={mats.shirt} position-y={-0.2} castShadow>
              <capsuleGeometry args={[0.065, 0.3, 4, 10]} />
            </mesh>
            <mesh material={mats.skin} position-y={-0.42}>
              <sphereGeometry args={[0.07, 10, 8]} />
            </mesh>
            {(x as number) > 0 && (
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
        {/* Backpack with a rolled blanket. */}
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
        {/* Head. */}
        <group ref={head} position-y={1.32}>
          <mesh material={mats.skin} scale={[1, 1.02, 0.96]} castShadow>
            <sphereGeometry args={[0.25, 24, 18]} />
          </mesh>
          {/* Hair: a rounded cap of hair with a soft fringe. */}
          <mesh material={mats.hair} position={[0, 0.06, -0.03]} scale={[1.08, 0.95, 1.06]}>
            <sphereGeometry args={[0.25, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          </mesh>
          <mesh material={mats.hair} position={[0, 0.13, 0.17]} rotation-x={0.5} scale={[1.3, 0.45, 0.6]}>
            <sphereGeometry args={[0.13, 14, 10]} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh material={mats.eye} position={[s * 0.085, 0.0, 0.225]} scale={[0.8, 1.1, 0.5]}>
                <sphereGeometry args={[0.04, 12, 10]} />
              </mesh>
              <mesh material={mats.shine} position={[s * 0.085 + 0.012, 0.018, 0.245]}>
                <sphereGeometry args={[0.011, 6, 6]} />
              </mesh>
              <mesh material={mats.cheek} position={[s * 0.14, -0.07, 0.19]} scale={[1, 0.6, 0.4]}>
                <sphereGeometry args={[0.04, 10, 8]} />
              </mesh>
              <mesh material={mats.skin} position={[s * 0.25, 0, 0]} scale={[0.5, 0.9, 0.7]}>
                <sphereGeometry args={[0.06, 10, 8]} />
              </mesh>
            </group>
          ))}
          <mesh material={mats.skin} position={[0, -0.04, 0.245]}>
            <sphereGeometry args={[0.03, 10, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
