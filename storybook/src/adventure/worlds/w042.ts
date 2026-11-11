// Surah 42, Ash-Shura (Consultation): the Village of the Council. A small
// village of the game's own, around a square with a long table. The core
// play: the village must decide where to dig its new well. Knock at each
// household's door and hear its need, then agree a plan at the table that
// meets every need (42:38, "their affair is consultation among
// themselves"). A plan that leaves anyone out is not agreed. Afterwards, at
// the harbour, a reading on the ships "like mountains" and the wind
// (42:32-33). The village and its families are an educational setting, not
// an event in the Quran. No one is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W042: WorldDef = {
  surah: 42,
  name: 'The Village of the Council',
  theme: 'Hear every household, then agree a plan together that leaves no one out',
  play: 'The village must decide where to dig its new well. Knock at each of the four doors to hear what that household needs (a lantern lights when you have listened), then choose a plan at the council table. Only a plan that meets every need is agreed.',
  seed: 4242,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.3, seed: 42, shapes: [{ x: 34, z: -32, r: 11, h: -6 }] }),
    water: -2,
    shore: '#e0d0a8',
    palette: PAL.coast,
    paths: [
      curve([[0, 40], [0, 20], [0, 4], [0, -10]]),
      curve([[0, 4], [-14, 6], [-22, 10]]),
      curve([[0, 4], [14, 4], [22, 0]]),
      curve([[0, -10], [12, -16], [22, -20]]),
    ],
    flats: [
      { x: 0, z: 4, r: 7, paint: '#e8dcc4' },
      { x: -20, z: 14, r: 4 },
      { x: -18, z: -6, r: 4 },
      { x: 18, z: 12, r: 4 },
      { x: 20, z: -4, r: 4 },
    ],
  },
  look: { ...LOOKS.golden, sunI: 2.9, birds: true },
  veg: {
    grass: 0.9,
    flowers: ['#fff2d8', '#f0c0a0'],
    trees: [{ kind: 'fig', at: [[-8, 12], [8, -4], [-26, 0]] }, { kind: 'olive', area: { x: -24, z: 26, r: 8 }, count: 4 }],
    rocks: [{ x: 30, z: -30, n: 4, big: 1, spread: 6 }],
    pebbles: 20,
    rim: ['olive', 'fig'],
  },
  far: '#9ab880',
  mountains: { color: '#9aa0b8', height: 0.7 },
  start: [0, 38],
  startYaw: Math.PI,
  structures: [
    { type: 'house', x: -22, z: 16, w: 4, d: 4, h: 3, rot: 0.8, color: '#e8d8b8' },
    { type: 'house', x: -21, z: -9, w: 4, d: 4, h: 3, rot: 2.2, color: '#d8c8a8' },
    { type: 'house', x: 21, z: 14, w: 4, d: 4, h: 3, rot: -0.8, color: '#e0d0b0' },
    { type: 'house', x: 23, z: -6, w: 4, d: 4, h: 3, rot: -2.0, color: '#e8dcc4' },
    // Fields to the north-west, the clay bank and the pasture path.
    { type: 'fence', x: -30, z: 20, to: [-30, 32] },
    { type: 'pen', x: 28, z: 10, w: 5, d: 4 },
    { type: 'dock', x: 27, z: -25, rot: -0.7 },
    { type: 'boat', x: 31, z: -30, rot: 0.6 },
  ],
  welcome:
    'Welcome to the Village of the Council. Surah Ash-Shura means Consultation. It describes believers "whose affair is consultation among themselves". This village has one big decision to make together. Walk in and listen to everyone.',
  tasks: [
    {
      id: 'shura',
      kind: 'read',
      at: [3, 26],
      marker: 'sign',
      title: 'Consultation',
      goal: 'Read at the sign on the path into the village',
      reading: { title: 'Their affair is consultation', refs: [[42, 36], [42, 37], [42, 38]], note: 'What is with Allah is better and lasts longer for those who believe and rely on their Lord: who stay away from great sins, who forgive when they are angry, who answer their Lord and pray, whose affairs are decided by consulting one another, and who give from what We have provided them.' },
    },
    {
      id: 'well',
      kind: 'council',
      requires: ['shura'],
      table: [0, 2],
      title: 'Where to dig the well',
      goal: 'Hear what each of the four households needs, then agree a plan at the council table',
      intro: 'The village can dig one new well this year. Before anyone decides, every household should be heard. Knock at each door; a lantern lights when you have listened.',
      adaptation: 'The village, its households and the well are a game setting written for this app, to practise the consultation described in 42:38. They are not an event in the Quran.',
      homes: [
        { at: [-19, 13], name: 'The farming family', need: 'Our young plants in the north fields need water every evening, and the walk to the old spring is very long.' },
        { at: [-18, -6], name: 'The potters', need: 'We dig our clay at the bank by the stream. Please do not build over the clay bank.' },
        { at: [18, 11], name: 'The grandparents', need: 'We cannot walk far any more. Water near the square would let us fetch it ourselves.' },
        { at: [20, -3], name: 'The shepherds', need: 'Our sheep need a trough on the pasture path, away from the gardens so they do not trample them.' },
      ],
      plans: [
        { text: 'Dig the well beside the north fields, far from the square.', meets: [0] },
        { text: 'Dig the well at the clay bank, where the ground is soft and easy.', meets: [3] },
        { text: 'Dig the well in the square, run a channel to the north fields, put a trough where the pasture path leaves the square, and leave the clay bank as it is.', meets: [0, 1, 2, 3] },
        { text: 'Let whoever speaks loudest at the table choose.', meets: [] },
      ],
      outro: 'The plan is agreed. Every household was heard, and every need is in it.',
      after: { title: 'Forgive and make peace', refs: [[42, 40], [42, 43]], note: 'Whoever pardons and makes peace, his reward is with Allah. And whoever is patient and forgives, that is a matter of real determination.' },
    },
    {
      id: 'ships',
      kind: 'read',
      requires: ['well'],
      at: [23, -19],
      marker: 'lantern',
      title: 'Ships like mountains',
      goal: 'Read at the lantern by the harbour',
      reading: { title: 'Ships and the wind', refs: [[42, 32], [42, 33]], note: 'Among His signs are the ships in the sea, like mountains. If He willed, He could still the wind, and they would stay motionless on the water. In that are signs for everyone patient and grateful.' },
    },
    {
      id: 'rain',
      kind: 'read',
      requires: ['ships'],
      at: [-4, -8],
      marker: 'tablet',
      title: 'Rain after despair',
      goal: 'Read at the tablet below the square',
      reading: { title: 'He sends the rain', refs: [[42, 28]], note: 'It is He who sends down the rain after people have lost hope, and spreads His mercy. He is the Protector, the Praiseworthy.' },
    },
  ],
  finale: {
    title: 'Everyone was heard',
    body: ['You listened at every door before the village decided, and found a plan that left no one out.', 'Surah Ash-Shura praises people whose affairs are decided by consulting one another.'],
    ref: [42, 38],
    questions: ['Why did you need to hear every household before choosing?', 'When could your family or class decide something together by consulting?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The village and its families are fictional; no person is shown.', 'No angels are shown (42:5 is not pictured).'],
};
