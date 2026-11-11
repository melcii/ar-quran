// Surah 96, Al-Alaq (The Clinging Clot): the Reed-Pen School. A village
// school courtyard in the morning, with a writing bench under a fig tree,
// reed beds by the stream and an ink pot. "Recite, and your Lord is the
// most Generous, who taught by the pen, taught man what he did not know"
// (96:3-5). The core play: cut a reed pen properly, then trace practice
// letter shapes dot by dot in stroke order, dipping the pen when it runs
// dry. Practice shapes only: no Quran text is drawn by the game. The
// Prophet, the angel and the first revelation are read only, never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W096: WorldDef = {
  surah: 96,
  name: 'The Reed-Pen School',
  theme: 'Cut a reed pen and learn to write: the Lord who taught by the pen',
  play: 'In a village school courtyard in the morning, learn to write the old way. Cut a reed at a slant and split its tip, then trace practice letter shapes dot by dot in the order the stroke runs. The reed holds only a little ink: dip it again when it runs dry.',
  seed: 9696,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 0.6, seed: 96, streams: [{ pts: [[-30, 20], [-14, 10], [-10, -8], [-20, -26]], w: 2.4, depth: 0.8 }] }),
    palette: PAL.meadow,
    paths: [curve([[2, 34], [4, 22], [0, 10], [0, 4]])],
    flats: [{ x: 0, z: 0, r: 7, paint: '#d8c8a8' }, { x: 4, z: 22, r: 3 }, { x: 10, z: -6, r: 3 }],
  },
  look: { ...LOOKS.morning, sunI: 2.8 },
  veg: {
    grass: 0.9,
    flowers: ['#f8e8a0', '#f0b0b0'],
    trees: [
      { kind: 'fig', at: [[-3, -3], [12, 10]] },
      { kind: 'palm', at: [[-16, 22], [16, -14], [-6, -18]] },
    ],
    rocks: [{ x: -14, z: 4, n: 4, big: 0.8, spread: 4 }],
    pebbles: 16,
    rim: ['palm', 'cypress'],
  },
  far: '#9ab0a0',
  mountains: { color: '#a09888', height: 0.8 },
  start: [2, 34],
  startYaw: Math.PI,
  structures: [
    { type: 'wall', x: -7, z: -7, to: [7, -7], h: 2.2, color: '#d8c8a8' },
    { type: 'wall', x: 7, z: -7, to: [7, 3], h: 2.2, color: '#d8c8a8' },
    { type: 'house', x: 0, z: -10, rot: 0, w: 6, d: 4, h: 3, accent: '#3a6a8a' },
    { type: 'rug', x: -3, z: 2, w: 1.6, d: 2.4, color: '#8a5a3a', accent: '#e8c070' },
    { type: 'bench', x: 4, z: 3, rot: Math.PI / 2 },
  ],
  welcome:
    'Welcome to the Reed-Pen School. The first words of Surah Al-Alaq are a command: Recite! And it says your Lord taught by the pen. This morning you will make a pen and learn to write with it.',
  tasks: [
    {
      id: 'recite',
      kind: 'read',
      at: [4, 22],
      marker: 'sign',
      title: 'Recite!',
      goal: 'Read at the sign on the path to the school',
      adaptation: 'The Prophet, the angel and the first revelation are read only; none is shown.',
      reading: { title: 'Recite!', refs: [[96, 1], [96, 2]], note: 'Recite in the name of your Lord who created: created man from a clinging clot.' },
    },
    {
      id: 'pen',
      kind: 'pen',
      requires: ['recite'],
      at: [0, 0],
      ink: 3,
      letters: [
        { name: 'straight stroke', pts: [[0.5, 0.1], [0.5, 0.37], [0.5, 0.63], [0.5, 0.9]] },
        { name: 'boat curve', pts: [[0.9, 0.35], [0.85, 0.65], [0.62, 0.82], [0.38, 0.82], [0.15, 0.65], [0.1, 0.35]] },
        { name: 'round loop', pts: [[0.5, 0.15], [0.8, 0.32], [0.8, 0.68], [0.5, 0.85], [0.2, 0.68], [0.2, 0.32], [0.48, 0.15]] },
        { name: 'wave', pts: [[0.1, 0.5], [0.3, 0.3], [0.5, 0.5], [0.7, 0.7], [0.9, 0.5]] },
      ],
      title: 'Taught by the pen',
      goal: 'Cut a reed pen, then trace the practice letters in stroke order, dipping when the pen runs dry',
      intro: 'A good pen first: a slanted tip, split up the middle. Then slowly, dot by dot.',
      adaptation: 'The school is a game. Reed pens cut at a slant and split are real. The shapes are practice strokes only, never ayahs.',
      outro: 'A row of clean, dark practice letters drying in the sun.',
      after: { title: 'Taught by the pen', refs: [[96, 3], [96, 4], [96, 5]], note: 'Recite, and your Lord is the Most Generous, who taught by the pen, taught man what he did not know.' },
    },
    {
      id: 'near',
      kind: 'read',
      requires: ['pen'],
      at: [10, -6],
      marker: 'tablet',
      title: 'Draw near',
      goal: 'Read at the tablet by the school wall',
      reading: { title: 'Draw near', refs: [[96, 19]], note: 'No! Do not obey him. But prostrate, and draw near.' },
    },
  ],
  finale: {
    title: 'What he did not know',
    body: ['A cut reed, a pot of ink and slow, careful strokes: this is how writing is learned.', 'Surah Al-Alaq says your Lord taught by the pen, and taught man what he did not know.'],
    ref: [96, 4],
    questions: ['Why did the pen need a slanted tip and a split?', 'What is something you know now that someone taught you?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet, the angel and the first revelation are read only, never shown, voiced or played.', 'No Quran text is drawn, traced or written by the game; the shapes are practice strokes.'],
};
