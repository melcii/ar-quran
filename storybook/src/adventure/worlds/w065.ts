// Surah 65, At-Talaq (Divorce): the Move Over the Hill. A family is moving
// to a new house on the far side of a hill, and everything they own waits
// in the yard. The core play: share out the load among four carriers of
// different strength (a big cart, a small cart, a donkey and a handcart) so
// that every parcel goes and none carries more than it can (65:7, "Allah
// does not charge a soul except according to what He has given it"), then
// lead them up the hill and down to the new house ("Allah will bring about,
// after hardship, ease"). The surah's rulings on divorce are not played;
// they are read only, for grown-ups and scholars. No one is shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W065: WorldDef = {
  surah: 65,
  name: 'The Move Over the Hill',
  theme: 'Share out a family’s load so no carrier takes more than it can, then cross the hill',
  play: 'A family is moving to a new house over the hill. Share out everything they own among a big cart, a small cart, a donkey and a handcart, so that every parcel goes and no carrier takes more than it can. Then lead them up the hill and down the other side.',
  seed: 6565,
  ground: {
    radius: 48,
    base: rolling({ radius: 48, amp: 1.4, seed: 65, shapes: [{ x: 0, z: 0, r: 22, h: 6 }] }),
    palette: PAL.meadow,
    paths: [curve([[-26, 32], [-20, 20], [-10, 8], [0, 0], [10, -10], [20, -20], [26, -30]])],
    flats: [{ x: -22, z: 22, r: 6 }, { x: 22, z: -24, r: 6 }, { x: -24, z: 30, r: 3 }],
  },
  look: LOOKS.morning,
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#f4d060', '#c8a0e0'],
    trees: [{ kind: 'oak', area: { x: 0, z: 0, r: 34 }, count: 9 }, { kind: 'blossom', at: [[-30, 18], [28, -14]] }],
    rocks: [{ x: 6, z: 8, n: 5, big: 1.2, spread: 8 }],
    pebbles: 24,
    rim: ['oak', 'pine'],
  },
  far: '#7a9a5a',
  mountains: { color: '#8a90a8', height: 0.9 },
  start: [-26, 34],
  startYaw: Math.PI * 0.85,
  structures: [
    { type: 'house', x: -30, z: 24, rot: Math.PI / 2, w: 5, d: 4.4, h: 3, accent: '#5a7a4a' },
    { type: 'house', x: 28, z: -26, rot: -Math.PI / 2, w: 6, d: 5, h: 3.2, accent: '#3f6f9a' },
    { type: 'fence', x: -27, z: 16, to: [-17, 16] },
  ],
  welcome:
    'Welcome to the Move Over the Hill. A family is moving to a new house today, and everything they own is waiting in the yard. Surah At-Talaq is about families going through hard changes, and it promises that after hardship Allah brings ease.',
  tasks: [
    {
      id: 'wayout',
      kind: 'read',
      at: [-23, 30],
      marker: 'sign',
      title: 'A way out',
      goal: 'Read at the sign by the yard',
      adaptation: 'The rulings in these ayahs are for grown-ups and scholars and are not played; only their promise is told here.',
      reading: { title: 'A way out', refs: [[65, 2], [65, 3]], note: 'Whoever is mindful of Allah, He will make a way out for them, and provide for them from where they never expected. Whoever relies on Allah, He is enough for them.' },
    },
    {
      id: 'move',
      kind: 'loads',
      requires: ['wayout'],
      at: [-20, 22],
      to: [22, -22],
      title: 'Not beyond what it can carry',
      goal: 'Share the family’s things among the four carriers, then lead them over the hill to the new house',
      intro: 'Each carrier can take only so much: the big cart 12, the small cart 7, the donkey 5 and the handcart 3. Everything must go, and no carrier may take more than it can.',
      adaptation: 'The family’s move is a game idea based on 65:7. No one is shown.',
      carts: [{ name: 'big cart', cap: 12 }, { name: 'small cart', cap: 7 }, { name: 'donkey', cap: 5 }, { name: 'handcart', cap: 3 }],
      parcels: [
        { name: 'wooden chest', w: 6 },
        { name: 'flour sack', w: 4 },
        { name: 'grain sack', w: 4 },
        { name: 'water jars', w: 3 },
        { name: 'bedding', w: 3 },
        { name: 'cooking pots', w: 2 },
        { name: 'olive oil', w: 2 },
        { name: 'lamps', w: 2 },
        { name: 'books', w: 1 },
      ],
      outro: 'Up the hill and down again: everything arrived, and no one carried more than they could.',
      after: { title: 'After hardship, ease', refs: [[65, 7]], note: 'Let the one who has plenty spend from his plenty, and the one who has little spend from what Allah has given him. Allah does not ask anyone for more than He has given them. Allah will bring ease after hardship.' },
    },
  ],
  finale: {
    title: 'After hardship, ease',
    body: ['You shared out a whole family’s things so that no carrier had more than it could take, and led them up the hill and down to their new home.', 'Surah At-Talaq says Allah does not ask anyone for more than He has given them, and that after hardship He brings ease.'],
    ref: [65, 7],
    questions: ['Why could the handcart not take the chest?', 'When has something hard been followed by something easier for you?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The rulings on divorce in this surah are read only, never played or explained as a game.', 'The family is never shown.'],
};
