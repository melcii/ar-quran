// Surah 61, As-Saff (The Row): the Garden Wall. An orchard on a slope whose
// old stone wall has fallen in one place, with the stones lying ready
// beside the gap. You said you would rebuild it; the surah asks "why do you
// say what you do not do?" (61:2). The core play: rebuild the wall course
// by course, long and short stones, so that no joint sits right above a
// joint below, then push it and feel it hold as one: a picture of "a
// structure joined firmly" (61:4). The ayah itself speaks of believers
// standing together in a row; the wall is only a picture of its image.
// Readings stand for the best trade (61:10-11) and the helpers of Allah
// (61:14). No one is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W061: WorldDef = {
  surah: 61,
  name: 'The Garden Wall',
  theme: 'Rebuild the fallen wall so every stone locks over the joint below',
  play: 'The orchard’s stone wall has fallen in one place. You said you would rebuild it. Lay it course by course with long and short stones, never putting a joint right above a joint, then push it and see whether it holds as one.',
  seed: 6161,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 1.4, seed: 61, tilt: [0, 0.04] }),
    palette: PAL.autumn,
    paths: [curve([[0, 36], [-4, 22], [2, 10], [0, 2]]), curve([[0, -2], [6, -14], [-2, -26]])],
    flats: [{ x: 0, z: 0, r: 4 }, { x: 10.7, z: 0, r: 4 }, { x: 5, z: 24, r: 3 }, { x: 6, z: -14, r: 3 }, { x: -6, z: -26, r: 3 }],
  },
  look: LOOKS.morning,
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#f0c080', '#e88a9a'],
    trees: [
      { kind: 'olive', area: { x: -16, z: -16, r: 12 }, count: 6 },
      { kind: 'fig', area: { x: 16, z: -16, r: 12 }, count: 5 },
      { kind: 'autumn', area: { x: 0, z: 26, r: 14 }, count: 4 },
    ],
    rocks: [{ x: -26, z: 18, n: 5, big: 1.1, spread: 6 }],
    pebbles: 20,
    rim: ['olive', 'oak', 'autumn'],
  },
  far: '#8a9a5a',
  mountains: { color: '#a0a0b0', height: 0.8 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    // The old wall across the slope: an opening for the path, and a fallen stretch further east.
    { type: 'wall', x: -26, z: 0, to: [-1.6, 0], h: 2.4, color: '#b8a888' },
    { type: 'wall', x: 1.6, z: 0, to: [7.9, 0], h: 2.4, color: '#b8a888' },
    { type: 'wall', x: 13.5, z: 0, to: [26, 0], h: 2.4, color: '#b8a888' },
  ],
  welcome:
    'Welcome to the Garden Wall. Part of the orchard’s old stone wall has fallen, and you said you would rebuild it. Surah As-Saff asks why people say what they do not do.',
  tasks: [
    {
      id: 'say',
      kind: 'read',
      at: [5, 24],
      marker: 'sign',
      title: 'Why say what you do not do?',
      goal: 'Read at the sign on the path down',
      reading: { title: 'Say and do', refs: [[61, 2], [61, 3]], note: 'O you who believe, why do you say what you do not do? It is greatly hated by Allah that you say what you do not do.' },
    },
    {
      id: 'wall',
      kind: 'bond',
      requires: ['say'],
      at: [10.7, 0],
      width: 9,
      courses: 4,
      title: 'Joined firmly',
      goal: 'Rebuild the fallen part of the wall, course by course, with no joint above a joint',
      intro: 'Lay long and short stones from one end to the other. In each course above the first, no joint may sit right above a joint in the course below: that is how a wall locks together. The fallen stretch is just along from the path’s opening.',
      adaptation: 'Rebuilding the wall is a game, and how it locks together is how real walls are built. The ayah speaks of believers standing together in a row; the wall is only a picture of “a structure joined firmly”.',
      outro: 'You push with all your weight, and the wall does not move: every stone holds the others.',
      after: { title: 'A structure joined firmly', refs: [[61, 4]], note: 'Allah loves those who stand together in His cause in rows, as if they were a single structure, joined firmly.' },
    },
    {
      id: 'trade',
      kind: 'read',
      requires: ['wall'],
      at: [6, -14],
      marker: 'tablet',
      title: 'The best trade',
      goal: 'Read at the tablet in the orchard',
      reading: { title: 'The best trade', refs: [[61, 10], [61, 11]], note: 'O you who believe, shall I show you a trade that will save you from a painful punishment? Believe in Allah and His Messenger, and strive in His cause with your wealth and yourselves. That is best for you, if you only knew.' },
    },
    {
      id: 'helpers',
      kind: 'read',
      requires: ['trade'],
      at: [-6, -26],
      marker: 'scroll',
      title: 'Helpers of Allah',
      goal: 'Read at the scroll at the bottom of the orchard',
      adaptation: '‘Isa and his disciples are never shown; this ayah is read only.',
      reading: { title: 'Helpers of Allah', refs: [[61, 14]], note: 'O you who believe, be helpers of Allah, as when ‘Isa son of Maryam said to the disciples, "Who will be my helpers for Allah?" The disciples said, "We are Allah’s helpers."' },
    },
  ],
  finale: {
    title: 'Said and done',
    body: ['You said you would rebuild the wall, and you did: course by course, every joint covered by a stone above it, until it held as one.', 'Surah As-Saff asks why people say what they do not do, and speaks of a structure joined firmly.'],
    ref: [61, 2],
    questions: ['What happened when a joint was right above another joint?', 'What is something you said you would do, that you could do today?'],
  },
  notes: ['Allah is never pictured, in any form.', '‘Isa, his disciples and the Prophet are never shown.', 'The wall is a picture of the image in 61:4, not a scene from the surah.'],
};
