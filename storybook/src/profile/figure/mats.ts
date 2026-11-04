// Materials for the explorer: soft skin with a warm sheen, woven fabric with
// thread texture and a fabric sheen, streaked hair, painted irises. Textures
// are drawn on small canvases (no image files), cached by colour.
import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();
const canvas = (n: number) => {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  return [c, c.getContext('2d')!] as const;
};
const hasDom = () => typeof document !== 'undefined';

export const shade = (hex: string, k: number) => {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return `#${c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + k))).getHexString()}`;
};

function tex(key: string, n: number, draw: (g: CanvasRenderingContext2D, n: number) => void, o: { repeat?: [number, number]; srgb?: boolean } = {}) {
  const k = `${key}|${o.repeat?.join(',') ?? ''}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const [c, g] = canvas(n);
  draw(g, n);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (o.repeat) t.repeat.set(...o.repeat);
  if (o.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(k, t);
  return t;
}

/** A tiny seeded noise so textures are the same on every visit. */
const rnd = (s: number) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

export type Pattern = 'plain' | 'stripes' | 'checks' | 'dots';

/** Woven cloth: fine threads in two tones of the colour, with the pattern on top. */
export function clothMap(color: string, pattern: Pattern, repeat: [number, number] = [4, 4]) {
  if (!hasDom()) return null;
  return tex(`cloth:${color}:${pattern}`, 128, (g, n) => {
    g.fillStyle = color;
    g.fillRect(0, 0, n, n);
    const r = rnd(7);
    // Threads.
    for (let y = 0; y < n; y += 2) {
      g.fillStyle = shade(color, (r() - 0.5) * 0.05);
      g.globalAlpha = 0.5;
      g.fillRect(0, y, n, 1);
    }
    for (let x = 0; x < n; x += 2) {
      g.fillStyle = shade(color, -0.03 + (r() - 0.5) * 0.04);
      g.globalAlpha = 0.35;
      g.fillRect(x, 0, 1, n);
    }
    g.globalAlpha = 1;
    const hi = shade(color, 0.16);
    const lo = shade(color, -0.12);
    if (pattern === 'stripes') {
      g.fillStyle = hi;
      for (let y = 0; y < n; y += 32) g.fillRect(0, y, n, 12);
      g.fillStyle = lo;
      for (let y = 14; y < n; y += 32) g.fillRect(0, y, n, 2);
    }
    if (pattern === 'checks') {
      g.globalAlpha = 0.5;
      g.fillStyle = hi;
      for (let y = 0; y < n; y += 32) g.fillRect(0, y, n, 14);
      for (let x = 0; x < n; x += 32) g.fillRect(x, 0, 14, n);
      g.globalAlpha = 0.35;
      g.fillStyle = lo;
      for (let y = 6; y < n; y += 32) g.fillRect(0, y, n, 2);
      for (let x = 6; x < n; x += 32) g.fillRect(x, 0, 2, n);
      g.globalAlpha = 1;
    }
    if (pattern === 'dots') {
      g.fillStyle = hi;
      for (let y = 8; y < n; y += 32) for (let x = (y / 32) % 2 < 1 ? 8 : 24; x < n; x += 32) g.beginPath(), g.arc(x, y, 5, 0, Math.PI * 2), g.fill();
    }
  }, { repeat });
}

/** A shared normal map of woven threads (used by every cloth). */
export function weaveNormal(repeat: [number, number] = [10, 10]) {
  if (!hasDom()) return null;
  return tex('weave-n', 64, (g, n) => {
    const img = g.createImageData(n, n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        // Over-under threads: alternating bumps in x and y.
        const cell = ((x >> 2) + (y >> 2)) % 2;
        const fx = Math.sin(((x % 4) / 4) * Math.PI);
        const fy = Math.sin(((y % 4) / 4) * Math.PI);
        const nx = cell ? Math.cos(((x % 4) / 4) * Math.PI) * 0.5 : 0;
        const ny = cell ? 0 : Math.cos(((y % 4) / 4) * Math.PI) * 0.5;
        const i = (y * n + x) * 4;
        img.data[i] = 128 + nx * 90 * fy;
        img.data[i + 1] = 128 + ny * 90 * fx;
        img.data[i + 2] = 255;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
  }, { repeat, srgb: false });
}

/** Knitted rib for wool hats. */
export function knitMap(color: string) {
  if (!hasDom()) return null;
  return tex(`knit:${color}`, 64, (g, n) => {
    g.fillStyle = shade(color, -0.08);
    g.fillRect(0, 0, n, n);
    for (let x = 0; x < n; x += 8) {
      for (let y = 0; y < n; y += 6) {
        g.fillStyle = shade(color, 0.06);
        g.beginPath();
        g.ellipse(x + 2, y + 3, 2.2, 3.2, 0.5, 0, Math.PI * 2);
        g.ellipse(x + 6, y + 3, 2.2, 3.2, -0.5, 0, Math.PI * 2);
        g.fill();
      }
    }
  }, { repeat: [8, 3] });
}

/** Hair: fine streaks along the strand (u runs along it), lighter on the tips. */
export function hairMap(color: string) {
  if (!hasDom()) return null;
  return tex(`hair:${color}`, 128, (g, n) => {
    const grad = g.createLinearGradient(0, 0, n, 0);
    grad.addColorStop(0, shade(color, -0.05));
    grad.addColorStop(1, shade(color, 0.06));
    g.fillStyle = grad;
    g.fillRect(0, 0, n, n);
    const r = rnd(11);
    for (let i = 0; i < 90; i++) {
      const y = r() * n;
      g.strokeStyle = shade(color, (r() - 0.45) * 0.22);
      g.globalAlpha = 0.6;
      g.lineWidth = 0.6 + r() * 1.2;
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(n * 0.3, y + (r() - 0.5) * 4, n * 0.7, y + (r() - 0.5) * 4, n, y + (r() - 0.5) * 3);
      g.stroke();
    }
    g.globalAlpha = 1;
  });
}

/** An iris: coloured fibres around a dark pupil, a darker rim, two catchlights. */
export function irisMap(color: string) {
  if (!hasDom()) return null;
  return tex(`iris:${color}`, 128, (g, n) => {
    g.clearRect(0, 0, n, n);
    const c = n / 2;
    const R = n * 0.48;
    const grad = g.createRadialGradient(c, c, R * 0.25, c, c, R);
    grad.addColorStop(0, shade(color, 0.18));
    grad.addColorStop(0.65, color);
    grad.addColorStop(0.92, shade(color, -0.18));
    grad.addColorStop(1, shade(color, -0.3));
    g.fillStyle = grad;
    g.beginPath();
    g.arc(c, c, R, 0, Math.PI * 2);
    g.fill();
    const r = rnd(5);
    g.globalAlpha = 0.35;
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2;
      g.strokeStyle = r() > 0.5 ? shade(color, 0.25) : shade(color, -0.2);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(c + Math.cos(a) * R * 0.3, c + Math.sin(a) * R * 0.3);
      g.lineTo(c + Math.cos(a) * R * 0.9, c + Math.sin(a) * R * 0.9);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.fillStyle = '#0a0705';
    g.beginPath();
    g.arc(c, c, R * 0.42, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.beginPath();
    g.ellipse(c + R * 0.28, c - R * 0.3, R * 0.2, R * 0.16, -0.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.beginPath();
    g.arc(c - R * 0.3, c + R * 0.32, R * 0.08, 0, Math.PI * 2);
    g.fill();
  }, { repeat: [1, 1] });
}

/** A soft round blush, transparent at the edge. */
export function blushMap() {
  if (!hasDom()) return null;
  return tex('blush', 64, (g, n) => {
    const grad = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    grad.addColorStop(0, 'rgba(232,120,100,0.55)');
    grad.addColorStop(1, 'rgba(232,120,100,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, n, n);
  }, { repeat: [1, 1] });
}

export function freckleMap(skin: string) {
  if (!hasDom()) return null;
  return tex(`freckles:${skin}`, 64, (g, n) => {
    g.clearRect(0, 0, n, n);
    const r = rnd(3);
    g.fillStyle = shade(skin, -0.2);
    for (let i = 0; i < 14; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * n * 0.42;
      g.globalAlpha = 0.5 + r() * 0.4;
      g.beginPath();
      g.arc(n / 2 + Math.cos(a) * d, n / 2 + Math.sin(a) * d * 0.6, 1.2 + r() * 1.2, 0, Math.PI * 2);
      g.fill();
    }
  }, { repeat: [1, 1] });
}

export function skinMat(color: string) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.62,
    sheen: 0.25,
    sheenColor: new THREE.Color(shade(color, 0.2)).lerp(new THREE.Color('#ff9a80'), 0.35),
    sheenRoughness: 0.7,
    // A whisper of warm light from within, so shadows on skin never go grey.
    emissive: new THREE.Color(color).lerp(new THREE.Color('#ff6040'), 0.4).multiplyScalar(0.035),
  });
}

export function clothMat(color: string, pattern: Pattern = 'plain', o: { repeat?: [number, number]; rough?: number; sheen?: number } = {}) {
  const map = clothMap(color, pattern, o.repeat ?? [3, 3]);
  return new THREE.MeshPhysicalMaterial({
    color: map ? '#ffffff' : color,
    map,
    roughness: o.rough ?? 0.88,
    sheen: (o.sheen ?? 0.6) * 0.4,
    sheenColor: new THREE.Color(shade(color, 0.08)),
    sheenRoughness: 0.8,
  });
}

export function hairMat(color: string) {
  const map = hairMap(color);
  return new THREE.MeshPhysicalMaterial({
    color: map ? '#ffffff' : color,
    map,
    roughness: 0.5,
    sheen: 0.8,
    sheenColor: new THREE.Color(shade(color, 0.3)),
    sheenRoughness: 0.35,
    side: THREE.DoubleSide,
  });
}

export function leatherMat(color: string) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.6 });
}
