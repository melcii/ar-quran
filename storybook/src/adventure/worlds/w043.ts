// Surah 43, Az-Zukhruf (Ornaments of Gold): the Street of Ornaments. A
// bright street lined with shining things: a silver door, silver stairs, a
// silver couch, a gold ornament (43:33-35 names silver roofs, stairways,
// doors and couches, and gold ornament). Around the street are real needs: a
// dry garden bed, a dark path, a cold shelter, an empty seed store. The core
// play: carry things to the needs. Gold and silver shine, but they meet no
// need; each need is met only by the plain thing that helps, and "all that
// is only the enjoyment of worldly life". Ibrahim's word to his people
// (43:26-28) is a reading at the edge of town. No one is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W043: WorldDef = {
  surah: 43,
  name: 'The Street of Ornaments',
  theme: 'Gold and silver shine, but only useful things meet a real need',
  play: 'The street is full of shining silver and gold, and plain things lie in a shed. Four needs wait around the street: a dry garden, a dark path, a cold shelter and an empty seed store. Pick up a thing and bring it to a need. Only the thing that really helps is accepted.',
  seed: 4343,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.1, seed: 43 }),
    palette: PAL.dry,
    paths: [curve([[0, 40], [0, 20], [0, 0], [0, -24]]), curve([[0, 8], [-16, 12], [-18, 18]]), curve([[0, -6], [-14, -10], [-18, -12]]), curve([[0, 8], [14, 12], [18, 16]]), curve([[0, -6], [10, -12], [16, -20], [22, -28]])],
    flats: [
      { x: 0, z: 14, r: 5, paint: '#e8dcc4' },
      { x: 6, z: 2, r: 5 },
      { x: -18, z: -12, r: 4 },
      { x: -18, z: 19, r: 4 },
      { x: 19, z: 17, r: 4 },
      { x: -7, z: 30, r: 3 },
    ],
  },
  look: { ...LOOKS.golden, sunI: 3.1 },
  veg: {
    grass: 0.5,
    flowers: ['#e8c060', '#fff2d8'],
    trees: [{ kind: 'cypress', at: [[-5, 22], [5, 22], [-5, -2], [5, -14]] }, { kind: 'oak', at: [[14, -14], [18, -24], [22, -18], [12, -22]] }],
    rocks: [{ x: -30, z: -26, n: 4, big: 1, spread: 6 }],
    pebbles: 18,
    rim: ['cypress', 'olive'],
  },
  far: '#c0a878',
  mountains: { color: '#b0a090', height: 0.7 },
  start: [0, 40],
  startYaw: Math.PI,
  structures: [
    // The shining street: a showcase terrace with silver and gold set out on it.
    { type: 'terrace', x: 6, z: 2, w: 6, d: 5, h: 0.3, color: '#e8dcc4' },
    { type: 'columns', x: 6, z: 5, w: 6, n: 3, color: '#f0e6d0' },
    { type: 'festoon', x: 2, z: 6, to: [10, 6] },
    // A plain shed with useful things.
    { type: 'stall', x: -7, z: 30, rot: 0.2, color: '#8a6a44' },
    // The needs: a garden bed, a shelter, a seed store; the dark path runs under the oaks.
    { type: 'fence', x: -21, z: -15, to: [-15, -15] },
    { type: 'tent', x: -19, z: 21, rot: 0.6, color: '#a89070' },
    { type: 'cart', x: 21, z: 18, rot: -0.6 },
  ],
  welcome:
    'Welcome to the Street of Ornaments. Surah Az-Zukhruf means Ornaments of Gold. It says that silver and gold are only the enjoyment of this world, and that what lasts is with Allah. Walk down the shining street.',
  tasks: [
    {
      id: 'book',
      kind: 'read',
      at: [3, 32],
      marker: 'sign',
      title: 'The clear Book',
      goal: 'Read at the sign at the top of the street',
      reading: { title: 'That you might understand', refs: [[43, 2], [43, 3]], note: 'By the clear Book: We have made it an Arabic Quran so that you might understand.' },
    },
    {
      id: 'needs',
      kind: 'adorn',
      requires: ['book'],
      title: 'Gold or good',
      goal: 'Bring something to each of the four needs around the street: what really helps, not what shines',
      intro: 'Four needs wait around the street. Silver and gold shine on the terrace; plain things lie in the shed at the top of the street. Pick something up and bring it to a need.',
      adaptation: 'The street, the shed and the four needs are a game idea based on 43:33-35, which names silver roofs, stairs, doors and couches, and gold ornament, and calls them only the enjoyment of worldly life.',
      items: [
        { at: [4, 1], name: 'silver door', gold: true, shape: 'door' },
        { at: [8, 3], name: 'silver couch', gold: true, shape: 'couch' },
        { at: [6, -1], name: 'silver stairs', gold: true, shape: 'stair' },
        { at: [9, 0], name: 'gold ornament', gold: true, shape: 'ornament' },
        { at: [-9, 28], name: 'water jar', gold: false, shape: 'jar' },
        { at: [-6, 27.5], name: 'oil lamp', gold: false, shape: 'lamp' },
        { at: [-8, 32], name: 'wool blanket', gold: false, shape: 'blanket' },
        { at: [-5, 31], name: 'sack of seeds', gold: false, shape: 'seeds' },
      ],
      needs: [
        { at: [-16, -11], name: 'the dry garden bed', item: 4, done: 'The water soaks in. The garden bed will live.' },
        { at: [15, -17], name: 'the dark path', item: 5, done: 'The lamp lights the path under the oaks; no one will trip now.' },
        { at: [-16, 18], name: 'the cold shelter', item: 6, done: 'The blanket makes the shelter warm for the night.' },
        { at: [18, 14], name: 'the empty seed store', item: 7, done: 'Seeds for next year’s sowing. The store is ready.' },
      ],
      outro: 'Every need is met, and not one of them by gold or silver.',
      after: { title: 'Only the enjoyment of worldly life', refs: [[43, 33], [43, 34], [43, 35]], note: 'Silver roofs and stairways, silver doors and couches, and gold ornament: all that is only the enjoyment of this worldly life. And the Hereafter with your Lord is for those who are mindful of Him.' },
    },
    {
      id: 'ibrahim',
      kind: 'read',
      requires: ['needs'],
      at: [-2, -20],
      marker: 'tablet',
      title: 'A word that remains',
      goal: 'Read at the tablet at the far end of the street',
      adaptation: 'Ibrahim is not shown; these ayahs are read only.',
      reading: { title: 'A lasting word', refs: [[43, 26], [43, 27], [43, 28]], note: 'Ibrahim said to his father and his people: "I have nothing to do with what you worship, except the One who created me: He will guide me." And he made it a word that would remain among his descendants.' },
    },
    {
      id: 'roads',
      kind: 'read',
      requires: ['ibrahim'],
      at: [3, -8],
      marker: 'lantern',
      title: 'Roads and rain',
      goal: 'Read at the lantern on the street',
      reading: { title: 'Roads to guide you', refs: [[43, 10], [43, 11]], note: 'He made the earth a resting place for you, and made roads on it so that you can find your way. He sends down rain from the sky in measure, and brings dead land back to life with it.' },
    },
  ],
  finale: {
    title: 'What really helps',
    body: ['Silver and gold shone on the terrace, but the garden, the path, the shelter and the store needed plain, useful things.', 'Surah Az-Zukhruf says ornaments are only the enjoyment of this world, and what lasts is with Allah.'],
    ref: [43, 35],
    questions: ['Which shining thing did you try first?', 'What useful thing at home helps your family the most?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Ibrahim and Isa (43:63) are never shown.'],
};
