// Surah 46, Al-Ahqaf (The Curving Sand Dunes): the Dune Road. Long curving
// dunes with a path winding between them to a well. The surah is named for
// the dunes where Hud warned 'Ad (46:21). The core play: a windy spell is
// coming; set up a few palm-frond windbreaks at the posts beside the path,
// then wait out the spell at the well, keeping the path open. Sand piles up
// wherever no windbreak stands upwind. The wind that came upon 'Ad
// (46:24-25) is read only: it is never played or shown, and the windy spell
// here is ordinary weather. No one is shown; the jinn (46:29-31) are not
// pictured.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

// The path runs north to south; the wind blows from the east (toward -x).
const SEG: [number, number][] = [[1, 22], [-1, 10], [1, -2], [0, -14]];

export const W046: WorldDef = {
  surah: 46,
  name: 'The Dune Road',
  theme: 'Keep the path between the dunes open through a windy spell, with only a few windbreaks',
  play: 'A path winds between the curving dunes to a well. Set up your four windbreaks at the posts beside the path, then wait out the windy spell at the well. Sand piles up wherever no windbreak stands on the windward side; if the path is buried, try again.',
  seed: 4646,
  ground: {
    radius: 48,
    base: rolling({
      radius: 48,
      amp: 1,
      seed: 46,
      shapes: [
        { x: 14, z: 26, r: 8, h: 3.5 },
        { x: 16, z: 6, r: 9, h: 4 },
        { x: 14, z: -16, r: 8, h: 3.5 },
        { x: -14, z: 18, r: 8, h: 3 },
        { x: -16, z: -6, r: 9, h: 3.5 },
        { x: 26, z: -30, r: 10, h: 4 },
        { x: -26, z: 30, r: 10, h: 4 },
      ],
    }),
    palette: PAL.desert,
    paths: [curve([[0, 40], [1, 22], [-1, 10], [1, -2], [0, -14], [0, -24]])],
    flats: [{ x: 0, z: -26, r: 5, paint: '#e8d4a8' }, { x: -6, z: 36, r: 3 }],
  },
  look: { ...LOOKS.desert, sunI: 3.3 },
  veg: {
    grass: 0.15,
    trees: [{ kind: 'palm', at: [[-5, -28], [6, -30], [4, -22]] }],
    rocks: [{ x: -30, z: -30, n: 4, big: 1, spread: 6 }],
    pebbles: 10,
    rim: ['palm'],
  },
  far: '#d8b880',
  mountains: { color: '#c8a888', height: 0.6 },
  start: [0, 42],
  startYaw: Math.PI,
  structures: [{ type: 'well', x: -2, z: -27 }],
  welcome:
    'Welcome to the Dune Road. Surah Al-Ahqaf is named after the long, curving sand dunes where the people of ‘Ad lived. A path winds between the dunes to a well, and a windy spell is coming.',
  tasks: [
    {
      id: 'warned',
      kind: 'read',
      at: [-4, 34],
      marker: 'tablet',
      title: 'Among the curving dunes',
      goal: 'Read at the tablet at the start of the path',
      adaptation: 'Hud and the people of ‘Ad are not shown; these ayahs are read only. Their story is played in Surah Hud’s world.',
      reading: { title: 'The brother of ‘Ad', refs: [[46, 21], [46, 23]], note: 'Remember the brother of ‘Ad, when he warned his people among the curving dunes: "Worship none but Allah. I fear for you the punishment of a terrible day." He said: "The knowledge of when is only with Allah. I tell you what I was sent with."' },
    },
    {
      id: 'road',
      kind: 'dunes',
      requires: ['warned'],
      title: 'Keep the road open',
      goal: 'Set up four windbreaks beside the path, then wait out the windy spell at the well',
      intro: 'A windy spell is coming, and the sand will blow across the path. You have four palm-frond windbreaks and more posts than windbreaks. Look at the windsock by the well to see which way the wind blows.',
      adaptation: 'The windbreaks and the windy spell are a game idea set in dune country. They are not the wind that came upon ‘Ad (46:24-25), which is only read.',
      segments: SEG,
      spots: [
        ...SEG.map(([x, z], k) => ({ at: [x + 3.4, z] as [number, number], guards: k })),
        { at: [-2.6, 16], guards: null },
        { at: [-3.4, 4], guards: null },
        { at: [-3, -8], guards: null },
      ],
      fences: 4,
      secs: 40,
      well: [0, -24],
      wind: -Math.PI / 2,
      outro: 'The spell has passed, and the path to the well is still open.',
    },
    {
      id: 'cloud',
      kind: 'read',
      requires: ['road'],
      at: [3, -20],
      marker: 'lantern',
      title: 'Not a rain cloud',
      goal: 'Read at the lantern by the well',
      adaptation: 'What happened to ‘Ad is read only; nothing of it is shown.',
      reading: { title: 'They thought it was rain', refs: [[46, 24], [46, 26]], note: 'When they saw it as a cloud coming toward their valleys, they said: "This cloud will bring us rain!" No: it was what they had asked to be hurried, a wind carrying a painful punishment. They had been given hearing, sight and hearts, but these did not help them when they kept rejecting Allah’s signs.' },
    },
    {
      id: 'parents',
      kind: 'choice',
      requires: ['cloud'],
      at: [-5, -24],
      back: [-6, -18],
      marker: 'sign',
      title: 'Good to your parents',
      goal: 'Answer the situations at the sign by the well',
      intro: 'The surah teaches kindness to parents, and a prayer to be grateful for what Allah gave you and them.',
      adaptation: 'The situations are everyday ones written for this game.',
      scenes: [
        {
          text: 'Your mother is tired after a long day and the table needs clearing.',
          options: [
            { text: 'Clear the table without being asked.', ok: true, reply: 'Yes. The surah says Allah has told us to be good to our parents (46:15).' },
            { text: 'Wait until someone tells you to.', ok: false, reply: 'Being good to parents often means noticing what they need. Try again.' },
          ],
        },
        {
          text: 'You want to thank Allah for your family.',
          options: [
            { text: 'Say: "My Lord, help me be grateful for the favour You gave me and my parents."', ok: true, reply: 'That is the prayer in 46:15.' },
            { text: 'Gratitude can wait until later.', ok: false, reply: 'The surah teaches us to ask for gratefulness now. Think again.' },
          ],
        },
      ],
      reading: { title: 'Kindness to parents', refs: [[46, 15]], note: 'We have told people to be good to their parents. Their mother carried them with hardship and gave birth to them with hardship. When they grow up they say: "My Lord, help me be grateful for the favour You gave me and my parents, and to do good that pleases You."' },
    },
    {
      id: 'listen',
      kind: 'read',
      requires: ['parents'],
      at: [5, 30],
      marker: 'scroll',
      title: 'Listen quietly',
      goal: 'Read at the scroll on the way back',
      adaptation: 'The jinn are of the unseen and are not pictured; these ayahs are read only.',
      reading: { title: 'They said: listen quietly', refs: [[46, 29], [46, 30]], note: 'A group of jinn came to listen to the Quran. When they were there, they said: "Listen quietly!" Then they went back to their people and said: "We have heard a Book sent down after Musa, confirming what came before it, guiding to the truth and to a straight path."' },
    },
  ],
  finale: {
    title: 'The road stayed open',
    body: ['You set up windbreaks on the windward side of the path and kept the road to the well open.', 'Surah Al-Ahqaf reminds us of a people who mistook a punishing wind for rain, and teaches kindness to parents.'],
    ref: [46, 21],
    questions: ['How did you work out where the windbreaks should go?', 'What is one kind thing you can do for your parents today?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Hud and the people of ‘Ad are never shown; the wind that came upon them is read only.', 'The jinn are not pictured.'],
};
