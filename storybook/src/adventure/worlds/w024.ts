// Surah 24, An-Nur: the Courtyards of Permission. A lane of three walled
// courtyard houses in the afternoon sun. The core play is two things together:
// knocking and waiting to be welcomed before going in (24:27), going back
// when asked to (24:28), and, once welcomed, turning mirror stands so the
// sunbeam from the west opening reaches the reading window. The light is
// sunlight in a courtyard only. The parable of light (24:35) is about Allah
// and stays a reading: nothing made in the game stands for Allah.
import type { Structure } from '../kit';
import { curve, type P2 } from '../terrain';
import type { MirrorHouse, WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const CELL = 2.5;

const HOUSES: MirrorHouse[] = [
  {
    label: 'the house with the blue door',
    origin: [-24, 6],
    door: [-19, 6],
    n: 4,
    sun: 1,
    target: { cell: [2, 3], side: 'n' },
    mirrors: [{ cell: [2, 1], turn: 1 }, { cell: [1, 3], turn: 0 }],
    reading: { title: 'Ask first, and greet', refs: [[24, 27]], note: 'Do not go into houses other than your own until you have asked and been welcomed, and greet the people inside. That is best for you.' },
  },
  {
    label: 'the house with the olive tree',
    origin: [-5, -8],
    door: [0, -8],
    n: 4,
    sun: 0,
    target: { cell: [3, 3], side: 'e' },
    mirrors: [{ cell: [1, 0], turn: 1 }, { cell: [1, 3], turn: 1 }, { cell: [3, 1], turn: 0 }],
    later: true,
    reading: { title: 'If you are told to go back', refs: [[24, 28]], note: 'If no one is home, do not go in until you are given permission. And if you are told "Go back", then go back: that is purer for you.' },
  },
  {
    label: 'the house by the well',
    origin: [14, 6],
    door: [19, 6],
    n: 4,
    sun: 2,
    target: { cell: [3, 3], side: 'n' },
    mirrors: [{ cell: [1, 2], turn: 0 }, { cell: [1, 1], turn: 0 }, { cell: [3, 1], turn: 1 }],
    reading: { title: 'Greetings of peace', refs: [[24, 61]], note: 'When you go into houses, greet one another with peace: a greeting from Allah, blessed and good.' },
  },
];

/** Low courtyard walls round each house, with a gap at the door. */
function walls(): Structure[] {
  const out: Structure[] = [];
  const w = (a: P2, b: P2) => out.push({ type: 'wall', x: a[0], z: a[1], to: b, h: 1, color: '#e8dcc4' });
  for (const h of HOUSES) {
    const [x0, z0] = h.origin;
    const L = h.n * CELL;
    const x1 = x0 + L;
    const z1 = z0 - L;
    w([x0, z1], [x1, z1]);
    w([x0, z0], [x0, z1]);
    w([x1, z0], [x1, z1]);
    w([x0, z0], [h.door[0] - 0.9, z0]);
    w([h.door[0] + 0.9, z0], [x1, z0]);
  }
  return out;
}

export const W024: WorldDef = {
  surah: 24,
  name: 'The Courtyards of Permission',
  theme: 'Knock and be welcomed, then bring the sunlight through the courtyard',
  play: 'Three courtyard houses. Knock at each door and wait for an answer; one asks you to come back later, and you do. Once welcomed, turn the mirror stands so the sunbeam reaches the reading window.',
  seed: 2424,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1, seed: 24 }),
    palette: PAL.dry,
    paths: [curve([[0, 34], [0, 14], [-19, 10], [-19, 7]]), curve([[0, 14], [19, 10], [19, 7]]), curve([[0, 14], [0, -7]])],
    pathWidth: 2.6,
    flats: [
      { x: -14, z: 1, r: 9, paint: '#e2d4b4' },
      { x: 5, z: -13, r: 9, paint: '#e2d4b4' },
      { x: 24, z: 1, r: 9, paint: '#e2d4b4' },
    ],
  },
  look: { ...LOOKS.golden, sun: [-0.8, 0.35, -0.2] },
  veg: {
    grass: 0.5,
    dryGrass: true,
    flowers: ['#fff2d8', '#f0c0a0'],
    trees: [{ kind: 'olive', at: [[6, -2], [-8, 16], [10, 18]] }, { kind: 'palm', at: [[-28, 12], [28, 12], [-2, 24]] }, { kind: 'cypress', at: [[-12, -12], [12, -22]] }],
    rocks: [],
    pebbles: 10,
    rim: ['olive', 'cypress'],
  },
  far: '#a89a6a',
  mountains: { color: '#9a90a8', height: 0.9 },
  start: [0, 32],
  startYaw: Math.PI,
  structures: [...walls(), { type: 'well', x: 26, z: 9 }, { type: 'bench', x: 4, z: 16, rot: Math.PI / 2 }],
  welcome:
    'Welcome to the Courtyards of Permission. Surah An-Nur teaches good manners at people\'s homes: ask, and be welcomed, before going in. Each house here has a dark courtyard. Knock, wait for an answer, and once you are welcomed, bring the sunlight in with the mirrors.',
  tasks: [
    {
      id: 'houses',
      kind: 'mirror',
      title: 'Knock, then bring in the light',
      goal: 'Knock at each house and wait to be welcomed, then turn its mirrors so the sunlight reaches the window',
      intro: 'Go to a door and knock. Then wait by the door for an answer: do not go in before you are welcomed. Inside, turn the mirror stands so the sunbeam from the west opening reaches the glowing window.',
      adaptation: 'The houses, the knocking, the voices that answer and the mirror puzzle are game ideas. The people inside are not shown; their answers are written text. The light here is sunlight only and does not stand for anything in 24:35.',
      cell: CELL,
      houses: HOUSES,
      outro: 'Three houses visited with permission, and three courtyards full of sunlight.',
    },
    {
      id: 'parable',
      kind: 'read',
      requires: ['houses'],
      at: [4, 22],
      marker: 'lantern',
      title: 'The verse of light',
      goal: 'Read at the lantern by the bench',
      reading: {
        title: 'Light upon light',
        refs: [[24, 35]],
        note: 'This verse gives a parable about the light of Allah, using a niche, a lamp, glass and the oil of a blessed olive tree. Light helps us think about guidance, but nothing we make is a picture of Allah. Read the verse itself, and ask a teacher about what it means.',
      },
      adaptation: 'The verse is read only. No lamp, niche or light in this world stands for it.',
    },
  ],
  finale: {
    title: 'With permission',
    body: ['You knocked and waited at every door, went back when you were asked to, and brought sunlight into each courtyard.', 'Surah An-Nur teaches respect for people\'s homes and privacy, and greetings of peace when we go in.'],
    ref: [24, 61],
    questions: ['How did it feel to be asked to come back later?', 'What do you say when you go into a house?'],
  },
  notes: [
    'Allah is never pictured, in any form. The parable of light (24:35) is a reading only; no mirror, lamp or light stands for Allah.',
    'The people inside the houses are not shown.',
    'The mirror puzzle is a game idea.',
  ],
};
