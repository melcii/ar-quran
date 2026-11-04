// The explorer, rebuilt: a jointed figure (hips, spine, chest, neck, head;
// shoulders, elbows, wrists; hips, knees, ankles) with a sculpted head,
// eyes that look and blink, brows and a mouth that show feeling, layered
// hair, woven clothes and hands that grip. Animation comes from pose.ts.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { motion, player, weather } from '@/ark/shared';
import type { Look } from '../look';
import { cue } from './cue';
import { flare, headGeo, lathe, limb, strand } from './geo';
import { buildHair, hairline, Surf } from './hair';
import { blushMap, clothMat, freckleMap, hairMat, irisMap, knitMap, leatherMat, shade, skinMat } from './mats';
import { Animator, type Anim, type Ch, type Gesture, type Pose } from './pose';

const V = THREE.Vector3;
const R = 0.2; // head radius

const BUILD = { little: { s: 0.92, head: 1.07, limb: 0.97 }, middle: { s: 1.0, head: 1, limb: 1 }, older: { s: 1.09, head: 0.95, limb: 1.04 } };

type Parts = ReturnType<typeof makeParts>;

function makeParts(look: Look) {
  const geos: THREE.BufferGeometry[] = [];
  const g = <T extends THREE.BufferGeometry>(x: T) => (geos.push(x), x);
  const mats: THREE.Material[] = [];
  const m = <T extends THREE.Material>(x: T) => (mats.push(x), x);

  const head = g(headGeo(R, look.faceShape));
  const S = new Surf(head);
  const hat = look.head === 'sunhat' || look.head === 'cap' || look.head === 'woolhat';
  const hijab = look.head === 'hijab';
  const hair = hijab ? null : buildHair(look.hair, head, S, hat);
  if (hair) {
    geos.push(hair.cap);
    if (hair.locks) geos.push(hair.locks);
    if (hair.coil) geos.push(hair.coil);
    hair.sway.forEach((s) => geos.push(s.geo));
  }

  const raincoat = look.outer === 'raincoat';
  const M = {
    skin: m(skinMat(look.skin)),
    lip: m(new THREE.MeshStandardMaterial({ color: new THREE.Color(shade(look.skin, -0.2)).lerp(new THREE.Color('#9a3a30'), 0.35), roughness: 0.5 })),
    hair: m(hairMat(look.hairColor)),
    brow: m(new THREE.MeshStandardMaterial({ color: shade(look.hairColor, -0.04), roughness: 0.8 })),
    top: m(clothMat(look.topColor, look.pattern)),
    topPlain: m(clothMat(look.topColor)),
    bottom: m(clothMat(look.bottomColor, 'plain', { rough: 0.9 })),
    outer: raincoat ? m(new THREE.MeshPhysicalMaterial({ color: look.outerColor, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 })) : m(clothMat(look.outerColor, 'plain', { rough: 0.85, sheen: 0.4 })),
    headwear: look.head === 'woolhat' || look.head === 'scarf' ? m(new THREE.MeshStandardMaterial({ map: knitMap(look.headColor), color: knitMap(look.headColor) ? '#ffffff' : look.headColor, roughness: 0.95 })) : m(clothMat(look.headColor, 'plain', { sheen: 0.7 })),
    headwear2: null as unknown as THREE.Material,
    trim: m(new THREE.MeshStandardMaterial({ color: shade(look.headColor, -0.08), roughness: 0.85 })),
    shoe: m(leatherMat(look.shoesColor)),
    sole: m(new THREE.MeshStandardMaterial({ color: '#3a2c22', roughness: 0.9 })),
    welly: m(new THREE.MeshPhysicalMaterial({ color: look.shoesColor, roughness: 0.3, clearcoat: 0.8 })),
    pack: m(clothMat(look.packColor, 'plain', { rough: 0.92, sheen: 0.3 })),
    strap: m(leatherMat('#5a3a26')),
    roll: m(clothMat('#e6d2a6', 'stripes', { repeat: [2, 1] })),
    white: m(new THREE.MeshPhysicalMaterial({ color: '#fbf7f2', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 })),
    iris: m(new THREE.MeshPhysicalMaterial({ map: irisMap(look.eyes), color: irisMap(look.eyes) ? '#ffffff' : look.eyes, roughness: 0.15, clearcoat: 1, transparent: true })),
    lash: m(new THREE.MeshStandardMaterial({ color: shade(look.hairColor, -0.1), roughness: 0.7 })),
    mouthIn: m(new THREE.MeshStandardMaterial({ color: '#6a2a24', roughness: 0.8 })),
    tongue: m(new THREE.MeshStandardMaterial({ color: '#d0706a', roughness: 0.6 })),
    teeth: m(new THREE.MeshStandardMaterial({ color: '#fbf6ee', roughness: 0.4 })),
    blush: m(new THREE.MeshBasicMaterial({ map: blushMap(), transparent: true, depthWrite: false, opacity: blushMap() ? 1 : 0, polygonOffset: true, polygonOffsetFactor: -4 })),
    freckle: m(new THREE.MeshBasicMaterial({ map: freckleMap(look.skin), transparent: true, depthWrite: false, opacity: freckleMap(look.skin) ? 1 : 0, polygonOffset: true, polygonOffsetFactor: -4 })),
    frame: m(new THREE.MeshStandardMaterial({ color: '#3a2a1e', metalness: 0.35, roughness: 0.45 })),
    lens: m(new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 0, transparent: true, opacity: 0.12, roughness: 0.05, clearcoat: 1 })),
    clip: m(new THREE.MeshStandardMaterial({ color: '#e8b04a', roughness: 0.45 })),
    clipCentre: m(new THREE.MeshStandardMaterial({ color: '#c8503a', roughness: 0.5 })),
    brass: m(new THREE.MeshStandardMaterial({ color: '#b08a40', metalness: 0.6, roughness: 0.4 })),
    glass: m(new THREE.MeshStandardMaterial({ color: '#ffd58a', emissive: '#ffb050', emissiveIntensity: 2.4 })),
    button: m(new THREE.MeshStandardMaterial({ color: '#e8dcc0', roughness: 0.4 })),
  };

  M.headwear2 = m(M.headwear.clone());
  M.headwear2.side = THREE.DoubleSide;
  M.hair.side = THREE.FrontSide;

  // Places on the face, read from the sculpted head.
  const eyeDir = (s: number) => new V(s * 0.36, 0.02, 0.93).normalize();
  const eyeR = 0.05;
  const eyeAt = (s: number) => {
    const d = eyeDir(s);
    const p = S.at(Math.atan2(d.x, d.z), Math.acos(d.y));
    return p.add(d.clone().multiplyScalar(-eyeR * 0.74));
  };
  const browPts = (s: number) => {
    const arch = { soft: 0.6, straight: 0.15, arched: 1.25, thick: 0.6 }[look.brows];
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const a = s * (0.16 + t * 0.36);
      const th = 1.28 - (0.04 + Math.sin(t * Math.PI) * 0.035 * arch) - (look.brows === 'straight' ? -t * 0.02 : 0);
      pts.push(S.at(a, th, 0.006));
    }
    return pts;
  };
  const browR = look.brows === 'thick' ? 0.012 : 0.0085;
  const brows = [1, -1].map((s) => g(strand(browPts(s), browR * 1.15, browR * 0.55, { flat: 0.45, sides: 6, ease: 1.2 })));
  const nose = S.at(0, 1.72, 0.012);
  const mouthC = S.at(0, 2.02, 0.004);
  const mouthPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = (i / 8) * 2 - 1;
    mouthPts.push(new V(t * 0.05, t * t * 0.014, -t * t * 0.016));
  }
  const smileGeo = g(strand(mouthPts, 0.0065, 0.0065, { flat: 0.6, sides: 6 }));
  const openGeo = g(new THREE.CircleGeometry(0.03, 20, Math.PI, Math.PI));
  const cheek = (s: number) => S.at(s * 0.6, 1.88, 0.004);
  const ear = (s: number) => S.at(s * 1.57, 1.6, -0.01);

  // Body shapes.
  const L = BUILD[look.build].limb;
  const thigh = g(limb(0.072 * L, 0.056 * L, 0.3, 0.1));
  const shin = g(limb(0.055 * L, 0.044 * L, 0.28, 0.12));
  const upper = g(limb(0.05 * L, 0.044 * L, 0.22, 0.08));
  const fore = g(limb(0.044 * L, 0.036 * L, 0.2, 0.08));
  const sleeveUp = g(limb(0.058 * L, 0.052 * L, 0.22, 0.06));
  const sleeveFore = g(limb(0.052 * L, 0.05 * L, 0.18, 0.04));
  const outerUp = g(limb(0.066 * L, 0.06 * L, 0.22, 0.05));
  const outerFore = g(limb(0.06 * L, 0.058 * L, 0.18, 0.03));
  const legUp = g(limb(0.08 * L, 0.064 * L, 0.3, 0.08));
  const legLow = g(limb(0.064 * L, 0.056 * L, 0.27, 0.05));
  const abdomen = g(lathe([[0.07, -0.13], [0.15, -0.11], [0.168, -0.03], [0.162, 0.08], [0.155, 0.2]], { zScale: 0.74 }));
  const chest = g(lathe([[0.152, -0.07], [0.163, 0.03], [0.172, 0.11], [0.155, 0.17], [0.1, 0.205], [0.052, 0.215]], { zScale: 0.72 }));
  const pelvis = g(lathe([[0.05, -0.1], [0.14, -0.085], [0.163, -0.01], [0.16, 0.09]], { zScale: 0.76 }));
  const neck = g(limb(0.048, 0.052, 0.1, 0));
  const collar = g(new THREE.TorusGeometry(0.06, 0.016, 8, 24));
  const cuff = g(new THREE.TorusGeometry(0.05 * L, 0.009, 6, 18));
  const palm = g(new THREE.SphereGeometry(0.036, 14, 10));
  const fingers = g(limb(0.031, 0.024, 0.045, 0.05, 0.5));
  const index = g(limb(0.011, 0.009, 0.05, 0));
  const thumb = g(limb(0.012, 0.01, 0.035, 0));

  // Clothing silhouettes.
  const longTop = look.top === 'tunic' || look.top === 'dress';
  const skirtLen = look.top === 'dress' ? 0.56 : look.top === 'tunic' ? 0.3 : 0;
  const hem = look.top === 'shirt' ? g(flare(0.162, 0.172, 0.08, { waves: 0 })) : g(flare(0.165, look.top === 'dress' ? 0.34 : 0.25, skirtLen, { waves: 7 }));
  const skirt = look.bottom === 'skirt' && look.top !== 'dress' ? g(flare(0.158, 0.32, 0.6, { waves: 8 })) : null;
  const outerOpen = look.outer === 'vest' ? 0.75 : look.outer === 'jacket' ? 0.32 : 0.06;
  const outerChest = look.outer === 'none' ? null : g(lathe([[0.168, -0.07], [0.178, 0.03], [0.186, 0.11], [0.17, 0.17], [0.118, 0.205], [0.08, 0.215]], { zScale: 0.76, phiStart: outerOpen / 2, phiLength: Math.PI * 2 - outerOpen }));
  const outerBelly = look.outer === 'none' ? null : g(lathe([[0.17, -0.13], [0.18, -0.03], [0.176, 0.08], [0.17, 0.2]], { zScale: 0.78, phiStart: outerOpen / 2, phiLength: Math.PI * 2 - outerOpen }));
  const outerHem = look.outer === 'raincoat' ? g(flare(0.18, 0.27, 0.34, { waves: 5, open: outerOpen })) : look.outer === 'jacket' ? g(flare(0.18, 0.19, 0.08, { open: outerOpen })) : null;
  const lapel = look.outer === 'jacket' || look.outer === 'vest' ? [1, -1].map((s) => g(strand([new V(s * 0.05, 0.21, 0.08), new V(s * 0.085, 0.14, 0.12), new V(s * 0.07, 0.03, 0.13)], 0.022, 0.012, { flat: 0.3, sides: 6 }))) : [];
  const hood = look.outer === 'raincoat' && !hijab ? g(new THREE.SphereGeometry(0.15, 20, 14, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.4)) : null;

  // Shoes: a rounded foot shape with a sole; boots add a shaft.
  const shoeTop = g(new THREE.SphereGeometry(0.066, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.62));
  shoeTop.scale(0.92, 0.95, 1.6);
  const sole = g(lathe([[0.001, -0.012], [0.062, -0.01], [0.066, 0.0], [0.06, 0.012]], { sides: 24 }));
  sole.scale(0.95, 1, 1.62);
  const shaftH = { boots: 0.1, shoes: 0, sandboots: 0.08, wellies: 0.2 }[look.shoes];
  const shaft = shaftH ? g(limb(0.058, 0.056, shaftH, 0)) : null;

  // Hijab: a shell over the head with the face open, a soft edge and a drape over the shoulders.
  let hijabShell: THREE.BufferGeometry | null = null;
  let hijabEdge: THREE.BufferGeometry | null = null;
  let hijabDrape: THREE.BufferGeometry | null = null;
  if (hijab) {
    const shell = head.clone();
    const p = shell.attributes.position;
    const v = new V();
    const inFace = (a: number, th: number) => (a / 0.95) ** 2 + ((th - 1.5) / 0.78) ** 2 < 1;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const l = v.length();
      const th = Math.acos(v.y / l);
      const k = 1.1 + 0.05 * Math.max(0, -Math.cos(th)) + 0.03 * (1 - th / Math.PI);
      p.setXYZ(i, v.x * k, v.y * k, v.z * k);
    }
    const idx = shell.index!;
    const keepIdx: number[] = [];
    const c = new V();
    for (let i = 0; i < idx.count; i += 3) {
      c.set(0, 0, 0);
      for (let j = 0; j < 3; j++) c.add(v.fromBufferAttribute(p, idx.getX(i + j)));
      c.multiplyScalar(1 / 3);
      const a = Math.atan2(c.x, c.z);
      const th = Math.acos(c.y / c.length());
      if (!inFace(a, th)) keepIdx.push(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
    }
    shell.setIndex(keepIdx);
    shell.computeVertexNormals();
    hijabShell = g(shell);
    const edge: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const u = (i / 40) * Math.PI * 2;
      const a = Math.sin(u) * 0.95;
      const th = 1.5 - Math.cos(u) * 0.78;
      edge.push(S.at(a, th).multiplyScalar(1.1 + 0.05 * Math.max(0, -Math.cos(th)) + 0.03 * (1 - th / Math.PI)));
    }
    hijabEdge = g(strand(edge, 0.012, 0.012, { sides: 6, cap: false }));
    hijabDrape = g(flare(0.12, 0.27, 0.27, { waves: 6, zScale: 0.85 }));
  }

  // Bags.
  const packBox = g(new RoundedBoxGeometry(0.25, 0.29, 0.12, 3, 0.04));
  const packPocket = g(new RoundedBoxGeometry(0.17, 0.11, 0.05, 2, 0.02));
  const packStraps = [1, -1].map((s) => g(strand([new V(s * 0.08, 0.15, -0.11), new V(s * 0.1, 0.205, -0.03), new V(s * 0.11, 0.17, 0.11), new V(s * 0.1, 0.0, 0.135), new V(s * 0.09, -0.12, 0.12)], 0.016, 0.016, { flat: 0.3, sides: 6 })));
  const rollGeo = g(new THREE.CapsuleGeometry(0.055, 0.22, 6, 14));
  const satchelStrap = g(strand([new V(0.1, 0.205, -0.02), new V(0.03, 0.12, 0.13), new V(-0.1, -0.04, 0.13), new V(-0.17, -0.2, 0.06)], 0.012, 0.012, { flat: 0.3, sides: 6 }));
  const satchelBag = g(new RoundedBoxGeometry(0.06, 0.15, 0.19, 2, 0.02));

  // Head things.
  const ringG = g(new THREE.TorusGeometry(0.052, 0.006, 6, 24));
  const temple = [1, -1].map((s) => g(strand([new V(s * 0.125, 0.0, 0.17), new V(s * 0.19, 0.005, 0.07), new V(s * 0.2, -0.01, -0.03)], 0.005, 0.005, { sides: 5 })));
  const brim = g(lathe([[0.001, 0], [0.2, 0.0], [0.3, -0.02], [0.36, -0.05]], { sides: 36 }));
  const dome = g(new THREE.SphereGeometry(0.218, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2));
  const capBrim = g(lathe([[0.12, 0], [0.2, -0.008]], { sides: 24, phiStart: -1, phiLength: 2 }));
  const fold = g(new THREE.TorusGeometry(0.212, 0.03, 10, 30));
  const pom = g(new THREE.SphereGeometry(0.06, 14, 10));
  const scarfRing = g(new THREE.TorusGeometry(0.075, 0.035, 10, 24));
  const scarfTail = g(strand([new V(0.05, 0, 0.08), new V(0.07, -0.08, 0.12), new V(0.06, -0.2, 0.13)], 0.03, 0.026, { flat: 0.35, sides: 7 }));
  const petal = g(new THREE.SphereGeometry(0.014, 8, 6));

  return { geos, mats, M, head, S, hair, hat, hijab, eyeAt, eyeDir, eyeR, brows, nose, mouthC, smileGeo, openGeo, cheek, ear, thigh, shin, upper, fore, sleeveUp, sleeveFore, outerUp, outerFore, legUp, legLow, abdomen, chest, pelvis, neck, collar, cuff, palm, fingers, index, thumb, hem, skirt, outerChest, outerBelly, outerHem, lapel, hood, shoeTop, sole, shaft, shaftH, hijabShell, hijabEdge, hijabDrape, packBox, packPocket, packStraps, rollGeo, satchelStrap, satchelBag, ringG, temple, brim, dome, capBrim, fold, pom, scarfRing, scarfTail, petal, longTop };
}

type J = Record<string, THREE.Object3D | null>;

/** A hand at the wrist: palm, four fingers as one gently cupped piece, a pointing finger and a thumb. */
function Hand({ P, s, j }: { P: Parts; s: number; j: J }) {
  const k = s > 0 ? 'L' : 'R';
  return (
    <group>
      <mesh geometry={P.palm} material={P.M.skin} position-y={-0.032} scale={[0.62, 1.12, 1]} castShadow />
      <group ref={(o) => void (j[`fing${k}`] = o)} position={[0, -0.06, 0.004]}>
        <mesh geometry={P.fingers} material={P.M.skin} scale={[0.62 / 0.5, 1, 1]} rotation-y={Math.PI / 2} />
      </group>
      <group ref={(o) => void (j[`idx${k}`] = o)} position={[0, -0.06, 0.022]}>
        <mesh geometry={P.index} material={P.M.skin} />
      </group>
      <group position={[-s * 0.012, -0.03, 0.03]} rotation={[0.7, 0, -s * 0.35]}>
        <mesh geometry={P.thumb} material={P.M.skin} />
      </group>
    </group>
  );
}

function Arm({ P, s, j, look, withLantern, light }: { P: Parts; s: number; j: J; look: Look; withLantern: boolean; light: React.RefObject<THREE.PointLight | null> }) {
  const k = s > 0 ? 'L' : 'R';
  const coat = look.outer === 'jacket' || look.outer === 'raincoat';
  return (
    <group ref={(o) => void (j[`sh${k}`] = o)} position={[s * 0.165, 0.15, -0.005]}>
      <mesh geometry={coat ? P.outerUp : P.sleeveUp} material={coat ? P.M.outer : P.M.top} castShadow />
      <group ref={(o) => void (j[`el${k}`] = o)} position-y={-0.22}>
        <mesh geometry={coat ? P.outerFore : P.sleeveFore} material={coat ? P.M.outer : P.M.top} castShadow />
        <mesh geometry={P.cuff} material={coat ? P.M.outer : P.M.topPlain} position-y={-0.178} rotation-x={Math.PI / 2} />
        <mesh geometry={P.fore} material={P.M.skin} position-y={-0.02} scale={[0.92, 0.95, 0.92]} />
        <group ref={(o) => void (j[`wr${k}`] = o)} position-y={-0.2}>
          <Hand P={P} s={s} j={j} />
          {s < 0 && withLantern && (
            <group ref={(o) => void (j.lantern = o)} position={[0, -0.075, 0.02]}>
              <mesh material={P.M.brass} position-y={-0.02}>
                <torusGeometry args={[0.03, 0.006, 6, 14]} />
              </mesh>
              <group ref={(o) => void (j.lanternBody = o)}>
                <mesh material={P.M.brass} position-y={-0.075}>
                  <coneGeometry args={[0.055, 0.04, 12]} />
                </mesh>
                <mesh material={P.M.glass} position-y={-0.13}>
                  <cylinderGeometry args={[0.042, 0.05, 0.1, 12]} />
                </mesh>
                <mesh material={P.M.brass} position-y={-0.185}>
                  <cylinderGeometry args={[0.052, 0.055, 0.015, 12]} />
                </mesh>
                <pointLight ref={light} color="#ffb860" intensity={1} distance={7} decay={1.6} position-y={-0.13} />
              </group>
            </group>
          )}
        </group>
      </group>
    </group>
  );
}

function Leg({ P, s, j, look }: { P: Parts; s: number; j: J; look: Look }) {
  const k = s > 0 ? 'L' : 'R';
  const wellies = look.shoes === 'wellies';
  return (
    <group ref={(o) => void (j[`th${k}`] = o)} position={[s * 0.088, -0.035, 0]}>
      <mesh geometry={P.legUp} material={P.M.bottom} castShadow />
      <group ref={(o) => void (j[`kn${k}`] = o)} position-y={-0.3}>
        <mesh geometry={P.legLow} material={P.M.bottom} castShadow />
        <group ref={(o) => void (j[`an${k}`] = o)} position-y={-0.28}>
          {P.shaft && <mesh geometry={P.shaft} material={wellies ? P.M.welly : P.M.shoe} position-y={P.shaftH! - 0.015} castShadow />}
          <mesh geometry={P.shoeTop} material={wellies ? P.M.welly : P.M.shoe} position={[0, -0.075, 0.035]} castShadow />
          <mesh geometry={P.sole} material={P.M.sole} position={[0, -0.075, 0.035]} />
          {look.shoes === 'sandboots' && (
            <mesh material={P.M.sole} position={[0, -0.0, 0.05]} rotation-x={-0.5}>
              <torusGeometry args={[0.03, 0.004, 4, 10, Math.PI]} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

function Eye({ P, s, j, look }: { P: Parts; s: number; j: J; look: Look }) {
  const k = s > 0 ? 'L' : 'R';
  const at = P.eyeAt(s);
  const d = P.eyeDir(s);
  const shape = { round: [1, 1.1, 1], almond: [1.16, 0.86, 1], wide: [1.12, 1.16, 1], gentle: [1.06, 0.94, 1] }[look.eyeShape] as [number, number, number];
  const tilt = { round: 0, almond: 0.16, wide: 0.03, gentle: -0.12 }[look.eyeShape] * s;
  const r = P.eyeR;
  const q = new THREE.Quaternion().setFromUnitVectors(new V(0, 0, 1), new V(d.x * 0.55, 0, 1).normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  return (
    <group position={at} rotation={[e.x, e.y, tilt]} scale={shape}>
      {/* Squashed for blinking and squinting; the lash line closes with it. */}
      <group ref={(o) => void (j[`lid${k}`] = o)}>
        <mesh material={P.M.white}>
          <sphereGeometry args={[r, 28, 20]} />
        </mesh>
        <group ref={(o) => void (j[`eye${k}`] = o)}>
          <mesh material={P.M.iris} position-z={r * 0.8} scale={[1, 1, 0.5]}>
            <sphereGeometry args={[r * 0.68, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
        <mesh material={P.M.lash} position-z={r * 0.18} scale={[1.02, 1.0, 1]}>
          <torusGeometry args={[r * 0.985, r * 0.1, 6, 28, Math.PI]} />
        </mesh>
        <mesh material={P.M.lash} position={[s * r * 0.92, r * 0.28, r * 0.35]} rotation={[0, 0, s * 0.6]}>
          <coneGeometry args={[r * 0.1, r * 0.42, 6]} />
        </mesh>
      </group>
    </group>
  );
}

function Head({ P, j, look }: { P: Parts; j: J; look: Look }) {
  const hairOn = !!P.hair;
  const blushQ = (p: THREE.Vector3) => new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new V(0, 0, 1), p.clone().normalize()));
  return (
    <group>
      <mesh geometry={P.head} material={P.M.skin} castShadow />
      <Eye P={P} s={1} j={j} look={look} />
      <Eye P={P} s={-1} j={j} look={look} />
      <group ref={(o) => void (j.brows = o)}>
        {P.brows.map((b, i) => (
          <mesh key={i} geometry={b} material={P.M.brow} />
        ))}
      </group>
      {/* Nose: a small soft button. */}
      <mesh material={P.M.skin} position={P.nose} scale={[1.05, 0.85, 0.85]}>
        <sphereGeometry args={[0.021, 14, 10]} />
      </mesh>
      {/* Mouth: a smile line that deepens, and an open smile for big joy. */}
      <group position={P.mouthC} rotation-x={-0.25}>
        <group ref={(o) => void (j.smile = o)}>
          <mesh geometry={P.smileGeo} material={P.M.lip} />
        </group>
        <group ref={(o) => void (j.open = o)} position={[0, 0.006, 0.002]} visible={false}>
          <mesh geometry={P.openGeo} material={P.M.mouthIn} />
          <mesh material={P.M.tongue} position={[0, -0.018, 0.001]} scale={[1, 0.5, 1]}>
            <circleGeometry args={[0.018, 14]} />
          </mesh>
          <mesh material={P.M.teeth} position={[0, -0.003, 0.002]} scale={[1, 0.18, 1]}>
            <circleGeometry args={[0.024, 14, Math.PI, Math.PI]} />
          </mesh>
        </group>
      </group>
      {look.blush &&
        [1, -1].map((s) => {
          const p = P.cheek(s);
          return (
            <mesh key={s} material={P.M.blush} position={p} rotation={blushQ(p)}>
              <planeGeometry args={[0.075, 0.05]} />
            </mesh>
          );
        })}
      {look.freckles && (
        <mesh material={P.M.freckle} position={P.S.at(0, 1.78, 0.006)} rotation={blushQ(P.S.at(0, 1.78))}>
          <planeGeometry args={[0.17, 0.07]} />
        </mesh>
      )}
      {/* Ears. */}
      {!P.hijab &&
        [1, -1].map((s) => (
          <group key={s} position={P.ear(s)} rotation-y={s * 0.25}>
            <mesh material={P.M.skin} scale={[0.4, 0.75, 0.6]}>
              <sphereGeometry args={[0.05, 14, 10]} />
            </mesh>
            <mesh material={P.M.lip} position={[s * 0.008, 0, 0.004]} scale={[0.25, 0.55, 0.4]}>
              <sphereGeometry args={[0.05, 12, 8]} />
            </mesh>
          </group>
        ))}
      {hairOn && (
        <group>
          <mesh geometry={P.hair!.cap} material={P.M.hair} castShadow />
          {P.hair!.locks && <mesh geometry={P.hair!.locks} material={P.M.hair} castShadow />}
          {P.hair!.coil && <mesh geometry={P.hair!.coil} material={P.M.hair} castShadow />}
          {P.hair!.ties.map((t, i) => (
            <mesh key={i} material={P.M.clip} position={t.at} rotation={blushQ(t.at)}>
              <torusGeometry args={[t.r, t.r * 0.35, 8, 16]} />
            </mesh>
          ))}
          {P.hair!.sway.map((s, i) => (
            <group key={i} ref={(o) => void (j[`sway${i}`] = o)} position={s.pivot}>
              <mesh geometry={s.geo} material={P.M.hair} position={s.pivot.clone().negate()} castShadow />
            </group>
          ))}
        </group>
      )}
      {look.hairClip && !P.hijab && !P.hat && (
        <group position={P.S.at(0.75, 0.75, 0.04)} rotation={blushQ(P.S.at(0.75, 0.75))}>
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={i} geometry={P.petal} material={P.M.clip} position={[Math.cos((i / 5) * Math.PI * 2) * 0.016, Math.sin((i / 5) * Math.PI * 2) * 0.016, 0]} scale={[1, 1, 0.5]} />
          ))}
          <mesh geometry={P.petal} material={P.M.clipCentre} scale={0.7} position-z={0.004} />
        </group>
      )}
      {P.hijab && (
        <group>
          <mesh geometry={P.hijabShell!} material={P.M.headwear} castShadow />
          <mesh geometry={P.hijabEdge!} material={P.M.trim} />
        </group>
      )}
      {look.glasses && (
        <group>
          {[1, -1].map((s) => {
            const p = P.eyeAt(s).add(P.eyeDir(s).multiplyScalar(P.eyeR * 1.35));
            return (
              <group key={s} position={p} rotation-y={s * 0.25}>
                <mesh geometry={P.ringG} material={P.M.frame} />
                <mesh material={P.M.lens}>
                  <circleGeometry args={[0.05, 20]} />
                </mesh>
              </group>
            );
          })}
          <mesh material={P.M.frame} position={P.S.at(0, 1.5, 0.03)} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.005, 0.005, 0.05, 5]} />
          </mesh>
          {P.temple.map((t, i) => (
            <mesh key={i} geometry={t} material={P.M.frame} position-y={P.eyeAt(1).y} />
          ))}
        </group>
      )}
      <HeadWear P={P} look={look} />
    </group>
  );
}

function HeadWear({ P, look }: { P: Parts; look: Look }) {
  const top = P.S.at(0, 0).y;
  if (look.head === 'sunhat')
    return (
      <group position-y={top - 0.07} rotation-x={-0.08}>
        <mesh geometry={P.brim} material={P.M.headwear2} position-y={-0.005} castShadow />
        <mesh geometry={P.dome} material={P.M.headwear} scale={[1.02, 0.62, 1.05]} castShadow />
        <mesh material={P.M.strap} position-y={0.025}>
          <cylinderGeometry args={[0.222, 0.222, 0.035, 28, 1, true]} />
        </mesh>
      </group>
    );
  if (look.head === 'cap')
    return (
      <group position-y={top - 0.115} rotation-x={-0.1}>
        <mesh geometry={P.dome} material={P.M.headwear} scale={[1.03, 0.82, 1.06]} castShadow />
        <mesh geometry={P.capBrim} material={P.M.headwear2} scale={[1.1, 1, 1.3]} />
        <mesh material={P.M.headwear} position-y={0.18}>
          <sphereGeometry args={[0.018, 8, 6]} />
        </mesh>
      </group>
    );
  if (look.head === 'woolhat')
    return (
      <group position-y={top - 0.12} rotation-x={-0.1}>
        <mesh geometry={P.dome} material={P.M.headwear} scale={[1.04, 0.95, 1.07]} castShadow />
        <mesh geometry={P.fold} material={P.M.headwear} rotation-x={Math.PI / 2} position-y={0.02} scale={[1.04, 1.07, 1]} />
        <mesh geometry={P.pom} material={P.M.headwear} position-y={0.22} />
      </group>
    );
  return null;
}

/**
 * The explorer figure. `follow` walks with the player in a world (reading
 * gestures from the shared cue); otherwise it stands at the origin and plays
 * `anim`, read every frame so the dressing room can change it.
 */
export function Figure({ look, follow, anim, lantern: withLantern = true, onReady }: { look: Look; follow?: boolean; anim?: { current: Anim }; lantern?: boolean; onReady?: (api: { play: (g: Gesture) => void }) => void }) {
  const key = JSON.stringify(look);
  const P = useMemo(() => makeParts(look), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => (P.geos.forEach((x) => x.dispose()), P.mats.forEach((x) => x.dispose())), [P]);
  const j = useRef<J>({}).current;
  const root = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const A = useMemo(() => new Animator(), []);
  const st = useRef({ last: new V(), vel: new V(), yaw: 0, lastAnim: '' as string, lastCue: 0, init: false });
  useEffect(() => {
    onReady?.({ play: (g) => A.play(g) });
  }, [A, onReady]);
  const B = BUILD[look.build];
  const hips0 = 0.7;

  useFrame((state, rawDt) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(0.05, rawDt);
    const s = st.current;
    const reduced = motion.reduced;
    let base: 'idle' | 'move' | 'sit' = 'idle';
    let speed = 0;
    let runK = 0;
    let yawRate = 0;
    let accel: [number, number] = [0, 0];
    let holding = false;
    let leading = false;
    const a = anim?.current ?? 'idle';
    if (follow) {
      g.position.copy(player.pos);
      let d = player.yaw - g.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const turn = d * Math.min(1, dt * 12);
      g.rotation.y += turn;
      yawRate = dt > 0 ? turn / dt : 0;
      speed = player.speed;
      runK = Math.max(0, Math.min(1, (player.speed - 4.2) / 2.5));
      base = speed > 0.15 ? 'move' : cue.sitting ? 'sit' : 'idle';
      holding = cue.holding;
      leading = cue.leading;
      if (cue.at !== s.lastCue && cue.gesture) {
        s.lastCue = cue.at;
        A.play(cue.gesture);
      }
      // Acceleration in the body's frame, for hair and cloth.
      const v = new V().subVectors(player.pos, s.last).multiplyScalar(s.init && dt > 0 ? 1 / dt : 0);
      const dv = v.clone().sub(s.vel).multiplyScalar(dt > 0 ? 1 / dt : 0);
      s.vel.lerp(v, Math.min(1, dt * 10));
      s.last.copy(player.pos);
      s.init = true;
      const c = Math.cos(g.rotation.y);
      const sn = Math.sin(g.rotation.y);
      accel = [Math.max(-8, Math.min(8, dv.x * sn + dv.z * c)), Math.max(-8, Math.min(8, dv.x * c - dv.z * sn))];
    } else {
      if (a === 'walk') (base = 'move'), (speed = 1.3);
      else if (a === 'run') (base = 'move'), (speed = 5.5), (runK = 1);
      else if (a === 'sit') base = 'sit';
      else if (a === 'turn') yawRate = Math.sin(state.clock.elapsedTime * 0.8) * 1.6;
      holding = a === 'carry';
      leading = a === 'guide';
      if (a === 'guide') (base = 'move'), (speed = 1.1);
      if (a !== s.lastAnim) {
        s.lastAnim = a;
        if (a === 'wave' || a === 'point' || a === 'cheer' || a === 'interact' || a === 'adjust') A.play(a, true);
        else if (a === 'pickup' || a === 'place') A.play(a, true);
        else A.g = null;
      }
    }
    const p = A.update(dt, { speed, run: runK, yawRate, accel, base, holding, leading, reduced });
    apply(p, j, A, hips0, P, reduced);
    if (j.lantern) {
      j.lantern.rotation.x = -(p.elRX ?? 0) - (p.shRX ?? 0) - (p.wrRX ?? 0) + A.pack.x * 2;
      j.lantern.rotation.z = -(p.shRZ ?? 0) * 0.9;
    }
    if (light.current) {
      const want = !follow ? 0.4 : player.inside || weather.storm > 0.3 ? 1 : 0.15;
      light.current.intensity += (want * 6 - light.current.intensity) * Math.min(1, dt * 2);
    }
  });

  const pack = look.pack;
  return (
    <group ref={root} scale={B.s}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} renderOrder={1}>
        <circleGeometry args={[0.42, 28]} />
        <meshBasicMaterial color="#1a1208" transparent opacity={0.26} depthWrite={false} />
      </mesh>
      <group ref={(o) => void (j.hips = o)} position-y={hips0}>
        <mesh geometry={P.pelvis} material={P.M.bottom} castShadow />
        <Leg P={P} s={1} j={j} look={look} />
        <Leg P={P} s={-1} j={j} look={look} />
        {/* Hanging cloth from the waist sways with the springs. */}
        <group ref={(o) => void (j.skirt = o)} position-y={0.03}>
          {look.top !== 'shirt' && <mesh geometry={P.hem} material={P.M.top} castShadow />}
          {P.skirt && <mesh geometry={P.skirt} material={P.M.bottom} castShadow />}
          {P.outerHem && <mesh geometry={P.outerHem} material={P.M.outer} position-y={0.02} castShadow />}
        </group>
        {look.pack === 'satchel' && (
          <group ref={(o) => void (j.satchel = o)} position={[-0.18, 0.0, 0.04]}>
            <mesh geometry={P.satchelBag} material={P.M.pack} castShadow />
            <mesh material={P.M.strap} position={[-0.033, 0.03, 0]} scale={[0.2, 1, 1]}>
              <boxGeometry args={[0.03, 0.06, 0.16]} />
            </mesh>
          </group>
        )}
        <group ref={(o) => void (j.spine = o)} position-y={0.04}>
          <mesh geometry={P.abdomen} material={P.M.top} castShadow />
          {look.top === 'shirt' && <mesh geometry={P.hem} material={P.M.top} position-y={-0.06} />}
          {P.outerBelly && <mesh geometry={P.outerBelly} material={P.M.outer} castShadow />}
          <group ref={(o) => void (j.chest = o)} position-y={0.2}>
            <mesh geometry={P.chest} material={P.M.top} castShadow />
            {look.top === 'shirt' && [0.12, 0.05, -0.02].map((y) => (
              <mesh key={y} material={P.M.button} position={[0, y, 0.122 - Math.abs(y - 0.05) * 0.1]}>
                <sphereGeometry args={[0.009, 8, 6]} />
              </mesh>
            ))}
            {P.outerChest && <mesh geometry={P.outerChest} material={P.M.outer} castShadow />}
            {P.lapel.map((l, i) => (
              <mesh key={i} geometry={l} material={P.M.outer} />
            ))}
            {look.outer === 'vest' &&
              [1, -1].map((s) => (
                <mesh key={s} material={P.M.outer} position={[s * 0.1, 0.02, 0.123]} rotation-y={s * 0.45}>
                  <boxGeometry args={[0.065, 0.06, 0.02]} />
                </mesh>
              ))}
            {look.outer === 'raincoat' && [0.12, 0.04, -0.04].map((y) => (
              <mesh key={y} material={P.M.button} position={[0, y, 0.135]} rotation-z={Math.PI / 2}>
                <capsuleGeometry args={[0.008, 0.025, 3, 6]} />
              </mesh>
            ))}
            {P.hood && <mesh geometry={P.hood} material={P.M.outer} position={[0, 0.15, -0.13]} rotation-x={-0.9} scale={[1, 0.8, 0.9]} />}
            {!P.hijab && <mesh geometry={P.collar} material={look.outer === 'none' ? P.M.topPlain : P.M.outer} position-y={0.205} rotation-x={Math.PI / 2} scale={[1, 0.85, 1]} />}
            {P.hijab && <mesh geometry={P.hijabDrape!} material={P.M.headwear} position-y={0.29} castShadow />}
            {look.head === 'scarf' && (
              <group position-y={0.215}>
                <mesh geometry={P.scarfRing} material={P.M.headwear} rotation-x={Math.PI / 2} />
                <group ref={(o) => void (j.scarf = o)}>
                  <mesh geometry={P.scarfTail} material={P.M.headwear} />
                </group>
              </group>
            )}
            {pack === 'backpack' && (
              <>
                {P.packStraps.map((sg, i) => (
                  <mesh key={i} geometry={sg} material={P.M.strap} />
                ))}
                <group ref={(o) => void (j.pack = o)} position={[0, 0.04, -0.2]}>
                  <mesh geometry={P.packBox} material={P.M.pack} castShadow />
                  <mesh geometry={P.packPocket} material={P.M.pack} position={[0, -0.06, -0.075]} />
                  <mesh material={P.M.strap} position={[0, 0.1, -0.062]}>
                    <boxGeometry args={[0.2, 0.06, 0.012]} />
                  </mesh>
                  <mesh geometry={P.rollGeo} material={P.M.roll} position={[0, 0.2, 0.0]} rotation-z={Math.PI / 2} />
                  {[1, -1].map((s) => (
                    <mesh key={s} material={P.M.strap} position={[s * 0.07, 0.2, 0]} rotation-y={Math.PI / 2}>
                      <torusGeometry args={[0.058, 0.007, 4, 14]} />
                    </mesh>
                  ))}
                </group>
              </>
            )}
            {pack === 'satchel' && <mesh geometry={P.satchelStrap} material={P.M.strap} />}
            <Arm P={P} s={1} j={j} look={look} withLantern={withLantern} light={light} />
            <Arm P={P} s={-1} j={j} look={look} withLantern={withLantern} light={light} />
            <group ref={(o) => void (j.neck = o)} position-y={0.19}>
              <mesh geometry={P.neck} material={P.M.skin} position-y={0.09} />
              <group ref={(o) => void (j.head = o)} position-y={0.075}>
                <group position-y={R * 0.95} scale={B.head}>
                  <Head P={P} j={j} look={look} />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

const rot = (o: THREE.Object3D | null, x = 0, y = 0, z = 0) => o && o.rotation.set(x, y, z);

function apply(p: Pose, j: J, A: Animator, hips0: number, P: Parts, reduced: boolean) {
  const v = (c: Ch) => p[c] ?? 0;
  if (j.hips) {
    j.hips.position.y = hips0 + v('hipsY');
    rot(j.hips, v('hipsX'), v('hipsYaw'), v('hipsZ'));
  }
  rot(j.spine, v('spineX'), v('spineY') - v('hipsYaw') * 0.4, v('spineZ'));
  rot(j.chest, v('chestX'), v('chestY'), v('chestZ'));
  rot(j.neck, v('neckX'), v('neckY'), 0);
  rot(j.head, v('headX'), v('headY') - v('chestY') * 0.6, v('headZ'));
  for (const k of ['L', 'R'] as const) {
    rot(j[`sh${k}`], v(`sh${k}X` as Ch), v(`sh${k}Y` as Ch), v(`sh${k}Z` as Ch));
    rot(j[`el${k}`], v(`el${k}X` as Ch), v(`el${k}Y` as Ch), 0);
    rot(j[`wr${k}`], v(`wr${k}X` as Ch), 0, v(`wr${k}Z` as Ch));
    const s = k === 'L' ? 1 : -1;
    const grip = Math.max(0, Math.min(1, v(`grip${k}` as Ch)));
    const idx = Math.max(0, Math.min(1, v(`idx${k}` as Ch)));
    const f = j[`fing${k}`];
    if (f) f.rotation.set(0, 0, -s * (0.15 + grip * 1.1));
    const ix = j[`idx${k}`];
    if (ix) ix.rotation.set(-idx * 0.1, 0, -s * (0.15 + grip * 1.1) * (1 - idx));
    rot(j[`th${k}`], v(`th${k}X` as Ch), v(`th${k}Y` as Ch), v(`th${k}Z` as Ch));
    rot(j[`kn${k}`], v(`kn${k}X` as Ch), 0, 0);
    rot(j[`an${k}`], v(`an${k}X` as Ch), 0, 0);
    // Eyes look ahead of the head; the eye closes to blink and narrows in a smile.
    const eye = j[`eye${k}`];
    if (eye) eye.rotation.set(Math.max(-0.08, Math.min(0.14, A.look.ex + 0.04)), A.look.ey, 0);
    const L = j[`lid${k}`];
    if (L) L.scale.y = Math.max(0.06, 1 - A.lid() * 0.96 - Math.max(0, v('smile') - 0.6) * 0.3 + Math.max(0, v('brow')) * 0.06);
  }
  // Face: brows lift, the smile deepens, the mouth opens for joy.
  if (j.brows) j.brows.position.y = v('brow') * 0.012;
  const smile = Math.max(0, Math.min(1, v('smile')));
  const open = Math.max(0, Math.min(1, v('open')));
  if (j.smile) {
    j.smile.scale.set(1 + smile * 0.12, 0.3 + smile * 1.4, 1);
    j.smile.visible = open < 0.4;
  }
  if (j.open) {
    j.open.visible = open >= 0.4;
    j.open.scale.set(1, 0.4 + open * 0.6, 1);
  }
  // Springs: hair and cloth.
  const sx = reduced ? 0 : A.sway.x.x;
  const sz = reduced ? 0 : A.sway.z.x;
  for (let i = 0; i < 3; i++) {
    const o = j[`sway${i}`];
    if (o) o.rotation.set(Math.max(-0.1, sx * 0.7) - v('headX') * 0.5, 0, sz * 0.6 - v('headZ') * 0.5);
  }
  if (j.skirt) {
    j.skirt.rotation.set(
      (reduced ? 0 : A.skirt.x.x) + Math.max(0, -Math.min(v('thLX'), v('thRX'))) * 0.18 - v('hipsX'),
      0,
      reduced ? 0 : A.skirt.z.x,
    );
    const spread = Math.max(Math.abs(v('thLX')), Math.abs(v('thRX')));
    j.skirt.scale.set(1 + spread * 0.12, 1, 1 + spread * 0.25);
  }
  if (j.pack) j.pack.rotation.x = -A.pack.x * 0.6 - Math.max(0, v('spineX')) * 0.15;
  if (j.scarf) j.scarf.rotation.x = -A.sway.x.x * 0.5;
  if (j.satchel) j.satchel.rotation.z = -A.sway.x.x * 0.3;
  void P;
  void hairline;
}
