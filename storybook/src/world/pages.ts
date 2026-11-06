// Lays out a whole surah as book pages and draws each page on a canvas.
// The words are the verified Arabic from content/quran, split only at the
// spaces already in the text and drawn unchanged. Each surah starts on a new
// page with its name and, except for Al-Fatihah and At-Tawbah, the basmalah.
import * as THREE from 'three';
import { basmalahFor, getSurah, getVerse, toArabicDigits } from '@/content/quran';
import { canvas, noiseField, toTexture } from '@/three/textures';
import { fonts } from '@/theme';

export const PAGE_W = 1024;
export const PAGE_H = 1434;
const MARGIN_X = 112;
const TOP = 132;
const BOTTOM = 150;
const HEADER_H = 150;
const BASMALAH_H = 118;

export type TextSize = 'small' | 'medium' | 'large';
const SIZES: Record<TextSize, number> = { small: 44, medium: 54, large: 66 };

/** One word (or an ayah-end mark joined to its last word) on a line. */
type Word = { text: string; ayah: number; width: number };
type Line = { words: Word[]; width: number; last: boolean };
export type Page = {
  surah: number;
  index: number;
  /** The first page of the surah carries its name and the basmalah. */
  opening: boolean;
  lines: Line[];
  firstAyah: number;
  lastAyah: number;
};

let measureCtx: CanvasRenderingContext2D | null = null;
const fontFor = (px: number) => `${px}px ${fonts.quran}`;

export async function pageFontReady() {
  try {
    await document.fonts.load(fontFor(48));
  } catch {
    // A fallback font still draws; it is only less beautiful.
  }
}

const cache = new Map<string, Page[]>();

export function paginateSurah(surah: number, size: TextSize): Page[] {
  const key = `${surah}:${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const s = getSurah(surah);
  if (!s) return [];
  if (!measureCtx) measureCtx = canvas(8, 8)[1];
  const px = SIZES[size];
  measureCtx.font = fontFor(px);
  const space = measureCtx.measureText(' ').width;
  const words: Word[] = [];
  for (let a = 1; a <= s.ayahCount; a++) {
    const v = getVerse(surah, a);
    if (!v) continue;
    const parts = v.arabic_text.split(' ').filter(Boolean);
    // The ayah mark stays on the line with the ayah's last word.
    parts[parts.length - 1] = `${parts[parts.length - 1]} ۝${toArabicDigits(a)}`;
    for (const t of parts) words.push({ text: t, ayah: a, width: measureCtx.measureText(t).width });
  }
  const maxW = PAGE_W - MARGIN_X * 2;
  const lines: Line[] = [];
  let cur: Word[] = [];
  let w = 0;
  for (const word of words) {
    const add = cur.length ? space + word.width : word.width;
    if (cur.length && w + add > maxW) {
      lines.push({ words: cur, width: w, last: false });
      cur = [word];
      w = word.width;
    } else {
      cur.push(word);
      w += add;
    }
  }
  if (cur.length) lines.push({ words: cur, width: w, last: true });

  const lineH = px * 1.9;
  const pages: Page[] = [];
  let i = 0;
  while (i < lines.length || pages.length === 0) {
    const opening = pages.length === 0;
    const room = PAGE_H - TOP - BOTTOM - (opening ? HEADER_H + (basmalahFor(surah) ? BASMALAH_H : 0) : 0);
    const n = Math.max(1, Math.floor(room / lineH));
    const chunk = lines.slice(i, i + n);
    i += n;
    pages.push({
      surah,
      index: pages.length,
      opening,
      lines: chunk,
      firstAyah: chunk[0]?.words[0]?.ayah ?? 1,
      lastAyah: chunk.at(-1)?.words.at(-1)?.ayah ?? 1,
    });
    if (!chunk.length) break;
  }
  cache.set(key, pages);
  return pages;
}

export function pageForAyah(pages: Page[], ayah: number) {
  const i = pages.findIndex((p) => ayah >= p.firstAyah && ayah <= p.lastAyah);
  return i < 0 ? 0 : i;
}

function paper(ctx: CanvasRenderingContext2D, seed: number) {
  const g = ctx.createRadialGradient(PAGE_W / 2, PAGE_H / 2, 220, PAGE_W / 2, PAGE_H / 2, 980);
  g.addColorStop(0, '#f9f2df');
  g.addColorStop(1, '#ead9b4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  noiseField(ctx, PAGE_W, PAGE_H, seed, 0.03, 5, '120,90,40', '255,255,240');
  ctx.strokeStyle = 'rgba(128, 96, 52, 0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(64, 64, PAGE_W - 128, PAGE_H - 128);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(78, 78, PAGE_W - 156, PAGE_H - 156);
}

/** Draws one page. `highlight` softly marks an ayah the reader jumped to. */
export function drawPage(page: Page | undefined, size: TextSize, highlight?: number): THREE.Texture {
  const [c, ctx] = canvas(PAGE_W, PAGE_H);
  paper(ctx, 7 + (page?.index ?? 0) * 13);
  if (!page) return toTexture(c);
  const s = getSurah(page.surah)!;
  const px = SIZES[size];
  const lineH = px * 1.9;
  let y = TOP;
  ctx.direction = 'rtl';
  if (page.opening) {
    ctx.fillStyle = 'rgba(190, 160, 105, 0.22)';
    ctx.fillRect(MARGIN_X, y, PAGE_W - MARGIN_X * 2, HEADER_H - 30);
    ctx.strokeStyle = 'rgba(128, 96, 52, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(MARGIN_X, y, PAGE_W - MARGIN_X * 2, HEADER_H - 30);
    ctx.fillStyle = '#2a2016';
    ctx.textAlign = 'center';
    ctx.font = fontFor(64);
    ctx.fillText(s.nameArabic, PAGE_W / 2, y + 82);
    y += HEADER_H;
    const b = basmalahFor(page.surah);
    if (b) {
      ctx.font = fontFor(Math.round(px * 1.05));
      ctx.fillText(b, PAGE_W / 2, y + 62);
      y += BASMALAH_H;
    }
  }
  ctx.font = fontFor(px);
  ctx.textAlign = 'right';
  const space = ctx.measureText(' ').width;
  const maxW = PAGE_W - MARGIN_X * 2;
  for (const line of page.lines) {
    y += lineH;
    // Justify every full line by widening the spaces, as a printed page does.
    const gaps = line.words.length - 1;
    const extra = !line.last && gaps > 0 ? (maxW - line.width) / gaps : 0;
    let x = PAGE_W - MARGIN_X;
    for (const word of line.words) {
      if (highlight === word.ayah) {
        ctx.fillStyle = 'rgba(214, 170, 80, 0.28)';
        ctx.fillRect(x - word.width - (space + extra) / 2, y - px * 1.15, word.width + space + extra, px * 1.6);
      }
      ctx.fillStyle = '#1c150d';
      ctx.fillText(word.text, x, y);
      x -= word.width + space + extra;
    }
  }
  ctx.direction = 'ltr';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(80, 60, 36, 0.75)';
  ctx.font = `26px ${fonts.body}`;
  const range = page.firstAyah === page.lastAyah ? `${page.firstAyah}` : `${page.firstAyah}–${page.lastAyah}`;
  ctx.fillText(`${s.nameTransliterated} · ${page.surah}:${range} · page ${page.index + 1}`, PAGE_W / 2, PAGE_H - 96);
  return toTexture(c);
}
