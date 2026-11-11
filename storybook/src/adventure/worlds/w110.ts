// Surah 110, An-Nasr (The Help): the New Gate. A hill village building a
// stone arch for its new gate, with a heap of shaped stones, a wooden
// frame and the whole village ready to celebrate. "When the help of Allah
// and the victory come ... then glorify with the praise of your Lord and
// ask His forgiveness" (110:1-3). The core play: build the arch as masons
// do, both sides in turn, keystone last, frame away; then, before the
// celebration, stop to praise Allah and ask His forgiveness. No battle or
// conquest is shown; the Prophet, who is addressed, is never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W110: WorldDef = {
  surah: 110,
  name: 'The New Gate',
  theme: 'Build a stone arch both sides in turn, keystone last; then praise before celebrating',
  play: 'The village is building a stone arch for its new gate. Set the shaped stones on the wooden frame from the left and the right in turn, so it never leans. The keystone goes in last; only then can the frame come away. When the arch stands and everyone cheers, stop first to glorify Allah and ask His forgiveness.',
  seed: 11010,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 0.8, seed: 110 }),
    palette: PAL.autumn,
    paths: [curve([[0, 34], [-6, 22], [0, 10], [0, -14]])],
    flats: [{ x: 0, z: -2, r: 7, paint: '#c8b898' }, { x: -6, z: 22, r: 3 }, { x: 12, z: 10, r: 3 }],
  },
  look: { ...LOOKS.golden, sunI: 2.6 },
  veg: {
    grass: 0.8,
    flowers: ['#f8e0a0', '#f0b0c0'],
    trees: [{ kind: 'olive', at: [[-14, 12], [14, 18], [-16, -10]] }, { kind: 'cypress', at: [[10, -12], [-8, -14]] }],
    rocks: [{ x: 6, z: 4, n: 6, big: 0.6, spread: 2 }],
    pebbles: 20,
    rim: ['olive', 'cypress'],
  },
  far: '#a0a080',
  mountains: { color: '#9a9088', height: 0.8 },
  start: [0, 34],
  startYaw: Math.PI,
  structures: [
    { type: 'wall', x: -14, z: -4, to: [-3, -4], h: 2.6, color: '#b8a888' },
    { type: 'wall', x: 3, z: -4, to: [14, -4], h: 2.6, color: '#b8a888' },
    { type: 'festoon', x: -10, z: 2, to: [10, 2], h: 3, color: '#f0d890' },
    { type: 'house', x: -10, z: -12, rot: 0.3, w: 4.4, d: 3.8, h: 3, accent: '#6a8a4a' },
  ],
  welcome:
    'Welcome to the New Gate. Today the village finishes the arch of its new gate, and everyone is ready for a celebration. Surah An-Nasr says what to do first when help and success come.',
  tasks: [
    {
      id: 'help',
      kind: 'read',
      at: [-6, 22],
      marker: 'sign',
      title: 'When the help comes',
      goal: 'Read at the sign on the village lane',
      adaptation: 'The victory and the conquest are read only; no battle is shown. The Prophet, who is addressed, is never shown.',
      reading: { title: 'When the help comes', refs: [[110, 1], [110, 2]], note: 'When the help of Allah and the victory come, and you see the people entering the religion of Allah in crowds,' },
    },
    {
      id: 'arch',
      kind: 'arch',
      requires: ['help'],
      at: [0, -4],
      stones: 6,
      title: 'The keystone',
      goal: 'Build the arch from both sides in turn, set the keystone, take away the frame, then praise before celebrating',
      intro: 'Left, right, left, right: keystone last.',
      adaptation: 'The village and its gate are a game. Building an arch on a wooden frame, both sides together and the keystone last, is real.',
      outro: 'The arch stands, and the celebration began with praise.',
      after: { title: 'Glorify and ask forgiveness', refs: [[110, 3]], note: 'then glorify with the praise of your Lord, and ask His forgiveness. Indeed, He is ever Accepting of repentance.' },
    },
    {
      id: 'praise',
      kind: 'read',
      requires: ['arch'],
      at: [12, 10],
      marker: 'tablet',
      title: 'The whole surah',
      goal: 'Read at the tablet beside the new gate',
      reading: { title: 'The whole surah', refs: [[110, 1], [110, 2], [110, 3]], note: 'When the help of Allah and the victory come, and you see the people entering the religion of Allah in crowds, then glorify with the praise of your Lord and ask His forgiveness. Indeed, He is ever Accepting of repentance.' },
    },
  ],
  finale: {
    title: 'Praise first',
    body: ['The arch stands on its own, locked by its keystone, and before the feast you stopped to praise Allah and ask His forgiveness.', 'Surah An-Nasr teaches what to do when help and success come.'],
    ref: [110, 3],
    questions: ['Why did the keystone have to go in last?', 'When something goes well for you, what can you say first?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No battle or conquest is shown.', 'The Prophet, addressed in this surah, is never shown.'],
};
