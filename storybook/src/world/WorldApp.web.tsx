// The whole app as one 3D world: the reading room with the Quran on its rehal,
// the domed library of all 114 surahs, and a walkable world for each surah.
// One canvas; places change behind a short fade.
import { PerformanceMonitor } from '@react-three/drei';
import { SoftShapes } from '@/three/soft';
import { Canvas, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, HueSaturation, ToneMapping, Vignette } from '@react-three/postprocessing';
import { router } from 'expo-router';
import { ToneMappingMode } from 'postprocessing';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as THREE from 'three';
import { brand } from '@/brand';
import { Button, Row } from '@/components/ui';
import { getSurah } from '@/content/quran';
import { emptySurahProgress, useAppState } from '@/state/AppState';
import { sound, type Ambience } from '@/three/sound';
import { fonts } from '@/theme';
import { useHdri, type Hdri } from './env';
import { JournalPanel, LibraryHud, ReadingHud, SettingsPanel, TopBar, WorldHud } from './Hud';
import { Library, useDragLook, yawOfSurah } from './Library';
import { QUALITY, guessTier, lowerTier, type QualityTier } from './quality';
import { Sanctuary } from './Sanctuary';
import { PRESETS, worldFor, type SettingName } from './settings';
import { designFor } from '@/content/designs';
import { SurahWorld, passagesOf, type Move, type Passage } from './SurahWorld';
import { useReader } from './useReader';

type Place = 'room' | 'library' | 'world';

// Bloom only catches lamps, lanterns and the sun's disc, never the sky or paper.
// Tests may override these to compare looks.
const BLOOM = { intensity: 0.45, threshold: 1.3, ...(globalThis as { __bloom?: object }).__bloom };

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const AMBIENCE: Partial<Record<SettingName, Ambience>> = {
  sea: 'shore', creation: 'shore', storm: 'wind', dunes: 'wind', wind: 'wind', 'desert-dusk': 'wind', sun: 'wind', mountain: 'wind',
  night: 'night', stars: 'night', moon: 'night', light: 'night', cave: 'room',
};

function hdriFor(n: number): [Hdri, number] {
  const p = PRESETS[worldFor(n).setting];
  if (p.night) return ['night', 0.35];
  if (p.sun[0] < 12) return ['sunset', 0.5];
  return ['park', 0.55];
}

function Env({ name, intensity }: { name: Hdri; intensity: number }) {
  useHdri(name, intensity);
  return null;
}

const ROOM_PITCH: [number, number] = [-0.25, 0.25];
const ROOM_YAW: [number, number] = [-0.6, 0.6];
const HALL_PITCH: [number, number] = [-0.5, 0.6];
const WORLD_PITCH: [number, number] = [-0.9, 0.9];
function DragLook({ look, pitch, yaw, fov }: { look: { yaw: number; pitch: number }; pitch: [number, number]; yaw?: [number, number]; fov?: number }) {
  useDragLook(look, { pitch, yaw });
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useEffect(() => {
    if (fov && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);
  return null;
}

export default function WorldApp() {
  const app = useAppState();
  if (!app.ready) return <View style={styles.root} />;
  return <World />;
}

function World() {
  const app = useAppState();
  const st = app.settings;
  const { width, height } = useWindowDimensions();
  const portrait = height > width;
  const motion = !app.motionOff;
  const [webgl] = useState(hasWebGL);

  // Where the reader left off.
  const last = app.recentReading[0];
  const [surah, setSurah] = useState(last?.surah ?? 1);
  const [place, setPlace] = useState<Place>('room');
  const [bookOpen, setBookOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [panel, setPanel] = useState<'journal' | 'settings' | null>(null);
  const [near, setNear] = useState<Passage | null>(null);
  const [openPassage, setOpenPassage] = useState<Passage | null>(null);
  const [hint, setHint] = useState('');
  const look = useMemo(() => ({ yaw: 0, pitch: 0 }), []);
  const move = useRef<Move>({ x: 0, y: 0, run: false });
  const openRef = useRef(0);
  const fade = useRef(new Animated.Value(0)).current;
  const busy = useRef(0);

  // Quality: the chosen tier, or on 'auto' the device's guess, stepping down if frames drop.
  const [autoTier, setAutoTier] = useState<QualityTier>(guessTier);
  const tier = st.quality === 'auto' ? autoTier : st.quality;
  const quality = QUALITY[tier];

  const reader = useReader({ surah, size: st.pageTextSize, motion });

  useEffect(() => {
    sound.setVolumes({ ambience: st.ambienceVolume, effects: st.effectsVolume, quiet: st.quietMode });
  }, [st.ambienceVolume, st.effectsVolume, st.quietMode]);

  useEffect(() => {
    const amb: Ambience = place === 'room' ? 'room' : place === 'library' ? 'hall' : AMBIENCE[worldFor(surah).setting] ?? 'night';
    sound.setAmbience(amb, motion ? 2.5 : 0.5);
  }, [place, surah, motion]);

  // Sound may only start after the first touch or click.
  useEffect(() => {
    const go = () => sound.start();
    window.addEventListener('pointerdown', go, { once: true });
    return () => window.removeEventListener('pointerdown', go);
  }, []);

  // Record reading progress as spreads are shown.
  useEffect(() => {
    if (place !== 'room' || !bookOpen || !reader.ready) return;
    app.updateSurahProgress(surah, (p) => ({ furthestAyah: Math.max(p.furthestAyah, reader.lastAyah), lastAyah: reader.firstAyah }));
    app.noteReading(surah, reader.firstAyah);
  }, [place, bookOpen, reader.ready, reader.firstAyah, reader.lastAyah, surah]); // eslint-disable-line react-hooks/exhaustive-deps

  const animateOpen = useCallback(
    (to: number) => {
      const from = openRef.current;
      const start = performance.now();
      const dur = motion ? 1700 : 250;
      if (to > from) sound.pageTurn();
      const tick = () => {
        const p = Math.min(1, (performance.now() - start) / dur);
        openRef.current = from + (to - from) * p;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    [motion],
  );

  /** Fade to dark, change place, fade back in. */
  const goTo = useCallback(
    (next: Place, before?: () => void) => {
      // Ignore a second doorway while a fade is already under way.
      if (performance.now() - busy.current < 1200) return;
      busy.current = performance.now();
      sound.transition(true, motion ? 0.8 : 0.2);
      Animated.timing(fade, { toValue: 1, duration: motion ? 450 : 120, useNativeDriver: false }).start(() => {
        before?.();
        setPanel(null);
        setOpenPassage(null);
        setNear(null);
        setHint('');
        move.current = { x: 0, y: 0, run: false };
        look.yaw = 0;
        look.pitch = 0;
        setPlace(next);
        setTimeout(() => {
          Animated.timing(fade, { toValue: 0, duration: motion ? 700 : 150, useNativeDriver: false }).start();
        }, 120);
      });
    },
    [fade, motion, look],
  );

  const openBook = useCallback(() => {
    sound.start();
    setBookOpen(true);
    animateOpen(1);
  }, [animateOpen]);

  /** Open any surah at an ayah in the reading room. */
  const read = useCallback(
    (n: number, ayah = 1, mark = false) => {
      const apply = () => {
        if (n !== surah) reader.openAt(ayah, mark);
        else reader.jumpTo(ayah, mark);
        setSurah(n);
        setBookOpen(true);
        openRef.current = 1;
      };
      if (place === 'room') apply();
      else goTo('room', apply);
    },
    [surah, reader, place, goTo],
  );

  const enterWorld = useCallback(
    (n: number) =>
      goTo('world', () => {
        setSurah(n);
        app.updateSurahProgress(n, () => ({ visitedWorld: true }));
      }),
    [goTo, app],
  );

  const toLibrary = useCallback(
    (focus?: number) =>
      goTo('library', () => {
        setSelected(focus ?? null);
        setTimeout(() => {
          look.yaw = yawOfSurah(focus ?? surah);
          look.pitch = 0.05;
        }, 0);
      }),
    [goTo, look, surah],
  );

  const selectBook = useCallback(
    (n: number) => {
      if (!n) return setSelected(null);
      setSelected(n);
      look.yaw = yawOfSurah(n);
      sound.pageTurn();
    },
    [look],
  );

  // Arrow keys turn pages in the reading room (left = next, as in an Arabic book).
  useEffect(() => {
    if (place !== 'room' || !bookOpen || panel) return;
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft' || e.key === 'PageDown') reader.forward();
      if (e.key === 'ArrowRight' || e.key === 'PageUp') reader.back();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [place, bookOpen, panel, reader]);

  const progress = app.surahProgress[surah] ?? emptySurahProgress;
  const passages = useMemo(() => passagesOf(surah), [surah]);
  const areasFound = useMemo(() => (progress.areasFound ?? []).filter((i) => i < passages.length), [progress.areasFound, passages.length]);
  const lanternOpened = useCallback(
    (p: Passage) => {
      setOpenPassage(p);
      app.updateSurahProgress(surah, (cur) => ({
        areasFound: (cur.areasFound ?? []).includes(p.index) ? cur.areasFound : [...(cur.areasFound ?? []), p.index].sort((a, b) => a - b),
      }));
    },
    [app, surah],
  );
  const sceneActivity = useCallback(
    (name: string) => {
      const i = designFor(surah)?.activities.findIndex((a) => a.name === name) ?? -1;
      if (i < 0) return;
      app.updateSurahProgress(surah, (cur) => ({
        activitiesDone: (cur.activitiesDone ?? []).includes(i) ? cur.activitiesDone : [...(cur.activitiesDone ?? []), i].sort((a, b) => a - b),
      }));
    },
    [app, surah],
  );
  const portal = useCallback(
    (where: 'library' | 'next' | 'story' | 'book') => {
      if (where === 'library') toLibrary(surah);
      else if (where === 'next') (surah < 114 ? enterWorld(surah + 1) : toLibrary(114));
      else if (where === 'story') router.push('/yunus');
      else read(surah, 1);
    },
    [toLibrary, enterWorld, read, surah],
  );

  useEffect(() => {
    if (!hint) return;
    // Long enough to read: a quoted ayah stays up longer than a short tip.
    const t = setTimeout(() => setHint(''), Math.max(3500, hint.length * 70));
    return () => clearTimeout(t);
  }, [hint]);

  // Keep the open pages clear of the title, the controls and the translation.
  const subs = st.showTranslation;
  const inset = useMemo(() => {
    if (place !== 'room' || !bookOpen) return { top: 0, right: 0, bottom: 0, left: 0 };
    return portrait
      ? { top: 140, right: 0, bottom: 130 + (subs ? height * 0.24 + 20 : 0), left: 0 }
      : { top: 100, right: subs ? 330 : 0, bottom: 130, left: 0 };
  }, [place, bookOpen, portrait, subs, height]);

  const [hdri, hdriIntensity] = place === 'world' ? hdriFor(surah) : place === 'library' ? (['apartment', 0.35] as [Hdri, number]) : (['apartment', 0.12] as [Hdri, number]);

  if (!webgl) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }]}>
        <Text style={styles.brand}>{brand.name}</Text>
        <Text style={styles.note}>
          This app is a 3D world and needs WebGL, which this browser has turned off. Turn on hardware acceleration, or try another browser.
        </Text>
        <Button kind="secondary" label="Open the text view instead" onPress={() => router.push(`/surah/${surah}`)} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Canvas
        shadows={quality.shadows ? 'percentage' : false}
        dpr={quality.dpr}
        gl={{ antialias: tier !== 'low', powerPreference: 'high-performance' }}
        camera={{ fov: 50, near: 0.02, far: 4000, position: [0.6, 1.5, 3.6] }}
        style={{ position: 'absolute', inset: 0 } as never}
      >
        <SoftShapes />
        <color attach="background" args={['#0b0806']} />
        <PerformanceMonitor onDecline={() => st.quality === 'auto' && setAutoTier((t) => lowerTier(t))} />
        <Env name={hdri} intensity={hdriIntensity} />
        {place === 'room' && (
          <>
            <DragLook look={look} pitch={ROOM_PITCH} yaw={ROOM_YAW} />
            <Sanctuary
              view={bookOpen ? 'reading' : 'wide'}
              motion={motion}
              open={openRef}
              right={reader.faces.right}
              left={reader.faces.left}
              leaf={reader.leaf}
              look={look}
              onForward={() => (bookOpen ? reader.forward() : openBook())}
              onBack={() => (bookOpen ? reader.back() : openBook())}
              onBook={() => !bookOpen && openBook()}
              onDoor={() => toLibrary(surah)}
              inset={inset}
            />
          </>
        )}
        {place === 'library' && (
          <>
            <DragLook look={look} pitch={HALL_PITCH} fov={portrait ? 70 : 58} />
            <Library shadows={tier === 'high'} selected={selected} onSelect={selectBook} onDoor={() => goTo('room')} look={look} />
          </>
        )}
        {place === 'world' && (
          <>
            <DragLook look={look} pitch={WORLD_PITCH} fov={portrait ? 72 : 60} />
            <SurahWorld
              key={surah}
              surah={surah}
              quality={quality}
              found={areasFound}
              move={move}
              look={look}
              onLantern={lanternOpened}
              onNear={setNear}
              onPortal={portal}
              onHint={setHint}
              onSceneActivity={sceneActivity}
            />
          </>
        )}
        {/* No bloom in the reading room: the pages must stay crisp and readable. */}
        {quality.post && place !== 'room' && (
          <EffectComposer multisampling={tier === 'high' ? 4 : 0}>
            <Bloom mipmapBlur intensity={BLOOM.intensity} luminanceThreshold={BLOOM.threshold} luminanceSmoothing={0.2} />
            <Vignette offset={0.3} darkness={0.45} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            {/* Filmic tone mapping greys colours a little; give them back for a warm storybook look. */}
            <HueSaturation saturation={0.16} />
          </EffectComposer>
        )}
      </Canvas>

      {place === 'room' && bookOpen && !reader.ready && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color="#f3e3c2" />
        </View>
      )}

      {place === 'room' && !bookOpen && (
        <>
          <View style={[styles.center, { top: portrait ? '12%' : '8%' }]} pointerEvents="none">
            <Text style={styles.brand}>{brand.name}</Text>
            <Text style={styles.tagline}>The whole Quran, 114 surahs, in one quiet world</Text>
          </View>
          <View style={styles.bottom} pointerEvents="box-none">
            <Text style={styles.hint}>Tap the Quran to open it, or walk through the doorway into the library</Text>
            <Row wrap style={{ justifyContent: 'center' }}>
              <Button
                label={last ? `Continue: ${getSurah(last.surah)?.nameTransliterated} ${last.surah}:${last.ayah}` : 'Open the Quran'}
                icon="book"
                onPress={() => {
                  if (last) reader.jumpTo(last.ayah, false);
                  openBook();
                }}
              />
              <Button kind="secondary" icon="stories" label="Library of 114 surahs" onPress={() => toLibrary(surah)} />
            </Row>
          </View>
        </>
      )}

      {place === 'room' && bookOpen && reader.ready && (
        <ReadingHud
          surah={surah}
          firstAyah={reader.firstAyah}
          lastAyah={reader.lastAyah}
          spread={reader.spread}
          spreads={reader.spreads}
          canForward={reader.canForward}
          canBack={reader.canBack}
          portrait={portrait}
          onForward={reader.forward}
          onBack={reader.back}
          onJump={(a) => reader.jumpTo(a)}
          onSurah={(n) => read(n, 1)}
          onWorld={() => enterWorld(surah)}
        />
      )}

      {place === 'library' && (
        <LibraryHud selected={selected} portrait={portrait} onSelect={selectBook} onRead={(n) => read(n, (app.surahProgress[n]?.lastAyah ?? 1) || 1)} onWorld={enterWorld} />
      )}

      {place === 'world' && (
        <WorldHud
          surah={surah}
          passages={passages}
          found={areasFound}
          near={near}
          open={openPassage}
          hint={hint}
          portrait={portrait}
          move={move}
          onOpen={lanternOpened}
          onClose={() => setOpenPassage(null)}
          onRead={(a) => read(surah, a, true)}
          onReadRef={(n, a) => read(n, a, true)}
          activitiesDone={progress.activitiesDone ?? []}
          reflected={!!progress.reflected}
          onActivity={(i) =>
            app.updateSurahProgress(surah, (cur) => ({
              activitiesDone: (cur.activitiesDone ?? []).includes(i) ? cur.activitiesDone : [...(cur.activitiesDone ?? []), i].sort((a, b) => a - b),
            }))
          }
          onReflected={() => app.updateSurahProgress(surah, () => ({ reflected: true }))}
        />
      )}

      <TopBar
        onRoom={place !== 'room' ? () => goTo('room') : undefined}
        onLibrary={place !== 'library' ? () => toLibrary(surah) : undefined}
        onJournal={() => setPanel('journal')}
        onSettings={() => setPanel('settings')}
      />

      {panel === 'journal' && (
        <JournalPanel
          onClose={() => setPanel(null)}
          onRead={(n, a) => read(n, a, true)}
          onWorld={(n) => enterWorld(n)}
        />
      )}
      {panel === 'settings' && <SettingsPanel onClose={() => setPanel(null)} surah={surah} ayah={reader.firstAyah} />}

      <Animated.View pointerEvents="none" style={[styles.fade, { opacity: fade }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0806', overflow: 'hidden' },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 4, paddingHorizontal: 16 },
  brand: { fontFamily: fonts.display, fontSize: 34, color: '#f3e3c2', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 12, textAlign: 'center' },
  tagline: { fontFamily: fonts.displayItalic, fontSize: 17, color: '#e6d3b0', textAlign: 'center' },
  bottom: { position: 'absolute', left: 16, right: 16, bottom: 28, alignItems: 'center', gap: 12 },
  hint: { fontFamily: fonts.body, fontSize: 16, color: '#efe0c4', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 },
  note: { fontFamily: fonts.body, fontSize: 15, color: '#d8c6a6', textAlign: 'center', maxWidth: 480 },
  fade: { ...StyleSheet.absoluteFill, backgroundColor: '#050403' },
});
