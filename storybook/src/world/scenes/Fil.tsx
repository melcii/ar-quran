// Al-Fil (105): a dusk desert road. The elephant's tracks lead along the road
// to a single elephant standing still (105:1); flocks of birds wheel over the
// hills (105:3); small stones of baked clay lie in the sand (105:4); and the
// last place is a field of flattened, eaten straw (105:5). No army, person or
// strike is shown: the land only recalls what the surah says.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import type { Land } from '../terrain';

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export function FilScene({ land, stops, quality }: SceneProps) {
  const road = stopNamed(stops, 'The Army Road');
  const birds = stopNamed(stops, 'Flocks of Birds');
  const stones = stopNamed(stops, 'Stones of Clay');
  const straw = stopNamed(stops, 'Eaten Straw');
  const q = quality.vegetation;
  return (
    <group>
      {road && <Tracks land={land} to={road.pos} />}
      {road && <Elephant land={land} near={road.pos} />}
      {birds && <Flocks center={birds.pos} count={Math.round(90 + 150 * q)} />}
      {stones && <ClayStones land={land} center={stones.pos} count={Math.round(60 + 80 * q)} />}
      {straw && <Straw land={land} center={straw.pos} count={Math.round(500 + 1500 * q)} />}
    </group>
  );
}

/** Large round footprints pressed into the sand along the path. */
function Tracks({ land, to }: { land: Land; to: THREE.Vector3 }) {
  const mesh = useMemo(() => {
    const pts: THREE.Vector3[] = [];

    const steps = 46;
    for (let i = 0; i < steps; i++) {
      const t = 0.02 + (i / steps) * 0.3;
      const at = land.path.getPointAt(Math.min(t, 1));
      if (at.distanceTo(to) < 3 && i > 4) break;
      const tan = land.path.getTangentAt(Math.min(t, 1));
      const side = i % 2 ? 0.55 : -0.55;
      pts.push(new THREE.Vector3(at.x + tan.z * side, 0, at.z - tan.x * side));
    }
    const geo = new THREE.CircleGeometry(0.32, 18);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#7a5434', roughness: 1, transparent: true, opacity: 0.55, depthWrite: false }), pts.length);
    const o = new THREE.Object3D();
    pts.forEach((p, i) => {
      o.position.set(p.x, land.height(p.x, p.z) + 0.03, p.z);
      o.scale.set(1, 1, 1.15);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.receiveShadow = true;
    return m;
  }, [land, to]);
  return <primitive object={mesh} />;
}

/** One elephant standing quietly beside the road, built from simple shapes. */
function Elephant({ land, near }: { land: Land; near: THREE.Vector3 }) {
  const x = near.x + 4.2;
  const z = near.z - 2.5;
  // Sink a little so all four feet meet sloping sand.
  const y = land.height(x, z) - 0.25;
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8d8a86', roughness: 0.92 }), []);
  const tusk = useMemo(() => new THREE.MeshStandardMaterial({ color: '#efe6d0', roughness: 0.5 }), []);
  const trunk = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.6, 0.35),
      new THREE.Vector3(0, -1.3, 0.4),
      new THREE.Vector3(0, -1.75, 0.65),
    ]);
    return new THREE.TubeGeometry(curve, 20, 0.17, 10, false);
  }, []);
  const ear = useMemo(() => {
    const g = new THREE.CircleGeometry(0.75, 20);
    g.scale(0.8, 1, 1);
    return g;
  }, []);
  const tail = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (tail.current) tail.current.rotation.z = Math.sin(t * 1.6) * 0.25;
    if (head.current) head.current.rotation.y = Math.sin(t * 0.4) * 0.12;
  });
  const leg = (lx: number, lz: number) => (
    <mesh key={`${lx}${lz}`} material={skin} position={[lx, 0.85, lz]} castShadow>
      <cylinderGeometry args={[0.32, 0.36, 1.7, 14]} />
    </mesh>
  );
  return (
    <group position={[x, y, z]} rotation={[0, -Math.PI / 2.4, 0]}>
      <mesh material={skin} position={[0, 2.25, 0]} scale={[1.25, 1.1, 1.75]} castShadow receiveShadow>
        <sphereGeometry args={[1, 28, 20]} />
      </mesh>
      {leg(-0.65, 0.95)}
      {leg(0.65, 0.95)}
      {leg(-0.65, -0.95)}
      {leg(0.65, -0.95)}
      <group ref={head} position={[0, 2.75, 1.75]}>
        <mesh material={skin} scale={[0.85, 0.85, 0.8]} castShadow>
          <sphereGeometry args={[1, 24, 18]} />
        </mesh>
        <mesh material={skin} geometry={trunk} position={[0, -0.2, 0.62]} castShadow />
        <mesh geometry={ear} position={[0.78, 0.05, -0.15]} rotation={[0, Math.PI / 2.6, 0]} castShadow>
          <meshStandardMaterial color="#86817c" side={THREE.DoubleSide} roughness={0.95} />
        </mesh>
        <mesh geometry={ear} position={[-0.78, 0.05, -0.15]} rotation={[0, -Math.PI / 2.6, 0]} castShadow>
          <meshStandardMaterial color="#86817c" side={THREE.DoubleSide} roughness={0.95} />
        </mesh>
        <mesh material={tusk} position={[0.32, -0.55, 0.62]} rotation={[0.9, 0, -0.15]}>
          <coneGeometry args={[0.07, 0.75, 10]} />
        </mesh>
        <mesh material={tusk} position={[-0.32, -0.55, 0.62]} rotation={[0.9, 0, 0.15]}>
          <coneGeometry args={[0.07, 0.75, 10]} />
        </mesh>
        <mesh position={[0.36, 0.22, 0.68]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color="#1c1814" />
        </mesh>
        <mesh position={[-0.36, 0.22, 0.68]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color="#1c1814" />
        </mesh>
      </group>
      <mesh ref={tail} material={skin} position={[0, 2.3, -1.75]}>
        <cylinderGeometry args={[0.04, 0.03, 1.1, 6]} />
      </mesh>
    </group>
  );
}

/** Flocks of small dark birds wheeling over the hills, each flock on its own loop. */
function Flocks({ center, count }: { center: THREE.Vector3; count: number }) {
  const flocks = 6;
  const { mesh, birds } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // A simple bird: two wing triangles meeting at the body.
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.25, -0.7, 0.05, -0.05, 0, 0, -0.25, 0, 0, 0.25, 0, 0, -0.25, 0.7, 0.05, -0.05], 3));
    g.computeVertexNormals();
    const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: '#2a221c', side: THREE.DoubleSide, roughness: 0.8 }), count);
    m.frustumCulled = false;
    const r = rng(105);
    const birds = Array.from({ length: count }, (_, i) => ({
      flock: i % flocks,
      off: new THREE.Vector3((r() - 0.5) * 7, (r() - 0.5) * 3, (r() - 0.5) * 7),
      phase: r() * Math.PI * 2,
      size: 0.45 + r() * 0.35,
    }));
    return { mesh: m, birds };
  }, [count]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    birds.forEach((b, i) => {
      const f = b.flock;
      const a = t * (0.12 + f * 0.015) + (f * Math.PI * 2) / flocks;
      const R = 16 + f * 4;
      const cx = center.x + Math.cos(a) * R;
      const cz = center.z - 14 + Math.sin(a) * R;
      const cy = center.y + 14 + f * 1.6 + Math.sin(t * 0.5 + f) * 1.5;
      o.position.set(cx + b.off.x, cy + b.off.y, cz + b.off.z);
      o.rotation.set(0, -a, Math.sin(t * 9 + b.phase) * 0.6);
      o.scale.setScalar(b.size);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <primitive object={mesh} />;
}

/** Small stones of baked clay lying in the sand around the place. */
function ClayStones({ land, center, count }: { land: Land; center: THREE.Vector3; count: number }) {
  const mesh = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.09, 0);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#9c5a3a', roughness: 0.95 }), count);
    const r = rng(1054);
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const d = 1.2 + r() * 6;
      const x = center.x + Math.cos(a) * d;
      const z = center.z + Math.sin(a) * d;
      o.position.set(x, land.height(x, z) + 0.05, z);
      o.rotation.set(r() * 3, r() * 3, r() * 3);
      o.scale.setScalar(0.7 + r() * 0.9);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, [land, center, count]);
  return <primitive object={mesh} />;
}

/** A field of pale straw, flattened and broken, "like eaten straw" (105:5). */
function Straw({ land, center, count }: { land: Land; center: THREE.Vector3; count: number }) {
  const mesh = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.012, 0.02, 0.9, 4, 1);
    geo.translate(0, 0.45, 0);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#c9b27a', roughness: 1 }), count);
    const r = rng(1055);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 9;
      const x = center.x + Math.cos(a) * d;
      const z = center.z + Math.sin(a) * d;
      if (land.pathDistance(x, z) < 1.4) {
        o.scale.setScalar(0);
      } else {
        // Most stalks lie flat or snapped; a few still stand.
        const lying = r() < 0.8;
        o.scale.set(1, 0.4 + r() * 0.9, 1);
        o.rotation.set(lying ? 1.2 + r() * 0.35 : r() * 0.3, r() * Math.PI * 2, 0);
      }
      o.position.set(x, land.height(x, z) + 0.02, z);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.setHSL(0.11 + r() * 0.03, 0.35 + r() * 0.2, 0.45 + r() * 0.2));
    }
    m.receiveShadow = true;
    return m;
  }, [land, center, count]);
  return <primitive object={mesh} />;
}
