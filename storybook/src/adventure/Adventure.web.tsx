// One adventure world for one surah, built from its recipe (worlds/wNNN.ts):
// the child explorer walks the land in third person, reads verified ayahs at
// lanterns and tablets, and does the world's activities (lighting, watering,
// carrying, leading animals, guiding boats, matching and ordering ayahs).
// Every world holds the whole surah in a book. No prophet, no angel and
// nothing of the unseen is ever shown; activities are labelled as game ideas.
import { N8AO, Bloom, BrightnessContrast, EffectComposer, HueSaturation, ToneMapping, Vignette } from '@react-three/postprocessing';
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { ToneMappingMode } from 'postprocessing';
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as THREE from 'three';
import { getSurah } from '@/content/quran';
import { useAppState } from '@/state/AppState';
import { useRecitation } from '@/state/Recitation';
import { SoftShapes } from '@/three/soft';
import { fonts } from '@/theme';
import { QUALITY, guessTier, lowerTier, type QualityTier } from '@/world/quality';
import { Beast, SPECS, type Agent } from '@/ark/Beasts';
import { Child } from '@/ark/Child';
import { nature } from '@/ark/nature';
import { Wind } from '@/ark/Scenery';
import { motion, player, pointer, weather, type Move } from '@/ark/shared';
import { CardView, type Card } from './cards';
import { Boat, StructureView, footprint } from './kit';
import { Carried, Doorway, GuidedBoat, Pile, PointSpot, ReadingMarker, Slot, Wayfinder } from './props';
import { CloudLayer, FarLand, Flock, FlowerField, GrassField, GroundMesh, Lighting, Moon, Motes, Mountains, RockField, Sky, StillWater, Trees, place, type SceneQuality } from './Scenery';
import { makeTerrain, rng, type P2, type Terrain } from './terrain';
import type { Task, WorldDef } from './types';
import { WORLDS } from './worlds';

/* ------------------------------- saving ------------------------------- */

type Save = { done: string[]; prog: Record<string, number[]>; seen: string[]; pos?: [number, number, number]; finished?: boolean };
const KEY = (n: number) => `quran-adventure.world-${n}.v1`;
const fresh = (): Save => ({ done: [], prog: {}, seen: [] });
function load(n: number): Save {
  try {
    const s = JSON.parse(localStorage.getItem(KEY(n)) ?? 'null');
    if (s && Array.isArray(s.done)) return { ...fresh(), ...s };
  } catch {}
  return fresh();
}
function store(n: number, s: Save) {
  try {
    localStorage.setItem(KEY(n), JSON.stringify(s));
  } catch {}
}

/* ------------------------------- the live game ------------------------------- */

type Ani = Agent & { task: string; idx: number; penned: boolean; tid?: number };
type BoatState = { task: string; idx: number; pos: THREE.Vector3; yaw: number; k: number; moving: boolean; done: boolean };
type Use = { key: string; pos: THREE.Vector3; label: string; reach: number; run: () => void };

type Game = {
  animals: Ani[];
  boats: BoatState[];
  carrying: { task: string; idx: number } | null;
  target: THREE.Vector3 | null;
  pending: string | null;
  cam: { yaw: number; pitch: number; dist: number; pos: THREE.Vector3; look: THREE.Vector3; snap?: boolean };
  timeScale: number;
  next: MutableRefObject<THREE.Vector3 | null>;
  /** Where the explorer has walked, so following animals take the same way (over bridges, round walls). */
  trail: { id: number; p: THREE.Vector3 }[];
};

const v3 = ([x, z]: P2, t: Terrain, dy = 0) => new THREE.Vector3(x, t.floorY(x, z) + dy, z);

function ready(task: Task, done: string[]) {
  return !done.includes(task.id) && (task.requires ?? []).every((r) => done.includes(r));
}

function makeAnimals(def: WorldDef, s: Save, t: Terrain): Ani[] {
  const out: Ani[] = [];
  const r = rng(def.seed + 7);
  const mk = (task: string, idx: number, kind: Ani['kind'], at: THREE.Vector3, extra: Partial<Ani> = {}): Ani => ({
    id: `${task}-${idx}`,
    task,
    idx,
    kind,
    mate: (idx % 2) as 0 | 1,
    pos: at.clone(),
    yaw: r() * 6.28,
    speed: 0,
    phase: r() * 6,
    state: 'wander',
    target: null,
    home: at.clone(),
    path: [],
    found: true,
    graze: 0,
    timer: r() * 4,
    highlight: false,
    scale: 0.9 + r() * 0.2,
    penned: false,
    ...extra,
  });
  for (const task of def.tasks) {
    if (task.kind === 'lead') {
      const got = s.prog[task.id] ?? [];
      for (let i = 0; i < task.n; i++) {
        const penned = got.includes(i) || s.done.includes(task.id);
        const a = r() * 6.28;
        const d = Math.sqrt(r()) * task.herd.r;
        const at: P2 = penned ? [task.pen[0] + Math.cos(i * 2.2) * 1.6, task.pen[1] + Math.sin(i * 2.2) * 1.6] : [task.herd.at[0] + Math.cos(a) * d, task.herd.at[1] + Math.sin(a) * d];
        out.push(mk(task.id, i, task.animal, v3(at, t), { penned, state: penned ? 'stall' : 'wander' }));
      }
    }
    if (task.kind === 'pick')
      task.choices.forEach((c, i) => out.push(mk(task.id, i, task.animal, v3(c.at, t), { look: c.look, scale: c.scale ?? 1, mate: 0 })));
  }
  for (const [h, herd] of (def.herds ?? []).entries())
    for (let i = 0; i < herd.n; i++) {
      const a = r() * 6.28;
      const d = Math.sqrt(r()) * herd.r;
      out.push(mk(`herd${h}`, i, herd.animal, v3([herd.at[0] + Math.cos(a) * d, herd.at[1] + Math.sin(a) * d], t)));
    }
  return out;
}

function makeBoats(def: WorldDef, s: Save, t: Terrain): BoatState[] {
  const out: BoatState[] = [];
  for (const task of def.tasks)
    if (task.kind === 'guide')
      task.boats.forEach((b, i) => {
        const done = s.done.includes(task.id) || (s.prog[task.id] ?? []).includes(i);
        const p = done ? b.path[b.path.length - 1] : b.path[0];
        const q = done ? b.path[b.path.length - 2] : b.path[1];
        out.push({ task: task.id, idx: i, pos: new THREE.Vector3(p[0], (t.water ?? 0) + 0.05, p[1]), yaw: Math.atan2(done ? p[0] - q[0] : q[0] - p[0], done ? p[1] - q[1] : q[1] - p[1]), k: done ? b.path.length - 1 : 0, moving: false, done });
      });
  return out;
}

/* ------------------------------- director ------------------------------- */

type Api = {
  save: () => Save;
  progress: (task: string, i: number) => void;
  finish: (task: string) => void;
  hint: (text: string) => void;
  open: (c: Card) => void;
  near: (u: { key: string; label: string } | null) => void;
};

function Director({ def, t, game, move, api }: { def: WorldDef; t: Terrain; game: Game; move: MutableRefObject<Move>; api: MutableRefObject<Api> }) {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const lastNear = useRef('');
  const camDist = useRef(game.cam.dist);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      keys.current.add(e.key.toLowerCase());
      nature.start();
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  /** Everything that can be used right now. */
  function uses(): Use[] {
    const s = api.current.save();
    const out: Use[] = [];
    for (const task of def.tasks) {
      if (!ready(task, s.done)) continue;
      const prog = s.prog[task.id] ?? [];
      switch (task.kind) {
        case 'read':
          out.push({ key: `read:${task.id}`, pos: v3(task.at, t), label: `Read: ${task.reading.title}`, reach: 3.2, run: () => {
            api.current.finish(task.id);
            api.current.open({ kind: 'reading', reading: task.reading });
          } });
          break;
        case 'quiz':
          out.push({ key: `quiz:${task.id}`, pos: v3(task.at, t), label: task.title, reach: 3.2, run: () => api.current.open({ kind: 'quiz', task }) });
          break;
        case 'points':
          task.points.forEach((p, i) => {
            if (prog.includes(i)) return;
            if (task.ordered && task.points.findIndex((_, j) => !prog.includes(j)) !== i) return;
            out.push({ key: `pt:${task.id}:${i}`, pos: v3(p.at, t), label: `${task.verb}: ${p.label}`, reach: 3, run: () => {
              nature.place();
              api.current.progress(task.id, i);
              if (p.reading) api.current.open({ kind: 'reading', reading: p.reading });
            } });
          });
          break;
        case 'carry': {
          const c = game.carrying;
          if (c && c.task === task.id) {
            const L = task.loads[c.idx];
            out.push({ key: `dst:${task.id}:${c.idx}`, pos: v3(L.to, t), label: `Put down the ${L.label}${L.dest ? ` ${L.dest}` : ''}`, reach: 3.2, run: () => {
              game.carrying = null;
              nature.place();
              api.current.progress(task.id, c.idx);
            } });
          } else if (!c) {
            const seen = new Set<string>();
            task.loads.forEach((L, i) => {
              const k = L.from.join(',');
              if (prog.includes(i) || seen.has(k)) return;
              seen.add(k);
              out.push({ key: `src:${task.id}:${i}`, pos: v3(L.from, t), label: `Pick up the ${L.label}`, reach: 2.6, run: () => {
                game.carrying = { task: task.id, idx: i };
                nature.place();
                api.current.hint(`Carry the ${L.label}${L.dest ? ` ${L.dest}` : ''}. Follow the light.`);
              } });
            });
          }
          break;
        }
        case 'lead': {
          const follow = game.animals.filter((a) => a.task === task.id && a.state === 'follow');
          for (const a of game.animals)
            if (a.task === task.id && a.state === 'wander')
              out.push({ key: `ani:${a.id}`, pos: a.pos, label: `Lead the ${SPECS[a.kind].name}`, reach: 3.2, run: () => {
                a.state = 'follow';
                nature.call(a.kind as never);
                api.current.hint(`The ${SPECS[a.kind].name} follows you. Bring it to ${task.penLabel}.`);
              } });
          if (follow.length) out.push({ key: `pen:${task.id}`, pos: v3(task.pen, t), label: `Bring them to ${task.penLabel}`, reach: 0, run: () => undefined });
          break;
        }
        case 'pick':
          for (const a of game.animals)
            if (a.task === task.id) {
              const c = task.choices[a.idx];
              out.push({ key: `ani:${a.id}`, pos: a.pos, label: `${task.verb}`, reach: 3.2, run: () => {
                if (c.right) {
                  api.current.finish(task.id);
                  api.current.hint(c.why);
                } else api.current.hint(c.why);
              } });
            }
          break;
        case 'guide':
          for (const b of game.boats)
            if (b.task === task.id && !b.done && !b.moving)
              out.push({ key: `boat:${task.id}:${b.idx}`, pos: b.pos, label: 'Guide this boat in', reach: 50, run: () => {
                b.moving = true;
                api.current.hint('The boat follows the lights into the harbour.');
              } });
          break;
      }
    }
    (def.links ?? []).forEach((l, i) => out.push({ key: `link:${i}`, pos: v3(l.at, t), label: l.label, reach: 3, run: () => router.push(l.href as never) }));
    return out;
  }

  function act(key: string) {
    const u = uses().find((x) => x.key === key);
    if (!u) return;
    const d = Math.hypot(u.pos.x - player.pos.x, u.pos.z - player.pos.z);
    if (d > u.reach + 0.3) {
      if (key.startsWith('boat:')) {
        api.current.hint('Walk out to the end of a dock, then tap the boat.');
        return;
      }
      game.target = u.pos.clone();
      game.pending = u.reach > 0 ? key : null;
      return;
    }
    u.run();
  }
  (game as unknown as { act: (k: string) => void }).act = act;

  useFrame((st, rawDt) => {
    const dt = Math.min(0.05, rawDt) * game.timeScale;
    weather.time = st.clock.elapsedTime;
    const s = api.current.save();

    /* ---------- the explorer ---------- */
    const k = keys.current;
    let ix = move.current.x + (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    let iy = move.current.y + (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
    const run = move.current.run || k.has('shift');
    if (ix || iy) {
      game.target = null;
      game.pending = null;
    }
    const cy = game.cam.yaw;
    let dx = 0;
    let dz = 0;
    if (ix || iy) {
      const len = Math.hypot(ix, iy);
      if (len > 1) {
        ix /= len;
        iy /= len;
      }
      dx = -Math.sin(cy) * iy + Math.cos(cy) * ix;
      dz = -Math.cos(cy) * iy - Math.sin(cy) * ix;
    } else if (game.target) {
      const tx = game.target.x - player.pos.x;
      const tz = game.target.z - player.pos.z;
      const d = Math.hypot(tx, tz);
      const want = game.pending ? (game.pending.startsWith('boat') ? 36 : 2.2) : 0.4;
      if (d < want) {
        game.target = null;
        if (game.pending) {
          const p = game.pending;
          game.pending = null;
          act(p);
        }
      } else {
        dx = tx / d;
        dz = tz / d;
      }
    }
    const mag = Math.hypot(dx, dz);
    const want = mag > 0.05 ? (run ? 7 : 4.2) * Math.min(1, mag) : 0;
    player.speed += (want - player.speed) * Math.min(1, dt * 8);
    if (mag > 0.05) player.yaw = Math.atan2(dx, dz);
    if (player.speed > 0.02) {
      const step = player.speed * dt;
      const fx = Math.sin(player.yaw) * step;
      const fz = Math.cos(player.yaw) * step;
      const { x, z } = player.pos;
      if (t.canStep(x, z, x + fx, z + fz, 0.35)) player.pos.set(x + fx, player.pos.y, z + fz);
      else if (t.canStep(x, z, x + fx, z, 0.35)) player.pos.x += fx;
      else if (t.canStep(x, z, x, z + fz, 0.35)) player.pos.z += fz;
      else if (game.target) {
        game.target = null;
        game.pending = null;
      }
      const before = player.phase;
      player.phase += (step / 1.3) * Math.PI;
      if (Math.floor(before / Math.PI) !== Math.floor(player.phase / Math.PI)) nature.step(t.floors.some((f) => typeof f.y !== 'number') && t.floorY(player.pos.x, player.pos.z) > t.y(player.pos.x, player.pos.z) + 0.2);
    }
    const lastT = game.trail[game.trail.length - 1];
    if (!lastT || lastT.p.distanceTo(player.pos) > 0.8) {
      game.trail.push({ id: (lastT?.id ?? 0) + 1, p: player.pos.clone() });
      if (game.trail.length > 400) game.trail.shift();
    }
    const fy = t.floorY(player.pos.x, player.pos.z);
    player.pos.y += (fy - player.pos.y) * Math.min(1, dt * 14);
    if (Math.abs(fy - player.pos.y) > 1.5) player.pos.y = fy;
    const pp = player.pos;

    /* ---------- animals ---------- */
    for (const a of game.animals) {
      const spec = SPECS[a.kind];
      a.timer += dt;
      let goal: THREE.Vector3 | null = null;
      let pace = spec.speed;
      if (a.state !== 'follow') a.tid = undefined;
      if (a.state === 'wander' || a.state === 'stall') {
        const roam = a.state === 'stall' ? 1.4 : 4;
        if (!a.target || a.timer > 6 + (a.scale * 10) % 4) {
          const ang = Math.random() * 6.28;
          a.target = a.home.clone().add(new THREE.Vector3(Math.cos(ang) * roam * Math.random(), 0, Math.sin(ang) * roam * Math.random()));
          a.timer = 0;
        }
        goal = a.target;
        pace = spec.speed * 0.4;
      } else if (a.state === 'follow') {
        const i = game.animals.filter((x) => x.state === 'follow').indexOf(a);
        const keep = 2.2 + i * 1.6 + spec.len * 0.5;
        const tr = game.trail;
        if (a.tid == null) a.tid = tr.length ? tr[tr.length - 1].id : 0;
        let k = tr.findIndex((x) => x.id >= a.tid!);
        if (k < 0) k = tr.length;
        // How far along the trail the explorer is ahead of this animal's next point.
        let ahead = k < tr.length ? Math.hypot(pp.x - tr[tr.length - 1].p.x, pp.z - tr[tr.length - 1].p.z) : 0;
        for (let j = k; j < tr.length - 1; j++) ahead += tr[j].p.distanceTo(tr[j + 1].p);
        if (k < tr.length && Math.hypot(a.pos.x - tr[k].p.x, a.pos.z - tr[k].p.z) < 1.6 && ahead > keep) a.tid = tr[k].id + 1;
        if (k < tr.length && ahead > keep) goal = tr[k].p.clone();
        else if (Math.hypot(pp.x - a.pos.x, pp.z - a.pos.z) > keep) goal = pp.clone();
        else goal = null;
        pace = Math.max(spec.speed, player.speed * 1.05) * (ahead > keep + 6 ? 1.8 : 1);
        const task = def.tasks.find((x) => x.id === a.task);
        if (task?.kind === 'lead' && Math.hypot(a.pos.x - task.pen[0], a.pos.z - task.pen[1]) < 4.5) {
          a.state = 'stall';
          a.penned = true;
          a.home.set(task.pen[0] + Math.cos(a.idx * 2.2) * 1.6, 0, task.pen[1] + Math.sin(a.idx * 2.2) * 1.6);
          a.target = a.home.clone();
          nature.call(a.kind as never);
          api.current.progress(task.id, a.idx);
        }
      }
      if (goal) {
        const gx = goal.x - a.pos.x;
        const gz = goal.z - a.pos.z;
        const d = Math.hypot(gx, gz);
        const wantSp = d > 0.5 ? pace * Math.min(1, d / 1.5) : 0;
        a.speed += (wantSp - a.speed) * Math.min(1, dt * 3);
        if (d > 0.3) {
          let dy = Math.atan2(gx, gz) - a.yaw;
          dy = Math.atan2(Math.sin(dy), Math.cos(dy));
          a.yaw += dy * Math.min(1, dt * 4);
        }
      } else a.speed *= 1 - Math.min(1, dt * 3);
      if (a.speed > 0.01) {
        const step = a.speed * dt;
        const nx = a.pos.x + Math.sin(a.yaw) * step;
        const nz = a.pos.z + Math.cos(a.yaw) * step;
        const onFloor = t.floorY(nx, nz) > t.y(nx, nz) + 0.05;
        if ((onFloor || !t.isWater(nx, nz)) && Math.hypot(nx, nz) < t.radius) {
          a.pos.x = nx;
          a.pos.z = nz;
        } else a.target = null;
        a.phase += (step / spec.stride) * Math.PI * 2;
      }
      a.pos.y = t.floorY(a.pos.x, a.pos.z);
      a.graze += ((a.speed < 0.15 && a.state !== 'follow' ? 1 : 0) - a.graze) * Math.min(1, dt * 1.2);
    }

    /* ---------- boats ---------- */
    for (const b of game.boats) {
      if (!b.moving) continue;
      const task = def.tasks.find((x) => x.id === b.task);
      if (task?.kind !== 'guide') continue;
      const path = task.boats[b.idx].path;
      const nxt = path[Math.min(path.length - 1, Math.floor(b.k) + 1)];
      const gx = nxt[0] - b.pos.x;
      const gz = nxt[1] - b.pos.z;
      const d = Math.hypot(gx, gz);
      const sp = 3.2 * dt;
      if (d < sp + 0.05) {
        b.k = Math.floor(b.k) + 1;
        if (b.k >= path.length - 1) {
          b.moving = false;
          b.done = true;
          api.current.progress(task.id, b.idx);
        }
      } else {
        b.pos.x += (gx / d) * sp;
        b.pos.z += (gz / d) * sp;
        let dy = Math.atan2(gx, gz) - b.yaw;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        b.yaw += dy * Math.min(1, dt * 1.5);
      }
    }

    /* ---------- what is near, and where to go next ---------- */
    const list = uses();
    let near: Use | null = null;
    let best = 1e9;
    for (const u of list) {
      if (u.reach <= 0) continue;
      const d = Math.hypot(u.pos.x - pp.x, u.pos.z - pp.z);
      if (d < u.reach && d < best) {
        best = d;
        near = u;
      }
    }
    // The wayfinding light shows the next useful place for the first open task.
    const first = def.tasks.find((x) => ready(x, s.done));
    let nextPos: THREE.Vector3 | null = null;
    if (first) {
      const mine = list.filter((u) => u.key.includes(`:${first.id}`) || (first.kind === 'lead' || first.kind === 'pick' ? u.key.startsWith(`ani:${first.id}-`) : false));
      const pen = mine.find((u) => u.key.startsWith('pen:'));
      const pool = pen ? [pen] : mine;
      let bd = 1e9;
      for (const u of pool) {
        const d = Math.hypot(u.pos.x - pp.x, u.pos.z - pp.z);
        if (d < bd) {
          bd = d;
          nextPos = u.pos;
        }
      }
    }
    game.next.current = nextPos;
    const key = near ? near.key + near.label : '';
    if (key !== lastNear.current) {
      lastNear.current = key;
      for (const a of game.animals) a.highlight = !!near && near.key === `ani:${a.id}`;
      api.current.near(near ? { key: near.key, label: near.label } : null);
    }
    if ((k.has('e') || k.has(' ') || k.has('enter')) && near) {
      k.delete('e');
      k.delete(' ');
      k.delete('enter');
      near.run();
    }

    /* ---------- camera ---------- */
    const cam = game.cam;
    const look = tmp.set(pp.x, pp.y + 1.35, pp.z);
    const snap = cam.snap;
    cam.snap = false;
    cam.look.lerp(look, snap ? 1 : Math.min(1, dt * (motion.reduced ? 30 : 9)));
    // Pull in closer when a tree trunk or a wall stands between the camera and the explorer.
    let dist = cam.dist;
    const ox = Math.sin(cam.yaw) * Math.cos(cam.pitch);
    const oz = Math.cos(cam.yaw) * Math.cos(cam.pitch);
    for (const o of t.obstacles) {
      const rx = o.x - cam.look.x;
      const rz = o.z - cam.look.z;
      const along = rx * ox + rz * oz;
      if (along <= 0.5 || along > dist) continue;
      const side = Math.abs(rx * oz - rz * ox);
      if (side < o.r + 0.7) dist = Math.max(2.5, Math.min(dist, along - o.r - 0.6));
    }
    camDist.current += (dist - camDist.current) * Math.min(1, dt * (dist < camDist.current ? 10 : 2));
    if (snap) camDist.current = dist;
    const want3 = new THREE.Vector3(
      cam.look.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * camDist.current,
      cam.look.y + Math.sin(cam.pitch) * camDist.current,
      cam.look.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * camDist.current,
    );
    want3.y = Math.max(want3.y, t.floorY(want3.x, want3.z) + 0.7, (t.water ?? -99) + 0.6);
    cam.pos.lerp(want3, snap ? 1 : Math.min(1, dt * (motion.reduced ? 30 : 6)));
    camera.position.copy(cam.pos);
    camera.lookAt(cam.look);

    nature.update({ river: t.water != null ? 30 : 99, storm: 0, rain: 0, inside: false, dt });
  });

  return null;
}

/* ------------------------------- world view ------------------------------- */

function Animals({ game, onTap }: { game: Game; onTap: (key: string) => void }) {
  return (
    <>
      {game.animals.map((a) => (
        <Beast key={a.id} agent={a} highlight={a.highlight} onTap={() => onTap(`ani:${a.id}`)} />
      ))}
    </>
  );
}

function TapMarker({ game, t }: { game: Game; t: Terrain }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const m = ref.current;
    if (!m) return;
    m.visible = !!game.target && !game.pending;
    if (game.target) {
      m.position.set(game.target.x, t.floorY(game.target.x, game.target.z) + 0.05, game.target.z);
      const s = 1 + Math.sin(st.clock.elapsedTime * 5) * 0.08;
      m.scale.set(s, s, s);
    }
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} renderOrder={3}>
      <ringGeometry args={[0.35, 0.5, 32]} />
      <meshBasicMaterial color="#fff4d0" transparent opacity={0.8} depthWrite={false} />
    </mesh>
  );
}

function Things({ def, t, data, game, carrying, act, isOn }: { def: WorldDef; t: Terrain; data: Save; game: Game; carrying: { task: string; idx: number } | null; act: (k: string) => void; isOn: (id?: string) => boolean }) {
  const open = (task: Task) => ready(task, data.done);
  return (
    <>
      {def.structures.map((s, i) => (
        <StructureView key={i} s={s} t={t} isOn={isOn} />
      ))}
      {def.tasks.map((task) => {
        const prog = data.prog[task.id] ?? [];
        const done = data.done.includes(task.id);
        switch (task.kind) {
          case 'read':
            return <ReadingMarker key={task.id} kind={task.marker} x={task.at[0]} z={task.at[1]} t={t} done={done} active={open(task)} onTap={() => act(`read:${task.id}`)} />;
          case 'quiz':
            return <ReadingMarker key={task.id} kind={task.marker ?? 'scroll'} x={task.at[0]} z={task.at[1]} t={t} done={done} active={open(task)} onTap={() => act(`quiz:${task.id}`)} />;
          case 'points': {
            const nextI = task.points.findIndex((_, j) => !prog.includes(j));
            return task.points.map((p, i) => (
              <PointSpot
                key={`${task.id}-${i}`}
                style={task.style}
                x={p.at[0]}
                z={p.at[1]}
                t={t}
                done={done || prog.includes(i)}
                active={open(task) && !prog.includes(i) && (!task.ordered || i === nextI)}
                onTap={() => act(`pt:${task.id}:${i}`)}
              />
            ));
          }
          case 'carry': {
            const piles = new Map<string, number[]>();
            task.loads.forEach((L, i) => {
              const key = L.from.join(',');
              if (!piles.has(key)) piles.set(key, []);
              if (!done && !prog.includes(i) && !(carrying?.task === task.id && carrying.idx === i)) piles.get(key)!.push(i);
            });
            return (
              <group key={task.id}>
                {[...piles.entries()].map(([key, idxs]) => {
                  const L = task.loads[task.loads.findIndex((x) => x.from.join(',') === key)];
                  return <Pile key={key} x={L.from[0]} z={L.from[1]} t={t} item={L.item} color={L.color} n={idxs.length} active={open(task) && !carrying && idxs.length > 0} onTap={() => idxs.length && act(`src:${task.id}:${idxs[0]}`)} />;
                })}
                {task.loads.map((L, i) => (
                  <Slot
                    key={i}
                    x={L.to[0]}
                    z={L.to[1]}
                    t={t}
                    item={L.item}
                    color={L.color}
                    result={task.result ?? 'item'}
                    filled={done || prog.includes(i)}
                    lift={L.lift}
                    active={carrying?.task === task.id && carrying.idx === i}
                    onTap={() => act(`dst:${task.id}:${i}`)}
                  />
                ))}
              </group>
            );
          }
          case 'lead':
            return (
              <group key={task.id} position={[task.pen[0], t.floorY(task.pen[0], task.pen[1]), task.pen[1]]}>
                <mesh rotation-x={-Math.PI / 2} position-y={0.05} renderOrder={2}>
                  <ringGeometry args={[3.6, 3.9, 40]} />
                  <meshBasicMaterial color="#fff2c0" transparent opacity={done ? 0.15 : 0.4} depthWrite={false} />
                </mesh>
              </group>
            );
          case 'guide':
            return game.boats
              .filter((b) => b.task === task.id)
              .map((b) => <GuidedBoat key={`${task.id}-${b.idx}`} state={b} color={task.boats[b.idx].color} sail={task.boats[b.idx].sail} active={open(task) && !b.done && !b.moving} onTap={() => act(`boat:${task.id}:${b.idx}`)} />);
          default:
            return null;
        }
      })}
      {(def.links ?? []).map((l, i) => (
        <Doorway key={i} x={l.at[0]} z={l.at[1]} t={t} onTap={() => act(`link:${i}`)} />
      ))}
      {(def.extras?.boats ?? []).map((b, i) => (
        <group key={`b${i}`} position={[b.at[0], (t.water ?? 0) + 0.05, b.at[1]]} rotation-y={b.rot ?? 0}>
          <Boat color={b.color} sail={b.sail} />
        </group>
      ))}
      {(def.extras?.motes ?? []).map((m, i) => (
        <Motes key={`m${i}`} center={m.at} r={m.r} color={m.color} height={t.y(m.at[0], m.at[1]) + 2} />
      ))}
    </>
  );
}

/** Orbit with a drag, zoom with the wheel or a pinch. Only drags that start on the 3D view count. */
function useOrbit(game: Game) {
  useEffect(() => {
    const pts = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const down = (e: PointerEvent) => {
      nature.start();
      if (!(e.target instanceof HTMLCanvasElement)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
    const moveFn = (e: PointerEvent) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      if (pointer.holding) {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        return;
      }
      if (pts.size === 2) {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) game.cam.dist = Math.min(16, Math.max(3.5, game.cam.dist * (pinch / d)));
        pinch = d;
        return;
      }
      game.cam.yaw -= (e.clientX - p.x) * 0.006;
      game.cam.pitch = Math.min(1.25, Math.max(0.02, game.cam.pitch + (e.clientY - p.y) * 0.004));
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      pinch = 0;
    };
    const wheel = (e: WheelEvent) => {
      if (!(e.target instanceof HTMLCanvasElement)) return;
      game.cam.dist = Math.min(16, Math.max(3.5, game.cam.dist * (1 + Math.sign(e.deltaY) * 0.08)));
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', moveFn);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('wheel', wheel, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', moveFn);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('wheel', wheel);
    };
  }, [game]);
}

/* ------------------------------- the app ------------------------------- */

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function Adventure({ n }: { n: number }) {
  const app = useAppState();
  const def = WORLDS[n];
  if (!app.ready) return <View style={st.root} />;
  if (!def)
    return (
      <View style={[st.root, st.center]}>
        <Text style={st.note}>This adventure world has not been built yet.</Text>
        <Pressable style={st.pill} onPress={() => router.replace('/adventure' as never)}>
          <Text style={st.pillText}>See the worlds that exist</Text>
        </Pressable>
      </View>
    );
  return <World key={n} def={def} />;
}

/** Build the land once: terrain, building footprints, then trees and rocks around them. */
function useLand(def: WorldDef) {
  return useMemo(() => {
    const t = makeTerrain(def.ground);
    return t;
  }, [def]);
}

function World({ def }: { def: WorldDef }) {
  const app = useAppState();
  const set = app.settings;
  const rec = useRecitation();
  const { width, height } = useWindowDimensions();
  const portrait = height > width;
  const [webgl] = useState(hasWebGL);
  const surah = getSurah(def.surah)!;

  const [data, setData] = useState<Save>(() => load(def.surah));
  const saveRef = useRef(data);
  saveRef.current = data;
  const update = useCallback(
    (f: (s: Save) => Save) => {
      const n = f(saveRef.current);
      saveRef.current = n;
      store(def.surah, n);
      setData(n);
    },
    [def.surah],
  );
  const isOn = useCallback((id?: string) => !!id && saveRef.current.done.includes(id), []);

  const t = useLand(def);
  const placed = useMemo(() => {
    // Buildings first, so trees keep clear of them and of every activity spot.
    for (const s of def.structures) footprint(s, t, (id) => !!id && saveRef.current.done.includes(id));
    const spot = (p: P2, r: number) => t.keepClear.push({ x: p[0], z: p[1], r });
    for (const task of def.tasks) {
      if (task.kind === 'read' || task.kind === 'quiz') spot(task.at, 3);
      if (task.kind === 'points') task.points.forEach((p) => spot(p.at, 2.5));
      if (task.kind === 'carry') task.loads.forEach((L) => (spot(L.from, 2.5), spot(L.to, 1.8)));
      if (task.kind === 'lead') (spot(task.pen, 5), spot(task.herd.at, task.herd.r * 0.6));
      if (task.kind === 'pick') task.choices.forEach((c) => spot(c.at, 2.5));
    }
    for (const l of def.links ?? []) spot(l.at, 3);
    spot(def.start, 4);
    return place(t, def.veg, def.seed);
  }, [def, t]);

  const [reduced, setReduced] = useState(app.motionOff);
  motion.reduced = reduced;
  const [autoTier, setAutoTier] = useState<QualityTier>(guessTier);
  const forced = (typeof location !== 'undefined' ? new URLSearchParams(location.search).get('q') : null) as QualityTier | null;
  const tier = forced && forced in QUALITY ? forced : set.quality === 'auto' ? autoTier : set.quality;
  const Q = QUALITY[tier];
  const q: SceneQuality = useMemo(() => ({ grass: Q.vegetation, segments: Q.terrainSegments, shadows: Q.shadows, shadowMap: Math.max(1024, Q.shadowMap) }), [Q]);

  const move = useRef<Move>({ x: 0, y: 0, run: false });
  const [near, setNear] = useState<{ key: string; label: string } | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [hint, setHint] = useState('');
  const [quiet, setQuiet] = useState(set.quietMode);
  const [carrying, setCarrying] = useState<{ task: string; idx: number } | null>(null);
  const [region, setRegion] = useState('');
  const [showList, setShowList] = useState(!portrait);

  const game = useMemo<Game>(() => {
    const s = saveRef.current;
    const p = s.pos ? new THREE.Vector3(...s.pos) : v3(def.start, t);
    player.pos.copy(p);
    player.pos.y = t.floorY(p.x, p.z);
    player.yaw = def.startYaw ?? 0;
    player.inside = false;
    player.speed = 0;
    weather.storm = 0;
    weather.rain = 0;
    weather.water = t.water ?? -99;
    weather.lift = 0;
    weather.rampUp = 0;
    const back = (def.startYaw ?? 0) + Math.PI;
    return {
      animals: makeAnimals(def, s, t),
      boats: makeBoats(def, s, t),
      carrying: null,
      target: null,
      pending: null,
      cam: { yaw: back, pitch: 0.32, dist: 8, pos: p.clone().add(new THREE.Vector3(Math.sin(back) * 8, 3, Math.cos(back) * 8)), look: p.clone() },
      timeScale: 1,
      next: { current: null },
      trail: [],
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useOrbit(game);

  useEffect(() => {
    nature.setVolumes({ ambience: set.ambienceVolume, effects: set.effectsVolume, quiet });
  }, [set.ambienceVolume, set.effectsVolume, quiet]);

  useEffect(() => {
    const id = setInterval(() => {
      update((s) => ({ ...s, pos: [player.pos.x, player.pos.y, player.pos.z] }));
      setCarrying(game.carrying ? { ...game.carrying } : null);
      if (def.regions?.length) {
        let best = '';
        let bd = 1e9;
        for (const r of def.regions) {
          const d = Math.hypot(r.at[0] - player.pos.x, r.at[1] - player.pos.z);
          if (d < bd) {
            bd = d;
            best = r.name;
          }
        }
        setRegion(best);
      }
    }, 600);
    return () => clearInterval(id);
  }, [update, game, def]);

  const say = useCallback((text: string) => setCards((c) => (c.some((x) => x.kind === 'narration' && x.text === text) ? c : [...c, { kind: 'narration', text }])), []);

  useEffect(() => {
    if (!data.seen.includes('welcome')) {
      say(def.welcome);
      update((s) => ({ ...s, seen: [...s.seen, 'welcome'] }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Introduce each task the first time it becomes the thing to do.
  const current = def.tasks.find((x) => ready(x, data.done));
  useEffect(() => {
    if (current?.intro && !data.seen.includes(current.id)) {
      say(current.intro);
      update((s) => ({ ...s, seen: [...s.seen, current.id] }));
    }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hint) return;
    const tm = setTimeout(() => setHint(''), Math.max(3500, hint.length * 60));
    return () => clearTimeout(tm);
  }, [hint]);

  const finish = useCallback(
    (id: string) => {
      if (saveRef.current.done.includes(id)) return;
      const task = def.tasks.find((x) => x.id === id)!;
      update((s) => ({ ...s, done: [...s.done, id] }));
      if (task.outro) say(task.outro);
      if (task.after) setCards((c) => [...c, { kind: 'reading', reading: task.after! }]);
      if (def.tasks.every((x) => saveRef.current.done.includes(x.id)) && !saveRef.current.finished) {
        update((s) => ({ ...s, finished: true }));
        setCards((c) => [...c, { kind: 'finale' }]);
      }
    },
    [def, update, say],
  );

  const api = useRef<Api>(null as unknown as Api);
  api.current = {
    save: () => saveRef.current,
    progress: (id, i) => {
      const task = def.tasks.find((x) => x.id === id)!;
      const prog = saveRef.current.prog[id] ?? [];
      if (prog.includes(i)) return;
      const next = [...prog, i];
      update((s) => ({ ...s, prog: { ...s.prog, [id]: next } }));
      setCarrying(game.carrying ? { ...game.carrying } : null);
      const total = task.kind === 'points' ? task.points.length : task.kind === 'carry' ? task.loads.length : task.kind === 'lead' ? task.n : task.kind === 'guide' ? task.boats.length : 1;
      if (next.length >= total) finish(id);
      else setHint(`${task.title}: ${next.length} of ${total}`);
    },
    finish,
    hint: (text) => {
      setHint(text);
      setCarrying(game.carrying ? { ...game.carrying } : null);
    },
    open: (c) => setCards((cs) => [...cs.filter((x) => x.kind !== 'reading' && x.kind !== 'quiz'), c]),
    near: setNear,
  };

  const act = (key: string) => {
    nature.start();
    (game as unknown as { act?: (k: string) => void }).act?.(key);
  };
  const tapGround = (p: THREE.Vector3) => {
    nature.start();
    game.target = p.clone();
    game.pending = null;
  };

  // Test hooks.
  useEffect(() => {
    (globalThis as Record<string, unknown>).__adv = {
      def,
      game,
      player,
      t,
      act,
      save: () => saveRef.current,
      teleport: (x: number, z: number) => {
        player.pos.set(x, t.floorY(x, z), z);
        game.cam.look.copy(player.pos);
        game.cam.snap = true;
      },
      view: (yaw: number, pitch: number, dist: number) => void Object.assign(game.cam, { yaw, pitch, dist, snap: true }),
      speed: (k: number) => (game.timeScale = k),
      finish,
      progress: (id: string, i: number) => api.current.progress(id, i),
      cards: () => cards.map((c) => c.kind),
      close: () => setCards((c) => c.slice(1)),
      open: (kind: 'book' | 'about' | 'finale') => setCards((c) => [...c, { kind } as Card]),
    };
  });

  const top = cards[0];
  const total = def.tasks.length;
  const doneN = def.tasks.filter((x) => data.done.includes(x.id)).length;
  const objective = data.finished ? 'You finished every activity. Explore, or read the whole surah.' : current ? current.goal : 'Explore';
  const carriedLoad = carrying ? (def.tasks.find((x) => x.id === carrying.task) as Extract<Task, { kind: 'carry' }> | undefined)?.loads[carrying.idx] : undefined;

  if (!webgl)
    return (
      <View style={[st.root, st.center]}>
        <Text style={st.note}>This adventure is 3D and needs WebGL, which this browser has turned off.</Text>
      </View>
    );

  return (
    <View style={st.root}>
      <Canvas
        shadows={q.shadows ? 'soft' : false}
        dpr={Q.dpr}
        gl={{ antialias: tier !== 'low', powerPreference: 'high-performance' }}
        camera={{ fov: portrait ? 70 : 55, near: 0.1, far: 3000, position: [0, 6, 70] }}
        style={{ position: 'absolute', inset: 0 } as never}
      >
        <SoftShapes />
        <PerformanceMonitor onDecline={() => set.quality === 'auto' && setAutoTier((x) => lowerTier(x))} />
        <Sky look={def.look} />
        {def.look.moon && <Moon look={def.look} />}
        <Lighting q={q} look={def.look} />
        <Wind />
        <GroundMesh t={t} q={q} onTap={tapGround} />
        <GrassField t={t} veg={def.veg} q={q} />
        <FlowerField t={t} veg={def.veg} q={q} />
        <Trees t={t} placed={placed} q={q} />
        <RockField t={t} placed={placed} q={q} />
        {t.water != null && <StillWater t={t} look={def.look} />}
        <FarLand t={t} tint={def.far} />
        <Mountains color={def.mountains?.color} height={def.mountains?.height} seed={def.seed} />
        {(def.look.clouds ?? 1) > 0 && <CloudLayer look={def.look} />}
        {def.look.birds !== false && <Flock center={def.start} />}
        <Things def={def} t={t} data={data} game={game} carrying={carrying} act={act} isOn={isOn} />
        <Animals game={game} onTap={act} />
        <Carried item={carriedLoad?.item ?? null} color={carriedLoad?.color} />
        <Child />
        <TapMarker game={game} t={t} />
        <Wayfinder at={game.next} />
        <Director def={def} t={t} game={game} move={move} api={api} />
        {Q.post && (
          <EffectComposer multisampling={tier === 'high' ? 4 : 0}>
            {tier === 'high' ? <N8AO aoRadius={1.6} distanceFalloff={0.6} intensity={2.2} halfRes /> : <></>}
            <Bloom mipmapBlur intensity={0.7} luminanceThreshold={1.05} luminanceSmoothing={0.25} />
            <Vignette offset={0.32} darkness={0.42} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            <HueSaturation saturation={0.16} />
            <BrightnessContrast brightness={0.02} contrast={0.06} />
          </EffectComposer>
        )}
      </Canvas>

      <View style={st.topBar} pointerEvents="box-none">
        <View style={{ gap: 6 }}>
          <Pressable style={st.pill} onPress={() => (router.canGoBack() ? router.back() : router.replace('/adventure' as never))} accessibilityRole="button" accessibilityLabel="Leave this world">
            <Text style={st.pillText}>‹ Leave</Text>
          </Pressable>
          <Pressable style={st.pill} onPress={() => setCards((c) => [...c, { kind: 'book' }])} accessibilityRole="button">
            <Text style={st.pillText}>Read the whole surah</Text>
          </Pressable>
          <Pressable style={st.pill} onPress={() => setCards((c) => [...c, { kind: 'about' }])} accessibilityRole="button">
            <Text style={st.pillText}>About this world</Text>
          </Pressable>
        </View>
        <View style={st.objective} pointerEvents="box-none">
          <Text style={st.title}>
            {def.name} · Surah {surah.nameTransliterated}
          </Text>
          {!!region && <Text style={st.region}>{region}</Text>}
          <Text style={st.goal}>{objective}</Text>
          <Pressable onPress={() => setShowList((v) => !v)} accessibilityRole="button">
            <Text style={st.count}>
              {doneN} of {total} activities {showList ? '▴' : '▾'}
            </Text>
          </Pressable>
          {showList && (
            <View style={st.pairs} pointerEvents="none">
              {def.tasks.filter((x) => !def.regions?.length || x.region === (current ?? def.tasks[def.tasks.length - 1]).region).map((x) => (
                <Text key={x.id} style={[st.pair, data.done.includes(x.id) && st.pairDone, x === current && st.pairNow]}>
                  {data.done.includes(x.id) ? '✓ ' : ''}
                  {x.title}
                </Text>
              ))}
            </View>
          )}
        </View>
        <View style={{ gap: 6, alignItems: 'flex-end' }}>
          <Pressable style={st.pill} onPress={() => setReduced((r) => !r)} accessibilityRole="switch" accessibilityState={{ checked: reduced }}>
            <Text style={st.pillText}>{reduced ? 'Calm motion: on' : 'Calm motion: off'}</Text>
          </Pressable>
          <Pressable
            style={st.pill}
            onPress={() => {
              nature.start();
              setQuiet((v) => !v);
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: !quiet }}
          >
            <Text style={st.pillText}>{quiet ? 'Sounds: off' : 'Sounds: on'}</Text>
          </Pressable>
          <Pressable
            style={st.pill}
            onPress={() => {
              try {
                localStorage.removeItem(KEY(def.surah));
              } catch {}
              window.location.reload();
            }}
          >
            <Text style={st.pillText}>Start over</Text>
          </Pressable>
        </View>
      </View>

      {!!hint && !top && (
        <View style={st.hintWrap} pointerEvents="none">
          <Text style={st.hint}>{hint}</Text>
        </View>
      )}

      {near && !top && (
        <Pressable style={st.action} onPress={() => act(near.key)} accessibilityRole="button" accessibilityLabel={near.label}>
          <Text style={st.actionText}>{near.label}</Text>
          <Text style={st.actionKey}>E</Text>
        </Pressable>
      )}

      {!top && <Joystick move={move} />}

      {top && (
        <CardView
          card={top}
          world={def}
          portrait={portrait}
          onClose={() => {
            Speech.stop();
            setCards((c) => c.slice(1));
          }}
          onSolved={() => top.kind === 'quiz' && finish(top.task.id)}
          listen={(s, a) => rec.play(s, a)}
        />
      )}

      {data.finished && !top && (
        <View style={st.endRow} pointerEvents="box-none">
          <Pressable style={st.pill} onPress={() => setCards((c) => [...c, { kind: 'finale' }])}>
            <Text style={st.pillText}>Read the reflection again</Text>
          </Pressable>
        </View>
      )}

      <Text style={st.footer} pointerEvents="none">
        Draft for scholarly review · places, buildings and activities are game ideas, not historical claims · no prophet, angel or anything of the unseen is shown
      </Text>
    </View>
  );
}

/** Touch stick: push to walk, push to the edge to hurry. Works with a mouse too. */
function Joystick({ move }: { move: MutableRefObject<Move> }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const R = 48;
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => nature.start(),
      onPanResponderMove: (_, g) => {
        const d = Math.hypot(g.dx, g.dy);
        const k = d > R ? R / d : 1;
        setKnob({ x: g.dx * k, y: g.dy * k });
        move.current = { x: (g.dx * k) / R, y: (-g.dy * k) / R, run: d > R * 1.5 };
      },
      onPanResponderRelease: () => {
        setKnob({ x: 0, y: 0 });
        move.current = { x: 0, y: 0, run: false };
      },
      onPanResponderTerminate: () => {
        setKnob({ x: 0, y: 0 });
        move.current = { x: 0, y: 0, run: false };
      },
    }),
  ).current;
  return (
    <View style={st.stickWrap} pointerEvents="box-none">
      <View style={st.stick} {...responder.panHandlers} accessibilityLabel="Walking stick. Keyboard: W A S D or arrow keys, Shift to hurry, E to use.">
        <View style={[st.knob, { transform: [{ translateX: knob.x }, { translateY: knob.y }] }]} />
      </View>
      <Text style={st.stickHint}>Walk · drag the view to look · tap the ground to go there</Text>
    </View>
  );
}

const glass = { backgroundColor: 'rgba(30,22,14,0.55)', borderRadius: 999 };
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a140e', overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  note: { fontFamily: fonts.body, fontSize: 16, color: '#efe0c4', textAlign: 'center' },
  topBar: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  pill: { ...glass, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#fbeed4' },
  objective: { flex: 1, alignItems: 'center', gap: 4 },
  title: { fontFamily: fonts.display, fontSize: 18, color: '#fff6e2', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 10 },
  region: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#ffe6b0', letterSpacing: 1, textTransform: 'uppercase', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  goal: { fontFamily: fonts.body, fontSize: 14, color: '#fbeed4', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.65)', textShadowRadius: 8, maxWidth: 520 },
  count: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff6e2', ...glass, paddingHorizontal: 10, paddingVertical: 3, overflow: 'hidden' },
  pairs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, maxWidth: 560 },
  pair: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,246,226,0.75)', ...glass, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  pairDone: { color: '#fff6e2', backgroundColor: 'rgba(90,120,60,0.7)' },
  pairNow: { color: '#fff6e2', backgroundColor: 'rgba(170,120,50,0.8)' },
  hintWrap: { position: 'absolute', left: 16, right: 16, bottom: 150, alignItems: 'center' },
  hint: { fontFamily: fonts.body, fontSize: 15, color: '#fff6e2', ...glass, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, maxWidth: 560, textAlign: 'center', overflow: 'hidden' },
  action: { position: 'absolute', right: 20, bottom: 42, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,240,205,0.95)', borderRadius: 999, paddingLeft: 20, paddingRight: 8, paddingVertical: 8, maxWidth: '70%' } as never,
  actionText: { fontFamily: fonts.bodyBold, fontSize: 16, color: '#4a3220', flexShrink: 1 },
  actionKey: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff6e2', backgroundColor: '#8a5a34', borderRadius: 999, width: 28, height: 28, textAlign: 'center', lineHeight: 28, overflow: 'hidden' },
  stickWrap: { position: 'absolute', left: 22, bottom: 26, alignItems: 'flex-start', gap: 6 },
  stick: { width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(255,246,226,0.16)', borderWidth: 2, borderColor: 'rgba(255,246,226,0.4)', alignItems: 'center', justifyContent: 'center' },
  knob: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,246,226,0.85)' },
  stickHint: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,246,226,0.85)', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  endRow: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  footer: { position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontFamily: fonts.body, fontSize: 10, color: 'rgba(255,246,226,0.7)', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
});
