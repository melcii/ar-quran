// Surah 13, Ar-Ra'd: the Storm Valley. A high valley under big skies, with
// three hollows of very different sizes and a field below each. The core
// play is the parable of 13:17: a storm comes on its own, the explorer
// shelters under a rock overhang while the lightning flashes (13:12), the
// rain fills each valley by its own size, and then the foam the torrent
// left is cast off the water so what benefits stays and waters the fields.
// Nothing here makes the rain, and nothing is struck: the storm is weather.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W013: WorldDef = {
  surah: 13,
  name: 'The Storm Valley',
  theme: 'Shelter from the storm, then see each valley hold water by its own size',
  play: 'A weather world: a storm comes on its own; wait it out under the rock overhang, watch three valleys of different sizes fill, then cast off the foam so the water that stays can water the fields.',
  seed: 1313,
  ground: {
    radius: 64,
    base: rolling({
      radius: 64,
      amp: 4,
      seed: 13,
      shapes: [
        { x: -22, z: -6, r: 7.5, h: -2.6 },
        { x: 4, z: -18, r: 10, h: -3 },
        { x: 30, z: -2, r: 13, h: -3.2 },
        { x: -6, z: 22, r: 12, h: 3.5 },
        { x: -40, z: -30, r: 18, h: 9 },
        { x: 40, z: -34, r: 16, h: 8 },
      ],
    }),
    palette: PAL.meadow,
    paths: [curve([[0, 56], [-2, 40], [-4, 24], [-10, 10], [-18, 2]]), curve([[-4, 24], [8, 8], [20, 4]]), curve([[-10, 10], [2, -4]])],
    flats: [{ x: -1, z: 19, r: 4, paint: '#b8ac94' }],
  },
  look: { ...LOOKS.morning, clouds: 1, sunI: 2.9 },
  veg: {
    grass: 1.2,
    flowers: ['#f4f0e0', '#e8c0e0', '#f4d060'],
    trees: [
      { kind: 'pine', area: { x: -40, z: -30, r: 18 }, count: 9 },
      { kind: 'pine', area: { x: 40, z: -34, r: 16 }, count: 7 },
      { kind: 'oak', area: { x: 0, z: 30, r: 30 }, count: 8 },
      { kind: 'olive', area: { x: -30, z: 20, r: 10 }, count: 3 },
      { kind: 'palm', at: [[-30, 8], [40, 12]] },
    ],
    rocks: [{ x: -6, z: 22, n: 10, big: 1.6, spread: 14 }, { x: -40, z: -30, n: 8, big: 2, spread: 18 }],
    pebbles: 40,
    rim: ['pine', 'oak'],
  },
  far: '#5e7e4a',
  mountains: { color: '#6a7a98', height: 1.4 },
  start: [0, 54],
  startYaw: Math.PI,
  structures: [{ type: 'stones', x: -28, z: 12, n: 4 }],
  welcome:
    'Welcome to the Storm Valley. Surah Ar-Ra\'d, "The Thunder", points to signs in the sky and the land: the heavens raised without pillars you can see, mountains and rivers, gardens side by side watered with the same water. Climb to the lookout stone first.',
  tasks: [
    {
      id: 'sky',
      kind: 'read',
      at: [-3, 40],
      marker: 'tablet',
      title: 'The sky and the land',
      goal: 'Read at the lookout stone',
      reading: {
        title: 'Raised without pillars',
        refs: [[13, 2], [13, 3]],
        note: 'Allah raised the heavens without pillars that you can see, and made the sun and the moon run their courses. He spread out the earth and placed firm mountains and rivers in it, and made the night cover the day.',
      },
    },
    {
      id: 'storm',
      kind: 'valley',
      requires: ['sky'],
      title: 'The storm and the valleys',
      goal: 'Shelter under the rock overhang through the storm, then cast the foam off each valley',
      intro: 'The air is heavy and the clouds are building over the mountains. Below are three valleys: a narrow one, a middle one and a wide one. When the storm comes, wait it out under the rock overhang, and watch.',
      adaptation: 'The storm, its length, and casting off the foam by hand are game ideas. In the ayah the foam is carried away and vanishes; here you help cast it off.',
      shelter: [-1, 19],
      rain: 18,
      valleys: [
        { at: [-22, -6], r: 4.6, cap: 4, label: 'the narrow valley', field: [-22, 4], note: 'The narrow valley held only a little, but it is clear water now, and it waters the small field below it.' },
        { at: [4, -18], r: 6.6, cap: 8, label: 'the middle valley', field: [12, -8], note: 'The middle valley held twice as much. Its clear water runs down into the field beside it.' },
        { at: [30, -2], r: 9.2, cap: 14, label: 'the wide valley', field: [28, 12], note: 'The wide valley held the most of all. The foam is gone, and what stays is the water that helps the land.' },
      ],
      reading: {
        title: 'Valleys flow according to their size',
        refs: [[13, 17]],
        note: 'Allah sends down rain from the sky, and valleys flow, each according to its size. The torrent carries foam on top. The foam goes, cast away, and what benefits people stays in the land. That is how Allah gives examples of truth and falsehood.',
      },
      outro: 'Every valley is clear, and the fields below them are green. Go and look at the fields.',
    },
    {
      id: 'fields',
      kind: 'read',
      requires: ['storm'],
      at: [6, 2],
      marker: 'sign',
      title: 'One water, different fruit',
      goal: 'Read at the signpost among the fields',
      reading: {
        title: 'Neighbouring plots',
        refs: [[13, 4]],
        note: 'On the earth are plots side by side, gardens of grapevines, crops and palms, watered with one water, and yet some give better fruit than others. In that are signs for people who think.',
      },
    },
    {
      id: 'calm',
      kind: 'stand',
      requires: ['fields'],
      at: [-1, 19],
      secs: 5,
      label: 'Sit quietly under the overhang',
      title: 'After the storm',
      goal: 'Go back to the overhang and keep still for a moment',
      style: 'none',
      reading: {
        title: 'Hearts at rest',
        refs: [[13, 28]],
        note: 'Those who believe find their hearts at rest in the remembrance of Allah. Truly, in the remembrance of Allah hearts find rest.',
      },
    },
  ],
  finale: {
    title: 'What stays',
    body: [
      'You sheltered from the storm, watched each valley fill by its own size, and cast the foam away so the clear water could reach the fields.',
      'The foam looked big on top, but it did not last. What stayed was what helps people.',
    ],
    ref: [13, 17],
    questions: ['What is something that looks big but does not last?', 'What is something small you can do that stays and helps?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No angels are shown, and nothing is shown being struck by lightning. Ayah 13:13 is not acted out.',
    'The storm comes and goes on its own: the player never makes it rain.',
    'Sheltering from lightning is real safety advice; the overhang in this game is a safe place by design.',
    'Casting off the foam by hand is a game idea; in the ayah the foam is carried off and vanishes.',
  ],
};
