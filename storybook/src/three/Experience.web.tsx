// The cinematic home: a quiet room, the Quran on a rehal, and the story world
// that rises out of the open book. Flow:
//   intro → closed → opening → open (choose a passage) → entering → story
//   scenes → returning → reading (the verses, reflection) → back to open.
import { Canvas, useThree } from '@react-three/fiber';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as THREE from 'three';
import { Passage, RefLink } from '@/components/Ayah';
import { Reflect } from '@/components/Reflect';
import { Body, Button, Card, ContentLabel, IconButton, Row } from '@/components/ui';
import { brand } from '@/brand';
import { formatRef } from '@/content/quran';
import { getEditorial, getStory } from '@/content/stories';
import type { InteractiveElement, Story } from '@/content/types';
import { useAppState } from '@/state/AppState';
import { useNarration } from '@/state/useNarration';
import { colors, fonts, radius } from '@/theme';
import { Director, useDirectorRefs, worldShot } from './Director';
import { fitShot, ROOM_SHOTS, STORY_SHOTS, type Shot } from './environments';
import { sound } from './sound';
import { QuranBook, Study } from './Study';
import { drawPassagePage } from './textures';
import { YunusWorld, type Pulses } from './YunusWorld';

type Phase = 'intro' | 'closed' | 'opening' | 'open' | 'entering' | 'story' | 'returning' | 'reading';

const STORY_SLUG = 'yunus';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Gives code outside the canvas access to the clock and the camera's base pose. */
function Bridge({ onReady }: { onReady: (s: { now: () => number; pose: () => Shot }) => void }) {
  const { clock, scene, camera } = useThree();
  useEffect(() => {
    onReady({
      now: () => clock.elapsedTime,
      pose: () => ({
        pos: ((scene.userData.basePos as THREE.Vector3 | undefined) ?? camera.position).clone(),
        look: ((scene.userData.lookAt as THREE.Vector3 | undefined) ?? new THREE.Vector3(0, 0.5, 0)).clone(),
        fov: (camera as THREE.PerspectiveCamera).fov,
      }),
    });
  }, [clock, scene, camera, onReady]);
  return null;
}

export default function Experience() {
  const app = useAppState();
  // Wait for saved settings, so a returning child skips the opening.
  if (!app.ready) return <View style={styles.root} />;
  return <Book />;
}

function Book() {
  const app = useAppState();
  const { width, height } = useWindowDimensions();
  const story = getStory(STORY_SLUG)!;
  const storyScenes = story.scenes.filter((s) => s.kind === 'scene');
  const initial = fitShot(app.settings.introSeen ? ROOM_SHOTS.approach : ROOM_SHOTS.wide, width / height);
  const refs = useDirectorRefs(initial);
  const bridge = useRef<{ now: () => number; pose: () => Shot } | null>(null);
  const openRef = useRef(0);
  const glow = useRef(0);
  const [phase, setPhase] = useState<Phase>(app.settings.introSeen ? 'closed' : 'intro');
  const [sceneIdx, setSceneIdx] = useState(0);
  const [pages, setPages] = useState<{ right: THREE.Texture; left: THREE.Texture } | null>(null);
  const [pulses, setPulses] = useState<Pulses>({});
  const [found, setFound] = useState<string[]>([]);
  const [discovery, setDiscovery] = useState<InteractiveElement | null>(null);
  const [versesOpen, setVersesOpen] = useState(false);
  const [reflectOpen, setReflectOpen] = useState(false);
  const [webgl] = useState(hasWebGL);
  const motion = !app.motionOff;
  const portrait = height > width;
  const scene = storyScenes[sceneIdx];
  const narration = useNarration(phase === 'story' && scene ? scene.educational_narration : '');

  useEffect(() => {
    if (!webgl) router.replace('/explore');
  }, [webgl]);

  // The two open pages: the right page first (Arabic reads right to left).
  useEffect(() => {
    let alive = true;
    Promise.all([drawPassagePage(story.quran_references[0], { highlight: true }), drawPassagePage(story.quran_references[1])]).then(([right, left]) => {
      if (alive) setPages({ right, left });
    });
    return () => {
      alive = false;
    };
  }, [story]);

  useEffect(() => {
    sound.setVolumes({ ambience: app.settings.ambienceVolume, effects: app.settings.effectsVolume, quiet: app.settings.quietMode });
  }, [app.settings.ambienceVolume, app.settings.effectsVolume, app.settings.quietMode]);

  const d = (seconds: number) => (motion ? seconds : Math.min(seconds, 0.6));

  const moveTo = useCallback(
    (to: Shot, seconds: number, arc = 0) => {
      const b = bridge.current;
      if (!b) return;
      const from = refs.move.current ? b.pose() : refs.at.current;
      refs.move.current = { from, to: fitShot(to, width / height), start: b.now(), duration: d(seconds), arc: motion ? arc : 0 };
    },
    [refs, motion, width, height], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const animateOpen = useCallback(
    (to: number, seconds: number) =>
      new Promise<void>((resolve) => {
        const from = openRef.current;
        const start = performance.now();
        const dur = d(seconds) * 1000;
        let turned = [false, false, false];
        const tick = () => {
          const p = dur <= 0 ? 1 : Math.min(1, (performance.now() - start) / dur);
          openRef.current = from + (to - from) * p;
          // A paper sound as the cover, then each leaf, begins to turn.
          [0.05, 1.05, 1.4].forEach((at, i) => {
            if (!turned[i] && openRef.current >= at && to > from) {
              turned[i] = true;
              sound.pageTurn();
            }
          });
          if (p < 1) requestAnimationFrame(tick);
          else resolve();
        };
        tick();
      }),
    [motion], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const startGrow = (to: number, seconds: number) => {
    const b = bridge.current;
    if (!b) return;
    refs.growTarget.current = { from: refs.grow.current, to, start: b.now(), duration: d(seconds) };
  };

  // ---- Flow ---------------------------------------------------------------

  const onBridge = useCallback(
    (b: { now: () => number; pose: () => Shot }) => {
      bridge.current = b;
      if (phase === 'intro') {
        moveTo(ROOM_SHOTS.approach, 7);
        setTimeout(() => setPhase((p) => (p === 'intro' ? 'closed' : p)), d(5) * 1000);
      }
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const openBook = async () => {
    sound.start();
    sound.setAmbience('room');
    if (phase !== 'closed' && phase !== 'intro') return;
    refs.move.current = null;
    setPhase('opening');
    moveTo(ROOM_SHOTS.book, 3.2);
    await animateOpen(2, 3.4);
    setPhase('open');
  };

  const enterStory = async (startAt = 0) => {
    sound.start();
    if (openRef.current < 2) {
      setPhase('opening');
      moveTo(ROOM_SHOTS.book, 2);
      await animateOpen(2, 2.4);
    }
    setPhase('entering');
    setDiscovery(null);
    setReflectOpen(false);
    const target = storyScenes[startAt];
    refs.envName.current = STORY_SHOTS[target.id].env;
    // First the camera leans into the page, then the world rises around it.
    moveTo(ROOM_SHOTS.reading, 1.6);
    sound.transition(true, d(5));
    setTimeout(() => {
      startGrow(1, 5);
      moveTo(worldShot(STORY_SHOTS[target.id].shot), 5.2, 2);
      sound.setAmbience(STORY_SHOTS[target.id].ambience, 4);
    }, d(1.4) * 1000);
    setTimeout(() => {
      setSceneIdx(startAt);
      setPhase('story');
      if (!app.settings.introSeen) app.updateSettings({ introSeen: true });
    }, d(6.6) * 1000);
  };

  const goScene = (i: number) => {
    const s = storyScenes[i];
    if (!s) return;
    narration.stop();
    setDiscovery(null);
    setSceneIdx(i);
    refs.envName.current = STORY_SHOTS[s.id].env;
    sound.setAmbience(STORY_SHOTS[s.id].ambience);
    moveTo(worldShot(STORY_SHOTS[s.id].shot), 4.2, i === 2 ? -2 : 3);
  };

  const returnToBook = () => {
    narration.stop();
    setDiscovery(null);
    setVersesOpen(false);
    setPhase('returning');
    sound.transition(false, d(4.5));
    sound.setAmbience('room', 3);
    moveTo(ROOM_SHOTS.reading, 4.6, 3);
    startGrow(0, 4.4);
    setTimeout(() => {
      setPhase('reading');
      app.markScene(story.slug, story.scenes.length - 1, story.scenes.length);
    }, d(4.7) * 1000);
  };

  const closeReading = () => {
    setReflectOpen(false);
    setPhase('open');
    moveTo(ROOM_SHOTS.book, 1.6);
  };

  // Mark progress and allow exploring while a scene is showing.
  useEffect(() => {
    refs.look.current.enabled = phase === 'story' || phase === 'open' || phase === 'reading';
    if (phase === 'story' && scene) app.markScene(story.slug, scene.scene_number, story.scenes.length);
  }, [phase, scene?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gentle glow on the passage pages while choosing.
  useEffect(() => {
    if (phase !== 'open') {
      glow.current = 0;
      return;
    }
    let raf = 0;
    const tick = () => {
      glow.current = motion ? 0.5 + 0.5 * Math.sin(performance.now() / 700) : 0.6;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [phase, motion]);

  const tapElement = (id: string) => {
    const el = scene?.interactive_elements.find((e) => e.id === id);
    if (!el) return;
    setDiscovery(el);
    setFound((f) => (f.includes(id) ? f : [...f, id]));
    if (el.animation_asset) setPulses((p) => ({ ...p, [el.animation_asset!]: performance.now() }));
  };

  const resume = app.recentStories.find((r) => r.slug === story.slug);
  const resumeScene = resume ? Math.min(Math.max(0, resume.scene - 1), storyScenes.length - 1) : 0;

  if (!webgl) return null;

  const activeIds = phase === 'story' && scene ? scene.interactive_elements.map((e) => e.id) : [];

  return (
    <View style={styles.root}>
      <Canvas
        shadows="percentage"
        dpr={[1, 1.75]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ fov: initial.fov, near: 0.01, far: 2000, position: initial.pos.toArray() }}
        style={{ position: 'absolute', inset: 0 } as any}
        onPointerMissed={() => setDiscovery(null)}
      >
        <Director
          refs={refs}
          initial={initial}
          study={
            <Study motion={motion} dim={refs.dim}>
              <QuranBook open={openRef} rightPage={pages?.right ?? null} leftPage={pages?.left ?? null} glow={glow} onTap={() => (phase === 'open' ? enterStory(0) : openBook())} />
            </Study>
          }
          world={
            <YunusWorld
              env={refs.env}
              skyOpacity={refs.skyOpacity}
              motion={motion}
              pulses={pulses}
              active={activeIds}
              found={found}
              onTap={tapElement}
            />
          }
        />
        {/* After the Director, so its camera pose exists when this mounts. */}
        <Bridge onReady={onBridge} />
      </Canvas>

      {!pages && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color="#f3e3c2" />
        </View>
      )}

      {/* ---- Overlays: always outside the 3D view, never covering scripture ---- */}

      {(phase === 'intro' || phase === 'closed') && (
        <View style={[styles.center, { top: portrait ? '12%' : '8%' }]} pointerEvents="box-none">
          <Text style={styles.brand}>{brand.name}</Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
        </View>
      )}

      {(phase === 'intro' || phase === 'closed') && (
        <View style={styles.bottom} pointerEvents="box-none">
          {phase === 'intro' ? (
            <Button kind="secondary" small label="Skip intro" onPress={() => setPhase('closed')} />
          ) : (
            <>
              <Text style={styles.hint}>Tap the Quran to open it</Text>
              <Row wrap style={{ justifyContent: 'center' }}>
                <Button label="Open the Quran" icon="book" onPress={openBook} />
                {resume && (
                  <Button
                    kind="secondary"
                    label={`Continue: ${story.title}`}
                    onPress={() => enterStory(resumeScene)}
                  />
                )}
              </Row>
            </>
          )}
        </View>
      )}

      {phase === 'open' && (
        <View style={[styles.bottom, { gap: 10 }]} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Enter ${story.title}`}
            onPress={() => enterStory(0)}
            style={({ pressed }) => [styles.pathway, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.pathKicker}>A story in these pages</Text>
            <Text style={styles.pathTitle}>{story.title}</Text>
            <Text style={styles.pathRefs}>{story.quran_references.map(formatRef).join('  ·  ')}</Text>
            <Text style={styles.pathEnter}>Tap the pages or here to enter the story</Text>
          </Pressable>
          <Row wrap style={{ justifyContent: 'center', gap: 6 }}>
            <Button small kind="secondary" icon="quran" label="Read the Quran" onPress={() => router.push('/surah/37?ayah=139')} />
            <Button small kind="secondary" icon="stories" label="Explore by surah" onPress={() => router.push('/quran')} />
            <Button small kind="secondary" icon="journey" label="My journey" onPress={() => router.push('/journey')} />
          </Row>
          <Text style={styles.note}>
            The pages show the verified Arabic text of {story.quran_references.map(formatRef).join(' and ')}. They are passage pages, not a
            copy of a printed mushaf layout.
          </Text>
        </View>
      )}

      {phase === 'story' && scene && (
        <StoryOverlay
          story={story}
          scene={scene}
          index={sceneIdx}
          total={storyScenes.length}
          portrait={portrait}
          found={found}
          discovery={discovery}
          narration={narration}
          narrationEnabled={app.settings.narrationVoice}
          onDiscover={tapElement}
          onCloseDiscovery={() => setDiscovery(null)}
          onPrev={() => goScene(sceneIdx - 1)}
          onNext={() => (sceneIdx < storyScenes.length - 1 ? goScene(sceneIdx + 1) : returnToBook())}
          onVerses={() => setVersesOpen(true)}
          onReturn={returnToBook}
        />
      )}

      {phase === 'reading' && (
        <View style={[styles.readingPanel, portrait ? styles.readingPortrait : styles.readingLandscape]}>
          <ScrollView contentContainerStyle={{ gap: 12, padding: 16, paddingBottom: 140 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.readingTitle}>Back to the Quran</Text>
              <IconButton icon="close" label="Close reading" onPress={closeReading} />
            </Row>
            <Body muted style={{ fontSize: 15 }}>
              The story you explored comes from these verses. Read, listen, and bookmark them.
            </Body>
            <Passage refs={story.quran_references} />
            <Row wrap>
              <Button small kind="secondary" icon="quran" label="Continue reading As-Saffat" onPress={() => router.push('/surah/37?ayah=139')} />
              <Button small kind="secondary" icon="quran" label="Continue reading Al-Anbiya" onPress={() => router.push('/surah/21?ayah=87')} />
            </Row>
            {!reflectOpen ? (
              <Button kind="secondary" label="A moment to reflect (optional)" onPress={() => { setReflectOpen(true); app.markScene(story.slug, story.scenes.length, story.scenes.length); }} />
            ) : (
              <Reflect story={story} />
            )}
            <Button kind="quiet" label="Explore the story again" icon="replay" onPress={() => enterStory(0)} />
          </ScrollView>
        </View>
      )}

      {versesOpen && scene && (
        <View style={[styles.readingPanel, portrait ? styles.readingPortrait : styles.readingLandscape]}>
          <ScrollView contentContainerStyle={{ gap: 12, padding: 16, paddingBottom: 140 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.readingTitle}>The original verses</Text>
              <IconButton icon="close" label="Close verses" onPress={() => setVersesOpen(false)} />
            </Row>
            <Passage refs={scene.linked_ayah_references} />
          </ScrollView>
        </View>
      )}

      <TopBar phase={phase} onLibrary={() => router.push('/explore')} onParents={() => router.push('/parents')} />
    </View>
  );
}

function TopBar({ phase, onLibrary, onParents }: { phase: Phase; onLibrary: () => void; onParents: () => void }) {
  const app = useAppState();
  const quiet = app.settings.quietMode;
  if (phase === 'entering' || phase === 'returning' || phase === 'opening') return null;
  return (
    <View style={styles.topBar} pointerEvents="box-none">
      <View style={styles.topPill}>
        <IconButton icon="home" label="Library of stories and screens" onPress={onLibrary} color="#f3e3c2" size={40} />
      </View>
      <Row style={{ gap: 6 }}>
        <View style={styles.topPill}>
          <IconButton
            icon={quiet ? 'still' : 'speaker'}
            label={quiet ? 'Sounds are off. Turn on ambience and effects' : 'Turn off ambience and effects (quiet mode)'}
            onPress={() => {
              sound.start();
              app.updateSettings({ quietMode: !quiet });
            }}
            color="#f3e3c2"
            size={40}
          />
        </View>
        <View style={styles.topPill}>
          <IconButton icon="parents" label="Parents and settings" onPress={onParents} color="#f3e3c2" size={40} />
        </View>
      </Row>
    </View>
  );
}

type OverlayProps = {
  story: Story;
  scene: Story['scenes'][number];
  index: number;
  total: number;
  portrait: boolean;
  found: string[];
  discovery: InteractiveElement | null;
  narration: ReturnType<typeof useNarration>;
  narrationEnabled: boolean;
  onDiscover: (id: string) => void;
  onCloseDiscovery: () => void;
  onPrev: () => void;
  onNext: () => void;
  onVerses: () => void;
  onReturn: () => void;
};

function StoryOverlay(p: OverlayProps) {
  const { scene } = p;
  const editorial = getEditorial(p.story.id);
  const source = p.discovery && editorial?.supplementary_sources.find((s) => s.id === p.discovery!.supporting_source);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => setCollapsed(false), [scene.id]);
  return (
    <>
      <View style={styles.storyTop} pointerEvents="box-none">
        <View style={styles.dots}>
          {Array.from({ length: p.total }, (_, i) => (
            <View key={i} style={[styles.dot, i === p.index && styles.dotActive, i < p.index && styles.dotDone]} />
          ))}
        </View>
      </View>

      {p.discovery && (
        <View style={[styles.discovery, p.portrait ? { top: 70, left: 12, right: 12 } : { top: 70, right: 16, width: 380 }]}>
          <Row style={{ justifyContent: 'space-between' }}>
            <ContentLabel kind="discovery" extra={p.discovery.object_name} />
            <IconButton icon="close" label="Close discovery" onPress={p.onCloseDiscovery} size={34} />
          </Row>
          <Body style={{ fontSize: 16, lineHeight: 23 }}>{p.discovery.explanatory_text}</Body>
          {source ? <Text style={styles.small}>{source.source_reference}</Text> : <RefLink refText={p.discovery.supporting_source} />}
        </View>
      )}

      <View style={[styles.narration, p.portrait ? styles.narrationPortrait : styles.narrationLandscape]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.sceneTitle}>{scene.title}</Text>
            <ContentLabel kind="explanation" extra="story narration, not the Quran" />
          </View>
          <IconButton icon={collapsed ? 'plus' : 'minus'} label={collapsed ? 'Show narration' : 'Hide narration to explore'} onPress={() => setCollapsed((c) => !c)} size={36} />
        </Row>
        {!collapsed && (
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 10 }}>
            <Body style={{ fontSize: 17, lineHeight: 26 }}>{scene.educational_narration}</Body>
            {scene.featured_ayah_references && (
              <View style={styles.inlineScripture}>
                <Passage refs={scene.featured_ayah_references} showHeader={false} />
              </View>
            )}
            {scene.interactive_elements.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={styles.small}>Drag to look around. Tap the softly glowing rings, or choose here:</Text>
                <Row wrap style={{ gap: 6 }}>
                  {scene.interactive_elements.map((el) => (
                    <Pressable
                      key={el.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Discover: ${el.object_name}`}
                      onPress={() => p.onDiscover(el.id)}
                      style={[styles.discoverChip, p.found.includes(el.id) && styles.discoverChipFound]}
                    >
                      <Text style={styles.discoverText}>
                        {p.found.includes(el.id) ? '✓ ' : ''}
                        {el.object_name}
                      </Text>
                    </Pressable>
                  ))}
                </Row>
              </View>
            )}
          </ScrollView>
        )}
        <Row wrap style={{ justifyContent: 'space-between', gap: 6 }}>
          <Row style={{ gap: 4 }}>
            {p.narrationEnabled && (
              <Button
                small
                kind="quiet"
                icon={p.narration.speaking ? 'stop' : 'speaker'}
                label={p.narration.speaking ? 'Stop' : 'Listen'}
                accessibilityLabel={p.narration.speaking ? 'Stop the narration' : 'Listen to the narration (device voice)'}
                onPress={p.narration.speaking ? p.narration.stop : p.narration.speak}
              />
            )}
            <Button small kind="quiet" icon="quran" label={scene.linked_ayah_references.map((r) => formatRef(r)).join(', ')} onPress={p.onVerses} />
          </Row>
          <Row style={{ gap: 6 }}>
            <Button small kind="secondary" icon="previous" label="Back" disabled={p.index === 0} onPress={p.onPrev} />
            <Button small icon={p.index < p.total - 1 ? 'next' : 'book'} label={p.index < p.total - 1 ? 'Continue' : 'Return to the Quran'} onPress={p.onNext} />
          </Row>
        </Row>
        {p.index < p.total - 1 && (
          <Pressable accessibilityRole="button" onPress={p.onReturn}>
            <Text style={[styles.small, { textDecorationLine: 'underline' }]}>Return to the Quran at any time</Text>
          </Pressable>
        )}
      </View>
    </>
  );
}

const glass = 'rgba(24, 18, 12, 0.55)';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0806', overflow: 'hidden' },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 4 },
  brand: { fontFamily: fonts.display, fontSize: 34, color: '#f3e3c2', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 12 },
  tagline: { fontFamily: fonts.displayItalic, fontSize: 17, color: '#e6d3b0' },
  bottom: { position: 'absolute', left: 16, right: 16, bottom: 28, alignItems: 'center', gap: 12 },
  hint: { fontFamily: fonts.body, fontSize: 16, color: '#efe0c4' },
  pathway: {
    backgroundColor: 'rgba(250, 243, 228, 0.94)',
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 2,
    maxWidth: 520,
    width: '100%',
    borderWidth: 1,
    borderColor: '#d9c9a3',
  },
  pathKicker: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.terracotta, letterSpacing: 0.8, textTransform: 'uppercase' },
  pathTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  pathRefs: { fontFamily: fonts.body, fontSize: 14, color: colors.skyDeep },
  pathEnter: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  note: { fontFamily: fonts.body, fontSize: 12, color: '#d8c6a6', textAlign: 'center', maxWidth: 520 },
  topBar: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  topPill: { backgroundColor: glass, borderRadius: 999 },
  storyTop: { position: 'absolute', top: 24, left: 0, right: 0, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 6, backgroundColor: glass, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(243, 227, 194, 0.35)' },
  dotActive: { backgroundColor: '#f3e3c2', width: 22 },
  dotDone: { backgroundColor: 'rgba(207, 227, 196, 0.8)' },
  discovery: {
    position: 'absolute',
    backgroundColor: 'rgba(251, 243, 220, 0.97)',
    borderRadius: radius.md,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#ead49a',
  },
  narration: { position: 'absolute', backgroundColor: 'rgba(250, 245, 233, 0.96)', borderRadius: radius.lg, padding: 16, gap: 10 },
  narrationPortrait: { left: 10, right: 10, bottom: 10, maxHeight: '58%' },
  narrationLandscape: { left: 16, bottom: 16, width: 440, maxWidth: '55%', maxHeight: '80%' },
  sceneTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 2 },
  inlineScripture: { maxHeight: 360 },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  discoverChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#f1e4c2', borderWidth: 1, borderColor: '#dcc48d' },
  discoverChipFound: { backgroundColor: '#dfead6', borderColor: '#a9c29b' },
  discoverText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  readingPanel: { position: 'absolute', backgroundColor: 'rgba(250, 245, 233, 0.98)', borderRadius: radius.lg, overflow: 'hidden' },
  readingPortrait: { left: 8, right: 8, bottom: 8, top: '38%' },
  readingLandscape: { right: 16, top: 64, bottom: 16, width: 520, maxWidth: '62%' },
  readingTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
});

