// Surah 39, Az-Zumar: the Turning Field. A field in a valley after rain,
// with springs at its edge. The core play: sow after the rain and bring in
// each plot when it turns gold; too early it is green and soft, too late the
// dry stalks break and scatter, and it is sown again (39:21; 39:53, do not
// despair).
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W039: WorldDef = {
  surah: 39,
  name: 'The Turning Field',
  theme: 'Bring in each plot of the field when it turns from green to gold',
  play: 'Sow the field after the rain and watch the plots go from green to gold at their own pace. Bring in each plot while it is golden. Too early and the grain is soft; too late and the stalks break and scatter, and the plot is sown again.',
  seed: 3939,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.2, seed: 39 }),
    palette: PAL.autumn,
    paths: [curve([[0, 28], [0, 8]])],
    flats: [{ x: 0, z: -4, r: 11, paint: '#8a6a44' }],
  },
  look: { ...LOOKS.golden, sunI: 3 },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#f4d060'],
    trees: [{ kind: 'oak', at: [[-16, 6], [16, 8], [-14, -20], [16, -18]] }],
    rocks: [],
    pebbles: 12,
    rim: ['oak', 'olive'],
  },
  far: '#7a9a5a',
  mountains: { color: '#8a94b0', height: 0.9 },
  start: [0, 24],
  startYaw: Math.PI,
  structures: [{ type: 'well', x: -12, z: -2 }],
  welcome:
    'Welcome to the Turning Field. Surah Az-Zumar asks: do you not see how Allah sends rain, makes it flow in springs, brings out crops of many colours, and then they dry and turn yellow?',
  tasks: [
    {
      id: 'know',
      kind: 'read',
      at: [3, 18],
      marker: 'sign',
      title: 'Those who know',
      goal: 'Read at the sign on the path',
      reading: { title: 'Are they equal?', refs: [[39, 9]], note: 'Is one who stands in prayer in the night, fearing the Hereafter and hoping for the mercy of his Lord, like one who does not? Say: "Are those who know equal to those who do not know?" Only people of understanding take heed.' },
    },
    {
      id: 'field',
      kind: 'harvest',
      requires: ['know'],
      title: 'Bring in the gold',
      goal: 'Bring in all six plots while they are golden',
      intro: 'Sow the field with the seed bag. Each plot grows at its own pace: green, then gold, then dry and breaking. Bring in each plot while it is gold.',
      adaptation: 'The plots, their timing and the re-sowing are game ideas. The verse describes the turning of crops; the game lets you watch it closely.',
      bag: [0, 7],
      plots: [[-5, -1], [0, -1], [5, -1], [-5, -6], [0, -6], [5, -6]],
      stage: 8,
      stagger: 4,
      reading: { title: 'A reminder', refs: [[39, 21]], note: 'Do you not see that Allah sends down rain from the sky and makes it flow as springs in the earth, then brings out crops of many colours; then they dry and you see them turn yellow, then He makes them crumble? In that is a reminder for people of understanding.' },
      outro: 'All six plots are brought in, each while it was golden.',
    },
    {
      id: 'hope',
      kind: 'read',
      requires: ['field'],
      at: [-9, 6],
      marker: 'lantern',
      title: 'Do not despair',
      goal: 'Read at the lantern by the oak',
      reading: { title: 'Do not despair', refs: [[39, 53]], note: 'Say: "O My servants who have wronged themselves, do not despair of the mercy of Allah. Allah forgives all sins. He is the Forgiving, the Merciful."' },
    },
  ],
  finale: {
    title: 'Green, gold and again',
    body: ['You watched each plot turn from green to gold, and brought it in at the right time.', 'Surah Az-Zumar points to the turning of the crops as a reminder, and tells us never to despair of Allah\'s mercy.'],
    ref: [39, 21],
    questions: ['How did you know a plot was ready?', 'What can you start again when something does not go well?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The groups led to their places (39:71-75) are not shown; that is left to the whole-surah reading.'],
};
