// Surah 83, Al-Mutaffifin (Those Who Give Less): the Covered Market. A
// busy covered market with a long arcade of grain, oil, date and lentil
// stalls, each keeping two measures: one it buys with and one it sells
// with. "Woe to those who give less than due: who, when they take a measure
// from people, take in full, but when they measure or weigh for them, give
// less" (83:1-3). The core play: carry the market's true copper measure
// and test both measures at every stall, then say whether the stall is
// honest or takes in full and gives short. No merchant is shown; the
// mockers of 83:29-36 are read only.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W083: WorldDef = {
  surah: 83,
  name: 'The Covered Market',
  theme: 'Test every stall’s buying and selling measures against the true one',
  play: 'In a covered market, every stall keeps two measures: one for buying from people and one for selling to them. You carry the market’s true copper measure. At each stall, pour it into both measures and see whether each fills exactly, overflows or leaves room. Then say whether the stall is honest, or takes in full and gives short.',
  seed: 8383,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 0.5, seed: 83 }),
    palette: PAL.dry,
    paths: [curve([[0, -34], [0, -18], [0, 18]])],
    flats: [{ x: 0, z: 0, r: 16, paint: '#d8c8a8' }, { x: 6, z: -22, r: 3 }],
  },
  look: LOOKS.golden,
  veg: {
    grass: 0.4,
    flowers: ['#e8a060'],
    trees: [{ kind: 'palm', at: [[-10, -20], [10, 22], [-12, 22]] }],
    rocks: [],
    pebbles: 8,
    rim: ['palm', 'olive'],
  },
  far: '#b8a070',
  mountains: { color: '#a8988a', height: 0.6 },
  start: [0, -34],
  startYaw: 0,
  structures: [
    { type: 'columns', x: -9, z: 0, w: 22, n: 6, rot: Math.PI / 2, color: '#e2d2b0' },
    { type: 'columns', x: 9, z: 0, w: 22, n: 6, rot: Math.PI / 2, color: '#e2d2b0' },
    { type: 'festoon', x: -9, z: -11, to: [9, -11], h: 3.6 },
    { type: 'festoon', x: -9, z: 11, to: [9, 11], h: 3.6 },
    { type: 'stall', x: -6, z: -8, rot: Math.PI / 2 },
    { type: 'stall', x: 6, z: -4, rot: -Math.PI / 2 },
    { type: 'stall', x: -6, z: 0, rot: Math.PI / 2 },
    { type: 'stall', x: 6, z: 4, rot: -Math.PI / 2 },
    { type: 'stall', x: -6, z: 8, rot: Math.PI / 2 },
  ],
  welcome:
    'Welcome to the Covered Market. Surah Al-Mutaffifin begins: woe to those who give less than due, who take full measure from people but give them short. The market keeper has given you the true copper measure. Test every stall’s measures.',
  tasks: [
    {
      id: 'stand',
      kind: 'read',
      at: [6, -22],
      marker: 'sign',
      title: 'A great Day',
      goal: 'Read at the sign at the market gate',
      adaptation: 'The Day is never pictured; it is read only.',
      reading: { title: 'A great Day', refs: [[83, 4], [83, 5], [83, 6]], note: 'Do they not think they will be raised up, for a great Day, the Day when people will stand before the Lord of the worlds?' },
    },
    {
      id: 'measures',
      kind: 'inspect',
      requires: ['stand'],
      stalls: [
        { at: [-4.5, -8], what: 'wheat', buy: 1, sell: 1 },
        { at: [4.5, -4], what: 'olive oil', buy: 1.2, sell: 0.8 },
        { at: [-4.5, 0], what: 'dates', buy: 1, sell: 1 },
        { at: [4.5, 4], what: 'barley', buy: 1.25, sell: 0.85 },
        { at: [-4.5, 8], what: 'lentils', buy: 1, sell: 1 },
      ],
      title: 'Full measure',
      goal: 'At every stall, test the buying and selling measures with the true measure and say whether it is honest',
      intro: 'Test both measures at each stall before you decide.',
      adaptation: 'The market and its stalls are a game; no merchant is shown and no one real is accused. Measuring fairly is a real duty.',
      outro: 'Every stall tested: three honest, and two that took in full and gave short.',
      after: { title: 'Those who give less', refs: [[83, 1], [83, 2], [83, 3]], note: 'Woe to those who give less than due: who, when they take a measure from people, take it in full, but when they measure or weigh for them, give them less.' },
    },
    {
      id: 'laughed',
      kind: 'read',
      requires: ['measures'],
      at: [0, 16],
      marker: 'tablet',
      title: 'They used to laugh',
      goal: 'Read at the tablet at the far end of the arcade',
      adaptation: 'The mockers and the believers are never shown; the ayahs are read only.',
      reading: { title: 'They used to laugh', refs: [[83, 29], [83, 30], [83, 31], [83, 32], [83, 33]], note: 'Those who did wrong used to laugh at those who believed, and wink at one another when they passed them, and come home joking, and say when they saw them, “These people are lost!” Yet they were not sent to watch over them.' },
    },
  ],
  finale: {
    title: 'The true measure',
    body: ['You tested every stall’s two measures. Two stalls bought with a big measure and sold with a small one.', 'Surah Al-Mutaffifin warns those who take in full and give short.'],
    ref: [83, 3],
    questions: ['Why did the cheating stalls need two different measures?', 'Where else should we give full measure?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No merchant is shown; the stalls are a game.', 'The Day and the registers of 83:7-28 are read or left out, never shown.'],
};
