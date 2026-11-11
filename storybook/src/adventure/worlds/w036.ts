// Surah 36, Ya-Sin: the Moon Calendar. A quiet hilltop at night with a
// calendar board and a rack of painted moon discs. The core play: look up at
// the moon, choose the disc that shows the same shape and hang it for that
// night; the nights pass and the moon changes, from a thin new crescent to
// full and back to a thin old crescent "like the old date stalk" (36:39).
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { PAL, rolling } from './common';

export const W036: WorldDef = {
  surah: 36,
  name: 'The Moon Calendar',
  theme: 'Watch the moon night after night and hang the disc that matches its shape',
  play: 'It is night on a hilltop. Look up at the moon, take the disc on the rack with the same shape, and hang it on the calendar for that night. Then the nights pass and the moon changes: new crescent, half, full, and back to an old crescent.',
  seed: 3636,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 1.6, seed: 36, shapes: [{ x: 0, z: -4, r: 14, h: 3 }] }),
    palette: PAL.dry,
    paths: [curve([[0, 28], [0, 4]])],
    flats: [{ x: 0, z: -4, r: 8, paint: '#c8b890' }],
  },
  look: {
    zen: '#141c40', mid: '#2c3a6e', hor: '#6a6a96', sun: [-0.6, 0.12, -0.7], sunColor: '#b8c4ff', sunI: 1.4,
    hemiSky: '#6a78b8', hemiGround: '#3a3a3a', hemiI: 1.1, fog: '#4a5276', fogDensity: 0.006, stars: 1, clouds: 0.2, birds: false,
  },
  veg: {
    grass: 0.8,
    flowers: ['#e8e0ff'],
    trees: [{ kind: 'palm', at: [[-10, 6], [12, 4], [-18, -16]] }, { kind: 'olive', at: [[16, -14]] }],
    rocks: [{ x: -22, z: 10, n: 5, big: 1, spread: 8 }],
    pebbles: 14,
    rim: ['palm', 'olive'],
  },
  far: '#3a4a3a',
  mountains: { color: '#3a4060', height: 0.9 },
  start: [0, 24],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Moon Calendar. It is night. Surah Ya-Sin says the night is a sign, and the moon has stages until it looks like an old, curved date stalk. Look up: the moon is a thin new crescent tonight.',
  tasks: [
    {
      id: 'earth',
      kind: 'read',
      at: [3, 18],
      marker: 'lantern',
      title: 'The dead earth',
      goal: 'Read at the lantern on the path',
      reading: { title: 'A sign in the earth', refs: [[36, 33], [36, 34], [36, 35]], note: 'A sign for them is the dead earth: Allah brings it to life and brings out grain they eat, gardens of palms and grapevines, and springs, so they may eat its fruit, which their hands did not make. Will they not be grateful?' },
    },
    {
      id: 'moon',
      kind: 'moon',
      requires: ['earth'],
      title: 'Night after night',
      goal: 'Hang the disc that matches the moon for each of seven nights',
      intro: 'Look up at the moon. On the rack, find the disc with the same shape, and hang it on the calendar for night 1. Then the nights pass and the moon changes.',
      adaptation: 'The seven nights are chosen from one month of the moon, a few nights apart, so the change is easy to see. The board and discs are a game idea.',
      rack: [0, 2],
      board: [0, -7],
      nights: [0.08, 0.25, 0.4, 0.5, 0.62, 0.75, 0.92],
      reading: { title: 'Each swimming in an orbit', refs: [[36, 39], [36, 40]], note: 'And the moon: Allah has set stages for it, until it returns looking like an old, curved date stalk. The sun cannot catch up with the moon, nor does the night outrun the day; each is swimming in its own orbit.' },
      outro: 'Seven nights, from a thin new crescent to a thin old one.',
    },
    {
      id: 'night',
      kind: 'read',
      requires: ['moon'],
      at: [-9, 4],
      marker: 'sign',
      title: 'Night and the sun',
      goal: 'Read at the sign by the palm',
      reading: { title: 'Night and the sun', refs: [[36, 37], [36, 38]], note: 'A sign for them is the night: Allah takes the daylight from it, and they are in darkness. And the sun runs to its resting place; that is the decree of the Mighty, the Knowing.' },
    },
    {
      id: 'city',
      kind: 'read',
      requires: ['night'],
      at: [3, 21],
      marker: 'sign',
      title: 'The people of the city',
      goal: 'Read the sign by the start',
      reading: { title: 'Messengers came to the city', refs: [[36, 13], [36, 14]], note: 'Give them the example of the people of the city, when the messengers came to it. Two were sent, and they were denied, so a third was sent to support them. They said: "We are messengers to you."' },
    },
    {
      id: 'running',
      kind: 'reach',
      requires: ['city'],
      at: [0, 10],
      r: 2.6,
      label: 'the middle of the city',
      title: 'From the far end of the city',
      goal: 'Run from the far end of the land back to the middle, to pass on good advice',
      intro: 'A man came running from the farthest end of the city and said: "O my people, follow the messengers." Run back from the far end to the middle with his advice.',
      adaptation: 'Running the message is a game idea. The man, the messengers and the city\'s people are not shown, and nothing is shown of what happened to him.',
      reading: { title: 'Follow those who ask no payment', refs: [[36, 20], [36, 21], [36, 26]], note: 'A man came running from the farthest end of the city. He said: "O my people, follow the messengers. Follow those who ask you for no payment and are rightly guided." He was told: "Enter Paradise." He said: "I wish my people knew how my Lord has forgiven me."' },
    },
  ],
  finale: {
    title: 'The moon\'s stages',
    body: ['You watched the moon change from a thin new crescent to full, and back to a thin old crescent.', 'Surah Ya-Sin calls the night, the sun and the moon signs, each moving in its own orbit.'],
    ref: [36, 40],
    questions: ['Which side of the moon was lit while it grew?', 'Can you find the moon tonight? What shape is it?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The town and its messengers (36:13-27) are left to the whole-surah reading; no one from the story is shown.', 'The moon shapes are drawn as seen from the northern half of the earth; reviewers may want a note for the southern half.'],
};
