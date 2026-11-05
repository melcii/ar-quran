// Keeps the collision space in step with what is drawn under a group
// (activity props, structures, rocks), filling any gap the hand-made colliders
// leave: every half second it reads what is drawn (sceneSolids.ts) and, if
// anything moved, appeared or went away (a gate swings, a plant grows), swaps
// the colliders. Draws nothing.
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import type * as THREE from 'three';
import { sceneSolids, solidsKey } from './sceneSolids';
import type { Space } from './space';

export function PropSolids({ root, space, onScene, onChange }: { root: RefObject<THREE.Object3D | null>; space: Space; onScene?: (s: THREE.Scene) => void; onChange?: () => void }) {
  const scene = useThree((s) => s.scene);
  const st = useRef({ t: 1, key: '' });
  onScene?.(scene);
  useFrame((_, dt) => {
    st.current.t += dt;
    if (st.current.t < 0.5 || !root.current || space.freed) return;
    st.current.t = 0;
    const ss = sceneSolids(root.current, space.spec.floor, 'drawn part', (x, z) => space.baseBlocked(x, z, 0.04));
    const key = solidsKey(ss);
    if (key === st.current.key) return;
    st.current.key = key;
    space.setDynamic('props', ss);
    onChange?.();
  });
  return null;
}
