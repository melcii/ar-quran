// Surah 37, As-Saffat: the Gourd Vine Shore. A hot, open beach with an empty
// shade frame over a resting mat, and a young gourd vine growing from the
// sand. The core play: carry stakes and plant them in a line close enough
// for the vine to climb from stake to stake up onto the frame, so it gives
// shade (37:145-146). Yunus is never shown; the mat stays empty.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W037: WorldDef = {
  surah: 37,
  name: 'The Gourd Vine Shore',
  theme: 'Plant stakes so a gourd vine can climb to shade an empty mat on a hot shore',
  play: 'On a hot beach a young gourd vine grows from the sand. A vine only climbs what it can reach: carry stakes from the bundle and plant them close enough, one after another, for it to climb up onto the shade frame.',
  seed: 3737,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 0.8, seed: 37, tilt: [0, 0.06] }),
    palette: PAL.coast,
    paths: [curve([[0, 30], [0, 10]])],
    water: -1.2,
    flats: [{ x: 0, z: 0, r: 12, paint: '#ecdcae' }],
  },
  look: { ...LOOKS.sea, sunI: 3.4 },
  veg: {
    grass: 0.4,
    flowers: ['#fff2d8'],
    trees: [{ kind: 'palm', at: [[-14, 12], [14, 16], [-20, 22]] }],
    rocks: [{ x: 22, z: 4, n: 6, big: 1, spread: 8 }],
    pebbles: 30,
    rim: ['palm'],
  },
  far: '#8aa8c8',
  mountains: { color: '#9aa8c0', height: 0.7 },
  start: [0, 26],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Gourd Vine Shore. Surah As-Saffat tells how Yunus was cast onto an open shore, ill, and Allah caused a gourd vine to grow over him. Here, on a hot beach, an empty shade frame waits for a vine.',
  tasks: [
    {
      id: 'ranks',
      kind: 'read',
      at: [3, 20],
      marker: 'sign',
      title: 'Stars in the sky',
      goal: 'Read at the sign on the path',
      reading: { title: 'Adorned with stars', refs: [[37, 6]], note: 'Allah has adorned the nearest sky with the beauty of the stars.' },
    },
    {
      id: 'vine',
      kind: 'vine',
      requires: ['ranks'],
      title: 'Shade from a gourd vine',
      goal: 'Plant stakes so the vine can climb onto the shade frame',
      intro: 'The young vine needs something to climb. Take a stake from the bundle, carry it toward the shade frame and plant it close to the vine. Keep planting until the vine reaches the frame.',
      adaptation: 'Planting stakes is a game idea. In the Quran, Allah caused the gourd vine to grow over Yunus (37:146); no one planted it, and Yunus is not shown. The mat stays empty.',
      root: [-6, 6],
      frame: [6, -6],
      bundle: [-8, 9],
      gap: 3,
      speed: 0.9,
      reading: { title: 'A gourd vine over him', refs: [[37, 139], [37, 140], [37, 141], [37, 142], [37, 143], [37, 144], [37, 145], [37, 146]], note: 'Yunus was one of the messengers. He ran away to the laden ship, drew lots and lost, and the fish swallowed him. Had he not been one who glorified Allah, he would have stayed inside it. Then Allah cast him onto the open shore, ill, and caused a gourd vine to grow over him.' },
      outro: 'The vine has climbed onto the frame, and there is cool shade over the mat.',
    },
    {
      id: 'sent',
      kind: 'read',
      requires: ['vine'],
      at: [-12, -2],
      marker: 'lantern',
      title: 'A hundred thousand',
      goal: 'Read at the lantern by the rocks',
      reading: { title: 'Sent again', refs: [[37, 147], [37, 148]], note: 'Then Allah sent him to a hundred thousand people or more, and they believed, so they were given enjoyment of life for a time.' },
    },
  ],
  finale: {
    title: 'Shade on the shore',
    body: ['You helped a gourd vine climb, stake by stake, until it shaded the frame.', 'Surah As-Saffat ends: Exalted is your Lord, peace upon the messengers, and praise to Allah, Lord of the worlds.'],
    ref: [37, 182],
    questions: ['Why did the vine need the stakes close together?', 'When have you needed shade, or help, on a hard day?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Yunus is never shown, and nothing of the fish or the ship is acted out.', 'Ibrahim and his son (37:99-111) are left to the whole-surah reading.', 'Devils and angels (37:1-10) are not shown.'],
};
