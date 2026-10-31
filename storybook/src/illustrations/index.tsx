// Every illustration a story can use, by key. Story JSON refers to these keys
// (cover_art, illustration_asset); `npm run validate` checks that they exist.
// Each entry records its source and licence for the asset register.
import type { ComponentType } from 'react';
import type { IllustrationProps } from './paint';
import { DeepFish, NightSea, SeaDawn, SeaShip } from './sea';
import { ReflectDusk, ShoreGourd, VersesPaper } from './shore';

export type { IllustrationProps } from './paint';
export { VB_H, VB_W } from './paint';

type Entry = { component: ComponentType<IllustrationProps>; source: string; licence: string };

const original = 'Original vector artwork drawn in code for this app (src/illustrations).';
const licence = 'Owned by the project.';

export const illustrations: Record<string, Entry> = {
  'sea-dawn': { component: SeaDawn, source: original, licence },
  'sea-ship': { component: SeaShip, source: original, licence },
  'deep-fish': { component: DeepFish, source: original, licence },
  'night-sea': { component: NightSea, source: original, licence },
  'shore-gourd': { component: ShoreGourd, source: original, licence },
  'reflect-dusk': { component: ReflectDusk, source: original, licence },
  'verses-paper': { component: VersesPaper, source: original, licence },
};
