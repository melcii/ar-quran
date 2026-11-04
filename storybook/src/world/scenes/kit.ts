// Small shared helpers for the bespoke scenes.
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Land } from '../terrain';

export type V = THREE.Vector3;
export type P3 = [number, number, number];

/** A point on the ground, offset from a stop. */
export function beside(land: Land, at: V, dx: number, dz: number): P3 {
  const x = at.x + dx;
  const z = at.z + dz;
  return [x, land.height(x, z), z];
}

/**
 * A click handler that ignores drags (looking around) and stops at the first hit.
 * With a test key, the action is also kept on globalThis.__taps[key] so headless tests,
 * where software rendering makes aiming at small 3D targets unreliable, can trigger it.
 */
export const tapOnly = (fn: () => void, testKey?: string) => {
  if (testKey) {
    const g = globalThis as { __taps?: Record<string, () => void> };
    (g.__taps ??= {})[testKey] = fn;
  }
  return (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return;
    e.stopPropagation();
    fn();
  };
};

/** Seeded random numbers, so scenery is the same on every visit. */
export function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export const mat = (color: string, roughness = 0.9, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
