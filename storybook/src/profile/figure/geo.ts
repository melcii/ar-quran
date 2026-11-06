// Shapes for the explorer figure, built from smooth curves rather than plain
// primitives: tapered limbs, a shaped torso, a sculpted head and strands
// (hair locks, brows, braids, straps) that thin toward their tips. Every
// geometry is made once per look and shared by the meshes that use it.
import * as THREE from 'three';

const V = THREE.Vector3;

/**
 * A smooth tube along points that tapers from r0 to r1, with an oval
 * cross-section (flat < 1 makes it a ribbon, like a lock of hair). Its uv runs
 * u along the length and v around it, so a streaked texture follows the strand.
 */
export function strand(pts: THREE.Vector3[], r0: number, r1: number, o: { flat?: number; seg?: number; sides?: number; ease?: number; up?: THREE.Vector3; cap?: boolean } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const seg = o.seg ?? Math.max(6, pts.length * 5);
  const sides = o.sides ?? 8;
  const flat = o.flat ?? 1;
  const ease = o.ease ?? 1;
  const frames = curve.computeFrenetFrames(seg, false);
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const up = o.up;
  const n = new V();
  const b = new V();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const p = curve.getPointAt(t);
    const tan = frames.tangents[i];
    if (up) {
      // Keep the flat side facing a chosen direction (hair lies on the head).
      b.crossVectors(tan, up).normalize();
      if (b.lengthSq() < 1e-6) b.copy(frames.binormals[i]);
      n.crossVectors(b, tan).normalize();
    } else {
      n.copy(frames.normals[i]);
      b.copy(frames.binormals[i]);
    }
    const r = r0 + (r1 - r0) * Math.pow(t, ease);
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const cx = Math.cos(a) * r;
      const cy = Math.sin(a) * r * flat;
      pos.push(p.x + n.x * cy + b.x * cx, p.y + n.y * cy + b.y * cx, p.z + n.z * cy + b.z * cx);
      uv.push(t, j / sides);
    }
  }
  for (let i = 0; i < seg; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j;
      const c = a + sides + 1;
      idx.push(a, c, a + 1, c, c + 1, a + 1);
    }
  if (o.cap !== false) {
    // Round end caps so strands never show an open hole.
    for (const [end, dir] of [[0, -1], [seg, 1]] as const) {
      const p = curve.getPointAt(end / seg);
      const tan = curve.getTangentAt(end / seg).multiplyScalar(dir);
      const r = (end === 0 ? r0 : r1) * 0.9;
      const ci = pos.length / 3;
      pos.push(p.x + tan.x * r * 0.6, p.y + tan.y * r * 0.6, p.z + tan.z * r * 0.6);
      uv.push(end / seg, 0.5);
      const ring = end * (sides + 1);
      for (let j = 0; j < sides; j++) dir > 0 ? idx.push(ring + j + 1, ring + j, ci) : idx.push(ring + j, ring + j + 1, ci);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Profile helper: a lathe from (radius, y) pairs, smoothed with a spline. */
export function lathe(profile: [number, number][], o: { seg?: number; sides?: number; phiStart?: number; phiLength?: number; zScale?: number } = {}) {
  const c = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
  let pts = c.getPoints(o.seg ?? 24).map((p) => new THREE.Vector2(Math.max(0.0001, p.x), p.y));
  // A lathe faces outward only when its profile runs upward.
  if (pts[0].y > pts[pts.length - 1].y) pts = pts.reverse();
  const g = new THREE.LatheGeometry(pts, o.sides ?? 28, o.phiStart ?? 0, o.phiLength ?? Math.PI * 2);
  if (o.zScale && o.zScale !== 1) g.scale(1, 1, o.zScale);
  g.computeVertexNormals();
  return g;
}

/**
 * A limb segment hanging down from its joint: round at the top (r0), easing
 * to r1 at the bottom over `len`, with a small bulge (muscle softness).
 */
export function limb(r0: number, r1: number, len: number, bulge = 0.08, zScale = 1) {
  const prof: [number, number][] = [];
  const N = 10;
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    prof.push([Math.sin(a) * r0, Math.cos(a) * r0 * 0.9]);
  }
  for (let i = 1; i < N; i++) {
    const t = i / N;
    const r = r0 + (r1 - r0) * t + Math.sin(t * Math.PI) * bulge * (r0 + r1) * 0.5;
    prof.push([r, -t * len]);
  }
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    prof.push([Math.cos(a) * r1, -len - Math.sin(a) * r1 * 0.9]);
  }
  const pts = prof.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)).reverse();
  const g = new THREE.LatheGeometry(pts, 18);
  if (zScale !== 1) g.scale(1, 1, zScale);
  g.computeVertexNormals();
  return g;
}

export type FaceShape = 'round' | 'oval' | 'heart' | 'square';

const bump = (v: THREE.Vector3, c: THREE.Vector3, w: number) => Math.exp(-v.distanceToSquared(c) / (w * w));

/**
 * The head: a sphere sculpted into a child's head. A bigger back of the skull,
 * full cheeks, a soft jaw and small chin (by face shape), gentle brow ridge and
 * eye sockets so the eyes sit in the face, and a flatter face plane.
 */
export function headGeo(R: number, shape: FaceShape) {
  const g = new THREE.SphereGeometry(R, 72, 56);
  const p = g.attributes.position;
  const v = new V();
  const d = new V();
  const jaw = { round: 0.1, oval: 0.2, heart: 0.3, square: 0.08 }[shape];
  const cheek = { round: 0.06, oval: 0.035, heart: 0.045, square: 0.04 }[shape];
  const tall = { round: 1.0, oval: 1.07, heart: 1.04, square: 1.0 }[shape];
  const wide = { round: 1.04, oval: 0.97, heart: 1.02, square: 1.06 }[shape];
  const C1 = new V(0.55, -0.32, 0.75).normalize();
  const C2 = new V(-0.55, -0.32, 0.75).normalize();
  const E1 = new V(0.34, 0.06, 0.94).normalize();
  const E2 = new V(-0.34, 0.06, 0.94).normalize();
  const BR = new V(0, 0.3, 0.95).normalize();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    d.copy(v).normalize();
    let s = 1;
    // Back of the skull larger; face plane slightly flatter.
    if (d.z < 0) s += 0.05 * -d.z * Math.max(0, d.y + 0.4);
    // Narrow toward the chin.
    const low = Math.max(0, -d.y);
    let x = d.x * wide;
    let y = d.y * tall;
    let z = d.z;
    x *= 1 - jaw * Math.pow(low, 1.6) * (0.6 + 0.4 * Math.max(0, d.z));
    if (shape === 'square') x *= 1 + 0.06 * Math.pow(low, 1.2) * Math.max(0, 1 - low * 1.4);
    // Chin: a little forward and rounded.
    z += 0.05 * Math.pow(low, 2) * Math.max(0, d.z);
    // Cheeks.
    s += cheek * (bump(d, C1, 0.42) + bump(d, C2, 0.42));
    // Eye sockets and a soft brow.
    s -= 0.028 * (bump(d, E1, 0.2) + bump(d, E2, 0.2));
    s += 0.012 * bump(d, BR, 0.3);
    // Face a little flatter than a ball.
    if (z > 0) z *= 0.93;
    v.set(x, y, z).multiplyScalar(R * s);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Height of the head surface along a direction (for seating eyes, hair and hats). */
export function onHead(geo: THREE.BufferGeometry, dir: THREE.Vector3) {
  const p = geo.attributes.position;
  const v = new V();
  const d = dir.clone().normalize();
  let best = -1;
  let r = 0;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const l = v.length();
    const c = v.dot(d) / l;
    if (c > best) {
      best = c;
      r = l;
    }
  }
  return d.multiplyScalar(r);
}

/** A flared cloth piece (skirt, tunic hem, dress, coat tails) from a top and bottom radius. */
export function flare(rTop: number, rBot: number, len: number, o: { zScale?: number; waves?: number; open?: number } = {}) {
  const prof: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    prof.push([rTop + (rBot - rTop) * Math.pow(t, 0.8), -t * len]);
  }
  const open = o.open ?? 0;
  const g = lathe(prof, { sides: 40, seg: 16, phiStart: open / 2, phiLength: Math.PI * 2 - open, zScale: o.zScale ?? 0.82 });
  // Soft folds toward the hem.
  if (o.waves) {
    const p = g.attributes.position;
    const v = new V();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const t = Math.min(1, -v.y / len);
      const a = Math.atan2(v.z, v.x);
      const k = 1 + Math.sin(a * o.waves) * 0.06 * t * t;
      p.setXYZ(i, v.x * k, v.y, v.z * k);
    }
    g.computeVertexNormals();
  }
  return g;
}

/** A rounded box (bags, the backpack, a book). */
export { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
