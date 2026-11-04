// Surah 5, Al-Ma'idah: Promises and Provision. A meadow with a long shared
// table under strings of lanterns, a small market to sort, and a quiet olive
// grove for reading. The table "spread from heaven" (5:112-115) is only read,
// never shown; the shared meal is a game idea.
import { curve, type P2 } from '../terrain';
import type { ItemKind } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const TABLE: P2 = [0, -6];
const seats: P2[] = [-4.5, -1.5, 1.5, 4.5].flatMap((x) => [[TABLE[0] + x, TABLE[1] - 0.3] as P2, [TABLE[0] + x + 0.6, TABLE[1] + 0.3] as P2]);
const dishes: { item: ItemKind; label: string }[] = [
  { item: 'bread', label: 'bread' },
  { item: 'dates', label: 'dates' },
  { item: 'fruit', label: 'fruit' },
  { item: 'milk', label: 'milk' },
  { item: 'bread', label: 'bread' },
  { item: 'fruit', label: 'fruit' },
  { item: 'pot', label: 'pot of stew' },
  { item: 'dates', label: 'dates' },
];

export const W005: WorldDef = {
  surah: 5,
  name: 'Promises and Provision',
  theme: 'Keep your promises, share the table, be just',
  seed: 505,
  ground: {
    radius: 62,
    base: rolling({ radius: 62, amp: 3.5, seed: 5, shapes: [{ x: 32, z: -30, r: 18, h: 5 }, { x: -36, z: 30, r: 14, h: 3 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 56], [-6, 36], [0, 18], [0, 4]]), curve([[0, 4], [18, -8], [30, -24]]), curve([[0, 4], [-18, 8], [-30, -6], [-36, -24]])],
    flats: [{ x: 0, z: -4, r: 14, paint: '#e6d6b0' }, { x: -24, z: 14, r: 8 }],
  },
  look: LOOKS.golden,
  veg: {
    grass: 1,
    flowers: ['#f4d060', '#fff2d8', '#f6c0d0', '#c8a0e8'],
    flowerDensity: 1.2,
    trees: [
      { kind: 'olive', area: { x: 30, z: -28, r: 16 }, count: 12 },
      { kind: 'oak', area: { x: 0, z: 0, r: 56 }, count: 8 },
      { kind: 'blossom', area: { x: 0, z: 30, r: 24 }, count: 5 },
      { kind: 'fig', area: { x: -30, z: -20, r: 14 }, count: 4 },
      { kind: 'autumn', area: { x: 0, z: 0, r: 56 }, count: 5 },
    ],
    rocks: [{ x: 32, z: -34, n: 6, big: 1.5, spread: 12 }, { x: -40, z: 30, n: 5, big: 1.4, spread: 10 }],
    pebbles: 30,
  },
  far: '#7a9a50',
  mountains: { color: '#8a8cae' },
  start: [0, 56],
  startYaw: Math.PI,
  structures: [
    { type: 'table', x: TABLE[0], z: TABLE[1], w: 11, d: 2.4, color: '#b8463a' },
    { type: 'festoon', x: -7, z: -9, to: [7, -9], h: 3.8 },
    { type: 'festoon', x: -7, z: -3, to: [7, -3], h: 3.8 },
    { type: 'stall', x: -22, z: 12, rot: 0.6, color: '#d8664a' },
    { type: 'stall', x: -28, z: 18, rot: 0.9, color: '#3f7f8a' },
    { type: 'stall', x: -18, z: 20, rot: 0.2, color: '#c8a040' },
    { type: 'tent', x: 12, z: 8, rot: -0.6, color: '#7a5a3a' },
    { type: 'cart', x: 8, z: 12, rot: 0.4 },
    { type: 'well', x: -8, z: 14 },
  ],
  herds: [{ animal: 'sheep', at: [-36, 30], r: 7, n: 4 }],
  welcome:
    'Welcome to the meadow of Promises and Provision. Surah Al-Ma\'idah, "The Table Spread", begins by asking believers to keep their promises. Walk up to the first stone.',
  tasks: [
    {
      id: 'contracts',
      kind: 'read',
      at: [-3, 24],
      marker: 'tablet',
      title: 'Keep your promises',
      goal: 'Read the stone on the path',
      reading: {
        title: 'Fulfil all contracts',
        refs: [[5, 1]],
        note: 'The surah opens: "O you who have believed, fulfil all contracts." A promise is a trust: when we give our word, we keep it.',
      },
    },
    {
      id: 'promises',
      kind: 'quiz',
      requires: ['contracts'],
      at: [3, 24],
      marker: 'scroll',
      title: 'A promise kept?',
      goal: 'Sort the promises at the lectern',
      prompt: 'Is each card a promise kept, or a promise broken?',
      game: {
        type: 'sort',
        bins: ['Promise kept', 'Promise broken'],
        cards: [
          { text: 'You said you would help set the table, and you came on time.', bin: 0 },
          { text: 'You promised to give a book back on Friday, then kept it for a month.', bin: 1 },
          { text: 'You agreed to share the swing, and took turns.', bin: 0 },
          { text: 'You promised a secret was safe, then told everyone.', bin: 1 },
          { text: 'You forgot your promise, so you said sorry and did it the next day.', bin: 0 },
          { text: 'You said "I will be there", knowing you would not go.', bin: 1 },
        ],
      },
      adaptation: 'The cards are written for this game, about the command in 5:1.',
    },
    {
      id: 'table',
      kind: 'carry',
      requires: ['promises'],
      title: 'Set the shared table',
      goal: 'Carry the food from the kitchen tent to the long table',
      intro: 'Everyone is invited to a shared meal. Carry the dishes from the kitchen tent to each place at the table.',
      adaptation: 'The shared meal is a game idea about sharing and cooperation. It does not show the table sent down in 5:112-115.',
      loads: dishes.map((d, i) => ({ from: [12, 11] as P2, to: seats[i], item: d.item, label: d.label, dest: `to place ${i + 1} at the table`, lift: 0.5 })),
    },
    {
      id: 'sort',
      kind: 'carry',
      requires: ['table'],
      title: 'Sort the market',
      goal: 'Take each basket to the right market stall',
      adaptation: 'Sorting the market is a game idea about order and honesty.',
      loads: [
        { from: [-10, 20], to: [-19.9, 12.6], item: 'fruit', label: 'basket of fruit', dest: 'to the red stall (fruit)' },
        { from: [-10, 20], to: [-25.9, 17.4], item: 'grain', label: 'sack of grain', dest: 'to the blue stall (grain)' },
        { from: [-10, 20], to: [-16.8, 18.2], item: 'bread', label: 'basket of bread', dest: 'to the yellow stall (bread)' },
        { from: [-10, 20], to: [-19.6, 11.0], item: 'dates', label: 'basket of dates', dest: 'to the red stall (fruit)' },
      ],
      after: {
        title: 'Be just',
        refs: [[5, 8]],
        note: 'Stand firm for Allah and be fair witnesses. Do not let dislike of anyone stop you from being just. Being fair is nearest to righteousness.',
      },
    },
    {
      id: 'brothers',
      kind: 'read',
      requires: ['table'],
      at: [26, -20],
      marker: 'tablet',
      title: 'The two sons of Adam',
      goal: 'Read in the quiet olive grove',
      reading: {
        title: 'The story of Adam\'s two sons',
        refs: [[5, 27], [5, 28], [5, 29], [5, 30], [5, 31]],
        note: 'Two brothers each made an offering. It was accepted from one and not the other, and the other let anger and envy lead him to a terrible wrong, and then to regret. Allah accepts from those who are mindful of Him. This is a story to read with an adult; nothing of it is shown here.',
      },
      adaptation: 'This place is only for reading. Nothing of the story is acted out or shown.',
    },
    {
      id: 'spread',
      kind: 'read',
      requires: ['sort', 'brothers'],
      at: [7.5, -6],
      marker: 'lantern',
      title: 'The table spread',
      goal: 'Read at the lantern at the head of the table',
      reading: {
        title: 'A table spread from heaven',
        refs: [[5, 112], [5, 113], [5, 114], [5, 115]],
        note: 'The disciples of \'Isa asked for a table of food from heaven. \'Isa prayed: "Our Lord, send down to us a table... a sign from You. And provide for us, and You are the best of providers." The surah is named after this table.',
      },
    },
  ],
  finale: {
    title: 'Promises and provision',
    body: [
      'You kept a promise to help, set a table for everyone and sorted the market fairly. Al-Ma\'idah asks believers to keep their word, to cooperate in good and to be just, even with people they do not like.',
      'And it reminds us who the best of providers is.',
    ],
    ref: [5, 8],
    questions: ['What promise did you keep this week?', 'Why is it hard to be fair to someone you are upset with?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown, and \'Isa and his disciples do not appear.',
    'The table sent down from heaven is not pictured; the shared table is a game idea.',
    'The story of Adam\'s two sons is only read; nothing of it is shown.',
  ],
  extras: { motes: [{ at: TABLE, r: 9 }] },
};
