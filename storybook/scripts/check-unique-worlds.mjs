#!/usr/bin/env node
// Unique-world check. Every design record carries a `unique_world` block.
// For worlds marked playable or partial, this script:
//  1. requires every field (theme, references, primary mechanic, secondary
//     activities, narrative, assets, environment behaviour, objective,
//     interaction tests, review status);
//  2. rejects two worlds with the same primary mechanic;
//  3. rejects pairs that are "the same world in different colours": high
//     overlap of their engine task kinds AND of their assets/environment words;
//  4. checks the declared primary engine kinds really appear in the recipe;
//  5. rejects an interaction test marked "pass" without a method note.
// It also prints how many worlds are playable, partial or conceptual.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.env.DESIGNS_DIR ?? join(root, 'content/worlds/designs');
const recs = readdirSync(dir)
  .filter((f) => /^\d{3}\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

const errors = [];
const warns = [];
const FIELDS = ['visual_theme', 'quran_references', 'primary_mechanic', 'secondary_activities', 'narrative_structure', 'world_assets', 'environment_behaviour', 'learning_objective', 'interaction_tests', 'scholarly_review'];
const TESTS = ['activate', 'responds', 'feedback', 'goal', 'completion', 'saved', 'devices'];
// Kinds every world may use without making it alike (reading places, simple spots).
const GENERIC = new Set(['read', 'points', 'quiz', 'carry']);
const STOP = new Set(['the', 'a', 'and', 'of', 'in', 'to', 'with', 'per', 'on', 'for', 'then', 'its', 'one']);

const words = (arr) => new Set(arr.join(' ').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
const jacc = (a, b) => {
  const u = new Set([...a, ...b]);
  if (!u.size) return 0;
  let i = 0;
  for (const x of a) if (b.has(x)) i++;
  return i / u.size;
};

function recipeKinds(r) {
  const f = r.unique_world.built_in;
  if (!f || !f.endsWith('.ts')) return null;
  const p = join(root, f);
  if (!existsSync(p)) return null;
  const src = readFileSync(p, 'utf8');
  // Task kinds only (tree kinds and structure kinds use other words).
  const kinds = new Set();
  for (const m of src.matchAll(/kind: '([a-z]+)'/g)) kinds.add(m[1]);
  const TASKS = ['read', 'points', 'carry', 'lead', 'pick', 'guide', 'quiz', 'stand', 'reach', 'observe', 'sky', 'sail', 'choice', 'share', 'promise', 'weigh', 'flow', 'sift', 'return', 'granary', 'valley', 'grow', 'pollen', 'rubbing', 'streets', 'sunpath', 'point', 'beacon', 'doors', 'order', 'home', 'mirror', 'shadow', 'echo', 'ants', 'river', 'shelter', 'rain', 'voice', 'pasture', 'plumb', 'sluice', 'shades', 'moon', 'vine', 'spring', 'harvest', 'measure', 'dawn', 'shimmer', 'rollcall', 'links', 'clues', 'scope', 'council', 'adorn', 'survey', 'station', 'dunes', 'channels', 'calm', 'rumour', 'rootbox', 'release', 'blazes', 'starhop', 'recall', 'estuary', 'firedrill', 'forge', 'listen', 'welcome', 'span', 'bond', 'friday', 'chances', 'pack', 'loads', 'amends', 'wings', 'glean', 'unseen', 'portion', 'reflect', 'hush', 'nightclock', 'wash', 'prints', 'doorstep', 'winnow', 'pegs', 'dig'];
  return new Set([...kinds].filter((k) => TASKS.includes(k)));
}

const live = [];
const planned = [];
const tiers = { playable: 0, partial: 0, conceptual: 0 };
for (const r of recs) {
  const u = r.unique_world;
  const id = `surah ${r.surah}`;
  if (!u) {
    errors.push(`${id}: no unique_world block`);
    continue;
  }
  const tier = u.tier.startsWith('playable') ? 'playable' : u.tier.startsWith('partial') ? 'partial' : 'conceptual';
  tiers[tier]++;
  if (tier === 'conceptual') {
    // Designs not built yet still may not share a primary mechanic with any other world.
    if (u.primary_mechanic?.kind) planned.push({ id, kind: u.primary_mechanic.kind });
    continue;
  }
  for (const f of FIELDS) {
    const v = u[f];
    if (v == null || (Array.isArray(v) && !v.length) || v === '') errors.push(`${id}: missing ${f}`);
  }
  for (const k of TESTS) {
    const v = u.interaction_tests?.[k];
    if (!v) errors.push(`${id}: interaction test "${k}" not recorded`);
    else if (/^pass/.test(v) && !/[(:]/.test(v)) errors.push(`${id}: "${k}" says pass with no method`);
  }
  const kinds = recipeKinds(r);
  const engine = (u.primary_mechanic?.engine ?? '').split(/[+(),\s]+/).filter((k) => /^[a-z]+$/.test(k));
  if (kinds) for (const k of engine) if (!kinds.has(k)) errors.push(`${id}: primary mechanic says "${k}" but the recipe has no ${k} task`);
  live.push({ id, r, u, kinds: kinds ? new Set([...kinds].filter((k) => !GENERIC.has(k))) : new Set(engine), look: words([u.visual_theme, ...u.world_assets, ...u.environment_behaviour]) });
}

for (let i = 0; i < live.length; i++)
  for (let j = i + 1; j < live.length; j++) {
    const a = live[i];
    const b = live[j];
    if (a.u.primary_mechanic.kind === b.u.primary_mechanic.kind) errors.push(`${a.id} and ${b.id}: same primary mechanic "${a.u.primary_mechanic.kind}"`);
    const k = jacc(a.kinds, b.kinds);
    const l = jacc(a.look, b.look);
    if (k >= 0.6 && l >= 0.3) errors.push(`${a.id} and ${b.id}: same kinds of play (${(k * 100) | 0}% overlap) and similar look (${(l * 100) | 0}%): effectively the same world`);
    else if (k >= 0.6) warns.push(`${a.id} and ${b.id}: ${(k * 100) | 0}% overlap in kinds of play (${[...a.kinds].filter((x) => b.kinds.has(x)).join(', ')}), but different primary mechanic and look`);
  }

{
  const seen = new Map(live.map((w) => [w.u.primary_mechanic.kind, w.id]));
  for (const p of planned) {
    if (seen.has(p.kind)) errors.push(`${p.id} (planned) and ${seen.get(p.kind)}: same primary mechanic "${p.kind}"`);
    else seen.set(p.kind, p.id);
  }
}
console.log(`Worlds: ${tiers.playable} playable, ${tiers.partial} partial, ${tiers.conceptual} conceptual (of ${recs.length}); ${planned.length} designs not built yet have a primary mechanic, all different.`);
for (const w of warns) console.log(`note: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`FAIL: ${e}`);
  process.exit(1);
}
console.log('Unique-world check passed.');
