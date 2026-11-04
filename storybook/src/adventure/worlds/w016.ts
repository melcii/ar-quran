// Surah 16, An-Nahl: the Honeybee Meadow. A flower meadow seen from flower
// height: the flowers stand taller than the explorer, and bees fly between
// them and a hive in a hollow tree. The core play is pollination: gather
// pollen from a flower and brush it onto another flower of the same kind,
// until the comb fills with honey of different colours (16:68-69). Around
// the meadow are the other blessings the surah counts: rain and crops, the
// grazing flocks, and the senses we were given.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

// Twelve flowers of three kinds, mixed so the same kind is never next door.
const FLOWERS: { at: P2; kind: number }[] = [
  [0, 10], [7, 14], [14, 9], [20, 15], [4, 3], [11, 1], [18, 4], [24, 8], [2, -6], [9, -8], [16, -5], [23, -1],
].map((at, i) => ({ at: at as P2, kind: (i + Math.floor(i / 4)) % 3 }));

export const W016: WorldDef = {
  surah: 16,
  name: 'The Honeybee Meadow',
  theme: 'At flower height, carry pollen with the bees until the comb fills with honey',
  play: 'A meadow seen at flower height: watch the hive quietly, then gather pollen from one flower and brush it onto another of the same kind. Each pollinated flower sets fruit, the bees visit it, and the comb fills with honey of different colours.',
  seed: 1616,
  ground: {
    radius: 56,
    base: rolling({ radius: 56, amp: 2.6, seed: 16, shapes: [{ x: -30, z: 26, r: 14, h: 4 }, { x: 36, z: -26, r: 14, h: 3 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 48], [-2, 34], [-6, 24], [-14, 10], [-18, -10]]), curve([[-6, 24], [-24, 28], [-30, 26]])],
    flats: [{ x: -30, z: 26, r: 3.5 }],
  },
  look: { ...LOOKS.blossom, sunI: 3.1 },
  veg: {
    grass: 1.4,
    flowers: ['#f4d060', '#c8a0e8', '#f2a0b8', '#ffffff'],
    flowerDensity: 1.6,
    trees: [
      { kind: 'blossom', area: { x: 0, z: 0, r: 46 }, count: 6 },
      { kind: 'olive', area: { x: -30, z: -20, r: 12 }, count: 4 },
      { kind: 'fig', at: [[30, 26], [-36, 2]] },
      { kind: 'palm', at: [[40, 6], [42, 12]] },
    ],
    rocks: [{ x: 36, z: -26, n: 6, big: 1.2, spread: 12 }],
    pebbles: 30,
    rim: ['oak', 'blossom'],
  },
  far: '#6e9a4a',
  mountains: { color: '#7a86a8', height: 1 },
  start: [0, 46],
  startYaw: Math.PI,
  structures: [
    { type: 'fence', x: 26, z: 30, to: [40, 30] },
    { type: 'fence', x: 40, z: 30, to: [40, 40] },
    { type: 'bench', x: -30, z: 26, rot: Math.PI / 2 },
  ],
  herds: [{ animal: 'sheep', at: [32, 36], r: 6, n: 6 }, { animal: 'cow', at: [-34, -30], r: 6, n: 3 }],
  welcome:
    'Welcome to the Honeybee Meadow. Here the flowers stand taller than you, and you can watch the bees at their own height. Surah An-Nahl, "The Bee", counts the blessings around us: rain, crops, animals, and the bee and its honey. Start at the meadow gate.',
  tasks: [
    {
      id: 'rain',
      kind: 'read',
      at: [-2, 36],
      marker: 'sign',
      title: 'Rain and crops',
      goal: 'Read at the meadow gate',
      reading: {
        title: 'From it is drink, and from it is pasture',
        refs: [[16, 10], [16, 11]],
        note: 'Allah sends down rain from the sky: some of it you drink, and from it grow the plants where animals graze. With it He grows crops, olives, palms, grapes and every kind of fruit.',
      },
    },
    {
      id: 'hive',
      kind: 'observe',
      requires: ['rain'],
      secs: 4,
      title: 'The hive',
      goal: 'Find the hive in the hollow tree and watch it quietly',
      intro: 'There is a hive in a hollow tree at the edge of the meadow. Walk up gently and keep still: bees do not like being rushed.',
      adaptation: 'The hive and the bees are this game\'s pictures. Watching quietly is a game rule.',
      subjects: [
        {
          at: [-18, -14],
          r: 4,
          label: 'the hive in the hollow tree',
          note: 'Journal: bees fly in and out of the hollow tree all the time. Some come back with yellow pollen on their legs.',
          reading: { title: 'Your Lord inspired the bee', refs: [[16, 68]], note: 'Your Lord inspired the bee: make homes in the mountains, in the trees, and in what people build.' },
        },
      ],
    },
    {
      id: 'pollen',
      kind: 'pollen',
      requires: ['hive'],
      title: 'Pollen for the meadow',
      goal: 'Gather pollen from a flower and brush it onto another flower of the same kind',
      intro: 'Bees visit flower after flower. As they drink, pollen sticks to them and they carry it to the next flower of the same kind, and that flower can set fruit and seed. Try it yourself: gather pollen from one flower, then find another of the same kind.',
      adaptation: 'The ayahs speak of the bee eating from all the fruits and of the drink of many colours from its belly. That bees carry pollen between flowers is what people have learned by watching them. Carrying pollen yourself is a game idea.',
      kinds: [
        { label: 'blue sage', color: '#8a8ae8' },
        { label: 'golden marigold', color: '#f0b030' },
        { label: 'pink clover', color: '#f08ab0' },
      ],
      flowers: FLOWERS,
      n: 6,
      hive: [-18, -18],
      reading: {
        title: 'A drink of many colours',
        refs: [[16, 69]],
        note: 'Then eat from all the fruits and follow the ways of your Lord made easy for you. From their bellies comes a drink of different colours, in which there is healing for people. In that is a sign for people who think.',
      },
      outro: 'The meadow is setting fruit and seed, and the comb in the hollow tree is filling with honey of different colours.',
    },
    {
      id: 'flocks',
      kind: 'read',
      requires: ['pollen'],
      at: [28, 32],
      marker: 'sign',
      title: 'The grazing animals',
      goal: 'Go to the sheep fold by the fence',
      reading: {
        title: 'Warmth, food and beauty',
        refs: [[16, 5], [16, 6], [16, 66]],
        note: 'Allah created the grazing animals: from them come warmth, food and many benefits, and there is beauty in them as they come home in the evening and go out in the morning. From them comes pure milk.',
      },
    },
    {
      id: 'senses',
      kind: 'stand',
      requires: ['flocks'],
      at: [-29, 26],
      secs: 5,
      label: 'Sit on the bench and listen',
      title: 'Hearing, sight and understanding',
      goal: 'Sit on the bench on the hill and listen to the meadow',
      style: 'none',
      reading: {
        title: 'Hearing, sight and hearts',
        refs: [[16, 78], [16, 79]],
        note: 'Allah brought you out of your mothers knowing nothing, and gave you hearing, sight and understanding, so that you might be grateful. Do they not see the birds held up in the sky? No one holds them up but Allah.',
      },
    },
  ],
  finale: {
    title: 'Too many to count',
    body: [
      'You watched the hive, carried pollen between flowers of the same kind, and saw the comb fill with honey of different colours.',
      'Surah An-Nahl says that if we tried to count Allah\'s blessings, we could not number them.',
    ],
    ref: [16, 18],
    questions: ['Which blessing in the meadow surprised you most?', 'What could you thank Allah for that you use every day without thinking?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown.',
    'The bees, flowers and hive are pictures made for this game, and the flowers are drawn larger than life so you can see them at a bee\'s height.',
    'Pollination is described as what people have observed about bees; it is not presented as something the ayahs say.',
  ],
};
