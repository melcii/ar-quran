// Surah 10, Yunus: the Sea of Signs. A harbour town by the sea at golden
// hour. Light the harbour lamps and the lighthouse, guide three boats to
// their berths, and cross the bridges to three small story islands for
// reading. One island has a doorway to the storybook's Yunus story, another
// to the Nuh's Ark adventure. No prophet is shown, and no sea event is acted out.
import { curve, type P2 } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const ISLES: P2[] = [[-28, -30], [0, -38], [28, -30]];
const town: Structure[] = [
  [-26, 14, 0.2], [-14, 18, 0], [14, 18, 0], [26, 14, -0.2], [-34, 4, 0.6], [34, 4, -0.6],
].map(([x, z, r], i) => ({ type: 'house', x, z, rot: Math.PI + r, w: 6, d: 5, h: 3.4, accent: ['#3f6f9a', '#3f8a8a', '#a04a3a', '#3f7f5a', '#c8a040', '#7a4a8a'][i] }));

export const W010: WorldDef = {
  surah: 10,
  name: 'Sea of Signs',
  theme: 'Harbour lights, boats coming home, and islands of stories',
  seed: 1010,
  ground: {
    radius: 76,
    base: rolling({
      radius: 76,
      amp: 3,
      seed: 10,
      rim: 0.6,
      shapes: [
        { x: 0, z: -62, r: 64, h: -16 },
        { x: -46, z: -26, r: 24, h: -10 },
        ...ISLES.map(([x, z], i) => ({ x, z, r: 13, h: i === 1 ? 18 : 9 })),
        { x: 0, z: 34, r: 30, h: 2.5 },
      ],
    }),
    palette: PAL.coast,
    paths: [curve([[0, 56], [-4, 40], [0, 26], [0, 4]]), curve([[-36, -2], [-18, -2], [0, 2], [18, -2], [36, -2]])],
    pathWidth: 2.1,
    water: -2.6,
    shore: '#ecd8a8',
    flats: [{ x: 0, z: 2, r: 10, paint: '#e0cca4' }],
  },
  look: LOOKS.sea,
  veg: {
    grass: 1,
    lush: (_x, z) => (z < 2 ? 0.35 : 1),
    flowers: ['#fff2d8', '#f4d060', '#e88a9a'],
    trees: [
      { kind: 'palm', area: { x: 0, z: 6, r: 50 }, count: 10, size: [0.9, 1.3] },
      { kind: 'olive', area: { x: 0, z: 40, r: 26 }, count: 6 },
      { kind: 'cypress', area: { x: 0, z: 30, r: 30 }, count: 5 },
      { kind: 'palm', at: ISLES.map(([x, z]) => [x + 4, z - 3] as P2) },
      { kind: 'fig', at: [[-31, -33]] },
    ],
    rocks: [{ x: 40, z: -10, n: 8, big: 1.6, spread: 12 }, { x: -42, z: -12, n: 6, big: 1.4, spread: 10 }, ...ISLES.map(([x, z]) => ({ x: x - 3, z: z - 4, n: 3, big: 1.2, spread: 5 }))],
    pebbles: 40,
    rim: ['palm', 'olive', 'oak'],
  },
  far: '#7c9a54',
  mountains: { color: '#8a9ab8', height: 0.8 },
  start: [0, 56],
  startYaw: Math.PI,
  structures: [
    ...town,
    { type: 'stall', x: -8, z: 6, rot: Math.PI - 0.3, color: '#3f7f8a' },
    { type: 'stall', x: 8, z: 6, rot: Math.PI + 0.3, color: '#d8664a' },
    { type: 'festoon', x: -10, z: 2, to: [10, 2], h: 3.6 },
    { type: 'tower', x: 40, z: -12, h: 8, hide: 'lights' },
    { type: 'dock', x: -10, z: -4, to: [-10, -21], w: 3 },
    { type: 'dock', x: 10, z: -4, to: [10, -21], w: 3 },
    { type: 'dock', x: -40, z: -4, to: [-40, -18], w: 3 },
    { type: 'bridge', x: -20, z: -4, to: [-25, -25], w: 2.6 },
    { type: 'bridge', x: 0, z: -4, to: [0, -29], w: 2.6 },
    { type: 'bridge', x: 20, z: -4, to: [25, -25], w: 2.6 },
  ],
  links: [
    { at: [-31, -29], label: 'Play Nuh\'s Ark', href: '/ark', note: 'The Nuh\'s Ark adventure from Surah Hud' },
    { at: [4, -40], label: 'Open the story of Yunus', href: '/yunus', note: 'The storybook\'s story of Yunus' },
  ],
  extras: { boats: [{ at: [-6.5, -16], rot: 0, color: '#3f6f8a' }, { at: [52, -40], rot: 2.2 }] },
  welcome:
    'Welcome to the Sea of Signs. Surah Yunus is named after the prophet Yunus (Jonah), and it points to signs in the sun and moon, in night and day, and in ships at sea. Evening is coming, and boats are on their way home.',
  tasks: [
    {
      id: 'sky',
      kind: 'read',
      at: [-4, 22],
      marker: 'tablet',
      title: 'Sun, moon, night and day',
      goal: 'Read the stone above the harbour',
      reading: {
        title: 'Signs in the sky',
        refs: [[10, 5], [10, 6]],
        note: 'Allah made the sun a shining light and the moon a reflected light, with phases, so people can count the years. The turning of night and day are signs for people who are mindful of Him.',
      },
    },
    {
      id: 'lights',
      kind: 'points',
      requires: ['sky'],
      style: 'beacon',
      verb: 'Light',
      title: 'Harbour lights',
      goal: 'Light the lamps at the ends of the three docks and by the lighthouse',
      adaptation: 'Lighting the harbour is a game activity.',
      points: [
        { at: [-10, -20], label: 'the west dock lamp' },
        { at: [10, -20], label: 'the east dock lamp' },
        { at: [-40, -17], label: 'the far dock lamp' },
        { at: [37, -10], label: 'the lighthouse lamp' },
      ],
      outro: 'The harbour is lit. Now the boats can find their way in.',
    },
    {
      id: 'boats',
      kind: 'guide',
      requires: ['lights'],
      title: 'Guide the boats home',
      goal: 'Tap each boat out at sea to guide it to a berth',
      intro: 'Three boats are waiting out at sea. Stand on a dock or the shore and tap each one to guide it along the lit channel to its berth.',
      adaptation: 'Guiding boats is a game activity about 10:22.',
      boats: [
        { path: [[-14, -60], [-14, -40], [-13.5, -24], [-13.5, -19.5]], color: '#b0603a' },
        { path: [[14, -60], [14, -40], [13.5, -24], [13.5, -19.5]], color: '#3f8a8a', sail: '#f6e6c8' },
        { path: [[-50, -40], [-47, -30], [-43.5, -21], [-43.5, -17]], color: '#7a4a8a' },
      ],
      after: {
        title: 'Ships on the sea',
        refs: [[10, 22]],
        note: 'Allah lets people travel on land and sea. Ships sail with a good wind and the travellers are happy, then a storm comes. Then they call on Allah sincerely: "If You save us, we will be thankful."',
      },
    },
    {
      id: 'noah',
      kind: 'read',
      requires: ['boats'],
      at: [-25, -32],
      marker: 'tablet',
      title: 'The news of Nuh',
      goal: 'Cross the west bridge and read on the first island',
      reading: {
        title: 'Recite to them the news of Nuh',
        refs: [[10, 71], [10, 72], [10, 73]],
        note: 'Nuh relied on Allah and asked for no payment from his people. They denied him, and Allah saved him and those with him in the ship. The doorway here leads to the Nuh\'s Ark adventure.',
      },
    },
    {
      id: 'moses',
      kind: 'read',
      requires: ['boats'],
      at: [25, -32],
      marker: 'tablet',
      title: 'Musa and Pharaoh',
      goal: 'Cross the east bridge and read on the third island',
      reading: {
        title: 'Across the sea',
        refs: [[10, 75], [10, 90], [10, 92]],
        note: 'Allah sent Musa and Harun to Pharaoh, who was arrogant. Allah took the Children of Israel across the sea. Pharaoh followed, and as he drowned he said he believed, but it was too late. His body was kept as a sign. Nothing of this is shown; it is for reading.',
      },
    },
    {
      id: 'jonah',
      kind: 'read',
      requires: ['noah', 'moses'],
      at: [-3, -38],
      marker: 'lantern',
      title: 'The people of Yunus',
      goal: 'Cross the middle bridge and read on the island of Yunus',
      reading: {
        title: 'A town that believed',
        refs: [[10, 98]],
        note: 'The people of Yunus are the one town the surah names whose belief helped them: when they believed, Allah lifted the disgrace from them. The doorway here opens the storybook\'s story of Yunus.',
      },
    },
  ],
  finale: {
    title: 'Signs at sea',
    body: [
      'You lit the harbour, guided the boats home, and crossed to islands of stories: Nuh, Musa, and the people of Yunus.',
      'Surah Yunus asks us to notice the signs around us, in the sky, on the sea, and in what happened to people before us.',
    ],
    ref: [10, 6],
    questions: ['Which sign in the sky can you see tonight?', 'Why do you think people call on Allah most sincerely when they are afraid?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown: not Yunus, Nuh, Musa or Harun.',
    'No storm, flood or drowning is shown; those ayahs are only read.',
    'The harbour town and islands are game places, not real sites.',
  ],
};
