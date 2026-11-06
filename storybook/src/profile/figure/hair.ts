// Hairstyles built from locks: a shaped hair cap over the scalp, then layered
// strands that start at the crown or the parting and lie along the head, so
// the hair has depth from every side. Hanging parts (long hair, ponytail,
// braids) are kept apart so they can sway.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Hair } from '../look';
import { strand } from './geo';

const V = THREE.Vector3;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The sculpted head surface, sampled by direction: a is the angle around the
 * head (0 at the face, + toward the explorer's left), th the angle down from
 * the top (0 at the crown). Reads the head sphere's own grid.
 */
export class Surf {
  constructor(private g: THREE.BufferGeometry, private W = 72, private H = 56) {}
  at(a: number, th: number, out = 0): THREE.Vector3 {
    const W = this.W;
    const H = this.H;
    let phi = Math.PI / 2 + a;
    phi = ((phi % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const fx = (phi / (Math.PI * 2)) * W;
    const fy = Math.max(0, Math.min(H - 0.001, (th / Math.PI) * H));
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const p = this.g.attributes.position;
    const get = (ix: number, iy: number) => new V().fromBufferAttribute(p, iy * (W + 1) + Math.min(W, ix));
    const v = get(x0, y0).multiplyScalar((1 - tx) * (1 - ty)).add(get(x0 + 1, y0).multiplyScalar(tx * (1 - ty))).add(get(x0, y0 + 1).multiplyScalar((1 - tx) * ty)).add(get(x0 + 1, y0 + 1).multiplyScalar(tx * ty));
    if (out) v.add(v.clone().normalize().multiplyScalar(out));
    return v;
  }
  normal(a: number, th: number) {
    return this.at(a, th).normalize();
  }
}

/** Where the hair meets the skin, by angle around the head. */
export function hairline(a: number) {
  const A = Math.min(Math.PI, Math.abs(a));
  const T: [number, number][] = [[0, 0.9], [0.6, 1.06], [1.05, 1.32], [1.45, 1.38], [1.75, 1.55], [2.3, 1.78], [Math.PI, 1.95]];
  for (let i = 1; i < T.length; i++) if (A <= T[i][0]) return lerp(T[i - 1][1], T[i][1], (A - T[i - 1][0]) / (T[i][0] - T[i - 1][0]));
  return T[T.length - 1][1];
}

/** The hair cap: the head surface lifted over the scalp and tucked away below the hairline. */
function cap(head: THREE.BufferGeometry, thick: number, lineShift = 0, hat = false) {
  const g = head.clone();
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  const v = new V();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const l = v.length();
    const a = Math.atan2(v.x, v.z);
    const th = Math.acos(Math.max(-1, Math.min(1, v.y / l)));
    const line = hairline(a) + lineShift;
    const w = 1 - ss(line - 0.07, line + 0.03, th);
    const top = hat ? Math.min(1, thick) : thick;
    // Hair is fuller on the crown, thinner toward the hairline.
    const k = 1 + top * w * (0.55 + 0.45 * (1 - th / Math.PI)) - 0.05 * (1 - w);
    p.setXYZ(i, v.x * k, v.y * k, v.z * k);
    uv.setXY(i, th * 1.5, (a / Math.PI + 1) * 4);
  }
  g.computeVertexNormals();
  return g;
}

type Built = { cap: THREE.BufferGeometry; locks: THREE.BufferGeometry | null; sway: { geo: THREE.BufferGeometry; pivot: THREE.Vector3 }[]; ties: { at: THREE.Vector3; r: number }[]; coil: THREE.BufferGeometry | null };

/** A lock that lies on the head from (a0, th0) to (a1, th1), lifted by out0..out1. */
function lie(S: Surf, a0: number, th0: number, a1: number, th1: number, out0: number, out1: number, n = 7) {
  const pts: THREE.Vector3[] = [];
  let da = a1 - a0;
  if (da > Math.PI) da -= Math.PI * 2;
  if (da < -Math.PI) da += Math.PI * 2;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // Lift most in the middle of the lock: it arcs over the scalp.
    const lift = Math.sin(t * Math.PI) * 0.004;
    pts.push(S.at(a0 + da * t, lerp(th0, th1, t), lerp(out0, out1, t) * 0.62 + lift));
  }
  return pts;
}

/** A lock through several waypoints on the head (so it can go over the crown, not across the face). */
function path(S: Surf, way: [number, number, number][], n = 5) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < way.length - 1; i++) {
    const seg = lie(S, way[i][0], way[i][1], way[i + 1][0], way[i + 1][1], way[i][2], way[i + 1][2], n);
    pts.push(...(i ? seg.slice(1) : seg));
  }
  return pts;
}

function lock(pts: THREE.Vector3[], w: number, tip = 0.22, flat = 0.3) {
  const mid = pts[Math.floor(pts.length / 2)].clone().normalize();
  return strand(pts, w, w * tip, { flat, up: mid, sides: 7, ease: 1.4 });
}

/** Hanging hair: from a point on the head, falling to `drop` below the head centre, curling in at the tip. */
function fall(from: THREE.Vector3, drop: number, outward: number, curl: number) {
  const d = from.clone().setY(0).normalize();
  const pts = [from.clone()];
  const n = 5;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const y = lerp(from.y, drop, t);
    const o = outward * Math.sin(t * Math.PI * 0.8) - curl * t * t;
    pts.push(new V(from.x + d.x * o, y, from.z + d.z * o));
  }
  return pts;
}

export function buildHair(style: Hair, head: THREE.BufferGeometry, S: Surf, hat: boolean): Built {
  const locks: THREE.BufferGeometry[] = [];
  const sway: Built['sway'] = [];
  const ties: Built['ties'] = [];
  let coil: THREE.BufferGeometry | null = null;
  const hangs: THREE.BufferGeometry[] = [];
  const thick = { short: 0.11, curly: 0.16, long: 0.1, bun: 0.08, braids: 0.08, shaved: 0.02, ponytail: 0.08, bob: 0.11 }[style];
  const theCap = cap(head, hat ? Math.min(thick, 0.035) : thick, style === 'shaved' ? -0.04 : 0, hat);

  const ring = (n: number, f: (a: number, i: number) => void) => {
    for (let i = 0; i < n; i++) f(-Math.PI + ((i + 0.5) / n) * Math.PI * 2, i);
  };
  const keep = (thRoot: number) => !hat || thRoot > 1.05;

  if (style === 'short') {
    ring(26, (a, i) => {
      const end = hairline(a) + (Math.abs(a) < 0.8 ? 0.06 : -0.02);
      if (keep(0.2)) locks.push(lock(lie(S, a * 0.2 + Math.PI * 0.9, 0.18, a + 0.22, end, 0.03, 0.012), 0.05));
      if (keep(0.4) && i % 2 === 0) locks.push(lock(lie(S, a + 0.1, 0.45, a + 0.32, end - 0.18, 0.05, 0.03), 0.045));
    });
    if (!hat) for (let k = 0; k < 6; k++) {
      const a = -0.6 + k * 0.24;
      locks.push(lock(lie(S, a - 0.1, 0.45, a + 0.3, 1.0, 0.05, 0.012), 0.055, 0.15));
    }
    if (hat) ring(18, (a) => locks.push(lock(lie(S, a, 1.1, a + 0.1, hairline(a) + 0.02, 0.022, 0.012, 4), 0.04)));
  }

  if (style === 'bob' || style === 'long') {
    const part = 0.35;
    const drop = style === 'bob' ? -0.13 : -0.52;
    ring(40, (a, i) => {
      const A = Math.abs(a);
      const face = A < 0.85;
      const root: [number, number] = [part + (a - part) * 0.15, 0.14 + Math.abs(Math.sin(a)) * 0.05];
      if (face) {
        // Fringe swept away from the parting.
        if (!hat) locks.push(lock(lie(S, root[0], root[1] + 0.25, a - 0.35, 1.02, 0.05, 0.025), 0.055, 0.2));
        if (A > 0.55) {
          const p = S.at(a, hairline(a) + 0.05, 0.02);
          hangs.push(lock(fall(p, style === 'bob' ? -0.1 : -0.3, 0.008, 0.02), 0.05, 0.3, 0.4));
        }
        return;
      }
      const end = hairline(a) + 0.06;
      if (keep(root[1])) locks.push(lock(lie(S, root[0], root[1], a, end, 0.035, 0.03), 0.06));
      if (i % 2 && keep(0.5)) locks.push(lock(lie(S, a - 0.05, 0.5, a + 0.05, end, 0.05, 0.035), 0.055));
      const p = S.at(a, end, 0.03);
      const back = A > 2.2;
      hangs.push(lock(fall(p, back ? drop : drop * (style === 'bob' ? 1 : 0.85), style === 'bob' ? 0.014 : 0.02, style === 'bob' ? 0.035 : 0.02), 0.07, 0.3, 0.38));
    });
    if (hat) ring(16, (a) => locks.push(lock(lie(S, a, 1.08, a, hairline(a) + 0.05, 0.03, 0.03, 4), 0.05)));
    sway.push({ geo: mergeGeometries(hangs), pivot: new V(0, 0.02, -0.05) });
    hangs.length = 0;
  }

  if (style === 'ponytail' || style === 'bun') {
    const tieTh = style === 'bun' ? 0.62 : 1.2;
    const tie = S.at(Math.PI, tieTh, 0.05);
    ring(28, (a) => {
      const from = hairline(a) - 0.02;
      if (!keep(from)) return;
      const end: [number, number, number] = [Math.PI + (a > 0 ? -0.08 : 0.08), tieTh + 0.04, 0.045];
      const A = Math.abs(a);
      const way: [number, number, number][] = A < 1.7 ? [[a, from, 0.02], [a * 0.55 + Math.sign(a || 1) * 0.2, Math.min(from, 0.55), 0.035], [Math.sign(a || 1) * 2.6, (0.4 + tieTh) / 2, 0.04], end] : [[a, from, 0.02], end];
      locks.push(lock(path(S, way, 5), 0.055, 0.4));
    });
    ties.push({ at: tie, r: 0.04 });
    if (style === 'ponytail') {
      const d = tie.clone().normalize();
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        const o = new V(Math.cos(a) * 0.022, Math.sin(a) * 0.022, 0);
        const pts = [
          tie.clone().add(o),
          tie.clone().add(d.clone().multiplyScalar(0.05)).add(new V(0, -0.04, 0)).add(o),
          tie.clone().add(d.clone().multiplyScalar(0.08)).add(new V(0, -0.16, 0)).add(o.clone().multiplyScalar(1.4)),
          tie.clone().add(d.clone().multiplyScalar(0.05)).add(new V(0, -0.3, 0)).add(o.clone().multiplyScalar(0.8)),
          tie.clone().add(d.clone().multiplyScalar(0.04)).add(new V(0, -0.37, 0.01)).add(o.clone().multiplyScalar(0.3)),
        ];
        hangs.push(strand(pts, 0.03, 0.006, { flat: 0.6, sides: 7, ease: 1.6 }));
      }
      sway.push({ geo: mergeGeometries(hangs), pivot: tie.clone() });
      hangs.length = 0;
    } else {
      // A coiled bun.
      const c = S.at(Math.PI, tieTh - 0.05, 0.075);
      const n = c.clone().normalize();
      const t1 = new V(0, 1, 0).cross(n).normalize();
      const t2 = n.clone().cross(t1).normalize();
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 40; i++) {
        const u = (i / 40) * Math.PI * 2 * 2.3;
        const r = 0.06 * (1 - i / 60);
        pts.push(c.clone().add(t1.clone().multiplyScalar(Math.cos(u) * r)).add(t2.clone().multiplyScalar(Math.sin(u) * r)).add(n.clone().multiplyScalar(0.025 * Math.sin((i / 40) * Math.PI))));
      }
      coil = strand(pts, 0.032, 0.02, { sides: 8, seg: 120 });
    }
  }

  if (style === 'braids') {
    for (const side of [1, -1]) {
      const ta = side * 1.95;
      const tie = S.at(ta, 1.5, 0.04);
      ring(16, (a) => {
        if (Math.sign(a) !== side) return;
        if (!keep(0.1)) return;
        const fromTh = Math.abs(a) < 0.3 ? 0.08 : hairline(a) - 0.03;
        const end: [number, number, number] = [ta + (Math.abs(a) > 2 ? 0.1 * side : -0.05 * side), 1.48, 0.04];
        if (Math.abs(a) < 1.2) locks.push(lock(path(S, [[side * 0.03, 0.1 + Math.abs(a) * 0.15, 0.03], [side * (0.3 + Math.abs(a) * 0.6), 0.55 + Math.abs(a) * 0.1, 0.038], end], 4), 0.055, 0.45));
        else locks.push(lock(path(S, [[a, fromTh, 0.02], [(a + ta) / 2, (fromTh + 1.48) / 2 - 0.1, 0.035], end], 4), 0.055, 0.45));
        if (Math.abs(a) < 1.6) locks.push(lock(path(S, [[a, hairline(a) - 0.01, 0.02], [a * 0.5 + side * 0.5, 0.75, 0.035], [side * 1.6, 1.15, 0.04], [ta, 1.48, 0.04]], 4), 0.05, 0.5));
      });
      if (hat) ring(8, (a) => Math.sign(a) === side && locks.push(lock(lie(S, a, 1.1, ta, 1.45, 0.03, 0.035, 4), 0.05)));
      // The braid: crossed segments that get smaller toward the end.
      const segs: THREE.BufferGeometry[] = [];
      const dir = new V(side * 0.15, -1, 0.12).normalize();
      for (let i = 0; i < 9; i++) {
        const r = 0.034 - i * 0.0018;
        const at = tie.clone().add(dir.clone().multiplyScalar(0.03 + i * 0.042));
        const s = new THREE.SphereGeometry(r, 12, 9);
        s.scale(1, 1.45, 0.85);
        s.rotateZ((i % 2 ? 0.45 : -0.45) * side);
        s.translate(at.x + (i % 2 ? 0.008 : -0.008), at.y, at.z);
        s.deleteAttribute('uv');
        segs.push(s);
      }
      const end = tie.clone().add(dir.clone().multiplyScalar(0.03 + 9 * 0.042));
      ties.push({ at: end, r: 0.022 });
      const tuft = strand([end, end.clone().add(new V(0, -0.04, 0)), end.clone().add(new V(side * 0.01, -0.07, 0.01))], 0.02, 0.006, { sides: 7 });
      tuft.deleteAttribute('uv');
      segs.push(tuft);
      sway.push({ geo: mergeGeometries(segs), pivot: tie.clone() });
    }
  }

  if (style === 'curly') {
    // Coils spread over the hair area (a sunflower spiral for even spacing).
    const n = hat ? 30 : 95;
    for (let i = 0; i < n; i++) {
      const y = 1 - (i + 0.5) / (n * 0.62);
      const th = Math.acos(Math.max(-1, Math.min(1, y)));
      const a = i * 2.39996;
      const aa = Math.atan2(Math.sin(a), Math.cos(a));
      if (th > hairline(aa) + 0.02) continue;
      if (hat && th < 1.08) continue;
      const base = S.at(aa, th, 0.04 + (hat ? -0.01 : 0.02 * (1 - th)));
      const nrm = base.clone().normalize();
      const t1 = new V(0, 1, 0).cross(nrm).normalize();
      if (t1.lengthSq() < 0.1) t1.set(1, 0, 0);
      const t2 = nrm.clone().cross(t1).normalize();
      const pts: THREE.Vector3[] = [];
      const turns = 1.6 + (i % 3) * 0.3;
      for (let k = 0; k <= 14; k++) {
        const u = (k / 14) * Math.PI * 2 * turns + i;
        const r = 0.018;
        pts.push(base.clone().add(t1.clone().multiplyScalar(Math.cos(u) * r)).add(t2.clone().multiplyScalar(Math.sin(u) * r)).add(nrm.clone().multiplyScalar(k * 0.0035)));
      }
      locks.push(strand(pts, 0.016, 0.011, { sides: 6, seg: 36 }));
    }
  }

  const merged = locks.length ? mergeGeometries(locks.map((g) => (g.attributes.uv ? g : g))) : null;
  return { cap: theCap, locks: merged, sway, ties, coil };
}
