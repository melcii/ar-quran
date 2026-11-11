// Surah 103, Al-Asr (Time): Before Sunset. A small hill town in the late
// afternoon, with a mosque, a lane of houses, a grocer's shop and a green
// where children fly kites, and the sun already low. "By time, indeed
// mankind is in loss, except those who believe and do righteous deeds and
// urge one another to the truth and urge one another to patience"
// (103:1-3). The core play: before the sun sets, do the four things the
// surah names, while a juggler, a gossip bench and a game of marbles offer
// to spend the afternoon for you. If the sun sets first, the afternoon is
// lost and the next day starts over.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W103: WorldDef = {
  surah: 103,
  name: 'Before Sunset',
  theme: 'Spend a short afternoon on the four things the surah names, before the sun sets',
  play: 'It is late afternoon in a small hill town, and the sun is already low. Before it sets, do the four things Surah Al-Asr names: believe, do good, urge the truth and urge patience. The town is full of ways to let the hour slip away, and each one costs you part of the afternoon.',
  seed: 10303,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 0.8, seed: 103 }),
    palette: PAL.meadow,
    paths: [curve([[0, 36], [-4, 26], [0, 16], [-8, 6], [0, -6], [10, -10]])],
    flats: [{ x: 0, z: 16, r: 5, paint: '#d8c8a0' }, { x: -8, z: 2, r: 4, paint: '#d8c8a0' }, { x: -6, z: -8, r: 3 }, { x: 4, z: -8, r: 5, paint: '#d8c8a0' }, { x: -4, z: 28, r: 3 }, { x: 16, z: 18, r: 3 }],
  },
  look: { ...LOOKS.golden, sunI: 2.6 },
  veg: {
    grass: 0.9,
    flowers: ['#f8e0a0', '#f0a0a0'],
    trees: [{ kind: 'cypress', at: [[-16, 14], [16, 8], [-14, -14], [18, -6]] }],
    rocks: [{ x: 20, z: 24, n: 4, big: 1, spread: 4 }],
    pebbles: 16,
    rim: ['cypress', 'olive'],
  },
  far: '#a0a890',
  mountains: { color: '#9a98a0', height: 0.8 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    { type: 'house', x: 6, z: -14, rot: 0, w: 7, d: 5, h: 3.6, accent: '#2a6a5a' },
    { type: 'house', x: -12, z: 2, rot: Math.PI / 2, w: 4.4, d: 3.8, h: 2.8, accent: '#8a6a3a' },
    { type: 'stall', x: 8, z: 14, rot: -Math.PI / 2 },
    { type: 'well', x: -3, z: 14 },
    { type: 'bench', x: 4, z: 20, rot: 0 },
  ],
  welcome:
    'Welcome to Before Sunset. Surah Al-Asr swears by time, and says that mankind is in loss, except for four kinds of people. The sun is already low over the town. There is just enough of the afternoon left, if you spend it well.',
  tasks: [
    {
      id: 'time',
      kind: 'read',
      at: [-4, 28],
      marker: 'sign',
      title: 'By time',
      goal: 'Read at the sign above the town',
      reading: { title: 'By time', refs: [[103, 1], [103, 2]], note: 'By time, indeed mankind is in loss.' },
    },
    {
      id: 'afternoon',
      kind: 'hourglass',
      requires: ['time'],
      secs: 120,
      deeds: [
        { at: [6, -10.8], what: 'Pray the afternoon prayer at the mosque', done: 'You pray the afternoon prayer with the others at the mosque. Believe: done.' },
        { at: [-9.2, 2], what: 'Carry water for the old neighbour', done: 'You carry two buckets up to the old neighbour’s door. Do good: done.' },
        { at: [6.4, 14], what: 'Tell the grocer his scale reads short', done: 'You tell the grocer quietly that his scale reads short. He checks, and thanks you. Urge the truth: done.' },
        { at: [-6, -8], what: 'Sit with the friend whose kite broke', done: 'You sit with your friend by the broken kite. “We can mend it tomorrow. Be patient.” Urge patience: done.' },
      ],
      idle: [
        { at: [0, 22], what: 'Watch the juggler', cost: 50 },
        { at: [4, 18.8], what: 'Sit on the gossip bench', cost: 50 },
        { at: [-2, 5], what: 'Play one more game of marbles', cost: 50 },
      ],
      title: 'Before the sun sets',
      goal: 'Before sunset, do the four things the surah names: believe, do good, urge the truth, urge patience',
      intro: 'Four things, one afternoon. Do not let the hour slip away.',
      adaptation: 'The town is a game written for this app. The four things are the ones Surah Al-Asr names.',
      outro: 'All four done before sunset, and the town turning gold.',
      after: { title: 'Except for those', refs: [[103, 3]], note: 'Except for those who believe and do righteous deeds, and urge one another to the truth, and urge one another to patience.' },
    },
    {
      id: 'dusk',
      kind: 'read',
      requires: ['afternoon'],
      at: [16, 18],
      marker: 'tablet',
      title: 'The whole surah',
      goal: 'Read at the tablet on the green',
      reading: { title: 'The whole surah', refs: [[103, 1], [103, 2], [103, 3]], note: 'By time, indeed mankind is in loss, except for those who believe and do righteous deeds, and urge one another to the truth, and urge one another to patience.' },
    },
  ],
  finale: {
    title: 'By time',
    body: ['One short afternoon, and so many ways to let it slip away.', 'Surah Al-Asr says that mankind is in loss, except those who believe, do good, and urge one another to the truth and to patience.'],
    ref: [103, 3],
    questions: ['What made the afternoon go fastest?', 'Which of the four things could you do tomorrow?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No prophet appears in this world.', 'The town and its afternoon are a picture only.'],
};
