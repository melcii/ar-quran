// Surah 99, Az-Zalzalah (The Earthquake): the Ordinary Afternoon. A quiet
// hill village on an ordinary afternoon, with a well, a lane of houses,
// washing on a line and children playing. "So whoever does an atom's weight
// of good will see it, and whoever does an atom's weight of evil will see
// it" (99:7-8). The core play: meet the small moments in the village, each
// a tiny good or a tiny wrong that no one would notice, and choose. The
// earthquake and the Day (99:1-6) are read only and never shown; the
// ground in this world never shakes.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W099: WorldDef = {
  surah: 99,
  name: 'The Ordinary Afternoon',
  theme: 'Small moments in a quiet village: even an atom’s weight of good counts',
  play: 'In a quiet hill village on an ordinary afternoon, small moments wait in the lanes: a coin in the dust, a thirsty cat, a queue at the well, washing blown down, a child’s sand fort. Each offers a tiny good or a tiny wrong so small no one would notice. Choose.',
  seed: 9999,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 0.9, seed: 99 }),
    palette: PAL.dry,
    paths: [curve([[0, 36], [-6, 24], [0, 12], [6, 0], [0, -12]])],
    flats: [{ x: 0, z: 12, r: 5, paint: '#d8c8a0' }, { x: 6, z: 0, r: 5, paint: '#d8c8a0' }, { x: -6, z: 24, r: 3 }, { x: -12, z: -10, r: 3 }],
  },
  look: { ...LOOKS.golden, sunI: 2.8 },
  veg: {
    grass: 0.6,
    flowers: ['#f8e0a0', '#e8a0a0'],
    trees: [
      { kind: 'fig', at: [[-12, 16], [14, 6]] },
      { kind: 'olive', at: [[-16, -4], [16, -16], [12, 24]] },
    ],
    rocks: [{ x: -20, z: 10, n: 4, big: 1, spread: 4 }],
    pebbles: 18,
    rim: ['olive', 'cypress'],
  },
  far: '#a09a80',
  mountains: { color: '#9a9080', height: 0.8 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    { type: 'well', x: 3, z: 12 },
    { type: 'house', x: -8, z: 8, rot: Math.PI / 2, w: 4.4, d: 3.8, h: 2.8, accent: '#3a6a8a' },
    { type: 'house', x: 13, z: -2, rot: -Math.PI / 2, w: 4.4, d: 3.8, h: 3, accent: '#8a4a3a' },
    { type: 'house', x: -6, z: -8, rot: 0.2, w: 4, d: 3.6, h: 2.8, accent: '#6a8a4a' },
    { type: 'festoon', x: 8, z: 4, to: [11, -4], h: 1.8, color: '#e8e0d0' },
  ],
  welcome:
    'Welcome to the Ordinary Afternoon. Nothing big is happening in the village today. Surah Az-Zalzalah says that even an atom’s weight of good, or of wrong, will be seen. Walk the lanes and see what small moments you meet.',
  tasks: [
    {
      id: 'quake',
      kind: 'read',
      at: [-6, 24],
      marker: 'sign',
      title: 'When the earth is shaken',
      goal: 'Read at the sign on the village lane',
      adaptation: 'The earthquake and the Day are read only; nothing of them is shown, and the ground here never shakes.',
      reading: { title: 'When the earth is shaken', refs: [[99, 1], [99, 2], [99, 3]], note: 'When the earth is shaken with its final quake, and the earth brings out its burdens, and man says, "What is wrong with it?"' },
    },
    {
      id: 'moments',
      kind: 'speck',
      requires: ['quake'],
      spots: [
        { at: [-3, 18], what: 'A coin in the dust', good: 'Pick it up and ask whose it is', bad: 'Slip it into your pocket' },
        { at: [5, 14], what: 'A thirsty cat by the well', good: 'Pour it a little water', bad: 'Shoo it away from the bucket' },
        { at: [1, 9], what: 'The queue at the well', good: 'Wait your turn', bad: 'Slip in at the front' },
        { at: [9, 1], what: 'Washing blown down into the lane', good: 'Pick it up and hang it back', bad: 'Walk across it' },
        { at: [3, -6], what: 'A small child’s sand fort', good: 'Step around it', bad: 'Kick it over for fun' },
      ],
      title: 'An atom’s weight',
      goal: 'Meet the small moments in the village lanes, and choose the small good each time',
      intro: 'Each one is tiny. No one is watching. Does it count?',
      adaptation: 'The village and its moments are a game written for this app.',
      outro: 'Five tiny moments, each met with a small good.',
      after: { title: 'An atom’s weight', refs: [[99, 7], [99, 8]], note: 'So whoever does an atom’s weight of good will see it, and whoever does an atom’s weight of evil will see it.' },
    },
    {
      id: 'news',
      kind: 'read',
      requires: ['moments'],
      at: [-12, -10],
      marker: 'tablet',
      title: 'The earth tells its news',
      goal: 'Read at the tablet at the top of the village',
      reading: { title: 'The earth tells its news', refs: [[99, 4], [99, 5], [99, 6]], note: 'That Day, it will tell its news, because your Lord has inspired it. That Day, people will come out in scattered groups to be shown their deeds.' },
    },
  ],
  finale: {
    title: 'Not one speck lost',
    body: ['Nothing big happened this afternoon: a coin, a cat, a queue, some washing, a sand fort.', 'Surah Az-Zalzalah says that even an atom’s weight of good will be seen, and an atom’s weight of wrong.'],
    ref: [99, 7],
    questions: ['Which small moment was the hardest to get right?', 'What small good could you do tomorrow that no one would see?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The earthquake and the Day are read only, never shown.', 'The small moments are a picture only.'],
};
