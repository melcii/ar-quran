// Surah 29, Al-Ankabut: the Shelter Test. A sunny test yard with a lamp on
// a stand, under a shelter woven like a spider's web. The core play: test it
// against wind and rain, see why a web is no shelter, then rebuild the roof
// and walls from reeds and mud bricks until the lamp stays lit (29:41). The
// game does not claim a web is the weakest thing in every way: it is strong
// for its weight, but gives no shelter.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W029: WorldDef = {
  surah: 29,
  name: 'The Shelter Test',
  theme: 'Test a web shelter in wind and rain, then build one that keeps the lamp lit',
  play: 'A lamp burns under a shelter woven like a web. Start the wind and rain test and watch it fail; then rebuild the roof and walls from reeds and mud bricks, testing each time, until the lamp stays lit through the storm.',
  seed: 2929,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 1.2, seed: 29 }),
    palette: PAL.meadow,
    paths: [curve([[0, 28], [0, 6]])],
    flats: [{ x: 4, z: 18, r: 2.5 }, { x: 0, z: -2, r: 10, paint: '#d8c8a4' }],
  },
  look: { ...LOOKS.morning, sunI: 3 },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#c8d8ff'],
    trees: [{ kind: 'oak', area: { x: 0, z: 10, r: 30 }, count: 6 }],
    rocks: [],
    pebbles: 20,
    rim: ['oak'],
  },
  far: '#7a9a5a',
  mountains: { color: '#8a94b0', height: 0.9 },
  start: [0, 24],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Shelter Test. Surah Al-Ankabut, the Spider, gives the example of the spider\'s house. On the test stand ahead, a lamp burns under a shelter woven like a web. Will it keep the lamp lit in wind and rain?',
  tasks: [
    {
      id: 'fire',
      kind: 'read',
      at: [4, 18],
      marker: 'sign',
      title: 'Ibrahim and the fire',
      goal: 'Read at the sign near the way in',
      adaptation: 'Ibrahim, his people and the fire are read only; none is shown.',
      reading: { title: 'Ibrahim and the fire', refs: [[29, 16], [29, 17], [29, 18], [29, 19], [29, 20], [29, 21], [29, 22], [29, 23], [29, 24], [29, 25], [29, 26], [29, 27]], note: 'Ibrahim said to his people: Worship Allah and fear Him; that is best for you if you only knew. The only answer of his people was: Kill him or burn him. But Allah saved him from the fire. Indeed in that are signs for people who believe.' },
    },
    {
      id: 'tried',
      kind: 'read',
      at: [3, 18],
      marker: 'sign',
      title: 'Tested',
      goal: 'Read at the sign on the path',
      reading: { title: 'Will they not be tested?', refs: [[29, 2], [29, 3]], note: 'Do people think they will be left to say "We believe" and not be tested? Those before them were tested too, and Allah makes clear who is truthful.' },
    },
    {
      id: 'shelter',
      kind: 'shelter',
      requires: ['tried'],
      title: 'Shelter for the lamp',
      goal: 'Test the web shelter, then rebuild it until the lamp stays lit through the storm',
      intro: 'Pull the lever to start the wind and rain test. Watch the lamp. Then use the reed and mud-brick panels to rebuild the roof and the walls, and test again.',
      adaptation: 'The test stand, the storm and the panels are game ideas. A spider\'s silk is very strong for its weight; the point here is only that a web gives no shelter from wind and rain. The verse itself is about relying on anything other than Allah.',
      stand: [0, -4],
      piles: [{ at: [-7, 0], mat: 'reed' }, { at: [7, 0], mat: 'brick' }],
      secs: 6,
      web: { title: 'The house of the spider', refs: [[29, 41]], note: 'Those who rely on protectors other than Allah are like the spider that makes itself a house; and the frailest of houses is the house of the spider, if only they knew.' },
      reading: { title: 'Examples for those who know', refs: [[29, 43]], note: 'Allah gives these examples to people, but only those with knowledge understand them.' },
      outro: 'The lamp stayed lit through the whole storm.',
    },
    {
      id: 'prayer',
      kind: 'read',
      requires: ['shelter'],
      at: [-10, 12],
      marker: 'lantern',
      title: 'Prayer',
      goal: 'Read at the lantern on the west side',
      reading: { title: 'Prayer keeps from wrong', refs: [[29, 45]], note: 'Recite the Book and keep up the prayer: prayer keeps a person from shameful and wrong things, and remembering Allah is greater still.' },
    },
    {
      id: 'strive',
      kind: 'read',
      requires: ['prayer'],
      at: [10, 12],
      marker: 'sign',
      title: 'Those who strive',
      goal: 'Read at the sign on the east side',
      reading: { title: 'Guided to His ways', refs: [[29, 69]], note: 'Those who strive for Allah, He will guide to His ways. And Allah is with those who do good.' },
    },
    {
      id: 'nuh',
      kind: 'read',
      requires: ['strive'],
      at: [3, 21],
      marker: 'tablet',
      title: 'A thousand years less fifty',
      goal: 'Read the stone by the start',
      reading: { title: 'Nuh stayed among them', refs: [[29, 14], [29, 15]], note: 'Nuh stayed among his people a thousand years less fifty, calling them. Allah saved him and those in the ship, and made it a sign for the worlds. The Ark is played in the world of Surah Hud.' },
    },
  ],
  finale: {
    title: 'A true shelter',
    body: ['You saw the web shelter fail in the wind and rain, and built one that kept the lamp lit.', 'Surah Al-Ankabut uses the spider\'s house as an example: what looks like a home can give no real shelter.'],
    ref: [29, 41],
    questions: ['What did the web do well, and what could it not do?', 'What makes something a real shelter for you?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The web is not shown as the weakest thing in every way; only as a house that gives no shelter.', 'Nuh, Ibrahim and Lut (29:14-35) are left to the whole-surah reading.'],
};
