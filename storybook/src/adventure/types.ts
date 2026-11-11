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

export type PastureTask = TaskBase & { kind: 'pasture'; fold: P2; paddocks: { at: P2; r: number; name: string }[]; sheep: number; days: number; dayLen: number; eat: number; grow: number; reading?: Reading };
export type PlumbTask = TaskBase & { kind: 'plumb'; wall: P2; rot: number; tilt0: number; courses: number; piles: { at: P2; wedge: number; label: string }[]; limit: number; reading?: Reading };
export type SluiceTask = TaskBase & { kind: 'sluice'; dam: P2; gardens: [P2, P2]; months: number; monthLen: number; cracks: number[]; reading?: Reading };
export type ShadeItem = { label: string; color: string; light: number; at: P2 };
export type ShadesTask = TaskBase & { kind: 'shades'; table: P2; rows: { name: string; shape: 'stone' | 'fruit' | 'wool'; items: ShadeItem[]; reading: Reading }[]; reading?: Reading };
export type MoonTask = TaskBase & { kind: 'moon'; rack: P2; board: P2; nights: number[]; reading?: Reading };
export type VineTask = TaskBase & { kind: 'vine'; root: P2; frame: P2; bundle: P2; gap: number; speed: number; reading?: Reading };
export type SpringSign = 'reeds' | 'damp' | 'birds' | 'ferns' | 'salt';
export type SpringTask = TaskBase & { kind: 'spring'; board: P2; rounds: { need: SpringSign[]; spots: { at: P2; signs: SpringSign[] }[]; reading: Reading }[]; reading?: Reading };
export type HarvestTask = TaskBase & { kind: 'harvest'; bag: P2; plots: P2[]; stage: number; stagger: number; reading?: Reading };
/** Pour grain into a wooden measure up to the line for each buyer, then find the measure with a false bottom (Hud, Madyan). */
export type MeasureTask = TaskBase & { kind: 'measure'; stall: P2; buyers: { label: string; want: number; color?: string }[]; /** Depth of the false bottom (fraction). */ falseBottom: number; /** Which of the two measures (0 or 1) has it. */ falseIn: 0 | 1; reading?: Reading };
/** Leave by night along way-stones, lighting each, without turning back toward the town; the sky pales to morning (Hud, Lut). */
export type DawnTask = TaskBase & { kind: 'dawn'; town: P2; stones: P2[]; /** How far back toward the town you may step before the last stone goes out (m). */ slack: number };
/** Ropes and staffs that seem to move from far away and lie still up close: look closely at each (Ta-Ha, the magicians). */
export type ShimmerTask = TaskBase & { kind: 'shimmer'; things: { at: P2; kind: 'rope' | 'staff'; rot?: number }[]; /** Closer than this, nothing seems to move (m). */ near: number };
/** Birds on perches: tick each off a list, then name the one missing (An-Naml, the hoopoe). */
export type RollcallTask = TaskBase & { kind: 'rollcall'; birds: { at: P2; name: string; color: string }[]; /** Which bird is missing (the hoopoe). */ missing: number; board: P2 };
/** Fit rings of exactly the right size into each row of chain mail (Saba, Dawud). */
export type LinksTask = TaskBase & { kind: 'links'; table: P2; rows: { size: number; gap: number }[]; tray: number[] };
/** Surah Ghafir: find the clues the believing man's words point to, then pin each to his words on the board. */
export type CluesTask = TaskBase & { kind: 'clues'; clues: { at: P2; name: string; reading: Reading }[]; board: P2; questions: { q: string; ref: Ref; answer: number; wrong: string }[] };
/** Surah Fussilat: turn a telescope on a hilltop to find signs on the horizons (41:53). */
export type ScopeTask = TaskBase & { kind: 'scope'; at: P2; signs: { at: P2; name: string; shape: 'sun' | 'moon' | 'mountain' | 'slope' | 'stars'; reading: Reading }[]; within: Reading };
/** Surah Ash-Shura: hear every household, then agree a plan that meets every need (42:38). */
export type CouncilTask = TaskBase & { kind: 'council'; table: P2; homes: { at: P2; name: string; need: string }[]; plans: { text: string; meets: number[] }[] };
/** Surah Az-Zukhruf: gold and silver shine, but only useful things meet a real need (43:33-35). */
export type AdornTask = TaskBase & { kind: 'adorn'; items: { at: P2; name: string; gold: boolean; shape: 'jar' | 'lamp' | 'blanket' | 'seeds' | 'door' | 'couch' | 'stair' | 'ornament' }[]; needs: { at: P2; name: string; item: number; done: string }[] };
/** Surah Ad-Dukhan: survey what was left behind (44:25-27) and record it in a ledger. */
export type SurveyTask = TaskBase & { kind: 'survey'; cats: { name: string; shape: 'garden' | 'spring' | 'crop' | 'site' | 'comfort' }[]; things: { at: P2; cat: number }[]; ledger: P2 };
/** Surah Al-Jathiyah: read the wind vane and the rain gauge through one day and keep the field ledger (45:5). */
export type StationTask = TaskBase & { kind: 'station'; at: P2; landmarks: { at: P2; name: string }[]; readings: { time: 'morning' | 'noon' | 'evening'; wind: number; rain: 0 | 1 | 2 }[] };
/** Surah Al-Ahqaf: place windbreaks upwind of a path through the curving dunes and keep it open through a windy spell. */
export type DunesTask = TaskBase & { kind: 'dunes'; spots: { at: P2; guards: number | null }[]; segments: P2[]; fences: number; secs: number; well: P2; wind: number };
/** Surah Muhammad: clear each channel with the right tool so the water runs fresh to its pool (47:15 as a description only). */
export type ChannelsTask = TaskBase & { kind: 'channels'; rack: P2; tools: string[]; channels: { from: P2; to: P2; blocks: { t: number; tool: number; name: string }[] }[] };
/** Surah Al-Fath: at a closed gate, stay calm and still while provocations come; the way opens to the patient (48:24-26). */
export type CalmTask = TaskBase & { kind: 'calm'; gate: P2; r: number; secs: number; stirs: { text: string; calm: string; push: string }[] };
/** Surah Al-Hujurat: check each claim of a rumour at its source before passing anything on (49:6). */
export type RumourTask = TaskBase & { kind: 'rumour'; board: P2; claims: { text: string; at: P2; look: string; seen: string; true: boolean }[] };
/** Surah Qaf: sow each seed at its own depth in a glass-sided box, water it, and watch the dead earth come to life over three days (50:9-11). */
export type RootboxTask = TaskBase & { kind: 'rootbox'; at: P2; seeds: { name: string; depth: number; why: string }[]; days: number };
/** Surah Adh-Dhariyat: let the scattering wind carry seed puffs to the beds: release each when the vane points toward its bed (51:1). */
export type ReleaseTask = TaskBase & { kind: 'release'; posts: { at: P2; bed: P2; label: string }[]; turn: number };
/** Surah At-Tur: climb the mountain by its painted blazes; wrong branches end in "no way through" (52:1). */
export type BlazesTask = TaskBase & { kind: 'blazes'; lookouts: { at: P2; r: number; label: string; reading: Reading }[]; ends: { at: P2; r: number }[]; blazes: { at: P2; rot: number }[] };
/** Surah An-Najm: hop from star to star in the night sky to find Sirius (53:49). */
export type StarhopTask = TaskBase & { kind: 'starhop'; at: P2 };
/** Surah Al-Qamar: recall the refrain (54:17) at each story stone, with fewer pieces shown each time. */
export type RecallTask = TaskBase & { kind: 'recall'; ref: Ref; pieces: string[]; stones: { at: P2; label: string; reading: Reading; hide: number }[] };
/** Surah Ar-Rahman: test the water at buoys along a pier with a float, and find where fresh and salt water meet (55:19-20). */
export type EstuaryTask = TaskBase & { kind: 'estuary'; buoys: P2[]; meet: number };
/** Surah Al-Waqi'ah: kindle a fire with a bow drill: steady strokes make an ember, gentle breaths make a flame (56:71-72). */
export type FiredrillTask = TaskBase & { kind: 'firedrill'; at: P2 };
/** Surah Al-Hadid: heat iron to working heat with the bellows and strike it into useful tools before it cools (57:25). */
export type ForgeTask = TaskBase & { kind: 'forge'; at: P2; items: { name: string; strikes: number; use: string }[] };
/** Surah Al-Mujadilah: listen to each speaker to the end without interrupting, then say back accurately what they said (58:1). */
export type ListenTask = TaskBase & { kind: 'listen'; at: P2; speakers: { name: string; words: string; repeats: { text: string; ok: boolean; why: string }[] }[] };
/** Surah Al-Hashr: make ready homes for newcomers; when the store runs out, give from your own house (59:9). */
export type WelcomeTask = TaskBase & { kind: 'welcome'; store: P2; own: P2; homes: { at: P2; name: string }[]; items: string[]; stock: number[] };
/** Al-Mumtahanah: lay planks across a stream between two villages; each must rest on both posts (60:7-8). */
export type SpanTask = TaskBase & { kind: 'span'; posts: P2[]; planks: { len: number; from: string }[]; ends: [string, string] };
/** As-Saff: lay a wall course by course so that no joint sits over another: a structure joined firmly (61:4). */
export type BondTask = TaskBase & { kind: 'bond'; at: P2; rot?: number; width: number; courses: number };
/** Al-Jumu'ah: keep a market stall; when the call comes, leave trade for the prayer, then return and seek bounty (62:9-10). */
export type FridayTask = TaskBase & { kind: 'friday'; stall: P2; mosque: P2; goods: string[]; orders: number[]; sales: number };
/** Al-Munafiqun: chances to do good light up one at a time around the village and pass if left for later (63:10). */
export type ChancesTask = TaskBase & { kind: 'chances'; spots: { at: P2; what: string; done: string }[]; life: number; need: number };
/** At-Taghabun: pack a small bag for a long walk; what you chose to carry decides what you can do on the way (64:15-16). */
export type PackTask = TaskBase & { kind: 'pack'; at: P2; room: number; items: { name: string; size: number; use?: number }[]; stops: { at: P2; need: string; ok: string }[] };
/** At-Talaq: share a family's move among carts so that none carries more than it can (65:7). */
export type LoadsTask = TaskBase & { kind: 'loads'; at: P2; to: P2; carts: { name: string; cap: number }[]; parcels: { name: string; w: number }[] };
/** At-Tahrim: follow your own footprints back and put right each thing you spoiled on the way (66:8). */
export type AmendsTask = TaskBase & { kind: 'amends'; trail: P2[]; harms: { at: P2; what: string; fix: string }[] };
/** Al-Mulk: watch the birds above with wings spread and folding, and tell which is which (67:19). */
export type WingsTask = TaskBase & { kind: 'wings'; at: P2; rounds: number };
/** Al-Qalam: open the orchard gate for the gleaners, pick from the branches and leave the fallen fruit (68:17-33). */
export type GleanTask = TaskBase & { kind: 'glean'; gate: P2; trees: P2[] };
/** Al-Haqqah: find things that are real but cannot be seen, each with the right tool (69:38-39). */
export type UnseenTask = TaskBase & { kind: 'unseen'; stations: { at: P2; thing: string; tool: number; shows: string }[]; tools: string[] };
/** Al-Ma'arij: from every harvest, big or small, set aside the known share for those who ask and those in need (70:24-25). */
export type PortionTask = TaskBase & { kind: 'portion'; at: P2; jar: P2; harvests: { what: string; n: number }[]; part: number };
/** Nuh: turn mirrors so the sun's light, reflected, reaches the dark corner (71:16, the moon a reflected light). */
export type ReflectTask = TaskBase & { kind: 'reflect'; origin: P2; cell: number; cols: number; rows: number; sun: [number, number, number]; target: [number, number]; mirrors: { c: number; r: number; start: number }[] };
/** Al-Jinn: find a quiet place to listen, following the hush meter away from the noises (72:1). */
export type HushTask = TaskBase & { kind: 'hush'; sources: { at: P2; name: string; loud: number; rounds: number[] }[]; rounds: number; quiet: number; reading: Reading };
/** Al-Muzzammil: mark a third, half and two thirds of the night on the water clock, then keep watch (73:2-4, 73:20). */
export type NightclockTask = TaskBase & { kind: 'nightclock'; at: P2; dusk: number; dawn: number; marks: { name: string; frac: number }[] };
/** Al-Muddaththir: wash your clothes clean: soak, scrub, rinse until the water runs clear, wring and hang (74:4). */
export type WashTask = TaskBase & { kind: 'wash'; at: P2; items: string[]; clear: number };
/** Al-Qiyamah: match prints pressed in clay to your own fingertips, or say they are someone else's. */
export type PrintsTask = TaskBase & { kind: 'prints'; at: P2; mine: { finger: string; type: 'loop' | 'whorl' | 'arch'; mark: number }[]; tablets: { at: P2; type: 'loop' | 'whorl' | 'arch'; mark: number; of: number }[] };

/** Al-Insan: leave food at a doorstep, knock, and be gone before the door opens, wanting no thanks. */
export type DoorstepTask = TaskBase & { kind: 'doorstep'; pantry: P2; doors: { at: P2; who: string; wants: string }[]; foods: string[]; away: number; secs: number };

/** Al-Mursalat: toss grain on the threshing floor when the wind is just right. */
export type WinnowTask = TaskBase & { kind: 'winnow'; at: P2; lo: number; hi: number; tosses: number };

/** An-Naba: drive a tent's pegs, each opposite the last, so it stands firm in the wind. */
export type PegsTask = TaskBase & { kind: 'pegs'; at: P2; n: number; r: number; rest: Reading };

/** An-Nazi'at: dig a well layer by layer, lining the walls, until water comes and pasture grows. */
export type DigTask = TaskBase & { kind: 'dig'; at: P2; layers: { name: string; to: number; tool: 'spade' | 'pick' }[]; line: number };

/** 'Abasa: plough straight furrows across a field, walking from one end to the other. */
export type FurrowsTask = TaskBase & { kind: 'furrows'; x0: number; gap: number; n: number; z0: number; z1: number; tol: number };

/** At-Takwir: "where are you going?": follow compass bearings from cairn to cairn. */
export type BearingsTask = TaskBase & { kind: 'bearings'; cairns: { at: P2; name: string }[]; route: number[]; r: number };

/** Al-Infitar: keep your balance crossing narrow logs over a gorge. */
export type BeamTask = TaskBase & { kind: 'beam'; logs: { at: P2; name: string; drift: number }[]; secs: number };

/** Al-Mutaffifin: test each stall's buying and selling measures against the true one. */
export type InspectTask = TaskBase & { kind: 'inspect'; stalls: { at: P2; what: string; buy: number; sell: number }[] };

/** Al-Inshiqaq: plan a caravan's stages between wells, then travel them from twilight to morning. */
export type StagesTask = TaskBase & { kind: 'stages'; at: P2; wells: number[]; reach: number; road: P2[] };

/** Al-Buruj: carry each book and tool of the library to a place that keeps it safe. */
export type ShelvesTask = TaskBase & { kind: 'shelves'; table: P2; items: { name: string; needs: ('dry' | 'shade' | 'high')[] }[]; spots: { name: string; at: P2; has: ('dry' | 'shade' | 'high')[]; why: string }[] };

/** At-Tariq: set up a sun still so the sky "returns" fresh water from salt water. */
export type StillTask = TaskBase & { kind: 'still'; at: P2 };

/** Al-A'la: open the box's windows in turn to guide a seedling round its shelves to the light. */
export type LightboxTask = TaskBase & { kind: 'lightbox'; at: P2; gaps: ('left' | 'right')[] };

/** Al-Ghashiyah: look at how the camel is made, then shelter behind it in a sandstorm. */
export type CamelTask = TaskBase & { kind: 'camel'; at: P2; parts: { name: string; use: string }[]; wind: P2; secs: number };

/** Al-Fajr: pair up the dates in each basket to find whether the count is even or odd. */
export type EvenOddTask = TaskBase & { kind: 'evenodd'; at: P2; baskets: { what: string; n: number }[] };

/** Al-Balad: share food fairly by the number in each house on a day of hunger, then carry it up the steep pass. */
export type RationTask = TaskBase & { kind: 'ration'; at: P2; cups: number; homes: { at: P2; who: string; people: number }[] };

/** Ash-Shams: rub the tarnish off a brass lamp, spot by spot, until it shines. */
export type PolishTask = TaskBase & { kind: 'polish'; at: P2; cols: number; rows: number; hard: number[] };

/** Al-Layl: lift heavy loads with as few pulleys as you need. */
export type PulleyTask = TaskBase & { kind: 'pulley'; at: P2; strength: number; loads: { what: string; kg: number }[] };

/** Ad-Duha: answer every knock at the door while you bake, never turning anyone away. */
export type AnswerTask = TaskBase & { kind: 'answer'; oven: P2; door: P2; callers: { who: string; wants: number }[]; gifts: string[] };

/** Ash-Sharh: untangle a fishing net knot by knot, each only once the knots over it are undone. */
export type KnotsTask = TaskBase & { kind: 'knots'; at: P2; knots: { name: string; over: number[] }[] };

export type Task = ReadTask | PointsTask | CarryTask | LeadTask | PickTask | GuideTask | QuizTask | StandTask | ReachTask | ObserveTask | SkyTask | SailTask | ChoiceTask | ShareTask | PromiseTask | WeighTask | FlowTask | SiftTask | ReturnTask | GranaryTask | ValleyTask | GrowTask | PollenTask | RubbingTask | StreetsTask | SunPathTask | PointTask | BeaconTask | DoorsTask | OrderTask | HomeTask | MirrorTask | ShadowTask | EchoTask | AntsTask | RiverTask | ShelterTask | RainTask | VoiceTask | PastureTask | PlumbTask | SluiceTask | ShadesTask | MoonTask | VineTask | SpringTask | HarvestTask | MeasureTask | DawnTask | ShimmerTask | RollcallTask | LinksTask | CluesTask | ScopeTask | CouncilTask | AdornTask | SurveyTask | StationTask | DunesTask | ChannelsTask | CalmTask | RumourTask | RootboxTask | ReleaseTask | BlazesTask | StarhopTask | RecallTask | EstuaryTask | FiredrillTask | ForgeTask | ListenTask | WelcomeTask | SpanTask | BondTask | FridayTask | ChancesTask | PackTask | LoadsTask | AmendsTask | WingsTask | GleanTask | UnseenTask | PortionTask | ReflectTask | HushTask | NightclockTask | WashTask | PrintsTask | DoorstepTask | WinnowTask | PegsTask | DigTask | FurrowsTask | BearingsTask | BeamTask | InspectTask | StagesTask | ShelvesTask | StillTask | LightboxTask | CamelTask | EvenOddTask | RationTask | PolishTask | PulleyTask | AnswerTask | KnotsTask;

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
  /** The world's sky once a task is done (in order; the last one done wins): stories that move from night to day. */
  looks?: { after: string; look: Look }[];
  /** A one-line description of the world's core gameplay (shown in About). */
  play?: string;
  /** Night skies, sea boats, motes over gardens. */
  extras?: { boats?: { at: P2; rot?: number; color?: string; sail?: string }[]; motes?: { at: P2; r: number; color?: string }[] };
  seed: number;
};
