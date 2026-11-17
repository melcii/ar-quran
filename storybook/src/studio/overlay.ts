// Studio overlays: what the Admin Studio stores instead of editing source code.
//
// A world's recipe stays in src/adventure/worlds/wNNN.ts. An overlay is a
// small JSON document of edits on top of it: wording, positions, numbers,
// hidden or added objects, chapter order, added activities. The game applies
// the published overlay when a world loads; drafts are applied only in the
// studio's preview and play-test modes.
//
// Paths name a field inside the recipe: `welcome`, `structures.0.x`,
// `tasks#quiet.asks.0.reading.note` (`#id` picks the task with that id).
// Nothing here runs code from the document and nothing can replace a
// function in the recipe. This file has no runtime imports so the Node test
// scripts can load it directly.
import type { Structure } from '@/adventure/kit';
import type { Task, WorldDef } from '@/adventure/types';

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** A moved, resized, turned or hidden piece of scattered scenery (rocks and trees are placed from the world's seed). */
export type PlacedEdit = { x?: number; z?: number; s?: number; rot?: number; hidden?: boolean };
export type AddedRock = { x: number; z: number; s: number; rot?: number };

export type Overlay = {
  v: 1;
  /** Field edits by path. */
  set?: Record<string, Json>;
  /** Chapter (activity) order by task id. */
  order?: string[];
  /** Which activities each activity waits for (task id -> task ids), replacing the recipe's own `requires`. */
  links?: Record<string, string[]>;
  /** Edits to scattered rocks and trees, by their index in the placed list. */
  place?: { rocks?: Record<string, PlacedEdit>; trees?: Record<string, PlacedEdit> };
  /** New objects and activities. */
  add?: { structures?: Structure[]; rocks?: AddedRock[]; tasks?: Task[] };
  /** The surah's content record (learning objectives, descriptions, review notes). */
  record?: Record<string, Json>;
  /** Narration line id -> audio file id. */
  audio?: Record<string, string>;
};

export const EMPTY: Overlay = { v: 1 };

export type Seg = string | number;

/** `tasks#quiet.asks.0.note` -> ['tasks', '#quiet', 'asks', 0, 'note'] */
export function parsePath(key: string): Seg[] | null {
  if (!/^[A-Za-z_][A-Za-z0-9_]*(#[A-Za-z0-9_-]+)?(\.([A-Za-z_][A-Za-z0-9_]*|[0-9]+|#[A-Za-z0-9_-]+))*$/.test(key)) return null;
  const out: Seg[] = [];
  for (const part of key.split('.')) {
    const hash = part.indexOf('#');
    if (hash > 0) out.push(part.slice(0, hash), part.slice(hash));
    else out.push(/^[0-9]+$/.test(part) ? Number(part) : part);
  }
  return out;
}

export function pathOf(segs: Seg[]): string {
  let s = '';
  for (const g of segs) {
    if (typeof g === 'number') s += `.${g}`;
    else if (g.startsWith('#')) s += g;
    else s += s ? `.${g}` : g;
  }
  return s;
}

/** Fields no overlay may touch: identity, logic links and generated land. */
export function lockedPath(segs: Seg[]): boolean {
  const last = segs[segs.length - 1];
  if (typeof last === 'string' && ['surah', 'seed', 'id', 'kind', 'requires', 'show', 'hide', 'after'].includes(last) && segs.length === 1) return true;
  if (typeof last === 'string' && ['surah', 'seed', 'id', 'kind', 'requires'].includes(last)) return true;
  if (segs[0] === 'ground' && segs[1] === 'base') return true;
  if (segs[0] === 'mist' || segs[0] === 'looks') return true;
  return false;
}

function child(node: any, seg: Seg): any {
  if (node == null) return undefined;
  if (typeof seg === 'string' && seg.startsWith('#')) return Array.isArray(node) ? node.find((x) => x && x.id === seg.slice(1)) : undefined;
  return node[seg as any];
}

export function getAt(root: any, segs: Seg[]): any {
  let n = root;
  for (const s of segs) n = child(n, s);
  return n;
}

/** Copy-on-write set: only the containers along the path are copied, so functions in the recipe stay as they are. */
export function setAt<T>(root: T, segs: Seg[], value: unknown): T {
  if (!segs.length) return value as T;
  const [head, ...rest] = segs;
  if (Array.isArray(root)) {
    const i = typeof head === 'string' && head.startsWith('#') ? root.findIndex((x) => x && x.id === head.slice(1)) : (head as number);
    if (i < 0 || i >= root.length) return root;
    const copy = root.slice();
    copy[i] = setAt(copy[i], rest, value);
    return copy as T;
  }
  if (root && typeof root === 'object') {
    const k = head as string;
    return { ...(root as any), [k]: setAt((root as any)[k], rest, value) };
  }
  return root;
}

const kindOf = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

/** Optional fields an overlay may add where the recipe leaves them out. */
const OPTIONAL: Record<string, string> = { hidden: 'boolean', color: 'string', accent: 'string', intro: 'string', outro: 'string', adaptation: 'string', rot: 'number' };

export type Applied = { def: WorldDef; skipped: { key: string; why: string }[] };

/** The world as players see it with this overlay. Edits that no longer fit the recipe are skipped and listed. */
export function applyOverlay(base: WorldDef, ov: Overlay | null | undefined): Applied {
  const skipped: Applied['skipped'] = [];
  if (!ov || ov.v !== 1) return { def: base, skipped };
  let def: WorldDef = base;
  for (const [key, value] of Object.entries(ov.set ?? {})) {
    const segs = parsePath(key);
    if (!segs) {
      skipped.push({ key, why: 'not a field path' });
      continue;
    }
    if (lockedPath(segs)) {
      skipped.push({ key, why: 'locked field' });
      continue;
    }
    const parent = getAt(def, segs.slice(0, -1));
    if (parent == null || typeof parent !== 'object') {
      skipped.push({ key, why: 'the recipe no longer has this place' });
      continue;
    }
    const now = getAt(def, segs);
    const last = segs[segs.length - 1];
    const want = now === undefined ? (typeof last === 'string' ? OPTIONAL[last] : undefined) : kindOf(now);
    if (!want) {
      skipped.push({ key, why: 'the recipe has no such field' });
      continue;
    }
    if (typeof now === 'function' || want !== kindOf(value)) {
      skipped.push({ key, why: `expected ${want}` });
      continue;
    }
    def = setAt(def, segs, value);
  }
  if (ov.add?.structures?.length) def = { ...def, structures: [...def.structures, ...ov.add.structures] };
  if (ov.add?.tasks?.length) {
    const ids = new Set(def.tasks.map((t) => t.id));
    const extra = ov.add.tasks.filter((t) => t && typeof t.id === 'string' && !ids.has(t.id));
    if (extra.length < ov.add.tasks.length) skipped.push({ key: 'add.tasks', why: 'an added activity reuses an existing id' });
    def = { ...def, tasks: [...def.tasks, ...extra] };
  }
  if (ov.links && typeof ov.links === 'object') {
    const ids = new Set(def.tasks.map((t) => t.id));
    const tasks = def.tasks.map((t) => {
      const want = ov.links![t.id];
      if (!Array.isArray(want)) return t;
      const ok = want.filter((r) => typeof r === 'string' && r !== t.id && ids.has(r));
      if (ok.length < want.length) skipped.push({ key: `links.${t.id}`, why: 'it names an activity that is not in this world' });
      return { ...t, requires: ok.length ? ok : undefined } as Task;
    });
    for (const id of Object.keys(ov.links)) if (!ids.has(id)) skipped.push({ key: `links.${id}`, why: 'no activity with this id' });
    def = { ...def, tasks };
  }
  if (ov.order?.length) {
    const pos = new Map(ov.order.map((id, i) => [id, i]));
    const tasks = def.tasks.map((t, i) => ({ t, i })).sort((a, b) => (pos.get(a.t.id) ?? 1e6 + a.i) - (pos.get(b.t.id) ?? 1e6 + b.i)).map((x) => x.t);
    def = { ...def, tasks };
  }
  // Hidden structures stay in the list (so indexes keep their meaning) but are not built.
  if (def.structures.some((s: any) => s.hidden)) def = { ...def, structures: def.structures.filter((s: any) => !s.hidden) };
  if (ov.audio && typeof ov.audio === 'object' && Object.keys(ov.audio).length) (def as any).__audio = { ...ov.audio };
  if (ov.place && (ov.place.rocks || ov.place.trees || ov.add?.rocks)) (def as any).__placed = { rocks: ov.place.rocks ?? {}, trees: ov.place.trees ?? {}, addRocks: ov.add?.rocks ?? [] };
  else if (ov.add?.rocks?.length) (def as any).__placed = { rocks: {}, trees: {}, addRocks: ov.add.rocks };
  return { def, skipped };
}

/** Scenery edits carried on a resolved world (read by Scenery.place). */
export function placedEdits(def: WorldDef): { rocks: Record<string, PlacedEdit>; trees: Record<string, PlacedEdit>; addRocks: AddedRock[] } | undefined {
  return (def as any).__placed;
}

/* ------------------------------ fields for the editors ------------------------------ */

export type FieldKind = 'text' | 'longtext' | 'number' | 'position' | 'color' | 'refs' | 'ref' | 'bool';
export type Field = { path: string; kind: FieldKind; value: Json; label: string; group: string; quran: boolean };

const LONG = new Set(['intro', 'outro', 'welcome', 'note', 'body', 'adaptation', 'text', 'reply', 'why', 'yes', 'no', 'prompt', 'says', 'done', 'play']);
const POS = /^(at|start|from|to|pen|dock|launch|door|store|sow|shelter|spring|share|loose|hive|table|source|oven|ring|well|mat|a|b|end|wind|back|field|away)$/;
const SKIP = new Set(['ground', 'veg', 'look', 'extras', 'mountains', 'far', 'herds', 'seed', 'surah', 'id', 'kind', 'requires', 'show', 'hide', 'looks', 'mist', 'warps', 'regions', 'look']);
const human = (k: string) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

/**
 * Every editable field of a world, as the story and activity editors show
 * them. Text is grouped by chapter; numbers and positions are listed for the
 * world and activity editors. Quran-linked fields are flagged.
 */
export function fieldsOf(def: WorldDef): Field[] {
  const out: Field[] = [];
  const walk = (node: any, segs: Seg[], group: string, quran: boolean) => {
    if (node == null || typeof node === 'function') return;
    const key = segs[segs.length - 1];
    const k = typeof key === 'string' ? key : '';
    const path = pathOf(segs);
    const q = quran || k === 'reading' || k === 'after' || k === 'refs' || k === 'ref';
    if (k === 'refs' && Array.isArray(node)) return void out.push({ path, kind: 'refs', value: node as Json, label: 'Quran references', group, quran: true });
    if (k === 'ref' && Array.isArray(node) && node.length === 2) return void out.push({ path, kind: 'ref', value: node as Json, label: 'Quran reference', group, quran: true });
    if (Array.isArray(node) && node.length === 2 && typeof node[0] === 'number' && typeof node[1] === 'number' && (POS.test(k) || typeof key === 'number'))
      return void out.push({ path, kind: 'position', value: node as Json, label: human(k || 'point'), group, quran: q });
    if (typeof node === 'string') {
      if (/^#[0-9a-f]{6}$/i.test(node)) return void out.push({ path, kind: 'color', value: node, label: human(k), group, quran: q });
      return void out.push({ path, kind: LONG.has(k) || node.length > 90 ? 'longtext' : 'text', value: node, label: human(k), group, quran: q });
    }
    if (typeof node === 'number') return void out.push({ path, kind: 'number', value: node, label: human(k), group, quran: q });
    if (typeof node === 'boolean') return void out.push({ path, kind: 'bool', value: node, label: human(k), group, quran: q });
    if (Array.isArray(node)) {
      node.forEach((x, i) => walk(x, [...segs, i], group, q));
      return;
    }
    if (typeof node === 'object')
      for (const [ck, cv] of Object.entries(node)) {
        if (SKIP.has(ck) && segs.length <= 2) continue;
        if (ck === 'id' || ck === 'kind' || ck === 'requires' || ck === 'model' || ck === 'item' || ck === 'animal' || ck === 'style' || ck === 'marker' || ck === 'look' || ck === 'type') continue;
        walk(cv, [...segs, ck], group, q);
      }
  };
  for (const k of ['name', 'theme', 'play', 'welcome'] as const) if (typeof def[k] === 'string') walk(def[k], [k], 'World', false);
  def.tasks.forEach((t) => {
    for (const [ck, cv] of Object.entries(t)) {
      if (['id', 'kind', 'requires', 'region', 'animal', 'marker', 'style'].includes(ck)) continue;
      walk(cv, ['tasks', `#${t.id}`, ck], `Chapter: ${t.title}`, false);
    }
  });
  walk(def.finale, ['finale'], 'Ending', false);
  def.notes.forEach((n, i) => walk(n, ['notes', i], 'About this world', false));
  out.push({ path: 'start', kind: 'position', value: def.start as Json, label: 'Player start', group: 'World', quran: false });
  if (def.startYaw != null) out.push({ path: 'startYaw', kind: 'number', value: def.startYaw, label: 'Start facing (radians)', group: 'World', quran: false });
  return out;
}

/* ------------------------------ validation ------------------------------ */

export type QuranIndex = { ayahs: (surah: number) => number | undefined };
export type Problem = { key: string; level: 'error' | 'warning'; message: string };

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

/** Numbers with safe ranges by field name. Anything else must stay finite and keep its sign. */
const LIMITS: Record<string, [number, number]> = {
  secs: [1, 600],
  r: [0.2, 40],
  reach: [0.5, 12],
  n: [1, 60],
  speed: [0.2, 4],
  scale: [0.2, 4],
  s: [0.1, 6],
  w: [0.3, 80],
  d: [0.3, 80],
  h: [0.1, 40],
  y: [-5, 30],
  rot: [-7, 7],
  startYaw: [-7, 7],
  times: [1, 20],
  rain: [1, 600],
  cap: [1, 100],
  width: [0.5, 20],
};

function walkStrings(v: unknown, f: (s: string) => void) {
  if (typeof v === 'string') f(v);
  else if (Array.isArray(v)) v.forEach((x) => walkStrings(x, f));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => walkStrings(x, f));
}

function checkRef(r: unknown, q: QuranIndex): string | null {
  if (!Array.isArray(r) || r.length !== 2 || !Number.isInteger(r[0]) || !Number.isInteger(r[1])) return 'a reference is written [surah, ayah]';
  const n = q.ayahs(r[0] as number);
  if (!n) return `surah ${r[0]} does not exist`;
  if ((r[1] as number) < 1 || (r[1] as number) > n) return `surah ${r[0]} has ${n} ayahs, not ${r[1]}`;
  return null;
}

/**
 * Deterministic checks run before anything is submitted (the server repeats
 * the essential ones). No network and no AI: the same document always gives
 * the same answer.
 */
export function validateOverlay(base: WorldDef, ov: Overlay, q: QuranIndex): Problem[] {
  const out: Problem[] = [];
  const err = (key: string, message: string) => out.push({ key, level: 'error', message });
  const warn = (key: string, message: string) => out.push({ key, level: 'warning', message });
  if (ov.v !== 1) err('v', 'unknown document version');
  walkStrings(ov, (s) => {
    if (ARABIC.test(s)) err('text', `Arabic script is not allowed in edited content (the Quran text is locked): "${s.slice(0, 40)}"`);
  });
  const radius = base.ground.radius;
  for (const [key, value] of Object.entries(ov.set ?? {})) {
    const segs = parsePath(key);
    if (!segs) {
      err(key, 'not a field path');
      continue;
    }
    if (lockedPath(segs)) {
      err(key, 'this field is locked');
      continue;
    }
    const now = getAt(base, segs);
    const last = segs[segs.length - 1];
    const parent = getAt(base, segs.slice(0, -1));
    if (parent == null) {
      err(key, 'the world no longer has this place');
      continue;
    }
    if (now === undefined && !(typeof last === 'string' && OPTIONAL[last])) {
      err(key, 'the world has no such field');
      continue;
    }
    if (now !== undefined && kindOf(now) !== kindOf(value)) {
      err(key, `expected ${kindOf(now)}, got ${kindOf(value)}`);
      continue;
    }
    if (typeof value === 'string') {
      if (!/^#[0-9a-f]{6}$/i.test(value) && /^#/.test(String(now ?? ''))) err(key, 'colours are written #rrggbb');
      else if (!value.trim()) err(key, 'text cannot be empty');
      else if (value.length > 2000) err(key, 'text is longer than 2000 characters');
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) err(key, 'not a number');
      const lim = typeof last === 'string' ? LIMITS[last] : undefined;
      if (lim && (value < lim[0] || value > lim[1])) err(key, `must be between ${lim[0]} and ${lim[1]}`);
      else if (!lim && typeof now === 'number' && now > 0 && value <= 0) err(key, 'must stay above zero');
      if (typeof last === 'string' && (last === 'x' || last === 'z') && Math.abs(value) > radius + 4) err(key, `outside the world (radius ${radius})`);
      if (typeof last === 'string' && ['n', 'times', 'cap'].includes(last) && !Number.isInteger(value)) err(key, 'must be a whole number');
    }
    if (last === 'refs') {
      if (!Array.isArray(value) || !value.length) err(key, 'at least one reference is needed');
      else
        for (const r of value) {
          const m = checkRef(r, q);
          if (m) err(key, m);
        }
    } else if (last === 'ref' || (typeof last === 'number' && segs[segs.length - 2] === 'refs')) {
      const m = checkRef(value, q);
      if (m) err(key, m);
    } else if (Array.isArray(value) && value.length === 2 && value.every((x) => typeof x === 'number')) {
      if (!value.every(Number.isFinite)) err(key, 'not a position');
      else if (Math.hypot(value[0] as number, value[1] as number) > radius + 2) err(key, `outside the world (radius ${radius})`);
    }
  }
  if (ov.order) {
    const ids = new Set([...base.tasks.map((t) => t.id), ...(ov.add?.tasks ?? []).map((t) => t.id)]);
    const seen = new Set<string>();
    for (const id of ov.order) {
      if (!ids.has(id)) err('order', `no chapter with id ${id}`);
      if (seen.has(id)) err('order', `${id} is listed twice`);
      seen.add(id);
    }
    // A chapter placed before one it depends on still waits for it; say so.
    const at = new Map(ov.order.map((id, i) => [id, i]));
    for (const t of [...base.tasks, ...(ov.add?.tasks ?? [])])
      for (const r of t.requires ?? []) if ((at.get(r) ?? -1) > (at.get(t.id) ?? 1e9)) warn('order', `"${t.title}" comes before "${r}", which it needs first; it will stay locked until then`);
  }
  if (ov.links) {
    const all = [...base.tasks, ...(ov.add?.tasks ?? [])];
    const ids = new Set(all.map((t) => t.id));
    for (const [id, list] of Object.entries(ov.links)) {
      if (!ids.has(id)) err(`links.${id}`, `no activity with id ${id}`);
      if (!Array.isArray(list)) err(`links.${id}`, 'must be a list of activity ids');
      else for (const r of list) if (r === id) err(`links.${id}`, 'an activity cannot wait for itself');
        else if (!ids.has(r)) err(`links.${id}`, `waits for an unknown activity ${r}`);
    }
    const cyc = linkCycle(all.map((t) => ({ id: t.id, requires: Array.isArray(ov.links![t.id]) ? ov.links![t.id] : t.requires ?? [] })));
    if (cyc) err('links', `these activities wait for each other, so none could ever open: ${cyc.join(' → ')}`);
    else {
      const lock = unreachable(all.map((t) => ({ id: t.id, requires: Array.isArray(ov.links![t.id]) ? ov.links![t.id] : t.requires ?? [] })));
      if (lock.length) err('links', `these activities can never open: ${lock.join(', ')}`);
    }
  }
  for (const [i, t] of (ov.add?.tasks ?? []).entries()) {
    const key = `add.tasks.${i}`;
    if (!t || typeof t.id !== 'string' || !/^x-[a-z0-9-]{2,40}$/.test(t.id)) err(key, 'added activities need an id starting with x-');
    if (base.tasks.some((b) => b.id === t.id)) err(key, 'id already used');
    if (!t.title?.trim() || !t.goal?.trim()) err(key, 'an activity needs a title and an instruction');
    for (const r of t.requires ?? []) if (!base.tasks.some((b) => b.id === r) && !(ov.add?.tasks ?? []).some((b) => b.id === r)) err(key, `requires an unknown chapter ${r}`);
    const refsIn: unknown[] = [];
    const collect = (v: any) => {
      if (Array.isArray(v)) v.forEach(collect);
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) k === 'refs' && Array.isArray(x) ? refsIn.push(...x) : collect(x);
    };
    collect(t);
    for (const r of refsIn) {
      const m = checkRef(r, q);
      if (m) err(key, m);
    }
    const spots: unknown[] = [];
    const pos = (v: any) => {
      if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'number')) spots.push(v);
      else if (Array.isArray(v)) v.forEach(pos);
      else if (v && typeof v === 'object') Object.values(v).forEach(pos);
    };
    pos(t);
    for (const p of spots as [number, number][]) if (Math.hypot(p[0], p[1]) > radius + 2) err(key, `a spot is outside the world (radius ${radius})`);
  }
  for (const [i, s] of (ov.add?.structures ?? []).entries()) {
    if (!s || typeof s.type !== 'string') err(`add.structures.${i}`, 'not an object from the library');
    else if (Math.hypot(s.x, s.z) > radius + 2) err(`add.structures.${i}`, `outside the world (radius ${radius})`);
  }
  for (const [i, r] of (ov.add?.rocks ?? []).entries()) {
    if (Math.hypot(r.x, r.z) > radius + 2) err(`add.rocks.${i}`, `outside the world (radius ${radius})`);
    if (!(r.s >= 0.1 && r.s <= 6)) err(`add.rocks.${i}`, 'rock size must be between 0.1 and 6');
  }
  for (const [kind, map] of Object.entries(ov.place ?? {}))
    for (const [i, e] of Object.entries(map ?? {})) {
      if (e.x != null && e.z != null && Math.hypot(e.x, e.z) > radius + 2) err(`place.${kind}.${i}`, `outside the world (radius ${radius})`);
      if (e.s != null && !(e.s >= 0.1 && e.s <= 6)) err(`place.${kind}.${i}`, 'size must be between 0.1 and 6');
    }
  const { skipped } = applyOverlay(base, ov);
  for (const s of skipped) if (!out.some((p) => p.key === s.key)) warn(s.key, `will be ignored: ${s.why}`);
  return out;
}

/** A loop in "waits for" links, if any (as a list of ids), else null. */
export function linkCycle(nodes: { id: string; requires: string[] }[]): string[] | null {
  const req = new Map(nodes.map((n) => [n.id, n.requires]));
  const state = new Map<string, 1 | 2>();
  const stack: string[] = [];
  const visit = (id: string): string[] | null => {
    if (state.get(id) === 2) return null;
    if (state.get(id) === 1) return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, 1);
    stack.push(id);
    for (const r of req.get(id) ?? []) if (req.has(r)) {
      const c = visit(r);
      if (c) return c;
    }
    stack.pop();
    state.set(id, 2);
    return null;
  };
  for (const n of nodes) {
    const c = visit(n.id);
    if (c) return c;
  }
  return null;
}

/** Activities that wait for something that does not exist (so they would never open). */
export function unreachable(nodes: { id: string; requires: string[] }[]): string[] {
  const ids = new Set(nodes.map((n) => n.id));
  return nodes.filter((n) => n.requires.some((r) => !ids.has(r))).map((n) => n.id);
}

/** Field paths that differ between two overlays, for the change list. */
export function changedKeys(a: Overlay | null, b: Overlay | null): string[] {
  const out = new Set<string>();
  const A = a?.set ?? {};
  const B = b?.set ?? {};
  for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) out.add(k);
  for (const sec of ['order', 'links', 'place', 'add', 'record', 'audio'] as const) if (JSON.stringify(a?.[sec] ?? null) !== JSON.stringify(b?.[sec] ?? null)) out.add(sec);
  return [...out].sort();
}

/** Is a field path tied to the Quran (references or the readings that explain them)? */
export const quranLinked = (key: string) => /(^|\.|#)(refs?|reading|after)(\.|$)/.test(key);
