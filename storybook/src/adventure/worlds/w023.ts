// Surah 23, Al-Mu'minun: the Home of Good Character. Four open rooms round a
// courtyard, dim at first. The core play is one day in the home, keeping
// what comes due at its own time while you are busy with other things: a
// neighbour's parcel kept safe and handed back when they knock, a promise to
// water the plant when the bell rings, the prayer corner ready by the chime,
// and something given from the jar (23:1-11). Each room comes alive when its
// quality is kept. Nuh's ark is not played again here: it belongs to Surah
// Hud, and this world reads 23:27 and links to it.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W023: WorldDef = {
  surah: 23,
  name: 'The Home of Good Character',
  theme: 'Keep each thing in its time through one day at home',
  play: 'A day clock runs in a home of four rooms. Things come due at their own times: hand back a kept parcel when the neighbour knocks, water the plant when the bell rings, have the prayer corner ready by the chime, and give from the jar. Miss a time and it comes round again.',
  seed: 2323,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 1, seed: 23 }),
    palette: PAL.meadow,
    paths: [curve([[0, 30], [0, 14], [0, 0]])],
    flats: [{ x: 0, z: 1, r: 16, paint: '#d8c8a4' }],
  },
  look: { ...LOOKS.morning, sunI: 3 },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#f4c0d0', '#f4d060'],
    trees: [{ kind: 'fig', at: [[0, 2]] }, { kind: 'olive', area: { x: 0, z: 24, r: 10 }, count: 3 }, { kind: 'cypress', at: [[-18, -12], [18, -12]] }],
    rocks: [],
    pebbles: 10,
    rim: ['olive', 'oak'],
  },
  far: '#7a9a5a',
  mountains: { color: '#8a94b0', height: 0.8 },
  start: [0, 26],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Home of Good Character. Surah Al-Mu\'minun begins by describing the believers: how they pray, how they keep trusts and promises, and how they give. In this home, things will come due through the day. Keep each one in its time, and watch the rooms come alive.',
  links: [{ at: [16, 18], label: 'Play the Ark', href: '/ark', note: 'The ark game lives in Surah Hud (11:37-44)' }],
  tasks: [
    {
      id: 'believers',
      kind: 'read',
      at: [3, 16],
      marker: 'sign',
      title: 'The believers',
      goal: 'Read at the sign by the gate',
      reading: {
        title: 'The believers have succeeded',
        refs: [[23, 1], [23, 2], [23, 3], [23, 4]],
        note: 'The believers have succeeded: those who are humble in their prayer, who turn away from idle and harmful talk, and who give zakah.',
      },
    },
    {
      id: 'day',
      kind: 'home',
      requires: ['believers'],
      title: 'A day at home',
      goal: 'Keep each thing in its time: the parcel, the promise, the prayer corner and the giving',
      intro: 'The day has begun. A neighbour has left a parcel at the door for you to keep safe. You promised to water the window plant when the bell rings. The prayer corner must be clear by the chime. And there is the giving jar. Watch the clock on your status line.',
      adaptation: 'The day, the parcel, the bell, the chime and the giving jar are examples written for this app. The neighbour and the family are not shown; the door, the knock and the bell stand for them. Giving from the jar stands for zakah in a simple way; how zakah is worked out is for teachers.',
      rooms: [
        { label: 'the hall', at: [-8, -6], act: 'trust', door: [-10, -3.2], shelf: [-6, -8.2], knock: 14, done: 'The parcel went back just as it was given.', reading: { title: 'Trusts kept', refs: [[23, 8]], note: 'The believers look after what is trusted to them and keep their promises.' } },
        { label: 'the prayer corner', at: [8, -6], act: 'prayer', toys: [[7, -5], [9.2, -6.8], [8.4, -4.4]], box: [10.6, -8.2], chime: 20, again: 25, done: 'The chime came, and the prayer corner was clear and ready.', reading: { title: 'Prayer kept with care', refs: [[23, 2], [23, 9]], note: 'The believers are humble in their prayer, and they guard their prayers with care.' } },
        { label: 'the window room', at: [-8, 8], act: 'promise', plant: [-9, 5.6], tap: [-5.6, 10], bell: 45, window: 25, again: 30, done: 'The bell rang, and the promise was kept: the plant is watered.', reading: { title: 'Promises kept', refs: [[23, 8]], note: 'They are careful with their trusts and with their promises: a promise is kept at the time it was made for.' } },
        { label: 'the store room', at: [8, 8], act: 'give', jar: [7, 6], box: [10.2, 9.6], n: 1, done: 'Something given from what you have.', reading: { title: 'Giving', refs: [[23, 4]], note: 'The believers give zakah: a share of what they have, for those in need.' } },
      ],
      reading: {
        title: 'The inheritors',
        refs: [[23, 10], [23, 11]],
        note: 'Those are the ones who will inherit Paradise, al-Firdaws, and stay in it for ever.',
      },
      outro: 'Every room is bright: the trust, the promise, the prayer and the giving, each kept in its time.',
    },
    {
      id: 'created',
      kind: 'read',
      requires: ['day'],
      at: [-12, 18],
      marker: 'lantern',
      title: 'Created in stages',
      goal: 'Read at the lantern on the west lawn',
      reading: {
        title: 'The best of creators',
        refs: [[23, 12], [23, 13], [23, 14]],
        note: 'Allah created the human being from clay, and then in stages, one after another, and then brought it forth as another creation. So blessed is Allah, the best of creators.',
      },
    },
    {
      id: 'ark',
      kind: 'read',
      requires: ['created'],
      at: [13, 18],
      marker: 'sign',
      title: 'The ship',
      goal: 'Read at the sign by the door to the Ark',
      reading: {
        title: 'Build the ship',
        refs: [[23, 27]],
        note: 'Nuh was told to build the ship under Allah\'s watch and guidance, and when the command came, to take on board two of every kind, and his family. The ark game is in Surah Hud.',
      },
      adaptation: 'Nuh is not shown. The ark is played in Surah Hud (11:37-44); this world only reads 23:27 and links there.',
    },
    {
      id: 'shelter',
      kind: 'read',
      requires: ['ark'],
      at: [0, 22],
      marker: 'lantern',
      title: 'A sign and a shelter',
      goal: 'Read at the lantern by the path',
      reading: {
        title: 'High ground with flowing water',
        refs: [[23, 50]],
        note: 'Allah made the son of Maryam and his mother a sign, and gave them shelter on high ground, a quiet place with flowing water.',
      },
      adaptation: 'Maryam and Isa are not shown.',
    },
  ],
  finale: {
    title: 'Faith that shows in actions',
    body: ['You kept a trust, a promise, the prayer time and the giving, each at its time, and the whole home came alive.', 'Surah Al-Mu\'minun teaches that faith is not only what we say: it changes how we act, all through the day.'],
    ref: [23, 96],
    questions: ['Which was hardest to keep in its time, and why?', 'What is one promise you can keep this week?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown: Nuh, Musa, Harun and Isa never appear, and Maryam is not shown.',
    'The ark is not played again here; it belongs to Surah Hud. 23:27 is read only.',
    '23:5-7 is left to the whole-surah reading, as fits the age of the players.',
    'The day at home is an example written for this app.',
  ],
};
