// Help levels for children of different ages. One choice, kept on this device,
// changes how much the world helps: a footstep trail to the next place, how
// long candles burn, how hard the wind pushes, how easily animals are startled.
export type Level = 'gentle' | 'steady' | 'explorer';

export type LevelSpec = {
  label: string;
  blurb: string;
  /** Glowing footsteps always lead to the next place. */
  trail: boolean;
  /** The tall wayfinding light over the next place. */
  light: boolean;
  /** Multiplies timers that run against the child (promise candles). */
  timeK: number;
  /** Multiplies how long to hold still (standing, watching). */
  holdK: number;
  /** Multiplies the push of wind gusts. */
  windK: number;
  /** Multiplies how easily animals step away from a running child. */
  shyK: number;
};

export const LEVELS: Record<Level, LevelSpec> = {
  gentle: { label: 'Gentle', blurb: 'For younger children: a footstep trail always shows the way, candles burn longer, the wind is soft.', trail: true, light: true, timeK: 1.6, holdK: 0.7, windK: 0.45, shyK: 0.6 },
  steady: { label: 'Steady', blurb: 'The light shows the next place; tap "Show me the way" for footsteps.', trail: false, light: true, timeK: 1, holdK: 1, windK: 1, shyK: 1 },
  explorer: { label: 'Explorer', blurb: 'For older children: no light over the next place, shorter candles, stronger wind. "Show me the way" still helps.', trail: false, light: false, timeK: 0.85, holdK: 1.15, windK: 1.25, shyK: 1.3 },
};

const KEY = 'quran-adventure.level.v1';

let current: Level = 'steady';
try {
  const v = globalThis.localStorage?.getItem(KEY);
  if (v === 'gentle' || v === 'steady' || v === 'explorer') current = v;
} catch {
  /* private mode: keep the default */
}

export const level = {
  get name(): Level {
    return current;
  },
  get spec(): LevelSpec {
    return LEVELS[current];
  },
  set(l: Level) {
    current = l;
    try {
      globalThis.localStorage?.setItem(KEY, l);
    } catch {
      /* not saved, still used this session */
    }
  },
  next(): Level {
    const order: Level[] = ['gentle', 'steady', 'explorer'];
    const l = order[(order.indexOf(current) + 1) % order.length];
    this.set(l);
    return l;
  },
};
