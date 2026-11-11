// Surah 86, At-Tariq (The Night Comer): the Salt Shore. A hot, rocky shore
// by a bright sea, with salt pans along the water and no fresh spring. "By
// the sky which returns, and the earth which splits open" (86:11-12): the
// sun lifts water from the sea, and the sky returns it as fresh rain. The
// core play: build a small sun still from a basin of sea water, a clear
// cover and a cup, choosing where it stands, how the cover slopes and
// whether its edges are sealed, until fresh water drips into the cup; then
// taste it. The piercing star of 86:1-3 is read at the evening lookout.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W086: WorldDef = {
  surah: 86,
  name: 'The Salt Shore',
  theme: 'Get fresh water from the sea with the sun, as the sky returns the rain',
  play: 'On a hot, rocky shore there is only salt water. Build a sun still: a basin of sea water, a clear cover and a cup. Choose where it stands, how the cover slopes and whether the edges are sealed, then wait and watch. Each try shows you what the sun and the vapour do, until fresh water drips into the cup.',
  seed: 8686,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.2, seed: 86, tilt: [0, -0.07], shapes: [{ x: 0, z: -48, r: 30, h: -10 }] }),
    palette: PAL.coast,
    paths: [curve([[0, 36], [6, 24], [2, 12], [0, 6]])],
    water: -2.5,
    shore: '#e2d2b0',
    flats: [{ x: 0, z: 2, r: 5 }, { x: 6, z: 24, r: 3 }, { x: -12, z: 14, r: 3 }],
  },
  look: { ...LOOKS.sea, sunI: 3.4 },
  veg: {
    grass: 0.3,
    flowers: ['#fff2d8'],
    trees: [{ kind: 'palm', at: [[-14, 22], [14, 18]] }],
    rocks: [{ x: -14, z: 0, n: 7, big: 1.2, spread: 5 }, { x: 14, z: 2, n: 6, big: 1.2, spread: 5 }],
    pebbles: 40,
    rim: ['palm'],
  },
  far: '#a8b0a0',
  mountains: { color: '#a8a0a0', height: 0.7 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    { type: 'stones', x: -3, z: 4, n: 4 },
    { type: 'pool', x: 5, z: 4, w: 2.4 },
  ],
  welcome:
    'Welcome to the Salt Shore. Surah At-Tariq swears by the sky that returns, and the earth that splits open. The sun lifts water from the sea, and the sky gives it back as fresh rain. There is no spring here. Can the sun make you fresh water?',
  tasks: [
    {
      id: 'protector',
      kind: 'read',
      at: [6, 24],
      marker: 'sign',
      title: 'Over every soul',
      goal: 'Read at the sign on the path down to the shore',
      reading: { title: 'Over every soul', refs: [[86, 4], [86, 5]], note: 'There is no soul without a guardian over it. So let a person look at what they were created from.' },
    },
    {
      id: 'still',
      kind: 'still',
      requires: ['protector'],
      at: [0, 2],
      title: 'The sky that returns',
      goal: 'Build a sun still that turns sea water into fresh water, then taste what it makes',
      intro: 'Choose where the still stands, how its cover slopes and whether the edges are sealed. Then wait and watch.',
      adaptation: 'The shore is a game. Sun stills are real: the sun lifts water and leaves the salt behind.',
      outro: 'Fresh water, from the sea, by the sun.',
      after: { title: 'The sky that returns', refs: [[86, 11], [86, 12], [86, 13], [86, 14]], note: 'By the sky that returns the rain, and the earth that splits open with plants: this is a decisive word, and it is not a joke.' },
    },
    {
      id: 'star',
      kind: 'read',
      requires: ['still'],
      at: [-12, 14],
      marker: 'tablet',
      title: 'The piercing star',
      goal: 'Read at the tablet on the lookout as the evening comes',
      reading: { title: 'The piercing star', refs: [[86, 1], [86, 2], [86, 3]], note: 'By the sky and the night comer! And what will make you know what the night comer is? It is the star of piercing brightness.' },
    },
  ],
  finale: {
    title: 'Water returned',
    body: ['In full sun, under a sealed cover sloping to the cup, the sea water rose as vapour and came back as fresh drops, leaving the salt behind.', 'Surah At-Tariq swears by the sky that returns.'],
    ref: [86, 11],
    questions: ['Why did the salt stay behind in the basin?', 'Where does rain come from?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The guardian over every soul (86:4) is never shown.', 'The sun still is science play; the ayah speaks of the sky and rain.'],
};
