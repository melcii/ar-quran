// Surah 4, An-Nisa: the Village of Fairness. A living village around a
// square with a well, on an autumn evening. The core play is deciding: share
// the winter stores among six households that each need something different
// (one needs nothing at all), and see the result in the village as lamps are
// lit and chimneys smoke. Then keep belongings safe and return each to its
// owner, and read about orphans and standing firm for justice. Fairness
// here means giving each what they need, not giving everyone the same.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, homes, rolling } from './common';

const C: P2 = [0, 0];
const ACC = ['#3f6f9a', '#3f7f5a', '#a04a3a', '#c8a040', '#7a4a8a', '#3f8a8a'];
const NAMES = ['blue', 'green', 'red', 'yellow', 'purple', 'teal'];
const { houses, doors } = homes(C, 21, 6, Math.PI / 6, ACC);

export const W004: WorldDef = {
  surah: 4,
  name: 'The Village of Fairness',
  theme: 'Decide fairly, and see the village change',
  play: 'A decision game: share limited stores among households with different needs, and watch the village show the result. Splitting everything evenly is not the fair answer here.',
  seed: 404,
  ground: {
    radius: 62,
    base: rolling({ radius: 62, amp: 3.5, seed: 4, shapes: [{ x: -34, z: -26, r: 16, h: 5 }, { x: 34, z: -30, r: 14, h: 4 }, { x: 30, z: 34, r: 10, h: -6 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 56], [4, 40], [0, 26], [0, 12]]), curve([[-12, 0], [-30, 6], [-44, 18]]), curve([[12, 0], [30, -6], [44, -18]])],
    water: -3,
    flats: [{ x: 0, z: 0, r: 26, paint: '#e2d0a8' }],
  },
  look: LOOKS.golden,
  veg: {
    grass: 1,
    flowers: ['#f4d060', '#fff2d8', '#e88a9a'],
    trees: [
      { kind: 'oak', area: { x: 0, z: 0, r: 56 }, count: 10 },
      { kind: 'autumn', area: { x: 0, z: 0, r: 56 }, count: 6 },
      { kind: 'olive', area: { x: -30, z: 30, r: 14 }, count: 5 },
      { kind: 'fig', at: [[-6, 6], [6, -6]], size: [1, 1.1] },
      { kind: 'cypress', area: { x: 0, z: 34, r: 10 }, count: 4 },
    ],
    rocks: [{ x: -34, z: -26, n: 8, big: 1.6, spread: 14 }, { x: 34, z: -30, n: 6, big: 1.4, spread: 12 }],
    pebbles: 30,
  },
  far: '#7c9a50',
  mountains: { color: '#8c8eae' },
  start: [0, 56],
  startYaw: Math.PI,
  structures: [
    ...houses,
    { type: 'well', x: 0, z: 0 },
    { type: 'stall', x: 9, z: 10, rot: Math.PI + 0.6, color: '#c8643a' },
    { type: 'stall', x: -9, z: 10, rot: Math.PI - 0.6, color: '#3f7f8a' },
    { type: 'festoon', x: -10, z: -4, to: [10, -4], h: 3.6 },
    { type: 'bench', x: 0, z: -9, rot: 0 },
    { type: 'pen', x: -36, z: 10, w: 10 },
  ],
  herds: [{ animal: 'goat', at: [-36, 10], r: 3, n: 3 }, { animal: 'sheep', at: [34, 20], r: 6, n: 4 }],
  welcome:
    'Welcome to the Village of Trust and Fairness. Surah An-Nisa teaches how to look after one another: to give back what belongs to others, to care for those who have no parents, and to be fair, always. Walk into the square.',
  tasks: [
    {
      id: 'trusts',
      kind: 'read',
      at: [3, 6],
      marker: 'tablet',
      title: 'Give back what is owed',
      goal: 'Read the stone in the village square',
      reading: {
        title: 'Render trusts to whom they are due',
        refs: [[4, 58]],
        note: 'Allah commands us to give back what we were trusted with, to the people it belongs to, and to judge fairly between people.',
      },
    },
    {
      id: 'winter',
      kind: 'share',
      requires: ['trusts'],
      at: [9, 6],
      title: 'Share the winter stores',
      goal: 'At the store by the square, decide how to share the winter stores among the six homes',
      intro: 'Winter is coming. The village store holds grain, blankets and firewood, just enough for everyone who needs them. Six homes are round the square, and each needs something different. Look at each home, then decide.',
      prompt: 'Share the store so that every home has what it needs and nothing is left over. Look at what each home says. Try "Split it all evenly" first if you like, and see what happens.',
      adaptation: 'The households, their needs and the store are written for this game. It is not a lesson in the inheritance shares of 4:11-12, which follow fixed rules of their own.',
      goods: [
        { id: 'grain', label: 'grain', n: 10 },
        { id: 'blanket', label: 'blankets', n: 8 },
        { id: 'wood', label: 'wood', n: 6 },
      ],
      homes: [
        { label: 'Blue door', sign: 'A grandmother who lives alone. Her hearth is cold and her shawl is thin: 2 wood, 1 blanket, 1 grain.', needs: { grain: 1, blanket: 1, wood: 2 }, door: doors[0] },
        { label: 'Green door', sign: 'A family with a new baby. The baby needs warmth most of all: 2 blankets, 2 grain, 1 wood.', needs: { grain: 2, blanket: 2, wood: 1 }, door: doors[1] },
        { label: 'Red door', sign: 'A household that has taken in two children who lost their parents. The jar is empty: 3 grain, 2 blankets, 1 wood.', needs: { grain: 3, blanket: 2, wood: 1 }, door: doors[2] },
        { label: 'Yellow door', sign: 'A family whose harvest was good this year. Their store is full and their woodpile high. They need nothing.', needs: {}, door: doors[3] },
        { label: 'Purple door', sign: 'A traveller resting in the guest room, far from home: 1 grain, 1 blanket.', needs: { grain: 1, blanket: 1 }, door: doors[4] },
        { label: 'Teal door', sign: 'A large family of six, with little this year: 3 grain, 2 blankets, 2 wood.', needs: { grain: 3, blanket: 2, wood: 2 }, door: doors[5] },
      ],
      outro: 'Lamps are lit in the homes that needed help, and smoke rises from their chimneys. The yellow-door family needed nothing, and that was fair too: fair did not mean the same for everyone.',
      reading: {
        title: 'Do good to parents, relatives, orphans, the needy, neighbours and travellers',
        refs: [[4, 36]],
        note: 'Allah tells us to do good to our parents, relatives, orphans, the needy, the near neighbour and the far neighbour, the companion at our side, and the traveller.',
      },
    },
    {
      id: 'return',
      kind: 'carry',
      requires: ['winter'],
      title: 'Return what was lost',
      goal: 'Find four lost things and return each to the right house',
      intro: 'Four things have been left around the village. Each one belongs to a family in a house with a coloured door. Find them and give them back.',
      adaptation: 'The lost things and their owners are a game idea about giving back what is owed (4:58).',
      loads: [
        { from: [-40, 22], to: doors[0], item: 'cloth', label: 'blue scarf', color: '#3f6f9a', dest: `to the house with the ${NAMES[0]} door` },
        { from: [36, -26], to: doors[2], item: 'pot', label: 'clay pot', dest: `to the house with the ${NAMES[2]} door` },
        { from: [-20, -40], to: doors[4], item: 'lamp', label: 'brass lamp', dest: `to the house with the ${NAMES[4]} door` },
        { from: [28, 30], to: doors[3], item: 'basket', label: 'woven basket', dest: `to the house with the ${NAMES[3]} door` },
      ],
    },
    {
      id: 'orphans',
      kind: 'read',
      requires: ['return'],
      at: [-12, 15],
      marker: 'lantern',
      title: 'Care for orphans',
      goal: 'Read at the lantern by the stalls',
      reading: {
        title: 'Give the orphans their property',
        refs: [[4, 2], [4, 5], [4, 6]],
        note: 'Children who have lost their parents must be given what is theirs. Those who look after their things must keep them safe, never swap good for bad, and speak to them kindly.',
      },
    },
    {
      id: 'justice',
      kind: 'read',
      requires: ['orphans'],
      at: [0, -11],
      marker: 'tablet',
      title: 'Stand firm for justice',
      goal: 'Read the stone by the bench',
      reading: {
        title: 'Stand firm for justice',
        refs: [[4, 135]],
        note: 'Be fair and tell the truth, even if it is against yourself, your parents or your relatives, and whether a person is rich or poor.',
      },
    },
  ],
  finale: {
    title: 'Trust and fairness',
    body: [
      'You shared the winter stores by need, and saw the lamps lit where help was needed. You gave back what was lost, and read about orphans and justice. An-Nisa asks us to be people others can trust.',
      'Being fair is not always easy, especially when it is about ourselves or the people we love. That is when it matters most.',
    ],
    ref: [4, 58],
    questions: ['Has someone ever trusted you with something? How did you look after it?', 'Why is it hard to be fair when it is about your own family?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No prophet is shown.', 'The villagers are not shown; their homes, needs and belongings are game ideas, not a real place.'],
};
