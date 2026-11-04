// Surah 38, Sad: the Valley of Signs. A dry valley where a few places could
// hide water. The core play: read the signs the board names (reeds, damp
// dark soil, birds coming to drink, ferns, no salt crust) and dig only where
// every sign is there; a dry hole names the missing sign. Three rounds, in
// three parts of the valley. The spring given to Ayyub (38:41-44) is read.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W038: WorldDef = {
  surah: 38,
  name: 'The Valley of Signs',
  theme: 'Read the signs of the land and dig only where water is close',
  play: 'A board names the signs that go together where water is close: reeds, damp dark soil, small birds coming to drink, ferns, and no salt crust. Look closely at each place and dig only where every sign is there. Three rounds across the valley.',
  seed: 3838,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.4, seed: 38, shapes: [{ x: -26, z: -24, r: 12, h: 6 }, { x: 24, z: -26, r: 12, h: 6 }] }),
    palette: PAL.desert,
    paths: [curve([[0, 30], [0, 18], [-12, 10], [0, 0], [12, -8], [0, -18]])],
    flats: [{ x: -12, z: 12, r: 8 }, { x: 10, z: -2, r: 8 }, { x: -6, z: -18, r: 8 }],
  },
  look: { ...LOOKS.desert, sunI: 3.4 },
  veg: {
    grass: 0.3,
    flowers: ['#f4e0b0'],
    trees: [{ kind: 'palm', at: [[18, 18], [-24, 4]] }],
    rocks: [{ x: 20, z: 10, n: 6, big: 1.2, spread: 8 }, { x: -24, z: -6, n: 6, big: 1.2, spread: 8 }],
    pebbles: 30,
    rim: ['palm'],
  },
  far: '#c8a878',
  mountains: { color: '#c0a08a', height: 1 },
  start: [0, 26],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Valley of Signs. Surah Sad calls this a blessed Book for people to think about its verses. Think carefully here too: the land shows signs of where water is close.',
  tasks: [
    {
      id: 'reflect',
      kind: 'read',
      at: [3, 22],
      marker: 'sign',
      title: 'Think about it',
      goal: 'Read at the sign on the path',
      reading: { title: 'A blessed Book', refs: [[38, 29]], note: 'A blessed Book sent down so that people may think about its verses, and those with understanding may remember.' },
    },
    {
      id: 'water',
      kind: 'spring',
      requires: ['reflect'],
      title: 'Where is the water?',
      goal: 'Dig where every sign of water is there, in three parts of the valley',
      intro: 'The status line says which signs go together where water is close. Look closely at each place before you dig.',
      adaptation: 'Finding water by its signs is a game idea about looking carefully. The spring in 38:42 came when Allah told Ayyub to strike the ground; it was a gift, read here, and Ayyub is not shown.',
      board: [3, 16],
      rounds: [
        {
          need: ['reeds', 'damp'],
          spots: [
            { at: [-16, 14], signs: ['reeds'] },
            { at: [-10, 16], signs: ['reeds', 'damp'] },
            { at: [-8, 9], signs: ['damp', 'birds'] },
            { at: [-15, 8], signs: ['birds'] },
          ],
          reading: { title: 'Patience', refs: [[38, 41], [38, 42]], note: 'Remember Ayyub, when he called to his Lord: "Satan has touched me with hardship and pain." He was told: "Strike the ground with your foot: here is cool water to wash in and to drink."' },
        },
        {
          need: ['reeds', 'damp', 'birds'],
          spots: [
            { at: [6, 2], signs: ['reeds', 'damp'] },
            { at: [13, 1], signs: ['reeds', 'birds'] },
            { at: [14, -5], signs: ['reeds', 'damp', 'birds'] },
            { at: [7, -6], signs: ['damp', 'birds', 'ferns'] },
          ],
          reading: { title: 'Mercy and a reminder', refs: [[38, 43], [38, 44]], note: 'Allah gave him back his family and as many again with them, as a mercy and a reminder for people of understanding. Allah found him patient: an excellent servant who always turned back to Him.' },
        },
        {
          need: ['ferns', 'damp', 'salt'],
          spots: [
            { at: [-10, -15], signs: ['ferns', 'damp', 'salt'] },
            { at: [-3, -14], signs: ['ferns', 'damp'] },
            { at: [-2, -21], signs: ['ferns', 'salt'] },
            { at: [-9, -22], signs: ['damp', 'reeds', 'salt'] },
          ],
          reading: { title: 'Judge with truth', refs: [[38, 26]], note: 'Dawud was told: "We have made you a successor in the land, so judge between people with truth, and do not follow your own wishes, for they would lead you away from the way of Allah."' },
        },
      ],
      reading: { title: 'Not without purpose', refs: [[38, 27]], note: 'Allah did not create the sky and the earth and what is between them without purpose.' },
      outro: 'Three springs found by reading the signs of the land.',
    },
  ],
  finale: {
    title: 'Reading the signs',
    body: ['You looked closely and dug only where every sign of water was there.', 'Surah Sad asks people to think about the verses and to judge with truth, not with their own wishes.'],
    ref: [38, 29],
    questions: ['Which sign was easiest to miss?', 'Why is it wise to look carefully before deciding?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Dawud, Sulayman and Ayyub are never shown; their verses are read.', 'Iblis and the angels (38:71-85) are not shown and are left to the whole-surah reading.'],
};
