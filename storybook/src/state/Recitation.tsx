// One recitation player for the whole app, so only one ayah plays at a time.
// Audio is human recitation streamed from the source in
// content/audio/recitations.json; it is never synthesized.
import recitations from '@content/audio/recitations.json';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAppState } from './AppState';

export const recitation = recitations.recitations.find((r) => r.id === recitations.default)!;

const pad3 = (n: number) => String(n).padStart(3, '0');
export const ayahAudioUrl = (surah: number, ayah: number) =>
  recitation.urlTemplate.replace('{surah3}', pad3(surah)).replace('{ayah3}', pad3(ayah));

type Track = { surah: number; ayah: number };
type Queue = { surah: number; from: number; to: number };

type RecitationState = {
  current: Track | null;
  playing: boolean;
  loading: boolean;
  unavailable: Track | null;
  queue: Queue | null;
  play: (surah: number, from: number, to?: number) => void;
  toggle: () => void;
  replay: () => void;
  next: () => void;
  previous: () => void;
  stop: () => void;
};

const Ctx = createContext<RecitationState | null>(null);
const LOAD_TIMEOUT_MS = 12000;

export function RecitationProvider({ children }: { children: ReactNode }) {
  const { settings } = useAppState();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [unavailable, setUnavailable] = useState<Track | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const clearTimer = () => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
  };

  const load = useCallback(
    (t: Track) => {
      clearTimer();
      setUnavailable(null);
      setCurrent(t);
      try {
        player.replace({ uri: ayahAudioUrl(t.surah, t.ayah) });
        player.volume = settings.volume;
        player.setPlaybackRate(settings.recitationRate);
        player.play();
      } catch {
        setUnavailable(t);
        return;
      }
      timeout.current = setTimeout(() => setUnavailable((u) => u ?? t), LOAD_TIMEOUT_MS);
    },
    [player, settings.volume, settings.recitationRate],
  );

  useEffect(() => {
    if (status.isLoaded && status.duration > 0) clearTimer();
    if (status.error && current) {
      clearTimer();
      setUnavailable(current);
    }
  }, [status.isLoaded, status.duration, status.error, current]);

  useEffect(() => {
    player.volume = settings.volume;
    player.setPlaybackRate(settings.recitationRate);
  }, [player, settings.volume, settings.recitationRate]);

  useEffect(() => {
    if (!status.didJustFinish || !current || !queue) return;
    if (current.ayah < queue.to) load({ surah: current.surah, ayah: current.ayah + 1 });
    else setCurrent(null);
  }, [status.didJustFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimer(), []);

  const play = useCallback(
    (surah: number, from: number, to = from) => {
      setQueue({ surah, from, to });
      load({ surah, ayah: from });
    },
    [load],
  );

  const value = useMemo<RecitationState>(
    () => ({
      current,
      playing: status.playing,
      loading: !!current && !unavailable && (!status.isLoaded || status.isBuffering) && !status.playing,
      unavailable,
      queue,
      play,
      toggle: () => {
        if (!current) return;
        if (status.playing) player.pause();
        else player.play();
      },
      replay: () => {
        if (!current) return;
        load(current);
      },
      next: () => {
        if (current && queue && current.ayah < queue.to) load({ surah: current.surah, ayah: current.ayah + 1 });
      },
      previous: () => {
        if (current && queue && current.ayah > queue.from) load({ surah: current.surah, ayah: current.ayah - 1 });
      },
      stop: () => {
        clearTimer();
        player.pause();
        setCurrent(null);
        setQueue(null);
        setUnavailable(null);
      },
    }),
    [current, status.playing, status.isLoaded, status.isBuffering, unavailable, queue, play, player, load],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRecitation() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRecitation must be used inside RecitationProvider');
  return v;
}
