// Surah 49, Al-Hujurat (The Rooms): the Village of the Rumour. A busy
// village of the game's own with a well, a bridge, a bakery and a goat pen
// around a square with a notice board. The core play: a rumour is going
// round, made of four claims. Check each claim at its source (look into the
// well, at the bridge, in the oven, at the pen), then mark each true or not
// true on the notice board. A claim you have not checked cannot be passed
// on (49:6, "investigate, lest you harm a people out of ignorance"). Then
// choices on mocking and suspicion (49:11-12) and readings on peace and
// knowing one another (49:10, 49:13). The village is fictional; no one is
// shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W049: WorldDef = {
  surah: 49,
  name: 'The Village of the Rumour',
  theme: 'Check every claim yourself before you pass it on',
  play: 'A rumour is going round the village, made of four claims. Go and check each claim where it can be seen (the well, the bridge, the bakery oven, the goat pen), then mark each one true or not true on the notice board. You cannot pass on a claim you have not checked.',
  seed: 4949,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.2, seed: 49, streams: [{ pts: [[-46, -14], [-20, -18], [0, -20], [20, -16], [46, -22]], w: 4, depth: 2.4 }] }),
    water: -1.2,
    shore: '#d8c8a0',
    palette: PAL.meadow,
    paths: [curve([[0, 40], [0, 24], [0, 6]]), curve([[0, 6], [-16, 8], [-22, 12]]), curve([[0, 6], [16, 6], [22, 10]]), curve([[0, 6], [0, -10], [0, -26]])],
    flats: [{ x: 0, z: 6, r: 7, paint: '#e8dcc4' }, { x: -22, z: 12, r: 4 }, { x: 22, z: 10, r: 5 }, { x: -10, z: 24, r: 3 }],
  },
  look: { ...LOOKS.morning, birds: true },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#e8c0e0'],
    trees: [{ kind: 'fig', at: [[-8, 14], [10, 16], [-26, 26]] }, { kind: 'olive', area: { x: 24, z: 28, r: 8 }, count: 4 }],
    rocks: [{ x: -30, z: -32, n: 4, big: 1, spread: 6 }],
    pebbles: 18,
    rim: ['olive', 'fig'],
  },
  far: '#90b078',
  mountains: { color: '#9aa0b8', height: 0.8 },
  start: [0, 40],
  startYaw: Math.PI,
  structures: [
    { type: 'well', x: -10, z: 24 },
    { type: 'bridge', x: 0, z: -15, to: [0, -25] },
    { type: 'house', x: -24, z: 14, w: 4, d: 4, h: 3, rot: 0.9, color: '#e8d8b8' },
    { type: 'dome', x: -20, z: 8, w: 2.4, d: 2.4, h: 2, color: '#c8a888' },
    { type: 'pen', x: 23, z: 12, w: 6, d: 5 },
    { type: 'house', x: 14, z: -2, w: 4, d: 4, h: 3, rot: -0.4, color: '#e0d0b0' },
  ],
  welcome:
    'Welcome to the Village of the Rumour. Surah Al-Hujurat teaches good manners between people. Today a rumour is going round the village. Before you pass anything on, find out whether it is true.',
  tasks: [
    {
      id: 'check',
      kind: 'read',
      at: [3, 30],
      marker: 'sign',
      title: 'Investigate first',
      goal: 'Read at the sign on the path into the village',
      reading: { title: 'Find out first', refs: [[49, 6]], note: 'O you who believe, if someone untrustworthy brings you news, find out whether it is true, so that you do not harm people without knowing, and then regret what you have done.' },
    },
    {
      id: 'rumour',
      kind: 'rumour',
      requires: ['check'],
      board: [4, 8],
      title: 'The rumour',
      goal: 'Check each claim at its source, then mark them on the notice board in the square',
      intro: 'Everyone is saying: "The well has gone dry, a plank on the bridge is loose, the baker’s oven is broken so there is no bread, and the goats have got out!" Which of these is true? Go and look.',
      adaptation: 'The village and the rumour are a game written for this app to practise 49:6. They are not events in the Quran.',
      claims: [
        { text: 'The well has gone dry.', at: [-8, 22], look: 'Look down into the well', seen: 'The well is full of water. Someone saw an empty bucket, that is all.', true: false },
        { text: 'A plank on the bridge is loose.', at: [2, -13], look: 'Check the planks of the bridge', seen: 'Yes: one plank is loose. People should step carefully until it is mended.', true: true },
        { text: 'The baker’s oven is broken, so there is no bread.', at: [-18, 10], look: 'Look into the bakery oven', seen: 'The oven is warm and full of bread. The baker was only late this morning.', true: false },
        { text: 'The goats have got out of their pen.', at: [20, 8], look: 'Look into the goat pen', seen: 'The gate is open and the pen is empty: the goats really are out.', true: true },
      ],
      outro: 'Every claim is checked and marked. Two were true, and two were not: passing them all on would have harmed people for nothing.',
      after: { title: 'Find out first', refs: [[49, 6]], note: 'Find out whether news is true, so that you do not harm people without knowing, and then regret what you have done.' },
    },
    {
      id: 'manners',
      kind: 'choice',
      requires: ['rumour'],
      at: [-5, 4],
      back: [-6, 12],
      marker: 'sign',
      title: 'No mocking, no suspicion',
      goal: 'Answer the situations at the sign in the square',
      intro: 'The surah teaches: do not mock others, do not call people names, avoid suspicion, do not spy or speak badly of people behind their backs.',
      adaptation: 'The situations are everyday ones written for this game.',
      scenes: [
        {
          text: 'A new child at school talks differently, and some friends start laughing at them.',
          options: [
            { text: 'Laugh along so you fit in.', ok: false, reply: '"Let not some people mock others; perhaps they are better than them" (49:11). Think again.' },
            { text: 'Say hello to the new child and sit with them.', ok: true, reply: 'Yes. The surah forbids mocking, and they may well be better than those who mock.' },
          ],
        },
        {
          text: 'Your pencil is missing, and you think the child next to you took it.',
          options: [
            { text: 'Look for it first, and do not accuse anyone.', ok: true, reply: 'Yes: "Avoid much suspicion; some suspicion is a sin" (49:12). It may just have rolled away.' },
            { text: 'Tell everyone they took it.', ok: false, reply: 'You have not found out yet. The surah says to avoid suspicion. Try again.' },
          ],
        },
        {
          text: 'Friends are talking about someone who is not there, saying unkind things.',
          options: [
            { text: 'Change the subject, or say something kind about them.', ok: true, reply: 'Yes. The surah tells us not to speak badly of people behind their backs (49:12).' },
            { text: 'Add an unkind story of your own.', ok: false, reply: 'That is backbiting, which the surah forbids. Think of a kinder answer.' },
          ],
        },
      ],
      reading: { title: 'Good manners', refs: [[49, 11], [49, 12]], note: 'Do not mock other people: they may be better than you. Do not insult one another or call each other by bad names. Avoid much suspicion, for some suspicion is a sin. Do not spy, and do not speak badly of one another behind their backs.' },
    },
    {
      id: 'peace',
      kind: 'read',
      requires: ['manners'],
      at: [5, -6],
      marker: 'lantern',
      title: 'Make peace',
      goal: 'Read at the lantern on the way to the bridge',
      reading: { title: 'Brothers and sisters', refs: [[49, 10]], note: 'The believers are brothers, so make peace between your brothers, and be mindful of Allah so that you may receive mercy.' },
    },
    {
      id: 'know',
      kind: 'read',
      requires: ['peace'],
      at: [-4, -28],
      marker: 'tablet',
      title: 'To know one another',
      goal: 'Read at the tablet across the bridge',
      reading: { title: 'Peoples and tribes', refs: [[49, 13]], note: 'O people, We created you from a male and a female, and made you peoples and tribes so that you may know one another. The most noble of you with Allah is the most mindful of Him.' },
    },
  ],
  finale: {
    title: 'Checked before passed on',
    body: ['You checked every claim with your own eyes before you passed anything on, and two of the four were not true.', 'Surah Al-Hujurat teaches us to find out first, to avoid mocking and suspicion, and to make peace.'],
    ref: [49, 6],
    questions: ['What would have happened if you had passed on the whole rumour?', 'How can you check something before you share it?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet Muhammad, peace be upon him, is never shown.', 'The village and the rumour are fictional.'],
};
