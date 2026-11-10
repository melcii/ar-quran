// Surah 53, An-Najm (The Star): the Night Hill. A grassy hilltop under a
// clear night sky full of stars, with a mat to lie on. The core play: star
// hopping. Find three bright stars in a short straight row, then follow the
// line they make down and to the left to the brightest star of the night
// sky: Sirius, of which the surah says "it is He who is the Lord of Sirius"
// (53:49). Stars are created things, never powers: the readings say so. The
// ascension passages (53:1-18) are of the unseen and are read only; no
// prophet or angel is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const NIGHT = { ...LOOKS.dusk, zen: '#0e1636', mid: '#24305e', hor: '#4a4a78', sun: [-0.7, -0.2, -0.7] as [number, number, number], sunColor: '#8a90c0', sunI: 0.55, hemiSky: '#4a5890', hemiGround: '#2a2a2a', hemiI: 0.8, fog: '#3a4060', fogDensity: 0.006, stars: 1, moon: undefined, birds: false };

export const W053: WorldDef = {
  surah: 53,
  name: 'The Night Hill',
  theme: 'Hop from star to star to find Sirius, a created light',
  play: 'Lie on the mat on the hilltop and look up. Find three bright stars in a short straight row, then follow the line they make down and to the left until you reach the brightest star in the sky.',
  seed: 5353,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.2, seed: 53, shapes: [{ x: 0, z: -6, r: 14, h: 4 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 38], [2, 22], [4, 8], [1, -4]]), curve([[2, 22], [-12, 18], [-18, 12]])],
    flats: [{ x: 0, z: -6, r: 4 }, { x: -18, z: 12, r: 3 }],
  },
  look: NIGHT,
  veg: {
    grass: 1,
    flowers: ['#d8d0f0'],
    trees: [{ kind: 'cypress', at: [[-10, 28], [12, 26], [-22, 4]] }, { kind: 'olive', area: { x: 18, z: 10, r: 8 }, count: 3 }],
    rocks: [{ x: 20, z: -24, n: 4, big: 1, spread: 6 }],
    pebbles: 12,
    rim: ['cypress', 'olive'],
  },
  far: '#2a3448',
  mountains: { color: '#3a4060', height: 0.8 },
  start: [0, 38],
  startYaw: Math.PI,
  structures: [{ type: 'bench', x: -18, z: 13, rot: 0.6 }],
  welcome:
    'Welcome to the Night Hill. Surah An-Najm begins: "By the star when it goes down." The sky tonight is clear. Climb the hill and look up.',
  tasks: [
    {
      id: 'star',
      kind: 'read',
      at: [4, 28],
      marker: 'lantern',
      title: 'By the star',
      goal: 'Read at the lantern at the foot of the hill',
      adaptation: 'The passages about the revelation and the ascension (53:2-18) are of the unseen and are read only; no prophet or angel is shown.',
      reading: { title: 'Your companion has not gone astray', refs: [[53, 1], [53, 2], [53, 3], [53, 4]], note: 'By the star when it goes down: your companion has not gone astray, nor is he mistaken. He does not speak from his own wishes: it is only revelation sent to him.' },
    },
    {
      id: 'sirius',
      kind: 'starhop',
      requires: ['star'],
      at: [0, -4],
      title: 'Find Sirius',
      goal: 'Lie on the mat on the hilltop, find the short row of three stars, and follow it to Sirius',
      intro: 'People have always found their way among the stars by hopping from one to the next. Look for three bright stars close together in a short, straight row. Their line points the way.',
      adaptation: 'The star chart is drawn for this game, simplified from the real winter sky. Sirius is named in 53:49; the other stars are not mentioned in the surah.',
      outro: 'You found Sirius, the brightest star in the night sky.',
      after: { title: 'The Lord of Sirius', refs: [[53, 43], [53, 44], [53, 48], [53, 49]], note: 'It is He who makes people laugh and weep, He who gives death and gives life, He who makes rich and gives enough. And it is He who is the Lord of Sirius. Sirius is only a created light; it has no power of its own.' },
    },
    {
      id: 'guess',
      kind: 'read',
      requires: ['sirius'],
      at: [-16, 10],
      marker: 'tablet',
      title: 'Only a guess',
      goal: 'Read at the tablet by the bench',
      reading: { title: 'Guessing is not knowing', refs: [[53, 28]], note: 'They have no knowledge of it. They follow only guesses, and a guess is no use at all against the truth.' },
    },
    {
      id: 'effort',
      kind: 'read',
      requires: ['guess'],
      at: [6, 14],
      marker: 'sign',
      title: 'What you strive for',
      goal: 'Read at the sign on the way down',
      reading: { title: 'Your effort will be seen', refs: [[53, 39], [53, 40]], note: 'A person will have only what they strive for, and their effort will be seen.' },
    },
  ],
  finale: {
    title: 'The brightest star',
    body: ['You hopped from star to star along the belt’s line and found Sirius, the brightest star of the night.', 'Surah An-Najm says Allah is the Lord of Sirius: the stars are His creation, and we follow knowledge, not guesses.'],
    ref: [53, 49],
    questions: ['How did the row of three stars help you?', 'Why is a guess not the same as knowing?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No prophet or angel is shown; 53:1-18 is read only.', 'Stars are shown only as created lights; nothing gives them power over people.'],
};
