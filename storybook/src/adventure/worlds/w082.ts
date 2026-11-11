// Surah 82, Al-Infitar (The Cleaving): the Gorge Logs. A rocky gorge with
// a fast stream that the path crosses three times on narrow logs. "O
// mankind, what has deceived you about your Lord, the Generous, who created
// you, proportioned you and balanced you?" (82:6-7). The core play: cross
// each log keeping your balance, leaning the other way whenever you start
// to tip; the logs get narrower and springier. The events of 82:1-5 are
// read only, and the noble recorders of 82:10-12 are never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const STREAM = [[-40, -14], [-14, -10], [0, -2], [14, 10], [40, 16]] as [number, number][];

export const W082: WorldDef = {
  surah: 82,
  name: 'The Gorge Logs',
  theme: 'Keep your balance crossing narrow logs over a rushing stream',
  play: 'A path through a rocky gorge crosses a rushing stream three times on narrow logs. Cross each one: as you walk you start to tip one way or the other, so lean the other way to stay upright. Lean too late and you wobble back onto the bank to try again.',
  seed: 8282,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 1.6, seed: 82, streams: [{ pts: STREAM, w: 3.5, depth: 2 }] }),
    palette: PAL.coast,
    paths: [curve([[-6, -36], [-10, -22], [-14, -14]]), curve([[-14, -6], [-4, -8], [0, -6]]), curve([[0, 2], [6, 4], [12, 6]]), curve([[16, 14], [18, 24], [14, 32]])],
    water: -1,
    flats: [{ x: -10, z: -22, r: 3 }, { x: 14, z: 32, r: 3 }],
  },
  look: LOOKS.morning,
  veg: {
    grass: 0.8,
    flowers: ['#fff2d8', '#e8a0d0'],
    trees: [{ kind: 'pine', area: { x: 0, z: 0, r: 34 }, count: 9 }],
    rocks: [{ x: -20, z: 4, n: 7, big: 1.5, spread: 7 }, { x: 22, z: -6, n: 7, big: 1.5, spread: 7 }],
    pebbles: 30,
    rim: ['pine', 'oak'],
  },
  far: '#6a8a6a',
  mountains: { color: '#8a90a8', height: 1.2 },
  start: [-6, -36],
  startYaw: 0,
  structures: [
    { type: 'bridge', x: -14, z: -14.5, to: [-14, -6], w: 1 },
    { type: 'bridge', x: 2, z: -6, to: [-1, 2.5], w: 0.9 },
    { type: 'bridge', x: 12, z: 6, to: [16, 14], w: 0.8 },
  ],
  welcome:
    'Welcome to the Gorge Logs. Surah Al-Infitar asks: what has deceived you about your Lord, the Generous, who created you, shaped you and balanced you? Your body knows how to keep its balance. You will need it on these logs.',
  tasks: [
    {
      id: 'formed',
      kind: 'read',
      at: [-10, -22],
      marker: 'sign',
      title: 'Created, shaped and balanced',
      goal: 'Read at the sign above the gorge',
      reading: { title: 'Created, shaped and balanced', refs: [[82, 6], [82, 7], [82, 8]], note: 'O people! What has deceived you about your Lord, the Generous, who created you, shaped you and balanced you, and put you together in whatever form He willed?' },
    },
    {
      id: 'logs',
      kind: 'beam',
      requires: ['formed'],
      secs: 6,
      logs: [
        { at: [-14, -16], name: 'the first log', drift: 0.25 },
        { at: [2.5, -7.5], name: 'the second log', drift: 0.4 },
        { at: [11, 4.5], name: 'the narrow log', drift: 0.55 },
      ],
      title: 'Keeping your balance',
      goal: 'Cross each log over the stream, leaning to keep your balance',
      intro: 'Press Start across. When the meter starts to tip one way, lean the other way.',
      adaptation: 'The gorge and the logs are a game. The balance of the body is a real gift: this is a reminder of it.',
      outro: 'Three logs crossed, and you kept your balance on every one.',
      after: { title: 'Noble recorders', refs: [[82, 9], [82, 10], [82, 11], [82, 12]], note: 'No! But you deny the Judgement. And over you are watchers, noble, writing it down, who know whatever you do.' },
    },
    {
      id: 'cleave',
      kind: 'read',
      requires: ['logs'],
      at: [14, 32],
      marker: 'tablet',
      title: 'When the sky cleaves',
      goal: 'Read at the tablet at the top of the gorge',
      adaptation: 'The events of the Day are never pictured; they are read only.',
      reading: { title: 'When the sky cleaves', refs: [[82, 1], [82, 2], [82, 3], [82, 4], [82, 5]], note: 'When the sky splits open, and the stars are scattered, and the seas burst forth, and the graves are turned over, each soul will know what it has sent ahead and left behind.' },
    },
  ],
  finale: {
    title: 'Balanced',
    body: ['Three narrow logs, and each time you leaned the right way to stay upright.', 'Surah Al-Infitar reminds us that Allah created us, shaped us and balanced us.'],
    ref: [82, 7],
    questions: ['What helps your body keep its balance?', 'Why does the surah call Allah "the Generous" here?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The noble recorders (82:10-12) are angels and are never shown.', 'The events of 82:1-5 are read only.'],
};
