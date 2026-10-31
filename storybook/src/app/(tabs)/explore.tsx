import { router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AyahView } from '@/components/Ayah';
import { Illustration } from '@/components/Illustration';
import { PlannedCard, StoryCard } from '@/components/StoryCard';
import { Body, Button, Card, Chip, ContentLabel, Heading, Row, Screen } from '@/components/ui';
import { brand } from '@/brand';
import { getVerse, parseRef } from '@/content/quran';
import { categories, getStory, plannedStories, stories, storiesInCategory } from '@/content/stories';
import { useAppState } from '@/state/AppState';
import { colors, fonts, radius } from '@/theme';

// Verses for the optional daily reflection: the featured ayahs of published
// and prototype stories, so the selection follows the story content.
function verseOfTheDay() {
  const refs = stories.flatMap((s) => s.scenes.flatMap((sc) => sc.featured_ayah_references ?? []).slice(0, 1));
  const singles = refs.map(parseRef).filter((p): p is NonNullable<typeof p> => !!p && p.from === p.to);
  if (!singles.length) return null;
  const day = Math.floor(Date.now() / 86400000);
  const p = singles[day % singles.length];
  return getVerse(p.surah, p.from);
}

export default function Home() {
  const { recentStories, settings, motionOff } = useAppState();
  const { width } = useWindowDimensions();
  const featured = stories[Math.floor(Date.now() / 86400000) % Math.max(1, stories.length)];
  const resume = recentStories.map((r) => ({ r, s: getStory(r.slug) })).find((x) => x.s);
  const verse = settings.dailyReflection ? verseOfTheDay() : null;
  const heroHeight = Math.min(420, Math.max(260, width * 0.5));

  return (
    <Screen padded={false}>
      <View style={{ height: heroHeight }}>
        <Illustration name="sea-dawn" alt="A calm sea at dawn." motion={!motionOff} style={StyleSheet.absoluteFill} showArtTag={false} />
        <View style={styles.heroText}>
          <Text style={styles.greeting}>{brand.homeGreeting}</Text>
          <Text style={styles.heroTitle} accessibilityRole="header">
            {brand.name}
          </Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
          <Button
            label="Explore a Story"
            icon="book"
            onPress={() => router.push(featured ? `/story/${featured.slug}` : '/stories')}
            style={{ alignSelf: 'flex-start', marginTop: 12 }}
          />
          {Platform.OS === 'web' && (
            <Button
              kind="secondary"
              small
              label="Open the 3D book"
              icon="quran"
              onPress={() => router.push('/')}
              style={{ alignSelf: 'flex-start', marginTop: 8 }}
            />
          )}
        </View>
      </View>

      <View style={styles.body}>
        {resume?.s && (
          <Card onPress={() => router.push(`/story/${resume.s!.slug}/play?scene=${resume.r.scene}`)} accessibilityLabel={`Continue ${resume.s.title}`}>
            <Text style={styles.kicker}>Continue where you left off</Text>
            <Text style={styles.cardTitle}>
              {resume.s.title} · scene {resume.r.scene} of {resume.s.scenes.length}
            </Text>
          </Card>
        )}

        {featured && (
          <>
            <Heading>Story of the day</Heading>
            <StoryCard story={featured} wide />
          </>
        )}

        <Heading>Browse</Heading>
        <Row wrap>
          <Button label="By prophet" kind="secondary" small onPress={() => router.push('/stories?by=figure')} />
          <Button label="By theme" kind="secondary" small onPress={() => router.push('/stories?by=theme')} />
          <Button label="By surah" kind="secondary" small onPress={() => router.push('/stories?by=surah')} />
        </Row>

        <Heading>Collections</Heading>
        <Row wrap>
          {categories
            .filter((c) => c.kind === 'collection')
            .map((c) => (
              <Chip key={c.id} label={`${c.title} (${storiesInCategory(c.id).length})`} onPress={() => router.push(`/stories?category=${c.id}`)} />
            ))}
        </Row>

        {recentStories.length > 0 && (
          <>
            <Heading>Recently explored</Heading>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 6 }}>
              {recentStories
                .map((r) => getStory(r.slug))
                .filter((s): s is NonNullable<typeof s> => !!s)
                .map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
            </ScrollView>
          </>
        )}

        <Heading>Coming later</Heading>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 6 }}>
          {plannedStories.map((p) => (
            <PlannedCard key={p.id} item={p} />
          ))}
        </ScrollView>

        {verse && (
          <View style={styles.reflection}>
            <Heading>A verse to reflect on</Heading>
            <Body muted style={{ fontSize: 14 }}>A verse from one of the stories, different each day. Grown-ups can turn this off.</Body>
            <View style={styles.versePanel}>
              <ContentLabel kind="quran" />
              <AyahView verse={verse} compact />
            </View>
          </View>
        )}
        <Body muted style={{ fontSize: 13, textAlign: 'center', marginBottom: 90 }}>
          No points, streaks or rankings. Explore at your own pace.
        </Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroText: { position: 'absolute', left: 20, right: 20, top: 24, maxWidth: 520 },
  greeting: { fontFamily: fonts.displayItalic, fontSize: 18, color: colors.ink },
  heroTitle: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: colors.ink },
  tagline: { fontFamily: fonts.body, fontSize: 18, color: colors.ink },
  body: { padding: 20, gap: 14, width: '100%', maxWidth: 1100, alignSelf: 'center' },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.terracotta, textTransform: 'uppercase', letterSpacing: 0.6 },
  cardTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  reflection: { gap: 8 },
  versePanel: {
    backgroundColor: colors.scripture,
    borderColor: colors.scriptureBorder,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: 12,
  },
});
