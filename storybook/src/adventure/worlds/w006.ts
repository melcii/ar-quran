// Surah 6, Al-An'am: the Valley of Creation, at dusk with the first stars and
// a rising moon. Bring the flock into the fold, find signs in nature (seed,
// daybreak, stars, rain and gardens), climb the watching hill to read about
// the star, the moon and the sun, and plant olive and pomegranate seedlings.
// Ibrahim is never shown; the hill is a place to read.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const STREAM: P2[] = [[-70, 30], [-40, 22], [-18, 30], [4, 20], [26, 26], [70, 12]];

export const W006: WorldDef = {
  surah: 6,
  name: 'Valley of Creation',
  theme: 'Flocks, seeds, stars and gardens: signs for those who think',
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
    { type: 'pen', x: 16, z: 2, w: 12 },
    { type: 'house', x: 26, z: 6, rot: -Math.PI / 2, w: 5, d: 4.5, h: 3, accent: '#7a5a3a' },
    { type: 'terrace', x: -36, z: -31, w: 7, d: 6, h: 0.3 },
    { type: 'bed', x: 38, z: -16, w: 6, d: 3 },
    { type: 'bed', x: 40, z: -24, w: 6, d: 3 },
    { type: 'stones', x: -10, z: 4, n: 5 },
  ],
  herds: [{ animal: 'goat', at: [-22, 6], r: 6, n: 3 }],
  welcome:
    'Welcome to the Valley of Creation. Surah Al-An\'am, "The Cattle", points again and again to signs in the world around us: grain and seeds, daybreak and night, the sun, the moon and the stars, rain and gardens. The day is ending. Let\'s begin.',
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
        note: 'All praise belongs to Allah, who created the heavens and the earth and made the darkness and the light. Watch the light change as the evening comes.',
      },
    },
    {
      id: 'flock',
      kind: 'lead',
      requires: ['praise'],
      animal: 'sheep',
      herd: { at: [-20, 44], r: 10 },
      n: 5,
      pen: [16, 2],
      penLabel: 'the fold across the bridge',
      title: 'Bring the flock home',
      goal: 'Lead the five sheep over the bridge into the fold',
      intro: 'Night is coming. The sheep are still out in the meadow. Tap a sheep to lead it, and bring all five into the fold across the bridge.',
      adaptation: 'Caring for the flock is a game idea; the surah is named after grazing livestock.',
    },
    {
      id: 'signs',
      kind: 'points',
      requires: ['flock'],
      style: 'sign',
      verb: 'Read the sign',
      title: 'Signs in the valley',
      goal: 'Find the four sign stones around the valley',
      points: [
        { at: [-8, 0], label: 'the grain field', reading: { title: 'The seed and the date stone', refs: [[6, 95]], note: 'Allah splits open the seed and the date stone so they sprout. He brings the living out of the dead.' } },
        { at: [30, -8], label: 'the eastern edge', reading: { title: 'Daybreak, rest and reckoning', refs: [[6, 96]], note: 'Allah breaks open the dawn, made the night for rest, and the sun and moon for counting time.' } },
        { at: [-4, -10], label: 'the open sky', reading: { title: 'Stars to guide you', refs: [[6, 97]], note: 'Allah placed the stars so people can find their way in the dark, on land and sea.' } },
        { at: [36, -30], label: 'the olive grove', reading: { title: 'Rain, grain, palms and gardens', refs: [[6, 99]], note: 'Allah sends rain, and from it grow green plants, grain in rows, palm clusters hanging low, and gardens of grapes, olives and pomegranates, alike and yet different. Look at the fruit as it ripens.' } },
      ],
    },
    {
      id: 'hill',
      kind: 'points',
      requires: ['signs'],
      style: 'sign',
      ordered: true,
      verb: 'Read',
      title: 'The watching hill',
      goal: 'Climb the hill and read the four stones in order',
      intro: 'On the hill are four stones with the ayahs about Ibrahim (Abraham), the star, the moon and the sun. Nobody is shown here: look up at the sky as you read.',
      points: [
        { at: [-31, -27], label: 'the first stone', reading: { title: 'The kingdom of the heavens and the earth', refs: [[6, 74], [6, 75]], note: 'Ibrahim told his people that worshipping idols was a clear mistake. Allah showed him the kingdom of the heavens and the earth, so that he would be certain.' } },
        { at: [-39, -27], label: 'the star stone', reading: { title: 'The star', refs: [[6, 76]], note: 'When night came he saw a star. When it set, he said: "I do not like things that disappear." Many scholars explain he was showing his people, step by step, that what disappears cannot be God.' } },
        { at: [-40, -34], label: 'the moon stone', reading: { title: 'The moon', refs: [[6, 77]], note: 'Then the moon rose, and it set too. Ibrahim said that without his Lord\'s guidance, he would be lost.' } },
        { at: [-32, -35], label: 'the sun stone', reading: { title: 'The sun, and the Creator', refs: [[6, 78], [6, 79]], note: 'The sun rose, bigger still, and it set too. Ibrahim turned to the One who created the heavens and the earth, and worshipped Him alone.' } },
      ],
      adaptation: 'The hill and the sky are places to read the ayahs; Ibrahim and his people are never shown, and the scene is not a reconstruction.',
    },
    {
      id: 'plant',
      kind: 'carry',
      requires: ['hill'],
      result: 'sprout',
      title: 'Plant the garden',
      goal: 'Plant six seedlings in the garden beds by the olive grove',
      adaptation: 'Planting is a game idea about 6:99.',
      loads: [[36, -15], [38, -15], [40, -15], [36, -23], [38, -23], [40, -23]].map((to, i) => ({ from: [30, -12] as P2, to: to as P2, item: 'seedling', label: i < 3 ? 'olive seedling' : 'pomegranate seedling', dest: `to bed space ${i + 1}` })),
    },
  ],
  finale: {
    title: 'Signs everywhere',
    body: [
      'You brought the flock home, read the signs of seed, dawn, stars and rain, and climbed the hill as the stars came out.',
      'Al-An\'am asks us to look, and to think about who made all of it.',
    ],
    ref: [6, 99],
    questions: ['Which sign did you notice first tonight?', 'What sign of Allah\'s creation can you see from your window?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown; Ibrahim and his people do not appear.',
    'The star, moon and sun in the sky are the game\'s evening sky, not a reconstruction of that night.',
  ],
  extras: { motes: [{ at: [6, 20], r: 18, color: '#e8ff9a' }] },
};
