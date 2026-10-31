// Floating controls for the recitation that is playing, shown on every screen.
import { StyleSheet, Text, View } from 'react-native';
import { formatRef } from '@/content/quran';
import { recitation, useRecitation } from '@/state/Recitation';
import { colors, fonts, shadow } from '@/theme';
import { IconButton } from './ui';

export function RecitationBar() {
  const rec = useRecitation();
  if (!rec.current) return null;
  const { surah, ayah } = rec.current;
  const canPrev = !!rec.queue && ayah > rec.queue.from;
  const canNext = !!rec.queue && ayah < rec.queue.to;
  return (
    <View style={[styles.bar, shadow]} accessibilityRole="toolbar" accessibilityLabel="Recitation controls">
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={1}>
          Recitation · {formatRef(`${surah}:${ayah}`)}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {rec.unavailable ? 'Recitation unavailable right now' : rec.loading ? 'Loading…' : recitation.reciter}
        </Text>
      </View>
      <IconButton icon="previous" label="Previous ayah" onPress={rec.previous} disabled={!canPrev} size={40} />
      <IconButton icon={rec.playing ? 'pause' : 'play'} label={rec.playing ? 'Pause' : 'Play'} onPress={rec.toggle} size={46} />
      <IconButton icon="replay" label="Replay this ayah" onPress={rec.replay} size={40} />
      <IconButton icon="next" label="Next ayah" onPress={rec.next} disabled={!canNext} size={40} />
      <IconButton icon="close" label="Stop recitation" onPress={rec.stop} size={40} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 84,
    maxWidth: 640,
    alignSelf: 'center',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: colors.scriptureBorder,
  },
  title: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
});
