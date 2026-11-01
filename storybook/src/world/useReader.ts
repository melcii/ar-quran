// Page-turn orchestration for the book in the reading room. A spread s shows
// page 2s on the right (read first, Arabic order) and page 2s+1 on the left.
// Reading forward turns the left leaf over onto the right.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as THREE from 'three';
import { sound } from '@/three/sound';
import type { Leaf } from './Book';
import { drawPage, pageFontReady, pageForAyah, paginateSurah, type Page, type TextSize } from './pages';

type Faces = { right: THREE.Texture | null; left: THREE.Texture | null; front: THREE.Texture | null; back: THREE.Texture | null; visible: boolean };
const NONE: Faces = { right: null, left: null, front: null, back: null, visible: false };
const MAX_TEXTURES = 10;

export function useReader({ surah, size, motion }: { surah: number; size: TextSize; motion: boolean }) {
  const [fontReady, setFontReady] = useState(false);
  useEffect(() => {
    pageFontReady().then(() => setFontReady(true));
  }, []);
  const pages = useMemo<Page[]>(() => (fontReady ? paginateSurah(surah, size) : []), [fontReady, surah, size]);
  const [spread, setSpread] = useState(0);
  const [highlight, setHighlight] = useState<number | undefined>();
  const [faces, setFaces] = useState<Faces>(NONE);
  const progress = useRef(0);
  const busy = useRef(false);
  const cache = useRef(new Map<string, THREE.Texture>());
  const pending = useRef<number | null>(null);
  const anchor = useRef<{ surah: number; ayah: number }>({ surah, ayah: 1 });

  const tex = useCallback(
    (i: number) => {
      const page = pages[i];
      const h = page && highlight != null && highlight >= page.firstAyah && highlight <= page.lastAyah ? highlight : undefined;
      const key = page ? `${surah}:${size}:${i}:${h ?? ''}` : 'blank';
      const c = cache.current;
      let t = c.get(key);
      if (t) {
        // Most recently used goes to the end.
        c.delete(key);
        c.set(key, t);
        return t;
      }
      t = drawPage(page, size, h);
      c.set(key, t);
      while (c.size > MAX_TEXTURES) {
        const [oldKey, old] = c.entries().next().value as [string, THREE.Texture];
        c.delete(oldKey);
        old.dispose();
      }
      return t;
    },
    [pages, highlight, surah, size],
  );

  // A new surah or text size: open at the requested ayah, or keep the place.
  useEffect(() => {
    if (!pages.length) return;
    const same = anchor.current.surah === surah;
    const ayah = pending.current ?? (same ? anchor.current.ayah : 1);
    pending.current = null;
    setSpread(Math.floor(pageForAyah(pages, ayah) / 2));
  }, [pages, surah]);

  // Show the current spread whenever nothing is turning.
  useEffect(() => {
    if (!pages.length || busy.current) return;
    setFaces({ right: tex(2 * spread), left: tex(2 * spread + 1), front: null, back: null, visible: false });
    anchor.current = { surah, ayah: pages[2 * spread]?.firstAyah ?? 1 };
  }, [pages, spread, tex, surah]);

  const animate = useCallback(
    (to: number, done: () => void) => {
      const from = progress.current;
      const start = performance.now();
      // Tests may slow the turn down to photograph it mid-air.
      const slow = (globalThis as { __pageTurnMs?: number }).__pageTurnMs;
      const dur = slow ?? (motion ? 950 : 220);
      const tick = () => {
        const p = Math.min(1, (performance.now() - start) / dur);
        progress.current = from + (to - from) * p;
        if (p < 1) requestAnimationFrame(tick);
        else done();
      };
      requestAnimationFrame(tick);
    },
    [motion],
  );

  const forward = useCallback(() => {
    const p = 2 * spread;
    if (busy.current || p + 2 >= pages.length) return false;
    busy.current = true;
    progress.current = 0;
    setFaces({ right: tex(p), left: tex(p + 3), front: tex(p + 1), back: tex(p + 2), visible: true });
    sound.pageTurn();
    animate(1, () => {
      busy.current = false;
      setSpread(spread + 1);
    });
    return true;
  }, [spread, pages.length, tex, animate]);

  const back = useCallback(() => {
    const p = 2 * spread;
    if (busy.current || spread === 0) return false;
    busy.current = true;
    progress.current = 1;
    setFaces({ right: tex(p - 2), left: tex(p + 1), front: tex(p - 1), back: tex(p), visible: true });
    sound.pageTurn();
    animate(0, () => {
      busy.current = false;
      setSpread(spread - 1);
    });
    return true;
  }, [spread, tex, animate]);

  /** Open at an ayah of the current surah, softly marking it on the page. */
  const jumpTo = useCallback(
    (ayah: number, mark = true) => {
      if (!pages.length) {
        pending.current = ayah;
        return;
      }
      setHighlight(mark ? ayah : undefined);
      setSpread(Math.floor(pageForAyah(pages, ayah) / 2));
    },
    [pages],
  );

  /** Call before changing the surah, so the book opens at this ayah. */
  const openAt = useCallback((ayah: number, mark = false) => {
    pending.current = ayah;
    setHighlight(mark ? ayah : undefined);
  }, []);

  const leaf: Leaf = useMemo(() => ({ progress, front: faces.front, back: faces.back, visible: faces.visible }), [faces]);
  const right = pages[2 * spread];
  const left = pages[2 * spread + 1];
  return {
    ready: pages.length > 0,
    pages,
    spread,
    spreads: Math.ceil(pages.length / 2),
    firstAyah: right?.firstAyah ?? 1,
    lastAyah: (left ?? right)?.lastAyah ?? 1,
    rightPage: right,
    leftPage: left,
    faces,
    leaf,
    forward,
    back,
    jumpTo,
    openAt,
    canForward: 2 * spread + 2 < pages.length,
    canBack: spread > 0,
  };
}
