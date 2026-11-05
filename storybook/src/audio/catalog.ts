// The audio catalog: reciters, narrators and recorded clips, each with its
// licence and review status (content/audio/catalog.json).
//
// Four separate categories, each with its own volume:
//   recitation  - the Quran, only ever a human recording from an identified reciter
//   narration   - the story narrator (creative educational narration, not Quran)
//   instruction - short "what to do" hints in play
//   effect      - environmental sounds (wind, sea, steps); no music anywhere
import catalog from '@content/audio/catalog.json';

export type Category = 'recitation' | 'narration' | 'instruction' | 'effect';
export type LicenceStatus = 'confirmed' | 'pending' | 'none' | 'not-needed';
export type Licence = { status: LicenceStatus; holder?: string; terms?: string; url?: string; note?: string };
export type Review = 'draft' | 'in-review' | 'approved';

export type Reciter = {
  id: string;
  name: string;
  age: 'adult' | 'child';
  reading: string;
  host: string;
  source: { kind: 'stream' | 'files'; urlTemplate: string; unit: 'ayah' };
  licence: Licence;
  verification: { matchesText: 'unverified' | 'verified'; reviewedBy: string | null; note: string };
  /** Word timings only when verified timing data exists; never guessed. */
  wordTimings: null | { url: string; verified: boolean };
};

export type Narrator = { id: string; name: string; language: string; kind: 'device' | 'recorded' | 'provider'; note: string; licence: Licence };

/** One recorded clip of narration, an instruction, an effect or a recitation. */
export type Clip = {
  id: string;
  category: Category;
  language: string;
  /** Narrator or reciter id. */
  voice: string;
  /** For narration and instructions: the hash of the line it reads (see lineId). */
  line?: string;
  surah?: number;
  ayahFrom?: number;
  ayahTo?: number;
  chapter?: string;
  file: string;
  durationMs?: number;
  subtitle: string;
  licence: Licence;
  quranVerification: 'not-quran' | 'unverified' | 'verified';
  scholarlyReview: Review;
};

type Catalog = {
  reciters: Reciter[];
  defaultReciter: string;
  narrators: Narrator[];
  defaultNarrator: string;
  languages: { id: string; name: string; narration: boolean; note?: string }[];
  clips: Clip[];
};
export const CATALOG = catalog as unknown as Catalog;

/**
 * A reciter can be played only when its licence is confirmed and a specialist
 * has checked it against the text. Until then the app shows the Arabic text
 * without a play button.
 */
export const reciterUsable = (r: Reciter) => r.licence.status === 'confirmed' && r.verification.matchesText === 'verified';
export const reciterById = (id?: string) => CATALOG.reciters.find((r) => r.id === id);
export const usableReciters = () => CATALOG.reciters.filter(reciterUsable);

/** A narrator is offered only when it can actually speak. */
export const narratorUsable = (n: Narrator) =>
  n.kind === 'device' || CATALOG.clips.some((c) => c.voice === n.id && (c.licence.status === 'confirmed' || c.licence.status === 'not-needed'));
export const narratorById = (id?: string) => CATALOG.narrators.find((n) => n.id === id);
export const usableNarrators = (lang = 'en') => CATALOG.narrators.filter((n) => n.language === lang && narratorUsable(n));

/** Normalised text, so small spacing or quote changes still find the same line. */
const norm = (t: string) =>
  t
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** A stable id for a narration line: FNV-1a hash of its normalised text. */
export function lineId(text: string) {
  let h = 0x811c9dc5;
  const s = norm(text);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `l${(h >>> 0).toString(36)}`;
}

/** A licensed recorded clip of this line in this voice, if one exists. */
export function clipFor(text: string, voice: string, language = 'en'): Clip | undefined {
  const id = lineId(text);
  return CATALOG.clips.find(
    (c) => (c.category === 'narration' || c.category === 'instruction') && c.voice === voice && c.language === language && c.line === id && c.licence.status === 'confirmed',
  );
}

/** URL of one ayah for a reciter. */
const pad3 = (n: number) => String(n).padStart(3, '0');
export const ayahUrl = (r: Reciter, surah: number, ayah: number) => r.source.urlTemplate.replace('{surah3}', pad3(surah)).replace('{ayah3}', pad3(ayah)).replace('{surah}', String(surah)).replace('{ayah}', String(ayah));
