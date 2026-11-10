// Surah 50, Qaf: the Valley Brought to Life. A dry valley floor under a
// wide clear sky, ringed by firm hills, with a stand of tall date palms by a
// spring and a small garden shed. The core play: in glass-sided growing
// boxes, sow each seed at its own depth, water the boxes and wait three
// days, watching roots go down and shoots come up out of the dead, dry
// earth (50:9-11, "We have given life thereby to a dead land. Thus is the
// coming forth"). Then readings: Allah is closer than the jugular vein, and
// every word is recorded (50:16-18). Nothing of the unseen is pictured.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W050: WorldDef = {
  surah: 50,
  name: 'The Valley Brought to Life',
  theme: 'Sow seeds in dead, dry earth and watch it come to life: "thus is the coming forth"',
  play: 'In the garden shed stand three glass-sided growing boxes, so you can see under the soil. Sow each seed at its own depth, then water the boxes and wait, day by day, and watch the roots go down and the shoots come up.',
  seed: 5050,
  ground: {
    radius: 48,
    base: rolling({ radius: 48, amp: 1.2, seed: 50, shapes: [{ x: -30, z: -24, r: 12, h: 9 }, { x: 30, z: -26, r: 12, h: 10 }, { x: 0, z: -40, r: 12, h: 8 }] }),
    palette: PAL.dry,
    paths: [curve([[0, 42], [0, 24], [2, 10], [0, 2]]), curve([[2, 10], [16, 8], [22, 4]])],
    flats: [{ x: 0, z: 4, r: 5, paint: '#e0cca0' }, { x: 22, z: 2, r: 5 }],
  },
  look: { ...LOOKS.desert, sunI: 3.2, clouds: 0.3 },
  veg: {
    grass: 0.25,
    flowers: ['#e8c060'],
    trees: [{ kind: 'palm', at: [[20, -2], [24, 0], [26, 6], [18, 7], [22, 10]], size: [1.4, 1.7] }],
    rocks: [{ x: -26, z: -18, n: 6, big: 1.4, spread: 10 }, { x: 28, z: -20, n: 5, big: 1.3, spread: 8 }],
    pebbles: 30,
    rim: ['palm'],
  },
  far: '#c8a878',
  mountains: { color: '#b8a090', height: 1 },
  start: [0, 42],
  startYaw: Math.PI,
  structures: [
    { type: 'pool', x: 22, z: 3, w: 3, d: 3 },
    { type: 'stall', x: 0, z: 1, rot: 0, color: '#8a6a44' },
  ],
  welcome:
    'Welcome to the Valley Brought to Life. Surah Qaf asks: have they not looked at the sky above them, and at the earth? Here the ground is dry and still. Let us see what water and a few seeds can do.',
  tasks: [
    {
      id: 'look',
      kind: 'read',
      at: [3, 30],
      marker: 'sign',
      title: 'Have they not looked?',
      goal: 'Read at the sign on the path into the valley',
      reading: { title: 'The sky and the earth', refs: [[50, 6], [50, 7], [50, 8]], note: 'Have they not looked at the sky above them, how We built it and made it beautiful, with no cracks in it? And the earth: We spread it out, set firm mountains on it, and made every beautiful kind of plant grow in it, as a lesson and a reminder for everyone who turns to Allah.' },
    },
    {
      id: 'boxes',
      kind: 'rootbox',
      requires: ['look'],
      at: [0, 5],
      title: 'Life in dry earth',
      goal: 'At the garden shed, sow each seed at its own depth, then water the boxes and wait three days',
      intro: 'The soil in the boxes is as dry and still as the valley floor. Each box has glass sides, so you can see under the ground. Gardeners say: sow a seed about two or three times as deep as it is big.',
      adaptation: 'The glass boxes and the three days are a game idea. How seeds sprout is real; the surah speaks of rain giving life to a dead land (50:9-11).',
      seeds: [
        { name: 'sesame seed', depth: 1, why: 'A sesame seed is tiny, with very little food stored inside, so it must reach the light quickly.' },
        { name: 'wheat grain', depth: 2, why: 'A wheat grain is a little bigger: it goes in a little deeper, about a finger’s width down.' },
        { name: 'broad bean', depth: 3, why: 'A broad bean is big, with plenty of stored food to push a strong shoot up from deeper down.' },
      ],
      days: 3,
      outro: 'Roots went down and shoots came up, out of earth that was dry and still.',
      after: { title: 'Thus is the coming forth', refs: [[50, 9], [50, 10], [50, 11]], note: 'We sent down blessed rain from the sky, and with it We grew gardens and grain to harvest, and tall palm trees with fruit in layers, as provision for people. And with it We gave life to a dead land. That is how the coming forth will be.' },
    },
    {
      id: 'near',
      kind: 'read',
      requires: ['boxes'],
      at: [18, 12],
      marker: 'lantern',
      title: 'Closer than you think',
      goal: 'Read at the lantern by the palms',
      reading: { title: 'Every word', refs: [[50, 16], [50, 18]], note: 'We created the human being, and We know what his soul whispers to him, and We are closer to him than his jugular vein. He does not say a single word without a watcher ready by him.' },
    },
    {
      id: 'praise',
      kind: 'read',
      requires: ['near'],
      at: [-4, 12],
      marker: 'tablet',
      title: 'Before sunrise and sunset',
      goal: 'Read at the tablet on the way back',
      reading: { title: 'No tiredness touched Him', refs: [[50, 38], [50, 39]], note: 'We created the heavens and the earth and all between them in six days, and no tiredness touched Us. So be patient with what they say, and glorify your Lord with praise before sunrise and before sunset.' },
    },
  ],
  finale: {
    title: 'The dry earth stirred',
    body: ['You sowed seeds in dry, still earth, watered them, and watched roots and shoots come out of it.', 'Surah Qaf says rain gives life to a dead land, and that is how the coming forth will be.'],
    ref: [50, 11],
    questions: ['Which seed came up first? Why do you think that was?', 'What else can you see coming to life after rain?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The recording angels (50:17-18), death and the Day (50:19-35) are of the unseen and are read only.'],
};
