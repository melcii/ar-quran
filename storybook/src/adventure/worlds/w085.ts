// Surah 85, Al-Buruj (The Great Stars): the Old Town Library. An old stone
// library in a hill town under a night sky full of great stars (85:1), its
// roof leaking in one corner and its west window letting in the afternoon
// sun. "But this is a glorious Quran, in a Preserved Tablet" (85:21-22):
// Allah keeps the Quran safe; we look after our own copies with care. The
// core play: carry each book and tool from the table to a place that keeps
// it dry, out of the sun, or up off the floor, as it needs; each place holds
// one thing, so some must be thought through. The people of the trench
// (85:4-8) are read only: no one is shown, and no fire is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const STONE = '#c8b898';

export const W085: WorldDef = {
  surah: 85,
  name: 'The Old Town Library',
  theme: 'Keep the library’s books and tools safe, each in a place that suits it',
  play: 'In an old town library under a sky of great stars, the roof leaks in one corner and the sun comes in at the window. On the table wait an old handwritten copy of the Quran, new paper, ink pots and a cloth bag. Carry each to a place that keeps it dry, out of the sun, or up off the floor, as it needs. Each place holds one thing.',
  seed: 8585,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 0.8, seed: 85 }),
    palette: PAL.autumn,
    paths: [curve([[0, -34], [-6, -22], [0, -12], [0, -7]])],
    flats: [{ x: 0, z: 0, r: 9, paint: '#c8b8a0' }, { x: -6, z: -22, r: 3 }, { x: 12, z: -12, r: 3 }],
  },
  look: { ...LOOKS.dusk, stars: 1, sunI: 1.6 },
  veg: {
    grass: 0.7,
    flowers: ['#fff2d8'],
    trees: [{ kind: 'cypress', at: [[-10, -10], [10, -10], [-12, 10], [12, 10]] }],
    rocks: [],
    pebbles: 10,
    rim: ['cypress', 'olive'],
  },
  far: '#8a8a6a',
  mountains: { color: '#6a6a90', height: 0.8 },
  start: [0, -34],
  startYaw: 0,
  structures: [
    { type: 'wall', x: -7, z: 7, to: [7, 7], h: 3.2, color: STONE },
    { type: 'wall', x: -7, z: 7, to: [-7, -7], h: 3.2, color: STONE },
    { type: 'wall', x: 7, z: 7, to: [7, -7], h: 3.2, color: STONE },
    { type: 'wall', x: -7, z: -7, to: [-1.6, -7], h: 3.2, color: STONE },
    { type: 'wall', x: 1.6, z: -7, to: [7, -7], h: 3.2, color: STONE },
    { type: 'rug', x: 0, z: -1, w: 3, d: 4 },
  ],
  welcome:
    'Welcome to the Old Town Library. Surah Al-Buruj swears by the sky with its great stars, and ends: this is a glorious Quran, in a Preserved Tablet. Allah keeps the Quran safe. Here, it is our turn to look after the library’s books with care.',
  tasks: [
    {
      id: 'stars',
      kind: 'read',
      at: [-6, -22],
      marker: 'sign',
      title: 'The sky of great stars',
      goal: 'Read at the sign on the lane',
      adaptation: 'The promised Day and what is witnessed are never pictured; they are read only.',
      reading: { title: 'The sky of great stars', refs: [[85, 1], [85, 2], [85, 3]], note: 'By the sky with its great stars, and by the promised Day, and by the witness and what is witnessed!' },
    },
    {
      id: 'keep',
      kind: 'shelves',
      requires: ['stars'],
      table: [0, 1],
      items: [
        { name: 'the old handwritten Quran', needs: ['dry', 'shade', 'high'] },
        { name: 'the box of new paper', needs: ['dry'] },
        { name: 'the ink pots', needs: ['shade'] },
        { name: 'the cloth bag of reed pens', needs: [] },
      ],
      spots: [
        { name: 'the high shelf in the inner corner', at: [-5, 5], has: ['dry', 'shade', 'high'], why: '' },
        { name: 'the window ledge', at: [5.5, 0], has: ['dry', 'high'], why: 'the afternoon sun shines on the window ledge, and sunlight fades ink and warms it' },
        { name: 'the shelf under the leak', at: [5, 5], has: ['shade', 'high'], why: 'water drips from the roof here, and damp spoils paper' },
        { name: 'the floor by the door', at: [-5, -5], has: ['dry', 'shade'], why: 'the floor by the door is swept and stepped on, and anything there can be knocked or kicked' },
      ],
      title: 'Kept with care',
      goal: 'Carry each thing from the table to a place in the library that keeps it safe',
      intro: 'Pick something up from the table, then put it where it will be kept safe. Each place holds only one thing.',
      adaptation: 'The library is a game. Allah Himself preserves the Quran; looking after our own copies with care is a separate, real good.',
      outro: 'Everything is kept safe: dry, shaded or off the floor, as it needs.',
      after: { title: 'In a Preserved Tablet', refs: [[85, 21], [85, 22]], note: 'But this is a glorious Quran, in a Preserved Tablet.' },
    },
    {
      id: 'trench',
      kind: 'read',
      requires: ['keep'],
      at: [12, -12],
      marker: 'tablet',
      title: 'The people of the trench',
      goal: 'Read at the tablet in the garden',
      adaptation: 'The believers and those who harmed them are never shown, and no fire is shown; the account is read only.',
      reading: { title: 'The people of the trench', refs: [[85, 4], [85, 5], [85, 6], [85, 7], [85, 8], [85, 9]], note: 'Cursed were the people of the trench, with its fire full of fuel, when they sat by it and watched what they did to the believers. They held nothing against them except that they believed in Allah, the Mighty, the Praiseworthy, to whom belongs the kingdom of the heavens and the earth. And Allah is Witness over everything.' },
    },
  ],
  finale: {
    title: 'Kept with care',
    body: ['The old Quran went high on the dry, shaded shelf, and each other thing found the place that suited it.', 'Surah Al-Buruj says the Quran is in a Preserved Tablet: Allah keeps it safe.'],
    ref: [85, 22],
    questions: ['Why did the old Quran need the one place with all three?', 'How do you look after your own books?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The people of the trench (85:4-8) are never shown and no fire is shown; the account is read only.', 'The Preserved Tablet is never pictured.'],
};
