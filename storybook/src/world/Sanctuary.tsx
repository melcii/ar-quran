// The reading room: the Quran open on its rehal. Any surah can be read here,
// page by page; the niche in the back wall is the doorway to the library.
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import { Study } from '@/three/Study';
import { ROOM_SHOTS, fitShot, type Shot } from '@/three/environments';
import { Book, type Leaf } from './Book';

export type RoomView = 'wide' | 'book' | 'reading';
export type Inset = { top: number; right: number; bottom: number; left: number };
const NO_INSET: Inset = { top: 0, right: 0, bottom: 0, left: 0 };

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function Sanctuary({
  view,
  motion,
  open,
  right,
  left,
  leaf,
  look,
  onForward,
  onBack,
  onBook,
  onDoor,
  inset = NO_INSET,
  extra,
}: {
  view: RoomView;
  motion: boolean;
  open: MutableRefObject<number>;
  right: THREE.Texture | null;
  left: THREE.Texture | null;
  leaf: Leaf;
  look: { yaw: number; pitch: number };
  onForward: () => void;
  onBack: () => void;
  onBook: () => void;
  onDoor: () => void;
  /** Screen space (px) taken by the interface; the book is framed in what is left. */
  inset?: Inset;
  /** More things standing in the room, such as the player's explorer. */
  extra?: ReactNode;
}) {
  const { camera, size } = useThree();
  const dim = useRef(0);
  const from = useRef<Shot | null>(null);
  const t0 = useRef(0);
  const cur = useRef({ pos: ROOM_SHOTS.wide.pos.clone(), look: ROOM_SHOTS.wide.look.clone(), fov: ROOM_SHOTS.wide.fov });
  // Frame the shot in the part of the screen the interface leaves free: fit it
  // to that area's shape, widen the lens to its height, then shift the image.
  const target = useMemo(() => {
    const w = Math.max(1, size.width - inset.left - inset.right);
    const h = Math.max(1, size.height - inset.top - inset.bottom);
    const s = fitShot(ROOM_SHOTS[view], w / h);
    const fov = (2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(s.fov) / 2) * (size.height / h)) * 180) / Math.PI;
    return { ...s, fov };
  }, [view, size.width, size.height, inset]);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.setViewOffset(size.width, size.height, (inset.right - inset.left) / 2, (inset.bottom - inset.top) / 2, size.width, size.height);
    return () => cam.clearViewOffset();
  }, [camera, size.width, size.height, inset]);

  useEffect(() => {
    from.current = { pos: cur.current.pos.clone(), look: cur.current.look.clone(), fov: cur.current.fov };
    t0.current = performance.now();
  }, [target]);

  // A slow drift of the camera in the wide view, so the room feels alive.
  const drift = useRef(0);
  useFrame((state, dt) => {
    drift.current += ((view === 'wide' && motion ? 1 : 0) - drift.current) * Math.min(1, dt * 0.8);
    const dur = motion ? 2200 : 300;
    const p = from.current ? Math.min(1, (performance.now() - t0.current) / dur) : 1;
    const e = ease(p);
    if (from.current) {
      cur.current.pos.copy(from.current.pos).lerp(target.pos, e);
      cur.current.look.copy(from.current.look).lerp(target.look, e);
      cur.current.fov = from.current.fov + (target.fov - from.current.fov) * e;
    }
    const cam = camera as THREE.PerspectiveCamera;
    // Small look-around offsets from dragging, kept gentle near the book.
    const dir = cur.current.look.clone().sub(cur.current.pos);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -look.yaw * 0.6);
    cam.position.copy(cur.current.pos);
    if (drift.current > 0.001) {
      const t = state.clock.elapsedTime;
      cam.position.x += Math.sin(t * 0.11) * 0.09 * drift.current;
      cam.position.y += Math.sin(t * 0.07 + 1) * 0.035 * drift.current;
      cam.position.z += Math.sin(t * 0.05 + 2) * 0.06 * drift.current;
    }
    cam.lookAt(cur.current.pos.clone().add(dir).add(new THREE.Vector3(0, look.pitch * 0.8, 0)));
    if (Math.abs(cam.fov - cur.current.fov) > 0.01) {
      cam.fov = cur.current.fov;
      cam.updateProjectionMatrix();
    }
  });

  const door = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return;
    e.stopPropagation();
    onDoor();
  };

  return (
    <Study motion={motion} dim={dim}>
      {extra}
      <Book open={open} right={right} left={left} leaf={leaf} onForward={onForward} onBack={onBack} onTap={onBook} />
      {/* The niche glows with the light of the library beyond it. */}
      <mesh position={[0, 1.75, -2.7]} onClick={door}>
        <planeGeometry args={[2.1, 3.4]} />
        <meshBasicMaterial color="#e8b878" transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </Study>
  );
}
