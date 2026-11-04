// Surah 2, Al-Baqarah: the Great Story Atlas. A monumental atlas hall at the
// entrance holds a floor map and four story doors; each door carries you into
// a story land around the central hill (the lands are also joined by a ring
// path through gates):
//  1. Garden of Beginnings (2:30-39): reading stones and a "names" walk. Only
//     an earthly garden is shown; Paradise, angels and Iblees are not pictured.
//  2. Village of the Cow (2:67-73): an investigation. Hear each answer in the
//     Quran's order and send back the cows that do not fit, until one is
//     left. Nothing of the slaughter or the slain man is shown.
//  3. Valley of the House (2:124-129): walk round a low stone outline and
//     pause at each corner to read. It is not a model of the Ka'bah, and
//     nothing is built; Ibrahim and Isma'il are not shown.
//  4. Community District (2:261-274): plant seven rows, then give baskets
//     quietly to the homes that show a sign of need.
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

const FC = at(270, 10, 0);
const FOUND: P2[] = [
  [FC[0] - 5, FC[1] - 5],
  [FC[0] + 5, FC[1] - 5],
  [FC[0] + 5, FC[1] + 5],
  [FC[0] - 5, FC[1] + 5],
];

const bedRows: P2[] = Array.from({ length: 7 }, (_, i) => at(0, -6 + i * 2.2, 3));

export const W002: WorldDef = {
  surah: 2,
  name: 'The Great Story Atlas',
  theme: 'A hall of story doors into four lands of Al-Baqarah',
  play: 'A hub-and-doors adventure: the atlas hall sends you into four story lands, each with its own kind of play. The village is an investigation in which you narrow a herd down by each answer in turn.',
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
      { x: 0, z: 94, r: 13, paint: '#e8dcc0' },
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
  start: [0, 88],
  startYaw: 0,
  regions: [
    { id: 'garden', name: 'Garden of Beginnings', at: polar(R + 10, 90) },
    { id: 'village', name: 'Village of the Cow', at: polar(R + 10, 180) },
    { id: 'desert', name: 'Valley of the House', at: polar(R + 10, 270) },
    { id: 'orchard', name: 'Community District', at: polar(R + 10, 0) },
  ],
  structures: [
    // The atlas hall: a terrace under columns and a dome, the floor map, and its four story doors.
    { type: 'terrace', x: 0, z: 94, w: 22, d: 16, h: 0.3, color: '#ece0c6' },
    { type: 'dome', x: 0, z: 104, w: 9, d: 7, h: 6, color: '#efe2c6', accent: '#3f6f9a' },
    { type: 'columns', x: 0, z: 86.8, w: 20, n: 7, rot: 0, color: '#efe2c8' },
    { type: 'columns', x: -10.6, z: 94, w: 14, n: 5, rot: Math.PI / 2, color: '#efe2c8' },
    { type: 'columns', x: 10.6, z: 94, w: 14, n: 5, rot: Math.PI / 2, color: '#efe2c8' },
    { type: 'rug', x: 0, z: 92.5, w: 9, d: 5, color: '#2f4f7a', accent: '#e8c070' },
    { type: 'bed', x: -3, z: 91.5, w: 1.6, d: 1.2, color: '#f4d060', show: 'b4' },
    { type: 'bed', x: -1, z: 93.5, w: 1.6, d: 1.2, color: '#e8c040', show: 'c2' },
    { type: 'bed', x: 1, z: 91.5, w: 1.6, d: 1.2, color: '#f0dcae', show: 'd2' },
    { type: 'bed', x: 3, z: 93.5, w: 1.6, d: 1.2, color: '#e88a9a', show: 'e3' },
    { type: 'festoon', x: -9, z: 99, to: [9, 99], h: 4 },
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
    { type: 'terrace', ...pt(FC), w: 6.4, d: 6.4, h: 0.22, color: '#cbb48c' },
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
  warps: [
    { at: [-7.5, 99.5], to: at(90, 12, 0), toYaw: Math.PI, label: 'Enter the story door: Garden of Beginnings' },
    { at: [-2.5, 99.5], to: at(180, -16, 0), toYaw: Math.PI / 2, label: 'Enter the story door: Village of the Cow', show: 'b4' },
    { at: [2.5, 99.5], to: at(270, -22, 0), toYaw: 0, label: 'Enter the story door: Valley of the House', show: 'c2' },
    { at: [7.5, 99.5], to: at(0, -20, 0), toYaw: -Math.PI / 2, label: 'Enter the story door: Community District', show: 'd2' },
    { at: at(180, -24, -6), to: [0, 90], toYaw: 0, label: 'Back to the atlas hall' },
    { at: at(270, -26, 6), to: [0, 90], toYaw: 0, label: 'Back to the atlas hall' },
    { at: at(0, -26, 6), to: [0, 90], toYaw: 0, label: 'Back to the atlas hall' },
  ],
  welcome:
    'Welcome to the Great Story Atlas. Al-Baqarah, "The Cow", is the longest surah of the Quran, with 286 ayahs and several stories. This hall holds a map of four story lands and a door into each. The first door is open; each next door opens when you finish the land before it. The map on the floor lights up as you go.',
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
      kind: 'read',
      requires: ['b4'],
      region: 'village',
      at: at(180, -4, -6),
      marker: 'tablet',
      title: 'The command',
      goal: 'In the village, read the stone by the well',
      reading: { title: 'The command', refs: [[2, 67]], note: 'Musa told his people that Allah commanded them to slaughter a cow. They asked if he was mocking them. Instead of simply obeying, they began to ask question after question.' },
      intro: 'This is the Village of the Cow. In the pasture are ten cows. You will hear the answers to the people\'s questions in the Quran\'s own order. After each answer, send back to the far pasture every cow that does not fit, until only one is left.',
    },
    {
      id: 'c2',
      kind: 'sift',
      requires: ['c1'],
      region: 'village',
      animal: 'cow',
      away: at(180, 26, -16),
      title: 'Narrow down the herd',
      goal: 'Hear each answer at the pasture signpost, then send back the cows that do not fit',
      adaptation: 'An investigation game built on the descriptions in 2:68-71, heard in the Quran\'s order. These cows are not the cow of the story, and nothing of what happened next is shown.',
      herd: [
        { at: at(180, 14, -4), look: { coat: '#e8c040' }, traits: ['middle', 'yellow', 'untrained', 'sound'] },
        { at: at(180, 18, 2), look: { coat: '#8a5a34' }, traits: ['middle', 'untrained', 'sound'] },
        { at: at(180, 12, 5), look: { coat: '#e8c040' }, scale: 0.6, traits: ['yellow', 'untrained', 'sound'] },
        { at: at(180, 20, -2), look: { coat: '#e2b840', yoke: true }, traits: ['middle', 'yellow', 'sound'] },
        { at: at(180, 16, 8), look: { coat: '#d8b050', grey: true }, scale: 1.05, traits: ['yellow', 'untrained', 'sound'] },
        { at: at(180, 10, -7), look: { coat: '#e8c040', mark: '#f8f4ea', patches: true }, traits: ['middle', 'yellow', 'untrained'] },
        { at: at(180, 22, 5), look: { coat: '#3a2a20' }, traits: ['middle', 'sound'] },
        { at: at(180, 9, 1), look: { coat: '#f2ead8' }, scale: 0.65, traits: ['untrained', 'sound'] },
        { at: at(180, 23, -6), look: { coat: '#e8c040', yoke: true, patches: true, mark: '#f8f4ea' }, traits: ['middle', 'yellow'] },
        { at: at(180, 19, -9), look: { coat: '#a8754a', mark: '#f2ead8', patches: true }, traits: ['middle', 'untrained'] },
      ],
      rounds: [
        {
          reading: { title: 'What is she?', refs: [[2, 68]], note: 'They asked what kind of cow. The answer: neither old nor very young, but in between. "So do what you are commanded."' },
          keep: 'middle',
          say: 'Ayah 68: neither old nor very young. Send back the calves and the old cow.',
          wrong: 'This cow is neither old nor very young. She fits ayah 68: keep her.',
        },
        {
          reading: { title: 'What colour?', refs: [[2, 69]], note: 'They asked about her colour. The answer: a yellow cow, bright in colour, pleasing to those who see her.' },
          keep: 'yellow',
          say: 'Ayah 69: a bright yellow cow. Send back every cow that is not yellow.',
          wrong: 'This cow is bright yellow. She fits ayah 69: keep her.',
        },
        {
          reading: { title: 'Never put to work', refs: [[2, 70], [2, 71]], note: 'They asked again, saying all cows looked alike to them. The answer: a cow not trained to plough the earth or to water the fields.' },
          keep: 'untrained',
          say: 'Ayah 71: not trained to plough or to water the fields. Send back the cows wearing a work yoke.',
          wrong: 'This cow wears no yoke: she has not been put to work. Keep her.',
        },
        {
          reading: { title: 'Sound, with no spot', refs: [[2, 71]], note: 'The same ayah goes on: sound, with no spot on her. Then they said, "Now you have come with the truth." Each question had made the task harder for them, not easier.' },
          keep: 'sound',
          say: 'Ayah 71 also says: sound, with no spot on her. Send back the cow with spots.',
          wrong: 'This cow has no spots. Keep her.',
        },
      ],
      outro: 'One cow is left, and she fits every answer. You listened to each description in order. The door to the Valley of the House is open in the atlas hall, and the gate on the path is open too.',
      after: {
        title: 'Thus does Allah show His signs',
        refs: [[2, 72], [2, 73]],
        note: 'The ayahs then tell why: someone had been killed and the people argued about who did it. Allah brought out what they were hiding, as a sign that He gives life to the dead, so that people would reason. The game shows none of this; it is for reading.',
      },
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
      kind: 'points',
      requires: ['d1'],
      region: 'desert',
      style: 'sign',
      ordered: true,
      verb: 'Pause and read',
      title: 'Round the outline',
      goal: 'Walk round the low stone outline and pause at each corner to read',
      intro: 'Ayah 127 says that Ibrahim and Isma\'il raised the foundations of the House. Here there is only a low outline of stones to walk round. At each corner, pause and read.',
      adaptation: 'A symbolic walk. The low square outline is not a model of the Ka\'bah, nothing is built, and Ibrahim and Isma\'il are not shown.',
      points: [
        { at: FOUND[0], label: 'the first corner', reading: { title: 'A place of return and safety', refs: [[2, 125]], note: 'The House was made a place of return for people and a place of safety. Ibrahim and Isma\'il were told to keep it pure for those who worship there.' } },
        { at: FOUND[1], label: 'the second corner', reading: { title: 'Make this a secure city', refs: [[2, 126]], note: 'Ibrahim asked Allah to make the city secure and to provide its people with fruits.' } },
        { at: FOUND[2], label: 'the third corner', reading: { title: 'Our Lord, accept this from us', refs: [[2, 127]], note: 'While they raised the foundations, they prayed: "Our Lord, accept this from us. You are the Hearing, the Knowing."' } },
        { at: FOUND[3], label: 'the fourth corner', reading: { title: 'A prayer for those to come', refs: [[2, 128], [2, 129]], note: 'They asked Allah to make them and their children submit to Him, and to send a messenger from among them who would teach the Book and wisdom.' } },
      ],
      outro: 'You walked all the way round. The door to the Community District is open in the atlas hall, and the gate on the path is open too.',
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
      title: 'Give quietly',
      goal: 'Take a basket of fruit to each house, and leave it quietly at the door',
      intro: 'The harvest is in. Ayah 273 speaks of people in need who do not ask, so others think they are well off. Take a basket to each house and leave it quietly at the door, without a word, as the ayahs ahead advise.',
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
    title: 'Four stories, one surah',
    body: [
      'You walked through the atlas of Al-Baqarah: names in the garden and the words of repentance; the herd narrowed down answer by answer; the outline in the valley and the prayer "accept this from us"; seven rows planted and baskets left quietly at doors.',
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
    'The low outline in the valley is symbolic, not a model of the Ka\'bah, and nothing is built there.',
    'The atlas hall and its doors are a way to move between the stories; they are not a real building.',
  ],
};

function pt([x, z]: P2) {
  return { x, z };
}
