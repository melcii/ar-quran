// Surah 19, Maryam: the Quiet Grove. A still palm grove with a little
// stream, a prayer niche and a pavilion facing the sunrise. The core play is
// answering without words: each question is answered by pointing at
// something in the world, recalling the vow not to speak and the pointing in
// 19:26-29. Then the surah's "mention in the Book" passages: Ibrahim and his
// father (gentle words at a signpost), Musa (a reading), Ismail (keeping
// promises in the grove) and Idris (a reading). No prophet is ever shown;
// the grove is a quiet place, and no one is pictured in it.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W019: WorldDef = {
  surah: 19,
  name: 'The Quiet Grove',
  theme: 'Answer without words: point to what the story speaks of',
  play: 'A quiet world played by pointing only. Each question is answered by pointing at something in the grove (tap it from where you stand), never by choosing words.',
  seed: 1919,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 2, seed: 19, shapes: [{ x: 18, z: -14, r: 10, h: 1.5 }] }),
    palette: PAL.coast,
    paths: [curve([[0, 40], [0, 24], [-6, 10], [-14, -2], [-16, -14]]), curve([[0, 24], [10, 8], [18, -10]])],
    flats: [{ x: -16, z: -16, r: 4, paint: '#e8dcc4' }, { x: 20, z: -12, r: 4, paint: '#e8dcc4' }],
  },
  look: { ...LOOKS.blossom, sunI: 2.9, birds: true },
  veg: {
    grass: 1.1,
    flowers: ['#fff2d8', '#e8c0e0'],
    trees: [{ kind: 'palm', area: { x: 0, z: 0, r: 30 }, count: 8 }, { kind: 'olive', area: { x: -20, z: 20, r: 10 }, count: 3 }],
    rocks: [{ x: 0, z: -24, n: 5, big: 1.2, spread: 12 }],
    pebbles: 30,
    rim: ['palm', 'olive'],
  },
  far: '#7a9a5a',
  mountains: { color: '#8a90b0', height: 0.9 },
  start: [0, 38],
  startYaw: Math.PI,
  structures: [{ type: 'bench', x: 4, z: 18, rot: Math.PI / 2 }],
  welcome:
    'Welcome to the Quiet Grove. In this world you answer without words. When a question comes, look around and point: tap the thing that answers it. Surah Maryam is a surah of mercy, of quiet prayers and of patience. Walk in and listen.',
  tasks: [
    {
      id: 'quiet',
      kind: 'point',
      title: 'Answers without words',
      goal: 'Read each question, then point at the answer in the grove',
      intro: 'Look around the grove: a prayer niche, a pavilion facing the sunrise, a little stream and a tall palm. Each question has its answer somewhere here. Point to it.',
      adaptation: 'Answering by pointing is a game idea that recalls 19:26-29. The grove is a quiet place made for this game; no one in the story is pictured in it.',
      things: [
        { at: [-16, -16], label: 'prayer niche', model: 'niche' },
        { at: [20, -12], label: 'pavilion facing the sunrise', model: 'pavilion' },
        { at: [-4, 0], label: 'little stream', model: 'stream' },
        { at: [6, -2], label: 'tall palm', model: 'palm' },
      ],
      asks: [
        { prompt: 'Where would someone go to call on their Lord quietly, in private?', thing: 0, yes: 'Yes. Zakariyya called on his Lord in a quiet, private prayer, though he was old.', no: 'Not there. Look for a quiet place made for prayer.', reading: { title: 'A private prayer', refs: [[19, 2], [19, 3], [19, 4]], note: 'This is a mention of the mercy of your Lord to His servant Zakariyya, when he called to his Lord in a private prayer: My Lord, my bones are weak and my hair is white, but I have never been disappointed in praying to You.' } },
        { prompt: 'Which place faces the sunrise, toward the east?', thing: 1, yes: 'Yes. Maryam went apart from her family to a place toward the east.', no: 'Not that one. Which way does the sun rise?', reading: { title: 'A place toward the east', refs: [[19, 16]], note: 'Mention in the Book Maryam, when she withdrew from her family to a place toward the east.' } },
        { prompt: 'What was given below, to drink?', thing: 2, yes: 'Yes. A stream was given below, to drink.', no: 'Not that. Look for water.', reading: { title: 'A stream below', refs: [[19, 24]], note: 'She was told: Do not grieve; your Lord has placed a stream beneath you.' } },
        { prompt: 'What gave fresh, ripe dates when it was shaken?', thing: 3, yes: 'Yes. Shaking the trunk of the palm brought down fresh, ripe dates.', no: 'Not that. Look up high, where fruit hangs.', reading: { title: 'Fresh, ripe dates', refs: [[19, 25], [19, 26]], note: 'Shake the trunk of the palm toward you, and it will drop fresh, ripe dates. So eat and drink and be glad. And if you see anyone, say: I have promised the Most Merciful to fast from speaking, so I will not speak to anyone today.' } },
      ],
      outro: 'Four answers, and not one word spoken.',
    },
    // "Mention in the Book": Ibrahim and his father, then Musa, Ismail and Idris (19:41-58).
    {
      id: 'father',
      kind: 'choice',
      requires: ['quiet'],
      at: [-12, 22],
      back: [-4, 30],
      marker: 'sign',
      title: 'O my father',
      goal: 'Answer the situations at the signpost by the olive trees',
      intro: 'Surah Maryam tells how Ibrahim spoke to his father: four times he began with "O my father", gently, even though his father would not listen. Think about how you speak to someone you love when you disagree.',
      adaptation: 'The situations are everyday ones written for this game, not events from the surah. Ibrahim and his father are not shown.',
      scenes: [
        {
          text: 'Your father wants to do something you have learned is wrong. You want to tell him.',
          options: [
            { text: 'Shout that he is wrong in front of everyone.', ok: false, reply: 'Even when he was right, Ibrahim began each time with "O my father", gently (19:42-45). Try again.' },
            { text: 'Wait for a quiet moment and say kindly what you learned.', ok: true, reply: 'Yes. Ibrahim spoke with respect and care, and shared what he knew.' },
          ],
        },
        {
          text: 'You explained kindly, but your parent is upset and tells you to go away for a while.',
          options: [
            { text: 'Say "Peace be upon you", and pray for them.', ok: true, reply: 'This is what Ibrahim answered: "Peace be upon you. I will ask my Lord to forgive you" (19:47).' },
            { text: 'Say something hurtful back.', ok: false, reply: 'A hurtful answer closes the door. Think again: what did Ibrahim say?' },
          ],
        },
      ],
      reading: { title: 'Peace be upon you', refs: [[19, 42], [19, 43], [19, 47]], note: 'Ibrahim said: "O my father, why do you worship what does not hear and does not see and cannot help you at all? O my father, knowledge has come to me that has not come to you, so follow me; I will guide you to an even path." When his father refused, he said: "Peace be upon you. I will ask my Lord to forgive you; He is ever kind to me."' },
    },
    {
      id: 'peace',
      kind: 'read',
      requires: ['father'],
      at: [6, 16],
      marker: 'lantern',
      title: 'Affection in the hearts',
      goal: 'Read at the lantern by the bench',
      reading: {
        title: 'Peace, and affection',
        refs: [[19, 48], [19, 96]],
        note: 'Ibrahim said: "I will leave you and what you call on besides Allah, and I will call on my Lord." And for those who believe and do good, the Most Merciful will place affection in people\'s hearts.',
      },
    },
    {
      id: 'musa',
      kind: 'read',
      requires: ['peace'],
      at: [24, 2],
      marker: 'tablet',
      title: 'Musa',
      goal: 'Read the stone at the foot of the hill',
      reading: { title: 'Called from the side of the mount', refs: [[19, 51], [19, 52], [19, 53]], note: 'And mention in the Book Musa. He was chosen, a messenger and a prophet. We called him from the right side of the mount and brought him near, speaking to him. And by Our mercy We gave him his brother Harun as a prophet.' },
    },
    {
      id: 'ismail',
      kind: 'promise',
      requires: ['musa'],
      at: [14, 24],
      title: 'True to his promise',
      goal: 'Make the two promises at the board, then keep each one before its candle burns down',
      intro: 'Ismail was true to his promise. Two notes on the board ask for help in the grove. Promise, then keep your word.',
      adaptation: 'The notes, candles and time limits are a game idea about keeping promises (19:54). Ismail is not shown.',
      promises: [
        { label: 'fill the birds\' water bowl at the stream', at: [-2, 2], verb: 'Fill the water bowl', secs: 120, done: 'The birds have water.' },
        { label: 'sweep the step of the prayer niche', at: [-14, -12], verb: 'Sweep the step', secs: 170, done: 'The step is swept clean.' },
      ],
      after: { title: 'True to his promise', refs: [[19, 54], [19, 55]], note: 'And mention in the Book Ismail. He was true to his promise, a messenger and a prophet. He used to tell his family to pray and to give zakah, and his Lord was pleased with him.' },
    },
    {
      id: 'idris',
      kind: 'read',
      requires: ['ismail'],
      at: [-24, 4],
      marker: 'lantern',
      title: 'Idris, and those given favour',
      goal: 'Read at the lantern on the west side of the grove',
      reading: { title: 'A man of truth', refs: [[19, 56], [19, 57], [19, 58]], note: 'And mention in the Book Idris. He was a man of truth and a prophet, and We raised him to a high station. These are the prophets Allah favoured: when the verses of the Most Merciful were recited to them, they fell down in prostration, weeping.' },
    },
  ],
  finale: {
    title: 'Quiet mercy',
    body: ['You answered every question without a word, by looking and pointing.', 'Surah Maryam is full of quiet prayers answered, and of mercy from the Most Merciful.'],
    ref: [19, 96],
    questions: ['When is it better to be quiet than to speak?', 'How did Ibrahim speak to his father when they disagreed?', 'Which promise will you keep this week?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown: Zakariyya, Yahya, Isa, Ibrahim, Musa, Harun, Ismail and Idris never appear.',
    'Maryam is never pictured; the palm and the stream are a quiet place with no one in it.',
    'Answering by pointing is a game idea.',
  ],
};
