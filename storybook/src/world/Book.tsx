// The Quran on the rehal: leather covers, page blocks, the two open pages and
// one turning leaf. Arabic binding: the spine is on the right of the closed
// book, so reading forward turns the left page over onto the right.
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { BOOK } from '@/three/Study';
import { grainBump, leatherTexture, pageEdgeTexture } from '@/three/textures';

const { W, H, T, spread: A } = { ...BOOK, spread: BOOK.spread };
const HALF = T / 2;
const COVER = 0.006;
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Rotation of a hinged half: 0 = lying on the left, 1 = lying on the right. */
const turn = (p: number) => -A + (-Math.PI + 2 * A) * ease(Math.min(1, Math.max(0, p)));

/** A copy of a page texture flipped for a face that is seen from the other side. */
function flipped(t: THREE.Texture | null, x: boolean, y: boolean) {
  if (!t) return null;
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(x ? -1 : 1, y ? -1 : 1);
  c.offset.set(x ? 1 : 0, y ? 1 : 0);
  c.needsUpdate = true;
  return c;
}

export type Leaf = {
  /** 0 → 1 while turning forward, 1 → 0 while turning back. */
  progress: MutableRefObject<number>;
  /** The face that is up while the leaf lies on the left. */
  front: THREE.Texture | null;
  /** The face that is up while the leaf lies on the right. */
  back: THREE.Texture | null;
  visible: boolean;
};

export function Book({
  open,
  right,
  left,
  leaf,
  onForward,
  onBack,
  onTap,
}: {
  open: MutableRefObject<number>;
  right: THREE.Texture | null;
  left: THREE.Texture | null;
  leaf: Leaf;
  onForward?: () => void;
  onBack?: () => void;
  onTap?: () => void;
}) {
  const leather = useMemo(() => leatherTexture(), []);
  const bump = useMemo(() => grainBump(), []);
  const edges = useMemo(() => pageEdgeTexture(), []);
  const front = useRef<THREE.Group>(null);
  const leafGroup = useRef<THREE.Group>(null);
  const rightMapped = useMemo(() => flipped(right, true, true), [right]);
  const leafBack = useMemo(() => flipped(leaf.back, true, false), [leaf.back]);
  const leafGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(W - 0.004, H - 0.004, 24, 1);
    g.rotateX(-Math.PI / 2);
    g.translate(-W / 2, 0, 0);
    return g;
  }, []);
  const base = useMemo(() => (leafGeo.attributes.position.array as Float32Array).slice(), [leafGeo]);

  useFrame(() => {
    if (front.current) front.current.rotation.z = turn(open.current);
    const p = leaf.progress.current;
    if (leafGroup.current) {
      leafGroup.current.rotation.z = turn(p);
      // Sit just above whichever page the leaf lies on: the hinge flips its local "up".
      leafGroup.current.position.y = 0.0016 * Math.cos(Math.PI * Math.min(1, Math.max(0, p)));
    }
    // The leaf lifts and bends in the middle of its turn.
    const lift = Math.sin(Math.min(1, Math.max(0, p)) * Math.PI);
    const pos = leafGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      const t = -base[i] / W;
      pos[i + 1] = base[i + 1] + Math.sin(t * Math.PI) * 0.06 * lift - t * t * 0.02 * lift;
    }
    leafGeo.attributes.position.needsUpdate = true;
    leafGeo.computeVertexNormals();
  });

  const tap = (fn?: () => void) => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return;
    e.stopPropagation();
    (fn ?? onTap)?.();
  };

  const coverMat = <meshPhysicalMaterial map={leather} bumpMap={bump} bumpScale={0.8} roughness={0.62} sheen={0.4} sheenRoughness={0.6} sheenColor="#6b7d5c" clearcoat={0.15} clearcoatRoughness={0.6} />;
  const edgeMat = <meshStandardMaterial map={edges} roughness={0.9} />;
  const paper = (map: THREE.Texture | null) => <meshStandardMaterial map={map ?? undefined} color={map ? '#ffffff' : '#efe4c8'} roughness={0.88} />;

  return (
    <group position={BOOK.position}>
      {/* Left half: back cover, page block and the left page. */}
      <group rotation-z={-A} onClick={tap(onForward)}>
        <mesh position={[-W / 2, COVER / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W + 0.012, COVER, H + 0.012]} />
          {coverMat}
        </mesh>
        <mesh position={[-W / 2, COVER + (HALF - COVER) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, HALF - COVER, H]} />
          {edgeMat}
        </mesh>
        <mesh position={[-W / 2, HALF + 0.0005, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[W - 0.004, H - 0.004]} />
          {paper(left)}
        </mesh>
      </group>

      {/* Right half, hinged at the spine: it opens like the cover of the closed book. */}
      <group position={[0, HALF, 0]}>
        <group ref={front} onClick={tap(onBack)}>
          <mesh position={[-W / 2, HALF - COVER / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[W + 0.012, COVER, H + 0.012]} />
            {coverMat}
          </mesh>
          <mesh position={[-W / 2, (HALF - COVER) / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[W, HALF - COVER, H]} />
            {edgeMat}
          </mesh>
          <mesh position={[-W / 2, -0.0005, 0]} rotation-x={Math.PI / 2} receiveShadow>
            <planeGeometry args={[W - 0.004, H - 0.004]} />
            {paper(rightMapped)}
          </mesh>
        </group>
        <group ref={leafGroup} visible={leaf.visible} position={[0, 0.0016, 0]}>
          <mesh geometry={leafGeo} castShadow>
            <meshStandardMaterial map={leaf.front ?? undefined} roughness={0.88} side={THREE.FrontSide} />
          </mesh>
          <mesh geometry={leafGeo}>
            <meshStandardMaterial map={leafBack ?? undefined} roughness={0.88} side={THREE.BackSide} />
          </mesh>
        </group>
      </group>

      {/* Spine and ribbon */}
      <mesh position={[0, HALF, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[HALF, HALF, H + 0.012, 20, 1, true, Math.PI, Math.PI]} />
        {coverMat}
      </mesh>
      <mesh position={[0.012, HALF + 0.002, H / 2 + 0.05]} rotation-x={-Math.PI / 2 + 0.35}>
        <planeGeometry args={[0.012, 0.14]} />
        <meshStandardMaterial color="#7b2230" roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
