// Surah 63, Al-Munafiqun (The Hypocrites): the Lanterns of Now. A village
// in the late afternoon, its lanes winding between houses, a well, a pen
// and a bakery. The core play: chances to do good light up one at a time
// around the village, each marked by a lantern that slowly burns down. Get
// there while it is still lit and help; leave it for later and it goes out,
// and that chance has passed (63:10, "spend ... before death comes to one
// of you and he says, 'My Lord, if only You would delay me a little'"). The
// hypocrites of the surah are never shown or acted; their saying one thing
// and being another is read only. No one is shown.
import { curve } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const houses: Structure[] = [
  [-16, 12, 0.3], [16, 14, -0.3], [-20, -8, 0.5], [18, -10, -0.4], [0, -22, 0], [-6, 22, 0.1],
].map(([x, z, r], i) => ({ type: 'house', x, z, rot: r + Math.atan2(-x, -z), w: 5, d: 4.4, h: 3.2, accent: ['#3f6f8a', '#8a4a3a', '#5a7a4a', '#c8a040', '#6a5a8a', '#3f8a8a'][i] }));

export const W063: WorldDef = {
  surah: 63,
  name: 'The Lanterns of Now',
  theme: 'Reach each chance to do good while its lantern still burns',
  play: 'Around the village, lanterns light up one at a time where someone needs a hand, and each slowly burns down. Get there while it is still lit and help. If you leave it for later, it goes out, and that chance has passed.',
  seed: 6363,
  ground: {
    radius: 40,
    base: rolling({ radius: 40, amp: 1.4, seed: 63 }),
    palette: PAL.autumn,
    paths: [curve([[0, 36], [0, 22], [-8, 8], [0, 0], [10, -6], [6, -16]]), curve([[-24, 0], [-8, 2], [8, 4], [24, 2]])],
    flats: [{ x: 0, z: 0, r: 6 }, { x: 4, z: 30, r: 3 }],
  },
  look: { ...LOOKS.golden, sunI: 2.6 },
  veg: {
    grass: 1,
    flowers: ['#f0c080', '#fff2d8'],
    trees: [{ kind: 'autumn', area: { x: 0, z: 0, r: 30 }, count: 9 }, { kind: 'cypress', at: [[-4, 32], [4, 34]] }],
    rocks: [{ x: 28, z: 20, n: 4, big: 1, spread: 5 }],
    pebbles: 20,
    rim: ['autumn', 'oak'],
  },
  far: '#a8905a',
  mountains: { color: '#a090a0', height: 0.8 },
  start: [0, 36],
  startYaw: Math.PI,
  structures: [
    ...houses,
    { type: 'well', x: 3, z: 2 },
    { type: 'pen', x: -14, z: -16, w: 5, d: 4 },
    { type: 'stall', x: 12, z: 2, rot: -Math.PI / 2, color: '#a07a4a' },
  ],
  welcome:
    'Welcome to the Lanterns of Now. Surah Al-Munafiqun warns against letting wealth and family distract us from remembering Allah, and tells us to give now, before it is too late.',
  tasks: [
    {
      id: 'distract',
      kind: 'read',
      at: [4, 30],
      marker: 'sign',
      title: 'Do not be distracted',
      goal: 'Read at the sign at the edge of the village',
      reading: { title: 'Do not be distracted', refs: [[63, 9]], note: 'O you who believe, do not let your wealth or your children distract you from remembering Allah. Whoever does that, they are the losers.' },
    },
    {
      id: 'now',
      kind: 'chances',
      requires: ['distract'],
      title: 'Before it is too late',
      goal: 'Reach each lit lantern while it still burns, and help',
      intro: 'A lantern will light somewhere in the village where someone needs a hand. It burns down slowly. Go now, not later.',
      adaptation: 'The lanterns and the chances are a game idea based on 63:10. No one is shown.',
      life: 40,
      need: 4,
      spots: [
        { at: [6, 4], what: 'a neighbour’s water jar is empty', done: 'You fill the jar from the well and carry it to the door.' },
        { at: [-12, -12], what: 'a lamb has wandered out of its pen', done: 'You lead the lamb back and close the gate.' },
        { at: [16, -4], what: 'the bakery’s sack of flour has split', done: 'You help scoop up the flour into a new sack before the wind takes it.' },
        { at: [-14, 6], what: 'an old neighbour’s firewood is scattered', done: 'You stack the firewood neatly by the door.' },
        { at: [2, -16], what: 'the lamp oil at the mosque door is low', done: 'You fill the lamp so it will burn through the night.' },
        { at: [-4, 18], what: 'a basket of figs has tipped over in the lane', done: 'You gather the figs back into the basket.' },
      ],
      outro: 'Four chances, and you took each one while its lantern still burned.',
      after: { title: 'Before it is too late', refs: [[63, 10], [63, 11]], note: 'Give from what We have given you before death comes to one of you, and he says: "My Lord, if only You would give me a little more time, I would give in charity and be one of the righteous." But Allah will never delay a soul when its time has come. Allah knows well what you do.' },
    },
    {
      id: 'say',
      kind: 'read',
      requires: ['now'],
      at: [10, -10],
      marker: 'tablet',
      title: 'Saying and being',
      goal: 'Read at the tablet in the lane',
      adaptation: 'The hypocrites of these ayahs are never shown or acted; the ayah is read only.',
      reading: { title: 'Allah knows', refs: [[63, 1]], note: 'When the hypocrites come to you, they say, "We bear witness that you are the Messenger of Allah." Allah knows that you are His Messenger, and Allah bears witness that the hypocrites are lying.' },
    },
  ],
  finale: {
    title: 'Now, not later',
    body: ['You went to each lantern while it still burned and helped: water, a lamb, flour, firewood.', 'Surah Al-Munafiqun tells us to give now, before the time comes when we would wish for a little more.'],
    ref: [63, 10],
    questions: ['How did it feel when a lantern went out before you got there?', 'What good thing could you do today instead of later?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet and the hypocrites are never shown or acted.', 'The village and its chances are a game idea.'],
};
