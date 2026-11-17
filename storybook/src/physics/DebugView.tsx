// Development views, never shown to children. Add ?debug=... to the URL:
//   colliders  the collision space (below)
//   nav        the walkable grid the route finder uses around the explorer (green open, red blocked)
//   triggers   every activity spot open now, with the ring you must be inside to use it
//   paths      the world's footpaths as drawn in the recipe, and the explorer's own trail
//   all        everything
// Several can be combined: ?debug=colliders,triggers.
// Hand-made colliders are orange, colliders read from drawn parts cyan.
// Solids are drawn as orange wire shapes standing on the ground, water and
// edge cells as flat blue tiles, cells that open (a bridge) as green, and the
// checked spawn point as a white post. Nothing here is shown to children.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Space } from './space';

export type DebugLayer = 'colliders' | 'nav' | 'triggers' | 'paths';
/** Is a debug layer on (?debug=colliders,nav or ?debug=all)? */
export const debugOn = (layer: DebugLayer) => {
  try {
    const v = (new URLSearchParams(globalThis.location?.search ?? '').get('debug') ?? '').split(',');
    return v.includes(layer) || v.includes('all');
  } catch {
    return false;
  }
};
export const debugColliders = () => debugOn('colliders');

type Pos = { x: number; y: number; z: number };

/** The route finder's grid around the explorer: which cells a walker may step into. */
export function NavView({ me, step, floor, radius = 14, cell = 1.4 }: { me: Pos; step: (ax: number, az: number, bx: number, bz: number, r: number) => boolean; floor: (x: number, z: number) => number; radius?: number; cell?: number }) {
  const n = Math.ceil(radius / cell) * 2 + 1;
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(cell * 0.8, cell * 0.8).rotateX(-Math.PI / 2), [cell]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35, depthWrite: false, vertexColors: false }), []);
  const last = useRef({ i: 1e9, j: 1e9, t: 0 });
  useFrame((st) => {
    const im = ref.current;
    if (!im) return;
    const ci = Math.round(me.x / cell);
    const cj = Math.round(me.z / cell);
    // Redraw when the explorer moves to another cell, and every second (gates open and shut).
    if (ci === last.current.i && cj === last.current.j && st.clock.elapsedTime - last.current.t < 1) return;
    last.current = { i: ci, j: cj, t: st.clock.elapsedTime };
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    let k = 0;
    const h = (n - 1) / 2;
    for (let a = -h; a <= h; a++)
      for (let b = -h; b <= h; b++) {
        const x = (ci + a) * cell;
        const z = (cj + b) * cell;
        // Open if a walker can step in from any side.
        const ok = step(x - cell, z, x, z, 0.35) || step(x + cell, z, x, z, 0.35) || step(x, z - cell, x, z, 0.35) || step(x, z + cell, x, z, 0.35);
        m.makeTranslation(x, floor(x, z) + 0.06, z);
        im.setMatrixAt(k, m);
        im.setColorAt(k, c.set(ok ? '#3cff6e' : '#ff4040'));
        k++;
      }
    im.count = k;
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n * n]} frustumCulled={false} renderOrder={998} />;
}

/** Activity spots open now: a post at each, and the ring you must stand inside to use it. */
export function TriggerView({ uses, floor }: { uses: () => { key: string; pos: Pos; reach: number }[]; floor: (x: number, z: number) => number }) {
  const group = useRef<THREE.Group>(null);
  const ring = useMemo(() => new THREE.RingGeometry(0.95, 1, 48).rotateX(-Math.PI / 2), []);
  const post = useMemo(() => new THREE.CylinderGeometry(0.06, 0.06, 3, 6).translate(0, 1.5, 0), []);
  const mRing = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd23c', transparent: true, opacity: 0.85, depthTest: false, side: THREE.DoubleSide }), []);
  const mPost = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd23c', depthTest: false }), []);
  const mGo = useMemo(() => new THREE.MeshBasicMaterial({ color: '#c060ff', depthTest: false }), []);
  const t = useRef(0);
  useFrame((st) => {
    const g = group.current;
    if (!g || st.clock.elapsedTime - t.current < 0.5) return;
    t.current = st.clock.elapsedTime;
    while (g.children.length) g.remove(g.children[0]);
    for (const u of uses()) {
      const y = floor(u.pos.x, u.pos.z);
      const p = new THREE.Mesh(post, u.reach > 0 ? mPost : mGo);
      p.position.set(u.pos.x, y, u.pos.z);
      p.renderOrder = 999;
      g.add(p);
      if (u.reach > 0 && u.reach < 20) {
        const r = new THREE.Mesh(ring, mRing);
        r.scale.setScalar(u.reach);
        r.position.set(u.pos.x, y + 0.08, u.pos.z);
        r.renderOrder = 999;
        g.add(r);
      }
    }
  });
  return <group ref={group} />;
}

/** The recipe's footpaths (white) and the explorer's own trail (cyan, the last 600 steps). */
export function PathsView({ paths, me, floor }: { paths: [number, number][][]; me: Pos; floor: (x: number, z: number) => number }) {
  const lines = useMemo(
    () =>
      paths.map((pts) => {
        const g = new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(x, floor(x, z) + 0.15, z)));
        const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#ffffff', depthTest: false }));
        l.renderOrder = 999;
        return l;
      }),
    [paths, floor],
  );
  const N = 600;
  const trail = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
    g.setDrawRange(0, 0);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#25e0ff', depthTest: false }));
    l.frustumCulled = false;
    l.renderOrder = 999;
    return l;
  }, []);
  const n = useRef(0);
  const lastP = useRef<Pos>({ x: 1e9, y: 0, z: 1e9 });
  useFrame(() => {
    if (Math.hypot(me.x - lastP.current.x, me.z - lastP.current.z) < 0.25) return;
    lastP.current = { ...me };
    const a = trail.geometry.attributes.position as THREE.BufferAttribute;
    if (n.current >= N) {
      a.array.copyWithin(0, 3);
      n.current = N - 1;
    }
    a.setXYZ(n.current, me.x, me.y + 0.1, me.z);
    n.current++;
    a.needsUpdate = true;
    trail.geometry.setDrawRange(0, n.current);
  });
  return (
    <group>
      {lines.map((l) => (
        <primitive key={l.uuid} object={l} />
      ))}
      <primitive object={trail} />
    </group>
  );
}

export function ColliderView({ space, spawn }: { space: Space; spawn?: [number, number] }) {
  const f = space.spec.floor;
  const group = useRef<THREE.Group>(null);
  // Activity props add and drop colliders as they change: redraw then.
  const [ver, setVer] = useState(space.version);
  const objs = useMemo(() => {
    const out: THREE.Object3D[] = [];
    const wire = new THREE.MeshBasicMaterial({ color: '#ff8a1f', wireframe: true, depthTest: false, transparent: true, opacity: 0.8 });
    const propWire = new THREE.MeshBasicMaterial({ color: '#25e0ff', wireframe: true, depthTest: false, transparent: true, opacity: 0.8 });
    const off = new THREE.MeshBasicMaterial({ color: '#888', wireframe: true, depthTest: false, transparent: true, opacity: 0.3 });
    for (const s of space.solids) {
      const y = f(s.x, s.z);
      const m =
        s.kind === 'circle'
          ? new THREE.Mesh(new THREE.CylinderGeometry(s.r, s.r, 2.4, 12, 1, true), wire)
          : new THREE.Mesh(new THREE.BoxGeometry(s.hx * 2, 2.4, s.hz * 2), wire);
      m.position.set(s.x, y + 1.2, s.z);
      if (s.kind === 'box') m.rotation.y = s.rot ?? 0;
      // Colliders taken from drawn activity props are cyan.
      const own = s.tag.startsWith('drawn part') ? propWire : wire;
      m.material = own;
      m.userData = { s, on: own, off };
      m.renderOrder = 999;
      out.push(m);
    }
    const tile = new THREE.MeshBasicMaterial({ color: '#2a7fff', transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
    for (const c of space.cells) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(c.hx * 2, c.hz * 2), tile);
      m.rotation.x = -Math.PI / 2;
      m.position.set(c.x, f(c.x, c.z) + 0.08, c.z);
      out.push(m);
    }
    if (spawn) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4), new THREE.MeshBasicMaterial({ color: '#fff' }));
      m.position.set(spawn[0], f(spawn[0], spawn[1]) + 2, spawn[1]);
      out.push(m);
    }
    for (const w of space.walkers) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(w.r, w.r, 1.4, 10, 1, true), new THREE.MeshBasicMaterial({ color: w.kind === 'player' ? '#3cff6e' : '#ff3cf0', wireframe: true, depthTest: false }));
      m.userData = { w };
      m.renderOrder = 999;
      out.push(m);
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space, f, spawn, ver]);
  useFrame(() => {
    if (space.version !== ver) setVer(space.version);
    for (const o of objs) {
      const { s, w, on, off } = o.userData as { s?: { active?: () => boolean }; w?: { x: number; y: number; z: number }; on?: THREE.Material; off?: THREE.Material };
      if (s?.active) (o as THREE.Mesh).material = s.active() ? on! : off!;
      if (w) o.position.set(w.x, w.y + 0.7, w.z);
    }
  });
  return (
    <group ref={group}>
      {objs.map((o) => (
        <primitive key={o.uuid} object={o} />
      ))}
    </group>
  );
}
