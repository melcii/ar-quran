// The subtitle strip: shows what the narrator or guide is saying, whenever the
// words are not already on screen in a card. Labelled as the game's own
// narration so it is never mistaken for Quran text.
import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '@/theme';
import { useSpeaking } from './hooks';

export function Subtitles() {
  const line = useSpeaking();
  if (!line || !line.subtitle) return null;
  return (
    <View style={s.wrap} pointerEvents="none" accessibilityLiveRegion="polite">
      <View style={s.box}>
        <Text style={s.who}>{line.kind === 'instruction' ? 'Guide' : 'Narrator'} · written for this game, not Quran text</Text>
        <Text style={s.text}>{line.text}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, bottom: 150, alignItems: 'center' },
  box: { maxWidth: 560, backgroundColor: 'rgba(20,14,9,0.82)', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14, gap: 2 },
  who: { fontFamily: fonts.bodyBold, fontSize: 11, color: '#d8c6a6', textTransform: 'uppercase', letterSpacing: 0.5 },
  text: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: '#fbf1dc' },
});
