#!/usr/bin/env node
// The 114-surah status report. Reads what is really in the repository (the
// verified Quran text, the design records, the adventure recipes and the
// story chapters) and writes:
//   content/worlds/status-114.json   one row per surah
//   docs/STATUS-114.md               the same as a readable table
// Test results that live outside the repo (headless physics sweeps) are
// listed in TESTED below with their date, so nothing is claimed that was not
// run. Statuses:
//   Not Started     no world in the adventure engine yet (an older walk-through scene may exist)
//   In Development  part of the surah is playable (e.g. one story chapter)
//   Playable        an adventure world exists, but some story passages have no place in it or a check is missing
//   Tested          every story passage has a place, interaction tests and movement checks pass
//   Awaiting Scholarly Review / Complete: not given by this script; they need a named human reviewer.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const J = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const arabic = J('content/quran/arabic-hafs.json');
const english = J('content/quran/translation-en-saheeh.json');
const surahs = J('content/quran/surahs.json');
const designs = Object.fromEntries(
  readdirSync(join(root, 'content/worlds/designs'))
    .filter((f) => /^\d{3}\.json$/.test(f))
    .map((f) => [Number(f.slice(0, 3)), J(`content/worlds/designs/${f}`)]),
);

// Movement and collision sweeps (scripts/physics/run-all.sh), headless Chromium, software WebGL.
const TESTED = JSON.parse(readFileSync(join(root, 'content/worlds/physics-results.json'), 'utf8'));

// Story chapters that live outside a surah's own recipe (src/home/adventures.ts CHAPTERS).
const chapters = readFileSync(join(root, 'src/home/adventures.ts'), 'utf8');
const extraRefs = {};
for (const m of chapters.matchAll(/surah: (\d+), key: '(\w+)'.*?ref: '(\d+):(\d+)[–-](\d+)'/g)) {
  const [, s, , rs, a, b] = m.map((x, i) => (i ? (i === 2 ? x : Number(x)) : x));
  if (rs === s) for (let i = a; i <= b; i++) (extraRefs[s] ??= []).push(i);
}

function recipe(n) {
  const f = join(root, `src/adventure/worlds/w${String(n).padStart(3, '0')}.ts`);
  return existsSync(f) ? readFileSync(f, 'utf8') : null;
}
const index = readFileSync(join(root, 'src/adventure/worlds/index.ts'), 'utf8');
const registered = new Set([...index.matchAll(/(\d+): W\d{3}/g)].map((m) => Number(m[1])));

const refsIn = (n, t) => [...t.matchAll(/\[\s*(\d+)\s*,\s*(\d+)\s*\]/g)].filter((m) => Number(m[1]) === n).map((m) => Number(m[2]));
/** Ayahs of surah n given a place in its recipe: `read` (a reading place) and `played` (a hands-on activity). */
function placed(n, text) {
  const read = new Set(extraRefs[n] ?? []);
  const played = new Set(extraRefs[n] ?? []);
  if (!text) return { read, played };
  const body = text.slice(text.indexOf('tasks: ['), text.indexOf('\n  finale:'));
  for (const chunk of body.split(/\n    \{\n/).slice(1)) {
    const kind = (chunk.match(/kind: '(\w+)'/) ?? [])[1];
    for (const a of refsIn(n, chunk)) (kind === 'read' || kind === 'quiz' ? read : played).add(a);
  }
  for (const a of refsIn(n, text)) read.add(a);
  return { read, played };
}

const range = (ref) => {
  const m = String(ref).match(/(\d+):(\d+)(?:\s*[-–]\s*(\d+))?/);
  return m ? { s: Number(m[1]), a: Number(m[2]), b: Number(m[3] ?? m[2]) } : null;
};

const rows = [];
for (const info of surahs) {
  const n = info.number;
  const d = designs[n] ?? {};
  const text = registered.has(n) ? recipe(n) : null;
  const okText = arabic[n - 1]?.length === info.ayahCount && english[n - 1]?.length === info.ayahCount && arabic[n - 1].every((a) => a.trim());
  const where = placed(n, text);
  const passages = (d.narrative_passages ?? []).map((p) => ({ title: p.title, ref: p.reference, r: range(p.reference) })).filter((p) => p.r && p.r.s === n);
  const inR = (set, p) => [...set].some((a) => a >= p.r.a && a <= p.r.b);
  const missing = passages.filter((p) => !inR(where.read, p) && !inR(where.played, p));
  const readOnly = passages.filter((p) => !missing.includes(p) && !inR(where.played, p));
  const hasWorld = !!text;
  const chapterOnly = !hasWorld && (extraRefs[n]?.length ?? 0) > 0;
  const tests = d.unique_world?.interaction_tests ?? {};
  const testsPass = hasWorld && Object.keys(tests).length > 0 && Object.entries(tests).every(([k, v]) => k === 'devices' || String(v).startsWith('pass'));
  const phys = TESTED.worlds[String(n)] ?? (chapterOnly && n === 11 ? TESTED.worlds.ark : undefined);
  const name = hasWorld ? (text.match(/name: '([^']+)'/) ?? [])[1] : null;
  const kinds = hasWorld ? [...new Set([...text.matchAll(/kind: '(\w+)'/g)].map((m) => m[1]))] : [];
  const issues = [];
  if (!hasWorld && !chapterOnly) issues.push(`No adventure world yet. An older walk-through scene exists (lanterns and one drag activity), not in the current art direction. Planned mechanic: ${d.unique_world?.primary_mechanic?.kind ?? 'none'}.`);
  if (chapterOnly) issues.push('Only one story chapter is playable; the surah has no adventure world of its own yet.');
  if (missing.length) issues.push(`Story passages with no place in the world: ${missing.map((p) => `${p.title} (${p.ref})`).join('; ')}.`);
  if (readOnly.length) issues.push(`Story passages that are a reading place only, with no hands-on chapter: ${readOnly.map((p) => `${p.title} (${p.ref})`).join('; ')}.`);
  const untested = Object.entries(tests).filter(([k, v]) => k !== 'devices' && !String(v).startsWith('pass')).map(([k]) => k);
  if (hasWorld && untested.length) issues.push(`Interaction checks not yet passed: ${untested.join(', ')}.`);
  if (hasWorld && !phys) issues.push('Movement and collision sweep not run yet.');
  if (phys?.note) issues.push(phys.note);
  issues.push('Recitation off: no licensed reciter supplied. Narration is text read by the device voice; no licensed recording.');

  let status = 'Not Started';
  if (chapterOnly) status = 'In Development';
  if (hasWorld) status = 'Playable';
  if (hasWorld && !missing.length && !readOnly.length && testsPass && phys?.desktop === 'pass') status = 'Tested';

  rows.push({
    surah: n,
    name: info.nameTransliterated,
    meaning: info.nameMeaning,
    ayahs: info.ayahCount,
    world: name ?? (chapterOnly ? 'Story chapter only (Ark, 11:37-44)' : null),
    kinds,
    status,
    quran_text_complete: okText ? `Yes: ${info.ayahCount} ayahs, Arabic (KFGQPC Hafs) and Saheeh International, in order` : 'NO',
    story_coverage: passages.length ? `${passages.length - missing.length - readOnly.length} of ${passages.length} played, ${readOnly.length} read only, ${missing.length} missing` : hasWorld ? 'No historical narrative listed; themes only' : 'Not built',
    story_complete: hasWorld ? !missing.length && !readOnly.length : false,
    narration: hasWorld || chapterOnly ? 'Written (child-friendly English, draft); device voice only' : 'Draft text in the design record only',
    unique_world: hasWorld ? 'Yes' : chapterOnly ? 'Partial' : 'No',
    gameplay_functional: hasWorld ? (testsPass ? 'Yes (interaction tests pass, headless)' : 'Not fully tested') : 'No',
    movement_collision: phys ? `${phys.desktop === 'pass' ? 'Pass' : phys.desktop} (desktop, ${TESTED.date})` : hasWorld ? 'Not run' : 'No',
    mobile: phys?.phone ? `Phone emulation ${phys.phone} (${TESTED.date}); no real phone` : hasWorld && String(tests.devices ?? '').startsWith('pass') ? 'Phone emulation (interaction tests); no real phone' : 'No',
    content_reviewed: 'No: unreviewed by a scholar',
    remaining_issues: issues,
  });
}

mkdirSync(join(root, 'docs'), { recursive: true });
writeFileSync(join(root, 'content/worlds/status-114.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), rows }, null, 1) + '\n');

const count = (s) => rows.filter((r) => r.status === s).length;
const md = [
  '# Quran Adventure: status of all 114 surahs',
  '',
  `Generated by \`npm run status\` on ${new Date().toISOString().slice(0, 10)} from the repository itself. Nothing here is scholar-reviewed.`,
  '',
  `**Totals:** Tested ${count('Tested')} · Playable ${count('Playable')} · In Development ${count('In Development')} · Not Started ${count('Not Started')} · Awaiting Scholarly Review 0 · Complete 0.`,
  '',
  'All 114 surahs already have the complete verified Arabic text and the Saheeh International translation in the reader (6,236 ayahs, checksummed). Recitation is off everywhere until a licensed reciter is supplied. Story narration is written text read by the device voice.',
  '',
  '"Tested" means tested by Claude in headless Chromium with software WebGL and phone emulation, not on a real phone and not by a person. No world can move past Tested until a named scholar reviews it.',
  '',
  '| # | Surah | World | Status | Quran text | Story coverage | Narration | Unique world | Gameplay | Movement & collision | Mobile | Reviewed | Remaining issues |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.surah} | ${r.name} (${r.meaning}) | ${r.world ?? '—'} | **${r.status}** | ${r.quran_text_complete.startsWith('Yes') ? 'Yes' : 'NO'} | ${r.story_coverage} | ${r.narration} | ${r.unique_world} | ${r.gameplay_functional} | ${r.movement_collision} | ${r.mobile} | No | ${r.remaining_issues.join(' ').replace(/\|/g, '/')} |`),
  '',
].join('\n');
writeFileSync(join(root, 'docs/STATUS-114.md'), md);
console.log(`Status: Tested ${count('Tested')}, Playable ${count('Playable')}, In Development ${count('In Development')}, Not Started ${count('Not Started')}`);
