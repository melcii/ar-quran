// Every plug-in kind of play, by task kind. The engine asks here before its
// own built-in kinds.
import type { Task } from '../types';
import type { Mechanic } from './base';
import { Adorn } from './adorn';
import { Ants } from './ants';
import { Blazes } from './blazes';
import { Recall } from './recall';
import { Estuary } from './estuary';
import { Firedrill } from './firedrill';
import { Forge } from './forge';
import { Listen } from './listen';
import { Welcome } from './welcome';
import { Span } from './span';
import { Bond } from './bond';
import { Friday } from './friday';
import { Chances } from './chances';
import { Pack } from './pack';
import { Loads } from './loads';
import { Amends } from './amends';
import { Wings } from './wings';
import { Glean } from './glean';
import { Unseen } from './unseen';
import { Release } from './release';
import { Rootbox } from './rootbox';
import { Starhop } from './starhop';
import { Calm } from './calm';
import { Channels } from './channels';
import { Dunes } from './dunes';
import { Rumour } from './rumour';
import { Station } from './station';
import { Clues } from './clues';
import { Council } from './council';
import { Scope } from './scope';
import { Survey } from './survey';
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
  clues: Clues as Mechanic<never>,
  scope: Scope as Mechanic<never>,
  council: Council as Mechanic<never>,
  adorn: Adorn as Mechanic<never>,
  survey: Survey as Mechanic<never>,
  station: Station as Mechanic<never>,
  dunes: Dunes as Mechanic<never>,
  channels: Channels as Mechanic<never>,
  calm: Calm as Mechanic<never>,
  rumour: Rumour as Mechanic<never>,
  rootbox: Rootbox as Mechanic<never>,
  release: Release as Mechanic<never>,
  blazes: Blazes as Mechanic<never>,
  starhop: Starhop as Mechanic<never>,
  recall: Recall as Mechanic<never>,
  estuary: Estuary as Mechanic<never>,
  firedrill: Firedrill as Mechanic<never>,
  forge: Forge as Mechanic<never>,
  listen: Listen as Mechanic<never>,
  welcome: Welcome as Mechanic<never>,
  span: Span as Mechanic<never>,
  bond: Bond as Mechanic<never>,
  friday: Friday as Mechanic<never>,
  chances: Chances as Mechanic<never>,
  pack: Pack as Mechanic<never>,
  loads: Loads as Mechanic<never>,
  amends: Amends as Mechanic<never>,
  wings: Wings as Mechanic<never>,
  glean: Glean as Mechanic<never>,
  unseen: Unseen as Mechanic<never>,
};

/** The plug-in for a task, typed loosely so the engine can call it with any task. */
export const mechFor = (task: Task) => MECHS[task.kind] as unknown as Mechanic<Task> | undefined;
