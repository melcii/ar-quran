// Checks on studio overlay documents, ported from the Postgres functions
// studio_scope_ok, studio_key_class, studio_changes, studio_doc_problems and
// studio_settings_problems (migrations 0002, 0003, 0005). Pure functions:
// the database is only asked about surahs and approved audio.

export const SCOPE_RE = /^(surah:([1-9]|[1-9][0-9]|10[0-9]|11[0-4])|ark:slice|catalog:(avatar|room)|config:(multiplayer|audio|play))$/;
export const scopeOk = (s) => typeof s === 'string' && SCOPE_RE.test(s);

// Arabic script blocks. The Quran text comes only from the app's verified dataset.
export const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

export const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

/** jsonb equality: same values, key order ignored. */
export function same(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => same(x, b[i]));
  if (isObj(a)) {
    if (!isObj(b)) return false;
    const ka = Object.keys(a);
    if (ka.length !== Object.keys(b).length) return false;
    return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && same(a[k], b[k]));
  }
  return false;
}
// "is distinct from" treats a missing key and null alike.
const differ = (a, b) => !same(a ?? null, b ?? null);

const jtype = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'object' ? 'object' : typeof v);

export function keyClass(k, v) {
  if (/(^|\.)(refs?|reading|after)(\.|$)/.test(k)) return 'quran';
  if (typeof v === 'string' && !/^#[0-9a-f]{6}$/i.test(v)) return 'text';
  return 'world';
}

/** Which kinds of change turn document a into b (sorted, unique). */
export function changes(scope, a, b) {
  a = a ?? {};
  b = b ?? {};
  if (!/^(surah:|ark:)/.test(scope)) return differ(a, b) ? [scope.split(':')[0]] : [];
  const out = [];
  const sa = a.set ?? {};
  const sb = b.set ?? {};
  for (const k of new Set([...Object.keys(sa), ...Object.keys(sb)])) {
    if (differ(sa[k], sb[k])) out.push(keyClass(k, sb[k] ?? sa[k]));
  }
  for (const sec of ['place', 'add', 'order', 'links', 'record', 'audio']) {
    if (!differ(a[sec], b[sec])) continue;
    const tasksChanged = differ(a.add?.tasks, b.add?.tasks);
    out.push(sec === 'place' ? 'world' : sec === 'add' ? (tasksChanged ? 'tasks' : 'world') : sec === 'order' || sec === 'links' ? 'tasks' : sec === 'record' ? 'record' : 'audio');
    if (sec === 'add' && tasksChanged && /"(refs?|reading)"/.test(JSON.stringify(b.add?.tasks ?? ''))) out.push('quran');
    if (sec === 'record' && differ(a.record?.quran_references, b.record?.quran_references)) out.push('quran');
  }
  return [...new Set(out)].sort();
}

const toInt = (x) => (typeof x === 'number' && Number.isInteger(x) ? x : typeof x === 'string' && /^\s*[+-]?\d+\s*$/.test(x) ? parseInt(x, 10) : null);

// lax $.**.refs[*] and $.**.ref over the "add" section.
function refsIn(node, out) {
  if (Array.isArray(node)) for (const x of node) refsIn(x, out);
  else if (isObj(node)) {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'refs') Array.isArray(v) ? out.push(...v) : out.push(v);
      if (k === 'ref') out.push(v);
      refsIn(v, out);
    }
  }
  return out;
}

const ANIMAL = '(giraffe|elephant|camel|sheep|horse)';

/**
 * Problems that stop a document from being submitted.
 * ayahs(n) -> ayah count of surah n or undefined; approvedNarration(id) -> boolean.
 */
export function docProblems(scope, doc, { ayahs, approvedNarration }) {
  if (!isObj(doc)) return ['the document is not an object'];
  const out = [];
  if (toInt(doc.v) !== 1) out.push('unknown document version');
  if (ARABIC.test(JSON.stringify(doc))) out.push('Arabic script is not allowed in edited content; the Quran text is locked');
  const set = isObj(doc.set) ? doc.set : {};
  if (scope.startsWith('surah:')) {
    for (const k of Object.keys(set)) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*(\.([A-Za-z_][A-Za-z0-9_]*|[0-9]+|#[A-Za-z0-9_-]+))*$/.test(k) && !/^[A-Za-z_]+#[A-Za-z0-9_-]+(\.([A-Za-z_][A-Za-z0-9_]*|[0-9]+|#[A-Za-z0-9_-]+))*$/.test(k)) {
        out.push(`not an editable field: ${k}`);
      } else if (/(^|\.)(surah|seed|id|kind|requires)$/.test(k) || /^(ground\.base|mist)/.test(k)) {
        out.push(`this field is locked: ${k}`);
      }
    }
    // Every ayah reference must exist.
    const refs = [];
    for (const [k, v] of Object.entries(set)) {
      if (/(^|\.)ref$/.test(k) || /\.refs\.[0-9]+$/.test(k)) refs.push(v);
      if (/(^|\.)refs$/.test(k) && Array.isArray(v)) refs.push(...v);
    }
    refsIn(doc.add ?? {}, refs);
    for (const r of refs) {
      const s = Array.isArray(r) ? toInt(r[0]) : null;
      const a = Array.isArray(r) ? toInt(r[1]) : null;
      const n = s == null ? undefined : ayahs(s);
      if (!Array.isArray(r) || r.length !== 2 || s == null || a == null || n === undefined || a < 1 || a > n) out.push(`not a real ayah reference: ${JSON.stringify(r)}`);
    }
    // Activity links: task id -> list of task ids it waits for.
    for (const [k, v] of Object.entries(isObj(doc.links) ? doc.links : {})) {
      if (!/^[A-Za-z0-9_-]+$/.test(k) || !Array.isArray(v) || v.some((x) => typeof x !== 'string')) out.push(`not a valid activity link: ${k}`);
      else if (v.includes(k)) out.push(`an activity cannot wait for itself: ${k}`);
    }
    // Narration audio: only approved narration files.
    for (const [k, v] of Object.entries(isObj(doc.audio) ? doc.audio : {})) {
      if (!/^l[0-9a-z]{1,13}$/.test(k)) out.push(`not a narration line id: ${k}`);
      else if (typeof v !== 'string' || !approvedNarration(v)) out.push(`line ${k} is assigned a file that is not approved narration`);
    }
  } else if (scope === 'ark:slice') {
    for (const [k, v] of Object.entries(set)) {
      if (new RegExp(`^${ANIMAL}\\.(home|pad)$`).test(k)) {
        if (!Array.isArray(v) || v.length !== 2 || typeof v[0] !== 'number' || typeof v[1] !== 'number' || Math.hypot(v[0], v[1]) > 74) out.push(`a place must be [x, z] inside the valley: ${k}`);
      } else if (new RegExp(`^${ANIMAL}\\.(notice|reach|arrive|speed|followMax)$`).test(k)) {
        if (typeof v !== 'number') out.push(`must be a number: ${k}`);
        else {
          const lim = { notice: [2, 15], reach: [1.5, 6], arrive: [2, 8], speed: [0.5, 6], followMax: [1, 10] }[k.split('.')[1]];
          if (v < lim[0] || v > lim[1]) out.push(`out of the allowed range: ${k}`);
        }
      } else if (new RegExp(`^${ANIMAL}\\.(instruction|done)$`).test(k) || /^narration\.(welcome|ark|animals|giraffe|supplies|ready|rain|calm)$/.test(k)) {
        if (typeof v !== 'string' || v.length < 1 || v.length > 600) out.push(`text must be 1 to 600 characters: ${k}`);
      } else out.push(`not an editable Ark setting: ${k}`);
    }
  } else if (scope === 'catalog:avatar') {
    for (const [k, v] of Object.entries(isObj(doc.hide) ? doc.hide : {})) {
      if (!/^(build|hair|faceShape|eyeShape|brows|top|pattern|bottom|outer|head|shoes|pack)$/.test(k) || !Array.isArray(v)) out.push(`not a character option group: ${k}`);
    }
    for (const [k, v] of Object.entries(isObj(doc.labels) ? doc.labels : {})) {
      if (!/^[a-zA-Z]+\.[a-z]+$/.test(k) || typeof v !== 'string' || v.length < 1 || v.length > 40) out.push(`labels are 1 to 40 characters: ${k}`);
    }
  }
  return out.concat(settingsProblems(scope, doc));
}

export function settingsProblems(scope, doc) {
  const out = [];
  if ((scope === 'config:multiplayer' || scope === 'config:play') && Object.keys(doc).some((k) => k !== 'v' && k !== 'set')) out.push('settings documents hold only settings');
  const set = isObj(doc.set) ? doc.set : {};
  if (scope === 'config:multiplayer') {
    for (const [k, v] of Object.entries(set)) {
      if (k === 'enabled') {
        if (typeof v !== 'boolean') out.push('enabled must be true or false');
      } else if (k === 'roomMax') {
        if (typeof v !== 'number' || ![2, 3, 4].includes(v)) out.push('rooms hold 2, 3 or 4 explorers');
      } else out.push(`not an online play setting: ${k}`);
    }
  } else if (scope === 'config:play') {
    for (const [k, v] of Object.entries(set)) {
      if (k === 'breakMinutes') {
        if (typeof v !== 'number' || !(v === 0 || (v >= 10 && v <= 120))) out.push('the break reminder is off (0) or 10 to 120 minutes');
      } else if (k === 'closedWorlds') {
        if (!Array.isArray(v) || v.some((x) => typeof x !== 'number' || x < 1 || x > 114 || !Number.isInteger(x))) out.push('closed worlds are surah numbers 1 to 114');
      } else out.push(`not a play setting: ${k}`);
    }
  }
  return out;
}

export { jtype };
