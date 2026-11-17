// Checks for the Ark's animal-guiding settings, run in the studio before a
// change can be submitted and again as a recorded "movement" test.
//
// They use the game's own movement rules (land.canStep: the hull, ramp
// rails, river, trees and rocks) and its own route finder (creatures/nav),
// so "a route exists" here means the animals in the game can walk it.
import * as THREE from 'three';
import { makeNav } from '@/creatures/nav';
import { ARK_KINDS, LIMITS, resolveArk } from './config';
import { NAMES } from './story';
import { RAMP, WORLD_R, canStep, groundY, inHull, onRamp, riverZ, RIVER_HALF } from './land';
// Planting the trees and rocks fills land.obstacles, which canStep reads.
import './Scenery';

export type ArkProblem = { key: string; level: 'error' | 'warning'; message: string };
export type ArkRoute = { kind: string; from: 'home' | 'pad'; ok: boolean; length: number | null; points: [number, number][] };

let nav: ReturnType<typeof makeNav> | null = null;
const theNav = () => (nav ??= makeNav((ax, az, bx, bz, r) => canStep(ax, az, bx, bz, r, true), { radius: 76, cell: 1.6, y: groundY }));

const open = (x: number, z: number, r: number) => canStep(x, z, x, z, r, true) && !inHull(x, z, 1.5) && !onRamp(x, z) && Math.abs(z - riverZ(x)) > RIVER_HALF + 0.5;

export function checkArk(doc: { v: 1; set?: Record<string, unknown> } | null): { problems: ArkProblem[]; routes: ArkRoute[] } {
  const out: ArkProblem[] = [];
  const err = (key: string, message: string) => out.push({ key, level: 'error', message });
  const warn = (key: string, message: string) => out.push({ key, level: 'warning', message });
  const { cfg, skipped } = resolveArk(doc);
  for (const k of skipped) err(k, 'not a valid setting (wrong kind of value, or out of range)');
  for (const [key, v] of Object.entries(doc?.set ?? {})) if (typeof v === 'string' && /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(v)) err(key, 'Arabic script is not allowed here; Quran text comes only from the locked dataset');
  const routes: ArkRoute[] = [];
  const foot = new THREE.Vector3(RAMP.x, 0, RAMP.z1 + 1.2);
  for (const k of ARK_KINDS) {
    const c = cfg[k];
    const name = NAMES[k][1];
    for (const f of ['notice', 'reach', 'arrive', 'speed', 'followMax'] as const) {
      const [lo, hi] = LIMITS[f];
      if (!(c[f] >= lo && c[f] <= hi)) err(`${k}.${f}`, `must be between ${lo} and ${hi}`);
    }
    if (c.followMax < c.speed) err(`${k}.followMax`, `the ${name} could never keep up: the top speed is below their walking pace`);
    if (c.followMax < 4.2) warn(`${k}.followMax`, `the ${name} cannot keep up with a walking child (4.2 m/s); they will fall behind`);
    if (c.reach > c.notice) warn(`${k}.reach`, `the ${name} can be led from further away than they are noticed`);
    for (const which of ['home', 'pad'] as const) {
      const [x, z] = c[which];
      if (Math.hypot(x, z) > WORLD_R - 3) err(`${k}.${which}`, `outside the valley (radius ${WORLD_R - 3})`);
      else if (!open(x, z, which === 'pad' ? 1.4 : 0.8)) err(`${k}.${which}`, `not open ground: in the river, the ark, on the ramp, or inside a tree or rock`);
    }
    if (!c.instruction.trim()) err(`${k}.instruction`, 'needed');
    if (!c.done.trim()) err(`${k}.done`, 'needed');
    // The walk from home to the pad, as the game routes it.
    const a = new THREE.Vector3(c.home[0], 0, c.home[1]);
    const b = new THREE.Vector3(c.pad[0], 0, c.pad[1]);
    const r = theNav().route(a, b, { r: 0.5, budget: 30000 });
    let len: number | null = null;
    if (r) {
      len = 0;
      let p = a;
      for (const q of r) {
        len += Math.hypot(q.x - p.x, q.z - p.z);
        p = q;
      }
    }
    routes.push({ kind: k, from: 'home', ok: !!r, length: len, points: [[a.x, a.z], ...(r ?? []).map((q) => [q.x, q.z] as [number, number])] });
    if (!r) err(`${k}.pad`, `the ${name} cannot walk from where they wander to their pad`);
    // Boarding: from the pad the pair walks straight to the foot of the ramp.
    const clear = theNav().clearLine(b.x, b.z, foot.x, foot.z, 0.6);
    routes.push({ kind: k, from: 'pad', ok: clear, length: Math.hypot(foot.x - b.x, foot.z - b.z), points: [[b.x, b.z], [foot.x, foot.z]] });
    if (!clear) err(`${k}.pad`, `from this pad the ${name} cannot walk straight to the ramp (something is in the way)`);
    if (Math.hypot(foot.x - b.x, foot.z - b.z) > 22) warn(`${k}.pad`, `the pad is far from the ramp (${Math.round(Math.hypot(foot.x - b.x, foot.z - b.z))} m); boarding will take a while`);
  }
  for (let i = 0; i < ARK_KINDS.length; i++)
    for (let j = i + 1; j < ARK_KINDS.length; j++) {
      const p = cfg[ARK_KINDS[i]].pad;
      const q = cfg[ARK_KINDS[j]].pad;
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 4.5) err(`${ARK_KINDS[j]}.pad`, `too close to the ${NAMES[ARK_KINDS[i]][1]}' pad (pads need 4.5 m between them)`);
    }
  return { problems: out, routes };
}
