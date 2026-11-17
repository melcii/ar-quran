// The character catalog as the Admin Studio edits it (scope catalog:avatar):
// which dressing-room choices are offered and what they are called.
//
// It only changes the choices offered. A child's saved look is never
// rewritten: an option that is hidden later still shows (and still renders)
// for a child who already chose it, and cleanLook keeps reading every option.
// The default explorer's options cannot be hidden.
import * as L from './look';

type Group = { key: keyof L.Look; label: string; opts: L.Opt<string>[] };
export const GROUPS: Group[] = [
  { key: 'build', label: 'Build', opts: L.BUILDS },
  { key: 'hair', label: 'Hair', opts: L.HAIRS },
  { key: 'faceShape', label: 'Face shape', opts: L.FACE_SHAPES },
  { key: 'eyeShape', label: 'Eyes', opts: L.EYE_SHAPES },
  { key: 'brows', label: 'Brows', opts: L.BROWS },
  { key: 'top', label: 'Top', opts: L.TOPS },
  { key: 'pattern', label: 'Pattern', opts: L.PATTERNS },
  { key: 'bottom', label: 'Bottom', opts: L.BOTTOMS },
  { key: 'outer', label: 'Over the top', opts: L.OUTERS },
  { key: 'head', label: 'Head', opts: L.HEADS },
  { key: 'shoes', label: 'Shoes', opts: L.SHOES },
  { key: 'pack', label: 'Bag', opts: L.PACKS },
];

export type CatalogDoc = { v: 1; hide?: Record<string, string[]>; labels?: Record<string, string> } | null | undefined;
export type CatalogProblem = { key: string; level: 'error' | 'warning'; message: string };

export function catalogView(doc: CatalogDoc) {
  const hide = doc?.hide ?? {};
  const labels = doc?.labels ?? {};
  const hidden = (g: string, id: string) => Array.isArray(hide[g]) && hide[g].includes(id) && (L.DEFAULT_LOOK as any)[g] !== id;
  return {
    /** The options to offer for a group: shown ones, plus the child's current choice so it is never lost. */
    opts<T extends string>(group: keyof L.Look, current?: T): L.Opt<T>[] {
      const g = GROUPS.find((x) => x.key === group);
      if (!g) return [];
      return g.opts.filter((o) => !hidden(group, o.id) || o.id === current).map((o) => ({ id: o.id as T, label: typeof labels[`${group}.${o.id}`] === 'string' && labels[`${group}.${o.id}`].trim() ? labels[`${group}.${o.id}`] : o.label }));
    },
    /** Ready-made explorers that use only shown options. */
    presets: () => L.PRESETS.filter((p) => GROUPS.every((g) => !hidden(g.key, String(p.look[g.key])))),
    hidden,
  };
}

export function checkCatalog(doc: CatalogDoc): CatalogProblem[] {
  const out: CatalogProblem[] = [];
  for (const [g, list] of Object.entries(doc?.hide ?? {})) {
    const grp = GROUPS.find((x) => x.key === g);
    if (!grp) {
      out.push({ key: `hide.${g}`, level: 'error', message: `not an option group: ${g}` });
      continue;
    }
    if (!Array.isArray(list)) continue;
    for (const id of list) if (!grp.opts.some((o) => o.id === id)) out.push({ key: `hide.${g}`, level: 'error', message: `${grp.label}: no option ${id}` });
    if ((L.DEFAULT_LOOK as any)[g] && list.includes((L.DEFAULT_LOOK as any)[g])) out.push({ key: `hide.${g}`, level: 'error', message: `${grp.label}: the default explorer uses “${grp.opts.find((o) => o.id === (L.DEFAULT_LOOK as any)[g])?.label}”, so it cannot be hidden` });
    if (grp.opts.every((o) => list.includes(o.id))) out.push({ key: `hide.${g}`, level: 'error', message: `${grp.label}: at least one option must stay` });
  }
  for (const [k, v] of Object.entries(doc?.labels ?? {})) {
    const [g, id] = k.split('.');
    if (!GROUPS.find((x) => x.key === g)?.opts.some((o) => o.id === id)) out.push({ key: `labels.${k}`, level: 'error', message: `no option ${k}` });
    if (typeof v !== 'string' || !v.trim() || v.length > 40) out.push({ key: `labels.${k}`, level: 'error', message: 'names are 1 to 40 characters' });
    else if (/[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(v)) out.push({ key: `labels.${k}`, level: 'error', message: 'Arabic script is not allowed in edited text' });
  }
  const view = catalogView(doc);
  if (view.presets().length < L.PRESETS.length) out.push({ key: 'hide', level: 'warning', message: `${L.PRESETS.length - view.presets().length} ready-made explorer(s) use a hidden option and will not be offered` });
  return out;
}
