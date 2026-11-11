// Surah 80, 'Abasa (He Frowned): the Valley Field. A river valley after
// heavy rain, with a field ready to plough, a hand plough at its edge, and
// olive and palm trees along the banks. "Let a person look at their food:
// how We poured down water in torrents, then split the earth open, and made
// grain grow in it, and grapes and green herbs, and olives and date palms,
// and dense gardens, and fruit and pasture" (80:24-31). The core play: walk
// behind the plough from stake to stake, keeping each furrow straight, until
// the field is ploughed and comes up with those foods. The opening account
// (80:1-10) is read only: the Prophet and the blind man are never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W080: WorldDef = {
  surah: 80,
  name: 'The Valley Field',
  theme: 'Plough straight furrows after the rain, and see the foods the surah names come up',
  play: 'The rain has soaked a field in the river valley, and it is ready to plough. Walk behind the plough from the stake at one end of each furrow to the stake at the other, keeping straight. If a furrow wanders, start it again. When the field is ploughed, the foods the surah names come up along the furrows.',
  seed: 8080,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 0.9, seed: 80, streams: [{ pts: [[30, -40], [24, -10], [26, 20], [20, 42]], w: 4, depth: 1.8 }] }),
    palette: PAL.meadow,
    paths: [curve([[-4, -36], [-8, -22], [-4, -12], [-6, -8]])],
    water: -0.8,
    flats: [{ x: -2, z: 2, r: 11, paint: '#8a6a44' }, { x: -8, z: -22, r: 3 }, { x: -18, z: 10, r: 3 }],
  },
  look: { ...LOOKS.morning, clouds: 1.3 },
  veg: {
    grass: 1.2,
    flowers: ['#fff2d8', '#f4d060'],
    trees: [{ kind: 'olive', at: [[-16, -6], [-20, 20], [14, 18]] }, { kind: 'palm', at: [[16, -8], [18, 6], [12, -20]] }],
    rocks: [],
    pebbles: 12,
    rim: ['olive', 'palm'],
  },
  far: '#7aa04a',
  mountains: { color: '#98a8b8', height: 0.8 },
  start: [-4, -36],
  startYaw: 0,
  structures: [
    { type: 'fence', x: -12, z: -8, to: [-12, 12] },
    { type: 'house', x: -24, z: -2, rot: Math.PI / 2, w: 5, d: 4.4, h: 3, accent: '#5a7a4a' },
  ],
  welcome:
    'Welcome to the Valley Field. Surah ‘Abasa says: let a person look at their food. The rain has poured down, and this field is ready to be split open by the plough. Plough it straight, and see what comes up.',
  tasks: [
    {
      id: 'frowned',
      kind: 'read',
      at: [-8, -22],
      marker: 'sign',
      title: 'He frowned',
      goal: 'Read at the sign on the valley path',
      adaptation: 'The Prophet and the blind man who came to him are never shown, voiced or played; the account is read only.',
      reading: { title: 'He frowned', refs: [[80, 1], [80, 2], [80, 3], [80, 4]], note: 'He frowned and turned away because the blind man came to him. But how could you know? Perhaps he would grow purer, or take heed, and the reminder would help him.' },
    },
    {
      id: 'plough',
      kind: 'furrows',
      requires: ['frowned'],
      x0: -6,
      gap: 2,
      n: 5,
      z0: -6,
      z1: 10,
      tol: 1,
      title: 'Splitting the earth',
      goal: 'Plough five straight furrows, walking from the gold-flagged stake to the far stake each time',
      intro: 'Stand at the gold-flagged stake and walk straight to the far stake. Each new furrow starts at the end where the last one finished.',
      adaptation: 'The valley and the field are a game. Ploughing straight furrows after rain is real.',
      outro: 'The field is ploughed and sown, and it comes up green.',
      after: { title: 'Look at your food', refs: [[80, 24], [80, 25], [80, 26], [80, 27], [80, 28], [80, 29], [80, 30], [80, 31], [80, 32]], note: 'Let a person look at their food: how We poured down water in torrents, then split the earth open, and made grain grow in it, and grapes and green herbs, and olives and date palms, and dense gardens, and fruit and pasture, as provision for you and your animals.' },
    },
    {
      id: 'reminder',
      kind: 'read',
      requires: ['plough'],
      at: [-18, 10],
      marker: 'tablet',
      title: 'A reminder',
      goal: 'Read at the tablet by the field’s fence',
      reading: { title: 'A reminder', refs: [[80, 11], [80, 12]], note: 'No! This is a reminder, so whoever wishes may remember it.' },
    },
  ],
  finale: {
    title: 'Look at your food',
    body: ['After the rain you split the earth with straight furrows, and the field came up with grain, grapes, herbs, olives and palms.', 'Surah ‘Abasa asks us to look at our food, and where it comes from.'],
    ref: [80, 24],
    questions: ['What was on your plate today, and where did it grow?', 'Why does the surah mention the rain first?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet and the blind man of 80:1-10 are never shown, voiced or played.', 'The Day (80:33-42) is not shown.'],
};
