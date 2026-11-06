// The Quran Discovery Journal: what a child has explored, read, met and
// thought about, kept on this device. Quran text (verified Arabic and the
// Saheeh International translation) sits in plain scripture panels; anything
// written for the game (chapter names, nature notes, draft word meanings)
// and the child's own reflections are labelled as such.
import { router } from 'expo-router';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getSurah, getVerse } from '@/content/quran';
import { colors, fonts } from '@/theme';
import { WORLDS } from '@/adventure/worlds';
import { journal } from './store';
import { WORDS, wordText } from './words';

type Chapter = { label: string; done: boolean };
type WorldRow = { key: string; surah: number; title: string; chapters: Chapter[]; finished: boolean; visited: boolean };

/** Chapters come from each world's own save, so the journal never disagrees with the game. */
function worldRows(visited: Record<string, unknown>): WorldRow[] {
  const rows: WorldRow[] = [];
  const get = (k: string) => {
    if (Platform.OS !== 'web') return null;
    try {
      return JSON.parse(localStorage.getItem(k) ?? 'null');
    } catch {
      return null;
    }
  };
  for (const n of Object.keys(WORLDS).map(Number).sort((a, b) => a - b)) {
    const w = WORLDS[n];
    const s = get(`quran-adventure.world-${n}.v1`);
    const done: string[] = s?.done ?? [];
    rows.push({ key: String(n), surah: n, title: w.name, chapters: w.tasks.map((t) => ({ label: t.title, done: done.includes(t.id) })), finished: !!s?.finished, visited: !!visited[String(n)] || done.length > 0 });
  }
  const a = get('quran-adventure.ark-slice.v1');
  const kinds = ['giraffe', 'elephant', 'camel', 'sheep', 'horse'];
  rows.push({
    key: 'ark',
    surah: 11,
    title: "Nuh's Ark",
    visited: !!visited.ark || !!a,
    finished: a?.flood === 2,
    chapters: [
      { label: 'Read the lanterns (11:36–41)', done: (a?.read?.length ?? 0) >= 4 },
      { label: 'Guide five pairs of animals aboard', done: kinds.every((k) => a?.boarded?.includes(k)) },
      { label: 'Store the grain, hay and water', done: (a?.stored?.length ?? 0) >= 3 },
      { label: 'Wait inside through the flood', done: (a?.flood ?? 0) >= 1 },
      { label: 'The water goes down (11:44)', done: a?.flood === 2 },
    ],
  });
  return rows;
}

const PROMPTS = ['Something I noticed today…', 'An ayah I want to remember…', 'Something I want to do because of what I learned…', 'A question I want to ask my teacher…'];

export default function Journal() {
  const [, bump] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    journal.reload();
    return journal.subscribe(bump);
  }, []);
  const d = journal.get();
  const rows = useMemo(() => worldRows(d.worlds), [d.worlds]);
  const [tab, setTab] = useState<'worlds' | 'quran' | 'words' | 'nature' | 'thoughts'>('worlds');
  const [open, setOpen] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [text, setText] = useState('');
  const [where, setWhere] = useState('');

  const refs = Object.keys(d.refs)
    .map((k) => k.split(':').map(Number) as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const words = WORDS.filter((w) => d.words[w.id]);
  const seen = Object.entries(d.seen).sort((a, b) => a[1].at - b[1].at);
  const explored = rows.filter((r) => r.visited);
  const chaptersDone = rows.reduce((n, r) => n + r.chapters.filter((c) => c.done).length, 0);

  const tabs: [typeof tab, string][] = [
    ['worlds', `Worlds (${explored.length})`],
    ['quran', `Quran I read (${refs.length})`],
    ['words', `Arabic words (${words.length})`],
    ['nature', `Nature notes (${seen.length})`],
    ['thoughts', `My thoughts (${d.reflections.length})`],
  ];

  return (
    <ScrollView style={st.root} contentContainerStyle={st.body}>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/adventure' as never))} style={st.back} accessibilityRole="button">
        <Text style={st.backText}>‹ Back</Text>
      </Pressable>
      <Text style={st.h1}>My Discovery Journal</Text>
      <Text style={st.p}>
        {explored.length} worlds explored · {chaptersDone} chapters done · {refs.length} ayahs read · {words.length} words met. Saved on this device only. No points or
        scores are given for ayahs.
      </Text>
      <View style={st.legend}>
        <Text style={[st.tag, st.tagQuran]}>Quran: verified Arabic and Saheeh International translation</Text>
        <Text style={[st.tag, st.tagGame]}>Written for this game</Text>
        <Text style={[st.tag, st.tagMine]}>Written by you</Text>
      </View>
      <View style={st.tabs} accessibilityRole="tablist">
        {tabs.map(([k, label]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[st.tab, tab === k && st.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}>
            <Text style={[st.tabText, tab === k && st.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'worlds' &&
        rows.map((r) => {
          const n = r.chapters.filter((c) => c.done).length;
          const isOpen = open === r.key;
          return (
            <View key={r.key} style={[st.card, !r.visited && st.off]}>
              <Pressable onPress={() => setOpen(isOpen ? null : r.key)} accessibilityRole="button" style={st.row}>
                <Text style={st.num}>{r.surah}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.name}>
                    {getSurah(r.surah)?.nameTransliterated} · {r.title}
                  </Text>
                  <Text style={st.small}>{r.visited ? (r.finished ? 'Finished' : `${n} of ${r.chapters.length} chapters`) : 'Not explored yet'}</Text>
                </View>
                <Text style={st.small}>{isOpen ? '▴' : '▾'}</Text>
              </Pressable>
              {isOpen && (
                <View style={{ gap: 4, marginTop: 8 }}>
                  <Text style={[st.tag, st.tagGame]}>Chapters are game activities, not events from the Quran</Text>
                  {r.chapters.map((c, i) => (
                    <Text key={i} style={[st.small, c.done && { color: colors.greenDeep, fontFamily: fonts.bodyBold }]}>
                      {c.done ? '✓ ' : '○ '}
                      {c.label}
                    </Text>
                  ))}
                  <Pressable style={st.btn} onPress={() => router.push((r.key === 'ark' ? '/ark' : `/adventure/${r.key}`) as never)} accessibilityRole="button">
                    <Text style={st.btnText}>{r.visited ? 'Go back to this world' : 'Explore this world'}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

      {tab === 'quran' &&
        (refs.length ? (
          refs.map(([s, a]) => {
            const v = getVerse(s, a);
            if (!v) return null;
            return (
              <View key={`${s}:${a}`} style={st.scripture}>
                <Text style={st.ref}>
                  {v.surah_name} {s}:{a}
                </Text>
                <Text style={st.arabic}>{v.arabic_text}</Text>
                {!!v.translation_text && <Text style={st.trans}>{v.translation_text}</Text>}
                <Text style={st.src}>
                  {v.text_source} · {v.translation_source}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={st.p}>Ayahs you open at lanterns and tablets in the worlds will be kept here.</Text>
        ))}

      {tab === 'words' && (
        <>
          <Text style={st.p}>Each word is taken from the verified text of the ayah it comes from. The short English meanings are draft study aids written for this app and still need checking by a teacher.</Text>
          {words.length ? (
            words.map((w) => {
              const ar = wordText(w);
              return (
                <View key={w.id} style={st.wordCard}>
                  <View style={st.scriptureMini}>
                    <Text style={st.arabicBig}>{ar ?? '—'}</Text>
                    <Text style={st.src}>
                      from {w.at[0]}:{w.at[1]}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={st.name}>{w.meaning}</Text>
                    <Text style={[st.tag, st.tagGame]}>Draft meaning · for review</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={st.p}>Read ayahs in the worlds to meet new words.</Text>
          )}
        </>
      )}

      {tab === 'nature' &&
        (seen.length ? (
          seen.map(([id, o]) => (
            <View key={id} style={st.card}>
              <Text style={st.name}>{o.label}</Text>
              <Text style={st.small}>{o.note.replace(/^Journal:\s*/, '')}</Text>
              <Text style={[st.tag, st.tagGame]}>Game note · {o.world === 'ark' ? "Nuh's Ark" : `${getSurah(Number(o.world))?.nameTransliterated} world`}</Text>
            </View>
          ))
        ) : (
          <Text style={st.p}>Watch animals and plants quietly in the worlds, and what you notice will be written here.</Text>
        ))}

      {tab === 'thoughts' && (
        <>
          <View style={st.card}>
            <Text style={st.name}>Write a reflection</Text>
            <View style={st.chips}>
              {PROMPTS.map((p) => (
                <Pressable key={p} onPress={() => setPrompt(p)} style={[st.chip, prompt === p && st.chipOn]} accessibilityRole="button">
                  <Text style={st.chipText}>{p}</Text>
                </Pressable>
              ))}
            </View>
            <View style={st.chips}>
              {explored.map((r) => (
                <Pressable key={r.key} onPress={() => setWhere(r.key)} style={[st.chip, where === r.key && st.chipOn]} accessibilityRole="button">
                  <Text style={st.chipText}>{r.title}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput value={text} onChangeText={setText} placeholder={prompt} multiline maxLength={400} style={st.input} accessibilityLabel="Your reflection" />
            <Pressable
              style={[st.btn, !text.trim() && st.off]}
              disabled={!text.trim()}
              onPress={() => {
                journal.reflect(where || 'general', prompt, text);
                setText('');
              }}
              accessibilityRole="button"
            >
              <Text style={st.btnText}>Keep it in my journal</Text>
            </Pressable>
          </View>
          {[...d.reflections].reverse().map((r) => (
            <View key={r.at} style={[st.card, st.mine]}>
              <Text style={st.small}>{r.prompt}</Text>
              <Text style={st.name}>{r.text}</Text>
              <View style={st.row}>
                <Text style={[st.small, { flex: 1 }]}>
                  {r.world === 'general' ? '' : r.world === 'ark' ? "Nuh's Ark · " : `${WORLDS[Number(r.world)]?.name ?? ''} · `}
                  {new Date(r.at).toLocaleDateString()}
                </Text>
                <Pressable onPress={() => journal.removeReflection(r.at)} accessibilityRole="button" accessibilityLabel="Remove this reflection">
                  <Text style={st.small}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  body: { padding: 20, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center', paddingBottom: 60 },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: fonts.bodyBold, color: colors.inkSoft, fontSize: 15 },
  h1: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  p: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkSoft },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { alignSelf: 'flex-start', fontFamily: fonts.bodyBold, fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden', borderWidth: 1 },
  tagQuran: { backgroundColor: colors.scripture, borderColor: colors.scriptureBorder, color: colors.ink },
  tagGame: { backgroundColor: colors.activity, borderColor: colors.activityBorder, color: colors.terracotta },
  tagMine: { backgroundColor: colors.explanation, borderColor: colors.explanationBorder, color: colors.greenDeep },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  tabOn: { backgroundColor: colors.greenDeep, borderColor: colors.greenDeep },
  tabText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  tabTextOn: { color: '#fff' },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 4 },
  mine: { backgroundColor: colors.explanation, borderColor: colors.explanationBorder },
  off: { opacity: 0.55 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  num: { fontFamily: fonts.display, fontSize: 22, color: colors.gold, width: 34, textAlign: 'center' },
  name: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 19 },
  btn: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: colors.greenDeep, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  btnText: { fontFamily: fonts.bodyBold, color: '#fff', fontSize: 14 },
  scripture: { backgroundColor: colors.scripture, borderColor: colors.scriptureBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  scriptureMini: { backgroundColor: colors.scripture, borderColor: colors.scriptureBorder, borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 110 },
  ref: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  arabic: { fontFamily: fonts.quran, fontSize: 24, lineHeight: 46, color: colors.ink, textAlign: 'right', writingDirection: 'rtl' },
  arabicBig: { fontFamily: fonts.quran, fontSize: 30, lineHeight: 52, color: colors.ink },
  trans: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  src: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  wordCard: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  chipOn: { borderColor: colors.greenDeep, backgroundColor: colors.explanation },
  chipText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  input: { marginTop: 6, minHeight: 80, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 10, fontFamily: fonts.body, fontSize: 15, color: colors.ink, backgroundColor: '#fff' },
});
