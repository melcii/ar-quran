// The narration lines a world speaks, with the ids recordings are matched by.
import type { WorldDef } from '@/adventure/types';
import { lineId } from '@/audio/catalog';

/** The narration lines a world speaks: its welcome and each chapter's opening and closing words. */
export function narrationLines(def: WorldDef): { where: string; text: string; id: string }[] {
  const out: { where: string; text: string; id: string }[] = [];
  const add = (where: string, text?: string) => text && out.push({ where, text, id: lineId(text) });
  add('Welcome', def.welcome);
  for (const t of def.tasks) {
    add(`${t.title}: when it opens`, t.intro);
    add(`${t.title}: when it is done`, t.outro);
  }
  return out;
}

