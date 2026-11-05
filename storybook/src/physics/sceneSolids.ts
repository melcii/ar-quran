// Colliders taken from what is actually drawn. Activity props (a niche wall,
// pavilion pillars, a palm trunk, lantern posts, sluice gates, looms...) are
// built in each mechanic's View and used to have no collision at all, so a
// child could walk straight through them. Here every drawn part that stands on
// the ground and is taller than a step becomes a simple upright collider
// (a circle for round parts, an oriented box for the rest). Nothing visible
// changes. Parts that should stay passable (plants, glows, floating marks)
// are skipped, and any group can opt out with userData.noSolid.
//
// The same walk over the scene also powers the audit: every drawn solid-looking
// part anywhere in the world whose middle is not covered by some collider.
import * as THREE from 'three';
import type { Solid, Space } from './space';

/** Shorter than this above the ground: stepped over, no collider. */
const MIN_H = 0.55;
/** Bottom further than this above the ground: it floats (a roof, a canopy, a sign). */
const MAX_LIFT = 0.35;
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
  if (_box.max.y - _box.min.y < MIN_H) return { h, why: 'thin', x, z };
  // A platform the ground already rises onto (a deck, a step the terrain knows).
  if (floor(x, z) >= _box.max.y - 0.3) return { h, why: 'walkable', x, z };
  world.decompose(_p, _q, _s);
  _up.set(0, 1, 0).applyQuaternion(_q);
  const upright = _up.y > 0.9;
  const lb = geo.boundingBox!;
  if (upright && ROUND.has(geo.type)) {
    const r = Math.max(((lb.max.x - lb.min.x) / 2) * Math.abs(_s.x), ((lb.max.z - lb.min.z) / 2) * Math.abs(_s.z));
    if (r * 2 > MAX_SPAN) return { h, why: 'wide', x, z };
    return { solid: { kind: 'circle', x, z, r, tag, top: h, cam: r > 0.22 }, h, x, z };
  }
  let hx: number;
  let hz: number;
  let rot = 0;
  let cx = x;
  let cz = z;
  if (upright) {
    // Oriented box from the part's own extents and its turn about y.
    const e = new THREE.Euler().setFromQuaternion(_q, 'YXZ');
    rot = e.y;
    hx = ((lb.max.x - lb.min.x) / 2) * Math.abs(_s.x);
    hz = ((lb.max.z - lb.min.z) / 2) * Math.abs(_s.z);
    const c = new THREE.Vector3((lb.min.x + lb.max.x) / 2, (lb.min.y + lb.max.y) / 2, (lb.min.z + lb.max.z) / 2).applyMatrix4(world);
    cx = c.x;
    cz = c.z;
  } else {
    hx = (_box.max.x - _box.min.x) / 2;
    hz = (_box.max.z - _box.min.z) / 2;
  }
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
