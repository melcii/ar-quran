// Hands-on play in the 3D worlds: pick something up, carry it across the
// ground and set it down where it belongs. Works by dragging (mouse or finger)
// and also by tapping: tap a thing to pick it up, then tap the glowing spot.
//
// One <DragPlay> holds a set of items and a set of drop spots, in world
// coordinates (put it at the root of a scene, not inside a moved group).
// Each item names the spot(s) it belongs to; a spot can take several items
// (sorting), and a pair-matching game is two items that belong to the same
// spot. The scene says what happens when all are placed.
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { holding } from '../holding';
import type { P3 } from './kit';

export type DropSpot = {
  id: string;
  pos: P3;
  /** How close (metres, on the ground) a drop must be to count. */
  r?: number;
  /** Where placed items sit, in order; defaults to the spot itself. */
  slots?: P3[];
  /** Ring colour while waiting. */
  color?: string;
  /** Hide the ring (for spots the scene marks itself). */
  hidden?: boolean;
};

export type DragItem = {
  id: string;
  home: P3;
  /** The spot ids this item may be placed on. */
  fits: string[];
  /** The 3D thing being carried, drawn at the item's origin. */
  node: ReactNode;
  /** Lift while carried (metres). */
  lift?: number;
};

type Props = {
  items: DragItem[];
  spots: DropSpot[];
  /** Called after each correct placement with what was placed and where. */
  onPlace?: (item: string, spot: string, placedCount: number) => void;
  /** Called when an item is dropped on a spot it does not belong to. */
  onWrong?: (item: string, spot: string) => void;
  onDone?: () => void;
  /** Prefix for the headless test hooks (globalThis.__taps[prefix + item]). */
  testPrefix?: string;
  /** Keep placed state from outside (for a scene that changes after placing). */
  placed?: Record<string, string>;
};

const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();
const ndc = new THREE.Vector2();
const ray = new THREE.Raycaster();

export function DragPlay({ items, spots, onPlace, onWrong, onDone, testPrefix, placed: placedIn }: Props) {
  const { camera, gl } = useThree();
  const [placedOwn, setPlaced] = useState<Record<string, string>>({});
  const placed = placedIn ?? placedOwn;
  const [held, setHeld] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const pos = useRef<Record<string, THREE.Vector3>>({});
  const drag = useRef<{ id: string; moved: number; x: number; y: number; baseY: number } | null>(null);
  const placedRef = useRef(placed);
  placedRef.current = placed;

  // Where each placed item rests: the next free slot of its spot.
  const restOf = (item: string, spot: string, state: Record<string, string>): P3 => {
    const s = spots.find((d) => d.id === spot)!;
    const at = Object.entries(state)
      .filter(([, sp]) => sp === spot)
      .map(([it]) => it)
      .indexOf(item);
    return s.slots?.[Math.max(0, at)] ?? s.pos;
  };

  const tryPlace = (item: string, spot: string | null) => {
    const it = items.find((i) => i.id === item)!;
    if (!spot) return false;
    if (!it.fits.includes(spot)) {
      onWrong?.(item, spot);
      return false;
    }
    const s = spots.find((d) => d.id === spot)!;
    const used = Object.values(placedRef.current).filter((v) => v === spot).length;
    if (s.slots && used >= s.slots.length) return false;
    const next = { ...placedRef.current, [item]: spot };
    placedRef.current = next;
    setPlaced(next);
    onPlace?.(item, spot, Object.keys(next).length);
    if (Object.keys(next).length === items.length) onDone?.();
    return true;
  };

  // Test hooks: place each item on its first spot without aiming.
  useEffect(() => {
    if (!testPrefix) return;
    const g = globalThis as { __taps?: Record<string, () => void> };
    g.__taps ??= {};
    for (const it of items) g.__taps[testPrefix + it.id] = () => void (placedRef.current[it.id] || it.fits.some((f) => tryPlace(it.id, f)));
  });

  const nearestSpot = (p: THREE.Vector3) => {
    let best: DropSpot | null = null;
    let bd = Infinity;
    for (const s of spots) {
      const d = Math.hypot(s.pos[0] - p.x, s.pos[2] - p.z);
      if (d < (s.r ?? 1.6) && d < bd) (best = s), (bd = d);
    }
    return best?.id ?? null;
  };

  useEffect(() => {
    const el = gl.domElement;
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      d.moved += Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y);
      d.x = e.clientX;
      d.y = e.clientY;
      if (d.moved < 6) return;
      const rect = el.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      plane.constant = -d.baseY;
      if (ray.ray.intersectPlane(plane, hit)) {
        // Keep it within reach of the viewer.
        const off = hit.clone().sub(camera.position).setY(0);
        if (off.length() > 14) off.setLength(14);
        pos.current[d.id]?.set(camera.position.x + off.x, d.baseY, camera.position.z + off.z);
      }
    };
    const up = () => {
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      holding.on = false;
      setHeld(null);
      if (d.moved < 6) {
        // A tap: pick it up (select), or put it down again.
        setSelected((s) => (s === d.id ? null : d.id));
        return;
      }
      const p = pos.current[d.id];
      const spot = p ? nearestSpot(p) : null;
      if (!tryPlace(d.id, spot)) {
        const it = items.find((i) => i.id === d.id)!;
        p?.set(...it.home);
      }
      setSelected(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      holding.on = false;
    };
  });

  const grab = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    if (placed[id]) return;
    e.stopPropagation();
    const it = items.find((i) => i.id === id)!;
    holding.on = true;
    drag.current = { id, moved: 0, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, baseY: it.home[1] };
    setHeld(id);
  };

  const tapSpot = (spot: string) => (e: ThreeEvent<MouseEvent>) => {
    if (!selected || e.delta > 8) return;
    e.stopPropagation();
    if (tryPlace(selected, spot)) setSelected(null);
  };

  const carrying = held ?? selected;
  return (
    <group>
      {items.map((it) => {
        pos.current[it.id] ??= new THREE.Vector3(...it.home);
        const at = placed[it.id];
        return (
          <Carried
            key={it.id}
            target={pos.current[it.id]}
            rest={at ? restOf(it.id, at, placed) : null}
            lifted={held === it.id || selected === it.id}
            lift={it.lift ?? 0.6}
            onPointerDown={grab(it.id)}
          >
            {it.node}
          </Carried>
        );
      })}
      {spots.map((s) =>
        s.hidden ? null : (
          <SpotRing
            key={s.id}
            spot={s}
            active={!!carrying && items.find((i) => i.id === carrying)?.fits.includes(s.id) === true}
            waiting={items.some((i) => !placed[i.id] && i.fits.includes(s.id))}
            onClick={tapSpot(s.id)}
          />
        ),
      )}
    </group>
  );
}

/** Eases the item toward where it is carried (or where it rests once placed), with a little bob when lifted. */
function Carried({ target, rest, lifted, lift, onPointerDown, children }: { target: THREE.Vector3; rest: P3 | null; lifted: boolean; lift: number; onPointerDown: (e: ThreeEvent<PointerEvent>) => void; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const want = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    if (g.current) g.current.position.copy(target);
  }, [target]);
  useFrame((st, dt) => {
    const o = g.current;
    if (!o) return;
    if (rest) want.set(...rest);
    else want.copy(target).add(new THREE.Vector3(0, lifted ? lift + Math.sin(st.clock.elapsedTime * 5) * 0.08 : 0, 0));
    o.position.lerp(want, 1 - Math.exp(-dt * 10));
  });
  return (
    <group ref={g} onPointerDown={rest ? undefined : onPointerDown}>
      {children}
    </group>
  );
}

/** A soft glowing ring on the ground: where something can be set down. */
function SpotRing({ spot, active, waiting, onClick }: { spot: DropSpot; active: boolean; waiting: boolean; onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  const m = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((st) => {
    if (m.current) m.current.opacity = !waiting ? 0 : active ? 0.55 + Math.sin(st.clock.elapsedTime * 6) * 0.2 : 0.22 + Math.sin(st.clock.elapsedTime * 2) * 0.06;
  });
  const r = spot.r ?? 1.6;
  return (
    <mesh position={[spot.pos[0], spot.pos[1] + 0.06, spot.pos[2]]} rotation-x={-Math.PI / 2} onClick={onClick}>
      <ringGeometry args={[r * 0.72, r * 0.9, 40]} />
      <meshBasicMaterial ref={m} color={spot.color ?? '#ffe39a'} transparent opacity={0.25} depthWrite={false} />
    </mesh>
  );
}
