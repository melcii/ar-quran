// Surah 77, Al-Mursalat (Those Sent Forth): the Windy Threshing Floor. A
// round stone threshing floor on a bare hilltop, with a flag on a pole and
// gusts that come and go. The surah opens with an oath by "those sent forth
// one after another, those that blow violently, those that spread far and
// wide" (77:1-3), explained by many as winds. The core play: watch the flag
// and toss the grain from the winnowing basket only in a steady breeze, so
// the chaff blows away and the grain falls clean. The angels of 77:4-5 are
// never shown, and nothing of the Day is pictured.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W077: WorldDef = {
  surah: 77,
  name: 'The Windy Threshing Floor',
  theme: 'Read the gusting wind and winnow the grain in a steady breeze',
  play: 'On a bare hilltop the grain is threshed but still mixed with chaff. Watch the flag on its pole: the wind comes and goes in gusts. Toss the grain up only in a steady breeze: too calm and the chaff falls back, too strong and the grain blows away too.',
  seed: 7777,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1, seed: 77, shapes: [{ x: 0, z: 4, r: 22, h: 4 }] }),
    palette: PAL.dry,
    paths: [curve([[0, -38], [8, -26], [2, -14], [0, -2]])],
    flats: [{ x: 0, z: 4, r: 6 }, { x: 8, z: -26, r: 3 }, { x: -10, z: 14, r: 3 }],
  },
  look: { ...LOOKS.golden, clouds: 1.5 },
  veg: {
    grass: 1.2,
    flowers: ['#f4d060'],
    trees: [{ kind: 'pine', at: [[-18, -6], [16, 18]] }],
    rocks: [{ x: -24, z: -16, n: 5, big: 1.2, spread: 6 }],
    pebbles: 24,
    rim: ['pine', 'oak'],
  },
  far: '#a8a060',
  mountains: { color: '#9a98b0', height: 1 },
  start: [0, -38],
  startYaw: 0,
  structures: [
    { type: 'stones', x: 5, z: 10, n: 4 },
    { type: 'cart', x: -5, z: 9, rot: 0.6 },
  ],
  welcome:
    'Welcome to the Windy Threshing Floor. Surah Al-Mursalat begins with an oath by winds sent forth one after another, blowing hard and spreading far. Up here the wind never stops for long. Watch it well, and it will clean your grain.',
  tasks: [
    {
      id: 'winds',
      kind: 'read',
      at: [8, -26],
      marker: 'sign',
      title: 'Sent forth one after another',
      goal: 'Read at the sign on the hill path',
      adaptation: 'Many explain these oaths as winds; the angels some explain them as are never shown.',
      reading: { title: 'Sent forth one after another', refs: [[77, 1], [77, 2], [77, 3], [77, 7]], note: 'By those sent forth one after another, and those that blow violently, and those that spread far and wide! What you are promised will surely come.' },
    },
    {
      id: 'winnow',
      kind: 'winnow',
      requires: ['winds'],
      at: [0, 4],
      lo: 0.4,
      hi: 0.65,
      tosses: 5,
      title: 'Winnowing in the wind',
      goal: 'At the threshing floor, toss the grain five times in a steady breeze',
      intro: 'Watch the flag. When it streams out steadily, not hanging limp and not snapping in a gust, toss the grain.',
      adaptation: 'The hilltop is a game. Winnowing with the wind is real and very old.',
      outro: 'Five clean tosses. The chaff is gone on the wind, and the grain is clean.',
      after: { title: 'Sweet water to drink', refs: [[77, 25], [77, 26], [77, 27]], note: 'Have We not made the earth a place that holds the living and the dead, and set on it high, firm mountains, and given you sweet water to drink?' },
    },
    {
      id: 'measured',
      kind: 'read',
      requires: ['winnow'],
      at: [-10, 14],
      marker: 'tablet',
      title: 'A known measure',
      goal: 'Read at the tablet on the far side of the hilltop',
      reading: { title: 'A known measure', refs: [[77, 20], [77, 21], [77, 22], [77, 23]], note: 'Did We not create you from a humble fluid, which We placed in a safe resting place for a known time? So We measured it, and how excellent We are at measuring!' },
    },
  ],
  finale: {
    title: 'Clean grain',
    body: ['You watched the gusts come and go, and tossed the grain only when the breeze was steady.', 'Surah Al-Mursalat swears by the winds sent forth one after another.'],
    ref: [77, 1],
    questions: ['How did the flag help you know when to toss?', 'What else does the wind do for us?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The angels some explain 77:1-5 as are never shown.', 'Nothing of the Day (77:8-15) is shown.'],
};
