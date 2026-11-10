// Surah 67, Al-Mulk (The Dominion): the Hill of Birds. A high grassy hill
// under a wide sky, with paths up its slopes and a well at its foot. The
// core play: lie on the mat at the top and watch the birds circling above;
// one at a time a bird is marked by a soft light, and you tell whether it
// glides with wings spread or beats and folds them (67:19, "Do they not see
// the birds above them with wings spread and folding? None holds them up
// except the Most Merciful"). Readings ask you to look at the sky again and
// again (67:3-4), to walk the earth's slopes (67:15), and who brings water
// (67:30). The flying is real; the hill is a game.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W067: WorldDef = {
  surah: 67,
  name: 'The Hill of Birds',
  theme: 'Watch the birds above and tell wings spread from wings folding',
  play: 'Climb the hill and lie on the mat at the top. Birds circle overhead; one at a time, one is marked by a soft light. Watch it and say how it flies: gliding on wide, still wings, or beating and folding them.',
  seed: 6767,
  ground: {
    radius: 48,
    base: rolling({ radius: 48, amp: 1.6, seed: 67, shapes: [{ x: 0, z: -6, r: 26, h: 7 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 42], [6, 28], [-4, 16], [2, 4], [0, -6]]), curve([[0, -6], [-10, -18], [-20, -30]])],
    flats: [{ x: 0, z: -6, r: 4 }, { x: 8, z: 30, r: 3 }, { x: -20, z: -30, r: 4 }],
  },
  look: { ...LOOKS.morning, clouds: 0.6 },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#f4d060', '#e88a9a'],
    trees: [{ kind: 'oak', area: { x: 0, z: 10, r: 36 }, count: 8 }, { kind: 'pine', area: { x: -20, z: -24, r: 10 }, count: 4 }],
    rocks: [{ x: 14, z: -10, n: 5, big: 1.2, spread: 6 }],
    pebbles: 24,
    rim: ['oak', 'pine'],
  },
  far: '#7a9a5a',
  mountains: { color: '#8a9ab8', height: 1 },
  start: [0, 42],
  startYaw: Math.PI,
  structures: [{ type: 'well', x: -16, z: -32 }],
  welcome:
    'Welcome to the Hill of Birds. Surah Al-Mulk asks us to look up at the sky again and again, and at the birds above us with wings spread and folding. Climb to the top of the hill.',
  tasks: [
    {
      id: 'dominion',
      kind: 'read',
      at: [8, 30],
      marker: 'sign',
      title: 'Blessed is He',
      goal: 'Read at the sign at the foot of the hill',
      reading: { title: 'Blessed is He', refs: [[67, 1], [67, 2]], note: 'Blessed is the One in whose hand is all control, and He is able to do anything. He created death and life to test which of you is best in what you do.' },
    },
    {
      id: 'again',
      kind: 'read',
      requires: ['dominion'],
      at: [4, 0],
      marker: 'tablet',
      title: 'Look again',
      goal: 'Read at the tablet near the top of the hill, then look up at the sky',
      reading: { title: 'Look again', refs: [[67, 3], [67, 4]], note: 'He created seven heavens in layers. You will not see any flaw in what the Most Merciful creates. Look again: do you see any cracks? Then look again, and again: your eyes will come back to you tired, having found none.' },
    },
    {
      id: 'birds',
      kind: 'wings',
      requires: ['again'],
      at: [-2, -8],
      rounds: 5,
      title: 'Wings spread and folding',
      goal: 'Lie on the mat at the top of the hill and watch five marked birds',
      intro: 'Watch the bird with the soft light. Big birds often glide on wide, still wings, held up by rising warm air. Smaller birds beat their wings, folding them in between. Which is this one doing?',
      adaptation: 'The hilltop and the marked birds are a game. Gliding with wings spread and beating with wings folding is how real birds fly.',
      outro: 'Five birds, each held up in the sky.',
      after: { title: 'The birds above', refs: [[67, 19]], note: 'Do they not see the birds above them, with wings spread and folding in? None holds them up except the Most Merciful. He sees everything.' },
    },
    {
      id: 'slopes',
      kind: 'read',
      requires: ['birds'],
      at: [-12, -20],
      marker: 'tablet',
      title: 'Walk its slopes',
      goal: 'Walk down the far slope and read at the tablet',
      reading: { title: 'The earth made easy', refs: [[67, 15]], note: 'It is He who made the earth easy for you, so walk along its slopes and eat from what He provides. And to Him you will all return.' },
    },
    {
      id: 'water',
      kind: 'read',
      requires: ['slopes'],
      at: [-20, -28],
      marker: 'scroll',
      title: 'Who brings the water?',
      goal: 'Read at the scroll by the well',
      reading: { title: 'Flowing water', refs: [[67, 30]], note: 'Say: "Think: if your water sank deep into the earth, who could bring you flowing water?"' },
    },
  ],
  finale: {
    title: 'Held up',
    body: ['You climbed the hill, looked at the sky again and again, and watched the birds above: some gliding on wide wings, some beating and folding them.', 'Surah Al-Mulk says none holds them up but the Most Merciful.'],
    ref: [67, 19],
    questions: ['Which birds glided, and which beat their wings?', 'Next time you see a bird, what will you look for?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The seven heavens are read only, never pictured.', 'The birds are a game; how they fly is real.'],
};
