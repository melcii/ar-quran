// Surah 69, Al-Haqqah (The Reality): the Cliff Workshop. An old stone
// workshop on a windy cliff above the sea at dusk, with a bench of simple
// tools and four plain stone plinths. The surah swears "by what you see and
// what you do not see" (69:38-39). The core play: at each plinth something
// is really there but no eye can see it (a draught through a crack, a
// lodestone's pull, warmth left in a rock by the sun, a scent behind a
// screen); find each with the right tool. These are things of this world;
// the unseen the Quran speaks of is never shown or "found". The ship of
// 69:11-12 is read only, and nothing of the Day is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W069: WorldDef = {
  surah: 69,
  name: 'The Cliff Workshop',
  theme: 'Find things that are really there but cannot be seen, each with the right tool',
  play: 'In an old stone workshop on a windy cliff, four plain stone plinths seem to hold nothing. But something is really there at each one. Choose the right tool from the bench, a ribbon, a compass, the back of your hand or your nose, and find it.',
  seed: 6969,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.4, seed: 69, tilt: [0, 0.04], shapes: [{ x: 0, z: -58, r: 40, h: -14 }] }),
    palette: PAL.coast,
    paths: [curve([[0, 40], [4, 26], [0, 12], [0, 2]])],
    water: -3,
    shore: '#d8c8a0',
    flats: [{ x: 4, z: 34, r: 2.5 }, { x: 0, z: -2, r: 9, paint: '#c8b898' }, { x: 6, z: 30, r: 3 }],
  },
  look: { ...LOOKS.dusk, sunI: 2.2 },
  veg: {
    grass: 0.8,
    flowers: ['#e8a0d0', '#fff2d8'],
    trees: [{ kind: 'pine', area: { x: 0, z: 24, r: 18 }, count: 6 }],
    rocks: [{ x: -20, z: -6, n: 6, big: 1.3, spread: 6 }, { x: 20, z: -6, n: 6, big: 1.3, spread: 6 }],
    pebbles: 30,
    rim: ['pine', 'oak'],
  },
  far: '#7a8a70',
  mountains: { color: '#8a90a8', height: 0.8 },
  start: [0, 40],
  startYaw: Math.PI,
  structures: [
    { type: 'wall', x: -8, z: -8, to: [8, -8], h: 2.6, color: '#a89c88' },
    { type: 'wall', x: -8, z: -8, to: [-8, 4], h: 2.6, color: '#a89c88' },
    { type: 'wall', x: 8, z: -8, to: [8, 4], h: 2.6, color: '#a89c88' },
    { type: 'table', x: 0, z: 2, w: 2.4, d: 0.9, color: '#8a6a44' },
  ],
  welcome:
    'Welcome to the Cliff Workshop. Surah Al-Haqqah swears "by what you see, and what you do not see". In this old workshop, some things are really there that no eye can see. Can you find them?',
  tasks: [
    {
      id: 'ad',
      kind: 'read',
      at: [4, 34],
      marker: 'sign',
      title: '’Ad and the wind',
      goal: 'Read at the sign near the way in',
      adaptation: '’Ad and their end are read only; nothing of it is shown.',
      reading: { title: '’Ad and the wind', refs: [[69, 6], [69, 7], [69, 8]], note: 'As for ’Ad, they were destroyed by a screaming, freezing wind, which He set upon them for seven nights and eight days without pause. Do you see any of them remaining?' },
    },
    {
      id: 'reality',
      kind: 'read',
      at: [6, 30],
      marker: 'sign',
      title: 'The Reality',
      goal: 'Read at the sign on the cliff path',
      adaptation: 'The Day this surah describes is never pictured; it is read only.',
      reading: { title: 'The Reality', refs: [[69, 1], [69, 2], [69, 3]], note: 'The Reality! What is the Reality? And what will make you understand what the Reality is?' },
    },
    {
      id: 'ship',
      kind: 'read',
      requires: ['reality'],
      at: [4, 12],
      marker: 'tablet',
      title: 'An ear that remembers',
      goal: 'Read at the tablet looking out to sea',
      adaptation: 'The ship and the flood are read only, never shown.',
      reading: { title: 'An ear that remembers', refs: [[69, 11], [69, 12]], note: 'When the water rose high, We carried your ancestors in the floating ship, to make it a reminder for you, and so that ears that remember would remember it.' },
    },
    {
      id: 'unseen',
      kind: 'unseen',
      requires: ['ship'],
      title: 'What you do not see',
      goal: 'At each plinth in the workshop, use the right tool to find what is really there',
      intro: 'Each plinth looks empty. But something is really there at every one. Think about what could be hidden there, and choose a tool from the bench.',
      adaptation: 'These are real things of this world that eyes cannot see. The unseen the Quran speaks of, like the angels and the Day, cannot be found with tools, and is never shown.',
      tools: ['ribbon', 'compass', 'back of your hand', 'nose'],
      stations: [
        { at: [-5, -5], thing: 'A crack in the wall by the cliff', tool: 0, shows: 'The ribbon flutters and streams out: wind is blowing in through the crack. You cannot see air, but it is there.' },
        { at: [5, -5], thing: 'A dark, heavy stone', tool: 1, shows: 'The compass needle swings round to point at the stone. It is a lodestone, and its pull is real though no one can see it.' },
        { at: [-5, 1], thing: 'A rock that sat in the sun all day', tool: 2, shows: 'The rock is still warm against the back of your hand, long after the sun went down. You cannot see warmth, but you can feel it.' },
        { at: [5, 1], thing: 'A wooden screen in the corner', tool: 3, shows: 'A sweet scent: behind the screen a jasmine is flowering in a pot. You could not see it, but its scent reached you.' },
      ],
      outro: 'Four things that were really there, though no eye could see them.',
      after: { title: 'What you see and do not see', refs: [[69, 38], [69, 39], [69, 40], [69, 41], [69, 42], [69, 43]], note: 'I swear by what you see, and what you do not see, that this is the word of a noble Messenger. It is not the word of a poet, nor of a fortune-teller: little do you remember. It is sent down from the Lord of all the worlds.' },
    },
  ],
  finale: {
    title: 'Really there',
    body: ['You found four things that were really there though no eye could see them: moving air, a lodestone’s pull, warmth and a scent.', 'Surah Al-Haqqah swears by what we see and what we do not see.'],
    ref: [69, 38],
    questions: ['Which unseen thing surprised you most?', 'What else is real that you cannot see?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The angels, the Day and the record of deeds in this surah are read only, never shown.', 'The workshop finds things of this world only.'],
};
