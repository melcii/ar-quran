// Surah 59, Al-Hashr (The Gathering): the Town of Welcome. A small town
// below a great mountain, with a store in the square and three empty houses
// at the end of the street. New families have come with nothing. The core
// play: make every house ready with bread, a blanket, a water jar and a
// lamp. The store has some of each, but not enough blankets or lamps for
// everyone, so when it runs out you must go to your own house and give your
// own (59:9, "they give others preference over themselves, even though they
// are in need"). The mountain stands for the example of 59:21, and the
// names of Allah (59:22-24) are read at its foot. The town and the families
// are a game idea; no one is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W059: WorldDef = {
  surah: 59,
  name: 'The Town of Welcome',
  theme: 'Make homes ready for newcomers, and give from your own when the store runs out',
  play: 'New families have come to the town with nothing. Make each empty house ready with bread, a blanket, a water jar and a lamp. Give from the store first; when the store runs out, go into your own house and give your own. Readings wait on the way and at the foot of the mountain.',
  seed: 5959,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.4, seed: 59, shapes: [{ x: 0, z: -40, r: 18, h: 16 }, { x: -30, z: -30, r: 12, h: 6 }, { x: 30, z: -30, r: 12, h: 6 }] }),
    palette: PAL.dry,
    paths: [curve([[0, 40], [5, 28], [0, 14], [0, 0], [0, -8]]), curve([[-10, -2], [0, -4], [10, -2]])],
    flats: [{ x: 0, z: 2, r: 8, paint: '#e2cc9e' }, { x: 12, z: 26, r: 4 }, { x: -9, z: 12, r: 4 }, { x: 0, z: -12, r: 4 }, { x: -11, z: -5, r: 4 }, { x: 11, z: -5, r: 4 }],
  },
  look: LOOKS.desert,
  veg: {
    grass: 0.6,
    flowers: ['#fff2d8', '#e8c070'],
    trees: [{ kind: 'palm', area: { x: 0, z: 14, r: 26 }, count: 8, size: [0.9, 1.2] }, { kind: 'olive', at: [[-18, 20], [18, 12]] }],
    rocks: [{ x: 0, z: -34, n: 7, big: 1.6, spread: 10 }],
    pebbles: 30,
    rim: ['palm', 'olive'],
  },
  far: '#c0a878',
  mountains: { color: '#a8988a', height: 1 },
  start: [0, 40],
  startYaw: Math.PI,
  structures: [
    { type: 'well', x: 4, z: 6 },
    { type: 'stall', x: -6, z: 4, rot: Math.PI / 2, color: '#a07a4a' },
  ],
  welcome:
    'Welcome to the Town of Welcome. Surah Al-Hashr praises the people of Madinah, who loved those who came to them with nothing and gave them preference over themselves. Today new families are coming here, and their houses are still empty.',
  tasks: [
    {
      id: 'tomorrow',
      kind: 'read',
      at: [4, 34],
      marker: 'sign',
      title: 'What you send ahead',
      goal: 'Read at the sign on the road into town',
      reading: { title: 'For tomorrow', refs: [[59, 18]], note: 'O you who believe, be mindful of Allah, and let every soul look at what it has sent ahead for tomorrow. Allah knows well what you do.' },
    },
    {
      id: 'welcome',
      kind: 'welcome',
      requires: ['tomorrow'],
      title: 'Make the houses ready',
      goal: 'Make each empty house ready with bread, a blanket, a water jar and a lamp, from the store and, when it runs out, from your own house',
      intro: 'Three houses at the end of the street are empty, and families are coming who have nothing. Each house needs bread, a blanket, a water jar and a lamp. Give from the store in the square first. Your own house is the one by the road you came in on.',
      adaptation: 'The town, the store and the houses are a game idea based on 59:9. No one is shown.',
      store: [-9, 12],
      own: [12, 26],
      homes: [
        { at: [-11, -5], name: 'the house on the left' },
        { at: [0, -12], name: 'the house at the end' },
        { at: [11, -5], name: 'the house on the right' },
      ],
      items: ['loaf of bread', 'blanket', 'water jar', 'lamp'],
      stock: [3, 2, 3, 2],
      outro: 'Every house has bread, a blanket, water and a light, and two of them came from your own home.',
      after: { title: 'They give others preference', refs: [[59, 9], [59, 10]], note: 'Those who were already living in the city loved those who came to them, and did not want for themselves what the newcomers were given. They put others before themselves, even when they were in need. Whoever is saved from the greed of their own soul, they are the successful. And those who came after them say: "Our Lord, forgive us and our brothers who came before us in faith, and put no bitterness in our hearts towards those who believe."' },
    },
    {
      id: 'mountain',
      kind: 'read',
      requires: ['welcome'],
      at: [4, -16],
      marker: 'tablet',
      title: 'If it came down on a mountain',
      goal: 'Read at the tablet at the foot of the mountain',
      reading: { title: 'The mountain', refs: [[59, 21]], note: 'If We had sent down this Quran on a mountain, you would have seen it humbled and split apart in awe of Allah. We give people these examples so that they may think.' },
    },
    {
      id: 'names',
      kind: 'read',
      requires: ['mountain'],
      at: [-4, -16],
      marker: 'scroll',
      title: 'The best names',
      goal: 'Read at the scroll beside it',
      reading: { title: 'He is Allah', refs: [[59, 22], [59, 23], [59, 24]], note: 'He is Allah: there is no god but Him, the Knower of the unseen and the seen, the Most Merciful, the Especially Merciful. He is the King, the Holy, the Source of peace, the Giver of safety, the Watcher, the Almighty, the Compeller, the Supreme. He is the Creator, the Maker, the Shaper. His are the best names. Everything in the heavens and the earth glorifies Him.' },
    },
  ],
  finale: {
    title: 'Before themselves',
    body: ['You made three empty houses ready, and when the store ran out you gave your own blanket and your own lamp.', 'Surah Al-Hashr praises people who loved newcomers and gave them preference over themselves, even when they were in need.'],
    ref: [59, 9],
    questions: ['How did it feel to give something that was your own?', 'Is there someone new near you who could use a welcome?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No one is shown: not the people of Madinah, not the newcomers, not the families of the game.', 'The town and the store are a game idea.'],
};
