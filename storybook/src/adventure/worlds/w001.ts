// Surah 1, Al-Fatihah: the Seven Gates. A short, polished architectural
// journey through seven stone chambers on a high plateau of warm ruins, one
// chamber for each ayah, each with its own small way of taking part:
//  1. stand on the threshold stone to begin "in the name of Allah"
//  2. look out of three windows on the worlds (land, water, sky)
//  3. open the dry spring and watch the chamber turn green
//  4. keep still in the hall of the sundial while its shadow moves
//  5. stand on the prayer rug facing the niche
//  6. find the straight way through a hall of branching passages
//  7. on the open terrace, read and listen to the whole surah.
// The seven gates are a learning device of this game, not gates described
// in Al-Fatihah. Nothing in it shows Allah, any prophet, or the unseen.
import type { Structure } from '../kit';
import type { P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

/** Chamber k (0..6) runs from z = Z0 - k*S down to Z0 - (k+1)*S, x from -H to H. */
const Z0 = 62;
const S = 18;
const H = 8;
const zc = (k: number) => Z0 - k * S - S / 2;
const RUIN = '#d8c19a';
const RUIN2 = '#cdb088';

/** Side walls for all chambers, and the cross walls with a gate in the middle, each opened by its chamber's activity. */
function chambers(): Structure[] {
  const out: Structure[] = [];
  const ids = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
  out.push({ type: 'wall', x: -H, z: Z0, to: [-H, Z0 - 6 * S], color: RUIN });
  out.push({ type: 'wall', x: H, z: Z0, to: [H, Z0 - 6 * S], color: RUIN });
  // The way in, between broken wall ends.
  out.push({ type: 'wall', x: -H, z: Z0, to: [-3, Z0], color: RUIN2 });
  out.push({ type: 'wall', x: 3, z: Z0, to: [H, Z0], color: RUIN2 });
  out.push({ type: 'arch', x: 0, z: Z0, w: 4.4, h: 4.6, color: RUIN });
  for (let k = 1; k <= 6; k++) {
    const z = Z0 - k * S;
    out.push({ type: 'wall', x: -H, z, to: [-2.6, z], color: k % 2 ? RUIN : RUIN2 });
    out.push({ type: 'wall', x: 2.6, z, to: [H, z], color: k % 2 ? RUIN : RUIN2 });
    out.push({ type: 'gate', x: 0, z, rot: 0, w: 5, hide: ids[k - 1], color: '#e6d2a8' });
  }
  return out;
}

// Chamber 6: a hall of branching passages. Only the middle way runs straight through.
const MZ = zc(5);
const maze: Structure[] = [
  { type: 'wall', x: -2, z: MZ + 7, to: [-2, MZ + 3.5], color: RUIN2 },
  { type: 'wall', x: -2, z: MZ + 1, to: [-2, MZ - 6], color: RUIN2 },
  { type: 'wall', x: 2, z: MZ + 7, to: [2, MZ - 1.5], color: RUIN2 },
  { type: 'wall', x: 2, z: MZ - 4, to: [2, MZ - 6], color: RUIN2 },
  { type: 'wall', x: -8, z: MZ + 2, to: [-4.5, MZ + 2], color: RUIN2 },
  { type: 'wall', x: -4.5, z: MZ + 2, to: [-4.5, MZ - 4], color: RUIN2 },
  { type: 'wall', x: 8, z: MZ - 1, to: [4.5, MZ - 1], color: RUIN2 },
  { type: 'wall', x: 4.5, z: MZ + 4, to: [4.5, MZ - 1], color: RUIN2 },
];
// Gaps in the middle way that tempt you aside.
const mazeGaps: Structure[] = [
  { type: 'stones', x: -5.5, z: MZ - 6, n: 4 },
  { type: 'stones', x: 6, z: MZ + 5, n: 4 },
];

const NOTES = [
  'In the name of Allah, the Entirely Merciful, the Especially Merciful. Muslims begin good things with these words. In this way of counting, this first ayah is part of Al-Fatihah.',
  'All praise belongs to Allah, the Lord of all the worlds: the land, the sea, the sky, and everything in them.',
  'Allah is the Entirely Merciful, the Especially Merciful. His mercy is named again in the surah, so we keep remembering it.',
  'Allah is the Sovereign of the Day of Recompense, the day when every deed, small or large, is repaid with perfect fairness.',
  'We worship Allah alone, and we ask Him alone for help. Every prayer says this.',
  'Guide us to the straight path. We ask for guidance every day, even when we already know the way.',
  'The path of those Allah has favoured, not of those who earned His anger or who went astray.',
];
const ayah = (i: number) => ({ title: `Al-Fatihah, ayah ${i + 1}`, refs: [[1, i + 1]] as [number, number][], note: NOTES[i] });

const ALL: [number, number][] = [1, 2, 3, 4, 5, 6, 7].map((a) => [1, a]);

const win = (z: number): P2 => [-H + 1.6, z];

export const W001: WorldDef = {
  surah: 1,
  name: 'The Seven Gates',
  theme: 'Seven chambers, one for each ayah',
  play: 'An architectural journey: seven chambers in a row, each opened by a different small act (standing, looking, opening a spring, waiting, facing, finding the straight way), ending with the whole surah.',
  seed: 101,
  ground: {
    radius: 74,
    base: rolling({
      radius: 74,
      amp: 2.5,
      seed: 1,
      shapes: [
        { x: 30, z: 20, r: 18, h: 4 },
        { x: -32, z: -10, r: 20, h: 5 },
        { x: 0, z: -96, r: 40, h: -14 },
      ],
    }),
    palette: { ...PAL.dry, path: '#e2cfa4' },
    paths: [[[0, 70], [0, Z0 + 1]]],
    pathWidth: 2.2,
    flats: [
      { x: 0, z: 12, r: 14, paint: '#e6d4ae' },
      { x: 0, z: 34, r: 12, paint: '#e6d4ae' },
      { x: 0, z: 52, r: 12, paint: '#e6d4ae' },
      { x: 0, z: -6, r: 12, paint: '#e6d4ae' },
      { x: 0, z: -24, r: 12, paint: '#e6d4ae' },
      { x: 0, z: -42, r: 12, paint: '#e6d4ae' },
      { x: 0, z: -58, r: 10, paint: '#ead8b4' },
    ],
  },
  look: LOOKS.golden,
  veg: {
    grass: 0.8,
    // The chambers are stone; grass grows in the garden court and outside.
    lush: (x, z) => (Math.abs(x) < H + 1 && z < Z0 && z > Z0 - 6 * S ? (z < Z0 - S && z > Z0 - 2 * S ? 1 : 0.05) : 0.9),
    dryGrass: true,
    flowers: ['#fff2d8', '#f4d060', '#e8a07a'],
    flowerDensity: 0.7,
    trees: [
      { kind: 'cypress', at: [[-11, 66], [11, 66], [-12, 4], [12, 4], [-12, -40], [12, -40]], size: [0.9, 1.2] },
      { kind: 'olive', area: { x: 0, z: 0, r: 60 }, count: 9 },
      { kind: 'fig', at: [[-5, zc(1) + 4], [5, zc(1) - 4]] },
      { kind: 'pine', area: { x: 0, z: 0, r: 66 }, count: 8 },
    ],
    rocks: [
      { x: -30, z: -10, n: 9, big: 1.8, spread: 14 },
      { x: 28, z: 22, n: 6, big: 1.4, spread: 10 },
      { x: 0, z: -66, n: 6, big: 1.4, spread: 12 },
    ],
    pebbles: 40,
    rim: ['olive', 'pine', 'cypress'],
  },
  far: '#a89a6a',
  mountains: { color: '#a08aa0', height: 1.1 },
  structures: [
    ...chambers(),
    // 1. The threshold.
    { type: 'columns', x: 0, z: zc(0) - 4, w: 12, n: 4, rot: 0, color: '#efe2c8' },
    { type: 'festoon', x: -6, z: zc(0) + 3, to: [6, zc(0) + 3], h: 3.6 },
    // 2. The garden court: three windows on the worlds.
    { type: 'arch', x: -H + 0.4, z: zc(1) + 4, w: 2.6, h: 3, rot: Math.PI / 2, color: RUIN },
    { type: 'arch', x: -H + 0.4, z: zc(1) - 4, w: 2.6, h: 3, rot: Math.PI / 2, color: RUIN },
    { type: 'arch', x: H - 0.4, z: zc(1), w: 2.6, h: 3, rot: Math.PI / 2, color: RUIN },
    { type: 'bed', x: 3, z: zc(1) + 3, w: 3, d: 1.6, color: '#f4d060' },
    { type: 'bed', x: -2.5, z: zc(1) - 2, w: 3, d: 1.6, color: '#e88a9a' },
    // 3. The spring: dry stones first, then water and green beds.
    { type: 'stones', x: 0, z: zc(2), n: 7, hide: 'c3' },
    { type: 'pool', x: 0, z: zc(2), w: 4.2, show: 'c3' },
    { type: 'bed', x: -4.5, z: zc(2) + 4, w: 3, d: 1.6, color: '#9ac870', show: 'c3' },
    { type: 'bed', x: 4.5, z: zc(2) - 4, w: 3, d: 1.6, color: '#f6c0d0', show: 'c3' },
    { type: 'bed', x: 4.5, z: zc(2) + 4, w: 3, d: 1.6, color: '#fff2d8', show: 'c3' },
    // 4. The hall of the sundial.
    { type: 'columns', x: -5.5, z: zc(3), w: 12, n: 4, rot: Math.PI / 2, color: '#e6d8bc' },
    { type: 'columns', x: 5.5, z: zc(3), w: 12, n: 4, rot: Math.PI / 2, color: '#e6d8bc' },
    { type: 'tower', x: 0, z: zc(3) + 4.5, h: 3.2, w: 1.1, d: 1.1 },
    // 5. The prayer hall: a niche in the far wall.
    { type: 'dome', x: H - 1.6, z: zc(4), w: 2.6, d: 4.4, h: 3.6, rot: -Math.PI / 2, color: '#efe2c4', accent: '#5f9aa0' },
    { type: 'rug', x: -4, z: zc(4) + 2, w: 1.4, d: 2.2, color: '#7a3a3a', accent: '#e8c070' },
    { type: 'rug', x: 4, z: zc(4) + 2, w: 1.4, d: 2.2, color: '#3a5a7a', accent: '#e8c070' },
    // 6. The hall of passages.
    ...maze,
    ...mazeGaps,
    // 7. The open terrace.
    { type: 'terrace', x: 0, z: -58, w: 18, d: 12, h: 0.35, color: '#ece0c6' },
    { type: 'columns', x: 0, z: -63.5, w: 16, n: 6, rot: 0, color: '#efe2c8' },
    { type: 'festoon', x: -7, z: -53, to: [7, -53], h: 3.4 },
  ],
  start: [0, 70],
  startYaw: Math.PI,
  welcome:
    'Welcome to the Seven Gates. Al-Fatihah, "The Opening", has seven ayahs and is recited in every prayer. Here are seven chambers, one for each ayah. Each gate opens in its own way. The gates are a learning game, not something described in the surah.',
  tasks: [
    {
      id: 'c1',
      kind: 'stand',
      at: [0, zc(0) + 2],
      r: 1.4,
      secs: 3,
      label: 'The threshold stone',
      title: '1 · Begin with His name',
      goal: 'Stand on the threshold stone for a moment to begin',
      intro: 'The first chamber. Muslims begin with "In the name of Allah". Stand still on the round threshold stone to begin.',
      adaptation: 'Standing on a stone to begin is a game idea for the opening words.',
      reading: ayah(0),
    },
    {
      id: 'c2',
      kind: 'points',
      requires: ['c1'],
      style: 'sign',
      verb: 'Look out',
      title: '2 · The Lord of the worlds',
      goal: 'In the garden court, look out of all three windows',
      intro: 'All praise belongs to Allah, Lord of all the worlds. Look out of the three windows of this garden court: the land, the water and the sky.',
      adaptation: 'The windows and views are a game idea about "all the worlds".',
      points: [
        { at: win(zc(1) + 4), label: 'the window on the land' },
        { at: win(zc(1) - 4), label: 'the window on the water' },
        { at: [H - 1.6, zc(1)], label: 'the window on the sky' },
      ],
      after: ayah(1),
    },
    {
      id: 'c3',
      kind: 'points',
      requires: ['c2'],
      style: 'sign',
      verb: 'Open the spring',
      title: '3 · Mercy',
      goal: 'Open the dry spring in the third chamber',
      intro: 'This chamber is dry and dusty. Open the spring in the middle and see what changes.',
      adaptation: 'The spring that turns the chamber green is a picture of mercy made for this game.',
      points: [{ at: [2.6, zc(2) + 2.4], label: 'the dry spring' }],
      outro: 'Water runs, and the chamber turns green. Mercy is named twice in Al-Fatihah.',
      after: ayah(2),
    },
    {
      id: 'c4',
      kind: 'stand',
      requires: ['c3'],
      at: [0, zc(3) - 1],
      r: 1.4,
      secs: 6,
      label: 'The stone by the sundial',
      title: '4 · The Day of Recompense',
      goal: 'Stand still by the sundial while its shadow moves',
      intro: 'A quiet hall with a sundial. Stand still on the stone and watch while time passes. Every moment, and every deed in it, counts.',
      adaptation: 'Waiting by a sundial is a game idea for the Day of Recompense, which is not pictured.',
      reading: ayah(3),
    },
    {
      id: 'c5',
      kind: 'stand',
      requires: ['c4'],
      at: [-1.5, zc(4)],
      r: 1.2,
      secs: 4,
      face: [H, zc(4)],
      style: 'rug',
      label: 'The prayer rug',
      title: '5 · You alone',
      goal: 'Stand on the prayer rug facing the niche',
      intro: 'A prayer hall. Stand on the rug in the middle, facing the niche in the east wall, and keep still.',
      adaptation: 'Standing on a rug facing a niche is a game idea; it is not a lesson on how to pray.',
      reading: ayah(4),
    },
    {
      id: 'c6',
      kind: 'reach',
      requires: ['c5'],
      at: [0, Z0 - 6 * S + 2],
      r: 1.8,
      label: 'The far gate',
      title: '6 · The straight path',
      goal: 'Find the straight way through the hall of passages',
      intro: 'A hall of branching passages. Some turn aside and end at a wall. Find the way that runs straight through to the far gate.',
      adaptation: 'The passages are a game idea for 1:6; the straight path in the ayah is not a place.',
      reading: ayah(5),
    },
    {
      id: 'c7',
      kind: 'read',
      requires: ['c6'],
      at: [0, -57],
      marker: 'tablet',
      title: '7 · The whole surah',
      goal: 'On the open terrace, read and listen to the whole of Al-Fatihah',
      reading: {
        title: 'Al-Fatihah, all seven ayahs',
        refs: ALL,
        note: 'The path of those Allah has favoured, not of those who earned His anger or who went astray. Now read all seven ayahs together, from the first to the last, and listen to each one where a recitation is available.',
      },
    },
  ],
  finale: {
    title: 'The Opening',
    body: [
      'You passed through seven chambers: you began with His name, looked out on the worlds, saw a dry place made green, waited while time passed, faced the niche, and found the straight way.',
      'Al-Fatihah begins with praise, remembers mercy and the Day of Recompense, and then turns into a prayer for guidance.',
    ],
    ref: [1, 6],
    questions: ['When do you say Al-Fatihah each day?', 'What does it mean to ask for guidance, even when we already know the way?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet or any person from the Quran is shown.',
    'The seven gates and chambers are a learning device of this game. They are not described in Al-Fatihah, and they do not show Paradise or any real place.',
  ],
  extras: { motes: [{ at: [0, -58], r: 12 }, { at: [0, zc(2)], r: 6, color: '#e6ffd8' }] },
};
