// Surah 92, Al-Layl (The Night): the Granary Hoist. A tall village granary
// at nightfall, with a hoist beam out from its loft door and gifts for the
// poor waiting below: a sack of flour, a jar of oil, a millstone, a roof
// beam. "As for the one who gives and is mindful, and believes in the best,
// We will ease him toward ease" (92:5-7). The core play: rig as many
// pulleys as each load needs, so that it hangs on enough strands of rope to
// come within your strength, and no more, and lift it to the loft. The ease
// promised is from Allah; the pulleys are only a picture of help.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W092: WorldDef = {
  surah: 92,
  name: 'The Granary Hoist',
  theme: 'Lift heavy gifts with just as many pulleys as each one needs',
  play: 'At nightfall, gifts for the poor wait below the granary loft: a sack of flour, a jar of oil, a millstone and a roof beam. You can pull only 25 kg. With more pulleys, the load hangs on more strands of rope and each pull is lighter, but you pull more rope. Rig just as many pulleys as each load needs, and lift it up.',
  seed: 9292,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 0.7, seed: 92 }),
    palette: PAL.autumn,
    paths: [curve([[0, -34], [6, -22], [0, -10], [0, -3]])],
    flats: [{ x: 0, z: 2, r: 7 }, { x: 6, z: -22, r: 3 }, { x: -12, z: -6, r: 3 }],
  },
  look: { ...LOOKS.dusk, sunI: 1.6, stars: 0.9 },
  veg: {
    grass: 0.9,
    flowers: ['#fff2d8'],
    trees: [{ kind: 'oak', area: { x: 0, z: -22, r: 14 }, count: 5 }],
    rocks: [],
    pebbles: 12,
    rim: ['oak', 'pine'],
  },
  far: '#8a8a6a',
  mountains: { color: '#6a6a90', height: 0.8 },
  start: [0, -34],
  startYaw: 0,
  structures: [
    { type: 'house', x: 0, z: 5.6, rot: Math.PI, w: 5, d: 4, h: 5.2, accent: '#8a6a44' },
    { type: 'cart', x: 4, z: 0, rot: 0.3 },
  ],
  welcome:
    'Welcome to the Granary Hoist. Surah Al-Layl swears by the night as it covers and the day as it shines, and says: your efforts are different. As for the one who gives and is mindful, Allah will ease the way toward ease. The gifts for the poor are heavy tonight.',
  tasks: [
    {
      id: 'night',
      kind: 'read',
      at: [6, -22],
      marker: 'sign',
      title: 'Different efforts',
      goal: 'Read at the sign under the oaks',
      reading: { title: 'Different efforts', refs: [[92, 1], [92, 2], [92, 3], [92, 4]], note: 'By the night as it covers, and the day as it shines, and the One who created male and female: your efforts are truly different.' },
    },
    {
      id: 'hoist',
      kind: 'pulley',
      requires: ['night'],
      at: [0, 2.4],
      strength: 25,
      loads: [
        { what: 'sack of flour', kg: 20 },
        { what: 'jar of olive oil', kg: 45 },
        { what: 'millstone', kg: 70 },
        { what: 'roof beam', kg: 95 },
      ],
      title: 'Toward ease',
      goal: 'Lift each gift to the granary loft with just as many pulleys as it needs',
      intro: 'Divide the load by the number of strands: each pull must be 25 kg or less. Use no more pulleys than you need.',
      adaptation: 'The granary and its hoist are a game. Pulleys are real. The ease in the ayah is from Allah; this is only a picture of help.',
      outro: 'Every gift is up in the loft, ready for the morning.',
      after: { title: 'Easing toward ease', refs: [[92, 5], [92, 6], [92, 7], [92, 8], [92, 9], [92, 10], [92, 11]], note: 'As for the one who gives and is mindful, and believes in the best, We will ease him toward ease. But as for the one who is stingy and thinks himself free of need, and denies the best, We will ease him toward hardship. And his wealth will not help him when he falls.' },
    },
    {
      id: 'face',
      kind: 'read',
      requires: ['hoist'],
      at: [-12, -6],
      marker: 'tablet',
      title: 'Only for His sake',
      goal: 'Read at the tablet by the granary wall',
      reading: { title: 'Only for His sake', refs: [[92, 17], [92, 18], [92, 19], [92, 20], [92, 21]], note: 'The most mindful will be kept far from it: the one who gives his wealth to purify himself, not to repay anyone a favour, but only seeking the face of his Lord, the Most High. And he will be well pleased.' },
    },
  ],
  finale: {
    title: 'Lifted',
    body: ['One pulley for the flour, two for the oil, three for the millstone, four for the beam: each load came within your strength.', 'Surah Al-Layl promises the one who gives that Allah will ease the way toward ease.'],
    ref: [92, 7],
    questions: ['Why did more pulleys make each pull lighter?', 'What did it cost to use more pulleys than you needed?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Fire of 92:14-16 is not shown.', 'The pulleys are a picture of help only.'],
};
