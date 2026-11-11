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
import { stopVoice } from '@/state/voice';
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
import { Rain, Wind } from '@/ark/Scenery';
import { motion, player, pointer, weather, type Move } from '@/ark/shared';
import { CardView, type Card } from './cards';
import { Boat, StructureView, footprint } from './kit';
import { Carried, Doorway, GuidedBoat, Pile, PointSpot, ReadingMarker, Slot, Wayfinder } from './props';
import { Balance, FlowView, GoRing, HomeLamp, NeedSign, PlayerBoat, PromiseBoard, PromiseSpot, SkyDial, StandPlate, WatchRing, type FlowState } from './mech';
import { ChoiceCard, ShareCard, VowCard, WeighCard } from './panels';
import { CloudLayer, FarLand, Flock, FlowerField, GroundBirds, GrassField, GroundMesh, Lighting, Moon, Motes, Mountains, RockField, Sky, StillWater, Trees, place, type SceneQuality } from './Scenery';
import { makeTerrain, rng, type P2, type Terrain } from './terrain';
import type { FlowTask, Reading, Task, WorldDef } from './types';
import { WORLDS } from './worlds';
import { level, LEVELS } from './level';
import { makeNav, type Nav } from '@/creatures/nav';
import { mindOf, routeTo, think } from '@/creatures/mind';
import { journal } from '@/journal/store';
import { celebrate, cue, cueFor } from '@/profile/figure/cue';
import { mechFor } from './mechanics';
import { noteAdventure } from '@/home/adventures';
import { loadPhysics, physicsReady, type Space, type Walker } from '@/physics/space';
import { makeSpace } from './space';
import { validateSpace } from '@/physics/validate';
import { ColliderView, debugColliders } from '@/physics/DebugView';
import { PropSolids } from '@/physics/PropSolids';
import { auditScene } from '@/physics/sceneSolids';
import { useActionHint } from '@/audio/hooks';
import { ListeningSheet } from '@/audio/ListeningSettings';
import type { MechEnv } from './mechanics/base';

/* ------------------------------- saving ------------------------------- */

type Save = { done: string[]; prog: Record<string, number[]>; seen: string[]; pos?: [number, number, number]; finished?: boolean };
const KEY = (n: number) => `quran-adventure.world-${n}.v1`;
const fresh = (): Save => ({ done: [], prog: {}, seen: [] });
const STEP = 1 / 60;
/** Share of the way to close this frame when easing at rate k: the same over a second at any frame rate. */
const damp = (dt: number, k: number) => 1 - Math.exp(-k * dt);

/**
 * Solid at a spot, for route planning: answers are kept on a 0.2 m grid until
 * the colliders change, so planning a long route never stalls a frame.
 */
const navCache = new WeakMap<Space, { v: number; m: Map<number, boolean> }>();
function navBlocked(space: Space, x: number, z: number, r: number) {
  let c = navCache.get(space);
  if (!c || c.v !== space.version) navCache.set(space, (c = { v: space.version, m: new Map() }));
  const k = ((Math.round(x * 5) + 4096) * 8192 + (Math.round(z * 5) + 4096)) * 16 + Math.min(15, Math.round(r * 10));
  let b = c.m.get(k);
  if (b === undefined) c.m.set(k, (b = space.blockedAt(Math.round(x * 5) / 5, Math.round(z * 5) / 5, r * 0.9)));
  return b;
}
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

type Ani = Agent & { task: string; idx: number; penned: boolean; tid?: number; w?: Walker; stuck?: number };
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
  /** The explorer's own boat (sailing worlds). */
  boat: { on: boolean; yaw: number; speed: number };
  /** Seconds stood still / watched, by key. */
  hold: Record<string, number>;
  /** Mountain gusts. */
  gust: { t: number; warned: boolean };
  /** Has the explorer walked away (for places you come back to). */
  away: Record<string, boolean>;
  /** When each live promise's candle burns out (game clock). */
  vows: Record<string, number>;
  clock: number;
  flow: Record<string, FlowState>;
  /** Live state of plug-in kinds of play (mechanics/), by task id. */
  mech: Record<string, unknown>;
  /** One-off hints already given. */
  told: Record<string, number>;
  /** A short live status line for the current activity (water left, candles, ...). */
  status: string;
  /** Finds ways round walls, water and rocks (animals, tap-to-go, the footstep trail). */
  nav: Nav;
  /** The physics space: every solid, the water and the edge. */
  space: Space;
  /** The drawn scene (for the missing-collider audit). */
  scene?: THREE.Scene;
  /** The explorer's capsule in it. */
  me: Walker;
  /** Fixed-step accumulator for movement, commanded walking speed, time spent pushing against something. */
  acc: number;
  cmd: number;
  stuck: number;
  /** The capsule's place one physics step ago (drawing goes between), and where the explorer was last drawn. */
  prev: { x: number; y: number; z: number };
  at: { x: number; z: number };
  /** Firm places stood on lately, oldest first, for "Return to safe ground". */
  safes: { x: number; y: number; z: number; at: number }[];
  /** Where the explorer was put at the start (after the spawn check). */
  spawn: P2;
  /** Times the explorer was put back on safe ground (for tests). */
  recovered: number;
  wip: number;
  wipMax: number;
  /** Tap-to-go waypoints toward `target`. */
  route: THREE.Vector3[];
  routeFor: THREE.Vector3 | null;
  /** Footsteps to the next place, and until when they show when asked for. */
  way: { pts: THREE.Vector3[]; until: number; at: number };
};

/** How many steps finish a task. */
export function total(task: Task) {
  switch (task.kind) {
    case 'points':
      return task.points.length;
    case 'carry':
      return task.loads.length;
    case 'lead':
      return task.n;
    case 'guide':
      return task.boats.length;
    case 'observe':
      return task.subjects.length;
    case 'sky':
      return task.phases.length;
    case 'sail':
      return task.stops.length + 1;
    case 'choice':
      return task.scenes.length;
    case 'share':
      return task.homes.length;
    case 'promise':
      return task.promises.length;
    case 'sift':
      return task.rounds.length;
    case 'return':
      return task.times;
    default:
      return mechFor(task)?.total(task) ?? 1;
  }
}

/** Where the rain water goes with the gates as they are now, and the way it takes. */
export function flowRoute(task: FlowTask, f: FlowState): { dest: string; pts: P2[] } {
  const pts: P2[] = [task.source];
  let node = task.first;
  for (let i = 0; i < 12; i++) {
    const g = task.gates.find((x) => x.id === node);
    if (!g) break;
    pts.push(g.at);
    node = f.gates[g.id] === 'b' ? g.b : g.a;
  }
  const end = task.cisterns.find((c) => c.id === node)?.at ?? task.sand.find((c) => c.id === node)?.at;
  if (end) pts.push(end);
  return { dest: node, pts };
}

export const freshFlow = (task: FlowTask): FlowState => ({ running: false, water: task.rain, spill: 0, filled: {}, gates: Object.fromEntries(task.gates.map((g) => [g.id, 'a' as const])) });

/** The reading that belongs to an activity itself (shown when it is finished). */
export function ownReading(task: Task): Reading | undefined {
  return 'reading' in task && task.kind !== 'read' ? (task as { reading?: Reading }).reading : undefined;
}

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
    if (task.kind === 'sift') {
      const gone = s.prog[`${task.id}/x`] ?? [];
      task.herd.forEach((c, i) => {
        const away = gone.includes(i);
        const at: P2 = away ? [task.away[0] + Math.cos(i * 2.4) * 3, task.away[1] + Math.sin(i * 2.4) * 3] : c.at;
        const a = mk(task.id, i, task.animal, v3(at, t), { look: c.look, scale: c.scale ?? 1, mate: 0 });
        out.push(a);
      });
    }
    if (task.kind === 'observe')
      task.subjects.forEach((sub, si) => {
        if (!sub.animal) return;
        for (let i = 0; i < (sub.n ?? 3); i++) {
          const a = r() * 6.28;
          const d = Math.sqrt(r()) * sub.r * 0.6;
          out.push(mk(`obs-${task.id}-${si}`, i, sub.animal, v3([sub.at[0] + Math.cos(a) * d, sub.at[1] + Math.sin(a) * d], t), { scale: i === 0 && (sub.n ?? 3) > 2 ? 0.6 : 0.9 + r() * 0.2 }));
        }
      });
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
  say: (text: string) => void;
  /** Add to a side list in the save (heard rounds, animals sent away, late promises) without finishing anything. */
  note: (key: string, i: number) => void;
  /** Replace a side list in the save. */
  set: (key: string, v: number[]) => void;
  /** Open a plug-in task's own panel. */
  panel: (task: Task) => void;
};

function Director({ def, t, game, move, api }: { def: WorldDef; t: Terrain; game: Game; move: MutableRefObject<Move>; api: MutableRefObject<Api> }) {
  const { camera } = useThree();
  (game as unknown as { camera: THREE.Camera }).camera = camera;
  const keys = useRef(new Set<string>());
  const lastNear = useRef('');
  const camDist = useRef(game.cam.dist);
  const camPitch = useRef(game.cam.pitch);
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

  /** What a plug-in kind of play sees (mechanics/). */
  function mechEnv(task: Task, s: Save, dt = 0, still = false, tell: MechEnv['tell'] = () => undefined): MechEnv {
    return { def, t, save: s, prog: s.prog[task.id] ?? [], api: api.current, game, pp: player.pos, still, dt, tell, v3: (p, dy = 0) => v3(p, t, dy) };
  }

  /** Everything that can be used right now. */
  function uses(): Use[] {
    const s = api.current.save();
    const out: Use[] = [];
    for (const task of def.tasks) {
      if (!ready(task, s.done)) continue;
      const prog = s.prog[task.id] ?? [];
      const plug = mechFor(task);
      if (plug) {
        if (plug.uses) out.push(...plug.uses(task, mechEnv(task, s)));
        continue;
      }
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
        case 'stand':
        case 'reach':
          out.push({ key: `go:${task.id}`, pos: v3(task.at, t), label: task.label, reach: 0, run: () => undefined });
          break;
        case 'observe':
          task.subjects.forEach((sub, i) => {
            if (!prog.includes(i)) out.push({ key: `go:${task.id}:${i}`, pos: v3(sub.at, t), label: sub.label, reach: 0, run: () => undefined });
          });
          break;
        case 'return':
          if (prog.length === 0 || game.away[task.id]) out.push({ key: `go:${task.id}`, pos: v3(task.at, t), label: task.label, reach: 0, run: () => undefined });
          break;
        case 'sky': {
          const ph = task.phases[prog.length];
          if (ph)
            out.push({ key: `sky:${task.id}`, pos: v3(task.at, t), label: `Turn the sky-dial: ${ph.label}`, reach: 3.2, run: () => {
              nature.place();
              api.current.progress(task.id, prog.length);
              api.current.open({ kind: 'reading', reading: ph.reading });
            } });
          break;
        }
        case 'sail': {
          const w = t.water ?? 0;
          if (!game.boat.on)
            out.push({ key: `board:${task.id}`, pos: v3(task.dock, t), label: 'Board your boat', reach: 3.4, run: () => {
              game.boat.on = true;
              game.boat.speed = 0;
              game.boat.yaw = task.launchYaw ?? 0;
              player.pos.set(task.launch[0], w + 0.3, task.launch[1]);
              player.yaw = game.boat.yaw;
              game.target = null;
              game.cam.dist = Math.max(game.cam.dist, 12);
              nature.place();
              api.current.hint('You are sailing. Steer with the stick or the arrow keys; tap the sea to head there.');
            } });
          else {
            const i = task.stops.findIndex((_, j) => !prog.includes(j));
            if (i >= 0) out.push({ key: `go:${task.id}:${i}`, pos: new THREE.Vector3(task.stops[i].at[0], w, task.stops[i].at[1]), label: task.stops[i].label, reach: 0, run: () => undefined });
            out.push({ key: `ashore:${task.id}`, pos: new THREE.Vector3(task.launch[0], w, task.launch[1]), label: 'Step ashore', reach: 7, run: () => {
              game.boat.on = false;
              game.boat.speed = 0;
              const d = v3(task.dock, t);
              player.pos.copy(d);
              game.target = null;
              game.cam.snap = true;
              game.cam.look.copy(d);
              if (task.stops.every((_, j) => (api.current.save().prog[task.id] ?? []).includes(j))) api.current.progress(task.id, task.stops.length);
            } });
          }
          break;
        }
        case 'choice':
          out.push({ key: `choice:${task.id}`, pos: v3(task.at, t), label: task.title, reach: 3.2, run: () => api.current.open({ kind: 'choice', task }) });
          break;
        case 'share':
          out.push({ key: `share:${task.id}`, pos: v3(task.at, t), label: task.title, reach: 3.4, run: () => api.current.open({ kind: 'share', task }) });
          break;
        case 'weigh':
          out.push({ key: `weigh:${task.id}`, pos: v3(task.at, t), label: task.title, reach: 3.2, run: () => api.current.open({ kind: 'weigh', task }) });
          break;
        case 'promise': {
          const took = (s.prog[`${task.id}/a`] ?? []).length > 0;
          if (!took) out.push({ key: `vows:${task.id}`, pos: v3(task.at, t), label: 'Read the promise board', reach: 3.4, run: () => api.current.open({ kind: 'vow', task }) });
          else
            task.promises.forEach((p, i) => {
              if (prog.includes(i)) return;
              out.push({ key: `vow:${task.id}:${i}`, pos: v3(p.at, t), label: p.verb, reach: 3, run: () => {
                const late = game.clock > (game.vows[`${task.id}:${i}`] ?? 1e9);
                if (late) api.current.note(`${task.id}/late`, i);
                nature.place();
                api.current.hint(late ? `${p.done} The candle had burned out first: kept late, but kept.` : `${p.done} Promise kept in time.`);
                api.current.progress(task.id, i);
              } });
            });
          break;
        }
        case 'flow': {
          const f = (game.flow[task.id] ??= freshFlow(task));
          out.push({ key: `rain:${task.id}`, pos: v3(task.source, t), label: f.running ? 'Close the sluice' : 'Open the sluice', reach: 3.6, run: () => {
            f.running = !f.running;
            nature.place();
          } });
          for (const g of task.gates) {
            const to = (id: string) => task.cisterns.find((c) => c.id === id)?.label ?? (task.gates.some((x) => x.id === id) ? 'the next gate' : 'the sand');
            const other = f.gates[g.id] === 'b' ? g.a : g.b;
            out.push({ key: `gate:${task.id}:${g.id}`, pos: v3(g.at, t), label: `Turn the gate toward ${to(other)}`, reach: 2.8, run: () => {
              f.gates[g.id] = f.gates[g.id] === 'b' ? 'a' : 'b';
              nature.place();
            } });
          }
          break;
        }
        case 'sift': {
          const r = prog.length;
          const heard = (s.prog[`${task.id}/h`] ?? []).includes(r);
          const gone = s.prog[`${task.id}/x`] ?? [];
          const mid = task.herd.reduce((a, c) => [a[0] + c.at[0] / task.herd.length, a[1] + c.at[1] / task.herd.length] as P2, [0, 0] as P2);
          if (!heard && task.rounds[r])
            out.push({ key: `ask:${task.id}`, pos: v3([mid[0] + 4, mid[1]], t), label: 'Hear the next answer', reach: 4.5, run: () => {
              api.current.note(`${task.id}/h`, r);
              api.current.open({ kind: 'reading', reading: task.rounds[r].reading });
              api.current.hint(task.rounds[r].say);
            } });
          else
            for (const a of game.animals)
              if (a.task === task.id && !gone.includes(a.idx))
                out.push({ key: `ani:${a.id}`, pos: a.pos, label: 'Send this one back to the pasture', reach: 3.2, run: () => {
                  const R = task.rounds[r];
                  if (task.herd[a.idx].traits.includes(R.keep)) {
                    api.current.hint(R.wrong);
                    return;
                  }
                  api.current.note(`${task.id}/x`, a.idx);
                  a.home.set(task.away[0] + Math.cos(a.idx * 2.4) * 3, 0, task.away[1] + Math.sin(a.idx * 2.4) * 3);
                  a.target = a.home.clone();
                  a.timer = 0;
                  nature.call(a.kind as never);
                  const left = task.herd.filter((c, i) => !api.current.save().prog[`${task.id}/x`]?.includes(i) && !c.traits.includes(R.keep));
                  if (!left.length) api.current.progress(task.id, r);
                  else api.current.hint(`Sent back. ${left.length} more ${left.length === 1 ? 'does' : 'do'} not fit.`);
                } });
          break;
        }
      }
    }
    (def.warps ?? []).forEach((w, i) => {
      if (w.show && !s.done.includes(w.show)) return;
      out.push({ key: `warp:${i}`, pos: v3(w.at, t), label: w.label, reach: 3, run: () => {
        player.pos.copy(v3(w.to, t));
        player.yaw = w.toYaw ?? player.yaw;
        game.cam.yaw = player.yaw + Math.PI;
        game.cam.look.copy(player.pos);
        game.cam.snap = true;
        game.target = null;
        game.trail.length = 0;
        nature.place();
      } });
    });
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
      if (game.boat.on && !key.startsWith('ashore:') && !key.startsWith('go:')) {
        api.current.hint('Sail back to the dock and step ashore first.');
        return;
      }
      game.target = u.pos.clone();
      game.pending = u.reach > 0 ? key : null;
      return;
    }
    cueFor(u.label);
    u.run();
  }
  (game as unknown as { act: (k: string) => void }).act = act;
  (game as unknown as { uses: () => Use[] }).uses = uses;
  useEffect(() => {
    cue.holding = false;
    cue.leading = false;
    cue.sitting = false;
  }, []);

  // Runs before everything else each frame (priority -1), so the explorer, the
  // animals and the camera are all drawn at this frame's positions. It used to
  // run after the figure, which then showed last frame's step every frame:
  // with uneven frame times that read as a stutter.
  useFrame((st, rawDt) => {
    const dt = Math.min(0.05, rawDt) * game.timeScale;
    weather.time = st.clock.elapsedTime;
    if (game.carrying) cue.holding = true;
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
      // Walk round walls and water: follow waypoints from the navigator (not while sailing).
      if (game.routeFor !== game.target) {
        game.routeFor = game.target;
        game.route = game.boat.on ? [] : game.nav.route(player.pos, game.target, { r: 0.35, budget: 2500, near: game.pending ? 2 : 1.2 }) ?? [];
      }
      while (game.route.length > 1 && Math.hypot(game.route[0].x - player.pos.x, game.route[0].z - player.pos.z) < 0.7) game.route.shift();
      const wp = game.route.length > 1 ? game.route[0] : game.target;
      const d = Math.hypot(game.target.x - player.pos.x, game.target.z - player.pos.z);
      const tx = wp.x - player.pos.x;
      const tz = wp.z - player.pos.z;
      const dw = Math.hypot(tx, tz) || 1;
      const want = game.pending ? (game.pending.startsWith('boat') ? 36 : game.pending.startsWith('ashore') ? 6 : 2.2) : game.boat.on ? 3 : 0.4;
      if (d < want) {
        game.target = null;
        if (game.pending) {
          const p = game.pending;
          game.pending = null;
          act(p);
        }
      } else {
        dx = tx / dw;
        dz = tz / dw;
      }
    }
    game.clock += dt;
    if (game.boat.on) {
      // Sailing: the boat turns toward where you steer and glides; it keeps to water deep enough to float.
      const b = game.boat;
      const mag = Math.hypot(dx, dz);
      const wantSp = mag > 0.05 ? (run ? 11 : 7.5) * Math.min(1, mag) : 0;
      b.speed += (wantSp - b.speed) * Math.min(1, dt * 1.4);
      if (mag > 0.05) {
        let dy = Math.atan2(dx, dz) - b.yaw;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        b.yaw += dy * Math.min(1, dt * 1.6);
      }
      const W = t.water ?? 0;
      const deep = (x: number, z: number) => t.y(x, z) < W - 0.35 && Math.hypot(x, z) < t.radius + 20;
      const step = b.speed * dt;
      const nx = player.pos.x + Math.sin(b.yaw) * step;
      const nz = player.pos.z + Math.cos(b.yaw) * step;
      // Ahead is clear: go. Otherwise glide along the shore, turning a little away from it.
      let moved = false;
      for (const off of [0, 0.5, -0.5, 1, -1]) {
        const yy = b.yaw + off;
        const mx = player.pos.x + Math.sin(yy) * step * (off ? 0.6 : 1);
        const mz = player.pos.z + Math.cos(yy) * step * (off ? 0.6 : 1);
        if (deep(mx + Math.sin(yy) * 1.6, mz + Math.cos(yy) * 1.6) && deep(mx, mz)) {
          player.pos.set(mx, W + 0.3, mz);
          if (off) b.yaw += off * Math.min(1, dt * 2);
          moved = true;
          break;
        }
      }
      if (!moved) {
        b.speed *= 0.2;
        if (game.target) game.target = null;
      }
      player.pos.y = W + 0.3;
      player.yaw = b.yaw;
      player.speed = 0;
    } else {
      const sp = game.space;
      const me = game.me;
      // Something else moved the explorer (a warp, stepping off the boat, a
      // scripted move): put the capsule there too, on open ground.
      if (Math.hypot(game.at.x - player.pos.x, game.at.z - player.pos.z) > 0.01) {
        const o = sp.findOpen(player.pos.x, player.pos.z, me.r, 8) ?? [player.pos.x, player.pos.z];
        sp.place(me, o[0], o[1]);
        game.prev = { x: me.x, y: me.y, z: me.z };
        game.acc = 0;
      }
      sp.sync();
      const mag = Math.hypot(dx, dz);
      const want = mag > 0.05 ? (run ? 7 : 4.2) * Math.min(1, mag) : 0;
      game.cmd += (want - game.cmd) * damp(dt, 8);
      if (game.cmd < 0.02) game.cmd = 0;
      if (mag > 0.05) player.yaw = Math.atan2(dx, dz);
      // Fixed 60 Hz steps, so movement and collision are the same at any frame rate.
      game.acc += dt;
      let moved = 0;
      let ran = 0;
      while (game.acc >= STEP) {
        game.acc -= STEP;
        ran += STEP;
        game.prev = { x: me.x, y: me.y, z: me.z };
        if (game.cmd <= 0.02) {
          sp.move(me, 0, 0, STEP);
          continue;
        }
        // Never overshoot a tapped spot (slow frames would make the explorer dance round it).
        const step = !(ix || iy) && game.target ? Math.min(game.cmd * STEP, Math.hypot(game.target.x - me.x, game.target.z - me.z)) : game.cmd * STEP;
        moved += sp.move(me, Math.sin(player.yaw) * step, Math.cos(player.yaw) * step, STEP);
      }
      // Walking speed for the animation is how far the feet really went, so
      // pushing against a wall stands still instead of walking on the spot.
      const real = ran > 0 ? moved / ran : player.speed;
      player.speed += (real - player.speed) * damp(dt, 12);
      if (player.speed < 0.05) player.speed = 0;
      // For tests: the longest time the walk cycle played without the feet really moving.
      game.wip = ran > 0 && player.speed > 0.3 && real < 0.1 * player.speed ? game.wip + dt : 0;
      game.wipMax = Math.max(game.wipMax, game.wip);
      if (game.cmd > 1 && real < game.cmd * 0.15) game.stuck += dt;
      else game.stuck = 0;
      if (game.stuck > 0.6 && game.target) {
        game.target = null;
        game.pending = null;
        game.stuck = 0;
      }
      sp.noteSafe(me, game.clock);
      const ls = game.safes[game.safes.length - 1];
      if (!ls || game.clock - ls.at > 3) {
        game.safes.push({ ...me.safe, at: game.clock });
        if (game.safes.length > 20) game.safes.shift();
      }
      if (sp.checkAndRecover(me)) {
        game.recovered++;
        game.prev = { x: me.x, y: me.y, z: me.z };
      }
      // Draw between the last two physics steps.
      const al = Math.min(1, game.acc / STEP);
      player.pos.set(game.prev.x + (me.x - game.prev.x) * al, game.prev.y + (me.y - game.prev.y) * al, game.prev.z + (me.z - game.prev.z) * al);
      game.at = { x: player.pos.x, z: player.pos.z };
      if (moved > 0) {
        const before = player.phase;
        player.phase += (moved / 1.3) * Math.PI;
        if (Math.floor(before / Math.PI) !== Math.floor(player.phase / Math.PI)) nature.step(t.floors.some((f) => typeof f.y !== 'number') && t.floorY(player.pos.x, player.pos.z) > t.y(player.pos.x, player.pos.z) + 0.2);
      }
      const lastT = game.trail[game.trail.length - 1];
      if (!lastT || lastT.p.distanceTo(player.pos) > 0.8) {
        game.trail.push({ id: (lastT?.id ?? 0) + 1, p: player.pos.clone() });
        if (game.trail.length > 400) game.trail.shift();
      }
    }
    const pp = player.pos;

    /* ---------- animals ---------- */
    const groups: Record<string, Ani[]> = {};
    for (const a of game.animals) (groups[a.task] ??= []).push(a);
    const okSpot = (x: number, z: number) => Math.hypot(x, z) < t.radius - 1 && (t.floorY(x, z) > t.y(x, z) + 0.05 || !t.isWater(x, z));
    for (const a of game.animals) {
      const spec = SPECS[a.kind];
      a.timer += dt;
      let goal: THREE.Vector3 | null = null;
      let pace = spec.speed;
      if (a.state !== 'follow') a.tid = undefined;
      if (a.state === 'wander' || a.state === 'stall') {
        // Species temperament: flocking, resting, watching the child, stepping aside, coming over (creatures/mind.ts).
        const want = think(a, { dt, player: pp, playerSpeed: player.speed, group: groups[a.task] ?? [], nav: game.nav, ok: okSpot, roam: a.state === 'stall' ? 1.4 : undefined, shyK: level.spec.shyK });
        goal = want?.goal ?? null;
        pace = spec.speed * (want?.pace ?? 0.4);
      } else if (a.state === 'follow') {
        mindOf(a).rest = 0;
        mindOf(a).look *= 0.9;
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
        if (k < tr.length && ahead > keep) goal = routeTo(a, tr[k].p, game.nav);
        else if (Math.hypot(pp.x - a.pos.x, pp.z - a.pos.z) > keep) goal = routeTo(a, pp, game.nav);
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
      const w = a.w!;
      if (Math.hypot(w.x - a.pos.x, w.z - a.pos.z) > 0.01) {
        // Moved by the story (penned, called over): bring its capsule along, onto open ground.
        const o = game.space.findOpen(a.pos.x, a.pos.z, w.r, 6) ?? [a.pos.x, a.pos.z];
        game.space.place(w, o[0], o[1]);
      }
      if (a.speed > 0.01) {
        const step = a.speed * dt;
        // Swept against every solid and every other animal; slides along walls.
        let went = game.space.move(w, Math.sin(a.yaw) * step, Math.cos(a.yaw) * step, dt, { maxStep: 0.4 });
        if (went < step * 0.3 && a.state === 'follow') {
          // Round the corner toward the leader.
          for (const off of [0.6, -0.6, 1.2, -1.2]) {
            const g = game.space.move(w, Math.sin(a.yaw + off) * step, Math.cos(a.yaw + off) * step, dt, { maxStep: 0.4 });
            if (g > step * 0.3) {
              went += g;
              break;
            }
          }
        }
        if (went < step * 0.3) {
          a.stuck = (a.stuck ?? 0) + dt;
          if (a.state !== 'follow') {
            mindOf(a).route = [];
            mindOf(a).left = Math.min(mindOf(a).left, 0.5);
          }
          // Wedged for a while: turn away and slow down rather than jump anywhere.
          if (a.stuck > 1.5) {
            a.yaw += Math.PI * (0.5 + Math.random() * 0.5);
            a.speed *= 0.3;
            a.stuck = 0;
          }
        } else a.stuck = 0;
        // Legs move with the ground actually covered: no sliding feet.
        a.phase += (went / spec.stride) * Math.PI * 2;
        if (went < step * 0.3) a.speed *= 0.6;
      } else game.space.move(w, 0, 0, dt, { maxStep: 0.4 });
      game.space.noteSafe(w, game.clock);
      game.space.checkAndRecover(w);
      a.pos.set(w.x, w.y, w.z);
      const m = mindOf(a);
      a.graze += ((a.speed < 0.15 && a.state !== 'follow' && m.rest < 0.2 && Math.abs(m.look) < 0.2 && m.mode === 'idle' ? 1 : 0) - a.graze) * Math.min(1, dt * 1.2);
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

    /* ---------- the newer kinds of play ---------- */
    const still = player.speed < 0.3 && !game.boat.on;
    const tell = (k: string, text: string, every = 6) => {
      if (game.clock - (game.told[k] ?? -99) < every) return;
      game.told[k] = game.clock;
      api.current.hint(text);
    };
    let gusting = 0;
    let stormy = 0;
    let raining = 0;
    let status = '';
    for (const task of def.tasks) {
      if (!ready(task, s.done)) continue;
      const prog = s.prog[task.id] ?? [];
      const plug = mechFor(task);
      if (plug) {
        const line = plug.frame?.(task, mechEnv(task, s, dt, still, tell));
        if (line) status = line;
        const w = plug.weather?.(task, game);
        if (w) {
          stormy = Math.max(stormy, w.storm);
          raining = Math.max(raining, w.rain);
        }
        continue;
      }
      const dist = (p: P2) => Math.hypot(p[0] - pp.x, p[1] - pp.z);
      if (task.kind === 'stand') {
        const r = task.r ?? 1.3;
        const on = dist(task.at) < r;
        let facing = true;
        if (task.face) {
          let dy = Math.atan2(task.face[0] - pp.x, task.face[1] - pp.z) - player.yaw;
          dy = Math.atan2(Math.sin(dy), Math.cos(dy));
          facing = Math.abs(dy) < 0.7;
        }
        const h = game.hold[task.id] ?? 0;
        game.hold[task.id] = on && still && facing ? h + dt : Math.max(0, h - dt * 2);
        if (on && still && !facing) tell(`${task.id}f`, 'Turn to face it: take one small step toward it, then keep still.');
        else if (on && !still) tell(`${task.id}s`, 'Stand still here for a moment.', 8);
        if (game.hold[task.id] >= task.secs * level.spec.holdK) {
          api.current.finish(task.id);
          if (task.reading) api.current.open({ kind: 'reading', reading: task.reading });
        }
      }
      if (task.kind === 'reach') {
        if (task.gust) {
          // Find where on the mountain path the explorer is.
          let best = 1e9;
          let seg = -1;
          for (let i = 0; i < task.gust.path.length - 1; i++) {
            const [ax, az] = task.gust.path[i];
            const [bx, bz] = task.gust.path[i + 1];
            const ex = bx - ax;
            const ez = bz - az;
            const l2 = ex * ex + ez * ez || 1;
            const u = Math.min(1, Math.max(0, ((pp.x - ax) * ex + (pp.z - az) * ez) / l2));
            const d = Math.hypot(pp.x - ax - ex * u, pp.z - az - ez * u);
            if (d < best) {
              best = d;
              seg = i;
            }
          }
          if (seg >= 0 && best < task.gust.width) {
            game.gust.t += dt;
            const ph = game.gust.t % 8;
            if (ph > 4 && ph < 5.2) {
              if (!game.gust.warned) api.current.hint('The wind is rising. Stand still until it passes!');
              game.gust.warned = true;
              gusting = 0.15;
            } else if (ph >= 5.2) {
              gusting = 0.45;
              if (player.speed > 0.6) {
                const [ax, az] = task.gust.path[seg];
                const [bx, bz] = task.gust.path[seg + 1];
                const l = Math.hypot(bx - ax, bz - az) || 1;
                const px = pp.x - ((bx - ax) / l) * 8.5 * level.spec.windK * dt;
                const pz = pp.z - ((bz - az) / l) * 8.5 * level.spec.windK * dt;
                game.space.move(game.me, px - pp.x, pz - pp.z, dt);
                pp.set(game.me.x, game.me.y, game.me.z);
                game.prev = { x: game.me.x, y: game.me.y, z: game.me.z };
                game.at = { x: pp.x, z: pp.z };
                tell('gustback', 'The wind pushes you back down. Keep still while it blows, then climb on.', 5);
              }
            } else game.gust.warned = false;
          }
        }
        if (dist(task.at) < (task.r ?? 2.5)) {
          api.current.finish(task.id);
          if (task.reading) api.current.open({ kind: 'reading', reading: task.reading });
        }
      }
      if (task.kind === 'observe')
        task.subjects.forEach((sub, i) => {
          if (prog.includes(i)) return;
          const key = `${task.id}:${i}`;
          const d = dist(sub.at);
          const close = d < sub.r + 2;
          if (close && player.speed > 5) {
            game.hold[key] = 0;
            for (const a of game.animals)
              if (a.task === `obs-${task.id}-${i}`) {
                const ang = Math.atan2(a.pos.x - pp.x, a.pos.z - pp.z);
                const to = a.pos.clone().add(new THREE.Vector3(Math.sin(ang) * 4, 0, Math.cos(ang) * 4));
                const m = mindOf(a);
                if (m.mode !== 'shy' && okSpot(to.x, to.z)) Object.assign(m, { mode: 'shy', left: 2.5, route: [to], rest: m.rest });
              }
            tell(`${key}run`, 'Running startled them. Come close at a walk, then keep still and watch.');
          } else if (close && still) {
            game.hold[key] = (game.hold[key] ?? 0) + dt;
            status = `Watching: ${sub.label} ${Math.min(100, Math.round(((game.hold[key] ?? 0) / (task.secs * level.spec.holdK)) * 100))}%`;
            if (game.hold[key] >= task.secs * level.spec.holdK) {
              api.current.progress(task.id, i);
              journal.observe(`${def.surah}:${task.id}:${i}`, { world: String(def.surah), label: sub.label, note: sub.note, animal: sub.animal });
              api.current.say(sub.note);
              if (sub.reading) api.current.open({ kind: 'reading', reading: sub.reading });
            }
          } else if (close) tell(`${key}walk`, 'Keep still and watch for a little while.', 10);
        });
      if (task.kind === 'return') {
        const d = dist(task.at);
        if (d > task.away) game.away[task.id] = true;
        if (d < task.r && (prog.length === 0 || game.away[task.id]) && prog.length < task.times) {
          game.away[task.id] = false;
          const k = prog.length;
          api.current.say(task.notes[k]);
          api.current.progress(task.id, k);
          if (k + 1 >= task.times && task.reading) api.current.open({ kind: 'reading', reading: task.reading });
        } else if (d < task.r && prog.length > 0) tell(`${task.id}out`, 'Walk out through the courtyard gate, then come back in.', 12);
      }
      if (task.kind === 'sail' && game.boat.on) {
        const i = task.stops.findIndex((_, j) => !prog.includes(j));
        const stop = task.stops[i];
        if (stop) {
          if (stop.storm) stormy = Math.min(0.85, Math.max(0.2, 1 - dist(stop.at) / 90));
          if (dist(stop.at) < (stop.r ?? 6)) {
            api.current.progress(task.id, i);
            if (stop.note) api.current.say(stop.note);
            if (stop.reading) api.current.open({ kind: 'reading', reading: stop.reading });
          }
        } else status = 'Every place visited. Sail back to the dock and step ashore.';
      }
      if (task.kind === 'promise') {
        const took = (s.prog[`${task.id}/a`] ?? []).length > 0;
        if (took) {
          const parts: string[] = [];
          task.promises.forEach((p, i) => {
            const k = `${task.id}:${i}`;
            if (game.vows[k] == null) game.vows[k] = game.clock + p.secs * level.spec.timeK;
            if (prog.includes(i)) return;
            const left = Math.max(0, Math.ceil(game.vows[k] - game.clock));
            parts.push(left > 0 ? `${p.label} (${left}s)` : `${p.label} (candle out)`);
          });
          if (parts.length) status = `Promises: ${parts.join(' · ')}`;
        }
      }
      if (task.kind === 'flow') {
        const f = (game.flow[task.id] ??= freshFlow(task));
        if (f.running) {
          const take = Math.min(f.water, 0.3 * dt);
          f.water -= take;
          const { dest } = flowRoute(task, f);
          const c = task.cisterns.find((x) => x.id === dest);
          if (c) {
            const room = Math.max(0, c.cap - (f.filled[c.id] ?? 0));
            const add = Math.min(take, room);
            f.filled[c.id] = (f.filled[c.id] ?? 0) + add;
            f.spill += take - add;
            if (room <= 0) tell(`${task.id}full`, `${c.label} is full and spilling over. Turn a gate!`, 4);
          } else {
            f.spill += take;
            tell(`${task.id}sand`, 'The water is running into the sand. Turn a gate!', 4);
          }
          const full = task.cisterns.every((x) => (f.filled[x.id] ?? 0) >= x.cap - 0.02);
          if (full && f.spill <= task.maxSpill) {
            f.running = false;
            api.current.finish(task.id);
          } else if (f.spill > task.maxSpill || f.water <= 0) {
            game.flow[task.id] = { ...freshFlow(task), gates: f.gates };
            api.current.say(
              f.spill > task.maxSpill
                ? 'Too much water ran off onto the sand, and the cisterns could not all be filled. The spring fills again: plan which way each gate should point, then open the sluice once more.'
                : 'The spring has run dry before every cistern was full. It fills again: try once more.',
            );
          }
        }
        const g = game.flow[task.id];
        status = `Spring: ${Math.ceil(g.water)} left · ${task.cisterns.map((c) => `${c.label} ${Math.min(c.cap, Math.round((g.filled[c.id] ?? 0) * 10) / 10)}/${c.cap}`).join(' · ')} · spilled ${Math.round(g.spill * 10) / 10} of ${task.maxSpill} allowed`;
      }
      if (task.kind === 'sift') {
        const r = prog.length;
        if (task.rounds[r] && (s.prog[`${task.id}/h`] ?? []).includes(r)) status = task.rounds[r].say;
      }
    }
    weather.storm += (Math.max(gusting, stormy) - weather.storm) * Math.min(1, dt * 0.8);
    weather.rain += (raining - weather.rain) * Math.min(1, dt * 0.6);
    game.status = status;

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
      const mine = list.filter((u) => u.key.includes(`:${first.id}`) || (first.kind === 'lead' || first.kind === 'pick' || first.kind === 'sift' ? u.key.startsWith(`ani:${first.id}-`) : false));
      const pen = mine.find((u) => u.key.startsWith('pen:') || (game.boat.on && u.key.startsWith('go:')));
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
    // Footsteps to the next place: always on the Gentle level, or for a while after "Show me the way".
    const wantWay = !!nextPos && !game.boat.on && (level.spec.trail || game.clock < game.way.until);
    if (!wantWay) game.way.pts = [];
    else if (game.clock - game.way.at > 1.2) {
      game.way.at = game.clock;
      const r = game.nav.route(pp, nextPos!, { r: 0.35, budget: 3000, near: 2.5 });
      const pts: THREE.Vector3[] = [];
      if (r) {
        let prev = pp.clone();
        let carry = 1.6;
        for (const q of r) {
          const seg = Math.hypot(q.x - prev.x, q.z - prev.z);
          while (carry < seg && pts.length < 40) {
            const k = carry / seg;
            const x = prev.x + (q.x - prev.x) * k;
            const z = prev.z + (q.z - prev.z) * k;
            pts.push(new THREE.Vector3(x, t.floorY(x, z) + 0.06, z));
            carry += 1.25;
          }
          carry -= seg;
          prev = q.clone();
        }
      }
      game.way.pts = pts;
    }
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
      cueFor(near.label);
      near.run();
    }

    /* ---------- camera ---------- */
    const cam = game.cam;
    const look = tmp.set(pp.x, pp.y + 1.35, pp.z);
    const snap = cam.snap;
    cam.snap = false;
    cam.look.lerp(look, snap ? 1 : damp(dt, (motion.reduced ? 30 : 9)));
    // A trunk, wall, house or hill between the camera and the explorer: look over it, or come closer.
    const fit = game.boat.on ? { pitch: cam.pitch, dist: Math.max(cam.dist, 11) } : game.space.cameraFit(cam.look.x, cam.look.y, cam.look.z, cam.yaw, cam.pitch, cam.dist);
    camDist.current += (fit.dist - camDist.current) * damp(dt, (fit.dist < camDist.current ? 10 : 2));
    camPitch.current += (fit.pitch - camPitch.current) * damp(dt, (fit.pitch > camPitch.current ? 8 : 2));
    if (snap) (camDist.current = fit.dist), (camPitch.current = fit.pitch);
    const cp = camPitch.current;
    const want3 = new THREE.Vector3(
      cam.look.x + Math.sin(cam.yaw) * Math.cos(cp) * camDist.current,
      cam.look.y + Math.sin(cp) * camDist.current,
      cam.look.z + Math.cos(cam.yaw) * Math.cos(cp) * camDist.current,
    );
    want3.y = Math.max(want3.y, t.floorY(want3.x, want3.z) + 0.7, (t.water ?? -99) + 0.6);
    cam.pos.lerp(want3, snap ? 1 : damp(dt, (motion.reduced ? 30 : 6)));
    // The eased position may lag into a wall the target already avoids; draw it short of it.
    camera.position.copy(cam.pos);
    if (!game.boat.on) game.space.clampCamera(cam.look, camera.position);
    camera.lookAt(cam.look);

    nature.update({ river: t.water != null ? (game.boat.on ? 0 : 30) : 99, storm: weather.storm, rain: weather.rain, inside: false, dt });
  }, -1);

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

/** Glowing footsteps along the navigator's way to the next place. */
function WayTrail({ game }: { game: Game; t: Terrain }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(0.16, 12);
    g.scale(1, 1.5, 1);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff0b8', transparent: true, opacity: 0.85, depthWrite: false, fog: false }), []);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  useFrame((st) => {
    const im = ref.current;
    if (!im) return;
    const pts = game.way.pts;
    im.count = pts.length;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const n = pts[i + 1] ?? pts[i - 1] ?? p;
      const yaw = Math.atan2(n.x - p.x, n.z - p.z) * (pts[i + 1] ? 1 : -1);
      q.setFromAxisAngle(up, yaw);
      // Left, right, left: a little offset sideways like real steps.
      const side = (i % 2 ? 0.14 : -0.14);
      const s = motion.reduced ? 1 : 0.85 + 0.25 * Math.max(0, Math.sin(st.clock.elapsedTime * 3 - i * 0.5));
      m4.compose(new THREE.Vector3(p.x + Math.cos(yaw) * side, p.y, p.z - Math.sin(yaw) * side), q, one.clone().multiplyScalar(s));
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, 40]} frustumCulled={false} renderOrder={2} />;
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
            return (
              <group key={task.id} userData={{ noSolid: true }}>
                {game.boats
                  .filter((b) => b.task === task.id)
                  .map((b) => <GuidedBoat key={`${task.id}-${b.idx}`} state={b} color={task.boats[b.idx].color} sail={task.boats[b.idx].sail} active={open(task) && !b.done && !b.moving} onTap={() => act(`boat:${task.id}:${b.idx}`)} />)}
              </group>
            );
          case 'stand':
            return <StandPlate key={task.id} x={task.at[0]} z={task.at[1]} t={t} r={task.r ?? 1.3} style={task.style} k={() => Math.min(1, (game.hold[task.id] ?? 0) / (task.secs * level.spec.holdK))} done={done} active={open(task)} />;
          case 'reach':
            return <GoRing key={task.id} x={task.at[0]} z={task.at[1]} y={t.floorY(task.at[0], task.at[1])} r={task.r ?? 2.5} active={open(task)} />;
          case 'return':
            return <GoRing key={task.id} x={task.at[0]} z={task.at[1]} y={t.floorY(task.at[0], task.at[1])} r={task.r} active={open(task)} color="#ffe2b0" />;
          case 'observe':
            return task.subjects.map((sub, i) => (
              <WatchRing key={`${task.id}-${i}`} x={sub.at[0]} z={sub.at[1]} t={t} r={sub.r + 2} k={() => Math.min(1, (game.hold[`${task.id}:${i}`] ?? 0) / (task.secs * level.spec.holdK))} done={done || prog.includes(i)} active={open(task) && !prog.includes(i)} />
            ));
          case 'sky':
            return <SkyDial key={task.id} x={task.at[0]} z={task.at[1]} t={t} phase={done ? task.phases.length : prog.length} n={task.phases.length} active={open(task)} onTap={() => act(`sky:${task.id}`)} />;
          case 'sail':
            return (
              <group key={task.id}>
                <ReadingMarker kind="sign" x={task.dock[0]} z={task.dock[1]} t={t} done={done} active={open(task) && !game.boat.on} onTap={() => act(`board:${task.id}`)} />
                {task.stops.map((st, i) => (
                  <GoRing key={i} x={st.at[0]} z={st.at[1]} y={t.water ?? 0} r={st.r ?? 6} active={open(task) && !prog.includes(i) && task.stops.findIndex((_, j) => !prog.includes(j)) === i} color="#e6f6ff" />
                ))}
              </group>
            );
          case 'choice':
          case 'share':
          case 'weigh':
            return task.kind === 'weigh' ? (
              <Balance key={task.id} x={task.at[0]} z={task.at[1]} t={t} active={open(task)} onTap={() => act(`weigh:${task.id}`)} />
            ) : (
              <group key={task.id}>
                <ReadingMarker kind={task.kind === 'choice' ? task.marker ?? 'sign' : 'tablet'} x={task.at[0]} z={task.at[1]} t={t} done={done} active={open(task)} onTap={() => act(`${task.kind}:${task.id}`)} />
                {task.kind === 'share' &&
                  task.homes.map((h, i) => (
                    <group key={i}>
                      <HomeLamp x={h.door[0]} z={h.door[1]} t={t} on={done || prog.includes(i)} />
                      <NeedSign x={h.door[0] + 1.1} z={h.door[1] + 0.6} t={t} kind={['jar', 'hearth', 'cot', 'basket'][i % 4]} on={!(done || prog.includes(i))} />
                    </group>
                  ))}
              </group>
            );
          case 'promise': {
            const took = (data.prog[`${task.id}/a`] ?? []).length > 0;
            return (
              <group key={task.id}>
                <PromiseBoard x={task.at[0]} z={task.at[1]} t={t} n={task.promises.length} kept={done ? task.promises.length : prog.length} active={open(task) && !took} onTap={() => act(`vows:${task.id}`)} />
                {task.promises.map((p, i) => (
                  <PromiseSpot
                    key={i}
                    x={p.at[0]}
                    z={p.at[1]}
                    t={t}
                    live={took}
                    kept={done || prog.includes(i)}
                    left={() => {
                      const due = game.vows[`${task.id}:${i}`];
                      return due == null ? 1 : (due - game.clock) / (p.secs * level.spec.timeK);
                    }}
                    active={open(task) && took && !prog.includes(i)}
                    onTap={() => act(`vow:${task.id}:${i}`)}
                  />
                ))}
              </group>
            );
          }
          case 'flow': {
            const f = (game.flow[task.id] ??= freshFlow(task));
            return (
              <FlowView
                key={task.id}
                t={t}
                task={task}
                state={new Proxy({} as FlowState, { get: (_, k) => (game.flow[task.id] as never)[k] })}
                route={() => flowRoute(task, game.flow[task.id] ?? f).pts}
                active={open(task)}
                onGate={(g) => act(`gate:${task.id}:${g}`)}
                onSource={() => act(`rain:${task.id}`)}
              />
            );
          }
          case 'sift': {
            const mid = task.herd.reduce((a, c) => [a[0] + c.at[0] / task.herd.length, a[1] + c.at[1] / task.herd.length] as P2, [0, 0] as P2);
            return <ReadingMarker key={task.id} kind="sign" x={mid[0] + 4} z={mid[1]} t={t} done={done} active={open(task) && !(data.prog[`${task.id}/h`] ?? []).includes(prog.length)} onTap={() => act(`ask:${task.id}`)} />;
          }
          default: {
            const plug = mechFor(task);
            return plug?.View ? <plug.View key={task.id} task={task} t={t} data={data} game={game} active={open(task)} act={act} /> : null;
          }
        }
      })}
      {(def.links ?? []).map((l, i) => (
        <Doorway key={i} x={l.at[0]} z={l.at[1]} t={t} onTap={() => act(`link:${i}`)} />
      ))}
      {(def.warps ?? []).map((w, i) => (!w.show || data.done.includes(w.show) ? <Doorway key={`w${i}`} x={w.at[0]} z={w.at[1]} t={t} rot={w.rot ?? 0} onTap={() => act(`warp:${i}`)} /> : null))}
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
  const [phys, setPhys] = useState(!!physicsReady());
  useEffect(() => {
    if (!phys) loadPhysics().then(() => setPhys(true));
  }, [phys]);
  if (!app.ready || !phys) return <View style={st.root} />;
  if (!def)
    return (
      <View style={[st.root, st.center]}>
        <Text style={st.note}>This adventure world has not been built yet.</Text>
        <Pressable style={st.pill} onPress={() => router.replace('/')}>
          <Text style={st.pillText}>Back to the home</Text>
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
  // Continue Adventure on the home screen comes back here.
  useEffect(() => noteAdventure({ kind: 'world', n: def.surah }), [def.surah]);

  const [data, setData] = useState<Save>(() => load(def.surah));
  const [lvl, setLvl] = useState(level.name);
  useEffect(() => journal.visit(String(def.surah), def.name, def.surah), [def]);
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
  // "task" is on once done; "task#3" once three steps are done; "task@2" once step 2 is done.
  const isOn = useCallback((id?: string) => {
    if (!id) return false;
    const sv = saveRef.current;
    const m = id.match(/^(.+)([#@])(\d+)$/);
    if (!m) return sv.done.includes(id);
    if (sv.done.includes(m[1])) return true;
    const p = sv.prog[m[1]] ?? [];
    return m[2] === '#' ? p.length >= +m[3] : p.includes(+m[3]);
  }, []);

  const t = useLand(def);
  // A few spots where small birds peck on the ground: near the start and near the first reading places.
  const birdSpots = useMemo(() => {
    const cand: P2[] = [[def.start[0] + 5, def.start[1] + 4]];
    for (const task of def.tasks) if (task.kind === 'read') cand.push([task.at[0] + 3.5, task.at[1] - 3]);
    return cand.filter(([x, z]) => !t.isWater(x, z) && t.clear(x, z, 0.5)).slice(0, 3);
  }, [def, t]);
  const placed = useMemo(() => {
    // Buildings first, so trees keep clear of them and of every activity spot.
    for (const s of def.structures) footprint(s, t, isOn);
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
  const [voices, setVoices] = useState(false);
  // A short spoken hint the first time each kind of action is in reach.
  useActionHint(near?.label);
  const [cards, setCards] = useState<Card[]>([]);
  const [hint, setHint] = useState('');
  const [quiet, setQuiet] = useState(set.quietMode);
  const [carrying, setCarrying] = useState<{ task: string; idx: number } | null>(null);
  const [region, setRegion] = useState('');
  const [showList, setShowList] = useState(!portrait);
  const [status, setStatus] = useState('');
  const propsRef = useRef<THREE.Group>(null);

  const game = useMemo<Game>(() => {
    const s = saveRef.current;
    // Collision first, then a checked place to stand: the saved spot if it is
    // still open and walkable, otherwise the world's start, otherwise the
    // nearest open ground to it.
    const space = makeSpace(physicsReady()!, t);
    const want = s.pos && !t.isWater(s.pos[0], s.pos[2]) && space.okSpot(s.pos[0], s.pos[2], 0.35) ? ([s.pos[0], s.pos[2]] as P2) : null;
    const spawn = want ?? space.findOpen(def.start[0], def.start[1], 0.35) ?? def.start;
    const p = new THREE.Vector3(spawn[0], t.floorY(spawn[0], spawn[1]), spawn[1]);
    const me = space.addWalker('player', 0.35, p.x, p.z);
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
    const animals = makeAnimals(def, s, t);
    for (const a of animals) {
      const r = Math.min(0.9, Math.max(0.22, SPECS[a.kind].r * a.scale * 0.85));
      const o = space.findOpen(a.pos.x, a.pos.z, r, 8) ?? [a.pos.x, a.pos.z];
      a.pos.set(o[0], t.floorY(o[0], o[1]), o[1]);
      a.w = space.addWalker('animal', r, o[0], o[1]);
    }
    return {
      space,
      me,
      acc: 0,
      cmd: 0,
      stuck: 0,
      recovered: 0,
      wip: 0,
      wipMax: 0,
      prev: { x: p.x, y: p.y, z: p.z },
      at: { x: p.x, z: p.z },
      safes: [],
      spawn: [spawn[0], spawn[1]] as P2,
      animals,
      boats: makeBoats(def, s, t),
      carrying: null,
      target: null,
      pending: null,
      cam: { yaw: back, pitch: 0.32, dist: 8, pos: p.clone().add(new THREE.Vector3(Math.sin(back) * 8, 3, Math.cos(back) * 8)), look: p.clone() },
      timeScale: 1,
      next: { current: null },
      trail: [],
      boat: { on: false, yaw: 0, speed: 0 },
      hold: {},
      gust: { t: 0, warned: false },
      away: {},
      vows: {},
      clock: 0,
      flow: {},
      mech: {},
      told: {},
      status: '',
      // Routes for tap-to-go: the terrain's rules plus every collider in the
      // space (activity props included), never into a solid.
      nav: makeNav((ax, az, bx, bz, r) => t.canStep(ax, az, bx, bz, r) && (!navBlocked(space, bx, bz, r) || navBlocked(space, ax, az, r)), { radius: t.radius, cell: 1.4, y: t.floorY }),
      route: [],
      routeFor: null,
      way: { pts: [], until: 0, at: -9 },
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useOrbit(game);

  useEffect(() => {
    nature.setVolumes({ ambience: set.ambienceVolume, effects: set.effectsVolume, quiet });
  }, [set.ambienceVolume, set.effectsVolume, quiet]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!game.boat.on) update((s) => ({ ...s, pos: [player.pos.x, player.pos.y, player.pos.z] }));
      setCarrying(game.carrying ? { ...game.carrying } : null);
      setStatus(game.status);
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
    }, 500);
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
      if (task.kind !== 'read') celebrate();
      if (task.outro) say(task.outro);
      if (task.kind === 'choice' || task.kind === 'share' || task.kind === 'weigh' || task.kind === 'return' || mechFor(task)) {
        const r = ownReading(task);
        if (r) setCards((c) => [...c, { kind: 'reading', reading: r }]);
      }
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
      const all = total(task);
      if (next.length >= all) finish(id);
      else if (task.kind !== 'choice' && task.kind !== 'share') setHint(`${task.title}: ${next.length} of ${all}`);
    },
    finish,
    hint: (text) => {
      setHint(text);
      setCarrying(game.carrying ? { ...game.carrying } : null);
    },
    open: (c) => {
      // The journal remembers every ayah opened in a world (and the words met in it).
      if (c.kind === 'reading') journal.read(c.reading.refs.map((r) => [r[0], r[1]] as [number, number]));
      setCards((cs) => [...cs.filter((x) => x.kind === 'narration' || x.kind === 'finale'), c]);
    },
    near: setNear,
    say,
    note: (key, i) => {
      const cur = saveRef.current.prog[key] ?? [];
      if (!cur.includes(i)) update((s) => ({ ...s, prog: { ...s.prog, [key]: [...cur, i] } }));
    },
    set: (key, v) => update((s) => ({ ...s, prog: { ...s.prog, [key]: v } })),
    panel: (task) => setCards((cs) => [{ kind: 'mech', task }, ...cs.filter((x) => x.kind === 'narration' || x.kind === 'finale')]),
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

  // Back to firm open ground somewhere recent (or the world's start). Story
  // progress, the backpack and what is carried are untouched.
  const toSafeGround = useCallback(() => {
    if (game.boat.on) return;
    const me = game.me;
    const pick = [...game.safes].reverse().find((p) => Math.hypot(p.x - me.x, p.z - me.z) > 4 && game.space.okSpot(p.x, p.z, me.r));
    const o = pick ? [pick.x, pick.z] : game.space.findOpen(def.start[0], def.start[1], me.r) ?? def.start;
    game.target = null;
    game.pending = null;
    game.space.place(me, o[0], o[1]);
    player.pos.set(me.x, me.y, me.z);
    game.prev = { x: me.x, y: me.y, z: me.z };
    game.at = { x: me.x, z: me.z };
    game.cam.look.copy(player.pos);
    game.cam.snap = true;
    game.recovered++;
  }, [game, def]);
  useEffect(() => {
    const sp = game.space;
    sp.holds++;
    return () => {
      sp.holds--;
      // Freed a moment later, so a quick remount (development mode) keeps it.
      setTimeout(() => sp.holds || sp.dispose(), 0);
    };
  }, [game]);

  /** Activity props changed their colliders: never leave the explorer or the spawn inside one. */
  function propsMoved() {
    const sp = game.space;
    const me = game.me;
    if (sp.blockedAt(me.x, me.z, me.r * 0.8, me.collider)) {
      const o = sp.findOpen(me.x, me.z, me.r, 8);
      if (o) {
        sp.place(me, o[0], o[1]);
        player.pos.set(o[0], me.y, o[1]);
        game.prev = { x: o[0], y: me.y, z: o[1] };
        game.at = { x: o[0], z: o[1] };
      }
    }
    if (!sp.okSpot(game.spawn[0], game.spawn[1], 0.35)) game.spawn = sp.findOpen(game.spawn[0], game.spawn[1], 0.35) ?? game.spawn;
    game.safes = game.safes.filter((p) => !sp.blockedAt(p.x, p.z, 0.3));
  }

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
      top: () => cards[0],
      /** Answer the open decision panel as a careful child would (tests only). */
      solve: () => {
        const c = cards[0];
        if (!c) return false;
        if (c.kind === 'choice') {
          setCards((cs) => cs.slice(1));
          c.task.scenes.forEach((_, i) => api.current.progress(c.task.id, i));
        } else if (c.kind === 'share') {
          setCards((cs) => cs.slice(1));
          c.task.homes.forEach((_, i) => api.current.progress(c.task.id, i));
        } else if (c.kind === 'weigh' || c.kind === 'quiz') {
          // Quiz panels are the engine's shared match/order/sort games, tested on their own.
          setCards((cs) => cs.slice(1));
          finish(c.task.id);
        } else if (c.kind === 'vow') {
          setCards((cs) => cs.slice(1));
          api.current.note(`${c.task.id}/a`, 1);
        } else if (c.kind === 'mech') {
          setCards((cs) => cs.slice(1));
          mechFor(c.task)?.solve?.(c.task, api.current);
        } else return false;
        return true;
      },
      boat: game.boat,
      toSafeGround,
      validate: () =>
        validateSpace(game.space, {
          spawn: game.spawn,
          radius: t.radius,
          paths: (def.ground.paths ?? []) as [number, number][][],
          zones: (game as unknown as { uses: () => Use[] }).uses().filter((u) => !u.key.startsWith('ani:') && !u.key.startsWith('boat:') && !u.key.startsWith('ashore:')).map((u) => ({ key: u.key, x: u.pos.x, z: u.pos.z, reach: u.reach })),
        }),
      /** Drawn parts that look solid but have no collider (should be none). */
      audit: () => {
        if (!game.scene) return null;
        const a = auditScene(game.scene, game.space, t.radius);
        // Tree trunks are drawn merged into one mesh: check each placed tree instead.
        const trees = placed.trees.filter((k) => Math.hypot(k.x, k.z) < t.radius && !game.space.blockedAt(k.x, k.z, 0.04));
        return { ...a, trees: placed.trees.filter((k) => Math.hypot(k.x, k.z) < t.radius).length, uncovered: [...a.uncovered, ...trees.map((k) => ({ what: `${k.kind} tree`, geo: 'trunk', x: k.x, z: k.z, h: 0 }))] };
      },
      /** Everything usable now, with where it is and how close you must be. */
      uses: () => (game as unknown as { uses: () => Use[] }).uses().map((u) => ({ key: u.key, label: u.label, x: u.pos.x, z: u.pos.z, reach: u.reach })),
      /** Tap the ground at x, z (tap-to-go, routed round obstacles). */
      go: (x: number, z: number) => tapGround(new THREE.Vector3(x, t.floorY(x, z), z)),
      flowRoute,
      close: () => setCards((c) => c.slice(1)),
      open: (kind: 'book' | 'about' | 'finale') => setCards((c) => [...c, { kind } as Card]),
    };
  });

  const top = cards[0];
  const totalN = def.tasks.length;

  // The sky follows the sky-dial (night, star, moon, sun); mist thickens and clears with the story.
  const skyTask = def.tasks.find((x) => x.kind === 'sky') as Extract<Task, { kind: 'sky' }> | undefined;
  const phaseN = skyTask ? (data.done.includes(skyTask.id) ? skyTask.phases.length : (data.prog[skyTask.id] ?? []).length) : 0;
  const phaseLook = skyTask && phaseN > 0 ? skyTask.phases[phaseN - 1].look : undefined;
  const mist = def.mist?.(data.done, data.prog) ?? 0;
  const mechLook = def.tasks.map((x) => mechFor(x)?.look?.(x, data)).find(Boolean);
  // A world whose time of day moves on with the story (night hills, then a morning festival ground).
  const storyLook = def.looks?.filter((l) => data.done.includes(l.after)).pop()?.look;
  const look = useMemo(() => {
    const base = mechLook ?? phaseLook ?? storyLook ?? def.look;
    if (!mist) return base;
    const fog = new THREE.Color(base.fog).lerp(new THREE.Color('#9ea4ac'), mist);
    return { ...base, fog: `#${fog.getHexString()}`, fogDensity: base.fogDensity + mist * 0.05, sunI: base.sunI * (1 - mist * 0.55), hemiI: base.hemiI * (1 - mist * 0.25), birds: mist < 0.3 && base.birds };
  }, [mechLook, phaseLook, storyLook, mist, def.look]);
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
        <Sky look={look} />
        {look.moon && <Moon look={look} />}
        <Lighting q={q} look={look} />
        <Wind />
        <GroundMesh t={t} q={q} onTap={tapGround} />
        <group userData={{ noSolid: true }}>
          <GrassField t={t} veg={def.veg} q={q} />
          <FlowerField t={t} veg={def.veg} q={q} />
        </group>
        {/* Leafy canopies are soft; trunks are checked from where each tree was placed. */}
        <group userData={{ noSolid: true }}>
          <Trees t={t} placed={placed} q={q} />
        </group>

        {t.water != null && <StillWater t={t} look={look} />}
        {t.water != null && (
          <group userData={{ noSolid: true }}>
            <PlayerBoat boat={game.boat} water={t.water} />
          </group>
        )}
        <FarLand t={t} tint={def.far} />
        <Mountains color={def.mountains?.color} height={def.mountains?.height} seed={def.seed} />
        {(look.clouds ?? 1) > 0 && <CloudLayer look={look} />}
        {look.birds !== false && <Flock center={def.start} />}
        {look.birds !== false && <GroundBirds spots={birdSpots} t={t} />}
        {def.tasks.some((x) => mechFor(x)?.weather) && <Rain />}
        <group ref={propsRef}>
          <RockField t={t} placed={placed} q={q} />
          <Things def={def} t={t} data={data} game={game} carrying={carrying} act={act} isOn={isOn} />
        </group>
        <PropSolids root={propsRef} space={game.space} onScene={(sc) => (game.scene = sc)} onChange={propsMoved} />
        <group userData={{ noSolid: true }}>
          <Animals game={game} onTap={act} />
          <Carried item={carriedLoad?.item ?? null} color={carriedLoad?.color} />
          <Child />
        </group>
        <TapMarker game={game} t={t} />
        {LEVELS[lvl].light && <Wayfinder at={game.next} />}
        <WayTrail game={game} t={t} />
        {debugColliders() && <ColliderView space={game.space} spawn={game.spawn} />}
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
          <Pressable style={st.pill} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityRole="button" accessibilityLabel="Leave this world">
            <Text style={st.pillText}>‹ Leave</Text>
          </Pressable>
          <Pressable style={st.pill} onPress={() => setCards((c) => [...c, { kind: 'book' }])} accessibilityRole="button">
            <Text style={st.pillText}>Read the whole surah</Text>
          </Pressable>
          <Pressable style={st.pill} onPress={() => setCards((c) => [...c, { kind: 'about' }])} accessibilityRole="button">
            <Text style={st.pillText}>About this world</Text>
          </Pressable>
          <Pressable style={st.pill} onPress={() => router.push('/journal' as never)} accessibilityRole="button" accessibilityLabel="Open my discovery journal">
            <Text style={st.pillText}>My journal</Text>
          </Pressable>
          <Pressable style={st.pill} onPress={() => setVoices(true)} accessibilityRole="button" accessibilityLabel="Voices and sound">
            <Text style={st.pillText}>Voices and sound</Text>
          </Pressable>
          <Pressable style={st.pill} onPress={toSafeGround} accessibilityRole="button" accessibilityLabel="Return to safe ground">
            <Text style={st.pillText}>Return to safe ground</Text>
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
              {doneN} of {totalN} activities {showList ? '▴' : '▾'}
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
          <Pressable
            style={st.pill}
            onPress={() => {
              const l = level.next();
              setLvl(l);
              setHint(`${LEVELS[l].label}: ${LEVELS[l].blurb}`);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Help level ${LEVELS[lvl].label}. Tap to change.`}
          >
            <Text style={st.pillText}>Help: {LEVELS[lvl].label}</Text>
          </Pressable>
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

      {!top && !LEVELS[lvl].trail && (
        <Pressable
          style={[st.pill, st.wayBtn]}
          onPress={() => {
            game.way.until = game.clock + 14;
            game.way.at = -9;
            setHint(game.next.current ? 'Follow the glowing footsteps.' : 'Nothing is waiting here. Look at the list of activities.');
          }}
          accessibilityRole="button"
        >
          <Text style={st.pillText}>Show me the way</Text>
        </Pressable>
      )}

      {!!status && !top && (
        <View style={st.statusWrap} pointerEvents="none">
          <Text style={st.status}>{status}</Text>
        </View>
      )}

      {top && top.kind === 'choice' && (
        <ChoiceCard
          key={top.task.id}
          task={top.task}
          from={(data.prog[top.task.id] ?? []).length}
          width={portrait ? '94%' : 600}
          portrait={portrait}
          onClose={() => setCards((c) => c.slice(1))}
          onScene={(i) => {
            api.current.progress(top.task.id, i);
            if (i + 1 >= top.task.scenes.length) setCards((c) => c.filter((x) => x !== top));
          }}
          onWrong={() => {
            setCards((c) => c.slice(1));
            if (top.task.back) {
              player.pos.copy(v3(top.task.back, t));
              game.cam.look.copy(player.pos);
              game.cam.snap = true;
              setHint('You took a step back down the path. Walk up to the signpost again, and this time answer honestly.');
            }
          }}
        />
      )}
      {top && top.kind === 'share' && (
        <ShareCard
          task={top.task}
          width={portrait ? '96%' : 640}
          portrait={portrait}
          onClose={() => setCards((c) => c.slice(1))}
          onSolved={() => {
            setCards((c) => c.slice(1));
            top.task.homes.forEach((_, i) => api.current.progress(top.task.id, i));
          }}
        />
      )}
      {top && top.kind === 'weigh' && (
        <WeighCard
          task={top.task}
          width={portrait ? '94%' : 600}
          portrait={portrait}
          onClose={() => setCards((c) => c.slice(1))}
          onSolved={() => {
            setCards((c) => c.slice(1));
            finish(top.task.id);
          }}
        />
      )}
      {top && top.kind === 'vow' && (
        <VowCard
          task={top.task}
          width={portrait ? '94%' : 600}
          portrait={portrait}
          onClose={() => setCards((c) => c.slice(1))}
          onAccept={() => {
            setCards((c) => c.slice(1));
            game.vows = {};
            api.current.note(`${top.task.id}/a`, 1);
            setHint('Your promises are made, and their candles are lit. Follow the light to the first one.');
          }}
        />
      )}

      {top &&
        top.kind === 'mech' &&
        (() => {
          const P = mechFor(top.task)?.Panel;
          return P ? <P task={top.task} data={data} api={api.current} width={portrait ? '96%' : 620} portrait={portrait} onClose={() => setCards((c) => c.slice(1))} /> : null;
        })()}
      {top && top.kind !== 'choice' && top.kind !== 'share' && top.kind !== 'weigh' && top.kind !== 'vow' && top.kind !== 'mech' && (
        <CardView
          card={top}
          world={def}
          portrait={portrait}
          onClose={() => {
            stopVoice();
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

      {voices && <ListeningSheet onClose={() => setVoices(false)} />}

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
  statusWrap: { position: 'absolute', left: 16, right: 16, bottom: 110, alignItems: 'center' },
  status: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff6e2', ...glass, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, maxWidth: 620, textAlign: 'center', overflow: 'hidden' },
  hintWrap: { position: 'absolute', left: 16, right: 16, bottom: 150, alignItems: 'center' },
  hint: { fontFamily: fonts.body, fontSize: 15, color: '#fff6e2', ...glass, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, maxWidth: 560, textAlign: 'center', overflow: 'hidden' },
  wayBtn: { position: 'absolute', right: 20, bottom: 112 } as never,
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
