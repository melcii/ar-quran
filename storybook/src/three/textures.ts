// Materials painted in code on a canvas: wood, leather, paper, plaster, sand.
// Everything is generated here, so there are no third-party texture assets.
// Quran pages are drawn only from the verified dataset (see drawPassagePage).
import * as THREE from 'three';
import { getSurah, toArabicDigits, versesFor } from '@/content/quran';
import type { AyahRef } from '@/content/types';
import { fonts } from '@/theme';
import { seeded } from '@/illustrations/paint';

export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

export function toTexture(c: HTMLCanvasElement, repeat = 1, color = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/** Soft value noise, for grain and mottling. */
export function noiseField(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, alpha: number, scale: number, dark = '0,0,0', light = '255,255,255') {
  const rnd = seeded(seed);
  for (let i = 0; i < (w * h) / (scale * scale) / 2; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = scale * (0.4 + rnd());
    const isDark = rnd() > 0.5;
    ctx.fillStyle = `rgba(${isDark ? dark : light},${alpha * rnd()})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + rnd() * 0.8), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Walnut-like wood with long grain lines, for the rehal and floor. */
export function woodTexture(seed = 3, base = '#5b3a24', line = '#3a2415', repeat = 1) {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  const rnd = seeded(seed);
  for (let i = 0; i < 90; i++) {
    const y0 = rnd() * 512;
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.08 + rnd() * 0.25;
    ctx.lineWidth = 0.6 + rnd() * 2.4;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 16) {
      const y = y0 + Math.sin(x / (40 + rnd() * 30) + i) * (3 + rnd() * 3);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  noiseField(ctx, 512, 512, seed + 1, 0.06, 6);
  return toTexture(c, repeat);
}

/** Deep green leather with a fine pebble grain for the Quran's cover. */
export function leatherTexture() {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#2f3b2c';
  ctx.fillRect(0, 0, 512, 512);
  noiseField(ctx, 512, 512, 7, 0.12, 3, '10,14,8', '90,110,80');
  noiseField(ctx, 512, 512, 8, 0.05, 18, '0,0,0', '120,130,100');
  // A restrained blind-tooled border and central medallion.
  ctx.strokeStyle = 'rgba(196, 160, 90, 0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, 456, 456);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, 432, 432);
  ctx.save();
  ctx.translate(256, 256);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(28, 36, 0, 78);
    ctx.quadraticCurveTo(-28, 36, 0, 0);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 90, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  return toTexture(c);
}

/** Leather bump: same pebble grain in grey, used as a bump map. */
export function grainBump(seed = 11) {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  noiseField(ctx, 256, 256, seed, 0.35, 2.5);
  return toTexture(c, 4, false);
}

/** Lime plaster for the walls, warm and mottled. */
export function plasterTexture() {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#b39a7a';
  ctx.fillRect(0, 0, 512, 512);
  noiseField(ctx, 512, 512, 21, 0.08, 22, '60,40,20', '230,210,180');
  noiseField(ctx, 512, 512, 22, 0.08, 4);
  return toTexture(c, 2);
}

/** Paper edge stripes for the page block. */
export function pageEdgeTexture() {
  const [c, ctx] = canvas(64, 256);
  ctx.fillStyle = '#efe4c8';
  ctx.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 2) {
    ctx.fillStyle = `rgba(120, 95, 60, ${0.08 + ((y * 37) % 10) / 120})`;
    ctx.fillRect(0, y, 64, 1);
  }
  return toTexture(c, 1);
}

/** Warm sand with ripples. */
export function sandTexture() {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#d9bf8f';
  ctx.fillRect(0, 0, 512, 512);
  noiseField(ctx, 512, 512, 31, 0.1, 3, '120,90,50', '255,240,210');
  ctx.strokeStyle = 'rgba(150, 115, 70, 0.18)';
  ctx.lineWidth = 2;
  for (let y = 0; y < 512; y += 14) {
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) ctx.lineTo(x, y + Math.sin(x / 30 + y) * 4);
    ctx.stroke();
  }
  return toTexture(c, 6);
}

/** Wrap Arabic text into lines no wider than `width`, keeping words whole. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    if (ctx.measureText(trial).width > width && line) {
      lines.push(line);
      line = w;
    } else line = trial;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Draws one page of the book: a surah heading and the verified ayahs of
 * `ref`, each followed by its number. The Arabic is taken verbatim from the
 * read-only dataset and laid out by the browser's own Arabic shaping; nothing
 * is generated or altered. This is a passage page, not a printed mushaf page.
 */
export async function drawPassagePage(ref: AyahRef, opts: { highlight?: boolean } = {}) {
  const W = 1024;
  const H = 1400;
  const [c, ctx] = canvas(W, H);
  try {
    await document.fonts.load(`48px ${fonts.quran}`);
  } catch {
    // The page still draws with a fallback font; the reading panel uses the real font.
  }
  // Paper
  const g = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 900);
  g.addColorStop(0, '#f8f0dc');
  g.addColorStop(1, '#eadcb9');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  noiseField(ctx, W, H, 41, 0.035, 5, '120,90,40', '255,255,240');

  // Frame: two thin lines, muted.
  ctx.strokeStyle = 'rgba(120, 92, 52, 0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(70, 70, W - 140, H - 140);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(84, 84, W - 168, H - 168);

  const verses = versesFor(ref);
  if (!verses.length) {
    ctx.fillStyle = '#7a5a3a';
    ctx.font = `36px ${fonts.body}`;
    ctx.textAlign = 'center';
    ctx.fillText('Passage unavailable', W / 2, H / 2);
    return toTexture(c);
  }
  const surah = getSurah(verses[0].surah_number)!;

  // Surah heading band
  ctx.fillStyle = opts.highlight ? 'rgba(214, 186, 120, 0.35)' : 'rgba(190, 165, 115, 0.22)';
  ctx.fillRect(120, 120, W - 240, 120);
  ctx.strokeStyle = 'rgba(120, 92, 52, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(120, 120, W - 240, 120);
  ctx.fillStyle = '#2a2016';
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.font = `64px ${fonts.quran}`;
  ctx.fillText(surah.nameArabic, W / 2, 200);

  // Ayahs
  ctx.textAlign = 'right';
  let size = 54;
  const maxWidth = W - 260;
  const layout = () => {
    ctx.font = `${size}px ${fonts.quran}`;
    const text = verses.map((v) => `${v.arabic_text} ۝${toArabicDigits(v.ayah_number)}`).join(' ');
    return wrap(ctx, text, maxWidth);
  };
  let lines = layout();
  while (lines.length * size * 1.95 > H - 420 && size > 30) {
    size -= 2;
    lines = layout();
  }
  const lineH = size * 1.95;
  let y = 300 + size;
  ctx.fillStyle = '#1c150d';
  for (const line of lines) {
    ctx.fillText(line, W - 130, y);
    y += lineH;
  }

  // Reference in the footer, in Latin digits for younger readers.
  ctx.direction = 'ltr';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(80, 60, 36, 0.8)';
  ctx.font = `30px ${fonts.body}`;
  ctx.fillText(`${surah.nameTransliterated} ${ref.replace('-', '–')}`, W / 2, H - 110);
  return toTexture(c);
}
