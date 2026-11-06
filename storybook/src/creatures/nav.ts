// Finding a way round things: a small grid A* over any world that can answer
// "can a walker step from here to there?". Used by animals (wander, follow,
// go home) and by the explorer (tap-to-go, "show me the way"). Each search is
// fresh, so gates that open or close are always respected.
import * as THREE from 'three';

export type StepFn = (ax: number, az: number, bx: number, bz: number, r: number) => boolean;

export type Nav = {
  /** A walkable route from a to b (smoothed), or null when there is none within the search budget. */
  route: (a: THREE.Vector3, b: THREE.Vector3, opts?: { r?: number; budget?: number; near?: number }) => THREE.Vector3[] | null;
  /** Can a walker go straight from a to b? */
  clearLine: (ax: number, az: number, bx: number, bz: number, r?: number) => boolean;
  /** How many searches have run (for tests and budgets). */
  searches: number;
};

const DIRS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/** A tiny binary heap of node keys ordered by f. */
class Heap {
  k: number[] = [];
  f: number[] = [];
  push(key: number, f: number) {
    const { k, f: F } = this;
    k.push(key);
    F.push(f);
    let i = k.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (F[p] <= F[i]) break;
      [k[p], k[i]] = [k[i], k[p]];
      [F[p], F[i]] = [F[i], F[p]];
      i = p;
    }
  }
  pop() {
    const { k, f: F } = this;
    const top = k[0];
    const lk = k.pop()!;
    const lf = F.pop()!;
    if (k.length) {
      k[0] = lk;
      F[0] = lf;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < k.length && F[l] < F[m]) m = l;
        if (r < k.length && F[r] < F[m]) m = r;
        if (m === i) break;
        [k[m], k[i]] = [k[i], k[m]];
        [F[m], F[i]] = [F[i], F[m]];
        i = m;
      }
    }
    return top;
  }
  get size() {
    return this.k.length;
  }
}

export function makeNav(step: StepFn, opts: { radius: number; cell?: number; y?: (x: number, z: number) => number }): Nav {
  const cell = opts.cell ?? 1.4;
  const half = Math.ceil(opts.radius / cell) + 1;
  const W = half * 2 + 1;
  const key = (i: number, j: number) => (i + half) * W + (j + half);
  const ij = (k: number): [number, number] => [Math.floor(k / W) - half, (k % W) - half];
  const px = (i: number) => i * cell;

  /** Walk a straight segment in small steps, the same way a walker would. */
  const clearLine = (ax: number, az: number, bx: number, bz: number, r = 0.35) => {
    const d = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(d / 0.45));
    let x = ax;
    let z = az;
    for (let s = 1; s <= n; s++) {
      const nx = ax + ((bx - ax) * s) / n;
      const nz = az + ((bz - az) * s) / n;
      if (!step(x, z, nx, nz, r)) return false;
      x = nx;
      z = nz;
    }
    return true;
  };

  const nav: Nav = {
    searches: 0,
    clearLine,
    route(a, b, o = {}) {
      const r = o.r ?? 0.35;
      const budget = o.budget ?? 2500;
      const near = o.near ?? 0;
      nav.searches++;
      const y = (x: number, z: number) => (opts.y ? opts.y(x, z) : 0);
      if (clearLine(a.x, a.z, b.x, b.z, r)) return [new THREE.Vector3(b.x, y(b.x, b.z), b.z)];
      const si = Math.round(a.x / cell);
      const sj = Math.round(a.z / cell);
      const gi = Math.round(b.x / cell);
      const gj = Math.round(b.z / cell);
      const start = key(si, sj);
      const g = new Map<number, number>([[start, 0]]);
      const from = new Map<number, number>();
      const closed = new Set<number>();
      const open = new Heap();
      const h = (i: number, j: number) => {
        const dx = Math.abs(i - gi);
        const dz = Math.abs(j - gj);
        return (Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz)) * cell;
      };
      open.push(start, h(si, sj));
      let best = start;
      let bestH = h(si, sj);
      let found = -1;
      let spent = 0;
      while (open.size && spent < budget) {
        const cur = open.pop();
        if (closed.has(cur)) continue;
        closed.add(cur);
        spent++;
        const [ci, cj] = ij(cur);
        const hh = h(ci, cj);
        if (hh < bestH) {
          bestH = hh;
          best = cur;
        }
        // The start cell centre may not be reachable from the walker's exact spot; use the real position there.
        const cx = cur === start ? a.x : px(ci);
        const cz = cur === start ? a.z : px(cj);
        if (hh <= Math.max(near, cell * 0.75) && clearLine(cx, cz, b.x, b.z, r)) {
          found = cur;
          break;
        }
        for (const [di, dj, c] of DIRS) {
          const ni = ci + di;
          const nj = cj + dj;
          if (Math.abs(ni) > half || Math.abs(nj) > half) continue;
          const nk = key(ni, nj);
          if (closed.has(nk)) continue;
          const ng = g.get(cur)! + c * cell;
          if (ng >= (g.get(nk) ?? Infinity)) continue;
          if (!clearLine(cx, cz, px(ni), px(nj), r)) continue;
          g.set(nk, ng);
          from.set(nk, cur);
          open.push(nk, ng + h(ni, nj) * 1.05);
        }
      }
      // When the goal itself cannot be reached, go as close as we can if that is close enough.
      if (found < 0) {
        if (near > 0 && bestH <= near) found = best;
        else return null;
      }
      const cells: [number, number][] = [];
      for (let k: number | undefined = found; k != null && k !== start; k = from.get(k)) {
        const [i, j] = ij(k);
        cells.push([px(i), px(j)]);
      }
      cells.reverse();
      const reachedGoal = bestH <= cell * 0.75 || found !== best || clearLine(cells.length ? cells[cells.length - 1][0] : a.x, cells.length ? cells[cells.length - 1][1] : a.z, b.x, b.z, r);
      const pts: [number, number][] = [[a.x, a.z], ...cells];
      if (reachedGoal) pts.push([b.x, b.z]);
      // Pull the string: skip corners whenever a straight walk is clear.
      const out: THREE.Vector3[] = [];
      let i = 0;
      while (i < pts.length - 1) {
        let j = pts.length - 1;
        while (j > i + 1 && !clearLine(pts[i][0], pts[i][1], pts[j][0], pts[j][1], r)) j--;
        out.push(new THREE.Vector3(pts[j][0], y(pts[j][0], pts[j][1]), pts[j][1]));
        i = j;
      }
      return out;
    },
  };
  return nav;
}
