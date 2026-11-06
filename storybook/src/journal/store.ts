// The Quran Discovery Journal's own notes, kept on this device. Progress in
// each world (chapters done) is read from that world's save, so there is one
// source of truth; the journal adds what the saves do not hold: worlds
// visited, Quran references read, words met, animals and plants watched, and
// the child's reflections.
import { wordsIn } from './words';

export type JournalData = {
  v: 1;
  /** World key ('1'..'10', 'ark') → visits. */
  worlds: Record<string, { title: string; surah: number; first: number; last: number }>;
  /** "s:a" → first read. */
  refs: Record<string, number>;
  /** Word id → first met. */
  words: Record<string, number>;
  /** Observation id → what was noticed. */
  seen: Record<string, { world: string; label: string; note: string; at: number; animal?: string }>;
  reflections: { world: string; prompt: string; text: string; at: number }[];
};

const KEY = 'quran-adventure.journal.v1';
const empty = (): JournalData => ({ v: 1, worlds: {}, refs: {}, words: {}, seen: {}, reflections: [] });

function read(): JournalData {
  try {
    const d = JSON.parse(globalThis.localStorage?.getItem(KEY) ?? 'null');
    if (d && d.v === 1) return { ...empty(), ...d };
  } catch {
    /* fall through */
  }
  return empty();
}

let data = read();
const subs = new Set<() => void>();
function save() {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(data));
  } catch {
    /* kept for this session only */
  }
  subs.forEach((f) => f());
}

export const journal = {
  get: () => data,
  reload() {
    data = read();
    subs.forEach((f) => f());
  },
  subscribe(f: () => void) {
    subs.add(f);
    return () => void subs.delete(f);
  },
  visit(world: string, title: string, surah: number) {
    const now = Date.now();
    const w = data.worlds[world];
    data.worlds[world] = { title, surah, first: w?.first ?? now, last: now };
    save();
  },
  /** Ayahs read in a world: also marks the words in them as met. */
  read(refs: [number, number][]) {
    const now = Date.now();
    let changed = false;
    for (const [s, a] of refs) {
      const k = `${s}:${a}`;
      if (!data.refs[k]) {
        data.refs[k] = now;
        changed = true;
      }
    }
    for (const w of wordsIn(refs))
      if (!data.words[w.id]) {
        data.words[w.id] = now;
        changed = true;
      }
    if (changed) save();
  },
  observe(id: string, o: { world: string; label: string; note: string; animal?: string }) {
    if (data.seen[id]) return;
    data.seen[id] = { ...o, at: Date.now() };
    save();
  },
  reflect(world: string, prompt: string, text: string) {
    const t = text.trim();
    if (!t) return;
    data.reflections.push({ world, prompt, text: t.slice(0, 400), at: Date.now() });
    save();
  },
  removeReflection(at: number) {
    data.reflections = data.reflections.filter((r) => r.at !== at);
    save();
  },
  clear() {
    data = empty();
    save();
  },
};
