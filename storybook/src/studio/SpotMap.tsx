// The map is drawn with SVG in the web studio; elsewhere places are typed as numbers.
import type { WorldDef } from '@/adventure/types';

export type MapMark = { at: [number, number]; label: string; tone?: 'task' | 'new' | 'other' };
export function spotsOf(_task: unknown): [number, number][] {
  return [];
}
export default function SpotMap(_: { def: WorldDef; value?: [number, number] | null; onPick: (p: [number, number]) => void; marks?: MapMark[]; size?: number }) {
  return null;
}
