// Surah 74, Al-Muddaththir (The Cloaked One): the Washing Stone. A windy
// green hillside above a village, with a stream, a flat washing stone and a
// drying line between two posts. The surah's first commands are "Arise and
// warn, and your Lord glorify, and your clothing purify, and uncleanliness
// avoid" (74:2-5). The core play: wash each garment properly, step by step:
// soak, scrub, rinse until the water runs clear (stopping early is not
// clean yet), wring, and hang it to dry. The Prophet, who is addressed, is
// never shown. The moon, night and dawn of 74:32-34 are read at a lookout.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W074: WorldDef = {
  surah: 74,
  name: 'The Washing Stone',
  theme: 'Wash each garment properly, rinsing until the water runs clear',
  play: 'Beside a stream on a windy hillside there is a flat washing stone, a basket of dusty garments and a drying line. Wash each garment properly, one step at a time: soak it, scrub it, rinse it until the water runs clear, wring it out and hang it to dry in the wind.',
  seed: 7474,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 1.1, seed: 74, tilt: [0.05, 0], streams: [{ pts: [[-40, 6], [-20, 4], [0, 6], [20, 2], [40, 4]], w: 3, depth: 1.6 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, -34], [-6, -20], [2, -8], [2, 0]]), curve([[10, 9], [16, 20], [12, 30]])],
    water: -0.6,
    flats: [{ x: 3, z: -1, r: 5 }, { x: -6, z: -20, r: 3 }, { x: 12, z: 30, r: 3 }],
  },
  look: { ...LOOKS.morning, clouds: 1.4 },
  veg: {
    grass: 1.1,
    flowers: ['#fff2d8', '#f4d060'],
    trees: [{ kind: 'oak', area: { x: -14, z: -20, r: 12 }, count: 5 }],
    rocks: [{ x: 20, z: -16, n: 5, big: 1, spread: 5 }],
    pebbles: 26,
    rim: ['oak', 'pine'],
  },
  far: '#7a9a5a',
  mountains: { color: '#98a0b8', height: 0.8 },
  start: [0, -34],
  startYaw: 0,
  structures: [
    { type: 'bridge', x: 10, z: -0.5, to: [10, 9.5], w: 2.6 },
    { type: 'house', x: -16, z: -4, rot: Math.PI / 2, w: 5, d: 4.4, h: 3, accent: '#5a7a4a' },
  ],
  welcome:
    'Welcome to the Washing Stone. Surah Al-Muddaththir begins with commands: arise and warn, glorify your Lord, purify your clothing, and keep away from what is unclean. Down by the stream there is a basket of dusty garments. Can you wash them properly?',
  tasks: [
    {
      id: 'arise',
      kind: 'read',
      at: [-6, -20],
      marker: 'sign',
      title: 'Arise',
      goal: 'Read at the sign under the oaks',
      adaptation: 'The Prophet, who is addressed here, is never shown; the ayahs are read only.',
      reading: { title: 'Arise', refs: [[74, 1], [74, 2], [74, 3]], note: 'O you wrapped in a cloak! Arise and warn, and glorify your Lord.' },
    },
    {
      id: 'wash',
      kind: 'wash',
      requires: ['arise'],
      at: [0, 0],
      items: ['cloak', 'shawl', 'scarf'],
      clear: 4,
      title: 'Your clothing purify',
      goal: 'At the washing stone, wash each garment properly and hang it to dry',
      intro: 'Soak, scrub, rinse until the water runs clear, wring, and hang. Do not stop rinsing while the water is still cloudy.',
      adaptation: 'The hillside and the basket of garments are a game idea. Keeping your clothes clean is a real part of the purity this ayah asks for.',
      outro: 'Every garment is clean and drying in the wind.',
      after: { title: 'Your clothing purify', refs: [[74, 4], [74, 5], [74, 6], [74, 7]], note: 'And purify your clothing, and keep away from what is unclean. Do not give in order to get more, and be patient for your Lord.' },
    },
    {
      id: 'dawn',
      kind: 'read',
      requires: ['wash'],
      at: [12, 30],
      marker: 'tablet',
      title: 'By the moon and the dawn',
      goal: 'Cross the stream and read at the tablet at the lookout',
      reading: { title: 'By the moon and the dawn', refs: [[74, 32], [74, 33], [74, 34]], note: 'No! By the moon, and by the night as it leaves, and by the morning as it brightens.' },
    },
  ],
  finale: {
    title: 'Clean and clear',
    body: ['You rinsed every garment until the water ran clear, and hung them to dry in the wind.', 'Among the first commands of Surah Al-Muddaththir: purify your clothing.'],
    ref: [74, 4],
    questions: ['Why was it important not to stop rinsing too early?', 'What else can we keep clean, inside and out?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet is addressed in this surah and is never shown, voiced or played.', 'The Fire and its keepers (74:26-31) are not shown or read in this world.'],
};
