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

/** Stand still on a spot for a while, optionally facing something (a niche, a window). */
export type StandTask = TaskBase & { kind: 'stand'; at: P2; r?: number; secs: number; label: string; face?: P2; reading?: Reading; style?: 'plate' | 'rug' | 'none' };

/** Walk to a place. With `gust`, wind blows down a mountain path in bursts: keep still while it blows, or be pushed back. */
export type ReachTask = TaskBase & { kind: 'reach'; at: P2; r?: number; label: string; reading?: Reading; gust?: { path: P2[]; width: number } };

/** Watch living things quietly: come close at a walk (running startles them) and stay still to fill a journal page. */
export type ObserveTask = TaskBase & {
  kind: 'observe';
  secs: number;
  subjects: { at: P2; r: number; label: string; note: string; reading?: Reading; animal?: Animal; n?: number }[];
};

/** Turn the sky through its phases at a sky-dial (night, star, moon, sun). Each phase changes the whole world's light. */
export type SkyTask = TaskBase & { kind: 'sky'; at: P2; phases: { look: Look; label: string; reading: Reading }[] };

/** Sail the explorer's own boat from a dock and visit places at sea. */
export type SailTask = TaskBase & {
  kind: 'sail';
  dock: P2;
  launch: P2;
  launchYaw?: number;
  stops: { at: P2; r?: number; label: string; reading?: Reading; storm?: boolean; note?: string }[];
};

/** Situations to answer. An excuse sends you back down the path to think again. */
export type ChoiceTask = TaskBase & {
  kind: 'choice';
  at: P2;
  marker?: Marker;
  back?: P2;
  scenes: { text: string; options: { text: string; ok: boolean; reply: string }[] }[];
  /** Read when every scene is answered well. */
  reading?: Reading;
};

/** Share the stores among households by what each one needs. */
export type ShareTask = TaskBase & {
  kind: 'share';
  at: P2;
  prompt: string;
  goods: { id: string; label: string; n: number }[];
  homes: { label: string; sign: string; needs: Record<string, number>; door: P2 }[];
  reading?: Reading;
};

/** Make promises at a board; each one then has a candle, and you keep it at its place. */
export type PromiseTask = TaskBase & {
  kind: 'promise';
  at: P2;
  promises: { label: string; at: P2; verb: string; secs: number; done: string }[];
};

/** Weigh goods fairly at a balance; one weight in the box is not true. */
export type WeighTask = TaskBase & {
  kind: 'weigh';
  at: P2;
  weights: { label: string; mass: number; marked: number }[];
  orders: { goods: string; want: number }[];
  reading?: Reading;
};

/** Rain water flowing down channels: switch the gates so each cistern fills without spilling water onto the sand. */
export type FlowTask = TaskBase & {
  kind: 'flow';
  source: P2;
  /** Gates at junctions: each sends the water `a` or `b` (a junction id or a cistern id). */
  gates: { id: string; at: P2; a: string; b: string }[];
  cisterns: { id: string; at: P2; label: string; cap: number }[];
  /** Where spilled water runs off. */
  sand: { id: string; at: P2 }[];
  first: string;
  rain: number;
  maxSpill: number;
  channels: { from: P2; to: P2 }[];
};

/** Narrow down a herd by each description in turn, sending away the ones that do not fit. */
export type SiftTask = TaskBase & {
  kind: 'sift';
  animal: Animal;
  away: P2;
  herd: { at: P2; look: NonNullable<import('@/ark/Beasts').Agent['look']>; scale?: number; traits: string[] }[];
  rounds: { reading: Reading; keep: string; say: string; wrong: string }[];
};

/** Come into a place again and again; each time something has changed. */
export type ReturnTask = TaskBase & { kind: 'return'; at: P2; r: number; away: number; times: number; label: string; notes: string[]; reading?: Reading };


/* ---- Kinds of play built as plug-ins (src/adventure/mechanics/), one per Story Library world. ---- */

/** Seven good years and seven hard ones at a storehouse: how much to eat, how to keep it, and whether it lasts (Yusuf). */
export type GranaryTask = TaskBase & {
  kind: 'granary';
  store: P2;
  /** One field strip per good year. */
  fields: P2[];
  /** Measures cut in each good year. */
  harvest: number;
  /** What the household must eat in a good year, at least. */
  eatMin: number;
  /** Measures given out in each hard year. */
  need: number;
  /** What must be left for sowing when the hard years end. */
  seed: number;
  /** Fraction lost each year: grain left in its ear, and threshed grain. */
  loss: { ear: number; loose: number };
  sow: P2;
  readings: { good: Reading; hard: Reading; rain: Reading };
};

/** Storms fill valleys each by its own size; cast the foam off the water so what benefits stays (Ar-Ra'd). */
export type ValleyTask = TaskBase & {
  kind: 'valley';
  /** A rock overhang to shelter under while lightning flashes. */
  shelter: P2;
  valleys: { at: P2; r: number; cap: number; label: string; field: P2; note: string }[];
  /** Seconds of rain (game time). */
  rain: number;
  reading?: Reading;
};

/** Grow a good tree: find firm ground, water the roots, choose good words for the branches, and gather fruit season after season (Ibrahim). */
export type GrowTask = TaskBase & {
  kind: 'grow';
  spots: { at: P2; firm: boolean; label: string; why: string }[];
  spring: P2;
  waters: number;
  words: { text: string; good: boolean; why: string }[];
  seasons: { label: string; fruit: string; color: string }[];
  /** Where fruit is carried for travellers. */
  share: P2;
  /** A loose-rooted sapling on the sand, for comparison. */
  loose: P2;
  readings: { firm: Reading; loose: Reading; fruit: Reading };
};

/** Carry pollen between flowers of the same kind at flower height, with the bees (An-Nahl). */
export type PollenTask = TaskBase & {
  kind: 'pollen';
  kinds: { label: string; color: string }[];
  flowers: { at: P2; kind: number }[];
  /** Flowers to pollinate. */
  n: number;
  hive: P2;
  reading?: Reading;
};

/** Take rubbings of carved doorways, then fit each onto a map of the valley where it was found (Al-Hijr). */
export type RubbingTask = TaskBase & {
  kind: 'rubbing';
  doors: { at: P2; rot: number; pattern: 'diamond' | 'ring' | 'bars' | 'steps' | 'sun'; label: string }[];
  /** The map table. */
  table: P2;
  /** Landmarks drawn on the map. */
  marks: { at: P2; label: string }[];
  /** Seconds to keep still while rubbing. */
  secs: number;
  reading?: Reading;
};

/** A night town where each street holds one guideline of conduct as a hands-on act (Al-Isra). */
export type StreetAct =
  | { act: 'carry'; from: P2; to: P2[]; item: import('./kit').ItemKind; what: string }
  | { act: 'taps'; taps: P2[] }
  | { act: 'measure'; at: P2 }
  | { act: 'calm'; from: P2; to: P2 };
export type StreetsTask = TaskBase & {
  kind: 'streets';
  streets: ({ label: string; lamp: P2; reading: Reading; done: string } & StreetAct)[];
};

/** Turn the day at a dial and mark where the sunlight falls by a cave mouth at sunrise and sunset; it never reaches inside (Al-Kahf). */
export type SunPathTask = TaskBase & {
  kind: 'sunpath';
  cave: P2;
  /** Which way the cave mouth faces (radians, 0 = +z). */
  caveYaw: number;
  dial: P2;
  /** The light patches to mark: the morning one and the evening one. */
  patches: { label: string; at: P2; sun: [number, number, number] }[];
  reading?: Reading;
};

/** A quiet world answered by pointing at things, never by choosing words (Maryam). */
export type PointTask = TaskBase & {
  kind: 'point';
  things: { at: P2; label: string; model: 'palm' | 'stream' | 'niche' | 'pavilion' }[];
  asks: { prompt: string; thing: number; yes: string; no: string; reading?: Reading }[];
};

/** Cross dark hills at night toward a far light, building cairns only where the light can be seen (Ta-Ha). */
export type BeaconTask = TaskBase & {
  kind: 'beacon';
  /** The far light, and how high above the ground it burns. */
  light: P2;
  lightY: number;
  /** Stone piles to build into cairns. From some the light is hidden behind the hills; a cairn there is refused. */
  piles: P2[];
  /** How many cairns with the light in view finish the way. */
  need: number;
  reading?: Reading;
};

/** Carry each prayer tablet (a verified verse) to the door whose situation it answers (Al-Anbiya). */
export type DoorsTask = TaskBase & {
  kind: 'doors';
  /** The lecterns with the tablets on them, each with one verse. */
  tablets: { at: P2; ref: Ref }[];
  doors: { at: P2; rot: number; emblem: 'wilted' | 'waves' | 'lamp'; situation: string; tablet: number; reading: Reading }[];
  reading?: Reading;
};

/** Set the stones of the pilgrimage verses in the order the verses give them, on a map model (Al-Hajj). */
export type OrderTask = TaskBase & {
  kind: 'order';
  /** The centre of the map model. */
  model: P2;
  /** In the right order. `at` is where each stone first lies. */
  stones: { at: P2; label: string; reading: Reading }[];
  reading?: Reading;
};

/** A home through one day: keep the trust, the promise and the prayer times as they come due, and give from what you have (Al-Mu'minun). */
export type HomeRoom = { label: string; at: P2; done: string; reading: Reading } & (
  | { act: 'trust'; door: P2; shelf: P2; knock: number }
  | { act: 'prayer'; toys: P2[]; box: P2; chime: number; again: number }
  | { act: 'promise'; plant: P2; tap: P2; bell: number; window: number; again: number }
  | { act: 'give'; jar: P2; box: P2; n: number }
);
export type HomeTask = TaskBase & {
  kind: 'home';
  rooms: HomeRoom[];
  reading?: Reading;
};

/** Knock and wait for welcome, then turn mirrors to bring sunlight through a courtyard to a window (An-Nur). */
export type MirrorHouse = {
  label: string;
  door: P2;
  /** South-west corner of the courtyard grid (world x, z); cells run +x (i) and -z (j). */
  origin: P2;
  /** Grid size in cells. */
  n: number;
  /** Where the sunbeam enters: the cell row/column on the west side (it travels +x). */
  sun: number;
  /** The window the light must reach: the cell it leaves from and the side ('n' | 'e' | 's'). */
  target: { cell: [number, number]; side: 'n' | 'e' | 's' };
  /** Mirror stands: cell and starting turn (0 = '/', 1 = '\\'). */
  mirrors: { cell: [number, number]; turn: 0 | 1 }[];
  /** The first knock is answered "please come back later" (24:28). */
  later?: boolean;
  reading: Reading;
};
export type MirrorTask = TaskBase & {
  kind: 'mirror';
  houses: MirrorHouse[];
  /** Cell size in metres. */
  cell: number;
  reading?: Reading;
};

/** Predict where a pole's shadow tip will be later in the day, place a stone there, then let the day run (Al-Furqan). */
export type ShadowTask = TaskBase & {
  kind: 'shadow';
  pole: P2;
  height: number;
  /** The seat where the day is let run. */
  seat: P2;
  /** Each round: the time it starts and the time to predict (0 = sunrise, 1 = sunset), and what to call that time. */
  rounds: { from: number; to: number; label: string; reading: Reading }[];
  /** How close the stone must be to the shadow tip (m). */
  near: number;
  reading?: Reading;
};

/** Move stones nearer or farther in an amphitheatre so each one's echo returns on its beat (Ash-Shu'ara). */
export type EchoTask = TaskBase & {
  kind: 'echo';
  centre: P2;
  /** Distances a stone can stand at, from the centre. */
  slots: number[];
  /** Speed of the sound rings (m/s). */
  speed: number;
  stones: { angle: number; label: string; slot: number; start: number; reading: Reading }[];
  reading?: Reading;
};

/** At ant size, clear the paths so each group of ants reaches the nest before the footsteps come (An-Naml). */
export type AntsTask = TaskBase & {
  kind: 'ants';
  nest: P2;
  groups: { path: P2[]; blocks: { at: P2; what: 'pebble' | 'twig' | 'leaf' }[] }[];
  /** Seconds before the footsteps come. */
  time: number;
  reading?: Reading;
};

/** A river that splits: the chest floats down it, following whichever channel the reed gates leave open (Al-Qasas). */
export type RiverSeg = { pts: P2[]; gate?: number; kids?: [RiverSeg, RiverSeg]; end?: 'landing' | 'reeds' };
export type RiverTask = TaskBase & {
  kind: 'river';
  river: RiverSeg;
  /** Reed gates at the forks; state 0 sends the chest down kids[0]. */
  gates: { at: P2; start: 0 | 1; labels: [string, string] }[];
  /** Places on the banks where the chest catches and must be nudged free. */
  snags: P2[];
  /** Metres per second the current carries the chest. */
  speed: number;
  reading?: Reading;
};

/** Shelter a lamp from wind and rain: test the web shelter, then rebuild it part by part until the lamp stays lit (Al-Ankabut). */
export type ShelterMat = 'web' | 'reed' | 'brick';
export type ShelterTask = TaskBase & {
  kind: 'shelter';
  stand: P2;
  piles: { at: P2; mat: ShelterMat }[];
  /** Seconds the storm test lasts. */
  secs: number;
  /** Read after the first test of the web shelter. */
  web: Reading;
  reading?: Reading;
};

/** Read the wind, and sow the dry plot the rain cloud will reach before it rains there (Ar-Rum). */
export type RainTask = TaskBase & {
  kind: 'rain';
  vane: P2;
  plots: P2[];
  /** Each round: the plot the wind will carry the cloud over. */
  rounds: { plot: number; reading: Reading }[];
  /** Seconds the cloud takes to drift across. */
  drift: number;
  reading?: Reading;
};

/** Deliver a message at a gentle voice: keep the voice needle in the band for a moment without startling the listener (Luqman). */
export type VoiceTask = TaskBase & {
  kind: 'voice';
  listeners: { at: P2; animal: 'dove' | 'cat' | 'goat'; band: [number, number]; reading: Reading }[];
  /** Seconds the voice must stay in the band. */
  hold: number;
  reading?: Reading;
};

export type Task = ReadTask | PointsTask | CarryTask | LeadTask | PickTask | GuideTask | QuizTask | StandTask | ReachTask | ObserveTask | SkyTask | SailTask | ChoiceTask | ShareTask | PromiseTask | WeighTask | FlowTask | SiftTask | ReturnTask | GranaryTask | ValleyTask | GrowTask | PollenTask | RubbingTask | StreetsTask | SunPathTask | PointTask | BeaconTask | DoorsTask | OrderTask | HomeTask | MirrorTask | ShadowTask | EchoTask | AntsTask | RiverTask | ShelterTask | RainTask | VoiceTask;

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
  /** Doorways inside the world that carry you to another place in it (the atlas hall's story doors). */
  warps?: { at: P2; to: P2; toYaw?: number; label: string; show?: string; rot?: number }[];
  /** How thick the mist is (0..1) given what is done: worlds where the land closes in and opens again. */
  mist?: (done: string[], prog: Record<string, number[]>) => number;
  /** A one-line description of the world's core gameplay (shown in About). */
  play?: string;
  /** Night skies, sea boats, motes over gardens. */
  extras?: { boats?: { at: P2; rot?: number; color?: string; sail?: string }[]; motes?: { at: P2; r: number; color?: string }[] };
  seed: number;
};
