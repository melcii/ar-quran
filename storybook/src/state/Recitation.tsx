// One Quran recitation player for the whole app, so only one ayah plays at a
// time. Audio is always a human recording from an identified reciter in
// content/audio/catalog.json, played per ayah; it is never synthesized and its
// pitch is never changed. A reciter plays only once its licence is confirmed
// and a specialist has checked it against the text; until then the app shows
// the Arabic text without a play button.
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CATALOG, ayahUrl, reciterById, reciterUsable, type Reciter } from '@/audio/catalog';
import { director } from '@/audio/director';
import { useAppState } from './AppState';

/** Tests may supply a reciter (e.g. silent files) to exercise the player. */
const testReciter = () => (globalThis as { __testReciter?: Reciter }).__testReciter;

/** The reciter a setting points to, if it may be played. */
export function activeReciter(id?: string): Reciter | null {
  const t = testReciter();
  if (t) return t;
  const r = reciterById(id) ?? reciterById(CATALOG.defaultReciter);
  return r && reciterUsable(r) ? r : null;
}

/** The default reciter's record, for the sources page. */
export const recitation = reciterById(CATALOG.defaultReciter)!;

/** Speeds offered. The browser keeps the reciter's pitch at every speed. */
export const RATES = [0.75, 0.9, 1] as const;

type Track = { surah: number; ayah: number };
type Queue = { surah: number; from: number; to: number };

type RecitationState = {
  /** The reciter that will play, or null when no licensed, verified one exists. */
  reciter: Reciter | null;
  enabled: boolean;
  current: Track | null;
  playing: boolean;
  loading: boolean;
  unavailable: Track | null;
  queue: Queue | null;
  play: (surah: number, from: number, to?: number, onEnd?: () => void) => void;
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
  const onEnd = useRef<(() => void) | null>(null);
  const reciter = activeReciter(settings.reciter);
  const rate = RATES.includes(settings.recitationRate as (typeof RATES)[number]) ? settings.recitationRate : 1;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // The story narrator never speaks over the Quran.
  useEffect(() => director.recitation(!!current), [current]);

  const clearTimer = () => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
  };

  const load = useCallback(
    (t: Track) => {
      clearTimer();
      setUnavailable(null);
      if (!reciter) return;
      setCurrent(t);
      try {
        player.replace({ uri: ayahUrl(reciter, t.surah, t.ayah) });
        player.volume = settings.volume;
        player.setPlaybackRate(rate, 'high');
        player.play();
      } catch {
        setUnavailable(t);
        return;
      }
      timeout.current = setTimeout(() => setUnavailable((u) => u ?? t), LOAD_TIMEOUT_MS);
    },
    [player, settings.volume, rate, reciter],
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
    player.setPlaybackRate(rate, 'high');
  }, [player, settings.volume, rate]);

  const end = useCallback(() => {
    setCurrent(null);
    const f = onEnd.current;
    onEnd.current = null;
    f?.();
  }, []);

  useEffect(() => {
    if (!status.didJustFinish || !current || !queue) return;
    if (current.ayah < queue.to) load({ surah: current.surah, ayah: current.ayah + 1 });
    else end();
  }, [status.didJustFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimer(), []);

  const play = useCallback(
    (surah: number, from: number, to = from, after?: () => void) => {
      if (!reciter) return after?.();
      onEnd.current = after ?? null;
      setQueue({ surah, from, to });
      load({ surah, ayah: from });
    },
    [load, reciter],
  );

  const value = useMemo<RecitationState>(
    () => ({
      reciter,
      enabled: !!reciter,
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
        onEnd.current = null;
        setCurrent(null);
        setQueue(null);
        setUnavailable(null);
      },
    }),
    [reciter, current, status.playing, status.isLoaded, status.isBuffering, unavailable, queue, play, player, load],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRecitation() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRecitation must be used inside RecitationProvider');
  return v;
}
