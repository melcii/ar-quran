// Surah 104, Al-Humazah (The Mocker): the Windy Square. A village square on
// a windy afternoon, ringed by houses, each with a little chalk noticeboard
// by its door. Someone has chalked mocking words about the people who live
// there. "Woe to every slanderer and mocker, who gathers wealth and counts
// it, thinking his wealth will make him last forever" (104:1-3). The core
// play: do not laugh along or walk past; scrub each board clean and write
// something kind about that person, and true, since flattery is not
// kindness. The fire of 104:4-9 is read only, never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W104: WorldDef = {
  surah: 104,
  name: 'The Windy Square',
  theme: 'Scrub the mocking chalk off the noticeboards and write something kind and true',
  play: 'In a village square on a windy afternoon, someone has chalked mocking words on the noticeboards by people’s doors. Do not laugh along, and do not walk past. Scrub each board clean and write something kind about the person who lives there, and make sure it is true.',
  seed: 10404,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 0.6, seed: 104 }),
    palette: PAL.meadow,
    paths: [curve([[0, 34], [6, 22], [0, 10], [0, 4]])],
    flats: [{ x: 0, z: 0, r: 10, paint: '#c8c0b0' }, { x: 6, z: 22, r: 3 }, { x: -14, z: 14, r: 3 }],
  },
  look: { ...LOOKS.golden, sunI: 2.4 },
  veg: {
    grass: 0.8,
    flowers: ['#f0e0f0', '#f8e8a0'],
    trees: [{ kind: 'oak', at: [[-16, 4], [16, -10]] }, { kind: 'cypress', at: [[14, 14], [-12, -14]] }],
    rocks: [{ x: 18, z: 22, n: 3, big: 1, spread: 3 }],
    pebbles: 12,
    rim: ['oak', 'cypress'],
  },
  far: '#9aa890',
  mountains: { color: '#8a90a0', height: 0.7 },
  start: [0, 34],
  startYaw: Math.PI,
  structures: [
    { type: 'house', x: -8, z: -8, rot: Math.PI / 4, w: 4.4, d: 3.8, h: 3, accent: '#c8a050' },
    { type: 'house', x: 8, z: -8, rot: -Math.PI / 4, w: 4.4, d: 3.8, h: 3, accent: '#3a6a8a' },
    { type: 'house', x: -10, z: 4, rot: Math.PI / 2, w: 4.4, d: 3.8, h: 2.8, accent: '#6a8a4a' },
    { type: 'house', x: 10, z: 4, rot: -Math.PI / 2, w: 4.4, d: 3.8, h: 2.8, accent: '#8a4a5a' },
    { type: 'well', x: 0, z: -1 },
  ],
  welcome:
    'Welcome to the Windy Square. Surah Al-Humazah begins: woe to every slanderer and mocker. Look at the noticeboards by the doors. Someone has been busy with the chalk.',
  tasks: [
    {
      id: 'woe',
      kind: 'read',
      at: [6, 22],
      marker: 'sign',
      title: 'Woe to every mocker',
      goal: 'Read at the sign on the lane into the square',
      reading: { title: 'Woe to every mocker', refs: [[104, 1]], note: 'Woe to every slanderer and mocker.' },
    },
    {
      id: 'boards',
      kind: 'chalk',
      requires: ['woe'],
      boards: [
        { at: [-5.6, -5.6], who: 'the baker', mock: 'The baker is fat and slow!', good: 'Thank you for the warm bread every morning', flatter: 'The baker is the fastest runner in the world' },
        { at: [5.6, -5.6], who: 'the old shepherd', mock: 'The old shepherd smells like his sheep!', good: 'The old shepherd knows every sheep by its face', flatter: 'The old shepherd is the richest man in the valley' },
        { at: [-6.8, 5.6], who: 'the new girl', mock: 'The new girl talks funny. Go back to your valley!', good: 'Welcome to our village. Your songs from home are lovely', flatter: 'The new girl is a princess from a faraway land' },
        { at: [6.8, 5.6], who: 'the potter', mock: 'The potter’s pots are wonky!', good: 'The potter mends everyone’s cracked jars for free', flatter: 'The potter’s pots never break, not even if you drop them' },
      ],
      title: 'Kind and true',
      goal: 'Scrub the mocking chalk off each board, and write something kind and true in its place',
      intro: 'Do not laugh along. Do not walk past. Scrub it, then write.',
      adaptation: 'The square and the boards are a game written for this app.',
      outro: 'Every board in the square says something kind, and true.',
      after: { title: 'Counting his wealth', refs: [[104, 2], [104, 3]], note: 'Who gathers wealth and counts it, thinking that his wealth will make him last forever.' },
    },
    {
      id: 'crusher',
      kind: 'read',
      requires: ['boards'],
      at: [-14, 14],
      marker: 'tablet',
      title: 'No!',
      goal: 'Read at the tablet by the oak',
      adaptation: 'The fire is read only, never shown.',
      reading: { title: 'No!', refs: [[104, 4], [104, 5]], note: 'No! He will surely be thrown into the Crusher. And what can make you know what the Crusher is?' },
    },
  ],
  finale: {
    title: 'Kind and true',
    body: ['The mocking chalk is gone, and every board says something kind about the person who lives there, and true.', 'Surah Al-Humazah warns: woe to every slanderer and mocker.'],
    ref: [104, 1],
    questions: ['Why was walking past the board not good enough?', 'Why does a kind word also have to be true?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The fire of 104:4-9 is read only, never shown.', 'The boards are a picture only.'],
};
