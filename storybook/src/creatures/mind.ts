// How free animals behave when nobody is leading them: each kind has its own
// temperament (how shy, how curious, whether it keeps with its flock or lies
// down to rest), and every animal reacts gently to the explorer: it turns its
// head to watch, steps aside from a running child, and the curious ones walk
// over to a child who stands still. Nothing here ever chases or harms.
import * as THREE from 'three';
import type { Agent, Animal } from '@/ark/Beasts';
import type { Nav } from './nav';

export type Temper = {
  /** A running child closer than this makes the animal step aside (0 = never). */
  shy: number;
  /** Chance (per quiet minute) to come over to a child who keeps still. */
  curious: number;
  /** Keeps close to others of its group when wandering. */
  flock: boolean;
  /** Lies down to rest now and then. */
  rests: boolean;
  /** Starts watching the child from this far. */
  look: number;
  /** How far it roams from home. */
  roam: number;
};

export const TEMPER: Record<Animal, Temper> = {
  sheep: { shy: 4, curious: 0.15, flock: true, rests: true, look: 6, roam: 4 },
  goat: { shy: 3, curious: 0.6, flock: true, rests: false, look: 7, roam: 5 },
  cow: { shy: 2.5, curious: 0.3, flock: true, rests: true, look: 6, roam: 4 },
  camel: { shy: 2, curious: 0.25, flock: false, rests: true, look: 6, roam: 5 },
  horse: { shy: 4.5, curious: 0.35, flock: false, rests: false, look: 9, roam: 6 },
  elephant: { shy: 0, curious: 0.45, flock: false, rests: false, look: 8, roam: 5 },
  giraffe: { shy: 3, curious: 0.4, flock: false, rests: false, look: 10, roam: 6 },
};

export type Mind = {
  mode: 'idle' | 'walk' | 'shy' | 'curious' | 'rest';
  /** Seconds left in the current mode. */
  left: number;
  /** Head turn wanted, relative to the body (radians). */
  look: number;
  /** 0 standing, 1 lying down. */
  rest: number;
  /** Waypoints from the navigator. */
  route: THREE.Vector3[];
  /** Has it already come over to the child during this quiet spell? */
  greeted: boolean;
  /** Random seed so animals do not move in step. */
  seed: number;
};

export type Free = Agent & { mind?: Mind };

export function mindOf(a: Free): Mind {
  if (!a.mind) a.mind = { mode: 'idle', left: 1 + ((a.scale * 97) % 4), look: 0, rest: 0, route: [], greeted: false, seed: (a.scale * 1000) % 1 };
  return a.mind;
}

type Ctx = {
  dt: number;
  player: THREE.Vector3;
  playerSpeed: number;
  /** Others in the same group (for flocking). */
  group: Free[];
  nav: Nav | null;
  /** Is this spot fine to stand on? */
  ok: (x: number, z: number) => boolean;
  /** Roam radius override (pens are small). */
  roam?: number;
  /** Multiplies shyness (difficulty settings). */
  shyK?: number;
};

const tmp = new THREE.Vector3();

/**
 * One step of free behaviour. Returns where the animal wants to go and how
 * fast (as a share of its normal walking speed), or null to stand.
 */
export function think(a: Free, c: Ctx): { goal: THREE.Vector3; pace: number } | null {
  const T = TEMPER[a.kind];
  const m = mindOf(a);
  m.left -= c.dt;
  const dx = c.player.x - a.pos.x;
  const dz = c.player.z - a.pos.z;
  const d = Math.hypot(dx, dz);
  const roam = c.roam ?? T.roam;
  const shy = T.shy * (c.shyK ?? 1);

  // Watch the child: the head turns toward them (within what a neck can do).
  let want = 0;
  if (d < T.look && m.mode !== 'rest') {
    let rel = Math.atan2(dx, dz) - a.yaw;
    rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    want = Math.max(-1.1, Math.min(1.1, rel));
  }
  m.look += (want - m.look) * Math.min(1, c.dt * 3);
  if (d > T.look + 4) m.greeted = false;

  // A running child close by: get up if lying down, and step aside calmly.
  if (shy > 0 && d < shy && c.playerSpeed > 5 && m.mode !== 'shy') {
    const ang = Math.atan2(-dx, -dz);
    for (const off of [0, 0.6, -0.6, 1.2, -1.2]) {
      tmp.set(a.pos.x + Math.sin(ang + off) * 3.5, a.pos.y, a.pos.z + Math.cos(ang + off) * 3.5);
      if (c.ok(tmp.x, tmp.z) && (!c.nav || c.nav.clearLine(a.pos.x, a.pos.z, tmp.x, tmp.z, 0.3))) {
        m.mode = 'shy';
        m.left = 2.5;
        m.route = [tmp.clone()];
        break;
      }
    }
  }

  // Get up slowly before doing anything else.
  const lying = m.mode === 'rest';
  m.rest += ((lying ? 1 : 0) - m.rest) * Math.min(1, c.dt * (lying ? 0.8 : 1.6));
  if (!lying && m.rest > 0.15) return null;

  if (m.left <= 0 || (m.mode !== 'idle' && m.mode !== 'rest' && !m.route.length)) {
    // Choose what to do next.
    const quiet = d < T.look && c.playerSpeed < 0.3;
    const roll = Math.random();
    m.route = [];
    if (quiet && !m.greeted && roll < T.curious) {
      m.mode = 'curious';
      m.greeted = true;
      m.left = 12;
      const stop = 1.6 + SIZE[a.kind];
      tmp.set(c.player.x - (dx / (d || 1)) * stop, 0, c.player.z - (dz / (d || 1)) * stop);
      const r = d > stop + 0.5 ? c.nav?.route(a.pos, tmp, { r: 0.3, budget: 500, near: 1.5 }) ?? [tmp.clone()] : null;
      if (r) m.route = r;
      else m.mode = 'idle';
    } else if (T.rests && d > 5 && roll < 0.22) {
      m.mode = 'rest';
      m.left = 10 + Math.random() * 12;
    } else if (roll < 0.62) {
      // Wander to a spot near home, or near the flock's middle for flocking kinds.
      const centre = a.home.clone();
      if (T.flock && c.group.length > 1) {
        tmp.set(0, 0, 0);
        for (const o of c.group) tmp.add(o.pos);
        tmp.divideScalar(c.group.length);
        centre.lerp(tmp, 0.6);
      }
      for (let tries = 0; tries < 4 && !m.route.length; tries++) {
        const ang = Math.random() * Math.PI * 2;
        const rr = roam * Math.sqrt(Math.random());
        tmp.set(centre.x + Math.cos(ang) * rr, 0, centre.z + Math.sin(ang) * rr);
        if (!c.ok(tmp.x, tmp.z)) continue;
        // Keep a little space from flock mates.
        if (c.group.some((o) => o !== a && Math.hypot(o.pos.x - tmp.x, o.pos.z - tmp.z) < SIZE[a.kind] * 1.6)) continue;
        const r = c.nav ? c.nav.route(a.pos, tmp, { r: 0.3, budget: 400 }) : [tmp.clone()];
        if (r) m.route = r;
      }
      m.mode = m.route.length ? 'walk' : 'idle';
      m.left = m.route.length ? 14 : 3 + Math.random() * 4;
    } else {
      m.mode = 'idle';
      m.left = 3 + Math.random() * 5;
    }
  }

  if (m.mode === 'rest' || m.mode === 'idle') return null;
  while (m.route.length && Math.hypot(a.pos.x - m.route[0].x, a.pos.z - m.route[0].z) < 0.45) m.route.shift();
  const goal = m.route[0];
  if (!goal) {
    m.mode = 'idle';
    m.left = 2 + Math.random() * 4;
    return null;
  }
  // Curious animals stop at a polite distance even if the child walks up.
  if (m.mode === 'curious' && d < 1.4 + SIZE[a.kind]) {
    m.route = [];
    m.mode = 'idle';
    m.left = 4;
    return null;
  }
  return { goal, pace: m.mode === 'shy' ? 0.9 : m.mode === 'curious' ? 0.55 : 0.4 };
}

/** Rough body half-length, for keeping polite distances. */
export const SIZE: Record<Animal, number> = { sheep: 0.6, goat: 0.6, cow: 1.1, camel: 1.1, horse: 1.0, elephant: 1.6, giraffe: 1.2 };

/** For led animals: when the straight way to the leader is blocked, find a way round. */
export function routeTo(a: Free, goal: THREE.Vector3, nav: Nav | null): THREE.Vector3 {
  const m = mindOf(a);
  if (!nav) return goal;
  if (nav.clearLine(a.pos.x, a.pos.z, goal.x, goal.z, 0.3)) {
    m.route = [];
    return goal;
  }
  const last = m.route[m.route.length - 1];
  if (!m.route.length || !last || Math.hypot(last.x - goal.x, last.z - goal.z) > 2.5) m.route = nav.route(a.pos, goal, { r: 0.3, budget: 900, near: 2 }) ?? [];
  while (m.route.length > 1 && Math.hypot(a.pos.x - m.route[0].x, a.pos.z - m.route[0].z) < 0.6) m.route.shift();
  return m.route[0] ?? goal;
}
