// Surah 94, Ash-Sharh (The Opening Up): the Evening Harbour. A small stone
// harbour at evening, with boats drawn up, a quay and a fishing net that has
// come up in a terrible tangle. "So indeed, with hardship there is ease.
// Indeed, with hardship there is ease" (94:5-6). The core play: untangle the
// net knot by knot, each only once the knots lying over it are undone; the
// tangle that looked impossible turns easy, and the net is spread to dry.
// Then "when you are done, stand up and work, and to your Lord turn your
// longing" (94:7-8). The Prophet, addressed in this surah, is never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W094: WorldDef = {
  surah: 94,
  name: 'The Evening Harbour',
  theme: 'Untangle a hopeless-looking net knot by knot: with hardship comes ease',
  play: 'At a small harbour in the evening, the fishing net has come up in a terrible tangle. It looks impossible, but it is only knots lying one over another. Undo a knot only when nothing lies on top of it; pull at one that is pinned and it only tightens. Knot by knot, the hard tangle turns easy.',
  seed: 9494,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 0.9, seed: 94, tilt: [0, -0.06], shapes: [{ x: 0, z: -50, r: 34, h: -10 }] }),
    palette: PAL.coast,
    paths: [curve([[0, 36], [-6, 24], [2, 12], [0, 4]])],
    water: -2,
    shore: '#d8c8a0',
    flats: [{ x: 0, z: 2, r: 6, paint: '#b8b0a0' }, { x: -6, z: 24, r: 3 }, { x: 10, z: 14, r: 3 }],
  },
  look: { ...LOOKS.sea, sun: [-0.7, 0.1, -0.7], sunColor: '#ffb884', sunI: 2.4 },
  veg: {
    grass: 0.6,
    flowers: ['#fff2d8'],
    trees: [{ kind: 'pine', at: [[-14, 18], [14, 24]] }],
    rocks: [{ x: -16, z: 0, n: 6, big: 1.2, spread: 5 }, { x: 16, z: 2, n: 6, big: 1.2, spread: 5 }],
    pebbles: 24,
    rim: ['pine'],
  },
  far: '#7a9a8a',
  mountains: { color: '#8a90a8', height: 0.7 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    { type: 'boat', x: -6, z: -1, rot: 0.4 },
    { type: 'boat', x: 6, z: -1.5, rot: -0.3 },
    { type: 'house', x: -9, z: 8, rot: Math.PI / 2, w: 4.4, d: 3.8, h: 2.8, accent: '#3a6a8a' },
  ],
  welcome:
    'Welcome to the Evening Harbour. Surah Ash-Sharh says it twice: with hardship there is ease; with hardship there is ease. The net has come up in a terrible tangle tonight. It looks impossible. Is it?',
  tasks: [
    {
      id: 'opened',
      kind: 'read',
      at: [-6, 24],
      marker: 'sign',
      title: 'A burden lifted',
      goal: 'Read at the sign on the path down to the harbour',
      adaptation: 'The Prophet, who is addressed here, is never shown; the ayahs are read only.',
      reading: { title: 'A burden lifted', refs: [[94, 1], [94, 2], [94, 3], [94, 4]], note: 'Did We not open up your chest for you, and lift from you your burden, which weighed so heavily on your back, and raise your remembrance high?' },
    },
    {
      id: 'net',
      kind: 'knots',
      requires: ['opened'],
      at: [0, 2],
      knots: [
        { name: 'red float knot', over: [] },
        { name: 'big loop knot', over: [0] },
        { name: 'twisted corner knot', over: [0] },
        { name: 'tight middle knot', over: [1, 2] },
        { name: 'small edge knot', over: [] },
        { name: 'weight-line knot', over: [3] },
        { name: 'last knot by the rope', over: [4, 5] },
      ],
      title: 'With hardship, ease',
      goal: 'Untangle the net, undoing each knot only when nothing lies on top of it',
      intro: 'Look at which knot is on top. Undo that one, and the one beneath it comes free.',
      adaptation: 'The harbour and the net are a game. The ease in the ayah is from Allah; this is only a picture of a hard thing turning easier.',
      outro: 'Every knot undone, and the net spread out to dry.',
      after: { title: 'With hardship, ease', refs: [[94, 5], [94, 6], [94, 7], [94, 8]], note: 'So indeed, with hardship there is ease. Indeed, with hardship there is ease. So when you are done, stand up and work, and to your Lord turn your longing.' },
    },
    {
      id: 'longing',
      kind: 'read',
      requires: ['net'],
      at: [10, 14],
      marker: 'tablet',
      title: 'Twice over',
      goal: 'Read at the tablet above the harbour',
      reading: { title: 'Twice over', refs: [[94, 5], [94, 6]], note: 'So indeed, with hardship there is ease. Indeed, with hardship there is ease. The surah says it twice.' },
    },
  ],
  finale: {
    title: 'Ease',
    body: ['The tangle looked impossible, but knot by knot it came apart, and the net lies spread out to dry.', 'Surah Ash-Sharh promises, twice: with hardship there is ease.'],
    ref: [94, 5],
    questions: ['What made the tangle easier once you started?', 'When has something hard turned easier for you?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet, addressed in this surah, is never shown, voiced or played.', 'The net is a picture only.'],
};
