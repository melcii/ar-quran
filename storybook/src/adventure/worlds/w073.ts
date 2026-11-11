// Surah 73, Al-Muzzammil (The Wrapped One): the Rooftop Water Clock. A
// flat-roofed village at sunset, with a quiet roof terrace and a water
// clock: a tall jar that empties slowly from sunset to dawn, with a scale on
// its side. The surah says "Arise in the night, except for a little: half
// of it, or a little less, or a little more" (73:2-4), and "your Lord knows
// that you stand almost two thirds of the night, or half of it, or a third
// of it" (73:20). The core play: from tonight's sunset and dawn, work out
// when a third, half and two thirds of the night have passed, set a peg at
// each, then keep watch as the water falls. The Prophet is never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W073: WorldDef = {
  surah: 73,
  name: 'The Rooftop Water Clock',
  theme: 'Measure the night with a water clock: a third, a half, two thirds',
  play: 'On a quiet roof terrace at sunset stands a water clock that empties slowly through the night. Tonight the sun sets at 18:30 and dawn comes at 05:00. Work out when a third, half and two thirds of the night will have passed, set a peg at each on the clock, then keep watch as the water falls.',
  seed: 7373,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 0.7, seed: 73 }),
    palette: PAL.dry,
    paths: [curve([[0, 34], [6, 22], [-2, 10], [0, 4]])],
    flats: [{ x: 0, z: 0, r: 8 }, { x: 8, z: 22, r: 3 }, { x: -8, z: 12, r: 3 }],
  },
  look: { ...LOOKS.dusk, sunI: 2 },
  veg: {
    grass: 0.5,
    flowers: ['#fff2d8'],
    trees: [{ kind: 'palm', at: [[-12, -10], [12, -12], [14, 10]] }],
    rocks: [],
    pebbles: 12,
    rim: ['palm', 'olive'],
  },
  far: '#a8906a',
  mountains: { color: '#7a7a98', height: 0.7 },
  start: [0, 34],
  startYaw: Math.PI,
  structures: [
    { type: 'terrace', x: 0, z: 0, w: 10, d: 8, h: 0.35, color: '#e2d2b0' },
    { type: 'house', x: -12, z: 2, rot: Math.PI / 2, w: 5, d: 4.4, h: 3.4, accent: '#5a6a8a' },
    { type: 'house', x: 12, z: 2, rot: -Math.PI / 2, w: 5, d: 4.4, h: 3.4, accent: '#8a5a3a' },
    { type: 'house', x: 0, z: -12, rot: 0, w: 6, d: 4.4, h: 3.6, accent: '#6a7a5a' },
    { type: 'rug', x: -2.5, z: 1, w: 2, d: 3 },
  ],
  welcome:
    'Welcome to the Rooftop Water Clock. Surah Al-Muzzammil speaks of standing in the night to pray and recite: half of it, or a little less, or a little more. Allah measures the night and the day. Tonight you will measure the night with a water clock.',
  tasks: [
    {
      id: 'arise',
      kind: 'read',
      at: [8, 22],
      marker: 'sign',
      title: 'Arise in the night',
      goal: 'Read at the sign on the lane',
      adaptation: 'The Prophet, who is addressed here, is never shown; the ayahs are read only.',
      reading: { title: 'Arise in the night', refs: [[73, 1], [73, 2], [73, 3], [73, 4]], note: 'O you wrapped in garments! Stand in the night, except a little: half of it, or a little less, or a little more, and recite the Quran slowly and clearly.' },
    },
    {
      id: 'hours',
      kind: 'read',
      requires: ['arise'],
      at: [-8, 12],
      marker: 'tablet',
      title: 'The hours of the night',
      goal: 'Read at the tablet by the stair',
      reading: { title: 'The hours of the night', refs: [[73, 6], [73, 7], [73, 8]], note: 'Indeed, rising at night is firmer, and words are clearer then. By day you have long work to do. So remember the name of your Lord, and devote yourself to Him completely.' },
    },
    {
      id: 'clock',
      kind: 'nightclock',
      requires: ['hours'],
      at: [2, -1],
      dusk: 18.5,
      dawn: 5,
      marks: [
        { name: 'a third', frac: 1 / 3 },
        { name: 'half', frac: 1 / 2 },
        { name: 'two thirds', frac: 2 / 3 },
      ],
      title: 'Measuring the night',
      goal: 'At the water clock, set a peg for a third, half and two thirds of the night, then keep watch',
      intro: 'Count how long tonight is from sunset to dawn. Then work out when a third, half and two thirds of it will have passed, counting from sunset.',
      adaptation: 'The roof terrace and the times tonight are a game idea; water clocks are real, and people measured the night with them.',
      outro: 'The water fell past every peg, and the night was measured.',
      after: { title: 'Allah measures the night', refs: [[73, 20]], note: 'Your Lord knows that you stand almost two thirds of the night, or half of it, or a third of it, and so do some of those with you. And Allah measures the night and the day. So recite what is easy of the Quran.' },
    },
  ],
  finale: {
    title: 'The night measured',
    body: ['Tonight was ten and a half hours long. A third passed at 22:00, half at 23:45, and two thirds at 01:30.', 'Surah Al-Muzzammil says Allah measures the night and the day, and asks us to recite what is easy.'],
    ref: [73, 20],
    questions: ['Why might the night be a good time to recite?', 'How would the pegs move on a short summer night?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet is addressed in this surah and is never shown, voiced or played.', 'The night’s times are an example for the game, not a prayer timetable.'],
};
