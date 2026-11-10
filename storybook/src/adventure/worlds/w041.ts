// Surah 41, Fussilat: the Hilltop of Signs. A grassy hill with a telescope
// on top, wide open land all round: firm mountains on one side, a bare,
// still slope on another, the sun and the moon both in the sky. The core
// play: turn the telescope until each sign the surah names is in the lens
// (41:10, 41:37, 41:39), note it, and read what the surah says of it; the
// bare slope greens once noted, as the earth "quivers and grows" when rain
// comes. Last, the signs "within themselves" (41:53) are a quiet reading.
// Then a short choice about answering harm with good (41:34).
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W041: WorldDef = {
  surah: 41,
  name: 'The Hilltop of Signs',
  theme: 'Turn a telescope to find the signs on the horizons, and then the signs within ourselves',
  play: 'From a telescope on the hilltop, turn left and right until each sign is in the lens: the sun, the moon, the firm mountains and the still, bare earth. Note each one; the bare slope turns green. Then lower the telescope for the signs within ourselves.',
  seed: 4141,
  ground: {
    radius: 48,
    base: rolling({ radius: 48, amp: 1.4, seed: 41, shapes: [{ x: 0, z: -2, r: 12, h: 4 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 40], [2, 24], [4, 12], [1, 2]]), curve([[2, 24], [-14, 22], [-22, 20]])],
    flats: [{ x: 0, z: -2, r: 3.5 }, { x: -10, z: 26, r: 4, paint: '#e8dcc4' }],
  },
  look: { ...LOOKS.morning, sunI: 3, birds: true },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#e8c0e0', '#c0d8f0'],
    trees: [{ kind: 'olive', area: { x: 14, z: 26, r: 8 }, count: 4 }, { kind: 'oak', at: [[-6, 34], [10, 12]] }],
    rocks: [{ x: 22, z: -18, n: 4, big: 1, spread: 6 }],
    pebbles: 20,
    rim: ['oak', 'olive'],
  },
  far: '#8aa870',
  mountains: { color: '#8a90a8', height: 0.8 },
  start: [0, 40],
  startYaw: Math.PI,
  structures: [{ type: 'bench', x: -10, z: 26, rot: 0.3 }],
  welcome:
    'Welcome to the Hilltop of Signs. Surah Fussilat means "explained in detail". It asks us to look at the signs around us: the sky, the earth, the mountains, the rain. Climb the hill to the telescope.',
  tasks: [
    {
      id: 'book',
      kind: 'read',
      at: [3, 30],
      marker: 'sign',
      title: 'A Book explained in detail',
      goal: 'Read at the sign on the path up the hill',
      reading: { title: 'Explained in detail', refs: [[41, 2], [41, 3]], note: 'A revelation from the Most Merciful, the Especially Merciful: a Book whose verses are explained in detail, an Arabic Quran for people who know.' },
    },
    {
      id: 'horizons',
      kind: 'scope',
      requires: ['book'],
      at: [0, -2],
      title: 'Signs on the horizons',
      goal: 'At the telescope on the hilltop, turn until each sign is in the lens and note it',
      intro: 'The surah says: "We will show them Our signs in the horizons and within themselves." Use the telescope. Turn it a little at a time; when a sign is in the lens, note it.',
      adaptation: 'The telescope and the hilltop are a game idea. The signs (the sun, the moon, the mountains, the earth after rain) are those the surah names in 41:10, 41:37 and 41:39.',
      signs: [
        { at: [-40, -26], name: 'the sun', shape: 'sun', reading: { title: 'The sun and the moon', refs: [[41, 37]], note: 'Among His signs are the night and the day, the sun and the moon. Do not bow down to the sun or the moon: bow down to Allah, who created them.' } },
        { at: [-14, 26], name: 'a bare, still slope', shape: 'slope', reading: { title: 'The earth after rain', refs: [[41, 39]], note: 'Among His signs: you see the earth still and bare, and when He sends rain down on it, it stirs and grows. The One who gives it life can give life to the dead.' } },
        { at: [32, 22], name: 'the firm mountains', shape: 'mountain', reading: { title: 'Firm mountains', refs: [[41, 10]], note: 'He placed firm mountains on the earth, blessed it, and measured out in it the food for all that live on it.' } },
        { at: [36, -30], name: 'the moon in the day sky', shape: 'moon', reading: { title: 'Created, not to be worshipped', refs: [[41, 37]], note: 'The moon is a sign too, but it is created. We bow down only to Allah, who created the sun and the moon.' } },
      ],
      within: { title: 'Within themselves', refs: [[41, 53]], note: 'We will show them Our signs on the horizons and within themselves, until it is clear to them that it is the truth. Think of your own eyes that see, your breath, your heartbeat: signs no telescope can show.' },
      outro: 'You found the signs on the horizon, and thought about the signs within yourself.',
    },
    {
      id: 'better',
      kind: 'choice',
      requires: ['horizons'],
      at: [-9, 24],
      back: [-6, 30],
      marker: 'sign',
      title: 'Answer with what is better',
      goal: 'Answer the situations at the bench below the hill',
      intro: 'The surah teaches: "The good deed and the bad are not equal. Answer bad with what is better."',
      adaptation: 'The situations are everyday ones written for this game, not events from the surah.',
      scenes: [
        {
          text: 'Someone in your class says something unkind about your drawing.',
          options: [
            { text: 'Say something unkind about their drawing too.', ok: false, reply: 'That makes two unkind things instead of one. The surah says to answer with what is better.' },
            { text: 'Stay calm, and later say something kind to them.', ok: true, reply: 'Yes: "Answer bad with what is better, and the one with enmity may become like a close friend" (41:34).' },
          ],
        },
        {
          text: 'A friend forgot to share with you, and now asks you to share with them.',
          options: [
            { text: 'Share anyway, with a smile.', ok: true, reply: 'That is answering with what is better. It takes patience, and the surah says only the patient are given it (41:35).' },
            { text: 'Say no, so they learn how it feels.', ok: false, reply: 'Getting even keeps the bad going. Think of a better answer.' },
          ],
        },
      ],
      reading: { title: 'Answer with what is better', refs: [[41, 34], [41, 35]], note: 'The good deed and the bad are not equal. Answer bad with what is better, and the one between you and whom there was enmity will become like a close friend. Only the patient are given this.' },
    },
  ],
  finale: {
    title: 'Signs everywhere',
    body: ['You turned the telescope to the sun, the moon, the mountains and the earth after rain, and thought about the signs within yourself.', 'Surah Fussilat says these signs show the truth, and teaches us to answer bad with what is better.'],
    ref: [41, 53],
    questions: ['Which sign surprised you the most?', 'What is one sign "within yourself" you can think of?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The sun and the moon are shown only as created things, with the ayah that says not to bow to them.', 'No angels are shown (41:30-31 is not pictured).'],
};
