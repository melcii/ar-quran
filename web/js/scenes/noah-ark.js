// The Ark of Prophet Nuh (Surah Hud 11:36-44), as a colorful low-poly scene for children.
import * as THREE from 'three';
import { box, ball, leg, mesh, mat, jitter, createLightOfProphet } from '../lowpoly.js';

const COLORS = {
  calmSky: new THREE.Color(0x9fd8ff),
  stormSky: new THREE.Color(0x4a5878),
  calmSea: new THREE.Color(0x2f9ae0),
  stormSea: new THREE.Color(0x1f4f7a),
  whiteCloud: new THREE.Color(0xffffff),
  stormCloud: new THREE.Color(0x5c6475),
};

const lerp = (a, b, t) => a + (b - a) * t;

// ---------- Animals (each faces +x, with its feet at y = 0) ----------

function eyes(group, x, y, spread, size = 0.06) {
  group.add(box(size, size, size, 0x1d1730, x, y, spread));
  group.add(box(size, size, size, 0x1d1730, x, y, -spread));
}

function elephant() {
  const g = new THREE.Group();
  const grey = 0x9aa3b5;
  g.add(box(1.0, 0.65, 0.7, grey, 0, 0.72, 0));
  for (const [x, z] of [[0.32, 0.2], [0.32, -0.2], [-0.32, 0.2], [-0.32, -0.2]]) g.add(leg(0.11, 0.42, grey, x, 0.21, z));
  g.add(box(0.45, 0.45, 0.45, grey, 0.62, 0.86, 0));
  g.add(box(0.08, 0.42, 0.36, 0xc4a9c4, 0.52, 0.88, 0.33));
  g.add(box(0.08, 0.42, 0.36, 0xc4a9c4, 0.52, 0.88, -0.33));
  const trunk = mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.5, 5), grey, 0.9, 0.6, 0);
  trunk.rotation.z = 0.25;
  g.add(trunk);
  eyes(g, 0.85, 0.96, 0.13);
  g.add(leg(0.03, 0.25, grey, -0.55, 0.65, 0));
  return g;
}

function giraffe() {
  const g = new THREE.Group();
  const yellow = 0xffc94a;
  const brown = 0xa8622a;
  for (const [x, z] of [[0.22, 0.12], [0.22, -0.12], [-0.22, 0.12], [-0.22, -0.12]]) g.add(leg(0.05, 0.66, yellow, x, 0.33, z));
  g.add(box(0.66, 0.38, 0.34, yellow, 0, 0.85, 0));
  const neck = box(0.16, 0.8, 0.16, yellow, 0.33, 1.28, 0);
  neck.rotation.z = -0.3;
  g.add(neck);
  g.add(box(0.34, 0.18, 0.18, yellow, 0.52, 1.7, 0));
  g.add(leg(0.025, 0.12, brown, 0.44, 1.84, 0.05));
  g.add(leg(0.025, 0.12, brown, 0.44, 1.84, -0.05));
  for (const [x, y] of [[-0.18, 0.92], [0.05, 0.8], [0.2, 0.95], [-0.05, 0.98]]) {
    g.add(box(0.1, 0.08, 0.02, brown, x, y, 0.175));
    g.add(box(0.1, 0.08, 0.02, brown, x, y, -0.175));
  }
  eyes(g, 0.6, 1.76, 0.09, 0.05);
  return g;
}

function lion(withMane) {
  const g = new THREE.Group();
  const orange = 0xf6b042;
  for (const [x, z] of [[0.22, 0.13], [0.22, -0.13], [-0.22, 0.13], [-0.22, -0.13]]) g.add(leg(0.07, 0.3, orange, x, 0.15, z));
  g.add(box(0.7, 0.36, 0.38, orange, 0, 0.48, 0));
  if (withMane) g.add(mesh(new THREE.DodecahedronGeometry(0.3), 0xa8541c, 0.38, 0.7, 0));
  g.add(box(0.3, 0.3, 0.3, orange, 0.5, 0.7, 0));
  g.add(box(0.06, 0.06, 0.08, 0x5a2a1a, 0.66, 0.66, 0));
  eyes(g, 0.65, 0.76, 0.08, 0.05);
  const tail = leg(0.025, 0.4, orange, -0.42, 0.56, 0);
  tail.rotation.z = 0.7;
  g.add(tail);
  g.add(ball(0.06, 0xa8541c, -0.56, 0.7, 0));
  return g;
}

function sheep() {
  const g = new THREE.Group();
  for (const [x, z] of [[0.15, 0.1], [0.15, -0.1], [-0.15, 0.1], [-0.15, -0.1]]) g.add(leg(0.035, 0.24, 0x3a3a48, x, 0.12, z));
  const wool = ball(0.28, 0xfdfbf3, 0, 0.42, 0);
  wool.scale.set(1.25, 0.9, 1);
  g.add(wool);
  g.add(box(0.2, 0.22, 0.18, 0x3a3a48, 0.33, 0.52, 0));
  g.add(box(0.06, 0.04, 0.14, 0x3a3a48, 0.28, 0.6, 0.14));
  g.add(box(0.06, 0.04, 0.14, 0x3a3a48, 0.28, 0.6, -0.14));
  eyes(g, 0.43, 0.56, 0.06, 0.04);
  return g;
}

function camel() {
  const g = new THREE.Group();
  const tan = 0xd9a05b;
  for (const [x, z] of [[0.25, 0.12], [0.25, -0.12], [-0.25, 0.12], [-0.25, -0.12]]) g.add(leg(0.05, 0.62, tan, x, 0.31, z));
  g.add(box(0.76, 0.34, 0.36, tan, 0, 0.78, 0));
  const hump = ball(0.22, tan, -0.02, 0.98, 0);
  hump.scale.set(1.1, 0.8, 0.8);
  g.add(hump);
  const neck = box(0.14, 0.5, 0.14, tan, 0.45, 0.98, 0);
  neck.rotation.z = -0.5;
  g.add(neck);
  g.add(box(0.3, 0.15, 0.15, tan, 0.62, 1.2, 0));
  eyes(g, 0.68, 1.26, 0.08, 0.045);
  return g;
}

function bird(color) {
  const g = new THREE.Group();
  const body = ball(0.12, color, 0, 0.12, 0);
  body.scale.set(1.3, 1, 1);
  g.add(body);
  g.add(ball(0.08, color, 0.13, 0.22, 0));
  const beak = mesh(new THREE.ConeGeometry(0.03, 0.08, 4), 0xff9a2e, 0.23, 0.22, 0);
  beak.rotation.z = -Math.PI / 2;
  g.add(beak);
  eyes(g, 0.18, 0.25, 0.05, 0.025);
  const wings = [];
  for (const side of [1, -1]) {
    const wing = new THREE.Group();
    wing.position.set(0, 0.16, 0.1 * side);
    wing.add(box(0.16, 0.02, 0.14, color, 0, 0, 0.07 * side));
    g.add(wing);
    wings.push({ wing, side });
  }
  g.userData.flap = (time) => {
    for (const { wing, side } of wings) wing.rotation.x = Math.sin(time * 14) * 0.6 * side;
  };
  return g;
}

// ---------- The Ark ----------

function buildArk() {
  const ark = new THREE.Group();

  // A box bent into a boat shape: narrower at the keel, with the bow and stern swept upward.
  const hullGeo = new THREE.BoxGeometry(8, 1.6, 3, 8, 2, 2);
  const pos = hullGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const up = (y + 0.8) / 1.6;
    z *= (0.5 + 0.5 * up) * (1 - Math.max(0, Math.abs(x) - 2.5) / 1.5 * 0.75);
    if (up < 0.5) x *= 0.8;
    if (up > 0.5) y += Math.max(0, Math.abs(x) - 2.5) ** 2 * 0.3;
    pos.setXYZ(i, x, y, z);
  }
  hullGeo.computeVertexNormals();
  ark.add(mesh(hullGeo, 0x9b5a2e));

  ark.add(box(5.6, 0.12, 2.75, 0xd9a066, 0, 0.82, 0));
  for (const side of [1, -1]) {
    ark.add(box(5.4, 0.14, 0.08, 0x6e3b1c, 0, 0.98, 1.42 * side));
    ark.add(box(5.6, 0.08, 0.04, 0x6e3b1c, 0, 0.35, 1.31 * side));
  }

  // Cabin with a red pitched roof.
  ark.add(box(2.6, 1.2, 1.9, 0xf0c27e, 0, 1.48, 0));
  const roofShape = new THREE.Shape([new THREE.Vector2(-1.2, 0), new THREE.Vector2(1.2, 0), new THREE.Vector2(0, 0.8)]);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 2.9, bevelEnabled: false });
  roofGeo.translate(0, 0, -1.45);
  const roof = mesh(roofGeo, 0xd8553a, 0, 2.08, 0);
  roof.rotation.y = Math.PI / 2;
  ark.add(roof);
  for (const x of [-0.75, 0, 0.75]) {
    ark.add(box(0.36, 0.32, 0.04, 0x5a3a22, x, 1.62, 0.96));
    ark.add(box(0.36, 0.32, 0.04, 0x5a3a22, x, 1.62, -0.96));
  }
  ark.add(box(0.04, 0.72, 0.56, 0x5a3a22, 1.31, 1.24, 0));

  // Two of every kind.
  const animals = [];
  const place = (model, x, z, turn, scale) => {
    model.position.set(x, 0.88, z);
    model.rotation.y = turn;
    model.scale.setScalar(scale);
    model.userData.phase = Math.random() * Math.PI * 2;
    ark.add(model);
    animals.push(model);
  };
  place(giraffe(), 1.95, 0.95, 0.3, 0.62);
  place(giraffe(), 2.0, -0.95, -0.3, 0.56);
  place(elephant(), 2.55, 0.42, 0.5, 0.58);
  place(elephant(), 2.55, -0.42, -0.5, 0.52);
  place(lion(true), -1.75, 0.75, Math.PI - 0.6, 0.62);
  place(lion(false), -1.75, -0.75, Math.PI + 0.6, 0.56);
  place(camel(), -2.45, 0.5, Math.PI - 0.4, 0.6);
  place(camel(), -2.45, -0.5, Math.PI + 0.4, 0.55);
  place(sheep(), 0.7, 1.16, 0.2, 0.62);
  place(sheep(), -0.2, 1.16, -0.1, 0.56);

  const birds = [bird(0x5ec8f2), bird(0xff7aa8)];
  birds[0].position.set(0.5, 2.86, 0);
  birds[1].position.set(-0.3, 2.86, 0);
  birds[1].rotation.y = Math.PI;
  birds.forEach((b) => { b.userData.phase = Math.random() * 10; ark.add(b); });

  // Prophet Nuh, shown only as light, standing at the cabin door.
  const light = createLightOfProphet(1.3);
  light.position.set(1.65, 0.88, 0);
  ark.add(light);

  return { ark, animals, birds, light };
}

// ---------- Mount al-Judi: a flat-topped mountain hidden under the flood ----------

function buildJudi() {
  const judi = new THREE.Group();
  judi.add(mesh(jitter(new THREE.CylinderGeometry(5.2, 9.5, 6, 9, 2), 0.5, 7), 0x8d6b4f, 0, -3.15, 0));
  judi.add(mesh(new THREE.CylinderGeometry(5.3, 5.3, 0.3, 9), 0x7cc35a, 0, -0.15, 0));
  for (const [x, z, h] of [[-7, -5, 7], [-3, -8, 9], [4, -7.5, 6], [8, -3, 5]]) {
    judi.add(mesh(jitter(new THREE.ConeGeometry(3, h, 6), 0.4, h), 0x6f8f4a, x, h / 2 - 4.5, z));
  }
  for (const [x, z] of [[-2.6, 3.4], [2.8, 3.2], [-3.4, -3.0], [1.2, -3.8], [3.9, -2.2]]) {
    judi.add(leg(0.08, 0.4, 0x7a4a26, x, 0.2, z));
    judi.add(mesh(new THREE.ConeGeometry(0.42, 0.9, 6), 0x3fa34d, x, 0.82, z));
  }
  return judi;
}

// ---------- Weather ----------

function buildClouds() {
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 });
  const field = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const cloud = new THREE.Group();
    const puffs = 3 + Math.floor(Math.random() * 3);
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + Math.random() * 0.8, 0), material);
      puff.position.set(p * 1.3 - puffs * 0.6, Math.random() * 0.5, Math.random() - 0.5);
      cloud.add(puff);
    }
    const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
    const radius = 10 + Math.random() * 22;
    cloud.position.set(Math.cos(angle) * radius, 11 + Math.random() * 4, Math.sin(angle) * radius);
    cloud.rotation.y = Math.random() * Math.PI;
    field.add(cloud);
  }
  return { field, material };
}

function buildRain() {
  const count = 1400;
  const positions = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 40;
    const y = Math.random() * 18;
    const z = (Math.random() - 0.5) * 40;
    positions.set([x, y, z, x + 0.08, y + 0.7, z], i * 6);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0 });
  return new THREE.LineSegments(geometry, material);
}

// ---------- Scene ----------

export function createScene({ scene, camera, controls }) {
  scene.background = COLORS.calmSky.clone();
  scene.fog = new THREE.Fog(scene.background, 35, 130);

  camera.position.set(7.5, 4, 9);
  controls.target.set(0, 0.4, 0);
  controls.minDistance = 6;
  controls.maxDistance = 32;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x557799, 1.2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d0, 2.2);
  sun.position.set(10, 18, 8);
  scene.add(sun);

  const sunDisc = new THREE.Mesh(
    new THREE.IcosahedronGeometry(4, 1),
    new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, fog: false }),
  );
  sunDisc.position.set(40, 34, -70);
  scene.add(sunDisc);

  const seaGeo = new THREE.PlaneGeometry(160, 160, 64, 64);
  seaGeo.rotateX(-Math.PI / 2);
  const seaBase = Float32Array.from(seaGeo.attributes.position.array);
  const seaMat = new THREE.MeshStandardMaterial({ color: COLORS.calmSea.clone(), flatShading: true, roughness: 0.6 });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  scene.add(sea);

  const judi = buildJudi();
  scene.add(judi);

  const { ark, animals, birds, light } = buildArk();
  scene.add(ark);

  const clouds = buildClouds();
  scene.add(clouds.field);

  const rain = buildRain();
  scene.add(rain);

  let flash = 0;

  const wave = (x, z, t, amp) => amp * 0.5 * (Math.sin(x * 0.35 + t * 1.3) + Math.cos(z * 0.4 + t * 1.1));

  function update(t, dt, { storm, judi: rest }) {
    const amp = lerp(0.25, 1.1, storm) * (1 - rest * 0.8);
    const seaLevel = lerp(0, -2.2, rest);

    // Sea waves.
    const p = seaGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = seaBase[i * 3];
      const z = seaBase[i * 3 + 2];
      p.setY(i, seaLevel + wave(x, z, t, amp));
    }
    p.needsUpdate = true;
    seaMat.color.lerpColors(COLORS.calmSea, COLORS.stormSea, storm);

    // Al-Judi rises out of the water as the flood goes down, until the Ark rests on top of it.
    judi.position.y = lerp(-7.5, -0.5, rest);

    // The Ark floats on the waves, rocking more in the storm, and is still once it has landed.
    const rock = (1 - rest) * (1 + storm * 3);
    ark.position.y = 0.3 + (1 - rest) * wave(0, 0, t, amp) * 0.7;
    ark.rotation.z = Math.sin(t * 1.3) * 0.035 * rock;
    ark.rotation.x = Math.cos(t * 1.1) * 0.03 * rock;

    // Happy animals hop when it is calm, and huddle down during the storm.
    for (const a of animals) {
      const hop = Math.max(0, Math.sin(t * 3 + a.userData.phase));
      a.position.y = 0.88 + hop * 0.12 * (1 - storm);
    }
    for (const b of birds) {
      const flying = Math.sin(t * 0.7 + b.userData.phase) > 0.6 && storm < 0.5;
      b.position.y = 2.86 + (flying ? 0.15 : 0);
      if (flying) b.userData.flap(t);
    }
    light.userData.update(t, camera);

    // Sky, clouds, sun and rain follow the weather.
    scene.background.lerpColors(COLORS.calmSky, COLORS.stormSky, storm);
    scene.fog.color.copy(scene.background);
    clouds.material.color.lerpColors(COLORS.whiteCloud, COLORS.stormCloud, storm);
    clouds.field.rotation.y += dt * (0.01 + storm * 0.04);
    clouds.field.position.y = lerp(0, -2, storm);
    sunDisc.material.opacity = 1 - storm;
    sun.intensity = lerp(2.2, 0.5, storm);

    rain.visible = storm > 0.02;
    rain.material.opacity = storm * 0.55;
    if (rain.visible) {
      const r = rain.geometry.attributes.position;
      for (let i = 0; i < r.count; i += 2) {
        let y = r.getY(i) - dt * 18;
        if (y < -1) y += 18;
        r.setY(i, y);
        r.setY(i + 1, y + 0.7);
      }
      r.needsUpdate = true;
    }

    // A soft flash of lightning now and then during the storm.
    if (storm > 0.7 && Math.random() < dt * 0.2) flash = 1;
    flash = Math.max(0, flash - dt * 3);
    hemi.intensity = lerp(1.2, 0.6, storm) + flash * 2.5;
  }

  return {
    note: 'The glowing light is Prophet Nuh. We show prophets as light, never as people.',
    chapters: [
      {
        ref: 'Surah Hud 11:40',
        title: 'Two of every kind',
        text: 'Allah told Prophet Nuh to bring into the Ark two of every kind of animal, together with the people who believed.',
        state: { storm: 0, judi: 0 },
      },
      {
        ref: 'Surah Hud 11:42',
        title: 'Waves like mountains',
        text: 'Rain poured down and the water rose higher and higher. The Ark sailed safely through waves as tall as mountains.',
        state: { storm: 1, judi: 0 },
      },
      {
        ref: 'Surah Hud 11:44',
        title: 'Resting on al-Judi',
        text: 'Then the earth swallowed its water and the sky held back its rain. The Ark came to rest on the mountain of al-Judi.',
        state: { storm: 0, judi: 1 },
      },
    ],
    update,
  };
}
