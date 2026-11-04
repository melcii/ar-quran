// Surah 1, Al-Fatihah: the Garden of Guidance. A short, polished first world.
// A winding path through a blossoming garden at golden hour. Seven lanterns
// stand along it, one for each ayah; lighting them in order opens each ayah.
// At the pavilion at the end, match each ayah to its translation and put
// the seven in order. The path is a picture of 1:6, "Guide us to the
// straight path", used as a game idea only.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, along, rolling } from './common';

const PATH: P2[] = curve([
  [0, 50],
  [-10, 38],
  [-4, 24],
  [10, 14],
  [12, 0],
  [0, -10],
  [-12, -18],
  [-6, -28],
  [0, -33],
]);
const L = along(PATH, 7, 2.4, 0.1, 0.86);

const NOTES = [
  'In the name of Allah: we begin with His name, the Entirely Merciful, the Especially Merciful. This first ayah is counted as part of Al-Fatihah.',
  'All praise belongs to Allah, the Lord of all the worlds: everything that exists.',
  'Allah is the Entirely Merciful and the Especially Merciful. His mercy is mentioned again, so we remember it.',
  'Allah is the Sovereign of the Day of Recompense, the day every deed is repaid with perfect fairness.',
  'We worship Allah alone, and we ask Him alone for help.',
  'We ask Allah to guide us to the straight path. Muslims say this in every prayer.',
  'The straight path is the path of those Allah has favoured, not the path of those who earned His anger or who went astray.',
];

export const W001: WorldDef = {
  surah: 1,
  name: 'Garden of Guidance',
  theme: 'Seven ayahs, seven lanterns along one path',
  seed: 101,
  ground: {
    radius: 58,
    base: rolling({
      radius: 58,
      amp: 3.5,
      seed: 1,
      shapes: [
        { x: 24, z: 22, r: 16, h: 3.5 },
        { x: -26, z: -4, r: 18, h: 4 },
        { x: 26, z: -26, r: 12, h: -6 },
      ],
    }),
    palette: PAL.meadow,
    paths: [PATH],
    pathWidth: 1.7,
    water: -3,
    flats: [
      { x: 0, z: -40, r: 9, paint: '#e6d6b4' },
      { x: 0, z: 50, r: 4 },
    ],
  },
  look: LOOKS.blossom,
  veg: {
    grass: 1,
    flowers: ['#f6c0d0', '#fff2d8', '#f4d060', '#c8a0e8', '#f08a8a'],
    flowerDensity: 1.6,
    trees: [
      { kind: 'blossom', area: { x: 0, z: 0, r: 46 }, count: 16, size: [0.8, 1.15] },
      { kind: 'autumn', area: { x: 0, z: 0, r: 52 }, count: 7, size: [0.9, 1.2] },
      { kind: 'cypress', at: [[-5, -36], [5, -36], [-8, -42], [8, -42], [-6, 44], [6, 44]], size: [0.9, 1.1] },
      { kind: 'oak', area: { x: 0, z: 0, r: 54 }, count: 8 },
      { kind: 'fig', area: { x: -20, z: 20, r: 12 }, count: 3 },
    ],
    rocks: [
      { x: -28, z: -6, n: 7, big: 1.6, spread: 12 },
      { x: 22, z: 26, n: 5, big: 1.3, spread: 9 },
    ],
    pebbles: 30,
    rim: ['blossom', 'oak', 'autumn', 'pine'],
  },
  far: '#7a9a54',
  mountains: { color: '#8a8cb0' },
  structures: [
    { type: 'terrace', x: 0, z: -41, w: 12, d: 9, h: 0.35, color: '#e8d8b8' },
    { type: 'dome', x: 0, z: -44, w: 7, d: 6, h: 4, color: '#f0e2c4', accent: '#5f9aa0' },
    { type: 'columns', x: 0, z: -37.6, w: 10, n: 4, rot: 0, color: '#efe2c8' },
    { type: 'rug', x: 0, z: -40.5, w: 4, d: 2.6, color: '#b0503a', accent: '#e8c070' },
    { type: 'bed', x: -7, z: 30, w: 4, d: 2, color: '#f6c0d0' },
    { type: 'bed', x: 16, z: 8, w: 4, d: 2, color: '#fff2d8', rot: 0.4 },
    { type: 'bed', x: -16, z: -12, w: 4, d: 2, color: '#c8a0e8', rot: -0.3 },
    { type: 'festoon', x: -5, z: -31, to: [5, -31], h: 3.4 },
    { type: 'arch', x: 0, z: 46, w: 3.6, h: 4, rot: 0, color: '#efe2c8' },
  ],
  start: [0, 52],
  startYaw: Math.PI,
  welcome:
    'Welcome to the Garden of Guidance. Al-Fatihah, "The Opening", is the first surah of the Quran and is recited in every prayer. Seven lanterns wait along this path, one for each of its seven ayahs. Walk the path and light them in order.',
  tasks: [
    {
      id: 'lanterns',
      kind: 'points',
      style: 'lantern',
      ordered: true,
      verb: 'Light the lantern',
      title: 'Seven lanterns',
      goal: 'Follow the path and light the seven lanterns in order',
      adaptation: 'The lanterns and the path are a picture made for this game. Lighting one opens its ayah to read.',
      points: L.map((at, i) => ({
        at,
        label: `ayah ${i + 1}`,
        reading: { title: `Al-Fatihah, ayah ${i + 1}`, refs: [[1, i + 1]], note: NOTES[i] },
      })),
      outro: 'All seven lanterns are lit, and the path to the pavilion glows. Seven ayahs: short enough to learn by heart, and recited in every prayer.',
    },
    {
      id: 'match',
      kind: 'quiz',
      requires: ['lanterns'],
      at: [-3, -36.5],
      marker: 'scroll',
      title: 'Match the meanings',
      goal: 'At the pavilion, match each ayah to its meaning',
      prompt: 'Each ayah of Al-Fatihah is here in Arabic, with its translation beside it. Find the pairs.',
      game: { type: 'match', refs: [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7]] },
      adaptation: 'Matching uses the verified Arabic and the Saheeh International translation of whole ayahs. Word-by-word meanings are not used, because they need a reviewed word-by-word source.',
    },
    {
      id: 'order',
      kind: 'quiz',
      requires: ['match'],
      at: [3, -36.5],
      marker: 'scroll',
      title: 'Seven in order',
      goal: 'Put the seven ayahs in order at the second lectern',
      prompt: 'Tap the ayahs of Al-Fatihah from the first to the seventh.',
      game: { type: 'order', refs: [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7]] },
      adaptation: 'A memory game using the verified text.',
    },
  ],
  finale: {
    title: 'The Opening',
    body: [
      'You walked the path and lit every lantern. Al-Fatihah begins with praise of Allah, remembers His mercy and the Day of Recompense, and then turns into a prayer.',
      'In the middle of it we say that we worship Allah alone and ask Him alone for help. Then we ask to be guided.',
    ],
    ref: [1, 6],
    questions: ['When do you say Al-Fatihah each day?', 'What does it mean to ask for guidance, even when we already know the way?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet or any person from the Quran is shown.',
    'The garden, pavilion and lanterns are not meant to show Paradise or any real place.',
  ],
  extras: { motes: [{ at: [0, -38], r: 10 }, { at: [-6, 24], r: 14, color: '#fff2c8' }] },
};
