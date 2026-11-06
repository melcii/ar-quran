// Read-only access to the canonical Quran dataset in content/quran/.
// The app never edits these arrays; they are frozen on load so that an
// accidental write throws in development instead of silently changing text.
import arabicData from '@content/quran/arabic-hafs.json';
import manifest from '@content/quran/manifest.json';
import surahData from '@content/quran/surahs.json';
import englishData from '@content/quran/translation-en-saheeh.json';
import type { AyahRef, ParsedRef, QuranVerse, Surah } from './types';

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

const arabic = deepFreeze(arabicData as string[][]);
const english = deepFreeze(englishData as (string | null)[][]);
export const surahs = deepFreeze(surahData as Surah[]);

export const quranSources = deepFreeze({
  arabic: manifest.files['arabic-hafs.json'],
  translation: manifest.files['translation-en-saheeh.json'],
  importedAt: manifest.importedAt,
});

const TEXT_SOURCE = 'KFGQPC Uthmanic Hafs';
const TEXT_VERSION = 'v3.0';
const TRANSLATION_SOURCE = 'Saheeh International';

export function getSurah(n: number): Surah | undefined {
  return surahs[n - 1];
}

export function getVerse(surah: number, ayah: number): QuranVerse | undefined {
  const s = getSurah(surah);
  const text = arabic[surah - 1]?.[ayah - 1];
  if (!s || text == null) return undefined;
  return Object.freeze({
    surah_number: surah,
    surah_name: s.nameTransliterated,
    ayah_number: ayah,
    arabic_text: text,
    translation_text: english[surah - 1]?.[ayah - 1] ?? null,
    translation_source: TRANSLATION_SOURCE,
    text_source: TEXT_SOURCE,
    text_version: TEXT_VERSION,
  });
}

/** The basmalah shown above a surah. Taken verbatim from 1:1; it is not numbered. */
export function basmalahFor(surah: number): string | null {
  if (surah === 1 || surah === 9) return null;
  return arabic[0][0];
}

export function parseRef(ref: AyahRef): ParsedRef | null {
  const m = /^(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/.exec(ref.trim());
  if (!m) return null;
  const surah = +m[1];
  const from = +m[2];
  const to = m[3] ? +m[3] : from;
  const s = getSurah(surah);
  if (!s || from < 1 || to < from || to > s.ayahCount) return null;
  return { surah, from, to };
}

export function versesFor(ref: AyahRef): QuranVerse[] {
  const p = parseRef(ref);
  if (!p) return [];
  const out: QuranVerse[] = [];
  for (let a = p.from; a <= p.to; a++) {
    const v = getVerse(p.surah, a);
    if (v) out.push(v);
  }
  return out;
}

export function formatRef(ref: AyahRef): string {
  const p = parseRef(ref);
  if (!p) return ref;
  const name = getSurah(p.surah)!.nameTransliterated;
  return `${name} ${p.surah}:${p.from}${p.to !== p.from ? `–${p.to}` : ''}`;
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => ARABIC_DIGITS[+d]);

/** Search by surah number, name (Arabic or English) or a reference like "37:142". */
export function searchQuran(query: string): { surah: Surah; ayah?: number }[] {
  const q = query.trim().toLowerCase();
  if (!q) return surahs.map((surah) => ({ surah }));
  const ref = /^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/.exec(q);
  if (ref) {
    const s = getSurah(+ref[1]);
    return s && +ref[2] >= 1 && +ref[2] <= s.ayahCount ? [{ surah: s, ayah: +ref[2] }] : [];
  }
  const fold = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[̀-ͯ‘’'`-]/g, '')
      .replace(/[ً-ٰٟ]/g, '')
      .toLowerCase();
  const fq = fold(q);
  return surahs
    .filter(
      (s) =>
        String(s.number) === q ||
        fold(s.nameTransliterated).includes(fq) ||
        fold(s.nameMeaning).includes(fq) ||
        fold(s.nameArabic).includes(fq),
    )
    .map((surah) => ({ surah }));
}
