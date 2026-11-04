// Surah 33, Al-Ahzab: the Mason's Yard. A sunny stone yard with a short wall
// on a sloping footing, a plumb line and piles of shaped stones. The core
// play: lay the wall course by course and read the plumb line and the level,
// choosing stones that tip it back, until it stands true (33:70, words that
// are straight and sound). The wall is only a picture for straight words.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W033: WorldDef = {
  surah: 33,
  name: "The Mason's Yard",
  theme: 'Build a wall that stands true by reading the plumb line and choosing the right stones',
  play: 'A wall stands on a sloping footing. Lay it course by course from the stone piles: some stones are thicker on one side and tip it, some are flat. If it leans too far, the top stone slides off. Finish with the wall standing true.',
  seed: 3333,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 1, seed: 33 }),
    palette: PAL.dry,
    paths: [curve([[0, 28], [0, 4]])],
    flats: [{ x: 0, z: -2, r: 12, paint: '#d8c8a4' }],
  },
  look: { ...LOOKS.golden, sunI: 3 },
  veg: {
    grass: 0.7,
    flowers: ['#fff2d8'],
    trees: [{ kind: 'olive', at: [[-14, -10], [14, -12], [-16, 10], [16, 12]] }],
    rocks: [{ x: -24, z: -18, n: 6, big: 1.2, spread: 10 }],
    pebbles: 24,
    rim: ['olive', 'cypress'],
  },
  far: '#a89a6a',
  mountains: { color: '#a89a90', height: 0.9 },
  start: [0, 24],
  startYaw: Math.PI,
  structures: [{ type: 'house', x: -14, z: -2, rot: Math.PI / 2, w: 6, d: 5, color: '#e8d4b0' }],
  welcome:
    'Welcome to the Mason\'s Yard. Surah Al-Ahzab asks the believers to speak words that are straight and sound. Here, in a mason\'s yard, a wall waits to be built straight and true.',
  tasks: [
    {
      id: 'pattern',
      kind: 'read',
      at: [3, 18],
      marker: 'sign',
      title: 'An excellent example',
      goal: 'Read at the sign on the path',
      adaptation: 'The Messenger of Allah is never shown; this verse is read only.',
      reading: { title: 'An excellent example', refs: [[33, 21]], note: 'In the Messenger of Allah you have an excellent example, for whoever hopes in Allah and the Last Day and remembers Allah often.' },
    },
    {
      id: 'wall',
      kind: 'plumb',
      requires: ['pattern'],
      title: 'A wall that stands true',
      goal: 'Lay five courses so the wall stands true',
      intro: 'Pick up a stone from the piles and lay it on the wall. Watch the plumb line and the level on top: a stone thicker on one side tips the wall. The footing slopes, so the wall starts leaning. Make it stand true.',
      adaptation: 'The wall, the stones and the plumb line are a game idea: a picture of something straight and sound, like the straight words the verse asks for. The verse is about speech, not building.',
      wall: [0, -6],
      rot: 0,
      tilt0: 4,
      courses: 5,
      limit: 7,
      piles: [
        { at: [-8, 2], wedge: -2, label: 'stone thicker on the right' },
        { at: [-3.5, 4], wedge: -6, label: 'big stone thicker on the right' },
        { at: [3.5, 4], wedge: 0, label: 'flat stone' },
        { at: [8, 2], wedge: 2, label: 'stone thicker on the left' },
      ],
      reading: { title: 'Straight words', refs: [[33, 70], [33, 71]], note: 'O believers, be mindful of Allah and speak words that are right and just. He will set right your deeds for you and forgive you your sins.' },
      outro: 'The wall stands true from bottom to top.',
    },
    {
      id: 'remember',
      kind: 'read',
      requires: ['wall'],
      at: [-10, 10],
      marker: 'lantern',
      title: 'Morning and afternoon',
      goal: 'Read at the lantern by the olive',
      reading: { title: 'Remember Allah often', refs: [[33, 41], [33, 42]], note: 'O believers, remember Allah very often, and glorify Him in the morning and the afternoon.' },
    },
    {
      id: 'qualities',
      kind: 'read',
      requires: ['remember'],
      at: [10, 10],
      marker: 'sign',
      title: 'Good qualities',
      goal: 'Read at the sign by the other olive',
      reading: { title: 'Men and women alike', refs: [[33, 35]], note: 'For believing men and women who are obedient, truthful, patient, humble, charitable, who fast, who guard their modesty and who remember Allah often, Allah has prepared forgiveness and a great reward.' },
    },
  ],
  finale: {
    title: 'Straight and true',
    body: ['You built a wall that stands true, choosing each stone by watching the plumb line.', 'Surah Al-Ahzab asks the believers to speak words that are straight and sound.'],
    ref: [33, 70],
    questions: ['How did you know which stone to choose?', 'What makes words "straight"?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet, his family and his companions are never shown.', 'The events of the confederates (33:9-27) are left to the whole-surah reading; there is no battle in the game.'],
};
