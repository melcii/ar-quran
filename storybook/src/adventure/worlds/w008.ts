// Surah 8, Al-Anfal: the Camp of Cooperation. A tent camp at the edge of the
// desert under a grey, rain-washed sky. The core play is a cooperative
// planning puzzle: rain has filled the spring basin above the camp (a picture
// of 8:11), and three channels with wooden gates lead to the drinking
// cistern, the animals' trough and the washing cistern. Open the sluice and
// turn the gates in time so that each cistern fills and as little water as
// possible runs off into the sand; if too much is lost, the spring refills
// and you plan again. No battle is shown or acted out; the camp is not the
// camp at Badr, and the activities are not presented as tasks done there.
import { curve, type P2 } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, facing, rolling } from './common';

const C: P2 = [0, 0];
const TENTS: P2[] = Array.from({ length: 6 }, (_, i) => [Math.cos(0.4 + (i / 6) * Math.PI * 2) * 17, Math.sin(0.4 + (i / 6) * Math.PI * 2) * 17] as P2);
// The rain channels above the camp.
const SRC: P2 = [-6, 36];
const G1: P2 = [-4, 29];
const G2: P2 = [-11, 24];
const G3: P2 = [4, 25];
const DRINK: P2 = [-18, 19];
const TROUGH: P2 = [-7, 17.5];
const WASH: P2 = [11, 19.5];
const SAND: P2 = [12, 30];

export const W008: WorldDef = {
  surah: 8,
  name: 'The Camp of Cooperation',
  theme: 'Share out the rain water, and keep hearts united',
  play: 'A planning puzzle: route rain water from the spring through channels and gates so every cistern fills and little is wasted. A wrong plan is not a failure: the spring refills and you try again.',
  seed: 808,
  ground: {
    radius: 60,
    base: rolling({ radius: 60, amp: 3, seed: 8, shapes: [{ x: -30, z: -30, r: 18, h: 6 }, { x: 34, z: -24, r: 14, h: 4 }, { x: 24, z: 30, r: 9, h: -6 }] }),
    palette: PAL.desert,
    paths: [curve([[0, 54], [6, 38], [0, 24], [0, 8]])],
    water: -3,
    shore: '#d8c08a',
    flats: [{ x: 0, z: 0, r: 24, paint: '#e8d4a8' }],
  },
  look: { ...LOOKS.desert, zen: '#5a6a8a', mid: '#9aa4b8', hor: '#d8d0c4', sun: [-0.5, 0.35, -0.7], sunColor: '#f0e4d0', sunI: 2.3, hemiSky: '#b8c0d0', hemiI: 1.35, fog: '#c8c4bc', fogDensity: 0.0065, clouds: 1, cloudTint: '#c8ccd4' },
  veg: {
    grass: 0.5,
    dryGrass: true,
    lush: (x, z) => (Math.hypot(x - 24, z - 30) < 16 ? 1 : 0.25),
    flowers: ['#f4d060', '#fff2d8'],
    flowerDensity: 0.4,
    trees: [
      { kind: 'palm', area: { x: 24, z: 30, r: 14 }, count: 9, size: [0.9, 1.3] },
      { kind: 'palm', area: { x: 0, z: 0, r: 52 }, count: 6 },
      { kind: 'olive', area: { x: -30, z: 20, r: 12 }, count: 3 },
    ],
    rocks: [{ x: -30, z: -30, n: 12, big: 2, spread: 22 }, { x: 34, z: -24, n: 8, big: 1.6, spread: 14 }],
    pebbles: 50,
    rim: ['palm', 'olive'],
  },
  far: '#c8aa78',
  mountains: { color: '#b49a8a', height: 0.9 },
  start: [0, 54],
  startYaw: Math.PI,
  structures: [
    ...TENTS.map(([x, z], i) => ({ type: 'tent', x, z, rot: facing(x, z, 0, 0, 4).rot, w: 5, d: 4, color: i % 2 ? '#7a5a3a' : '#e8d8b8', accent: ['#b84a3a', '#3f6f9a', '#c8a040'][i % 3] }) as Structure),
    { type: 'tent', x: -4, z: -30, rot: 0, w: 7, d: 5, h: 3, color: '#e8d8b8', accent: '#5f8a5a' },
    { type: 'well', x: 22, z: 24 },
    { type: 'rug', x: 0, z: 0, w: 5, d: 4, color: '#9a3a3a' },
    { type: 'cart', x: 16, z: 34, rot: 0.6 },
    { type: 'stones', x: 0, z: 4, n: 7 },
  ],
  herds: [{ animal: 'camel', at: [-28, 30], r: 6, n: 3 }, { animal: 'goat', at: [30, -6], r: 6, n: 3 }],
  welcome:
    'Welcome to the Camp of Courage and Unity. Surah Al-Anfal teaches believers to keep their hearts together, to rely on Allah and to be patient. There is work to do in camp, and it goes best when everyone helps.',
  tasks: [
    {
      id: 'rain',
      kind: 'read',
      at: [-12, 37],
      marker: 'tablet',
      title: 'Rain from the sky',
      goal: 'Read the stone by the spring basin above the camp',
      intro: 'It has rained, and the spring basin above the camp is full. The camp needs water in three places. Read first, then look at the channels.',
      reading: {
        title: 'Rain to purify you and make your feet firm',
        refs: [[8, 11]],
        note: 'Before a hard day, Allah sent the believers a calm sleep, and rain from the sky to purify them, strengthen their hearts and make their feet firm. The rain in this game is a picture of that ayah; the camp is not the camp at Badr.',
      },
    },
    {
      id: 'channels',
      kind: 'flow',
      requires: ['rain'],
      source: SRC,
      first: 'g1',
      gates: [
        { id: 'g1', at: G1, a: 'g2', b: 'g3' },
        { id: 'g2', at: G2, a: 'drink', b: 'trough' },
        { id: 'g3', at: G3, a: 'wash', b: 'sand' },
      ],
      cisterns: [
        { id: 'drink', at: DRINK, label: 'Drinking cistern', cap: 4 },
        { id: 'trough', at: TROUGH, label: 'Animals\' trough', cap: 3 },
        { id: 'wash', at: WASH, label: 'Washing cistern', cap: 4 },
      ],
      sand: [{ id: 'sand', at: SAND }],
      rain: 12.5,
      maxSpill: 2.5,
      channels: [
        { from: SRC, to: G1 },
        { from: G1, to: G2 },
        { from: G1, to: G3 },
        { from: G2, to: DRINK },
        { from: G2, to: TROUGH },
        { from: G3, to: WASH },
        { from: G3, to: SAND },
      ],
      title: 'Share out the water',
      goal: 'Open the sluice, then turn the gates in time so all three cisterns fill',
      intro: 'Look at where each gate sends the water before you open the sluice. While it runs, watch the cisterns: when one is full, turn a gate so the water goes to the next. If too much runs onto the sand, the spring refills and you can plan again.',
      adaptation: 'The channels, gates and cisterns are a planning puzzle written for this game. They are not a reconstruction of anything done at Badr.',
      outro: 'All three cisterns are full and little was wasted. Shared water, shared work.',
    },
    {
      id: 'amend',
      kind: 'read',
      requires: ['channels'],
      at: [-3, 7],
      marker: 'tablet',
      title: 'Set things right between you',
      goal: 'Read the stone in the middle of the camp',
      reading: {
        title: 'Amend what is between you',
        refs: [[8, 1]],
        note: 'The surah begins with a question about how to share things out. The answer: it is for Allah and His Messenger to decide, so be mindful of Allah and set right what is between you.',
      },
    },
    {
      id: 'unity',
      kind: 'quiz',
      requires: ['amend'],
      at: [3, 7],
      marker: 'scroll',
      title: 'Together or apart?',
      goal: 'At the lectern, sort what brings people together',
      prompt: 'Does each card bring people together, or pull them apart?',
      game: {
        type: 'sort',
        bins: ['Brings us together', 'Pulls us apart'],
        cards: [
          { text: 'Turning the gate so the next family gets water too.', bin: 0 },
          { text: 'Keeping the water flowing to your own cistern after it is full.', bin: 1 },
          { text: 'Saying sorry first after a quarrel.', bin: 0 },
          { text: 'Whispering unkind things about someone.', bin: 1 },
          { text: 'Waiting patiently for your turn at the well.', bin: 0 },
          { text: 'Refusing to help because it wasn\'t your idea.', bin: 1 },
        ],
      },
      adaptation: 'Cards written for this game, about 8:1 and 8:46.',
      after: {
        title: 'Do not dispute, and be patient',
        refs: [[8, 46]],
        note: 'Do not argue among yourselves, or you will lose heart and your strength will go. Be patient: Allah is with the patient.',
      },
    },
    {
      id: 'believers',
      kind: 'read',
      requires: ['unity'],
      at: [24, 27.5],
      marker: 'lantern',
      title: 'Hearts that trust',
      goal: 'Read at the lantern by the well',
      reading: {
        title: 'The believers, truly',
        refs: [[8, 2], [8, 3], [8, 4]],
        note: 'The believers are those whose hearts are moved when Allah is mentioned, whose faith grows when they hear His verses, who rely on their Lord, pray, and give from what they have.',
      },
    },
    {
      id: 'hearts',
      kind: 'read',
      requires: ['believers'],
      at: [-4, -26],
      marker: 'lantern',
      title: 'Hearts brought together',
      goal: 'Read at the lamp by the big tent',
      reading: {
        title: 'He brought their hearts together',
        refs: [[8, 63]],
        note: 'Allah brought the hearts of the believers together. Even if you spent everything on earth, you could not have done it, but Allah brought them together.',
      },
    },
  ],
  finale: {
    title: 'Stronger together',
    body: [
      'You shared out the rain water so that every part of the camp had what it needed, turning each gate at the right time.',
      'Al-Anfal teaches that hearts held together, and relying on Allah, give people courage.',
    ],
    ref: [8, 46],
    questions: ['When did planning together make something easier for you?', 'What helps you make up after an argument?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown, and no companion appears.',
    'No battle is shown or acted out. The camp is a game place, not the camp at Badr, and the water puzzle is not presented as something done there.',
    'Angels mentioned in the surah are never pictured.',
  ],
};
