// Surah 58, Al-Mujadilah (She Who Disputes): the Courtyard of Listening. A
// shaded courtyard in a quiet town, with a pool, columns, and a sitting
// place on a rug under the trees. The surah opens: "Allah has heard the
// speech of the one who argues with you concerning her husband ... and
// Allah hears your dialogue" (58:1). The core play is listening fully:
// people of the town (fictional, and never shown) come one at a time with
// something on their mind; listen to the end without interrupting, then say
// back accurately what you heard. Readings stand for making room in a
// gathering (58:11) and for private talk only about good (58:9). The woman
// of 58:1 is never portrayed or voiced.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W058: WorldDef = {
  surah: 58,
  name: 'The Courtyard of Listening',
  theme: 'Listen to each speaker to the end, then say back what they really said',
  play: 'In a shaded courtyard, people of the town come one at a time with something on their mind. Listen without interrupting, let the words settle, then say back what you heard: not more, not less. Readings about speaking and making room stand around the courtyard.',
  seed: 5858,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 1.2, seed: 58 }),
    palette: PAL.meadow,
    paths: [curve([[0, 34], [2, 22], [0, 10], [0, -2]])],
    flats: [{ x: 0, z: -6, r: 12, paint: '#e0d0b0' }, { x: 4, z: 24, r: 3 }],
  },
  look: LOOKS.golden,
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#e88a9a', '#f4d060'],
    trees: [{ kind: 'fig', at: [[-7, -12], [7, -12]] }, { kind: 'cypress', at: [[-12, 0], [12, 0], [-12, -12], [12, -12]] }, { kind: 'olive', area: { x: 0, z: 22, r: 14 }, count: 5 }],
    rocks: [],
    pebbles: 12,
    rim: ['olive', 'cypress', 'oak'],
  },
  far: '#8a9a64',
  mountains: { color: '#a0a0b8', height: 0.7 },
  start: [0, 34],
  startYaw: Math.PI,
  structures: [
    { type: 'pool', x: 0, z: -4, w: 4, d: 3 },
    { type: 'columns', x: -9, z: -6, w: 10, n: 4, rot: Math.PI / 2, color: '#efe4cc' },
    { type: 'columns', x: 9, z: -6, w: 10, n: 4, rot: Math.PI / 2, color: '#efe4cc' },
    { type: 'wall', x: -9, z: -16, to: [9, -16], h: 2.6, color: '#e0d0b0' },
    { type: 'bench', x: -5, z: 1, rot: 0 },
    { type: 'bench', x: 5, z: 1, rot: 0 },
  ],
  welcome:
    'Welcome to the Courtyard of Listening. Surah Al-Mujadilah begins with a woman who came with her trouble and argued her case, and Allah heard her. Here, people of the town come to speak. Will you really listen?',
  tasks: [
    {
      id: 'heard',
      kind: 'read',
      at: [4, 27],
      marker: 'sign',
      title: 'Allah has heard',
      goal: 'Read at the sign on the way in',
      adaptation: 'The woman of this ayah is never shown or voiced; the ayah is read only.',
      reading: { title: 'Allah has heard', refs: [[58, 1]], note: 'Allah has heard the words of the woman who argued with you about her husband and took her complaint to Allah. Allah hears what you both say. Allah is All-Hearing, All-Seeing.' },
    },
    {
      id: 'listen',
      kind: 'listen',
      requires: ['heard'],
      at: [0, -10],
      title: 'Hear them to the end',
      goal: 'Sit on the rug under the fig trees, listen to each speaker without interrupting, then say back what they said',
      intro: 'Someone is coming to sit with you. Their words will appear as they speak, then fade. Do not answer until they have finished. Then say back exactly what you heard: not something bigger, not something smaller.',
      adaptation: 'The speakers and their worries are made up for this game, and no one is shown. Listening is the skill being practised.',
      speakers: [
        {
          name: 'A boy from the bakery',
          words: 'I was meant to deliver the bread this morning but the cart wheel broke, so the bread was late, and now I am worried the baker thinks I was lazy.',
          repeats: [
            { text: 'You were late because you were lazy.', ok: false, why: 'He did not say that. He said the wheel broke, and he is worried the baker thinks so.' },
            { text: 'The cart wheel broke, so the bread was late, and you are worried the baker thinks you were lazy.', ok: true, why: 'That is what he said. He feels heard.' },
            { text: 'You lost the bread.', ok: false, why: 'Nothing was lost: the bread was late because the wheel broke.' },
          ],
        },
        {
          name: 'A girl who keeps bees',
          words: 'My little brother opened the hive without the smoke and got stung three times. He is fine now, but he says he never wants to come near the bees again, and I miss working with him.',
          repeats: [
            { text: 'Your brother got stung, he is fine, but he is afraid of the bees now and you miss working with him.', ok: true, why: 'Yes: every part, and nothing added.' },
            { text: 'Your brother was badly hurt by the bees.', ok: false, why: 'She said he is fine now. Making it bigger is not what she said.' },
            { text: 'You do not like working with your brother.', ok: false, why: 'She said the opposite: she misses working with him.' },
          ],
        },
        {
          name: 'An old man who mends nets',
          words: 'My eyes are getting weak, and the knots are hard to see now. I can still do the work if someone threads the needle for me in the morning.',
          repeats: [
            { text: 'You cannot do your work any more.', ok: false, why: 'He said he still can, with a little help in the morning.' },
            { text: 'Your eyes are weak.', ok: false, why: 'True, but he said more: he can still work if someone threads the needle for him.' },
            { text: 'Your eyes are getting weak, but you can still mend the nets if someone threads the needle for you in the morning.', ok: true, why: 'Exactly what he said, and now you know how to help.' },
          ],
        },
      ],
      outro: 'Three people came, and each one was heard to the end.',
    },
    {
      id: 'room',
      kind: 'read',
      requires: ['listen'],
      at: [-5, 4],
      marker: 'tablet',
      title: 'Make room',
      goal: 'Read at the tablet by the benches',
      reading: { title: 'Make room', refs: [[58, 11]], note: 'When you are told to make room in a gathering, make room, and Allah will make room for you. And when you are told to get up, get up. Allah raises those of you who believe, and those given knowledge, by degrees.' },
    },
    {
      id: 'whisper',
      kind: 'read',
      requires: ['room'],
      at: [5, 4],
      marker: 'tablet',
      title: 'Private talk about good',
      goal: 'Read at the tablet by the other bench',
      reading: { title: 'When you talk privately', refs: [[58, 9]], note: 'When you talk privately together, do not talk about wrongdoing or hurting others, but talk about goodness and being mindful of Allah.' },
    },
  ],
  finale: {
    title: 'Heard',
    body: ['You let three people finish speaking, and then said back exactly what they said, not more and not less.', 'Surah Al-Mujadilah begins by telling us that Allah heard a woman who came with her trouble. Allah hears everything we say.'],
    ref: [58, 1],
    questions: ['How does it feel when someone really listens to you?', 'Who could you listen to properly today?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The woman of 58:1 and the Prophet are never shown or voiced.', 'The three speakers are fictional and are never shown.'],
};
