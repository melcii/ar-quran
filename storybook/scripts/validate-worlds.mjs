#!/usr/bin/env node
// Fast world validator for every adventure world, in plain Node (no browser).
// Run: npm run worlds:validate [-- 19 12 18]   (all 114 when no numbers)
//
// It loads each world's recipe and builds the same land the game builds
// (terrain, building footprints, trees and rocks placed with the world's seed)
// and the same Rapier collision space, then checks:
//
//  Physical
//   spawn       start point inside the world, on dry open ground, not on a slope
//   space       the collision validator the browser uses (solids, slopes, edge,
//               every footpath walked both ways, every activity spot open)
//   reach       every activity spot can be WALKED to from the spawn (a flood over
//               the walkable ground, through story doors), first with every
//               story gate as it is at the start, then with every task done
//   scenery     no tree trunk or boulder placed on top of an activity spot
//   rocks       no drawn rock taller than a child's ankle without a collider
//   herds       grazing animals start on dry, open, reachable ground
//  Story
//   graph       task ids unique, prerequisites exist, no loops, listed in story order
//   refs        every ayah reference exists; readings in other surahs listed
//   text        no wording that makes the player a prophet; no depiction words;
//               game-written lines that put words in a prophet's mouth are listed
//               for review against the cited ayahs
//   adaptation  every game activity says what is adapted
//
// Writes content/worlds/validation.json (machine readable) and prints a summary.
// Browser-only checks (drawn activity props, live walking, camera, figure
// scale, save/reload, phone controls) are in scripts/physics/.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const S = join(root, 'src');
const { WORLDS } = await import(join(S, 'adventure/worlds/index.ts'));
const T = await import(join(S, 'adventure/terrain.ts'));
const K = await import(join(S, 'adventure/kit.tsx'));
const Sc = await import(join(S, 'adventure/Scenery.tsx'));
const P = await import(join(S, 'physics/space.ts'));
const AS = await import(join(S, 'adventure/space.ts'));
const V = await import(join(S, 'physics/validate.ts'));
const { SPECS } = await import(join(S, 'ark/Beasts.tsx'));
const SUR = JSON.parse(readFileSync(join(root, 'content/quran/surahs.json'), 'utf8'));
const R = await P.loadPhysics();

const only = process.argv.slice(2).map(Number).filter(Boolean);
const list = Object.keys(WORLDS).map(Number).filter((n) => !only.length || only.includes(n)).sort((a, b) => a - b);

const PROPHETS = ['Adam', 'Nuh', 'Idris', 'Ibrahim', 'Ismail', 'Ishaq', 'Yaqub', "Ya'qub", 'Yusuf', 'Ayyub', "Shu'ayb", 'Shuayb', 'Musa', 'Harun', 'Dawud', 'Sulayman', 'Ilyas', 'Alyasa', 'Yunus', 'Zakariyya', 'Yahya', 'Isa', 'Muhammad', 'Hud', 'Salih', 'Lut', 'Dhul-Kifl', 'the Prophet'];
const NAME = `(${PROPHETS.map((p) => p.replace(/[-']/g, (c) => `\\${c}`)).join('|')})`;
const RX = {
  asProphet: new RegExp(`\\b(you are|you play as|play as|you become|become|playing as|you're)\\s+(the\\s+)?${NAME}\\b`, 'i'),
  depict: new RegExp(`\\b(statue|figure|picture|portrait|silhouette|image|model|puppet|costume|doll|mask|face) of ${NAME}\\b`, 'i'),
  depictAllah: /\b(see|picture|image|face|hand|form|figure|throne room) of Allah\b/i,
  speech: new RegExp(`\\b${NAME}\\b[^.!?"]{0,40}\\b(said|says|told|tells|asked|asks|answered|answers|replied|replies|called out|shouted|whispered)\\b`, 'i'),
};
// Words that are plain game text (not inside a verified-reading note).
const TEXT_KEYS = new Set(['goal', 'intro', 'outro', 'title', 'welcome', 'theme', 'text', 'reply', 'yes', 'no', 'prompt', 'say', 'done', 'label', 'hint', 'body', 'questions', 'wrong', 'keep', 'notes', 'play', 'name']);

const isP2 = (v) => Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n));
// Keys holding lines (routes, channels, rivers) rather than places to stand.
const LINE_KEYS = new Set(['path', 'pts', 'road', 'channels', 'gust', 'band', 'boats', 'posts']);
// Kinds whose places are reached by boat or are seen from afar.
const FAR_KINDS = new Set(['sail', 'guide', 'point', 'sky', 'starhop', 'scope', 'sight', 'moon', 'estuary']);

function spotsOf(task) {
  const out = [];
  const walk = (o, path, inLine) => {
    if (isP2(o)) return void (inLine || out.push({ at: o, path }));
    if (Array.isArray(o)) return void o.forEach((v, i) => walk(v, `${path}[${i}]`, inLine));
    if (o && typeof o === 'object')
      for (const [k, v] of Object.entries(o)) {
        if (k === 'refs' || k === 'ref' || k === 'look' || k === 'phases') continue;
        walk(v, path ? `${path}.${k}` : k, inLine || LINE_KEYS.has(k));
      }
  };
  walk(task, '', false);
  return out;
}

function readingsOf(o, out = [], path = '') {
  if (Array.isArray(o)) o.forEach((v, i) => readingsOf(v, out, `${path}[${i}]`));
  else if (o && typeof o === 'object') {
    if (Array.isArray(o.refs) && typeof o.note === 'string') out.push({ r: o, path });
    for (const [k, v] of Object.entries(o)) if (k !== 'refs') readingsOf(v, out, path ? `${path}.${k}` : k);
  }
  return out;
}

function textsOf(o, out = [], path = '', key = '', inReading = false) {
  if (typeof o === 'string') {
    if (!inReading && TEXT_KEYS.has(key)) out.push({ s: o, path });
  } else if (Array.isArray(o)) o.forEach((v, i) => textsOf(v, out, `${path}[${i}]`, key, inReading));
  else if (o && typeof o === 'object') {
    const reading = inReading || (Array.isArray(o.refs) && typeof o.note === 'string');
    for (const [k, v] of Object.entries(o)) if (typeof v !== 'function') textsOf(v, out, path ? `${path}.${k}` : k, k, reading);
  }
  return out;
}

function checkWorld(n) {
  const def = WORLDS[n];
  const issues = [];
  const add = (level, check, msg, extra) => issues.push({ level, check, msg, ...(extra ? { at: extra } : {}) });

  /* ---------------- story: identity, graph, refs, text ---------------- */
  if (def.surah !== n) add('error', 'identity', `recipe says surah ${def.surah} but is registered as ${n}`);
  const meta = SUR[n - 1];
  const ids = def.tasks.map((t) => t.id);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) add('error', 'graph', `duplicate task ids: ${[...new Set(dup)].join(', ')}`);
  const index = new Map(ids.map((x, i) => [x, i]));
  const regions = new Set((def.regions ?? []).map((r) => r.id));
  def.tasks.forEach((t, i) => {
    for (const q of t.requires ?? []) {
      const base = q.replace(/[#@]\d+$/, '');
      if (!index.has(base)) add('error', 'graph', `${t.id} requires unknown task "${q}"`);
      else if (index.get(base) > i) add('warn', 'graph', `${t.id} is listed before its prerequisite ${base} (activity list order differs from story order)`);
    }
    if (t.region && regions.size && !regions.has(t.region)) add('error', 'graph', `${t.id} is in unknown region "${t.region}"`);
    if (!t.goal) add('error', 'objective', `${t.id} has no objective line`);
  });
  // Loops: a task that can never open.
  const state = new Map();
  const visit = (id, stack) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) return void add('error', 'graph', `prerequisite loop: ${[...stack, id].join(' -> ')}`);
    state.set(id, 1);
    const t = def.tasks[index.get(id)];
    for (const q of t?.requires ?? []) if (index.has(q.replace(/[#@]\d+$/, ''))) visit(q.replace(/[#@]\d+$/, ''), [...stack, id]);
    state.set(id, 2);
  };
  ids.forEach((id) => visit(id, []));
  if (!def.tasks.some((t) => !(t.requires ?? []).length)) add('error', 'graph', 'no activity is open at the start');

  const reads = readingsOf(def);
  const cross = new Set();
  const badRef = (r) => !isP2(r) || r[0] < 1 || r[0] > 114 || r[1] < 1 || r[1] > SUR[r[0] - 1].ayahCount || !Number.isInteger(r[0]) || !Number.isInteger(r[1]);
  for (const { r, path } of reads) {
    if (!r.refs.length) add('error', 'refs', `reading "${r.title}" has no ayah references`, path);
    if (!r.note?.trim()) add('warn', 'refs', `reading "${r.title}" has no explanation`, path);
    for (const ref of r.refs) {
      if (badRef(ref)) add('error', 'refs', `reading "${r.title}" cites ${ref} which does not exist`, path);
      else if (ref[0] !== n) cross.add(`${ref[0]}:${ref[1]}`);
    }
  }
  if (badRef(def.finale.ref)) add('error', 'refs', `finale cites ${def.finale.ref} which does not exist`);
  if (cross.size) add('info', 'refs', `readings cite other surahs: ${[...cross].join(', ')}`);

  for (const { s, path } of textsOf(def)) {
    let m;
    if ((m = s.match(RX.asProphet))) add('error', 'text', `wording makes the player a prophet: "${m[0]}"`, path);
    if ((m = s.match(RX.depict))) add('error', 'text', `depiction wording: "${m[0]}"`, path);
    if ((m = s.match(RX.depictAllah))) add('error', 'text', `depiction wording about Allah: "${m[0]}"`, path);
    if ((m = s.match(RX.speech))) add('review', 'text', `game text reports a prophet's words ("${m[0]}..."): check it against the cited ayahs`, path);
  }
  for (const t of def.tasks) if (t.kind !== 'read' && !t.adaptation) add('warn', 'adaptation', `${t.id} (${t.kind}) has no note on what is adapted`);
  if (!def.notes?.length) add('warn', 'adaptation', 'no "About this world" notes');

  /* ---------------- physical ---------------- */
  let open = false; // story gates: false = start of the world, true = everything done
  const isOn = () => open;
  const t = T.makeTerrain(def.ground);
  for (const s of def.structures) K.footprint(s, t, isOn);
  const spot = (p, r) => t.keepClear.push({ x: p[0], z: p[1], r });
  for (const task of def.tasks) {
    if (task.kind === 'read' || task.kind === 'quiz') spot(task.at, 3);
    if (task.kind === 'points') task.points.forEach((p) => spot(p.at, 2.5));
    if (task.kind === 'carry') task.loads.forEach((L) => (spot(L.from, 2.5), spot(L.to, 1.8)));
    if (task.kind === 'lead') (spot(task.pen, 5), spot(task.herd.at, task.herd.r * 0.6));
    if (task.kind === 'pick') task.choices.forEach((c) => spot(c.at, 2.5));
  }
  for (const l of def.links ?? []) spot(l.at, 3);
  spot(def.start, 4);
  const nObst = t.obstacles.length;
  const placed = Sc.place(t, def.veg, def.seed);
  const sp = AS.makeSpace(R, t);
  const r0 = 0.35;

  // Spawn.
  const [sx, sz] = def.start;
  if (Math.hypot(sx, sz) > t.radius - 2) add('error', 'spawn', `start ${def.start} is at the edge of the world (radius ${t.radius})`);
  if (t.isWater(sx, sz) && !t.covered(sx, sz)) add('error', 'spawn', `start ${def.start} is in water`);
  if (!sp.okSpot(sx, sz, r0)) add('error', 'spawn', `start ${def.start} is inside a solid or on a slope`);
  else if (sp.clearance(sx, sz, 1.2) < 0.9) add('warn', 'spawn', `start ${def.start} is within ${sp.clearance(sx, sz, 1.2).toFixed(2)} m of a solid`);

  // Activity spots, by task.
  const spots = [];
  def.tasks.forEach((task) => {
    for (const s of spotsOf(task)) spots.push({ task: task.id, kind: task.kind, path: s.path, x: s.at[0], z: s.at[1], first: !(task.requires ?? []).length, far: FAR_KINDS.has(task.kind) });
  });
  for (const l of def.links ?? []) spots.push({ task: 'link', kind: 'link', path: l.label, x: l.at[0], z: l.at[1], first: true });
  for (const w of def.warps ?? []) spots.push({ task: 'warp', kind: 'warp', path: w.label, x: w.at[0], z: w.at[1], first: true });

  // Collision validator (same one the browser runs), with spots that should be walkable.
  sp.sync();
  const zones = spots.filter((s) => !s.far && Math.hypot(s.x, s.z) < t.radius && !(t.isWater(s.x, s.z) && !t.covered(s.x, s.z))).map((s) => ({ key: `${s.task}.${s.path}`, x: s.x, z: s.z, reach: 2.2 }));
  const rep = V.validateSpace(sp, { spawn: def.start, radius: t.radius, paths: def.ground.paths ?? [], zones });
  for (const e of rep.solids.entered) add('error', 'space', `walked into solid ${e.tag}`, [e.x, e.z]);
  for (const c of rep.slopes.climbs) add('error', 'space', `climbable cliff (rise ${c.rise} over ${c.run} m)`, [c.x, c.z]);
  for (const e of rep.edge.escaped) add('error', 'space', 'walked off the edge of the world', [e.x, e.z]);
  for (const s of rep.paths.stuck) add('warn', 'space', `footpath ${s.path} blocked (walker stuck going to ${s.to})`, [s.x, s.z]);
  for (const u of rep.zones.unreachable) add('error', 'space', `activity spot ${u.key} has no open ground within reach`, [u.x, u.z]);

  // Reachability by walking, through story doors.
  const C = 0.5;
  const flood = () => {
    sp.sync();
    const seen = new Set();
    const q = [];
    const keyOf = (x, z) => `${Math.round(x / C)},${Math.round(z / C)}`;
    const seed = (x, z) => {
      const o = sp.findOpen(x, z, r0, 3);
      if (!o) return;
      const k = keyOf(o[0], o[1]);
      if (!seen.has(k)) (seen.add(k), q.push([Math.round(o[0] / C), Math.round(o[1] / C)]));
    };
    seed(sx, sz);
    const warps = (def.warps ?? []).map((w) => ({ ...w, used: false }));
    for (let h = 0; h < q.length; h++) {
      const [i, j] = q[h];
      const ax = i * C;
      const az = j * C;
      for (const w of warps) if (!w.used && Math.hypot(ax - w.at[0], az - w.at[1]) < 2.2) ((w.used = true), seed(w.to[0], w.to[1]));
      // Eight ways (and the two-by-one knight's moves), so a ramp running on a
      // slant is walked along its own direction, not only across its banks.
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
        const bi = i + di;
        const bj = j + dj;
        const k = `${bi},${bj}`;
        if (seen.has(k)) continue;
        const bx = bi * C;
        const bz = bj * C;
        if (Math.hypot(bx, bz) > t.radius + 1) continue;
        if (!sp.okSpot(bx, bz, r0) || !t.canStep(ax, az, bx, bz, r0)) continue;
        seen.add(k);
        q.push([bi, bj]);
      }
    }
    return (x, z, reach) => {
      for (let d = 0; d <= reach; d += C)
        for (let a = 0; a < Math.PI * 2; a += C / Math.max(C, d)) if (seen.has(keyOf(x + Math.cos(a) * d, z + Math.sin(a) * d))) return true;
      return false;
    };
  };
  open = false;
  const atStart = flood();
  open = true;
  const atEnd = flood();
  open = false;
  const unreached = new Set();
  for (const s of spots) {
    if (s.far || Math.hypot(s.x, s.z) > t.radius + 2) continue;
    if (t.isWater(s.x, s.z) && !t.covered(s.x, s.z)) continue; // places on the water (boats, rivers)
    const k = `${s.task}.${s.path}`;
    if (!atEnd(s.x, s.z, 2.6)) (unreached.add(k), add('error', 'reach', `${k} cannot be walked to from the start`, [s.x, s.z]));
    else if (s.first && !atStart(s.x, s.z, 2.6)) add('error', 'reach', `${k} is open at the start but shut off behind a story gate`, [s.x, s.z]);
  }

  // Scenery placed on activity spots.
  const solidsPlaced = [
    ...placed.trees.filter((k) => k.solid).map((k) => ({ what: `${k.kind} tree`, x: k.x, z: k.z, r: 0.5 * k.size + 0.15 })),
    ...placed.rocks.filter((k) => k.s > 0.6).map((k) => ({ what: 'boulder', x: k.x, z: k.z, r: k.s * 0.85 })),
  ];
  const onSpot = new Map();
  for (const s of spots) {
    if (s.far) continue;
    for (const o of solidsPlaced) {
      const d = Math.hypot(o.x - s.x, o.z - s.z) - o.r;
      if (d < 0.9) {
        const k = `${o.what}@${o.x.toFixed(1)},${o.z.toFixed(1)}`;
        if (!onSpot.has(k)) onSpot.set(k, { ...o, spot: `${s.task}.${s.path}`, d });
      }
    }
  }
  for (const o of onSpot.values()) add('warn', 'scenery', `${o.what} stands ${o.d < 0 ? 'on' : 'right beside'} activity spot ${o.spot}`, [+o.x.toFixed(1), +o.z.toFixed(1)]);

  // Rocks that look solid but have no collider.
  const lowCover = placed.rocks.filter((k) => Math.hypot(k.x, k.z) < t.radius && Sc.rockTop(k) > 0.3 && !t.obstacles.slice(nObst).some((o) => Math.hypot(o.x - k.x, o.z - k.z) < 0.05));
  if (lowCover.length) add('error', 'rocks', `${lowCover.length} drawn rock(s) taller than 0.3 m have no collider (the explorer walks through them)`, lowCover.slice(0, 4).map((k) => [+k.x.toFixed(1), +k.z.toFixed(1), +(k.s * k.sy).toFixed(2)]));

  // Herds and animals in tasks.
  for (const h of def.herds ?? []) {
    if (t.isWater(h.at[0], h.at[1])) add('error', 'herds', `${h.animal} herd starts in water`, h.at);
    else if (!sp.findOpen(h.at[0], h.at[1], SPECS[h.animal]?.r ?? 0.5, h.r)) add('error', 'herds', `${h.animal} herd has no open ground`, h.at);
    else if (!atEnd(h.at[0], h.at[1], h.r + 2)) add('warn', 'herds', `${h.animal} herd grazes where the explorer cannot walk`, h.at);
  }
  for (const task of def.tasks) {
    if (task.kind !== 'lead') continue;
    const ar = SPECS[task.animal]?.r ?? 0.5;
    if (!sp.findOpen(task.pen[0], task.pen[1], ar, 3)) add('error', 'herds', `${task.id}: pen has no room for a ${task.animal}`, task.pen);
  }

  sp.world.free();
  const counts = { error: 0, warn: 0, review: 0, info: 0 };
  for (const i of issues) counts[i.level]++;
  return { surah: n, name: def.name, surahName: meta.nameTransliterated, tasks: def.tasks.length, spots: spots.length, solids: rep.solids.tested, pathsWalked: rep.paths.walked, counts, issues };
}

const JOBS = +(process.env.JOBS ?? 3);
if (!only.length && JOBS > 1 && !process.env.CHILD) {
  // Split the worlds over a few processes (each builds its own physics).
  const { spawn } = await import('node:child_process');
  const parts = Array.from({ length: JOBS }, (_, k) => list.filter((_, i) => i % JOBS === k));
  const outs = await Promise.all(parts.map((nums, k) => new Promise((res) => {
    const out = join(root, `content/worlds/.validation-${k}.json`);
    const c = spawn(process.execPath, [...process.execArgv, fileURLToPath(import.meta.url), ...nums.map(String)], { env: { ...process.env, CHILD: '1', OUT: out }, stdio: ['ignore', 'inherit', 'inherit'] });
    c.on('exit', () => res(out));
  })));
  const results = outs.flatMap((f) => JSON.parse(readFileSync(f, 'utf8'))).sort((a, b) => a.surah - b.surah);
  const { unlinkSync } = await import('node:fs');
  outs.forEach((f) => unlinkSync(f));
  writeFileSync(join(root, 'content/worlds/validation.json'), JSON.stringify({ date: new Date().toISOString().slice(0, 10), results }, null, 1));
  const tot = results.reduce((a, r) => ((a.error += r.counts.error), (a.warn += r.counts.warn), (a.review += r.counts.review), a), { error: 0, warn: 0, review: 0 });
  console.log(`\n${results.length} worlds: ${tot.error} errors, ${tot.warn} warnings, ${tot.review} for content review. Written to content/worlds/validation.json`);
  process.exit(tot.error && process.env.STRICT ? 1 : 0);
}

const results = [];
for (const n of list) {
  const t0 = Date.now();
  let r;
  try {
    r = checkWorld(n);
  } catch (e) {
    r = { surah: n, crashed: String(e?.stack ?? e), counts: { error: 1, warn: 0, review: 0, info: 0 }, issues: [{ level: 'error', check: 'load', msg: `validator crashed: ${e?.message ?? e}` }] };
  }
  r.ms = Date.now() - t0;
  results.push(r);
  const c = r.counts;
  console.log(`${String(n).padStart(3)} ${(r.name ?? '').padEnd(34)} errors ${c.error}  warnings ${c.warn}  review ${c.review}  (${r.ms} ms)`);
  if (process.env.VERBOSE) for (const i of r.issues) if (i.level !== 'info') console.log(`      ${i.level.padEnd(6)} ${i.check.padEnd(10)} ${i.msg}${i.at ? ` ${JSON.stringify(i.at)}` : ''}`);
}
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify(results));
else if (!only.length) writeFileSync(join(root, 'content/worlds/validation.json'), JSON.stringify({ date: new Date().toISOString().slice(0, 10), results }, null, 1));
const tot = results.reduce((a, r) => ((a.error += r.counts.error), (a.warn += r.counts.warn), (a.review += r.counts.review), a), { error: 0, warn: 0, review: 0 });
console.log(`\n${results.length} worlds: ${tot.error} errors, ${tot.warn} warnings, ${tot.review} for content review`);
process.exit(tot.error && process.env.STRICT ? 1 : 0);
