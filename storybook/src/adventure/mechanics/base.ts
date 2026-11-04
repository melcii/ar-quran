// Plug-in kinds of play. Each Story Library world brings its own core
// mechanic as one module here instead of growing the engine's switch
// statements: how many steps it has, what can be used, what it does each
// frame, what it puts in the world, and its own panel. The engine calls in
// through MECHS (index.ts) for every kind listed there.
import type { FC } from 'react';
import type * as THREE from 'three';
import type { Card } from '../cards';
import type { P2, Terrain } from '../terrain';
import type { Task, WorldDef } from '../types';

export type MechSave = { done: string[]; prog: Record<string, number[]>; seen: string[] };

export type MechApi = {
  save: () => MechSave;
  progress: (task: string, i: number) => void;
  finish: (task: string) => void;
  hint: (text: string) => void;
  say: (text: string) => void;
  open: (c: Card) => void;
  note: (key: string, i: number) => void;
  /** Replace a side list in the save (numbers chosen in a panel). */
  set: (key: string, v: number[]) => void;
  /** Open this task's own panel. */
  panel: (task: Task) => void;
};

/** Live state shared with the engine (read every frame, never React state). */
export type MechGame = {
  /** Each plug-in's own live state, by task id. */
  mech: Record<string, unknown>;
  hold: Record<string, number>;
  clock: number;
  target: THREE.Vector3 | null;
};

export type MechUse = { key: string; pos: THREE.Vector3; label: string; reach: number; run: () => void };

export type MechEnv = {
  def: WorldDef;
  t: Terrain;
  save: MechSave;
  prog: number[];
  api: MechApi;
  game: MechGame;
  /** The explorer's position. */
  pp: THREE.Vector3;
  still: boolean;
  dt: number;
  /** A hint at most every `every` seconds. */
  tell: (k: string, text: string, every?: number) => void;
  v3: (p: P2, dy?: number) => THREE.Vector3;
};

export type ViewProps<T> = { task: T; t: Terrain; data: MechSave; game: MechGame; active: boolean; act: (key: string) => void };
export type PanelProps<T> = { task: T; data: MechSave; api: MechApi; width: string | number; portrait: boolean; onClose: () => void };

export type Mechanic<T> = {
  total: (task: T) => number;
  uses?: (task: T, env: MechEnv) => MechUse[];
  /** Runs every frame while the task is open. Returns a status line, if any. */
  frame?: (task: T, env: MechEnv) => string | void;
  View?: FC<ViewProps<T>>;
  Panel?: FC<PanelProps<T>>;
  /** Tests only: answer the panel as a careful child would. */
  solve?: (task: T, api: MechApi) => void;
  /** Weather this mechanic wants now (rain 0..1, storm 0..1). */
  weather?: (task: T, game: MechGame) => { rain: number; storm: number } | null;
};

/** The plug-in's own state for a task, made on first use. */
export function live<S>(game: MechGame, id: string, make: () => S): S {
  return (game.mech[id] ??= make()) as S;
}
