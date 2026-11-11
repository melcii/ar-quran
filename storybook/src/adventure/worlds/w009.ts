// Surah 9, At-Tawbah: the Journey of Return. A long autumn valley path that
// winds down to a narrow gorge and out to a quiet spring garden. The core
// play is choosing and reflecting: at signposts along the path, answer
// everyday situations about honesty and excuses. An excuse or an untruth
// is not a "game over": the path takes you back a little way, you walk up
// again and think again. Then the path enters a gorge where the mist
// closes in as you go deeper (a picture of 9:118, "the earth, vast as it
// was, closed in on them"), and clears when you reach the ayah of Allah
// turning to them. The three are never shown, and the situations are
// modern, everyday ones written for this game, not events from the surah.
import { curve, type P2 } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, homes, rolling } from './common';

const PATH: P2[] = curve([[0, 56], [-8, 42], [-2, 28], [10, 16], [4, 2], [-10, -10], [-4, -24], [6, -34], [8, -42]]);
const { houses } = homes([24, 8], 12, 4, Math.PI * 0.75, ['#3f6f9a', '#a04a3a', '#3f7f5a', '#c8a040']);
// Rock walls along the gorge: they appear as the mist closes in, and are gone once it clears.
const gorge: Structure[] = [
  [-15, -12, 0.5], [-5, -12, -0.3], [-10, -22, 0.2], [2, -22, -0.6], [-1, -31, 0.9], [11, -30, 0.4],
].map(([x, z, r], i) => ({ type: 'cliff', x, z, rot: r, w: 5, d: 2.4, h: 6 + (i % 2), color: '#9a8a7a', show: 'g1', hide: 'g3' }));

export const W009: WorldDef = {
  surah: 9,
  name: 'The Journey of Return',
  theme: 'Honest choices on the way, a gorge that closes in and opens',
  play: 'A choices-and-reflection journey: answer everyday situations at signposts (an excuse sends you back a little way to think again), then walk through a gorge where the mist closes in and clears.',
  seed: 909,
  ground: {
    radius: 60,
    base: rolling({ radius: 60, amp: 3.5, seed: 9, shapes: [{ x: 8, z: -40, r: 16, h: 6 }, { x: -32, z: 4, r: 14, h: 3 }, { x: 34, z: 30, r: 10, h: -6 }] }),
    palette: { ...PAL.autumn, lush: '#98a04a', deep: '#6a7a38', warm: '#d0a048' },
    paths: [PATH],
    water: -3,
    flats: [{ x: 4, z: 50, r: 2.5 }, { x: 24, z: 8, r: 14, paint: '#e0cca4' }, { x: 8, z: -42, r: 8, paint: '#e4d4b0' }],
  },
  look: { ...LOOKS.golden, hor: '#ffc89a', sunColor: '#ffc88a', fog: '#e8c4a4' },
  veg: {
    grass: 1,
    dryGrass: true,
    flowers: ['#f4a040', '#f4d060', '#fff2d8'],
    flowerDensity: 0.7,
    trees: [
      { kind: 'autumn', area: { x: 0, z: 0, r: 56 }, count: 18, size: [0.9, 1.3] },
      { kind: 'oak', area: { x: 0, z: 0, r: 56 }, count: 6 },
      { kind: 'fig', area: { x: -24, z: 24, r: 10 }, count: 2 },
      { kind: 'pine', area: { x: 8, z: -40, r: 14 }, count: 4 },
    ],
    rocks: [{ x: 8, z: -40, n: 8, big: 1.6, spread: 16 }, { x: -32, z: 4, n: 6, big: 1.4, spread: 12 }],
    pebbles: 40,
    rim: ['autumn', 'oak', 'pine'],
  },
  far: '#8a9448',
  mountains: { color: '#9a8ea8' },
  start: [0, 56],
  startYaw: Math.PI,
  structures: [
    ...houses,
    { type: 'well', x: 24, z: 8 },
    ...gorge,
    // The spring garden at the end, which blooms once the mist has cleared.
    { type: 'bench', x: 4, z: -44, rot: 0.3 },
    { type: 'bed', x: 12, z: -40, w: 3, d: 1.6, color: '#f4d060', show: 'g3' },
    { type: 'bed', x: 4, z: -38, w: 3, d: 1.6, color: '#f6c0d0', show: 'g3' },
    { type: 'festoon', x: 2, z: -46, to: [14, -44], h: 3.2, show: 'g3' },
    { type: 'stones', x: 10, z: -46, n: 6 },
  ],
  herds: [{ animal: 'cow', at: [-34, -20], r: 7, n: 3 }, { animal: 'goat', at: [36, 20], r: 5, n: 3 }],
  mist: (done) => (done.includes('g3') ? 0 : done.includes('g2') ? 0.85 : done.includes('g1') ? 0.45 : 0),
  welcome:
    'Welcome to the Journey of Return. Surah At-Tawbah, "The Repentance", is the only surah that does not begin with "In the name of Allah". It speaks of people who turned back to Allah after mistakes, and Allah accepted them. On this path, you will meet everyday choices about honesty. Walk on.',
  tasks: [
    {
      id: 'cave',
      kind: 'read',
      at: [4, 50],
      marker: 'sign',
      title: 'The two in the cave',
      goal: 'Read at the sign near the way in',
      adaptation: 'The Prophet and his companion are read only; the cave is never shown.',
      reading: { title: 'The two in the cave', refs: [[9, 40]], note: 'If you do not help him, Allah has already helped him, when he was the second of two in the cave, and he said to his companion: Do not grieve; indeed Allah is with us. And Allah sent down His tranquillity upon him.' },
    },
    {
      id: 'accepts',
      kind: 'read',
      at: [4, 47],
      marker: 'tablet',
      title: 'He accepts repentance',
      goal: 'Read the first stone',
      reading: {
        title: 'Allah accepts repentance',
        refs: [[9, 102], [9, 104]],
        note: 'Some people admitted their mistakes: they had done good and also bad. Allah is Forgiving and Merciful, and He is the one who accepts repentance from His servants.',
      },
    },
    {
      id: 'c1',
      kind: 'choice',
      requires: ['accepts'],
      at: [-1, 27],
      back: [-7, 41],
      marker: 'sign',
      title: 'The first signpost',
      goal: 'Answer the situations at the first signpost',
      intro: 'At each signpost there are everyday situations. Choose what you would honestly do. An excuse will send you back a little way up the path to think again.',
      adaptation: 'The situations are everyday ones written for this game. They are not events from the surah.',
      scenes: [
        {
          text: 'You were asked to give the goats their water this morning, but you played instead. Now someone asks you, "Did the goats get their water?"',
          options: [
            { text: '"Yes, they did."', ok: false, reply: 'That is not true, and now the goats are still thirsty. A small untruth makes a mistake bigger.' },
            { text: '"Not yet. I forgot, and I\'m sorry. I\'ll do it right now."', ok: true, reply: 'Telling the truth about a mistake, and putting it right straight away, is what turning back looks like.' },
            { text: '"The bucket was too heavy, so it isn\'t my fault."', ok: false, reply: 'That is an excuse. The bucket was not the reason. Excuses push the mistake onto something else.' },
          ],
        },
        {
          text: 'You broke your brother\'s clay cup by accident. Nobody saw it happen.',
          options: [
            { text: 'Hide the pieces under the bench.', ok: false, reply: 'Hiding it does not undo it, and he will still be sad when he finds out.' },
            { text: 'Tell him, say sorry, and offer to help make or buy a new one.', ok: true, reply: 'Owning up when nobody saw takes courage. That honesty matters most.' },
            { text: 'Say the cat must have knocked it over.', ok: false, reply: 'Blaming someone else, even a cat, is an untruth and an excuse at once.' },
          ],
        },
      ],
      outro: 'The path goes on down the valley to the second signpost.',
    },
    {
      id: 'c2',
      kind: 'choice',
      requires: ['c1'],
      at: [3, 3],
      back: [9, 15],
      marker: 'sign',
      title: 'The second signpost',
      goal: 'Answer the situations at the second signpost',
      adaptation: 'The situations are everyday ones written for this game. They are not events from the surah.',
      scenes: [
        {
          text: 'Your class planned to clean the park on Saturday. You stayed home because you wanted to sleep late. On Monday your teacher asks why you were not there.',
          options: [
            { text: '"I was really busy."', ok: false, reply: 'That is an excuse that is not true. The surah speaks of people who made excuses so they would not have to go; excuses do not change what happened.' },
            { text: '"I had no good reason. I should have come. I\'ll help next time."', ok: true, reply: 'No excuse, just the truth and a plan to do better. That is taking responsibility.' },
            { text: '"Nobody told me."', ok: false, reply: 'Everybody was told. Saying otherwise is an untruth.' },
          ],
        },
        {
          text: 'Your friend says, "Everyone makes excuses. It doesn\'t matter."',
          options: [
            { text: '"You\'re right, it doesn\'t matter."', ok: false, reply: 'It does matter. Excuses can become a habit that hides our mistakes from ourselves.' },
            { text: '"Excuses don\'t fix anything. Owning up does."', ok: true, reply: 'Yes. Owning up is the first step back.' },
          ],
        },
      ],
      outro: 'Ahead, the path goes down into a narrow gorge. The surah tells of three believers who stayed behind and then told the truth. Walk on.',
    },
    {
      id: 'g1',
      kind: 'reach',
      requires: ['c2'],
      at: [-10, -10],
      r: 2.6,
      label: 'The mouth of the gorge',
      title: 'Into the gorge',
      goal: 'Walk down the path into the gorge',
      intro: 'Three believers stayed behind from a journey they should have joined, with no real excuse. When they were asked, they did not make up excuses: they told the truth. Then, for a long time, people did not speak with them.',
      adaptation: 'The gorge, the rock walls and the mist are pictures made for this game. The three are not shown, and nothing of their story is acted out.',
    },
    {
      id: 'g2',
      kind: 'reach',
      requires: ['g1'],
      at: [-4, -24],
      r: 2.6,
      label: 'Deep in the gorge',
      title: 'The earth closed in',
      goal: 'Keep walking, deeper into the misty gorge',
      intro: 'The mist is closing in. The surah says that for them the earth, vast as it was, closed in on them, and their own selves felt tight. Keep walking.',
    },
    {
      id: 'g3',
      kind: 'reach',
      requires: ['g2'],
      at: [6, -34],
      r: 2.8,
      label: 'The end of the gorge',
      title: 'He turned to them',
      goal: 'Walk to the end of the gorge',
      intro: 'Keep going: there is light at the end of the gorge.',
      reading: {
        title: 'The three who were left behind',
        refs: [[9, 117], [9, 118], [9, 119]],
        note: 'The three told the truth. The wide earth closed in on them, until they knew there was no refuge from Allah except in Him. Then Allah turned to them, so that they could repent. "O you who believe, be mindful of Allah, and be with those who are true."',
      },
    },
    {
      id: 'rest',
      kind: 'stand',
      requires: ['g3'],
      at: [8, -42],
      r: 1.6,
      secs: 4,
      label: 'The spring garden',
      title: 'The spring garden',
      goal: 'Rest in the spring garden at the end of the path',
      intro: 'The mist has gone, and the path opens onto a quiet spring garden. Rest there a moment.',
      reading: {
        title: 'The Accepting of repentance',
        refs: [[9, 104]],
        note: 'Do they not know that it is Allah who accepts repentance from His servants? Allah is the Accepting of repentance, the Merciful.',
      },
    },
  ],
  finale: {
    title: 'Turning back',
    body: [
      'You chose honesty at the signposts, and when an excuse slipped out you walked back and thought again. You walked through the gorge as it closed in, and out into the light.',
      'At-Tawbah teaches that the door to Allah stays open: when we make mistakes, we can be truthful, say sorry, put things right, and turn back to Him.',
    ],
    ref: [9, 119],
    questions: ['Why does telling the truth about a mistake take courage?', 'What is one thing you could put right this week?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown, and no companion appears.',
    'Battles and campaigns mentioned in the surah are not shown.',
    'The three who stayed behind (9:118) are not shown; the gorge and mist are pictures of the ayah, not a retelling.',
    'The signpost situations are everyday ones written for this game, not events from the surah.',
    'The valley is a game place, not a real place.',
  ],
};
