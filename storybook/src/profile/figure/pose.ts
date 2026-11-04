// The explorer's animation: poses for each state, blended smoothly by weight,
// with one-shot gestures layered over walking, plus life on top (breathing,
// blinking, looking around, leaning into turns) and springy hair and cloth.
// Angles are radians on a simple skeleton; the character faces +z, its left
// side is +x. A leg or arm rotating with negative x swings forward.

export type Anim = 'idle' | 'walk' | 'run' | 'sit' | 'wave' | 'point' | 'pickup' | 'carry' | 'place' | 'guide' | 'interact' | 'cheer' | 'turn';
export type Gesture = 'wave' | 'point' | 'pickup' | 'place' | 'interact' | 'cheer';

export const CH = [
  'hipsY', 'hipsX', 'hipsZ', 'hipsYaw',
  'spineX', 'spineY', 'spineZ', 'chestX', 'chestY', 'chestZ', 'neckX', 'neckY', 'headX', 'headY', 'headZ',
  'shLX', 'shLY', 'shLZ', 'elLX', 'elLY', 'wrLX', 'wrLZ', 'gripL', 'idxL',
  'shRX', 'shRY', 'shRZ', 'elRX', 'elRY', 'wrRX', 'wrRZ', 'gripR', 'idxR',
  'thLX', 'thLY', 'thLZ', 'knLX', 'anLX', 'thRX', 'thRY', 'thRZ', 'knRX', 'anRX',
  'smile', 'open', 'brow',
] as const;
export type Ch = (typeof CH)[number];
export type Pose = Partial<Record<Ch, number>>;

const S = (x: number) => Math.sin(x);
const C = (x: number) => Math.cos(x);
const pos = (x: number) => Math.max(0, x);
const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Legs keep the foot flat: ankle undoes thigh and knee. */
const flat = (th: number, kn: number, lift = 0) => -(th + kn) + lift;

function idle(t: number): Pose {
  const shift = S(t * 0.45);
  return {
    hipsZ: shift * 0.025,
    hipsX: shift * 0.012,
    thLZ: -shift * 0.025,
    thRZ: -shift * 0.025,
    knLX: 0.04 + pos(shift) * 0.06,
    knRX: 0.04 + pos(-shift) * 0.06,
    anLX: -0.04 - pos(shift) * 0.06,
    anRX: -0.04 - pos(-shift) * 0.06,
    spineX: 0.02,
    chestZ: -shift * 0.02,
    shLZ: 0.09, shRZ: -0.09,
    shLX: 0.03, shRX: 0.03,
    elLX: -0.16, elRX: -0.16,
    shLY: 0.12, shRY: -0.12,
    gripL: 0.3, gripR: 0.3,
    smile: 0.4,
  };
}

function walk(ph: number): Pose {
  const s = S(ph);
  const c = C(ph);
  const thL = -s * 0.42;
  const thR = s * 0.42;
  const knL = 0.08 + Math.pow(pos(c), 1.4) * 0.72;
  const knR = 0.08 + Math.pow(pos(-c), 1.4) * 0.72;
  return {
    hipsY: -0.028 * Math.abs(s),
    hipsYaw: s * 0.09,
    hipsZ: c * 0.03,
    spineX: 0.05,
    chestY: -s * 0.11,
    chestZ: -c * 0.02,
    headY: s * 0.03,
    thLX: thL, thRX: thR,
    knLX: knL, knRX: knR,
    anLX: flat(thL, knL, -pos(-s) * pos(-c) * 0.3),
    anRX: flat(thR, knR, -pos(s) * pos(c) * 0.3),
    shLX: s * 0.38, shRX: -s * 0.38,
    shLZ: 0.1, shRZ: -0.1,
    shLY: 0.1, shRY: -0.1,
    elLX: -0.22 - pos(-s) * 0.3,
    elRX: -0.22 - pos(s) * 0.3,
    gripL: 0.35, gripR: 0.35,
    smile: 0.35,
  };
}

function run(ph: number): Pose {
  const s = S(ph);
  const c = C(ph);
  const thL = -s * 0.7 - 0.12;
  const thR = s * 0.7 - 0.12;
  const knL = 0.25 + pos(c) * 1.25;
  const knR = 0.25 + pos(-c) * 1.25;
  return {
    hipsY: -0.06 + Math.abs(c) * 0.06,
    hipsYaw: s * 0.12,
    spineX: 0.17,
    chestX: 0.04,
    chestY: -s * 0.16,
    headX: -0.12,
    thLX: thL, thRX: thR,
    knLX: knL, knRX: knR,
    anLX: flat(thL, knL, 0.15),
    anRX: flat(thR, knR, 0.15),
    shLX: s * 0.75, shRX: -s * 0.75,
    shLZ: 0.16, shRZ: -0.16,
    elLX: -1.25 - pos(-s) * 0.2,
    elRX: -1.25 - pos(s) * 0.2,
    gripL: 0.8, gripR: 0.8,
    smile: 0.55,
  };
}

function sit(t: number): Pose {
  // Sitting on the ground, knees up, hands resting on the knees.
  const b = S(t * 1.6) * 0.01;
  return {
    hipsY: -0.585,
    hipsX: -0.1,
    spineX: 0.16 + b,
    chestX: 0.05,
    thLX: -1.85, thRX: -1.85,
    thLZ: 0.18, thRZ: -0.18,
    knLX: 2.15, knRX: 2.15,
    anLX: -0.3, anRX: -0.3,
    shLX: -0.8, shRX: -0.8,
    shLZ: 0.08, shRZ: -0.08,
    elLX: -0.55, elRX: -0.55,
    wrLX: 0.2, wrRX: 0.2,
    gripL: 0.3, gripR: 0.3,
    smile: 0.45,
    headX: 0.02,
  };
}

/** Carrying something with both hands in front of the chest. */
const CARRY: Pose = { shLX: -0.62, shRX: -0.62, shLZ: -0.12, shRZ: 0.12, shLY: -0.35, shRY: 0.35, elLX: -1.25, elRX: -1.25, wrLX: 0.2, wrRX: 0.2, gripL: 0.75, gripR: 0.75 };
/** Leading an animal on a rope held low in the left hand. */
const GUIDE: Pose = { shLX: -0.5, shLZ: 0.32, shLY: 0.2, elLX: -0.35, wrLX: 0.1, gripL: 1 };
const CARRY_CH: Ch[] = ['shLX', 'shRX', 'shLZ', 'shRZ', 'shLY', 'shRY', 'elLX', 'elRX', 'wrLX', 'wrRX', 'gripL', 'gripR'];
const GUIDE_CH: Ch[] = ['shLX', 'shLZ', 'shLY', 'elLX', 'wrLX', 'gripL'];

const DUR: Record<Gesture, number> = { wave: 2.2, point: 1.8, pickup: 1.15, place: 1.15, interact: 1.0, cheer: 2.0 };

/** A gesture at time u (seconds since it began); the pose it wants. */
function gesture(g: Gesture, u: number, holding: boolean): Pose {
  if (g === 'wave') {
    return { shRZ: -2.45, shRX: -0.35, shRY: 0.3, elRX: -0.75, wrRZ: S(u * 10) * 0.45, elRY: S(u * 10) * 0.25, gripR: 0, headZ: -0.08, headY: -0.15, smile: 0.95, brow: 0.35 };
  }
  if (g === 'point') {
    return { shRX: -1.45, shRZ: -0.12, shRY: 0.12, elRX: -0.06, wrRX: 0.05, gripR: 0.95, idxR: 1, chestY: -0.15, headY: -0.12, headX: -0.08, brow: 0.25, smile: 0.5 };
  }
  if (g === 'pickup' || g === 'place') {
    // Crouch, reach down with both hands, then come back up.
    const down = ss(0, 0.42, u) * (1 - ss(0.62, 1.05, u));
    const grabbed = g === 'pickup' ? ss(0.4, 0.55, u) : 1 - ss(0.4, 0.55, u);
    return {
      hipsY: -0.22 * down,
      thLX: -0.95 * down, thRX: -0.75 * down,
      knLX: 1.25 * down, knRX: 1.05 * down,
      anLX: -0.3 * down, anRX: -0.3 * down,
      spineX: 0.45 * down,
      chestX: 0.18 * down,
      headX: 0.25 * down,
      shLX: -0.95 * down + (1 - down) * (grabbed > 0.5 ? CARRY.shLX! : 0.03),
      shRX: -0.95 * down + (1 - down) * (grabbed > 0.5 ? CARRY.shRX! : 0.03),
      shLZ: -0.05, shRZ: 0.05,
      elLX: -0.25 * down + (1 - down) * (grabbed > 0.5 ? CARRY.elLX! : -0.16),
      elRX: -0.25 * down + (1 - down) * (grabbed > 0.5 ? CARRY.elRX! : -0.16),
      gripL: 0.2 + grabbed * 0.6, gripR: 0.2 + grabbed * 0.6,
      brow: -0.15,
      smile: 0.3 + (holding ? 0.2 : 0),
    };
  }
  if (g === 'interact') {
    const reach = ss(0, 0.35, u) * (1 - ss(0.65, 1, u));
    return { shRX: -1.2 * reach, shRZ: -0.05, elRX: -0.35 * reach, wrRX: -0.3 * reach, gripR: 0.5 * reach, spineX: 0.12 * reach, chestY: -0.1 * reach, headX: 0.05 };
  }
  // Cheer: both arms up and a little hop.
  const hop = pos(S(u * 7.5));
  return { shLZ: 2.5 + S(u * 15) * 0.12, shRZ: -2.5 - S(u * 15) * 0.12, shLX: -0.3, shRX: -0.3, elLX: -0.3, elRX: -0.3, gripL: 0.8, gripR: 0.8, hipsY: hop * 0.09 - 0.02, knLX: (1 - hop) * 0.35, knRX: (1 - hop) * 0.35, thLX: -(1 - hop) * 0.25, thRX: -(1 - hop) * 0.25, anLX: -0.1, anRX: -0.1, headX: -0.15, smile: 1, open: 1, brow: 0.6 };
}

/** One damped spring (secondary motion of hair, cloth and things that hang). */
export class Spring {
  x = 0;
  v = 0;
  constructor(public k = 60, public d = 8) {}
  step(target: number, dt: number) {
    const a = this.k * (target - this.x) - this.d * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
    return this.x;
  }
}

export type Input = {
  /** Ground speed in m/s and how much of it is running (0..1). */
  speed: number;
  run: number;
  /** Turning speed in rad/s. */
  yawRate: number;
  /** Forward and sideways acceleration in the body's frame (m/s²). */
  accel: [number, number];
  base: 'idle' | 'move' | 'sit';
  holding: boolean;
  leading: boolean;
  reduced: boolean;
};

/**
 * Everything that moves: blend weights for idle, walk, run and sit; the active
 * gesture; blinking, looking around and the face; springs for hair and cloth.
 */
export class Animator {
  w = { idle: 1, walk: 0, run: 0, sit: 0 };
  ph = 0;
  t = 0;
  g: { name: Gesture; at: number; loop: boolean } | null = null;
  gw = 0;
  carry = 0;
  guide = 0;
  blink = 0;
  nextBlink = 2;
  look = { y: 0, x: 0, ty: 0, tx: 0, ey: 0, ex: 0, next: 1.5 };
  lean = 0;
  sway = { x: new Spring(45, 6), z: new Spring(45, 6) };
  skirt = { x: new Spring(70, 9), z: new Spring(70, 9) };
  pack = new Spring(90, 10);
  out: Pose = {};

  play(name: Gesture, loop = false) {
    this.g = { name, at: this.t, loop };
  }

  update(dt: number, inp: Input): Pose {
    this.t += dt;
    const t = this.t;
    const k = Math.min(1, dt * 6);
    const moving = inp.base === 'move' && inp.speed > 0.15;
    const want = {
      idle: inp.base === 'idle' || (inp.base === 'move' && !moving) ? 1 : 0,
      walk: moving ? 1 - inp.run : 0,
      run: moving ? inp.run : 0,
      sit: inp.base === 'sit' ? 1 : 0,
    };
    for (const key of Object.keys(want) as (keyof typeof want)[]) this.w[key] += (want[key] - this.w[key]) * k;
    // Stride: a step length that grows with speed, so feet do not slide.
    const stride = 0.55 + inp.run * 0.45;
    this.ph += moving ? (inp.speed / stride) * Math.PI * dt : 0;

    const poses: [number, Pose][] = [
      [this.w.idle, idle(t)],
      [this.w.walk, walk(this.ph)],
      [this.w.run, run(this.ph)],
      [this.w.sit, sit(t)],
    ];
    const P: Pose = {};
    let tw = 0;
    for (const [w] of poses) tw += w;
    for (const [w, p] of poses) {
      if (w < 0.001) continue;
      for (const c in p) P[c as Ch] = (P[c as Ch] ?? 0) + (p[c as Ch]! * w) / tw;
    }

    // Holding something and leading an animal change only the arms.
    this.carry += ((inp.holding ? 1 : 0) - this.carry) * k;
    this.guide += ((inp.leading && !inp.holding ? 1 : 0) - this.guide) * k;
    const swingKeep = 0.25;
    for (const c of CARRY_CH) P[c] = (P[c] ?? 0) * (1 - this.carry) + (CARRY[c]! + (P[c] ?? 0) * swingKeep * (c.startsWith('sh') && c.endsWith('X') ? 1 : 0)) * this.carry;
    for (const c of GUIDE_CH) P[c] = (P[c] ?? 0) * (1 - this.guide) + GUIDE[c]! * this.guide;

    // A gesture over the top, fading in and out.
    let gp: Pose | null = null;
    if (this.g) {
      const u = t - this.g.at;
      const dur = DUR[this.g.name];
      const loop = this.g.loop;
      const end = !loop && u > dur;
      const target = end ? 0 : 1;
      const fade = this.g.name === 'pickup' || this.g.name === 'place' ? 14 : 7;
      this.gw += (target - this.gw) * Math.min(1, dt * fade);
      gp = gesture(this.g.name, loop ? u % (dur + 0.4) : u, inp.holding);
      if (end && this.gw < 0.02) this.g = null;
    } else this.gw = 0;
    if (gp) {
      // While walking, a gesture keeps the legs walking unless it needs them.
      const legs = this.g?.name === 'pickup' || this.g?.name === 'place' || this.g?.name === 'cheer';
      for (const c in gp) {
        const ch = c as Ch;
        if (!legs && moving && /^(th|kn|an|hips)/.test(ch)) continue;
        const base = /^(th|kn|an|hips)/.test(ch) || ch.startsWith('sh') || ch.startsWith('el') || ch.startsWith('wr') || ch.startsWith('grip') || ch === 'smile' || ch === 'open' || ch === 'brow' || ch === 'idxL' || ch === 'idxR' ? P[ch] ?? 0 : P[ch] ?? 0;
        P[ch] = base * (1 - this.gw) + gp[ch]! * this.gw + (ch.startsWith('head') || ch.startsWith('chest') ? base * this.gw * 0.5 : 0);
      }
    }

    // Breathing: the chest rises and the shoulders follow.
    const br = inp.reduced ? 0 : S(t * (moving ? 3.2 : 1.8));
    P.chestX = (P.chestX ?? 0) - br * 0.018;
    P.shLZ = (P.shLZ ?? 0) + br * 0.012;
    P.shRZ = (P.shRZ ?? 0) - br * 0.012;

    // Looking around: the eyes go first and the head follows.
    const L = this.look;
    L.next -= dt;
    if (L.next <= 0) {
      const calm = moving ? 0.35 : 1;
      L.ty = (Math.random() - 0.5) * 1.1 * calm;
      L.tx = (Math.random() - 0.4) * 0.3 * calm;
      if (Math.random() < 0.35) L.ty = L.tx = 0;
      L.next = 1.4 + Math.random() * 3;
    }
    if (inp.reduced) L.ty = L.tx = 0;
    // Look into a turn.
    this.lean += (Math.max(-2, Math.min(2, inp.yawRate)) - this.lean) * Math.min(1, dt * 5);
    const ty = L.ty * (this.gw > 0.5 ? 0.2 : 1) + this.lean * 0.16;
    const eyeSpeed = Math.min(1, dt * 18);
    L.ey += (Math.max(-0.4, Math.min(0.4, (ty - L.y) * 1.6)) - L.ey) * eyeSpeed;
    L.ex += (Math.max(-0.25, Math.min(0.25, (L.tx - L.x) * 1.6)) - L.ex) * eyeSpeed;
    L.y += (ty - L.y) * Math.min(1, dt * 2.6);
    L.x += (L.tx - L.x) * Math.min(1, dt * 2.6);
    P.headY = (P.headY ?? 0) + L.y * 0.7;
    P.neckY = (P.neckY ?? 0) + L.y * 0.3;
    P.headX = (P.headX ?? 0) + L.x;
    // Lean into turns.
    P.chestZ = (P.chestZ ?? 0) - this.lean * 0.05 * (moving ? 1 : 0.3);
    P.hipsZ = (P.hipsZ ?? 0) - this.lean * 0.03 * (moving ? 1 : 0);

    // Blinking, now and then (sometimes twice).
    this.nextBlink -= dt;
    if (this.nextBlink <= 0) {
      this.blink = 0.0001;
      this.nextBlink = Math.random() < 0.2 ? 0.28 : 2 + Math.random() * 4;
    }
    if (this.blink > 0) {
      this.blink += dt;
      if (this.blink > 0.16) this.blink = 0;
    }

    // Springs: hair and cloth trail behind acceleration and turns, and bob with steps.
    const [af, as] = inp.accel;
    const stepBob = moving ? C(this.ph * 2) * (0.04 + inp.run * 0.06) : 0;
    this.sway.x.step(Math.max(-0.5, Math.min(0.5, af * 0.06 + inp.speed * 0.06 + stepBob)), dt);
    this.sway.z.step(Math.max(-0.4, Math.min(0.4, -as * 0.05 + this.lean * 0.08)), dt);
    this.skirt.x.step(Math.max(-0.3, Math.min(0.3, af * 0.03 + inp.speed * 0.03)), dt);
    this.skirt.z.step(Math.max(-0.2, Math.min(0.2, -as * 0.03 + this.lean * 0.03)), dt);
    this.pack.step(stepBob * 0.6, dt);

    this.out = P;
    return P;
  }

  /** Eyelid closure 0..1 right now. */
  lid() {
    if (this.blink <= 0) return 0;
    return Math.sin((this.blink / 0.16) * Math.PI);
  }
}
