// Surah 107, Al-Ma'un (Small Kindnesses): the Lamplit Terrace. A street of
// terraced houses on a busy evening, lamps coming on at the doors. "Have you
// seen the one who denies the Recompense? That is the one who drives away
// the orphan, and does not urge the feeding of the poor ... and withholds
// small kindnesses" (107:1-3, 107:7). The core play: the neighbours each
// need to borrow a small household thing; find it in your house's cupboard
// and chests and take it to the right door. No one at the doors is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W107: WorldDef = {
  surah: 107,
  name: 'The Lamplit Terrace',
  theme: 'Lend the small household things the neighbours need: a pot, a blanket, some salt, a bucket',
  play: 'On a busy evening in a street of terraced houses, the neighbours each need to borrow a small thing. Ask at each door what they need, find it in your house’s cupboard and chests, and take it round. One thing at a time.',
  seed: 10707,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 0.5, seed: 107 }),
    palette: PAL.meadow,
    paths: [curve([[0, 34], [-6, 24], [0, 14], [0, 2]])],
    flats: [{ x: 0, z: 2, r: 12, paint: '#c8c0a8' }, { x: -6, z: 24, r: 3 }, { x: 16, z: 16, r: 3 }],
  },
  look: { ...LOOKS.dusk, sunI: 1.8 },
  veg: {
    grass: 0.6,
    flowers: ['#f0e0b0'],
    trees: [{ kind: 'fig', at: [[-16, 10], [16, 0]] }, { kind: 'cypress', at: [[-14, -14], [14, -16]] }],
    rocks: [],
    pebbles: 10,
    rim: ['cypress', 'olive'],
  },
  far: '#8a9080',
  mountains: { color: '#8a8a98', height: 0.7 },
  start: [0, 34],
  startYaw: Math.PI,
  structures: [
    { type: 'house', x: 0, z: -6, rot: 0, w: 5, d: 4, h: 3, accent: '#3a6a8a' },
    { type: 'house', x: -10, z: 9, rot: Math.PI, w: 4.4, d: 3.8, h: 2.8, accent: '#8a6a3a' },
    { type: 'house', x: -4, z: 9.5, rot: Math.PI, w: 4.4, d: 3.8, h: 3, accent: '#6a8a4a' },
    { type: 'house', x: 4, z: 9.5, rot: Math.PI, w: 4.4, d: 3.8, h: 2.9, accent: '#8a4a5a' },
    { type: 'house', x: 10, z: 9, rot: Math.PI, w: 4.4, d: 3.8, h: 2.8, accent: '#5a5a8a' },
  ],
  welcome:
    'Welcome to the Lamplit Terrace. Surah Al-Ma’un warns against the one who withholds small kindnesses: the little everyday help that neighbours give each other. It is a busy evening, and the neighbours need things.',
  tasks: [
    {
      id: 'denies',
      kind: 'read',
      at: [-6, 24],
      marker: 'sign',
      title: 'The one who denies',
      goal: 'Read at the sign at the end of the street',
      reading: { title: 'The one who denies', refs: [[107, 1], [107, 2], [107, 3]], note: 'Have you seen the one who denies the Recompense? That is the one who drives away the orphan, and does not urge the feeding of the poor.' },
    },
    {
      id: 'neighbours',
      kind: 'lend',
      requires: ['denies'],
      chests: [
        { at: [-2.2, -3.2], holds: ['cooking pot', 'sieve', 'jar of lamp oil'] },
        { at: [0.2, -3.4], holds: ['needle and thread', 'salt', 'spare blanket'] },
        { at: [2.4, -3.2], holds: ['hammer', 'bucket', 'ball of string'] },
      ],
      asks: [
        { at: [-10, 6.4], who: 'the family with the new baby', wants: 'spare blanket' },
        { at: [-4, 6.9], who: 'the house cooking for guests', wants: 'cooking pot' },
        { at: [4, 6.9], who: 'the old widow', wants: 'salt' },
        { at: [10, 6.4], who: 'the boy whose bucket fell down the well', wants: 'bucket' },
      ],
      title: 'Small kindnesses',
      goal: 'Ask each neighbour what they need, find it in your house, and take it to their door',
      intro: 'One thing at a time: ask, find, carry.',
      adaptation: 'The street and the neighbours are a game written for this app; no one at the doors is shown.',
      outro: 'Four lamps glowing warm along the street: every neighbour helped.',
      after: { title: 'Small kindnesses', refs: [[107, 4], [107, 5], [107, 6], [107, 7]], note: 'So woe to those who pray, who are heedless of their prayer, those who make a show, and withhold small kindnesses.' },
    },
    {
      id: 'orphan',
      kind: 'read',
      requires: ['neighbours'],
      at: [16, 16],
      marker: 'tablet',
      title: 'Do not withhold',
      goal: 'Read at the tablet by the fig tree',
      reading: { title: 'Do not withhold', refs: [[107, 7]], note: 'And they withhold small kindnesses.' },
    },
  ],
  finale: {
    title: 'Small kindnesses',
    body: ['A blanket, a pot, some salt and a bucket: small things, but each one was exactly what a neighbour needed.', 'Surah Al-Ma’un warns against withholding even small kindnesses.'],
    ref: [107, 7],
    questions: ['Which neighbour needed help most urgently?', 'What small thing could you lend or give this week?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No one at the doors is shown.', 'The street is a picture only.'],
};
