// Al-Infitar (82): a garden of well-made, balanced forms, a great spiral shell,
// a symmetrical leaf in stone and an arch balanced on its own stones (82:7),
// and a table of fruit and water for the Generous (82:6). The events of
// 82:1-4 are not pictured. No person is shown.
import { useMemo } from 'react';
import * as THREE from 'three';
import type { SceneProps } from './index';
import { stopNamed } from './index';
import { beside, mat } from './kit';
import { BreadTable } from './Maun';

export function InfitarScene({ land, stops, hint }: SceneProps) {
  const gifts = stopNamed(stops, 'The Generous');
  const forms = stopNamed(stops, 'Proportioned Form');
  return (
    <group>
      {gifts && <BreadTable position={beside(land, gifts.pos, 4, -2.5)} hint={hint} />}
      {forms && (
        <group>
          <Spiral position={beside(land, forms.pos, 3.5, -2)} />
          <StoneLeaf position={beside(land, forms.pos, 6, -4.5)} />
          <Arch position={beside(land, forms.pos, 3, -7)} />
        </group>
      )}
    </group>
  );
}

/** A spiral shell, its chambers growing by the same ratio each turn. */
function Spiral({ position }: { position: [number, number, number] }) {
  const geo = useMemo(() => {
    class S extends THREE.Curve<THREE.Vector3> {
      constructor() {
        super();
      }
      getPoint(t: number) {
        const a = t * Math.PI * 6;
        const r = 0.08 * Math.exp(0.17 * a);
        return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);
      }
    }
    return new THREE.TubeGeometry(new S(), 240, 0.06, 8, false);
  }, []);
  return (
    <group position={[position[0], position[1] + 1.6, position[2]]} rotation={[0, -0.5, 0]}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#e8d4b8" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.9, 0]} castShadow>
        <boxGeometry args={[0.6, 1.4, 0.6]} />
        <meshStandardMaterial color="#b8ac98" />
      </mesh>
    </group>
  );
}

/** A leaf shape, the same on both sides of its middle vein. */
function StoneLeaf({ position }: { position: [number, number, number] }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.7, 0.4, 0.7, 1.4, 0, 2);
    s.bezierCurveTo(-0.7, 1.4, -0.7, 0.4, 0, 0);
    return new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false });
  }, []);
  const stone = useMemo(() => mat('#9ab08a', 0.6), []);
  return (
    <group position={position} rotation={[0, -0.4, 0]}>
      <mesh geometry={geo} material={stone} position={[0, 0.3, 0]} castShadow />
      <mesh position={[0, 1.3, 0.09]}>
        <boxGeometry args={[0.03, 2, 0.02]} />
        <meshStandardMaterial color="#6a8060" />
      </mesh>
    </group>
  );
}

/** A dry-stone arch: wedge stones that hold each other up. */
function Arch({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => mat('#c8b896'), []);
  const N = 11;
  return (
    <group position={position} rotation={[0, -0.3, 0]}>
      {Array.from({ length: N }, (_, i) => {
        const a = Math.PI - (i / (N - 1)) * Math.PI;
        return (
          <mesh key={i} material={stone} position={[Math.cos(a) * 1.6, 0.4 + Math.sin(a) * 1.6, 0]} rotation={[0, 0, a - Math.PI / 2]} castShadow>
            <boxGeometry args={[0.42, 0.5, 0.5]} />
          </mesh>
        );
      })}
    </group>
  );
}
