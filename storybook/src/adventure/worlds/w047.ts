// Surah 47, Muhammad: the Garden of Running Water. A walled garden of this
// world on a gentle slope, with a spring at the top and four stone channels
// running down to four pools. The core play: each channel is blocked (leaves,
// a fallen stone, mud). Take the right tool from the rack and clear each
// channel from the spring down, so the water runs and the pools turn clear:
// water that runs stays fresh, and the surah describes the promised Garden
// with "rivers of water unaltered" (47:15). That Garden is of the unseen: it
// is read, never pictured; this garden is only an ordinary one. The Prophet
// Muhammad, peace be upon him, is never shown.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

const SPRING: [number, number] = [0, 20];

export const W047: WorldDef = {
  surah: 47,
  name: 'The Garden of Running Water',
  theme: 'Clear each channel with the right tool so the water runs and stays fresh',
  play: 'A spring at the top of the garden feeds four stone channels down to four pools, and every channel is blocked. Take a tool from the rack by the spring (a rake for leaves, a lever bar for stones, a scoop for mud) and clear each channel from the spring down. A pool turns clear when its water runs all the way.',
  seed: 4747,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 0.6, seed: 47, tilt: [0, 0.06] }),
    palette: PAL.meadow,
    paths: [curve([[0, 38], [0, 26], [-3, 22]]), curve([[0, 26], [10, 18], [20, 6], [10, -8], [-10, -8], [-20, 6], [-10, 18], [0, 26]])],
    flats: [{ x: 0, z: 20, r: 3.5 }, { x: 0, z: 30, r: 3 }],
  },
  look: { ...LOOKS.blossom, sunI: 3 },
  veg: {
    grass: 1.2,
    flowers: ['#fff2d8', '#e8c0e0', '#f0d080'],
    trees: [{ kind: 'fig', at: [[-22, 18], [22, 18]] }, { kind: 'olive', at: [[-24, -6], [24, -6], [0, -18]] }, { kind: 'cypress', at: [[-8, 30], [8, 30]] }],
    rocks: [{ x: 0, z: -30, n: 3, big: 0.8, spread: 6 }],
    pebbles: 12,
    rim: ['cypress', 'olive'],
  },
  far: '#8ab070',
  mountains: { color: '#9aa0b8', height: 0.7 },
  start: [0, 38],
  startYaw: Math.PI,
  structures: [
    { type: 'pool', x: 0, z: 21.5, w: 2.4, d: 2.4 },
    { type: 'wall', x: -30, z: 34, to: [-30, -24] },
    { type: 'wall', x: 30, z: 34, to: [30, -24] },
    { type: 'bench', x: 4, z: 30, rot: -Math.PI / 2 },
  ],
  welcome:
    'Welcome to the Garden of Running Water. Water that runs stays fresh; water that stands still goes stale. Surah Muhammad describes the Garden promised to the righteous with rivers of water that never go stale. This garden is only an ordinary one, and all its channels are blocked.',
  tasks: [
    {
      id: 'reflect',
      kind: 'read',
      at: [3, 32],
      marker: 'sign',
      title: 'Do they not reflect?',
      goal: 'Read at the sign by the garden gate',
      reading: { title: 'Reflect on the Quran', refs: [[47, 24]], note: 'Do they not reflect on the Quran, or are there locks on their hearts?' },
    },
    {
      id: 'water',
      kind: 'channels',
      requires: ['reflect'],
      rack: [3.5, 18],
      tools: ['rake', 'lever bar', 'scoop'],
      title: 'Let the water run',
      goal: 'Take the right tool from the rack and clear all four channels, from the spring down',
      intro: 'All four channels are blocked: leaves, stones and mud. Water that cannot run goes stale. Take a tool from the rack by the spring and clear each channel, starting nearest the spring.',
      adaptation: 'The garden, its channels and the tools are a game idea about fresh, running water. The Garden of 47:15 is of the unseen and is read only, never pictured.',
      channels: [
        { from: SPRING, to: [-16, 4], blocks: [{ t: 0.3, tool: 0, name: 'a mat of fallen leaves' }, { t: 0.7, tool: 1, name: 'a fallen stone' }] },
        { from: SPRING, to: [-6, -2], blocks: [{ t: 0.35, tool: 2, name: 'a bank of mud' }, { t: 0.75, tool: 0, name: 'a tangle of twigs and leaves' }] },
        { from: SPRING, to: [6, -2], blocks: [{ t: 0.4, tool: 1, name: 'two stones wedged together' }, { t: 0.8, tool: 2, name: 'a heap of silt' }] },
        { from: SPRING, to: [16, 4], blocks: [{ t: 0.3, tool: 2, name: 'a bank of mud' }, { t: 0.65, tool: 0, name: 'a mat of fallen leaves' }] },
      ],
      outro: 'All four channels run, and all four pools are clear.',
      after: { title: 'Rivers of water unaltered', refs: [[47, 15]], note: 'The Garden promised to the righteous has rivers of water that never go stale, and other rivers, and every kind of fruit, and forgiveness from their Lord. It is of the unseen: we read about it, and do not picture it.' },
    },
    {
      id: 'feet',
      kind: 'read',
      requires: ['water'],
      at: [-3, -8],
      marker: 'lantern',
      title: 'Firm feet',
      goal: 'Read at the lantern at the bottom of the garden',
      reading: { title: 'He will make your feet firm', refs: [[47, 7]], note: 'O you who believe, if you support the cause of Allah, He will support you and make your feet firm.' },
    },
    {
      id: 'spend',
      kind: 'read',
      requires: ['feet'],
      at: [6, 28],
      marker: 'tablet',
      title: 'Holding back',
      goal: 'Read at the tablet by the bench',
      reading: { title: 'Whoever holds back', refs: [[47, 38]], note: 'You are invited to spend in the cause of Allah, but some hold back. Whoever holds back only holds back from himself. Allah is free of all needs, and you are the ones in need.' },
    },
  ],
  finale: {
    title: 'Running water',
    body: ['You cleared every channel with the right tool, and the water ran fresh down to every pool.', 'Surah Muhammad asks us to reflect on the Quran, and describes the promised Garden with rivers of water that never go stale.'],
    ref: [47, 24],
    questions: ['Why does running water stay fresh while still water goes stale?', 'What can you "keep running" in your life, like the water: a good habit, a kindness?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The Prophet Muhammad, peace be upon him, is never shown.', 'The Garden of 47:15 is read only and never pictured; the garden here is an ordinary one.', 'The battle passages of the surah are not played.'],
};
