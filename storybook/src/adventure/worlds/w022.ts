// Surah 22, Al-Hajj: the Pilgrimage Verses. A wide valley ringed by hills
// with passes, and in the middle a map model on a stone plinth. The core
// play is order: four carved stones each tell one step that 22:26-29 gives,
// and they are set on the model in the order of the verses. Each one changes
// the model. There is no replica of the Kaaba or of the Sacred Mosque (a
// plain round marker stands for the site of the House), no people are shown,
// and worship is never scored or raced.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W022: WorldDef = {
  surah: 22,
  name: 'The Pilgrimage Verses',
  theme: 'Set the steps of the pilgrimage verses in their order on a map model',
  play: 'Four carved stones lie around a valley, each telling one step from 22:26-29. Carry them to the map model and set them in the order the verses give. A stone set too early is handed back. Each one changes the model.',
  seed: 2222,
  ground: {
    radius: 50,
    base: rolling({
      radius: 50,
      amp: 1.6,
      seed: 22,
      shapes: [
        { x: -30, z: -20, r: 12, h: 6 },
        { x: 30, z: -18, r: 12, h: 6 },
        { x: -28, z: 24, r: 10, h: 5 },
        { x: 30, z: 22, r: 10, h: 5 },
      ],
    }),
    palette: PAL.desert,
    paths: [curve([[0, 40], [0, 8]]), curve([[-14, 10], [0, 4], [12, -12]]), curve([[-10, -16], [0, -4], [14, 12]])],
    flats: [{ x: 0, z: 0, r: 7, paint: '#e8d8b4' }],
  },
  look: { ...LOOKS.desert, sunI: 3.2 },
  veg: {
    grass: 0.3,
    dryGrass: true,
    trees: [{ kind: 'palm', at: [[-16, 20], [-19, 17], [18, 20], [20, 23]] }],
    rocks: [{ x: 0, z: -30, n: 10, big: 1.8, spread: 30 }],
    pebbles: 40,
    rim: ['palm'],
  },
  far: '#c8a878',
  mountains: { color: '#a88a6a', height: 1.2 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Pilgrimage Verses. Surah Al-Hajj tells of the House, of the call to the pilgrimage, and of people coming from every distant pass. In the middle of the valley is a map model. Four carved stones lie around the valley; each tells one step from the verses.',
  tasks: [
    {
      id: 'verses',
      kind: 'order',
      title: 'The verses in order',
      goal: 'Carry the four stones to the map model and set them in the order the verses give',
      intro: 'Pick up a stone and read what it tells. Then set it on the model. The verses give the steps in an order: which comes first?',
      adaptation: 'The map model is a game picture. A plain round marker stands for the site of the House: there is no replica of the Kaaba or of the Sacred Mosque, and no people are shown (the travellers are small moving lights). The stones follow the order of 22:26-29 only; the full rites of the Hajj are for teachers, not this game.',
      model: [0, 0],
      stones: [
        { at: [14, 12], label: 'The House made ready', reading: { title: 'The House made ready', refs: [[22, 26]], note: 'Allah showed Ibrahim the site of the House and told him: do not associate anything with Me, and keep My House pure for those who go round it, and those who stand, bow and prostrate in prayer.' } },
        { at: [-14, 10], label: 'The call, and travellers from every distant pass', reading: { title: 'From every distant pass', refs: [[22, 27]], note: 'Call the people to the Hajj: they will come on foot and on lean camels, from every distant pass.' } },
        { at: [12, -12], label: 'Remembering Allah, and feeding the poor', reading: { title: 'Remember, and feed the poor', refs: [[22, 28]], note: 'So that they may see what benefits them, and mention the name of Allah on the known days over the animals He has given them. Eat from them, and feed those who are poor and in need.' } },
        { at: [-10, -16], label: 'Vows kept, and the ancient House', reading: { title: 'The ancient House', refs: [[22, 29]], note: 'Then let them finish their rites, keep their vows, and go round the ancient House.' } },
      ],
      reading: {
        title: 'What reaches Him',
        refs: [[22, 37]],
        note: 'Neither the meat nor the blood reaches Allah. What reaches Him is the mindfulness of Him in your hearts.',
      },
      outro: 'The four stones stand in the order of the verses.',
    },
    {
      id: 'hearts',
      kind: 'read',
      requires: ['verses'],
      at: [-4, 30],
      marker: 'lantern',
      title: 'From the hearts',
      goal: 'Read at the lantern by the path',
      reading: {
        title: 'The piety of hearts',
        refs: [[22, 32]],
        note: 'Whoever honours the signs and symbols of Allah: that comes from the mindfulness of the heart.',
      },
    },
  ],
  finale: {
    title: 'What reaches Him',
    body: ['You set the steps of the pilgrimage verses in their order, and saw the model change with each one.', 'Surah Al-Hajj teaches that what matters is not only the outward act but the mindfulness in the heart.'],
    ref: [22, 37],
    questions: ['Which step in the verses is about caring for other people?', 'What does it mean that what reaches Allah is what is in the heart?'],
  },
  notes: [
    'Allah is never pictured, in any form.',
    'Ibrahim is not shown; 22:26 is read only.',
    'There is no replica of the Kaaba or of the Sacred Mosque. Reviewers should decide what may be shown.',
    'No pilgrims are shown, and worship is never scored or raced.',
  ],
};
