// Surah 7, Al-A'raf: the Path of Ancient Stories. Four regions around a
// central height, opened one after another:
//  1. Hall of Beginnings (7:11-27): readings, and a cloth activity about
//     "the clothing of righteousness". Paradise, angels and Iblees are not shown.
//  2. Shore and Cliffs (7:59-84): reading places for Nuh, Hud and Salih, and
//     drawing water for travellers. The destroyed peoples are only read about:
//     no ruins, no punishment is shown. A doorway leads to the Nuh's Ark slice.
//  3. Market of Madyan (7:85-93): give full measure, and sort fair trade.
//  4. Garden by the Sea (7:103-171): Musa's story in order, patience and mercy.
import * as THREE from 'three';
import { curve, type P2 } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, facing, near, passGate, polar, ridges, rolling } from './common';

const R = 62;
const at = (a: number, dr: number, da: number): P2 => near([R, a], dr, da);
const pt = ([x, z]: P2) => ({ x, z });
const RING: P2[] = curve([[0, 98], [0, 80], ...Array.from({ length: 19 }, (_, i) => polar(R, 90 + i * 15))]);

const MC = at(270, 4, 0);
const marketStalls: [P2, string, string][] = [
  [at(270, -6, -10), '#d8664a', 'red'],
  [at(270, 10, -10), '#3f7f8a', 'blue'],
  [at(270, 10, 10), '#c8a040', 'yellow'],
  [at(270, -6, 10), '#7a4a8a', 'purple'],
];
const SAND = new THREE.Color('#e4cc9c');
const sm = (t: number) => {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
};
const cliffs = (x: number, z: number) => {
  const a = ((Math.atan2(z, x) * 180) / Math.PI + 360) % 360;
  return sm((40 - Math.abs(a - 270)) / 14) * sm((Math.hypot(x, z) - 26) / 10);
};

export const W007: WorldDef = {
  surah: 7,
  name: 'Path of Ancient Stories',
  theme: 'Beginnings, the shore and the cliffs, a fair market, a garden by the sea',
  seed: 707,
  ground: {
    radius: 108,
    base: rolling({
      radius: 108,
      amp: 4,
      seed: 7,
      shapes: [
        { x: 0, z: 0, r: 38, h: 18 },
        ...ridges([{ a: 135, passR: R }, { a: 225, passR: R }, { a: 315, passR: R }, { a: 45 }]),
        // The western sea and the eastern bay.
        { ...pt(polar(100, 180)), r: 34, h: -13 },
        { ...pt(polar(102, 0)), r: 24, h: -12 },
        // Cliffs for the carved homes (Thamud, 7:74).
        { ...pt(at(180, -14, 20)), r: 10, h: 10 },
      ],
    }),
    palette: PAL.coast,
    paths: [RING],
    water: -3,
    shore: '#ecd8a8',
    flats: [{ ...pt(at(270, 2, 0)), r: 18, paint: '#e8d4aa' }, { ...pt(at(90, 2, 0)), r: 12 }, { ...pt(at(0, -2, 0)), r: 10 }],
    tint: (x, z, _y, c) => {
      const k = cliffs(x, z);
      if (k > 0) c.lerp(SAND, k * 0.75);
    },
  },
  look: LOOKS.sea,
  veg: {
    grass: 1,
    lush: (x, z) => 1 - cliffs(x, z) * 0.85,
    flowers: ['#fff2d8', '#f4d060', '#f6c0d0'],
    trees: [
      { kind: 'blossom', area: { x: 0, z: 76, r: 26 }, count: 6 },
      { kind: 'oak', area: { x: 0, z: 76, r: 26 }, count: 6 },
      { kind: 'palm', area: { x: -76, z: 0, r: 24 }, count: 8 },
      { kind: 'palm', area: { x: 0, z: -76, r: 26 }, count: 8 },
      { kind: 'olive', area: { x: 0, z: -76, r: 26 }, count: 4 },
      { kind: 'fig', area: { x: 74, z: 0, r: 22 }, count: 5 },
      { kind: 'blossom', area: { x: 74, z: 0, r: 22 }, count: 5 },
      { kind: 'cypress', area: { x: 74, z: 0, r: 22 }, count: 4 },
      { kind: 'pine', area: { x: 0, z: 0, r: 30 }, count: 12 },
    ],
    rocks: [{ x: 0, z: 0, n: 14, big: 2.2, spread: 40 }, { ...pt(at(180, -10, -18)), n: 8, big: 1.8, spread: 10 }],
    pebbles: 50,
    rim: ['oak', 'pine', 'palm'],
  },
  far: '#7c9450',
  mountains: { color: '#8a90b0', height: 1.1 },
  start: [0, 98],
  startYaw: Math.PI,
  regions: [
    { id: 'hall', name: 'Hall of Beginnings', at: polar(R + 10, 90) },
    { id: 'shore', name: 'Shore and Cliffs', at: polar(R + 10, 180) },
    { id: 'market', name: 'Market of Madyan', at: polar(R + 10, 270) },
    { id: 'garden', name: 'Garden by the Sea', at: polar(R + 10, 0) },
  ],
  structures: [
    { type: 'arch', x: 0, z: 88, w: 4, h: 4.2 },
    // 1. Hall of Beginnings
    { type: 'terrace', ...pt(at(90, 2, 0)), w: 12, d: 10, h: 0.3 },
    { type: 'columns', ...pt(at(90, 6, 0)), w: 11, n: 5, rot: Math.PI / 2 },
    { type: 'stall', ...pt(at(90, 12, -12)), rot: 0.3, color: '#5f8a9a', accent: '#f2e2c0' },
    { type: 'festoon', ...pt(at(90, -6, -8)), to: at(90, -6, 8), h: 3 },
    ...passGate(135, R, 'a3'),
    // 2. Shore and Cliffs
    { type: 'dock', ...pt(at(180, 14, 0)), to: at(180, 26, 0), w: 3 },
    { type: 'cliff', ...pt(at(180, -14, 26)), rot: Math.PI / 2, w: 14, h: 9, n: 3 },
    { type: 'well', ...pt(at(180, -4, -10)) },
    { type: 'tent', ...pt(at(180, -16, -6)), rot: 0.8 },
    { type: 'tent', ...pt(at(180, -10, 6)), rot: -0.4, color: '#7a5a3a' },
    ...passGate(225, R, 'b4'),
    // 3. Market of Madyan
    ...marketStalls.map(([p, c]) => ({ type: 'stall', x: p[0], z: p[1], rot: facing(p[0], p[1], MC[0], MC[1]).rot, color: c }) as Structure),
    { type: 'cart', ...pt(at(270, -12, 0)), rot: 0.2 },
    { type: 'house', ...pt(at(270, 20, -14)), rot: facing(...at(270, 20, -14), ...MC).rot, accent: '#3f6f9a' },
    { type: 'house', ...pt(at(270, 20, 14)), rot: facing(...at(270, 20, 14), ...MC).rot, accent: '#a04a3a' },
    { type: 'festoon', ...pt(at(270, 2, -10)), to: at(270, 2, 10), h: 3.6 },
    ...passGate(315, R, 'c3'),
    // 4. Garden by the Sea
    { type: 'dome', ...pt(at(0, 18, 0)), rot: -Math.PI / 2, w: 6, d: 5, h: 3.6, accent: '#4f8a8a' },
    { type: 'pool', ...pt(at(0, 4, -10)), w: 4 },
    { type: 'bed', ...pt(at(0, -4, 10)), w: 5, d: 2 },
    { type: 'bench', ...pt(at(0, 10, 8)), rot: 0 },
    { type: 'boat', ...pt(polar(100, 2)), rot: 1 },
  ],
  herds: [{ animal: 'camel', at: at(270, -14, -16), r: 5, n: 2 }, { animal: 'goat', at: at(180, -18, 14), r: 5, n: 3 }],
  links: [{ at: at(180, 6, 10), label: 'Play Nuh\'s Ark', href: '/ark', note: 'The Nuh\'s Ark adventure from Surah Hud' }],
  extras: { boats: [{ at: polar(96, 176), rot: 0.5 }, { at: polar(104, 186), rot: 2, color: '#3f6f8a' }] },
  welcome:
    'Welcome to the Path of Ancient Stories. Surah Al-A\'raf, "The Heights", tells the stories of many messengers and their peoples. Its four lands lie around the high hill: walk them in order, and each gate opens when you have finished the land before it.',
  tasks: [
    // 1. Hall of Beginnings
    {
      id: 'a1',
      kind: 'read',
      region: 'hall',
      at: at(90, 14, 6),
      marker: 'tablet',
      title: 'Created and given form',
      goal: 'Read the first stone in the Hall of Beginnings',
      reading: {
        title: 'We created you and gave you form',
        refs: [[7, 11], [7, 12]],
        note: 'Allah created people and gave them their form. Iblees refused to bow and said "I am better than him." Pride was his first mistake.',
      },
    },
    {
      id: 'a2',
      kind: 'read',
      requires: ['a1'],
      region: 'hall',
      at: at(90, 2, 4),
      marker: 'scroll',
      title: 'Our Lord, we have wronged ourselves',
      goal: 'Read at the lectern among the columns',
      reading: {
        title: 'A prayer for forgiveness',
        refs: [[7, 23]],
        note: 'When Adam and his wife made a mistake, they did not blame anyone else. They said: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy on us, we will be among the losers." Many children learn this prayer by heart.',
      },
    },
    {
      id: 'a3',
      kind: 'carry',
      requires: ['a2'],
      region: 'hall',
      title: 'The weaver\'s cloth',
      goal: 'Carry four folded cloths from the weaver\'s stall to the table by the gate',
      intro: 'Ayah 26 speaks of clothing as a gift: to cover us and to look beautiful. Then it says the best clothing is righteousness. Help the weaver carry the finished cloth.',
      adaptation: 'The weaver\'s stall is a game idea about 7:26.',
      loads: [0, 1, 2, 3].map((i) => ({ from: at(90, 12, -9), to: at(90, -8, -4 + i * 2.6), item: 'cloth', label: 'folded cloth', color: ['#b0503a', '#3f6f9a', '#c8a040', '#5f8a5a'][i], dest: 'to the cloth table by the gate' })),
      after: {
        title: 'The clothing of righteousness',
        refs: [[7, 26]],
        note: 'Allah gave people clothing to cover themselves and as adornment. But the clothing of righteousness, being good and mindful of Allah, is the best.',
      },
      outro: 'The gate to the Shore and Cliffs is open. Follow the path west.',
    },
    // 2. Shore and Cliffs
    {
      id: 'b1',
      kind: 'read',
      requires: ['a3'],
      region: 'shore',
      at: at(180, 8, -4),
      marker: 'tablet',
      title: 'Nuh and his people',
      goal: 'Read the stone by the shore',
      reading: {
        title: 'Nuh called his people',
        refs: [[7, 59], [7, 64]],
        note: 'Nuh (Noah) called his people to worship Allah alone. They rejected him, and Allah saved him and those with him in the ship. You can play the Nuh\'s Ark adventure through the doorway here.',
      },
    },
    {
      id: 'b2',
      kind: 'read',
      requires: ['b1'],
      region: 'shore',
      at: at(180, -6, 4),
      marker: 'tablet',
      title: 'Hud and the people of \'Aad',
      goal: 'Read the stone between the tents',
      reading: {
        title: 'To \'Aad, their brother Hud',
        refs: [[7, 65]],
        note: 'Allah sent Hud to the people of \'Aad with the same message: worship Allah, you have no god but Him.',
      },
    },
    {
      id: 'b3',
      kind: 'read',
      requires: ['b2'],
      region: 'shore',
      at: at(180, -12, 18),
      marker: 'tablet',
      title: 'Salih and the carved homes',
      goal: 'Read the stone below the cliffs',
      reading: {
        title: 'To Thamud, their brother Salih',
        refs: [[7, 73], [7, 74]],
        note: 'Thamud carved homes from the mountains. Salih reminded them to remember Allah\'s favours and not to spread corruption on the earth. The she-camel in these ayahs is not shown.',
      },
      adaptation: 'The carved cliff is a game picture of homes cut into rock; it is not a model of a real site, and no ruins or punishment are shown.',
    },
    {
      id: 'b4',
      kind: 'carry',
      requires: ['b3'],
      region: 'shore',
      title: 'Water for travellers',
      goal: 'Carry water from the well to the three resting places',
      adaptation: 'Drawing water for travellers is a peaceful game activity, not part of the stories.',
      loads: [at(180, -16, -3), at(180, -12, 3.5), at(180, 2, 12)].map((to, i) => ({ from: at(180, -4, -7.5), to, item: 'water', label: 'water jar', dest: `to resting place ${i + 1}` })),
      outro: 'The gate to the Market of Madyan is open. Follow the path north.',
    },
    // 3. Market of Madyan
    {
      id: 'c1',
      kind: 'read',
      requires: ['b4'],
      region: 'market',
      at: at(270, -16, 4),
      marker: 'tablet',
      title: 'Give full measure',
      goal: 'Read the stone at the market entrance',
      reading: {
        title: 'Shu\'ayb and the people of Madyan',
        refs: [[7, 85]],
        note: 'Shu\'ayb told the people of Madyan to worship Allah alone, to give full measure and weight, and not to cheat people of what is theirs.',
      },
    },
    {
      id: 'c2',
      kind: 'carry',
      requires: ['c1'],
      region: 'market',
      title: 'Full sacks',
      goal: 'Carry a full sack of grain to each stall',
      adaptation: 'Carrying full measures to the stalls is a game idea about 7:85.',
      loads: marketStalls.map(([p, , name]) => ({ from: at(270, -12, 3), to: facing(p[0], p[1], MC[0], MC[1], 2).door, item: 'grain', label: 'full sack of grain', dest: `to the ${name} stall` })),
    },
    {
      id: 'c3',
      kind: 'quiz',
      requires: ['c2'],
      region: 'market',
      at: at(270, 4, -3),
      marker: 'scroll',
      title: 'Fair trade?',
      goal: 'At the market lectern, sort fair trade from cheating',
      prompt: 'Is each card fair, or is it cheating?',
      game: {
        type: 'sort',
        bins: ['Fair', 'Cheating'],
        cards: [
          { text: 'Filling the measure right to the top.', bin: 0 },
          { text: 'Pressing a thumb on the scale.', bin: 1 },
          { text: 'Telling a buyer about the bruised fruit at the bottom.', bin: 0 },
          { text: 'Hiding stones in a sack of grain to make it heavier.', bin: 1 },
          { text: 'Charging the same price to a stranger as to a friend.', bin: 0 },
          { text: 'Giving a little less because the buyer is a child.', bin: 1 },
        ],
      },
      adaptation: 'Cards written for this game about 7:85.',
      outro: 'The gate to the Garden by the Sea is open. Follow the path east.',
    },
    // 4. Garden by the Sea
    {
      id: 'd1',
      kind: 'read',
      requires: ['c3'],
      region: 'garden',
      at: at(0, -12, -4),
      marker: 'tablet',
      title: 'Musa is sent',
      goal: 'Read the stone at the garden gate',
      reading: {
        title: 'Musa and Pharaoh',
        refs: [[7, 103], [7, 104]],
        note: 'After those peoples, Allah sent Musa (Moses) with signs to Pharaoh and his chiefs. Musa said: "I am a messenger from the Lord of the worlds."',
      },
    },
    {
      id: 'd2',
      kind: 'quiz',
      requires: ['d1'],
      region: 'garden',
      at: at(0, 2, -3),
      marker: 'scroll',
      title: 'In the order of the surah',
      goal: 'Put five ayahs about Musa in order',
      prompt: 'These ayahs tell part of Musa\'s story. Put them in the order they come in the surah.',
      game: { type: 'order', refs: [[7, 103], [7, 117], [7, 120], [7, 137], [7, 138]] },
      adaptation: 'An ordering game with the verified text. Nothing of the events is shown.',
    },
    {
      id: 'd3',
      kind: 'points',
      requires: ['d2'],
      region: 'garden',
      style: 'plant',
      verb: 'Water',
      title: 'Tend the garden by the sea',
      goal: 'Water the five plants in the garden',
      adaptation: 'Tending a garden is a game activity about patience (7:128).',
      points: [at(0, -6, 8), at(0, -2, 12), at(0, 8, -8), at(0, 12, 4), at(0, 0, -12)].map((p, i) => ({ at: p, label: `plant ${i + 1}` })),
      after: {
        title: 'Seek help through Allah and be patient',
        refs: [[7, 128]],
        note: 'Musa told his people: "Seek help through Allah and be patient. The earth belongs to Allah... and the best outcome is for the righteous."',
      },
    },
    {
      id: 'd4',
      kind: 'read',
      requires: ['d3'],
      region: 'garden',
      at: at(0, 14, -4),
      marker: 'lantern',
      title: 'Mercy that encompasses all things',
      goal: 'Read at the lantern by the domed hall',
      reading: {
        title: 'My mercy encompasses all things',
        refs: [[7, 156]],
        note: 'Allah says: "My mercy encompasses all things."',
      },
    },
  ],
  finale: {
    title: 'Stories to remember',
    body: [
      'You walked past the stories of many messengers: each called people to worship Allah alone and to be good and fair.',
      'You prayed the prayer of Adam, carried water for travellers, gave full measure in the market, and tended a garden with patience.',
    ],
    ref: [7, 23],
    questions: ['Which messenger\'s story would you like to read more about?', 'Why is "Our Lord, we have wronged ourselves" such a brave prayer?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown: not Adam, Nuh, Hud, Salih, Lut, Shu\'ayb, Musa or Harun.',
    'Angels, Iblees, Paradise and the she-camel are not pictured.',
    'The peoples who were destroyed are only read about. No ruins, flood or punishment is shown, and Lut\'s people are left to the book.',
    'The cliffs, market and garden are game places, not real sites.',
  ],
};
