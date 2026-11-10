// Surah 64, At-Taghabun (Mutual Loss and Gain): the Long Walk. A cottage in
// a valley, and a path that climbs over the hills to a far village where a
// family waits for your visit. The core play: pack a small bag before you
// set off. On the table are useful things and shining things, and the bag
// cannot hold them all. On the way you will be thirsty after the climb,
// hungry at noon and cold on the high pass, and at the end you arrive as a
// guest. What you chose decides whether you can meet each need (64:15-16,
// "Your wealth and your children are only a test ... be mindful of Allah as
// much as you are able ... and spend; that is better for yourselves").
// The walk and the bag are a game idea; no one is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W064: WorldDef = {
  surah: 64,
  name: 'The Long Walk',
  theme: 'Pack a small bag wisely for a long walk over the hills',
  play: 'You are walking over the hills to visit a family, and your bag is small. Choose what to pack from useful things and shining things, then set off. On the way you will be thirsty, hungry and cold, and at the end you arrive as a guest. If you packed the wrong things, walk back and pack again.',
  seed: 6464,
  ground: {
    radius: 54,
    base: rolling({ radius: 54, amp: 2, seed: 64, shapes: [{ x: 0, z: 0, r: 26, h: 7 }, { x: -24, z: -20, r: 14, h: 5 }, { x: 26, z: 18, r: 12, h: 4 }] }),
    palette: PAL.meadow,
    paths: [curve([[-30, 40], [-22, 28], [-14, 18], [-6, 8], [2, -2], [10, -14], [20, -26], [30, -36]])],
    flats: [{ x: -30, z: 40, r: 5 }, { x: -14, z: 18, r: 3 }, { x: 2, z: -2, r: 3 }, { x: 20, z: -26, r: 3 }, { x: 32, z: -38, r: 5 }],
  },
  look: LOOKS.morning,
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#c8a0e0', '#f4d060'],
    trees: [{ kind: 'pine', area: { x: 0, z: 0, r: 30 }, count: 10 }, { kind: 'oak', area: { x: -30, z: 34, r: 10 }, count: 3 }, { kind: 'olive', area: { x: 32, z: -34, r: 10 }, count: 3 }],
    rocks: [{ x: 6, z: 6, n: 6, big: 1.3, spread: 10 }],
    pebbles: 30,
    rim: ['pine', 'oak'],
  },
  far: '#7a9a5a',
  mountains: { color: '#8a90a8', height: 1.1 },
  start: [-32, 44],
  startYaw: Math.PI * 0.8,
  structures: [
    { type: 'house', x: -36, z: 36, rot: Math.PI / 4, w: 5, d: 4.4, h: 3, accent: '#5a7a4a' },
    { type: 'house', x: 36, z: -42, rot: -Math.PI * 0.75, w: 6, d: 5, h: 3.2, accent: '#a04a3a' },
    { type: 'house', x: 40, z: -32, rot: -Math.PI * 0.7, w: 5, d: 4.4, h: 3, accent: '#3f6f9a' },
  ],
  welcome:
    'Welcome to the Long Walk. Surah At-Taghabun names the Day of loss and gain, when it will be clear what really mattered. Today you are walking over the hills to visit a family. Pack well.',
  tasks: [
    {
      id: 'knows',
      kind: 'read',
      at: [-27, 40],
      marker: 'sign',
      title: 'He knows what you hide',
      goal: 'Read at the sign by your door',
      reading: { title: 'He knows', refs: [[64, 1], [64, 4]], note: 'Everything in the heavens and on earth glorifies Allah. His is the kingdom and His is the praise, and He is able to do anything. He knows what is in the heavens and the earth, and He knows what you hide and what you show, and what is in your hearts.' },
    },
    {
      id: 'walk',
      kind: 'pack',
      requires: ['knows'],
      at: [-29, 36],
      title: 'What is worth carrying',
      goal: 'Pack your bag at the table by the door, then walk the path over the hills to the far village',
      intro: 'The bag holds only 8 spaces. Some things are useful on a long walk; some only shine. Choose, set off, and see whether you chose well.',
      adaptation: 'The walk, the bag and its contents are a game idea based on 64:15-16. No one is shown.',
      room: 8,
      items: [
        { name: 'water skin', size: 2, use: 0 },
        { name: 'gold bangles', size: 3 },
        { name: 'bread and cheese', size: 2, use: 1 },
        { name: 'silver mirror', size: 2 },
        { name: 'warm cloak', size: 3, use: 2 },
        { name: 'jar of honey for the family', size: 1, use: 3 },
        { name: 'carved box', size: 2 },
      ],
      stops: [
        { at: [-14, 18], need: 'The climb is steep and you are thirsty.', ok: 'You drink from the water skin and go on, refreshed.' },
        { at: [2, -2], need: 'It is noon at the top of the hill, and you are hungry.', ok: 'You sit on a rock and eat your bread and cheese.' },
        { at: [20, -26], need: 'The wind on the high pass is cold.', ok: 'You wrap yourself in the warm cloak and walk on.' },
        { at: [32, -38], need: 'You arrive at the family’s door as a guest.', ok: 'You give them the jar of honey, and they welcome you in.' },
      ],
      outro: 'You arrived warm, fed and with a gift, because you packed what was useful, not what shone.',
      after: { title: 'Only a test', refs: [[64, 15], [64, 16]], note: 'Your wealth and your children are only a test, and with Allah is a great reward. So be mindful of Allah as much as you can, listen and obey, and spend: that is better for you. Whoever is saved from the greed of their own soul, they are the successful.' },
    },
    {
      id: 'loan',
      kind: 'read',
      requires: ['walk'],
      at: [29, -34],
      marker: 'tablet',
      title: 'A good loan',
      goal: 'Read at the tablet in the far village',
      reading: { title: 'A good loan', refs: [[64, 17]], note: 'If you lend Allah a good loan, He will multiply it for you and forgive you. Allah is Most Thankful and Most Patient.' },
    },
  ],
  finale: {
    title: 'What was worth carrying',
    body: ['You packed a small bag for a long walk, and on the way you found out what was useful: water, bread, a cloak and a gift. The gold and silver would only have been heavy.', 'Surah At-Taghabun says wealth is a test, and that giving is better for ourselves.'],
    ref: [64, 16],
    questions: ['What did you leave behind, and why?', 'What is one thing you have that you could share?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Day of loss and gain is read only, never shown.', 'The walk and the family are a game idea; no one is shown.'],
};
