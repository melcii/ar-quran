// Surah 60, Al-Mumtahanah (She Who Is Examined): the Bridge Between
// Neighbours. Two small villages face each other across a stream, with posts
// already standing in the water between them and planks sent from both
// sides. The core play: lay a plank across each gap, every plank long
// enough to rest on both posts, and spend the long planks wisely or the
// widest gap will have none (60:7-8, "Perhaps Allah will put affection
// between you ... Allah does not forbid you from being righteous and just
// toward those who do not fight you"). Each plank laid can be walked on.
// The villages are a game idea; no one is shown.
import { curve, type P2 } from '../terrain';
import type { Structure } from '../kit';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const base = rolling({ radius: 46, amp: 1, seed: 60, streams: [{ pts: [[2, 50], [0, 20], [0, -20], [-2, -50]], w: 8, depth: 3.6 }] });
// Posts across the stream, west to east: gaps of 2.6, 3.6, 2.8, 4.0 and 3.0 m.
const POSTS: P2[] = [-8, -5.4, -1.8, 1, 5, 8].map((x) => [x, 0]);
const TOP = Math.max(base(-8, 0), base(8, 0)) + 0.3;
const planks: Structure[] = POSTS.slice(0, -1).map(([x, z], i) => ({ type: 'dock', x, z, to: POSTS[i + 1], w: 1.4, y: TOP, show: `bridge@${i}` }));
const west: Structure[] = [[-24, 8, 0.2], [-22, -8, -0.2], [-34, 0, 0]].map(([x, z, r], i) => ({ type: 'house', x, z, rot: Math.PI / 2 + r, w: 5, d: 4.4, h: 3, accent: ['#3f6f8a', '#8a4a3a', '#5a7a4a'][i] }));
const east: Structure[] = [[24, 8, -0.2], [22, -8, 0.2], [34, 0, 0]].map(([x, z, r], i) => ({ type: 'house', x, z, rot: -Math.PI / 2 + r, w: 5, d: 4.4, h: 3, accent: ['#c8a040', '#6a5a8a', '#3f8a8a'][i] }));

export const W060: WorldDef = {
  surah: 60,
  name: 'The Bridge Between Neighbours',
  theme: 'Lay planks across the stream so the two villages can cross to each other',
  play: 'Two villages face each other across a stream. Posts already stand in the water, and both villages have sent planks. Lay a plank across each gap, long enough to rest on both posts, and save the long planks for the wide gaps. Walk out on each plank as you lay it, and cross to the other village.',
  seed: 6060,
  ground: {
    radius: 46,
    base,
    palette: PAL.meadow,
    paths: [curve([[-30, 12], [-20, 2], [-9, 0]]), curve([[9, 0], [20, 2], [30, 10]])],
    water: -1.6,
    shore: '#d8c49a',
    flats: [{ x: -16, z: 5, r: 3 }, { x: 16, z: 5, r: 3 }],
  },
  look: LOOKS.blossom,
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#e88a9a', '#f4d060'],
    trees: [{ kind: 'blossom', area: { x: -26, z: 18, r: 12 }, count: 5 }, { kind: 'oak', area: { x: 26, z: 18, r: 12 }, count: 5 }, { kind: 'cypress', at: [[-12, -14], [12, -14]] }],
    rocks: [{ x: 4, z: 28, n: 5, big: 1, spread: 6 }, { x: -4, z: -28, n: 5, big: 1, spread: 6 }],
    pebbles: 24,
    rim: ['oak', 'blossom'],
  },
  far: '#8aa25a',
  mountains: { color: '#9aa0b8', height: 0.8 },
  start: [-30, 12],
  startYaw: Math.PI / 2,
  structures: [...west, ...east, ...planks],
  welcome:
    'Welcome to the Bridge Between Neighbours. Two villages live on either side of this stream, and there has been no way across. Surah Al-Mumtahanah hopes for affection between people who were apart, and tells us to be good and fair to neighbours who do us no harm.',
  tasks: [
    {
      id: 'hope',
      kind: 'read',
      at: [-16, 8],
      marker: 'sign',
      title: 'Perhaps affection',
      goal: 'Read at the sign on your side of the stream',
      reading: { title: 'Perhaps affection', refs: [[60, 7]], note: 'Perhaps Allah will put affection between you and those you were at odds with. Allah is able to do anything, and Allah is Forgiving and Merciful.' },
    },
    {
      id: 'bridge',
      kind: 'span',
      requires: ['hope'],
      title: 'A bridge across',
      goal: 'Lay a plank across every gap between the posts, from your bank to theirs',
      intro: 'Both villages have sent planks: some from your side, some from theirs. Measure each gap, and choose a plank that rests at least a little on both posts. The long planks are few. Spend them on the gaps that need them.',
      adaptation: 'The villages, the planks and the bridge are a game idea based on 60:7-8. No one is shown.',
      posts: POSTS,
      ends: ['this village', 'the far village'],
      planks: [
        { len: 4.5, from: 'the far village' },
        { len: 3.1, from: 'this village' },
        { len: 2.9, from: 'the far village' },
        { len: 4.1, from: 'this village' },
        { len: 3.5, from: 'the far village' },
        { len: 3.3, from: 'this village' },
      ],
      outro: 'The bridge reaches across, built from both villages’ planks.',
      after: { title: 'Be good and fair to them', refs: [[60, 8]], note: 'Allah does not forbid you from being good and fair to those who have not fought you because of your faith or driven you from your homes. Allah loves those who are fair.' },
    },
    {
      id: 'pattern',
      kind: 'read',
      requires: ['bridge'],
      at: [16, 8],
      marker: 'tablet',
      title: 'A good example',
      goal: 'Cross the bridge and read at the tablet in the far village',
      adaptation: 'Ibrahim and those with him are never shown; these ayahs are read only.',
      reading: { title: 'A good example', refs: [[60, 4], [60, 6]], note: 'There is a good example for you in Ibrahim and those with him. They said: "Our Lord, we rely on You, we turn to You, and to You is the final return." In them is a good example for anyone who hopes in Allah and the Last Day.' },
    },
  ],
  finale: {
    title: 'Planks from both sides',
    body: ['You laid a bridge across the stream with planks from both villages, saving the long ones for the wide gaps, and crossed to the other side.', 'Surah Al-Mumtahanah tells us to be good and fair to people who do us no harm, and hopes that Allah will put affection where there was distance.'],
    ref: [60, 8],
    questions: ['Why did the long planks need to be saved?', 'Is there someone you could build a bridge to?'],
  },
  notes: ['Allah is never pictured, in any form.', 'Ibrahim and the people of these ayahs are never shown; their example is read only.', 'The villages are a game idea; no one is shown.'],
};
