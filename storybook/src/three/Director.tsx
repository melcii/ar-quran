// Runs every frame: moves the camera between shots, grows the story world out
// of the book and back, blends the atmosphere, and lets the child drag to look
// around and pinch or scroll to move closer.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import { cloneEnv, ENVIRONMENTS, lerpEnv, type Env, type EnvName, type Shot } from './environments';

export const WORLD_ORIGIN = new THREE.Vector3(0, 0.47, 0.0);
export const MIN_SCALE = 0.0012;
const UP = new THREE.Vector3(0, 1, 0);

export type CameraMove = { from: Shot; to: Shot; start: number; duration: number; arc?: number };

export type DirectorRefs = {
  move: MutableRefObject<CameraMove | null>;
  /** 0 = only the room, 1 = only the story world. */
  grow: MutableRefObject<number>;
  growTarget: MutableRefObject<{ from: number; to: number; start: number; duration: number } | null>;
  envName: MutableRefObject<EnvName>;
  env: MutableRefObject<Env>;
  dim: MutableRefObject<number>;
  skyOpacity: MutableRefObject<number>;
  look: MutableRefObject<{ yaw: number; pitch: number; zoom: number; enabled: boolean }>;
  /** The shot the camera last arrived at. */
  at: MutableRefObject<Shot>;
};

export function useDirectorRefs(initial: Shot): DirectorRefs {
  return {
    at: useRef(initial),
    move: useRef<CameraMove | null>(null),
    grow: useRef(0),
    growTarget: useRef(null),
    envName: useRef<EnvName>('dawn'),
    env: useRef<Env>(cloneEnv(ENVIRONMENTS.dawn)),
    dim: useRef(0),
    skyOpacity: useRef(0),
    look: useRef({ yaw: 0, pitch: 0, zoom: 0, enabled: false }),
  };
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Marks a story-world shot as local, so it follows the world's growth. */
export function worldShot(s: Shot): Shot {
  return { pos: s.pos.clone(), look: s.look.clone(), fov: s.fov, local: true };
}

const worldScale = (grow: number) => MIN_SCALE * Math.pow(1 / MIN_SCALE, grow);

/** Where a shot is in room coordinates right now. */
function resolve(s: Shot, scale: number, out: { pos: THREE.Vector3; look: THREE.Vector3 }) {
  if (s.local) {
    out.pos.copy(s.pos).multiplyScalar(scale).add(WORLD_ORIGIN);
    out.look.copy(s.look).multiplyScalar(scale).add(WORLD_ORIGIN);
  } else {
    out.pos.copy(s.pos);
    out.look.copy(s.look);
  }
}

export function Director({ refs, world, study, initial }: { refs: DirectorRefs; world: ReactNode; study: ReactNode; initial: Shot }) {
  const { camera, scene, gl } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const lookAt = useRef(initial.look.clone());
  const worldGroup = useRef<THREE.Group>(null);
  const studyGroup = useRef<THREE.Group>(null);
  const ambient = useRef<THREE.HemisphereLight>(null);
  const sunLight = useRef<THREE.DirectionalLight>(null);
  const roomBg = useMemo(() => new THREE.Color('#0b0806'), []);
  const fog = useMemo(() => new THREE.FogExp2('#000000', 0), []);
  const tmp = useMemo(
    () => ({
      look: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      right: new THREE.Vector3(),
      bg: new THREE.Color(),
      a: { pos: new THREE.Vector3(), look: new THREE.Vector3() },
      b: { pos: new THREE.Vector3(), look: new THREE.Vector3() },
    }),
    [],
  );
  const basePos = useRef(initial.pos.clone());

  useEffect(() => {
    cam.position.copy(initial.pos);
    cam.fov = initial.fov;
    cam.lookAt(initial.look);
    cam.updateProjectionMatrix();
    scene.fog = fog;
    scene.background = roomBg.clone();
    scene.userData.lookAt = lookAt.current;
    scene.userData.basePos = basePos.current;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Drag to look around; wheel or pinch to move closer.
  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const down = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const move = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev || !refs.look.current.enabled) return;
      const l = refs.look.current;
      if (pointers.size === 1) {
        l.yaw = THREE.MathUtils.clamp(l.yaw - (e.clientX - prev.x) * 0.004, -0.75, 0.75);
        l.pitch = THREE.MathUtils.clamp(l.pitch + (e.clientY - prev.y) * 0.003, -0.35, 0.35);
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) l.zoom = THREE.MathUtils.clamp(l.zoom + (d - pinch) * 0.002, 0, 0.45);
        pinch = d;
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = 0;
    };
    const wheel = (e: WheelEvent) => {
      if (!refs.look.current.enabled) return;
      e.preventDefault();
      const l = refs.look.current;
      l.zoom = THREE.MathUtils.clamp(l.zoom - e.deltaY * 0.0006, 0, 0.45);
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    el.style.touchAction = 'none';
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [gl, refs.look]);

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime;

    // World growth
    const g = refs.growTarget.current;
    if (g) {
      const p = g.duration <= 0 ? 1 : Math.min(1, (now - g.start) / g.duration);
      refs.grow.current = g.from + (g.to - g.from) * ease(p);
      if (p >= 1) refs.growTarget.current = null;
    }
    const grow = refs.grow.current;
    const scale = worldScale(grow);
    refs.dim.current = THREE.MathUtils.clamp(grow * 2.2, 0, 1);
    refs.skyOpacity.current = THREE.MathUtils.clamp((grow - 0.35) * 2.5, 0, 1);
    if (worldGroup.current) {
      worldGroup.current.scale.setScalar(scale);
      worldGroup.current.position.copy(WORLD_ORIGIN);
      worldGroup.current.visible = grow > 0.001;
    }
    if (studyGroup.current) studyGroup.current.visible = refs.dim.current < 0.98;

    // Atmosphere
    lerpEnv(refs.env.current, ENVIRONMENTS[refs.envName.current], 1 - Math.exp(-dt * 1.1));
    const env = refs.env.current;
    const dim = refs.dim.current;
    fog.color.copy(env.fog);
    fog.density = (env.fogDensity / Math.max(scale, 0.02)) * Math.pow(dim, 3) * (grow > 0.98 ? 1 : 0.15);
    tmp.bg.copy(roomBg).lerp(env.fog, dim);
    (scene.background as THREE.Color).copy(tmp.bg);
    if (ambient.current) {
      ambient.current.color.copy(env.ambient);
      ambient.current.groundColor.copy(env.waterDeep);
      ambient.current.intensity = env.ambientIntensity * dim + 0.08;
    }
    if (sunLight.current) {
      sunLight.current.position.copy(env.sunDir).multiplyScalar(100).add(WORLD_ORIGIN);
      sunLight.current.color.copy(env.sunColor);
      sunLight.current.intensity = env.sunIntensity * dim;
    }

    // Camera: a base pose (moved by shots) plus the child's look offsets.
    const m = refs.move.current;
    if (m) {
      const p = m.duration <= 0 ? 1 : Math.min(1, (now - m.start) / m.duration);
      const e = ease(p);
      resolve(m.from, scale, tmp.a);
      resolve(m.to, scale, tmp.b);
      basePos.current.copy(tmp.a.pos).lerp(tmp.b.pos, e);
      if (m.arc) basePos.current.y += Math.sin(p * Math.PI) * m.arc * scale;
      lookAt.current.copy(tmp.a.look).lerp(tmp.b.look, e);
      cam.fov = m.from.fov + (m.to.fov - m.from.fov) * e;
      if (p >= 1) {
        refs.move.current = null;
        refs.at.current = m.to;
      }
    } else if (refs.at.current.local) {
      // Hold a story shot while the world is still settling.
      resolve(refs.at.current, scale, tmp.a);
      basePos.current.copy(tmp.a.pos);
      lookAt.current.copy(tmp.a.look);
    }
    const l = refs.look.current;
    if (!l.enabled) {
      // Ease back to the composed shot when exploring is off.
      l.yaw *= 0.92;
      l.pitch *= 0.92;
      l.zoom *= 0.92;
    }
    tmp.dir.copy(lookAt.current).sub(basePos.current);
    const dist = tmp.dir.length();
    tmp.dir.normalize();
    tmp.dir.applyAxisAngle(UP, l.yaw);
    tmp.right.crossVectors(tmp.dir, UP).normalize();
    tmp.dir.applyAxisAngle(tmp.right, -l.pitch);
    cam.position.copy(basePos.current).addScaledVector(tmp.dir, dist * l.zoom);
    tmp.look.copy(cam.position).addScaledVector(tmp.dir, dist * (1 - l.zoom));
    cam.lookAt(tmp.look);
    cam.updateProjectionMatrix();
  });

  return (
    <>
      <hemisphereLight ref={ambient} intensity={0.08} />
      <directionalLight ref={sunLight} intensity={0} />
      <ambientLight intensity={0.06} color="#ffd9b0" />
      <group ref={studyGroup}>{study}</group>
      <group ref={worldGroup}>{world}</group>
    </>
  );
}
