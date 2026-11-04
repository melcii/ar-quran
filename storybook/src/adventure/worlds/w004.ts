// Surah 4, An-Nisa: the Village of Trust and Fairness. A village around a
// square with a well. Return lost things to their owners, share bread
// fairly, sweep the square, and sort what is fair from what is not.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, homes, rolling } from './common';

const C: P2 = [0, 0];
const ACC = ['#3f6f9a', '#3f7f5a', '#a04a3a', '#c8a040', '#7a4a8a', '#3f8a8a'];
const NAMES = ['blue', 'green', 'red', 'yellow', 'purple', 'teal'];
const { houses, doors } = homes(C, 21, 6, Math.PI / 6, ACC);

export const W004: WorldDef = {
  surah: 4,
  name: 'Village of Trust and Fairness',
  theme: 'Give back what is owed, share fairly, stand for justice',
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
      id: 'return',
      kind: 'carry',
      requires: ['trusts'],
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
      id: 'share',
      kind: 'carry',
      requires: ['orphans'],
      title: 'Fair shares',
      goal: 'Take one loaf from the bakery stall to every house',
      adaptation: 'Sharing bread equally is a game idea about fairness.',
      loads: doors.map((to, i) => ({ from: [9, 7] as P2, to, item: 'bread', label: 'loaf of bread', dest: `to the house with the ${NAMES[i]} door` })),
      after: {
        title: 'Stand firm for justice',
        refs: [[4, 135]],
        note: 'Be fair and tell the truth, even if it is against yourself, your parents or your relatives, and whether a person is rich or poor.',
      },
    },
    {
      id: 'sweep',
      kind: 'points',
      requires: ['share'],
      style: 'sweep',
      verb: 'Sweep',
      title: 'Care for the square',
      goal: 'Sweep the fallen leaves from the square',
      adaptation: 'Looking after shared places is a game idea.',
      points: [[-6, -12], [7, -13], [-14, 2], [14, 4], [-4, 14], [5, 15]].map((at, i) => ({ at: at as P2, label: `leaf pile ${i + 1}` })),
    },
    {
      id: 'fair',
      kind: 'quiz',
      requires: ['sweep'],
      at: [-3, 6],
      marker: 'scroll',
      title: 'Fair or not fair?',
      goal: 'At the lectern, sort what is fair from what is not',
      prompt: 'Read each card and choose where it belongs.',
      game: {
        type: 'sort',
        bins: ['Fair', 'Not fair'],
        cards: [
          { text: 'Giving back a ball you borrowed, in good shape.', bin: 0 },
          { text: 'Keeping a coin you know your friend dropped.', bin: 1 },
          { text: 'Cutting the bread so everyone gets the same.', bin: 0 },
          { text: 'Telling the truth, even when it shows your own mistake.', bin: 0 },
          { text: 'Swapping your broken toy for your cousin\'s new one when no one is looking.', bin: 1 },
          { text: 'Deciding a game fairly, even though one player is your best friend.', bin: 0 },
          { text: 'Saying something untrue so your team wins.', bin: 1 },
        ],
      },
      adaptation: 'The cards are written for this game, drawing on 4:2, 4:58 and 4:135.',
    },
  ],
  finale: {
    title: 'Trust and fairness',
    body: [
      'You gave back what was lost, shared the bread equally and looked after the square. An-Nisa asks us to be people others can trust.',
      'Being fair is not always easy, especially when it is about ourselves or the people we love. That is when it matters most.',
    ],
    ref: [4, 58],
    questions: ['Has someone ever trusted you with something? How did you look after it?', 'Why is it hard to be fair when it is about your own family?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No prophet is shown.', 'The villagers\' homes and belongings are game ideas, not a real place.'],
};
