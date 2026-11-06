// Surah 25, Al-Furqan: the Shadow Plaza. A stone plaza with one tall pole
// on open grassland. The core play is prediction: the day is held still,
// and you place a stone where you think the tip of the pole's shadow will
// be at a later time; then you let the day run and watch the shadow shrink,
// stretch and swing round (25:45-46). The second activity answers harsh
// words with peace (25:63).
import { curve } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, PAL, rolling } from './common';

export const W025: WorldDef = {
  surah: 25,
  name: 'The Shadow Plaza',
  theme: 'Guess where the shadow will fall, then let the day run',
  play: 'A tall pole in a stone plaza. The day is held still while you put a stone where you think the shadow tip will be later; then you let the day run and see. Close enough, and the next round starts; if not, the day goes back and you try again.',
  seed: 2525,
  ground: {
    radius: 46,
    base: rolling({ radius: 46, amp: 1.2, seed: 25 }),
    palette: PAL.meadow,
    paths: [curve([[0, 34], [0, 12]]), curve([[0, 12], [-16, 18], [-24, 24]])],
    flats: [{ x: 0, z: -4, r: 13 }],
  },
  look: { ...LOOKS.morning, sunI: 3 },
  veg: {
    grass: 1.1,
    flowers: ['#fff2d8', '#f4d060', '#c8d8ff'],
    trees: [{ kind: 'oak', area: { x: 0, z: 0, r: 40 }, count: 6 }, { kind: 'olive', at: [[-20, 22], [-26, 18]] }],
    rocks: [{ x: 20, z: -24, n: 6, big: 1.2, spread: 14 }],
    pebbles: 20,
    rim: ['oak', 'olive'],
  },
  far: '#7a9a5a',
  mountains: { color: '#8a94b0', height: 1 },
  start: [0, 30],
  startYaw: Math.PI,
  structures: [{ type: 'bench', x: -22, z: 21, rot: 0.8 }],
  welcome:
    'Welcome to the Shadow Plaza. Surah Al-Furqan asks: have you considered how your Lord stretches out the shadow? In the plaza is a tall pole. The day is held still for you: guess where its shadow will fall later, then let the day run and watch.',
  tasks: [
    {
      id: 'shadow',
      kind: 'shadow',
      title: 'Where will the shadow fall?',
      goal: 'Put your stone where the shadow tip will be, then let the day run at the seat',
      intro: 'Look at the shadow of the pole now. The sun will climb, cross the sky and sink. Where will the tip of the shadow be at the time asked? Stand there and put your stone down, then sit at the seat and let the day run.',
      adaptation: 'The pole, the stone and the guessing game are game ideas, and the sun here follows a simple model of one day, not the real sky of any place.',
      pole: [0, -4],
      height: 4,
      seat: [6, 6],
      near: 1.6,
      rounds: [
        { from: 0.15, to: 0.5, label: 'midday', reading: { title: 'How He stretches the shadow', refs: [[25, 45], [25, 46]], note: 'Have you considered how your Lord stretches out the shadow? If He willed He could have made it stand still. Then He made the sun a guide to it, and then draws it in, little by little.' } },
        { from: 0.5, to: 0.75, label: 'mid-afternoon', reading: { title: 'Night and day in turn', refs: [[25, 61], [25, 62]], note: 'Blessed is He who placed great stars in the sky, and a lamp and a shining moon, and made the night and the day follow each other, for anyone who wants to remember or to be thankful.' } },
        { from: 0.75, to: 0.88, label: 'late afternoon', reading: { title: 'Night as a cover', refs: [[25, 47]], note: 'He made the night a covering for you, and sleep a rest, and the day a time to rise and go out.' } },
      ],
      outro: 'Three guesses, and the shadow came to each one.',
    },
    {
      id: 'peace',
      kind: 'choice',
      requires: ['shadow'],
      at: [-20, 20],
      marker: 'sign',
      title: 'Words of peace',
      goal: 'Go to the sign by the olive trees and choose kind answers',
      adaptation: 'The situations and answers are examples written for this app, to practise 25:63.',
      scenes: [
        {
          text: 'Someone shouts at you because you were in their way.',
          options: [
            { text: 'Shout back louder.', ok: false, reply: 'That makes the quarrel bigger. Try a calmer answer.' },
            { text: 'Say "Sorry, peace," and step aside.', ok: true, reply: 'A calm word of peace, as the verse describes.' },
          ],
        },
        {
          text: 'A friend makes fun of your drawing.',
          options: [
            { text: 'Make fun of theirs.', ok: false, reply: 'That answers hurt with hurt. Is there a better way?' },
            { text: 'Smile, say "Peace," and keep drawing.', ok: true, reply: 'You did not let harsh words change how you act.' },
          ],
        },
      ],
      reading: { title: 'Servants of the Most Merciful', refs: [[25, 63]], note: 'The servants of the Most Merciful walk on the earth gently, and when foolish people speak to them harshly, they answer with words of peace.' },
    },
    {
      id: 'rain',
      kind: 'read',
      requires: ['peace'],
      at: [3, 14],
      marker: 'lantern',
      title: 'Winds and rain',
      goal: 'Read at the lantern by the path',
      reading: { title: 'Good news before His mercy', refs: [[25, 48], [25, 49]], note: 'He sends the winds as good news before His mercy, and sends down pure water from the sky, to bring dead land to life and give drink to animals and people.' },
    },
  ],
  finale: {
    title: 'Signs in the day',
    body: ['You watched the shadow shorten toward midday and stretch again toward evening, and guessed where it would fall.', 'Surah Al-Furqan points to the shadow, the sun, the night and the day as signs, and describes the servants of the Most Merciful who answer harshness with peace.'],
    ref: [25, 45],
    questions: ['Why is the shadow shortest around midday?', 'What could you say when someone is harsh to you?'],
  },
  notes: ['Allah is never pictured, in any form.', 'The sun in this world follows a simple game model of a day.', 'The kind-answer situations are examples written for this app.'],
};
