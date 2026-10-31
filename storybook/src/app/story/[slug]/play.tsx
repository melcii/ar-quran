import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Passage, RefLink } from '@/components/Ayah';
import { Illustration } from '@/components/Illustration';
import { ReviewNotice } from '@/components/ReviewNotice';
import { Body, Button, Card, ContentLabel, Heading, IconButton, Row, Title } from '@/components/ui';
import { formatRef } from '@/content/quran';
import { getEditorial, getStory } from '@/content/stories';
import type { InteractiveElement, OrderingActivity, Story, StoryScene } from '@/content/types';
import { useAppState } from '@/state/AppState';
import { useNarration } from '@/state/useNarration';
import { colors, fonts, radius } from '@/theme';

export default function StoryPlayer() {
  const { slug, scene: sceneParam } = useLocalSearchParams<{ slug: string; scene?: string }>();
  const story = getStory(slug);
  const { width, height } = useWindowDimensions();
  const app = useAppState();
  const [motionPaused, setMotionPaused] = useState(false);
  const [versesOpen, setVersesOpen] = useState(false);
  const [discovery, setDiscovery] = useState<InteractiveElement | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [pulses, setPulses] = useState<Record<string, number>>({});
  const fade = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollViewInstance>(null);

  const total = story?.scenes.length ?? 0;
  const index = Math.min(Math.max(1, Number(sceneParam) || 1), Math.max(1, total)) - 1;
  const scene = story?.scenes[index];
  const motion = !app.motionOff && !motionPaused;
  const narration = useNarration(scene?.educational_narration ?? '');

  useEffect(() => {
    if (!story || !scene) return;
    app.markScene(story.slug, scene.scene_number, total);
    setDiscovery(null);
    setPulses({});
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (!app.motionOff) {
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    }
  }, [story?.slug, scene?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!story || !scene) {
    return (
      <SafeAreaView style={styles.root}>
        <Title>Story not found</Title>
        <Button label="Back to stories" onPress={() => router.replace('/stories')} />
      </SafeAreaView>
    );
  }

  const go = (n: number) => router.setParams({ scene: String(n) });
  const wide = width >= 900 && width > height;
  const artHeight = wide ? undefined : Math.max(240, Math.min(height * 0.5, width * 0.9));

  const tapElement = (el: InteractiveElement) => {
    setDiscovery(el);
    setFound((f) => (f.includes(el.id) ? f : [...f, el.id]));
    if (el.animation_asset) setPulses((p) => ({ ...p, [el.animation_asset!]: Date.now() }));
  };

  const art = (
    <View style={wide ? { flex: 1.35 } : { height: artHeight }}>
      <Illustration
        name={scene.illustration_asset}
        alt={scene.illustration_alt}
        motion={motion}
        pulses={pulses}
        elements={scene.kind === 'scene' ? scene.interactive_elements : []}
        found={found}
        onTapElement={tapElement}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topBar}>
        <View style={styles.pill}>
          <IconButton icon="close" label="Leave story" onPress={() => router.replace(`/story/${story.slug}`)} size={40} />
        </View>
        <View style={[styles.pill, { paddingHorizontal: 12 }]}>
          <Text style={styles.counter}>
            {scene.scene_number} / {total}
          </Text>
        </View>
        <View style={styles.pill}>
          <IconButton
            icon={motion ? 'motion' : 'still'}
            label={app.motionOff ? 'Motion is off in settings' : motion ? 'Pause animations' : 'Play animations'}
            onPress={() => setMotionPaused((m) => !m)}
            disabled={app.motionOff}
            size={40}
          />
        </View>
      </View>
    </View>
  );

  const panel = (
    <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.panel}>
      <Animated.View style={{ opacity: fade, gap: 14 }}>
        <Title style={{ fontSize: 28, lineHeight: 34 }}>{scene.title}</Title>
        {scene.scene_number === 1 && <ReviewNotice story={story} />}

        <Card style={styles.explanation}>
          <Row style={{ justifyContent: 'space-between' }}>
            <ContentLabel kind="explanation" />
            {app.settings.narrationVoice && (
              <Button
                small
                kind="quiet"
                icon={narration.speaking ? 'stop' : 'speaker'}
                label={narration.speaking ? 'Stop' : 'Listen'}
                accessibilityLabel={narration.speaking ? 'Stop reading aloud' : 'Read the explanation aloud'}
                onPress={narration.speaking ? narration.stop : narration.speak}
              />
            )}
          </Row>
          <Body style={{ fontSize: 18, lineHeight: 28 }}>{scene.educational_narration}</Body>
          {app.settings.narrationVoice && (
            <Text style={styles.small}>
              {scene.audio_asset ? 'Recorded narration.' : 'Read aloud by your device’s voice. A recorded narration is not available yet.'}
            </Text>
          )}
        </Card>

        {scene.kind === 'scene' && scene.interactive_elements.length > 0 && (
          <Text style={styles.hint}>
            Tap the ? in the picture to explore · {found.filter((id) => scene.interactive_elements.some((e) => e.id === id)).length} of{' '}
            {scene.interactive_elements.length} found
          </Text>
        )}

        {discovery && <DiscoveryCard el={discovery} onClose={() => setDiscovery(null)} story={story} />}

        <View style={{ gap: 8 }}>
          <Text style={styles.kicker}>From the Quran</Text>
          <Row wrap>
            {scene.linked_ayah_references.map((r) => (
              <RefLink key={r} refText={r} onPress={() => setVersesOpen(true)} />
            ))}
            <Button small kind="secondary" icon="quran" label="Open the verses" onPress={() => setVersesOpen(true)} />
          </Row>
        </View>

        {scene.featured_ayah_references && <Passage refs={scene.featured_ayah_references} />}

        {scene.kind === 'reflect' && <Reflect story={story} />}

        <Text style={styles.small}>About this picture: {scene.source_notes}</Text>
      </Animated.View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column' }}>
        {art}
        <View style={{ flex: 1 }}>{panel}</View>
      </View>
      <View style={styles.nav}>
        <Button label="Back" icon="previous" kind="secondary" small disabled={index === 0} onPress={() => go(index)} />
        <View style={styles.dots} accessibilityLabel={`Scene ${index + 1} of ${total}`}>
          {story.scenes.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === index && styles.dotActive, (app.completedScenes[story.slug] ?? []).includes(i + 1) && i !== index && styles.dotSeen]} />
          ))}
        </View>
        {index < total - 1 ? (
          <Button label="Next" icon="next" small onPress={() => go(index + 2)} />
        ) : (
          <Button label="Finish" icon="check" small onPress={() => router.replace('/journey')} />
        )}
      </View>
      <VerseSheet open={versesOpen} onClose={() => setVersesOpen(false)} scene={scene} />
    </SafeAreaView>
  );
}

function DiscoveryCard({ el, onClose, story }: { el: InteractiveElement; onClose: () => void; story: Story }) {
  const editorial = getEditorial(story.id);
  const source = editorial?.supplementary_sources.find((s) => s.id === el.supporting_source);
  return (
    <Card style={styles.discovery}>
      <Row style={{ justifyContent: 'space-between' }}>
        <ContentLabel kind="discovery" extra={el.object_name} />
        <IconButton icon="close" label="Close discovery" onPress={onClose} size={36} />
      </Row>
      <Body>{el.explanatory_text}</Body>
      {source ? <Text style={styles.small}>{source.source_reference}</Text> : <RefLink refText={el.supporting_source} />}
    </Card>
  );
}

function VerseSheet({ open, onClose, scene }: { open: boolean; onClose: () => void; scene: StoryScene }) {
  return (
    <Modal visible={open} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.root, { padding: 16 }]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Heading>The original verses</Heading>
          <IconButton icon="close" label="Close verses" onPress={onClose} />
        </Row>
        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 120, maxWidth: 820, width: '100%', alignSelf: 'center' }}>
          <Body muted style={{ fontSize: 15 }}>
            {scene.linked_ayah_references.map(formatRef).join(' · ')}
          </Body>
          <Passage refs={scene.linked_ayah_references} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Reflect({ story }: { story: Story }) {
  if (!story.reflection) return null;
  return (
    <View style={{ gap: 14 }}>
      <Card style={styles.activity}>
        <ContentLabel kind="activity" />
        <Text style={styles.question}>{story.reflection.question}</Text>
        {story.reflection.prompts.map((p) => (
          <Body key={p}>• {p}</Body>
        ))}
        <Text style={styles.small}>You can think about this quietly or talk about it with someone at home.</Text>
      </Card>
      {story.activity && <OrderActivity activity={story.activity} />}
    </View>
  );
}

function shuffle<T>(items: T[], seed: number) {
  const a = [...items];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function OrderActivity({ activity }: { activity: OrderingActivity }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const cards = useMemo(() => shuffle(activity.events, 7), [activity]);
  const done = picked.length === activity.events.length;

  const pick = (id: string) => {
    const expected = activity.events[picked.length];
    if (id === expected.id) {
      setPicked((p) => [...p, id]);
      setMessage(picked.length + 1 === activity.events.length ? 'You followed the order of the verses. Well explored!' : null);
    } else {
      setMessage(`Let's explore the passage again: what comes next? Try reading ${formatRef(expected.reference)}.`);
    }
  };

  if (!open)
    return <Button kind="secondary" label="Optional activity: put the events in order" onPress={() => setOpen(true)} style={{ alignSelf: 'flex-start' }} />;

  return (
    <Card style={styles.activity}>
      <ContentLabel kind="activity" extra="optional" />
      <Body>{activity.instructions}</Body>
      <View style={{ gap: 8 }}>
        {cards.map((e) => {
          const pos = picked.indexOf(e.id);
          return (
            <Button
              key={e.id}
              kind={pos >= 0 ? 'primary' : 'secondary'}
              label={`${pos >= 0 ? `${pos + 1}. ` : ''}${e.text}`}
              disabled={pos >= 0}
              onPress={() => pick(e.id)}
              style={{ justifyContent: 'flex-start' }}
            />
          );
        })}
      </View>
      {message && <Body style={{ color: done ? colors.greenDeep : colors.inkSoft }}>{message}</Body>}
      <Row>
        <Button
          small
          kind="quiet"
          label="Start again"
          onPress={() => {
            setPicked([]);
            setMessage(null);
          }}
        />
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  topBar: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { backgroundColor: 'rgba(255,251,242,0.88)', borderRadius: 999, minHeight: 40, justifyContent: 'center' },
  counter: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  panel: { padding: 20, paddingBottom: 140, gap: 14, width: '100%', maxWidth: 820, alignSelf: 'center' },
  explanation: { backgroundColor: colors.explanation, borderColor: colors.explanationBorder, borderWidth: 1.5 },
  discovery: { backgroundColor: '#FBF3DC', borderColor: '#EAD49A', borderWidth: 1.5 },
  activity: { backgroundColor: colors.activity, borderColor: colors.activityBorder, borderWidth: 1.5 },
  hint: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.terracotta },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.terracotta, textTransform: 'uppercase', letterSpacing: 0.6 },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  question: { fontFamily: fonts.display, fontSize: 22, lineHeight: 30, color: colors.ink },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderRadius: 0,
  },
  dots: { flexDirection: 'row', gap: 6, flexShrink: 1, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.line },
  dotSeen: { backgroundColor: colors.green },
  dotActive: { backgroundColor: colors.terracotta, width: 22 },
});
