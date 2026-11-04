// Surah 14, Ibrahim: the Roots of Faith. A dry valley with a spring and a
// resting place for travellers, inspired by Ibrahim's prayer for a valley
// without crops (14:37); it is not a picture of Makkah, and the Ka'bah is not
// shown. The core play is the parable of 14:24-26: find firm ground for a
// young tree (sandy ground gives it no stability), carry water to its roots,
// choose good words to raise its branches, and gather fruit season after
// season for travellers. A loose sapling on the sand blows over for
// comparison.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W014: WorldDef = {
  surah: 14,
  name: 'The Roots of Faith',
  theme: 'Grow the good tree of the parable on firm ground, and share its fruit',
  play: 'A growing world: test the ground and plant on firm soil, carry water to deepen the roots, choose good words to raise the branches, then carry fruit to the travellers\' rest season after season.',
  seed: 1414,
  ground: {
    radius: 60,
    base: rolling({
      radius: 60,
      amp: 3,
      seed: 14,
      shapes: [
        { x: -34, z: 10, r: 20, h: 7 },
        { x: 34, z: 20, r: 18, h: 6 },
        { x: -24, z: -4, r: 6, h: 1.2 },
      ],
    }),
    palette: PAL.desert,
    paths: [curve([[0, 52], [2, 36], [4, 20], [6, 6], [0, -10], [14, -12], [20, -10]]), curve([[0, -10], [-6, -14]])],
    flats: [{ x: 22, z: -12, r: 7, paint: '#e8d4a8' }],
  },
  look: { ...LOOKS.golden, sunI: 3.3, clouds: 0.5 },
  veg: {
    grass: 0.5,
    dryGrass: true,
    flowers: ['#f4e0b0'],
    trees: [{ kind: 'palm', at: [[-8, -18], [-3, -19], [26, -18]] }],
    rocks: [{ x: -34, z: 10, n: 14, big: 2, spread: 24 }, { x: 34, z: 20, n: 12, big: 1.8, spread: 20 }],
    pebbles: 50,
    rim: false,
    lush: (x, z) => (Math.hypot(x + 6, z + 14) < 8 ? 1 : 0.15),
  },
  far: '#c8a878',
  mountains: { color: '#a08a78', height: 1.2 },
  start: [0, 50],
  startYaw: Math.PI,
  structures: [
    { type: 'tent', x: 26, z: -6, rot: -0.8, color: '#d8c8a8' },
    { type: 'tent', x: 18, z: -18, rot: 0.6, color: '#c8a888' },
    { type: 'rug', x: 22, z: -12, w: 2.6, d: 1.8, color: '#9a3a2e' },
  ],
  welcome:
    'Welcome to the Roots of Faith. This dry valley is where you will grow a tree: not any tree, but the good tree of a parable in Surah Ibrahim. Read the parable at the first stone.',
  tasks: [
    {
      id: 'parable',
      kind: 'read',
      at: [3, 38],
      marker: 'tablet',
      title: 'The parable',
      goal: 'Read the first stone',
      reading: {
        title: 'A good word is like a good tree',
        refs: [[14, 24], [14, 25]],
        note: 'Allah gives an example: a good word is like a good tree. Its root is firm and its branches reach into the sky, and it gives its fruit at every time, by permission of its Lord.',
      },
    },
    {
      id: 'tree',
      kind: 'grow',
      requires: ['parable'],
      title: 'The good tree',
      goal: 'Plant on firm ground, water the roots, choose good words, then share the fruit',
      intro: 'Here is a young tree to plant. Some of this ground is firm soil and some is loose sand. Try the marked places and plant where the ground is firm.',
      adaptation: 'Growing a tree from words is a picture made for this game; the good words are examples written for this app, not part of the ayahs. The parable itself is read from the verified text.',
      spots: [
        { at: [-10, 8], firm: false, label: 'the sandy hollow', why: 'The sand here is loose. It slides away under your hand: a tree here would have nothing to hold on to.' },
        { at: [8, 4], firm: true, label: 'the dark soil', why: '' },
        { at: [16, 12], firm: false, label: 'the dune edge', why: 'This is the edge of a dune. The wind moves this sand every day; roots could not hold here.' },
      ],
      spring: [-6, -14],
      waters: 3,
      words: [
        { text: 'Thank you', good: true, why: 'Thanking people, and Allah, is a good word.' },
        { text: 'Bismillah', good: true, why: 'Starting with the name of Allah is a good word.' },
        { text: 'I am sorry, I was wrong', good: true, why: 'Owning up to a mistake is brave and true.' },
        { text: 'Can I help you carry that?', good: true, why: 'Offering help is a kind word.' },
        { text: 'It was not me, it was him', good: false, why: 'Blaming someone else for what you did is not a good word. It has no roots in the truth.' },
        { text: 'You cannot play with us', good: false, why: 'Leaving someone out on purpose hurts. That word would not help anything grow.' },
        { text: 'A small lie, so I do not get in trouble', good: false, why: 'A lie has no firm ground under it. Sooner or later it falls over.' },
      ],
      seasons: [
        { label: 'spring', fruit: 'first fruit', color: '#e8a040' },
        { label: 'summer', fruit: 'ripe fruit', color: '#d0602a' },
        { label: 'autumn', fruit: 'last fruit', color: '#a8402a' },
      ],
      share: [21, -10],
      loose: [-24, -4],
      readings: {
        firm: { title: 'Its root is firm', refs: [[14, 24]], note: 'The good tree\'s root is firmly fixed, and its branches are high in the sky.' },
        loose: { title: 'No stability', refs: [[14, 26]], note: 'And a bad word is like a bad tree, pulled up from the surface of the earth, with no stability.' },
        fruit: { title: 'Fruit at every time', refs: [[14, 25]], note: 'It gives its fruit at every time, by permission of its Lord. Allah gives examples so that people will remember.' },
      },
      outro: 'Three seasons, and the tree has given fruit each time. The travellers have found food in a valley where nothing grew.',
    },
    {
      id: 'prayer',
      kind: 'read',
      requires: ['tree'],
      at: [24, -14],
      marker: 'lantern',
      title: "Ibrahim's prayer",
      goal: "Read Ibrahim's prayer at the travellers' rest",
      reading: {
        title: 'A valley without crops',
        refs: [[14, 35], [14, 37]],
        note: 'Ibrahim prayed for the city to be safe, and said: I have settled some of my family in a valley without crops, near Your sacred House, so that they may pray. Make people\'s hearts turn to them, and provide them with fruits, so that they may be grateful.',
      },
      adaptation: 'This valley is not a picture of Makkah; the Ka\'bah and Ibrahim\'s family are not shown.',
    },
    {
      id: 'thanks',
      kind: 'read',
      requires: ['prayer'],
      at: [6, 0],
      marker: 'tablet',
      title: 'Gratitude',
      goal: 'Go back to your tree',
      reading: {
        title: 'If you are grateful',
        refs: [[14, 7]],
        note: 'Your Lord said: if you are grateful, I will surely give you more.',
      },
    },
  ],
  finale: {
    title: 'Firm roots, high branches',
    body: [
      'You planted on firm ground, watered the roots, chose good words for the branches, and shared the fruit with travellers season after season.',
      'The parable says a good word is like that tree: firm underneath, reaching high, and giving all the time.',
    ],
    ref: [14, 24],
    questions: ['What is one good word you could say today?', 'Who could you share something with this week?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown: Ibrahim and his family never appear; his prayer is read only.',
    'The valley is inspired by 14:37 and is not a reconstruction of Makkah. The Ka\'bah is not shown.',
    'The tree is a picture of the parable made for this game, not a real tree from history.',
  ],
};
