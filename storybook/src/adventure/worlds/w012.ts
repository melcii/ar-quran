// Surah 12, Yusuf: the Seven Years Storehouse. A river valley with fields
// along the water and a great storehouse. The places of the story (the
// dream, the well in the desert, the house in Egypt, the prison, the king's
// hall) are reading places along the way; no one in the story is ever shown
// and the explorer never plays Yusuf. The core play is the storehouse years:
// seven good harvests, deciding each year how much to eat and how to keep
// the rest, then seven hard years giving the town what it needs, and a
// little seed left for the year of rain (12:47-49).
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const FIELDS: [number, number][] = [-27, -18, -9, 0, 9, 18, 27].map((x) => [x, -27]);

export const W012: WorldDef = {
  surah: 12,
  name: 'The Seven Years Storehouse',
  theme: 'Plan the harvests of seven good years so the store lasts through seven hard ones',
  play: 'A planning world: each good year cut the ripe field, carry it to the storehouse and choose how much to eat and how to keep the rest; then give the town what it needs in each hard year. If the store runs short, the good years are planned again.',
  seed: 1212,
  ground: {
    radius: 64,
    base: rolling({
      radius: 64,
      amp: 2.2,
      seed: 12,
      shapes: [
        { x: -38, z: 30, r: 18, h: 3 },
        { x: 40, z: 34, r: 14, h: 2 },
      ],
      streams: [{ pts: [[-90, -46], [-30, -42], [20, -44], [90, -40]], w: 12, depth: 5 }],
    }),
    palette: PAL.dry,
    paths: [
      curve([[0, 56], [4, 44], [-10, 34], [-30, 30]]),
      curve([[4, 44], [18, 30], [32, 22]]),
      curve([[0, 30], [0, 10], [0, -6]]),
      curve([[-26, 4], [-12, 0], [0, -6], [14, -4], [36, 0]]),
      curve([[-32, -20], [32, -20]]),
    ],
    water: -2.6,
    flats: [
      { x: 0, z: -10, r: 9, paint: '#d8c49a' },
      { x: -30, z: 4, r: 7, paint: '#e2d2ae' },
      { x: 0, z: 16, r: 6 },
    ],
  },
  look: { ...LOOKS.desert, sunI: 3.3, clouds: 0.4 },
  veg: {
    grass: 0.7,
    dryGrass: true,
    flowers: ['#f4d060', '#fff2d8'],
    trees: [
      { kind: 'palm', at: [[-40, -34], [-34, -36], [-20, -35], [-6, -35], [8, -35], [22, -35], [36, -34], [44, -32], [-12, 6], [12, 8]] },
      { kind: 'fig', area: { x: 34, z: 20, r: 10 }, count: 3 },
      { kind: 'olive', area: { x: -20, z: 20, r: 14 }, count: 4 },
    ],
    rocks: [{ x: -38, z: 30, n: 10, big: 1.4, spread: 18 }, { x: 46, z: -6, n: 5, big: 1.2, spread: 10 }],
    pebbles: 30,
    rim: ['palm', 'olive'],
    lush: (x, z) => (z < -18 ? 1 : Math.hypot(x + 38, z - 30) < 16 ? 0.1 : 0.6),
  },
  far: '#c8b080',
  mountains: { color: '#b8a48a', height: 0.7 },
  start: [0, 54],
  startYaw: Math.PI,
  structures: [
    { type: 'house', x: 0, z: -10, w: 10, d: 6, h: 4.6, accent: '#8a6a3a' },
    { type: 'well', x: -38, z: 30 },
    { type: 'tent', x: -46, z: 24, rot: 0.6, color: '#c8a070' },
    { type: 'cart', x: -30, z: 36, rot: 1.2 },
    { type: 'house', x: 34, z: 20, rot: -Math.PI / 2, w: 7, d: 6, h: 3.6, accent: '#6a8aa0' },
    { type: 'wall', x: 40, z: -8, to: [50, -8], h: 3.2, color: '#a89a80' },
    { type: 'wall', x: 50, z: -8, to: [50, 4], h: 3.2, color: '#a89a80' },
    { type: 'wall', x: 40, z: 4, to: [50, 4], h: 3.2, color: '#a89a80' },
    { type: 'columns', x: -30, z: 4, w: 8, d: 6, n: 6 },
    { type: 'arch', x: 0, z: 16, w: 4.5 },
    { type: 'bench', x: 5, z: 17, rot: Math.PI / 2 },
  ],
  welcome:
    'Welcome to the Seven Years Storehouse. Surah Yusuf tells one long story, and the Quran calls it the best of stories. You will walk past its places as reading places: no one in the story is shown. Then the storehouse needs a planner: seven good years are coming, and after them seven hard ones. Start at the first stone.',
  tasks: [
    {
      id: 'dream',
      kind: 'read',
      at: [6, 46],
      marker: 'tablet',
      title: 'The dream',
      goal: 'Read the first stone',
      reading: {
        title: 'Eleven stars, the sun and the moon',
        refs: [[12, 4], [12, 5], [12, 6]],
        note: 'Young Yusuf told his father of a dream. His father told him not to tell his brothers, and said that Allah would teach him the meaning of events.',
      },
    },
    {
      id: 'well',
      kind: 'read',
      requires: ['dream'],
      at: [-35, 31],
      marker: 'sign',
      title: 'The well in the desert',
      goal: 'Walk out to the old well in the desert',
      reading: {
        title: 'The well and the travellers',
        refs: [[12, 15], [12, 19]],
        note: 'His brothers left him in a well. Travellers came to draw water and found him, and he was taken to Egypt. Even then, Allah told him that one day he would tell his brothers about this.',
      },
      adaptation: 'The well is a place in this game, not a picture of the real well. No one is shown.',
    },
    {
      id: 'house',
      kind: 'read',
      requires: ['well'],
      at: [30, 22],
      marker: 'lantern',
      title: 'The house in Egypt',
      goal: 'Go to the house in Egypt',
      reading: {
        title: 'Honest, whatever it cost',
        refs: [[12, 21], [12, 33]],
        note: 'Yusuf grew up in the house of a man in Egypt. When he was pressed to do something wrong, he refused, and said he would rather go to prison than do it. He asked Allah to keep him from it.',
      },
      adaptation: 'This part of the story is told only briefly here, for young readers. Reviewers are asked to check this summary.',
    },
    {
      id: 'prison',
      kind: 'read',
      requires: ['house'],
      at: [45, -2],
      marker: 'lantern',
      title: 'The prison',
      goal: 'Find the prison walls by the river road',
      reading: {
        title: 'Two companions in prison',
        refs: [[12, 39]],
        note: 'Even in prison Yusuf taught the truth to the two young men with him: is it better to have many separate lords, or Allah, the One?',
      },
    },
    {
      id: 'king',
      kind: 'read',
      requires: ['prison'],
      at: [-26, 2],
      marker: 'scroll',
      title: "The king's dream",
      goal: "Go to the king's hall of columns",
      reading: {
        title: 'Seven fat cows and seven green spikes',
        refs: [[12, 43], [12, 46]],
        note: 'The king dreamed of seven fat cows eaten by seven lean ones, and seven green ears of grain and seven dry. No one could explain it, until the man who had been in prison remembered Yusuf.',
      },
      outro: 'The meaning of the dream: seven good years, then seven hard ones. The storehouse by the river needs a careful planner. The first field is ripe.',
    },
    {
      id: 'years',
      kind: 'granary',
      requires: ['king'],
      title: 'The storehouse years',
      goal: 'Cut each ripe field, store the harvest, then give out what the town needs in the hard years',
      intro: 'Seven good years are starting. Each year one field by the river ripens. Cut it, carry it to the storehouse, and decide how much the household eats and how the rest is kept. Then seven hard years come, and the town will need grain from the store each year.',
      adaptation: 'The planning game, its numbers, the spoiling rule and the town\'s needs are written for this app. The Quran gives the advice (12:47-49); it does not give these numbers.',
      store: [0, -5],
      fields: FIELDS,
      harvest: 10,
      eatMin: 1,
      need: 6,
      seed: 2,
      loss: { ear: 0.02, loose: 0.15 },
      sow: [0, -27],
      readings: {
        good: { title: 'Leave it in its spikes', refs: [[12, 47]], note: 'Yusuf explained the dream: plant for seven years, and leave what you harvest in its ears, except a little that you eat.' },
        hard: { title: 'Seven hard years', refs: [[12, 48]], note: 'Then seven hard years would come and use up what had been stored for them, except a little kept back.' },
        rain: { title: 'A year of rain', refs: [[12, 49]], note: 'After that would come a year in which people are given rain, and they press olives and grapes again.' },
      },
    },
    {
      id: 'together',
      kind: 'read',
      requires: ['years'],
      at: [0, 14],
      marker: 'lantern',
      title: 'No blame today',
      goal: 'Go to the arch in the middle of the valley',
      reading: {
        title: 'Forgiveness',
        refs: [[12, 90], [12, 92]],
        note: 'In the hard years his brothers came to Egypt for grain. When they finally knew him, Yusuf forgave them: "No blame will there be upon you today."',
      },
      adaptation: 'The meeting is told by reading only; no one is shown.',
    },
  ],
  finale: {
    title: 'The best of stories',
    body: [
      'You walked through the places of Yusuf\'s story and kept a storehouse through seven good years and seven hard ones, eating only a little and keeping the rest safe in the ear.',
      'Yusuf was patient in the well, honest in the house, a teacher in prison, a careful planner in the good years, and forgiving at the end.',
    ],
    ref: [12, 111],
    questions: ['What would you save a little of, today, for later?', 'Why do you think forgiving his brothers was so important?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown: Yusuf, Yaqub and the brothers never appear, and the explorer never plays Yusuf.',
    'The king, the household and the companions in prison are not shown either; their part is read only.',
    'The household episode (12:23-32) is summarised briefly for young readers and flagged for review.',
    'The numbers in the storehouse game are made up. The Quran gives the advice, not the amounts.',
  ],
  extras: { boats: [{ at: [-20, -44], rot: 1.5, sail: '#f2e8d4' }, { at: [30, -43], rot: -1.4 }] },
};
