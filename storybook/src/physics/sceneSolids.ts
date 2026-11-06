// Colliders taken from what is actually drawn. Activity props (a niche wall,
// pavilion pillars, a palm trunk, lantern posts, sluice gates, looms...) are
// built in each mechanic's View and used to have no collision at all, so a
// child could walk straight through them. Here every drawn part that stands on
// the ground and is taller than a step (0.45 m) becomes a simple upright collider
// (a circle for round parts, an oriented box for the rest). Nothing visible
// changes. Parts that should stay passable (plants, glows, floating marks)
// are skipped, and any group can opt out with userData.noSolid.
//
// The same walk over the scene also powers the audit: every drawn solid-looking
// part anywhere in the world whose middle is not covered by some collider.
import * as THREE from 'three';
import { MAX_STEP, type Solid, type Space } from './space';

/** No taller above the ground than a step: walked over, no collider. Anything taller is in the way. */
const MIN_H = MAX_STEP;
/** Bottom further than this above the ground: it floats (a roof, a canopy, a sign).
 * Lower than this it is in the way: a post, or a fence rail at knee height. */
const MAX_LIFT = 0.9;
/** Wider than this: ground cover or a platform, not a wall (reported, not added). */
const MAX_SPAN = 9;

type Floor = (x: number, z: number) => number;
export type Part = { mesh: THREE.Object3D; solid: Solid; h: number };

const _box = new THREE.Box3();
const _m = new THREE.Matrix4();
const _im = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _up = new THREE.Vector3();
const _ax = new THREE.Vector3();
const _c = new THREE.Vector3();

function skipped(o: THREE.Object3D) {
  for (let a: THREE.Object3D | null = o; a; a = a.parent) {
    if (!a.visible) return true;
    if (a.userData?.noSolid) return true;
  }
  return false;
}

function softMaterial(m: THREE.Material | THREE.Material[]) {
  const all = Array.isArray(m) ? m : [m];
  return all.every((x) => (x.transparent && x.opacity < 0.6) || x.depthWrite === false || x.blending === THREE.AdditiveBlending || !x.visible);
}

const FLAT = new Set(['PlaneGeometry', 'RingGeometry', 'CircleGeometry', 'ShapeGeometry', 'TorusGeometry', 'EdgesGeometry']);
const ROUND = new Set(['CylinderGeometry', 'ConeGeometry', 'CapsuleGeometry', 'SphereGeometry', 'LatheGeometry', 'DodecahedronGeometry', 'IcosahedronGeometry', 'OctahedronGeometry']);

/** One drawn part (a mesh, or one instance of an instanced mesh) as a collider, or why not. */
function partSolid(geo: THREE.BufferGeometry, world: THREE.Matrix4, floor: Floor, tag: string): { solid?: Solid; h: number; why?: string; x: number; z: number } {
  if (!geo.boundingBox) geo.computeBoundingBox();
  _box.copy(geo.boundingBox!).applyMatrix4(world);
  const x = (_box.min.x + _box.max.x) / 2;
  const z = (_box.min.z + _box.max.z) / 2;
  const fy = floor(x, z);
  const h = _box.max.y - fy;
  if (FLAT.has(geo.type)) return { h, why: 'flat', x, z };
  if (_box.min.y > fy + MAX_LIFT) return { h, why: 'raised', x, z };
  if (h < MIN_H) return { h, why: 'low', x, z };
  // A platform the ground already rises onto (a deck, a step the terrain knows).
  if (floor(x, z) >= _box.max.y - 0.3) return { h, why: 'walkable', x, z };
  world.decompose(_p, _q, _s);
  _up.set(0, 1, 0).applyQuaternion(_q);
  const upright = _up.y > 0.9;
  const lb = geo.boundingBox!;
  // A slanting cord (a tent's guy rope, a festoon string): a thread, not a wall.
  // Its box on the ground plan would be an invisible wall the length of the rope.
  // (Steeply slanting and under 5 cm thick: rails, which run level or up a ramp, stay solid.)
  if ((geo.type === 'CylinderGeometry' || geo.type === 'CapsuleGeometry') && _up.y > 0.45 && _up.y < 0.9 && Math.max((lb.max.x - lb.min.x) * Math.abs(_s.x), (lb.max.z - lb.min.z) * Math.abs(_s.z)) < 0.05) return { h, why: 'rope', x, z };
  if (upright && ROUND.has(geo.type)) {
    const r = Math.max(((lb.max.x - lb.min.x) / 2) * Math.abs(_s.x), ((lb.max.z - lb.min.z) / 2) * Math.abs(_s.z));
    if (r * 2 > MAX_SPAN) return { h, why: 'wide', x, z };
    return { solid: { kind: 'circle', x, z, r, tag, top: h, cam: r > 0.22 }, h, x, z };
  }
  // An oriented box on the ground plan, turned along the part's longest
  // horizontal axis (a rail running round a pen, a plank, a wall).
  const ext = [(lb.max.x - lb.min.x) / 2, (lb.max.y - lb.min.y) / 2, (lb.max.z - lb.min.z) / 2];
  let best = -1;
  let rot = 0;
  for (let k = 0; k < 3; k++) {
    _ax.set(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0).transformDirection(world).multiplyScalar(ext[k] * [_s.x, _s.y, _s.z].map(Math.abs)[k]);
    const len = Math.hypot(_ax.x, _ax.z);
    if (len > best) (best = len), (rot = Math.atan2(-_ax.z, _ax.x));
  }
  // Rotation-y convention: local x runs along (cos rot, -sin rot), local z along (sin rot, cos rot).
  const ux = Math.cos(rot);
  const uz = -Math.sin(rot);
  let u0 = Infinity;
  let u1 = -Infinity;
  let w0 = Infinity;
  let w1 = -Infinity;
  for (let c = 0; c < 8; c++) {
    _c.set(c & 1 ? lb.max.x : lb.min.x, c & 2 ? lb.max.y : lb.min.y, c & 4 ? lb.max.z : lb.min.z).applyMatrix4(world);
    const u = _c.x * ux + _c.z * uz;
    const w = _c.x * -uz + _c.z * ux;
    u0 = Math.min(u0, u);
    u1 = Math.max(u1, u);
    w0 = Math.min(w0, w);
    w1 = Math.max(w1, w);
  }
  const hx = (u1 - u0) / 2;
  const hz = (w1 - w0) / 2;
  const um = (u0 + u1) / 2;
  const wm = (w0 + w1) / 2;
  const cx = um * ux - wm * uz;
  const cz = um * uz + wm * ux;
  if (Math.max(hx, hz) * 2 > MAX_SPAN) return { h, why: 'wide', x, z };
  return { solid: { kind: 'box', x: cx, z: cz, hx, hz, rot, tag, top: h, cam: Math.min(hx, hz) > 0.22 || Math.max(hx, hz) > 0.8 }, h, x, z };
}

function label(o: THREE.Object3D) {
  for (let a: THREE.Object3D | null = o; a; a = a.parent) if (a.name) return a.name;
  return o.type;
}

/** Visit every drawn part under root (instances one by one). */
function eachPart(root: THREE.Object3D, fn: (geo: THREE.BufferGeometry, world: THREE.Matrix4, mesh: THREE.Mesh) => void) {
  root.updateWorldMatrix(true, true);
  root.traverseVisible((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry || skipped(o)) return;
    if (softMaterial(mesh.material)) return;
    const inst = o as THREE.InstancedMesh;
    if (inst.isInstancedMesh) {
      for (let i = 0; i < inst.count; i++) {
        inst.getMatrixAt(i, _im);
        _m.multiplyMatrices(inst.matrixWorld, _im);
        if (_im.elements[0] === 0 && _im.elements[5] === 0) continue; // hidden instance
        fn(inst.geometry, _m, mesh);
      }
    } else fn(mesh.geometry, mesh.matrixWorld, mesh);
  });
}

/** Colliders for everything solid drawn under root. */
export function sceneSolids(root: THREE.Object3D, floor: Floor, tag = 'prop', covered?: (x: number, z: number) => boolean): Solid[] {
  const out: Solid[] = [];
  eachPart(root, (geo, world, mesh) => {
    const r = partSolid(geo, world, floor, `${tag}: ${label(mesh)}`);
    // Parts a hand-made collider already holds (a house, an arch's pillars) need nothing more.
    if (r.solid && !covered?.(r.solid.x, r.solid.z)) out.push(r.solid);
  });
  return out;
}

/** A short key that changes when the colliders would. */
export function solidsKey(ss: Solid[]) {
  return ss.map((s) => (s.kind === 'circle' ? `c${(s.x * 20) | 0},${(s.z * 20) | 0},${(s.r * 20) | 0}` : `b${(s.x * 20) | 0},${(s.z * 20) | 0},${(s.hx * 20) | 0},${(s.hz * 20) | 0},${((s.rot ?? 0) * 20) | 0}`)).join(';');
}

export type AuditItem = { what: string; geo: string; x: number; z: number; h: number };

/**
 * The audit: every drawn part in the scene that looks solid (on the ground,
 * taller than a step) whose middle no collider covers. Skips whatever is
 * marked noSolid (the explorer, animals, grass) and soft materials.
 */
export function auditScene(scene: THREE.Object3D, space: Space, radius: number): { parts: number; uncovered: AuditItem[]; wide: AuditItem[] } {
  const floor = space.spec.floor;
  space.sync();
  const uncovered: AuditItem[] = [];
  const wide: AuditItem[] = [];
  let parts = 0;
  eachPart(scene, (geo, world, mesh) => {
    const r = partSolid(geo, world, floor, label(mesh));
    if (!r.solid && r.why !== 'wide') return;
    if (Math.hypot(r.x, r.z) > radius) return;
    parts++;
    const item = { what: label(mesh), geo: geo.type, x: +r.x.toFixed(2), z: +r.z.toFixed(2), h: +r.h.toFixed(2) };
    if (r.why === 'wide') return void wide.push(item);
    const s = r.solid!;
    if (!space.blockedAt(s.x, s.z, 0.04)) uncovered.push(item);
  });
  return { parts, uncovered, wide };
}
