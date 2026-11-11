// Surah 108, Al-Kawthar (Abundance): the Walled Garden. A walled garden in
// late winter, with a stone channel of running water, bare beds and an old
// fig tree that needs pruning before spring. "Indeed, We have given you
// al-Kawthar. So pray to your Lord and sacrifice. Indeed, your enemy is the
// one cut off" (108:1-3). The core play: prune the fig the way gardeners
// do, cutting the dead wood and the branches growing inward, and keeping
// the healthy branches that will bear fruit. Al-Kawthar itself is never
// pictured: the garden is not a picture of it.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W108: WorldDef = {
  surah: 108,
  name: 'The Walled Garden',
  theme: 'Prune the old fig tree: cut what gives nothing, keep what will bear fruit',
  play: 'In a walled garden in late winter, the old fig tree needs pruning before spring. Look closely at each branch: cut away the dead wood and the branches growing inward across the middle, and leave the healthy branches with buds, which will bear the figs.',
  seed: 10808,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 0.4, seed: 108, streams: [{ pts: [[-20, -14], [-6, -8], [6, -8], [20, -14]], w: 1.4, depth: 0.5 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 32], [4, 22], [0, 12], [0, 4]])],
    flats: [{ x: 0, z: 0, r: 6, paint: '#a89070' }, { x: 4, z: 22, r: 3 }, { x: -12, z: 8, r: 3 }],
  },
  look: { ...LOOKS.morning, sunI: 2.2 },
  veg: {
    grass: 0.7,
    flowers: ['#f8f0d0'],
    trees: [{ kind: 'olive', at: [[-10, -2], [12, 4]] }, { kind: 'cypress', at: [[-8, 14], [8, 14]] }],
    rocks: [],
    pebbles: 8,
    rim: ['cypress'],
  },
  far: '#9aa890',
  mountains: { color: '#9a98a8', height: 0.7 },
  start: [0, 32],
  startYaw: Math.PI,
  structures: [
    { type: 'wall', x: -14, z: -16, to: [14, -16], h: 2.4, color: '#c8b898' },
    { type: 'wall', x: -14, z: -16, to: [-14, 16], h: 2.4, color: '#c8b898' },
    { type: 'wall', x: 14, z: -16, to: [14, 16], h: 2.4, color: '#c8b898' },
    { type: 'bench', x: 4, z: 3, rot: -0.4 },
  ],
  welcome:
    'Welcome to the Walled Garden. Surah Al-Kawthar is the shortest surah in the Quran: three ayahs. It speaks of a great gift, and of the one who is cut off. Today, in late winter, the old fig tree needs pruning.',
  tasks: [
    {
      id: 'given',
      kind: 'read',
      at: [4, 22],
      marker: 'sign',
      title: 'We have given you',
      goal: 'Read at the sign by the garden gate',
      adaptation: 'Al-Kawthar is read only, never pictured; the Prophet, who is addressed, is never shown.',
      reading: { title: 'We have given you', refs: [[108, 1]], note: 'Indeed, We have given you al-Kawthar.' },
    },
    {
      id: 'fig',
      kind: 'prune',
      requires: ['given'],
      at: [0, -1],
      branches: [
        { name: 'branch 1', is: 'fruiting' },
        { name: 'branch 2', is: 'dead' },
        { name: 'branch 3', is: 'fruiting' },
        { name: 'branch 4', is: 'crossing' },
        { name: 'branch 5', is: 'fruiting' },
        { name: 'branch 6', is: 'dead' },
        { name: 'branch 7', is: 'crossing' },
        { name: 'branch 8', is: 'fruiting' },
      ],
      title: 'What is cut off',
      goal: 'Prune the fig tree: cut the dead wood and the inward-crossing branches, and keep the healthy ones',
      intro: 'Grey and bare is dead. Growing inward, across the middle, is crossing. Buds mean figs.',
      adaptation: 'The garden is a game; it is not a picture of al-Kawthar. Pruning dead and crossing wood from a fig tree is real.',
      outro: 'The fig tree stands open and clean, ready for spring.',
      after: { title: 'Pray and sacrifice', refs: [[108, 2], [108, 3]], note: 'So pray to your Lord and sacrifice. Indeed, your enemy is the one cut off.' },
    },
    {
      id: 'kawthar',
      kind: 'read',
      requires: ['fig'],
      at: [-12, 8],
      marker: 'tablet',
      title: 'The whole surah',
      goal: 'Read at the tablet by the garden wall',
      reading: { title: 'The whole surah', refs: [[108, 1], [108, 2], [108, 3]], note: 'Indeed, We have given you al-Kawthar. So pray to your Lord and sacrifice. Indeed, your enemy is the one cut off.' },
    },
  ],
  finale: {
    title: 'Abundance',
    body: ['What gave nothing was cut away, and the tree’s strength went to the branches that will bear fruit.', 'Surah Al-Kawthar speaks of a great gift of abundance, and says it is the enemy who is cut off.'],
    ref: [108, 1],
    questions: ['How could you tell a dead branch from a living one?', 'What are you thankful for? How could you show it in prayer?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Al-Kawthar is read only, never pictured.', 'The Prophet, addressed in this surah, is never shown.'],
};
