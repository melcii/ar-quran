// Surah 34, Saba: the Two Gardens. A stone dam holds rain water between two
// hills, with a garden on the left and a garden on the right below it
// (34:15). The core play: through a season of changing rain, open and close
// each garden's sluice so both stay green, without letting the dam run dry,
// and patch cracks as they appear. The flood of the dam (34:16) is read
// only; it is never played or shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W034: WorldDef = {
  surah: 34,
  name: 'The Two Gardens',
  theme: 'Share the dam water between the left and right gardens through a season of rain',
  play: 'A dam holds the rain water; below it lie two gardens. Open and close each sluice so both gardens stay green through three months, keep some water in the dam, and patch cracks before they drain it.',
  seed: 3434,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.2, seed: 34, shapes: [{ x: -18, z: -12, r: 10, h: 7 }, { x: 18, z: -12, r: 10, h: 7 }] }),
    palette: PAL.dry,
    paths: [curve([[0, 30], [0, -2]])],
    flats: [{ x: 4, z: 20, r: 2.5 }, { x: 0, z: -14, r: 8 }, { x: 0, z: -8, r: 6 }, { x: -10, z: 6, r: 7 }, { x: 10, z: 6, r: 7 }],
  },
  look: { ...LOOKS.golden, sunI: 3 },
  veg: {
    grass: 0.6,
    flowers: ['#fff2d8', '#e8c060'],
    trees: [{ kind: 'palm', at: [[-22, 16], [22, 18]] }],
    rocks: [{ x: -26, z: -26, n: 6, big: 1.4, spread: 10 }, { x: 26, z: -26, n: 6, big: 1.4, spread: 10 }],
    pebbles: 20,
    rim: ['palm', 'olive'],
  },
  far: '#b8a070',
  mountains: { color: '#b0988a', height: 1 },
  start: [0, 26],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Two Gardens. Surah Saba tells of a sign for the people of Saba in their home: two gardens, on the right and on the left. They were told: eat from what your Lord provides and be grateful to Him.',
  tasks: [
    {
      id: 'copper',
      kind: 'read',
      at: [4, 20],
      marker: 'sign',
      title: 'Sulayman and the copper',
      goal: 'Read at the sign near the way in',
      adaptation: 'Sulayman and the jinn are read only; none is shown.',
      reading: { title: 'Sulayman and the copper', refs: [[34, 12], [34, 13], [34, 14]], note: 'And to Sulayman We subjected the wind, and We made a spring of molten copper flow for him, and among the jinn were those who worked for him by his Lord’s permission. When We decreed his death, nothing showed them his death but a creature of the earth eating at his staff.' },
    },
    {
      id: 'dawud',
      kind: 'read',
      at: [3, 20],
      marker: 'sign',
      title: 'Gifts and gratitude',
      goal: 'Read at the sign on the path',
      adaptation: 'Dawud is not shown; these verses are read only.',
      reading: { title: 'Work well', refs: [[34, 10], [34, 11]], note: 'Allah gave Dawud a great favour, and made iron soft for him: "Make full coats of mail and measure the links well, and do good. I see what you do."' },
    },
    {
      id: 'mail',
      kind: 'links',
      requires: ['dawud'],
      table: [-5, 16],
      title: 'Measure the links',
      goal: 'At the work table, fit rings of exactly the right size into each row of chain mail',
      intro: 'Dawud was told: "Make full coats of mail, and measure the links precisely." Fit each row with rings of exactly its size.',
      adaptation: 'The rings, rows and sizes are a game idea based on 34:11. Dawud is not shown.',
      rows: [{ size: 3, gap: 3 }, { size: 2, gap: 3 }, { size: 4, gap: 2 }],
      tray: [2, 5, 3, 1, 4, 3, 2, 4, 6, 2, 3],
      after: { title: 'Do good: I see what you do', refs: [[34, 11]], note: '"Make full coats of mail, and measure the links precisely, and do good. I see what you do."' },
    },
    {
      id: 'gardens',
      kind: 'sluice',
      requires: ['mail'],
      title: 'Water for both gardens',
      goal: 'Keep both gardens green for three months with the dam sluices',
      intro: 'Begin the season at the dam. Open a sluice and water runs down to its garden, but the dam gets lower. The rain comes and goes. Watch both gardens and patch any crack in the dam.',
      adaptation: 'The sluices, the cracks and the season are game ideas. The Quran tells of the two gardens (34:15); how they were watered is not described. The flood (34:16) is read, not played.',
      dam: [0, -8],
      gardens: [[-10, 6], [10, 6]],
      months: 3,
      monthLen: 25,
      cracks: [9, 34, 58],
      reading: { title: 'A good land', refs: [[34, 15]], note: 'There was a sign for Saba in their home: two gardens, on the right and on the left. "Eat from what your Lord provides and be grateful to Him: a good land and a forgiving Lord."' },
      outro: 'Both gardens stayed green through the season.',
    },
    {
      id: 'turned',
      kind: 'read',
      requires: ['gardens'],
      at: [-6, 14],
      marker: 'lantern',
      title: 'They turned away',
      goal: 'Read at the lantern by the path',
      adaptation: 'Nothing of the flood is shown; it is only read.',
      reading: { title: 'Gratitude', refs: [[34, 16], [34, 17]], note: 'But they turned away, so the flood of the dam came, and their two gardens were changed into gardens of bitter fruit, tamarisks and a few lote trees. That was because they were ungrateful.' },
    },
  ],
  finale: {
    title: 'Two green gardens',
    body: ['You shared the water fairly between the two gardens, through dry weeks and rainy ones.', 'Surah Saba tells of a good land with two gardens, and of the call to be grateful for it.'],
    ref: [34, 15],
    questions: ['How did you decide which garden to water?', 'What good things around you could you be grateful for?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Dawud and Sulayman are never shown; the jinn (34:12-14) are not shown and are left to the whole-surah reading.', 'The flood of the dam is read only.'],
};
