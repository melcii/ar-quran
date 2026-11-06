import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { StoryCard } from '@/components/StoryCard';
import { Body, Button, Card, Heading, IconButton, Row, Screen, Title } from '@/components/ui';
import { formatRef } from '@/content/quran';
import { stories } from '@/content/stories';
import { useAppState } from '@/state/AppState';
import { colors, fonts } from '@/theme';

export default function Journey() {
  const { completedScenes, completedStories, bookmarks, toggleBookmark, recentReading, settings } = useAppState();
  const started = stories.filter((s) => (completedScenes[s.slug] ?? []).length > 0);

  return (
    <Screen>
      <Title>My Journey</Title>
      <Body muted>The stories you have explored and the verses you have saved. Everything stays on this device.</Body>
      {!settings.recordProgress && <Body style={{ color: colors.terracotta }}>Progress recording is turned off in the Parents area.</Body>}

      <Heading>Stories</Heading>
      {started.length === 0 ? (
        <Card>
          <Body>You haven't started a story yet.</Body>
          <Button label="Explore a Story" icon="book" onPress={() => router.push('/stories')} style={{ alignSelf: 'flex-start' }} />
        </Card>
      ) : (
        started.map((s) => {
          const seen = completedScenes[s.slug] ?? [];
          return (
            <Card key={s.id} onPress={() => router.push(`/story/${s.slug}`)} accessibilityLabel={`${s.title}, ${seen.length} of ${s.scenes.length} scenes explored`}>
              <Text style={styles.storyTitle}>{s.title}</Text>
              <View style={styles.track}>
                {s.scenes.map((sc) => (
                  <View key={sc.id} style={[styles.step, seen.includes(sc.scene_number) && styles.stepDone]} />
                ))}
              </View>
              <Body muted style={{ fontSize: 15 }}>
                {completedStories[s.slug] ? 'Explored every scene.' : `${seen.length} of ${s.scenes.length} scenes explored.`}
              </Body>
            </Card>
          );
        })
      )}

      <Heading>Saved verses</Heading>
      {bookmarks.length === 0 ? (
        <Body muted>Tap the bookmark next to any verse to save it here.</Body>
      ) : (
        bookmarks.map((b) => {
          const ref = b.from === b.to ? `${b.surah}:${b.from}` : `${b.surah}:${b.from}-${b.to}`;
          return (
            <Row key={ref} style={styles.bookmark}>
              <Button kind="quiet" label={formatRef(ref)} icon="bookmarked" onPress={() => router.push(`/surah/${b.surah}?ayah=${b.from}`)} style={{ flex: 1, justifyContent: 'flex-start' }} />
              <IconButton icon="close" label={`Remove bookmark ${formatRef(ref)}`} onPress={() => toggleBookmark(b.surah, b.from, b.to)} />
            </Row>
          );
        })
      )}

      {recentReading.length > 0 && (
        <>
          <Heading>Recently read</Heading>
          {recentReading.map((r) => (
            <Button key={r.surah} kind="quiet" label={formatRef(`${r.surah}:${r.ayah}`)} icon="quran" onPress={() => router.push(`/surah/${r.surah}?ayah=${r.ayah}`)} style={{ justifyContent: 'flex-start' }} />
          ))}
        </>
      )}

      <Heading>More to explore</Heading>
      <Row wrap style={{ alignItems: 'flex-start' }}>
        {stories.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </Row>
      <View style={{ height: 90 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  storyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  track: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.line },
  stepDone: { backgroundColor: colors.green },
  bookmark: { backgroundColor: colors.card, borderRadius: 14, paddingRight: 4 },
});
