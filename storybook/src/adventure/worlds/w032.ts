// Surah 32, As-Sajdah: the Grazing Hills. Green hills with three fenced
// paddocks around a stone fold. The core play: lead a small flock from
// paddock to paddock so it stays fed while the grass it has left grows back,
// and never let a paddock be eaten down to bare soil (32:27, "crops from
// which their livestock eat and [they] themselves"). The growing of the
// grass is only watched, never made.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W032: WorldDef = {
  surah: 32,
  name: 'The Grazing Hills',
  theme: 'Lead a flock between three paddocks so it stays fed and the grass grows back',
  play: 'A flock waits in the stone fold. Open a paddock gate to lead it in; where it grazes the grass goes down, and where it has left the grass grows back. Keep it fed through three days without any paddock eaten down to the soil.',
  seed: 3232,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 2.2, seed: 32, shapes: [{ x: -26, z: -26, r: 12, h: 4 }, { x: 26, z: -24, r: 12, h: 4 }] }),
    palette: PAL.meadow,
    paths: [curve([[0, 30], [0, 3]])],
    flats: [{ x: 0, z: 0, r: 4, paint: '#d8c8a4' }, { x: 0, z: -16, r: 7 }, { x: 15, z: 8, r: 7 }, { x: -15, z: 8, r: 7 }],
  },
  look: { ...LOOKS.morning, sunI: 3 },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#f4d060', '#d8b8f0'],
    trees: [{ kind: 'oak', at: [[-8, -4], [9, -6], [-24, 18], [24, 20]] }],
    rocks: [{ x: -28, z: 4, n: 5, big: 1, spread: 8 }],
    pebbles: 16,
    rim: ['oak', 'olive'],
  },
  far: '#6a9a4a',
  mountains: { color: '#8a9ab0', height: 0.9 },
  start: [0, 26],
  startYaw: Math.PI,
  structures: [],
  welcome:
    'Welcome to the Grazing Hills. Surah As-Sajdah asks: have they not seen how Allah drives water to dry land and brings out crops that the animals eat, and people too? A flock waits in the stone fold ahead.',
  tasks: [
    {
      id: 'perfected',
      kind: 'read',
      at: [3, 20],
      marker: 'sign',
      title: 'Made well',
      goal: 'Read at the sign on the path',
      reading: { title: 'He perfected everything', refs: [[32, 7]], note: 'Allah perfected everything He created, and He began the creation of the human being from clay.' },
    },
    {
      id: 'flock',
      kind: 'pasture',
      requires: ['perfected'],
      title: 'The flock on the hills',
      goal: 'Lead the flock between the paddocks for three days, without any paddock eaten bare',
      intro: 'Open a paddock gate to lead the flock in. Watch the grass: where the flock grazes it gets shorter, and where it has left it grows back. Lead the flock on before a paddock is bare.',
      adaptation: 'The paddocks, the days and the speed the grass grows are game ideas. The verse speaks of crops that livestock and people eat; the game shows only the care of a flock.',
      fold: [0, 0],
      paddocks: [
        { at: [0, -16], r: 6, name: 'north paddock' },
        { at: [15, 8], r: 6, name: 'east paddock' },
        { at: [-15, 8], r: 6, name: 'west paddock' },
      ],
      sheep: 7,
      days: 3,
      dayLen: 30,
      eat: 0.06,
      grow: 0.035,
      reading: { title: 'Do they not see?', refs: [[32, 27]], note: 'Have they not seen that Allah drives water to barren land and brings out crops from it, which their animals eat and they eat too? Do they not see?' },
      outro: 'The flock is fed and every paddock is still green.',
    },
    {
      id: 'senses',
      kind: 'read',
      requires: ['flock'],
      at: [-9, -4],
      marker: 'lantern',
      title: 'Hearing, sight and hearts',
      goal: 'Read at the lantern by the oak',
      reading: { title: 'Hearing, sight and hearts', refs: [[32, 9]], note: 'Allah proportioned the human being and made for you hearing, sight and hearts. Little are you grateful.' },
    },
    {
      id: 'rise',
      kind: 'read',
      requires: ['senses'],
      at: [10, -4],
      marker: 'sign',
      title: 'Rising at night',
      goal: 'Read at the sign by the other oak',
      reading: { title: 'In fear and hope', refs: [[32, 15], [32, 16]], note: 'The believers, when reminded by the verses, fall down in prostration and praise their Lord, and are not proud. They rise from their beds to call on their Lord in fear and hope, and they spend from what He has given them.' },
    },
  ],
  finale: {
    title: 'Fed and green',
    body: ['You led the flock around the hills so it was fed every day, and every paddock had time to grow back.', 'Surah As-Sajdah asks us to see how Allah brings life to the land, food for animals and for people.'],
    ref: [32, 27],
    questions: ['Why did the flock need to keep moving?', 'What do you see growing near your home?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The creation of the human being (32:7-9) is read only; nothing of it is shown.', 'The Day and the reward of the unseen (32:5, 32:17) are left to the whole-surah reading.'],
};
