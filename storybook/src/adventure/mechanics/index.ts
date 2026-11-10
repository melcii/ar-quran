// Every plug-in kind of play, by task kind. The engine asks here before its
// own built-in kinds.
import type { Task } from '../types';
import type { Mechanic } from './base';
import { Ants } from './ants';
import { Beacon } from './beacon';
import { Dawn } from './dawn';
import { Doors } from './doors';
import { Echo } from './echo';
import { Granary } from './granary';
import { Grow } from './grow';
import { Harvest } from './harvest';
import { Home } from './home';
import { Mirror } from './mirror';
import { Links } from './links';
import { Measure } from './measure';
import { Moon } from './moon';
import { Order } from './order';
import { Point } from './point';
import { Pasture } from './pasture';
import { Plumb } from './plumb';
import { Pollen } from './pollen';
import { Sowing } from './rain';
import { River } from './river';
import { Rollcall } from './rollcall';
import { Rubbing } from './rubbing';
import { Shades } from './shades';
import { Shadow } from './shadow';
import { Shelter } from './shelter';
import { Shimmer } from './shimmer';
import { Sluice } from './sluice';
import { Spring } from './spring';
import { Streets } from './streets';
import { SunPath } from './sunpath';
import { Valley } from './valley';
import { Vine } from './vine';
import { Voice } from './voice';

export const MECHS: Partial<Record<Task['kind'], Mechanic<never>>> = {
  granary: Granary as Mechanic<never>,
  valley: Valley as Mechanic<never>,
  grow: Grow as Mechanic<never>,
  pollen: Pollen as Mechanic<never>,
  rubbing: Rubbing as Mechanic<never>,
  streets: Streets as Mechanic<never>,
  sunpath: SunPath as Mechanic<never>,
  point: Point as Mechanic<never>,
  beacon: Beacon as Mechanic<never>,
  doors: Doors as Mechanic<never>,
  order: Order as Mechanic<never>,
  home: Home as Mechanic<never>,
  mirror: Mirror as Mechanic<never>,
  shadow: Shadow as Mechanic<never>,
  echo: Echo as Mechanic<never>,
  ants: Ants as Mechanic<never>,
  river: River as Mechanic<never>,
  shelter: Shelter as Mechanic<never>,
  rain: Sowing as Mechanic<never>,
  voice: Voice as Mechanic<never>,
  pasture: Pasture as Mechanic<never>,
  plumb: Plumb as Mechanic<never>,
  sluice: Sluice as Mechanic<never>,
  shades: Shades as Mechanic<never>,
  moon: Moon as Mechanic<never>,
  vine: Vine as Mechanic<never>,
  spring: Spring as Mechanic<never>,
  harvest: Harvest as Mechanic<never>,
  measure: Measure as Mechanic<never>,
  dawn: Dawn as Mechanic<never>,
  shimmer: Shimmer as Mechanic<never>,
  rollcall: Rollcall as Mechanic<never>,
  links: Links as Mechanic<never>,
};

/** The plug-in for a task, typed loosely so the engine can call it with any task. */
export const mechFor = (task: Task) => MECHS[task.kind] as unknown as Mechanic<Task> | undefined;
