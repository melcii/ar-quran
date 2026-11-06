// Surah 35, Fatir: the Colour Atlas. A valley with a cliff banded white, red
// and black, an orchard and a shearing pen, and a long atlas table between
// them. The core play: gather stones, fruits and wool, and lay each row of
// the atlas from the lightest at the left end to the darkest at the right
// (35:27-28, "of varying colors ... white and red of varying shades and
// [some] extremely black ... various colors similarly").
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W035: WorldDef = {
  surah: 35,
  name: 'The Colour Atlas',
  theme: 'Lay stones, fruits and wool in rows from the lightest to the darkest',
  play: 'Gather stones from the banded cliff, fruits from the orchard and wool from the shearing pen, and lay each row of the atlas table from the lightest at the left end to the darkest at the right. Things out of order go back.',
  seed: 3535,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.4, seed: 35, shapes: [{ x: -20, z: -26, r: 12, h: 9 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 30], [0, 5]])],
    flats: [{ x: 0, z: 0, r: 7, paint: '#d8c8a4' }, { x: -14, z: -12, r: 6 }, { x: 14, z: -10, r: 6 }, { x: 13, z: 12, r: 5 }],
  },
  look: { ...LOOKS.morning, sunI: 3 },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#f4d060', '#e88aa0', '#a8c8f0'],
    trees: [{ kind: 'olive', area: { x: 16, z: -12, r: 5 }, count: 4 }, { kind: 'fig', at: [[-6, 14], [8, 22]] }],
    rocks: [],
    pebbles: 14,
    rim: ['olive', 'oak'],
  },
  far: '#7a9a5a',
  mountains: { color: '#9a90a8', height: 1 },
  start: [0, 26],
  startYaw: Math.PI,
  structures: [
    { type: 'cliff', x: -16, z: -18, rot: 0.3, w: 14, h: 8, color: '#e8dcc8', accent: '#b8503a' },
    { type: 'pen', x: 13, z: 14, w: 6, d: 5 },
  ],
  welcome:
    'Welcome to the Colour Atlas. Surah Fatir asks: do you not see the fruits of many colours, the white, red and very black streaks in the mountains, and people, creatures and animals of many colours too?',
  tasks: [
    {
      id: 'mercy',
      kind: 'read',
      at: [3, 20],
      marker: 'sign',
      title: 'Mercy',
      goal: 'Read at the sign on the path',
      reading: { title: 'No one can hold it back', refs: [[35, 2]], note: 'Whatever mercy Allah opens for people, no one can hold it back; and whatever He holds back, no one can release after Him. He is the Mighty, the Wise.' },
    },
    {
      id: 'atlas',
      kind: 'shades',
      requires: ['mercy'],
      title: 'The atlas of colours',
      goal: 'Lay all three rows from lightest to darkest',
      intro: 'Pick up a stone at the cliff, a fruit in the orchard or a skein of wool by the pen, and lay it in its row on the atlas table. The white post marks the light end; the dark post marks the dark end.',
      adaptation: 'The atlas table and the choice of things are game ideas, to look closely at the colours the verses speak of.',
      table: [0, 0],
      rows: [
        {
          name: 'mountain stones',
          shape: 'stone',
          items: [
            { label: 'white stone', color: '#f2eee6', light: 0.95, at: [-18, -12] },
            { label: 'pale red stone', color: '#e0a890', light: 0.7, at: [-14, -14] },
            { label: 'red stone', color: '#b8503a', light: 0.45, at: [-10, -12] },
            { label: 'dark red stone', color: '#7a2e22', light: 0.3, at: [-16, -9] },
            { label: 'black stone', color: '#1e1a18', light: 0.08, at: [-12, -8] },
          ],
          reading: { title: 'Streaks in the mountains', refs: [[35, 27]], note: 'Do you not see that Allah sends down rain from the sky, and brings out fruits of different colours? And in the mountains are streaks, white and red of different shades, and some very black.' },
        },
        {
          name: 'fruits',
          shape: 'fruit',
          items: [
            { label: 'lemon', color: '#f0d84a', light: 0.82, at: [12, -12] },
            { label: 'apricot', color: '#e8a050', light: 0.65, at: [16, -8] },
            { label: 'pomegranate', color: '#c03a32', light: 0.4, at: [18, -12] },
            { label: 'fig', color: '#5a3050', light: 0.22, at: [14, -15] },
          ],
          reading: { title: 'Fruits of many colours', refs: [[35, 27]], note: 'From the same rain Allah brings out fruits of different colours.' },
        },
        {
          name: 'wool',
          shape: 'wool',
          items: [
            { label: 'white wool', color: '#efe8d8', light: 0.92, at: [10, 10] },
            { label: 'tan wool', color: '#c8a070', light: 0.6, at: [16, 10] },
            { label: 'brown wool', color: '#7a5232', light: 0.35, at: [10, 16] },
            { label: 'black wool', color: '#2a2420', light: 0.1, at: [16, 16] },
          ],
          reading: { title: 'People and animals of many colours', refs: [[35, 28]], note: 'And among people, creatures and grazing animals there are different colours too. Of His servants, those who have knowledge are the ones who truly fear Allah.' },
        },
      ],
      reading: { title: 'Not equal', refs: [[35, 19], [35, 20], [35, 21]], note: 'Not equal are the blind and the seeing, nor darkness and light, nor shade and heat.' },
      outro: 'The atlas is full, every row from light to dark.',
    },
  ],
  finale: {
    title: 'A world of colours',
    body: ['You looked closely at stones, fruits and wool, and laid each row from light to dark.', 'Surah Fatir points to the many colours in the mountains, in fruits, and in people and animals, as signs for those who know.'],
    ref: [35, 28],
    questions: ['Which row was hardest to put in order?', 'What colours can you find outside your window?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The angels with wings (35:1) are not shown; that verse is left to the whole-surah reading.', 'People are not sorted or compared by colour in the game; only stones, fruits and wool are laid in rows.'],
};
