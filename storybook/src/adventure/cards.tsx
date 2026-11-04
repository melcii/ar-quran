// The panels of an adventure: narration, readings of verified ayahs, the
// matching / ordering / sorting games, the whole surah, the closing
// reflection, and "About this world". Quran text, translation, explanation
// and activities are always labelled apart.
import * as Speech from 'expo-speech';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { basmalahFor, getSurah, getVerse, toArabicDigits } from '@/content/quran';
import { recitationEnabled } from '@/state/Recitation';
import { fonts } from '@/theme';
import type { QuizGame, Reading, Ref, Task, WorldDef } from './types';

export type Card =
  | { kind: 'narration'; text: string }
  | { kind: 'reading'; reading: Reading }
  | { kind: 'quiz'; task: Task & { kind: 'quiz' } }
  | { kind: 'book' }
  | { kind: 'finale' }
  | { kind: 'about' }
  | { kind: 'choice'; task: Task & { kind: 'choice' } }
  | { kind: 'share'; task: Task & { kind: 'share' } }
  | { kind: 'weigh'; task: Task & { kind: 'weigh' } }
  | { kind: 'vow'; task: Task & { kind: 'promise' } }
  /** A plug-in kind of play's own panel (mechanics/). */
  | { kind: 'mech'; task: Task };

export function verse([s, a]: Ref) {
  const v = getVerse(s, a);
  return { surah: s, ayah: a, ref: `${s}:${a}`, arabic: v?.arabic_text ?? null, translation: v?.translation_text ?? null };
}

export function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { rate: 0.92, language: 'en' });
}

function shuffle<T>(xs: T[], seed: number) {
  const a = [...xs];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Never start already solved.
  if (a.length > 1 && a.every((x, i) => x === xs[i])) a.push(a.shift()!);
  return a;
}

type Props = { card: Card; world: WorldDef; portrait: boolean; onClose: () => void; onSolved: () => void; listen: (s: number, a: number) => void };

export function CardView({ card, world, portrait, onClose, onSolved, listen }: Props) {
  const width = portrait ? '94%' : 600;
  if (card.kind === 'narration')
    return (
      <View style={[st.card, { width } as never, st.cardBottom]}>
        <ContentLabel kind="explanation" extra="narration written for this game" />
        <Text style={st.cardText}>{card.text}</Text>
        <View style={st.row}>
          <Pressable style={st.btnGhost} onPress={() => speak(card.text)}>
            <Text style={st.btnGhostText}>Read aloud</Text>
          </Pressable>
          <Pressable style={st.btn} onPress={onClose} accessibilityRole="button">
            <Text style={st.btnText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  if (card.kind === 'reading') return <ReadingCard reading={card.reading} width={width} portrait={portrait} onClose={onClose} listen={listen} />;
  if (card.kind === 'quiz') return <QuizCard task={card.task} width={width} portrait={portrait} onClose={onClose} onSolved={onSolved} />;
  if (card.kind === 'book') return <BookCard surah={world.surah} width={width} portrait={portrait} onClose={onClose} />;
  if (card.kind === 'about') return <AboutCard world={world} width={width} portrait={portrait} onClose={onClose} />;
  const f = world.finale;
  const v = verse(f.ref);
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ScrollView style={{ maxHeight: portrait ? 480 : 440 }} contentContainerStyle={{ gap: 10 }}>
        <ContentLabel kind="explanation" extra="reflection" />
        <Text style={st.cardTitle}>{f.title}</Text>
        {f.body.map((b) => (
          <Text key={b} style={st.cardText}>
            {b}
          </Text>
        ))}
        <ContentLabel kind="quran" extra={`Surah ${v.surah}, ayah ${v.ayah}`} />
        {v.arabic && <Text style={st.arabic}>{v.arabic}</Text>}
        <ContentLabel kind="translation" extra="Saheeh International" />
        <Text style={st.cardText}>{v.translation}</Text>
        <ContentLabel kind="explanation" extra="questions to think about" />
        {f.questions.map((x) => (
          <Text key={x} style={st.cardText}>
            • {x}
          </Text>
        ))}
      </ScrollView>
      <View style={st.row}>
        <Pressable style={st.btn} onPress={onClose}>
          <Text style={st.btnText}>Finish</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AyahBlock({ r, listen }: { r: Ref; listen?: (s: number, a: number) => void }) {
  const v = verse(r);
  return (
    <View style={{ gap: 6 }}>
      <ContentLabel kind="quran" extra={`Surah ${v.surah}, ayah ${v.ayah}`} />
      {v.arabic ? <Text style={st.arabic}>{v.arabic}</Text> : <Text style={st.small}>Arabic text not available.</Text>}
      <ContentLabel kind="translation" extra="Saheeh International" />
      <Text style={st.cardText}>{v.translation ?? 'Translation not available.'}</Text>
      {listen &&
        (recitationEnabled ? (
          <Pressable style={st.btnGhost} onPress={() => listen(v.surah, v.ayah)}>
            <Text style={st.btnGhostText}>Listen to the recitation</Text>
          </Pressable>
        ) : null)}
    </View>
  );
}

function ReadingCard({ reading, width, portrait, onClose, listen }: { reading: Reading; width: string | number; portrait: boolean; onClose: () => void; listen: (s: number, a: number) => void }) {
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ScrollView style={{ maxHeight: portrait ? 470 : 430 }} contentContainerStyle={{ gap: 12 }}>
        <Text style={st.cardTitle}>{reading.title}</Text>
        {reading.refs.map((r) => (
          <AyahBlock key={r.join(':')} r={r} listen={listen} />
        ))}
        {!recitationEnabled && <Text style={st.small}>Recitation will play here once a licensed recording is confirmed.</Text>}
        <ContentLabel kind="explanation" />
        <Text style={st.cardText}>{reading.note}</Text>
      </ScrollView>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={() => speak(reading.note)}>
          <Text style={st.btnGhostText}>Read the explanation aloud</Text>
        </Pressable>
        <Pressable style={st.btn} onPress={onClose} accessibilityRole="button">
          <Text style={st.btnText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------- games ------------------------------- */

function QuizCard({ task, width, portrait, onClose, onSolved }: { task: Task & { kind: 'quiz' }; width: string | number; portrait: boolean; onClose: () => void; onSolved: () => void }) {
  const [solved, setSolved] = useState(false);
  const done = () => {
    setSolved(true);
    onSolved();
  };
  const g = task.game;
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra={g.type === 'sort' ? 'cards written for this game' : 'uses the verified text only'} />
      <Text style={st.cardTitle}>{task.title}</Text>
      <Text style={st.cardText}>{task.prompt}</Text>
      <ScrollView style={{ maxHeight: portrait ? 420 : 380 }} contentContainerStyle={{ gap: 8 }}>
        {g.type === 'match' && <Match game={g} onDone={done} />}
        {g.type === 'order' && <Order game={g} onDone={done} />}
        {g.type === 'sort' && <Sort game={g} onDone={done} />}
      </ScrollView>
      <View style={st.row}>
        {solved && <Text style={[st.cardText, { flex: 1, color: '#4f7a3a' }]}>Well done.</Text>}
        <Pressable style={solved ? st.btn : st.btnGhost} onPress={onClose}>
          <Text style={solved ? st.btnText : st.btnGhostText}>{solved ? 'Continue' : 'Close for now'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Match({ game, onDone }: { game: Extract<QuizGame, { type: 'match' }>; onDone: () => void }) {
  const left = useMemo(() => shuffle(game.refs, 7), [game]);
  const right = useMemo(() => shuffle(game.refs, 13), [game]);
  const [pick, setPick] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const key = (r: Ref) => r.join(':');
  const choose = (k: string) => {
    if (!pick) return;
    if (k === pick) {
      const m = [...matched, k];
      setMatched(m);
      setPick(null);
      setWrong(null);
      if (m.length === game.refs.length) onDone();
    } else {
      setWrong(k);
      setTimeout(() => setWrong(null), 700);
    }
  };
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.small}>Tap an ayah in Arabic, then tap its translation.</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, gap: 6 }}>
          {left.map((r) => {
            const k = key(r);
            const done = matched.includes(k);
            return (
              <Pressable key={k} disabled={done} onPress={() => setPick(k)} style={[st.tile, pick === k && st.tilePick, done && st.tileDone]}>
                <Text style={[st.arabicSmall]}>{verse(r).arabic}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          {right.map((r) => {
            const k = key(r);
            const done = matched.includes(k);
            return (
              <Pressable key={k} disabled={done || !pick} onPress={() => choose(k)} style={[st.tile, done && st.tileDone, wrong === k && st.tileWrong]}>
                <Text style={st.tileText}>{verse(r).translation}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Order({ game, onDone }: { game: Extract<QuizGame, { type: 'order' }>; onDone: () => void }) {
  const cards = useMemo(() => shuffle(game.refs, 21), [game]);
  const [placed, setPlaced] = useState<Ref[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const next = game.refs[placed.length];
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.small}>Tap the ayahs in the order they come in the surah.</Text>
      {placed.map((r, i) => (
        <View key={r.join(':')} style={[st.tile, st.tileDone]}>
          <Text style={st.tileText}>
            {i + 1}. ({r.join(':')}) {verse(r).translation}
          </Text>
        </View>
      ))}
      {cards
        .filter((r) => !placed.includes(r))
        .map((r) => (
          <Pressable
            key={r.join(':')}
            style={[st.tile, wrong === r.join(':') && st.tileWrong]}
            onPress={() => {
              if (r === next) {
                const p = [...placed, r];
                setPlaced(p);
                if (p.length === game.refs.length) onDone();
              } else {
                setWrong(r.join(':'));
                setTimeout(() => setWrong(null), 700);
              }
            }}
          >
            <Text style={st.arabicSmall}>{verse(r).arabic}</Text>
            <Text style={st.tileText}>{verse(r).translation}</Text>
          </Pressable>
        ))}
    </View>
  );
}

function Sort({ game, onDone }: { game: Extract<QuizGame, { type: 'sort' }>; onDone: () => void }) {
  const cards = useMemo(() => shuffle(game.cards, 5), [game]);
  const [i, setI] = useState(0);
  const [miss, setMiss] = useState(false);
  const c = cards[i];
  if (!c) return <Text style={st.cardText}>All sorted.</Text>;
  return (
    <View style={{ gap: 8 }}>
      <Text style={st.small}>
        Card {i + 1} of {cards.length}
      </Text>
      <View style={[st.tile, miss && st.tileWrong]}>
        <Text style={[st.cardText, { textAlign: 'center' }]}>{c.text}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {game.bins.map((b, k) => (
          <Pressable
            key={b}
            style={st.btn}
            onPress={() => {
              if (k === c.bin) {
                setMiss(false);
                setI(i + 1);
                if (i + 1 === cards.length) onDone();
              } else {
                setMiss(true);
                setTimeout(() => setMiss(false), 700);
              }
            }}
          >
            <Text style={st.btnText}>{b}</Text>
          </Pressable>
        ))}
      </View>
      {miss && <Text style={[st.small, { textAlign: 'center' }]}>Think again, and try the other group.</Text>}
    </View>
  );
}

/* ------------------------------- the whole surah ------------------------------- */

function BookCard({ surah, width, portrait, onClose }: { surah: number; width: string | number; portrait: boolean; onClose: () => void }) {
  const s = getSurah(surah)!;
  const ayahs = useMemo(() => Array.from({ length: s.ayahCount }, (_, i) => i + 1), [s]);
  const bas = basmalahFor(surah);
  return (
    <View style={[st.card, { width } as never, st.cardTall]}>
      <Text style={st.cardTitle}>
        Surah {s.nameTransliterated} ({s.nameMeaning}) · {s.ayahCount} ayahs
      </Text>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <ContentLabel kind="quran" extra="KFGQPC Uthmanic Hafs" />
        <ContentLabel kind="translation" extra="Saheeh International" />
      </View>
      <FlatList
        style={{ maxHeight: portrait ? 520 : 470 }}
        data={ayahs}
        keyExtractor={(n) => String(n)}
        initialNumToRender={8}
        windowSize={7}
        ListHeaderComponent={
          <View style={{ gap: 4, paddingBottom: 8 }}>
            <Text style={[st.arabic, { textAlign: 'center' }]}>{s.nameArabic}</Text>
            {bas && <Text style={[st.arabic, { textAlign: 'center' }]}>{bas}</Text>}
            {surah === 9 && <Text style={[st.small, { textAlign: 'center' }]}>Surah At-Tawbah is the one surah that does not begin with the basmalah.</Text>}
          </View>
        }
        renderItem={({ item: a }) => {
          const v = verse([surah, a]);
          return (
            <View style={st.ayahRow}>
              <Text style={st.arabic}>
                {v.arabic} ﴿{toArabicDigits(a)}﴾
              </Text>
              <Text style={st.tileText}>
                {a}. {v.translation}
              </Text>
            </View>
          );
        }}
      />
      <View style={st.row}>
        <Pressable style={st.btn} onPress={onClose}>
          <Text style={st.btnText}>Close the book</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AboutCard({ world, width, portrait, onClose }: { world: WorldDef; width: string | number; portrait: boolean; onClose: () => void }) {
  const refs = new Set<string>();
  const add = (r: Reading | undefined) => r?.refs.forEach((x) => refs.add(x.join(':')));
  for (const t of world.tasks) {
    add(t.after);
    // Every reading anywhere in the activity (points, stops, phases, rounds...).
    const walk = (o: unknown): void => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) return o.forEach(walk);
      const r = o as Record<string, unknown>;
      if (Array.isArray(r.refs) && typeof r.note === 'string') add(r as unknown as Reading);
      for (const k of Object.keys(r)) if (k !== 'look') walk(r[k]);
    };
    walk(t);
    if (t.kind === 'quiz' && t.game.type !== 'sort') t.game.refs.forEach((x) => refs.add(x.join(':')));
  }
  refs.add(world.finale.ref.join(':'));
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ScrollView style={{ maxHeight: portrait ? 500 : 460 }} contentContainerStyle={{ gap: 8 }}>
        <Text style={st.cardTitle}>About this world</Text>
        <Text style={st.cardText}>
          A draft for scholarly review. The landscape, buildings, people&apos;s homes and activities are the game&apos;s own, made to help children explore the meanings of the surah. They are not
          claims about how any place or event looked.
        </Text>
        <ContentLabel kind="quran" extra="ayahs you can read in this world" />
        <Text style={st.tileText}>{[...refs].sort((a, b) => +a.split(':')[0] - +b.split(':')[0] || +a.split(':')[1] - +b.split(':')[1]).join(' · ')}</Text>
        <Text style={st.small}>Plus the whole surah, in the book. Arabic: KFGQPC Uthmanic Hafs. Translation: Saheeh International. Nothing in the Arabic is generated or changed.</Text>
        {!!world.play && (
          <>
            <ContentLabel kind="activity" extra="how this world plays" />
            <Text style={st.tileText}>{world.play}</Text>
          </>
        )}
        <ContentLabel kind="activity" extra="what is adapted" />
        {world.tasks
          .filter((t) => t.adaptation)
          .map((t) => (
            <Text key={t.id} style={st.tileText}>
              • {t.title}: {t.adaptation}
            </Text>
          ))}
        <ContentLabel kind="explanation" extra="what is never shown" />
        {world.notes.map((n) => (
          <Text key={n} style={st.tileText}>
            • {n}
          </Text>
        ))}
      </ScrollView>
      <View style={st.row}>
        <Pressable style={st.btn} onPress={onClose}>
          <Text style={st.btnText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const st = StyleSheet.create({
  card: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(255,250,238,0.97)', borderRadius: 20, padding: 18, gap: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.35)' } as never,
  cardBottom: { bottom: 24 },
  cardMid: { top: '8%' },
  cardTall: { top: '4%' },
  cardTitle: { fontFamily: fonts.display, fontSize: 21, color: '#3b3326' },
  cardText: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: '#3b3326' },
  arabic: { fontFamily: fonts.quran, fontSize: 24, lineHeight: 46, color: '#2a2418', textAlign: 'right', writingDirection: 'rtl' },
  arabicSmall: { fontFamily: fonts.quran, fontSize: 19, lineHeight: 36, color: '#2a2418', textAlign: 'right', writingDirection: 'rtl' },
  small: { fontFamily: fonts.body, fontSize: 12, color: '#6e624e' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  btn: { backgroundColor: '#6f8f6a', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#fffbf2' },
  btnGhost: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#cbb894', alignSelf: 'flex-start' },
  btnGhostText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#6e5a3a' },
  tile: { borderRadius: 12, borderWidth: 1, borderColor: '#e0d0b0', backgroundColor: '#fffdf6', padding: 10, gap: 4 },
  tilePick: { borderColor: '#c08a3a', borderWidth: 2, backgroundColor: '#fff4dc' },
  tileDone: { backgroundColor: '#e6f0da', borderColor: '#9ab880' },
  tileWrong: { backgroundColor: '#f8e0d8', borderColor: '#d09080' },
  tileText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: '#3b3326' },
  ayahRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eadfc8', gap: 4 },
});
