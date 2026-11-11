// Surah 56, Al-Waqi'ah (The Inevitable Event): the Travellers' Camp. A
// sheltered dry valley at dusk where travellers stop for the night, with a
// sown field, a well and a stone fire ring. The surah asks four times "Have
// you seen...?": the seed you sow, the water you drink, the fire you kindle
// (56:63-72). Each is answered here in its own place. The core play is the
// fire: kindle it with a bow drill, steady strokes to make an ember, then
// gentle breaths to make a flame (56:71-73, "We have made it a reminder and
// a provision for travellers"). The Hour and the three groups of the
// surah's opening are readings only; no one is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W056: WorldDef = {
  surah: 56,
  name: 'The Travellers’ Camp',
  theme: 'Kindle the travellers’ fire with a bow drill, after the seed and the water',
  play: 'Travellers stop for the night in a sheltered valley. Read at the field you sow and at the well you drink from, then kindle the fire at the camp with a bow drill: steady strokes until the dust smokes into an ember, then gentle breaths until it flames.',
  seed: 5656,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.8, seed: 56, shapes: [{ x: -26, z: -18, r: 14, h: 7 }, { x: 26, z: -22, r: 14, h: 6 }, { x: 0, z: -40, r: 16, h: 8 }] }),
    palette: PAL.dry,
    paths: [curve([[0, 40], [-6, 26], [-12, 14], [-2, 4], [10, 0], [4, -12]])],
    flats: [{ x: -10, z: 26, r: 4 }, { x: -12, z: 12, r: 3 }, { x: 12, z: 2, r: 3 }, { x: 2, z: -14, r: 5 }],
  },
  look: { ...LOOKS.dusk, sunI: 2.4 },
  veg: {
    grass: 0.5,
    lush: (x, z) => (Math.hypot(x + 10, z - 26) < 7 ? 1 : 0.35),
    flowers: ['#e8c070', '#fff2d8'],
    trees: [{ kind: 'palm', at: [[16, 4], [18, -2], [-18, 6]] }, { kind: 'olive', area: { x: 0, z: 20, r: 24 }, count: 5 }],
    rocks: [{ x: -26, z: -18, n: 6, big: 1.4, spread: 9 }, { x: 26, z: -22, n: 6, big: 1.4, spread: 9 }],
    pebbles: 40,
    rim: ['olive', 'palm'],
  },
  far: '#b8a070',
  mountains: { color: '#a08a80', height: 0.9 },
  start: [0, 40],
  startYaw: Math.PI,
  structures: [
    { type: 'fence', x: -15, z: 22, to: [-5, 22] },
    { type: 'well', x: 12, z: 2 },
    { type: 'tent', x: -4, z: -18, rot: 0.2, color: '#a87a5a' },
    { type: 'tent', x: 8, z: -19, rot: -0.3, color: '#7a5a4a' },
    { type: 'rug', x: 2, z: -11, rot: 0, color: '#8a4a3a' },
  ],
  welcome:
    'Welcome to the Travellers’ Camp. Surah Al-Waqi‘ah begins with the Day that will surely come. Then it asks about everyday things: the seed you sow, the water you drink, the fire you kindle. The travellers will need a fire tonight.',
  tasks: [
    {
      id: 'event',
      kind: 'read',
      at: [3, 36],
      marker: 'sign',
      title: 'When the Event happens',
      goal: 'Read at the sign at the top of the valley',
      adaptation: 'The Day and what happens on it are not pictured; these ayahs are read only.',
      reading: { title: 'The Event', refs: [[56, 1], [56, 2], [56, 3]], note: 'When the Event happens, no one will deny that it happens. It will bring some low and raise others high.' },
    },
    {
      id: 'sow',
      kind: 'read',
      requires: ['event'],
      at: [-10, 26],
      marker: 'tablet',
      title: 'The seed you sow',
      goal: 'Read at the tablet by the green field',
      reading: { title: 'The seed you sow', refs: [[56, 63], [56, 64], [56, 65]], note: 'Have you seen the seed that you sow? Is it you who make it grow, or are We the grower? If We willed, We could make it dry stalks, and you would be left wondering.' },
    },
    {
      id: 'water',
      kind: 'read',
      requires: ['sow'],
      at: [12, 5],
      marker: 'tablet',
      title: 'The water you drink',
      goal: 'Read at the tablet by the well',
      reading: { title: 'The water you drink', refs: [[56, 68], [56, 69], [56, 70]], note: 'Have you seen the water that you drink? Is it you who brought it down from the clouds, or are We the ones who bring it down? If We willed, We could make it salty. So why are you not grateful?' },
    },
    {
      id: 'fire',
      kind: 'firedrill',
      requires: ['water'],
      at: [2, -14],
      title: 'The fire you kindle',
      goal: 'At the fire ring by the tents, make an ember with the bow drill and blow it gently into a flame',
      intro: 'The bow drill is a wooden board, a spindle and a bow, all made from trees. Draw the bow back and forth with steady strokes, not too fast and not too slow, until the dust in the notch smokes. Then tip the ember into the dry grass and blow on it gently, with pauses between breaths.',
      adaptation: 'Lighting the fire is a game. The bow drill is a real way people make fire from wood; real fire is only ever lit with a grown-up.',
      outro: 'The fire is burning. The travellers can warm themselves and cook tonight.',
      after: { title: 'The fire you kindle', refs: [[56, 71], [56, 72], [56, 73], [56, 74]], note: 'Have you seen the fire that you kindle? Is it you who made its tree grow, or are We the ones who made it? We made it a reminder, and something useful for travellers. So glorify the name of your Lord, the Most Great.' },
    },
  ],
  finale: {
    title: 'Have you seen?',
    body: ['You read about the seed you sow and the water you drink, and kindled the travellers’ fire with steady strokes and gentle breaths.', 'Surah Al-Waqi‘ah asks about everyday things to make us think about who really gives them.'],
    ref: [56, 72],
    questions: ['Which of the four “Have you seen?” questions surprised you most?', 'What did the fire need: strength, or patience?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Day, the three groups and the Hereafter of this surah are read only, never shown.', 'Fire is lit in a game only; real fire needs a grown-up.'],
};
