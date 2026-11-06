// Every narration line the worlds can speak, for a recording script: a voice
// actor or a licensed voice provider records each line, and the clip is
// listed in content/audio/catalog.json under its line id. Lines are the
// game's own educational narration; Quran text is never in this list.
import { WORLDS } from '@/adventure/worlds';
import { NARRATION, READINGS, AFTER } from '@/ark/story';
import { lineId } from './catalog';

export type ScriptLine = { id: string; text: string; category: 'narration' | 'instruction'; surah: number; chapter: string; key: string };

const KEYS = new Set(['welcome', 'intro', 'outro', 'note', 'notes', 'body']);

function walk(o: unknown, path: string, out: { key: string; text: string }[]) {
  if (!o || typeof o !== 'object') return;
  if (Array.isArray(o)) return o.forEach((x, i) => walk(x, `${path}[${i}]`, out));
  for (const [k, v] of Object.entries(o)) {
    if (KEYS.has(k) && typeof v === 'string') out.push({ key: `${path}.${k}`, text: v });
    else if (KEYS.has(k) && Array.isArray(v) && v.every((x) => typeof x === 'string')) v.forEach((x, i) => out.push({ key: `${path}.${k}[${i}]`, text: x }));
    else if (typeof v === 'object' && typeof v !== 'function') walk(v, `${path}.${k}`, out);
  }
}

export function allNarrationLines(): ScriptLine[] {
  const out: ScriptLine[] = [];
  const seen = new Set<string>();
  const add = (text: string, surah: number, chapter: string, key: string) => {
    const id = lineId(text);
    if (!text.trim() || seen.has(id)) return;
    seen.add(id);
    out.push({ id, text, category: 'narration', surah, chapter, key });
  };
  for (const [k, t] of Object.entries(NARRATION)) add(t, 11, 'ark', `ark.${k}`);
  for (const r of [...READINGS, AFTER]) add(r.note, 11, 'ark', `ark.reading.${r.id}`);
  for (const [n, w] of Object.entries(WORLDS)) {
    const found: { key: string; text: string }[] = [];
    walk(w, `w${n}`, found);
    // The world's top-level notes are the written "About this world" page, not spoken.
    found.filter((f) => !f.key.startsWith(`w${n}.notes`)).forEach((f) => add(f.text, Number(n), `world-${n}`, f.key));
  }
  return out;
}

(globalThis as { __audioLines?: () => ScriptLine[] }).__audioLines = allNarrationLines;
