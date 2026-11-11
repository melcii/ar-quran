// Surah 111, Al-Masad (The Palm Fibre): the Date Grove Well. A date grove
// with an old well whose rope has frayed through, and bundles of palm fibre
// stripped from the trunks. "Around her neck is a rope of twisted palm
// fibre" (111:5). The surah's warning is read only, and no one it speaks of
// is shown or named in play. The core play: make a new rope from palm fibre
// the real way, twisting the strands one way and laying them together the
// other, then lower the bucket on it.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W111: WorldDef = {
  surah: 111,
  name: 'The Date Grove Well',
  theme: 'Make rope from palm fibre: strands twisted one way, laid together the other',
  play: 'In a date grove, the old well rope has frayed through. Make a new one from palm fibre the way rope has long been made: twist each strand the same way, then lay the three together the opposite way so they lock and cannot unwind. Then tie the bucket on and lower it.',
  seed: 11111,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 0.6, seed: 111 }),
    palette: PAL.desert,
    paths: [curve([[0, 34], [6, 22], [0, 10], [0, 3]])],
    flats: [{ x: 0, z: 0, r: 8, paint: '#d8c098' }, { x: 6, z: 22, r: 3 }, { x: -12, z: 12, r: 3 }],
  },
  look: { ...LOOKS.desert, sunI: 2.8 },
  veg: {
    grass: 0.3,
    flowers: ['#f0d8a0'],
    trees: [{ kind: 'palm', at: [[-6, 6], [7, 7], [-9, -4], [9, -6], [-4, -12], [5, -14], [-14, 2], [14, 2], [-12, 20], [14, 16]] }],
    rocks: [],
    pebbles: 12,
    rim: ['palm'],
  },
  far: '#c8a880',
  mountains: { color: '#a88a70', height: 0.7 },
  start: [0, 34],
  startYaw: Math.PI,
  structures: [
    { type: 'well', x: 3, z: -4 },
    { type: 'bench', x: -4, z: 2, rot: 0.3 },
  ],
  welcome:
    'Welcome to the Date Grove Well. Surah Al-Masad ends with a rope of twisted palm fibre. Here in the grove, the well rope has frayed through, and there is palm fibre everywhere.',
  tasks: [
    {
      id: 'ruined',
      kind: 'read',
      at: [6, 22],
      marker: 'sign',
      title: 'His wealth will not avail him',
      goal: 'Read at the sign at the grove gate',
      adaptation: 'The surah’s warning is read only; no one it speaks of is shown.',
      reading: { title: 'His wealth will not avail him', refs: [[111, 1], [111, 2]], note: 'May the hands of Abu Lahab perish, and he has perished. His wealth will not avail him, nor what he earned.' },
    },
    {
      id: 'rope',
      kind: 'rope',
      requires: ['ruined'],
      at: [-2, -1],
      well: [3, -2.4],
      twists: 4,
      title: 'Twisted palm fibre',
      goal: 'Twist three strands of palm fibre the same way, lay them together the other way, then lower the bucket',
      intro: 'One way for the strands, the other way for the rope.',
      adaptation: 'The grove is a game. Twisting rope from palm fibre, strands one way and the lay the other, is real.',
      outro: 'A strong new rope on the well, and a full bucket.',
      after: { title: 'A rope of palm fibre', refs: [[111, 3], [111, 4], [111, 5]], note: 'He will burn in a Fire of blazing flame, and his wife too, the carrier of firewood: around her neck a rope of twisted palm fibre.' },
    },
    {
      id: 'avail',
      kind: 'read',
      requires: ['rope'],
      at: [-12, 12],
      marker: 'tablet',
      title: 'What he earned',
      goal: 'Read at the tablet among the palms',
      reading: { title: 'What he earned', refs: [[111, 2]], note: 'His wealth will not avail him, nor what he earned.' },
    },
  ],
  finale: {
    title: 'A rope that holds',
    body: ['Three strands twisted one way and laid the other: a rope that holds a full bucket.', 'Surah Al-Masad warns that wealth and gains did not avail the one who opposed the truth.'],
    ref: [111, 2],
    questions: ['Why does a rope laid the same way as its strands spring apart?', 'Why could wealth not help the man in the surah?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No one the surah speaks of is shown; the warning is read only.', 'The Fire is read only, never shown.'],
};
