// Validates the Quran dataset and every story before a build or release.
//
//   npm run validate
//
// Exits non-zero on any problem. Checks:
// - the Quran files match the checksums pinned in content/quran/manifest.json,
//   have all 114 surahs and 6,236 ayahs in order, and (when the dev packages are
//   installed) are still byte-for-byte what the import produced from its source;
// - every story reference points at real ayahs, every quotation of the
//   translation inside an explanation really appears in that ayah, no Arabic
//   script appears in story files (scripture must come from the dataset), and
//   nothing is marked published without an approving reviewer.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { skeleton } from "./lib/compare.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const quranDir = join(root, "content", "quran");
const errors = [];
const fail = (msg) => errors.push(msg);
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

// ---- Quran dataset -------------------------------------------------------

const manifest = readJson(join(quranDir, "manifest.json"));
for (const [name, info] of Object.entries(manifest.files)) {
  const sha = createHash("sha256").update(readFileSync(join(quranDir, name))).digest("hex");
  if (sha !== info.sha256) fail(`${name}: checksum ${sha.slice(0, 12)}… does not match manifest ${info.sha256.slice(0, 12)}…`);
}

const surahs = readJson(join(quranDir, "surahs.json"));
const arabic = readJson(join(quranDir, "arabic-hafs.json"));
const english = readJson(join(quranDir, "translation-en-saheeh.json"));

if (surahs.length !== 114 || arabic.length !== 114 || english.length !== 114) fail("Quran files must each have 114 surahs");
let total = 0;
surahs.forEach((s, i) => {
  if (s.number !== i + 1) fail(`surahs.json: entry ${i} has number ${s.number}`);
  if (arabic[i]?.length !== s.ayahCount) fail(`Surah ${s.number}: ${arabic[i]?.length} Arabic ayahs, expected ${s.ayahCount}`);
  if (english[i]?.length !== s.ayahCount) fail(`Surah ${s.number}: ${english[i]?.length} translated ayahs, expected ${s.ayahCount}`);
  arabic[i]?.forEach((t, j) => {
    if (typeof t !== "string" || !t.trim()) fail(`Arabic ${s.number}:${j + 1} is empty`);
    else if (/[^؀-ۿݐ-ݿࢠ-ࣿ ]/.test(t)) fail(`Arabic ${s.number}:${j + 1} contains non-Arabic characters`);
  });
  english[i]?.forEach((t, j) => {
    if (typeof t !== "string" || !t.trim()) fail(`Translation ${s.number}:${j + 1} is missing`);
  });
  total += s.ayahCount;
});
if (total !== 6236) fail(`Total ayahs ${total}, expected 6236`);

// Independent checks, when the source packages are installed (npm install).
const nm = (p) => join(root, "node_modules", p);
if (existsSync(nm("quran-meta/package.json"))) {
  const { getSurahMeta } = await import("quran-meta/hafs");
  surahs.forEach((s) => {
    if (getSurahMeta(s.number).ayahCount !== s.ayahCount) fail(`Surah ${s.number}: ayah count differs from quran-meta`);
  });
}
if (existsSync(nm("@quran.ws/text/package.json"))) {
  const { Mushaf } = await import("@quran.ws/text");
  const mushaf = await Mushaf.hafs();
  let changed = 0;
  surahs.forEach((s) => {
    for (let a = 1; a <= s.ayahCount; a++) {
      if (mushaf.ayah(s.number, a).render({ marks: true }) !== arabic[s.number - 1][a - 1]) {
        if (changed++ < 10) fail(`Arabic ${s.number}:${a} differs from the KFGQPC source`);
      }
    }
  });
}
if (existsSync(nm("quran-json/package.json"))) {
  const other = readJson(nm("quran-json/dist/quran.json"));
  other.forEach((s, i) =>
    s.verses.forEach((v, j) => {
      if (skeleton(v.text) !== skeleton(arabic[i][j])) fail(`Arabic ${i + 1}:${j + 1} letters differ from the QuranEnc copy`);
    }),
  );
}

// ---- References ----------------------------------------------------------

function parseRef(ref) {
  const m = /^(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/.exec(ref);
  if (!m) return null;
  const surah = +m[1], from = +m[2], to = m[3] ? +m[3] : from;
  const s = surahs[surah - 1];
  if (!s || from < 1 || to < from || to > s.ayahCount) return null;
  return { surah, from, to };
}
const within = (inner, outers) =>
  outers.some((o) => o && inner && o.surah === inner.surah && inner.from >= o.from && inner.to <= o.to);
const translationOf = (r) => english[r.surah - 1].slice(r.from - 1, r.to).join(" ");
const plain = (t) => t.replace(/[\[\]]/g, "").replace(/\s+/g, " ").toLowerCase();

// ---- Stories -------------------------------------------------------------

const library = readJson(join(root, "content", "library.json"));
const categoryIds = new Set(library.categories.map((c) => c.id));
const illustrationSource = readFileSync(join(root, "src", "illustrations", "index.tsx"), "utf8");
const illustrationKeys = new Set([...illustrationSource.matchAll(/^\s+'([a-z-]+)':/gm)].map((m) => m[1]));
const ARABIC_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

const storiesDir = join(root, "content", "stories");
const storyIds = readdirSync(storiesDir);
for (const id of storyIds) {
  const where = `stories/${id}`;
  const storyText = readFileSync(join(storiesDir, id, "story.json"), "utf8");
  const editorialPath = join(storiesDir, id, "editorial.json");
  if (!existsSync(editorialPath)) {
    fail(`${where}: missing editorial.json`);
    continue;
  }
  const editorialText = readFileSync(editorialPath, "utf8");
  if (ARABIC_SCRIPT.test(storyText) || ARABIC_SCRIPT.test(editorialText))
    fail(`${where}: contains Arabic script. Quran text must come only from content/quran, by reference.`);

  const story = JSON.parse(storyText);
  const editorial = JSON.parse(editorialText);
  if (story.id !== id) fail(`${where}: id "${story.id}" does not match folder`);
  if (editorial.story_id !== id) fail(`${where}/editorial.json: story_id mismatch`);

  for (const field of ["title", "slug", "description", "cover_art", "publication_status", "editorial_review_status"])
    if (!story[field]) fail(`${where}: missing ${field}`);
  if (!illustrationKeys.has(story.cover_art)) fail(`${where}: unknown cover_art "${story.cover_art}"`);
  story.category_ids.forEach((c) => categoryIds.has(c) || fail(`${where}: unknown category "${c}"`));

  const storyRefs = story.quran_references.map((r) => {
    const p = parseRef(r);
    if (!p) fail(`${where}: bad reference "${r}"`);
    return p;
  });
  const sourceIds = new Set(editorial.supplementary_sources.map((s) => s.id));
  const checkRef = (r, ctx) => {
    const p = parseRef(r);
    if (!p) fail(`${ctx}: bad reference "${r}"`);
    else if (!within(p, storyRefs)) fail(`${ctx}: ${r} is outside the story's references`);
    return p;
  };
  // A phrase in single quotes followed by (surah:ayah) must be a real quote of that ayah's translation.
  const checkQuotes = (text, ctx) => {
    for (const m of text.matchAll(/'([^']+)'\s*\((\d+:\d+(?:-\d+)?)\)/g)) {
      const p = parseRef(m[2]);
      if (p && !plain(translationOf(p)).includes(plain(m[1])))
        fail(`${ctx}: quoted "${m[1]}" does not appear in the translation of ${m[2]}`);
    }
  };

  story.scenes.forEach((scene, i) => {
    const ctx = `${where} scene ${scene.scene_number}`;
    if (scene.scene_number !== i + 1) fail(`${ctx}: scenes must be numbered 1..n in order`);
    if (!illustrationKeys.has(scene.illustration_asset)) fail(`${ctx}: unknown illustration "${scene.illustration_asset}"`);
    if (!scene.illustration_alt) fail(`${ctx}: missing illustration_alt`);
    if (!scene.linked_ayah_references.length) fail(`${ctx}: every scene needs at least one Quran reference`);
    scene.linked_ayah_references.forEach((r) => checkRef(r, ctx));
    (scene.featured_ayah_references ?? []).forEach((r) => checkRef(r, ctx));
    checkQuotes(scene.educational_narration, ctx);
    scene.interactive_elements.forEach((el) => {
      const ectx = `${ctx} element ${el.id}`;
      if (el.scene_id !== scene.id) fail(`${ectx}: scene_id mismatch`);
      const { x, y, radius } = el.position;
      if (![x, y, radius].every((v) => v >= 0 && v <= 1)) fail(`${ectx}: position must be fractions 0..1`);
      if (!sourceIds.has(el.supporting_source)) checkRef(el.supporting_source, ectx);
      checkQuotes(el.explanatory_text, ectx);
    });
  });
  story.activity?.events.forEach((e) => checkRef(e.reference, `${where} activity ${e.id}`));

  // Editorial record
  if (!editorial.stated_in_quran.length) fail(`${where}: editorial record lists no Quran-stated details`);
  editorial.stated_in_quran.forEach((d) => checkRef(d.reference, `${where} editorial`));
  if (!editorial.revision_history.length) fail(`${where}: editorial record has no revision history`);
  const approvals = editorial.reviewers.filter((r) => r.decision === "approved" && r.name && r.qualification);
  if (story.editorial_review_status === "approved" && !approvals.length)
    fail(`${where}: marked approved but no reviewer has approved it`);
  if (story.publication_status === "published" && (story.editorial_review_status !== "approved" || !approvals.length))
    fail(`${where}: cannot be published before a named reviewer approves it`);
}

library.planned.forEach((p) =>
  p.primary_surahs.forEach((n) => (n >= 1 && n <= 114) || fail(`library planned ${p.id}: bad surah ${n}`)),
);

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`Quran dataset OK: 114 surahs, ${total} ayahs, checksums match.`);
console.log(`Stories OK: ${storyIds.join(", ")}.`);
