// Playable activities from a surah's design record. They are reading games
// built only from the verified text and the design's places: they never add
// words to the Quran or act out its events, and each is labelled an
// adaptation. Kinds: "order" (put a run of ayahs in order), "match" (match
// each place of the world to the ayah it comes from) and "journey" (put the
// world's places in the order the surah tells them).
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, ContentLabel, IconButton, Row } from '@/components/ui';
import type { WorldDesignSummary } from '@/content/designs';
import { formatRef, getVerse, parseRef } from '@/content/quran';
import { colors, fonts, radius } from '@/theme';

type Activity = WorldDesignSummary['activities'][number];

/** A fixed shuffle that never leaves the list in its original order. */
function shuffled<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out.every((x, i) => x === items[i])) out.push(out.shift()!);
  return out;
}

export function ActivityGame({
  design,
  activity,
  style,
  onDone,
  onClose,
}: {
  design: WorldDesignSummary;
  activity: Activity;
  style: object;
  onDone: () => void;
  onClose: () => void;
}) {
  return (
    <View style={style} accessibilityLabel={`Activity: ${activity.name}`}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={s.title}>{activity.name}</Text>
          <ContentLabel kind="activity" extra="artistic adaptation" />
        </View>
        <IconButton icon="close" label="Close the activity" onPress={onClose} size={36} />
      </Row>
      <Text style={s.small}>{activity.description}</Text>
      {activity.kind === 'order' && <OrderGame design={design} activity={activity} onDone={onDone} />}
      {activity.kind === 'match' && <MatchGame design={design} onDone={onDone} />}
      {activity.kind === 'journey' && <JourneyGame design={design} onDone={onDone} />}
    </View>
  );
}

function OrderGame({ design, activity, onDone }: { design: WorldDesignSummary; activity: Activity; onDone: () => void }) {
  const ref = parseRef(activity.reference)!;
  const ayahs = useMemo(() => Array.from({ length: ref.to - ref.from + 1 }, (_, i) => ref.from + i), [ref.from, ref.to]);
  const cards = useMemo(() => shuffled(ayahs, design.surah * 31 + ref.from), [ayahs, design.surah, ref.from]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const next = ayahs[placed.length];
  const done = placed.length === ayahs.length;
  const tap = (a: number) => {
    if (a === next) {
      const now = [...placed, a];
      setPlaced(now);
      setWrong(null);
      if (now.length === ayahs.length) onDone();
    } else setWrong(a);
  };
  return (
    <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 8 }}>
      <Text style={s.prompt}>{done ? 'All in order. Well done!' : `Which ayah comes ${placed.length ? 'next' : 'first'}? Tap it.`}</Text>
      {placed.map((a) => (
        <VerseCard key={`p${a}`} surah={design.surah} ayah={a} state="placed" />
      ))}
      {!done && (
        <View style={{ gap: 8 }}>
          {wrong != null && <Text style={s.nudge}>Not that one yet. Read them again: which comes {placed.length ? 'next' : 'first'}?</Text>}
          {cards
            .filter((a) => !placed.includes(a))
            .map((a) => (
              <VerseCard key={a} surah={design.surah} ayah={a} hideNumber state={wrong === a ? 'wrong' : 'open'} onPress={() => tap(a)} />
            ))}
        </View>
      )}
    </ScrollView>
  );
}

function JourneyGame({ design, onDone }: { design: WorldDesignSummary; onDone: () => void }) {
  const ordered = useMemo(
    () => [...design.areas].map((a) => ({ ...a, at: parseRef(a.reference)?.from ?? 0 })).sort((x, y) => x.at - y.at),
    [design.areas],
  );
  const cards = useMemo(() => shuffled(ordered, design.surah * 13 + 5), [ordered, design.surah]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const done = placed.length === ordered.length;
  const tap = (name: string) => {
    if (ordered[placed.length]?.name === name) {
      const now = [...placed, name];
      setPlaced(now);
      setWrong(null);
      if (now.length === ordered.length) onDone();
    } else setWrong(name);
  };
  return (
    <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 8 }}>
      <Text style={s.prompt}>{done ? 'The whole journey, in order. Well done!' : `Which place comes ${placed.length ? 'next' : 'first'} in the surah?`}</Text>
      {ordered
        .filter((a) => placed.includes(a.name))
        .map((a, i) => (
          <View key={a.name} style={[s.card, s.cardPlaced]}>
            <Text style={s.prompt}>
              {i + 1}. {a.name}
            </Text>
            <Text style={s.translation}>{getVerse(design.surah, a.at)?.translation_text}</Text>
            <Text style={s.cardMeta}>{formatRef(a.reference)} · Saheeh International</Text>
          </View>
        ))}
      {wrong && <Text style={s.nudge}>Not yet. Think about what happens first in the story.</Text>}
      {!done && (
        <Row wrap style={{ gap: 6 }}>
          {cards
            .filter((a) => !placed.includes(a.name))
            .map((a) => (
              <Pressable key={a.name} accessibilityRole="button" onPress={() => tap(a.name)} style={[s.chip, wrong === a.name && s.chipPicked]}>
                <Text style={s.chipText}>{a.name}</Text>
              </Pressable>
            ))}
        </Row>
      )}
    </ScrollView>
  );
}

function VerseCard({ surah, ayah, state, hideNumber, onPress }: { surah: number; ayah: number; state: 'open' | 'wrong' | 'placed'; hideNumber?: boolean; onPress?: () => void }) {
  const v = getVerse(surah, ayah);
  if (!v) return null;
  const body = (
    <View style={[s.card, state === 'placed' && s.cardPlaced, state === 'wrong' && s.cardWrong]}>
      <Text style={s.arabic}>{v.arabic_text}</Text>
      <Text style={s.translation}>{v.translation_text}</Text>
      <Text style={s.cardMeta}>{hideNumber ? 'Saheeh International' : `${surah}:${ayah} · Saheeh International`}</Text>
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={`Ayah: ${v.translation_text}`} onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

function MatchGame({ design, onDone }: { design: WorldDesignSummary; onDone: () => void }) {
  const places = design.areas;
  const refs = useMemo(() => shuffled([...new Set(places.map((a) => a.reference))], design.surah * 17), [places, design.surah]);
  const [pick, setPick] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const done = matched.length === places.length;
  const choose = (r: string) => {
    if (pick == null) return;
    if (places[pick].reference === r) {
      const now = [...matched, pick];
      setMatched(now);
      setPick(null);
      setWrong(null);
      if (now.length === places.length) onDone();
    } else setWrong(r);
  };
  return (
    <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 8 }}>
      <Text style={s.prompt}>{done ? 'Every place matched. Well done!' : pick == null ? 'Tap a place.' : `Now tap the ayah that “${places[pick].name}” comes from.`}</Text>
      <Row wrap style={{ gap: 6 }}>
        {places.map((a, i) => (
          <Pressable
            key={a.name}
            accessibilityRole="button"
            accessibilityState={{ selected: pick === i, disabled: matched.includes(i) }}
            onPress={() => !matched.includes(i) && (setPick(i), setWrong(null))}
            style={[s.chip, pick === i && s.chipPicked, matched.includes(i) && s.chipDone]}
          >
            <Text style={s.chipText}>
              {matched.includes(i) ? '✓ ' : ''}
              {a.name}
              {matched.includes(i) ? ` · ${formatRef(a.reference)}` : ''}
            </Text>
          </Pressable>
        ))}
      </Row>
      {wrong && <Text style={s.nudge}>Not this ayah. Look for the words that describe the place.</Text>}
      {!done &&
        refs.map((r) => {
          const p = parseRef(r)!;
          const v = getVerse(p.surah, p.from);
          return (
            <Pressable key={r} accessibilityRole="button" accessibilityLabel={`Ayah ${formatRef(r)}`} onPress={() => choose(r)}>
              <View style={[s.card, wrong === r && s.cardWrong]}>
                <Text style={s.arabic}>{v?.arabic_text}</Text>
                <Text style={s.translation}>{v?.translation_text}</Text>
                <Text style={s.cardMeta}>{formatRef(r)} · Saheeh International</Text>
              </View>
            </Pressable>
          );
        })}
      {done && <Button small kind="secondary" label="Play again" onPress={() => (setMatched([]), setPick(null))} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  prompt: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  nudge: { fontFamily: fonts.body, fontSize: 13, color: '#8a4a12' },
  card: { backgroundColor: '#fffdf7', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', padding: 10, gap: 4 },
  cardPlaced: { borderColor: '#1f6b3a', backgroundColor: '#f1f8ef' },
  cardWrong: { borderColor: '#c47a3a', backgroundColor: '#fbefe2' },
  arabic: { fontFamily: fonts.quran, fontSize: 24, lineHeight: 46, color: colors.ink, textAlign: 'right', writingDirection: 'rtl' },
  translation: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.inkSoft },
  cardMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  chip: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.18)', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fffdf7' },
  chipPicked: { borderColor: '#c47a3a', backgroundColor: '#fbefe2' },
  chipDone: { borderColor: '#1f6b3a', backgroundColor: '#f1f8ef' },
  chipText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
});
