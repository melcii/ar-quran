// Arabic words a child meets in the worlds. The Arabic is never typed here:
// each entry points to a word in the verified KFGQPC Hafs text by surah,
// ayah and word position, and the app reads it from there. The short English
// meanings are draft study aids written for this app, shown as such, and
// need checking by a qualified teacher before release.
import { getVerse } from '@/content/quran';

export type Word = {
  id: string;
  /** Surah, ayah, word position (0-based, words split on spaces). */
  at: [number, number, number];
  meaning: string;
  /** Which world you meet it in (adventure world number, or 'ark'). */
  world: number | 'ark';
};

export const WORDS: Word[] = [
  { id: 'hamd', at: [1, 2, 0], meaning: 'the praise (all praise)', world: 1 },
  { id: 'rabb', at: [1, 2, 2], meaning: 'Lord (of)', world: 1 },
  { id: 'nabudu', at: [1, 5, 1], meaning: 'we worship', world: 1 },
  { id: 'ihdina', at: [1, 6, 0], meaning: 'guide us', world: 1 },
  { id: 'sirat', at: [1, 6, 1], meaning: 'the path', world: 1 },
  { id: 'layl', at: [6, 76, 3], meaning: 'the night', world: 6 },
  { id: 'kawkab', at: [6, 76, 5], meaning: 'a star', world: 6 },
  { id: 'qamar', at: [6, 77, 2], meaning: 'the moon', world: 6 },
  { id: 'shams', at: [6, 78, 2], meaning: 'the sun', world: 6 },
  { id: 'maa', at: [6, 99, 5], meaning: 'water (rain)', world: 6 },
  { id: 'nakhl', at: [6, 99, 19], meaning: 'the date palms', world: 6 },
  { id: 'anam', at: [6, 142, 1], meaning: 'the grazing animals (livestock)', world: 6 },
  { id: 'bahr', at: [10, 22, 5], meaning: 'and the sea', world: 10 },
  { id: 'fulk', at: [10, 22, 10], meaning: 'the ships', world: 10 },
  { id: 'rih', at: [10, 22, 13], meaning: 'with a wind', world: 10 },
  { id: 'diya', at: [10, 5, 4], meaning: 'a shining light', world: 10 },
  { id: 'fulk-ark', at: [11, 37, 1], meaning: 'the ship (the ark)', world: 'ark' },
  { id: 'zawjayn', at: [11, 40, 11], meaning: 'two (a pair, male and female)', world: 'ark' },
  { id: 'judi', at: [11, 44, 12], meaning: 'al-Judi (the mountain where the ark came to rest)', world: 'ark' },
];

/** The word as it stands in the verified text, or null if the pointer is wrong. */
export function wordText(w: Word): string | null {
  const v = getVerse(w.at[0], w.at[1]);
  return v?.arabic_text.split(' ')[w.at[2]] ?? null;
}

/** Words found in a set of ayah refs. */
export function wordsIn(refs: [number, number][]): Word[] {
  return WORDS.filter((w) => refs.some(([s, a]) => s === w.at[0] && a === w.at[1]));
}
