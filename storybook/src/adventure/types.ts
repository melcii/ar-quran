// What a world recipe is made of: the land, the sky, the buildings, and the
// activities, each tied to verified Quran passages. Activities are learning
// games written for this app; every one carries a plain note saying what is
// adapted, so the game never passes itself off as the Quran's own account.
import type { Animal } from '@/ark/Beasts';
import type { ItemKind, Structure } from './kit';
import type { Look, Veg } from './Scenery';
import type { Ground, P2 } from './terrain';

export type Ref = [number, number];

/** Verified ayahs (shown in Arabic with their translation) and a short explanation written for children. */
export type Reading = { title: string; refs: Ref[]; note: string };

export type Marker = 'lantern' | 'tablet' | 'scroll' | 'sign' | 'none';

type TaskBase = {
  id: string;
  /** Short name, shown in the activity list. */
  title: string;
  /** The objective line while this is the next thing to do. */
  goal: string;
  /** Which part of the world (multi-region worlds). */
  region?: string;
  /** Other tasks that must be done first. */
  requires?: string[];
  /** Narration shown when the task first becomes available. */
  intro?: string;
  /** Narration shown when it is finished. */
  outro?: string;
  /** A reading opened when the task is finished. */
  after?: Reading;
  /** What in this activity is a game idea rather than the Quran's account. Shown in "About this world". */
  adaptation?: string;
};

/** Walk to a place and read verified ayahs there. */
export type ReadTask = TaskBase & { kind: 'read'; at: P2; marker?: Marker; reading: Reading };

/** Visit and use a set of spots (light lanterns, water plants, sweep leaves), optionally in order. */
export type PointsTask = TaskBase & {
  kind: 'points';
  style: 'lantern' | 'plant' | 'sweep' | 'sign' | 'beacon';
  ordered?: boolean;
  /** Verb on the action button, e.g. "Light", "Water". */
  verb: string;
  points: { at: P2; label: string; reading?: Reading }[];
};

/** Carry things from one place to another. Each load has its own source and destination. */
export type CarryTask = TaskBase & {
  kind: 'carry';
  /** What is left at the destination: the item itself, a growing plant, a placed building stone, a mended patch. */
  result?: 'item' | 'sprout' | 'stone' | 'patch';
  loads: { from: P2; to: P2; item: ItemKind; label: string; color?: string; dest?: string; /** Height above the ground for the result (on a table). */ lift?: number }[];
};

/** Find animals and lead them home. */
export type LeadTask = TaskBase & { kind: 'lead'; animal: Animal; herd: { at: P2; r: number }; n: number; pen: P2; penLabel: string };

/** Choose the one animal that matches a description (all others explain why not). */
export type PickTask = TaskBase & {
  kind: 'pick';
  animal: Animal;
  verb: string;
  choices: { at: P2; look: NonNullable<import('@/ark/Beasts').Agent['look']>; scale?: number; right?: boolean; why: string }[];
};

/** Guide boats along a channel into their berths. */
export type GuideTask = TaskBase & { kind: 'guide'; boats: { path: P2[]; color?: string; sail?: string }[] };

/** A game in the panel: matching, ordering or sorting. */
export type QuizGame =
  /** Match each ayah's Arabic to its translation (verified text only). */
  | { type: 'match'; refs: Ref[] }
  /** Put the ayahs in the order they come in the surah (verified text only). */
  | { type: 'order'; refs: Ref[] }
  /** Sort cards written for this game into groups. */
  | { type: 'sort'; bins: string[]; cards: { text: string; bin: number }[] };

export type QuizTask = TaskBase & { kind: 'quiz'; at: P2; marker?: Marker; game: QuizGame; prompt: string };

export type Task = ReadTask | PointsTask | CarryTask | LeadTask | PickTask | GuideTask | QuizTask;

export type Region = { id: string; name: string; at: P2 };

export type WorldDef = {
  surah: number;
  /** The world's name, e.g. "Garden of Guidance". */
  name: string;
  /** One line under the name. */
  theme: string;
  ground: Ground;
  look: Look;
  veg: Veg;
  /** Tint for the land beyond the edge. */
  far?: string;
  mountains?: { color: string; height?: number };
  structures: Structure[];
  start: P2;
  startYaw?: number;
  regions?: Region[];
  tasks: Task[];
  /** Background animals that just graze (no task). */
  herds?: { animal: Animal; at: P2; r: number; n: number }[];
  /** Narration at the very start. */
  welcome: string;
  finale: { title: string; body: string[]; ref: Ref; questions: string[] };
  /** Plain statements of what is depicted and what is not (shown in "About this world"). */
  notes: string[];
  /** A doorway to another part of the app (e.g. the Yunus story). */
  links?: { at: P2; label: string; href: string; note: string }[];
  /** Night skies, sea boats, motes over gardens. */
  extras?: { boats?: { at: P2; rot?: number; color?: string; sail?: string }[]; motes?: { at: P2; r: number; color?: string }[] };
  seed: number;
};
