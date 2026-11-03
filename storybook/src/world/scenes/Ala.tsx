// Al-A'la (87): a wide field beside the path, fresh green pasture (87:4) that
// dries to dark stubble further on (87:5); the field slowly turns from green to
// dark and grows again. The Fire (87:12) is not pictured. No person is shown.
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Land } from '../terrain';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { rng, type V } from './kit';

export function AlaScene({ land, stops, quality }: SceneProps) {
  const pasture = stopNamed(stops, 'Pasture');
  const stubble = stopNamed(stops, 'Black Stubble');
  const n = Math.round(400 + 800 * quality.vegetation);
  return (
    <group>
      {pasture && <Field land={land} at={pasture.pos} count={n} cycle />}
      {stubble && <Field land={land} at={stubble.pos} count={n} dry />}
    </group>
  );
}

const GREEN = new THREE.Color('#5fa040');
const DRY = new THREE.Color('#d8c070');
const DARK = new THREE.Color('#3a3026');

/** A patch of grass blades. With cycle, its colour runs green, gold, dark, then green again. */
function Field({ land, at, count, cycle, dry }: { land: Land; at: V; count: number; cycle?: boolean; dry?: boolean }) {
  const mesh = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.03, 0.7, 3);
    geo.translate(0, 0.35, 0);
    const m = new THREE.MeshStandardMaterial({ color: dry ? DARK : GREEN, roughness: 0.9 });
    const im = new THREE.InstancedMesh(geo, m, count);
    const r = rng(dry ? 872 : 871);
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const x = at.x + 2.2 + r() * 9;
      const z = at.z + 2 - r() * 9;
      o.position.set(x, land.height(x, z), z);
      o.rotation.set((r() - 0.5) * (dry ? 1.2 : 0.3), r() * 6, (r() - 0.5) * (dry ? 1.2 : 0.3));
      o.scale.set(1, dry ? 0.25 + r() * 0.2 : 0.7 + r() * 0.6, 1);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    }
    return im;
  }, [land, at, count, dry]);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    if (!cycle) return;
    const m = mesh.material as THREE.MeshStandardMaterial;
    const t = (clock.elapsedTime / 40) % 1; // 40-second cycle
    if (t < 0.4) col.copy(GREEN);
    else if (t < 0.65) col.copy(GREEN).lerp(DRY, (t - 0.4) / 0.25);
    else if (t < 0.85) col.copy(DRY).lerp(DARK, (t - 0.65) / 0.2);
    else col.copy(DARK).lerp(GREEN, (t - 0.85) / 0.15);
    m.color.copy(col);
  });
  return <primitive object={mesh} />;
}
