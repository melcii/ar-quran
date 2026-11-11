// Surah 91, Ash-Shams (The Sun): the Village Hall Lamp. A whitewashed
// village hall at sunset, with the sun going down and the moon rising after
// it (91:1-2), and a great brass lamp on a stand, dull and green with
// tarnish. "Successful is the one who purifies it, and failed is the one who
// buries it" (91:9-10), said of the soul. The core play: polish the lamp
// patch by patch, rubbing with a cloth and using ash paste only on the
// stubborn spots, until it shines and lights the hall. The lamp is only a
// picture of keeping something clean. Thamud (91:11-15) is read only:
// Salih, a prophet, and the she-camel are never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W091: WorldDef = {
  surah: 91,
  name: 'The Village Hall Lamp',
  theme: 'Polish a tarnished brass lamp until it shines, as the soul is kept pure',
  play: 'At sunset, the big brass lamp that lights the village hall is dull and green with tarnish. Polish it patch by patch with a cloth. Most spots come clean with steady rubbing; a few stubborn ones need a little ash paste. As each patch clears, the lamp shines brighter, until it lights the whole hall.',
  seed: 9191,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 0.8, seed: 91 }),
    palette: PAL.autumn,
    paths: [curve([[0, -34], [-6, -22], [0, -12], [0, -6]])],
    flats: [{ x: 0, z: 0, r: 8, paint: '#d8c8a8' }, { x: -6, z: -22, r: 3 }, { x: 12, z: -10, r: 3 }],
  },
  look: { ...LOOKS.dusk, moon: [-0.6, 0.25, 0.7] },
  veg: {
    grass: 0.9,
    flowers: ['#fff2d8', '#f4d060'],
    trees: [{ kind: 'cypress', at: [[-8, -8], [8, -8]] }, { kind: 'olive', area: { x: 0, z: -24, r: 12 }, count: 4 }],
    rocks: [],
    pebbles: 10,
    rim: ['olive', 'cypress'],
  },
  far: '#8a8a6a',
  mountains: { color: '#7a7aa0', height: 0.8 },
  start: [0, -34],
  startYaw: 0,
  structures: [
    { type: 'wall', x: -6, z: 6, to: [6, 6], h: 3.4, color: '#efe6d4' },
    { type: 'wall', x: -6, z: 6, to: [-6, -4], h: 3.4, color: '#efe6d4' },
    { type: 'wall', x: 6, z: 6, to: [6, -4], h: 3.4, color: '#efe6d4' },
    { type: 'rug', x: 0, z: 1, w: 5, d: 4 },
    { type: 'bench', x: -3.5, z: 4, rot: 0 },
    { type: 'bench', x: 3.5, z: 4, rot: 0 },
  ],
  welcome:
    'Welcome to the Village Hall Lamp. Surah Ash-Shams swears by the sun, the moon, the day, the night, the sky, the earth and the soul, and says: successful is the one who purifies the soul. The hall’s lamp has gone dull. Can you make it shine?',
  tasks: [
    {
      id: 'sun',
      kind: 'read',
      at: [-6, -22],
      marker: 'sign',
      title: 'By the sun',
      goal: 'Read at the sign on the lane as the sun goes down',
      reading: { title: 'By the sun', refs: [[91, 1], [91, 2], [91, 3], [91, 4], [91, 5], [91, 6]], note: 'By the sun and its morning brightness, and the moon as it follows it, and the day as it shows it, and the night as it covers it, and the sky and the One who built it, and the earth and the One who spread it.' },
    },
    {
      id: 'lamp',
      kind: 'polish',
      requires: ['sun'],
      at: [0, 2],
      cols: 4,
      rows: 3,
      hard: [1, 6, 10],
      title: 'Bright again',
      goal: 'Polish every patch of the brass lamp until it shines',
      intro: 'Rub each dull patch with the cloth. Use the ash paste only on stubborn spots: on clean brass it scratches.',
      adaptation: 'The hall and its lamp are a game, and only a picture of keeping something clean; purifying the soul is between a person and Allah.',
      outro: 'The lamp shines, and its light fills the hall.',
      after: { title: 'The one who purifies it', refs: [[91, 7], [91, 8], [91, 9], [91, 10]], note: 'By the soul and the One who shaped it, and inspired it with its wrong and its right: successful is the one who purifies it, and failed is the one who buries it.' },
    },
    {
      id: 'thamud',
      kind: 'read',
      requires: ['lamp'],
      at: [12, -10],
      marker: 'tablet',
      title: 'Thamud denied',
      goal: 'Read at the tablet outside the hall',
      adaptation: 'Salih is a prophet and is never shown, voiced or played. The she-camel and Thamud are not shown; the account is read only.',
      reading: { title: 'Thamud denied', refs: [[91, 11], [91, 12], [91, 13], [91, 14], [91, 15]], note: 'Thamud denied the truth in their arrogance, when the most wretched of them rose up. The messenger of Allah said to them, “This is Allah’s she-camel: let her drink.” But they called him a liar and cut her down, so their Lord destroyed them for their sin and levelled them all. And He does not fear what follows.' },
    },
  ],
  finale: {
    title: 'Shining',
    body: ['Patch by patch, with steady rubbing and a little paste for the stubborn spots, the lamp came bright and lit the hall.', 'Surah Ash-Shams says the successful one is the one who purifies the soul.'],
    ref: [91, 9],
    questions: ['Why did the stubborn spots need something different?', 'What helps keep a heart clean?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Salih is a prophet and is never shown, voiced or played; the she-camel is not shown.', 'The lamp is a picture only, not a claim about the soul.'],
};
