// Surah 8, Al-Anfal: the Camp of Courage and Unity. A calm tent camp at the
// edge of the desert in the late afternoon. Carry water, organise supplies,
// share fairly, mend tents, and sort what brings people together from what
// pulls them apart. No battle is shown or acted out; the ayahs about it are
// only read.
import { curve, type P2 } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, facing, rolling } from './common';

const C: P2 = [0, 0];
const TENTS: P2[] = Array.from({ length: 6 }, (_, i) => [Math.cos(0.4 + (i / 6) * Math.PI * 2) * 17, Math.sin(0.4 + (i / 6) * Math.PI * 2) * 17] as P2);
const tentFront = TENTS.map(([x, z]) => facing(x, z, C[0], C[1], 4).door);
const NAMES = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

export const W008: WorldDef = {
  surah: 8,
  name: 'Camp of Courage and Unity',
  theme: 'Carry, share and mend together; keep hearts united',
  seed: 808,
  ground: {
    radius: 60,
    base: rolling({ radius: 60, amp: 3, seed: 8, shapes: [{ x: -30, z: -30, r: 18, h: 6 }, { x: 34, z: -24, r: 14, h: 4 }, { x: 24, z: 30, r: 9, h: -6 }] }),
    palette: PAL.desert,
    paths: [curve([[0, 54], [6, 38], [0, 24], [0, 8]])],
    water: -3,
    shore: '#d8c08a',
    flats: [{ x: 0, z: 0, r: 24, paint: '#e8d4a8' }],
  },
  look: { ...LOOKS.desert, sun: [-0.6, 0.22, -0.7], sunColor: '#ffd29a', hor: '#ffd6a8', fog: '#ecd0b0' },
  veg: {
    grass: 0.5,
    dryGrass: true,
    lush: (x, z) => (Math.hypot(x - 24, z - 30) < 16 ? 1 : 0.25),
    flowers: ['#f4d060', '#fff2d8'],
    flowerDensity: 0.4,
    trees: [
      { kind: 'palm', area: { x: 24, z: 30, r: 14 }, count: 9, size: [0.9, 1.3] },
      { kind: 'palm', area: { x: 0, z: 0, r: 52 }, count: 6 },
      { kind: 'olive', area: { x: -30, z: 20, r: 12 }, count: 3 },
    ],
    rocks: [{ x: -30, z: -30, n: 12, big: 2, spread: 22 }, { x: 34, z: -24, n: 8, big: 1.6, spread: 14 }],
    pebbles: 50,
    rim: ['palm', 'olive'],
  },
  far: '#c8aa78',
  mountains: { color: '#b49a8a', height: 0.9 },
  start: [0, 54],
  startYaw: Math.PI,
  structures: [
    ...TENTS.map(([x, z], i) => ({ type: 'tent', x, z, rot: facing(x, z, 0, 0, 4).rot, w: 5, d: 4, color: i % 2 ? '#7a5a3a' : '#e8d8b8', accent: ['#b84a3a', '#3f6f9a', '#c8a040'][i % 3] }) as Structure),
    { type: 'tent', x: -4, z: -30, rot: 0, w: 7, d: 5, h: 3, color: '#e8d8b8', accent: '#5f8a5a' },
    { type: 'well', x: 18, z: 24 },
    { type: 'rug', x: 0, z: 0, w: 5, d: 4, color: '#9a3a3a' },
    { type: 'cart', x: 8, z: 32, rot: 0.6 },
    { type: 'stones', x: 0, z: 4, n: 7 },
  ],
  herds: [{ animal: 'camel', at: [-22, 30], r: 7, n: 3 }, { animal: 'horse', at: [30, -6], r: 6, n: 2 }],
  welcome:
    'Welcome to the Camp of Courage and Unity. Surah Al-Anfal teaches believers to keep their hearts together, to rely on Allah and to be patient. There is work to do in camp, and it goes best when everyone helps.',
  tasks: [
    {
      id: 'amend',
      kind: 'read',
      at: [-3, 7],
      marker: 'tablet',
      title: 'Set things right between you',
      goal: 'Read the stone in the middle of the camp',
      reading: {
        title: 'Amend what is between you',
        refs: [[8, 1]],
        note: 'The surah begins with a question about how to share things out. The answer: share as Allah and His Messenger decide, and set right what is between you.',
      },
    },
    {
      id: 'water',
      kind: 'carry',
      requires: ['amend'],
      title: 'Carry water',
      goal: 'Carry a water jar from the well to each tent',
      adaptation: 'Camp chores are game activities about cooperation.',
      loads: tentFront.map((to, i) => ({ from: [18, 21] as P2, to, item: 'water', label: 'water jar', dest: `to the ${NAMES[i]} tent` })),
      after: {
        title: 'Rain and calm from Allah',
        refs: [[8, 11]],
        note: 'Before a hard day, Allah sent the believers a calm sleep and rain from the sky to refresh them, steady their hearts and make their feet firm.',
      },
    },
    {
      id: 'stores',
      kind: 'carry',
      requires: ['water'],
      title: 'Organise the supplies',
      goal: 'Carry the supplies from the cart into the big store tent',
      adaptation: 'A game activity about working together.',
      loads: (['grain', 'hay', 'bundle', 'pot', 'grain', 'bundle'] as const).map((item, i) => ({ from: [8, 29] as P2, to: [-7 + (i % 3) * 3, -26 + Math.floor(i / 3) * 1.6] as P2, item, label: item === 'pot' ? 'cooking pot' : item === 'bundle' ? 'bundle of blankets' : `sack of ${item}`, dest: 'to the store tent' })),
    },
    {
      id: 'share',
      kind: 'carry',
      requires: ['stores'],
      title: 'Share fairly',
      goal: 'Take one loaf from the store to each tent',
      adaptation: 'Equal shares are a game idea about 8:1.',
      loads: tentFront.map((to, i) => ({ from: [-11, -24] as P2, to: [to[0] * 0.85, to[1] * 0.85] as P2, item: 'bread', label: 'loaf of bread', dest: `to the ${NAMES[i]} tent` })),
    },
    {
      id: 'mend',
      kind: 'points',
      requires: ['share'],
      style: 'sweep',
      verb: 'Mend the tent',
      title: 'Mend the tents',
      goal: 'Fix the loose pegs and torn edges of four tents',
      adaptation: 'Mending tents is a game activity.',
      points: [0, 2, 3, 5].map((i) => ({ at: [TENTS[i][0] * 1.22, TENTS[i][1] * 1.22] as P2, label: `the ${NAMES[i]} tent` })),
    },
    {
      id: 'unity',
      kind: 'quiz',
      requires: ['mend'],
      at: [3, 7],
      marker: 'scroll',
      title: 'Together or apart?',
      goal: 'At the lectern, sort what brings people together',
      prompt: 'Does each card bring people together, or pull them apart?',
      game: {
        type: 'sort',
        bins: ['Brings us together', 'Pulls us apart'],
        cards: [
          { text: 'Carrying the heavy side of the load with a friend.', bin: 0 },
          { text: 'Arguing about who gets the best spot.', bin: 1 },
          { text: 'Saying sorry first after a quarrel.', bin: 0 },
          { text: 'Whispering unkind things about someone.', bin: 1 },
          { text: 'Waiting patiently for your turn at the well.', bin: 0 },
          { text: 'Refusing to help because it wasn\'t your idea.', bin: 1 },
        ],
      },
      adaptation: 'Cards written for this game, about 8:1 and 8:46.',
      after: {
        title: 'Do not dispute, and be patient',
        refs: [[8, 46]],
        note: 'Do not argue among yourselves, or you will lose heart and your strength will go. Be patient: Allah is with the patient.',
      },
    },
    {
      id: 'believers',
      kind: 'read',
      requires: ['unity'],
      at: [20, 27],
      marker: 'lantern',
      title: 'Hearts that trust',
      goal: 'Read at the lantern by the well',
      reading: {
        title: 'The believers, truly',
        refs: [[8, 2], [8, 3], [8, 4]],
        note: 'The believers are those whose hearts are moved when Allah is mentioned, whose faith grows when they hear His verses, who rely on their Lord, pray, and give from what they have.',
      },
    },
  ],
  finale: {
    title: 'Stronger together',
    body: [
      'You carried water, stored supplies, shared bread equally and mended tents. Nobody can do all of that alone.',
      'Al-Anfal teaches that hearts held together, and relying on Allah, give people courage.',
    ],
    ref: [8, 46],
    questions: ['When did working together make something easier for you?', 'What helps you make up after an argument?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown, and no companion appears.',
    'No battle is shown or acted out. The camp is a game place, not the camp at Badr.',
    'Angels mentioned in the surah are never pictured.',
  ],
};
