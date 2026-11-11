// Surah 88, Al-Ghashiyah (The Overwhelming): the Dune Well. A well among
// tall dunes under a wide sky, with far mountains and a camel resting by
// the trough. "Do they not look at the camels, how they are created? And at
// the sky, how it is raised? And at the mountains, how they are set firm?
// And at the earth, how it is spread out?" (88:17-20). The core play: look
// closely at how the camel is made and say what each part is for; then,
// when a sandstorm blows in and the camel kneels, shelter on the side of it
// away from the wind. The Day of 88:1-16 is never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W088: WorldDef = {
  surah: 88,
  name: 'The Dune Well',
  theme: 'Look at how the camel is made for the desert, then shelter by it in a sandstorm',
  play: 'At a well among tall dunes, a camel rests by the trough. Look closely at it: its eyelashes, its nostrils, its hump, its feet, the pads on its knees. Say what each is for. Then a sandstorm blows in: the camel kneels and shuts its eyes, and you must shelter on its calm side, away from the wind.',
  seed: 8888,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 2.4, seed: 88 }),
    palette: PAL.desert,
    paths: [curve([[0, -38], [-8, -24], [-2, -10], [0, -4]])],
    flats: [{ x: 0, z: 2, r: 7, paint: '#e2c890' }, { x: -8, z: -24, r: 3 }, { x: 14, z: 16, r: 3 }],
  },
  look: LOOKS.desert,
  veg: {
    grass: 0.2,
    flowers: ['#e8c070'],
    trees: [{ kind: 'palm', at: [[5, 7], [-5, 8]] }],
    rocks: [],
    pebbles: 20,
    rim: ['palm'],
  },
  far: '#d0a870',
  mountains: { color: '#b8907a', height: 1.3 },
  start: [0, -38],
  startYaw: 0,
  structures: [
    { type: 'well', x: -3, z: 4 },
  ],
  welcome:
    'Welcome to the Dune Well. Surah Al-Ghashiyah asks: do they not look at the camels, how they are made? And at the sky, the mountains and the earth? A camel is resting by the well. Look at it closely.',
  tasks: [
    {
      id: 'look',
      kind: 'read',
      at: [-8, -24],
      marker: 'sign',
      title: 'Do they not look?',
      goal: 'Read at the sign among the dunes',
      reading: { title: 'Do they not look?', refs: [[88, 17], [88, 18], [88, 19], [88, 20]], note: 'Do they not look at the camels, how they are created? And at the sky, how it is raised high? And at the mountains, how they are set firm? And at the earth, how it is spread out?' },
    },
    {
      id: 'camel',
      kind: 'camel',
      requires: ['look'],
      at: [2, 2],
      wind: [1, 0],
      secs: 4,
      parts: [
        { name: 'long double eyelashes', use: 'keeping blowing sand out of its eyes' },
        { name: 'slit nostrils that can close', use: 'shutting out the sand in a storm' },
        { name: 'hump', use: 'storing fat for long journeys with little food' },
        { name: 'broad, padded feet', use: 'spreading out so they do not sink in soft sand' },
        { name: 'tough pads on its knees and chest', use: 'kneeling on hot, rough ground' },
      ],
      title: 'How is the camel made?',
      goal: 'Look at each part of the camel and say what it is for; then shelter by it from the sandstorm',
      intro: 'Choose a part of the camel, then choose what it is for.',
      adaptation: 'The well is a game. Every feature of the camel here is real.',
      outro: 'The camel, made for the desert, sheltered you from the storm.',
      after: { title: 'Only a reminder', refs: [[88, 21], [88, 22]], note: 'So remind, for you are only one who reminds. You are not one who controls them.' },
    },
    {
      id: 'spring',
      kind: 'read',
      requires: ['camel'],
      at: [14, 16],
      marker: 'tablet',
      title: 'Faces that day',
      goal: 'Read at the tablet on the dune top',
      adaptation: 'The Day and the Garden are never pictured; they are read only.',
      reading: { title: 'Faces that day', refs: [[88, 8], [88, 9], [88, 10]], note: 'Some faces that Day will be joyful, pleased with their striving, in a high garden.' },
    },
  ],
  finale: {
    title: 'Made for the desert',
    body: ['Eyelashes, nostrils, hump, feet and knee pads: each part of the camel suits the desert, and the camel sheltered you in the storm.', 'Surah Al-Ghashiyah asks us to look at how the camel is made.'],
    ref: [88, 17],
    questions: ['Which part of the camel surprised you most?', 'What other animal is made just right for where it lives?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Day, the Fire and the Garden of 88:1-16 are read or left out, never shown.', 'The Prophet, addressed in 88:21-22, is never shown.'],
};
