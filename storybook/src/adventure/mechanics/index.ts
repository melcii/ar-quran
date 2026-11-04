// Every plug-in kind of play, by task kind. The engine asks here before its
// own built-in kinds.
import type { Task } from '../types';
import type { Mechanic } from './base';
import { Granary } from './granary';
import { Grow } from './grow';
import { Point } from './point';
import { Pollen } from './pollen';
import { Rubbing } from './rubbing';
import { Streets } from './streets';
import { SunPath } from './sunpath';
import { Valley } from './valley';

export const MECHS: Partial<Record<Task['kind'], Mechanic<never>>> = {
  granary: Granary as Mechanic<never>,
  valley: Valley as Mechanic<never>,
  grow: Grow as Mechanic<never>,
  pollen: Pollen as Mechanic<never>,
  rubbing: Rubbing as Mechanic<never>,
  streets: Streets as Mechanic<never>,
  sunpath: SunPath as Mechanic<never>,
  point: Point as Mechanic<never>,
};

/** The plug-in for a task, typed loosely so the engine can call it with any task. */
export const mechFor = (task: Task) => MECHS[task.kind] as unknown as Mechanic<Task> | undefined;
