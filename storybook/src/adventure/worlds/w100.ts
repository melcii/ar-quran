// Surah 100, Al-Adiyat (The Chargers): the Dawn Paddock. A horse farm in
// open steppe at first light, with a training ring, a stable and stony
// ground that throws sparks under shod hooves. "By the chargers, panting,
// striking sparks, raiding at dawn, raising dust" (100:1-4). The core play:
// watch a horse worked round the ring at its four paces and name each from
// which hooves strike together; then care for the horse that gave its all,
// walking it cool, watering it and rubbing it down: grateful, where 100:6
// says man is ungrateful to his Lord. No raid or battle is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { PAL, rolling } from './common';
import { dawnLook } from '../mechanics/dawn';

export const W100: WorldDef = {
  surah: 100,
  name: 'The Dawn Paddock',
  theme: 'Read a horse’s four paces from its hoofbeats, then care for it after the run',
  play: 'At a horse farm on the open steppe at first light, a horse is worked round the training ring at its four paces. Watch which hooves strike the ground on each beat and name the pace: walk, trot, canter or gallop. Then care for the hot, blowing horse that gave everything it had.',
  seed: 10010,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 0.7, seed: 100 }),
    palette: PAL.dry,
    paths: [curve([[0, 36], [6, 24], [0, 14], [0, 8]])],
    flats: [{ x: 0, z: -2, r: 8, paint: '#c8b088' }, { x: 6, z: 24, r: 3 }, { x: -14, z: 10, r: 3 }],
  },
  look: { ...dawnLook(0.7) },
  veg: {
    grass: 0.7,
    flowers: ['#f0e0a0'],
    trees: [{ kind: 'oak', at: [[-18, 18], [18, 14], [16, -18]] }],
    rocks: [{ x: 14, z: 2, n: 8, big: 0.7, spread: 6 }, { x: -16, z: -6, n: 6, big: 0.8, spread: 5 }],
    pebbles: 40,
    rim: ['oak'],
  },
  far: '#b0a080',
  mountains: { color: '#8a8478', height: 0.6 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    { type: 'fence', x: -7, z: -9, to: [7, -9] },
    { type: 'fence', x: -8, z: -8, to: [-8, 3] },
    { type: 'fence', x: 8, z: -8, to: [8, 3] },
    { type: 'house', x: -15, z: -2, rot: Math.PI / 2, w: 6, d: 4.4, h: 3.2, accent: '#6a4a2a' },
    { type: 'well', x: 12, z: 10 },
  ],
  welcome:
    'Welcome to the Dawn Paddock. Surah Al-Adiyat opens with horses running hard at dawn: panting, striking sparks from the stones, raising dust. Come to the rail of the training ring and watch their hooves.',
  tasks: [
    {
      id: 'chargers',
      kind: 'read',
      at: [6, 24],
      marker: 'sign',
      title: 'By the chargers',
      goal: 'Read at the sign on the farm track',
      adaptation: 'The horses in the ayahs run in a raid; no raid or battle is shown here.',
      reading: { title: 'By the chargers', refs: [[100, 1], [100, 2], [100, 3], [100, 4], [100, 5]], note: 'By the chargers, panting, striking sparks, raiding at dawn, raising dust, charging into the midst together.' },
    },
    {
      id: 'paces',
      kind: 'gaits',
      requires: ['chargers'],
      at: [0, 5],
      ring: [0, -2],
      runs: ['trot', 'walk', 'gallop', 'canter'],
      title: 'The four paces',
      goal: 'Name each pace from the hoofbeats, then care for the horse after its run',
      intro: 'Count the beats, and see which hooves strike together.',
      adaptation: 'The paddock is a game. The walk, trot, canter and gallop, and their footfalls, are real.',
      outro: 'Four paces named, and the horse cool, watered and rubbed down.',
      after: { title: 'Ungrateful', refs: [[100, 6], [100, 7], [100, 8]], note: 'Indeed, man is ungrateful to his Lord, and he is a witness to that himself, and he is fierce in his love of wealth.' },
    },
    {
      id: 'hearts',
      kind: 'read',
      requires: ['paces'],
      at: [-14, 10],
      marker: 'tablet',
      title: 'What is in the hearts',
      goal: 'Read at the tablet by the stable',
      reading: { title: 'What is in the hearts', refs: [[100, 9], [100, 10], [100, 11]], note: 'Does he not know, when what is in the graves is brought out, and what is in the hearts is laid bare, that their Lord will be fully aware of them that Day?' },
    },
  ],
  finale: {
    title: 'Gratitude',
    body: ['The horse gave everything it had in the ring, and you looked after it in return.', 'Surah Al-Adiyat says that man is ungrateful to his Lord, though he is a witness to it himself.'],
    ref: [100, 6],
    questions: ['How could you tell a canter from a gallop?', 'What are you given every day that is easy to forget to thank Allah for?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No raid or battle is shown; the horses are only worked in a ring.', 'The Day (100:9-11) is read only, never shown.'],
};
