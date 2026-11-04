// Surah 30, Ar-Rum: the Dry Land and the Rain. Parched plots lie round a
// wind vane. The core play: watch the wind rise and a cloud gather and drift,
// read where it is going, and sow the dry plot it will reach before the rain
// falls there; then see the land come to life (30:48-50). The player never
// makes the rain. The opening verses about the Romans are a reading.
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W030: WorldDef = {
  surah: 30,
  name: 'The Dry Land and the Rain',
  theme: 'Read the wind and sow where the rain will fall',
  play: 'Dry plots lie round a wind vane. Watch the vane: a cloud gathers and drifts with the wind. Sow the plot it will reach before the rain falls there, and watch that plot come to life. Three rounds, each with a different wind.',
  seed: 3030,
  ground: {
    radius: 44,
    base: rolling({ radius: 44, amp: 1.4, seed: 30 }),
    palette: PAL.dry,
    paths: [curve([[0, 30], [0, 4]])],
    flats: [{ x: 0, z: 0, r: 4 }],
  },
  look: { ...LOOKS.desert, sunI: 3.1, clouds: 0.3 },
  veg: {
    grass: 0.3,
    dryGrass: true,
    trees: [{ kind: 'olive', at: [[-20, 20], [22, 18]] }],
    rocks: [{ x: 0, z: -26, n: 8, big: 1.4, spread: 20 }],
    pebbles: 40,
    rim: ['olive'],
  },
  far: '#b8a070',
  mountains: { color: '#a89078', height: 1 },
  start: [0, 28],
  startYaw: Math.PI,
  structures: [{ type: 'table', x: -6, z: 22 }],
  welcome:
    'Welcome to the Dry Land and the Rain. The ground here is parched. Surah Ar-Rum points to the winds that stir the clouds and the rain that brings dead land back to life. Read at the map table first.',
  tasks: [
    {
      id: 'rome',
      kind: 'read',
      at: [-4, 20],
      marker: 'sign',
      title: 'Things can change',
      goal: 'Read at the map table',
      reading: { title: 'Defeated, then victorious', refs: [[30, 2], [30, 3], [30, 4]], note: 'The surah begins: the Romans have been defeated in a nearby land, but after their defeat they will win, within a few years. The command belongs to Allah before and after.' },
      adaptation: 'No battle is shown; this is a reading only.',
    },
    {
      id: 'rain',
      kind: 'rain',
      requires: ['rome'],
      title: 'Sow before the rain',
      goal: 'Watch the wind vane, then sow the dry plot the cloud will reach before it rains there',
      intro: 'Go to the wind vane and watch. When the wind rises, a cloud will gather and drift. Which plot will it reach? Sow your seeds there before the rain falls.',
      adaptation: 'The plots, the vane and the single drifting cloud are game ideas. You never make the rain: the wind and the rain come by themselves.',
      vane: [0, 0],
      plots: [[0, -16], [14, -8], [14, 8], [-14, 8], [-14, -8]],
      drift: 14,
      rounds: [
        { plot: 1, reading: { title: 'The winds stir the clouds', refs: [[30, 48]], note: 'It is Allah who sends the winds, which stir up the clouds and spread them in the sky, and you see the rain come out from among them, and people rejoice.' } },
        { plot: 3, reading: { title: 'Look at the effects of mercy', refs: [[30, 49], [30, 50]], note: 'Before it came they had lost hope. So look at the effects of the mercy of Allah: how He brings the earth to life after it was dead.' } },
        { plot: 0, reading: { title: 'Fear and hope', refs: [[30, 24]], note: 'Among His signs: He shows you lightning, bringing fear and hope, and sends down rain from the sky that brings the earth to life after it was dead.' } },
      ],
      reading: { title: 'Good news', refs: [[30, 46]], note: 'Among His signs, He sends the winds bringing good news, so you may taste His mercy, and perhaps be grateful.' },
      outro: 'Three plots, sown and rained on, are green again.',
    },
    {
      id: 'signs',
      kind: 'read',
      requires: ['rain'],
      at: [6, 20],
      marker: 'lantern',
      title: 'Many signs',
      goal: 'Read at the lantern by the path',
      reading: { title: 'Languages and colours', refs: [[30, 22]], note: 'Among His signs are the creation of the heavens and the earth, and the variety of your languages and colours. In that are signs for people who know.' },
    },
  ],
  finale: {
    title: 'Life after dryness',
    body: ['You read the wind, sowed where the rain would fall, and watched the dry plots turn green.', 'Surah Ar-Rum asks us to look at how Allah brings dead land back to life, and to see in it a sign.'],
    ref: [30, 50],
    questions: ['How did you know which plot the cloud would reach?', 'What other things change, like dry land after rain?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The player never makes the rain.', 'The Romans and the battle are not shown; 30:2-4 is a reading.'],
};
