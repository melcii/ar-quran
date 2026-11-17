// Activity templates for the no-code Activity Builder.
//
// Each template is one of the game's existing, working activity kinds (see
// src/adventure/types.ts and Adventure.web.tsx, which plays every one of
// these in any world). A template only describes which settings the kind
// needs, and builds a complete activity from the form. Nothing here invents
// a new kind of activity: if the game cannot play it, it is not listed.
// No runtime imports, so the Node tests can load it.
import type { Task } from '@/adventure/types';

export type Opt = { id: string; label: string };
export type Spec =
  | { key: string; label: string; type: 'text' | 'longtext'; required?: boolean; hint?: string; def?: string; max?: number }
  | { key: string; label: string; type: 'number'; min: number; max: number; def: number; int?: boolean; hint?: string }
  | { key: string; label: string; type: 'enum'; options: Opt[]; def: string; hint?: string }
  | { key: string; label: string; type: 'bool'; def: boolean; hint?: string }
  | { key: string; label: string; type: 'spot'; hint?: string; offset?: [number, number] }
  | { key: string; label: string; type: 'refs'; min: number; max: number; required: boolean; hint?: string }
  | { key: string; label: string; type: 'list'; item: Spec[]; min: number; max: number; itemLabel: string; hint?: string };

export type Values = Record<string, any>;
export type Template = {
  id: string;
  kind: Task['kind'];
  label: string;
  what: string;
  /** Settings particular to this kind (title, instruction, narration and the "opens after" link are common to all). */
  specs: Spec[];
  build: (v: Values) => Omit<Task, 'id' | 'title' | 'goal' | 'intro' | 'outro' | 'requires' | 'adaptation'>;
};

const MARKERS: Opt[] = [
  { id: 'tablet', label: 'Tablet' },
  { id: 'lantern', label: 'Lantern' },
  { id: 'scroll', label: 'Scroll' },
  { id: 'sign', label: 'Sign' },
];
export const ANIMALS: Opt[] = [
  { id: 'sheep', label: 'Sheep' },
  { id: 'goat', label: 'Goats' },
  { id: 'cow', label: 'Cows' },
  { id: 'camel', label: 'Camels' },
  { id: 'horse', label: 'Horses' },
  { id: 'elephant', label: 'Elephants' },
  { id: 'giraffe', label: 'Giraffes' },
];
const ITEMS: Opt[] = ['grain', 'hay', 'water', 'basket', 'stone', 'plank', 'seedling', 'bread', 'fruit', 'bundle', 'lamp', 'cloth', 'pot', 'scroll', 'dates', 'milk'].map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1) }));

const reading = (v: Values, prefix = 'r') =>
  Array.isArray(v[`${prefix}Refs`]) && v[`${prefix}Refs`].length ? { title: String(v[`${prefix}Title`] || v.title || 'Reading'), refs: v[`${prefix}Refs`], note: String(v[`${prefix}Note`] ?? '') } : undefined;
const optReading: Spec[] = [
  { key: 'rRefs', label: 'Ayahs to read when it is done (optional)', type: 'refs', min: 0, max: 8, required: false, hint: 'surah:ayah, comma separated. The Arabic and translation come from the locked dataset.' },
  { key: 'rNote', label: 'Explanation for children (with the ayahs)', type: 'longtext' },
];

export const TEMPLATES: Template[] = [
  {
    id: 'read',
    kind: 'read',
    label: 'Reading place',
    what: 'A marker in the world. The child walks up to it and reads the ayahs you choose, with your explanation.',
    specs: [
      { key: 'at', label: 'Where the marker stands', type: 'spot', offset: [4, -6] },
      { key: 'marker', label: 'Marker', type: 'enum', options: MARKERS, def: 'tablet' },
      { key: 'rRefs', label: 'Ayahs', type: 'refs', min: 1, max: 8, required: true },
      { key: 'rNote', label: 'Explanation for children', type: 'longtext', required: true },
    ],
    build: (v) => ({ kind: 'read', at: v.at, marker: v.marker, reading: reading(v)! }) as any,
  },
  {
    id: 'reach',
    kind: 'reach',
    label: 'Walk to a place',
    what: 'The child walks to a spot (a hilltop, a doorway). It is done when they arrive.',
    specs: [
      { key: 'at', label: 'The place', type: 'spot', offset: [8, -8] },
      { key: 'label', label: 'Name of the place', type: 'text', required: true, max: 60 },
      { key: 'r', label: 'How close counts as arriving (m)', type: 'number', min: 1, max: 8, def: 2.5 },
      ...optReading,
    ],
    build: (v) => ({ kind: 'reach', at: v.at, label: v.label, r: v.r, reading: reading(v) }) as any,
  },
  {
    id: 'stand',
    kind: 'stand',
    label: 'Stand still and reflect',
    what: 'The child stands on a spot for a few seconds, a quiet moment, optionally facing something.',
    specs: [
      { key: 'at', label: 'The spot', type: 'spot', offset: [3, -4] },
      { key: 'label', label: 'Name of the spot', type: 'text', required: true, max: 60 },
      { key: 'secs', label: 'Seconds to stand', type: 'number', min: 2, max: 30, def: 6 },
      { key: 'style', label: 'What marks the spot', type: 'enum', options: [{ id: 'rug', label: 'A rug' }, { id: 'plate', label: 'A stone plate' }, { id: 'none', label: 'Nothing' }], def: 'rug' },
      ...optReading,
    ],
    build: (v) => ({ kind: 'stand', at: v.at, label: v.label, secs: v.secs, style: v.style, reading: reading(v) }) as any,
  },
  {
    id: 'points',
    kind: 'points',
    label: 'Visit a set of spots',
    what: 'Light lanterns, water plants or sweep paths: the child visits each spot and uses it, in order if you like.',
    specs: [
      { key: 'style', label: 'Kind of spot', type: 'enum', options: [{ id: 'lantern', label: 'Lanterns' }, { id: 'plant', label: 'Plants' }, { id: 'sweep', label: 'Leaves to sweep' }, { id: 'sign', label: 'Signs' }, { id: 'beacon', label: 'Beacons' }], def: 'lantern' },
      { key: 'verb', label: 'Word on the action button', type: 'text', required: true, def: 'Light', max: 20 },
      { key: 'ordered', label: 'Must be done in order', type: 'bool', def: false },
      { key: 'points', label: 'Spots', type: 'list', min: 2, max: 8, itemLabel: 'Spot', item: [{ key: 'at', label: 'Where', type: 'spot' }, { key: 'label', label: 'Name', type: 'text', required: true, max: 60 }] },
    ],
    build: (v) => ({ kind: 'points', style: v.style, verb: v.verb, ordered: v.ordered || undefined, points: v.points.map((p: Values) => ({ at: p.at, label: p.label })) }) as any,
  },
  {
    id: 'carry',
    kind: 'carry',
    label: 'Carry things',
    what: 'The child picks something up in one place and puts it down in another (grain to a store, water to plants).',
    specs: [
      { key: 'result', label: 'What is left at the destination', type: 'enum', options: [{ id: 'item', label: 'The thing itself' }, { id: 'sprout', label: 'A growing plant' }, { id: 'stone', label: 'A placed building stone' }, { id: 'patch', label: 'A mended patch' }], def: 'item' },
      {
        key: 'loads',
        label: 'Loads',
        type: 'list',
        min: 1,
        max: 6,
        itemLabel: 'Load',
        item: [
          { key: 'item', label: 'Thing', type: 'enum', options: ITEMS, def: 'grain' },
          { key: 'label', label: 'Name', type: 'text', required: true, max: 60 },
          { key: 'from', label: 'Pick up at', type: 'spot' },
          { key: 'to', label: 'Put down at', type: 'spot', offset: [6, 0] },
        ],
      },
    ],
    build: (v) => ({ kind: 'carry', result: v.result, loads: v.loads.map((l: Values) => ({ from: l.from, to: l.to, item: l.item, label: l.label })) }) as any,
  },
  {
    id: 'lead',
    kind: 'lead',
    label: 'Guide animals home',
    what: 'A herd waits in one place; the child finds the animals and leads them to a pen. They follow the child, walking round obstacles.',
    specs: [
      { key: 'animal', label: 'Animal', type: 'enum', options: ANIMALS, def: 'sheep' },
      { key: 'n', label: 'How many', type: 'number', min: 1, max: 8, def: 3, int: true },
      { key: 'herd', label: 'Where the herd waits', type: 'spot', offset: [12, -10] },
      { key: 'herdR', label: 'How far they wander there (m)', type: 'number', min: 2, max: 12, def: 5 },
      { key: 'pen', label: 'The pen they go to', type: 'spot', offset: [-6, -4] },
      { key: 'penLabel', label: 'Name of the pen', type: 'text', required: true, def: 'the fold', max: 40 },
    ],
    build: (v) => ({ kind: 'lead', animal: v.animal, n: v.n, herd: { at: v.herd, r: v.herdR }, pen: v.pen, penLabel: v.penLabel }) as any,
  },
  {
    id: 'observe',
    kind: 'observe',
    label: 'Watch quietly',
    what: 'The child comes close at a walk and keeps still to fill a journal page about each thing.',
    specs: [
      { key: 'secs', label: 'Seconds of stillness for each', type: 'number', min: 2, max: 20, def: 4 },
      {
        key: 'subjects',
        label: 'Things to watch',
        type: 'list',
        min: 1,
        max: 5,
        itemLabel: 'Thing',
        item: [
          { key: 'at', label: 'Where', type: 'spot' },
          { key: 'label', label: 'Name', type: 'text', required: true, max: 60 },
          { key: 'note', label: 'Journal note', type: 'longtext', required: true },
          { key: 'r', label: 'Watching distance (m)', type: 'number', min: 2, max: 10, def: 5 },
        ],
      },
    ],
    build: (v) => ({ kind: 'observe', secs: v.secs, subjects: v.subjects.map((x: Values) => ({ at: x.at, r: x.r, label: x.label, note: x.note })) }) as any,
  },
  {
    id: 'quiz-match',
    kind: 'quiz',
    label: 'Match ayahs to meanings',
    what: 'At a marker, the child matches each ayah (verified Arabic) to its translation.',
    specs: [
      { key: 'at', label: 'Where the marker stands', type: 'spot', offset: [-4, -6] },
      { key: 'prompt', label: 'Question shown', type: 'text', required: true, def: 'Match each ayah to its meaning.' },
      { key: 'refs', label: 'Ayahs (2 to 5)', type: 'refs', min: 2, max: 5, required: true },
    ],
    build: (v) => ({ kind: 'quiz', at: v.at, marker: 'tablet', prompt: v.prompt, game: { type: 'match', refs: v.refs } }) as any,
  },
  {
    id: 'quiz-order',
    kind: 'quiz',
    label: 'Put ayahs in order',
    what: 'At a marker, the child puts ayahs in the order they come in the surah.',
    specs: [
      { key: 'at', label: 'Where the marker stands', type: 'spot', offset: [-4, -6] },
      { key: 'prompt', label: 'Question shown', type: 'text', required: true, def: 'Put these ayahs in order.' },
      { key: 'refs', label: 'Ayahs (2 to 5)', type: 'refs', min: 2, max: 5, required: true },
    ],
    build: (v) => ({ kind: 'quiz', at: v.at, marker: 'scroll', prompt: v.prompt, game: { type: 'order', refs: v.refs } }) as any,
  },
  {
    id: 'quiz-sort',
    kind: 'quiz',
    label: 'Sort cards into groups',
    what: 'At a marker, the child sorts short cards you write into two or three groups.',
    specs: [
      { key: 'at', label: 'Where the marker stands', type: 'spot', offset: [-4, -6] },
      { key: 'prompt', label: 'Question shown', type: 'text', required: true },
      { key: 'bins', label: 'Groups', type: 'list', min: 2, max: 3, itemLabel: 'Group', item: [{ key: 'name', label: 'Name', type: 'text', required: true, max: 40 }] },
      {
        key: 'cards',
        label: 'Cards',
        type: 'list',
        min: 2,
        max: 8,
        itemLabel: 'Card',
        item: [
          { key: 'text', label: 'Card text', type: 'text', required: true, max: 80 },
          { key: 'bin', label: 'Right group (1, 2 or 3)', type: 'number', min: 1, max: 3, def: 1, int: true },
        ],
      },
    ],
    build: (v) => ({ kind: 'quiz', at: v.at, marker: 'sign', prompt: v.prompt, game: { type: 'sort', bins: v.bins.map((b: Values) => b.name), cards: v.cards.map((c: Values) => ({ text: c.text, bin: c.bin - 1 })) } }) as any,
  },
  {
    id: 'choice',
    kind: 'choice',
    label: 'What would you do?',
    what: 'At a sign, short situations with two or three answers. A poor answer explains why and asks the child to think again.',
    specs: [
      { key: 'at', label: 'Where the sign stands', type: 'spot', offset: [5, -3] },
      {
        key: 'scenes',
        label: 'Situations',
        type: 'list',
        min: 1,
        max: 4,
        itemLabel: 'Situation',
        item: [
          { key: 'text', label: 'Situation', type: 'longtext', required: true },
          { key: 'good', label: 'Good answer', type: 'text', required: true },
          { key: 'goodReply', label: 'Reply to the good answer', type: 'text', required: true },
          { key: 'poor', label: 'Poor answer', type: 'text', required: true },
          { key: 'poorReply', label: 'Reply to the poor answer', type: 'text', required: true },
        ],
      },
      ...optReading,
    ],
    build: (v) => ({
      kind: 'choice',
      at: v.at,
      marker: 'sign',
      scenes: v.scenes.map((x: Values, i: number) => ({
        text: x.text,
        // Alternate which side the good answer is on.
        options: i % 2 ? [{ text: x.poor, ok: false, reply: x.poorReply }, { text: x.good, ok: true, reply: x.goodReply }] : [{ text: x.good, ok: true, reply: x.goodReply }, { text: x.poor, ok: false, reply: x.poorReply }],
      })),
      reading: reading(v),
    }) as any,
  },
];

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);

/** Starting values for a template's form. */
export function initial(specs: Spec[], start: [number, number]): Values {
  const v: Values = {};
  for (const s of specs) {
    if (s.type === 'list') v[s.key] = Array.from({ length: s.min }, (_, i) => initial(s.item, [start[0] + 3 * (i + 1), start[1] - 3 * (i + 1)]));
    else if (s.type === 'spot') v[s.key] = [+(start[0] + (s.offset?.[0] ?? 0)).toFixed(1), +(start[1] + (s.offset?.[1] ?? 0)).toFixed(1)];
    else if (s.type === 'refs') v[s.key] = [];
    else if ('def' in s && s.def !== undefined) v[s.key] = s.def;
    else v[s.key] = '';
  }
  return v;
}

/** What is missing or out of range in a form, by field. */
export function formProblems(specs: Spec[], v: Values, radius: number, prefix = ''): { key: string; message: string }[] {
  const out: { key: string; message: string }[] = [];
  for (const s of specs) {
    const x = v[s.key];
    const k = prefix + s.key;
    if (s.type === 'text' || s.type === 'longtext') {
      if (s.required && !String(x ?? '').trim()) out.push({ key: k, message: `${s.label}: needed` });
      if (s.max && String(x ?? '').length > s.max) out.push({ key: k, message: `${s.label}: at most ${s.max} characters` });
    } else if (s.type === 'number') {
      if (typeof x !== 'number' || !Number.isFinite(x) || x < s.min || x > s.max) out.push({ key: k, message: `${s.label}: between ${s.min} and ${s.max}` });
      else if (s.int && !Number.isInteger(x)) out.push({ key: k, message: `${s.label}: a whole number` });
    } else if (s.type === 'spot') {
      if (!Array.isArray(x) || x.length !== 2 || !x.every(Number.isFinite)) out.push({ key: k, message: `${s.label}: choose a place` });
      else if (Math.hypot(x[0], x[1]) > radius - 1) out.push({ key: k, message: `${s.label}: inside the world (radius ${radius})` });
    } else if (s.type === 'refs') {
      const n = Array.isArray(x) ? x.length : 0;
      if ((s.required && n < Math.max(1, s.min)) || n > s.max || (n && n < s.min)) out.push({ key: k, message: `${s.label}: ${s.min} to ${s.max} ayahs` });
    } else if (s.type === 'list') {
      const n = Array.isArray(x) ? x.length : 0;
      if (n < s.min || n > s.max) out.push({ key: k, message: `${s.label}: ${s.min} to ${s.max}` });
      (x ?? []).forEach((it: Values, i: number) => out.push(...formProblems(s.item, it, radius, `${k}.${i}.`)));
    }
  }
  return out;
}

/** The complete activity, ready to add to a draft. */
export function buildTask(t: Template, common: { title: string; goal: string; intro?: string; outro?: string; after?: string; adaptation: string }, v: Values, id: string): Task {
  const body = t.build(v) as any;
  for (const k of Object.keys(body)) if (body[k] === undefined) delete body[k];
  const task: any = { id, title: common.title.trim(), goal: common.goal.trim(), ...body, adaptation: common.adaptation.trim() };
  if (common.intro?.trim()) task.intro = common.intro.trim();
  if (common.outro?.trim()) task.outro = common.outro.trim();
  if (common.after) task.requires = [common.after];
  return task as Task;
}
