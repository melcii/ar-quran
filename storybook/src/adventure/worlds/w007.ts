// Surah 7, Al-A'raf: the Lost Civilizations. An episodic journey in four
// chapters through red-rock country around a high hill, each chapter opening
// the next:
//  1. The broken columns (7:59-72): the stories of Nuh and Hud. Look closely
//     at traces in the land; each trace says what the Quran tells and what is
//     only this game's picture. A doorway leads to the Nuh's Ark adventure.
//  2. The carved cliffs and the salt shore (7:73-84): Salih and Thamud, who
//     carved homes from the mountains; then a quiet reading place for Lut.
//  3. The market of Madyan (7:85-93): weigh goods at a balance, and notice the
//     shaved weight (Shu'ayb's message of full measure and weight).
//  4. The shore of Musa (7:103-156): traces of Musa's story in order, and mercy.
// No prophet is shown; no destruction, flood or punishment is shown; the
// ruins and cliffs are artistic, not models of real sites.
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
  name: 'The Lost Civilizations',
  theme: 'Four chapters of peoples before us, in red-rock country',
  play: 'An episodic journey: four chapters, each a different land, where you investigate traces of past peoples (each one says what the Quran tells and what is only a picture) and, in Madyan, weigh fairly at a balance.',
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
    palette: { lush: '#a89a5a', deep: '#86804a', warm: '#c89a64', path: '#e2c49a', sand: '#e8cc9c', rock: '#b07858' },
    paths: [RING],
    water: -3,
    shore: '#ecd8a8',
    flats: [{ ...pt(at(270, 2, 0)), r: 18, paint: '#e8d4aa' }, { ...pt(at(90, 2, 0)), r: 12 }, { ...pt(at(0, -2, 0)), r: 10 }],
    tint: (x, z, _y, c) => {
      const k = cliffs(x, z);
      if (k > 0) c.lerp(SAND, k * 0.75);
    },
  },
  look: { ...LOOKS.desert, hor: '#f6c8a0', fog: '#e8c8a8', sunColor: '#ffe0b8' },
  veg: {
    grass: 1,
    lush: (x, z) => 0.55 - cliffs(x, z) * 0.45,
    dryGrass: true,
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
    { id: 'hall', name: 'Chapter 1 · The broken columns', at: polar(R + 10, 90) },
    { id: 'shore', name: 'Chapter 2 · The carved cliffs', at: polar(R + 10, 180) },
    { id: 'market', name: 'Chapter 3 · The market of Madyan', at: polar(R + 10, 270) },
    { id: 'garden', name: 'Chapter 4 · The shore of Musa', at: polar(R + 10, 0) },
  ],
  structures: [
    { type: 'arch', x: 0, z: 88, w: 4, h: 4.2 },
    // 1. The broken columns
    { type: 'terrace', ...pt(at(90, 2, 0)), w: 14, d: 10, h: 0.3, color: '#d8b894' },
    { type: 'columns', ...pt(at(90, 6, 0)), w: 11, n: 5, rot: Math.PI / 2, color: '#d8b48a' },
    { type: 'columns', ...pt(at(90, -2, -10)), w: 8, n: 3, rot: 0.4, color: '#c8a07a' },
    { type: 'stones', ...pt(at(90, 12, -12)), n: 6 },
    { type: 'stones', ...pt(at(90, -8, 14)), n: 5 },
    ...passGate(135, R, 'a2'),
    // 2. Shore and Cliffs
    { type: 'cliff', ...pt(at(180, -14, 26)), rot: Math.PI / 2, w: 14, h: 9, n: 3, color: '#c88a62' },
    { type: 'cliff', ...pt(at(180, -20, 12)), rot: Math.PI / 2 + 0.5, w: 10, h: 8, n: 2, color: '#b87a58' },
    { type: 'stones', ...pt(at(180, 18, -8)), n: 5 },
    { type: 'well', ...pt(at(180, -4, -10)) },
    { type: 'tent', ...pt(at(180, -16, -6)), rot: 0.8 },
    { type: 'tent', ...pt(at(180, -10, 6)), rot: -0.4, color: '#7a5a3a' },
    ...passGate(225, R, 'b2'),
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
  links: [{ at: at(90, -2, 6), label: 'Play Nuh\'s Ark', href: '/ark', note: 'The Nuh\'s Ark adventure from Surah Hud' }],
  extras: { boats: [{ at: polar(96, 176), rot: 0.5 }, { at: polar(104, 186), rot: 2, color: '#3f6f8a' }] },
  welcome:
    'Welcome to the Path of Ancient Stories. Surah Al-A\'raf, "The Heights", tells the stories of many messengers and their peoples. Its four lands lie around the high hill: walk them in order, and each gate opens when you have finished the land before it.',
  tasks: [
    // Chapter 1. The broken columns: Nuh and Hud.
    {
      id: 'a1',
      kind: 'read',
      region: 'hall',
      at: at(90, 14, 6),
      marker: 'tablet',
      title: 'Nuh calls his people',
      goal: 'Read the first stone of the journey',
      intro: 'Chapter 1. Al-A\'raf tells of peoples who came before us, one after another, and how each answered the messenger sent to them. Read, then look closely at the traces in this land.',
      reading: {
        title: 'Nuh called his people',
        refs: [[7, 59], [7, 64]],
        note: 'Nuh (Noah) called his people to worship Allah alone. They denied him, and Allah saved him and those with him in the ship. The doorway on this terrace leads to the Nuh\'s Ark adventure.',
      },
    },
    {
      id: 'a2',
      kind: 'points',
      requires: ['a1'],
      region: 'hall',
      style: 'sign',
      verb: 'Look closely',
      title: 'Traces of \'Aad',
      goal: 'Look closely at the three traces among the broken columns',
      intro: 'After Nuh\'s people came \'Aad, and Allah sent them their brother Hud. Look closely at three traces here. Each one tells you what the Quran says, and what is only a picture.',
      adaptation: 'The columns and stones are this game\'s picture of a people long gone, not a model of \'Aad or any real site.',
      points: [
        { at: at(90, 4, -6), label: 'the tall broken columns', reading: { title: 'Successors after Nuh', refs: [[7, 69]], note: 'From the Quran: Hud reminded \'Aad that Allah made them successors after the people of Nuh and increased them in stature. The tall columns here are only a picture of a strong people.' } },
        { at: at(90, 12, -9), label: 'the fallen stones', reading: { title: 'Hud\'s message', refs: [[7, 65]], note: 'From the Quran: Hud told his people, "Worship Allah; you have no deity other than Him. Will you not fear Him?" The fallen stones are only a picture.' } },
        { at: at(90, -8, 11), label: 'the empty terrace', reading: { title: 'What they answered', refs: [[7, 70], [7, 72]], note: 'From the Quran: they refused to leave what their fathers worshipped, and Allah saved Hud and those with him by mercy. Nothing of what happened to the others is shown.' } },
      ],
      outro: 'The gate to Chapter 2, the carved cliffs, is open. Follow the path west.',
    },
    // Chapter 2. The carved cliffs and the salt shore: Salih, then Lut.
    {
      id: 'b1',
      kind: 'points',
      requires: ['a2'],
      region: 'shore',
      style: 'sign',
      ordered: true,
      verb: 'Look closely',
      title: 'The carved cliffs',
      goal: 'Look closely at the traces below the carved cliffs, in order',
      intro: 'Chapter 2. To Thamud, Allah sent their brother Salih. Thamud carved homes from the mountains. Look closely at the traces here, in order.',
      adaptation: 'The carved cliffs are this game\'s picture of homes cut into rock. They are not a model of a real site, and no ruins of punishment are shown. The she-camel in these ayahs is not shown.',
      points: [
        { at: at(180, -6, 16), label: 'the carved doorways', reading: { title: 'Homes carved from the mountains', refs: [[7, 73], [7, 74]], note: 'From the Quran: Salih called Thamud to worship Allah alone, and reminded them that they built palaces on the plains and carved homes from the mountains. The doorways here are only a picture.' } },
        { at: at(180, -12, 4), label: 'the second cliff', reading: { title: 'The proud and the weak', refs: [[7, 75], [7, 76]], note: 'From the Quran: the arrogant chiefs mocked those who believed. The believers answered, "We believe in what he was sent with."' } },
        { at: at(180, 6, 12), label: 'the quiet hollow', reading: { title: 'Salih turned away', refs: [[7, 79]], note: 'From the Quran: Salih turned away from them, saying he had conveyed his Lord\'s message and advised them sincerely, but they did not like sincere advisers. What happened to them is only read.' } },
      ],
    },
    {
      id: 'b2',
      kind: 'read',
      requires: ['b1'],
      region: 'shore',
      at: at(180, 18, -4),
      marker: 'tablet',
      title: 'Lut and his people',
      goal: 'Read at the stone on the salt shore',
      reading: {
        title: 'And Lut, when he said to his people',
        refs: [[7, 80], [7, 83]],
        note: 'Allah sent Lut to his people, who did a shameful thing no people had done before. Allah saved Lut and his family, except his wife. This place is only for reading; the full account is in the book, to be read with an adult.',
      },
      adaptation: 'A reading place only. Nothing of Lut\'s people or what happened to them is shown.',
      outro: 'The gate to Chapter 3, the market of Madyan, is open. Follow the path north.',
    },
    // Chapter 3. The market of Madyan: Shu'ayb.
    {
      id: 'c1',
      kind: 'read',
      requires: ['b2'],
      region: 'market',
      at: at(270, -16, 4),
      marker: 'tablet',
      title: 'Give full measure',
      goal: 'Read the stone at the market entrance',
      intro: 'Chapter 3. To Madyan, Allah sent their brother Shu\'ayb. Madyan was a people of trade.',
      reading: {
        title: 'Shu\'ayb and the people of Madyan',
        refs: [[7, 85]],
        note: 'Shu\'ayb told the people of Madyan to worship Allah alone, to give full measure and weight, not to cheat people of what is theirs, and not to cause corruption on the earth after it was set right.',
      },
    },
    {
      id: 'c2',
      kind: 'weigh',
      requires: ['c1'],
      region: 'market',
      at: at(270, 2, -3),
      title: 'Weigh it fairly',
      goal: 'At the balance in the middle of the market, weigh out three orders fairly',
      intro: 'At the balance, weigh out each order until the balance hangs level. The box of weights has one weight that has been shaved: its mark says more than it really weighs. Watch the balance, not just the marks.',
      adaptation: 'A market game written for this app about 7:85. The weights and orders are invented for it.',
      weights: [
        { label: 'small weight', mass: 1, marked: 1 },
        { label: 'small weight', mass: 1, marked: 1 },
        { label: 'middle weight', mass: 2, marked: 2 },
        { label: 'large weight', mass: 5, marked: 5 },
        { label: 'large weight (worn)', mass: 4, marked: 5 },
        { label: 'middle weight', mass: 3, marked: 3 },
      ],
      orders: [
        { goods: 'barley', want: 3 },
        { goods: 'dates', want: 5 },
        { goods: 'wheat', want: 8 },
      ],
      outro: 'Three orders, each weighed fairly. Did you leave the worn weight in the box?',
      reading: {
        title: 'Do not sit on every road threatening people',
        refs: [[7, 86], [7, 87]],
        note: 'Shu\'ayb reminded them that they had been few and Allah increased them, and told them to look at how the corrupters ended. He told them to be patient until Allah judges between them.',
      },
    },
    {
      id: 'c3',
      kind: 'read',
      requires: ['c2'],
      region: 'market',
      at: at(270, 10, 6),
      marker: 'lantern',
      title: 'Had they believed',
      goal: 'Read at the lantern among the stalls',
      reading: {
        title: 'Blessings from the heaven and the earth',
        refs: [[7, 96]],
        note: 'If the people of those towns had believed and been mindful of Allah, Allah would have opened to them blessings from the heaven and the earth.',
      },
      outro: 'The gate to Chapter 4, the shore of Musa, is open. Follow the path east.',
    },
    // Chapter 4. The shore of Musa.
    {
      id: 'd1',
      kind: 'read',
      requires: ['c3'],
      region: 'garden',
      at: at(0, -12, -4),
      marker: 'tablet',
      title: 'Musa is sent',
      goal: 'Read the stone at the shore',
      intro: 'Chapter 4. After those peoples, Allah sent Musa to Pharaoh. Read, then follow the traces along the shore in order.',
      reading: {
        title: 'Musa and Pharaoh',
        refs: [[7, 103], [7, 104]],
        note: 'After those peoples, Allah sent Musa (Moses) with signs to Pharaoh and his chiefs. Musa said: "I am a messenger from the Lord of the worlds."',
      },
    },
    {
      id: 'd2',
      kind: 'points',
      requires: ['d1'],
      region: 'garden',
      style: 'sign',
      ordered: true,
      verb: 'Look closely',
      title: 'Traces along the shore',
      goal: 'Follow the traces along the shore, in the order of the surah',
      adaptation: 'The shore and the traces are this game\'s places for reading. None of the events is shown.',
      points: [
        { at: at(0, -4, 8), label: 'the first trace', reading: { title: 'The magicians believed', refs: [[7, 117], [7, 120], [7, 121], [7, 122]], note: 'From the Quran: Pharaoh\'s magicians saw the truth and fell down in prostration, saying, "We believe in the Lord of the worlds, the Lord of Musa and Harun."' } },
        { at: at(0, 6, 10), label: 'the second trace', reading: { title: 'Patience', refs: [[7, 128]], note: 'From the Quran: Musa told his people, "Seek help through Allah and be patient. The earth belongs to Allah, and the best outcome is for those who are mindful of Him."' } },
        { at: at(0, 12, -8), label: 'the third trace', reading: { title: 'Across the sea', refs: [[7, 137], [7, 138]], note: 'From the Quran: Allah brought the Children of Israel across the sea. The crossing is only read; it is not shown.' } },
      ],
    },
    {
      id: 'd4',
      kind: 'read',
      requires: ['d2'],
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
      'You travelled through four chapters: the broken columns of \'Aad, the carved cliffs of Thamud and the salt shore, the market of Madyan, and the shore of Musa. Each messenger called his people to worship Allah alone and to be good and fair.',
      'Some people listened and many did not. In the market you weighed fairly and left the worn weight in the box.',
    ],
    ref: [7, 85],
    questions: ['Which messenger\'s story would you like to read more about?', 'Why do you think so many people did not listen?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown: not Adam, Nuh, Hud, Salih, Lut, Shu\'ayb, Musa or Harun.',
    'Angels, Iblees, Paradise and the she-camel are not pictured.',
    'The peoples who were destroyed are only read about. No flood or punishment is shown. Lut\'s people are not shown, and their account is left to the book.',
    'The broken columns, carved cliffs, market and shore are this game\'s pictures, not models of \'Aad, Thamud, Madyan or any real site.',
  ],
};
