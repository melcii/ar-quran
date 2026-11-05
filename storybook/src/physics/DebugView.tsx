// Development view of the collision space: add ?debug=colliders to the URL.
// Hand-made colliders are orange, colliders read from drawn parts cyan.
// Solids are drawn as orange wire shapes standing on the ground, water and
// edge cells as flat blue tiles, cells that open (a bridge) as green, and the
// checked spawn point as a white post. Nothing here is shown to children.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Space } from './space';

export const debugColliders = () => {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('debug') === 'colliders';
  } catch {
    return false;
  }
};

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
