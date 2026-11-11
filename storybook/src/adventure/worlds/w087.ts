// Surah 87, Al-A'la (The Most High): the Hillside Garden Shed. A terraced
// hillside garden in spring, with a pasture that greens and later browns,
// and a potting shed where a tall wooden box holds a bean seedling and
// shelves. "Who created and proportioned, who measured out and guided, who
// brings out the pasture and then makes it dark stubble" (87:2-5). The core
// play: open one window of the box at a time to guide the shoot, which
// grows toward the light, round each shelf and out of the top. The Prophet,
// addressed in 87:6-9, is never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W087: WorldDef = {
  surah: 87,
  name: 'The Hillside Garden Shed',
  theme: 'Guide a seedling to the light, as everything is measured out and guided',
  play: 'In a potting shed on a hillside garden, a bean seedling grows at the bottom of a tall wooden box with shelves inside. Seedlings grow toward the light. Open one window at a time, on the side where the gap in each shelf is, to guide the shoot round every shelf and out of the top.',
  seed: 8787,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 0.9, seed: 87, tilt: [0, 0.06] }),
    palette: PAL.meadow,
    paths: [curve([[0, -36], [6, -24], [-2, -12], [0, -4]])],
    flats: [{ x: 0, z: 0, r: 6, paint: '#b8a888' }, { x: 6, z: -24, r: 3 }, { x: -14, z: 12, r: 3 }],
  },
  look: LOOKS.blossom,
  veg: {
    grass: 1.4,
    flowers: ['#f4d060', '#e88a9a', '#c8a0e0', '#fff2d8'],
    trees: [{ kind: 'blossom', area: { x: 0, z: -20, r: 14 }, count: 6 }, { kind: 'fig', at: [[10, 8]] }],
    rocks: [],
    pebbles: 10,
    rim: ['blossom', 'oak'],
  },
  far: '#8aa25a',
  mountains: { color: '#a0a8c0', height: 0.8 },
  start: [0, -36],
  startYaw: 0,
  structures: [
    { type: 'house', x: 0, z: 6, rot: Math.PI, w: 4.4, d: 3.6, h: 2.6, accent: '#6a8a4a' },
    { type: 'bench', x: 3, z: -1, rot: 0 },
    { type: 'fence', x: -10, z: -4, to: [-10, 16] },
  ],
  welcome:
    'Welcome to the Hillside Garden Shed. Surah Al-A’la praises the Most High, who created and gave everything its measure, then guided it. Even a small bean seedling knows which way to grow. Can you help guide it?',
  tasks: [
    {
      id: 'glorify',
      kind: 'read',
      at: [6, -24],
      marker: 'sign',
      title: 'Measured and guided',
      goal: 'Read at the sign on the garden path',
      reading: { title: 'Measured and guided', refs: [[87, 1], [87, 2], [87, 3], [87, 4], [87, 5]], note: 'Glorify the name of your Lord, the Most High, who created and shaped well, who measured out and guided, who brings out the pasture, then turns it to dark stubble.' },
    },
    {
      id: 'box',
      kind: 'lightbox',
      requires: ['glorify'],
      at: [-1.5, 1.5],
      gaps: ['right', 'left', 'right'],
      title: 'Growing toward the light',
      goal: 'Open the box’s windows one at a time to guide the shoot round each shelf to the top',
      intro: 'The shoot grows toward whichever window is open. Open the side where the gap in the next shelf is.',
      adaptation: 'The shed and the box are a game. Shoots growing toward light is real.',
      outro: 'Round three shelves and out of the top into the sun.',
      after: { title: 'Success', refs: [[87, 14], [87, 15], [87, 16], [87, 17]], note: 'Successful is the one who purifies themself, and remembers the name of their Lord, and prays. But you prefer the life of this world, while the Hereafter is better and lasting.' },
    },
    {
      id: 'recite',
      kind: 'read',
      requires: ['box'],
      at: [-14, 12],
      marker: 'tablet',
      title: 'You will not forget',
      goal: 'Read at the tablet by the garden fence',
      adaptation: 'The Prophet, who is addressed here, is never shown; the ayahs are read only.',
      reading: { title: 'You will not forget', refs: [[87, 6], [87, 7], [87, 8]], note: 'We will make you recite, so you will not forget, except what Allah wills. He knows what is open and what is hidden. And We will ease you toward the easy way.' },
    },
  ],
  finale: {
    title: 'Guided to the light',
    body: ['Right, left, right, then up: you opened the windows that led the shoot round every shelf into the sun.', 'Surah Al-A’la praises the One who measured everything out and guided it.'],
    ref: [87, 3],
    questions: ['How did the shoot know which way to grow?', 'What guides you?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet, addressed in 87:6-9, is never shown, voiced or played.', 'The Fire of 87:12-13 is not shown.'],
};
