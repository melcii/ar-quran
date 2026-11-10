// Surah 55, Ar-Rahman (The Most Merciful): the Meeting of the Two Seas. A
// green coast where a river runs out into the sea, with gardens of fruit,
// palms and scented plants on the slopes and a long pier reaching out past
// the river mouth. The core play: at each buoy along the pier, lower the
// testing tube and watch the float (it rides higher in salt water, because
// salt water is heavier), write down fresh or salt, then mark where the two
// waters meet (55:19-20). Readings stand along the way for the surah's
// favours and its refrain, "So which of the favours of your Lord would you
// deny?". No one is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W055: WorldDef = {
  surah: 55,
  name: 'The Meeting of the Two Seas',
  theme: 'Test the water along the pier and find where the river and the sea meet',
  play: 'A river runs out into the sea past a long pier. At each buoy, lower the testing tube and watch how high the float rides: higher in salt water, lower in fresh. Write down what you find, then mark where the two waters meet. Readings of the surah’s favours stand on the way.',
  seed: 5555,
  ground: {
    radius: 60,
    base: rolling({
      radius: 60,
      amp: 1.4,
      seed: 55,
      tilt: [0, 0.05],
      shapes: [{ x: 0, z: -56, r: 56, h: -12 }, { x: 30, z: 30, r: 14, h: 3 }],
      streams: [{ pts: [[-14, 50], [-12, 26], [-8, 8], [-4, -6], [-2, -18]], w: 4, depth: 5.5 }],
    }),
    palette: PAL.coast,
    paths: [curve([[10, 48], [14, 34], [8, 20], [10, 8], [8, -1]])],
    water: -2.6,
    shore: '#ecd8a8',
    flats: [{ x: 15, z: 30, r: 3 }, { x: 4, z: 16, r: 3 }, { x: 13, z: 4, r: 3 }],
  },
  look: LOOKS.sea,
  veg: {
    grass: 1,
    lush: (_x, z) => (z < 0 ? 0.3 : 1),
    flowers: ['#f4d060', '#e88a9a', '#fff2d8', '#c8a0e0'],
    trees: [
      { kind: 'palm', area: { x: 20, z: 20, r: 16 }, count: 8, size: [0.9, 1.3] },
      { kind: 'fig', at: [[24, 34], [30, 26]] },
      { kind: 'olive', area: { x: -30, z: 30, r: 14 }, count: 5 },
      { kind: 'palm', at: [[-4, 12], [-20, 30]] },
    ],
    rocks: [{ x: 34, z: -8, n: 6, big: 1.3, spread: 8 }],
    pebbles: 30,
    rim: ['palm', 'olive', 'oak'],
  },
  far: '#7c9a54',
  mountains: { color: '#8a9ab8', height: 0.7 },
  start: [10, 48],
  startYaw: Math.PI,
  structures: [
    { type: 'dock', x: 8, z: -2, to: [8, -37], w: 3 },
    { type: 'bench', x: 4, z: -1, rot: Math.PI / 2 },
  ],
  welcome:
    'Welcome to the Meeting of the Two Seas. Surah Ar-Rahman names the favours of the Most Merciful one after another, and after each it asks: "So which of the favours of your Lord would you deny?" Out past the river mouth, the river and the sea meet side by side.',
  tasks: [
    {
      id: 'taught',
      kind: 'read',
      at: [13, 42],
      marker: 'sign',
      title: 'The Most Merciful taught the Quran',
      goal: 'Read at the sign above the coast',
      reading: { title: 'The Most Merciful', refs: [[55, 1], [55, 2], [55, 3], [55, 4]], note: 'The Most Merciful taught the Quran. He created the human being and taught him to speak clearly.' },
    },
    {
      id: 'gardens',
      kind: 'read',
      requires: ['taught'],
      at: [15, 30],
      marker: 'tablet',
      title: 'Fruit, palms and scented plants',
      goal: 'Read at the tablet in the palm garden',
      reading: { title: 'The earth laid out', refs: [[55, 10], [55, 11], [55, 12], [55, 13]], note: 'He laid out the earth for all living things. In it are fruit, and palm trees with dates in their sheaths, and grain in its husks, and sweet-smelling plants. So which of the favours of your Lord would you deny?' },
    },
    {
      id: 'balance',
      kind: 'read',
      requires: ['gardens'],
      at: [4, 16],
      marker: 'tablet',
      title: 'Keep the balance',
      goal: 'Read at the tablet by the river',
      reading: { title: 'The balance', refs: [[55, 7], [55, 8], [55, 9]], note: 'He raised the sky and set up the balance, so that you do not cheat in the balance. Weigh fairly, and do not give short measure.' },
    },
    {
      id: 'seas',
      kind: 'estuary',
      requires: ['balance'],
      title: 'Where the two seas meet',
      goal: 'Walk out on the pier, test the water at each buoy, then mark where the river and the sea meet',
      intro: 'The river runs out into the sea right here. At each buoy, lower the testing tube and look at the float inside: in salt water it rides higher, because salt water is heavier than fresh. Write down fresh or salt, then mark where the two waters meet.',
      adaptation: 'The pier, buoys and testing tube are a game idea. That a float rides higher in salt water than in fresh water is real.',
      buoys: [[10.4, -12], [10.4, -17], [10.4, -22], [10.4, -27], [10.4, -32]],
      meet: 2,
      outro: 'Fresh water near the river mouth, salt water further out, and a line where they meet.',
      after: { title: 'The two seas', refs: [[55, 19], [55, 20], [55, 21], [55, 22]], note: 'He let the two seas flow, meeting side by side. Between them is a barrier that neither of them passes. So which of the favours of your Lord would you deny? From both of them come pearls and coral.' },
    },
    {
      id: 'remain',
      kind: 'read',
      requires: ['seas'],
      at: [13, 4],
      marker: 'sign',
      title: 'What remains',
      goal: 'Read at the sign at the foot of the pier',
      reading: { title: 'What remains', refs: [[55, 26], [55, 27]], note: 'Everyone on the earth will pass away, and what will remain is the Face of your Lord, full of majesty and honour.' },
    },
  ],
  finale: {
    title: 'Which of the favours?',
    body: ['You tested the water along the pier and found where the river and the sea meet: fresh near the mouth, salt further out, side by side.', 'Surah Ar-Rahman names favour after favour: the Quran, speech, the balance, gardens, the two seas. After each it asks the same question.'],
    ref: [55, 13],
    questions: ['Why do you think the float rode higher in salt water?', 'Which favour would you add to the list from your own day?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No one is shown.', 'The pearls and coral of 55:22 are read only.'],
};
