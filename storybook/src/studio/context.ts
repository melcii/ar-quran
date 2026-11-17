import { createContext, useContext } from 'react';
import type { Who } from './session';

export const StudioContext = createContext<{ who: Who; refresh: () => void } | null>(null);
export function useStudio() {
  const c = useContext(StudioContext);
  if (!c) throw new Error('studio context missing');
  return c;
}
