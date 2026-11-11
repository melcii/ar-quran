// Surah 78, An-Naba (The News): the Tent on the Plain. A wide, windy
// plain at the foot of high mountains, late in the day, with a loose tent
// flapping on it. "Have We not made the earth a resting place, and the
// mountains as pegs?" (78:6-7). The core play: drive the tent's six pegs,
// each one straight across from the last, so every rope pulls against its
// pair and the tent stands firm; then rest inside as the night covers the
// plain (78:9-11). The plain and the tent are a game; nothing of the Day
// (78:17-40) is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W078: WorldDef = {
  surah: 78,
  name: 'The Tent on the Plain',
  theme: 'Peg a tent firm against the wind, each peg against its pair, then rest',
  play: 'On a wide, windy plain under high mountains, your tent flaps loose. Walk round it and drive the six pegs. A tent stands firm only when each rope pulls against the one opposite: drive a peg, then the one straight across, before starting another pair. Then rest inside as night covers the plain.',
  seed: 7878,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 0.6, seed: 78 }),
    palette: PAL.meadow,
    paths: [curve([[0, -38], [-6, -24], [0, -12], [0, -6]])],
    flats: [{ x: 0, z: 2, r: 7 }, { x: -6, z: -24, r: 3 }, { x: 14, z: 14, r: 3 }],
  },
  look: { ...LOOKS.golden, sunI: 2.8 },
  veg: {
    grass: 1.3,
    flowers: ['#fff2d8', '#c8a0e0'],
    trees: [{ kind: 'oak', at: [[-20, 18], [22, -14]] }],
    rocks: [{ x: 28, z: 24, n: 6, big: 1.5, spread: 7 }],
    pebbles: 20,
    rim: ['pine', 'oak'],
  },
  far: '#7a9a5a',
  mountains: { color: '#8a90b0', height: 1.4 },
  start: [0, -38],
  startYaw: 0,
  structures: [
    { type: 'stones', x: 6, z: 8, n: 3 },
  ],
  welcome:
    'Welcome to the Tent on the Plain. Surah An-Naba asks: have We not made the earth a resting place, and the mountains as pegs? The wind is getting up, and your tent is flapping loose. Make it firm before night comes.',
  tasks: [
    {
      id: 'news',
      kind: 'read',
      at: [-6, -24],
      marker: 'sign',
      title: 'A resting place',
      goal: 'Read at the sign on the plain',
      reading: { title: 'A resting place', refs: [[78, 6], [78, 7], [78, 8]], note: 'Have We not made the earth a resting place, and the mountains as pegs, and created you in pairs?' },
    },
    {
      id: 'tent',
      kind: 'pegs',
      requires: ['news'],
      at: [0, 2],
      n: 6,
      r: 3.6,
      title: 'Pegs against the wind',
      goal: 'Drive the six tent pegs, each straight across from the last, then rest in the tent',
      intro: 'Drive any peg first, then the one straight across from it. Then start a new pair.',
      adaptation: 'The plain and the tent are a game. A tent held by paired ropes is real.',
      rest: { title: 'Sleep a rest, the night a covering', refs: [[78, 9], [78, 10], [78, 11]], note: 'And We made your sleep a rest, and made the night a covering, and made the day for earning a living.' },
      outro: 'The tent stands firm, and you rest as the night covers the plain.',
      after: { title: 'A lamp and pouring rain', refs: [[78, 12], [78, 13], [78, 14], [78, 15], [78, 16]], note: 'And We built above you seven strong heavens, and placed a blazing lamp, and sent down pouring water from the rain clouds, to bring out grain and plants, and gardens thick with trees.' },
    },
    {
      id: 'morning',
      kind: 'read',
      requires: ['tent'],
      at: [14, 14],
      marker: 'tablet',
      title: 'The great news',
      goal: 'Read at the tablet near the tent',
      adaptation: 'The Day this news tells of is never pictured; it is read only.',
      reading: { title: 'The great news', refs: [[78, 1], [78, 2], [78, 3], [78, 4], [78, 5]], note: 'What are they asking one another about? About the great news, which they disagree about. No! They will come to know. Again, no! They will come to know.' },
    },
  ],
  finale: {
    title: 'Held firm',
    body: ['Six pegs, each pulling against its pair, held your tent firm in the wind, and you rested through the night.', 'Surah An-Naba speaks of the mountains as pegs, sleep as rest and the night as a covering.'],
    ref: [78, 7],
    questions: ['Why did each peg need its pair across from it?', 'What do pegs and mountains have in common?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Nothing of the Day (78:17-40) is shown.', 'The "mountains as pegs" comparison is read; the tent is a game.'],
};
