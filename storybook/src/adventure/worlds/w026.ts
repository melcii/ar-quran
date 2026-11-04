// Surah 26, Ash-Shu'ara: the Echo Amphitheatre. A ring of rock with seven
// standing stones, one for each chapter of the surah: Musa, Ibrahim, Nuh,
// Hud, Salih, Lut and Shu'ayb. Each chapter ends with the same refrain. The
// core play is tuning echoes: strike the chime in the middle and a ring of
// sound goes out and bounces back from each stone; slide each stone out place by place
// (from the farthest it goes back to the nearest) until its echo comes back on its own beat. No prophet and no
// people are shown; the stones carry names only. Sound is drawn, not played.
import { curve } from '../terrain';
import type { Reading, WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const chapter = (label: string, slot: number, angle: number, reading: Reading) => ({ label, slot, angle, start: 0, reading });

export const W026: WorldDef = {
  surah: 26,
  name: 'The Echo Amphitheatre',
  theme: 'Tune each chapter stone so its echo returns on its beat',
  play: 'Seven standing stones ring an amphitheatre, one for each chapter of the surah, each with a light that beats at its own pace. Strike the chime and watch the echoes come back. Slide each stone until its echo returns exactly on its beat.',
  seed: 2626,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.2, seed: 26, shapes: [{ x: 0, z: -20, r: 16, h: 6 }] }),
    palette: PAL.dry,
    paths: [curve([[0, 32], [0, 4]])],
    flats: [{ x: 0, z: 0, r: 14, paint: '#d8c8a4' }],
  },
  look: { ...LOOKS.golden, sunI: 3 },
  veg: {
    grass: 0.5,
    dryGrass: true,
    flowers: ['#fff2d8'],
    trees: [{ kind: 'cypress', at: [[-16, 6], [16, 6], [-14, 14], [14, 14]] }, { kind: 'olive', area: { x: 0, z: 24, r: 10 }, count: 3 }],
    rocks: [{ x: 0, z: -22, n: 14, big: 2.2, spread: 24 }],
    pebbles: 20,
    rim: ['olive', 'cypress'],
  },
  far: '#a89a6a',
  mountains: { color: '#9a8ab0', height: 1.1 },
  start: [0, 28],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Echo Amphitheatre. Surah Ash-Shu\'ara tells seven stories of messengers and their peoples, and after each one the same words come back, like an echo. Read at the sign, then tune the stones.',
  tasks: [
    {
      id: 'book',
      kind: 'read',
      at: [3, 20],
      marker: 'sign',
      title: 'The clear Book',
      goal: 'Read at the sign on the path',
      reading: { title: 'The verses of the clear Book', refs: [[26, 1], [26, 2]], note: 'Ta, Seen, Meem. These are the verses of the clear Book.' },
    },
    {
      id: 'echoes',
      kind: 'echo',
      requires: ['book'],
      title: 'Tune the seven stones',
      goal: 'Slide each chapter stone until its echo comes back on its beat, then strike the chime',
      intro: 'Each stone has a light that beats at its own pace. Strike the chime in the middle and watch: a ring goes out, and a bright echo comes back from each stone. A stone farther away sends its echo back later. Slide each stone until its echo comes back on its beat.',
      adaptation: 'The amphitheatre, the stones, the beats and the echoes are game ideas. Sound is drawn as rings; there is no music. The stones carry the names of the chapters only: no prophet or people are shown.',
      centre: [0, 0],
      slots: [5, 7, 9, 11],
      speed: 8,
      stones: [
        chapter("Musa's stone", 2, -1.5, { title: 'Musa', refs: [[26, 10], [26, 67], [26, 68]], note: 'Musa was sent to the wrongdoing people of Pharaoh. At the end of the chapter comes the refrain: in that is a sign, but most of them did not believe; and your Lord is the Exalted in Might, the Merciful.' }),
        chapter("Ibrahim's stone", 1, -1, { title: 'Ibrahim', refs: [[26, 69], [26, 70], [26, 103], [26, 104]], note: 'Ibrahim asked his father and his people: what do you worship? And the refrain comes again.' }),
        chapter("Nuh's stone", 3, -0.5, { title: 'Nuh', refs: [[26, 105], [26, 121], [26, 122]], note: 'The people of Nuh rejected the messengers. And the refrain comes again.' }),
        chapter("Hud's stone", 2, 0, { title: 'Hud', refs: [[26, 123], [26, 140]], note: "The people of 'Ad rejected the messengers. And your Lord is the Exalted in Might, the Merciful." }),
        chapter("Salih's stone", 1, 0.5, { title: 'Salih', refs: [[26, 141], [26, 159]], note: 'The people of Thamud rejected the messengers. And your Lord is the Exalted in Might, the Merciful.' }),
        chapter("Lut's stone", 3, 1, { title: 'Lut', refs: [[26, 160], [26, 175]], note: 'The people of Lut rejected the messengers. And your Lord is the Exalted in Might, the Merciful.' }),
        chapter("Shu'ayb's stone", 2, 1.5, { title: "Shu'ayb", refs: [[26, 176], [26, 181], [26, 182], [26, 183], [26, 191]], note: "Shu'ayb told his people: give full measure, weigh with an even balance, and do not cheat people of what is theirs. And the refrain comes again." }),
      ],
      reading: { title: 'The refrain', refs: [[26, 8], [26, 9]], note: 'Indeed in that is a sign, but most of them did not believe. And indeed your Lord is the Exalted in Might, the Merciful. These words come after every story in the surah.' },
      outro: 'All seven stones ring in time, like the refrain after each story.',
    },
  ],
  finale: {
    title: 'The refrain',
    body: ['You tuned seven stones until each echo came back on its beat, one for each story in Surah Ash-Shu\'ara.', 'After every story the surah repeats the same words: in that is a sign, and your Lord is the Exalted in Might, the Merciful.'],
    ref: [26, 9],
    questions: ['Why might the Quran repeat the same words after each story?', 'What does a farther stone do to its echo?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown or played: the stones carry chapter names only. The peoples of the stories are not shown, and nothing of their punishment is pictured.',
    'Sound is drawn as rings; there is no music.',
  ],
};
