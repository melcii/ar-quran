// The story registry. Add a reviewed story by creating content/stories/<id>/
// with story.json and editorial.json, then registering it here.
import library from '@content/library.json';
import yunusEditorial from '@content/stories/yunus/editorial.json';
import yunus from '@content/stories/yunus/story.json';
import { parseRef } from './quran';
import type { Category, EditorialRecord, PlannedStory, Story } from './types';

const entries: { story: Story; editorial: EditorialRecord }[] = [
  { story: yunus as Story, editorial: yunusEditorial as EditorialRecord },
];

export const stories: Story[] = entries
  .map((e) => e.story)
  .filter((s) => s.publication_status === 'published' || s.publication_status === 'prototype');

export const categories = library.categories as Category[];
export const plannedStories = library.planned as PlannedStory[];

export const getStory = (slug: string) => stories.find((s) => s.slug === slug);
export const getEditorial = (id: string) => entries.find((e) => e.story.id === id)?.editorial;
export const getCategory = (id: string) => categories.find((c) => c.id === id);

export const isReviewed = (s: Story) => s.editorial_review_status === 'approved';

export function storiesInCategory(id: string) {
  return stories.filter((s) => s.category_ids.includes(id));
}

export function storiesForSurah(surah: number) {
  return stories.filter((s) => s.quran_references.some((r) => parseRef(r)?.surah === surah));
}

/** Stories whose references include this exact ayah. */
export function storiesForAyah(surah: number, ayah: number) {
  return stories.filter((s) =>
    s.quran_references.some((r) => {
      const p = parseRef(r);
      return p && p.surah === surah && ayah >= p.from && ayah <= p.to;
    }),
  );
}

export function surahsWithStories(): number[] {
  const set = new Set<number>();
  stories.forEach((s) => s.quran_references.forEach((r) => set.add(parseRef(r)!.surah)));
  plannedStories.forEach((p) => p.primary_surahs.forEach((n) => set.add(n)));
  return [...set].sort((a, b) => a - b);
}
