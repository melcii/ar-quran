// Surah 57, Al-Hadid (Iron): the Village Forge. A hill village with a
// smithy in its square, fields on the slope below and a road out to the
// valley. The core play is at the forge: heat iron with the bellows, watch
// its colour for the working heat, and strike it into three useful things
// the village needs, a nail, a door hinge and a hoe blade, heating again
// when it dulls (57:25, "We sent down iron, wherein is great might and
// benefits for people"). Readings stand by the field, whose green turns
// yellow like the example of 57:20, and at the gate. No one is shown.
import { curve } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const village: Structure[] = [
  [-12, -4, 0.3], [-14, 8, 0.1], [12, -6, -0.3], [14, 8, -0.1], [-2, -16, 0],
].map(([x, z, r], i) => ({ type: 'house', x, z, rot: (i === 4 ? 0 : x < 0 ? Math.PI / 2 : -Math.PI / 2) + r, w: 5, d: 4.4, h: 3, accent: ['#7a5a3a', '#3f6f7a', '#8a4a3a', '#5a7a4a', '#6a5a8a'][i] }));

export const W057: WorldDef = {
  surah: 57,
  name: 'The Village Forge',
  theme: 'Heat iron to working heat and strike it into tools the village needs',
  play: 'In the square of a hill village stands a forge. Pump the bellows, watch the iron’s colour, and strike it at working heat into a nail, a door hinge and a hoe blade, heating it again whenever it dulls. Readings wait by the fields below and at the village gate.',
  seed: 5757,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.6, seed: 57, tilt: [0, 0.06], shapes: [{ x: 0, z: 0, r: 22, h: 1.5 }, { x: -30, z: -26, r: 14, h: 6 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 42], [6, 30], [-2, 18], [0, 6]]), curve([[-10, 2], [0, 2], [10, 2]])],
    flats: [{ x: 0, z: 2, r: 9, paint: '#d8c49a' }, { x: 12, z: 30, r: 4 }, { x: -6, z: 22, r: 3 }],
  },
  look: LOOKS.morning,
  veg: {
    grass: 1,
    // The field below the village: green at the top, yellowing lower down, like the example of 57:20.
    lush: (x, z) => (Math.hypot(x - 14, z - 24) < 9 ? (z > 24 ? 1 : 0.15) : 0.8),
    flowers: ['#fff2d8', '#e8c070', '#c8a0e0'],
    trees: [{ kind: 'oak', area: { x: 0, z: 0, r: 34 }, count: 7 }, { kind: 'cypress', at: [[-4, 36], [4, 38]] }, { kind: 'olive', area: { x: -20, z: 26, r: 10 }, count: 4 }],
    rocks: [{ x: -30, z: -26, n: 6, big: 1.4, spread: 8 }],
    pebbles: 24,
    rim: ['oak', 'pine'],
  },
  far: '#7a9a5a',
  mountains: { color: '#8a90a8', height: 1 },
  start: [0, 42],
  startYaw: Math.PI,
  structures: [
    ...village,
    { type: 'fence', x: 6, z: 20, to: [22, 20] },
    { type: 'arch', x: 0, z: 12, rot: 0, w: 4, color: '#b8a080' },
    { type: 'stall', x: -7, z: 9, rot: Math.PI / 2, color: '#6a4a3a' },
  ],
  welcome:
    'Welcome to the Village Forge. Surah Al-Hadid is named after iron, the strong metal people shape into tools. The village needs a few things made at its forge today.',
  tasks: [
    {
      id: 'first',
      kind: 'read',
      at: [3, 38],
      marker: 'sign',
      title: 'The First and the Last',
      goal: 'Read at the sign on the road up',
      reading: { title: 'The First and the Last', refs: [[57, 1], [57, 2], [57, 3]], note: 'Everything in the heavens and the earth glorifies Allah. His is the kingdom of the heavens and the earth; He gives life and causes death. He is the First and the Last, the Most High and the Most Near, and He knows everything.' },
    },
    {
      id: 'field',
      kind: 'read',
      requires: ['first'],
      at: [12, 30],
      marker: 'tablet',
      title: 'Green, then yellow',
      goal: 'Read at the tablet by the field',
      adaptation: 'The field is drawn green at the top and yellowing lower down, as a picture of the example.',
      reading: { title: 'Like rain and its plants', refs: [[57, 20]], note: 'This worldly life is play and amusement and show, and boasting, and wanting more wealth and children. It is like rain whose plants delight the farmers, then they dry up and you see them turn yellow, then they become broken bits. And the life of this world is only a passing enjoyment.' },
    },
    {
      id: 'iron',
      kind: 'forge',
      requires: ['field'],
      at: [0, 0],
      title: 'Iron with great strength',
      goal: 'At the forge in the village square, make a nail, a door hinge and a hoe blade',
      intro: 'Pump the bellows to heat the iron and watch its colour. Dark is too cold to shape: it may crack. Glowing red to orange is the working heat. White with sparks is too hot: it will burn. Strike only at working heat, and heat it again when it dulls.',
      adaptation: 'The forge and the three tools are a game idea. Working iron at a glowing heat, and heating it again as it cools, is how smiths really shape it.',
      items: [
        { name: 'nail', strikes: 3, use: 'A nail to hold the new roof beams together.' },
        { name: 'door hinge', strikes: 4, use: 'A hinge so a family’s door swings shut against the wind.' },
        { name: 'hoe blade', strikes: 5, use: 'A hoe blade to break the soil for the next sowing.' },
      ],
      outro: 'A nail, a hinge and a hoe blade: iron, made useful.',
      after: { title: 'We sent down iron', refs: [[57, 25]], note: 'We sent Our messengers with clear signs, and sent down with them the Book and the balance, so that people would act with justice. And We sent down iron, in which there is great strength and many benefits for people.' },
    },
    {
      id: 'spend',
      kind: 'read',
      requires: ['iron'],
      at: [3, 13],
      marker: 'tablet',
      title: 'Spend from what you were given',
      goal: 'Read at the tablet by the village gate',
      reading: { title: 'Spend', refs: [[57, 7]], note: 'Believe in Allah and His Messenger, and spend from what He has put in your care. Those who believe and spend will have a great reward.' },
    },
  ],
  finale: {
    title: 'Iron for good',
    body: ['You heated iron to its working heat and struck it into a nail, a hinge and a hoe blade, heating it again whenever it cooled.', 'Surah Al-Hadid says iron has great strength and benefits for people, and reminds us that this world passes like a field that turns from green to yellow.'],
    ref: [57, 25],
    questions: ['Why did the iron need to be just the right heat?', 'What useful thing would you make for your own town?'],
  },
  notes: ['Allah is never pictured, in any form.', 'No messenger and no one from the village is shown.'],
};
