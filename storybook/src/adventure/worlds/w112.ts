// Surah 112, Al-Ikhlas (Sincerity): the Reading Court. A quiet walled court
// for reading and learning by heart, its floor still bare, with a compass
// and a straight edge on the bench. "Say: He is Allah, the One; Allah, the
// Eternal Refuge; He neither begets nor is born, and there is none
// comparable to Him" (112:1-4). The core play: draw the court's floor
// rosette with only compass and straight edge, the real way, from one
// circle. No shape, line or pattern stands for Allah, to whom nothing is
// comparable; the pattern is floor decoration only.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W112: WorldDef = {
  surah: 112,
  name: 'The Reading Court',
  theme: 'Draw a six-fold floor rosette with compass and straight edge in a quiet reading court',
  play: 'A quiet walled court for reading is nearly finished, and its floor will carry a geometric rosette drawn the way craftsmen have long drawn them: with only a compass and a straight edge. Draw one circle, step the compass round its edge at the same width, and join the points.',
  seed: 11212,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 0.4, seed: 112 }),
    palette: PAL.dry,
    paths: [curve([[0, 32], [-4, 20], [0, 10], [0, 6]])],
    flats: [{ x: 0, z: 0, r: 7, paint: '#e8e0cc' }, { x: -4, z: 20, r: 3 }, { x: 0, z: -5, r: 2 }],
  },
  look: { ...LOOKS.morning, sunI: 2.6 },
  veg: {
    grass: 0.4,
    flowers: ['#f8f0e0'],
    trees: [{ kind: 'cypress', at: [[-10, 10], [10, 10], [-12, -10], [12, -10]] }],
    rocks: [],
    pebbles: 6,
    rim: ['cypress'],
  },
  far: '#b0b0a0',
  mountains: { color: '#a8a8b0', height: 0.6 },
  start: [0, 32],
  startYaw: Math.PI,
  structures: [
    { type: 'terrace', x: 0, z: 0, w: 10, d: 10, h: 0.15, color: '#ece4d0' },
    { type: 'wall', x: -6, z: -6, to: [6, -6], h: 2.4, color: '#e0d4b8' },
    { type: 'wall', x: -6, z: -6, to: [-6, 4], h: 2.4, color: '#e0d4b8' },
    { type: 'wall', x: 6, z: -6, to: [6, 4], h: 2.4, color: '#e0d4b8' },
    { type: 'bench', x: 3.5, z: 3.5, rot: -0.6 },
  ],
  welcome:
    'Welcome to the Reading Court. Surah Al-Ikhlas is short: four ayahs. It says who Allah is, and that there is none comparable to Him. Nothing in this court pictures Him: the floor will only carry a pattern for a place to read.',
  tasks: [
    {
      id: 'one',
      kind: 'read',
      at: [-4, 20],
      marker: 'sign',
      title: 'He is Allah, One',
      goal: 'Read at the sign on the path to the court',
      reading: { title: 'He is Allah, One', refs: [[112, 1], [112, 2]], note: 'Say: He is Allah, the One; Allah, the Eternal Refuge.' },
    },
    {
      id: 'floor',
      kind: 'compass',
      requires: ['one'],
      at: [0, 0],
      title: 'One circle',
      goal: 'Draw the floor rosette with compass and straight edge: one circle, six equal steps round it, then join the points',
      intro: 'Keep the compass at the same width all the way round.',
      adaptation: 'The court is a game. Drawing a six-fold rosette from one circle with compass and straight edge is real geometry. No shape here stands for Allah.',
      outro: 'A six-petalled rosette in a perfect hexagon on the reading-court floor.',
      after: { title: 'None comparable to Him', refs: [[112, 3], [112, 4]], note: 'He neither begets nor is born, and there is none comparable to Him.' },
    },
    {
      id: 'whole',
      kind: 'read',
      requires: ['floor'],
      at: [0, -4.5],
      marker: 'tablet',
      title: 'The whole surah',
      goal: 'Read the whole surah at the tablet in the court',
      reading: { title: 'The whole surah', refs: [[112, 1], [112, 2], [112, 3], [112, 4]], note: 'Say: He is Allah, the One; Allah, the Eternal Refuge; He neither begets nor is born, and there is none comparable to Him.' },
    },
  ],
  finale: {
    title: 'None comparable to Him',
    body: ['One circle, and the same compass width stepped round it exactly six times: a pattern for a place to read.', 'Surah Al-Ikhlas: He is Allah, One. He neither begets nor is born, and there is none comparable to Him. Nothing we draw could picture Him.'],
    ref: [112, 4],
    questions: ['Why did the compass have to stay at the same width?', 'What does "none comparable to Him" mean to you?'],
  },
  notes: ['Allah is never pictured, in any form, and no shape, line or pattern here stands for Him.', 'The rosette is floor decoration only.', 'No prophet appears in this world.'],
};
