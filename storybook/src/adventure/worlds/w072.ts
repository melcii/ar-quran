// Surah 72, Al-Jinn: the Listening Valley. A wide desert valley at
// evening, full of noises that carry: wind singing through a rock arch, a
// stream over stones, goat bells on the slope, a creaking well wheel and a
// rattling palm in the middle. The surah opens: "a group of the jinn
// listened and said, 'Indeed, we have heard an amazing Quran'" (72:1). The
// core play: follow the hush meter to a quiet place, keep still and listen.
// As the evening goes on the noises change, so each time you must find a
// new quiet place. The jinn are never shown, pictured or imagined; only the
// ayahs are read. The valley is a game.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W072: WorldDef = {
  surah: 72,
  name: 'The Listening Valley',
  theme: 'Find a quiet place to sit still and listen, as the evening’s noises change',
  play: 'A desert valley at evening is full of noises: wind in a rock arch, a stream, goat bells, a creaking well wheel. Watch the hush meter: it shows how loud it is where you stand. Follow it to a quiet place and keep still to listen. As the evening goes on the noises move, and you must find a new quiet place.',
  seed: 7272,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.2, seed: 72, shapes: [{ x: 0, z: 0, r: 30, h: -1.2 }] }),
    palette: PAL.desert,
    paths: [curve([[0, -26], [-4, -16], [2, -8], [0, -2]])],
    flats: [{ x: 0, z: 0, r: 4 }, { x: -6, z: -18, r: 3 }, { x: 8, z: 6, r: 3 }],
  },
  look: LOOKS.desert,
  veg: {
    grass: 0.4,
    flowers: ['#e8c070'],
    trees: [{ kind: 'palm', at: [[1.5, 1.5], [-12, 20], [12, -20]] }],
    rocks: [{ x: -30, z: 0, n: 5, big: 1.4, spread: 6 }, { x: 30, z: 0, n: 5, big: 1.4, spread: 6 }],
    pebbles: 30,
    rim: ['palm'],
  },
  far: '#c8a070',
  mountains: { color: '#c09878', height: 1 },
  start: [0, -26],
  startYaw: 0,
  structures: [
    { type: 'arch', x: -14, z: 14, w: 4, h: 4.4, color: '#c88a62' },
    { type: 'well', x: -14, z: -14 },
    { type: 'pen', x: 14, z: 14 },
    { type: 'stones', x: 14, z: -14, n: 7 },
    { type: 'stones', x: 8, z: 9, n: 5 },
  ],
  welcome:
    'Welcome to the Listening Valley. Surah Al-Jinn begins with a group of the jinn who listened to the Quran and said, “We have heard an amazing Quran.” Listening well needs a quiet place and a still heart. The valley is full of noises this evening. Can you find a quiet place?',
  tasks: [
    {
      id: 'straight',
      kind: 'read',
      at: [-6, -18],
      marker: 'sign',
      title: 'Straight on the way',
      goal: 'Read at the sign at the valley mouth',
      reading: { title: 'Straight on the way', refs: [[72, 16], [72, 17]], note: 'And if they had kept straight on the way, We would have given them water in plenty, to test them by it. And whoever turns away from the remembrance of his Lord, He will put into a punishment ever growing.' },
    },
    {
      id: 'listen',
      kind: 'hush',
      requires: ['straight'],
      title: 'A quiet place to listen',
      goal: 'Follow the hush meter to a quiet place and keep still to listen',
      intro: 'Watch the hush meter: the more bars, the louder it is where you stand. Find a quiet place and keep still.',
      adaptation: 'The valley and its noises are a game. The jinn are never shown, pictured or imagined; only the ayahs about them are read.',
      quiet: 0.45,
      rounds: 3,
      sources: [
        { at: [-14, 14], name: 'wind in the rock arch', loud: 4, rounds: [0, 1] },
        { at: [14, -14], name: 'the stream over stones', loud: 4, rounds: [0, 1, 2] },
        { at: [14, 14], name: 'goat bells', loud: 4, rounds: [1, 2] },
        { at: [-14, -14], name: 'the creaking well wheel', loud: 4, rounds: [0, 2] },
        { at: [0, 0], name: 'the rattling palm', loud: 2, rounds: [0, 1, 2] },
      ],
      reading: { title: 'We have heard an amazing Quran', refs: [[72, 1], [72, 2]], note: 'Say: it has been revealed to me that a group of the jinn listened, and said, “We have heard an amazing Quran. It guides to what is right, so we have believed in it, and we will never set up anyone as a partner with our Lord.”' },
    },
    {
      id: 'masjids',
      kind: 'read',
      requires: ['listen'],
      at: [8, 6],
      marker: 'tablet',
      title: 'The places of prayer',
      goal: 'Read at the tablet by the ring of stones',
      reading: { title: 'The places of prayer', refs: [[72, 18]], note: 'And the places of prayer are for Allah, so do not call on anyone along with Allah.' },
    },
  ],
  finale: {
    title: 'A quiet place',
    body: ['Three times the noises changed, and three times you found a quiet place to keep still and listen.', 'Surah Al-Jinn tells of listeners who heard the Quran and believed.'],
    ref: [72, 1],
    questions: ['Where is your quiet place for listening?', 'Why does listening well need stillness?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The jinn are never shown, pictured, voiced or imagined.', 'The Prophet is never shown; 72:19 is not acted out.'],
};
