// Surah 75, Al-Qiyamah (The Resurrection): the Potter's Yard. A sunny
// yard behind a potter's workshop, where clay tablets lie drying on low
// stands. "Does man think that We will not assemble his bones? Yes, We are
// able to put together even his fingertips" (75:3-4). Every person's
// fingertips carry their own ridges, and "a person will be a witness
// against himself, even if he presents his excuses" (75:14-15). The core
// play: compare the print in each tablet with the ink card of your own five
// fingertips, and say which finger made it, or that it is someone else's.
// The Day itself is never pictured; it is read only.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W075: WorldDef = {
  surah: 75,
  name: 'The Potter’s Yard',
  theme: 'Match the fingerprints pressed in clay to your own fingertips',
  play: 'Behind a potter’s workshop, clay tablets dry in the sun, each pressed by someone’s fingertip. On the bench is an ink card with your own five prints. Look at the ridges in each tablet: a loop, a whorl or an arch, each with its own small mark. Say which of your fingers made it, or that it is not yours.',
  seed: 7575,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 0.8, seed: 75 }),
    palette: PAL.dry,
    paths: [curve([[0, -34], [-6, -22], [2, -12], [0, -6]])],
    flats: [{ x: 0, z: 2, r: 10, paint: '#d8c098' }, { x: -6, z: -22, r: 3 }, { x: 14, z: 10, r: 3 }],
  },
  look: LOOKS.golden,
  veg: {
    grass: 0.6,
    flowers: ['#f4d060', '#e8a060'],
    trees: [{ kind: 'fig', at: [[-12, -8], [12, -10]] }, { kind: 'olive', area: { x: 0, z: -24, r: 12 }, count: 4 }],
    rocks: [{ x: 22, z: -16, n: 4, big: 1, spread: 5 }],
    pebbles: 18,
    rim: ['olive', 'cypress'],
  },
  far: '#b8a070',
  mountains: { color: '#a8a0a0', height: 0.7 },
  start: [0, -34],
  startYaw: 0,
  structures: [
    { type: 'house', x: 0, z: 12, rot: Math.PI, w: 7, d: 5, h: 3.4, accent: '#a0583a' },
    { type: 'stall', x: -9, z: 6, rot: Math.PI / 2 },
    { type: 'stones', x: 9, z: 7, n: 5 },
  ],
  welcome:
    'Welcome to the Potter’s Yard. Surah Al-Qiyamah asks: does a person think Allah cannot bring their bones together again? He is able to put together even their fingertips. Every person’s fingertips have their own ridges. Can you find your own prints in the clay?',
  tasks: [
    {
      id: 'bones',
      kind: 'read',
      at: [-6, -22],
      marker: 'sign',
      title: 'Even the fingertips',
      goal: 'Read at the sign by the olive trees',
      adaptation: 'The Day of Resurrection is never pictured; it is read only.',
      reading: { title: 'Even the fingertips', refs: [[75, 1], [75, 2], [75, 3], [75, 4]], note: 'I swear by the Day of Resurrection, and I swear by the soul that blames itself. Does a person think that We will not bring his bones together? Yes, We are able to put together even his fingertips.' },
    },
    {
      id: 'prints',
      kind: 'prints',
      requires: ['bones'],
      at: [0, 6],
      title: 'Whose fingertip?',
      goal: 'Look at the print in each clay tablet and say which of your fingers made it, or that it is not yours',
      intro: 'Your own five prints are on the ink card. Each tablet has one print. Look at the ridges and the small mark in them.',
      adaptation: 'The yard and the tablets are a game. Fingerprints are real: no two people’s are the same.',
      mine: [
        { finger: 'thumb', type: 'whorl', mark: 0 },
        { finger: 'pointing finger', type: 'loop', mark: 1 },
        { finger: 'middle finger', type: 'loop', mark: 3 },
        { finger: 'ring finger', type: 'arch', mark: 2 },
        { finger: 'little finger', type: 'loop', mark: 0 },
      ],
      tablets: [
        { at: [-6, 2], type: 'loop', mark: 1, of: 1 },
        { at: [-3, -1], type: 'whorl', mark: 2, of: -1 },
        { at: [0, -2], type: 'arch', mark: 2, of: 3 },
        { at: [3, -1], type: 'loop', mark: 3, of: 2 },
        { at: [6, 2], type: 'loop', mark: 2, of: -1 },
        { at: [5, -4.5], type: 'whorl', mark: 0, of: 0 },
      ],
      outro: 'You knew your own prints from everyone else’s. Each one is only yours.',
      after: { title: 'A witness against himself', refs: [[75, 13], [75, 14], [75, 15]], note: 'On that Day a person will be told what he sent ahead and what he left behind. In fact, a person will be a witness against himself, even if he offers his excuses.' },
    },
    {
      id: 'hurry',
      kind: 'read',
      requires: ['prints'],
      at: [14, 10],
      marker: 'tablet',
      title: 'Do not hurry',
      goal: 'Read at the tablet by the workshop',
      adaptation: 'The Prophet, who is addressed here, is never shown; the ayahs are read only.',
      reading: { title: 'Do not hurry', refs: [[75, 16], [75, 17], [75, 18], [75, 19]], note: 'Do not move your tongue with it to hurry it. It is for Us to gather it and to recite it. So when We have recited it, follow its recitation. Then it is for Us to make it clear.' },
    },
  ],
  finale: {
    title: 'Only yours',
    body: ['Loops, whorls and arches, each with its own small mark: you found your own prints among everyone else’s.', 'Surah Al-Qiyamah says Allah is able to put together even our fingertips.'],
    ref: [75, 4],
    questions: ['What made it possible to tell your prints from others’?', 'Why do you think fingertips are mentioned?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Day of Resurrection is read only, never shown.', 'The Prophet is addressed in 75:16-19 and is never shown, voiced or played.'],
};
