// Surah 20, Ta-Ha: the Far Light. Dark hills at night, and far away on a
// mountain a light is burning. The core play is keeping the light in view
// (20:10): the hills in between hide it from the hollows and show it from
// the heights, and cairns may only be built where it can be seen. The player
// never reaches the light. Musa, his family and Harun are never shown, and
// what happened at the light (20:11-14) is read, not pictured.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const NIGHT = { ...LOOKS.dusk, zen: '#10183a', mid: '#25305e', hor: '#4a4a78', sunI: 0.6, sunColor: '#9aa4d8', hemiI: 0.85, hemiSky: '#56649c', stars: 1, fogDensity: 0.006, fog: '#323a5e', birds: false, clouds: 0.3 };

export const W020: WorldDef = {
  surah: 20,
  name: 'The Far Light',
  theme: 'Cross the dark hills, keeping a far light in view',
  play: 'A night of hills. A light burns far away, and the hills hide it from the hollows. Find the high places where it can be seen and build a cairn at each, so the way keeps the light in view. Cairns are refused where the light is hidden.',
  seed: 2020,
  ground: {
    radius: 60,
    base: rolling({
      radius: 60,
      amp: 2,
      seed: 20,
      shapes: [
        { x: 0, z: -50, r: 12, h: 9 },
        { x: -14, z: 24, r: 10, h: 8 },
        { x: 13, z: 22, r: 9, h: 7 },
        { x: 0, z: 2, r: 12, h: 11 },
        { x: -18, z: -22, r: 10, h: 9 },
        { x: 18, z: -22, r: 10, h: 9 },
        { x: -4, z: 12, r: 6, h: -2 },
        { x: 8, z: -10, r: 6, h: -2 },
      ],
    }),
    palette: PAL.dry,
    paths: [curve([[0, 48], [-3, 32], [-12, 25], [-3, 12], [0, 3], [10, -10], [17, -20]])],
    flats: [{ x: 0, z: 44, r: 4 }],
  },
  look: NIGHT,
  veg: {
    grass: 0.5,
    dryGrass: true,
    flowers: ['#e8e0c8'],
    trees: [{ kind: 'olive', area: { x: 0, z: 0, r: 40 }, count: 8 }, { kind: 'cypress', at: [[-24, 36], [24, 34]] }],
    rocks: [{ x: 0, z: -10, n: 10, big: 1.4, spread: 30 }],
    pebbles: 30,
    rim: ['olive', 'cypress'],
  },
  far: '#3a4060',
  mountains: { color: '#3a4270', height: 1.2 },
  start: [0, 46],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Far Light. It is night in the hills. Far away, on a mountain, a light is burning, but the hills in between hide it from the low places. Surah Ta-Ha begins the story of Musa with a light seen at night. Read at the lantern first.',
  tasks: [
    {
      id: 'story',
      kind: 'read',
      at: [3, 41],
      marker: 'lantern',
      title: 'A fire seen at night',
      goal: 'Read at the lantern by the start',
      reading: {
        title: 'Has the story of Musa reached you?',
        refs: [[20, 9], [20, 10]],
        note: 'Musa saw a fire far away at night. He told his family to stay where they were: perhaps he could bring them a burning torch from it, or find some guidance at the fire.',
      },
      adaptation: 'Musa and his family are not shown. The night hills are a place made for this game.',
    },
    {
      id: 'light',
      kind: 'beacon',
      requires: ['story'],
      title: 'Keep the light in view',
      goal: 'Build a cairn on each high place where the far light can be seen',
      intro: 'Look for the far light. Down in the hollows the hills hide it; up on the heights you can see it again. Build a cairn only where you can see the light, so the cairns mark a way that keeps it in view.',
      adaptation: 'The far light, the hills and the cairns are game ideas. You never reach the light and nothing at it is shown; what happened there (20:11-14) is read only.',
      light: [0, -50],
      lightY: 3,
      // From the hill tops the light is in view; from the hollows it is hidden (checked with the line-of-sight probe).
      piles: [[-3, 32], [-15, 24], [13, 22], [3, 14], [0, 2], [22, -15], [18, -22]],
      need: 3,
      reading: {
        title: 'At the fire',
        refs: [[20, 11], [20, 12], [20, 13], [20, 14]],
        note: 'When Musa came to the fire, he was called: his Lord told him to take off his sandals, for he was in the sacred valley of Tuwa, that He had chosen him, and that he should worship Him and pray to remember Him.',
      },
    },
    {
      id: 'helper',
      kind: 'read',
      requires: ['light'],
      at: [-6, 30],
      marker: 'sign',
      title: 'A prayer for help',
      goal: 'Read at the sign on the way back',
      reading: {
        title: 'Ease my task',
        refs: [[20, 25], [20, 26], [20, 27], [20, 28], [20, 29], [20, 30], [20, 31], [20, 32]],
        note: 'Musa asked his Lord to open his heart, to make his task easy, to loosen the knot from his tongue so that people would understand him, and to give him his brother Harun as a helper.',
      },
      adaptation: 'Musa and Harun are not shown.',
    },
    {
      id: 'gentle',
      kind: 'read',
      requires: ['helper'],
      at: [8, 36],
      marker: 'lantern',
      title: 'Gentle words',
      goal: 'Read at the lantern near the start',
      reading: {
        title: 'Speak gently',
        refs: [[20, 43], [20, 44], [20, 46]],
        note: 'Musa and Harun were sent to Pharaoh, who had gone too far, and told to speak to him with gentle words, so that he might remember or take care. Allah told them: do not be afraid, I am with you both, hearing and seeing.',
      },
      adaptation: "Pharaoh's court is not shown; this world keeps to the hills and the far light.",
    },
    {
      id: 'knowledge',
      kind: 'read',
      requires: ['gentle'],
      at: [-3, 44],
      marker: 'sign',
      title: 'Ask for knowledge',
      goal: 'Read at the sign by the start',
      reading: {
        title: 'My Lord, increase me in knowledge',
        refs: [[20, 114], [20, 123]],
        note: 'The surah teaches a short prayer: My Lord, increase me in knowledge. And it promises that whoever follows the guidance Allah sends will not go astray.',
      },
    },
  ],
  finale: {
    title: 'Guided by a light',
    body: [
      'You crossed the dark hills and built your cairns only where the far light could be seen.',
      'Surah Ta-Ha tells how Musa set out toward a light at night, hoping to find guidance there, and how he asked his Lord to ease his task.',
    ],
    ref: [20, 114],
    questions: ['When did the hills hide the light, and how did you find it again?', 'What would you ask for in a prayer like "increase me in knowledge"?'],
  },
  notes: [
    'Allah is never pictured, in any form, and the call at the fire (20:11-14) is read only.',
    'No prophet is shown or played: Musa and Harun never appear.',
    "Musa's family, Pharaoh and the magicians are not shown. The sea crossing is not shown.",
    'The far light is a game picture; the player never reaches it.',
  ],
};
