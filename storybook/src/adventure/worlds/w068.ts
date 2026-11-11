// Surah 68, Al-Qalam (The Pen): the Orchard Gate. An orchard of fruit
// trees behind a stone gate with a bell, on the morning of the harvest. The
// surah tells of the owners of a garden who swore to pick it all early in
// the morning so that no poor person would come in, and woke to find it
// gone (68:17-27). The core play does the opposite: open the gate and ring
// the bell first, then pick from the branches and leave the fruit that has
// fallen for those who come to glean. The owners of the story and the
// gleaners are never shown, and nothing of the garden's ruin is shown.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const TREES: P2[] = [[-8, 6], [0, 6], [8, 6], [-8, -4], [0, -4], [8, -4]];

export const W068: WorldDef = {
  surah: 68,
  name: 'The Orchard Gate',
  theme: 'Open the gate for the gleaners before you harvest, and leave what has fallen',
  play: 'It is harvest morning in your orchard. First open the gate and ring the bell, so anyone in need may come in and gather. Then pick the fruit from the branches, tree by tree, and leave the fruit that has fallen on the ground for the gleaners.',
  seed: 6868,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 1, seed: 68 }),
    palette: PAL.autumn,
    paths: [curve([[0, 36], [2, 24], [0, 14]])],
    flats: [{ x: 0, z: 1, r: 13 }, { x: 4, z: 28, r: 3 }],
  },
  look: { ...LOOKS.golden, sun: [0.6, 0.25, 0.7] },
  veg: {
    grass: 1,
    flowers: ['#f0c080', '#fff2d8'],
    trees: [{ kind: 'fig', at: TREES }, { kind: 'cypress', at: [[-14, 14], [14, 14]] }, { kind: 'olive', area: { x: 0, z: -20, r: 12 }, count: 4 }],
    rocks: [{ x: 22, z: -18, n: 4, big: 1, spread: 5 }],
    pebbles: 16,
    rim: ['olive', 'oak'],
  },
  far: '#a8905a',
  mountains: { color: '#a090a0', height: 0.8 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    { type: 'wall', x: -14, z: 13, to: [-2.4, 13], h: 1.8, color: '#b8a888' },
    { type: 'wall', x: 2.4, z: 13, to: [14, 13], h: 1.8, color: '#b8a888' },
    { type: 'wall', x: -14, z: 13, to: [-14, -12], h: 1.8, color: '#b8a888' },
    { type: 'wall', x: 14, z: 13, to: [14, -12], h: 1.8, color: '#b8a888' },
    { type: 'wall', x: -14, z: -12, to: [14, -12], h: 1.8, color: '#b8a888' },
  ],
  welcome:
    'Welcome to the Orchard Gate. Surah Al-Qalam tells of the owners of a garden who planned to pick it all early in the morning so that no one in need could come in. Today is your orchard’s harvest. What will you do first?',
  tasks: [
    {
      id: 'pen',
      kind: 'read',
      at: [4, 28],
      marker: 'sign',
      title: 'By the pen',
      goal: 'Read at the sign on the lane',
      reading: { title: 'By the pen', refs: [[68, 1], [68, 4]], note: 'Nun. By the pen and what they write. And indeed, you are of a great character.' },
    },
    {
      id: 'harvest',
      kind: 'glean',
      requires: ['pen'],
      gate: [0, 13],
      trees: TREES,
      title: 'The owners of the garden',
      goal: 'Open the gate and ring the bell, then pick each tree from its branches and leave the fallen fruit',
      intro: 'The owners in the surah swore: "No poor person will come in today." Do the opposite. Open the gate and ring the bell first. Then pick from the branches, and leave what has fallen for those who come to glean.',
      adaptation: 'The orchard, the bell and the gleaners are a game idea based on 68:17-27; leaving fallen fruit for those in need is a real custom. No one is shown.',
      outro: 'The baskets are full, and the fallen fruit is left for those who come.',
      after: { title: 'The owners of the garden', refs: [[68, 17], [68, 18], [68, 19], [68, 20], [68, 24], [68, 25], [68, 26], [68, 27]], note: 'They swore to pick the garden’s fruit early in the morning, saying "No poor person will come in to you today," and they did not say "if Allah wills". While they slept, something from your Lord came upon the garden, and it was left as if already reaped. When they saw it, they said: "We have lost our way! No, we have been deprived."' },
    },
    {
      id: 'patient',
      kind: 'read',
      requires: ['harvest'],
      at: [4, -8],
      marker: 'tablet',
      title: 'Be patient',
      goal: 'Read at the tablet among the trees',
      adaptation: 'Yunus is never shown; this ayah is read only.',
      reading: { title: 'Be patient', refs: [[68, 48]], note: 'So be patient for your Lord’s decision, and do not be like the man of the fish (Yunus), when he called out in distress.' },
    },
  ],
  finale: {
    title: 'The gate was open',
    body: ['You opened the gate and rang the bell before picking, and left the fallen fruit for those who came to glean.', 'Surah Al-Qalam tells of owners who tried to keep everything for themselves and lost it all.'],
    ref: [68, 17],
    questions: ['Why did you open the gate first?', 'What do you have that others could share in?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet, Yunus and the owners of the garden are never shown.', 'What happened to the garden is read only.'],
};
