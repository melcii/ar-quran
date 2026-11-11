// Surah 105, Al-Fil (The Elephant): the Evening Lookout. A rocky lookout
// above a dry valley at evening, where flocks of birds stream past on their
// way to roost. "And He sent against them birds in flocks" (105:3). The
// core play: count each flock the way bird counters really do, in blocks of
// ten, then multiply. The companions of the elephant, their army and what
// befell them are read only, never shown: these are ordinary birds going
// home, and nothing is struck.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W105: WorldDef = {
  surah: 105,
  name: 'The Evening Lookout',
  theme: 'Count flocks of birds in blocks of ten from a lookout at evening',
  play: 'From a rocky lookout above a dry valley at evening, flocks of birds stream past on their way to roost. There are far too many to count one by one, so count them the way bird counters do: tap each bunch of about ten, then multiply.',
  seed: 10505,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.6, seed: 105, shapes: [{ x: 0, z: -2, r: 8, h: 1.4 }, { x: 0, z: -40, r: 30, h: -6 }] }),
    palette: PAL.desert,
    paths: [curve([[0, 38], [-8, 26], [4, 14], [0, 4]])],
    flats: [{ x: 0, z: 0, r: 4, paint: '#c8b088' }, { x: -8, z: 26, r: 3 }, { x: 10, z: 10, r: 3 }],
  },
  look: { ...LOOKS.dusk, sunI: 2.2 },
  veg: {
    grass: 0.3,
    flowers: ['#f0d8a0'],
    trees: [{ kind: 'palm', at: [[-16, 16], [16, 20]] }],
    rocks: [{ x: -10, z: 4, n: 8, big: 1.6, spread: 6 }, { x: 12, z: -2, n: 8, big: 1.6, spread: 6 }],
    pebbles: 30,
    rim: ['palm'],
  },
  far: '#c8a080',
  mountains: { color: '#a08070', height: 1 },
  start: [0, 38],
  startYaw: Math.PI,
  structures: [{ type: 'bench', x: 3, z: 2, rot: 0 }],
  welcome:
    'Welcome to the Evening Lookout. Surah Al-Fil asks: have you not considered what your Lord did with the companions of the elephant? Its ayahs speak of birds in flocks. From up here at evening, you will see flocks of birds going home to roost.',
  tasks: [
    {
      id: 'considered',
      kind: 'read',
      at: [-8, 26],
      marker: 'sign',
      title: 'The companions of the elephant',
      goal: 'Read at the sign on the path up to the lookout',
      adaptation: 'The companions of the elephant and their army are read only; none is shown.',
      reading: { title: 'The companions of the elephant', refs: [[105, 1]], note: 'Have you not considered how your Lord dealt with the companions of the elephant?' },
    },
    {
      id: 'flocks',
      kind: 'flock',
      requires: ['considered'],
      at: [0, 0],
      flocks: [6, 9, 14],
      title: 'Birds in flocks',
      goal: 'Count each flock in blocks of ten, then say how many birds there are',
      intro: 'Tap each bunch of about ten as you count it. Then multiply.',
      adaptation: 'The lookout is a game. Counting large flocks in blocks of ten is how bird counters really do it. These are ordinary birds going home; nothing is struck.',
      outro: 'Three flocks counted, block by block.',
      after: { title: 'Birds in flocks', refs: [[105, 3], [105, 4], [105, 5]], note: 'And He sent against them birds in flocks, striking them with stones of baked clay, and He made them like eaten straw.' },
    },
    {
      id: 'plan',
      kind: 'read',
      requires: ['flocks'],
      at: [10, 10],
      marker: 'tablet',
      title: 'Their plan went astray',
      goal: 'Read at the tablet below the lookout',
      reading: { title: 'Their plan went astray', refs: [[105, 2]], note: 'Did He not make their plan go astray?' },
    },
  ],
  finale: {
    title: 'Birds in flocks',
    body: ['Flock after flock of ordinary birds, counted in blocks of ten as the light went.', 'Surah Al-Fil reminds us how Allah dealt with the companions of the elephant, and how their plan went astray.'],
    ref: [105, 3],
    questions: ['Why count in blocks of ten instead of one by one?', 'What does it mean that their plan "went astray"?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The companions of the elephant, the elephant, the army and its end are read only, never shown.', 'The birds here are ordinary birds; nothing is struck.'],
};
