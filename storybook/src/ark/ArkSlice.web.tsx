// Nuh's Ark: one fully playable vertical slice of the new look. A child
// explorer walks a sculpted valley in third person, finds pairs of animals,
// leads or drags them to the boarding pads, carries supplies into the ark, and
// waits inside as the rain falls and the water rises. Quran passages are read
// at lanterns; the slice ends with a reflection on patience and trust.
// Prophets are never shown. Animal choices and supplies are game ideas.
import { cue, cueFor } from '@/profile/figure/cue';
import { N8AO, Bloom, BrightnessContrast, EffectComposer, HueSaturation, ToneMapping, Vignette } from '@react-three/postprocessing';
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { router } from 'expo-router';
import { noteAdventure } from '@/home/adventures';
import { ToneMappingMode } from 'postprocessing';
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { useAppState } from '@/state/AppState';
import { useRecitation } from '@/state/Recitation';
import { AyahPlayer } from '@/audio/AyahPlayer';
import { director } from '@/audio/director';
import { useActionHint, useCardNarration } from '@/audio/hooks';
import { ListeningSheet } from '@/audio/ListeningSettings';
import { SoftShapes } from '@/three/soft';
import { fonts } from '@/theme';
import { QUALITY, guessTier, lowerTier, type QualityTier } from '@/world/quality';
import { Ark, SUPPLY_SPOTS, Supply, Yard, clip, type SupplyKind } from './Ark';
import { Beast, SPECS, drawBeastIcon, type Agent as AnyAgent } from './Beasts';
import { Child } from './Child';
import { ARK, ARK_FLOOR_Y, PADS, RAMP, RIVER_Y, START, STALLS, WORLD_R, canStep, floorY, groundY, inHull, onRamp, riverZ, type BeastKind } from './land';
import { nature } from './nature';
import { signTexture } from './paint';
import { Birds, Clouds, FarLand, Flood, Flowers, Forest, Grass, Ground, Lighting, Mountains, Rain, River, Rocks, Sky, Wind, type SceneQuality } from './Scenery';
import { motion, player, pointer, weather, type Move } from './shared';
import { journal } from '@/journal/store';
import { makeNav } from '@/creatures/nav';
import { loadPhysics, physicsReady, type Space, type Walker } from '@/physics/space';
import { validateSpace } from '@/physics/validate';
import { ColliderView, debugColliders } from '@/physics/DebugView';
import { auditScene } from '@/physics/sceneSolids';
import { PropSolids } from '@/physics/PropSolids';
import { makeArkSpace } from './space';
import { mindOf, routeTo, think } from '@/creatures/mind';

/** Ways round the hull, the river, trunks and rocks, for the animals (the ramp counts only while it is down). */
const arkNav = makeNav((ax, az, bx, bz, r) => canStep(ax, az, bx, bz, r, weather.rampUp < 0.5), { radius: 76, cell: 1.6, y: groundY });
import { AFTER, NAMES, NARRATION, READINGS, REFLECTION, REFLECT_REF, SUPPLY_NAMES, clearSave, fresh, load, save, verse, type Reading, type Save } from './story';

type Agent = AnyAgent<BeastKind>;
const KINDS: BeastKind[] = ['giraffe', 'elephant', 'camel', 'sheep', 'horse'];
const SUPPLIES: SupplyKind[] = ['grain', 'hay', 'water'];
const HOMES: Record<BeastKind, [number, number]> = {
  giraffe: [37, 17],
  elephant: [-36, 16],
  camel: [-27, 42],
  sheep: [21, 40],
  horse: [38, -27],
};
const CART = new THREE.Vector3(-17, 0, 4);
CART.y = groundY(CART.x, CART.z);
const local = (x: number, z: number) => new THREE.Vector3(ARK.x + x, 0, ARK.z + z);
const LANTERNS: Record<string, THREE.Vector3> = {
  r1: new THREE.Vector3(-1.4, 0, 50),
  r2: new THREE.Vector3(-14, 0, -11),
  r3: new THREE.Vector3(16, 0, -2),
  r4: local(3.8, 3.3),
};
const isInside = (id: string) => id === 'r4';

type Near =
  | { type: 'beast'; id: string; label: string }
  | { type: 'supply'; kind: SupplyKind; label: string }
  | { type: 'store'; label: string }
  | { type: 'lantern'; id: string; label: string };

type Supplies = Record<SupplyKind, { state: 'cart' | 'carried' | 'flying' | 'stored'; pos: THREE.Vector3; t: number }>;

/** Keeps the scene on the game for the missing-collider audit. */
function SceneGrab({ game }: { game: Game }) {
  game.scene = useThree((s) => s.scene);
  return null;
}

type Game = {
  scene?: THREE.Scene;
  agents: Agent[];
  supplies: Supplies;
  carrying: SupplyKind | null;
  target: THREE.Vector3 | null;
  pending: Near | null;
  cam: { yaw: number; pitch: number; dist: number; pos: THREE.Vector3; look: THREE.Vector3; snap?: boolean };
  drag: Agent | null;
  floodT: number;
  timeScale: number;
  lastPadHint: number;
  stepPhase: number;
  /** Tap-to-go waypoints round the river, trees and the hull. */
  route?: THREE.Vector3[];
  routeFor?: THREE.Vector3 | null;
  /** Collision: the hull, door, ramp rails, trees, rocks, river and rim; the explorer's capsule and each animal's. */
  space: Space;
  me: Walker;
  walkers: Map<Agent, Walker>;
  /** Fixed-step movement (see the adventure worlds): accumulator, commanded speed, time pushing against something. */
  acc: number;
  cmd: number;
  stuck: number;
  prev: { x: number; y: number; z: number };
  at: { x: number; z: number };
  safes: { x: number; y: number; z: number; at: number }[];
  clock: number;
  recovered: number;
  wip: number;
  wipMax: number;
  spawn: [number, number];
};
const STEP = 1 / 60;
/** Share of the way to close this frame when easing at rate k: the same over a second at any frame rate. */
const damp = (dt: number, k: number) => 1 - Math.exp(-k * dt);

function makeAgents(s: Save): Agent[] {
  const out: Agent[] = [];
  for (const k of KINDS)
    for (const m of [0, 1] as const) {
      const [hx, hz] = HOMES[k];
      const p = new THREE.Vector3(hx + (m ? 2.4 : -1.2), 0, hz + (m ? 1.5 : -1));
      const a: Agent = {
        id: `${k}${m}`,
        kind: k,
        mate: m,
        pos: p,
        yaw: Math.random() * 6.28,
        speed: 0,
        phase: Math.random() * 6,
        state: 'wander',
        target: null,
        home: p.clone(),
        path: [],
        found: s.found.includes(`${k}${m}`),
        graze: 0,
        timer: Math.random() * 3,
        highlight: false,
        scale: m ? 0.92 : 1,
      };
      if (s.boarded.includes(k)) {
        const st = STALLS[k];
        a.state = 'stall';
        a.pos.set(ARK.x + st.x + (m ? 1.0 : -1.0), 0, ARK.z + st.z + (st.z < 0 ? -0.6 : 0.6));
        a.yaw = st.z < 0 ? 0 : Math.PI;
      }
      a.pos.y = floorY(a.pos.x, a.pos.z, 0, true);
      out.push(a);
    }
  return out;
}

function makeSupplies(s: Save): Supplies {
  const o = {} as Supplies;
  SUPPLIES.forEach((k, i) => {
    o[k] = { state: s.stored.includes(k) ? 'stored' : 'cart', pos: new THREE.Vector3(CART.x - 0.8 + i * 0.8, CART.y + 0.75, CART.z), t: 0 };
  });
  return o;
}

/* ============================== the scene ============================== */

type Api = {
  onFound: (a: Agent) => void;
  onPad: (k: BeastKind) => void;
  onBoarded: (k: BeastKind) => void;
  onNear: (n: Near | null) => void;
  onStored: (k: SupplyKind) => void;
  onArrived: () => void;
  onInside: (v: boolean) => void;
  onFloodStart: () => void;
  onFloodCalm: () => void;
  onLantern: (id: string) => void;
  onHint: (t: string) => void;
};

function Director({ game, move, api, saveRef, q }: { game: Game; move: MutableRefObject<Move>; api: MutableRefObject<Api>; saveRef: MutableRefObject<Save>; q: SceneQuality }) {
  const { camera, raycaster, pointer: ndc, scene } = useThree();
  // Where the camera is drawn (tests check it never sits inside a solid).
  (game as unknown as { camera: THREE.Camera }).camera = camera;
  const keys = useRef(new Set<string>());
  const lastNear = useRef<string>('');
  const insideRef = useRef<boolean | null>(null);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const camDist = useRef(7.5);
  const camPitch = useRef(0.3);

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

  // Release a dragged animal wherever the pointer lets go.
  useEffect(() => {
    const upFn = () => {
      const a = game.drag;
      if (!a) return;
      game.drag = null;
      pointer.holding = false;
      const pad = PADS.find((p) => p.kind === a.kind)!;
      if (Math.hypot(a.pos.x - pad.x, a.pos.z - pad.z) < 4) sendToPad(a.kind);
      else {
        for (const b of game.agents.filter((x) => x.kind === a.kind && x.state !== 'stall' && x.state !== 'board' && x.state !== 'pad')) {
          b.state = 'wander';
          b.home.copy(a.pos);
        }
        const other = PADS.find((p) => Math.hypot(a.pos.x - p.x, a.pos.z - p.z) < 3);
        if (other) api.current.onHint(`That pad shows a ${NAMES[other.kind][0]}. Look for the ${NAMES[a.kind][0]} picture.`);
      }
    };
    window.addEventListener('pointerup', upFn);
    window.addEventListener('pointercancel', upFn);
    return () => {
      window.removeEventListener('pointerup', upFn);
      window.removeEventListener('pointercancel', upFn);
    };
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function sendToPad(k: BeastKind) {
    const pad = PADS.find((p) => p.kind === k)!;
    for (const a of game.agents.filter((x) => x.kind === k)) {
      if (a.state === 'stall' || a.state === 'board' || a.state === 'pad') continue;
      a.found = true;
      a.state = 'pad';
      a.target = new THREE.Vector3(pad.x + (a.mate ? 1.1 : -1.1), 0, pad.z + (a.mate ? 0.4 : -0.4));
      a.timer = 0;
    }
    nature.call(k);
    api.current.onPad(k);
  }

  function board(k: BeastKind) {
    const st = STALLS[k];
    for (const a of game.agents.filter((x) => x.kind === k)) {
      const off = a.mate ? 1.0 : -1.0;
      a.state = 'board';
      a.timer = a.mate ? -1.6 : 0;
      const aisle = 0.4;
      a.path = [
        new THREE.Vector3(RAMP.x + off * 0.5, 0, RAMP.z1 + 1.2),
        new THREE.Vector3(RAMP.x + off * 0.3, 0, RAMP.z0 + 0.4),
        local(off * 0.3, aisle),
        // Through the middle of the stall's gate, one behind the other, then to its place.
        local(st.x + off * 0.45, aisle),
        local(st.x + off * 0.45, st.z < 0 ? -1.5 : 1.6),
        local(st.x + off, st.z + (st.z < 0 ? -0.6 : 0.6)),
      ];
    }
  }

  // Expose a few test hooks.
  useEffect(() => {
    (globalThis as any).__arkGame = { game, sendToPad, board, player, weather, scene };
  });

  // Runs before everything else each frame (priority -1), so the explorer, the
  // animals and the camera are all drawn at this frame's positions. It used to
  // run after the figure, which then showed last frame's step every frame:
  // with uneven frame times that read as a stutter.
  useFrame((st, rawDt) => {
    cue.holding = !!game.carrying;
    cue.leading = game.agents.some((x) => x.state === 'follow');
    const dt = Math.min(0.05, rawDt) * game.timeScale;
    const t = st.clock.elapsedTime;
    weather.time = t;
    const s = saveRef.current;
    const rampDown = weather.rampUp < 0.5;

    /* ---------- the explorer ---------- */
    const k = keys.current;
    let ix = move.current.x + ((k.has('d') || k.has('arrowright')) ? 1 : 0) - ((k.has('a') || k.has('arrowleft')) ? 1 : 0);
    let iy = move.current.y + ((k.has('w') || k.has('arrowup')) ? 1 : 0) - ((k.has('s') || k.has('arrowdown')) ? 1 : 0);
    const run = move.current.run || k.has('shift');
    if (ix || iy) game.target = null;
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
      if (game.routeFor !== game.target) {
        game.routeFor = game.target;
        game.route = arkNav.route(player.pos, game.target, { r: 0.35, budget: 2500, near: game.pending ? 2 : 1.2 }) ?? [];
      }
      const rt = game.route ?? [];
      while (rt.length > 1 && Math.hypot(rt[0].x - player.pos.x, rt[0].z - player.pos.z) < 0.7) rt.shift();
      const wp = rt.length > 1 ? rt[0] : game.target;
      const tx = wp.x - player.pos.x;
      const tz = wp.z - player.pos.z;
      const d = Math.hypot(game.target.x - player.pos.x, game.target.z - player.pos.z);
      if (d < (game.pending ? 2.2 : 0.4)) {
        game.target = null;
        if (game.pending) {
          const p = game.pending;
          game.pending = null;
          act(p);
        }
      } else {
        const dw = Math.hypot(tx, tz) || 1;
        dx = tx / dw;
        dz = tz / dw;
      }
    }
    game.clock += dt;
    const sp = game.space;
    const me = game.me;
    // Something else moved the explorer (a test, the start of the flood): bring the capsule, onto open ground.
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
    // Fixed 60 Hz physics steps: the same result at any frame rate.
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
    // The walk cycle follows the ground really covered: against a wall the explorer stands, not walks on the spot.
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
    const al = Math.min(1, game.acc / STEP);
    player.pos.set(game.prev.x + (me.x - game.prev.x) * al, game.prev.y + (me.y - game.prev.y) * al, game.prev.z + (me.z - game.prev.z) * al);
    game.at = { x: player.pos.x, z: player.pos.z };
    if (moved > 0) {
      const before = player.phase;
      player.phase += (moved / 1.3) * Math.PI;
      if (Math.floor(before / Math.PI) !== Math.floor(player.phase / Math.PI)) nature.step(player.inside || onRamp(player.pos.x, player.pos.z));
    }
    const nowInside = inHull(player.pos.x, player.pos.z, 0);
    if (nowInside !== insideRef.current) {
      insideRef.current = nowInside;
      player.inside = nowInside;
      api.current.onInside(nowInside);
    }
    if (!s.arrived && Math.hypot(player.pos.x - ARK.x, player.pos.z - ARK.z) < 24) api.current.onArrived();

    /* ---------- animals ---------- */
    const drag = game.drag;
    if (drag) {
      raycaster.setFromCamera(ndc, camera);
      plane.constant = -drag.pos.y;
      if (raycaster.ray.intersectPlane(plane, tmp)) {
        // Keep the drag within the meadow and out of the river and the hull.
        if (Math.hypot(tmp.x, tmp.z) < 75 && !inHull(tmp.x, tmp.z, 1) && Math.abs(tmp.z - riverZ(tmp.x)) > 6) drag.target = tmp.clone();
      }
    }
    for (const a of game.agents) {
      const spec = SPECS[a.kind];
      a.timer += dt;
      let goal: THREE.Vector3 | null = null;
      let pace = spec.speed;
      if (a.state === 'wander') {
        // Each kind's own temperament: pairs keep together, sheep lie down, giraffes and goats come to look (creatures/mind.ts).
        const want = think(a, {
          dt,
          player: player.pos,
          playerSpeed: player.speed,
          group: game.agents.filter((o) => o.kind === a.kind && o.state === 'wander'),
          nav: arkNav,
          ok: (x, z) => canStep(x, z, x, z, 0.3, rampDown) && !inHull(x, z, 1.5),
        });
        goal = want?.goal ?? null;
        pace = spec.speed * (want?.pace ?? 0.45);
        // Notice the explorer nearby: found.
        const d = Math.hypot(a.pos.x - player.pos.x, a.pos.z - player.pos.z);
        if (!a.found && d < 7) {
          a.found = true;
          api.current.onFound(a);
        }
      } else if (a.state === 'follow') {
        const leader = game.drag && game.drag.kind === a.kind ? game.drag.pos : player.pos;
        const back = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw)).multiplyScalar(-(2.6 + a.mate * 2.4 + spec.len * 0.6));
        const side = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw)).multiplyScalar(a.mate ? 1.2 : -1.2);
        goal = game.drag ? leader.clone().add(side) : leader.clone().add(back).add(side);
        // Round the river bend, trees and the hull instead of walking into them.
        if (!game.drag) goal = routeTo(a, goal, arkNav);
        mindOf(a).rest = 0;
        pace = Math.max(spec.speed, player.speed * 1.05);
        const pad = PADS.find((p) => p.kind === a.kind)!;
        // The pair goes onto its pad when it gets close, or when the child stands on the pad with the pair just behind.
        const onPad = Math.hypot(player.pos.x - pad.x, player.pos.z - pad.z) < 2.5 && Math.hypot(a.pos.x - pad.x, a.pos.z - pad.z) < 7.5;
        if (a.mate === 0 && (Math.hypot(a.pos.x - pad.x, a.pos.z - pad.z) < 4.2 || onPad)) sendToPad(a.kind);
        else if (a.mate === 0 && t - game.lastPadHint > 6) {
          const other = PADS.find((p) => p.kind !== a.kind && Math.hypot(a.pos.x - p.x, a.pos.z - p.z) < 3);
          if (other) {
            game.lastPadHint = t;
            api.current.onHint(`That pad shows a ${NAMES[other.kind][0]}. Find the ${NAMES[a.kind][0]} picture.`);
          }
        }
      } else if (a.state === 'drag') {
        goal = a.target;
        pace = spec.speed * 2.2;
      } else if (a.state === 'pad') {
        goal = a.target;
        pace = spec.speed * 0.8;
        const mates = game.agents.filter((x) => x.kind === a.kind);
        if (a.mate === 0 && mates.every((m) => m.state === 'pad' && m.target && Math.hypot(m.pos.x - m.target.x, m.pos.z - m.target.z) < 0.4)) {
          if (a.timer > 1.4) {
            board(a.kind);
          }
        }
      } else if (a.state === 'board') {
        if (a.timer < 0) goal = null;
        else {
          while (a.path.length && Math.hypot(a.pos.x - a.path[0].x, a.pos.z - a.path[0].z) < 0.35) a.path.shift();
          goal = a.path[0] ?? null;
          if (!goal) {
            a.state = 'stall';
            a.yaw = STALLS[a.kind].z < 0 ? 0 : Math.PI;
            if (a.mate === 1) api.current.onBoarded(a.kind);
          }
        }
        pace = spec.speed * 0.7;
      }
      // Walk toward the goal, swept against the hull, rails, trees, rocks and the other animals.
      let moving = false;
      const w = game.walkers.get(a)!;
      if (Math.hypot(w.x - a.pos.x, w.z - a.pos.z) > 0.01) {
        const o = a.state === 'stall' || a.state === 'board' ? [a.pos.x, a.pos.z] : (sp.findOpen(a.pos.x, a.pos.z, w.r, 6) ?? [a.pos.x, a.pos.z]);
        sp.place(w, o[0], o[1]);
      }
      // Boarding follows a fixed path up the ramp and through the doorway (checked by the tests), so it is not pushed about.
      const ghost = a.state === 'board' || a.state === 'stall' || (a.state === 'pad' && (a.stuck ?? 0) > 3);
      const aFloor = ghost ? (x: number, z: number) => floorY(x, z, weather.lift, true) : undefined;
      if (goal) {
        const gx = goal.x - a.pos.x;
        const gz = goal.z - a.pos.z;
        const d = Math.hypot(gx, gz);
        if (d > (a.state === 'follow' ? 0.8 : 0.25)) {
          const spd = Math.min(pace, d * 1.6 + 0.3);
          a.speed += (spd - a.speed) * Math.min(1, dt * 4);
          const step = a.speed * dt;
          const went = sp.move(w, (gx / d) * step, (gz / d) * step, dt, { maxStep: 0.5, ghost, floor: aFloor });
          if (went > step * 0.3) {
            moving = true;
            a.yaw = Math.atan2(gx, gz);
            a.stuck = 0;
          } else {
            a.stuck = (a.stuck ?? 0) + dt;
            if (a.state === 'wander') {
              mindOf(a).route = [];
              mindOf(a).left = Math.min(mindOf(a).left, 0.5);
            }
          }
          // Legs move with the ground really covered: no sliding hooves.
          a.phase += (went / spec.stride) * Math.PI * 2;
        } else sp.move(w, 0, 0, dt, { ghost, floor: aFloor });
      } else sp.move(w, 0, 0, dt, { ghost, floor: aFloor });
      if (!ghost) {
        sp.noteSafe(w, game.clock);
        sp.checkAndRecover(w);
      }
      a.pos.set(w.x, a.pos.y, w.z);
      // Duck through the doorway: a giraffe lowers its neck to pass under the lintel.
      const lz = a.pos.z - ARK.z;
      const atDoor = Math.abs(a.pos.x - ARK.x) < ARK.door + 1.5 && lz > ARK.wid / 2 - 3 && lz < ARK.wid / 2 + 3.5;
      a.duck = (a.duck ?? 0) + ((atDoor ? 1 : 0) - (a.duck ?? 0)) * Math.min(1, dt * 4);
      if (!moving) a.speed += (0 - a.speed) * Math.min(1, dt * 5);
      // Graze while standing still in the meadow.
      const mm = mindOf(a);
      if (a.state !== 'wander') {
        mm.rest += (0 - mm.rest) * Math.min(1, dt * 2);
        mm.look *= 1 - Math.min(1, dt * 3);
      }
      const grazeWant = !moving && (a.state === 'wander' || a.state === 'stall') && mm.rest < 0.2 && Math.abs(mm.look) < 0.2 && Math.sin(t * 0.21 + a.scale * 40) > 0.1 ? 1 : 0;
      a.graze += (grazeWant - a.graze) * Math.min(1, dt * 1.2);
      // Feet on whatever is underfoot: the walker's height comes from the same floor the land is drawn with.
      a.pos.y = w.y;
    }

    /* ---------- supplies ---------- */
    for (const kind of SUPPLIES) {
      const sp = game.supplies[kind];
      if (sp.state === 'carried') {
        sp.pos.set(player.pos.x - Math.sin(player.yaw) * 0.25, player.pos.y + 1.75 + Math.sin(t * 3) * 0.03, player.pos.z - Math.cos(player.yaw) * 0.25);
        if (player.inside) {
          const spot = SUPPLY_SPOTS[kind];
          const sx = ARK.x + spot.x;
          const sz = ARK.z + spot.z;
          if (Math.hypot(player.pos.x - sx, player.pos.z - sz) < 3.2) {
            sp.state = 'flying';
            sp.t = 0;
            game.carrying = null;
          }
        }
      } else if (sp.state === 'flying') {
        sp.t += dt / (motion.reduced ? 0.2 : 0.8);
        const spot = SUPPLY_SPOTS[kind];
        const dest = new THREE.Vector3(ARK.x + spot.x, ARK_FLOOR_Y + weather.lift, ARK.z + spot.z);
        const e = Math.min(1, sp.t);
        sp.pos.lerp(dest, Math.min(1, e * 0.5 + dt * 6));
        sp.pos.y += Math.sin(Math.min(1, e) * Math.PI) * 0.05;
        if (sp.t >= 1) {
          sp.state = 'stored';
          sp.pos.copy(dest);
          nature.place();
          api.current.onStored(kind);
        }
      }
    }

    /* ---------- the weather and the flood ---------- */
    const allIn = s.boarded.length === KINDS.length && s.stored.length === SUPPLIES.length;
    if (s.flood === 0) {
      const gather = (s.boarded.length / KINDS.length) * 0.32 + (allIn ? 0.08 : 0);
      weather.storm += (gather - weather.storm) * Math.min(1, dt * 0.5);
      weather.rain += ((allIn ? 0.12 : 0) - weather.rain) * Math.min(1, dt * 0.5);
      if (allIn && player.inside) api.current.onFloodStart();
    } else if (s.flood === 1) {
      game.floodT += dt;
      const ft = game.floodT;
      weather.storm += (Math.min(1, 0.4 + ft / 8) * (ft < 44 ? 1 : 0.15) - weather.storm) * Math.min(1, dt * (ft < 44 ? 0.6 : 0.35));
      weather.rain += ((ft < 42 ? Math.min(1, ft / 6) : 0) - weather.rain) * Math.min(1, dt * 0.8);
      const before = weather.rampUp;
      weather.rampUp = Math.min(1, Math.max(0, (ft - 2) / 3));
      if (before === 0 && weather.rampUp > 0) nature.door();
      const rise = Math.min(1, Math.max(0, (ft - 6) / 34));
      weather.water = RIVER_Y + (9.5 - RIVER_Y) * (rise * rise * (3 - 2 * rise));
      weather.lift = Math.max(0, weather.water - (ARK.ground + 0.9));
      if (ft > 52) api.current.onFloodCalm();
    } else {
      weather.storm += (0.12 - weather.storm) * Math.min(1, dt * 0.4);
      weather.rain += (0 - weather.rain) * Math.min(1, dt);
      weather.rampUp = 1;
      weather.water = 9.5;
      weather.lift = 9.5 - (ARK.ground + 0.9);
    }

    /* ---------- what is in reach ---------- */
    let near: Near | null = null;
    let best = 3.2;
    const pp = player.pos;
    for (const a of game.agents) {
      if (a.state === 'stall' || a.state === 'board' || a.state === 'pad') continue;
      const d = Math.hypot(a.pos.x - pp.x, a.pos.z - pp.z) - SPECS[a.kind].len * 0.4;
      if (d < best) {
        best = d;
        const pairFound = game.agents.filter((x) => x.kind === a.kind).every((x) => x.found);
        near = {
          type: 'beast',
          id: a.id,
          label: a.state === 'follow' ? `Let the ${NAMES[a.kind][1]} rest here` : pairFound ? `Lead the ${NAMES[a.kind][1]}` : `Greet the ${NAMES[a.kind][0]}`,
        };
      }
    }
    if (!game.carrying)
      for (const kind of SUPPLIES) {
        const sp = game.supplies[kind];
        if (sp.state !== 'cart') continue;
        const d = Math.hypot(sp.pos.x - pp.x, sp.pos.z - pp.z);
        if (d < best) {
          best = d;
          near = { type: 'supply', kind, label: `Carry the ${SUPPLY_NAMES[kind]}` };
        }
      }
    for (const r of READINGS) {
      const L = LANTERNS[r.id];
      if (isInside(r.id) && !player.inside) continue;
      const d = Math.hypot(L.x - pp.x, L.z - pp.z);
      if (d < best) {
        best = d;
        near = { type: 'lantern', id: r.id, label: `Read: ${r.title}` };
      }
    }
    const key = near ? `${near.type}:${near.label}` : '';
    if (key !== lastNear.current) {
      lastNear.current = key;
      for (const a of game.agents) a.highlight = !!near && near.type === 'beast' && near.id === a.id;
      api.current.onNear(near);
    }
    if ((k.has('e') || k.has(' ') || k.has('enter')) && near) {
      k.delete('e');
      k.delete(' ');
      k.delete('enter');
      act(near);
    }

    /* ---------- camera ---------- */
    const cam = game.cam;
    const inside = player.inside;
    let pitch = inside ? Math.max(cam.pitch, 0.78) : cam.pitch;
    let dist = inside ? Math.max(cam.dist, 9) : cam.dist;
    const look = tmp.set(pp.x, pp.y + (inside ? 0.8 : 1.35), pp.z);
    const snap = cam.snap;
    cam.snap = false;
    cam.look.lerp(look, snap ? 1 : damp(dt, (motion.reduced ? 30 : 9)));
    // Outside, when the hull, a trunk or a hill is in the way: look over it, or come closer.
    // (Inside, the roof is cut away and the camera looks down from above.)
    const fit = inside ? { pitch, dist } : game.space.cameraFit(cam.look.x, cam.look.y, cam.look.z, cam.yaw, pitch, dist);
    camDist.current += (fit.dist - camDist.current) * damp(dt, (fit.dist < camDist.current ? 10 : 2));
    camPitch.current += (fit.pitch - camPitch.current) * damp(dt, (fit.pitch > camPitch.current ? 8 : 2));
    if (snap || inside) (camDist.current = fit.dist), (camPitch.current = fit.pitch);
    dist = camDist.current;
    pitch = camPitch.current;
    const want3 = new THREE.Vector3(
      cam.look.x + Math.sin(cam.yaw) * Math.cos(pitch) * dist,
      cam.look.y + Math.sin(pitch) * dist,
      cam.look.z + Math.cos(cam.yaw) * Math.cos(pitch) * dist,
    );
    if (!inside) want3.y = Math.max(want3.y, groundY(want3.x, want3.z) + 0.7, weather.water + 0.6);
    cam.pos.lerp(want3, snap ? 1 : damp(dt, (motion.reduced ? 30 : 6)));
    // The eased position may lag into a wall the target already avoids; draw it short of it.
    camera.position.copy(cam.pos);
    if (!inside) game.space.clampCamera(cam.look, camera.position);
    camera.lookAt(cam.look);

    /* ---------- sound ---------- */
    nature.update({ river: Math.abs(pp.z - riverZ(pp.x)), storm: weather.storm, rain: weather.rain, inside, dt });
  }, -1);

  function act(n: Near) {
    const pp = player.pos;
    cueFor(n.label);
    if (n.type === 'beast') {
      const a = game.agents.find((x) => x.id === n.id)!;
      if (Math.hypot(a.pos.x - pp.x, a.pos.z - pp.z) > 4 + SPECS[a.kind].len * 0.5) {
        game.target = a.pos.clone();
        game.pending = n;
        return;
      }
      const mates = game.agents.filter((x) => x.kind === a.kind);
      if (!a.found) {
        a.found = true;
        api.current.onFound(a);
      }
      nature.call(a.kind);
      if (!mates.every((m) => m.found)) {
        api.current.onHint(`A ${NAMES[a.kind][0]}! Its mate is somewhere nearby: walk close to find it.`);
        return;
      }
      if (a.state === 'follow') {
        for (const m of mates) {
          m.state = 'wander';
          m.home.copy(m.pos);
        }
        return;
      }
      // Only one pair follows at a time, so the walk stays calm.
      for (const o of game.agents) if (o.state === 'follow' && o.kind !== a.kind) {
        o.state = 'wander';
        o.home.copy(o.pos);
      }
      for (const m of mates) if (m.state === 'wander') m.state = 'follow';
      api.current.onHint(`The ${NAMES[a.kind][1]} follow you. Lead them to the pad with their picture by the ark.`);
    } else if (n.type === 'supply') {
      const sp = game.supplies[n.kind];
      if (Math.hypot(sp.pos.x - pp.x, sp.pos.z - pp.z) > 3.5) {
        game.target = sp.pos.clone();
        game.pending = n;
        return;
      }
      if (game.carrying) return;
      sp.state = 'carried';
      game.carrying = n.kind;
      nature.place();
      api.current.onHint(`Carry the ${SUPPLY_NAMES[n.kind]} up the ramp to the store inside the ark.`);
    } else if (n.type === 'lantern') {
      const L = LANTERNS[n.id];
      if (Math.hypot(L.x - pp.x, L.z - pp.z) > 3.5) {
        game.target = L.clone();
        game.pending = n;
        return;
      }
      api.current.onLantern(n.id);
    }
  }
  (game as any).act = act;

  return null;
}

/* ============================== world bits ============================== */

function PadSigns() {
  const tex = useMemo(() => Object.fromEntries(KINDS.map((k) => [k, signTexture((g) => drawBeastIcon(g, k))])) as unknown as Record<BeastKind, THREE.Texture>, []);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7a5434', roughness: 0.9 }), []);
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a8916a', roughness: 1 }), []);
  return (
    <group>
      {PADS.map((p) => {
        const y = groundY(p.x, p.z);
        const face = Math.atan2(-p.x, 6 - p.z);
        return (
          <group key={p.kind} position={[p.x, y, p.z]}>
            <mesh material={stone} position-y={0.05} receiveShadow>
              <cylinderGeometry args={[2.0, 2.15, 0.14, 28]} />
            </mesh>
            <group position={[0, 0, 2.3]} rotation-y={face}>
              <mesh material={wood} position-y={0.75} castShadow>
                <cylinderGeometry args={[0.07, 0.09, 1.5, 8]} />
              </mesh>
              <mesh position={[0, 1.55, 0.05]}>
                <circleGeometry args={[0.48, 28]} />
                <meshStandardMaterial map={tex[p.kind]} roughness={0.9} />
              </mesh>
              <mesh material={wood} position={[0, 1.55, 0.0]} rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.52, 0.52, 0.05, 28]} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

function Lanterns({ read, onTap }: { read: string[]; onTap: (id: string) => void }) {
  const mats = useMemo(
    () => ({
      wood: new THREE.MeshStandardMaterial({ color: '#6a4428', roughness: 0.9 }),
      brass: new THREE.MeshStandardMaterial({ color: '#b08a40', metalness: 0.5, roughness: 0.4 }),
      glow: new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffb850', emissiveIntensity: 4 }),
      dim: new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffb850', emissiveIntensity: 1.4 }),
      stone: new THREE.MeshStandardMaterial({ color: '#b8ad98', roughness: 1 }),
    }),
    [],
  );
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const r4 = group.current?.children.find((c) => c.name === 'r4');
    if (r4) r4.position.y = ARK_FLOOR_Y + weather.lift;
  });
  return (
    <group ref={group}>
      {READINGS.map((r) => {
        const L = LANTERNS[r.id];
        const y = isInside(r.id) ? ARK_FLOOR_Y : groundY(L.x, L.z);
        const done = read.includes(r.id);
        return (
          <group
            key={r.id}
            name={r.id}
            position={[L.x, y, L.z]}
            onClick={(e) => {
              if (e.delta > 8) return;
              e.stopPropagation();
              onTap(r.id);
            }}
          >
            <mesh material={mats.stone} position-y={0.12} castShadow>
              <cylinderGeometry args={[0.45, 0.55, 0.24, 10]} />
            </mesh>
            <mesh material={mats.wood} position-y={1.1} castShadow>
              <cylinderGeometry args={[0.07, 0.09, 2.0, 8]} />
            </mesh>
            <mesh material={mats.wood} position={[0.3, 2.05, 0]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
            </mesh>
            <group position={[0.58, 1.7, 0]}>
              <mesh material={mats.brass} position-y={0.24}>
                <coneGeometry args={[0.2, 0.16, 10]} />
              </mesh>
              <mesh material={done ? mats.dim : mats.glow}>
                <cylinderGeometry args={[0.13, 0.15, 0.3, 10]} />
              </mesh>
              <mesh material={mats.brass} position-y={-0.17}>
                <cylinderGeometry args={[0.17, 0.17, 0.04, 10]} />
              </mesh>
              {!isInside(r.id) && <pointLight color="#ffb860" intensity={done ? 1.5 : 4} distance={6} decay={1.6} />}
            </group>
            {/* A small open book stand: the place to read. */}
            <group position={[-0.3, 0.95, 0.2]} rotation-y={0.5}>
              <mesh material={mats.wood} rotation-x={-0.5} position-y={0.0}>
                <boxGeometry args={[0.5, 0.04, 0.36]} />
              </mesh>
              <mesh material={mats.wood} position-y={-0.45}>
                <cylinderGeometry args={[0.04, 0.05, 0.9, 6]} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

function Cart({ game, onTap }: { game: Game; onTap: (k: SupplyKind) => void }) {
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a5a34', roughness: 0.9 }), []);
  const refs = useRef<Record<string, THREE.Group | null>>({});
  useFrame(() => {
    for (const k of SUPPLIES) {
      const g = refs.current[k];
      const sp = game.supplies[k];
      if (!g) continue;
      g.visible = sp.state !== 'stored';
      g.position.copy(sp.pos);
      g.position.y -= sp.state === 'cart' ? 0 : 0.0;
    }
  });
  return (
    <group>
      <group position={CART} rotation-y={0.3}>
        <mesh material={wood} position-y={0.6} castShadow>
          <boxGeometry args={[2.8, 0.14, 1.3]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh material={wood} position={[0, 0.85, s * 0.62]}>
              <boxGeometry args={[2.8, 0.4, 0.08]} />
            </mesh>
            <mesh material={wood} position={[0.2, 0.45, s * 0.75]} rotation-x={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.45, 0.45, 0.1, 18]} />
            </mesh>
          </group>
        ))}
        <mesh material={wood} position={[-2.0, 0.55, 0]} rotation-z={0.15}>
          <boxGeometry args={[1.6, 0.08, 0.08]} />
        </mesh>
      </group>
      {SUPPLIES.map((k) => (
        <group
          key={k}
          ref={(r) => void (refs.current[k] = r)}
          scale={0.75}
          onClick={(e) => {
            if (e.delta > 8) return;
            e.stopPropagation();
            onTap(k);
          }}
        >
          <Supply kind={k} />
        </group>
      ))}
    </group>
  );
}

function Animals({ game, near, onTap }: { game: Game; near: Near | null; onTap: (a: Agent) => void }) {
  return (
    <group>
      {game.agents.map((a) => (
        <Beast
          key={a.id}
          agent={a}
          highlight={near?.type === 'beast' && near.id === a.id}
          onTap={onTap}
          onDown={(ag, e) => {
            if (ag.state === 'stall' || ag.state === 'board' || ag.state === 'pad') return;
            if (!game.agents.filter((x) => x.kind === ag.kind).every((x) => x.found)) return;
            // Long-press-and-move drags; a plain tap leads.
            const sx = e.nativeEvent.clientX;
            const sy = e.nativeEvent.clientY;
            const moveFn = (ev: PointerEvent) => {
              if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 10) return;
              window.removeEventListener('pointermove', moveFn);
              game.drag = ag;
              pointer.holding = true;
              ag.state = 'drag';
              ag.target = ag.pos.clone();
              for (const m of game.agents) if (m.kind === ag.kind && m !== ag && m.state !== 'stall') m.state = 'follow';
            };
            window.addEventListener('pointermove', moveFn);
            window.addEventListener('pointerup', () => window.removeEventListener('pointermove', moveFn), { once: true });
          }}
        />
      ))}
    </group>
  );
}

function TapMarker({ game }: { game: Game }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const m = ref.current;
    if (!m) return;
    m.visible = !!game.target && !game.pending;
    if (game.target) {
      m.position.set(game.target.x, floorY(game.target.x, game.target.z, weather.lift, weather.rampUp < 0.5) + 0.05, game.target.z);
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
        if (pinch) game.cam.dist = Math.min(14, Math.max(3.5, game.cam.dist * (pinch / d)));
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
      game.cam.dist = Math.min(14, Math.max(3.5, game.cam.dist * (1 + Math.sign(e.deltaY) * 0.08)));
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

/* ============================== the app ============================== */

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

type Card = { kind: 'narration'; text: string } | { kind: 'reading'; reading: Reading } | { kind: 'reflection' };

export default function ArkSlice() {
  const app = useAppState();
  const [phys, setPhys] = useState(!!physicsReady());
  useEffect(() => {
    if (!phys) loadPhysics().then(() => setPhys(true));
  }, [phys]);
  if (!app.ready || !phys) return <View style={st.root} />;
  return <Slice />;
}

function Slice() {
  const app = useAppState();
  // Continue Adventure on the home screen comes back here.
  useEffect(() => noteAdventure({ kind: 'ark' }), []);
  const set = app.settings;
  const propsRef = useRef<THREE.Group>(null);
  const rec = useRecitation();
  const { width, height } = useWindowDimensions();
  const portrait = height > width;
  const [webgl] = useState(hasWebGL);
  const [data, setData] = useState<Save>(load);
  useEffect(() => journal.visit('ark', "Nuh's Ark", 11), []);
  const saveRef = useRef(data);
  saveRef.current = data;
  const update = useCallback((f: (s: Save) => Save) => {
    setData((s) => {
      const n = f(s);
      saveRef.current = n;
      save(n);
      return n;
    });
  }, []);
  const [reduced, setReduced] = useState(app.motionOff);
  motion.reduced = reduced;
  const [autoTier, setAutoTier] = useState<QualityTier>(guessTier);
  const forced = (typeof location !== 'undefined' ? new URLSearchParams(location.search).get('q') : null) as QualityTier | null;
  const tier = forced && forced in QUALITY ? forced : set.quality === 'auto' ? autoTier : set.quality;
  const Q = QUALITY[tier];
  const q: SceneQuality = useMemo(() => ({ grass: Q.vegetation, segments: Q.terrainSegments, shadows: Q.shadows, shadowMap: Math.max(1024, Q.shadowMap) }), [Q]);

  const move = useRef<Move>({ x: 0, y: 0, run: false });
  const [near, setNear] = useState<Near | null>(null);
  const [voices, setVoices] = useState(false);
  // A short spoken hint the first time each kind of action is in reach.
  useActionHint(near?.label, near?.label.replace(/\b(the|a|an)\b/gi, '').trim());
  const [inside, setInside] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [hint, setHint] = useState('');
  const [quiet, setQuiet] = useState(set.quietMode);

  const game = useMemo<Game>(() => {
    const s = saveRef.current;
    // Where to begin: inside the ark if everything is aboard, else where you left off.
    const ready = s.boarded.length === KINDS.length && s.stored.length === SUPPLIES.length;
    if (s.flood === 1) s.flood = 0;
    const space = makeArkSpace(physicsReady()!, CART, (k) => saveRef.current.boarded.includes(k));
    // A checked place to begin: the saved spot if still open, else the nearest open ground to it.
    const want = ready || s.flood === 2 ? local(4, 1.4) : s.pos ? new THREE.Vector3(...s.pos) : START.clone();
    const o = space.findOpen(want.x, want.z, 0.35) ?? space.findOpen(START.x, START.z, 0.35) ?? [START.x, START.z];
    const p = new THREE.Vector3(o[0], 0, o[1]);
    const me = space.addWalker('player', 0.35, p.x, p.z);
    player.pos.copy(p);
    player.pos.y = floorY(p.x, p.z, 0, true);
    player.yaw = Math.PI;
    player.inside = inHull(p.x, p.z, 0);
    weather.storm = 0;
    weather.rain = 0;
    weather.water = RIVER_Y;
    weather.lift = 0;
    weather.rampUp = 0;
    clip.constant = 999;
    const agents = makeAgents(s);
    const walkers = new Map<Agent, Walker>();
    for (const a of agents) {
      const r = Math.min(0.9, Math.max(0.22, SPECS[a.kind].r * a.scale * 0.85));
      const f = space.findOpen(a.pos.x, a.pos.z, r, 6) ?? [a.pos.x, a.pos.z];
      a.pos.set(f[0], floorY(f[0], f[1], 0, true), f[1]);
      walkers.set(a, space.addWalker('animal', r, f[0], f[1]));
    }
    const g: Game = {
      space,
      me,
      walkers,
      acc: 0,
      cmd: 0,
      stuck: 0,
      prev: { x: p.x, y: player.pos.y, z: p.z },
      at: { x: p.x, z: p.z },
      safes: [],
      clock: 0,
      recovered: 0,
      wip: 0,
      wipMax: 0,
      spawn: [p.x, p.z],
      agents,
      supplies: makeSupplies(s),
      carrying: null,
      target: null,
      pending: null,
      cam: { yaw: 0.25, pitch: 0.3, dist: 7.5, pos: p.clone().add(new THREE.Vector3(2, 3, 8)), look: p.clone() },
      drag: null,
      floodT: 0,
      timeScale: 1,
      lastPadHint: -99,
      stepPhase: 0,
    };
    if (s.flood === 2) {
      player.pos.y = ARK_FLOOR_Y + 9.5 - (ARK.ground + 0.9);
      for (const a of g.agents) a.pos.y = player.pos.y;
    }
    return g;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useOrbit(game);

  useEffect(() => {
    nature.setVolumes({ ambience: set.ambienceVolume, effects: set.effectsVolume, quiet });
  }, [set.ambienceVolume, set.effectsVolume, quiet]);

  // Remember where the explorer is, every few seconds.
  useEffect(() => {
    const id = setInterval(() => {
      if (saveRef.current.flood === 0) update((s) => ({ ...s, pos: [player.pos.x, player.pos.y, player.pos.z] }));
    }, 4000);
    return () => clearInterval(id);
  }, [update]);

  const say = useCallback((text: string) => setCards((c) => (c.some((x) => x.kind === 'narration' && x.text === text) ? c : [...c, { kind: 'narration', text }])), []);

  useEffect(() => {
    if (!data.arrived && !data.found.length) say(NARRATION.welcome);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(''), Math.max(3500, hint.length * 60));
    return () => clearTimeout(t);
  }, [hint]);

  const api = useRef<Api>(null as unknown as Api);
  api.current = {
    onFound: (a) => {
      update((s) => (s.found.includes(a.id) ? s : { ...s, found: [...s.found, a.id] }));
      const pair = game.agents.filter((x) => x.kind === a.kind);
      if (pair.every((x) => x.found)) setHint(`You found both ${NAMES[a.kind][1]}. Tap one to lead them, or drag one to its pad.`);
      else setHint(`You found a ${NAMES[a.kind][0]}. Its mate is nearby.`);
    },
    onPad: (k) => setHint(`The ${NAMES[k][1]} are on their pad. Watch them walk up into the ark.`),
    onBoarded: (k) => {
      update((s) => (s.boarded.includes(k) ? s : { ...s, boarded: [...s.boarded, k] }));
      journal.observe(`ark:${k}`, { world: 'ark', label: `a pair of ${NAMES[k][1]}`, note: `You led the ${NAMES[k][1]} two by two up the ramp into their stall.`, animal: k });
      const n = saveRef.current.boarded.length;
      setHint(n === KINDS.length ? 'All five pairs are aboard.' : `The ${NAMES[k][1]} are in their stall.`);
      if (n === KINDS.length && saveRef.current.stored.length === SUPPLIES.length) say(NARRATION.ready);
    },
    onNear: setNear,
    onStored: (k) => {
      update((s) => (s.stored.includes(k) ? s : { ...s, stored: [...s.stored, k] }));
      setHint(`The ${SUPPLY_NAMES[k]} is in the store.`);
      if (saveRef.current.stored.length === SUPPLIES.length && saveRef.current.boarded.length === KINDS.length) say(NARRATION.ready);
    },
    onArrived: () => {
      update((s) => ({ ...s, arrived: true }));
      say(NARRATION.ark);
      say(NARRATION.animals);
      say(NARRATION.giraffe);
      say(NARRATION.supplies);
    },
    onInside: setInside,
    onFloodStart: () => {
      update((s) => ({ ...s, flood: 1 }));
      game.floodT = 0;
      say(NARRATION.rain);
    },
    onFloodCalm: () => {
      update((s) => ({ ...s, flood: 2 }));
      say(NARRATION.calm);
      journal.read(AFTER.refs.map((r) => [r[0], r[1]] as [number, number]));
      setCards((c) => [...c, { kind: 'reading', reading: AFTER }]);
    },
    onLantern: (id) => {
      const r = READINGS.find((x) => x.id === id)!;
      update((s) => (s.read.includes(id) ? s : { ...s, read: [...s.read, id] }));
      journal.read(r.refs.map((x) => [x[0], x[1]] as [number, number]));
      setCards((c) => [...c.filter((x) => x.kind !== 'reading'), { kind: 'reading', reading: r }]);
    },
    onHint: setHint,
  };

  const act = (n: Near) => (game as any).act?.(n);
  const tapBeast = (a: Agent) => act({ type: 'beast', id: a.id, label: '' });
  const tapSupply = (k: SupplyKind) => act({ type: 'supply', kind: k, label: '' });
  const tapLantern = (id: string) => act({ type: 'lantern', id, label: '' });
  const tapGround = (p: THREE.Vector3) => {
    nature.start();
    game.target = p.clone();
    game.pending = null;
  };

  // Back to firm open ground somewhere recent (or the start of the path). Nothing in the story is undone.
  const toSafeGround = useCallback(() => {
    const me = game.me;
    const pick = [...game.safes].reverse().find((p) => Math.hypot(p.x - me.x, p.z - me.z) > 4 && game.space.okSpot(p.x, p.z, me.r));
    const o = pick ? [pick.x, pick.z] : (game.space.findOpen(START.x, START.z, me.r) ?? [START.x, START.z]);
    game.target = null;
    game.pending = null;
    game.space.place(me, o[0], o[1]);
    player.pos.set(me.x, me.y, me.z);
    game.prev = { x: me.x, y: me.y, z: me.z };
    game.at = { x: me.x, z: me.z };
    game.cam.look.copy(player.pos);
    game.cam.snap = true;
    game.recovered++;
  }, [game]);
  useEffect(() => {
    const sp = game.space;
    sp.holds++;
    return () => {
      sp.holds--;
      setTimeout(() => sp.holds || sp.dispose(), 0);
    };
  }, [game]);

  // Test hooks.
  useEffect(() => {
    (globalThis as any).__ark = {
      toSafeGround,
      validate: () => validateSpace(game.space, { spawn: game.spawn, radius: WORLD_R }),
      /** Drawn parts that look solid but have no collider (should be none). */
      audit: () => (game.scene ? auditScene(game.scene, game.space, WORLD_R) : null),
      game,
      player,
      weather,
      act,
      teleport: (x: number, z: number) => {
        player.pos.set(x, floorY(x, z, weather.lift, weather.rampUp < 0.5), z);
        game.cam.look.copy(player.pos);
        game.cam.snap = true;
      },
      view: (yaw: number, pitch: number, dist: number) => void Object.assign(game.cam, { yaw, pitch, dist, snap: true }),
      speed: (k: number) => (game.timeScale = k),
      save: () => saveRef.current,
      cards: () => cards.length,
      reading: (id: string) => setCards((c) => [...c, { kind: 'reading', reading: [...READINGS, AFTER].find((r) => r.id === id)! }]),
    };
  });

  const top = cards[0];
  const allIn = data.boarded.length === KINDS.length && data.stored.length === SUPPLIES.length;
  const objective = !data.arrived
    ? 'Walk down the path to the ark'
    : data.flood === 2
      ? data.reflected
        ? 'Thank you for playing'
        : 'Read what came next, then reflect'
      : data.flood === 1
        ? 'Wait inside the ark as the water rises'
        : allIn
          ? 'Go inside the ark'
          : `Find the pairs and bring them to their pads · carry the supplies inside`;

  if (!webgl)
    return (
      <View style={[st.root, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
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
        <PerformanceMonitor onDecline={() => set.quality === 'auto' && setAutoTier((t) => lowerTier(t))} />
        <Sky />
        <Lighting q={q} />
        <Wind />
        <Ground q={q} onTap={tapGround} />
        <group userData={{ noSolid: true }}>
          <Grass q={q} />
          <Flowers q={q} />
        </group>
        <Forest q={q} />
        <River />
        <FarLand />
        <Mountains />
        <Clouds />
        <Birds />
        <group ref={propsRef}>
          <Rocks q={q} />
          <Yard />
          <PadSigns />
          <Ark boarded={data.boarded} stored={data.stored} inside={inside} />
          <Lanterns read={data.read} onTap={tapLantern} />
          <Cart game={game} onTap={tapSupply} />
        </group>
        <PropSolids root={propsRef} space={game.space} />
        <group userData={{ noSolid: true }}>
          <Animals game={game} near={near} onTap={tapBeast} />
          <Child />
          <TapMarker game={game} />
        </group>
        <SceneGrab game={game} />
        {debugColliders() && <ColliderView space={game.space} spawn={game.spawn} />}
        <Flood />
        <Rain />
        <Director game={game} move={move} api={api} saveRef={saveRef} q={q} />
        {Q.post && (
          <EffectComposer multisampling={tier === 'high' ? 4 : 0}>
            {tier === 'high' ? <N8AO aoRadius={1.6} distanceFalloff={0.6} intensity={2.2} halfRes /> : <></>}
            <Bloom mipmapBlur intensity={0.7} luminanceThreshold={1.05} luminanceSmoothing={0.25} />
            <Vignette offset={0.32} darkness={0.42} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            <HueSaturation saturation={0.18} />
            <BrightnessContrast brightness={0.02} contrast={0.06} />
          </EffectComposer>
        )}
      </Canvas>

      {/* Top bar. */}
      <View style={st.topBar} pointerEvents="box-none">
        <Pressable style={st.pill} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityRole="button" accessibilityLabel="Leave the ark">
          <Text style={st.pillText}>‹ Leave</Text>
        </Pressable>
        <Pressable style={[st.pill, { position: 'absolute', left: 0, top: 46 }]} onPress={() => router.push('/journal' as never)} accessibilityRole="button" accessibilityLabel="Open my discovery journal">
          <Text style={st.pillText}>My journal</Text>
        </Pressable>
        <Pressable style={[st.pill, { position: 'absolute', left: 0, top: 92 }]} onPress={() => setVoices(true)} accessibilityRole="button" accessibilityLabel="Voices and sound">
          <Text style={st.pillText}>Voices and sound</Text>
        </Pressable>
        <Pressable style={[st.pill, { position: 'absolute', left: 0, top: 138 }]} onPress={toSafeGround} accessibilityRole="button" accessibilityLabel="Return to safe ground">
          <Text style={st.pillText}>Return to safe ground</Text>
        </Pressable>
        <View style={st.objective} pointerEvents="none">
          <Text style={st.title}>Nuh&apos;s Ark · Surah Hud</Text>
          <Text style={st.goal}>{objective}</Text>
          <View style={st.pairs}>
            {KINDS.map((k) => (
              <Text key={k} style={[st.pair, data.boarded.includes(k) && st.pairDone]}>
                {data.boarded.includes(k) ? '✓ ' : ''}
                {NAMES[k][1]}
              </Text>
            ))}
            {SUPPLIES.map((k) => (
              <Text key={k} style={[st.pair, data.stored.includes(k) && st.pairDone]}>
                {data.stored.includes(k) ? '✓ ' : ''}
                {k}
              </Text>
            ))}
          </View>
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
              clearSave();
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
        <Pressable style={st.action} onPress={() => act(near)} accessibilityRole="button" accessibilityLabel={near.label}>
          <Text style={st.actionText}>{near.label}</Text>
          <Text style={st.actionKey}>E</Text>
        </Pressable>
      )}

      {!top && <Joystick move={move} />}

      {top && (
        <CardView
          card={top}
          portrait={portrait}
          onClose={() => {
            director.stop();
            setCards((c) => c.slice(1));
            if (top.kind === 'reading' && top.reading.id === AFTER.id) setCards((c) => [...c, { kind: 'reflection' }]);
            if (top.kind === 'reflection') update((s) => ({ ...s, reflected: true }));
          }}
          listen={(s, a) => rec.play(s, a)}
        />
      )}

      {data.flood === 2 && data.reflected && !top && (
        <View style={st.endRow} pointerEvents="box-none">
          <Pressable style={st.pill} onPress={() => setCards((c) => [...c, { kind: 'reading', reading: AFTER }, { kind: 'reflection' }])}>
            <Text style={st.pillText}>Read the ending again</Text>
          </Pressable>
        </View>
      )}

      {voices && <ListeningSheet onClose={() => setVoices(false)} />}

      <Text style={st.footer} pointerEvents="none">
        Draft for scholarly review · animal choices, supplies and the ark&apos;s look are game ideas, not historical claims · no prophet is shown
      </Text>
    </View>
  );
}

/** A "read aloud" button: the narrator reads this now. */
function speak(text: string) {
  director.readNow(text);
}

function NarrationCard({ text, width, onClose }: { text: string; width: string | number; onClose: () => void }) {
  useCardNarration(text);
  return (
    <View style={[st.card, { width } as never, st.cardBottom]}>
      <ContentLabel kind="explanation" extra="narration written for this game" />
      <Text style={st.cardText}>{text}</Text>
      <View style={st.row}>
        <Pressable accessibilityRole="button" style={st.btnGhost} onPress={() => speak(text)}>
          <Text style={st.btnGhostText}>Read aloud</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={st.btn} onPress={onClose}>
          <Text style={st.btnText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CardView({ card, portrait, onClose, listen }: { card: Card; portrait: boolean; onClose: () => void; listen: (s: number, a: number) => void }) {
  const width = portrait ? '94%' : 560;
  if (card.kind === 'narration') return <NarrationCard text={card.text} width={width} onClose={onClose} />;
  if (card.kind === 'reading') {
    const r = card.reading;
    return (
      <View style={[st.card, { width } as never, st.cardMid]}>
        <ScrollView style={{ maxHeight: portrait ? 460 : 420 }} contentContainerStyle={{ gap: 10 }}>
          <Text style={st.cardTitle}>{r.title}</Text>
          <AyahPlayer key={r.id} refs={r.refs} note={r.note} />
          <ContentLabel kind="explanation" />
          <Text style={st.cardText}>{r.note}</Text>
        </ScrollView>
        <View style={st.row}>
          <Pressable accessibilityRole="button" style={st.btnGhost} onPress={() => speak(r.note)}>
            <Text style={st.btnGhostText}>Read the explanation aloud</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={st.btn} onPress={onClose}>
            <Text style={st.btnText}>Close</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  const v = verse(REFLECT_REF);
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ScrollView style={{ maxHeight: portrait ? 480 : 440 }} contentContainerStyle={{ gap: 10 }}>
        <ContentLabel kind="explanation" extra="reflection" />
        <Text style={st.cardTitle}>{REFLECTION.title}</Text>
        {REFLECTION.body.map((b) => (
          <Text key={b} style={st.cardText}>
            {b}
          </Text>
        ))}
        <ContentLabel kind="quran" extra={`Surah ${v.surah}, ayah ${v.ayah}`} />
        {v.arabic && <Text style={st.arabic}>{v.arabic}</Text>}
        <ContentLabel kind="translation" extra="Saheeh International" />
        <Text style={st.cardText}>{v.translation}</Text>
        <ContentLabel kind="explanation" extra="questions to think about" />
        {REFLECTION.questions.map((x) => (
          <Text key={x} style={st.cardText}>
            • {x}
          </Text>
        ))}
      </ScrollView>
      <View style={st.row}>
        <Pressable accessibilityRole="button" style={st.btn} onPress={onClose}>
          <Text style={st.btnText}>Finish</Text>
        </Pressable>
      </View>
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
  note: { fontFamily: fonts.body, fontSize: 16, color: '#efe0c4', textAlign: 'center' },
  topBar: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  pill: { ...glass, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#fbeed4' },
  objective: { flex: 1, alignItems: 'center', gap: 4 },
  title: { fontFamily: fonts.display, fontSize: 18, color: '#fff6e2', textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 10 },
  goal: { fontFamily: fonts.body, fontSize: 14, color: '#fbeed4', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.65)', textShadowRadius: 8 },
  pairs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, maxWidth: 520 },
  pair: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,246,226,0.75)', ...glass, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  pairDone: { color: '#fff6e2', backgroundColor: 'rgba(90,120,60,0.7)' },
  hintWrap: { position: 'absolute', left: 16, right: 16, bottom: 150, alignItems: 'center' },
  hint: { fontFamily: fonts.body, fontSize: 15, color: '#fff6e2', ...glass, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, maxWidth: 560, textAlign: 'center', overflow: 'hidden' },
  action: { position: 'absolute', right: 20, bottom: 42, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,240,205,0.95)', borderRadius: 999, paddingLeft: 20, paddingRight: 8, paddingVertical: 8 },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 16, color: '#4a3220' },
  actionKey: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff6e2', backgroundColor: '#8a5a34', borderRadius: 999, width: 28, height: 28, textAlign: 'center', lineHeight: 28, overflow: 'hidden' },
  stickWrap: { position: 'absolute', left: 22, bottom: 26, alignItems: 'flex-start', gap: 6 },
  stick: { width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(255,246,226,0.16)', borderWidth: 2, borderColor: 'rgba(255,246,226,0.4)', alignItems: 'center', justifyContent: 'center' },
  knob: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,246,226,0.85)' },
  stickHint: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,246,226,0.85)', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  card: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(255,250,238,0.97)', borderRadius: 20, padding: 18, gap: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.35)' } as never,
  cardBottom: { bottom: 24 },
  cardMid: { top: '10%' },
  cardTitle: { fontFamily: fonts.display, fontSize: 21, color: '#3b3326' },
  cardText: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: '#3b3326' },
  arabic: { fontFamily: fonts.quran, fontSize: 24, lineHeight: 46, color: '#2a2418', textAlign: 'right', writingDirection: 'rtl' },
  small: { fontFamily: fonts.body, fontSize: 12, color: '#6e624e' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' },
  btn: { backgroundColor: '#6f8f6a', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#fffbf2' },
  btnGhost: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#cbb894', alignSelf: 'flex-start' },
  btnGhostText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#6e5a3a' },
  endRow: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  footer: { position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontFamily: fonts.body, fontSize: 10, color: 'rgba(255,246,226,0.7)', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
});
