// Surah 93, Ad-Duha (The Morning Brightness): the Bakehouse Yard. A
// bright morning in a hill village, in a walled yard with a clay oven, a
// kneading table and a wooden gate onto the lane. "So as for the orphan, do
// not oppress him; and as for the one who asks, do not turn him away; and
// as for the favour of your Lord, speak of it" (93:9-11). The core play:
// knead the day's dough, and each time someone knocks, leave the dough,
// answer the gate and give what was asked, never closing the gate on
// anyone; then bake. The Prophet, addressed in 93:3-8, is never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const WALL = '#e8dcc4';

export const W093: WorldDef = {
  surah: 93,
  name: 'The Bakehouse Yard',
  theme: 'Answer every knock while you bake, and never turn the one who asks away',
  play: 'On a bright morning you are baking the day’s bread in a village yard. Knead the dough at the clay oven. While you work, people knock at the gate one after another. Each time, leave the dough, open the gate, and give what was asked: never close the gate on anyone. Then finish kneading and bake.',
  seed: 9393,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 0.8, seed: 93 }),
    palette: PAL.meadow,
    paths: [curve([[0, -34], [6, -22], [0, -12], [0, -7.5]])],
    flats: [{ x: 0, z: 0, r: 8, paint: '#d8c8a8' }, { x: 6, z: -22, r: 3 }, { x: -12, z: -12, r: 3 }],
  },
  look: { ...LOOKS.morning, sunI: 3.3 },
  veg: {
    grass: 1.1,
    flowers: ['#f4d060', '#fff2d8', '#e88a9a'],
    trees: [{ kind: 'fig', at: [[-4, 4]] }, { kind: 'olive', area: { x: 0, z: -22, r: 12 }, count: 4 }],
    rocks: [],
    pebbles: 8,
    rim: ['olive', 'blossom'],
  },
  far: '#8aa25a',
  mountains: { color: '#a0a8c0', height: 0.8 },
  start: [0, -34],
  startYaw: 0,
  structures: [
    { type: 'wall', x: -6, z: 6, to: [6, 6], h: 2.4, color: WALL },
    { type: 'wall', x: -6, z: 6, to: [-6, -6], h: 2.4, color: WALL },
    { type: 'wall', x: 6, z: 6, to: [6, -6], h: 2.4, color: WALL },
    { type: 'wall', x: -6, z: -6, to: [-1.4, -6], h: 2.4, color: WALL },
    { type: 'wall', x: 1.4, z: -6, to: [6, -6], h: 2.4, color: WALL },
    { type: 'house', x: 0, z: 9, rot: Math.PI, w: 6, d: 4.4, h: 3.2, accent: '#5a7a4a' },
  ],
  welcome:
    'Welcome to the Bakehouse Yard. Surah Ad-Duha swears by the morning brightness and the still night, and says: as for the orphan, do not be harsh with them; as for the one who asks, do not turn them away. It is baking day. Keep an ear on the gate.',
  tasks: [
    {
      id: 'morning',
      kind: 'read',
      at: [6, -22],
      marker: 'sign',
      title: 'The morning brightness',
      goal: 'Read at the sign on the lane',
      adaptation: 'The Prophet, who is addressed here, is never shown; the ayahs are read only.',
      reading: { title: 'The morning brightness', refs: [[93, 1], [93, 2], [93, 3], [93, 4], [93, 5]], note: 'By the morning brightness, and the night when it grows still: your Lord has not left you, nor is He displeased. And what comes after is better for you than what came first. And your Lord will give you, and you will be pleased.' },
    },
    {
      id: 'bake',
      kind: 'answer',
      requires: ['morning'],
      oven: [-2.5, 2],
      door: [0, -5.2],
      gifts: ['a warm loaf from yesterday', 'a cup of cool water', 'a little salt'],
      callers: [
        { who: 'a child from the orphanage', wants: 0 },
        { who: 'a tired traveller', wants: 1 },
        { who: 'a neighbour who has run out of salt', wants: 2 },
      ],
      title: 'Do not turn them away',
      goal: 'Knead the dough at the oven, answer the gate whenever someone knocks, then bake the bread',
      intro: 'Knead the dough. When you hear a knock, go to the gate straight away and give what is asked.',
      adaptation: 'The yard and the callers are a game idea; no one at the gate is shown. Not turning away the one who asks is a real command of the surah.',
      outro: 'Three callers answered, and the bread baked.',
      after: { title: 'Do not turn them away', refs: [[93, 6], [93, 7], [93, 8], [93, 9], [93, 10], [93, 11]], note: 'Did He not find you an orphan and give you shelter? And find you lost and guide you? And find you in need and make you free of need? So as for the orphan, do not be harsh; and as for the one who asks, do not turn them away; and as for the favour of your Lord, speak of it.' },
    },
    {
      id: 'speak',
      kind: 'read',
      requires: ['bake'],
      at: [-12, -12],
      marker: 'tablet',
      title: 'Speak of the favour',
      goal: 'Read at the tablet under the olive trees',
      reading: { title: 'Speak of the favour', refs: [[93, 11]], note: 'And as for the favour of your Lord, speak of it.' },
    },
  ],
  finale: {
    title: 'The gate was always opened',
    body: ['Three times someone knocked, and three times you left the dough and gave what was asked. Then the bread baked.', 'Surah Ad-Duha says: as for the one who asks, do not turn them away.'],
    ref: [93, 10],
    questions: ['Was it hard to stop what you were doing each time?', 'What favours of your Lord can you speak of today?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet, addressed in 93:3-8, is never shown, voiced or played.', 'No one at the gate is shown.'],
};
