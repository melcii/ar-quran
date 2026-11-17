// Writes content/worlds/studio-records.json: the parts of each surah's design
// record that the Admin Studio's surah manager shows (themes, story passages,
// references, learning objectives, environment). Run after changing designs.
import fs from 'node:fs';
const out = [];
for (let n = 1; n <= 114; n++) {
  const d = JSON.parse(fs.readFileSync(new URL(`../content/worlds/designs/${String(n).padStart(3, '0')}.json`, import.meta.url)));
  out.push({
    surah: n,
    themes: d.themes,
    passages: (d.narrative_passages ?? []).map((p) => ({ title: p.title, reference: p.reference })),
    references: d.quran_references,
    objectives: d.learning_objectives,
    environment: d.environment_concept,
    review: d.scholarly_review,
  });
}
fs.writeFileSync(new URL('../content/worlds/studio-records.json', import.meta.url), JSON.stringify({ generated: 'npm run studio:records', records: out }) + '\n');
console.log('wrote', out.length, 'records');
