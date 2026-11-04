// Surah 27, An-Naml: the Valley of the Ants. The world is seen at ant size:
// grass blades tower overhead, pebbles are boulders, a twig is a log. The
// core play: groups of ants are out on their paths and footsteps are coming
// (27:18). Start at the nest, then clear what blocks each path so every
// group marches home in time. Sulayman, his soldiers and the queen are never
// shown, and the footsteps are only a count; the ants and the hoopoe are
// animals only. The throne episode (27:38-44) is not shown.
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W027: WorldDef = {
  surah: 27,
  name: 'The Valley of the Ants',
  theme: 'At ant size, clear the paths so every ant gets home in time',
  play: 'You are ant-sized among giant grass. Footsteps are coming. Start at the nest, then roll pebbles, drag twigs and lift leaves off the paths so each group of ants can march home before the count runs out.',
  seed: 2727,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 1.4, seed: 27 }),
    palette: PAL.meadow,
    paths: [],
    flats: [{ x: 0, z: -6, r: 4 }],
  },
  look: { ...LOOKS.morning, sunI: 3.1 },
  veg: {
    grass: 1.3,
    flowers: ['#fff2d8', '#f4d060', '#f0a0b0'],
    trees: [],
    rocks: [{ x: 0, z: 0, n: 10, big: 1.6, spread: 30 }],
    pebbles: 60,
    rim: ['oak'],
  },
  far: '#6a9a4a',
  mountains: { color: '#8a9ab0', height: 0.8 },
  start: [0, 20],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Valley of the Ants. Here you are as small as an ant: the grass is like a forest. Surah An-Naml tells of an ant who called to the others to go home before footsteps came near. Read at the sign first.',
  tasks: [
    {
      id: 'gift',
      kind: 'read',
      at: [3, 16],
      marker: 'sign',
      title: 'Knowledge and thanks',
      goal: 'Read at the sign by the start',
      reading: { title: 'Knowledge given', refs: [[27, 15], [27, 16]], note: 'Allah gave Dawud and Sulayman knowledge, and they thanked Him. Sulayman said they had been taught the speech of birds and given a share of everything.' },
      adaptation: 'Dawud and Sulayman are not shown.',
    },
    {
      id: 'ants',
      kind: 'ants',
      requires: ['gift'],
      title: 'Home before the footsteps',
      goal: 'Start at the nest, then clear each blocked path so every group of ants gets home in time',
      intro: 'Groups of ants are out on three paths, and footsteps are coming. Go to the nest to start, then clear the pebbles, twigs and leaves off the paths. A clear path lets its ants march home.',
      adaptation: 'The blocked paths and the count are game ideas built on 27:18. Sulayman and his soldiers are never shown; the footsteps are only a count. The ants are animals only.',
      nest: [0, -6],
      time: 60,
      groups: [
        { path: [[-18, 6], [-12, 2], [-6, -2], [-1.6, -5]], blocks: [{ at: [-12, 2], what: 'pebble' }, { at: [-6.5, -1.6], what: 'twig' }] },
        { path: [[16, 8], [10, 4], [4, -2], [1.6, -5]], blocks: [{ at: [10, 4], what: 'leaf' }] },
        { path: [[2, -26], [1, -18], [0.4, -9]], blocks: [{ at: [1.5, -21], what: 'leaf' }, { at: [1, -15], what: 'twig' }] },
      ],
      reading: { title: 'Enter your dwellings', refs: [[27, 18], [27, 19]], note: 'In the valley of the ants, an ant said: O ants, go into your homes, so that Sulayman and his soldiers do not crush you without knowing it. Sulayman smiled at what she said, and prayed: My Lord, help me to be thankful for Your favour on me and my parents, and to do good that pleases You.' },
      outro: 'Every group is home, safe underground.',
    },
    {
      id: 'hoopoe',
      kind: 'read',
      requires: ['ants'],
      at: [-10, 14],
      marker: 'lantern',
      title: 'The hoopoe',
      goal: 'Read at the lantern on the west side',
      reading: { title: 'News from Saba', refs: [[27, 20], [27, 22]], note: 'Sulayman looked for the hoopoe among the birds and could not see it. Before long the hoopoe came back and said: I have learned something you have not, and I bring you sure news from Saba.' },
      adaptation: 'The hoopoe is a bird only; Sulayman is not shown. 27:21 is left to the whole-surah reading.',
    },
    {
      id: 'thanks',
      kind: 'read',
      requires: ['hoopoe'],
      at: [10, 14],
      marker: 'sign',
      title: 'Grateful or not',
      goal: 'Read at the sign on the east side',
      reading: { title: 'A test of thanks', refs: [[27, 40]], note: 'When Sulayman saw what he had asked for set before him, he said: this is from the favour of my Lord, to test me, whether I am thankful or not. Whoever is thankful is thankful for their own good.' },
      adaptation: 'The throne episode (27:38-44) is not shown; this verse is read only.',
    },
  ],
  finale: {
    title: 'Small and safe',
    body: ['You cleared the paths so every group of ants got home before the footsteps came near.', 'Surah An-Naml tells how an ant cared for the others, and how Sulayman answered with thanks.'],
    ref: [27, 19],
    questions: ['How did the ant help the others?', 'What is one thing you can be thankful for today?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown: Dawud and Sulayman never appear. The queen of Saba is not shown.',
    "Sulayman's soldiers, including the jinn, are never shown; the footsteps are only a count.",
    'The ants and the hoopoe are animals only.',
  ],
};
