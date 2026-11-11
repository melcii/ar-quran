// Surah 95, At-Tin (The Fig): the Olive Terraces. A terraced hillside of
// olive and fig trees at the end of the harvest, with an old stone olive
// press in a yard at the top. "By the fig and the olive, and Mount Sinai,
// and this secure city: We have certainly created man in the best of
// stature" (95:1-4). The core play: press the olives the way it has long
// been done: crush them under the millstone, spread the paste on mats,
// tighten the press a little at a time, then let the jar settle and skim
// the oil that floats on top. Musa, Mount Sinai and the city are read only,
// never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W095: WorldDef = {
  surah: 95,
  name: 'The Olive Terraces',
  theme: 'Press the olive harvest the old way: crush, spread, press slowly, let it settle, skim',
  play: 'On a terraced hillside of olive and fig trees, the harvest is in and the old stone press stands ready. Turn the millstone until the olives are paste, spread it on woven mats, tighten the press a little at a time while the oil runs, then let the jar settle and skim the golden oil that floats on top.',
  seed: 9595,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.1, seed: 95, tilt: [0, 0.1], shapes: [{ x: 0, z: -4, r: 9, h: 0.6 }] }),
    palette: PAL.autumn,
    paths: [curve([[0, 36], [8, 26], [-6, 16], [4, 8], [0, 3]])],
    flats: [{ x: 1, z: 0, r: 6, paint: '#c8b898' }, { x: 8, z: 26, r: 3 }, { x: -12, z: -2, r: 3 }],
  },
  look: { ...LOOKS.golden, sunI: 2.6 },
  veg: {
    grass: 0.7,
    flowers: ['#f2e8c0', '#c8a0d0'],
    trees: [
      { kind: 'olive', at: [[-10, 22], [-16, 12], [12, 18], [16, 8], [-8, 8], [10, -10], [-14, -12], [18, -2]] },
      { kind: 'fig', at: [[-4, 28], [14, 28], [-18, 2], [6, -14]] },
    ],
    rocks: [{ x: -20, z: 20, n: 5, big: 1, spread: 5 }],
    pebbles: 20,
    rim: ['olive', 'cypress'],
  },
  far: '#9a9a7a',
  mountains: { color: '#8a8478', height: 0.9 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    { type: 'terrace', x: 1, z: 0, w: 9, d: 6, h: 0.3, color: '#c8b898' },
    { type: 'wall', x: -14, z: 16, to: [-4, 18], h: 0.8, color: '#a89c88' },
    { type: 'wall', x: 6, z: 14, to: [16, 12], h: 0.8, color: '#a89c88' },
    { type: 'house', x: -6, z: -6, rot: 0.3, w: 4.2, d: 3.6, h: 2.8, accent: '#6a7a3a' },
    { type: 'cart', x: 7, z: 4, rot: -0.5 },
  ],
  welcome:
    'Welcome to the Olive Terraces. Surah At-Tin begins with an oath: by the fig and the olive. The olive harvest is in, and the old stone press is waiting at the top of the hill.',
  tasks: [
    {
      id: 'oath',
      kind: 'read',
      at: [8, 26],
      marker: 'sign',
      title: 'By the fig and the olive',
      goal: 'Read at the sign among the fig trees',
      adaptation: 'Musa, Mount Sinai and the city are read only; none is shown.',
      reading: { title: 'By the fig and the olive', refs: [[95, 1], [95, 2], [95, 3]], note: 'By the fig and the olive, and Mount Sinai, and this secure city.' },
    },
    {
      id: 'press',
      kind: 'oilpress',
      requires: ['oath'],
      at: [-1, 0],
      turns: 6,
      mats: 4,
      presses: 4,
      settle: 4,
      title: 'The olive press',
      goal: 'Crush the olives, spread the mats, press slowly, then let the jar settle and skim the oil',
      intro: 'Crush, spread, press a little at a time, and wait. Oil cannot be hurried out of an olive.',
      adaptation: 'The grove and the press are a game. Pressing olives with a millstone, mats and a screw press, and letting the oil float up, is real.',
      outro: 'A jar of fresh golden oil from the olives of the grove.',
      after: { title: 'In the best of form', refs: [[95, 4], [95, 5], [95, 6]], note: 'We have certainly created man in the best of stature; then We return him to the lowest of the low, except for those who believe and do righteous deeds: for them is a reward that never ends.' },
    },
    {
      id: 'judge',
      kind: 'read',
      requires: ['press'],
      at: [-12, -2],
      marker: 'tablet',
      title: 'The most just of judges',
      goal: 'Read at the tablet by the top terrace',
      reading: { title: 'The most just of judges', refs: [[95, 7], [95, 8]], note: 'So what can make you deny the Recompense after this? Is not Allah the most just of judges?' },
    },
  ],
  finale: {
    title: 'The best of form',
    body: ['Crushed, spread, pressed slowly and left to settle: the olives gave up their oil.', 'Surah At-Tin swears by the fig and the olive, and says that man was created in the best of form.'],
    ref: [95, 4],
    questions: ['Why did the press have to be tightened slowly?', 'What does it mean to be made "in the best of form"?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Musa, Mount Sinai and the secure city are read only, never shown.', 'The press is a picture only.'],
};
