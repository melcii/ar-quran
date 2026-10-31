// The Quran reader: separate from the storytelling interface, plain and calm.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, type ListViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AyahView, Basmalah } from '@/components/Ayah';
import { Button, ContentLabel, IconButton, Row } from '@/components/ui';
import { getSurah, getVerse, quranSources } from '@/content/quran';
import { stories, storiesForAyah } from '@/content/stories';
import { useAppState } from '@/state/AppState';
import { useRecitation } from '@/state/Recitation';
import { colors, fonts } from '@/theme';

export default function SurahReader() {
  const params = useLocalSearchParams<{ number: string; ayah?: string }>();
  const n = Number(params.number);
  const surah = getSurah(n);
  const startAyah = Math.max(1, Number(params.ayah) || 1);
  const { settings, updateSettings, noteReading } = useAppState();
  const rec = useRecitation();
  const [focus, setFocus] = useState(false);
  const listRef = useRef<FlatList<number>>(null);

  const ayahs = useMemo(() => (surah ? Array.from({ length: surah.ayahCount }, (_, i) => i + 1) : []), [surah]);

  // Where each story's passage begins, so a link can be shown there.
  const storyStarts = useMemo(() => {
    const m = new Map<number, typeof stories>();
    ayahs.forEach((a) => {
      const here = storiesForAyah(n, a).filter((s) => !storiesForAyah(n, a - 1).includes(s));
      if (here.length) m.set(a, here);
    });
    return m;
  }, [ayahs, n]);

  useEffect(() => {
    if (!surah || startAyah <= 1) return;
    const t = setTimeout(() => listRef.current?.scrollToIndex({ index: Math.min(startAyah, surah.ayahCount) - 1, animated: false }), 150);
    return () => clearTimeout(t);
  }, [surah, startAyah]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems[0]?.item;
    if (first) lastSeen.current = first;
  }).current;
  const lastSeen = useRef(startAyah);
  useEffect(() => () => noteReading(n, lastSeen.current), [n]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (rec.current?.surah === n) {
      listRef.current?.scrollToIndex({ index: rec.current.ayah - 1, animated: !focus, viewPosition: 0.3 });
    }
  }, [rec.current?.surah, rec.current?.ayah]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderItem = useCallback(
    ({ item }: { item: number }) => {
      const v = getVerse(n, item);
      const linked = storyStarts.get(item);
      return (
        <View>
          {!focus &&
            linked?.map((s) => (
              <Button
                key={s.id}
                small
                kind="secondary"
                icon="stories"
                label={`Story: ${s.title}`}
                onPress={() => router.push(`/story/${s.slug}`)}
                style={{ alignSelf: 'flex-start', marginVertical: 6 }}
              />
            ))}
          {v ? <AyahView verse={v} rangeTo={surah!.ayahCount} /> : <Text style={styles.missing}>Ayah {item} unavailable.</Text>}
        </View>
      );
    },
    [n, storyStarts, focus, surah],
  );

  if (!surah) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.missing}>This surah could not be found.</Text>
        <Button label="Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, focus && { backgroundColor: colors.scripture }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/quran'))} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title} numberOfLines={1}>
            {surah.number}. {surah.nameTransliterated}
          </Text>
          {!focus && (
            <Text style={styles.sub} numberOfLines={1}>
              {surah.nameMeaning} · {surah.ayahCount} ayahs
            </Text>
          )}
        </View>
        <IconButton icon={focus ? 'close' : 'book'} label={focus ? 'Leave reading mode' : 'Distraction-free reading mode'} onPress={() => setFocus((f) => !f)} active={focus} />
      </View>
      {!focus && (
        <Row style={styles.tools} wrap>
          <IconButton icon="minus" label="Smaller Arabic text" onPress={() => updateSettings({ arabicSize: Math.max(20, settings.arabicSize - 3) })} size={40} />
          <Text style={styles.toolText}>Arabic {settings.arabicSize}</Text>
          <IconButton icon="plus" label="Larger Arabic text" onPress={() => updateSettings({ arabicSize: Math.min(56, settings.arabicSize + 3) })} size={40} />
          <Button
            small
            kind={settings.showTranslation ? 'secondary' : 'quiet'}
            label={settings.showTranslation ? 'Translation on' : 'Translation off'}
            onPress={() => updateSettings({ showTranslation: !settings.showTranslation })}
          />
          <Button small kind="secondary" icon="play" label="Listen from the start" onPress={() => rec.play(n, 1, surah.ayahCount)} />
        </Row>
      )}
      <FlatList
        ref={listRef}
        data={ayahs}
        keyExtractor={(a) => String(a)}
        renderItem={renderItem}
        initialNumToRender={Math.min(surah.ayahCount, Math.max(12, startAyah + 4))}
        onScrollToIndexFailed={({ index }) =>
          setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false }), 300)
        }
        onViewableItemsChanged={onViewable}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ gap: 6, marginBottom: 6 }}>
            <ContentLabel kind="quran" extra="KFGQPC Hafs" />
            <Text style={styles.surahArabic}>{surah.nameArabic}</Text>
            <Basmalah surah={n} />
          </View>
        }
        ListFooterComponent={
          <View style={{ gap: 10, paddingVertical: 20, paddingBottom: 160 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Button small kind="secondary" label="Previous surah" disabled={n <= 1} onPress={() => router.replace(`/surah/${n - 1}`)} />
              <Button small kind="secondary" label="Next surah" disabled={n >= 114} onPress={() => router.replace(`/surah/${n + 1}`)} />
            </Row>
            <Text style={styles.sub}>
              Arabic: {quranSources.arabic.publisher}. Translation: {quranSources.translation.title} ({quranSources.translation.publisher}).
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, textAlign: 'center' },
  tools: { paddingHorizontal: 16, paddingBottom: 8, gap: 6, justifyContent: 'center' },
  toolText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft },
  list: { paddingHorizontal: 16, width: '100%', maxWidth: 860, alignSelf: 'center' },
  surahArabic: { fontFamily: fonts.quran, fontSize: 30, textAlign: 'center', color: colors.ink },
  missing: { fontFamily: fonts.body, fontSize: 16, color: colors.terracotta, padding: 20 },
});
