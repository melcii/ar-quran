// Surah 6, Al-An'am: the Living World of Creation. A wide valley of
// ecosystems: a stream with reeds and palms, open grassland, rocky slopes
// and an orchard. The core play is observation, not handling animals:
//  - On the watching hill, turn the sky-dial to move from deep night to a
//    star, to moonrise, to sunrise and to full day, reading 6:76-79 as the
//    whole world's light changes. Ibrahim is not shown; the ayahs are read.
//  - Then walk out quietly and watch: come close at a walk and keep still,
//    and a page of the field journal fills. Running startles the animals.
//    Flocks of sheep and goats, camels and cattle (6:142-144), then the
//    plants: grain, palms, olives and pomegranates (6:95-99, 6:141).
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const DAY = { ...LOOKS.morning, sunI: 3.2 };
const NIGHT = { ...LOOKS.dusk, zen: '#0e1636', mid: '#24305e', hor: '#4a4a78', sun: [-0.7, -0.2, -0.7] as [number, number, number], sunColor: '#8a90c0', sunI: 0.5, hemiSky: '#4a5890', hemiGround: '#2a2a2a', hemiI: 0.75, fog: '#3a4060', fogDensity: 0.006, stars: 1, moon: undefined, birds: false };
const MOON = { ...NIGHT, mid: '#2c3a6e', hor: '#5a5a8a', hemiI: 0.95, sunI: 0.9, sunColor: '#c8d4ff', sun: [0.4, 0.5, 0.75] as [number, number, number], stars: 0.75, moon: [0.4, 0.5, 0.75] as [number, number, number] };
const DAWN = { ...LOOKS.golden, zen: '#5a74c0', mid: '#c6a2c8', hor: '#ffc690', sun: [0.75, 0.08, 0.6] as [number, number, number], sunI: 2.4, stars: 0.15, birds: true };

const STREAM: P2[] = [[-70, 30], [-40, 22], [-18, 30], [4, 20], [26, 26], [70, 12]];

export const W006: WorldDef = {
  surah: 6,
  name: 'The Living World of Creation',
  theme: 'Turn the sky, then watch the living world quietly',
  play: 'A nature-discovery world: turn the sky from night to day at the hilltop dial, then fill a field journal by watching animals and plants quietly. You never move or round up the animals.',
  seed: 606,
  ground: {
    radius: 66,
    base: rolling({
      radius: 66,
      amp: 3.5,
      seed: 6,
      shapes: [
        { x: -36, z: -30, r: 22, h: 11 },
        { x: 34, z: -26, r: 16, h: 3 },
      ],
      streams: [{ pts: STREAM, w: 4, depth: 4.6 }],
    }),
    palette: PAL.autumn,
    paths: [curve([[0, 60], [-4, 44], [0, 30], [6, 12], [0, -4], [-14, -14], [-28, -22], [-36, -30]]), curve([[0, -4], [16, -14], [32, -22]])],
    water: -2.8,
    flats: [{ x: -36, z: -31, r: 6, paint: '#d8c8a4' }, { x: 16, z: 2, r: 8 }],
  },
  look: { ...LOOKS.dusk, sunI: 2.6, hemiI: 1.25, stars: 0.7 },
  veg: {
    grass: 1.1,
    dryGrass: true,
    flowers: ['#fff2d8', '#c8a0e8', '#f4d060'],
    trees: [
      { kind: 'olive', area: { x: 34, z: -26, r: 14 }, count: 7 },
      { kind: 'fig', area: { x: 30, z: -18, r: 12 }, count: 3 },
      { kind: 'palm', at: [[20, 32], [26, 34], [-14, 36]] },
      { kind: 'autumn', area: { x: 0, z: 0, r: 56 }, count: 8 },
      { kind: 'oak', area: { x: 0, z: 0, r: 56 }, count: 8 },
      { kind: 'pine', area: { x: -36, z: -30, r: 18 }, count: 6 },
    ],
    rocks: [{ x: -36, z: -30, n: 12, big: 1.8, spread: 24 }, { x: 20, z: 40, n: 6, big: 1.3, spread: 14 }],
    pebbles: 40,
    rim: ['oak', 'autumn', 'pine'],
  },
  far: '#6e8a4a',
  mountains: { color: '#6c6c98', height: 1.1 },
  start: [0, 60],
  startYaw: Math.PI,
  structures: [
    { type: 'bridge', x: 4, z: 28, to: [4, 13], w: 2.8 },
    { type: 'house', x: 26, z: 6, rot: -Math.PI / 2, w: 5, d: 4.5, h: 3, accent: '#7a5a3a' },
    { type: 'terrace', x: -36, z: -31, w: 7, d: 6, h: 0.3 },
    { type: 'bed', x: 10, z: -26, w: 7, d: 3.4, color: '#d8c060' },
    { type: 'bed', x: 10, z: -31, w: 7, d: 3.4, color: '#c8b050' },
    { type: 'stones', x: -10, z: 4, n: 5 },
  ],
  welcome:
    'Welcome to the Living World of Creation. Surah Al-An\'am, "The Cattle", points again and again to signs in the world around us: night and daybreak, the stars, the moon and the sun, grain and seeds, rain and gardens, and the animals. Night is coming. Climb to the sky-dial on the watching hill.',
  tasks: [
    {
      id: 'praise',
      kind: 'read',
      at: [-3, 46],
      marker: 'tablet',
      title: 'Darkness and light',
      goal: 'Read the first stone',
      reading: {
        title: 'Who created the heavens and the earth',
        refs: [[6, 1]],
        note: 'All praise belongs to Allah, who created the heavens and the earth and made the darkness and the light. Soon you will turn the sky through night and day.',
      },
    },
    {
      id: 'sky',
      kind: 'sky',
      requires: ['praise'],
      at: [-36, -30],
      title: 'Night to day',
      goal: 'Climb the watching hill and turn the sky-dial, one phase at a time',
      intro: 'On the watching hill is a sky-dial. Each turn moves the whole sky on: deep night with a bright star, then moonrise, then sunrise, then full day. At each one, read what the Quran says about Ibrahim\'s argument with his people, who worshipped the heavenly bodies.',
      adaptation: 'Turning the sky with a dial is a game idea. The sky shown is this game\'s sky, not a picture of that night. Ibrahim is not shown; his words are only read.',
      phases: [
        { look: NIGHT, label: 'deep night and a star', reading: { title: 'When the night covered him', refs: [[6, 74], [6, 75], [6, 76]], note: 'Ibrahim told his father that worshipping idols was a clear error. When the night grew dark he saw a star, and said to his people, "This is my lord", and when it set he said, "I do not like things that set." He was showing his people, step by step, that what disappears cannot be a lord.' } },
        { look: MOON, label: 'moonrise', reading: { title: 'The moon rising', refs: [[6, 77]], note: 'When he saw the moon rising, he said, "This is my lord." When it set, he said, "Unless my Lord guides me, I will surely be among the people gone astray."' } },
        { look: DAWN, label: 'sunrise', reading: { title: 'The sun rising', refs: [[6, 78]], note: 'When he saw the sun rising he said, "This is my lord; this is greater." When it set, he said, "My people, I am free from what you associate with Allah."' } },
        { look: DAY, label: 'full day', reading: { title: 'To Him who created the heavens and the earth', refs: [[6, 79], [6, 96]], note: 'Ibrahim turned his face to the One who created the heavens and the earth. Allah is the One who splits the daybreak, made the night for rest, and the sun and the moon for counting time.' } },
      ],
      outro: 'It is full day. Now walk down into the valley and watch the living world: come close at a walk, then keep still.',
    },
    {
      id: 'animals',
      kind: 'observe',
      requires: ['sky'],
      secs: 4,
      title: 'Field journal: animals',
      goal: 'Find the four herds and watch each one quietly until its journal page fills',
      intro: 'A field journal has four empty pages. Find each herd, come close at a walk, and keep still and watch. Running startles them.',
      adaptation: 'The field journal and the watching rule are game ideas. The animals are not touched, led or moved.',
      subjects: [
        { at: [-14, 8], r: 5, animal: 'sheep', n: 5, label: 'the sheep', note: 'Journal: the sheep graze close together, and the lambs stay by their mothers. Ayah 38 says every creature on the earth and every bird is part of a community, like us.', reading: { title: 'Communities like you', refs: [[6, 38]], note: 'There is no creature on the earth and no bird flying with its wings except that they are communities like you.' } },
        { at: [-50, -14], r: 5, animal: 'goat', n: 4, label: 'the goats on the rocks', note: 'Journal: the goats climb the rocky slope easily and nibble at the bushes.' },
        { at: [38, 6], r: 6, animal: 'camel', n: 3, label: 'the camels', note: 'Journal: the camels rest in the shade, then rise and walk slowly. They carry heavy loads on long journeys.', reading: { title: 'Animals for carrying and for food', refs: [[6, 142]], note: 'Among the grazing animals are some for carrying loads and some that are small. Eat of what Allah has provided for you.' } },
        { at: [32, 12], r: 6, animal: 'cow', n: 4, label: 'the cattle by the stream', note: 'Journal: the cattle drink at the stream and stand in the water to keep cool.', reading: { title: 'Eight in pairs', refs: [[6, 143], [6, 144]], note: 'The ayahs name the grazing animals in pairs: sheep and goats, camels and cattle. The Quran asks the people who made up rules about them to bring knowledge for what they claimed.' } },
      ],
      outro: 'The animal pages are full. Now the plants: the grain field, the palms, and the orchard.',
    },
    {
      id: 'plants',
      kind: 'observe',
      requires: ['animals'],
      secs: 4,
      title: 'Field journal: plants',
      goal: 'Watch the grain field, the palms and the orchard until their pages fill',
      adaptation: 'The places are game places. The plants are the ones the ayahs name.',
      subjects: [
        { at: [10, -28.5], r: 4, label: 'the grain field', note: 'Journal: the grain stands in rows, each ear full of seeds. From one seed, many.', reading: { title: 'The splitter of grain and date seeds', refs: [[6, 95]], note: 'Allah splits open the grain and the date seed. He brings the living out of the dead.' } },
        { at: [22, 32], r: 4, label: 'the palms by the stream', note: 'Journal: clusters of dates hang low on the palms near the water.', reading: { title: 'Rain, and everything that grows', refs: [[6, 99]], note: 'Allah sends down rain from the sky, and by it brings out every kind of plant: green shoots, close-packed grain, palm trees with low-hanging clusters of dates, gardens of grapes, olives and pomegranates. Look at their fruit as it ripens: in that are signs.' } },
        { at: [34, -24], r: 5, label: 'the olive and pomegranate orchard', note: 'Journal: olives and pomegranates grow side by side, alike and yet different.', reading: { title: 'Gardens, trellised and not', refs: [[6, 141]], note: 'Allah produces gardens, trellised and not, palm trees and crops of different taste, olives and pomegranates, alike and unlike. Eat of their fruit, give its due on harvest day, and do not waste.' } },
      ],
    },
  ],
  finale: {
    title: 'Signs everywhere',
    body: [
      'You turned the sky from night to day and read how Ibrahim showed his people that what sets cannot be a lord. Then you watched the living world quietly and filled your journal.',
      'Al-An\'am asks us to look, and to think about who made all of it.',
    ],
    ref: [6, 99],
    questions: ['Which animal did you like watching most, and why?', 'What sign of Allah\'s creation can you see from your window?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown; Ibrahim and his people do not appear.',
    'The star, moon and sun in the sky are the game\'s sky, not a reconstruction of that night.',
    'The animals are only watched, never led, caught or harmed.',
  ],
  extras: { motes: [{ at: [6, 20], r: 18, color: '#e8ff9a' }] },
};
