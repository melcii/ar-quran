// Surah 2, Al-Baqarah: four regions around a central hill, joined by one
// ring path and opened one after another.
//  1. Garden of Beginnings (2:30-39): reading stones and a "names" game. Only
//     an earthly garden is shown; Paradise, angels and Iblees are not pictured.
//  2. Village of the Cow (2:67-73): read the questions and answers in the
//     Quran's order, then find the cow that fits every description. Nothing
//     of the slaughter or the slain man is shown.
//  3. Desert Sanctuary (2:124-129): a symbolic building activity: carry
//     stones to lay a low foundation. It is not a model of the Ka'bah.
//  4. Community Orchard (2:261-274): plant seven rows and share baskets.
import * as THREE from 'three';
import { curve, type P2 } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, facing, near, passGate, polar, ridges, rolling, squarePts } from './common';

const R = 62;
const SAND = new THREE.Color('#e8d0a0');
const at = (a: number, dr: number, da: number): P2 => near([R, a], dr, da);

const RING: P2[] = curve([[0, 98], [0, 80], ...Array.from({ length: 19 }, (_, i) => polar(R, 90 + i * 15))]);

const sm = (t: number) => {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
};
/** 1 in the desert wedge (north), 0 elsewhere. */
const desert = (x: number, z: number) => {
  const a = (Math.atan2(z, x) * 180) / Math.PI;
  const d = Math.abs(((a + 360) % 360) - 270);
  return sm((44 - d) / 14) * sm((Math.hypot(x, z) - 22) / 10);
};

// The village houses, doors to the green.
const VC = at(180, 0, 0);
const village: Structure[] = [
  [8, -14], [20, -8], [22, 8], [8, 16], [-8, 14], [-6, -16],
].map(([dr, da], i) => {
  const [x, z] = at(180, dr, da);
  return { type: 'house', x, z, rot: facing(x, z, VC[0], VC[1]).rot, w: 6, d: 5, h: 3.2, accent: ['#3f7f8a', '#7a4a8a', '#3f7f5a', '#8a5a3a', '#3f6f9a', '#9a4a3a'][i] } as Structure;
});

const OC = at(0, 0, 0);
const orchardHomes: [P2, string][] = [
  [at(0, -18, -12), 'blue'],
  [at(0, -18, 12), 'green'],
  [at(0, 22, -14), 'red'],
  [at(0, 22, 14), 'yellow'],
];
const doorColor: Record<string, string> = { blue: '#3f6f9a', green: '#3f7f5a', red: '#a04a3a', yellow: '#c8a040' };

const bedRows: P2[] = Array.from({ length: 7 }, (_, i) => at(0, -6 + i * 2.2, 3));

export const W002: WorldDef = {
  surah: 2,
  name: 'Four Lands of the Cow',
  theme: 'A garden, a village, a desert sanctuary and an orchard',
  seed: 202,
  ground: {
    radius: 108,
    base: rolling({
      radius: 108,
      amp: 4,
      seed: 2,
      shapes: [
        { x: 0, z: 0, r: 38, h: 18 },
        ...ridges([{ a: 135, passR: R }, { a: 225, passR: R }, { a: 315, passR: R }, { a: 45 }]),
        { ...pt(at(90, 20, -24)), r: 10, h: 2.5 },
        { ...pt(at(0, 26, 0)), r: 12, h: 1.5 },
      ],
    }),
    palette: PAL.meadow,
    paths: [RING],
    pathWidth: 1.9,
    flats: [
      { ...pt(at(180, 0, 0)), r: 14 },
      { ...pt(at(270, 10, 0)), r: 9, paint: '#ead6aa' },
      { ...pt(at(0, 0, 0)), r: 16 },
    ],
    tint: (x, z, _y, c) => {
      const k = desert(x, z);
      if (k > 0) c.lerp(SAND.clone().offsetHSL(0, 0, (Math.sin(x * 0.7) * Math.cos(z * 0.6)) * 0.02), k * 0.9);
    },
  },
  look: LOOKS.golden,
  veg: {
    grass: 1,
    lush: (x, z) => 1 - desert(x, z) * 0.97,
    flowers: ['#f4d060', '#fff2d8', '#e88a9a', '#b8a0e8'],
    trees: [
      { kind: 'oak', area: { x: 0, z: 78, r: 26 }, count: 7 },
      { kind: 'blossom', area: { x: 0, z: 78, r: 26 }, count: 5 },
      { kind: 'olive', at: [at(90, 6, -18)], size: [1.1, 1.1] },
      { kind: 'autumn', area: { x: -78, z: 0, r: 26 }, count: 6 },
      { kind: 'fig', area: { x: -70, z: 10, r: 18 }, count: 3 },
      { kind: 'palm', area: { x: 0, z: -74, r: 28 }, count: 14, size: [0.9, 1.3] },
      { kind: 'olive', area: { x: 74, z: 0, r: 26 }, count: 10 },
      { kind: 'fig', area: { x: 74, z: 0, r: 26 }, count: 5 },
      { kind: 'pine', area: { x: 0, z: 0, r: 30 }, count: 10, size: [0.9, 1.3] },
      { kind: 'cypress', area: { x: 0, z: 0, r: 34 }, count: 6 },
    ],
    rocks: [
      { x: 0, z: 0, n: 14, big: 2.2, spread: 40 },
      { ...pt(at(90, -4, 20)), n: 6, big: 1.4, spread: 6 },
      { x: 0, z: -84, n: 10, big: 1.8, spread: 30 },
    ],
    pebbles: 50,
    rim: ['oak', 'pine', 'autumn', 'palm'],
  },
  far: '#86924e',
  mountains: { color: '#9a8ea6', height: 1.1 },
  start: [0, 98],
  startYaw: Math.PI,
  regions: [
    { id: 'garden', name: 'Garden of Beginnings', at: polar(R + 10, 90) },
    { id: 'village', name: 'Village of the Cow', at: polar(R + 10, 180) },
    { id: 'desert', name: 'Desert Sanctuary', at: polar(R + 10, 270) },
    { id: 'orchard', name: 'Community Orchard', at: polar(R + 10, 0) },
  ],
  structures: [
    { type: 'arch', x: 0, z: 88, w: 4, h: 4.2, color: '#e6d2a8' },
    { type: 'bed', ...pt(at(90, -2, -24)), w: 3, d: 2 },
    { type: 'pool', ...pt(at(90, 8, 22)), w: 4 },
    ...passGate(135, R, 'b4'),
    ...village,
    { type: 'well', ...pt(at(180, 0, 0)) },
    { type: 'pen', ...pt(at(180, 18, 2)), w: 14 },
    { type: 'stall', ...pt(at(180, -10, 4)), rot: Math.PI / 2 },
    ...passGate(225, R, 'c2'),
    { type: 'tent', ...pt(at(270, -12, -18)), rot: 0.4, color: '#7a5a3a', accent: '#c8643a' },
    { type: 'tent', ...pt(at(270, -16, 16)), rot: -0.5 },
    { type: 'well', ...pt(at(270, -6, 10)) },
    { type: 'stones', ...pt(at(270, -4, -14)), n: 8 },
    ...passGate(315, R, 'd2', '#e2cfa8'),
    ...orchardHomes.map(([p, c]) => ({ type: 'house', x: p[0], z: p[1], rot: facing(p[0], p[1], OC[0], OC[1], 4.5).rot, w: 5.5, d: 4.5, h: 3, accent: doorColor[c] }) as Structure),
    { type: 'cart', ...pt(at(0, -10, -6)), rot: 0.3 },
    { type: 'fence', ...pt(at(0, -8, 6)), to: at(0, 10, 6) },
    { type: 'festoon', ...pt(at(0, -4, -4)), to: at(0, 6, -4), h: 3.2 },
    { type: 'table', ...pt(at(0, 4, -8)), rot: 0.2 },
  ],
  herds: [
    { animal: 'sheep', at: at(90, 14, 16), r: 6, n: 5 },
    { animal: 'goat', at: at(180, -16, -2), r: 6, n: 4 },
    { animal: 'camel', at: at(270, -8, 22), r: 5, n: 2 },
  ],
  welcome:
    'Welcome to Al-Baqarah, "The Cow", the longest surah of the Quran. Its land has four parts, joined by one path around the hill: a garden, a village, a desert sanctuary and an orchard. Each gate opens when you finish the place before it.',
  tasks: [
    // 1. Garden of Beginnings
    {
      id: 'b1',
      kind: 'read',
      region: 'garden',
      at: at(90, 18, 6),
      marker: 'tablet',
      title: 'A successor on earth',
      goal: 'Read the first stone in the Garden of Beginnings',
      reading: {
        title: 'A successive authority on the earth',
        refs: [[2, 30]],
        note: 'Allah told the angels that He would place people on the earth to look after it. The angels asked a question, and Allah answered that He knows what they do not know.',
      },
    },
    {
      id: 'b2',
      kind: 'points',
      requires: ['b1'],
      region: 'garden',
      style: 'sign',
      verb: 'Learn the name',
      title: 'The names of things',
      goal: 'Find five things in the garden and learn their names',
      intro: 'The next ayahs say that Allah taught Adam the names of all things. Here is a small game inspired by that: walk to five things in this garden and learn what each is called.',
      adaptation: 'Inspired by 2:31. The garden and the five names are a learning game; they do not show what Adam was taught.',
      points: [
        { at: at(90, 6, -15.5), label: 'the olive tree (zaytun)' },
        { at: at(90, -4, 16), label: 'the rock (hajar)' },
        { at: at(90, -2, -21), label: 'the flowers (zahr)' },
        { at: at(90, 8, 19), label: 'the spring of water (ma’)' },
        { at: at(90, 12, 10), label: 'the sheep (ghanam)' },
      ],
      after: {
        title: 'He taught Adam the names',
        refs: [[2, 31], [2, 32], [2, 33]],
        note: 'Allah taught Adam the names of all things. The angels said they knew only what Allah had taught them. Knowledge is a gift from Allah.',
      },
    },
    {
      id: 'b3',
      kind: 'read',
      requires: ['b2'],
      region: 'garden',
      at: at(90, -10, -8),
      marker: 'tablet',
      title: 'Words of repentance',
      goal: 'Read the stone about the words of repentance',
      reading: {
        title: 'Adam received words, and Allah accepted his repentance',
        refs: [[2, 34], [2, 35], [2, 36], [2, 37]],
        note: 'Iblees refused out of pride. Adam and his wife were told not to approach one tree, and Satan made them slip. Then Adam received words from his Lord, and Allah accepted his repentance. When we make a mistake, we can turn back to Allah.',
      },
    },
    {
      id: 'b4',
      kind: 'read',
      requires: ['b3'],
      region: 'garden',
      at: polar(R - 4, 124),
      marker: 'tablet',
      title: 'Guidance will come',
      goal: 'Read the stone by the gate to open the way to the village',
      reading: {
        title: 'Whoever follows My guidance',
        refs: [[2, 38], [2, 39]],
        note: 'Allah promised that guidance would come, and that those who follow it will have no fear and will not grieve.',
      },
      outro: 'The gate to the Village of the Cow is open. Follow the path west.',
    },
    // 2. Village of the Cow
    {
      id: 'c1',
      kind: 'points',
      requires: ['b4'],
      region: 'village',
      style: 'sign',
      ordered: true,
      verb: 'Read',
      title: 'The questions, in order',
      goal: 'In the village, read the four stones in order',
      intro: 'In this part of Al-Baqarah, Musa (Moses) told his people that Allah commanded them to slaughter a cow. Instead of simply obeying, they asked question after question. The four stones here hold the ayahs in the Quran\'s order.',
      points: [
        { at: at(180, -4, -6), label: 'the first stone', reading: { title: 'The command', refs: [[2, 67]], note: 'Musa told his people that Allah commanded them to slaughter a cow. They asked if he was mocking them.' } },
        { at: at(180, -4, 6), label: 'the second stone', reading: { title: 'What is it?', refs: [[2, 68]], note: 'They asked what kind of cow. The answer: neither old nor very young, but in between. "So do what you are commanded."' } },
        { at: at(180, 6, 8), label: 'the third stone', reading: { title: 'What colour?', refs: [[2, 69]], note: 'They asked about its colour. The answer: a yellow cow, bright in colour, pleasing to those who see it.' } },
        { at: at(180, 6, -8), label: 'the fourth stone', reading: { title: 'Still more questions', refs: [[2, 70], [2, 71]], note: 'They asked again, saying all cows looked alike to them. The answer: a cow not trained to plough the earth or water the fields, sound, with no spot on her. Each question made the task harder for them, not easier.' } },
      ],
    },
    {
      id: 'c2',
      kind: 'pick',
      requires: ['c1'],
      region: 'village',
      animal: 'cow',
      verb: 'Is this the cow the ayahs describe?',
      title: 'Listen carefully',
      goal: 'In the pasture, find the cow that fits every description you read',
      intro: 'A listening game: in the pasture are six cows. Only one fits every description in the four stones. Look at age, colour, spots and the work yoke.',
      adaptation: 'A memory game about the descriptions in 2:68-71. These cows are not the cow of the story, and nothing of what happened next is shown.',
      choices: [
        { at: at(180, 16, -4), look: { coat: '#e8c040' }, right: true, why: 'Yes. Neither old nor young, bright yellow, no spots, and never put to work. You listened carefully to every description.' },
        { at: at(180, 20, 2), look: { coat: '#8a5a34' }, why: 'This cow is brown. Ayah 69 describes a yellow cow, bright in colour.' },
        { at: at(180, 14, 4), look: { coat: '#e8c040' }, scale: 0.6, why: 'This is a young calf. Ayah 68 says neither old nor young, but in between.' },
        { at: at(180, 22, -2), look: { coat: '#e2b840', yoke: true }, why: 'This cow wears a yoke for ploughing. Ayah 71 says she was not trained to plough the earth or water the fields.' },
        { at: at(180, 18, 7), look: { coat: '#d8b050', grey: true }, scale: 1.05, why: 'This cow is old, with a grey face. Ayah 68 says neither old nor young.' },
        { at: at(180, 12, -6), look: { coat: '#e8c040', mark: '#f8f4ea', patches: true }, why: 'This cow has spots. Ayah 71 says free from fault, with no spot on her.' },
      ],
      after: {
        title: 'Thus does Allah show His signs',
        refs: [[2, 72], [2, 73]],
        note: 'The ayahs then tell why: someone had been killed and the people argued about who did it. Allah brought out what they were hiding, as a sign that He gives life to the dead, so that people would reason. The game shows none of this; it is for reading.',
      },
      outro: 'The gate to the Desert Sanctuary is open. Follow the path north.',
    },
    // 3. Desert Sanctuary
    {
      id: 'd1',
      kind: 'read',
      requires: ['c2'],
      region: 'desert',
      at: at(270, -14, 0),
      marker: 'tablet',
      title: 'Ibrahim was tested',
      goal: 'In the desert, read the stone about Ibrahim',
      reading: {
        title: 'Ibrahim fulfilled the commands',
        refs: [[2, 124]],
        note: 'Allah tested Ibrahim (Abraham) with commands, and he fulfilled them. Allah made him a leader for people.',
      },
    },
    {
      id: 'd2',
      kind: 'carry',
      requires: ['d1'],
      region: 'desert',
      result: 'stone',
      title: 'Lay the foundation',
      goal: 'Carry stones from the pile and lay a foundation',
      intro: 'Ayah 127 says that Ibrahim and Isma\'il raised the foundations of the House, praying "Our Lord, accept this from us." This activity only lets you lay stones and think about their prayer.',
      adaptation: 'A symbolic building activity. The low square is not a model of the Ka\'bah, and Ibrahim and Isma\'il are not shown.',
      loads: squarePts(at(270, 10, 0), 3.2, 2).map((to, i) => ({ from: at(270, -4, -11), to, item: 'stone', label: 'stone', dest: `to the foundation (${i + 1} of 8)` })),
      after: {
        title: 'Our Lord, accept this from us',
        refs: [[2, 127], [2, 128], [2, 129]],
        note: 'While they raised the foundations, Ibrahim and Isma\'il asked Allah to accept their work, to make them and their children submit to Him, and to send a messenger who would teach the Book and wisdom.',
      },
      outro: 'The gate to the Community Orchard is open. Follow the path east.',
    },
    {
      id: 'd3',
      kind: 'read',
      requires: ['d2'],
      region: 'desert',
      at: at(270, -6, 14),
      marker: 'lantern',
      title: 'A place of security',
      goal: 'Read at the well in the desert',
      reading: {
        title: 'Make this a secure city',
        refs: [[2, 125], [2, 126]],
        note: 'The House was made a place of return and of safety. Ibrahim asked Allah to make the city secure and to provide its people with fruits.',
      },
    },
    // 4. Community Orchard
    {
      id: 'e1',
      kind: 'read',
      requires: ['d2'],
      region: 'orchard',
      at: at(0, -10, 0),
      marker: 'tablet',
      title: 'One seed, seven spikes',
      goal: 'In the orchard, read the stone about the seed',
      reading: {
        title: 'A seed that grows seven spikes',
        refs: [[2, 261]],
        note: 'Spending in the way of Allah is like one seed of grain that grows seven spikes, with a hundred grains in each. Allah multiplies the reward for whom He wills.',
      },
    },
    {
      id: 'e2',
      kind: 'carry',
      requires: ['e1'],
      region: 'orchard',
      result: 'sprout',
      title: 'Seven rows',
      goal: 'Plant seven rows of grain in the bed',
      adaptation: 'The seed with seven spikes is the Quran\'s own example (2:261). Planting seven rows is a game idea to remember it.',
      loads: bedRows.map((to, i) => ({ from: at(0, -13, -2), to, item: 'seedling', label: 'seedlings', dest: `to row ${i + 1}` })),
    },
    {
      id: 'e3',
      kind: 'carry',
      requires: ['e2'],
      region: 'orchard',
      result: 'item',
      title: 'Share the baskets',
      goal: 'Take a basket of fruit to each house',
      intro: 'The harvest is in. Take a basket to each house. The ayahs ahead say that giving quietly, without reminding people of it, is better.',
      adaptation: 'The houses and baskets are a game idea about the ayahs on giving.',
      loads: orchardHomes.map(([p, c]) => ({ from: at(0, 8, -9), to: facing(p[0], p[1], OC[0], OC[1], 4.5).door, item: 'fruit', label: 'basket of fruit', dest: `to the house with the ${c} door` })),
      after: {
        title: 'Giving by night and by day',
        refs: [[2, 262], [2, 271], [2, 274]],
        note: 'Those who give and do not remind others of it, or hurt them, have their reward with their Lord. Giving openly is good; giving quietly to those in need is better.',
      },
    },
  ],
  finale: {
    title: 'Four lands, one path',
    body: [
      'You learned names in the garden and read that Allah accepts repentance. In the village you listened to every description. In the desert you laid stones and read a prayer for acceptance. In the orchard you planted and shared.',
      'Al-Baqarah has many more lessons. You can read all 286 of its ayahs in the book.',
    ],
    ref: [2, 261],
    questions: ['Which description of the cow was the hardest to spot?', 'What small good thing could you give quietly this week?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown: not Adam, Musa, Ibrahim or Isma\'il.',
    'Angels, Iblees and Paradise are not pictured; the garden is an ordinary earthly garden.',
    'The slaughter of the cow and the slain man in 2:72-73 are not shown; they are only read.',
    'The foundation is a symbolic activity, not a model of the Ka\'bah.',
  ],
};

function pt([x, z]: P2) {
  return { x, z };
}
