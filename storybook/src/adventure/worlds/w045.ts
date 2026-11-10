// Surah 45, Al-Jathiyah (The Kneeling): the Headland Weather Station. A
// grassy headland between the sea, a line of hills, a palm grove and a small
// town, with a weather station on top. The core play: keep the field ledger
// through one day (45:5): at morning, noon and evening, read the wind vane
// and the rain gauge yourself and write what you see. The day moves on after
// each reading: the light changes, the wind turns, the rain comes. Then the
// sea and its ships (45:12-13) and the record that "speaks in truth"
// (45:29) are readings. No one is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W045: WorldDef = {
  surah: 45,
  name: 'The Headland Weather Station',
  theme: 'Read the wind and the rain yourself through one day: signs for people who reason',
  play: 'A weather station stands on the headland. At morning, noon and evening, look at the wind vane and the rain gauge, then write in the field ledger where the wind comes from and how much rain fell. The panel never tells you: you have to look.',
  seed: 4545,
  ground: {
    radius: 50,
    base: rolling({ radius: 50, amp: 1.5, seed: 45, shapes: [{ x: -46, z: -6, r: 22, h: -8 }, { x: 0, z: -6, r: 9, h: 2.5 }, { x: 40, z: -4, r: 12, h: 7 }] }),
    water: -2,
    shore: '#e4d4b0',
    palette: PAL.meadow,
    paths: [curve([[0, 42], [0, 26], [2, 10], [0, -2]]), curve([[0, 10], [-14, 8], [-22, 4]]), curve([[0, -2], [4, -18], [6, -32]])],
    flats: [{ x: 0, z: -6, r: 4 }, { x: 6, z: -36, r: 7, paint: '#e0d0b0' }, { x: -20, z: 6, r: 3 }],
  },
  look: LOOKS.morning,
  veg: {
    grass: 1.1,
    flowers: ['#fff2d8', '#c0d8f0'],
    trees: [{ kind: 'palm', area: { x: 0, z: 30, r: 7 }, count: 7 }, { kind: 'olive', at: [[14, 12], [-10, 20]] }],
    rocks: [{ x: 36, z: -6, n: 5, big: 1.3, spread: 8 }],
    pebbles: 18,
    rim: ['olive', 'palm'],
  },
  far: '#8ab080',
  mountains: { color: '#8a98b0', height: 0.9 },
  start: [0, 44],
  startYaw: Math.PI,
  structures: [
    { type: 'house', x: 2, z: -38, w: 4, d: 4, h: 3, color: '#e8d8b8', rot: 0.2 },
    { type: 'house', x: 10, z: -36, w: 4, d: 3.5, h: 3, color: '#e0d0b0', rot: -0.3 },
    { type: 'dome', x: 6, z: -42, w: 4, d: 4, h: 3.5, color: '#e8dcc4' },
    { type: 'dock', x: -24, z: 2, to: [-31, 0] },
    { type: 'boat', x: -34, z: -2, rot: 1.2 },
  ],
  welcome:
    'Welcome to the Headland Weather Station. Surah Al-Jathiyah says that in the turning of night and day, the rain that gives life to the earth, and the directing of the winds are signs for people who reason. Today you will read those signs yourself.',
  tasks: [
    {
      id: 'signs',
      kind: 'read',
      at: [3, 32],
      marker: 'sign',
      title: 'Signs in the heavens and the earth',
      goal: 'Read at the sign by the palm grove',
      reading: { title: 'Signs for people who reason', refs: [[45, 3], [45, 4], [45, 5]], note: 'In the heavens and the earth are signs for the believers. In your own creation, and in the animals He spreads about, are signs. And in the turning of night and day, the rain Allah sends down to give life to the earth after it was dead, and the directing of the winds, are signs for people who reason.' },
    },
    {
      id: 'ledger',
      kind: 'station',
      requires: ['signs'],
      at: [0, -6],
      title: 'The field ledger',
      goal: 'At the weather station on the headland, read the vane and the gauge, and write the ledger at morning, noon and evening',
      intro: 'The weather station is at the top of the headland. Its vane points into the wind: toward where the wind comes from. Its glass gauge catches the rain. Write the ledger three times today.',
      adaptation: 'The weather station, the ledger and the day’s weather are a game idea based on 45:5. The surah does not describe a station or a particular day.',
      landmarks: [
        { at: [-40, -6], name: 'the sea' },
        { at: [38, -4], name: 'the hills' },
        { at: [0, 30], name: 'the palm grove' },
        { at: [6, -38], name: 'the town' },
      ],
      readings: [
        { time: 'morning', wind: 0, rain: 0 },
        { time: 'noon', wind: 1, rain: 1 },
        { time: 'evening', wind: 2, rain: 2 },
      ],
      outro: 'The ledger is full: three readings, each one from your own eyes.',
      after: { title: 'The rain gives life', refs: [[45, 5]], note: 'The rain Allah sends down from the sky gives life to the earth after it was dead, and He directs the winds: signs for people who reason.' },
    },
    {
      id: 'sea',
      kind: 'read',
      requires: ['ledger'],
      at: [-19, 8],
      marker: 'lantern',
      title: 'The sea and the ships',
      goal: 'Read at the lantern by the jetty',
      reading: { title: 'Made of service to you', refs: [[45, 12], [45, 13]], note: 'It is Allah who made the sea of service to you, so that ships sail on it by His command, and so that you can seek His bounty, and be grateful. He has made all that is in the heavens and the earth of service to you, all from Him. In that are signs for people who think.' },
    },
    {
      id: 'record',
      kind: 'read',
      requires: ['sea'],
      at: [-3, -2],
      marker: 'tablet',
      title: 'A record that speaks the truth',
      goal: 'Read at the tablet beside the station',
      adaptation: 'The Day of Judgement is of the unseen and is not pictured; these ayahs are read only.',
      reading: { title: 'Our record', refs: [[45, 28], [45, 29]], note: 'Every community will be called to its record: "Today you will be repaid for what you used to do. This record of Ours speaks about you with the truth. We had written down whatever you used to do."' },
    },
  ],
  finale: {
    title: 'Signs you read yourself',
    body: ['You read the wind and the rain three times in one day, and wrote down only what you saw.', 'Surah Al-Jathiyah says the turning of night and day, the rain and the winds are signs for people who reason.'],
    ref: [45, 5],
    questions: ['How did the wind change through the day?', 'What signs can you see from your own window?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Day of Judgement (45:27-35) is read only and never pictured.'],
};
