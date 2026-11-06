// Reads a child-friendly explanation aloud through the voice director (the
// story narrator's channel and volume). Used only for explanations, never for
// Quran text. A licensed recording of the line is used when one exists.
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { director } from '@/audio/director';
import { lineId } from '@/audio/catalog';

export function useNarration(text: string, _rate = 0.9) {
  const now = useSyncExternalStore(director.subscribe, director.current, director.current);
  const speaking = !!now && now.id === lineId(text);
  const stop = useCallback(() => director.stop(), []);
  const speak = useCallback(() => {
    director.readNow(text);
  }, [text]);
  useEffect(() => stop, [text, stop]);
  return { speaking, speak, stop };
}
