// Surah 84, Al-Inshiqaq (The Splitting): the Caravan Road. A caravan camp
// at the start of a long, dry road that runs through wide country to a
// town, with stone well-heads along the way. "I swear by the twilight glow,
// and by the night and what it gathers in, and by the moon when it grows
// full: you will surely travel from stage to stage" (84:16-19). The core
// play: plan the caravan's stages so it reaches the town in as few days as
// it can, with no day too long and every night at a well; then travel them,
// stage after stage, as the sky goes from twilight glow to night, to the
// full moon, to morning. The events of 84:1-15 are never shown.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const ROAD: P2[] = [[0, -32], [-10, -20], [-4, -8], [10, 0], [6, 14], [-6, 22], [0, 32]];

export const W084: WorldDef = {
  surah: 84,
  name: 'The Caravan Road',
  theme: 'Plan a caravan’s stages between wells, then travel them from twilight to morning',
  play: 'A caravan waits at the start of a long, dry road. The camels can walk at most 25 km a day, and every night must be spent at a well. Plan the stages so you reach the town in as few days as you can. Then travel them, one stage after another, as the sky turns from twilight to night, to the full moon, to morning.',
  seed: 8484,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1, seed: 84 }),
    palette: PAL.desert,
    paths: [curve(ROAD)],
    flats: [{ x: 4, z: -34, r: 5 }, { x: 0, z: 34, r: 6 }, { x: -6, z: -36, r: 3 }],
  },
  look: LOOKS.desert,
  veg: {
    grass: 0.3,
    flowers: ['#e8c070'],
    trees: [{ kind: 'palm', at: [[-4, 38], [6, 38], [14, -2]] }],
    rocks: [{ x: 22, z: -18, n: 6, big: 1.3, spread: 7 }, { x: -22, z: 10, n: 6, big: 1.3, spread: 7 }],
    pebbles: 30,
    rim: ['palm'],
  },
  far: '#c8a070',
  mountains: { color: '#b89a80', height: 0.9 },
  start: [6, -38],
  startYaw: 0,
  structures: [
    { type: 'tent', x: 8, z: -36, rot: 0.3, color: '#7a5a3a', accent: '#c8643a' },
    { type: 'house', x: -5, z: 38, rot: Math.PI, w: 5, d: 4.4, h: 3.2, accent: '#5a6a8a' },
    { type: 'house', x: 6, z: 39, rot: Math.PI, w: 5, d: 4.4, h: 3.2, accent: '#8a5a3a' },
  ],
  welcome:
    'Welcome to the Caravan Road. Surah Al-Inshiqaq swears by the twilight glow, by the night and all it gathers, and by the full moon: you will surely travel from stage to stage. Your caravan is ready. Plan the way well.',
  tasks: [
    {
      id: 'toil',
      kind: 'read',
      at: [-6, -36],
      marker: 'sign',
      title: 'Toiling towards your Lord',
      goal: 'Read at the sign by the camp',
      reading: { title: 'Toiling towards your Lord', refs: [[84, 6]], note: 'O people! You are toiling hard towards your Lord, and you will meet Him.' },
    },
    {
      id: 'road',
      kind: 'stages',
      requires: ['toil'],
      at: [3, -34],
      wells: [0, 18, 30, 41, 55, 62, 78, 90],
      reach: 25,
      road: ROAD,
      title: 'Stage after stage',
      goal: 'Plan the stages at the camp table, then make camp at each well you chose, in order',
      intro: 'Tap the wells you will stop at. No stage may be longer than 25 km, and you should arrive in as few days as you can.',
      adaptation: 'The road, its wells and the caravan are a game. Travelling by stages from well to well is real.',
      outro: 'Five stages, five nights by the wells, and the town in the morning light.',
      after: { title: 'Stage after stage', refs: [[84, 16], [84, 17], [84, 18], [84, 19]], note: 'I swear by the twilight glow, and by the night and what it gathers in, and by the moon when it grows full: you will surely travel from stage to stage.' },
    },
    {
      id: 'reward',
      kind: 'read',
      requires: ['road'],
      at: [0, 30],
      marker: 'tablet',
      title: 'A reward that never ends',
      goal: 'Read at the tablet at the town gate',
      reading: { title: 'A reward that never ends', refs: [[84, 25]], note: 'Except those who believe and do good: theirs is a reward that never ends.' },
    },
  ],
  finale: {
    title: 'From stage to stage',
    body: ['You planned five stages, none too long, and travelled them from the twilight glow, through the night and the full moon, to morning.', 'Surah Al-Inshiqaq says we will travel from stage to stage.'],
    ref: [84, 19],
    questions: ['How did you choose the wells to stop at?', 'What stages will your own life pass through?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The events of 84:1-15 and the records are never shown.', 'The wells and distances are a game, not a real route.'],
};
