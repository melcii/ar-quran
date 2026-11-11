// Surah 90, Al-Balad (The City): the Steep Pass. A mountain village in a
// hard, hungry year: a storehouse at the bottom of the valley, and three
// households up a steep zig-zag pass. "And what will make you know what the
// steep pass is? It is freeing a neck, or feeding on a day of hunger an
// orphan who is a relative, or a poor person in the dust" (90:12-16). The
// core play: share one sack of grain so that every person in every house
// gets the same, then carry each share up the steep pass yourself. The
// city of 90:1-2 is read only; the freeing of a slave is read, never played.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W090: WorldDef = {
  surah: 90,
  name: 'The Steep Pass',
  theme: 'Share grain fairly on a day of hunger and carry it up the steep pass',
  play: 'In a hungry year, one sack of grain sits in the valley storehouse, and three households live up a steep, zig-zag pass. Share the grain so every person in every house gets the same. Then carry each share up the pass yourself.',
  seed: 9090,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 0.8, seed: 90, shapes: [{ x: 0, z: 24, r: 24, h: 9 }] }),
    palette: PAL.dry,
    paths: [curve([[0, -36], [-4, -22], [0, -12], [2, -8]]), curve([[2, -6], [-10, 4], [8, 10], [-8, 16], [6, 22], [0, 28]])],
    flats: [{ x: 2, z: -6, r: 5 }, { x: -4, z: -22, r: 3 }, { x: -9, z: 15, r: 3 }, { x: 8, z: 22, r: 3 }, { x: 0, z: 30, r: 3.5 }, { x: 12, z: 8, r: 3 }],
  },
  look: { ...LOOKS.desert, sunI: 3 },
  veg: {
    grass: 0.3,
    flowers: ['#e8c070'],
    trees: [{ kind: 'olive', at: [[-14, -4], [14, -6]] }],
    rocks: [{ x: -20, z: 20, n: 6, big: 1.4, spread: 6 }, { x: 20, z: 26, n: 6, big: 1.4, spread: 6 }],
    pebbles: 34,
    rim: ['olive'],
  },
  far: '#b89a70',
  mountains: { color: '#a8907a', height: 1.4 },
  start: [0, -36],
  startYaw: 0,
  structures: [
    { type: 'house', x: 5, z: -6, rot: -Math.PI / 2, w: 4.4, d: 3.8, h: 3, accent: '#8a6a44' },
    { type: 'house', x: -9, z: 18.5, rot: Math.PI, w: 4.4, d: 3.8, h: 2.8, accent: '#5a6a8a' },
    { type: 'house', x: 8, z: 25.5, rot: Math.PI, w: 4.4, d: 3.8, h: 2.8, accent: '#8a5a3a' },
    { type: 'house', x: 0, z: 33.5, rot: Math.PI, w: 4.4, d: 3.8, h: 2.8, accent: '#6a7a5a' },
  ],
  welcome:
    'Welcome to the Steep Pass. Surah Al-Balad says people were created to toil, and shown two ways. The steep pass is the harder way: feeding on a day of hunger an orphan who is family, or a poor person lying in the dust. This is a hungry year. Will you take the steep pass?',
  tasks: [
    {
      id: 'ways',
      kind: 'read',
      at: [-4, -22],
      marker: 'sign',
      title: 'The two ways',
      goal: 'Read at the sign on the valley track',
      reading: { title: 'The two ways', refs: [[90, 8], [90, 9], [90, 10], [90, 11]], note: 'Have We not given him two eyes, a tongue and two lips, and shown him the two ways? Yet he has not attempted the steep pass.' },
    },
    {
      id: 'grain',
      kind: 'ration',
      requires: ['ways'],
      at: [1.5, -4],
      cups: 18,
      homes: [
        { at: [-9, 15.8], who: 'your orphaned cousins', people: 3 },
        { at: [8, 22.8], who: 'the old widow on the dusty slope', people: 1 },
        { at: [0, 30.8], who: 'the shepherd’s family', people: 5 },
      ],
      title: 'The steep pass',
      goal: 'Share the grain fairly at the storehouse, then carry each share up the steep pass',
      intro: 'Every person should get the same. Count the people in each house.',
      adaptation: 'The village, its households and the hungry year are a game idea; no one is shown. Feeding the hungry is a real good the surah names.',
      outro: 'Two cups for every person, carried up the steep pass to every door.',
      after: { title: 'What the steep pass is', refs: [[90, 12], [90, 13], [90, 14], [90, 15], [90, 16], [90, 17], [90, 18]], note: 'And what will make you know what the steep pass is? It is freeing a neck, or feeding on a day of hunger an orphan who is a relative, or a poor person in the dust; and then being among those who believe and urge one another to patience and urge one another to mercy. They are the people of the right hand.' },
    },
    {
      id: 'toil',
      kind: 'read',
      requires: ['grain'],
      at: [12, 8],
      marker: 'tablet',
      title: 'Created to toil',
      goal: 'Read at the tablet on the bend of the pass',
      reading: { title: 'Created to toil', refs: [[90, 1], [90, 2], [90, 3], [90, 4]], note: 'I swear by this city, and you are a dweller in this city, and by a parent and what they bring into being: We have created people to toil.' },
    },
  ],
  finale: {
    title: 'Up the steep pass',
    body: ['You shared the grain so every person had the same, and carried it up the steep pass to every door.', 'Surah Al-Balad calls feeding the hungry on a day of hunger the steep pass.'],
    ref: [90, 14],
    questions: ['Why does the surah call it a steep pass?', 'How did you work out a fair share?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet, addressed in 90:2, is never shown.', 'The freeing of a slave (90:13) is read only, never played.'],
};
