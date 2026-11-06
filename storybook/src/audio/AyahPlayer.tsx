// A reading of verified ayahs with its own recitation player: the Arabic from
// the verified dataset, the translation, and (only when a licensed, verified
// human recording exists) play, pause, replay, previous / next and speed. The
// ayah being recited is highlighted. There is no word-by-word highlighting:
// no verified word timings exist, and they are never guessed.
//
// With "narration then recitation", the narrator reads the explanation first
// and the recitation starts only when the narrator has finished.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { getVerse } from '@/content/quran';
import { useAppState } from '@/state/AppState';
import { RATES, useRecitation } from '@/state/Recitation';
import { colors, fonts } from '@/theme';
import { director } from './director';

type Ref = [number, number];

/** How many reading players are on screen (the floating bar hides meanwhile). */
export const inlinePlayers = { n: 0 };

export function AyahPlayer({ refs, note, auto = true }: { refs: Ref[]; note?: string; auto?: boolean }) {
  const app = useAppState();
  const rec = useRecitation();
  const mode = app.settings.listenMode;
  const [at, setAt] = useState<number | null>(null);
  const alive = useRef(true);
  const mine = useRef(false);

  const playFrom = useCallback(
    (i: number) => {
      if (!rec.enabled || i >= refs.length) {
        setAt(null);
        mine.current = false;
        return;
      }
      mine.current = true;
      setAt(i);
      const [s, a] = refs[i];
      rec.play(s, a, a, () => alive.current && playFrom(i + 1));
    },
    [rec, refs],
  );

  // Narration first, then the recitation, never at the same time.
  useEffect(() => {
    alive.current = true;
    inlinePlayers.n++;
    const done = () => {
      inlinePlayers.n--;
      alive.current = false;
    };
    if (!auto) return done;
    const narrate = mode === 'both' || mode === 'narration';
    const recite = (mode === 'both' || mode === 'recitation') && rec.enabled;
    if (note && narrate) director.narrate(note, false);
    if (recite) director.whenIdle(() => alive.current && playFrom(0));
    return () => {
      done();
      director.stop();
      if (mine.current) rec.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = rec.current;
  const playingIdx = cur && at != null && refs[at] && refs[at][0] === cur.surah && refs[at][1] === cur.ayah ? at : null;

  return (
    <View style={{ gap: 10 }}>
      {playingIdx != null && (
        <Text style={s.now} accessibilityLiveRegion="polite">
          Quran recitation · {rec.reciter?.name}
          {rec.loading ? ' · loading…' : ''}
        </Text>
      )}
      {refs.map(([sn, an], i) => {
        const v = getVerse(sn, an);
        const on = playingIdx === i;
        return (
          <View key={`${sn}:${an}`} style={[s.ayah, on && s.ayahOn]} accessibilityLabel={`Ayah ${sn}:${an}${on ? ', being recited' : ''}`}>
            <ContentLabel kind="quran" extra={`Surah ${sn}, ayah ${an}`} />
            {v?.arabic_text ? (
              <Text style={s.arabic} accessibilityLanguage="ar">
                {v.arabic_text}
              </Text>
            ) : (
              <Text style={s.small}>Arabic text not available.</Text>
            )}
            {app.settings.showTranslation && (
              <>
                <ContentLabel kind="translation" extra="Saheeh International" />
                <Text style={s.trans}>{v?.translation_text ?? 'Translation not available.'}</Text>
              </>
            )}
            {rec.enabled && (
              <Pressable accessibilityRole="button" onPress={() => playFrom(i)} style={s.mini}>
                <Text style={s.miniText}>{on ? 'Reciting…' : 'Listen from here'}</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      {rec.enabled ? (
        <View style={s.controls} accessibilityRole="toolbar" accessibilityLabel="Recitation controls">
          <Btn label={playingIdx != null && rec.playing ? 'Pause' : playingIdx != null ? 'Resume' : 'Listen'} main onPress={() => (playingIdx != null ? rec.toggle() : playFrom(0))} />
          <Btn label="Back" disabled={!at} onPress={() => at && playFrom(at - 1)} />
          <Btn label="Replay" disabled={playingIdx == null} onPress={() => at != null && playFrom(at)} />
          <Btn label="Next" disabled={at == null || at >= refs.length - 1} onPress={() => at != null && playFrom(at + 1)} />
          <View style={s.speed}>
            {RATES.map((r) => (
              <Pressable
                key={r}
                accessibilityRole="button"
                accessibilityState={{ selected: app.settings.recitationRate === r }}
                accessibilityLabel={`Recitation speed ${r === 1 ? 'normal' : r}`}
                onPress={() => app.updateSettings({ recitationRate: r })}
                style={[s.chip, app.settings.recitationRate === r && s.chipOn]}
              >
                <Text style={s.chipText}>{r === 1 ? '1×' : `${r}×`}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <Text style={s.small}>Recitation will play here once a licensed recording from an identified reciter has been checked. The Arabic text is shown instead.</Text>
      )}
    </View>
  );
}

function Btn({ label, onPress, disabled, main }: { label: string; onPress: () => void; disabled?: boolean; main?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.btn, main && s.btnMain, disabled && { opacity: 0.4 }]}>
      <Text style={[s.btnText, main && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  now: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.greenDeep, textTransform: 'uppercase', letterSpacing: 0.5 },
  ayah: { gap: 6, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  ayahOn: { backgroundColor: colors.scripture, borderColor: colors.gold },
  arabic: { fontFamily: fonts.quran, fontSize: 26, lineHeight: 52, textAlign: 'right', writingDirection: 'rtl', color: colors.ink },
  trans: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  mini: { alignSelf: 'flex-start', paddingVertical: 2 },
  miniText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.skyDeep },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  btnMain: { backgroundColor: colors.greenDeep, borderColor: colors.greenDeep },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  speed: { flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  chip: { paddingVertical: 6, paddingHorizontal: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.sand, borderColor: colors.gold },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
});
