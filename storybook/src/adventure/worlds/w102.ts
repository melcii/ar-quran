// Surah 102, At-Takathur (Competition in Increase): the Market Morning. A
// busy town market on a bright morning, with stalls heaped high and
// stallholders calling out to buy more, more than the neighbours.
// "Competition in piling up distracts you, until you visit the graves"
// (102:1-2). The core play: buy just what the household's list says at each
// stall, no fewer and no more, whatever the stallholders call out; then
// "you will surely be asked that Day about the blessings" (102:8). The
// graves and the Day are read only, never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W102: WorldDef = {
  surah: 102,
  name: 'The Market Morning',
  theme: 'Buy just what the household needs, while every stall calls you to pile up more',
  play: 'It is market morning in a busy town, and you have the household’s list. Every stall is heaped high, and every stallholder calls out to buy more: more than your neighbour, more than anyone. Buy just what the list says at each stall. Too few leaves someone without; more is only piling up.',
  seed: 10202,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 0.4, seed: 102 }),
    palette: PAL.dry,
    paths: [curve([[0, 34], [-4, 22], [0, 10], [0, 2]])],
    flats: [{ x: 0, z: -2, r: 11, paint: '#d8c8a8' }, { x: -4, z: 22, r: 3 }, { x: 14, z: 12, r: 3 }],
  },
  look: { ...LOOKS.morning, sunI: 2.8 },
  veg: {
    grass: 0.4,
    flowers: ['#f8e0a0'],
    trees: [{ kind: 'palm', at: [[-14, 14], [14, -14], [-14, -12], [16, 4]] }],
    rocks: [],
    pebbles: 10,
    rim: ['palm', 'cypress'],
  },
  far: '#b0a890',
  mountains: { color: '#a09888', height: 0.6 },
  start: [0, 34],
  startYaw: Math.PI,
  structures: [
    { type: 'stall', x: -9, z: -6, rot: 0 },
    { type: 'stall', x: -3, z: -7, rot: 0 },
    { type: 'stall', x: 3, z: -7, rot: 0 },
    { type: 'stall', x: 9, z: -6, rot: 0 },
    { type: 'festoon', x: -10, z: -3, to: [10, -3], h: 3.4 },
    { type: 'house', x: -12, z: 8, rot: Math.PI / 2, w: 4.4, d: 4, h: 3, accent: '#3a6a8a' },
  ],
  welcome:
    'Welcome to the Market Morning. Surah At-Takathur warns that competing to pile up more distracts people, right up until they reach the graves. Here is the household’s list. Listen to the stallholders, then buy just what you need.',
  tasks: [
    {
      id: 'piling',
      kind: 'read',
      at: [-4, 22],
      marker: 'sign',
      title: 'Piling up',
      goal: 'Read at the sign at the market gate',
      adaptation: 'The graves are read only; none is shown.',
      reading: { title: 'Piling up', refs: [[102, 1], [102, 2], [102, 3], [102, 4]], note: 'Competition in piling up distracts you, until you visit the graves. No! You will come to know. Then no! You will come to know.' },
    },
    {
      id: 'list',
      kind: 'errand',
      requires: ['piling'],
      stalls: [
        { at: [-9, -4.2], what: 'loaves', need: 4, push: 'Take ten! The house next door took ten this morning!' },
        { at: [-3, -5.2], what: 'eggs', need: 6, push: 'Why six? Take a dozen, take two dozen! Everybody is!' },
        { at: [3, -5.2], what: 'jars of oil', need: 1, push: 'Three jars! Show the neighbours you have plenty!' },
        { at: [9, -4.2], what: 'bunches of dates', need: 2, push: 'Five bunches, and you will have more than anyone in your street!' },
      ],
      title: 'Just enough',
      goal: 'At each stall, buy exactly what the household’s list says: no fewer, and no more',
      intro: 'The list says what the household needs. The stallholders will say otherwise.',
      adaptation: 'The market and its stallholders are a game written for this app.',
      outro: 'Everything on the list, and not one thing more.',
      after: { title: 'Asked about the blessings', refs: [[102, 8]], note: 'Then you will surely be asked, that Day, about the blessings you enjoyed.' },
    },
    {
      id: 'certainty',
      kind: 'read',
      requires: ['list'],
      at: [14, 12],
      marker: 'tablet',
      title: 'Knowledge of certainty',
      goal: 'Read at the tablet on the way home',
      reading: { title: 'Knowledge of certainty', refs: [[102, 5]], note: 'No! If only you knew with the knowledge of certainty.' },
    },
  ],
  finale: {
    title: 'Enough',
    body: ['Every stall called you to buy more than you needed, and you bought just what the household needed.', 'Surah At-Takathur warns that piling up distracts us, and that we will be asked about every blessing.'],
    ref: [102, 1],
    questions: ['Which stallholder was hardest to say no to?', 'What blessings would you want to say thank you for?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The graves and the Day are read only, never shown.', 'The market is a picture only.'],
};
