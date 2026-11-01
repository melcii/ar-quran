// The scripture reading area. Arabic comes only from the read-only dataset;
// nothing decorative or animated is ever drawn over it.
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { basmalahFor, formatRef, getSurah, parseRef, quranSources, toArabicDigits, versesFor } from '@/content/quran';
import type { AyahRef, QuranVerse } from '@/content/types';
import { useAppState } from '@/state/AppState';
import { recitation, recitationEnabled, useRecitation } from '@/state/Recitation';
import { colors, fonts, radius } from '@/theme';
import { ContentLabel, IconButton, Row } from './ui';

export function AyahView({ verse, compact, rangeTo }: { verse: QuranVerse; compact?: boolean; rangeTo?: number }) {
  const { settings, isBookmarked, toggleBookmark } = useAppState();
  const rec = useRecitation();
  const isCurrent = rec.current?.surah === verse.surah_number && rec.current?.ayah === verse.ayah_number;
  const unavailable = rec.unavailable?.surah === verse.surah_number && rec.unavailable?.ayah === verse.ayah_number;
  const marked = isBookmarked(verse.surah_number, verse.ayah_number);
  const size = compact ? Math.min(settings.arabicSize, 28) : settings.arabicSize;

  return (
    <View style={[styles.ayah, isCurrent && styles.current]} accessibilityLabel={`Ayah ${verse.surah_number}:${verse.ayah_number}`}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>
            {verse.surah_number}:{verse.ayah_number}
          </Text>
        </View>
        <Row style={{ gap: 2 }}>
          {recitationEnabled && <IconButton
            icon={isCurrent && rec.playing ? 'pause' : 'play'}
            label={isCurrent && rec.playing ? 'Pause recitation' : `Listen to recitation of ${verse.surah_number}:${verse.ayah_number}`}
            onPress={() => (isCurrent ? rec.toggle() : rec.play(verse.surah_number, verse.ayah_number, rangeTo ?? verse.ayah_number))}
            size={40}
          />}
          <IconButton
            icon={marked ? 'bookmarked' : 'bookmark'}
            label={marked ? 'Remove bookmark' : 'Bookmark this ayah'}
            onPress={() => toggleBookmark(verse.surah_number, verse.ayah_number)}
            active={marked}
            size={40}
            color={marked ? colors.terracotta : colors.ink}
          />
        </Row>
      </Row>
      <Text
        style={[styles.arabic, { fontSize: size, lineHeight: size * 2 }]}
        accessibilityLanguage="ar"
        selectable
      >
        {verse.arabic_text}
        <Text style={styles.endMark}>{` ۝${toArabicDigits(verse.ayah_number)}`}</Text>
      </Text>
      {unavailable && <Text style={styles.unavailable}>Recitation unavailable right now. Check the connection and try again.</Text>}
      {settings.showTranslation &&
        (verse.translation_text ? (
          <View style={styles.translation}>
            <ContentLabel kind="translation" extra={verse.translation_source} />
            <Text style={styles.translationText}>{verse.translation_text}</Text>
          </View>
        ) : (
          <Text style={styles.unavailable}>Translation unavailable for this ayah.</Text>
        ))}
    </View>
  );
}

/** A passage (e.g. "37:139-148") in its own scripture panel. */
export function Passage({ refs, showHeader = true, playAll = true }: { refs: AyahRef[]; showHeader?: boolean; playAll?: boolean }) {
  const { isBookmarked, toggleBookmark } = useAppState();
  const rec = useRecitation();
  return (
    <View style={styles.panel}>
      <ContentLabel kind="quran" extra="KFGQPC Hafs" />
      {refs.map((ref) => {
        const p = parseRef(ref);
        if (!p) return <Text key={ref} style={styles.unavailable}>Reference {ref} could not be found.</Text>;
        const verses = versesFor(ref);
        const marked = isBookmarked(p.surah, p.from, p.to);
        return (
          <Fragment key={ref}>
            {showHeader && (
              <Row style={styles.passageHeader} wrap>
                <Pressable accessibilityRole="link" onPress={() => router.push(`/surah/${p.surah}?ayah=${p.from}`)} style={{ flex: 1, minWidth: 160 }}>
                  <Text style={styles.passageTitle}>{formatRef(ref)}</Text>
                  <Text style={styles.passageSub}>
                    {getSurah(p.surah)!.nameArabic} · open in the Quran reader
                  </Text>
                </Pressable>
                {recitationEnabled && playAll && p.to > p.from && (
                  <IconButton icon="play" label={`Listen to ${formatRef(ref)}`} onPress={() => rec.play(p.surah, p.from, p.to)} size={40} />
                )}
                <IconButton
                  icon={marked ? 'bookmarked' : 'bookmark'}
                  label={marked ? `Remove bookmark for ${formatRef(ref)}` : `Bookmark ${formatRef(ref)}`}
                  onPress={() => toggleBookmark(p.surah, p.from, p.to)}
                  active={marked}
                  size={40}
                  color={marked ? colors.terracotta : colors.ink}
                />
              </Row>
            )}
            {verses.map((v) => (
              <AyahView key={`${v.surah_number}:${v.ayah_number}`} verse={v} rangeTo={p.to} />
            ))}
          </Fragment>
        );
      })}
      <Text style={styles.attribution}>
        Arabic: {quranSources.arabic.publisher}. Translation: {quranSources.translation.title}. Recitation:{' '}
        {recitationEnabled ? `${recitation.reciter} via ${recitation.host}.` : 'off until a licensed recording is added.'}
      </Text>
    </View>
  );
}

export function Basmalah({ surah }: { surah: number }) {
  const text = basmalahFor(surah);
  const { settings } = useAppState();
  if (!text) return null;
  return (
    <Text style={[styles.arabic, styles.basmalah, { fontSize: settings.arabicSize * 0.9, lineHeight: settings.arabicSize * 1.9 }]}>
      {text}
    </Text>
  );
}

/** A tappable surah and ayah reference that opens the reader. */
export function RefLink({ refText, onPress }: { refText: AyahRef; onPress?: () => void }) {
  const p = parseRef(refText);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${formatRef(refText)} in the Quran reader`}
      onPress={onPress ?? (() => p && router.push(`/surah/${p.surah}?ayah=${p.from}`))}
      style={({ pressed }) => [styles.refLink, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.refLinkText}>{formatRef(refText)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.scripture,
    borderColor: colors.scriptureBorder,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
  },
  passageHeader: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 8, marginTop: 4 },
  passageTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  passageSub: { fontFamily: fonts.body, fontSize: 14, color: colors.skyDeep },
  ayah: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EFE6D2', gap: 6, borderRadius: radius.sm, paddingHorizontal: 6 },
  current: { backgroundColor: '#F6EED9' },
  numberBadge: { backgroundColor: colors.paperDeep, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  numberText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  arabic: {
    fontFamily: fonts.quran,
    color: '#1F1A12',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  endMark: { color: colors.gold },
  basmalah: { textAlign: 'center', marginVertical: 8 },
  translation: { gap: 4, marginTop: 4 },
  translationText: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.inkSoft },
  unavailable: { fontFamily: fonts.body, fontSize: 14, color: colors.terracotta },
  attribution: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 8 },
  refLink: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.scriptureBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refLinkText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.skyDeep },
});
