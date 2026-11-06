// Surah 10, Yunus: the Ocean of Signs. A harbour town on a bay, open sea,
// and islands. The core play is sailing: board your own small boat at the
// dock and steer it out to five places at sea, watching the sky and the
// water change. A squall rises on the way to the open sea and calms again
// (a picture of 10:22, labelled as such). From the water you see the island
// of Nuh's story, the cliffs of Musa's story, and a coastal town standing for
// the people of Yunus (10:98). The detailed account of Yunus and the great
// fish is in other surahs (37:139-148, 21:87-88); a doorway in the harbour
// leads to the storybook's story, and a reading gives 21:87-88 labelled as
// such. No prophet is shown, no drowning or punishment is shown.
import { curve, type P2 } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const ISLES: P2[] = [[-28, -30], [0, -38], [28, -30]];
const town: Structure[] = [
  [-26, 14, 0.2], [-14, 18, 0], [14, 18, 0], [26, 14, -0.2], [-34, 4, 0.6], [34, 4, -0.6],
].map(([x, z, r], i) => ({ type: 'house', x, z, rot: Math.PI + r, w: 6, d: 5, h: 3.4, accent: ['#3f6f9a', '#3f8a8a', '#a04a3a', '#3f7f5a', '#c8a040', '#7a4a8a'][i] }));
// The town on the middle island that stands for the people of Yunus: seen from the sea.
const isleTown: Structure[] = [
  [-5, -34, 0.3], [4, -33, -0.2], [-1, -42, 0], [6, -41, -0.5], [-7, -41, 0.6],
].map(([x, z, r], i) => ({ type: 'house', x, z, rot: r, w: 4.4, d: 3.8, h: 2.8, accent: ['#3f8a8a', '#c8a040', '#3f6f9a', '#a04a3a', '#3f7f5a'][i] }));

export const W010: WorldDef = {
  surah: 10,
  name: 'The Ocean of Signs',
  theme: 'Sail your own boat among islands of stories',
  play: 'A sailing adventure: steer your own boat round the bay and out to sea, to five places where the sea, the sky and the stories of earlier peoples are read.',
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
    ...isleTown,
    { type: 'cliff', x: 40, z: -34, w: 10, d: 6, h: 7, rot: -0.6, color: '#c8b08a' },
    { type: 'boat', x: -6.5, z: -16, rot: 0, color: '#3f6f8a' },
  ],
  links: [
    { at: [-20, 4], label: 'Play Nuh\'s Ark', href: '/ark', note: 'The Nuh\'s Ark adventure from Surah Hud' },
    { at: [20, 4], label: 'Open the story of Yunus', href: '/yunus', note: 'The storybook\'s story of Yunus and the great fish, told in Surahs As-Saffat and Al-Anbiya' },
  ],
  extras: { boats: [{ at: [52, -40], rot: 2.2 }, { at: [-46, -52], rot: 0.8, color: '#7a4a8a' }] },
  welcome:
    'Welcome to the Ocean of Signs. Surah Yunus is named after the prophet Yunus (Jonah). It points to signs in the sun and moon, in night and day, and in ships at sea, and it tells of peoples before. Your own boat is waiting at the east dock.',
  tasks: [
    {
      id: 'harbour',
      kind: 'read',
      at: [-4, 22],
      marker: 'tablet',
      title: 'Land and sea',
      goal: 'Read the stone above the harbour',
      reading: {
        title: 'He enables you to travel',
        refs: [[10, 22]],
        note: 'Allah enables people to travel on land and sea. Ships sail with a good wind and the travellers are glad, then a storm wind comes, and waves from every side. Then they call on Allah sincerely: "If You save us, we will be thankful."',
      },
    },
    {
      id: 'voyage',
      kind: 'sail',
      requires: ['harbour'],
      dock: [10, -18],
      launch: [13.6, -24],
      launchYaw: Math.PI,
      title: 'The voyage',
      goal: 'Board your boat at the east dock and sail to each ring on the water',
      intro: 'Walk to the end of the east dock and board your boat. Then steer out to each ring of light on the water, one after another. Watch the sky and the sea as you go.',
      adaptation: 'Sailing to the five places, and the squall on the way to the open sea, are game ideas. The squall is a picture of 10:22, not a retelling of any event.',
      stops: [
        {
          at: [34, -50],
          r: 6,
          label: 'the light-buoy in the east bay',
          reading: {
            title: 'The sun, the moon, night and day',
            refs: [[10, 5], [10, 6]],
            note: 'Out on the water you can see the whole sky. Allah made the sun a shining light and the moon a reflected light, with phases, so people can count the years. The turning of night and day is a sign for people who are mindful.',
          },
        },
        {
          at: [-28, -50],
          r: 6,
          label: 'the waters by the green island',
          reading: {
            title: 'Recite to them the news of Nuh',
            refs: [[10, 71], [10, 72], [10, 73]],
            note: 'Nuh relied on Allah and asked his people for no payment. They denied him, and Allah saved him and those with him in the ship. The island is only a place to read; nothing of the flood is shown. A doorway in the harbour town leads to the Nuh\'s Ark adventure.',
          },
        },
        {
          at: [37, -42],
          r: 6,
          label: 'the waters under the east cliffs',
          reading: {
            title: 'Musa, Pharaoh, and the sea',
            refs: [[10, 75], [10, 90], [10, 92]],
            note: 'Allah sent Musa and Harun to Pharaoh, who was arrogant. Allah took the Children of Israel across the sea. Pharaoh followed, and as he was drowning he said he believed, but it was too late. His body was kept as a sign for those after him. Nothing of this is shown; it is for reading.',
          },
        },
        {
          at: [0, -86],
          r: 8,
          storm: true,
          label: 'the open sea',
          note: 'A squall blew up on the way out, and now the wind is dropping and the sea is calm again. This is only a picture of the ayah you read at the harbour.',
          reading: {
            title: 'When He saves them',
            refs: [[10, 23]],
            note: 'The next ayah says that when Allah saves them, they go back to wrongdoing on the earth. The surah asks us to stay thankful after a difficulty has passed, not only during it.',
          },
        },
        {
          at: [0, -60],
          r: 7,
          label: 'the town on the middle island',
          reading: {
            title: 'A town that believed',
            refs: [[10, 98]],
            note: 'The surah names one town whose belief benefited it: the people of Yunus. When they believed, Allah lifted from them the punishment of disgrace in this life. The little island town stands for them as a picture only; it is not their real town.',
          },
        },
      ],
      outro: 'You have sailed to every ring. Back on land, read about Yunus himself by the doorway in the town.',
    },
    {
      id: 'jonah',
      kind: 'read',
      requires: ['voyage'],
      at: [16, 6],
      marker: 'lantern',
      title: 'Yunus himself',
      goal: 'Read by the doorway to the story of Yunus',
      reading: {
        title: 'From Surah Al-Anbiya: the call from the darkness',
        refs: [[21, 87], [21, 88]],
        note: 'These two ayahs are from Surah Al-Anbiya, not Surah Yunus. They tell how Yunus called out in the darknesses, "There is no deity except You; exalted are You; indeed I was among the wrongdoers", and Allah answered him and saved him from distress. The longer account of Yunus and the great fish is in Surah As-Saffat, 37:139-148. The doorway here opens the storybook\'s telling.',
      },
    },
  ],
  finale: {
    title: 'Signs at sea',
    body: [
      'You sailed your own boat round the bay and out to sea, past the island of Nuh\'s story and the cliffs of Musa\'s story, through a squall and into calm water, and back past the town that stands for the people of Yunus.',
      'Surah Yunus asks us to notice the signs around us, in the sky, on the sea, and in what happened to people before us.',
    ],
    ref: [10, 6],
    questions: ['Which sign in the sky can you see tonight?', 'Why do you think people call on Allah most sincerely when they are afraid?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown: not Yunus, Nuh, Musa or Harun.',
    'No flood or drowning is shown; those ayahs are only read. The squall is a picture of 10:22, labelled as a game idea.',
    'The harbour town, the islands and the island town are game places, not real sites.',
    'The account of Yunus and the great fish is in Surahs As-Saffat (37:139-148) and Al-Anbiya (21:87-88), not in Surah Yunus; this world says so where it is mentioned.',
  ],
};
