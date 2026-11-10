// Surah 44, Ad-Dukhan (The Smoke): the Valley Left Behind. A quiet green
// valley at dawn, with empty gardens, springs, fields, fine buildings and
// shaded resting places, and no one in it. The core play: a survey. Walk the
// valley and count everything that was left behind (44:25-27, "How much they
// left behind of gardens and springs, and crops and noble sites, and comfort
// wherein they were amused"), then write it in the ledger. The leaving of
// Egypt (44:17-24) is a reading by the shore; nothing of the drowning is
// shown, and the smoke (44:10) is not pictured. No one is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W044: WorldDef = {
  surah: 44,
  name: 'The Valley Left Behind',
  theme: 'Survey what a proud people left behind, and see that only what is with Allah lasts',
  play: 'An empty valley at dawn. Walk through it and count every garden, spring, field, fine building and place of ease that was left behind (a small flag marks each one you count). Then write in the ledger how many of each you found.',
  seed: 4444,
  ground: {
    radius: 52,
    base: rolling({ radius: 52, amp: 1.6, seed: 44, shapes: [{ x: 0, z: -46, r: 16, h: -6 }] }),
    palette: PAL.coast,
    water: -2.2,
    shore: '#e8dcb8',
    paths: [curve([[0, 44], [0, 26], [-4, 10], [0, -6], [0, -26]]), curve([[-4, 10], [-22, 8], [-30, 0]]), curve([[0, -6], [20, -4], [30, 6]])],
    flats: [{ x: 2, z: 4, r: 4, paint: '#e8dcc4' }, { x: -22, z: 22, r: 5 }, { x: 22, z: -18, r: 5 }, { x: -26, z: -16, r: 4 }, { x: 26, z: 20, r: 4 }],
  },
  look: { ...LOOKS.morning, sunI: 2.6, birds: true },
  veg: {
    grass: 1.1,
    flowers: ['#fff2d8', '#e8c0e0', '#f0d080'],
    trees: [{ kind: 'palm', at: [[-10, 34], [10, 30], [-14, -4], [14, 2]] }],
    rocks: [{ x: 34, z: -30, n: 4, big: 1, spread: 6 }],
    pebbles: 16,
    rim: ['palm', 'fig'],
  },
  far: '#8ab070',
  mountains: { color: '#a8a0b8', height: 0.8 },
  start: [0, 44],
  startYaw: Math.PI,
  structures: [{ type: 'dock', x: 4, z: -30, rot: Math.PI }],
  welcome:
    'Welcome to the Valley Left Behind. Surah Ad-Dukhan tells of a proud people who left everything behind: gardens and springs, fields and fine places. Walk quietly through the empty valley and count what was left.',
  tasks: [
    {
      id: 'night',
      kind: 'read',
      at: [3, 36],
      marker: 'sign',
      title: 'A blessed night',
      goal: 'Read at the sign at the head of the valley',
      reading: { title: 'Sent down on a blessed night', refs: [[44, 2], [44, 3], [44, 6]], note: 'By the clear Book: We sent it down on a blessed night, as a mercy from your Lord. He is the All-Hearing, the All-Knowing.' },
    },
    {
      id: 'leave',
      kind: 'read',
      requires: ['night'],
      at: [-3, -22],
      marker: 'tablet',
      title: 'Leaving by night',
      goal: 'Read at the tablet by the shore',
      adaptation: 'Musa, the Children of Israel and Pharaoh are not shown. The sea is only a quiet shore here; nothing of the crossing or the drowning is pictured.',
      reading: {
        title: 'Set out by night',
        refs: [[44, 17], [44, 18], [44, 23], [44, 24]],
        note: 'Before them, Pharaoh’s people were tested: a noble messenger came to them and said, "Hand over to me the servants of Allah; I am a trustworthy messenger to you." He was told: "Set out with My servants by night; you will be followed. And leave the sea as it is, still."',
      },
    },
    {
      id: 'count',
      kind: 'survey',
      requires: ['leave'],
      ledger: [2, 6],
      title: 'What they left behind',
      goal: 'Count every garden, spring, field, fine building and place of ease in the valley, then write the ledger by the path',
      intro: 'Everything here was left behind. Walk through the valley and count: gardens, springs, fields, fine buildings, places of ease. Then write it all in the ledger.',
      adaptation: 'The survey and the ledger are a game idea based on 44:25-27. The valley’s look is not described in the Quran.',
      cats: [
        { name: 'Gardens', shape: 'garden' },
        { name: 'Springs', shape: 'spring' },
        { name: 'Fields of crops', shape: 'crop' },
        { name: 'Fine buildings', shape: 'site' },
        { name: 'Places of ease', shape: 'comfort' },
      ],
      things: [
        { at: [-22, 24], cat: 0 },
        { at: [24, 22], cat: 0 },
        { at: [-30, -6], cat: 0 },
        { at: [-12, 16], cat: 1 },
        { at: [16, -10], cat: 1 },
        { at: [-24, 8], cat: 2 },
        { at: [30, 0], cat: 2 },
        { at: [-14, -14], cat: 2 },
        { at: [22, -20], cat: 3 },
        { at: [-26, -18], cat: 3 },
        { at: [12, 14], cat: 4 },
        { at: [-8, -6], cat: 4 },
      ],
      outro: 'The ledger is full: gardens, springs, fields, fine buildings, places of ease. All of it was left behind.',
      after: { title: 'Left behind', refs: [[44, 25], [44, 26], [44, 27], [44, 28]], note: 'How many gardens and springs they left behind, and fields of crops and fine places, and comforts they used to enjoy! So it was. And We gave it all to another people.' },
    },
    {
      id: 'saved',
      kind: 'read',
      requires: ['count'],
      at: [-6, 2],
      marker: 'lantern',
      title: 'Saved',
      goal: 'Read at the lantern by the ledger',
      reading: { title: 'Saved from Pharaoh', refs: [[44, 30], [44, 31]], note: 'And We saved the Children of Israel from the humiliating suffering, from Pharaoh: he was proud, one of those who went too far.' },
    },
    {
      id: 'truth',
      kind: 'read',
      requires: ['saved'],
      at: [6, 22],
      marker: 'sign',
      title: 'Not created in play',
      goal: 'Read at the sign on the way back up the valley',
      reading: { title: 'Created in truth', refs: [[44, 38], [44, 39]], note: 'We did not create the heavens and the earth and all that is between them in play. We created them only in truth, but most people do not know.' },
    },
  ],
  finale: {
    title: 'What lasts',
    body: ['You counted gardens, springs, fields, fine buildings and places of ease, all left behind by a proud people.', 'Surah Ad-Dukhan says it was all given to others: only what is with Allah lasts.'],
    ref: [44, 25],
    questions: ['How did it feel to walk through an empty valley?', 'What do you have that you want to use well while you have it?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Musa, the Children of Israel and Pharaoh are never shown; the drowning (44:24) is read only, never shown.', 'The smoke (44:10-16) is not pictured.'],
};
