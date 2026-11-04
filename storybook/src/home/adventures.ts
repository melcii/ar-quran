// Where each surah's adventures and story chapters live, how far the explorer
// got in them, and which one they played last (for Continue Adventure).
// Everything is kept on this device under the active explorer's keys.
import { WORLDS } from '@/adventure/worlds';
import { getSurah } from '@/content/quran';

/** A story told in a surah, with its own playable adventure. */
export type Chapter = { surah: number; key: 'ark' | 'yunus'; title: string; ref: string; href: string; note: string };

/**
 * Story chapters by surah. A story's adventure lives under the surah that
 * carries its name or tells it at length; the reading is always the verified
 * text. Prophets are never shown in any of these adventures.
 */
export const CHAPTERS: Chapter[] = [
  { surah: 11, key: 'ark', title: 'The story of Nuh: the Ark', ref: '11:37–44', href: '/ark', note: 'Gather the animals and supplies, board the Ark and wait out the flood.' },
  { surah: 10, key: 'yunus', title: 'The story of Yunus and the great fish', ref: '37:140–146', href: '/yunus', note: 'A story walk past the laden ship, through the deep sea and onto the shore. Its ayahs come from Surah As-Saffat.' },
];
export const chaptersFor = (n: number) => CHAPTERS.filter((c) => c.surah === n);

const read = <T,>(k: string): T | null => {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(k) ?? 'null') as T | null;
  } catch {
    return null;
  }
};

/** Progress in a surah's adventure world, in words ('' when not started). */
export function worldProgress(n: number): string {
  const s = read<{ done?: string[]; finished?: boolean }>(`quran-adventure.world-${n}.v1`);
  const w = WORLDS[n];
  if (!s || !w) return '';
  if (s.finished) return 'Finished';
  const d = w.tasks.filter((t) => s.done?.includes(t.id)).length;
  return d ? `${d} of ${w.tasks.length} activities` : 'Started';
}

/** Progress in the Ark adventure, in words ('' when not started). */
export function arkProgress(): string {
  const s = read<{ boarded?: string[]; stored?: string[]; flood?: number; reflected?: boolean; found?: string[] }>('quran-adventure.ark-slice.v1');
  if (!s) return '';
  if (s.flood === 2 && s.reflected) return 'Finished';
  if (s.flood) return 'The flood is under way';
  const a = s.boarded?.length ?? 0;
  const b = s.stored?.length ?? 0;
  if (a || b) return `${a} animal pairs aboard, ${b} supplies stored`;
  return s.found?.length ? 'Started' : '';
}

export type Last = { kind: 'world'; n: number; at: number } | { kind: 'ark'; at: number };
const LAST = 'quran-adventure.last-adventure.v1';

export function noteAdventure(l: Omit<Extract<Last, { kind: 'world' }>, 'at'> | { kind: 'ark' }) {
  try {
    globalThis.localStorage?.setItem(LAST, JSON.stringify({ ...l, at: Date.now() }));
  } catch {}
}

/** The adventure to continue: its route, a title and how far it got. */
export function lastAdventure(): { href: string; title: string; detail: string } | null {
  const l = read<Last>(LAST);
  if (!l) return null;
  if (l.kind === 'ark') return { href: '/ark', title: "Hud · Nuh's Ark", detail: arkProgress() || 'Started' };
  const w = WORLDS[l.n];
  const s = getSurah(l.n);
  if (!w || !s) return null;
  return { href: `/adventure/${l.n}`, title: `${s.nameTransliterated} · ${w.name}`, detail: worldProgress(l.n) || 'Started' };
}

/** Where a new explorer starts: the world of Al-Fatihah. */
export const FIRST = { href: '/adventure/1', title: 'Al-Fatihah' };
