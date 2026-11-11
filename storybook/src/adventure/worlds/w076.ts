// Surah 76, Al-Insan (Man): the Hill Town Doorsteps. A small hill town at
// evening, with a pantry table in the square and three doors along the
// lanes: a poor family's, an orphan's house, and the hatch of the prison
// yard. "They give food, in spite of love for it, to the needy, the orphan
// and the captive: 'We feed you only for the face of Allah; we want from
// you neither reward nor thanks'" (76:8-9). The core play: pack each parcel
// with what that house asked for, giving from what you love, leave it on
// the step, knock, and slip away before the door opens. No one behind the
// doors is shown. The drink and gardens of 76:5-6 are read only.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W076: WorldDef = {
  surah: 76,
  name: 'The Hill Town Doorsteps',
  theme: 'Give food in secret, slipping away before anyone can thank you',
  play: 'In a hill town at evening, a pantry table in the square holds the day’s food, your own favourite honey cakes among it. Three houses have asked for something. Pack each parcel, give from what you love, leave it on the doorstep, knock, and slip away before the door opens, so that no one thanks you.',
  seed: 7676,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 1, seed: 76, tilt: [0.03, 0.02] }),
    palette: PAL.autumn,
    paths: [curve([[0, -36], [2, -24], [0, -10], [0, 0]]), curve([[0, 0], [-10, 6], [-16, 14]]), curve([[0, 0], [12, 4], [18, 10]])],
    flats: [{ x: 0, z: 0, r: 7, paint: '#d0bc98' }, { x: 2, z: -24, r: 3 }, { x: -16, z: 14, r: 4 }, { x: 18, z: 10, r: 4 }, { x: 0, z: 16, r: 4 }],
  },
  look: { ...LOOKS.dusk, sunI: 2.6 },
  veg: {
    grass: 0.7,
    flowers: ['#e8a060', '#fff2d8'],
    trees: [{ kind: 'olive', area: { x: 0, z: -26, r: 12 }, count: 5 }, { kind: 'cypress', at: [[-6, 8], [6, 8]] }],
    rocks: [],
    pebbles: 14,
    rim: ['olive', 'cypress'],
  },
  far: '#a08a6a',
  mountains: { color: '#8a8aa8', height: 0.8 },
  start: [0, -36],
  startYaw: 0,
  structures: [
    { type: 'house', x: -16, z: 20, rot: Math.PI, w: 5, d: 4.4, h: 3.2, accent: '#5a6a8a' },
    { type: 'house', x: 18, z: 16, rot: Math.PI, w: 5, d: 4.4, h: 3.2, accent: '#8a5a3a' },
    { type: 'wall', x: -4, z: 20, to: [4, 20], h: 3.2, color: '#a89c88' },
    { type: 'well', x: 3, z: -3 },
    { type: 'festoon', x: -5, z: 4, to: [5, 4], h: 3.4 },
  ],
  welcome:
    'Welcome to the Hill Town Doorsteps. Surah Al-Insan tells of people who give food, even food they love, to the needy, the orphan and the captive, saying: “We feed you only for the sake of Allah. We want from you no reward and no thanks.”',
  tasks: [
    {
      id: 'way',
      kind: 'read',
      at: [2, -24],
      marker: 'sign',
      title: 'Shown the way',
      goal: 'Read at the sign on the lane up to the town',
      reading: { title: 'Shown the way', refs: [[76, 1], [76, 2], [76, 3]], note: 'Was there not a time when a person was nothing worth mentioning? We created people from a mixed drop to test them, and gave them hearing and sight. We showed them the way, whether they are thankful or ungrateful.' },
    },
    {
      id: 'give',
      kind: 'doorstep',
      requires: ['way'],
      pantry: [-2.5, 1.5],
      foods: ['fresh bread', 'stale bread', 'a jug of milk', 'your favourite honey cakes', 'bruised old figs', 'a pot of lentil stew'],
      doors: [
        { at: [-16, 16.9], who: 'the poor family', wants: 'lentil stew' },
        { at: [18, 12.9], who: 'the orphan’s house', wants: 'honey cakes' },
        { at: [0, 18.8], who: 'the hatch of the prison yard', wants: 'fresh bread' },
      ],
      away: 7,
      secs: 4,
      title: 'Wanting no thanks',
      goal: 'Pack a parcel at the pantry table, leave it on the doorstep, knock, and slip away before the door opens',
      intro: 'Each house has asked for something. Pack it, leave it on the step and knock, then step well away before the door opens.',
      adaptation: 'The town, its doors and the food are a game idea. The needy, the orphan and the captive are named in the ayah; no one behind the doors is shown.',
      outro: 'Three parcels given, and no one to thank you.',
      after: { title: 'For the sake of Allah', refs: [[76, 7], [76, 8], [76, 9]], note: 'They keep their vows and fear a Day whose evil spreads far. And they give food, though they love it, to the needy, the orphan and the captive: “We feed you only for the sake of Allah. We want from you no reward and no thanks.”' },
    },
    {
      id: 'evening',
      kind: 'read',
      requires: ['give'],
      at: [0, -12],
      marker: 'tablet',
      title: 'Morning and evening',
      goal: 'Read at the tablet on the way back down',
      adaptation: 'The Prophet, who is addressed here, is never shown; the ayahs are read only.',
      reading: { title: 'Morning and evening', refs: [[76, 25], [76, 26]], note: 'And remember the name of your Lord morning and evening, and in the night bow down to Him, and glorify Him through the long night.' },
    },
  ],
  finale: {
    title: 'No thanks wanted',
    body: ['You gave stew, honey cakes and fresh bread, and slipped away each time before anyone could thank you.', 'Surah Al-Insan praises those who give food they love, wanting no reward and no thanks.'],
    ref: [76, 9],
    questions: ['Why did it matter that you gave the honey cakes, not the bruised figs?', 'How does it feel to give when no one knows?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The people behind the doors are never shown.', 'The drink, spring and gardens of 76:5-6 and 76:12-22 are not shown.'],
};
