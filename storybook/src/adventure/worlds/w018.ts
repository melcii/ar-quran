// Surah 18, Al-Kahf: the Four Realms. One land with four parts: a quiet cave
// in the hills, two gardens side by side, a shore where two seas meet, and a
// gap between two mountain walls. The core play is at the cave: turn the
// day at a dial and mark where the sunlight falls by the cave mouth at
// sunrise and at sunset; it passes the cave by and never enters (18:17). The
// second activity is the barrier: carry sheets of iron to fill the gap
// (18:96). The young men of the cave, Musa, al-Khidr and Dhul-Qarnayn are
// never shown; their stories are read. The boy in 18:74 and 18:80 is not in
// any scene.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const CAVE: P2 = [-26, -20];
const GAP: P2 = [30, -26];

export const W018: WorldDef = {
  surah: 18,
  name: 'The Four Realms',
  theme: 'Follow the sun past the cave mouth, then visit the gardens, the shore and the mountain gap',
  play: 'A world of four parts. At the cave, turn the day and mark where the light falls at sunrise and sunset: it never enters. Then read the two gardens and the meeting of the seas, and carry iron to fill the gap between the mountains.',
  seed: 1818,
  ground: {
    radius: 62,
    base: rolling({
      radius: 62,
      amp: 3,
      seed: 18,
      shapes: [
        { x: -30, z: -28, r: 16, h: 8 },
        { x: 22, z: -34, r: 10, h: 12 },
        { x: 38, z: -32, r: 10, h: 12 },
      ],
      streams: [{ pts: [[-80, 48], [-30, 44], [20, 50], [80, 46]], w: 18, depth: 5 }],
    }),
    palette: PAL.coast,
    paths: [curve([[0, 30], [-10, 10], [-22, -8], [-26, -14]]), curve([[0, 30], [10, 10], [24, -10], [30, -20]]), curve([[0, 30], [-14, 30], [-28, 34]]), curve([[0, 30], [16, 30], [26, 34]])],
    water: -2.4,
    flats: [{ x: -26, z: -16, r: 5 }, { x: 30, z: -24, r: 4 }],
  },
  look: { ...LOOKS.morning, sunI: 3 },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#f4d060'],
    trees: [
      { kind: 'palm', area: { x: -24, z: 18, r: 6 }, count: 4 },
      { kind: 'fig', at: [[-20, 22], [-28, 14]] },
      { kind: 'pine', area: { x: -30, z: -28, r: 14 }, count: 6 },
      { kind: 'oak', area: { x: 0, z: 0, r: 50 }, count: 6 },
    ],
    rocks: [{ x: 30, z: -32, n: 10, big: 2, spread: 16 }, { x: -30, z: -26, n: 8, big: 1.6, spread: 14 }],
    pebbles: 40,
    rim: ['oak', 'pine'],
  },
  far: '#6e8a5a',
  mountains: { color: '#7a84a0', height: 1.3 },
  start: [0, 32],
  startYaw: Math.PI,
  structures: [
    { type: 'bed', x: -24, z: 18, w: 8, d: 6, color: '#6a9a3a' },
    { type: 'bed', x: -10, z: 18, w: 7, d: 5, color: '#a89a6a' },
    { type: 'dock', x: 22, z: 38, rot: 0, w: 2, d: 8 },
    { type: 'boat', x: 24, z: 44, rot: 0.3 },
    { type: 'wall', x: 14, z: 28, to: [20, 28], h: 1.4, color: '#b8a888' },
  ],
  welcome:
    'Welcome to the Four Realms. Surah Al-Kahf tells four stories: young men who sheltered in a cave, a man proud of his two gardens, a journey to where two seas meet, and a traveller who built a barrier. You will visit a place for each. Start at the cave in the hills.',
  tasks: [
    {
      id: 'cave',
      kind: 'read',
      at: [-22, -10],
      marker: 'lantern',
      title: 'The young men of the cave',
      goal: 'Walk up to the cave in the hills',
      reading: {
        title: 'Shelter and guidance',
        refs: [[18, 10], [18, 13]],
        note: 'Some young men who believed in their Lord took shelter in a cave and prayed: Our Lord, give us mercy from You and guide us rightly in our affair. They believed, and Allah increased them in guidance.',
      },
      adaptation: 'The cave is a quiet place made for this game and is empty. The young men and their dog are not shown.',
    },
    {
      id: 'sun',
      kind: 'sunpath',
      requires: ['cave'],
      title: 'The sun past the cave',
      goal: 'Turn the day-dial, and mark where the sunlight falls at sunrise and at sunset',
      intro: 'The dial beside the cave turns the day. At sunrise and at sunset, find where the sunlight falls near the cave mouth, stand in it, and set a marker stone.',
      adaptation: 'The dial, the light patches and the marker stones are game ideas. This is not a picture of the real cave.',
      cave: CAVE,
      caveYaw: 0,
      dial: [-20, -12],
      patches: [
        { label: 'morning light', at: [-21, -16], sun: [0.85, 0.18, 0.4] },
        { label: 'evening light', at: [-31, -16], sun: [-0.85, 0.15, 0.4] },
      ],
      reading: {
        title: 'Inclining away from their cave',
        refs: [[18, 17]],
        note: 'You would have seen the sun, when it rose, turning away from their cave to the right, and when it set, passing them by on the left, while they lay in an open space inside it. That was one of the signs of Allah.',
      },
      outro: 'Two stones, one on each side. The light passed by the cave mouth morning and evening, and never went in.',
    },
    {
      id: 'gardens',
      kind: 'read',
      requires: ['sun'],
      at: [-17, 13],
      marker: 'sign',
      title: 'The two gardens',
      goal: 'Go down to the two gardens',
      reading: {
        title: 'Like rain on the plants',
        refs: [[18, 45], [18, 46]],
        note: 'The life of this world is like rain that makes the plants grow thick, and then they become dry and are scattered by the wind. Wealth and children are the adornment of this life, but good deeds that last are better with your Lord.',
      },
      adaptation: 'The two garden beds stand for the parable of 18:32-44; the two men are not shown.',
    },
    {
      id: 'seas',
      kind: 'read',
      requires: ['gardens'],
      at: [18, 34],
      marker: 'lantern',
      title: 'Where two seas meet',
      goal: 'Go to the shore by the old dock',
      reading: {
        title: 'More than the sea could write',
        refs: [[18, 60], [18, 109]],
        note: 'Musa travelled to where the two seas meet to learn from a servant of Allah. The surah also says: if the sea were ink for the words of my Lord, the sea would run out before His words ran out.',
      },
      adaptation: 'Musa and al-Khidr are not shown. The boat and the wall in their story are read in the whole surah; the boy in 18:74 and 18:80 is in no scene.',
    },
    {
      id: 'barrier',
      kind: 'carry',
      requires: ['seas'],
      result: 'stone',
      title: 'The barrier',
      goal: 'Carry sheets of iron from the pile to fill the gap between the mountains',
      intro: 'Between the two mountain walls is a gap. Carry the sheets of iron from the pile and set them in the gap.',
      adaptation: 'Carrying iron is a game idea based on 18:96. Dhul-Qarnayn and the people who asked for help are not shown, and Ya\'juj and Ma\'juj are not pictured.',
      loads: [-3, -1.5, 0, 1.5, 3].map((d) => ({ from: [26, -12] as P2, to: [GAP[0] + d, GAP[1]] as P2, item: 'plank' as const, label: 'sheet of iron', color: '#6a6a72', dest: 'into the gap' })),
      after: {
        title: 'Bring me sheets of iron',
        refs: [[18, 96]],
        note: 'He said: bring me sheets of iron. When he had filled the gap between the two mountain walls, he had the fire blown upon it, and poured molten copper over it.',
      },
    },
  ],
  finale: {
    title: 'Four journeys',
    body: [
      'You watched the sunlight pass the cave by, saw the two gardens, stood where two seas meet, and helped fill the gap in the mountains.',
      'Al-Kahf is often read on Fridays. Its stories are about faith, humility, learning and using strength to help others.',
    ],
    ref: [18, 46],
    questions: ['Which of the four places would you visit again, and why?', 'What is a good deed that lasts?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown. Musa and al-Khidr are never pictured, and neither is Dhul-Qarnayn.',
    'The young men of the cave and their dog are not shown; the cave is empty.',
    'The boy in 18:74 and 18:80 is in no scene.',
    "Ya'juj and Ma'juj are not pictured.",
  ],
};
