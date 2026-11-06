// Surah 3, Ali 'Imran: the Sanctuary of Maryam. A quiet stone sanctuary at
// dusk, lit by lamps, below a windy mountain. The play is about coming back
// and holding steady:
//  - The prayer chamber is a place you return to. Each time you come back in,
//    something has changed by the niche (a picture of 3:37: "every time
//    Zakariyya entered upon her ... he found with her provision").
//  - A walled passage behind the sanctuary holds, in order, the ayahs about
//    Maryam and the glad tidings of Isa.
//  - On the mountain, the wind comes in gusts: keep still while it blows, then
//    climb on (a picture of 3:200, "be patient and persevere").
// Maryam, Zakariyya, Isa and the angels are never shown; their ayahs are only
// read. The changes by the niche are labelled as pictures; the Quran does not
// say what the provision was.
import { curve, type P2 } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { PAL, rolling } from './common';

const CLIMB: P2[] = curve([
  [0, -16],
  [10, -21],
  [-6, -29],
  [10, -38],
  [-2, -47],
  [0, -53],
]);

const STONE = '#c8c0b0';
const STONE2 = '#b8b0a2';
const niche: P2 = [0, 9.6];

// The walled passage behind the sanctuary.
const passage: Structure[] = [
  { type: 'wall', x: -2.6, z: -0.5, to: [-2.6, -14], color: STONE2 },
  { type: 'wall', x: 2.6, z: -0.5, to: [2.6, -14], color: STONE2 },
  { type: 'festoon', x: -2.4, z: -3, to: [2.4, -3], h: 3.2 },
  { type: 'festoon', x: -2.4, z: -8, to: [2.4, -8], h: 3.2 },
  { type: 'festoon', x: -2.4, z: -12.5, to: [2.4, -12.5], h: 3.2 },
];

export const W003: WorldDef = {
  surah: 3,
  name: 'The Sanctuary of Maryam',
  theme: 'A place you return to, a passage of ayahs, and a mountain of patience',
  play: 'Exploration by returning and waiting: come back into the prayer chamber again and again to see what has changed, walk a passage of ayahs in order, and climb a windy mountain by keeping still in the gusts.',
  seed: 303,
  ground: {
    radius: 66,
    base: rolling({
      radius: 66,
      amp: 2.5,
      seed: 3,
      shapes: [
        { x: 0, z: -50, r: 38, h: 17 },
        { x: -32, z: 22, r: 14, h: 4 },
        { x: 30, z: 26, r: 12, h: 3 },
      ],
    }),
    palette: { lush: '#7a8a5a', deep: '#56684a', warm: '#9a9468', path: '#cfc4ae', sand: '#d8ccb0', rock: '#8e8a86' },
    paths: [curve([[0, 62], [-4, 46], [0, 30], [0, 22]]), CLIMB],
    pathWidth: 1.8,
    flats: [
      { x: 0, z: 11, r: 13, paint: '#d6ccb6' },
      { x: 0, z: -7, r: 6, paint: '#cfc4ae' },
      { x: 0, z: -53, r: 6, paint: '#d6ccb6' },
    ],
  },
  look: {
    zen: '#2e3c70', mid: '#7a6aa6', hor: '#f0a882', sun: [-0.7, 0.1, -0.7], sunColor: '#ffb888', sunI: 2.2,
    hemiSky: '#8a90c4', hemiGround: '#4a4a3e', hemiI: 1.05, fog: '#9a8ea6', fogDensity: 0.0075, stars: 0.6, moon: [0.4, 0.4, 0.8], clouds: 0.5, birds: false,
  },
  veg: {
    grass: 0.9,
    lush: (x, z) => (Math.abs(x) < 14 && z > 0 && z < 22 ? 0.25 : 1),
    flowers: ['#fff2d8', '#c8a0e8'],
    flowerDensity: 0.6,
    trees: [
      { kind: 'cypress', at: [[-6, 26], [6, 26], [-11, 18], [11, 18], [-11, 4], [11, 4], [-4, 30], [4, 30]], size: [1, 1.3] },
      { kind: 'olive', area: { x: -22, z: 34, r: 12 }, count: 4 },
      { kind: 'pine', area: { x: 0, z: -48, r: 32 }, count: 18, size: [0.8, 1.3] },
      { kind: 'oak', area: { x: 0, z: 30, r: 34 }, count: 6 },
    ],
    rocks: [
      { x: 0, z: -44, n: 22, big: 2, spread: 46 },
      { x: -32, z: 22, n: 5, big: 1.4, spread: 10 },
    ],
    pebbles: 40,
    rim: ['pine', 'cypress', 'oak'],
  },
  far: '#5e6e58',
  mountains: { color: '#6a6e92', height: 1.4 },
  start: [0, 60],
  startYaw: Math.PI,
  structures: [
    // The sanctuary courtyard: tall walls, an arched gate, a domed prayer chamber at the back.
    { type: 'wall', x: -14, z: 22, to: [-3, 22], color: STONE },
    { type: 'wall', x: 3, z: 22, to: [14, 22], color: STONE },
    { type: 'wall', x: -14, z: 22, to: [-14, 0], color: STONE },
    { type: 'wall', x: 14, z: 22, to: [14, 0], color: STONE },
    { type: 'wall', x: -14, z: 0, to: [-3.2, 0], color: STONE2 },
    { type: 'wall', x: 3.2, z: 0, to: [14, 0], color: STONE2 },
    { type: 'arch', x: 0, z: 22, w: 4, h: 4.6, color: STONE },
    { type: 'dome', x: -7, z: 5, w: 6, d: 5, h: 4, color: '#e2d8c4', accent: '#4f6f8a' },
    { type: 'dome', x: 7, z: 5, w: 6, d: 5, h: 4, color: '#e2d8c4', accent: '#4f6f8a' },
    { type: 'columns', x: 0, z: 13, w: 12, n: 4, rot: 0, color: '#ddd2bc' },
    { type: 'rug', x: 0, z: 8.4, w: 2.4, d: 1.6, color: '#6a3a4a', accent: '#e8c070' },
    { type: 'festoon', x: -12, z: 17, to: [12, 17], h: 3.8 },
    // What appears by the niche on each return (pictures only).
    { type: 'bed', x: -2.2, z: 10.6, w: 1.2, d: 0.9, color: '#d0503a', show: 'niche#2' },
    { type: 'bed', x: 2.2, z: 10.6, w: 1.2, d: 0.9, color: '#e8b040', show: 'niche#3' },
    { type: 'well', x: -9, z: 15 },
    ...passage,
    // The summit.
    { type: 'terrace', x: 0, z: -53, w: 8, d: 6, h: 0.3, color: '#d6ccb6' },
    { type: 'columns', x: 0, z: -56, w: 7, n: 3, color: '#ddd2bc' },
  ],
  welcome:
    'Welcome to the Sanctuary of Maryam. Surah Ali \'Imran, "The Family of Imran", tells of a mother who gave her child to the service of Allah, of Maryam who grew up devoted in prayer, and of patience when things are hard. It is evening, and the lamps are lit. Walk through the gate into the sanctuary.',
  tasks: [
    {
      id: 'vow',
      kind: 'read',
      at: [-3.5, 25],
      marker: 'tablet',
      title: 'A mother\'s promise',
      goal: 'Read the stone by the sanctuary gate',
      reading: {
        title: 'I have dedicated what is in my womb to You',
        refs: [[3, 35], [3, 36]],
        note: 'The wife of Imran promised Allah that her child would be dedicated to His service. She gave birth to a girl and named her Maryam (Mary), and asked Allah to protect her and her children.',
      },
    },
    {
      id: 'niche',
      kind: 'return',
      requires: ['vow'],
      at: niche,
      r: 2.2,
      away: 19,
      times: 3,
      label: 'The prayer niche',
      title: 'Every time',
      goal: 'Come into the prayer chamber, walk out through the gate, and come back in',
      intro: 'Go into the courtyard to the lamp-lit prayer niche. Ayah 37 says that every time Zakariyya came in to Maryam in the prayer chamber, he found provision with her. Come in, walk out of the gate, and come back, and see what is different each time.',
      adaptation: 'Coming back and finding something new is a game picture of 3:37. The fruit and bread are not described in the Quran; the ayah says only "provision". Maryam and Zakariyya are not shown.',
      notes: [
        'You come into the prayer chamber. It is quiet, and a lamp burns. Now walk out of the sanctuary gate, and then come back.',
        'You come back, and there is fruit by the niche that was not there before. In this game it is a picture of the provision in 3:37. Walk out once more and come back.',
        'Again something new is there. Every time, there was provision.',
      ],
      reading: {
        title: 'It is from Allah',
        refs: [[3, 37]],
        note: 'Allah accepted her with good acceptance and made her grow well, and put her in the care of Zakariyya. Every time he entered upon her in the prayer chamber he found provision with her. He asked, "Maryam, where does this come from?" She said, "It is from Allah. Allah provides for whom He wills without account."',
      },
    },
    {
      id: 'zakariyya',
      kind: 'read',
      requires: ['niche'],
      at: [-9, 9.4],
      marker: 'lantern',
      title: 'A prayer answered',
      goal: 'Read at the lamp by the well',
      reading: {
        title: 'Zakariyya called upon his Lord',
        refs: [[3, 38], [3, 39]],
        note: 'There, Zakariyya prayed for a good child, though he was old. The angels called to him while he stood praying in the chamber: Allah gives you good news of Yahya (John). The angels are not pictured.',
      },
      outro: 'Behind the sanctuary, a walled passage leads toward the mountain. Its stones hold more of the story, in order.',
    },
    {
      id: 'passage',
      kind: 'points',
      requires: ['zakariyya'],
      style: 'sign',
      ordered: true,
      verb: 'Read',
      title: 'The passage of ayahs',
      goal: 'Walk the passage behind the sanctuary and read each stone in order',
      adaptation: 'The passage is a reading place made for this game.',
      points: [
        { at: [-1.6, -2.4], label: 'the first stone', reading: { title: 'Allah has chosen you', refs: [[3, 42], [3, 43]], note: 'The angels said: Maryam, Allah has chosen you and purified you, and chosen you above the women of the worlds. Be devoutly obedient to your Lord and pray.' } },
        { at: [1.6, -5.6], label: 'the second stone', reading: { title: 'Good news of a word from Him', refs: [[3, 45], [3, 46]], note: 'The angels gave Maryam good news of a son, the Messiah, Isa (Jesus), son of Maryam, honoured in this world and the next.' } },
        { at: [-1.6, -8.8], label: 'the third stone', reading: { title: 'How can I have a child?', refs: [[3, 47]], note: 'Maryam asked how she could have a child when no man had touched her. The answer: Allah creates what He wills; when He decrees a matter, He only says to it "Be", and it is.' } },
        { at: [1.6, -12], label: 'the fourth stone', reading: { title: 'Like Adam', refs: [[3, 59]], note: 'The example of Isa with Allah is like that of Adam: He created him from dust, then said to him "Be", and he was.' } },
      ],
      outro: 'The passage opens onto the mountain path. Up there, the wind blows in gusts.',
    },
    {
      id: 'climb',
      kind: 'reach',
      requires: ['passage'],
      at: [0, -53],
      r: 2.6,
      label: 'The summit',
      title: 'Hold steady',
      goal: 'Climb to the summit: keep still while each gust blows',
      intro: 'Climb the mountain path. When the wind rises, stand still until it passes, then climb on. If you keep walking in a gust, it pushes you back.',
      adaptation: 'The wind and the rule "keep still in a gust" are a game picture of patience and steadfastness.',
      gust: { path: CLIMB, width: 6 },
      reading: {
        title: 'Be patient, and persevere',
        refs: [[3, 139], [3, 200]],
        note: 'Do not weaken and do not grieve. You who believe, be patient, persevere, stay firm, and be mindful of Allah, so that you may succeed.',
      },
    },
  ],
  finale: {
    title: 'Steadfast hearts',
    body: [
      'You came back to the prayer chamber again and again, and each time something was there. You read the ayahs about Maryam in order. On the mountain you held steady in the wind and climbed on.',
      'Ali \'Imran teaches that provision comes from Allah, and that patience means holding firm when things are hard.',
    ],
    ref: [3, 37],
    questions: ['What good things in your life come to you without you asking?', 'When is it hard for you to be patient, and what helps?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet or person from the story is shown: not Maryam, Zakariyya, Yahya, Isa or the wife of Imran.',
    'Angels are not pictured; their words are only read.',
    'The sanctuary, the niche and what appears beside it are pictures made for this game, not a reconstruction of a real place or of the provision.',
  ],
  extras: { motes: [{ at: niche, r: 4, color: '#ffe8b0' }, { at: [0, 14], r: 10, color: '#ffe8b0' }] },
};
