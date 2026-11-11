// Surah 89, Al-Fajr (The Dawn): the Dawn Palm Grove. A palm grove at
// first light, with baskets of dates on a mat, two small bowls for two
// orphan sisters who live by the grove, and a basket by the gate for a poor
// family. "By the dawn, and ten nights, and the even and the odd" (89:1-3);
// "No! But you do not honour the orphan, and you do not urge one another to
// feed the poor" (89:17-18). The core play: share each basket fairly by
// pairing the dates, one for each sister, and say whether the count was
// even or odd; an odd one goes to the poor family. No one is shown. 'Ad,
// Iram, Thamud and Pharaoh (89:6-14) are read only.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W089: WorldDef = {
  surah: 89,
  name: 'The Dawn Palm Grove',
  theme: 'Share dates fairly by pairing them, and learn the even and the odd',
  play: 'At dawn in a palm grove, baskets of dates wait to be shared between two orphan sisters. Pair the dates up, one for each sister. If none is left over the count was even; if one is left over it was odd, and that date goes in the basket for the poor family at the gate.',
  seed: 8989,
  ground: {
    radius: 42,
    base: rolling({ radius: 42, amp: 0.8, seed: 89 }),
    palette: PAL.dry,
    paths: [curve([[0, -36], [-6, -24], [2, -12], [0, -4]])],
    flats: [{ x: 4, z: -30, r: 2.5 }, { x: 0, z: 0, r: 7 }, { x: -6, z: -24, r: 3 }, { x: 12, z: 14, r: 3 }],
  },
  look: { ...LOOKS.blossom, sun: [0.8, 0.12, -0.5], sunI: 2.6 },
  veg: {
    grass: 0.6,
    flowers: ['#f4d060'],
    trees: [{ kind: 'palm', area: { x: 0, z: 10, r: 26 }, count: 14 }],
    rocks: [],
    pebbles: 12,
    rim: ['palm'],
  },
  far: '#a8905a',
  mountains: { color: '#a090a8', height: 0.7 },
  start: [0, -36],
  startYaw: 0,
  structures: [
    { type: 'fence', x: -8, z: -6, to: [-1.6, -6] },
    { type: 'fence', x: 1.6, z: -6, to: [10, -6] },
  ],
  welcome:
    'Welcome to the Dawn Palm Grove. Surah Al-Fajr swears by the dawn, by ten nights, and by the even and the odd, and it warns those who do not honour the orphan or urge others to feed the poor. The dates are picked. Share them fairly.',
  tasks: [
    {
      id: 'peoples',
      kind: 'read',
      at: [4, -30],
      marker: 'sign',
      title: '’Ad, Thamud and Pharaoh',
      goal: 'Read at the sign near the way in',
      adaptation: '’Ad, Thamud, Pharaoh and their end are read only; none is shown.',
      reading: { title: '’Ad, Thamud and Pharaoh', refs: [[89, 6], [89, 7], [89, 8], [89, 9], [89, 10], [89, 11], [89, 12], [89, 13], [89, 14]], note: 'Have you not seen how your Lord dealt with ’Ad, Iram of the lofty pillars, and Thamud, who carved the rocks in the valley, and Pharaoh, owner of the stakes, who all transgressed in the lands and spread much corruption in them? So your Lord poured upon them a scourge. Indeed, your Lord is ever watchful.' },
    },
    {
      id: 'dawn',
      kind: 'read',
      at: [-6, -24],
      marker: 'sign',
      title: 'By the dawn',
      goal: 'Read at the sign on the path to the grove',
      reading: { title: 'By the dawn', refs: [[89, 1], [89, 2], [89, 3], [89, 4], [89, 5]], note: 'By the dawn, and the ten nights, and the even and the odd, and the night as it passes! Is that not an oath for those with understanding?' },
    },
    {
      id: 'share',
      kind: 'evenodd',
      requires: ['dawn'],
      at: [0, 2],
      baskets: [
        { what: 'A basket of golden dates', n: 12 },
        { what: 'A basket of dark, soft dates', n: 9 },
        { what: 'A small basket of dried dates', n: 7 },
        { what: 'A basket of big red dates', n: 10 },
      ],
      title: 'The even and the odd',
      goal: 'Share each basket between the two sisters by pairing the dates, and say whether it was even or odd',
      intro: 'Pair the dates, one for each sister, until no pair is left. Then say: even, or odd?',
      adaptation: 'The grove and the sisters are a game idea, and no one is shown. Honouring orphans and feeding the poor are real duties the surah names.',
      outro: 'Every basket shared fairly, and the odd dates went to the poor family.',
      after: { title: 'Honour the orphan', refs: [[89, 15], [89, 16], [89, 17], [89, 18], [89, 19], [89, 20]], note: 'As for a person, when their Lord tests them by honouring them and giving them good things, they say, “My Lord has honoured me.” But when He tests them by limiting their provision, they say, “My Lord has humiliated me.” No! You do not honour the orphan, nor urge one another to feed the poor, and you eat up inheritance greedily, and love wealth with a great love.' },
    },
    {
      id: 'soul',
      kind: 'read',
      requires: ['share'],
      at: [12, 14],
      marker: 'tablet',
      title: 'O soul at peace',
      goal: 'Read at the tablet among the palms',
      reading: { title: 'O soul at peace', refs: [[89, 27], [89, 28], [89, 29], [89, 30]], note: 'O soul at peace! Return to your Lord, pleased and pleasing. Enter among My servants, and enter My Garden.' },
    },
  ],
  finale: {
    title: 'Fair shares',
    body: ['Twelve and ten were even; nine and seven were odd, and the odd dates went to the poor family.', 'Surah Al-Fajr swears by the even and the odd, and asks us to honour the orphan and feed the poor.'],
    ref: [89, 3],
    questions: ['How can you tell if a number is even without counting it all?', 'How can we honour orphans where we live?'],
  },
  notes: ['Allah is never pictured, in any form.', '‘Ad, Iram, Thamud and Pharaoh (89:6-14) are never shown; they are read in the surah only.', 'The orphan sisters and the poor family are never shown.'],
};
