// The adventure worlds for surahs 1 to 10: which exist, and how far you got.
// Every world is a draft for scholarly review.
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSurah } from '@/content/quran';
import { colors, fonts } from '@/theme';
import { WORLDS } from './worlds';

function progress(n: number): string {
  if (Platform.OS !== 'web') return '';
  try {
    const s = JSON.parse(localStorage.getItem(`quran-adventure.world-${n}.v1`) ?? 'null');
    const w = WORLDS[n];
    if (!s || !w) return '';
    if (s.finished) return 'Finished';
    const d = w.tasks.filter((t) => s.done?.includes(t.id)).length;
    return d ? `${d} of ${w.tasks.length} activities` : '';
  } catch {
    return '';
  }
}

export default function Chooser() {
  return (
    <ScrollView style={st.root} contentContainerStyle={st.body}>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={st.back}>
        <Text style={st.backText}>‹ Back</Text>
      </Pressable>
      <Text style={st.h1}>Adventure worlds</Text>
      <Text style={st.p}>
        Walk, explore and learn in a world for each surah. Every world holds the whole surah in verified Arabic with a translation. The places and activities are game ideas
        made to help you think about the meanings; they are not pictures of real events. These are drafts waiting for scholarly review.
      </Text>
      {Platform.OS !== 'web' && <Text style={st.warn}>These 3D worlds open in the web version of the app for now.</Text>}
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const s = getSurah(n)!;
        const w = WORLDS[n];
        const p = progress(n);
        return (
          <Pressable
            key={n}
            disabled={!w}
            onPress={() => router.push(`/adventure/${n}` as never)}
            style={({ pressed }) => [st.card, !w && st.off, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
          >
            <Text style={st.num}>{n}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={st.name}>
                {s.nameTransliterated} · {w ? w.name : 'not built yet'}
              </Text>
              <Text style={st.small}>{w ? w.theme : s.nameMeaning}</Text>
              {!!p && <Text style={st.prog}>{p}</Text>}
            </View>
            <Text style={st.arabic}>{s.nameArabic}</Text>
          </Pressable>
        );
      })}
      <Pressable onPress={() => router.push('/ark')} style={st.card}>
        <Text style={st.num}>11</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.name}>Hud · Nuh&apos;s Ark (the first slice)</Text>
          <Text style={st.small}>Gather the animals and supplies; wait out the flood inside</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  body: { padding: 20, gap: 10, maxWidth: 720, width: '100%', alignSelf: 'center' },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: fonts.bodyBold, color: colors.inkSoft, fontSize: 15 },
  h1: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  p: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkSoft },
  warn: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.terracotta },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 14 },
  off: { opacity: 0.55 },
  num: { fontFamily: fonts.display, fontSize: 22, color: colors.gold, width: 30, textAlign: 'center' },
  name: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  prog: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.greenDeep },
  arabic: { fontFamily: fonts.quran, fontSize: 22, color: colors.ink },
});
