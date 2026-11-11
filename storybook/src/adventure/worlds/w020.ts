// Surah 20, Ta-Ha: the Far Light. Dark hills at night, and far away on a
// mountain a light is burning. The core play is keeping the light in view
// (20:10): the hills in between hide it from the hollows and show it from
// the heights, and cairns may only be built where it can be seen. The player
// never reaches the light. Musa, his family and Harun are never shown, and
// what happened at the light (20:11-14) is read, not pictured. Then morning
// comes and the story goes on: the chest on the river (a reading; it is
// played in Al-Qasas), gentle words to Pharaoh, the festival ground where
// ropes only seem to move from far away (20:66), the dry path across the sea
// inlet (20:77-82), the calf (a sorting game from 20:88-91; the calf is not
// shown), and Adam (an ordering game; the Garden is unseen and not pictured).
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const NIGHT = { ...LOOKS.dusk, zen: '#10183a', mid: '#25305e', hor: '#4a4a78', sunI: 0.6, sunColor: '#9aa4d8', hemiI: 0.85, hemiSky: '#56649c', stars: 1, fogDensity: 0.006, fog: '#323a5e', birds: false, clouds: 0.3 };

export const W020: WorldDef = {
  surah: 20,
  name: 'The Far Light',
  theme: 'Cross the dark hills, keeping a far light in view',
  play: 'A night of hills. A light burns far away, and the hills hide it from the hollows. Find the high places where it can be seen and build a cairn at each, so the way keeps the light in view. Cairns are refused where the light is hidden.',
  seed: 2020,
  ground: {
    radius: 60,
    base: rolling({
      radius: 60,
      amp: 2,
      seed: 20,
      shapes: [
        { x: 0, z: -50, r: 12, h: 9 },
        { x: -14, z: 24, r: 10, h: 8 },
        { x: 13, z: 22, r: 9, h: 7 },
        { x: 0, z: 2, r: 12, h: 11 },
        { x: -18, z: -22, r: 10, h: 9 },
        { x: 18, z: -22, r: 10, h: 9 },
        { x: -4, z: 12, r: 6, h: -2 },
        { x: 8, z: -10, r: 6, h: -2 },
        // The sea inlet in the west, with a dry path across it (20:77).
        { x: -38, z: 4, r: 15, h: -9 },
        ...[-10, -7, -4, -1, 2, 5, 8, 11, 14, 17].map((z) => ({ x: -38, z, r: 3.4, h: 8 })),
      ],
    }),
    water: -4.5,
    shore: '#d8c8a0',
    palette: PAL.dry,
    paths: [
      curve([[0, 48], [-3, 32], [-12, 25], [-3, 12], [0, 3], [10, -10], [17, -20]]),
      curve([[8, 40], [22, 30], [34, 16]]),
      // Around the mountain, not over it, and clear of the two hollows: festival ground to the mountain path, and the mountain path to the lagoon.
      curve([[30, 4], [24, -2], [19, -8]]),
      curve([[-7.5, 18.5], [-14, 10], [-26, 14], [-38, 20]]),
      curve([[-38, -12], [-30, -24], [-24, 30], [-12, 40], [-3, 44]]),
    ],
    flats: [{ x: 0, z: 44, r: 4 }, { x: 36, z: 10, r: 10, paint: '#e2cca0' }, { x: -26, z: 32, r: 5 }],
  },
  look: NIGHT,
  veg: {
    grass: 0.5,
    dryGrass: true,
    flowers: ['#e8e0c8'],
    trees: [{ kind: 'olive', area: { x: 0, z: 0, r: 40 }, count: 8 }, { kind: 'cypress', at: [[-24, 36], [24, 34]] }],
    rocks: [{ x: 0, z: -10, n: 10, big: 1.4, spread: 30 }],
    pebbles: 30,
    rim: ['olive', 'cypress'],
  },
  far: '#3a4060',
  mountains: { color: '#3a4270', height: 1.2 },
  start: [0, 46],
  startYaw: Math.PI,
  structures: [
    // The festival ground (20:59): a terrace with banners, open on every side.
    { type: 'festoon', x: 28, z: 4, to: [44, 4], h: 3.6 },
    { type: 'festoon', x: 28, z: 16, to: [44, 16], h: 3.6 },
    { type: 'columns', x: 46, z: 10, w: 10, n: 4, rot: Math.PI / 2, color: '#e2cca0' },
    { type: 'stones', x: -26, z: 32, n: 5 },
  ],
  // Morning comes once the night's chapters are done: the festival day, at mid-morning (20:59).
  looks: [{ after: 'gentle', look: { ...LOOKS.morning, sunI: 3.1 } }],
  welcome:
    'Welcome to the Far Light. It is night in the hills. Far away, on a mountain, a light is burning, but the hills in between hide it from the low places. Surah Ta-Ha begins the story of Musa with a light seen at night. Read at the lantern first.',
  tasks: [
    {
      id: 'story',
      kind: 'read',
      at: [3, 41],
      marker: 'lantern',
      title: 'A fire seen at night',
      goal: 'Read at the lantern by the start',
      reading: {
        title: 'Has the story of Musa reached you?',
        refs: [[20, 9], [20, 10]],
        note: 'Musa saw a fire far away at night. He told his family to stay where they were: perhaps he could bring them a burning torch from it, or find some guidance at the fire.',
      },
      adaptation: 'Musa and his family are not shown. The night hills are a place made for this game.',
    },
    {
      id: 'light',
      kind: 'beacon',
      requires: ['story'],
      title: 'Keep the light in view',
      goal: 'Build a cairn on each high place where the far light can be seen',
      intro: 'Look for the far light. Down in the hollows the hills hide it; up on the heights you can see it again. Build a cairn only where you can see the light, so the cairns mark a way that keeps it in view.',
      adaptation: 'The far light, the hills and the cairns are game ideas. You never reach the light and nothing at it is shown; what happened there (20:11-14) is read only.',
      light: [0, -50],
      lightY: 3,
      // From the hill tops the light is in view; from the hollows it is hidden (checked with the line-of-sight probe).
      piles: [[-3, 32], [-15, 24], [13, 22], [3, 14], [0, 2], [22, -15], [18, -22]],
      need: 3,
      reading: {
        title: 'At the fire',
        refs: [[20, 11], [20, 12], [20, 13], [20, 14]],
        note: 'When Musa came to the fire, he was called: his Lord told him to take off his sandals, for he was in the sacred valley of Tuwa, that He had chosen him, and that he should worship Him and pray to remember Him.',
      },
    },
    {
      id: 'helper',
      kind: 'read',
      requires: ['light'],
      at: [-6, 30],
      marker: 'sign',
      title: 'A prayer for help',
      goal: 'Read at the sign on the way back',
      reading: {
        title: 'Ease my task',
        refs: [[20, 25], [20, 26], [20, 27], [20, 28], [20, 29], [20, 30], [20, 31], [20, 32]],
        note: 'Musa asked his Lord to open his heart, to make his task easy, to loosen the knot from his tongue so that people would understand him, and to give him his brother Harun as a helper.',
      },
      adaptation: 'Musa and Harun are not shown.',
    },
    {
      id: 'chest',
      kind: 'read',
      requires: ['helper'],
      at: [10, 42],
      marker: 'tablet',
      title: 'The chest on the river',
      goal: 'Read the stone near the start',
      reading: { title: 'Another favour', refs: [[20, 37], [20, 38], [20, 39], [20, 40]], note: 'Allah reminded Musa of a favour from long before: his mother was inspired to put him in a chest and set it on the river, and the river carried it to the bank. His sister followed and offered to find someone to care for him, and so he was returned to his mother, so that she would be glad and not grieve. The chest on the river is played in full in the world of Surah Al-Qasas.' },
    },
    {
      id: 'gentle',
      kind: 'choice',
      requires: ['chest'],
      at: [8, 36],
      back: [4, 44],
      marker: 'lantern',
      title: 'Gentle words',
      goal: 'Answer the situations at the lantern near the start',
      intro: 'Musa and Harun were sent to Pharaoh, who had gone far beyond all limits, and they were told to speak to him gently. Think about how you would speak to someone who has done wrong.',
      adaptation: 'The situations are everyday ones written for this game, not events from the surah. Musa, Harun and Pharaoh are not shown.',
      scenes: [
        {
          text: 'An older child keeps pushing the little ones off the swing. You want them to stop.',
          options: [
            { text: 'Shout insults so they feel bad.', ok: false, reply: 'Even to Pharaoh, Musa and Harun were told to speak gently (20:44). Harsh words close hearts. Try again.' },
            { text: 'Tell them calmly and clearly that it is unfair, and ask them to stop.', ok: true, reply: 'Yes: clear and gentle, so that they might think again.' },
          ],
        },
        {
          text: 'You feel scared to speak up.',
          options: [
            { text: 'Remember that Allah hears and sees, ask Him for help, and speak.', ok: true, reply: 'Allah told Musa and Harun: "Do not fear. I am with you both; I hear and I see" (20:46).' },
            { text: 'Say nothing and hope it stops by itself.', ok: false, reply: 'Think again. What did Musa ask for when his task felt hard (20:25-28)?' },
          ],
        },
      ],
      reading: {
        title: 'Speak gently',
        refs: [[20, 43], [20, 44], [20, 46]],
        note: 'Musa and Harun were sent to Pharaoh, who had gone too far, and told to speak to him with gentle words, so that he might remember or take care. Allah told them: do not be afraid, I am with you both, hearing and seeing.',
      },
    },
    // Morning: the festival ground (20:56-73).
    {
      id: 'festival',
      kind: 'read',
      requires: ['gentle'],
      at: [26, 12],
      marker: 'sign',
      title: 'The day of the festival',
      goal: 'Read the sign at the edge of the festival ground, east of the hills',
      intro: 'Morning has come. Pharaoh called Musa\'s signs magic and gathered his magicians. The meeting was set for the festival day, when the people gather at mid-morning.',
      reading: { title: 'An appointment', refs: [[20, 56], [20, 58], [20, 59]], note: 'Allah showed Pharaoh all His signs, but he denied them and refused. Pharaoh said he would bring magic like it, and asked for a meeting. Musa said: "Your appointment is the day of the festival, when the people gather at mid-morning."' },
    },
    {
      id: 'ropes',
      kind: 'shimmer',
      requires: ['festival'],
      title: 'What only seems to move',
      goal: 'Walk up to each rope and staff on the festival ground and look closely',
      intro: 'Ropes and staffs lie on the festival ground in the heat. From far away they seem to wriggle. Walk right up to each one and look closely.',
      adaptation: 'The wriggling in the heat is only this game\'s picture of an illusion. In the Quran, the magicians\' ropes and staffs seemed to move because of their magic (20:66). Musa, the magicians and Pharaoh are not shown, and nothing is shown of Musa\'s staff or of what Allah made it do (20:69).',
      near: 2.6,
      things: [
        { at: [32, 6], kind: 'rope' },
        { at: [38, 8], kind: 'staff', rot: 0.4 },
        { at: [42, 12], kind: 'rope', rot: 2 },
        { at: [34, 14], kind: 'staff', rot: 1.2 },
        { at: [38, 2], kind: 'rope', rot: 0.9 },
      ],
      after: { title: 'The trick does not succeed', refs: [[20, 66], [20, 68], [20, 69]], note: 'Their ropes and staffs seemed to Musa, because of their magic, to be moving. Allah said: "Do not fear; you will be uppermost. Throw what is in your right hand; it will swallow up what they have made. What they made is only a magician\'s trick, and the magician will not succeed wherever he goes."' },
    },
    {
      id: 'believed',
      kind: 'read',
      requires: ['ropes'],
      at: [44, 18],
      marker: 'lantern',
      title: 'The magicians believed',
      goal: 'Read at the lantern on the far side of the festival ground',
      reading: { title: 'We have believed', refs: [[20, 70], [20, 72], [20, 73]], note: 'The magicians fell down in prostration and said: "We believe in the Lord of Harun and Musa." When Pharaoh threatened them, they answered: "We will never prefer you over the clear proofs that have come to us, and over the One who created us. We believe in our Lord, so that He may forgive us. Allah is better, and lasting."' },
    },
    // The dry path through the sea (20:77-82).
    {
      id: 'sea',
      kind: 'points',
      requires: ['believed'],
      style: 'beacon',
      ordered: true,
      verb: 'Mark the way',
      title: 'A dry path through the sea',
      goal: 'Walk the dry path across the inlet in the west and mark the way at each post',
      intro: 'Allah told Musa to set out by night with His servants and to strike a dry path for them through the sea. Walk the narrow dry path across the inlet and mark the way.',
      adaptation: 'The inlet and the posts are game pictures. No one is shown crossing, and nothing is shown of Pharaoh\'s army or of the sea closing over it; that is read only.',
      points: [
        { at: [-38, 15], label: 'the first post', reading: { title: 'Travel by night', refs: [[20, 77]], note: 'We inspired Musa: "Travel by night with My servants, and strike a dry path for them through the sea. Do not fear being overtaken, and do not be afraid."' } },
        { at: [-38, 3], label: 'the middle post', reading: { title: 'Pharaoh did not guide', refs: [[20, 78], [20, 79]], note: 'Pharaoh followed them with his soldiers, and the sea covered them. Pharaoh led his people astray and did not guide them. This is not shown here.' } },
        { at: [-38, -9], label: 'the far post', reading: { title: 'Eat of the good things', refs: [[20, 80], [20, 81], [20, 82]], note: 'O Children of Israel, We saved you from your enemy and gave you manna and quails: "Eat of the good things We have given you, and do not go too far." And Allah is most forgiving to whoever turns back, believes, does good, and then stays guided.' } },
      ],
    },
    // The calf (20:83-98).
    {
      id: 'calf',
      kind: 'quiz',
      requires: ['sea'],
      at: [-26, 32],
      marker: 'tablet',
      title: 'The calf',
      goal: 'At the stone tablet in the north-west, sort the cards',
      intro: 'While Musa was away at the mountain, the Samiri made a calf from gold ornaments, and some of the people worshipped it. Harun warned them. The Quran asks: did they not see that it could not answer them, and had no power to harm or help them?',
      adaptation: 'The sorting cards are written for this game from 20:88-91. The calf is not shown; Musa, Harun and the Samiri are not shown.',
      prompt: 'Sort each card: is it something the calf could not do (20:89), or something the people wrongly said (20:88, 20:91)?',
      game: {
        type: 'sort',
        bins: ['The calf could not…', 'The people wrongly said…'],
        cards: [
          { text: 'answer them with a single word', bin: 0 },
          { text: 'bring them any harm or any good', bin: 0 },
          { text: '"This is your god"', bin: 1 },
          { text: '"Musa forgot"', bin: 1 },
          { text: '"We will keep to it until Musa comes back"', bin: 1 },
        ],
      },
      after: { title: 'Your god is only Allah', refs: [[20, 89], [20, 90], [20, 98]], note: 'Did they not see that it could not answer them a word, and had no power to harm or help them? Harun had told them: "O my people, you are only being tested by it. Your Lord is the Most Merciful, so follow me." Your god is only Allah; there is no god but Him. His knowledge covers all things.' },
    },
    // Adam (20:115-123).
    {
      id: 'adam',
      kind: 'quiz',
      requires: ['calf'],
      at: [-14, 40],
      marker: 'scroll',
      title: 'Adam: forgetting, and guidance',
      goal: 'At the scroll near the start, put the ayahs about Adam in order',
      intro: 'The surah ends its stories with Adam: he was given a promise, then forgot, and was turned back to and guided. The Garden is of the unseen and is not pictured. Put the ayahs in their order.',
      adaptation: 'Ordering the verses is a reading game. Adam and the Garden are not shown.',
      prompt: 'Put these ayahs in the order they come in the surah.',
      game: { type: 'order', refs: [[20, 115], [20, 117], [20, 120], [20, 122], [20, 123]] },
      after: { title: 'He turned to him and guided him', refs: [[20, 115], [20, 122], [20, 123]], note: 'We had taken a promise from Adam before, but he forgot, and We did not find firm resolve in him. Then his Lord chose him, turned to him in forgiveness, and guided him. Whoever follows the guidance Allah sends will not go astray and will not be miserable.' },
    },
    {
      id: 'knowledge',
      kind: 'read',
      requires: ['adam'],
      at: [-3, 44],
      marker: 'sign',
      title: 'Ask for knowledge',
      goal: 'Read at the sign by the start',
      reading: {
        title: 'My Lord, increase me in knowledge',
        refs: [[20, 114], [20, 130]],
        note: 'The surah teaches a short prayer: My Lord, increase me in knowledge. And it says: be patient with what they say, and glorify your Lord before the rising of the sun and before its setting.',
      },
    },
  ],
  finale: {
    title: 'Guided by a light',
    body: [
      'You crossed the dark hills and built your cairns only where the far light could be seen. In the morning you looked closely at what only seemed to move, marked the dry path through the sea, and sorted what the calf could never do.',
      'Surah Ta-Ha follows Musa from a light seen at night to the end of his people\'s journey, and ends with Adam: forgetting, turning back, and guidance.',
    ],
    ref: [20, 114],
    questions: ['When did the hills hide the light, and how did you find it again?', 'What would you ask for in a prayer like "increase me in knowledge"?'],
  },
  notes: [
    'Allah is never pictured, in any form, and the call at the fire (20:11-14) is read only.',
    'No prophet is shown or played: Musa and Harun never appear.',
    "Musa's family, Pharaoh and the magicians are not shown. The sea crossing is not shown.",
    'The far light is a game picture; the player never reaches it.',
  ],
};
