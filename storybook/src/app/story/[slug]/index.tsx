import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { RefLink } from '@/components/Ayah';
import { Illustration } from '@/components/Illustration';
import { ReviewNotice } from '@/components/ReviewNotice';
import { Body, Button, Card, ContentLabel, IconButton, Row, Screen, Title } from '@/components/ui';
import { getStory } from '@/content/stories';
import { useAppState } from '@/state/AppState';
import { colors, fonts } from '@/theme';

export default function StoryIntro() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const story = getStory(slug);
  const { motionOff, completedScenes } = useAppState();
  const { width } = useWindowDimensions();
  if (!story) {
    return (
      <Screen>
        <Title>Story not found</Title>
        <Button label="Back to stories" onPress={() => router.replace('/stories')} />
      </Screen>
    );
  }
  const seen = completedScenes[story.slug] ?? [];
  const nextScene = seen.length && seen.length < story.scenes.length ? Math.max(...seen) + 1 : 1;

  return (
    <Screen padded={false}>
      <View style={{ height: Math.min(440, Math.max(240, width * 0.5)) }}>
        <Illustration name={story.cover_art} alt={story.scenes[0].illustration_alt} motion={!motionOff} style={StyleSheet.absoluteFill} />
        <View style={styles.back}>
          <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </View>
      </View>
      <View style={styles.body}>
        <Title>{story.title}</Title>
        <Text style={styles.meta}>
          About {story.estimated_duration_minutes} minutes · ages {story.recommended_age.min}–{story.recommended_age.max} · {story.scenes.length} scenes
        </Text>
        <ReviewNotice story={story} />
        <Card style={{ backgroundColor: colors.explanation, borderColor: colors.explanationBorder, borderWidth: 1.5 }}>
          <ContentLabel kind="explanation" />
          <Body>{story.description}</Body>
        </Card>
        <View style={{ gap: 6 }}>
          <Text style={styles.kicker}>From the Quran</Text>
          <Row wrap>
            {story.quran_references.map((r) => (
              <RefLink key={r} refText={r} />
            ))}
          </Row>
        </View>
        <Body muted style={{ fontSize: 15 }}>
          The pictures in this story are an artist's illustrations inspired by the Quranic account. They are not historical
          records. Prophets are never shown.
        </Body>
        <Row wrap>
          <Button label="Begin Story" icon="play" onPress={() => router.push(`/story/${story.slug}/play?scene=1`)} />
          {nextScene > 1 && (
            <Button label={`Continue at scene ${nextScene}`} kind="secondary" onPress={() => router.push(`/story/${story.slug}/play?scene=${nextScene}`)} />
          )}
        </Row>
        <View style={{ height: 90 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,251,242,0.85)', borderRadius: 999 },
  body: { padding: 20, gap: 14, width: '100%', maxWidth: 820, alignSelf: 'center' },
  meta: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.terracotta, textTransform: 'uppercase', letterSpacing: 0.6 },
});
