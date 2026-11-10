// Surah 52, At-Tur (The Mount): the Mountain of Blazes. A mountain rises
// over a green valley, and the trail up it branches. The right way is marked
// with painted blazes, white over red, on rocks beside the trail; the
// branches without blazes end with no way through. The core play: climb
// from lookout to lookout by following the blazes. At each lookout a reading
// waits: the oaths of the surah's opening (52:1-6), its questions (52:35-36)
// and its call to glorify Allah at night and as the stars fade (52:48-49).
// The mountain is a setting; no prophet is shown, and the Mount of the
// surah is not claimed to be this one.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const L1: [number, number] = [-10, 4];
const L2: [number, number] = [12, -10];
const TOP: [number, number] = [0, -18];

export const W052: WorldDef = {
  surah: 52,
  name: 'The Mountain of Blazes',
  theme: 'Climb the mountain by its painted blazes, from lookout to lookout',
  play: 'The trail up the mountain branches. Follow the painted blazes (white over red) from lookout to lookout; a branch without blazes ends with no way through. At each lookout there is something to read and think about.',
  seed: 5252,
  ground: {
    radius: 50,
    base: rolling({ radius: 50, amp: 1.2, seed: 52, shapes: [{ x: 0, z: -18, r: 26, h: 12 }] }),
    palette: PAL.meadow,
    paths: [
      curve([[0, 42], [0, 24], [-6, 12], L1]),
      curve([L1, [-2, -2], [6, -6], L2]),
      curve([L1, [-18, 0], [-24, -6]]),
      curve([L2, [8, -15], [4, -18], TOP]),
      curve([L2, [18, -14], [24, -20]]),
    ],
    flats: [{ x: L1[0], z: L1[1], r: 3 }, { x: L2[0], z: L2[1], r: 3 }, { x: TOP[0], z: TOP[1], r: 3.5 }],
  },
  look: { ...LOOKS.morning, sunI: 3, birds: true },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#e8c0e0'],
    trees: [{ kind: 'pine', area: { x: 0, z: -18, r: 22 }, count: 10 }, { kind: 'oak', at: [[-14, 26], [12, 28]] }],
    rocks: [{ x: 0, z: -18, n: 10, big: 1.2, spread: 20 }],
    pebbles: 20,
    rim: ['pine', 'oak'],
  },
  far: '#7a9a6a',
  mountains: { color: '#8a90a8', height: 1.1 },
  start: [0, 42],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Mountain of Blazes. Surah At-Tur begins: "By the Mount." Climb this mountain by its painted blazes. Some branches of the trail lead nowhere: look for the white-over-red marks.',
  tasks: [
    {
      id: 'climb',
      kind: 'blazes',
      title: 'Follow the blazes',
      goal: 'Climb to each lookout in turn by following the white-over-red blazes',
      intro: 'The way up is marked with painted blazes on rocks beside the trail: white over red. Where the trail branches, take the way with the blaze. A branch with no blazes leads nowhere.',
      adaptation: 'The mountain, its trail and its blazes are a game setting. The surah swears by the Mount (52:1); it does not describe a trail.',
      lookouts: [
        { at: L1, r: 2.2, label: 'the first lookout', reading: { title: 'By the Mount', refs: [[52, 1], [52, 2], [52, 3], [52, 4], [52, 5], [52, 6]], note: 'By the Mount, and by a Book written on an open scroll, and by the House that is visited, and by the sky raised high, and by the sea kept full.' } },
        { at: L2, r: 2.2, label: 'the shoulder of the mountain', reading: { title: 'Questions to think about', refs: [[52, 35], [52, 36]], note: 'Were they created from nothing, or are they their own creators? Or did they create the heavens and the earth? No: they are not certain. Look out over the land, and think.' } },
        { at: TOP, r: 2.4, label: 'the summit', reading: { title: 'When the stars fade', refs: [[52, 48], [52, 49]], note: 'Be patient with your Lord’s decision, for you are in Our sight. And glorify your Lord with praise when you rise, and in part of the night, and as the stars fade away.' } },
      ],
      ends: [
        { at: [-24, -6], r: 2.4 },
        { at: [24, -20], r: 2.4 },
      ],
      blazes: [
        { at: [2, 26], rot: 0 },
        { at: [-4, 13], rot: 0.6 },
        { at: [-4, 1], rot: -1.2 },
        { at: [5, -3.5], rot: -1.0 },
        { at: [10.5, -14], rot: 0.5 },
        { at: [6, -17.5], rot: 1.2 },
      ],
      outro: 'You reached the summit by following the blazes.',
    },
    {
      id: 'families',
      kind: 'read',
      requires: ['climb'],
      at: [3, -16],
      marker: 'tablet',
      title: 'Joined together',
      goal: 'Read at the tablet on the summit',
      reading: { title: 'Families joined', refs: [[52, 21]], note: 'Those who believed, and whose children followed them in faith: We will join their children with them, and We will not take away anything from their deeds. Every person is responsible for what they did.' },
    },
  ],
  finale: {
    title: 'By the Mount',
    body: ['You climbed the mountain by its blazes and stopped at every lookout to read and think.', 'Surah At-Tur asks: were they created from nothing, or did they create themselves? And it calls us to glorify Allah as the stars fade.'],
    ref: [52, 1],
    questions: ['How did you know which branch to take?', 'What did you think about at the shoulder of the mountain?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No prophet is shown; the Mount of the surah is not claimed to be this mountain.', 'The Day and the Garden (52:7-28) are read only and never pictured.'],
};
