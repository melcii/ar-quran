// Surah 66, At-Tahrim (The Prohibition): the Garden of Footprints. A
// village garden in the morning, with flower beds, a water jar by the path,
// a gate and a fence. You ran through it in a hurry earlier, and your muddy
// footprints are still there. The core play: follow them back and put
// right everything you spoiled on the way (66:8, "repent to Allah with
// sincere repentance"). Repentance is between a person and Allah; putting
// right what you spoiled is one part of turning back sincerely. Two
// plaques read the surah's examples (66:10-12); no one in them is shown.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const TRAIL: P2[] = [[2, 30], [-6, 22], [-10, 12], [-4, 4], [6, 0], [12, -8], [6, -16], [-4, -20]];

export const W066: WorldDef = {
  surah: 66,
  name: 'The Garden of Footprints',
  theme: 'Follow your own footprints back and put right what you spoiled',
  play: 'You ran through the village garden in a hurry this morning, and your muddy footprints are still there. Follow them back, and wherever you spoiled something on the way, stop and put it right. Two plaques at the far end read the surah’s examples.',
  seed: 6666,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 1, seed: 66 }),
    palette: PAL.meadow,
    paths: [curve([[0, 36], [2, 30]]), curve([[-4, -20], [-8, -26]])],
    flats: [{ x: -8, z: -26, r: 4 }],
  },
  look: LOOKS.morning,
  veg: {
    grass: 1,
    flowers: ['#e88a9a', '#f4d060', '#c8a0e0', '#fff2d8'],
    trees: [{ kind: 'blossom', area: { x: 0, z: 0, r: 28 }, count: 7 }, { kind: 'cypress', at: [[-14, -26], [-2, -28]] }],
    rocks: [{ x: 22, z: 20, n: 4, big: 1, spread: 5 }],
    pebbles: 16,
    rim: ['blossom', 'oak'],
  },
  far: '#8aa25a',
  mountains: { color: '#a0a0b8', height: 0.7 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    { type: 'house', x: 14, z: 26, rot: -Math.PI / 2, w: 5, d: 4.4, h: 3, accent: '#5a7a4a' },
    { type: 'house', x: -18, z: 4, rot: Math.PI / 2, w: 5, d: 4.4, h: 3, accent: '#a04a3a' },
  ],
  welcome:
    'Welcome to the Garden of Footprints. In your hurry this morning you ran right through the village garden. Look at the ground: your muddy footprints are still there. Surah At-Tahrim calls the believers to turn back to Allah sincerely.',
  tasks: [
    {
      id: 'turn',
      kind: 'amends',
      title: 'Turning back sincerely',
      goal: 'Follow your muddy footprints through the garden and put right everything you spoiled',
      intro: 'Follow the footprints. Wherever you trampled, knocked over or left something open, stop and put it right.',
      adaptation: 'The garden and the things spoiled are a game idea. Repentance is between a person and Allah; putting right what you spoiled for others is one part of it.',
      trail: TRAIL,
      harms: [
        { at: [-7, 19], what: 'a trampled flower bed', fix: 'You lift the flowers gently and press the soil firm around them.' },
        { at: [-8, 8], what: 'a knocked-over water jar', fix: 'You stand the jar up and fill it again from the well.' },
        { at: [9, -3], what: 'a gate left swinging open', fix: 'You close the gate and latch it, so the goats stay out of the beds.' },
        { at: [10, -13], what: 'a broken fence rail', fix: 'You fit the rail back into the posts and tie it fast.' },
      ],
      outro: 'Every step of the trail is put right.',
      after: { title: 'Sincere turning back', refs: [[66, 8]], note: 'O you who believe, turn back to Allah with sincere repentance. Perhaps your Lord will wipe away your misdeeds. Their light will go ahead of them, and they will say: "Our Lord, complete our light for us, and forgive us. You are able to do anything."' },
    },
    {
      id: 'good',
      kind: 'read',
      requires: ['turn'],
      at: [-5, -24],
      marker: 'tablet',
      title: 'Two good examples',
      goal: 'Read at the first plaque at the end of the garden',
      adaptation: 'The wife of Pharaoh and Maryam are never shown; these ayahs are read only.',
      reading: { title: 'Two good examples', refs: [[66, 11], [66, 12]], note: 'Allah gives an example for those who believe: the wife of Pharaoh, who prayed, "My Lord, build me a house near You in Paradise, and save me from Pharaoh and his deeds." And Maryam, daughter of ‘Imran, who kept herself pure and believed in the words of her Lord and His books, and was one of the devout.' },
    },
    {
      id: 'near',
      kind: 'read',
      requires: ['good'],
      at: [-11, -24],
      marker: 'tablet',
      title: 'Being close is not enough',
      goal: 'Read at the second plaque',
      adaptation: 'No one in this ayah is shown; it is read only.',
      reading: { title: 'Being close is not enough', refs: [[66, 10]], note: 'Allah gives an example of two women who were married to two of His righteous servants, Nuh and Lut, but betrayed them. Those two prophets could not help them at all against Allah.' },
    },
  ],
  finale: {
    title: 'Put right',
    body: ['You followed your own footprints back and put right each thing you had spoiled: the flowers, the jar, the gate and the fence.', 'Surah At-Tahrim calls the believers to turn back to Allah sincerely, and shows that each person answers for their own choices.'],
    ref: [66, 8],
    questions: ['How did it feel to put things right?', 'Is there something you could put right today?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet, his household, Nuh, Lut, the wife of Pharaoh and Maryam are never shown.', 'The Fire and the angels of 66:6 are not shown or read in play.'],
};
