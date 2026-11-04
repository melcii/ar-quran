// Surah 31, Luqman: the Garden Path. A quiet garden path with a dove, a cat
// and a goat resting along it. The core play is a gentle voice (31:19): at
// each animal, pass on a message at the right loudness, holding a voice
// needle in a green band without startling the listener. Each success opens
// one piece of Luqman's advice from the verified verses. Luqman and his son
// are not shown, and no conversation is invented.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W031: WorldDef = {
  surah: 31,
  name: 'The Garden Path',
  theme: 'Pass the message on gently, without startling anyone',
  play: 'Animals rest along a garden path. At each one, hold the Speak button to raise your voice and let go to soften it, keeping the needle in the green band until the message is heard. Too loud startles them. Each one is more easily startled than the last.',
  seed: 3131,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 1, seed: 31 }),
    palette: PAL.meadow,
    paths: [curve([[0, 28], [0, 14], [6, 2], [0, -12], [-4, -20]])],
    flats: [],
  },
  look: { ...LOOKS.blossom, sunI: 3 },
  veg: {
    grass: 1.1,
    flowers: ['#fff2d8', '#f4c0d0', '#f4d060', '#c8d8ff'],
    trees: [{ kind: 'fig', at: [[-6, 8], [10, -6]] }, { kind: 'olive', area: { x: 0, z: 0, r: 26 }, count: 5 }],
    rocks: [{ x: -12, z: -16, n: 4, big: 1.6, spread: 6 }],
    pebbles: 20,
    rim: ['olive', 'oak'],
  },
  far: '#7a9a5a',
  mountains: { color: '#8a94b0', height: 0.8 },
  start: [0, 26],
  startYaw: Math.PI,
  structures: [{ type: 'bench', x: 4, z: 20, rot: Math.PI / 2 }],
  welcome:
    'Welcome to the Garden Path. Surah Luqman gives the advice of a wise man to his son: be grateful, be good to your parents, be patient, walk gently and lower your voice. Along the path, animals are resting. Pass the message on to each one, gently.',
  tasks: [
    {
      id: 'gently',
      kind: 'voice',
      title: 'A gentle voice',
      goal: 'Pass the message to each animal along the path, loud enough to be heard but gentle enough not to startle it',
      intro: 'The gardener asks you to tell the animals that the gate will close at sunset. At each one, hold "Speak" to raise your voice and let go to soften it. Keep the needle in the green band until the message is heard.',
      adaptation: 'The message, the animals and the voice meter are game ideas built on 31:19. Luqman and his son are not shown; his advice is read from the verses.',
      hold: 2.5,
      listeners: [
        { at: [0, 14], animal: 'goat', band: [0.3, 0.6], reading: { title: 'Be grateful', refs: [[31, 12], [31, 13]], note: 'Allah gave Luqman wisdom: be grateful to Allah. Luqman told his son: do not set up anything as equal to Allah.' } },
        { at: [6, 2], animal: 'cat', band: [0.3, 0.52], reading: { title: 'Your parents', refs: [[31, 14]], note: 'Allah tells people to be good to their parents. A mother carries her child through weakness upon weakness. Be grateful to Me and to your parents.' } },
        { at: [0, -12], animal: 'dove', band: [0.28, 0.45], reading: { title: 'Walk gently, speak softly', refs: [[31, 18], [31, 19]], note: 'Do not turn your face away from people in pride, and do not walk proudly on the earth. Be moderate in your pace and lower your voice.' } },
      ],
      reading: { title: 'Pray and be patient', refs: [[31, 17]], note: 'Luqman told his son: keep up the prayer, tell others to do what is right and keep away from wrong, and be patient with whatever happens to you.' },
      outro: 'Every animal heard the message, and none was startled.',
    },
    {
      id: 'seed',
      kind: 'read',
      requires: ['gently'],
      at: [-9, -14],
      marker: 'lantern',
      title: 'A mustard seed',
      goal: 'Read at the lantern by the rocks',
      reading: { title: 'Even the weight of a mustard seed', refs: [[31, 16]], note: 'Luqman told his son: even something as small as a mustard seed, hidden in a rock or in the heavens or the earth, Allah will bring it out. Allah is Subtle and Aware.' },
    },
  ],
  finale: {
    title: 'Gentle and wise',
    body: ['You passed the message on gently, and no one was startled.', 'Surah Luqman teaches gratitude, kindness to parents, patience, and walking and speaking gently.'],
    ref: [31, 19],
    questions: ['When is a softer voice better?', 'Which piece of Luqman\'s advice would you like to follow this week?'],
  },
  notes: ['Allah is never pictured, in any form.', "Luqman and his son are not shown, and no conversation is invented: his advice is read from the verses.", 'The animals and the message are game ideas.'],
};
