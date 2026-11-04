// Hand-painted looking textures, all drawn in code on a canvas: brushy grass,
// bark, planks, stone, leaf clusters, clouds and animal coats. No outside assets.
import * as THREE from 'three';
import { rng } from './land';

const cache = new Map<string, THREE.Texture>();

function make(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, opts: { repeat?: number; color?: boolean } = {}) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, rng(key.length * 977 + key.charCodeAt(0)));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(opts.repeat ?? 1, opts.repeat ?? 1);
  t.anisotropy = 4;
  if (opts.color !== false) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  cache.set(key, t);
  return t;
}

/** Soft dabs of light and shade: multiplied over the ground's vertex colours. */
export function brushTexture() {
  return make('brush', 512, 512, (g, r) => {
    g.fillStyle = '#e8e8e8';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) {
      const x = r() * 512;
      const y = r() * 512;
      const l = 180 + r() * 75;
      g.fillStyle = `rgba(${l},${l + 4},${l - 10},${0.18 + r() * 0.2})`;
      g.save();
      g.translate(x, y);
      g.rotate(r() * Math.PI);
      g.beginPath();
      g.ellipse(0, 0, 4 + r() * 10, 1.5 + r() * 3, 0, 0, Math.PI * 2);
      g.fill();
      // Wrap so the tile has no seam.
      g.restore();
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(255,255,235,${0.08 + r() * 0.1})`;
      g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 4 + r() * 6);
    }
  });
}

export function barkTexture() {
  return make('bark', 256, 512, (g, r) => {
    const grd = g.createLinearGradient(0, 0, 256, 0);
    grd.addColorStop(0, '#6b4a33');
    grd.addColorStop(0.5, '#86603f');
    grd.addColorStop(1, '#6b4a33');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 140; i++) {
      const x = r() * 256;
      const w = 1 + r() * 4;
      g.strokeStyle = r() < 0.6 ? `rgba(60,38,24,${0.35 + r() * 0.3})` : `rgba(190,150,110,${0.18 + r() * 0.2})`;
      g.lineWidth = w;
      g.beginPath();
      let y = -20;
      let xx = x;
      g.moveTo(xx, y);
      while (y < 530) {
        y += 20 + r() * 30;
        xx += (r() - 0.5) * 10;
        g.lineTo(xx, y);
      }
      g.stroke();
    }
    // A few knots.
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(55,35,22,0.5)';
      g.beginPath();
      g.ellipse(r() * 256, r() * 512, 5 + r() * 6, 8 + r() * 8, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** Warm planks with grain, joins and pegs: the ark's timber. */
export function planksTexture(tone = 0) {
  return make(`planks${tone}`, 512, 512, (g, r) => {
    const rows = 8;
    const hgt = 512 / rows;
    for (let i = 0; i < rows; i++) {
      const base = [[150, 98, 58], [132, 86, 50], [164, 110, 66], [120, 78, 46]][(i + tone) % 4];
      const v = (r() - 0.5) * 22;
      g.fillStyle = `rgb(${base[0] + v},${base[1] + v * 0.7},${base[2] + v * 0.5})`;
      g.fillRect(0, i * hgt, 512, hgt);
      // Grain.
      for (let k = 0; k < 26; k++) {
        g.strokeStyle = `rgba(${r() < 0.5 ? '70,42,22' : '200,150,100'},${0.12 + r() * 0.18})`;
        g.lineWidth = 0.6 + r() * 1.6;
        g.beginPath();
        const y0 = i * hgt + r() * hgt;
        g.moveTo(0, y0);
        for (let x = 0; x <= 512; x += 32) g.lineTo(x, y0 + Math.sin(x / 40 + k) * 2.2 + (r() - 0.5) * 1.5);
        g.stroke();
      }
      // Seam and highlight.
      g.fillStyle = 'rgba(50,30,16,0.75)';
      g.fillRect(0, i * hgt, 512, 2.5);
      g.fillStyle = 'rgba(255,220,170,0.18)';
      g.fillRect(0, i * hgt + 3, 512, 2);
      // Butt joins with pegs.
      const j = 60 + r() * 380;
      g.fillStyle = 'rgba(50,30,16,0.7)';
      g.fillRect(j, i * hgt, 2.5, hgt);
      for (const dx of [-9, 9])
        for (const dy of [0.3, 0.7]) {
          g.fillStyle = 'rgba(70,44,24,0.9)';
          g.beginPath();
          g.arc(j + dx, i * hgt + hgt * dy, 2.6, 0, Math.PI * 2);
          g.fill();
        }
    }
  });
}

export function stoneTexture() {
  return make('stone', 256, 256, (g, r) => {
    g.fillStyle = '#9a9a8e';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 700; i++) {
      const l = 110 + r() * 90;
      g.fillStyle = `rgba(${l},${l},${l - 8},${0.15 + r() * 0.25})`;
      g.beginPath();
      g.ellipse(r() * 256, r() * 256, 3 + r() * 14, 2 + r() * 8, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = 'rgba(60,60,55,0.35)';
      g.lineWidth = 1;
      g.beginPath();
      let x = r() * 256;
      let y = r() * 256;
      g.moveTo(x, y);
      for (let k = 0; k < 5; k++) g.lineTo((x += (r() - 0.5) * 50), (y += (r() - 0.5) * 50));
      g.stroke();
    }
  });
}

/** A cluster of leaves on transparent ground, used on canopy cards. */
export function leafTexture() {
  const t = make('leaf', 256, 256, (g, r) => {
    g.clearRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 100;
      const x = 128 + Math.cos(a) * d;
      const y = 128 + Math.sin(a) * d;
      const l = 170 + r() * 85;
      g.fillStyle = `rgb(${l},${l},${l})`;
      g.save();
      g.translate(x, y);
      g.rotate(a + (r() - 0.5));
      g.beginPath();
      g.moveTo(0, -16);
      g.quadraticCurveTo(10, 0, 0, 16);
      g.quadraticCurveTo(-10, 0, 0, -16);
      g.fill();
      g.restore();
    }
  });
  // No mipmaps: blending toward the transparent (black) background would draw dark fringes.
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

export function cloudTexture() {
  return make('cloud', 512, 256, (g, r) => {
    g.clearRect(0, 0, 512, 256);
    for (let i = 0; i < 26; i++) {
      const x = 90 + r() * 330;
      const y = 120 + (r() - 0.6) * 60 - Math.sin(((x - 90) / 330) * Math.PI) * 30;
      const rad = 30 + r() * 55 * Math.sin(((x - 60) / 400) * Math.PI);
      const grd = g.createRadialGradient(x, y - rad * 0.3, rad * 0.1, x, y, rad);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.7, 'rgba(255,255,255,0.85)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, rad, 0, Math.PI * 2);
      g.fill();
    }
    // Shade the underside (red channel unchanged, kept as alpha for shading in the shader).
    const sh = g.createLinearGradient(0, 80, 0, 220);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(120,120,150,0.45)');
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = sh;
    g.fillRect(0, 0, 512, 256);
  });
}

/** Coats: giraffe patches, soft dapple for horses, wrinkles for elephants. */
export function coatTexture(kind: string, base: string, mark: string) {
  return make(`coat-${kind}-${base}`, 256, 256, (g, r) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    if (kind === 'patches') {
      g.fillStyle = mark;
      for (let i = 0; i < 7; i++) {
        const cx = r() * 256;
        const cy = r() * 256;
        g.beginPath();
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2;
          const d = 22 + r() * 26;
          if (k === 0) g.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
          else g.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
        }
        g.closePath();
        g.fill();
      }
    } else if (kind === 'giraffe') {
      g.fillStyle = mark;
      for (let yy = 0; yy < 6; yy++)
        for (let xx = 0; xx < 6; xx++) {
          const cx = xx * 44 + (yy % 2) * 22 + (r() - 0.5) * 8;
          const cy = yy * 44 + (r() - 0.5) * 8;
          g.beginPath();
          const n = 6;
          for (let k = 0; k < n; k++) {
            const a = (k / n) * Math.PI * 2 + r() * 0.3;
            const d = 15 + r() * 5;
            if (k === 0) g.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
            else g.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
          }
          g.closePath();
          g.fill();
        }
    } else {
      for (let i = 0; i < 900; i++) {
        const l = r() < 0.5 ? '0,0,0' : '255,255,255';
        g.fillStyle = `rgba(${l},${0.03 + r() * (kind === 'elephant' ? 0.08 : 0.05)})`;
        g.beginPath();
        g.ellipse(r() * 256, r() * 256, 2 + r() * 8, 1 + r() * 3, r() * 3, 0, Math.PI * 2);
        g.fill();
      }
      if (kind === 'elephant')
        for (let i = 0; i < 60; i++) {
          g.strokeStyle = 'rgba(50,50,60,0.18)';
          g.beginPath();
          const y = r() * 256;
          g.moveTo(0, y);
          for (let x = 0; x < 256; x += 16) g.lineTo(x, y + Math.sin(x / 20 + i) * 3);
          g.stroke();
        }
    }
  });
}

/** A round painted sign for a boarding pad or a store shelf. */
export function signTexture(draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#e9d3a6';
  g.beginPath();
  g.arc(128, 128, 120, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 10;
  g.strokeStyle = '#7a5434';
  g.stroke();
  g.save();
  draw(g);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
