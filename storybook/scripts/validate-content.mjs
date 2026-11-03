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

// ---- Surah worlds ---------------------------------------------------------
// One symbolic setting per surah. Every reference must point at real ayahs,
// the setting must exist in src/world/settings.ts, story doorways must lead to
// a real story, and nothing may claim scholarly approval without a reviewer.
const worlds = readJson(join(root, "content", "worlds", "surah-worlds.json")).worlds;
const settingsSource = readFileSync(join(root, "src", "world", "settings.ts"), "utf8");
const settingNames = new Set([...settingsSource.match(/export type SettingName =([^;]+);/)[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]));
if (worlds.length !== 114) fail(`surah-worlds.json: ${worlds.length} entries, expected 114`);
worlds.forEach((w, i) => {
  const ctx = `surah-worlds.json surah ${w.surah}`;
  if (w.surah !== i + 1) fail(`surah-worlds.json: entry ${i} is surah ${w.surah}, expected ${i + 1}`);
  if (!settingNames.has(w.setting)) fail(`${ctx}: unknown setting "${w.setting}"`);
  if (!w.basis || w.basis.length < 20) fail(`${ctx}: needs a basis explaining the setting`);
  if (ARABIC_SCRIPT.test(JSON.stringify(w))) fail(`${ctx}: contains Arabic script`);
  w.references.forEach((r) => {
    const p = parseRef(r);
    if (!p) fail(`${ctx}: bad reference "${r}"`);
    else if (p.surah !== w.surah) fail(`${ctx}: reference ${r} is from another surah`);
  });
  if (w.setting !== "garden" && w.setting !== "opening" && !w.references.length) fail(`${ctx}: a named setting must cite the ayahs it draws on`);
  if (w.story && !storyIds.includes(w.story)) fail(`${ctx}: story doorway "${w.story}" has no story`);
  if (w.review_status !== "unreviewed" && !w.reviewer) fail(`${ctx}: marked ${w.review_status} without a named reviewer`);
});

// ---- Story outlines and the surah catalog --------------------------------
// Draft narration from the project team. References must be real, featured
// ayahs must fall inside the outline's references, no Arabic script may appear
// (scripture comes from the dataset), and nothing may claim review without a reviewer.
const outlines = readJson(join(root, "content", "outlines", "stories.json")).stories;
const outlineIds = new Set();
outlines.forEach((o) => {
  const ctx = `outline ${o.id}`;
  if (outlineIds.has(o.id)) fail(`${ctx}: duplicate id`);
  outlineIds.add(o.id);
  if (!o.title || !o.narration?.length || !o.lessons) fail(`${ctx}: needs a title, narration and lessons`);
  if (ARABIC_SCRIPT.test(JSON.stringify(o))) fail(`${ctx}: contains Arabic script`);
  const refs = o.quran_references.map((r) => parseRef(r) ?? (fail(`${ctx}: bad reference "${r}"`), null)).filter(Boolean);
  if (!refs.length) fail(`${ctx}: needs at least one Quran reference`);
  o.featured_ayahs.forEach((r) => {
    const p = parseRef(r);
    if (!p) fail(`${ctx}: bad featured ayah "${r}"`);
    else if (!within(p, refs)) fail(`${ctx}: featured ${r} is outside its references`);
  });
  if (o.review_status !== "unreviewed" && !o.reviewer) fail(`${ctx}: marked ${o.review_status} without a named reviewer`);
});
const catalog = readJson(join(root, "content", "outlines", "surah-catalog.json")).surahs;
if (catalog.length !== 114) fail(`surah-catalog.json: ${catalog.length} entries, expected 114`);
catalog.forEach((c, i) => {
  if (c.surah !== i + 1) fail(`surah-catalog.json: entry ${i} is surah ${c.surah}`);
  if (!c.themes || !c.environment_idea) fail(`surah-catalog.json surah ${c.surah}: missing themes or environment idea`);
  if (ARABIC_SCRIPT.test(JSON.stringify(c))) fail(`surah-catalog.json surah ${c.surah}: contains Arabic script`);
});

// Design records: one per surah, every anchor phrase found in its ayah's translation.
const designsDir = join(root, "content", "worlds", "designs");
const designFiles = readdirSync(designsDir).filter((f) => f.endsWith(".json")).sort();
if (designFiles.length !== 114) fail(`worlds/designs: ${designFiles.length} records, expected 114`);
const designTitles = new Set();
const FIELDS = ["surah", "name", "ayah_count", "content_type", "themes", "narrative_passages", "summary_for_children", "world_title", "environment_concept", "architecture_and_scenery", "palette", "areas", "activities", "narration_plan", "learning_objectives", "ayah_environment_connections", "required_assets", "status", "quran_references", "scholarly_review"];
const HONEST = { playable_environment: /^not built/, testing: /^not tested/ };
let designsBuilt = 0;
let unreviewedDesigns = 0;
designFiles.forEach((f, i) => {
  const d = readJson(join(designsDir, f));
  const ctx = `worlds/designs/${f}`;
  if (d.surah !== i + 1) return fail(`${ctx}: is surah ${d.surah}, expected ${i + 1}`);
  FIELDS.forEach((k) => d[k] == null && fail(`${ctx}: missing ${k}`));
  if (d.ayah_count !== surahs[i].ayahCount) fail(`${ctx}: ayah_count ${d.ayah_count}, dataset says ${surahs[i].ayahCount}`);
  if (designTitles.has(d.world_title)) fail(`${ctx}: world title "${d.world_title}" is not unique`);
  designTitles.add(d.world_title);
  if (ARABIC_SCRIPT.test(JSON.stringify(d))) fail(`${ctx}: contains Arabic script`);
  if (!d.areas.length || !d.activities.length) fail(`${ctx}: needs at least one area and one activity`);
  const anchored = [...d.narrative_passages, ...d.areas, ...d.ayah_environment_connections];
  anchored.forEach((a) => {
    const p = parseRef(a.reference);
    if (!p) return fail(`${ctx}: bad reference "${a.reference}"`);
    if (p.surah !== d.surah) fail(`${ctx}: ${a.reference} is from another surah`);
    else if (!plain(translationOf(p)).includes(plain(a.anchor_phrase))) fail(`${ctx}: "${a.anchor_phrase}" is not in ${a.reference}`);
  });
  d.activities.forEach((a) => {
    const p = parseRef(a.reference);
    if (!p || p.surah !== d.surah) fail(`${ctx}: activity "${a.name}" has a bad reference`);
    if (!/adaptation/.test(a.label)) fail(`${ctx}: activity "${a.name}" is not labelled an adaptation`);
    if (a.kind && !["card", "order", "match", "journey", "find"].includes(a.kind)) fail(`${ctx}: activity "${a.name}" has unknown kind ${a.kind}`);
    if (a.kind === "order" && p && (p.to - p.from < 1 || p.to - p.from > 9)) fail(`${ctx}: order activity "${a.name}" needs 2 to 10 ayahs`);
    if (a.kind === "find" && !d.status.built_in) fail(`${ctx}: find activity "${a.name}" needs a built scene to find it in`);
    if ((a.kind === "match" || a.kind === "journey") && d.areas.length < 2) fail(`${ctx}: match activity "${a.name}" needs at least two areas`);
  });
  d.quran_references.forEach((r) => parseRef(r) || fail(`${ctx}: bad reference "${r}"`));
  const built = d.status.playable_environment && !HONEST.playable_environment.test(d.status.playable_environment);
  if (built) designsBuilt++;
  if (built && !d.status.built_in) fail(`${ctx}: claims a playable world without naming the code that builds it (status.built_in)`);
  if (!HONEST.testing.test(d.status.testing) && !d.status.tested_by) fail(`${ctx}: claims testing without saying how (status.tested_by)`);
  if (d.scholarly_review.status === "unreviewed") unreviewedDesigns++;
  if (d.scholarly_review.status !== "unreviewed" && !d.scholarly_review.reviewer) fail(`${ctx}: marked ${d.scholarly_review.status} without a named reviewer`);
});

const { buildDesignIndex } = await import("./design-index.mjs");
if (readFileSync(join(root, "content", "worlds", "design-index.json"), "utf8") !== buildDesignIndex())
  fail("content/worlds/design-index.json is out of date: run npm run designs:index");

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`Quran dataset OK: 114 surahs, ${total} ayahs, checksums match.`);
console.log(`Stories OK: ${storyIds.join(", ")}.`);
console.log(`Story outlines OK: ${outlines.length} drafts, all references real; catalog covers 114 surahs.`);
console.log(`Surah worlds OK: 114 settings; ${worlds.filter((w) => w.review_status === "unreviewed").length} still await scholarly review.`);
console.log(`World designs OK: 114 records, every anchor found in its ayah; ${designsBuilt} built as playable worlds; ${unreviewedDesigns} await scholarly review.`);
