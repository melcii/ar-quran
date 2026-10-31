// Reads a child-friendly explanation aloud with the device's own voice.
// Used only for explanations, never for Quran text. When a human narration
// recording exists for a scene (audio_asset), that should be used instead.
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';

export function useNarration(text: string, rate = 0.9) {
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  const speak = useCallback(() => {
    Speech.stop();
    setSpeaking(true);
    Speech.speak(text, {
      rate,
      language: 'en',
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [text, rate]);

  useEffect(() => stop, [text, stop]);

  return { speaking, speak, stop };
}
