// Draft story outlines and the per-surah theme catalog supplied by the project
// team. Narration here is the storyteller's own words: it is never the Quran
// or a translation, and the app labels it so. Scripture is shown only from the
// verified dataset, by reference. Nothing here is reviewed yet.
import storiesData from '@content/outlines/stories.json';
import catalogData from '@content/outlines/surah-catalog.json';
import { parseRef } from './quran';
import type { AyahRef } from './types';

export type StoryOutline = {
  id: string;
  title: string;
  figure: string;
  quran_references: AyahRef[];
  /** Ayahs shown in full (verified Arabic and translation) inside the story card. */
  featured_ayahs: AyahRef[];
  narration: string[];
  lessons: string;
  gameplay_idea: string;
  review_status: string;
  review_notes: string[];
};

export type SurahCatalogEntry = { surah: number; themes: string; environment_idea: string };

export const storyOutlines = storiesData.stories as StoryOutline[];
export const surahCatalog = catalogData.surahs as SurahCatalogEntry[];

/** Story outlines with at least one reference in this surah. */
export function outlinesForSurah(n: number): StoryOutline[] {
  return storyOutlines.filter((s) => s.quran_references.some((r) => parseRef(r)?.surah === n));
}

export const catalogFor = (n: number) => surahCatalog[n - 1];
