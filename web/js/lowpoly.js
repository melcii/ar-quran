// Small helpers for building colorful, flat-shaded low-poly models from simple shapes.
import * as THREE from 'three';

const materials = new Map();

export function mat(color) {
  if (!materials.has(color)) {
    materials.set(color, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85 }));
  }
  return materials.get(color);
}

export function mesh(geometry, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, mat(color));
  m.position.set(x, y, z);
  return m;
}

export function box(w, h, d, color, x, y, z) {
  return mesh(new THREE.BoxGeometry(w, h, d), color, x, y, z);
}

export function ball(r, color, x, y, z, detail = 0) {
  return mesh(new THREE.IcosahedronGeometry(r, detail), color, x, y, z);
}

export function leg(r, h, color, x, y, z) {
  return mesh(new THREE.CylinderGeometry(r, r * 0.85, h, 5), color, x, y, z);
}

// Nudges every vertex a little so shapes look hand-made instead of perfectly smooth.
export function jitter(geometry, amount, seed = 1) {
  const pos = geometry.attributes.position;
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647 - 0.5;
  };
  // Vertices that share a position must move together, or the surface tears open.
  const offsets = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!offsets.has(key)) offsets.set(key, [rand() * amount, rand() * amount, rand() * amount]);
    const [dx, dy, dz] = offsets.get(key);
    pos.setXYZ(i, pos.getX(i) + dx, pos.getY(i) + dy, pos.getZ(i) + dz);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function glowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,240,180,0.85)');
  g.addColorStop(0.6, 'rgba(255,210,110,0.25)');
  g.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// A prophet is never shown as a person. Instead they appear as a gentle, glowing light:
// a bright core, a soft halo, a column of light and slowly turning rays.
export function createLightOfProphet(height = 1.6) {
  const group = new THREE.Group();
  const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.16 * height, 1),
    new THREE.MeshBasicMaterial({ color: 0xfff6d8 }),
  );
  core.position.y = height * 0.55;
  group.add(core);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffe9a8, ...additive }));
  halo.scale.setScalar(height * 1.4);
  halo.position.y = core.position.y;
  group.add(halo);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * height, 0.32 * height, height * 2.2, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe08a, opacity: 0.12, side: THREE.DoubleSide, ...additive }),
  );
  beam.position.y = height * 1.1;
  group.add(beam);

  const rays = new THREE.Group();
  rays.position.y = core.position.y;
  const rayMaterial = new THREE.MeshBasicMaterial({ color: 0xffd36b, opacity: 0.35, side: THREE.DoubleSide, ...additive });
  for (let i = 0; i < 8; i++) {
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(0.06 * height, height * 1.1), rayMaterial);
    ray.rotation.z = (i / 8) * Math.PI;
    rays.add(ray);
  }
  group.add(rays);

  const light = new THREE.PointLight(0xffd98a, 6, height * 6, 1.5);
  light.position.y = core.position.y;
  group.add(light);

  group.userData.update = (time, camera) => {
    const pulse = 1 + Math.sin(time * 2.2) * 0.08;
    halo.scale.setScalar(height * 1.4 * pulse);
    core.scale.setScalar(pulse);
    // Keep the rays facing the viewer so they always read as a shining star.
    rays.quaternion.copy(camera.quaternion);
    rays.rotateZ(time * 0.4);
    light.intensity = 5 + Math.sin(time * 2.2) * 1;
  };
  return group;
}
