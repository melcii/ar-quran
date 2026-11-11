// Surah 62, Al-Jumu'ah (Friday): the Friday Market. A busy market square on
// a Friday morning, with fruit stalls under awnings and a mosque with a
// tall minaret at the top of the street. The core play: keep your fruit
// stall and give each customer what they ask for; when the call for the
// Friday prayer comes, in the middle of a sale, close the stall and go,
// even with a customer waiting (62:9). After the prayer, go back and open
// the stall again and seek Allah's bounty (62:10). The call is shown only
// as words, no voice is made, and the prayer itself is not played.
// Customers are never shown.
import { curve } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const stalls: Structure[] = [
  [6, 8], [-6, 16], [6, 16], [-6, 24], [6, 24],
].map(([x, z], i) => ({ type: 'stall', x, z, rot: x < 0 ? Math.PI / 2 : -Math.PI / 2, color: ['#3f7f8a', '#d8664a', '#c8a040', '#7a4a8a', '#3f8a5a'][i] }));
const houses: Structure[] = [
  [-14, 4, 0], [14, 4, 0], [-14, 16, 0], [14, 16, 0], [-14, 28, 0], [14, 28, 0],
].map(([x, z], i) => ({ type: 'house', x, z, rot: x < 0 ? Math.PI / 2 : -Math.PI / 2, w: 6, d: 5, h: 3.6, accent: ['#3f6f9a', '#a04a3a', '#3f7f5a', '#c8a040', '#7a4a8a', '#3f8a8a'][i] }));

export const W062: WorldDef = {
  surah: 62,
  name: 'The Friday Market',
  theme: 'Keep your stall on Friday morning, and leave trade when the call comes',
  play: 'It is Friday morning and you keep a fruit stall in the market. Give each customer what they ask for. When the call for the Friday prayer comes, close the stall and walk to the mosque, even if a customer is waiting. After the prayer, open the stall again.',
  seed: 6262,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1, seed: 62, tilt: [0, 0.03] }),
    palette: PAL.dry,
    paths: [curve([[0, 40], [0, 20], [0, 0], [0, -14]])],
    pathWidth: 3.2,
    flats: [{ x: 0, z: 16, r: 12, paint: '#e2cc9e' }, { x: 0, z: -18, r: 9, paint: '#e8d8b0' }],
  },
  look: LOOKS.desert,
  veg: {
    grass: 0.5,
    flowers: ['#fff2d8', '#e8c070'],
    trees: [{ kind: 'palm', area: { x: 0, z: 0, r: 34 }, count: 10, size: [0.9, 1.3] }, { kind: 'palm', at: [[-8, -12], [8, -12]] }],
    rocks: [{ x: 30, z: -24, n: 5, big: 1.2, spread: 8 }],
    pebbles: 20,
    rim: ['palm', 'olive'],
  },
  far: '#c0a878',
  mountains: { color: '#b0a090', height: 0.8 },
  start: [0, 40],
  startYaw: Math.PI,
  structures: [
    ...stalls,
    ...houses,
    { type: 'dome', x: 0, z: -24, w: 10, d: 8, h: 6, color: '#efe2c6', accent: '#3f8a7a' },
    { type: 'tower', x: 7, z: -22, h: 10, w: 1.4, d: 1.4 },
    { type: 'festoon', x: -5, z: 12, to: [5, 12], h: 3.6 },
  ],
  welcome:
    'Welcome to the Friday Market. Surah Al-Jumu‘ah tells the believers that when the call for the Friday prayer comes, they should leave their trade and hurry to remember Allah, and afterwards go out again and seek His bounty.',
  tasks: [
    {
      id: 'glorify',
      kind: 'read',
      at: [3, 34],
      marker: 'sign',
      title: 'Everything glorifies Allah',
      goal: 'Read at the sign at the top of the market street',
      reading: { title: 'Everything glorifies', refs: [[62, 1], [62, 2]], note: 'Everything in the heavens and on earth glorifies Allah, the King, the Holy, the Almighty, the Wise. It is He who sent a Messenger to a people who could not read, from among themselves, to recite His verses to them, purify them, and teach them the Book and wisdom.' },
    },
    {
      id: 'friday',
      kind: 'friday',
      requires: ['glorify'],
      title: 'Leave trade at the call',
      goal: 'Keep the fruit stall, close it when the call for the Friday prayer comes and go to the mosque, then open it again afterwards',
      intro: 'Your stall is the one with the dates and figs, near the start of the market. Give each customer what they ask for. Listen out: when the call for the Friday prayer comes, what will you do?',
      adaptation: 'The stall and its customers are a game idea. The call is shown as words only, and the prayer itself is not played.',
      stall: [-4.5, 8],
      mosque: [0, -17.5],
      goods: ['dates', 'figs', 'grapes', 'pomegranates'],
      orders: [0, 2, 1, 3, 0, 1, 3, 2],
      sales: 3,
      outro: 'You left the stall when the call came and went back afterwards to seek Allah’s bounty.',
    },
    {
      id: 'better',
      kind: 'read',
      requires: ['friday'],
      at: [4, -13],
      marker: 'tablet',
      title: 'What is with Allah is better',
      goal: 'Read at the tablet outside the mosque',
      reading: { title: 'Better than trade', refs: [[62, 11]], note: 'When some people saw trade or entertainment, they rushed off to it and left you standing. Say: "What is with Allah is better than entertainment and trade, and Allah is the best of providers."' },
    },
  ],
  finale: {
    title: 'Leave it, then return',
    body: ['You kept your stall, closed it when the call for the Friday prayer came even with a customer waiting, and opened it again after the prayer.', 'Surah Al-Jumu‘ah says: leave trade at the call, and when the prayer is over, go out and seek Allah’s bounty.'],
    ref: [62, 9],
    questions: ['Was it hard to close the stall with a customer waiting?', 'What could you put down when it is time to pray?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet and the people of the market are never shown.', 'No call to prayer is voiced; it is shown as words only.'],
};
