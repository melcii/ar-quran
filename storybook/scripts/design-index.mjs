// Builds content/worlds/design-index.json, the small summary of the 114 world
// design records that the app bundles. The records in content/worlds/designs
// are the source; run `npm run designs:index` after changing one. The
// validator fails if the index is out of date.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "content", "worlds", "designs");

export function buildDesignIndex() {
  const designs = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")))
    .map((d) => ({
      surah: d.surah,
      world_title: d.world_title,
      content_type: d.content_type.primary,
      concept: d.environment_concept,
      summary: d.summary_for_children,
      areas: d.areas.map((a) => ({ name: a.name, reference: a.reference, description: a.description })),
      activities: d.activities.map((a) => ({ name: a.name, reference: a.reference, description: a.description, kind: a.kind ?? "card" })),
      objectives: d.learning_objectives,
      narration: d.narration_plan,
      status: d.status,
      review: d.scholarly_review.status,
    }));
  return JSON.stringify({ note: "Generated from content/worlds/designs by scripts/design-index.mjs. Do not edit.", designs }, null, 1) + "\n";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(join(root, "content", "worlds", "design-index.json"), buildDesignIndex());
  console.log("Wrote content/worlds/design-index.json");
}
