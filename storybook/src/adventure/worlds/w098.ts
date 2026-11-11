// Surah 98, Al-Bayyinah (The Clear Proof): the Straight Row. A new orchard
// terrace on a spring hillside, with two marker posts and a bundle of
// stakes. "And they were not commanded except to worship Allah, sincere to
// Him in religion, upright, and to establish prayer and give zakah. And
// that is the upright religion" (98:5). The core play: plant the first row
// dead straight from post to post by walking the line and sighting back;
// a stake that strays is pulled up. The Messenger in 98:2 is read only,
// never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W098: WorldDef = {
  surah: 98,
  name: 'The Straight Row',
  theme: 'Sight a dead-straight row of stakes between two posts: the upright way',
  play: 'On a new orchard terrace, the first row of saplings must run dead straight between two marker posts. Walk out from the red post toward the yellow one and plant stakes along the line, sighting back each time. A stake that strays to one side is pulled up and planted again.',
  seed: 9898,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 0.8, seed: 98, shapes: [{ x: 0, z: -2, r: 14, h: 0.4 }] }),
    palette: PAL.meadow,
    paths: [curve([[-4, 34], [4, 22], [-2, 12], [0, 6]])],
    flats: [{ x: 0, z: -2, r: 13, paint: '#a89068' }, { x: 4, z: 22, r: 3 }, { x: 16, z: 10, r: 3 }],
  },
  look: { ...LOOKS.blossom, sunI: 2.6 },
  veg: {
    grass: 0.8,
    flowers: ['#f8d8e8', '#ffffff'],
    trees: [
      { kind: 'blossom', at: [[-16, 14], [-12, 20], [16, 20]] },
      { kind: 'olive', at: [[-18, -14], [18, -12]] },
    ],
    rocks: [{ x: 20, z: 0, n: 4, big: 0.9, spread: 4 }],
    pebbles: 14,
    rim: ['blossom', 'cypress'],
  },
  far: '#9ab09a',
  mountains: { color: '#8a98a8', height: 0.8 },
  start: [-4, 34],
  startYaw: Math.PI,
  structures: [
    { type: 'fence', x: -14, z: -10, to: [14, -10] },
    { type: 'cart', x: -12, z: 4, rot: 0.6 },
    { type: 'well', x: 12, z: 4 },
  ],
  welcome:
    'Welcome to the Straight Row. Surah Al-Bayyinah speaks of the upright way. Today the first row of the new orchard goes in, and it must run straight from post to post.',
  tasks: [
    {
      id: 'proof',
      kind: 'read',
      at: [4, 22],
      marker: 'sign',
      title: 'The clear proof',
      goal: 'Read at the sign on the path up to the terrace',
      adaptation: 'The Messenger in these ayahs is read only, never shown.',
      reading: { title: 'The clear proof', refs: [[98, 1], [98, 2], [98, 3]], note: 'Those who disbelieved were not going to part from their ways until the clear proof came to them: a Messenger from Allah, reciting purified pages, containing upright writings.' },
    },
    {
      id: 'row',
      kind: 'sight',
      requires: ['proof'],
      a: [-10, -4],
      b: [10, -4],
      stakes: 4,
      tol: 0.6,
      title: 'The upright row',
      goal: 'Walk from the red post toward the yellow post and plant four stakes in a straight line',
      intro: 'Walk the line. Before each stake, look back to the red post: are you on the line, or off to one side?',
      adaptation: 'The orchard is a game. Sighting a straight row with stakes between two posts is real.',
      outro: 'A straight row from post to post, a sapling tied to every stake.',
      after: { title: 'The upright way', refs: [[98, 5]], note: 'And they were not commanded except to worship Allah, sincere to Him in religion, upright, and to establish prayer and give zakah. And that is the upright religion.' },
    },
    {
      id: 'best',
      kind: 'read',
      requires: ['row'],
      at: [16, 10],
      marker: 'tablet',
      title: 'The best of creatures',
      goal: 'Read at the tablet by the orchard well',
      reading: { title: 'The best of creatures', refs: [[98, 7], [98, 8]], note: 'Those who believe and do righteous deeds are the best of creatures. Their reward with their Lord is gardens of lasting residence, with rivers flowing beneath, to stay in forever. Allah is pleased with them, and they with Him.' },
    },
  ],
  finale: {
    title: 'Upright',
    body: ['Sighting back each time, the stakes went in true, and the row runs straight from post to post.', 'Surah Al-Bayyinah calls worshipping Allah sincerely, praying and giving zakah the upright religion.'],
    ref: [98, 5],
    questions: ['How did you know a stake was off the line?', 'What does being "upright" look like in a day?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Messenger in 98:2 is read only, never shown.', 'The row of stakes is a picture only.'],
};
