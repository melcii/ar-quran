// Storybook look for every 3D scene: boxes get rounded edges, low-poly rocks
// become smooth pebbles, and cones and cylinders get enough sides to read as
// round. Registered over three's own names in the R3F catalogue, so every
// <boxGeometry>, <dodecahedronGeometry> and so on in the scenes is softened
// without changing each scene. Render <SoftShapes /> first inside each Canvas.
import { extend } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** A box with softly rounded edges (radius scales with its smallest side). */
export class SoftBoxGeometry extends RoundedBoxGeometry {
  constructor(width = 1, height = 1, depth = 1) {
    const r = Math.min(width, height, depth) * 0.22;
    super(width, height, depth, Math.min(width, height, depth) < 0.05 ? 1 : 2, Math.max(0.0005, Math.min(r, 0.6)));
  }
}

/** A hash of the radius so each size of pebble keeps the same shape every visit. */
function pebble(radius: number, detail: number, squash: [number, number, number] = [1, 1, 1]) {
  const base = new THREE.IcosahedronGeometry(radius, Math.max(3, detail));
  base.deleteAttribute('normal');
  base.deleteAttribute('uv');
  const g = mergeVertices(base);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  const k = radius * 13.7;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    // Two gentle low-frequency bumps: lumpy like a river stone, never faceted.
    const n = 1 + 0.09 * Math.sin(v.x * 2.3 + k) * Math.cos(v.z * 2.1 - k) + 0.05 * Math.sin(v.y * 3.7 + v.x * 1.3 + k * 2);
    v.multiplyScalar(radius * n);
    p.setXYZ(i, v.x * squash[0], v.y * squash[1], v.z * squash[2]);
  }
  g.computeVertexNormals();
  return g;
}

class SoftPolyGeometry extends THREE.BufferGeometry {
  constructor(radius = 1, detail = 0) {
    super();
    this.copy(pebble(radius, detail));
  }
}

class SoftConeGeometry extends THREE.ConeGeometry {
  constructor(radius = 1, height = 1, radialSegments = 32, heightSegments = 1, openEnded = false, thetaStart = 0, thetaLength = Math.PI * 2) {
    super(radius, height, Math.max(24, radialSegments), heightSegments, openEnded, thetaStart, thetaLength);
  }
}

class SoftCylinderGeometry extends THREE.CylinderGeometry {
  constructor(radiusTop = 1, radiusBottom = 1, height = 1, radialSegments = 32, heightSegments = 1, openEnded = false, thetaStart = 0, thetaLength = Math.PI * 2) {
    super(radiusTop, radiusBottom, height, Math.max(18, radialSegments), heightSegments, openEnded, thetaStart, thetaLength);
  }
}

class SoftSphereGeometry extends THREE.SphereGeometry {
  constructor(radius = 1, widthSegments = 32, heightSegments = 16, ...rest: number[]) {
    super(radius, Math.max(20, widthSegments), Math.max(14, heightSegments), ...rest);
  }
}

/**
 * Register the soft shapes. The Canvas registers all of three's classes when
 * it mounts, which would put the hard ones back, so this also runs from
 * <SoftShapes />, rendered as the first child inside each Canvas.
 */
export function softenGeometry() {
  extend({
    BoxGeometry: SoftBoxGeometry,
    DodecahedronGeometry: SoftPolyGeometry,
    IcosahedronGeometry: SoftPolyGeometry,
    OctahedronGeometry: SoftPolyGeometry,
    ConeGeometry: SoftConeGeometry,
    CylinderGeometry: SoftCylinderGeometry,
    SphereGeometry: SoftSphereGeometry,
  } as never);
}
softenGeometry();

export function SoftShapes() {
  useMemo(softenGeometry, []);
  return null;
}

export { pebble };
