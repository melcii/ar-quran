// Reads a child-friendly explanation aloud with the device's own voice.
// Used only for explanations, never for Quran text. When a human narration
// recording exists for a scene (audio_asset), that should be used instead.
import { speakKid, stopVoice } from './voice';
import { useCallback, useEffect, useState } from 'react';

export function useNarration(text: string, rate = 0.9) {
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    stopVoice();
    setSpeaking(false);
  }, []);

  const speak = useCallback(() => {
    setSpeaking(true);
    const off = () => setSpeaking(false);
    speakKid(text, { onDone: off, onStopped: off, onError: off }, rate / 0.92);
  }, [text, rate]);

  useEffect(() => stop, [text, stop]);

  return { speaking, speak, stop };
}
