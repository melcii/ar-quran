// Surah 5, Al-Ma'idah: the Table of Promises. A white-walled terrace town
// above the sea at noon, with a long shared table under strings of lamps.
// The core play is keeping commitments: read the promise board, make four
// promises, and keep each one at its place before its candle burns down (a
// promise kept late still counts, and the game says so honestly). A quiet
// olive grove is a separate reading place for the two sons of Adam
// (5:27-31), where nothing is shown. At the long table, three lamps hold the
// account of the disciples' request (5:112-115) in order, as narration and
// reading only. The table is a symbolic learning space, not the table sent
// down; 'Isa and the disciples are not shown.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const TABLE: P2 = [0, -6];
export const W005: WorldDef = {
  surah: 5,
  name: 'The Table of Promises',
  theme: 'Make promises, keep them in time, and be just',
  play: 'A commitments game: promise four things at the board, then plan your way round the town to keep each one before its candle burns down.',
  seed: 505,
  ground: {
    radius: 62,
    base: rolling({ radius: 62, amp: 3, seed: 5, shapes: [{ x: 32, z: -30, r: 18, h: 5 }, { x: -36, z: 30, r: 14, h: 3 }, { x: -10, z: -74, r: 46, h: -15 }] }),
    palette: PAL.dry,
    water: -3,
    shore: '#ecdcb0',
    paths: [curve([[0, 56], [-6, 36], [0, 18], [0, 4]]), curve([[0, 4], [18, -8], [30, -24]]), curve([[0, 4], [-18, 8], [-30, -6], [-36, -24]])],
    flats: [{ x: 0, z: -4, r: 14, paint: '#e6d6b0' }, { x: -24, z: 14, r: 8 }],
  },
  look: LOOKS.desert,
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
    { type: 'stall', x: -22, z: 12, rot: 0.6, color: '#2f6f9a' },
    { type: 'stall', x: -28, z: 18, rot: 0.9, color: '#3f7f8a' },
    { type: 'stall', x: -18, z: 20, rot: 0.2, color: '#c8a040' },
    { type: 'cart', x: 8, z: 12, rot: 0.4 },
    { type: 'well', x: -8, z: 14 },
    { type: 'pen', x: -36, z: 30, w: 10 },
    // White houses with blue doors round the terraces.
    ...[[-16, 2, 0.9], [14, 2, -0.9], [-12, -16, 0.5], [12, -16, -0.5], [20, 18, -2.2], [-30, 2, 1.4]].map(([x, z, r]) => ({ type: 'house' as const, x, z, rot: r, w: 6, d: 5, h: 3.4, color: '#f4efe4', accent: '#2f6f9a' })),
    { type: 'terrace', x: 0, z: -6, w: 16, d: 8, h: 0.3, color: '#f0e8d8' },
    { type: 'columns', x: 0, z: -11, w: 15, n: 6, rot: 0, color: '#f4efe4' },
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
      title: 'Fulfil your contracts',
      goal: 'Read the stone on the path',
      reading: {
        title: 'Fulfil all contracts',
        refs: [[5, 1]],
        note: 'The surah opens: "O you who have believed, fulfil all contracts." A promise is a trust: when we give our word, we keep it.',
      },
    },
    {
      id: 'vows',
      kind: 'promise',
      requires: ['contracts'],
      at: [3, 20],
      title: 'Four promises',
      goal: 'Read the promise board, make your promises, then keep each one before its candle burns down',
      intro: 'Notes on the board by the path ask for help. If you promise, a candle is lit for each one. Think about which to do first: the candles are not all the same length.',
      adaptation: 'The notes, the candles and the time limits are written for this game. Keeping a promise late still counts in the game; the point is to think before promising and to plan.',
      promises: [
        { label: 'fill the water jar at the well', at: [-5.5, 14], verb: 'Fill the water jar', secs: 75, done: 'The water jar is full.' },
        { label: 'take the borrowed bowl back to the blue stall', at: [-20, 9.5], verb: 'Give back the bowl', secs: 110, done: 'The bowl is back where it belongs.' },
        { label: 'close the gate of the sheepfold', at: [-30, 26], verb: 'Close the sheepfold gate', secs: 150, done: 'The sheep are safe for the night.' },
        { label: 'light the lamp at the head of the long table', at: [9.2, -6], verb: 'Light the table lamp', secs: 190, done: 'The lamp is lit for the meal.' },
      ],
      outro: 'Every promise is kept. Promising is easy; keeping a promise takes planning and effort.',
      after: {
        title: 'Cooperate in goodness',
        refs: [[5, 2]],
        note: 'Help one another in goodness and in being mindful of Allah, and do not help one another in wrongdoing and aggression.',
      },
    },
    {
      id: 'just',
      kind: 'read',
      requires: ['vows'],
      at: [-24, 15.5],
      marker: 'lantern',
      title: 'Be just',
      goal: 'Read at the lantern by the stalls',
      reading: {
        title: 'Be just: that is nearer to righteousness',
        refs: [[5, 8]],
        note: 'Stand firm for Allah and be fair witnesses. Do not let dislike of anyone stop you from being just. Being fair is nearest to righteousness.',
      },
    },
    {
      id: 'brothers',
      kind: 'read',
      requires: ['just'],
      at: [26, -20],
      marker: 'tablet',
      title: 'The two sons of Adam',
      goal: 'Walk down to the quiet olive grove and read there',
      reading: {
        title: 'The story of Adam\'s two sons',
        refs: [[5, 27], [5, 28], [5, 29], [5, 30], [5, 31]],
        note: 'Two brothers each made an offering. It was accepted from one and not the other, and the other let anger and envy lead him to a terrible wrong, and then to regret. Allah accepts from those who are mindful of Him. This is a story to read with an adult; nothing of it is shown here.',
      },
      adaptation: 'The grove is only a place for reading. Nothing of the story is acted out or shown.',
    },
    {
      id: 'spread',
      kind: 'points',
      requires: ['brothers'],
      style: 'lantern',
      ordered: true,
      verb: 'Light the lamp and read',
      title: 'The table spread',
      goal: 'At the long table, light the three lamps in order and read the account',
      intro: 'The surah is named after a table. At the long table on the terrace, three lamps hold its account in the Quran\'s order. This table is only a place to remember the account; it is not the table that was sent down.',
      adaptation: 'A narrated sequence of readings. The long table is a symbolic learning space, not a reconstruction of the table sent down. \'Isa and the disciples are not shown.',
      points: [
        { at: [-5, -3.6], label: 'the first lamp', reading: { title: 'The request', refs: [[5, 112]], note: 'The disciples asked \'Isa whether his Lord could send down to them a table spread with food from heaven. He told them to be mindful of Allah, if they were believers.' } },
        { at: [0, -3.6], label: 'the second lamp', reading: { title: 'Why they asked', refs: [[5, 113]], note: 'They said they wanted to eat from it, to have their hearts reassured, to know that he had told them the truth, and to be witnesses to it.' } },
        { at: [5, -3.6], label: 'the third lamp', reading: { title: 'The prayer, and the answer', refs: [[5, 114], [5, 115]], note: '\'Isa prayed: "Our Lord, send down to us a table from heaven, to be a festival for us and a sign from You, and provide for us; You are the best of providers." Allah said He would send it down, and warned those who would disbelieve afterwards.' } },
      ],
    },
  ],
  finale: {
    title: 'Promises and provision',
    body: [
      'You made four promises and kept them, planning your way round the town. You read about being just, about the two sons of Adam, and about the table the surah is named after.',
      'Al-Ma\'idah asks believers to keep their word, to cooperate in good and to be just, even with people they do not like.',
      'And it reminds us who the best of providers is.',
    ],
    ref: [5, 8],
    questions: ['What promise did you keep this week?', 'Why is it hard to be fair to someone you are upset with?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown, and \'Isa and his disciples do not appear.',
    'The table sent down from heaven is not pictured; the long table on the terrace is a symbolic learning space.',
    'The townspeople are not shown; the notes on the promise board are written for this game.',
    'The story of Adam\'s two sons is only read; nothing of it is shown.',
  ],
  extras: { motes: [{ at: TABLE, r: 9 }] },
};
