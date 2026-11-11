// Surah 106, Quraysh: the Caravan Camp. A caravan camp in rocky hills at
// dusk, with tents, a map table and four fire rings around the camp. "Their
// accustomed security in the caravan of winter and summer ... who fed them
// against hunger and made them safe from fear" (106:2-4). The core play:
// plan the year's two journeys on the map (south to the warm lands in
// winter, north to the cooler lands in summer), then keep the camp's four
// fires burning until dawn. The House (106:3) is read only, never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W106: WorldDef = {
  surah: 106,
  name: 'The Caravan Camp',
  theme: 'Plan the winter and summer roads, then keep the camp fires burning till dawn',
  play: 'At a caravan camp in the rocky hills, plan the year’s two journeys on the map table: which road for winter, which for summer? Then night falls on the camp. Keep its four fires burning until dawn, adding wood to each as it burns low, so the camp stays warm and safe.',
  seed: 10606,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.2, seed: 106 }),
    palette: PAL.desert,
    paths: [curve([[0, 36], [8, 24], [0, 14], [0, 8]])],
    flats: [{ x: 0, z: -2, r: 10, paint: '#c8a878' }, { x: 8, z: 24, r: 3 }, { x: -14, z: 12, r: 3 }],
  },
  look: { ...LOOKS.dusk, sunI: 2 },
  veg: {
    grass: 0.2,
    flowers: ['#f0d8a0'],
    trees: [{ kind: 'palm', at: [[-14, -12], [14, -14], [16, 8]] }],
    rocks: [{ x: -18, z: 0, n: 7, big: 1.4, spread: 6 }, { x: 18, z: 22, n: 5, big: 1.2, spread: 5 }],
    pebbles: 30,
    rim: ['palm'],
  },
  far: '#b89070',
  mountains: { color: '#9a7a6a', height: 1 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    { type: 'tent', x: -3, z: -5, rot: 0.3 },
    { type: 'tent', x: 3, z: -6, rot: -0.3 },
    { type: 'cart', x: 0, z: -11, rot: 1.4 },
  ],
  welcome:
    'Welcome to the Caravan Camp. Surah Quraysh speaks of the caravans of winter and summer, and of the Lord who fed them against hunger and made them safe from fear. The caravan master’s map table is waiting.',
  tasks: [
    {
      id: 'caravans',
      kind: 'read',
      at: [8, 24],
      marker: 'sign',
      title: 'Winter and summer',
      goal: 'Read at the sign on the caravan road',
      reading: { title: 'Winter and summer', refs: [[106, 1], [106, 2]], note: 'For the familiar safety of Quraysh: their familiar safety in the caravan of winter and of summer.' },
    },
    {
      id: 'camp',
      kind: 'campfire',
      requires: ['caravans'],
      at: [0, 5],
      fires: [[-6, 1], [6, 1], [-6, -8], [6, -8]],
      secs: 40,
      burn: 14,
      title: 'Safe from fear',
      goal: 'Plan the winter and summer roads, then keep all four camp fires burning until dawn',
      intro: 'South in the cold months, north in the hot ones. Then the long night.',
      adaptation: 'The camp is a game. The two seasonal journeys are named in the surah; the roads chosen here follow the weather of each season.',
      outro: 'The roads planned, and the camp safe through the night.',
      after: { title: 'Fed and made safe', refs: [[106, 3], [106, 4]], note: 'So let them worship the Lord of this House, who fed them against hunger and made them safe from fear.' },
    },
    {
      id: 'lord',
      kind: 'read',
      requires: ['camp'],
      at: [-14, 12],
      marker: 'tablet',
      title: 'Against hunger, from fear',
      goal: 'Read at the tablet above the camp',
      adaptation: 'The House is read only, never shown.',
      reading: { title: 'Against hunger, from fear', refs: [[106, 4]], note: 'Who fed them against hunger and made them safe from fear.' },
    },
  ],
  finale: {
    title: 'Fed and made safe',
    body: ['Two roads for two seasons, and a camp kept warm and safe through the night.', 'Surah Quraysh reminds them who fed them against hunger and made them safe from fear: so let them worship the Lord of the House.'],
    ref: [106, 4],
    questions: ['Why go south in winter and north in summer?', 'Who keeps you fed and safe? How can you thank Him?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The House is read only, never shown.', 'The camp and its fires are a picture only.'],
};
