// Surah 18, Al-Kahf: the Four Realms. One land with four parts: a quiet cave
// in the hills, two gardens side by side, a shore where two seas meet, and a
// gap between two mountain walls. The core play is at the cave: turn the
// day at a dial and mark where the sunlight falls by the cave mouth at
// sunrise and at sunset; it passes the cave by and never enters (18:17). The
// other chapters are hands-on too: water the two gardens and answer at the
// sign between them (18:32-46); wait patiently at the dock without asking
// (18:66-70) and mend the wall about to fall (18:77, 18:82); carry sheets of
// iron to fill the gap (18:96). The young men of the cave, Musa, al-Khidr and Dhul-Qarnayn are
// never shown; their stories are read. The boy in 18:74 and 18:80 is not in
// any scene.
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const CAVE: P2 = [-26, -20];
const GAP: P2 = [30, -26];

export const W018: WorldDef = {
  surah: 18,
  name: 'The Four Realms',
  theme: 'Follow the sun past the cave mouth, then visit the gardens, the shore and the mountain gap',
  play: 'A world of four parts. At the cave, turn the day and mark where the light falls at sunrise and sunset: it never enters. Then water the two gardens and learn what to say when you have something wonderful, wait patiently at the dock and mend a wall asking nothing back, and carry iron to fill the gap between the mountains.',
  seed: 1818,
  ground: {
    radius: 62,
    base: rolling({
      radius: 62,
      amp: 3,
      seed: 18,
      shapes: [
        { x: -30, z: -28, r: 16, h: 8 },
        { x: 22, z: -34, r: 10, h: 12 },
        { x: 38, z: -32, r: 10, h: 12 },
      ],
      streams: [{ pts: [[-80, 48], [-30, 44], [20, 50], [80, 46]], w: 18, depth: 5 }],
    }),
    palette: PAL.coast,
    paths: [curve([[0, 30], [-10, 10], [-22, -8], [-26, -14]]), curve([[0, 30], [10, 10], [24, -10], [30, -20]]), curve([[0, 30], [-14, 30], [-26, 31]]), curve([[0, 30], [16, 30], [26, 34]])],
    water: -2.4,
    flats: [{ x: -26, z: -16, r: 5 }, { x: 30, z: -24, r: 4 }],
  },
  look: { ...LOOKS.morning, sunI: 3 },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#f4d060'],
    trees: [
      { kind: 'palm', area: { x: -24, z: 18, r: 6 }, count: 4 },
      { kind: 'fig', at: [[-20, 22], [-28, 14]] },
      { kind: 'pine', area: { x: -30, z: -28, r: 14 }, count: 6 },
      { kind: 'oak', area: { x: 0, z: 0, r: 50 }, count: 6 },
    ],
    rocks: [{ x: 30, z: -32, n: 10, big: 2, spread: 16 }, { x: -30, z: -26, n: 8, big: 1.6, spread: 14 }],
    pebbles: 40,
    rim: ['oak', 'pine'],
  },
  far: '#6e8a5a',
  mountains: { color: '#7a84a0', height: 1.3 },
  start: [0, 32],
  startYaw: Math.PI,
  structures: [
    { type: 'bed', x: -24, z: 18, w: 8, d: 6, color: '#6a9a3a' },
    { type: 'bed', x: -10, z: 18, w: 7, d: 5, color: '#a89a6a' },
    { type: 'dock', x: 22, z: 38, rot: 0, w: 2, d: 8 },
    { type: 'boat', x: 24, z: 44, rot: 0.3 },
    { type: 'wall', x: 14, z: 28, to: [20, 28], h: 1.4, color: '#b8a888' },
  ],
  welcome:
    'Welcome to the Four Realms. Surah Al-Kahf tells four stories: young men who sheltered in a cave, a man proud of his two gardens, a journey to where two seas meet, and a traveller who built a barrier. You will visit a place for each. Start at the cave in the hills.',
  tasks: [
    {
      id: 'cave',
      kind: 'read',
      at: [-22, -10],
      marker: 'lantern',
      title: 'The young men of the cave',
      goal: 'Walk up to the cave in the hills',
      reading: {
        title: 'Shelter and guidance',
        refs: [[18, 10], [18, 13]],
        note: 'Some young men who believed in their Lord took shelter in a cave and prayed: Our Lord, give us mercy from You and guide us rightly in our affair. They believed, and Allah increased them in guidance.',
      },
      adaptation: 'The cave is a quiet place made for this game and is empty. The young men and their dog are not shown.',
    },
    {
      id: 'sun',
      kind: 'sunpath',
      requires: ['cave'],
      title: 'The sun past the cave',
      goal: 'Turn the day-dial, and mark where the sunlight falls at sunrise and at sunset',
      intro: 'The dial beside the cave turns the day. At sunrise and at sunset, find where the sunlight falls near the cave mouth, stand in it, and set a marker stone.',
      adaptation: 'The dial, the light patches and the marker stones are game ideas. This is not a picture of the real cave.',
      cave: CAVE,
      caveYaw: 0,
      dial: [-20, -12],
      patches: [
        { label: 'morning light', at: [-21, -16], sun: [0.85, 0.18, 0.4] },
        { label: 'evening light', at: [-31, -16], sun: [-0.85, 0.15, 0.4] },
      ],
      reading: {
        title: 'Inclining away from their cave',
        refs: [[18, 17]],
        note: 'You would have seen the sun, when it rose, turning away from their cave to the right, and when it set, passing them by on the left, while they lay in an open space inside it. That was one of the signs of Allah.',
      },
      outro: 'Two stones, one on each side. The light passed by the cave mouth morning and evening, and never went in.',
    },
    {
      id: 'water',
      kind: 'points',
      requires: ['sun'],
      style: 'plant',
      verb: 'Water',
      title: 'The two gardens',
      goal: 'Water the vines and palms of the two gardens below the hills',
      intro: 'Two gardens lie side by side, with a stream between them. The surah tells of a man who owned two gardens like these, and forgot who gave them to him. Water each garden and read.',
      adaptation: 'Watering is a game idea. The two garden beds stand for the parable of 18:32-44; neither man is shown.',
      points: [
        { at: [-24, 13], label: 'the first garden', reading: { title: 'Two gardens', refs: [[18, 32], [18, 33]], note: 'Give them the example of two men. To one We gave two gardens of grapevines, bordered with palm trees, with crops between them. Each garden gave its fruit and did not fail in anything, and We made a river flow through them.' } },
        { at: [-10, 13], label: 'the second garden', reading: { title: 'This will never end', refs: [[18, 34], [18, 35]], note: 'He said to his friend: "I have more wealth than you, and more people." He went into his garden, wronging himself, and said: "I do not think this will ever end."' } },
      ],
    },
    {
      id: 'mashallah',
      kind: 'choice',
      requires: ['water'],
      at: [-17, 13],
      back: [-14, 22],
      marker: 'sign',
      title: 'What Allah willed',
      goal: 'Answer at the sign between the gardens',
      intro: 'His friend told him what he should have said when he walked into his garden. Think about what you say when you have something wonderful.',
      adaptation: 'The situations are everyday ones written for this game, not events from the surah.',
      scenes: [
        {
          text: 'You finish a beautiful drawing and everyone admires it.',
          options: [
            { text: '"Ma sha\' Allah: what Allah willed. There is no power except with Allah."', ok: true, reply: 'This is what the friend said the owner of the gardens should have said (18:39).' },
            { text: '"I am the best at drawing, and always will be."', ok: false, reply: 'The owner of the gardens thought his gardens would never end (18:35). Think again.' },
          ],
        },
        {
          text: 'A friend has fewer toys than you.',
          options: [
            { text: 'Share, and remember that everything you have is a gift.', ok: true, reply: 'Yes. Wealth is an adornment of this life; good deeds that last are better (18:46).' },
            { text: 'Tell them you have more than they do.', ok: false, reply: 'That is what the owner of the gardens said (18:34). Try again.' },
          ],
        },
      ],
      reading: { title: 'Like rain on the plants', refs: [[18, 39], [18, 42], [18, 45], [18, 46]], note: 'Why did you not say, when you entered your garden, "What Allah willed; there is no power except with Allah"? Then his fruit was ruined, and he wrung his hands. The life of this world is like rain that makes plants grow thick, and then they dry and are scattered by the wind. Good deeds that last are better with your Lord.' },
    },
    {
      id: 'seas',
      kind: 'read',
      requires: ['mashallah'],
      at: [18, 34],
      marker: 'lantern',
      title: 'Where two seas meet',
      goal: 'Go to the shore by the old dock',
      reading: {
        title: 'More than the sea could write',
        refs: [[18, 60], [18, 65], [18, 109]],
        note: 'Musa travelled to where the two seas meet, and there found a servant of Allah who had been given knowledge. The surah also says: if the sea were ink for the words of my Lord, the sea would run out before His words ran out.',
      },
      adaptation: 'Musa and al-Khidr are not shown. The boy in 18:74 and 18:80 is in no scene.',
    },
    {
      id: 'patience',
      kind: 'stand',
      requires: ['seas'],
      at: [22, 36],
      r: 1.6,
      secs: 10,
      style: 'plate',
      face: [24, 44],
      label: 'the end of the old dock',
      title: 'Wait without asking',
      goal: 'Stand still at the end of the dock and wait, without asking, until the time is up',
      intro: 'The servant of Allah told Musa: "You will not be able to be patient with me. If you follow me, do not ask me about anything until I tell you." Stand at the end of the dock, by the boat with a patched hole, and wait patiently.',
      adaptation: 'Waiting on the dock is a game idea about patience (18:67-70). The boat with a patch only recalls the boat in 18:71; Musa and al-Khidr are not shown.',
      reading: { title: 'Do not ask until I tell you', refs: [[18, 66], [18, 67], [18, 70], [18, 79]], note: 'Musa asked: "May I follow you, so you can teach me some of the right guidance you have been taught?" He said: "You will not be able to be patient with me. If you follow me, do not ask me about anything until I tell you about it." Later he explained the boat: it belonged to poor people who worked at sea, and he damaged it because a king was seizing every good boat.' },
    },
    {
      id: 'wall',
      kind: 'carry',
      requires: ['patience'],
      result: 'stone',
      title: 'The wall about to fall',
      goal: 'Carry stones to mend the low wall above the shore',
      intro: 'In a town that would not give them food, they found a wall about to fall down, and it was set right. Carry the stones and mend the low wall, asking nothing in return.',
      adaptation: 'Carrying stones is a game idea based on 18:77. The town, its people, Musa and al-Khidr are not shown; the treasure under the wall is not shown.',
      loads: [14.5, 16, 17.5, 19].map((x) => ({ from: [10, 24] as P2, to: [x, 28] as P2, item: 'stone' as const, label: 'stone', dest: 'onto the low wall', lift: 1.1 })),
      after: { title: 'A mercy from your Lord', refs: [[18, 77], [18, 82]], note: 'They found a wall about to fall, and he set it right. Musa said: "You could have asked for payment for it." The explanation: the wall belonged to two orphan boys of the town, and under it was a treasure for them. Their father had been righteous, so your Lord wanted them to grow up and take out their treasure, as a mercy from your Lord.' },
    },
    {
      id: 'barrier',
      kind: 'carry',
      requires: ['wall'],
      result: 'stone',
      title: 'The barrier',
      goal: 'Carry sheets of iron from the pile to fill the gap between the mountains',
      intro: 'Between the two mountain walls is a gap. Carry the sheets of iron from the pile and set them in the gap.',
      adaptation: 'Carrying iron is a game idea based on 18:96. Dhul-Qarnayn and the people who asked for help are not shown, and Ya\'juj and Ma\'juj are not pictured.',
      loads: [-3, -1.5, 0, 1.5, 3].map((d) => ({ from: [26, -12] as P2, to: [GAP[0] + d, GAP[1]] as P2, item: 'plank' as const, label: 'sheet of iron', color: '#6a6a72', dest: 'into the gap' })),
      after: {
        title: 'Bring me sheets of iron',
        refs: [[18, 96]],
        note: 'He said: bring me sheets of iron. When he had filled the gap between the two mountain walls, he had the fire blown upon it, and poured molten copper over it.',
      },
    },
  ],
  finale: {
    title: 'Four journeys',
    body: [
      'You watched the sunlight pass the cave by, watered the two gardens, waited patiently where two seas meet, mended a wall, and helped fill the gap in the mountains.',
      'Al-Kahf is often read on Fridays. Its stories are about faith, humility, learning and using strength to help others.',
    ],
    ref: [18, 46],
    questions: ['Which of the four places would you visit again, and why?', 'What is a good deed that lasts?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown. Musa and al-Khidr are never pictured, and neither is Dhul-Qarnayn.',
    'The young men of the cave and their dog are not shown; the cave is empty.',
    'The boy in 18:74 and 18:80 is in no scene.',
    "Ya'juj and Ma'juj are not pictured.",
  ],
};
