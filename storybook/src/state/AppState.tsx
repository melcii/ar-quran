// Bookmarks, progress and settings. Stored only on this device, separately
// from the Quran content, and never sent anywhere. No names, photos, voices or
// locations are collected.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

const STORAGE_KEY = 'quran-storybook/v1';

export type Bookmark = { surah: number; from: number; to: number; addedAt: number };
export type RecentStory = { slug: string; scene: number; at: number };
export type RecentReading = { surah: number; ayah: number; at: number };

export type Settings = {
  arabicSize: number;
  showTranslation: boolean;
  reducedMotion: boolean;
  narrationVoice: boolean;
  recitationRate: number;
  volume: number;
  recordProgress: boolean;
  dailyReflection: boolean;
};

type Persisted = {
  bookmarks: Bookmark[];
  completedScenes: Record<string, number[]>;
  completedStories: Record<string, number>;
  recentStories: RecentStory[];
  recentReading: RecentReading[];
  settings: Settings;
};

const defaults: Persisted = {
  bookmarks: [],
  completedScenes: {},
  completedStories: {},
  recentStories: [],
  recentReading: [],
  settings: {
    arabicSize: 30,
    showTranslation: true,
    reducedMotion: false,
    narrationVoice: true,
    recitationRate: 1,
    volume: 1,
    recordProgress: true,
    dailyReflection: true,
  },
};

type AppState = Persisted & {
  ready: boolean;
  systemReducedMotion: boolean;
  motionOff: boolean;
  isBookmarked: (surah: number, from: number, to?: number) => boolean;
  toggleBookmark: (surah: number, from: number, to?: number) => void;
  markScene: (slug: string, scene: number, sceneCount: number) => void;
  noteReading: (surah: number, ayah: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  clearProgress: () => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(defaults);
  const [ready, setReady] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<Persisted>;
          setData({ ...defaults, ...saved, settings: { ...defaults.settings, ...saved.settings } });
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReducedMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReducedMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data, ready]);

  const isBookmarked = useCallback(
    (surah: number, from: number, to = from) =>
      data.bookmarks.some((b) => b.surah === surah && b.from === from && b.to === to),
    [data.bookmarks],
  );

  const toggleBookmark = useCallback((surah: number, from: number, to = from) => {
    setData((d) => {
      const exists = d.bookmarks.some((b) => b.surah === surah && b.from === from && b.to === to);
      return {
        ...d,
        bookmarks: exists
          ? d.bookmarks.filter((b) => !(b.surah === surah && b.from === from && b.to === to))
          : [{ surah, from, to, addedAt: Date.now() }, ...d.bookmarks],
      };
    });
  }, []);

  const markScene = useCallback((slug: string, scene: number, sceneCount: number) => {
    setData((d) => {
      const recentStories = [{ slug, scene, at: Date.now() }, ...d.recentStories.filter((r) => r.slug !== slug)].slice(0, 10);
      if (!d.settings.recordProgress) return { ...d, recentStories };
      const done = new Set(d.completedScenes[slug] ?? []);
      done.add(scene);
      const completedStories =
        done.size >= sceneCount && !d.completedStories[slug]
          ? { ...d.completedStories, [slug]: Date.now() }
          : d.completedStories;
      return {
        ...d,
        recentStories,
        completedScenes: { ...d.completedScenes, [slug]: [...done].sort((a, b) => a - b) },
        completedStories,
      };
    });
  }, []);

  const noteReading = useCallback((surah: number, ayah: number) => {
    setData((d) => ({
      ...d,
      recentReading: [{ surah, ayah, at: Date.now() }, ...d.recentReading.filter((r) => r.surah !== surah)].slice(0, 8),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const clearProgress = useCallback(() => {
    setData((d) => ({ ...defaults, settings: d.settings }));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ...data,
      ready,
      systemReducedMotion,
      motionOff: data.settings.reducedMotion || systemReducedMotion,
      isBookmarked,
      toggleBookmark,
      markScene,
      noteReading,
      updateSettings,
      clearProgress,
    }),
    [data, ready, systemReducedMotion, isBookmarked, toggleBookmark, markScene, noteReading, updateSettings, clearProgress],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState must be used inside AppStateProvider');
  return v;
}
