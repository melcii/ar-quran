// Surah 70, Al-Ma'arij (The Ways of Ascent): the Terraced Storehouse. A
// farm on a hillside of stepped terraces, climbing up like stairs, with a
// stone storehouse at the top and a share jar by its door. The surah says
// people are anxious: impatient in hardship, holding back in good times
// (70:19-21), except those within whose wealth is "a known right, for the
// one who asks and the one who is deprived" (70:24-25). The core play:
// through the year harvests come in, big and poor; from each, set aside the
// known share, one basket in every ten, never holding back. The farm is a
// game; the angels and the Day of 70:4 are never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W070: WorldDef = {
  surah: 70,
  name: 'The Terraced Storehouse',
  theme: 'Set aside the known share from every harvest, big or poor',
  play: 'Climb the stepped terraces of a hillside farm to the storehouse at the top. Through the year harvests come in: a big one, a poor one, a middling one. From each, count out the known share, one basket in every ten, and put it in the share jar by the door for anyone who asks or is in need.',
  seed: 7070,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 0.8, seed: 70, tilt: [0, 0.09] }),
    palette: PAL.autumn,
    paths: [curve([[0, -36], [6, -24], [-4, -12], [4, 0], [0, 10], [0, 18]])],
    flats: [{ x: 0, z: 22, r: 8, paint: '#c8b080' }, { x: -6, z: -14, r: 3 }],
  },
  look: LOOKS.golden,
  veg: {
    grass: 0.9,
    flowers: ['#f4d060', '#e8a060'],
    trees: [{ kind: 'olive', area: { x: 0, z: 0, r: 30 }, count: 8 }],
    rocks: [{ x: 22, z: -10, n: 5, big: 1, spread: 6 }],
    pebbles: 20,
    rim: ['olive', 'cypress'],
  },
  far: '#a89a5a',
  mountains: { color: '#a0988a', height: 0.8 },
  start: [0, -36],
  startYaw: 0,
  structures: [
    { type: 'stones', x: -14, z: -20, n: 6 },
    { type: 'stones', x: 14, z: -6, n: 6 },
    { type: 'stones', x: -14, z: 8, n: 6 },
    { type: 'house', x: 0, z: 28, rot: 0, w: 7, d: 5, h: 3.4, accent: '#8a5a3a' },
    { type: 'cart', x: -7, z: 20, rot: 0.4 },
  ],
  welcome:
    'Welcome to the Terraced Storehouse. Surah Al-Ma’arij speaks of the ways of ascent, and says people are anxious: impatient when hardship comes, and holding back when good comes. But some are steady: in their wealth there is a known share for those who ask and those in need.',
  tasks: [
    {
      id: 'anxious',
      kind: 'read',
      at: [-6, -14],
      marker: 'sign',
      title: 'Created anxious',
      goal: 'Read at the sign on the terraces',
      reading: { title: 'Created anxious', refs: [[70, 19], [70, 20], [70, 21], [70, 22], [70, 23]], note: 'Indeed, people were created anxious: impatient when hardship touches them, and holding back when good touches them, except those who pray, who keep up their prayer constantly.' },
    },
    {
      id: 'ascent',
      kind: 'read',
      requires: ['anxious'],
      at: [4, 2],
      marker: 'tablet',
      title: 'The ways of ascent',
      goal: 'Read at the tablet halfway up the hill',
      adaptation: 'The angels, the Spirit and the Day are never pictured; they are read only.',
      reading: { title: 'The ways of ascent', refs: [[70, 3], [70, 4]], note: 'From Allah, Lord of the ways of ascent. The angels and the Spirit ascend to Him on a Day whose length is fifty thousand years.' },
    },
    {
      id: 'share',
      kind: 'portion',
      requires: ['ascent'],
      at: [3, 23],
      jar: [-3, 24.5],
      part: 10,
      title: 'The known share',
      goal: 'At the storehouse, set aside the known share from each harvest as it comes in',
      intro: 'A harvest has come in at the storehouse door. From every harvest, big or poor, one basket in every ten goes to the share jar.',
      adaptation: 'The farm, its harvests and the one-in-ten share are a game idea to practise a known, fixed share. The share jar is for anyone who asks and anyone in need; no one is shown.',
      harvests: [
        { what: 'A big harvest of barley', n: 50 },
        { what: 'A poor year: the rains came late', n: 20 },
        { what: 'A middling harvest of dates', n: 40 },
        { what: 'A good harvest of wheat', n: 70 },
      ],
      outro: 'Every harvest, big or poor, gave its known share.',
      after: { title: 'A known right', refs: [[70, 24], [70, 25], [70, 32], [70, 33], [70, 34], [70, 35]], note: 'And those in whose wealth is a known right, for the one who asks and the one who is deprived. And those who keep their trusts and promises, who stand firm in their testimony, and who guard their prayer: they will be in gardens, honoured.' },
    },
  ],
  finale: {
    title: 'A known share',
    body: ['In a big year and a poor year alike, you set aside the known share.', 'Surah Al-Ma’arij describes the steady: those whose wealth holds a known right for the one who asks and the one in need.'],
    ref: [70, 24],
    questions: ['Was it harder to give in the poor year? Why?', 'Why might a fixed, known share help people stay steady?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The angels, the Spirit and the Day are read only, never shown.', 'The one-in-ten share is a counting game, not a ruling on zakat.'],
};
