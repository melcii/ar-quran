// The explorer lineup: the ready-made explorers side by side in warm outdoor
// light like the worlds', for checking the figure from every side and every
// animation. Test hooks on globalThis.__lineup.
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as THREE from 'three';
import { SoftShapes } from '@/three/soft';
import { Explorer, type Anim } from './Explorer';
import { PRESETS } from './look';

type ViewName = 'three' | 'front' | 'side' | 'back' | 'face' | 'faces' | 'low';

function Cam({ view, focus, n }: { view: ViewName; focus: number; n: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const x = focus < 0 ? 0 : (focus - (n - 1) / 2) * 1.1;
    const d = focus < 0 ? 6.2 : 2.6;
    const at = new THREE.Vector3(x, focus < 0 ? 0.85 : 0.9, 0);
    const pos = {
      three: new THREE.Vector3(x + d * 0.55, 1.35, d * 0.85),
      front: new THREE.Vector3(x, 1.1, d),
      side: new THREE.Vector3(x + d, 1.1, 0.01),
      back: new THREE.Vector3(x - d * 0.35, 1.25, -d),
      face: new THREE.Vector3(x + 0.25, 1.48, 0.95),
      faces: new THREE.Vector3(x, 1.45, d * 0.62),
      low: new THREE.Vector3(x + d * 0.4, 0.45, d * 0.8),
    }[view];
    if (view === 'face') at.set(x, 1.42, 0);
    if (view === 'faces') at.set(x, 1.35, 0);
    camera.position.copy(pos);
    camera.lookAt(at);
  }, [camera, view, focus, n]);
  return null;
}

export default function Lineup() {
  const [view, setView] = useState<ViewName>('three');
  const [focus, setFocus] = useState(-1);
  const [anim, setAnimS] = useState<Anim>('idle');
  const animRef = useRef<Anim>('idle');
  const [yaw, setYaw] = useState(0);
  const [list, setList] = useState(PRESETS);
  useEffect(() => {
    (globalThis as Record<string, unknown>).__lineup = {
      view: (v: ViewName) => setView(v),
      focus: (i: number) => setFocus(i),
      anim: (a: Anim) => {
        animRef.current = a;
        setAnimS(a);
      },
      yaw: (y: number) => setYaw(y),
      set: (i: number, patch: Record<string, unknown>) => setList((l) => l.map((p, k) => (k === i ? { ...p, look: { ...p.look, ...patch } } : p))),
      ready: true,
    };
  }, []);
  void anim;
  return (
    <View style={{ flex: 1, height: '100%' as never, backgroundColor: '#cfd8ee' }}>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 35, position: [3, 1.4, 5] }} style={{ position: 'absolute', inset: 0 } as never} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}>
        <SoftShapes />
        <color attach="background" args={['#c6cdea']} />
        <fog attach="fog" args={['#e9c7ae', 9, 26]} />
        <hemisphereLight args={['#c4cdf5', '#6c7a3e', 1.15]} />
        <directionalLight position={[-3.5, 4.2, 4.5]} intensity={3.1} color="#ffd29a" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} shadow-normalBias={0.03} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={4} shadow-camera-bottom={-2} />
        <directionalLight position={[4, 2.5, -3]} intensity={0.9} color="#b9b2e6" />
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[30, 48]} />
          <meshStandardMaterial color="#7aa24a" roughness={1} />
        </mesh>
        <Cam view={view} focus={focus} n={list.length} />
        {list.map((p, i) => (
          <group key={p.name} position={[(i - (list.length - 1) / 2) * 1.1, 0, 0]} rotation-y={yaw} visible={focus < 0 || focus === i}>
            <Explorer look={p.look} anim={animRef} lantern={false} />
          </group>
        ))}
      </Canvas>
    </View>
  );
}
