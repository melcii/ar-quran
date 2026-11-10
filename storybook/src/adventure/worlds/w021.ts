// Surah 21, Al-Anbiya: the Hall of Answered Prayers. A quiet courtyard with
// three lecterns and three carved doors. Each lectern holds a tablet with one
// verse: the prayer of Ayyub (21:83), of Yunus (21:87) or of Zakariyya
// (21:89), in verified Arabic with its translation. Each door carries a sign
// and a few words about a situation. The core play is matching: carry each
// prayer to the door whose situation it answers, and the door opens on the
// verse that tells how it was answered. No prophet is shown or played; the
// fire of Ibrahim (21:68-70) is read only. Then the field of Dawud and
// Sulayman: lead the sheep that strayed into a field at night back to their
// fold (21:78-80).
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W021: WorldDef = {
  surah: 21,
  name: 'The Hall of Answered Prayers',
  theme: 'Carry each prayer to the door it answers',
  play: 'Three lecterns hold three prayers from the Quran, and three carved doors each tell of a situation. Read a prayer, carry it, and set it in the door whose situation it answers. The wrong door will not take it.',
  seed: 2121,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.2, seed: 21 }),
    palette: PAL.dry,
    paths: [curve([[0, 30], [0, 10], [0, -8]]), curve([[-14, 6], [0, 6], [14, 6]])],
    flats: [{ x: 0, z: -2, r: 14, paint: '#e2d4b4' }],
  },
  look: { ...LOOKS.golden, sunI: 3 },
  veg: {
    grass: 0.6,
    dryGrass: true,
    flowers: ['#fff2d8', '#f0c0a0'],
    trees: [{ kind: 'cypress', at: [[-16, -10], [16, -10], [-18, 0], [18, 0]] }, { kind: 'olive', area: { x: 0, z: 18, r: 16 }, count: 5 }, { kind: 'palm', at: [[14, 10], [17, 7]] }],
    rocks: [{ x: 0, z: -26, n: 6, big: 1.4, spread: 18 }],
    pebbles: 20,
    rim: ['olive', 'cypress'],
  },
  far: '#9a9a6a',
  mountains: { color: '#9a90a8', height: 1 },
  start: [0, 26],
  startYaw: Math.PI,
  structures: [
    { type: 'bench', x: -6, z: 12, rot: Math.PI / 2 },
    // The field the sheep got into at night (21:78), and the fold they belong in.
    { type: 'bed', x: 24, z: 22, w: 9, d: 7, color: '#7a9a3a' },
    { type: 'pen', x: 26, z: -2, w: 7, rot: -Math.PI / 2 }, // opening toward the field in the north
  ],
  welcome:
    'Welcome to the Hall of Answered Prayers. Surah Al-Anbiya tells of many prophets who called on their Lord in hard times, and how each prayer was answered. In the courtyard ahead are three prayers on tablets and three carved doors. Each prayer belongs to one door.',
  tasks: [
    {
      id: 'prayers',
      kind: 'doors',
      title: 'Prayers and doors',
      goal: 'Read each prayer tablet and set it in the door whose situation it answers',
      intro: 'Take a tablet from a lectern and read the prayer on it. Then walk to the doors and read what each one says. Set the tablet in the door it answers.',
      adaptation: 'The doors, their signs and the tablets are game ideas. The short words on each door are written for this app from 21:83-89; the prayers on the tablets are the verified verses. No prophet is shown or played: you carry the verse, not the person.',
      tablets: [
        { at: [-4, 0], ref: [21, 89] },
        { at: [0, 2.5], ref: [21, 83] },
        { at: [4, 0], ref: [21, 87] },
      ],
      doors: [
        {
          at: [-10, -11],
          rot: 0.74,
          emblem: 'wilted',
          situation: 'A long hardship: illness and loss, borne with patience.',
          tablet: 1,
          reading: { title: 'Ayyub was answered', refs: [[21, 84]], note: 'Allah answered him, took away the hardship that had touched him, and gave his family back to him and as many again, as a mercy and a reminder for those who worship.' },
        },
        {
          at: [0, -14],
          rot: 0,
          emblem: 'waves',
          situation: 'Deep darkness, far out at sea, after going off in anger.',
          tablet: 2,
          reading: { title: 'Yunus was answered', refs: [[21, 88]], note: 'Allah answered him and saved him from his distress. And that is how He saves the believers.' },
        },
        {
          at: [10, -11],
          rot: -0.74,
          emblem: 'lamp',
          situation: 'Old age, and a wish for someone to carry on the good.',
          tablet: 0,
          reading: { title: 'Zakariyya was answered', refs: [[21, 90]], note: 'Allah answered him and gave him Yahya. They used to hurry to do good, and called on their Lord in hope and in fear, humbly.' },
        },
      ],
      reading: {
        title: 'A mercy to the worlds',
        refs: [[21, 107]],
        note: 'After the stories of the prophets, the surah says that the Prophet Muhammad, peace be upon him, was sent as a mercy to all the worlds.',
      },
      outro: 'All three doors stand open: three prayers, each one answered.',
    },
    {
      id: 'ibrahim',
      kind: 'read',
      requires: ['prayers'],
      at: [-14, 6],
      marker: 'sign',
      title: 'Ibrahim and the statues',
      goal: 'Read at the sign on the west side',
      reading: {
        title: 'Your Lord is the Lord of the heavens and the earth',
        refs: [[21, 51], [21, 52], [21, 56], [21, 69]],
        note: 'Ibrahim asked his people what the statues were that they were devoted to, and told them their Lord is the Lord of the heavens and the earth, who created them. When they threw him into a fire, Allah said: O fire, be coolness and safety for Ibrahim.',
      },
      adaptation: 'Ibrahim, his people, the statues and the fire are not shown. This is a reading only.',
    },
    {
      id: 'field',
      kind: 'lead',
      requires: ['ibrahim'],
      animal: 'sheep',
      herd: { at: [24, 22], r: 3 },
      n: 4,
      pen: [26, -2],
      penLabel: 'the fold',
      title: 'The sheep in the field',
      goal: 'Lead the four sheep out of the field on the east side and back into their fold',
      intro: 'The surah tells of Dawud and Sulayman judging a case: a people\'s sheep had got into a field at night and grazed it. Allah gave Sulayman understanding of the case. Lead the sheep out of the field and back to their fold.',
      adaptation: 'Leading the sheep is a game idea. The Quran tells of the case and the judging (21:78-79), not of anyone leading sheep home. Dawud, Sulayman and the people are not shown.',
      after: { title: 'Understanding and knowledge', refs: [[21, 78], [21, 79], [21, 80]], note: 'Dawud and Sulayman judged the case of the field, when a people\'s sheep grazed in it at night, and Allah witnessed their judgement. He gave Sulayman understanding of it, and gave each of them wisdom and knowledge. He made the mountains and the birds glorify Him with Dawud, and taught Dawud to make coats of armour to protect people. So will you be grateful?' },
    },
    {
      id: 'water',
      kind: 'read',
      requires: ['field'],
      at: [14, 6],
      marker: 'lantern',
      title: 'Every living thing',
      goal: 'Read by the palms on the east side',
      reading: {
        title: 'Made from water',
        refs: [[21, 30]],
        note: 'The heavens and the earth were joined together, and Allah separated them, and made every living thing from water.',
      },
    },
  ],
  finale: {
    title: 'Prayers answered',
    body: ['You matched three prayers from the Quran to the situations they answer, and every door opened.', 'Surah Al-Anbiya shows that the prophets called on their Lord in hard times, in hope and in fear, and were answered.'],
    ref: [21, 90],
    questions: ['Which of the three prayers would you like to learn by heart?', 'When could you call on your Lord in a hard time?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'No prophet is shown or played: Ayyub, Yunus, Zakariyya, Yahya, Ibrahim, Dawud and Sulayman never appear. You carry the verse, never the person.',
    "Ibrahim's fire (21:68-70) is read only; there is no fire scene.",
    'The words on each door are narration written for this app; the prayers are verified verses.',
  ],
};
