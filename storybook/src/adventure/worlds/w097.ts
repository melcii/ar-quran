// Surah 97, Al-Qadr (The Decree): the Night Rooftop. A flat village rooftop
// in the last nights of Ramadan, with a prayer mat, a lamp and an old
// counting frame. "The Night of Decree is better than a thousand months ...
// Peace it is, until the rise of dawn" (97:3-5). The core play: count a
// thousand months on the beads (83 years and 4 months, a whole long life),
// then keep the night still on the mat, watch by watch, while the moon
// climbs and the stars fade into dawn. The angels and the Spirit who
// descend that night are read only, never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W097: WorldDef = {
  surah: 97,
  name: 'The Night Rooftop',
  theme: 'Count a thousand months, then keep one night still until dawn',
  play: 'On a flat rooftop in the last nights of Ramadan, an old counting frame sits by the prayer mat. Count a thousand months on its beads to see how long that is: 83 years and 4 months. Then keep the night: sit still on the mat, watch by watch, as the moon climbs and the stars fade into dawn.',
  seed: 9797,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 0.5, seed: 97 }),
    palette: PAL.dry,
    paths: [curve([[0, 32], [-4, 20], [2, 10], [0, 5]])],
    flats: [{ x: 0, z: 0, r: 7, paint: '#d8c8a8' }, { x: -4, z: 20, r: 3 }, { x: 10, z: 8, r: 3 }],
  },
  look: { ...LOOKS.dusk, sunI: 1.6 },
  veg: {
    grass: 0.4,
    flowers: ['#f8f0d8'],
    trees: [{ kind: 'palm', at: [[-12, 14], [14, 18], [-16, -8], [12, -12]] }],
    rocks: [],
    pebbles: 10,
    rim: ['palm'],
  },
  far: '#6a6a8a',
  mountains: { color: '#6a6a80', height: 0.6 },
  start: [0, 32],
  startYaw: Math.PI,
  structures: [
    { type: 'terrace', x: 0, z: 0, w: 10, d: 8, h: 0.3, color: '#e0d0b0' },
    { type: 'wall', x: -5, z: -4, to: [5, -4], h: 0.9, color: '#d8c8a8' },
    { type: 'house', x: -12, z: 2, rot: Math.PI / 2, w: 5, d: 4, h: 3.2, accent: '#8a6a3a' },
    { type: 'house', x: 13, z: 0, rot: -Math.PI / 2, w: 4.6, d: 4, h: 3.4, accent: '#3a5a7a' },
    { type: 'festoon', x: -5, z: -4, to: [5, -4], h: 2.2, color: '#ffd890' },
  ],
  welcome:
    'Welcome to the Night Rooftop. It is one of the last nights of Ramadan. Surah Al-Qadr says one night is better than a thousand months. How long is a thousand months? The counting frame is waiting by the prayer mat.',
  tasks: [
    {
      id: 'decree',
      kind: 'read',
      at: [-4, 20],
      marker: 'sign',
      title: 'The Night of Decree',
      goal: 'Read at the sign in the lane',
      adaptation: 'The sending down of the Quran is read only; nothing of it is shown.',
      reading: { title: 'The Night of Decree', refs: [[97, 1], [97, 2]], note: 'Indeed, We sent it down on the Night of Decree. And what can make you know what the Night of Decree is?' },
    },
    {
      id: 'night',
      kind: 'abacus',
      requires: ['decree'],
      at: [2.4, 0],
      mat: [-1.6, 0.4],
      months: 1000,
      secs: 24,
      title: 'Better than a thousand months',
      goal: 'Count a thousand months on the beads, then keep the night still on the mat until dawn',
      intro: 'A year at a time, ten years at a time, and a month at a time at the end.',
      adaptation: 'The rooftop and the counting frame are a game. The angels and the Spirit who descend that night are read only, never shown.',
      outro: 'Dawn over the rooftops after a still night.',
      after: { title: 'Peace until dawn', refs: [[97, 3], [97, 4], [97, 5]], note: 'The Night of Decree is better than a thousand months. The angels and the Spirit descend in it by permission of their Lord, for every matter. Peace it is, until the rise of dawn.' },
    },
    {
      id: 'peace',
      kind: 'read',
      requires: ['night'],
      at: [10, 8],
      marker: 'tablet',
      title: 'Until the rise of dawn',
      goal: 'Read at the tablet by the stair',
      reading: { title: 'Until the rise of dawn', refs: [[97, 5]], note: 'Peace it is, until the rise of dawn.' },
    },
  ],
  finale: {
    title: 'Better than a thousand months',
    body: ['A thousand months is 83 years and 4 months: longer than many whole lives.', 'Surah Al-Qadr says one night is better than all of it, and that it is peace until the rise of dawn.'],
    ref: [97, 3],
    questions: ['How old would you be after a thousand months?', 'What was it like to keep still through the night?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The angels and the Spirit are never shown; 97:4 is read only.', 'The Prophet, who received the Quran, is never shown.'],
};
