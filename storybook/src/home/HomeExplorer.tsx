// The player's own explorer, standing in the reading room beside the rehal.
// It breathes, blinks and looks around (the figure's own idle life), and now
// and then hitches its backpack up. Tapping it waves hello and opens My Explorer.
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { Figure } from '@/profile/figure/Figure';
import type { Gesture } from '@/profile/figure/pose';
import type { Look } from '@/profile/look';

/** Beside the rehal on the viewer's left, turned toward the room. */
export const HOME_SPOT = { pos: [-0.95, 0, 0.35] as [number, number, number], yaw: 0.42 };

export function HomeExplorer({ look, motion, onOpen }: { look: Look; motion: boolean; onOpen: () => void }) {
  const api = useRef<{ play: (g: Gesture) => void } | null>(null);
  const next = useRef(6 + Math.random() * 4);
  const busy = useRef(0);
  const onReady = useCallback((a: { play: (g: Gesture) => void }) => {
    api.current = a;
  }, []);

  const chest = useRef<THREE.Group>(null);
  useFrame((state) => {
    // Test hook: where the explorer's chest is on screen, in CSS pixels.
    if (chest.current) {
      const v = chest.current.getWorldPosition(new THREE.Vector3()).project(state.camera);
      (globalThis as { __home?: object }).__home = { at: [((v.x + 1) / 2) * state.size.width, ((1 - v.y) / 2) * state.size.height] };
    }
    if (!motion) return;
    const t = state.clock.elapsedTime;
    if (t > next.current && performance.now() - busy.current > 3000) {
      api.current?.play('adjust');
      next.current = t + 11 + Math.random() * 8;
    }
  });

  const tap = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return;
    e.stopPropagation();
    if (performance.now() - busy.current < 1500) return;
    busy.current = performance.now();
    api.current?.play('wave');
    setTimeout(onOpen, motion ? 900 : 100);
  };

  return (
    <group position={HOME_SPOT.pos} rotation-y={HOME_SPOT.yaw}>
      <Figure look={look} lantern={false} onReady={onReady} />
      <group ref={chest} position={[0, 0.95, 0]} />
      {/* A tap target the size of the explorer. */}
      <mesh
        position={[0, 0.68, 0]}
        onClick={tap}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <boxGeometry args={[0.62, 1.4, 0.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
