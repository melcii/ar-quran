// Image-based lighting from small CC0 HDRIs (Poly Haven, via @pmndrs/assets),
// decoded from the bundle so nothing is fetched at runtime.
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import night from '@pmndrs/assets/hdri/night.exr';
import sunset from '@pmndrs/assets/hdri/sunset.exr';
import apartment from '@pmndrs/assets/hdri/apartment.exr';
import park from '@pmndrs/assets/hdri/park.exr';

const FILES = { night, sunset, apartment, park } as const;
export type Hdri = keyof typeof FILES;
const cache = new Map<string, THREE.Texture>();

function decode(dataUrl: string) {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function useHdri(name: Hdri, intensity = 1) {
  const { gl, scene } = useThree();
  useEffect(() => {
    let tex = cache.get(name);
    try {
      if (!tex) {
        const loader = new EXRLoader();
        loader.setDataType(THREE.HalfFloatType);
        const d = loader.parse(decode(FILES[name]));
        const eq = new THREE.DataTexture(d.data as unknown as BufferSource as never, d.width, d.height, d.format, d.type);
        eq.mapping = THREE.EquirectangularReflectionMapping;
        eq.colorSpace = THREE.LinearSRGBColorSpace;
        eq.flipY = false;
        eq.needsUpdate = true;
        const pm = new THREE.PMREMGenerator(gl);
        tex = pm.fromEquirectangular(eq).texture;
        pm.dispose();
        eq.dispose();
        cache.set(name, tex);
      }
      scene.environment = tex;
      scene.environmentIntensity = intensity;
    } catch {
      // Without the HDRI the scene keeps its direct lights.
    }
    return () => {
      scene.environment = null;
    };
  }, [gl, scene, name, intensity]);
}
