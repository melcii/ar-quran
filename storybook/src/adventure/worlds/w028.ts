// Surah 28, Al-Qasas: the River and the Chest. A river runs down from the
// hills and splits twice; one channel reaches a quiet landing and the others
// end in reed marshes. The core play: let the empty chest go at the top and
// follow it along the bank, moving the reeds at each fork ahead of it and
// nudging it free where it catches (28:7-13). Musa, his mother and his
// sister are never shown; the chest floats empty. The well of Madyan and
// Qarun are readings.
import { curve } from '../terrain';
import type { RiverSeg, WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const RIVER: RiverSeg = {
  pts: [[0, -40], [0, -30], [2, -20]],
  gate: 0,
  kids: [
    { pts: [[2, -20], [-8, -12], [-16, -6]], end: 'reeds' },
    {
      pts: [[2, -20], [8, -10], [8, 0]],
      gate: 1,
      kids: [
        { pts: [[8, 0], [4, 10], [2, 18]], end: 'landing' },
        { pts: [[8, 0], [16, 8], [22, 14]], end: 'reeds' },
      ],
    },
  ],
};

const beds = (s: RiverSeg, out: { pts: [number, number][]; w: number; depth: number }[] = []) => {
  out.push({ pts: s.pts, w: 4.5, depth: 3.5 });
  (s.kids ?? []).forEach((k) => beds(k, out));
  return out;
};

export const W028: WorldDef = {
  surah: 28,
  name: 'The River and the Chest',
  theme: 'Follow the floating chest and steer it with the reeds to the quiet landing',
  play: 'A river splits twice. Let the empty chest go at the top, follow it along the bank, move the reeds at each fork so it takes the channel to the landing, and nudge it free where it catches. Wrong channels end in reed marshes.',
  seed: 2828,
  ground: {
    radius: 50,
    base: rolling({ radius: 50, amp: 1.2, seed: 28, streams: beds(RIVER), shapes: [{ x: 0, z: -46, r: 12, h: 5 }] }),
    palette: PAL.coast,
    paths: [curve([[-5, -36], [-4, -24], [6, -24], [12, -12], [12, -2], [8, 8], [6, 18]])],
    water: -1.8,
    flats: [{ x: 2, z: -40, r: 3 }],
  },
  look: { ...LOOKS.morning, sunI: 3 },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#f4d060'],
    trees: [{ kind: 'palm', area: { x: 0, z: 20, r: 10 }, count: 5 }, { kind: 'palm', at: [[-10, -30], [12, -30]] }, { kind: 'olive', area: { x: -20, z: 20, r: 8 }, count: 3 }],
    rocks: [{ x: -24, z: -24, n: 6, big: 1.2, spread: 12 }],
    pebbles: 20,
    rim: ['palm', 'olive'],
  },
  far: '#7a9a5a',
  mountains: { color: '#9a90a8', height: 1 },
  start: [-5, -34],
  startYaw: 0,
  structures: [{ type: 'dock', x: 3, z: 20, rot: 0, w: 2, d: 4 }, { type: 'well', x: -20, z: 14 }],
  welcome:
    'Welcome to the River and the Chest. Surah Al-Qasas tells how the mother of Musa was inspired to place her baby in the river, and promised that he would be returned to her. Here the chest floats empty. Read at the lantern first.',
  tasks: [
    {
      id: 'promise',
      kind: 'read',
      at: [-3, -38],
      marker: 'lantern',
      title: 'Do not fear',
      goal: 'Read at the lantern by the top of the river',
      reading: { title: 'Do not fear and do not grieve', refs: [[28, 7]], note: 'Allah inspired the mother of Musa: when you fear for him, put him in the river, and do not fear or grieve. We will return him to you.' },
      adaptation: 'Musa and his mother are not shown.',
    },
    {
      id: 'chest',
      kind: 'river',
      requires: ['promise'],
      title: 'The chest on the river',
      goal: 'Let the chest go, follow it, and set the reeds so it reaches the quiet landing',
      intro: 'The river splits twice. At each fork a bundle of reeds closes one channel. Let the chest go at the top, then walk along the bank ahead of it and move the reeds so it takes the way to the quiet landing. If it catches on the bank, nudge it free.',
      adaptation: 'The chest floats empty in this game; no baby is shown. The forks, the reed gates and the landing are game ideas, not a map of the real river.',
      river: RIVER,
      gates: [
        { at: [6.5, -22], start: 0, labels: ['open the left channel', 'open the right channel'] },
        { at: [12, -2], start: 1, labels: ['open the left channel', 'open the right channel'] },
      ],
      snags: [[8, -6], [4, 10]],
      speed: 1.6,
      reading: { title: 'Returned to his mother', refs: [[28, 11], [28, 12], [28, 13]], note: 'His mother told his sister to follow him, and she watched from a distance. Allah returned him to his mother, so that she would be comforted, not grieve, and know that the promise of Allah is true.' },
      outro: 'The chest rests at the quiet landing.',
    },
    {
      id: 'madyan',
      kind: 'read',
      requires: ['chest'],
      at: [-17, 12],
      marker: 'sign',
      title: 'The well of Madyan',
      goal: 'Read at the well on the west side',
      reading: { title: 'In need of any good', refs: [[28, 22], [28, 23], [28, 24]], note: 'When Musa came to the well of Madyan he found two women waiting to water their flocks. He watered for them, then went into the shade and prayed: My Lord, I am in need of whatever good You send me.' },
      adaptation: 'Musa, the two women and the flocks are not shown.',
    },
    {
      id: 'qarun',
      kind: 'read',
      requires: ['madyan'],
      at: [14, 20],
      marker: 'lantern',
      title: 'Qarun and his treasure',
      goal: 'Read at the lantern on the east side',
      reading: { title: 'Do good as Allah has done good to you', refs: [[28, 77], [28, 79], [28, 80], [28, 83]], note: 'Qarun was told: use what Allah gave you to seek the next life, do not forget your share of this world, and do good as Allah has done good to you. When he showed off his wealth, people with knowledge said the reward of Allah is better for those who believe and do good.' },
      adaptation: "Qarun is not shown, and what happened to him (28:81) is left to the whole-surah reading.",
    },
  ],
  finale: {
    title: 'The promise is true',
    body: ['You followed the chest down the river and steered it to the quiet landing.', 'Surah Al-Qasas tells how Allah kept His promise to the mother of Musa, and warns against pride in wealth.'],
    ref: [28, 13],
    questions: ['How do you think the mother of Musa felt when he was returned?', 'What good can you do with what you have been given?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown: Musa never appears, and his mother and sister are not shown. The chest floats empty.',
    'The killing in 28:15 and what happened to Qarun (28:81) are not shown.',
  ],
};
