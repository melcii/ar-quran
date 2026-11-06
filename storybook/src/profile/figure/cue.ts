// What the world tells the player's figure to do: a one-shot gesture (each
// new request bumps `at`), and ongoing states (holding something, leading an
// animal, sitting). Set by the adventure engine when the child acts.
import type { Gesture } from './pose';

export const cue = { gesture: null as Gesture | null, at: 0, holding: false, leading: false, sitting: false };

export function gesture(g: Gesture) {
  cue.gesture = g;
  cue.at += 1;
}

/** Pick the explorer's movement for an action from its on-screen words. */
export function cueFor(label: string) {
  const l = label.trim();
  if (/^(Let .* rest|Stop leading|Leave the)/i.test(l)) {
    cue.leading = false;
    gesture('interact');
    return;
  }
  if (/^(Lead|Guide|Walk with|Call)/i.test(l)) {
    cue.leading = true;
    gesture('interact');
    return;
  }
  if (/^(Pick up|Take|Gather|Collect|Lift|Fill|Swap|Dig|Bring in|Cut|Pick)/i.test(l)) {
    gesture('pickup');
    if (!/^(Dig|Bring in|Cut)/i.test(l)) cue.holding = true;
    return;
  }
  if (/^(Put|Place|Hang|Lay|Plant|Set|Drop|Give|Pour|Load|Board|Leave)/i.test(l)) {
    gesture('place');
    cue.holding = false;
    return;
  }
  if (/^(Read|Look|Listen)/i.test(l)) {
    gesture('point');
    return;
  }
  gesture('interact');
}

/** A world was finished or a task was done: a small celebration. */
export function celebrate() {
  gesture('cheer');
  cue.holding = false;
}
