// Surah 71, Nuh: the Courtyard of Light. A walled courtyard with a gap in
// its west wall where a beam of morning sun comes in, and a seedling in a
// dark corner. Nuh called his people to ask forgiveness of their Lord, who
// would send rain, gardens and rivers (71:10-12), and to look at the sky:
// "He made the moon therein a light and made the sun a burning lamp"
// (71:16). The moon has no light of its own; it shines with the sun's light
// sent back. The core play: turn mirrors on stands until the sunlight,
// sent back from mirror to mirror, reaches the seedling. Nuh, his people
// and the ship are never shown; his words are read only.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const WALL = '#d8c8a8';

export const W071: WorldDef = {
  surah: 71,
  name: 'The Courtyard of Light',
  theme: 'Send sunlight from mirror to mirror into a dark corner, as the moon sends back the sun’s light',
  play: 'Morning sun comes in through a gap in the courtyard wall, but one corner, where a seedling grows, stays dark. Walk to each mirror on its stand and turn it: slanted one way, slanted the other, or tipped flat so the light passes over. Send the light from mirror to mirror until it reaches the seedling.',
  seed: 7171,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 0.9, seed: 71 }),
    palette: PAL.meadow,
    paths: [curve([[0, -36], [-4, -24], [0, -12], [0, -8]])],
    flats: [{ x: 0, z: 0, r: 10, paint: '#d8ccb0' }, { x: -4, z: -24, r: 3 }, { x: 12, z: -14, r: 3 }],
  },
  look: LOOKS.morning,
  veg: {
    grass: 1,
    flowers: ['#f4d060', '#fff2d8', '#c8a0e0'],
    trees: [{ kind: 'oak', area: { x: 0, z: -24, r: 16 }, count: 6 }, { kind: 'cypress', at: [[-12, 12], [12, 12]] }],
    rocks: [{ x: -24, z: -4, n: 4, big: 1, spread: 5 }],
    pebbles: 14,
    rim: ['oak', 'cypress'],
  },
  far: '#8aa25a',
  mountains: { color: '#a0a8c0', height: 0.7 },
  start: [0, -36],
  startYaw: 0,
  structures: [
    { type: 'wall', x: -7.5, z: 7.5, to: [7.5, 7.5], h: 2.8, color: WALL },
    { type: 'wall', x: 7.5, z: 7.5, to: [7.5, -7.5], h: 2.8, color: WALL },
    { type: 'wall', x: -7.5, z: 3.8, to: [-7.5, -7.5], h: 2.8, color: WALL },
    { type: 'wall', x: -7.5, z: -7.5, to: [-1.8, -7.5], h: 2.8, color: WALL },
    { type: 'wall', x: 1.8, z: -7.5, to: [7.5, -7.5], h: 2.8, color: WALL },
  ],
  welcome:
    'Welcome to the Courtyard of Light. Nuh called his people again and again, by night and by day, to ask their Lord for forgiveness, and to look at the sky He made. The sun is a burning lamp. The moon has no light of its own: it sends back the sun’s light.',
  tasks: [
    {
      id: 'forgive',
      kind: 'read',
      at: [-4, -24],
      marker: 'sign',
      title: 'Ask forgiveness',
      goal: 'Read at the sign by the oak trees',
      adaptation: 'Nuh and his people are never shown; his words are read only.',
      reading: { title: 'Ask forgiveness', refs: [[71, 10], [71, 11], [71, 12]], note: 'I said, “Ask forgiveness of your Lord; He is ever forgiving. He will send rain from the sky upon you in plenty, and give you wealth and children, and give you gardens and rivers.”' },
    },
    {
      id: 'light',
      kind: 'reflect',
      requires: ['forgive'],
      title: 'A light sent back',
      goal: 'Turn the mirrors in the courtyard until the sunlight reaches the seedling in the dark corner',
      intro: 'The beam of sunlight crosses the courtyard and misses the dark corner. Turn the mirrors, one at a time, to send the light where it is needed.',
      adaptation: 'The courtyard and its mirrors are a game. Reflected light is real: the moon shines with the sun’s light, sent back.',
      origin: [-5, 5],
      cell: 2.5,
      cols: 5,
      rows: 5,
      sun: [0, 0, 0],
      target: [1, 4],
      mirrors: [
        { c: 3, r: 0, start: 0 },
        { c: 3, r: 3, start: 1 },
        { c: 1, r: 3, start: 1 },
        { c: 2, r: 0, start: 0 },
      ],
      outro: 'The light, sent back from mirror to mirror, falls on the seedling.',
      after: { title: 'A lamp and a light', refs: [[71, 15], [71, 16], [71, 17]], note: 'Do you not see how Allah created seven heavens in layers, and made the moon in them a light, and made the sun a burning lamp? And Allah made you grow from the earth like plants.' },
    },
    {
      id: 'roads',
      kind: 'read',
      requires: ['light'],
      at: [12, -14],
      marker: 'tablet',
      title: 'Wide roads',
      goal: 'Read at the tablet by the road out of the courtyard',
      reading: { title: 'Wide roads', refs: [[71, 19], [71, 20]], note: 'And Allah has made the earth a wide expanse for you, so that you may travel its broad roads.' },
    },
  ],
  finale: {
    title: 'Light sent back',
    body: ['The sun’s light reached the dark corner by bouncing from mirror to mirror, just as the moon sends the sun’s light back to us at night.', 'Nuh asked his people to look at the sky Allah made: a burning lamp, and a light.'],
    ref: [71, 16],
    questions: ['How is the sun’s light different from the moon’s?', 'Where else do you see light bounce?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Nuh is a prophet and is never shown, voiced or played; his words are read only.', 'The flood and the ship are not shown.'],
};
