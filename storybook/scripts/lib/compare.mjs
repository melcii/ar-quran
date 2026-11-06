// Helpers for comparing two copies of the same text that use different
// Unicode encodings of the same marks.

// Keeps only the Arabic letters of a verse, so that two encodings of the same
// mushaf compare equal while a missing, added or changed letter does not.
// Alef wasla, hamza forms and the small high/low letters are folded so that
// encoding choices of different KFGQPC releases do not count as differences.
export function skeleton(text) {
  return text
    .normalize("NFC")
    .replace(/ٱ/g, "ا")
    .replace(/[آأإ]/g, "ا")
    .replace(/ٔ/g, "ء")
    .replace(/[^ء-غف-ي]/g, "");
}

// Some copies of a translation drop the punctuation at the start and end of
// each verse; compare without it.
export function stripEndPunctuation(text) {
  return text
    .trim()
    .replace(/^[\s"'“‘(\[]+/u, "")
    .replace(/[\s.,;:!?"'”’\-–—)\]]+$/u, "");
}
