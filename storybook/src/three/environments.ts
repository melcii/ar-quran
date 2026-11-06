// Lighting and atmosphere for each part of the story, and the camera shots.
// These are artistic staging choices, not facts from the Quran.
import * as THREE from 'three';
import { PLACES } from './YunusWorld';

export type Env = {
  skyTop: THREE.Color;
  skyHorizon: THREE.Color;
  fog: THREE.Color;
  fogDensity: number;
  sunDir: THREE.Vector3;
  sunColor: THREE.Color;
  sunIntensity: number;
  ambient: THREE.Color;
  ambientIntensity: number;
  waterDeep: THREE.Color;
  waterShallow: THREE.Color;
  underwater: THREE.Color;
  waveHeight: number;
  rays: number;
};

type EnvSpec = { [K in keyof Env]: Env[K] extends THREE.Color ? string : Env[K] extends THREE.Vector3 ? [number, number, number] : number };

const spec = (s: EnvSpec): Env => ({
  ...s,
  skyTop: new THREE.Color(s.skyTop),
  skyHorizon: new THREE.Color(s.skyHorizon),
  fog: new THREE.Color(s.fog),
  sunDir: new THREE.Vector3(...s.sunDir).normalize(),
  sunColor: new THREE.Color(s.sunColor),
  ambient: new THREE.Color(s.ambient),
  waterDeep: new THREE.Color(s.waterDeep),
  waterShallow: new THREE.Color(s.waterShallow),
  underwater: new THREE.Color(s.underwater),
});

export type EnvName = 'dawn' | 'open-sea' | 'deep' | 'darkness' | 'shore';

export const ENVIRONMENTS: Record<EnvName, Env> = {
  dawn: spec({
    skyTop: '#7fa6c0', skyHorizon: '#f2cf9c', fog: '#e8c9a0', fogDensity: 0.0042,
    sunDir: [0.25, 0.08, -1], sunColor: '#ffcf8f', sunIntensity: 2.6,
    ambient: '#c9b8a2', ambientIntensity: 0.9,
    waterDeep: '#22495a', waterShallow: '#6f98a2', underwater: '#2c6a7c', waveHeight: 0.8, rays: 0,
  }),
  'open-sea': spec({
    skyTop: '#6f9fbf', skyHorizon: '#dfe6df', fog: '#d6dfdc', fogDensity: 0.0035,
    sunDir: [0.6, 0.45, -0.6], sunColor: '#fff1d6', sunIntensity: 3,
    ambient: '#c4d0d4', ambientIntensity: 1.0,
    waterDeep: '#1d4a60', waterShallow: '#5f97a8', underwater: '#2c6a7c', waveHeight: 1.1, rays: 0,
  }),
  deep: spec({
    skyTop: '#0e3442', skyHorizon: '#0e3442', fog: '#0f3c4b', fogDensity: 0.03,
    sunDir: [0.2, 1, -0.3], sunColor: '#bfe3e6', sunIntensity: 1.4,
    ambient: '#2d6a78', ambientIntensity: 0.9,
    waterDeep: '#0f3c4b', waterShallow: '#2b6f80', underwater: '#3d8a99', waveHeight: 0.8, rays: 1,
  }),
  darkness: spec({
    skyTop: '#02050a', skyHorizon: '#04080e', fog: '#03070c', fogDensity: 0.06,
    sunDir: [0, 1, 0], sunColor: '#203040', sunIntensity: 0.15,
    ambient: '#0a1620', ambientIntensity: 0.35,
    waterDeep: '#02060a', waterShallow: '#061019', underwater: '#08151f', waveHeight: 0.6, rays: 0.1,
  }),
  shore: spec({
    skyTop: '#86b6cf', skyHorizon: '#f4e3c4', fog: '#ecdcc0', fogDensity: 0.0045,
    sunDir: [-0.5, 0.35, -0.8], sunColor: '#ffe3b5', sunIntensity: 3,
    ambient: '#d9c8ad', ambientIntensity: 1.0,
    waterDeep: '#2a5a68', waterShallow: '#7fb3ba', underwater: '#2c6a7c', waveHeight: 0.6, rays: 0,
  }),
};

export function cloneEnv(e: Env): Env {
  return {
    ...e,
    skyTop: e.skyTop.clone(),
    skyHorizon: e.skyHorizon.clone(),
    fog: e.fog.clone(),
    sunDir: e.sunDir.clone(),
    sunColor: e.sunColor.clone(),
    ambient: e.ambient.clone(),
    waterDeep: e.waterDeep.clone(),
    waterShallow: e.waterShallow.clone(),
    underwater: e.underwater.clone(),
  };
}

/** Moves `cur` a step of `k` (0..1) toward `target`. */
export function lerpEnv(cur: Env, target: Env, k: number) {
  for (const key of Object.keys(target) as (keyof Env)[]) {
    const a = cur[key] as unknown;
    const b = target[key] as unknown;
    if (a instanceof THREE.Color) a.lerp(b as THREE.Color, k);
    else if (a instanceof THREE.Vector3) a.lerp(b as THREE.Vector3, k).normalize();
    else (cur as any)[key] = (a as number) + ((b as number) - (a as number)) * k;
  }
}

/** A camera pose. `local` poses are in story-world coordinates and follow the
 *  world as it grows out of the book or shrinks back into it. */
export type Shot = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; local?: boolean };
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Camera shots in the room (world coordinates). */
export const ROOM_SHOTS: Record<'wide' | 'approach' | 'book' | 'reading', Shot> = {
  wide: { pos: v(0.6, 1.5, 3.6), look: v(0, 0.55, 0), fov: 40 },
  approach: { pos: v(0.15, 1.05, 1.35), look: v(0, 0.45, 0), fov: 38 },
  book: { pos: v(0, 1.08, 0.6), look: v(0, 0.44, 0.02), fov: 40 },
  reading: { pos: v(0, 1.0, 0.36), look: v(0, 0.44, 0.0), fov: 42 },
};

/** Pulls a close shot back on narrow (portrait) screens so both pages fit. */
export function fitShot(s: Shot, aspect: number): Shot {
  if (s.local || aspect >= 1.2) return s;
  const k = Math.min(2.4, 1.3 / Math.max(aspect, 0.4));
  return { ...s, pos: s.look.clone().add(s.pos.clone().sub(s.look).multiplyScalar(k)) };
}

/** Camera shots inside the story world (world-local coordinates, scale 1). */
export const STORY_SHOTS: Record<string, { shot: Shot; env: EnvName; ambience: 'sea' | 'underwater' | 'dark' | 'shore' }> = {
  'yunus-1': { shot: { pos: v(0, 7, 34), look: v(4, 3, -60), fov: 50 }, env: 'dawn', ambience: 'sea' },
  'yunus-2': { shot: { pos: v(18, 3.2, 12), look: v(PLACES.ship.x, 4, PLACES.ship.z), fov: 42 }, env: 'open-sea', ambience: 'sea' },
  'yunus-3': { shot: { pos: v(10, -9, 8), look: v(PLACES.fish.x, PLACES.fish.y, PLACES.fish.z), fov: 55 }, env: 'deep', ambience: 'underwater' },
  'yunus-4': { shot: { pos: v(0, -14, -6), look: v(0, -16, -40), fov: 55 }, env: 'darkness', ambience: 'dark' },
  'yunus-5': {
    shot: { pos: v(PLACES.gourd.x + 12, PLACES.gourd.y + 6, PLACES.gourd.z + 20), look: v(PLACES.gourd.x + 2, PLACES.gourd.y + 1, PLACES.gourd.z - 6), fov: 48 },
    env: 'shore',
    ambience: 'shore',
  },
};
