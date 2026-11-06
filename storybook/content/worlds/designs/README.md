# World design records (drafts)

One JSON file per surah (`001.json` … `114.json`), each with the 18 fields the
team asked for: number and name, ayah count, content type and themes, narrative
passages, a summary for children, world title, concept, architecture and
scenery, palette and atmosphere, areas, activities, narration plan, learning
objectives, ayah-to-environment connections, required assets, development
status, Quran references and scholarly review status.

Rules the validator (`npm run validate`) enforces on every record:

- Every narrative passage and area cites an ayah of the same surah, and its
  `anchor_phrase` appears in that ayah's Saheeh International translation.
  This is how a reader checks that each part of a world comes from the surah.
- Every activity is labelled an artistic educational adaptation.
- World titles are unique. No Arabic script is written here: the Arabic is
  shown only from the verified dataset.
- A record may not claim a playable world without naming the code that builds
  it, may not claim testing without saying how, and may not claim review
  without a named reviewer.

Status today: all 114 are **designed drafts, unreviewed**. No surah has its own
playable world yet; the app says so on each surah's plaque. Narrative records
are richer than those of very short surahs, and every record needs review by a
qualified scholar before public release.

After editing a record, run `npm run designs:index` to refresh
`content/worlds/design-index.json`, the summary the app bundles.
