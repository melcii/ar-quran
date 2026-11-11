// Surah 17, Al-Isra: the Town of Good Conduct. A small town at night, its
// streets lit by lamps that are still dark. Each street holds one of the
// guidelines of 17:23-37 as something to do: carry a neighbour's basket
// home, take bread to three doors, close taps left running, fill a measure
// right to the line, and walk the long street calmly. Each lamp lights when
// its act is done. The Night Journey (17:1) is read at the start; the
// Prophet, al-Buraq and the journey are never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const NIGHT = { ...LOOKS.dusk, zen: '#141c40', mid: '#2c3666', hor: '#5a5684', sunI: 0.7, sunColor: '#9aa4d8', hemiI: 0.9, hemiSky: '#5a68a0', stars: 1, fogDensity: 0.007, fog: '#3a4064', birds: false };

export const W017: WorldDef = {
  surah: 17,
  name: 'The Town of Good Conduct',
  theme: 'Light the town at night, one good act on each street',
  play: 'A night town of five streets. Each holds one guideline from 17:23-37 as a hands-on act: carry, give, close the taps, fill the measure without spilling, walk calmly. Its lamp lights when it is done.',
  seed: 1717,
  ground: {
    radius: 50,
    base: rolling({ radius: 50, amp: 1.4, seed: 17 }),
    palette: PAL.dry,
    paths: [
      curve([[0, 44], [0, 24], [0, 0], [0, -24]]),
      curve([[-28, 20], [28, 20]]),
      curve([[-28, 0], [28, 0]]),
      curve([[-28, -16], [28, -16]]),
      curve([[30, 22], [30, -20]]),
    ],
    pathWidth: 3.2,
    flats: [{ x: 4, z: 36, r: 2.5 }, { x: 0, z: 0, r: 30, paint: '#cbb894' }],
  },
  look: NIGHT,
  veg: {
    grass: 0.4,
    dryGrass: true,
    trees: [{ kind: 'olive', at: [[-8, 26], [10, 28], [-20, -24], [20, -24]] }, { kind: 'cypress', at: [[36, 24], [36, -22]] }],
    rocks: [],
    pebbles: 10,
    rim: ['olive', 'cypress'],
  },
  far: '#3a4a3a',
  mountains: { color: '#2c3456', height: 0.8 },
  start: [0, 42],
  startYaw: Math.PI,
  structures: [
    { type: 'house', x: -24, z: 4, rot: Math.PI, w: 6, d: 5, h: 3.4, accent: '#7a5a3a' },
    { type: 'house', x: -12, z: 26, rot: Math.PI, w: 5, d: 5, h: 3.2, accent: '#6a7a8a' },
    { type: 'house', x: 8, z: 26, rot: Math.PI, w: 6, d: 5, h: 3.4, accent: '#8a5a4a' },
    { type: 'house', x: 18, z: 6, rot: Math.PI, w: 5, d: 5, h: 3.2, accent: '#5a6a4a' },
    { type: 'house', x: 22, z: -6, w: 5, d: 5, h: 3.2, accent: '#7a6a8a' },
    { type: 'house', x: 14, z: -22, w: 6, d: 5, h: 3.4, accent: '#8a7a5a' },
    { type: 'house', x: -12, z: -24, w: 6, d: 5, h: 3.4, accent: '#6a5a4a' },
    { type: 'stall', x: -22, z: -12, rot: Math.PI / 2 },
  ],
  welcome:
    'Welcome to the Town of Good Conduct. It is night, and the street lamps are dark. Surah Al-Isra gives a list of ways to live well: with parents, relatives, neighbours and travellers, with money and measures, and in the way we walk. Read the first tablet.',
  tasks: [
    {
      id: 'iblis',
      kind: 'read',
      at: [4, 36],
      marker: 'sign',
      title: 'Iblis refuses',
      goal: 'Read at the sign near the way in',
      adaptation: 'Adam, the angels and Iblis are read only; none is shown.',
      reading: { title: 'Iblis refuses', refs: [[17, 61], [17, 62], [17, 63], [17, 64], [17, 65]], note: 'When We said to the angels: prostrate to Adam, they prostrated, except Iblis. He said: Shall I prostrate to one You created from clay? Allah said: Indeed, over My servants you have no authority. And sufficient is your Lord as a Guardian.' },
    },
    {
      id: 'journey',
      kind: 'read',
      at: [3, 36],
      marker: 'tablet',
      title: 'By night',
      goal: 'Read the tablet at the town gate',
      reading: {
        title: 'The Night Journey',
        refs: [[17, 1]],
        note: 'The surah begins with the Night Journey: Allah took His servant by night from the Sacred Mosque to the Farthest Mosque, to show him some of His signs.',
      },
      adaptation: 'The Night Journey is read only. The Prophet (peace be upon him), al-Buraq and the journey are not shown.',
    },
    {
      id: 'town',
      kind: 'streets',
      requires: ['journey'],
      title: 'Light the five streets',
      goal: 'Do the good act on each street so its lamp lights',
      intro: 'Each of the five streets has a dark lamp. On each one there is something to do. When it is done, the lamp lights.',
      adaptation: 'The acts on each street are examples written for this app; the guidelines themselves are read from the verified text. The neighbours are not shown.',
      streets: [
        { label: 'parents street', lamp: [-18, 22], act: 'carry', from: [-6, 21], to: [[-24, 7]], item: 'basket', what: "neighbour's basket", done: 'The basket is home. Helping older people, and speaking kindly to our parents, lights the first street.', reading: { title: 'Kindness to parents', refs: [[17, 23], [17, 24]], note: 'Be good to your parents. When they grow old, do not say even "uff" to them; speak to them kindly, and pray: My Lord, have mercy on them as they cared for me when I was small.' } },
        { label: 'bakers street', lamp: [24, 22], act: 'carry', from: [8, 21], to: [[18, 3], [22, -3], [14, -19]], item: 'bread', what: 'bread', done: 'Bread at three doors: for a relative, for a family in need and for a traveller.', reading: { title: 'Give their right', refs: [[17, 26]], note: 'Give relatives what is their right, and the poor and the traveller too, and do not waste.' } },
        { label: 'fountain street', lamp: [-4, -10], act: 'taps', taps: [[-5, 2], [6, -2], [-2, -14]], done: 'Every tap is closed, and no water is running away.', reading: { title: 'Do not waste', refs: [[17, 27]], note: 'Wasteful people are like brothers of the devils, and Satan was ungrateful to his Lord.' } },
        { label: 'market street', lamp: [-26, -18], act: 'measure', at: [-20, -12], done: 'A full measure, fair to the buyer, and nothing spilled.', reading: { title: 'A full measure', refs: [[17, 35]], note: 'Give full measure when you measure, and weigh with a true balance. That is better, and best in the end.' } },
        { label: 'the long street', lamp: [34, -20], act: 'calm', from: [30, 20], to: [30, -18], done: 'You walked the whole long street calmly.', reading: { title: 'Walk humbly', refs: [[17, 37]], note: 'Do not walk on the earth proudly: you cannot tear the earth apart, and you will never be as tall as the mountains.' } },
      ],
      outro: 'All five lamps are lit, and the town glows in the night.',
    },
    {
      id: 'honour',
      kind: 'read',
      requires: ['town'],
      at: [3, 4],
      marker: 'lantern',
      title: 'Honoured',
      goal: 'Read at the lantern in the middle of town',
      reading: {
        title: 'We have honoured the children of Adam',
        refs: [[17, 70]],
        note: 'Allah has honoured the children of Adam, carried them on land and sea, and provided them with good things.',
      },
    },
  ],
  finale: {
    title: 'A town full of light',
    body: ['You helped, gave, saved water, measured fairly and walked calmly, and each street lit up.', 'Al-Isra says this Quran guides to what is most upright.'],
    ref: [17, 9],
    questions: ['Which of the five streets would be easiest for you at home?', 'Which would be hardest, and what could help?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown. The Night Journey (17:1) is read only; nothing of it is pictured.',
    'The neighbours, the family and the traveller are not shown: their doors and lamps stand for them.',
    'The acts on each street are examples written for this app.',
  ],
};
