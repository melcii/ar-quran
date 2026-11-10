// Surah 40, Ghafir: the City of the Believing Man. A brick city by the river
// in Pharaoh's land. A believing man of Pharaoh's own family, who had kept
// his faith hidden, spoke up when they wanted to kill Musa (40:28-44). His
// words point to things anyone could see: the ruins of earlier peoples
// (40:31), what was left from Yusuf's time (40:34), the tower Pharaoh
// ordered to "reach the ways into the heavens" (40:36-37), and goods that
// do not last (40:39). The core play: find each clue in the city, then pin
// each one to its ayah on the board. No one is shown: not Musa, not the
// believing man, not Pharaoh or Haman.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W040: WorldDef = {
  surah: 40,
  name: 'The City of the Believing Man',
  theme: "Follow the believing man's reasons: find what his words point to, and pin each clue to its ayah",
  play: 'A brick city with an unfinished tower. Find four clues the believing man pointed to (ruins, an old granary, the tower, a market stall), read each, then pin each clue to its ayah on the board in the square.',
  seed: 4040,
  ground: {
    radius: 50,
    base: rolling({ radius: 50, amp: 1.2, seed: 40, shapes: [{ x: -26, z: 4, r: 9, h: 1.2 }] }),
    palette: PAL.dry,
    paths: [curve([[0, 44], [0, 26], [0, 8], [0, -18]]), curve([[0, 8], [-14, 6], [-24, 6]]), curve([[0, 8], [14, 8], [22, 8]]), curve([[0, 26], [12, 24], [18, 24]])],
    flats: [
      { x: 0, z: 8, r: 7, paint: '#e0cca0' },
      { x: 0, z: -26, r: 8 },
      { x: 22, z: 6, r: 6 },
      { x: -10, z: 30, r: 5 },
      { x: 18, z: 26, r: 4 },
    ],
  },
  look: { ...LOOKS.desert, sunI: 3.1 },
  veg: {
    grass: 0.3,
    flowers: ['#e8c060'],
    trees: [{ kind: 'palm', at: [[-16, 34], [10, 36], [-30, 20], [30, 18], [-6, 14]] }],
    rocks: [{ x: -26, z: 0, n: 6, big: 1.1, spread: 6 }],
    pebbles: 24,
    rim: ['palm'],
  },
  far: '#c8a878',
  mountains: { color: '#c0a888', height: 0.7 },
  start: [0, 42],
  startYaw: Math.PI,
  structures: [
    // The simple house of the believing man (40:28): no one is shown.
    { type: 'house', x: -10, z: 31, w: 4, d: 4, h: 3, color: '#e0cca0', rot: 0.3 },
    // Ruins of earlier peoples (40:31).
    { type: 'columns', x: -27, z: 2, w: 7, n: 3, rot: Math.PI / 2, color: '#c8a880' },
    { type: 'stones', x: -24, z: -2, n: 6 },
    // An old granary from Yusuf's time (40:34).
    { type: 'dome', x: 24, z: 4, w: 5, d: 5, h: 4, color: '#d8b878' },
    { type: 'stall', x: 20, z: 1, rot: 0.4 },
    // The tower that could never reach the heavens (40:36-37): bricks stacked, left unfinished.
    { type: 'tower', x: 0, z: -28, h: 13, color: '#b8784a' },
    { type: 'stones', x: 4, z: -24, n: 5 },
    { type: 'cart', x: -5, z: -23, rot: 0.6 },
    // The market of fine goods (40:39).
    { type: 'stall', x: 19, z: 27, rot: -0.5, color: '#c86a5a' },
    { type: 'festoon', x: 16, z: 30, to: [23, 25] },
    { type: 'bench', x: -4, z: 4, rot: Math.PI / 2 },
  ],
  welcome:
    'Welcome to the City of the Believing Man. Surah Ghafir, The Forgiver, tells of a man from Pharaoh’s own family who had kept his faith hidden. When they wanted to kill Musa, he spoke up, and his words pointed to things anyone could see. Follow his reasons through the city.',
  tasks: [
    {
      id: 'speak',
      kind: 'read',
      at: [-7, 27],
      marker: 'tablet',
      title: 'A man who spoke up',
      goal: 'Read at the tablet by the simple house',
      adaptation: 'The house is a setting for the reading. The believing man and Musa are not shown.',
      reading: {
        title: 'My Lord is Allah',
        refs: [[40, 28]],
        note: 'A believing man from Pharaoh’s family, who had hidden his faith, said: "Will you kill a man just because he says, My Lord is Allah, when he has brought you clear proofs from your Lord?"',
      },
    },
    {
      id: 'reasons',
      kind: 'clues',
      requires: ['speak'],
      title: 'Follow his reasons',
      goal: 'Find the four clues in the city, then pin each one to its ayah on the board in the square',
      intro: 'The believing man pointed to things the people could see for themselves. Four tablets stand by the clues: at the old ruins, the granary, the tower and the market. Read each one, then go to the board in the square.',
      adaptation: 'The tablets, clues and board are a game idea that follows the order of his words in 40:28-44. The buildings stand for what the ayahs mention; their look is not described in the Quran.',
      board: [3, 9],
      clues: [
        {
          at: [-22, 8],
          name: 'old ruins',
          reading: { title: 'Peoples before', refs: [[40, 30], [40, 31]], note: 'He said: "My people, I fear for you a day like the day of the groups before you: like the way of the people of Nuh, of ‘Ad and Thamud and those after them. And Allah wants no injustice for His servants."' },
        },
        {
          at: [19, 9],
          name: 'old granary',
          reading: { title: 'Yusuf came before', refs: [[40, 34]], note: '"Yusuf came to you before with clear proofs, but you kept doubting what he brought you."' },
        },
        {
          at: [5, -21],
          name: 'unfinished tower',
          reading: { title: 'The tower', refs: [[40, 36], [40, 37]], note: 'Pharaoh said: "Haman, build me a tower so that I may reach the ways, the ways into the heavens." His evil deed was made to look good to him, and Pharaoh’s plan ended only in ruin.' },
        },
        {
          at: [14, 23],
          name: 'market stall',
          reading: { title: 'What lasts', refs: [[40, 38], [40, 39]], note: '"My people, follow me and I will guide you to the right way. This worldly life is only a short enjoyment, and the Hereafter is the home that lasts."' },
        },
      ],
      questions: [
        { q: 'I fear for you like the way of the people of Noah and of ‘Aad and Thamud and those after them', ref: [40, 31], answer: 0, wrong: 'That clue belongs to other words. These words are about peoples who came long before.' },
        { q: 'Joseph had already come to you before with clear proofs, but you remained in doubt', ref: [40, 34], answer: 1, wrong: 'Not that one. These words are about Yusuf, who once kept the grain stores of Egypt.' },
        { q: 'Construct for me a tower that I might reach the ways into the heavens', ref: [40, 36], answer: 2, wrong: 'Not that one. These are Pharaoh’s own words about something he wanted built very high.' },
        { q: 'This worldly life is only temporary enjoyment, and the Hereafter is the home of settlement', ref: [40, 39], answer: 3, wrong: 'Not that one. These words are about the fine things people buy and enjoy for a while.' },
      ],
      outro: 'Every clue is pinned. His reasons were things anyone could see for themselves.',
      after: { title: 'I entrust my affair to Allah', refs: [[40, 44], [40, 45]], note: '"You will remember what I am telling you. I leave my affair to Allah; Allah sees His servants." So Allah protected him from the evil they plotted.' },
    },
    {
      id: 'call',
      kind: 'read',
      requires: ['reasons'],
      at: [-5, -4],
      marker: 'lantern',
      title: 'Call upon Me',
      goal: 'Read at the lantern near the square',
      reading: { title: 'The Forgiver', refs: [[40, 3], [40, 60]], note: 'Allah forgives sins and accepts repentance. And your Lord says: "Call upon Me, and I will answer you."' },
    },
  ],
  finale: {
    title: 'Clues anyone could see',
    body: ['You followed the believing man’s reasons through the city: the ruins, the granary, the tower and the market.', 'He spoke up for the truth when it was hard, and left his affair to Allah.'],
    ref: [40, 28],
    questions: ['Why do you think he chose things people could see for themselves?', 'When is it brave to say what is true?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Musa, the believing man, Pharaoh and Haman are never shown.', 'What happened to Pharaoh’s people (40:45-46) is read only.'],
};
