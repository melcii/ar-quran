// Surah 114, An-Nas (Mankind): the Letter to Grandmother. A village on a
// clear morning, with a winding lane past an orchard, a pond and a market
// to Grandmother's house at the far end. "Say: I seek refuge in the Lord of
// people, the King of people, the God of people, from the evil of the
// retreating whisperer, who whispers in the hearts of people" (114:1-5).
// The core play: carry a letter to Grandmother; at three places a thought
// comes that is not a good one, shown only as a grey mist. Seek refuge in
// the Lord of people and walk on, and it draws back; listen, and it
// thickens. No whisperer or jinn is ever shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W114: WorldDef = {
  surah: 114,
  name: 'The Letter to Grandmother',
  theme: 'Carry a letter across the village and turn from each whispered thought by seeking refuge',
  play: 'Carry a letter across the village to Grandmother’s house. At three places on the way, a thought comes that is not a good one, gathering like a grey mist. Seek refuge in the Lord of people and walk on, and it draws back. Listen to it, and it only thickens. Then deliver the letter.',
  seed: 11414,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 0.8, seed: 114, shapes: [{ x: 10, z: 6, r: 4, h: -1.5 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 36], [-6, 26], [-8, 14], [0, 6], [6, -4], [0, -14], [-4, -20]])],
    water: -0.8,
    flats: [{ x: -6, z: 26, r: 3 }, { x: -4, z: -20, r: 4, paint: '#d8c8a8' }, { x: 14, z: -8, r: 3 }],
  },
  look: { ...LOOKS.morning, sunI: 2.8 },
  veg: {
    grass: 0.9,
    flowers: ['#f8e0a0', '#f0a0c0', '#ffffff'],
    trees: [{ kind: 'blossom', at: [[-14, 14], [-12, 8], [-16, 20]] }, { kind: 'oak', at: [[14, 20], [16, -16]] }],
    rocks: [],
    pebbles: 14,
    rim: ['oak', 'blossom'],
  },
  far: '#9ab09a',
  mountains: { color: '#8a98b0', height: 0.8 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    { type: 'house', x: -4, z: -25, rot: 0, w: 5, d: 4.2, h: 3, accent: '#8a4a5a' },
    { type: 'stall', x: 11, z: -2, rot: -Math.PI / 2 },
    { type: 'fence', x: -16, z: 4, to: [-11, 4] },
  ],
  welcome:
    'Welcome to the Letter to Grandmother. Surah An-Nas, the last surah of the Quran, teaches us to seek refuge in the Lord of people from the whisperer who whispers and then draws back. Here is a sealed letter for Grandmother. Off you go.',
  tasks: [
    {
      id: 'lord',
      kind: 'read',
      at: [-6, 26],
      marker: 'sign',
      title: 'The Lord of people',
      goal: 'Read at the sign at the top of the lane',
      reading: { title: 'The Lord of people', refs: [[114, 1], [114, 2], [114, 3]], note: 'Say: I seek refuge in the Lord of people, the King of people, the God of people,' },
    },
    {
      id: 'letter',
      kind: 'whisper',
      requires: ['lord'],
      stops: [
        { at: [-8, 14], says: 'Forget the letter. Go and play in the orchard; Grandmother can wait.' },
        { at: [5, -2], says: 'Open the letter and read it. No one will ever know.' },
        { at: [1, -13], says: 'Tell Grandmother you lost it. Then you can keep the sweets she was sending.' },
      ],
      end: [-4, -21.8],
      title: 'The whisperer who draws back',
      goal: 'Take the letter to Grandmother, turning from each whispered thought by seeking refuge in the Lord of people',
      intro: 'If a thought comes that is not good, you know what to say.',
      adaptation: 'The village and the letter are a game. No whisperer or jinn is shown: only a grey mist where a bad thought comes.',
      outro: 'The letter delivered, sealed just as it was sent.',
      after: { title: 'The retreating whisperer', refs: [[114, 4], [114, 5], [114, 6]], note: 'from the evil of the retreating whisperer, who whispers in the hearts of people, from among jinn and people.' },
    },
    {
      id: 'last',
      kind: 'read',
      requires: ['letter'],
      at: [14, -8],
      marker: 'tablet',
      title: 'The last surah',
      goal: 'Read the whole surah at the tablet by the market',
      reading: { title: 'The last surah', refs: [[114, 1], [114, 2], [114, 3], [114, 4], [114, 5], [114, 6]], note: 'Say: I seek refuge in the Lord of people, the King of people, the God of people, from the evil of the retreating whisperer, who whispers in the hearts of people, from among jinn and people.' },
    },
  ],
  finale: {
    title: 'The Lord of people',
    body: ['Three times a bad thought came, and three times you turned from it, and it drew back.', 'Surah An-Nas, the last surah of the Quran, teaches us to seek refuge in the Lord of people.'],
    ref: [114, 1],
    questions: ['What did the mist do when you listened to it?', 'What can you say when a bad thought comes?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No whisperer, jinn or devil is shown; only a grey mist marks a bad thought.', 'The village is a picture only.'],
};
