// Live, per-frame state shared by the slice's parts (read inside useFrame,
// never through React state, so nothing re-renders sixty times a second).
import * as THREE from 'three';
import { RIVER_Y, START } from './land';

export const SUN_DIR = new THREE.Vector3(-0.55, 0.3, -0.78).normalize();

export const weather = {
  /** 0 clear evening, 1 full storm. */
  storm: 0,
  /** Rain amount 0..1. */
  rain: 0,
  /** Flood water height (starts at the river). */
  water: RIVER_Y,
  /** How far the ark has floated up. */
  lift: 0,
  /** 0 ramp down, 1 ramp closed up against the hull. */
  rampUp: 0,
  /** Cutaway height above the hold floor while the explorer is inside (99 = none). */
  cut: 99,
  time: 0,
};

export const player = {
  pos: START.clone(),
  yaw: Math.PI, // facing -z, toward the ark
  speed: 0,
  inside: false,
  /** Walk-cycle phase, advanced by distance. */
  phase: 0,
};

export type Move = { x: number; y: number; run: boolean };

/** Something being dragged with the pointer: the camera stops orbiting meanwhile. */
export const pointer = { holding: false, ground: new THREE.Vector3(), has: false };

export const motion = { reduced: false };
