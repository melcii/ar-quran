// Surah 51, Adh-Dhariyat (The Scattering Winds): the Valley of the Turning
// Wind. A wide grassy valley where the wind turns slowly all the way round.
// The core play: at each launch post, let the feathery seed puffs go when the
// pennant points at the bare bed across the valley, so the scattering wind
// (51:1) carries them there. Ibrahim's honoured guests (51:24-27) are a
// reading at the tent; the hospitality is played in Surah Hud's world. No
// one is shown; nothing of the angels (51:4, 51:28-34) is pictured.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W051: WorldDef = {
  surah: 51,
  name: 'The Valley of the Turning Wind',
  theme: 'Let the scattering wind carry the seeds: release them when it blows toward the bare bed',
  play: 'The wind in this valley turns slowly all the way round. At each launch post, watch the pennant: it streams the way the wind is going. Let the seed puffs go when it points at the bare bed across the valley, and the wind will carry them there.',
  seed: 5151,
  ground: {
    radius: 50,
    base: rolling({ radius: 50, amp: 1.4, seed: 51, shapes: [{ x: -34, z: -30, r: 12, h: 6 }, { x: 34, z: 28, r: 12, h: 5 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 44], [0, 28], [-6, 14], [0, 0], [8, -14], [4, -28]]), curve([[0, 0], [-16, 2], [-26, 8]]), curve([[0, 0], [18, -2], [26, -8]])],
    flats: [{ x: -26, z: 10, r: 4 }, { x: 26, z: -10, r: 4 }, { x: 4, z: -30, r: 4 }, { x: -12, z: 32, r: 4, paint: '#e8dcc4' }],
  },
  look: { ...LOOKS.blossom, sunI: 3, birds: true },
  veg: {
    grass: 1.2,
    flowers: ['#fff2d8', '#f0e0a0', '#c0d8f0'],
    trees: [{ kind: 'oak', at: [[-20, 26], [18, 22], [-30, -6], [30, 4]] }, { kind: 'blossom', at: [[10, 34], [-4, -40]] }],
    rocks: [{ x: -34, z: -30, n: 5, big: 1.2, spread: 8 }],
    pebbles: 14,
    rim: ['oak', 'blossom'],
  },
  far: '#90b078',
  mountains: { color: '#9aa0b8', height: 0.8 },
  start: [0, 44],
  startYaw: Math.PI,
  structures: [{ type: 'tent', x: -14, z: 34, rot: 0.4, color: '#c8b088' }, { type: 'rug', x: -10, z: 30, w: 3, d: 2 }],
  welcome:
    'Welcome to the Valley of the Turning Wind. Surah Adh-Dhariyat begins: "By the winds that scatter." In this valley the wind turns slowly all the way round. Let it carry some seeds for you.',
  tasks: [
    {
      id: 'winds',
      kind: 'read',
      at: [4, 36],
      marker: 'sign',
      title: 'By the scattering winds',
      goal: 'Read at the sign at the head of the valley',
      adaptation: 'The angels of 51:4 are of the unseen and are never pictured.',
      reading: { title: 'By the winds', refs: [[51, 1], [51, 2], [51, 3], [51, 4]], note: 'By the winds that scatter, and the clouds that carry their load of water, and the ships that sail with ease, and those who share out each matter by command.' },
    },
    {
      id: 'sow',
      kind: 'release',
      requires: ['winds'],
      turn: 0.22,
      title: 'Seeds on the wind',
      goal: 'At each launch post, let the seed puffs go when the pennant points at the bare bed across the valley',
      intro: 'Three launch posts stand in the valley, each with a bundle of seed puffs, and each has a bare bed across from it. The pennant on the post streams the way the wind is going. Wait for the right moment.',
      adaptation: 'The launch posts and the slowly turning wind are a game idea. Plants really do scatter their seeds on the wind.',
      posts: [
        { at: [-24, 8], bed: [-8, -14], label: 'the bed by the oak' },
        { at: [24, -8], bed: [6, 14], label: 'the bed in the meadow' },
        { at: [6, -28], bed: [-18, -30], label: 'the bed below the hill' },
      ],
      outro: 'All three beds are sown, and the wind did the carrying.',
      after: { title: 'Signs on the earth', refs: [[51, 20], [51, 21]], note: 'On the earth are signs for those who are certain, and in yourselves too. Do you not see?' },
    },
    {
      id: 'guests',
      kind: 'read',
      requires: ['sow'],
      at: [-8, 28],
      marker: 'lantern',
      title: 'The honoured guests',
      goal: 'Read at the lantern by the tent',
      adaptation: 'Ibrahim and his guests are not shown; these ayahs are read only. His welcome of the guests is played in Surah Hud’s world.',
      reading: { title: 'Will you not eat?', refs: [[51, 24], [51, 25], [51, 26], [51, 27]], note: 'Has the story reached you of Ibrahim’s honoured guests? They came in and said, "Peace." He said, "Peace, people I do not know." Then he went quietly to his family, brought a fat roasted calf, set it near them, and said: "Will you not eat?"' },
    },
    {
      id: 'pairs',
      kind: 'read',
      requires: ['guests'],
      at: [3, -4],
      marker: 'tablet',
      title: 'Pairs of everything',
      goal: 'Read at the tablet at the crossroads',
      reading: { title: 'In pairs', refs: [[51, 47], [51, 48], [51, 49]], note: 'We built the sky with strength, and We are expanding it. We spread out the earth, and how well We prepared it. And We created everything in pairs, so that you may remember.' },
    },
  ],
  finale: {
    title: 'Carried by the wind',
    body: ['You watched the turning wind and let the seeds go at the right moment, and the wind carried them to the beds.', 'Surah Adh-Dhariyat begins with the winds that scatter and says there are signs on the earth and in ourselves.'],
    ref: [51, 1],
    questions: ['How did you know when to let the seeds go?', 'What else does the wind carry?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Ibrahim and his guests are never shown; the angels are of the unseen and are not pictured.', 'What happened to the people of Lut, Pharaoh, ‘Ad, Thamud and Nuh (51:31-46) is read only.'],
};
