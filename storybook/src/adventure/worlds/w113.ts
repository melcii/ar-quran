// Surah 113, Al-Falaq (The Daybreak): the Wood Before Dawn. A path home
// through a dark pine wood before dawn, with old lanterns on posts along
// the way and fields beyond the trees. "Say: I seek refuge in the Lord of
// daybreak, from the evil of what He created, and from the evil of darkness
// when it settles" (113:1-3). The core play: light the lanterns one by one
// in order along the path, holding the flame still at each wick, while the
// sky grows paler until day breaks. Nothing frightening is shown: no
// creature, no magic, no envier.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { PAL, rolling } from './common';
import { dawnLook } from '../mechanics/dawn';

export const W113: WorldDef = {
  surah: 113,
  name: 'The Wood Before Dawn',
  theme: 'Light the lanterns through a dark wood, one by one, until day breaks',
  play: 'Before dawn, the path home runs through a dark wood, with old lanterns on posts along the way. Light them one by one, in order along the path: hold your flame still at each wick until it catches. With every lantern lit, the sky grows paler, until day breaks at the edge of the wood.',
  seed: 11313,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1, seed: 113 }),
    palette: PAL.meadow,
    paths: [curve([[0, 34], [0, 24], [-4, 14], [2, 4], [-2, -6], [3, -16], [0, -26]])],
    flats: [{ x: 0, z: 30, r: 3 }, { x: 0, z: -26, r: 4 }],
  },
  look: { ...dawnLook(0), stars: 1 },
  veg: {
    grass: 0.7,
    flowers: ['#e8e0f0'],
    trees: [{ kind: 'pine', area: { x: 0, z: 0, r: 30 }, count: 40 }],
    rocks: [{ x: 10, z: 8, n: 4, big: 1, spread: 4 }],
    pebbles: 16,
    rim: ['pine'],
  },
  far: '#3a4a5a',
  mountains: { color: '#4a5068', height: 0.8 },
  start: [0, 34],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Wood Before Dawn. Surah Al-Falaq teaches us to say: I seek refuge in the Lord of daybreak. It is still dark, and the path home runs through the wood. There are lanterns along the way.',
  tasks: [
    {
      id: 'daybreak',
      kind: 'read',
      at: [0, 30],
      marker: 'sign',
      title: 'The Lord of daybreak',
      goal: 'Read at the sign where the path enters the wood',
      reading: { title: 'The Lord of daybreak', refs: [[113, 1], [113, 2]], note: 'Say: I seek refuge in the Lord of daybreak, from the evil of what He has created,' },
    },
    {
      id: 'lamps',
      kind: 'lanterns',
      requires: ['daybreak'],
      lamps: [[1.4, 24], [-2.6, 14], [3.4, 4], [-0.6, -6], [4.4, -16]],
      secs: 2.5,
      title: 'Until daybreak',
      goal: 'Light the five lanterns in order along the path through the wood, holding the flame still at each',
      intro: 'One lantern at a time, in order, and hold still while the wick catches.',
      adaptation: 'The wood and the lanterns are a game, only a picture of light after dark. The refuge the surah teaches is in Allah, the Lord of daybreak.',
      outro: 'A line of lanterns through the wood, and the day breaking.',
      after: { title: 'From the evil of darkness', refs: [[113, 3], [113, 4], [113, 5]], note: 'and from the evil of darkness when it settles, and from the evil of those who blow on knots, and from the evil of an envier when he envies.' },
    },
    {
      id: 'refuge',
      kind: 'read',
      requires: ['lamps'],
      at: [0, -26],
      marker: 'tablet',
      title: 'The whole surah',
      goal: 'Read at the tablet at the edge of the wood',
      reading: { title: 'The whole surah', refs: [[113, 1], [113, 2], [113, 3], [113, 4], [113, 5]], note: 'Say: I seek refuge in the Lord of daybreak, from the evil of what He has created, and from the evil of darkness when it settles, and from the evil of those who blow on knots, and from the evil of an envier when he envies.' },
    },
  ],
  finale: {
    title: 'The Lord of daybreak',
    body: ['Lantern by lantern through the dark wood, and then the day broke.', 'Surah Al-Falaq teaches us where real refuge is: in the Lord of daybreak.'],
    ref: [113, 1],
    questions: ['How did the wood change as the lanterns were lit?', 'When might you say this surah?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Nothing frightening is shown: no creature, no magic, no envier.', 'The lanterns are a picture only; refuge is in Allah.'],
};
