// Bespoke scenery for surahs whose own world has been built. Each scene adds
// landmarks beside the shared path, placed at the designed areas (the
// lanterns), so the walk, lanterns, progress and portals stay the same system.
// Rules: no prophet, person or representation of Allah; unseen things are
// never pictured; events are suggested by the land, not acted out.
import type { ComponentType } from 'react';
import type * as THREE from 'three';
import type { Quality } from '../quality';
import type { Land } from '../terrain';
import type { Passage } from '../SurahWorld';
import { AsrScene } from './Asr';
import { FilScene } from './Fil';
import { IkhlasScene } from './Ikhlas';
import { KahfScene } from './Kahf';
import { YusufScene } from './Yusuf';

export type Stop = { p: Passage; pos: THREE.Vector3 };
export type SceneProps = { land: Land; stops: Stop[]; quality: Quality };

export const SCENES: Record<number, ComponentType<SceneProps>> = {
  12: YusufScene,
  18: KahfScene,
  103: AsrScene,
  105: FilScene,
  112: IkhlasScene,
};

/** The stop for a designed area, by its name in the design record. */
export const stopNamed = (stops: Stop[], name: string) => stops.find((s) => s.p.area?.name === name);
