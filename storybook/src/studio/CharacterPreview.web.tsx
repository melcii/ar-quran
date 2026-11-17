// A turntable preview of the explorer figure the game uses, for the
// Character Studio. Same figure and materials as the dressing room.
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Explorer } from '@/profile/Explorer';
import type { Look } from '@/profile/look';
import { SoftShapes } from '@/three/soft';

export default function CharacterPreview({ look, size = 300 }: { look: Look; size?: number }) {
  return (
    <div style={{ width: size, height: size * 1.2, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2ddd2' }} data-testid="character-preview">
      <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 40, position: [0.9, 1.25, 3.4] }} gl={{ preserveDrawingBuffer: true }}>
        <SoftShapes />
        <color attach="background" args={['#e9d9b8']} />
        <hemisphereLight args={['#fff4dc', '#8a6a44', 0.9]} />
        <directionalLight position={[2.5, 4, 3]} intensity={2.2} color="#ffe2b0" castShadow />
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[1.4, 40]} />
          <meshStandardMaterial color="#c9b48e" />
        </mesh>
        <Explorer look={look} lantern={false} />
        <OrbitControls target={[0, 0.75, 0]} enablePan={false} minDistance={1.3} maxDistance={4.5} />
      </Canvas>
    </div>
  );
}
