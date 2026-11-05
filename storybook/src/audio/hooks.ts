// React glue for the voice director: keep it in step with the explorer's
// settings, read what is being said, and give short in-play instructions.
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useAppState } from '@/state/AppState';
import { director } from './director';

/** Mount once near the root: passes the explorer's listening settings on. */
export function useVoiceSettings() {
  const { settings: s } = useAppState();
  useEffect(() => {
    director.configure({
      mode: s.listenMode,
      narrator: s.narrator,
      language: s.narrationLanguage,
      narrationVolume: s.narrationVolume,
      instructionVolume: s.instructionVolume,
      voiceOn: s.narrationVoice,
    });
  }, [s.listenMode, s.narrator, s.narrationLanguage, s.narrationVolume, s.instructionVolume, s.narrationVoice]);
}

/** The line being spoken right now, if any. */
export function useSpeaking() {
  return useSyncExternalStore(director.subscribe, director.current, director.current);
}

/**
 * A short spoken hint the first time each action comes within reach, e.g.
 * "Lead the pair of camels. Tap the button to do it." Hints are dropped while
 * someone else is speaking, and never repeat for the same action.
 */
export function useActionHint(label: string | null | undefined, key?: string) {
  const said = useRef(new Set<string>());
  useEffect(() => {
    if (!label) return;
    const k = key ?? label;
    if (said.current.has(k)) return;
    const t = setTimeout(() => {
      if (director.instruct(`${label}. Tap the button to do it.`)) said.current.add(k);
    }, 600);
    return () => clearTimeout(t);
  }, [label, key]);
}

/** Narrate a card's text when it appears; stop when it goes. */
export function useCardNarration(text: string | null | undefined) {
  useEffect(() => {
    if (!text) return;
    director.narrate(text, false);
    return () => director.stop();
  }, [text]);
}
