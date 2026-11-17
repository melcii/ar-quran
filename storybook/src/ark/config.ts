// The Ark slice's animal-guiding settings, editable in the Admin Studio
// (scope `ark:slice`) without touching code.
//
// For each pair of animals: where they wander (home), the pad they are led
// to (the destination the animals route to, round the river, trees and the
// hull), how close the child must be to notice and to lead them, how close
// to the pad counts as arriving, their walking pace and the most they will
// hurry to keep up, and the words the child sees when the pair starts to
// follow and when it is aboard. Also the Ark's narration lines.
//
// The defaults are exactly the values the slice was built with, so with
// nothing published the game is unchanged. Published settings are applied
// once, before the valley is built, never in the middle of play.
import { SPECS } from './Beasts';
import { PADS, type BeastKind } from './land';
import { NAMES, NARRATION } from './story';

export type BeastCfg = {
  home: [number, number];
  pad: [number, number];
  /** Walk this close and the animal is found (m). */
  notice: number;
  /** The "Lead" button appears this close (m). */
  reach: number;
  /** The pair steps onto its pad when this close to it (m). */
  arrive: number;
  /** Walking pace (m/s). */
  speed: number;
  /** The fastest it will go to keep up while following (m/s). */
  followMax: number;
  /** Shown when the pair starts to follow. */
  instruction: string;
  /** Shown when the pair is in its stall. */
  done: string;
};

export const ARK_KINDS: BeastKind[] = ['giraffe', 'elephant', 'camel', 'sheep', 'horse'];
const HOMES: Record<BeastKind, [number, number]> = { giraffe: [37, 17], elephant: [-36, 16], camel: [-27, 42], sheep: [21, 40], horse: [38, -27] };

export const NARRATION_KEYS = ['welcome', 'ark', 'animals', 'giraffe', 'supplies', 'ready', 'rain', 'calm'] as const;
const NARRATION0 = { ...NARRATION };

export function arkDefaults(): Record<BeastKind, BeastCfg> {
  const out = {} as Record<BeastKind, BeastCfg>;
  for (const k of ARK_KINDS) {
    const p = PADS0.find((x) => x.kind === k)!;
    out[k] = {
      home: [...HOMES[k]] as [number, number],
      pad: [p.x, p.z],
      notice: 7,
      reach: 3.2,
      arrive: 4.2,
      speed: SPECS[k].speed,
      followMax: 8,
      instruction: `The ${NAMES[k][1]} follow you. Lead them to the pad with their picture by the ark.`,
      done: `The ${NAMES[k][1]} are in their stall.`,
    };
  }
  return out;
}
const PADS0 = PADS.map((p) => ({ ...p }));

/** The settings in force (defaults until a studio document is applied). */
export const ARK_CFG: Record<BeastKind, BeastCfg> = arkDefaults();

export const LIMITS: Record<'notice' | 'reach' | 'arrive' | 'speed' | 'followMax', [number, number]> = {
  notice: [2, 15],
  reach: [1.5, 6],
  arrive: [2, 8],
  speed: [0.5, 6],
  followMax: [1, 10],
};

type Doc = { v: 1; set?: Record<string, unknown> } | null | undefined;

/** Settings from a studio document on top of the defaults; anything malformed is left at its default. */
export function resolveArk(doc: Doc): { cfg: Record<BeastKind, BeastCfg>; narration: typeof NARRATION; skipped: string[] } {
  const cfg = arkDefaults();
  const narration = { ...NARRATION0 };
  const skipped: string[] = [];
  for (const [key, v] of Object.entries(doc?.set ?? {})) {
    const [a, b] = key.split('.');
    if (a === 'narration' && (NARRATION_KEYS as readonly string[]).includes(b) && typeof v === 'string' && v.trim()) {
      (narration as any)[b] = v;
      continue;
    }
    const c = cfg[a as BeastKind];
    if (!c || !(b in c)) {
      skipped.push(key);
      continue;
    }
    if (b === 'home' || b === 'pad') {
      if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'number' && Number.isFinite(x))) (c as any)[b] = [v[0], v[1]];
      else skipped.push(key);
    } else if (b === 'instruction' || b === 'done') {
      if (typeof v === 'string' && v.trim()) (c as any)[b] = v;
      else skipped.push(key);
    } else {
      const lim = LIMITS[b as keyof typeof LIMITS];
      if (typeof v === 'number' && lim && v >= lim[0] && v <= lim[1]) (c as any)[b] = v;
      else skipped.push(key);
    }
  }
  return { cfg, narration, skipped };
}

/** Put a document's settings in force. Call before the valley is built (pads, shade and colliders read them then). */
export function applyArk(doc: Doc) {
  const r = resolveArk(doc);
  for (const k of ARK_KINDS) {
    ARK_CFG[k] = r.cfg[k];
    const pad = PADS.find((p) => p.kind === k)!;
    pad.x = r.cfg[k].pad[0];
    pad.z = r.cfg[k].pad[1];
  }
  Object.assign(NARRATION, r.narration);
  return r.skipped;
}
