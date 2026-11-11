// Surah 81, At-Takwir (The Folding Up): the Cairn Hills. Bare high hills
// before dawn, with cairns of piled stones on the tops, each with a compass
// rose carved on its base stone, and tracks running between them. "So where
// are you going? It is only a reminder for the worlds, for whoever of you
// wills to take a straight way" (81:26-28). The core play: at each cairn you
// are told which way to head; read the carved rose, take the track that
// runs that way, and reach the next cairn; a wrong track leads to a wrong
// cairn. The events of 81:1-14 are never shown, and the angel of 81:19-21
// is read only.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const C: P2[] = [[0, 30], [0, 16], [12, 6], [4, -8], [-12, -10], [-12, 14], [18, -8]];
/** The tracks between the cairns: the right ones and the ones that lead astray. */
const TRACKS: [number, number][] = [[0, 1], [1, 2], [1, 5], [2, 3], [2, 6], [3, 4], [3, 6], [5, 4]];

export const W081: WorldDef = {
  surah: 81,
  name: 'The Cairn Hills',
  theme: 'Find the straight way across the hills by compass, cairn to cairn',
  play: 'Before dawn, in bare hill country, stone cairns stand on the tops and many tracks run between them. At each cairn you are told which way to head. Read the compass rose carved on the cairn’s base stone, take the track that runs that way, and walk on to the next cairn. Reach the lookout as the dawn breathes in.',
  seed: 8181,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 2, seed: 81 }),
    palette: PAL.autumn,
    paths: [curve([[0, 36], [0, 30]]), ...TRACKS.map(([a, b]) => curve([C[a], C[b]]))],
    flats: [
      { x: 0, z: 30, r: 3 }, { x: 0, z: 16, r: 3 }, { x: 12, z: 6, r: 3 }, { x: 4, z: -8, r: 3 }, { x: -12, z: -10, r: 3 },
      { x: -12, z: 14, r: 3 }, { x: 18, z: -8, r: 3 }, { x: 6, z: 34, r: 3 },
    ],
  },
  look: { ...LOOKS.dusk, sun: [0.7, 0.05, -0.7], stars: 1, sunI: 1.8 },
  veg: {
    grass: 0.9,
    flowers: ['#c8a0e0'],
    trees: [{ kind: 'pine', at: [[14, 20], [-20, 0], [20, -22]] }],
    rocks: [{ x: -24, z: 24, n: 6, big: 1.4, spread: 7 }, { x: 26, z: 8, n: 5, big: 1.3, spread: 6 }],
    pebbles: 30,
    rim: ['pine'],
  },
  far: '#8a8a6a',
  mountains: { color: '#6a6a90', height: 1.1 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Cairn Hills. Surah At-Takwir swears by the stars that run and hide, by the night as it goes, and by the dawn as it breathes, and then asks: so where are you going? Out here, the way is easy to lose. Find the straight way, cairn by cairn.',
  tasks: [
    {
      id: 'stars',
      kind: 'read',
      at: [6, 34],
      marker: 'sign',
      title: 'The dawn as it breathes',
      goal: 'Read at the sign at the foot of the hills',
      reading: { title: 'The dawn as it breathes', refs: [[81, 15], [81, 16], [81, 17], [81, 18]], note: 'I swear by the stars that draw back, that run their course and hide, and by the night as it departs, and by the dawn as it breathes.' },
    },
    {
      id: 'way',
      kind: 'bearings',
      requires: ['stars'],
      r: 2.4,
      cairns: [
        { at: [0, 30], name: 'the first cairn' },
        { at: [0, 16], name: 'the twin-rock cairn' },
        { at: [12, 6], name: 'the juniper cairn' },
        { at: [4, -8], name: 'the ridge cairn' },
        { at: [-12, -10], name: 'the lookout cairn' },
        { at: [-12, 14], name: 'the gully cairn' },
        { at: [18, -8], name: 'the old shepherds’ cairn' },
      ],
      route: [0, 1, 2, 3, 4],
      title: 'Where are you going?',
      goal: 'From cairn to cairn, head the way you are told, using the compass rose on each cairn',
      intro: 'The gold point on the carved rose shows north. Turn until you face the way you are told, then walk to the cairn that way.',
      adaptation: 'The hill country and its cairns are a game. Finding your way with a compass is real.',
      outro: 'You reach the lookout cairn as the dawn breathes in over the hills.',
      after: { title: 'A straight way', refs: [[81, 26], [81, 27], [81, 28], [81, 29]], note: 'So where are you going? It is only a reminder for all the worlds, for whoever of you wishes to take a straight way. And you cannot wish unless Allah, Lord of the worlds, wills.' },
    },
    {
      id: 'messenger',
      kind: 'read',
      requires: ['way'],
      at: [-12, -14],
      marker: 'tablet',
      title: 'A noble messenger',
      goal: 'Read at the tablet below the lookout',
      adaptation: 'The angel who brought the Quran is never shown; the ayahs are read only.',
      reading: { title: 'A noble messenger', refs: [[81, 19], [81, 20], [81, 21]], note: 'It is the word of a noble messenger, full of strength, held in honour by the Lord of the Throne, obeyed there and trustworthy.' },
    },
  ],
  finale: {
    title: 'A straight way',
    body: ['North, north-east, north-west, west: you followed the carved roses from cairn to cairn and did not lose the way.', 'Surah At-Takwir asks: so where are you going?'],
    ref: [81, 26],
    questions: ['How did you know which way was north-east?', 'Where are you going in your own life?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The events of the Day in 81:1-14 are never shown.', 'The angel and the Prophet mentioned in 81:19-25 are never shown.'],
};
