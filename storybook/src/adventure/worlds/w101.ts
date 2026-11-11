// Surah 101, Al-Qari'ah (The Striking Calamity): the Shepherd's Porch. A
// shepherd's stone house high on a hill at dusk, with the spring fleece in
// a heap on the porch bench, a lantern that the moths circle, and sheep in
// a fold below. "The Day when people will be like scattered moths, and the
// mountains like carded wool" (101:4-5). The core play: pick the burrs out
// of the fleece, then card it the real way, loading, brushing, passing
// across, brushing again and rolling it off, until it is soft and light.
// The Day and the scales (101:6-11) are read only, never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W101: WorldDef = {
  surah: 101,
  name: 'The Shepherd’s Porch',
  theme: 'Pick the burrs and card the fleece into soft, light wool, while moths circle the lantern',
  play: 'On a shepherd’s porch high on a hill at dusk, the spring fleece is heaped on the bench and moths circle the lantern. Pick every burr out of the fleece, then card it: load a tuft, brush it until the fibres lie straight, pass it across, brush again, and roll it off soft and light.',
  seed: 10101,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.4, seed: 101, shapes: [{ x: 0, z: -2, r: 10, h: 1.2 }] }),
    palette: PAL.autumn,
    paths: [curve([[2, 36], [-8, 24], [4, 12], [0, 4]])],
    flats: [{ x: 0, z: 0, r: 5, paint: '#b8a888' }, { x: -8, z: 24, r: 3 }, { x: 12, z: 10, r: 3 }],
  },
  look: { ...LOOKS.dusk, sunI: 1.8 },
  veg: {
    grass: 0.8,
    flowers: ['#e8e0f0'],
    trees: [{ kind: 'pine', at: [[-14, 6], [-16, -10], [14, -12]] }],
    rocks: [{ x: 16, z: 20, n: 6, big: 1.2, spread: 5 }, { x: -18, z: 18, n: 5, big: 1, spread: 5 }],
    pebbles: 20,
    rim: ['pine'],
  },
  far: '#8a8aa0',
  mountains: { color: '#c8c4c0', height: 1.2 },
  start: [2, 36],
  startYaw: Math.PI,
  structures: [
    { type: 'house', x: 0, z: -4.5, rot: 0, w: 6, d: 4.4, h: 3, accent: '#5a6a7a' },
    { type: 'pen', x: 14, z: 0, w: 9 },
    { type: 'bench', x: -3.5, z: 1, rot: 0 },
  ],
  welcome:
    'Welcome to the Shepherd’s Porch. Surah Al-Qari’ah describes a Day when people will be like scattered moths, and the mountains like carded wool. Tonight the moths are circling the lantern, and the spring fleece is waiting to be carded.',
  tasks: [
    {
      id: 'striking',
      kind: 'read',
      at: [-8, 24],
      marker: 'sign',
      title: 'The Striking Calamity',
      goal: 'Read at the sign on the hill path',
      adaptation: 'The Day is read only; nothing of it is shown.',
      reading: { title: 'The Striking Calamity', refs: [[101, 1], [101, 2], [101, 3]], note: 'The Striking Calamity! What is the Striking Calamity? And what can make you know what the Striking Calamity is?' },
    },
    {
      id: 'wool',
      kind: 'carding',
      requires: ['striking'],
      at: [0, 0.5],
      burrs: [[0.15, 0.2], [0.7, 0.15], [0.45, 0.55], [0.85, 0.7], [0.25, 0.8]],
      strokes: 4,
      batches: 3,
      title: 'Carded wool',
      goal: 'Pick every burr out of the fleece, then card three rolls of soft wool',
      intro: 'Burrs first. Then load, brush, pass, brush, roll.',
      adaptation: 'The porch is a game. Picking burrs and carding wool with two hand carders is real. The moths and the wool only bring the ayah’s words to mind; the Day is never shown.',
      outro: 'Three soft rolls of carded wool, light as air.',
      after: { title: 'Like moths, like wool', refs: [[101, 4], [101, 5]], note: 'It is the Day when people will be like scattered moths, and the mountains will be like carded wool.' },
    },
    {
      id: 'scales',
      kind: 'read',
      requires: ['wool'],
      at: [12, 10],
      marker: 'tablet',
      title: 'Heavy and light',
      goal: 'Read at the tablet by the sheepfold',
      reading: { title: 'Heavy and light', refs: [[101, 6], [101, 7], [101, 8], [101, 9]], note: 'Then as for the one whose scales are heavy, he will be in a pleasing life. But as for the one whose scales are light, his refuge will be an abyss.' },
    },
  ],
  finale: {
    title: 'Light as wool',
    body: ['The tangled, burr-filled fleece is now soft rolls of wool, so light they hardly weigh anything.', 'Surah Al-Qari’ah says that on that Day the mountains will be like carded wool, and what matters is whose scales are heavy with good.'],
    ref: [101, 5],
    questions: ['Why did the burrs have to come out first?', 'What does it mean for good deeds to be "heavy"?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Day and the scales are read only, never shown.', 'The moths and the wool are pictures of the ayah’s words only.'],
};
