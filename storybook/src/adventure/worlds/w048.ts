// Surah 48, Al-Fath (The Opening): the Road to the Open Gate. A road runs
// north through dry hills to a long wall with a closed gate. Before the
// gate is a broad acacia, a reminder of the pledge "under the tree"
// (48:18). The core play: the gate does not open for pushing. Wait calmly in
// the circle before it while things happen that tempt you to push or shout;
// stay calm each time, and the way opens. Tranquillity sent down upon the
// believers (48:4, 48:26) and the vision fulfilled (48:27) are readings. The
// gate is a game idea, not an event of the surah. The Prophet Muhammad,
// peace be upon him, and his companions are never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W048: WorldDef = {
  surah: 48,
  name: 'The Road to the Open Gate',
  theme: 'The gate opens to calm patience, not to pushing',
  play: 'A closed gate stands across the road. Pushing does not open it. Wait, still and calm, in the circle in front of it. Things will happen that tempt you to push or shout: keep calm each time, and the way opens.',
  seed: 4848,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.6, seed: 48, shapes: [{ x: -24, z: 10, r: 10, h: 4 }, { x: 24, z: 14, r: 10, h: 4 }, { x: 0, z: -30, r: 9, h: 3 }] }),
    palette: PAL.dry,
    paths: [curve([[0, 40], [2, 26], [0, 12], [0, -4], [0, -18], [0, -28]])],
    flats: [{ x: 0, z: 2, r: 5, paint: '#e2cc9e' }, { x: -8, z: 18, r: 5 }, { x: 0, z: -28, r: 4 }],
  },
  look: { ...LOOKS.golden, sunI: 3.2 },
  veg: {
    grass: 0.5,
    flowers: ['#e8c060'],
    trees: [{ kind: 'olive', at: [[-8, 18]], size: [1.7, 1.9] }, { kind: 'palm', at: [[14, 30], [-14, 32]] }],
    rocks: [{ x: 26, z: 26, n: 5, big: 1.1, spread: 8 }, { x: -26, z: -20, n: 4, big: 1, spread: 6 }],
    pebbles: 18,
    rim: ['olive', 'palm'],
  },
  far: '#c0a878',
  mountains: { color: '#b0a090', height: 0.8 },
  start: [0, 40],
  startYaw: Math.PI,
  structures: [
    { type: 'gate', x: 0, z: -4, rot: 0, w: 5, hide: 'gate', color: '#d8c4a0' },
    { type: 'wall', x: -2.6, z: -4, to: [-48, -4], color: '#c8b088' },
    { type: 'wall', x: 2.6, z: -4, to: [48, -4], color: '#c8b088' },
  ],
  welcome:
    'Welcome to the Road to the Open Gate. Surah Al-Fath, The Opening, tells how Allah sent down calm into the hearts of the believers, and how holding back opened the way. Walk up the road.',
  tasks: [
    {
      id: 'tree',
      kind: 'read',
      at: [-5, 15],
      marker: 'tablet',
      title: 'Under the tree',
      goal: 'Read at the tablet under the big tree',
      adaptation: 'The tree stands for the place mentioned in 48:18. No one is shown, and the pledge is read only.',
      reading: { title: 'The pledge under the tree', refs: [[48, 18]], note: 'Allah was pleased with the believers when they pledged loyalty to you under the tree. He knew what was in their hearts, so He sent down calm upon them and rewarded them with a victory near at hand.' },
    },
    {
      id: 'gate',
      kind: 'calm',
      requires: ['tree'],
      gate: [0, 1.5],
      r: 3,
      secs: 30,
      title: 'Wait at the gate',
      goal: 'Wait still and calm in the circle before the gate until it opens',
      intro: 'The gate is closed. It does not open for pushing. Stand still in the circle and wait calmly, whatever happens.',
      adaptation: 'The gate, the waiting and what happens at it are a game idea about calm and holding back (48:24-26). They are not the events of the surah, which are read separately.',
      stirs: [
        { text: 'A gust of wind slams the shutters on the wall. Bang!', calm: 'Stay still and keep waiting', push: 'Bang on the gate' },
        { text: 'A sharp voice from beyond the wall says you will never get in.', calm: 'Say nothing unkind, and keep waiting', push: 'Shout back over the wall' },
        { text: 'The sun is hot and the waiting feels very long.', calm: 'Breathe slowly and keep waiting', push: 'Kick the gate' },
      ],
      outro: 'The gate swings open. The way opened to patience, not to pushing.',
      after: { title: 'Calm sent down', refs: [[48, 26]], note: 'When those who disbelieved filled their hearts with the angry pride of ignorance, Allah sent down His calm upon His Messenger and the believers, and kept them to the word of mindfulness of Him.' },
    },
    {
      id: 'held',
      kind: 'read',
      requires: ['gate'],
      at: [3, -10],
      marker: 'lantern',
      title: 'Hands held back',
      goal: 'Read at the lantern beyond the gate',
      reading: { title: 'He held back their hands', refs: [[48, 24]], note: 'It is He who held back their hands from you, and your hands from them, in the valley of Makkah. And Allah sees what you do.' },
    },
    {
      id: 'vision',
      kind: 'read',
      requires: ['held'],
      at: [3, -26],
      marker: 'sign',
      title: 'In safety',
      goal: 'Read at the sign at the top of the road',
      reading: { title: 'The vision came true', refs: [[48, 27]], note: 'Allah has made true His Messenger’s vision: you will surely enter the Sacred Mosque, if Allah wills, in safety.' },
    },
    {
      id: 'seed',
      kind: 'read',
      requires: ['vision'],
      at: [-3, -26],
      marker: 'scroll',
      title: 'Like a plant growing strong',
      goal: 'Read at the scroll beside the sign',
      reading: { title: 'A plant that grows strong', refs: [[48, 29]], note: 'They are described like a plant that puts out its shoots, makes them strong, grows thick and stands firm on its stem, delighting the farmers.' },
    },
  ],
  finale: {
    title: 'The way opened',
    body: ['You waited at the gate, kept calm each time you were tempted to push, and the way opened.', 'Surah Al-Fath tells how Allah sent calm into the believers’ hearts and opened the way for them.'],
    ref: [48, 26],
    questions: ['Which moment made it hardest to stay calm?', 'When has waiting patiently helped you?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet Muhammad, peace be upon him, and his companions are never shown.', 'The gate is a game idea, not an event of the surah.'],
};
