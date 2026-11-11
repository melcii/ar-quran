// Surah 79, An-Nazi'at (Those Who Pull Out): the Upland Well. A dry upland
// by a shepherds' track below firm mountains, with bare ground and an empty
// stone trough. "He spread the earth, brought out from it its water and its
// pasture, and set the mountains firm, as provision for you and your
// grazing animals" (79:30-33). The core play: dig a well metre by metre,
// spade for soft ground and pick for rock, lining the walls with stones as
// you go, until water comes; then the trough fills and the ground around it
// turns green. Musa and Pharaoh (79:15-26) are read only; Musa is never
// shown, voiced or played, and the angels of 79:1-5 are never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W079: WorldDef = {
  surah: 79,
  name: 'The Upland Well',
  theme: 'Dig a lined well through soil, clay and rock until water and pasture come',
  play: 'On a dry upland by a shepherds’ track the ground is bare, but water lies deep below. Dig a well metre by metre: a spade for soft ground and a pick for rock. Line the walls with stones as you go, or they will crumble in. When water comes, the trough fills and the dry ground turns green.',
  seed: 7979,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.3, seed: 79 }),
    palette: PAL.desert,
    paths: [curve([[0, -36], [-8, -22], [-2, -10], [0, -4]]), curve([[0, 0], [14, 10], [18, 24]])],
    flats: [{ x: 0, z: 0, r: 7 }, { x: -8, z: -22, r: 3 }, { x: 18, z: 24, r: 3 }],
  },
  look: LOOKS.desert,
  veg: {
    grass: 0.3,
    flowers: ['#e8c070'],
    trees: [{ kind: 'olive', at: [[-14, 8], [12, -12]] }],
    rocks: [{ x: -22, z: 10, n: 6, big: 1.4, spread: 7 }, { x: 24, z: -6, n: 5, big: 1.3, spread: 6 }],
    pebbles: 34,
    rim: ['olive'],
  },
  far: '#c0a070',
  mountains: { color: '#b0907a', height: 1.3 },
  start: [0, -36],
  startYaw: 0,
  structures: [
    { type: 'pen', x: -9, z: 6 },
    { type: 'stones', x: 5, z: 6, n: 6 },
  ],
  welcome:
    'Welcome to the Upland Well. Surah An-Nazi’at says Allah spread the earth, brought out from it its water and its pasture, and set the mountains firm, as provision for us and our animals. Here the ground is dry, but water is waiting far below.',
  tasks: [
    {
      id: 'musa',
      kind: 'read',
      at: [-8, -22],
      marker: 'sign',
      title: 'Go to Pharaoh',
      goal: 'Read at the sign on the shepherds’ track',
      adaptation: 'Musa is a prophet and is never shown, voiced or played. Pharaoh is not shown either; the account is read only.',
      reading: { title: 'Go to Pharaoh', refs: [[79, 15], [79, 16], [79, 17], [79, 18], [79, 19]], note: 'Has the story of Musa reached you? When his Lord called to him in the sacred valley of Tuwa: “Go to Pharaoh, for he has gone too far. And say to him: Would you like to purify yourself, and let me guide you to your Lord, so that you will be in awe of Him?”' },
    },
    {
      id: 'well',
      kind: 'dig',
      requires: ['musa'],
      at: [0, 0],
      line: 2,
      layers: [
        { name: 'dry topsoil', to: 1, tool: 'spade' },
        { name: 'hard red clay', to: 3, tool: 'spade' },
        { name: 'a band of rock', to: 4, tool: 'pick' },
        { name: 'loose gravel', to: 6, tool: 'spade' },
        { name: 'damp sand', to: 7, tool: 'spade' },
      ],
      title: 'Water and pasture',
      goal: 'Dig the well down to water, using the right tool and lining the walls as you go',
      intro: 'Dig one metre at a time. Use the spade for soft ground and the pick for rock, and never dig more than two metres below the stone lining.',
      adaptation: 'The upland and its layers are a game idea. Digging wells and lining them with stone is real and very old.',
      outro: 'Water at seven metres! The trough is full, and green comes up around it.',
      after: { title: 'Water and pasture', refs: [[79, 27], [79, 28], [79, 29], [79, 30], [79, 31], [79, 32], [79, 33]], note: 'Are you harder to create, or the sky? He built it, raised its ceiling high and made it even, darkened its night and brought out its morning. And after that He spread the earth, brought out from it its water and its pasture, and set the mountains firm, as provision for you and your animals.' },
    },
    {
      id: 'refuge',
      kind: 'read',
      requires: ['well'],
      at: [18, 24],
      marker: 'tablet',
      title: 'Holding the self back',
      goal: 'Follow the track to the tablet on the rise',
      reading: { title: 'Holding the self back', refs: [[79, 40], [79, 41]], note: 'But as for the one who feared standing before his Lord and held himself back from wrong desires, the Garden will be his home.' },
    },
  ],
  finale: {
    title: 'Water from the earth',
    body: ['Through soil, clay, rock, gravel and sand you dug, lining as you went, until water came and the ground turned green.', 'Surah An-Nazi’at says Allah brought out from the earth its water and its pasture.'],
    ref: [79, 31],
    questions: ['Why did the walls need lining?', 'Where does the water in a well come from?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Musa is a prophet and is never shown, voiced or played; Pharaoh is not shown.', 'The angels of 79:1-5 and the Day of 79:6-14 and 79:34-46 are not shown.'],
};
