// Surah 15, Al-Hijr: the Carved Valley. A sandstone valley ringed by cliffs,
// with doorways carved into the rock (15:82), each with its own pattern over
// the door. The core play is mapping: take a rubbing of each carving
// (keeping still while it comes through), then fit the rubbings onto a map
// of the valley at the places where they were found. No one is shown, and
// what happened to the people of al-Hijr is read, never pictured. The
// creation of Adam and Iblis (15:26-44) concerns the unseen and is not
// shown or used here.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const face = ([x, z]: P2) => Math.atan2(-x, -z);
const DOORS: P2[] = [[-30, -18], [-8, -35], [20, -31], [35, -5], [-35, 10]];

export const W015: WorldDef = {
  surah: 15,
  name: 'The Carved Valley',
  theme: 'Take rubbings of the carved doorways and map the valley',
  play: 'A mapping world: find the doorways carved in the cliffs, take a rubbing of each pattern by keeping still, then fit every rubbing onto the map where its doorway stands, using the landmarks and your memory.',
  seed: 1515,
  ground: {
    radius: 52,
    base: rolling({ radius: 52, amp: 2.4, seed: 15, rim: 2.2, shapes: [{ x: -24, z: -10, r: 5, h: 1 }] }),
    palette: PAL.desert,
    paths: [curve([[0, 46], [0, 30], [-4, 14], [-12, 0], [-24, -6], [-30, -14]]), curve([[-4, 14], [10, 2], [24, -10], [32, -6]]), curve([[10, 2], [4, -16], [-6, -30]]), curve([[4, -16], [18, -26]]), curve([[-12, 0], [-30, 8]])],
    flats: [{ x: 4, z: 38, r: 2.5 }, { x: 0, z: 18, r: 4, paint: '#e8d4a8' }],
  },
  look: { ...LOOKS.desert, hor: '#f8d8a8', sunI: 3.4 },
  veg: {
    grass: 0.25,
    dryGrass: true,
    flowers: ['#f4e0b0'],
    trees: [{ kind: 'palm', at: [[24, -18], [27, -15], [22, -14]] }],
    rocks: [{ x: 0, z: 0, n: 16, big: 1.6, spread: 40 }],
    pebbles: 60,
    rim: false,
    lush: () => 0.2,
  },
  far: '#d8a878',
  mountains: { color: '#c09070', height: 1.5 },
  start: [0, 44],
  startYaw: Math.PI,
  structures: [
    { type: 'stones', x: -22, z: -8, n: 2 },
    { type: 'well', x: 8, z: -14 },
    { type: 'tent', x: 26, z: 8, rot: -1, color: '#c8a070' },
    { type: 'cart', x: 4, z: 30, rot: 0.3 },
  ],
  welcome:
    'Welcome to the Carved Valley. Long ago, people here carved their houses out of the mountains. Surah Al-Hijr tells about them, and about the signs in the earth and sky. Read the first stone, then explore the cliffs.',
  tasks: [
    {
      id: 'iblis',
      kind: 'read',
      at: [4, 38],
      marker: 'sign',
      title: 'Iblis refuses',
      goal: 'Read at the sign near the way in',
      adaptation: 'Adam, the angels and Iblis are read only; none is shown.',
      reading: { title: 'Iblis refuses', refs: [[15, 28], [15, 29], [15, 30], [15, 31], [15, 32], [15, 33], [15, 34], [15, 35], [15, 36], [15, 37], [15, 38], [15, 39], [15, 40], [15, 41], [15, 42], [15, 43], [15, 44]], note: 'Your Lord said to the angels: I will create a human being from clay. When I have shaped him, fall down in prostration to him. The angels prostrated, all of them, except Iblis, who refused. Allah said: Over My servants you will have no authority, except those who follow you.' },
    },
    {
      id: 'measure',
      kind: 'read',
      at: [3, 36],
      marker: 'tablet',
      title: 'Everything in measure',
      goal: 'Read the first stone',
      reading: {
        title: 'Sent down in a known measure',
        refs: [[15, 19], [15, 21], [15, 22]],
        note: 'Allah spread out the earth, set firm mountains in it, and made everything grow in balance. Nothing is sent down except in a known measure: He sends the winds that carry what makes plants grow, and the rain you drink.',
      },
    },
    {
      id: 'map',
      kind: 'rubbing',
      requires: ['measure'],
      title: 'Map the carved valley',
      goal: 'Take a rubbing at each carved doorway, then fit them onto the map at the table',
      intro: 'Five doorways are carved into the cliffs, each with a different pattern above it. Take a rubbing of each one: stand by the door and keep still while it comes through. Then bring them to the map table and put each where it belongs.',
      adaptation: 'The patterns, the rubbings and the map are game ideas. The doorways are not copies of real carvings.',
      doors: [
        { at: DOORS[0], rot: face(DOORS[0]), pattern: 'diamond', label: 'by the two rocks' },
        { at: DOORS[1], rot: face(DOORS[1]), pattern: 'ring', label: 'at the far end of the valley' },
        { at: DOORS[2], rot: face(DOORS[2]), pattern: 'bars', label: 'past the well' },
        { at: DOORS[3], rot: face(DOORS[3]), pattern: 'steps', label: 'beyond the palms and the tent' },
        { at: DOORS[4], rot: face(DOORS[4]), pattern: 'sun', label: 'on the western side' },
      ],
      table: [0, 18],
      marks: [
        { at: [-22, -8], label: 'two rocks' },
        { at: [8, -14], label: 'well' },
        { at: [25, -16], label: 'palms' },
        { at: [26, 8], label: 'tent' },
        { at: [0, 18], label: 'table' },
      ],
      secs: 3,
      reading: {
        title: 'Houses carved from the mountains',
        refs: [[15, 80], [15, 81], [15, 82], [15, 84]],
        note: 'The people of al-Hijr denied the messengers and turned away from the signs they were given. They carved houses out of the mountains and felt safe in them, but what they had built could not help them.',
      },
      outro: 'Your map of the carved valley is complete.',
    },
    {
      id: 'road',
      kind: 'read',
      requires: ['map'],
      at: [6, 30],
      marker: 'sign',
      title: 'On a road still travelled',
      goal: 'Read the signpost by the road',
      reading: {
        title: 'A sign for those who look',
        refs: [[15, 75], [15, 76], [15, 77]],
        note: 'In that are signs for those who look closely. The ruins stand by a road people still travel, as a sign for those who believe.',
      },
    },
    {
      id: 'guests',
      kind: 'read',
      requires: ['road'],
      at: [3, 41],
      marker: 'lantern',
      title: 'Ibrahim\'s guests',
      goal: 'Read at the lantern by the start',
      reading: { title: 'Good news of a knowing boy', refs: [[15, 51], [15, 52], [15, 53]], note: 'Tell them about the guests of Ibrahim. They came in and said "Peace", and he said: "We are afraid of you." They said: "Do not be afraid; we bring you good news of a boy who will have knowledge." Setting the guest mat for them is played in the world of Surah Hud.' },
    },
  ],
  finale: {
    title: 'Signs for those who look',
    body: [
      'You found every carved doorway, took its rubbing, and put each one on the map where it belongs.',
      'The people who carved these houses felt safe in stone. Al-Hijr asks us to look closely at signs like these, and to remember what truly keeps us safe.',
    ],
    ref: [15, 75],
    questions: ['What did you use to remember where each doorway was?', 'What makes you feel safe, and why?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown, and the people of al-Hijr are not shown.',
    'What happened to them (15:83) is not pictured.',
    'The creation of Adam and Iblis (15:26-44) concerns the unseen; it is not shown in this world.',
    'The carvings and patterns are made for this game, not copies of real ones.',
  ],
};
