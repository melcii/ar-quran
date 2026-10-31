import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { PlannedCard, StoryCard } from '@/components/StoryCard';
import { Body, Chip, Heading, Row, Screen, Title } from '@/components/ui';
import { getSurah } from '@/content/quran';
import { categories, getCategory, plannedStories, stories, storiesForSurah, storiesInCategory, surahsWithStories } from '@/content/stories';
import type { Story } from '@/content/types';
import { colors, fonts, radius } from '@/theme';

type Mode = 'all' | 'figure' | 'theme' | 'surah' | 'length' | 'age';
const modes: { id: Mode; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'figure', label: 'Prophet' },
  { id: 'theme', label: 'Theme' },
  { id: 'surah', label: 'Surah' },
  { id: 'length', label: 'Length' },
  { id: 'age', label: 'Age' },
];

const matches = (s: Story, q: string) =>
  !q || [s.title, s.figure, s.description, ...s.quran_references].join(' ').toLowerCase().includes(q.toLowerCase());

function Grid({ items }: { items: Story[] }) {
  if (!items.length) return <Body muted>No reviewed stories here yet.</Body>;
  return (
    <View style={styles.grid}>
      {items.map((s) => (
        <StoryCard key={s.id} story={s} />
      ))}
    </View>
  );
}

export default function Stories() {
  const params = useLocalSearchParams<{ by?: Mode; category?: string }>();
  const [query, setQuery] = useState('');
  const mode: Mode = params.category ? 'theme' : (params.by ?? 'all');
  const setMode = (m: Mode) => router.setParams({ by: m, category: undefined });
  const visible = stories.filter((s) => matches(s, query));
  const category = params.category ? getCategory(params.category) : undefined;

  return (
    <Screen>
      <Title>Stories</Title>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search stories, prophets or surahs"
        placeholderTextColor={colors.inkSoft}
        style={styles.search}
        accessibilityLabel="Search stories"
      />
      <Row wrap>
        {modes.map((m) => (
          <Chip key={m.id} label={m.label} selected={mode === m.id && !category} onPress={() => setMode(m.id)} />
        ))}
      </Row>

      {category && (
        <>
          <Heading>{category.title}</Heading>
          <Body muted>{category.description}</Body>
          <Grid items={storiesInCategory(category.id).filter((s) => matches(s, query))} />
          <Body muted style={{ fontSize: 14 }}>
            A story is only added to a collection when its verses genuinely support the theme.
          </Body>
        </>
      )}

      {!category && mode === 'all' && <Grid items={visible} />}

      {!category && mode === 'figure' &&
        [...new Set([...stories.map((s) => s.figure), ...plannedStories.map((p) => p.figure)])].map((figure) => {
          const own = visible.filter((s) => s.figure === figure);
          const planned = plannedStories.filter((p) => p.figure === figure);
          return (
            <View key={figure} style={styles.group}>
              <Heading>{figure}</Heading>
              <View style={styles.grid}>
                {own.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
                {!own.length && planned.map((p) => <PlannedCard key={p.id} item={p} />)}
              </View>
            </View>
          );
        })}

      {!category && mode === 'theme' &&
        categories.map((c) => (
          <View key={c.id} style={styles.group}>
            <Heading>{c.title}</Heading>
            <Grid items={storiesInCategory(c.id).filter((s) => matches(s, query))} />
          </View>
        ))}

      {!category && mode === 'surah' &&
        surahsWithStories().map((n) => {
          const s = getSurah(n)!;
          const own = storiesForSurah(n).filter((x) => matches(x, query));
          const planned = plannedStories.filter((p) => p.primary_surahs.includes(n));
          return (
            <View key={n} style={styles.group}>
              <Heading>
                {n}. {s.nameTransliterated} <Text style={styles.arabicName}>{s.nameArabic}</Text>
              </Heading>
              <View style={styles.grid}>
                {own.map((x) => (
                  <StoryCard key={x.id} story={x} />
                ))}
                {planned.map((p) => (
                  <PlannedCard key={p.id} item={p} />
                ))}
              </View>
            </View>
          );
        })}

      {!category && mode === 'length' && (
        <>
          <Heading>Short (under 15 minutes)</Heading>
          <Grid items={visible.filter((s) => s.estimated_duration_minutes < 15)} />
          <Heading>Longer</Heading>
          <Grid items={visible.filter((s) => s.estimated_duration_minutes >= 15)} />
        </>
      )}

      {!category && mode === 'age' && (
        <>
          <Heading>Ages 5–8</Heading>
          <Grid items={visible.filter((s) => s.recommended_age.min <= 8)} />
          <Heading>Ages 9–12</Heading>
          <Grid items={visible.filter((s) => s.recommended_age.max >= 9)} />
        </>
      )}

      {mode === 'all' && !category && (
        <>
          <Heading>Being researched</Heading>
          <Body muted>These topics are candidates. Each will be written only from the Quranic passages that support it, and reviewed before it appears.</Body>
          <View style={styles.grid}>
            {plannedStories.map((p) => (
              <PlannedCard key={p.id} item={p} />
            ))}
          </View>
        </>
      )}
      <View style={{ height: 90 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    fontFamily: fonts.body,
    fontSize: 17,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.ink,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  group: { gap: 8 },
  arabicName: { fontFamily: fonts.quran, fontSize: 20 },
});
