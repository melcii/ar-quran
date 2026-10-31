import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip, Heading, Row, Title } from '@/components/ui';
import { formatRef, getSurah, searchQuran } from '@/content/quran';
import { storiesForSurah } from '@/content/stories';
import { useAppState } from '@/state/AppState';
import { colors, fonts, radius } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuranIndex() {
  const [query, setQuery] = useState('');
  const { recentReading, bookmarks } = useAppState();
  const results = useMemo(() => searchQuran(query), [query]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <FlatList
        data={results}
        keyExtractor={(r) => `${r.surah.number}:${r.ayah ?? ''}`}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 8 }}>
            <Title>The Quran</Title>
            <Text style={styles.note}>
              Original Arabic text (KFGQPC, Hafs) with the Saheeh International translation. This text is never changed by
              the app.
            </Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search a surah name, number, or 37:142"
              placeholderTextColor={colors.inkSoft}
              style={styles.search}
              accessibilityLabel="Search the Quran by surah name or reference"
              autoCorrect={false}
            />
            {!query && recentReading.length > 0 && (
              <View style={{ gap: 6 }}>
                <Heading>Recently read</Heading>
                <Row wrap>
                  {recentReading.map((r) => (
                    <Chip key={r.surah} label={formatRef(`${r.surah}:${r.ayah}`)} onPress={() => router.push(`/surah/${r.surah}?ayah=${r.ayah}`)} />
                  ))}
                </Row>
              </View>
            )}
            {!query && bookmarks.length > 0 && (
              <View style={{ gap: 6 }}>
                <Heading>Bookmarks</Heading>
                <Row wrap>
                  {bookmarks.slice(0, 8).map((b) => (
                    <Chip
                      key={`${b.surah}:${b.from}-${b.to}`}
                      label={formatRef(b.from === b.to ? `${b.surah}:${b.from}` : `${b.surah}:${b.from}-${b.to}`)}
                      onPress={() => router.push(`/surah/${b.surah}?ayah=${b.from}`)}
                    />
                  ))}
                </Row>
              </View>
            )}
            <Heading>{query ? 'Results' : 'All 114 surahs'}</Heading>
          </View>
        }
        ListEmptyComponent={<Text style={styles.note}>Nothing matches “{query}”. Try a surah name like Yunus, or a reference like 21:87.</Text>}
        renderItem={({ item }) => {
          const s = item.surah;
          const hasStory = storiesForSurah(s.number).length > 0;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Surah ${s.number}, ${s.nameTransliterated}, ${s.nameMeaning}, ${s.ayahCount} ayahs${item.ayah ? `, go to ayah ${item.ayah}` : ''}`}
              onPress={() => router.push(`/surah/${s.number}${item.ayah ? `?ayah=${item.ayah}` : ''}`)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.paperDeep }]}
            >
              <View style={styles.num}>
                <Text style={styles.numText}>{s.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {s.nameTransliterated}
                  {item.ayah ? ` · ayah ${item.ayah}` : ''}
                </Text>
                <Text style={styles.meta}>
                  {s.nameMeaning} · {s.ayahCount} ayahs · {s.revelation}
                  {hasStory ? ' · has a story' : ''}
                </Text>
              </View>
              <Text style={styles.arabic}>{getSurah(s.number)!.nameArabic}</Text>
            </Pressable>
          );
        }}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  list: { padding: 20, width: '100%', maxWidth: 900, alignSelf: 'center' },
  note: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft, lineHeight: 22 },
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: colors.line, borderRadius: radius.sm },
  num: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.paperDeep, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.inkSoft },
  name: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
  arabic: { fontFamily: fonts.quran, fontSize: 22, color: colors.ink },
});
