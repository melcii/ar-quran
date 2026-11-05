// Collision for the walkable worlds, on the Rapier physics engine.
//
// The worlds are landscapes: a height field you walk on, plus solid things
// standing on it (trunks, rocks, walls, houses, the ark's hull, water you may
// not wade into). So the controller works in two parts:
//
//  - Across the ground (x, z): Rapier's kinematic character controller sweeps
//    the walker's capsule against every solid collider and slides along it.
//    Solids are simple shapes: cylinders for trunks, rocks, posts and pillars;
//    boxes for walls, houses and hull planks; merged boxes for water and the
//    world's edge. The sweep is split into short sub-steps, so a slow frame
//    cannot carry anyone through a thin wall.
//  - Up and down (y): the height of the ground or floor under the walker comes
//    from the same function that shapes the visible land, so feet stay on it
//    exactly. A step up higher than MAX_STEP, or a slope steeper than
//    MAX_SLOPE, is not walkable; the walker slides along the contour instead.
//    Dropping off an edge falls under gravity and lands.
//
// Every walker (the explorer, each animal) is a capsule collider of its own,
// so animals also bump into one another instead of passing through.
import RAPIER from '@dimforge/rapier3d-compat';

export type R = typeof RAPIER;
let loading: Promise<R> | null = null;
let loaded: R | null = null;
/** Load the physics engine once (WebAssembly). */
export function loadPhysics(): Promise<R> {
  return (loading ??= RAPIER.init().then(() => (loaded = RAPIER)));
}
export const physicsReady = () => loaded;

export const MAX_STEP = 0.45;
/** Steepest walkable slope (rise over run): about 38 degrees. */
export const MAX_SLOPE = 0.78;
export const GRAVITY = 18;
const SUB = 0.12;

export type Solid =
  | { kind: 'circle'; x: number; z: number; r: number; tag: string; active?: () => boolean }
  /** rot as in three.js rotation-y: the box's local x runs along (cos rot, -sin rot). */
  | { kind: 'box'; x: number; z: number; hx: number; hz: number; rot?: number; tag: string; active?: () => boolean };

export type SpaceSpec = {
  solids: Solid[];
  /** Height of the walkable surface (ground, bridge, ramp or deck) at a point. */
  floor: (x: number, z: number) => number;
  /** Areas nobody may walk into, as a grid test: 0 open, 1 always blocked (deep water, beyond the edge), 2 blocked unless openNow (water a bridge may cover). */
  blocked?: (x: number, z: number) => 0 | 1 | 2;
  /** Whether a type-2 cell is open right now. */
  openNow?: (x: number, z: number) => boolean;
  /** Half-size of the square area to scan for blocked cells. */
  extent: number;
  cell?: number;
};

const G_STATIC = 0x0001;
const G_ANIMAL = 0x0002;
const G_PLAYER = 0x0004;
const groups = (member: number, filter: number) => (member << 16) | filter;

export type Walker = {
  collider: RAPIER.Collider;
  r: number;
  /** Feet position. */
  x: number;
  y: number;
  z: number;
  vy: number;
  grounded: boolean;
  /** Last place it stood firmly, for recovery. */
  safe: { x: number; y: number; z: number; at: number };
  kind: 'player' | 'animal';
};

export class Space {
  R: R;
  world: RAPIER.World;
  kcc: RAPIER.KinematicCharacterController;
  spec: SpaceSpec;
  toggles: { c: RAPIER.Collider; on: () => boolean }[] = [];
  solids: Solid[];
  cells: { x: number; z: number; hx: number; hz: number }[] = [];
  walkers: Walker[] = [];
  /** Water and edge boxes: they stop feet, not the camera. */
  ground = new Set<number>();

  constructor(R: R, spec: SpaceSpec) {
    this.R = R;
    this.spec = spec;
    this.solids = spec.solids;
    this.world = new R.World({ x: 0, y: 0, z: 0 });
    this.kcc = this.world.createCharacterController(0.02);
    this.kcc.setSlideEnabled(true);
    this.kcc.setApplyImpulsesToDynamicBodies(false);
    // Up is +y; everything collides in a slab around y = 0 (heights are handled separately).
    this.kcc.setUp({ x: 0, y: 1, z: 0 });
    for (const s of spec.solids) this.addSolid(s);
    this.addBlocked();
    this.world.step();
  }

  private addSolid(s: Solid) {
    const R = this.R;
    const d =
      s.kind === 'circle'
        ? R.ColliderDesc.cylinder(4, Math.max(0.05, s.r)).setTranslation(s.x, 0, s.z)
        : R.ColliderDesc.cuboid(Math.max(0.03, s.hx), 4, Math.max(0.03, s.hz))
            .setTranslation(s.x, 0, s.z)
            .setRotation(quatY(s.rot ?? 0));
    d.setCollisionGroups(groups(G_STATIC, G_ANIMAL | G_PLAYER));
    const c = this.world.createCollider(d);
    if (s.active) this.toggles.push({ c, on: s.active });
  }

  /** Scan the grid for blocked cells and merge each row's runs into boxes. */
  private addBlocked() {
    const { blocked, extent } = this.spec;
    if (!blocked) return;
    const cell = this.spec.cell ?? 0.8;
    const n = Math.ceil((extent * 2) / cell);
    const mk = (x: number, z: number, hx: number, hz: number) => {
      const c = this.world.createCollider(this.R.ColliderDesc.cuboid(hx, 4, hz).setTranslation(x, 0, z).setCollisionGroups(groups(G_STATIC, G_ANIMAL | G_PLAYER)));
      this.ground.add(c.handle);
      return c;
    };
    for (let j = 0; j < n; j++) {
      const z = -extent + (j + 0.5) * cell;
      let start = -1;
      for (let i = 0; i <= n; i++) {
        const x = -extent + (i + 0.5) * cell;
        const b = i < n ? blocked(x, z) : 0;
        if (b === 2) {
          // May open later (a bridge appearing over water): its own switched box.
          const c = mk(x, z, cell / 2, cell / 2);
          this.toggles.push({ c, on: () => !this.spec.openNow?.(x, z) });
          this.cells.push({ x, z, hx: cell / 2, hz: cell / 2 });
        }
        if (b === 1 && start < 0) start = i;
        if (b !== 1 && start >= 0) {
          const x0 = -extent + start * cell;
          const x1 = -extent + i * cell;
          mk((x0 + x1) / 2, z, (x1 - x0) / 2, cell / 2);
          this.cells.push({ x: (x0 + x1) / 2, z, hx: (x1 - x0) / 2, hz: cell / 2 });
          start = -1;
        }
      }
    }
  }

  /** Switch colliders that come and go (gates, a bridge over the water). */
  sync() {
    for (const t of this.toggles) {
      const on = t.on();
      if (t.c.isEnabled() !== on) t.c.setEnabled(on);
    }
    this.world.step();
  }

  addWalker(kind: 'player' | 'animal', r: number, x: number, z: number): Walker {
    const d = this.R.ColliderDesc.capsule(0.5, r)
      .setTranslation(x, 0, z)
      .setCollisionGroups(kind === 'player' ? groups(G_PLAYER, G_STATIC) : groups(G_ANIMAL, G_STATIC | G_ANIMAL));
    const c = this.world.createCollider(d);
    const y = this.spec.floor(x, z);
    const w: Walker = { collider: c, r, x, y, z, vy: 0, grounded: true, safe: { x, y, z, at: 0 }, kind };
    this.walkers.push(w);
    return w;
  }

  removeWalker(w: Walker) {
    this.world.removeCollider(w.collider, false);
    this.walkers = this.walkers.filter((x) => x !== w);
  }

  /** Put a walker somewhere directly (spawn, recovery, scripted moves). */
  place(w: Walker, x: number, z: number, y?: number) {
    w.x = x;
    w.z = z;
    w.y = y ?? this.spec.floor(x, z);
    w.vy = 0;
    w.grounded = true;
    w.collider.setTranslation({ x, y: 0, z });
  }

  /** Is there any solid at this spot for a walker of radius r? */
  blockedAt(x: number, z: number, r: number, exclude?: RAPIER.Collider, filter = groups(G_PLAYER, G_STATIC)) {
    let hit = false;
    this.world.intersectionsWithShape(
      { x, y: 0, z },
      { x: 0, y: 0, z: 0, w: 1 },
      new this.R.Capsule(0.5, r),
      () => {
        hit = true;
        return false;
      },
      undefined,
      filter,
      exclude,
    );
    return hit;
  }

  /** The largest radius (up to r) free of solids at a point. */
  clearance(x: number, z: number, r: number, exclude?: RAPIER.Collider, filter?: number) {
    let lo = 0;
    let hi = r;
    for (let i = 0; i < 7; i++) {
      const m = (lo + hi) / 2;
      if (this.blockedAt(x, z, m, exclude, filter)) hi = m;
      else lo = m;
    }
    return lo;
  }

  /** A walkable spot as close as possible to (x, z): open, and not on a cliff. */
  findOpen(x: number, z: number, r: number, maxR = 30): [number, number] | null {
    if (this.okSpot(x, z, r)) return [x, z];
    for (let d = 0.5; d <= maxR; d += 0.5)
      for (let a = 0; a < Math.PI * 2; a += 0.5 / Math.max(1, d)) {
        const px = x + Math.cos(a) * d;
        const pz = z + Math.sin(a) * d;
        if (this.okSpot(px, pz, r)) return [px, pz];
      }
    return null;
  }

  /** Free of solids and not on ground too steep to stand on. */
  okSpot(x: number, z: number, r: number) {
    if (this.blockedAt(x, z, r)) return false;
    const f = this.spec.floor;
    const h = f(x, z);
    const e = 0.4;
    return Math.abs(f(x + e, z) - h) / e < MAX_SLOPE * 1.2 && Math.abs(f(x, z + e) - h) / e < MAX_SLOPE * 1.2;
  }

  /**
   * Move a walker by (dx, dz) this tick: swept against solids, then kept to
   * walkable heights. Returns how far it really went.
   */
  move(w: Walker, dx: number, dz: number, dt: number, opts: { maxStep?: number; floor?: (x: number, z: number) => number; ghost?: boolean } = {}) {
    const floor = opts.floor ?? this.spec.floor;
    const maxStep = opts.maxStep ?? MAX_STEP;
    const len = Math.hypot(dx, dz);
    const n = Math.max(1, Math.ceil(len / SUB));
    const x0 = w.x;
    const z0 = w.z;
    for (let i = 0; i < n; i++) {
      let sx = dx / n;
      let sz = dz / n;
      // Heights: refuse cliffs and high steps (the walker slides along the contour instead).
      const here = w.grounded ? w.y : floor(w.x, w.z);
      const ok = (ax: number, az: number) => {
        const l = Math.hypot(ax, az);
        if (l < 1e-5) return true;
        const h = floor(w.x + ax, w.z + az);
        const rise = h - here;
        if (rise > maxStep) return false;
        // Gradient over a fixed span, so tiny steps cannot add up to a cliff.
        const span = 0.5;
        const ux = ax / l;
        const uz = az / l;
        const g = (floor(w.x + ux * span, w.z + uz * span) - floor(w.x, w.z)) / span;
        return g <= MAX_SLOPE || rise <= 0.02;
      };
      let solid = (_ax: number, _az: number) => false;
      if (!opts.ghost) {
        const filter = w.kind === 'player' ? groups(G_PLAYER, G_STATIC) : groups(G_ANIMAL, G_STATIC | G_ANIMAL);
        this.kcc.computeColliderMovement(w.collider, { x: sx, y: 0, z: sz }, undefined, filter, (c) => c !== w.collider);
        const m = this.kcc.computedMovement();
        sx = m.x;
        sz = m.z;
        // The character controller can let a capsule resting against a wall
        // (or where two walls meet) slip in by a step, so every move is checked
        // again here: it may not end overlapping a solid it was clear of.
        const rr = w.r * 0.97;
        if (this.blockedAt(w.x, w.z, rr, w.collider, filter)) {
          // Already closer than it should be (another animal walked into it, or
          // the story put it there): only moves that do not go deeper, easing out.
          const c0 = this.clearance(w.x, w.z, rr, w.collider, filter);
          solid = (ax, az) => this.clearance(w.x + ax, w.z + az, rr, w.collider, filter) < c0;
          if (solid(sx, sz) || !ok(sx, sz)) {
            let best = c0;
            sx = sz = 0;
            for (let k = 0; k < 8; k++) {
              const ex = Math.cos((k * Math.PI) / 4) * 0.02;
              const ez = Math.sin((k * Math.PI) / 4) * 0.02;
              const c = this.clearance(w.x + ex, w.z + ez, rr, w.collider, filter);
              if (c > best && ok(ex, ez)) (best = c), (sx = ex), (sz = ez);
            }
          }
        } else solid = (ax, az) => this.blockedAt(w.x + ax, w.z + az, rr, w.collider, filter);
      }
      // Take the move if it is clear and walkable, else slide along one axis, else stay.
      const free = (ax: number, az: number) => (!ax && !az) || (!solid(ax, az) && ok(ax, az));
      if (!free(sx, sz)) {
        if (free(sx, 0)) sz = 0;
        else if (free(0, sz)) sx = 0;
        else (sx = 0), (sz = 0);
      }
      w.x += sx;
      w.z += sz;
      w.collider.setTranslation({ x: w.x, y: 0, z: w.z });
    }
    // Gravity: follow the ground down a gentle drop; fall from an edge and land.
    const g = floor(w.x, w.z);
    if (w.y > g + maxStep && !w.grounded) {
      w.vy -= GRAVITY * dt;
      w.y = Math.max(g, w.y + w.vy * dt);
      if (w.y <= g + 0.001) (w.grounded = true), (w.vy = 0);
    } else if (w.y > g + maxStep) {
      w.grounded = false;
      w.vy = 0;
    } else {
      w.y = g;
      w.vy = 0;
      w.grounded = true;
    }
    return Math.hypot(w.x - x0, w.z - z0);
  }

  /** Remember where a walker last stood firmly in the open. */
  noteSafe(w: Walker, now: number) {
    if (w.grounded && now - w.safe.at > 0.5 && !this.blockedAt(w.x, w.z, w.r * 0.9, w.collider)) w.safe = { x: w.x, y: w.y, z: w.z, at: now };
  }

  /** Something is wrong (inside a solid, under the ground, NaN): back to the last safe spot. */
  checkAndRecover(w: Walker) {
    const bad = !Number.isFinite(w.x + w.y + w.z) || w.y < this.spec.floor(w.x, w.z) - 0.6 || this.blockedAt(w.x, w.z, w.r * 0.8, w.collider);
    if (bad) this.place(w, w.safe.x, w.safe.z);
    return bad;
  }

  /**
   * Camera: from the point it looks at toward where it wants to be; returns
   * the distance it may go before a solid or the ground gets in the way.
   */
  cameraReach(lx: number, ly: number, lz: number, dx: number, dy: number, dz: number, maxD: number) {
    let d = maxD;
    // Every solid along the way; the camera passes over a low one (a rock, a
    // fence) but not a wall, trunk or house it would otherwise sit inside.
    // Ray points are origin + dir * toi, so toi is in the same units as d.
    this.world.intersectionsWithRay(
      new this.R.Ray({ x: lx, y: 0, z: lz }, { x: dx, y: 0, z: dz }),
      maxD,
      true,
      (h) => {
        if (this.ground.has(h.collider.handle)) return true;
        const s = h.timeOfImpact;
        const x = lx + dx * s;
        const z = lz + dz * s;
        if (ly + dy * s < this.spec.floor(x, z) + 2.6) d = Math.min(d, s);
        return true;
      },
      undefined,
      groups(G_PLAYER, G_STATIC),
    );
    // The ground itself (hills between the camera and the explorer).
    for (let s = 0.6; s < d; s += 0.4) {
      const x = lx + dx * s;
      const z = lz + dz * s;
      if (ly + dy * s < this.spec.floor(x, z) + 0.35) {
        d = s;
        break;
      }
    }
    return d;
  }

  /**
   * Where the follow camera may sit: if something tall is in the way, first
   * tilt up to look over it, then pull in. Returns the pitch and distance to use.
   */
  cameraFit(lx: number, ly: number, lz: number, yaw: number, pitch: number, dist: number, minDist = 0.9) {
    const at = (p: number) => this.cameraReach(lx, ly, lz, Math.sin(yaw) * Math.cos(p), Math.sin(p), Math.cos(yaw) * Math.cos(p), dist);
    const need = Math.min(dist, 3.2);
    let reach = at(pitch);
    let best = pitch;
    if (reach < need)
      for (let p = pitch + 0.15; p <= 1.3; p += 0.15) {
        const r = at(p);
        if (r > reach) (reach = r), (best = p);
        if (r >= need) break;
      }
    return { pitch: best, dist: reach < dist ? Math.max(minDist, reach - 0.4) : dist };
  }

  /** Screens using this space; freed when none are left. */
  holds = 0;
  freed = false;
  dispose() {
    if (this.freed) return;
    this.freed = true;
    this.world.free();
  }
}

function quatY(a: number) {
  return { x: 0, y: Math.sin(a / 2), z: 0, w: Math.cos(a / 2) };
}

