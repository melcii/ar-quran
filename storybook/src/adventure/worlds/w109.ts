// Surah 109, Al-Kafirun (The Disbelievers): the Shared Courtyard. An old
// town courtyard shared by two families, with a low wall between their
// halves, a well, potted plants and washing lines. "Say: O disbelievers, I
// do not worship what you worship ... For you is your religion, and for me
// is my religion" (109:1-6). The core play: the neighbour asks for many
// things through the day; help gladly in everyday kindness, and in worship
// say no clearly and politely, never rudely. The Prophet, who is told to
// "say" this, is never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W109: WorldDef = {
  surah: 109,
  name: 'The Shared Courtyard',
  theme: 'Help the neighbour gladly in kindness; in worship, a clear and polite no',
  play: 'Two families share a courtyard in an old town, and the neighbours worship differently. Through the day the neighbour asks for many things. Help gladly with everyday kindness. When asked to join in worship, say no clearly and politely. Rudeness is never the answer.',
  seed: 10909,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 0.4, seed: 109 }),
    palette: PAL.dry,
    paths: [curve([[0, 32], [-6, 22], [0, 12], [0, 6]])],
    flats: [{ x: 0, z: 0, r: 9, paint: '#d8ccb0' }, { x: -6, z: 22, r: 3 }, { x: 12, z: 12, r: 3 }],
  },
  look: { ...LOOKS.golden, sunI: 2.6 },
  veg: {
    grass: 0.5,
    flowers: ['#f8d0d8', '#f8e8a0'],
    trees: [{ kind: 'palm', at: [[-14, 6], [14, -8]] }, { kind: 'fig', at: [[-8, -12]] }],
    rocks: [],
    pebbles: 8,
    rim: ['palm', 'cypress'],
  },
  far: '#b0a890',
  mountains: { color: '#a09890', height: 0.6 },
  start: [0, 32],
  startYaw: Math.PI,
  structures: [
    { type: 'house', x: -7, z: -6, rot: Math.PI / 4, w: 5, d: 4, h: 3.2, accent: '#3a6a8a' },
    { type: 'house', x: 7, z: -6, rot: -Math.PI / 4, w: 5, d: 4, h: 3.2, accent: '#8a5a3a' },
    { type: 'well', x: 0, z: -6 },
    { type: 'festoon', x: -6, z: 3, to: [6, 3], h: 2.4, color: '#e8e0d0' },
  ],
  welcome:
    'Welcome to the Shared Courtyard. Two families live here side by side, and they worship differently. Surah Al-Kafirun ends: for you is your religion, and for me is my religion. Your neighbour is calling over the wall.',
  tasks: [
    {
      id: 'say',
      kind: 'read',
      at: [-6, 22],
      marker: 'sign',
      title: 'Say',
      goal: 'Read at the sign in the lane',
      adaptation: 'The Prophet, who is told to say this, is never shown; the ayahs are read only.',
      reading: { title: 'Say', refs: [[109, 1], [109, 2], [109, 3]], note: 'Say: O disbelievers, I do not worship what you worship, nor do you worship what I worship.' },
    },
    {
      id: 'neighbour',
      kind: 'courtyard',
      requires: ['say'],
      at: [0, 0],
      asks: [
        { text: 'Could you help me lift this heavy water jar onto the step?', ok: true, yes: 'Of course! You take that side.', no: 'No, sorry, I would rather not.', rude: 'Lift it yourself!' },
        { text: 'Come and bow with us to our idols this evening.', ok: false, yes: 'All right, just this once.', no: 'Thank you for asking, but I do not worship what you worship.', rude: 'Your idols are rubbish!' },
        { text: 'We baked too much bread today. Will you take some?', ok: true, yes: 'Thank you, that is kind of you!', no: 'No, I do not want your bread.', rude: 'Keep your bread!' },
        { text: 'Let’s make a deal: you worship our way one year, and we will worship yours the next.', ok: false, yes: 'That sounds fair. Let’s take turns.', no: 'That is kindly meant, but no. For you is your religion, and for me is mine.', rude: 'Never! Go away!' },
        { text: 'My little one is ill. Could you mind my stall in the market for an hour?', ok: true, yes: 'Gladly. Go and look after them.', no: 'I am busy, sorry.', rude: 'Not my problem.' },
      ],
      title: 'To you, and to me',
      goal: 'Answer each of your neighbour’s requests: help gladly with kindness, and say a clear, polite no to joining in worship',
      intro: 'Kind in everything. Clear in worship. Never rude.',
      adaptation: 'The courtyard and the neighbour are a game written for this app. Being kind to neighbours of other faiths, and never joining in their worship, follows the surah.',
      outro: 'Good neighbours still, each with their own religion.',
      after: { title: 'To you your religion', refs: [[109, 4], [109, 5], [109, 6]], note: 'Nor will I worship what you worship, nor will you worship what I worship. For you is your religion, and for me is my religion.' },
    },
    {
      id: 'mine',
      kind: 'read',
      requires: ['neighbour'],
      at: [12, 12],
      marker: 'tablet',
      title: 'For me, my religion',
      goal: 'Read at the tablet by the courtyard gate',
      reading: { title: 'For me, my religion', refs: [[109, 6]], note: 'For you is your religion, and for me is my religion.' },
    },
  ],
  finale: {
    title: 'To you your religion, and to me mine',
    body: ['You carried the jar, took the bread and minded the stall, and in worship you said a clear, kind no.', 'Surah Al-Kafirun: for you is your religion, and for me is my religion.'],
    ref: [109, 6],
    questions: ['Why was "Your idols are rubbish!" the wrong answer, even though you would not join them?', 'How can you be a good neighbour to people who believe differently?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet, addressed in this surah, is never shown.', 'The neighbour is a game character; no historical person is shown.'],
};
