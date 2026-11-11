// Surah 54, Al-Qamar (The Moon): the Path of Remembering. A path through a
// quiet valley at evening with four tall standing stones, one for each
// people the surah tells of: the people of Nuh, 'Ad, Thamud and the people
// of Lut. The core play: at each stone, read its passage, then put the
// surah's refrain back together (54:17, "We have certainly made the Quran
// easy for remembrance, so is there any who will remember?"), with fewer
// pieces shown at each stone until the last, where you remember it all. The
// moon of 54:1 is not pictured, and nothing of the punishments is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W054: WorldDef = {
  surah: 54,
  name: 'The Path of Remembering',
  theme: 'Remember the refrain at each of the four stones, with fewer pieces shown each time',
  play: 'Four standing stones line the path, one for each people the surah tells of. At each one, read its passage, then put the refrain back together from its pieces. At each stone more of it is left for you to remember.',
  seed: 5454,
  ground: {
    radius: 48,
    base: rolling({ radius: 48, amp: 1.5, seed: 54, shapes: [{ x: -30, z: 0, r: 12, h: 5 }, { x: 30, z: -10, r: 12, h: 5 }] }),
    palette: PAL.autumn,
    paths: [curve([[0, 42], [-8, 28], [6, 14], [-6, 0], [6, -14], [0, -30]])],
    flats: [{ x: -9, z: 26, r: 3 }, { x: 8, z: 12, r: 3 }, { x: -8, z: -2, r: 3 }, { x: 8, z: -16, r: 3 }, { x: 0, z: -32, r: 4 }],
  },
  look: { ...LOOKS.golden, sunI: 2.8 },
  veg: {
    grass: 1,
    flowers: ['#f0c080', '#fff2d8'],
    trees: [{ kind: 'autumn', area: { x: 0, z: 0, r: 30 }, count: 8 }, { kind: 'cypress', at: [[-4, -34], [4, -34]] }],
    rocks: [{ x: -30, z: 0, n: 5, big: 1.1, spread: 8 }],
    pebbles: 18,
    rim: ['autumn', 'oak'],
  },
  far: '#a89070',
  mountains: { color: '#a090a0', height: 0.9 },
  start: [0, 42],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Path of Remembering. Surah Al-Qamar tells of four peoples who were warned and did not listen. After each story it asks the same question. Walk the path and see if you can remember it.',
  tasks: [
    {
      id: 'near',
      kind: 'read',
      at: [3, 36],
      marker: 'sign',
      title: 'The Hour has come near',
      goal: 'Read at the sign at the start of the path',
      adaptation: 'The moon is not pictured; this ayah is read only.',
      reading: { title: 'The Hour has come near', refs: [[54, 1]], note: 'The Hour has come near, and the moon has split.' },
    },
    {
      id: 'remember',
      kind: 'recall',
      requires: ['near'],
      title: 'Is there any who will remember?',
      goal: 'At each standing stone, read its passage, then put the refrain back together',
      intro: 'After each story the surah asks the same thing: "We have certainly made the Quran easy for remembrance, so is there any who will remember?" At every stone, more of it will be left for you to remember.',
      adaptation: 'Rebuilding the refrain from pieces is a memory game. The pieces are the English meaning (Saheeh International), split at natural pauses; the Arabic is shown whole in each reading and is never split.',
      ref: [54, 17],
      pieces: ['And We have certainly made', 'the Qur’an easy', 'for remembrance,', 'so is there any', 'who will remember?'],
      stones: [
        { at: [-9, 26], label: 'the people of Nuh', hide: 2, reading: { title: 'The people of Nuh', refs: [[54, 9], [54, 10], [54, 13], [54, 15]], note: 'The people of Nuh denied before them. They called Our servant mad, and drove him away. He called to his Lord: "I am overpowered, so help me!" We carried him on a vessel of planks and nails, and left it as a sign. So is there any who will remember?' } },
        { at: [8, 12], label: '‘Ad', hide: 3, reading: { title: '‘Ad', refs: [[54, 18], [54, 19], [54, 22]], note: '‘Ad denied, and how was My punishment and My warning! We sent against them a roaring wind on a day of long misfortune. And We have made the Quran easy to remember: is there any who will remember?' } },
        { at: [-8, -2], label: 'Thamud', hide: 4, reading: { title: 'Thamud', refs: [[54, 23], [54, 27], [54, 28], [54, 32]], note: 'Thamud denied the warnings. We sent the she-camel as a test for them: "Watch them and be patient, and tell them the water is shared between them, each drinking in turn." And We have made the Quran easy to remember: is there any who will remember?' } },
        { at: [8, -16], label: 'the people of Lut', hide: 5, reading: { title: 'The people of Lut', refs: [[54, 33], [54, 34], [54, 35], [54, 40]], note: 'The people of Lut denied the warnings. We saved Lut’s family before dawn, as a favour from Us: that is how We reward the grateful. And We have made the Quran easy to remember: is there any who will remember?' } },
      ],
      outro: 'At the last stone you remembered the whole refrain.',
    },
    {
      id: 'measure',
      kind: 'read',
      requires: ['remember'],
      at: [3, -30],
      marker: 'tablet',
      title: 'Everything in measure',
      goal: 'Read at the tablet at the end of the path',
      reading: { title: 'In measure', refs: [[54, 49], [54, 50]], note: 'We created everything in due measure. And Our command is only one word, like the blink of an eye.' },
    },
  ],
  finale: {
    title: 'Easy to remember',
    body: ['You read the four stories and remembered the refrain, a little more each time, until you could say it all.', 'Surah Al-Qamar says Allah has made the Quran easy to remember, and asks: is there any who will remember?'],
    ref: [54, 17],
    questions: ['Did the refrain get easier to remember each time?', 'Which part of the Quran would you like to learn by heart next?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Nuh, Hud, Salih and Lut are never shown; what happened to each people is read only.', 'The moon of 54:1 is not pictured.'],
};
