import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { formatRef } from '@/content/quran';
import type { PlannedStory, Story } from '@/content/types';
import { useAppState } from '@/state/AppState';
import { colors, fonts, radius, shadow } from '@/theme';
import { Illustration } from './Illustration';
import { Card } from './ui';

export function StoryCard({ story, wide }: { story: Story; wide?: boolean }) {
  const { completedStories, completedScenes } = useAppState();
  const done = completedStories[story.slug];
  const seen = completedScenes[story.slug]?.length ?? 0;
  return (
    <Card
      onPress={() => router.push(`/story/${story.slug}`)}
      accessibilityLabel={`${story.title}. ${story.estimated_duration_minutes} minutes.`}
      style={[styles.card, wide && styles.wide]}
    >
      <Illustration name={story.cover_art} alt="" motion={false} style={[styles.art, wide && { height: 180 }]} showArtTag={false} />
      <View style={{ padding: 14, gap: 4 }}>
        <Text style={styles.title}>{story.title}</Text>
        <Text style={styles.meta}>
          {story.quran_references.map(formatRef).join(' · ')}
        </Text>
        <Text style={styles.meta}>
          About {story.estimated_duration_minutes} min · ages {story.recommended_age.min}–{story.recommended_age.max}
          {done ? ' · finished' : seen ? ` · ${seen}/${story.scenes.length} scenes seen` : ''}
        </Text>
        {story.editorial_review_status !== 'approved' && <Text style={styles.draft}>Prototype · awaiting review</Text>}
      </View>
    </Card>
  );
}

export function PlannedCard({ item }: { item: PlannedStory }) {
  return (
    <View style={[styles.planned, shadow]} accessibilityLabel={`${item.title}, coming later`}>
      <Text style={styles.plannedTitle}>{item.title}</Text>
      <Text style={styles.meta}>Surah {item.primary_surahs.join(', ')}</Text>
      <Text style={styles.soon}>Being researched · not yet available</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden', width: 280 },
  wide: { width: '100%' },
  art: { height: 140 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
  draft: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#8A6A22', marginTop: 2 },
  planned: {
    width: 200,
    backgroundColor: colors.paperDeep,
    borderRadius: radius.md,
    padding: 14,
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  plannedTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.inkSoft },
  soon: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.inkSoft },
});
