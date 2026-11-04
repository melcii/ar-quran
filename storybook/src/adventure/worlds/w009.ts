// Surah 9, At-Tawbah: the Valley of Return. An autumn valley where things have
// been left undone: belongings to give back, a broken path to repair, a
// neglected garden to bring back to life, and a hill lantern to read about
// those who turned back to Allah. Repentance is shown as putting things right.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, homes, rolling } from './common';

const PATH: P2[] = curve([[0, 56], [-8, 42], [-2, 28], [10, 16], [4, 2], [-10, -10], [-4, -24], [8, -36]]);
const { houses, doors } = homes([20, -6], 13, 4, Math.PI * 0.75, ['#3f6f9a', '#a04a3a', '#3f7f5a', '#c8a040']);
const NAMES = ['blue', 'red', 'green', 'yellow'];
const holes: P2[] = [[-6, 37], [-4, 31], [4, 22], [9, 13], [-3, -4], [-8, -12]];

export const W009: WorldDef = {
  surah: 9,
  name: 'Valley of Return',
  theme: 'Turning back: give back, repair and restore',
  seed: 909,
  ground: {
    radius: 60,
    base: rolling({ radius: 60, amp: 3.5, seed: 9, shapes: [{ x: 8, z: -40, r: 16, h: 6 }, { x: -32, z: 4, r: 14, h: 3 }, { x: 34, z: 30, r: 10, h: -6 }] }),
    palette: { ...PAL.autumn, lush: '#98a04a', deep: '#6a7a38', warm: '#d0a048' },
    paths: [PATH],
    water: -3,
    flats: [{ x: 20, z: -6, r: 16, paint: '#e0cca4' }, { x: -24, z: 24, r: 9 }],
  },
  look: { ...LOOKS.golden, hor: '#ffc89a', sunColor: '#ffc88a', fog: '#e8c4a4' },
  veg: {
    grass: 1,
    dryGrass: true,
    flowers: ['#f4a040', '#f4d060', '#fff2d8'],
    flowerDensity: 0.7,
    trees: [
      { kind: 'autumn', area: { x: 0, z: 0, r: 56 }, count: 18, size: [0.9, 1.3] },
      { kind: 'oak', area: { x: 0, z: 0, r: 56 }, count: 6 },
      { kind: 'fig', area: { x: -24, z: 24, r: 10 }, count: 2 },
      { kind: 'pine', area: { x: 8, z: -40, r: 14 }, count: 4 },
    ],
    rocks: [{ x: 8, z: -40, n: 8, big: 1.6, spread: 16 }, { x: -32, z: 4, n: 6, big: 1.4, spread: 12 }],
    pebbles: 40,
    rim: ['autumn', 'oak', 'pine'],
  },
  far: '#8a9448',
  mountains: { color: '#9a8ea8' },
  start: [0, 56],
  startYaw: Math.PI,
  structures: [
    ...houses,
    { type: 'well', x: 20, z: -6 },
    { type: 'fence', x: -32, z: 18, to: [-16, 18] },
    { type: 'fence', x: -32, z: 18, to: [-32, 30] },
    { type: 'bench', x: 6, z: -38, rot: 0.3 },
    { type: 'stones', x: 16, z: 32, n: 8 },
  ],
  herds: [{ animal: 'cow', at: [-34, -20], r: 7, n: 3 }, { animal: 'goat', at: [36, 20], r: 5, n: 3 }],
  welcome:
    'Welcome to the Valley of Return. Surah At-Tawbah, "The Repentance", is the only surah that does not begin with "In the name of Allah". It speaks of people who turned back to Allah after mistakes, and Allah accepted them. In this valley, turning back means putting things right.',
  tasks: [
    {
      id: 'accepts',
      kind: 'read',
      at: [4, 47],
      marker: 'tablet',
      title: 'He accepts repentance',
      goal: 'Read the first stone',
      reading: {
        title: 'Allah accepts repentance',
        refs: [[9, 102], [9, 104]],
        note: 'Some people admitted their mistakes: they had done good and also bad. Allah is Forgiving and Merciful, and He is the one who accepts repentance from His servants.',
      },
    },
    {
      id: 'return',
      kind: 'carry',
      requires: ['accepts'],
      title: 'Give back what was borrowed',
      goal: 'Return four borrowed things to their houses',
      intro: 'Some things were borrowed and never given back. Take each one home to the house with the right door.',
      adaptation: 'The borrowed things are a game idea about putting things right.',
      loads: [
        { from: [-26, 24], to: doors[0], item: 'basket', label: 'borrowed basket', dest: `to the house with the ${NAMES[0]} door` },
        { from: [-36, -6], to: doors[1], item: 'lamp', label: 'borrowed lamp', dest: `to the house with the ${NAMES[1]} door` },
        { from: [30, 30], to: doors[2], item: 'pot', label: 'borrowed pot', dest: `to the house with the ${NAMES[2]} door` },
        { from: [-14, -30], to: doors[3], item: 'cloth', label: 'borrowed blanket', color: '#b0503a', dest: `to the house with the ${NAMES[3]} door` },
      ],
    },
    {
      id: 'repair',
      kind: 'carry',
      requires: ['return'],
      result: 'patch',
      title: 'Repair the path',
      goal: 'Fill the six broken places in the path with flat stones',
      adaptation: 'Repairing the path is a game picture of mending what went wrong.',
      loads: holes.map((to, i) => ({ from: [14, 30] as P2, to, item: 'stone', label: 'flat stone', color: '#cdbf9f', dest: `to broken place ${i + 1}` })),
    },
    {
      id: 'garden',
      kind: 'points',
      requires: ['repair'],
      style: 'plant',
      verb: 'Water',
      title: 'Restore the garden',
      goal: 'Bring the neglected garden back to life',
      adaptation: 'Restoring a garden is a game picture of a fresh start.',
      points: [[-28, 22], [-24, 26], [-20, 22], [-28, 28], [-20, 28]].map((at, i) => ({ at: at as P2, label: `plant ${i + 1}` })),
    },
    {
      id: 'honest',
      kind: 'quiz',
      requires: ['garden'],
      at: [23, -1],
      marker: 'scroll',
      title: 'Honest or not?',
      goal: 'At the lectern by the well, sort the honest choices',
      prompt: 'Is each card honest, or not?',
      game: {
        type: 'sort',
        bins: ['Honest', 'Not honest'],
        cards: [
          { text: 'Saying "I broke it, I\'m sorry."', bin: 0 },
          { text: 'Blaming your little brother for your mess.', bin: 1 },
          { text: 'Giving back extra change the shopkeeper gave you by mistake.', bin: 0 },
          { text: 'Making up an excuse so you don\'t have to help.', bin: 1 },
          { text: 'Telling the truth, then doing your best to fix it.', bin: 0 },
          { text: 'Keeping quiet so someone else gets the blame.', bin: 1 },
        ],
      },
      adaptation: 'Cards written for this game, about 9:119.',
    },
    {
      id: 'three',
      kind: 'read',
      requires: ['honest'],
      at: [10, -38],
      marker: 'lantern',
      title: 'Be with the truthful',
      goal: 'Climb the hill and read at the lantern',
      reading: {
        title: 'The three who were left behind',
        refs: [[9, 117], [9, 118], [9, 119]],
        note: 'Three believers stayed behind when they should have gone, and they told the truth about it. They felt the wide earth close in on them, until they knew there was no refuge from Allah except in Him. Then Allah turned to them, so they could repent. "Be with those who are true."',
      },
    },
  ],
  finale: {
    title: 'Turning back',
    body: [
      'You gave back what was borrowed, mended the path and the garden, and chose honesty.',
      'At-Tawbah teaches that the door to Allah stays open: when we make mistakes, we can be truthful, say sorry, put things right, and turn back to Him.',
    ],
    ref: [9, 119],
    questions: ['Why does telling the truth about a mistake take courage?', 'What is one thing you could put right this week?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown, and no companion appears.',
    'Battles and campaigns mentioned in the surah are not shown.',
    'The valley and its people are game ideas, not a real place.',
  ],
};
