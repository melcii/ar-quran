// The controls laid over the 3D world. They sit around the edges and never
// draw over the Arabic on the pages. Every label says what kind of text it is:
// the Quran, a translation, or the app's own explanation.
import { router } from 'expo-router';
import { useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Passage } from '@/components/Ayah';
import { Button, Chip, ContentLabel, IconButton, Row } from '@/components/ui';
import { catalogFor, outlinesForSurah, type StoryOutline } from '@/content/outlines';
import { designFor, stagesFor } from '@/content/designs';
import { formatRef, getSurah, getVerse, parseRef, searchQuran, surahs } from '@/content/quran';
import { emptySurahProgress, useAppState, type Settings } from '@/state/AppState';
import { sound } from '@/three/sound';
import { colors, fonts, radius } from '@/theme';
import { worldFor } from './settings';
import { passagesOf, type Move, type Passage as PassageT } from './SurahWorld';

const glass = 'rgba(24, 18, 12, 0.6)';
const cream = '#f3e3c2';

export function Pill({ children }: { children: ReactNode }) {
  return <View style={s.pill}>{children}</View>;
}

/** Corner buttons shown everywhere: library, journal, quiet mode, settings. */
export function TopBar({ onLibrary, onJournal, onSettings, onRoom }: { onLibrary?: () => void; onJournal: () => void; onSettings: () => void; onRoom?: () => void }) {
  const app = useAppState();
  const quiet = app.settings.quietMode;
  return (
    <View style={s.topBar} pointerEvents="box-none">
      <Row style={{ gap: 6 }}>
        {onRoom && (
          <Pill>
            <IconButton icon="book" label="Back to the reading room" onPress={onRoom} color={cream} size={40} />
          </Pill>
        )}
        {onLibrary && (
          <Pill>
            <IconButton icon="stories" label="Library of all 114 surahs" onPress={onLibrary} color={cream} size={40} />
          </Pill>
        )}
      </Row>
      <Row style={{ gap: 6 }}>
        <Pill>
          <IconButton icon="journey" label="Journal: bookmarks and progress" onPress={onJournal} color={cream} size={40} />
        </Pill>
        <Pill>
          <IconButton
            icon={quiet ? 'still' : 'speaker'}
            label={quiet ? 'Sounds are off. Turn on ambience and effects' : 'Quiet mode: turn off ambience and effects'}
            onPress={() => {
              sound.start();
              app.updateSettings({ quietMode: !quiet });
            }}
            color={cream}
            size={40}
          />
        </Pill>
        <Pill>
          <IconButton icon="parents" label="Settings" onPress={onSettings} color={cream} size={40} />
        </Pill>
      </Row>
    </View>
  );
}

/* ------------------------------ Reading ------------------------------ */

export function ReadingHud({
  surah,
  firstAyah,
  lastAyah,
  spread,
  spreads,
  canForward,
  canBack,
  portrait,
  onForward,
  onBack,
  onJump,
  onSurah,
  onWorld,
}: {
  surah: number;
  firstAyah: number;
  lastAyah: number;
  spread: number;
  spreads: number;
  canForward: boolean;
  canBack: boolean;
  portrait: boolean;
  onForward: () => void;
  onBack: () => void;
  onJump: (ayah: number) => void;
  onSurah: (n: number) => void;
  onWorld: () => void;
}) {
  const app = useAppState();
  const info = getSurah(surah)!;
  const [jump, setJump] = useState('');
  const subs = app.settings.showTranslation;
  const setSubs = (v: boolean) => app.updateSettings({ showTranslation: v });
  const marked = app.isBookmarked(surah, firstAyah, lastAyah);
  const go = () => {
    const n = parseInt(jump, 10);
    if (n >= 1 && n <= info.ayahCount) onJump(n);
    setJump('');
  };
  const ayahs = useMemo(() => {
    const out = [];
    for (let a = firstAyah; a <= lastAyah; a++) {
      const v = getVerse(surah, a);
      if (v) out.push(v);
    }
    return out;
  }, [surah, firstAyah, lastAyah]);

  return (
    <>
      <View style={[s.readTitle, portrait && { top: 64 }]} pointerEvents="box-none">
        <View style={s.titleCard}>
          <Text style={s.titleArabic}>{info.nameArabic}</Text>
          <Text style={s.titleLatin}>
            {info.number}. {info.nameTransliterated} · {info.nameMeaning}
          </Text>
          <Text style={s.titleSub}>
            Ayahs {firstAyah}–{lastAyah} of {info.ayahCount} · spread {spread + 1} of {spreads}
          </Text>
        </View>
      </View>

      {subs && (
        <View style={[s.subs, portrait ? s.subsPortrait : s.subsLandscape]}>
          <Row style={{ justifyContent: 'space-between' }}>
            <ContentLabel kind="translation" extra="Saheeh International" />
            <IconButton icon="close" label="Hide translation" onPress={() => setSubs(false)} size={32} />
          </Row>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 6 }}>
            {ayahs.map((v) => (
              <Text key={v.ayah_number} style={s.subText}>
                <Text style={s.subNum}>{v.ayah_number}. </Text>
                {v.translation_text ?? 'Translation unavailable for this ayah.'}
              </Text>
            ))}
          </ScrollView>
          <Text style={s.subNote}>A translation conveys meaning; it is not the Quran. The Arabic is on the pages.</Text>
        </View>
      )}

      <View style={s.readBar} pointerEvents="box-none">
        <Row wrap style={s.readControls}>
          {/* Arabic order: the next page is to the left. */}
          <IconButton icon="previous" label="Next page (turns the left page)" onPress={onForward} disabled={!canForward} color={cream} size={46} />
          <View style={s.jump}>
            <TextInput
              value={jump}
              onChangeText={(t) => setJump(t.replace(/\D/g, ''))}
              onSubmitEditing={go}
              placeholder={`Ayah 1–${info.ayahCount}`}
              placeholderTextColor="#b9a888"
              keyboardType="number-pad"
              accessibilityLabel={`Go to ayah, 1 to ${info.ayahCount}`}
              style={s.jumpInput}
            />
            <IconButton icon="search" label="Go to ayah" onPress={go} color={cream} size={36} />
          </View>
          <IconButton icon="next" label="Previous page" onPress={onBack} disabled={!canBack} color={cream} size={46} />
        </Row>
        <Row wrap style={{ justifyContent: 'center', gap: 6 }}>
          <Button small kind="secondary" icon="previous" label="Surah" accessibilityLabel="Previous surah" disabled={surah <= 1} onPress={() => onSurah(surah - 1)} />
          <Button
            small
            kind="secondary"
            icon={marked ? 'bookmarked' : 'bookmark'}
            label={marked ? 'Bookmarked' : 'Bookmark'}
            accessibilityLabel={marked ? `Remove bookmark for ayahs ${firstAyah} to ${lastAyah}` : `Bookmark ayahs ${firstAyah} to ${lastAyah}`}
            onPress={() => app.toggleBookmark(surah, firstAyah, lastAyah)}
          />
          {!subs && <Button small kind="secondary" label="Translation" onPress={() => setSubs(true)} />}
          <TextSize />
          <Button small icon="journey" label="Walk this surah's world" onPress={onWorld} />
          <Button small kind="secondary" icon="next" label="Surah" accessibilityLabel="Next surah" disabled={surah >= 114} onPress={() => onSurah(surah + 1)} />
        </Row>
      </View>
    </>
  );
}

function TextSize() {
  const app = useAppState();
  const order: Settings['pageTextSize'][] = ['small', 'medium', 'large'];
  const i = order.indexOf(app.settings.pageTextSize);
  return (
    <View style={s.sizeBox} accessibilityLabel="Arabic text size on the pages">
      <IconButton icon="minus" label="Smaller Arabic text" disabled={i === 0} onPress={() => app.updateSettings({ pageTextSize: order[i - 1] })} size={34} />
      <Text style={s.sizeLabel}>Aa</Text>
      <IconButton icon="plus" label="Larger Arabic text" disabled={i === 2} onPress={() => app.updateSettings({ pageTextSize: order[i + 1] })} size={34} />
    </View>
  );
}

/* ------------------------------ Library ------------------------------ */

export function LibraryHud({ selected, portrait, onSelect, onRead, onWorld }: { selected: number | null; portrait: boolean; onSelect: (n: number) => void; onRead: (n: number) => void; onWorld: (n: number) => void }) {
  const app = useAppState();
  const [q, setQ] = useState('');
  const results = useMemo(() => (q.trim() ? searchQuran(q).slice(0, 8) : []), [q]);
  const info = selected ? getSurah(selected) : null;
  const prog = selected ? app.surahProgress[selected] ?? emptySurahProgress : null;
  const world = selected ? worldFor(selected) : null;
  return (
    <>
      <View style={[s.search, portrait ? { top: 64, left: 12, right: 12 } : { top: 12, left: '50%', width: 360, marginLeft: -180 }]}>
        <Row style={{ gap: 4 }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Find a surah: number or name"
            placeholderTextColor="#b9a888"
            accessibilityLabel="Find a surah by number or name"
            style={s.searchInput}
          />
          {!!q && <IconButton icon="close" label="Clear search" onPress={() => setQ('')} color={cream} size={34} />}
        </Row>
        {results.length > 0 && (
          <Row wrap style={{ gap: 6, paddingTop: 6 }}>
            {results.map((r) => (
              <Chip
                key={r.surah.number}
                label={`${r.surah.number}. ${r.surah.nameTransliterated}`}
                onPress={() => {
                  onSelect(r.surah.number);
                  setQ('');
                }}
              />
            ))}
          </Row>
        )}
      </View>
      {!info && (
        <View style={s.bottomHint} pointerEvents="none">
          <Text style={s.hint}>Drag to look around the hall. Tap a book to take it from the shelf.</Text>
          <Text style={s.hintSmall}>The 114 surahs stand in order, from Al-Fatihah by the doorway around to An-Nas.</Text>
        </View>
      )}
      {info && prog && world && (
        <View style={[s.plaque, portrait ? s.plaquePortrait : s.plaqueLandscape]}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.plaqueArabic}>{info.nameArabic}</Text>
              <Text style={s.plaqueTitle}>
                {info.number}. {info.nameTransliterated}
              </Text>
              <Text style={s.plaqueSub}>
                {info.nameMeaning} · {info.revelation} · {info.ayahCount} ayahs
              </Text>
            </View>
            <IconButton icon="close" label="Put the book back" onPress={() => onSelect(0)} size={34} />
          </Row>
          <Text style={s.plaqueProg}>
            {prog.furthestAyah ? `Read up to ayah ${prog.furthestAyah}` : 'Not opened yet'}
            {prog.visitedWorld ? ` · ${(prog.areasFound ?? []).length} places found in its world${prog.reflected ? ' · reflection done' : ''}` : ''}
          </Text>
          {designFor(info.number) && <DesignStatus surah={info.number} />}
          {catalogFor(info.number) && (
            <Text style={s.plaqueSub}>
              <Text style={{ fontFamily: fonts.bodyBold }}>Themes (draft): </Text>
              {catalogFor(info.number)!.themes}
            </Text>
          )}
          {outlinesForSurah(info.number).length > 0 && (
            <Text style={s.plaqueSub}>
              <Text style={{ fontFamily: fonts.bodyBold }}>Stories in its world: </Text>
              {outlinesForSurah(info.number).map((o) => o.title).join(' · ')}
            </Text>
          )}
          <View style={s.basis}>
            <ContentLabel kind="art" extra="its world" />
            <Text style={s.basisText}>{world.basis}</Text>
          </View>
          <Row wrap style={{ gap: 6 }}>
            <Button small icon="book" label={prog.furthestAyah ? 'Continue reading' : 'Read'} onPress={() => onRead(info.number)} />
            <Button small kind="secondary" icon="journey" label="Walk its world" onPress={() => onWorld(info.number)} />
          </Row>
        </View>
      )}
    </>
  );
}

const STAGE_MARK = { done: '✓', draft: '◐', todo: '○' } as const;

/** The surah's planned world and an honest view of how far it has got. */
function DesignStatus({ surah }: { surah: number }) {
  const d = designFor(surah)!;
  const stages = stagesFor(d);
  const built = stages[3].state === 'done';
  return (
    <View style={{ gap: 4 }}>
      <Text style={s.plaqueSub}>
        <Text style={{ fontFamily: fonts.bodyBold }}>Planned world (design draft): </Text>
        {d.world_title}
      </Text>
      <Row wrap style={{ gap: 6 }}>
        {stages.map((st) => (
          <Text
            key={st.label}
            accessibilityLabel={`${st.label}: ${st.detail}`}
            style={[s.stage, st.state === 'done' ? s.stageDone : st.state === 'draft' ? s.stageDraft : null]}
          >
            {STAGE_MARK[st.state]} {st.label}
          </Text>
        ))}
      </Row>
      {!built && <Text style={s.plaqueNote}>Its own world is not built yet. Walking it opens a shared setting for now.</Text>}
    </View>
  );
}

/* ------------------------------- World ------------------------------- */

export function WorldHud({
  surah,
  passages,
  found,
  near,
  open,
  hint,
  portrait,
  move,
  onOpen,
  onClose,
  onRead,
  onReadRef,
  activitiesDone,
  reflected,
  onActivity,
  onReflected,
}: {
  surah: number;
  passages: PassageT[];
  found: number[];
  near: PassageT | null;
  open: PassageT | null;
  hint: string;
  portrait: boolean;
  move: MutableRefObject<Move>;
  onOpen: (p: PassageT) => void;
  onClose: () => void;
  onRead: (ayah: number) => void;
  onReadRef: (surah: number, ayah: number) => void;
  activitiesDone: number[];
  reflected: boolean;
  onActivity: (index: number) => void;
  onReflected: () => void;
}) {
  const info = getSurah(surah)!;
  const world = worldFor(surah);
  const design = designFor(surah);
  const [reflection, setReflection] = useState(false);
  const allFound = passages.length > 0 && found.length >= passages.length;
  const theme = catalogFor(surah);
  const stories = useMemo(() => outlinesForSurah(surah), [surah]);
  const [about, setAbout] = useState(false);
  const [story, setStory] = useState<StoryOutline | null>(null);
  return (
    <>
      <View style={[s.worldTitle, portrait && { top: 64 }]} pointerEvents="box-none">
        <Pressable accessibilityRole="button" accessibilityLabel="About this place" onPress={() => setAbout((a) => !a)} style={s.titleCard}>
          <Text style={s.titleLatin}>
            {info.number}. {info.nameTransliterated} · <Text style={s.inlineArabic}>{info.nameArabic}</Text>
          </Text>
          {design && <Text style={s.titleSub}>{design.world_title} · design draft</Text>}
          <Text style={s.titleSub}>
            {design
              ? `${found.length} of ${passages.length} places · ${activitiesDone.length} of ${design.activities.length} activities · tap for “about”`
              : `${found.length} of ${passages.length} lanterns found · tap for “about this place”`}
          </Text>
        </Pressable>
        {allFound && design && !open && !story && !about && (
          <Button small icon="journey" label={reflected ? 'The closing reflection' : 'All places found: closing reflection'} onPress={() => setReflection(true)} />
        )}
        {about && (
          <ScrollView style={s.about} contentContainerStyle={{ gap: 8 }}>
            {design && (
              <View style={{ gap: 4 }}>
                <ContentLabel kind="art" extra="planned world · design draft, unreviewed" />
                <Text style={s.sheetHeading}>{design.world_title}</Text>
                <Text style={s.basisText}>{design.concept}</Text>
                <Text style={s.small}>
                  Its own 3D world is not built yet: a shared setting stands in, and each lantern marks one of its planned places at the ayah it comes from.
                </Text>
                <ContentLabel kind="activity" extra="artistic adaptations" />
                {design.activities.map((a, i) => {
                  const ref = parseRef(a.reference);
                  const done = activitiesDone.includes(i);
                  return (
                    <View key={a.name} style={s.activity}>
                      <Text style={s.activityTitle}>
                        {done ? '✓ ' : ''}
                        {a.name} · {formatRef(a.reference)}
                      </Text>
                      <Text style={s.basisText}>{a.description}</Text>
                      <Row wrap style={{ gap: 6 }}>
                        {ref && <Button small kind="secondary" icon="book" label={`Read ${formatRef(a.reference)}`} onPress={() => onReadRef(ref.surah, ref.from)} />}
                        {!done && <Button small kind="secondary" label="I did this" accessibilityLabel={`Mark done: ${a.name}`} onPress={() => onActivity(i)} />}
                      </Row>
                    </View>
                  );
                })}
                <Text style={s.small}>These are activity cards for now. Their playable versions are not built yet.</Text>
              </View>
            )}
            <ContentLabel kind="art" extra="a symbolic setting, not a scene of events" />
            <Text style={s.basisText}>{world.basis}</Text>
            {theme && (
              <View style={{ gap: 4 }}>
                <ContentLabel kind="explanation" extra="themes of this surah · draft summary" />
                <Text style={s.basisText}>{theme.themes}</Text>
              </View>
            )}
            <Text style={s.small}>
              {design
                ? 'Each lantern stands for a planned place and opens the ayah it comes from, in the order of the surah.'
                : 'Each lantern holds the next passage of the surah, in order.'}{' '}
              The landscape is an artistic setting chosen by the app; it is not part of the Quran and has not yet been reviewed by scholars.
            </Text>
          </ScrollView>
        )}
        {stories.length > 0 && !open && !story && (
          <Row wrap style={{ gap: 6, justifyContent: 'center' }}>
            {stories.map((st) => (
              <Button key={st.id} small kind="secondary" icon="stories" label={st.title} accessibilityLabel={`Read the story: ${st.title}`} onPress={() => setStory(st)} />
            ))}
          </Row>
        )}
      </View>

      {!!hint && !open && (
        <View style={s.hintBox} pointerEvents="none">
          <Text style={s.hint}>{hint}</Text>
        </View>
      )}

      {near && !open && (
        <View style={s.nearBox} pointerEvents="box-none">
          <Button
            label={
              near.area
                ? `${found.includes(near.index) ? 'Visit again' : 'Visit'}: ${near.area.name} (${surah}:${near.from}${near.to > near.from ? `–${near.to}` : ''})`
                : found.includes(near.index)
                  ? `Open again: ayahs ${near.from}–${near.to}`
                  : `Open the lantern: ayahs ${near.from}–${near.to}`
            }
            icon="quran"
            onPress={() => onOpen(near)}
          />
        </View>
      )}

      {!open && !story && !reflection && <Joystick move={move} />}

      {reflection && design && !open && (
        <View style={[s.passage, portrait ? s.passagePortrait : s.passageLandscape]} accessibilityLabel="Closing reflection">
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.passageTitle}>Closing reflection</Text>
              <ContentLabel kind="explanation" extra="draft summary, not the Quran · unreviewed" />
            </View>
            <IconButton icon="close" label="Close the reflection" onPress={() => { setReflection(false); onReflected(); }} size={36} />
          </Row>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 10 }}>
            <Text style={s.storyText}>{design.summary}</Text>
            <Text style={s.sheetHeading}>Think about</Text>
            {design.objectives.map((o) => (
              <Text key={o} style={s.basisText}>• {o}</Text>
            ))}
          </ScrollView>
          <Row wrap style={{ gap: 6 }}>
            <Button small icon="book" label="Read the whole surah" onPress={() => { onReflected(); onRead(1); }} />
            <Button small kind="secondary" label="Keep walking" onPress={() => { setReflection(false); onReflected(); }} />
          </Row>
        </View>
      )}

      {story && !open && <StoryCard story={story} portrait={portrait} onClose={() => setStory(null)} onReadRef={onReadRef} />}

      {open && (
        <View style={[s.passage, portrait ? s.passagePortrait : s.passageLandscape]}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <Text style={s.passageTitle}>
                {info.nameTransliterated} {surah}:{open.from}
                {open.to > open.from ? `–${open.to}` : ''}
              </Text>
              <Text style={s.small}>
                {open.area ? `Place ${open.index + 1} of ${passages.length}: ${open.area.name}` : `Lantern ${open.index + 1} of ${passages.length}`}
              </Text>
            </View>
            <IconButton icon="close" label="Close the passage" onPress={onClose} size={36} />
          </Row>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 10 }}>
            {open.area && (
              <View style={s.basis}>
                <ContentLabel kind="art" extra="planned place · not a scene from the Quran" />
                <Text style={s.basisText}>{open.area.description}</Text>
              </View>
            )}
            <Passage refs={[open.to > open.from ? `${surah}:${open.from}-${open.to}` : `${surah}:${open.from}`]} showHeader={false} />
          </ScrollView>
          <Row wrap style={{ gap: 6 }}>
            <Button small icon="book" label="Read it in the book" onPress={() => onRead(open.from)} />
            <Button small kind="secondary" label="Keep walking" onPress={onClose} />
          </Row>
        </View>
      )}
    </>
  );
}

/** A story outline: the storyteller's narration, clearly labelled, with the
 * featured ayahs shown from the verified dataset and links into the book. */
function StoryCard({ story, portrait, onClose, onReadRef }: { story: StoryOutline; portrait: boolean; onClose: () => void; onReadRef: (surah: number, ayah: number) => void }) {
  return (
    <View style={[s.passage, portrait ? s.passagePortrait : s.passageLandscape]} accessibilityLabel={`Story: ${story.title}`}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={s.passageTitle}>{story.title}</Text>
          <ContentLabel kind="explanation" extra="story narration, not the Quran" />
        </View>
        <IconButton icon="close" label="Close the story" onPress={onClose} size={36} />
      </Row>
      <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 10 }}>
        {story.narration.map((para, i) => (
          <Text key={i} style={s.storyText}>
            {para}
          </Text>
        ))}
        {story.featured_ayahs.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={s.sheetHeading}>In the Quran</Text>
            <Passage refs={story.featured_ayahs} showHeader={false} />
          </View>
        )}
        <View style={s.basis}>
          <ContentLabel kind="activity" extra="what we can learn" />
          <Text style={s.basisText}>{story.lessons}</Text>
        </View>
        <Text style={s.sheetHeading}>Read the whole account</Text>
        <Row wrap style={{ gap: 6 }}>
          {story.quran_references.map((r) => {
            const p = parseRef(r);
            return p ? <Button key={r} small kind="secondary" icon="book" label={formatRef(r)} accessibilityLabel={`Open ${formatRef(r)} in the book`} onPress={() => onReadRef(p.surah, p.from)} /> : null;
          })}
        </Row>
        <Text style={s.small}>
          This is a draft retelling for children. It has not yet been reviewed by a scholar. The Quran's own words are only the passages shown from
          the Quran above and in the book.
        </Text>
      </ScrollView>
    </View>
  );
}

/** An on-screen stick for touch: push to walk, push to the edge to hurry. */
function Joystick({ move }: { move: MutableRefObject<Move> }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const R = 46;
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const d = Math.hypot(g.dx, g.dy);
        const k = d > R ? R / d : 1;
        const x = g.dx * k;
        const y = g.dy * k;
        setKnob({ x, y });
        move.current = { x: x / R, y: -y / R, run: d > R * 1.6 };
      },
      onPanResponderRelease: () => {
        setKnob({ x: 0, y: 0 });
        move.current = { x: 0, y: 0, run: false };
      },
      onPanResponderTerminate: () => {
        setKnob({ x: 0, y: 0 });
        move.current = { x: 0, y: 0, run: false };
      },
    }),
  ).current;
  return (
    <View style={s.stickWrap} pointerEvents="box-none">
      <View style={s.stick} {...responder.panHandlers} accessibilityLabel="Walking stick. Keyboard: W A S D or the arrow keys; Shift to hurry.">
        <View style={[s.knob, { transform: [{ translateX: knob.x }, { translateY: knob.y }] }]} />
      </View>
      <Text style={s.stickHint}>Walk · drag the view to look</Text>
    </View>
  );
}

/* ------------------------------ Journal ------------------------------ */

export function JournalPanel({ onClose, onRead, onWorld }: { onClose: () => void; onRead: (surah: number, ayah: number) => void; onWorld: (surah: number) => void }) {
  const app = useAppState();
  const entries = Object.entries(app.surahProgress)
    .map(([n, p]) => ({ n: +n, p }))
    .sort((a, b) => b.p.at - a.p.at);
  const worlds = entries.filter((e) => e.p.visitedWorld).length;
  const lanterns = entries.reduce((t, e) => t + (e.p.areasFound ?? []).length, 0);
  const opened = entries.filter((e) => e.p.furthestAyah > 0).length;
  return (
    <Sheet title="Journal" onClose={onClose}>
      <Text style={s.small}>
        Surahs opened: {opened} of 114 · worlds visited: {worlds} of 114 · places found: {lanterns}
      </Text>
      {!app.settings.recordProgress && <Text style={s.small}>Progress recording is off in the grown-ups settings.</Text>}
      <Text style={s.sheetHeading}>Bookmarks</Text>
      {app.bookmarks.length === 0 && <Text style={s.small}>Bookmark a spread in the reading room and it appears here.</Text>}
      {app.bookmarks.map((b) => (
        <Pressable key={`${b.surah}:${b.from}:${b.to}`} accessibilityRole="button" onPress={() => onRead(b.surah, b.from)} style={s.row}>
          <Text style={s.rowTitle}>
            {getSurah(b.surah)?.nameTransliterated} {b.surah}:{b.from}
            {b.to > b.from ? `–${b.to}` : ''}
          </Text>
          <Text style={s.rowAction}>Open</Text>
        </Pressable>
      ))}
      <Text style={s.sheetHeading}>Your surahs</Text>
      {entries.length === 0 && <Text style={s.small}>Open any surah in the library to begin.</Text>}
      {entries.map(({ n, p }) => {
        const info = getSurah(n)!;
        const total = passagesOf(n).length;
        return (
          <View key={n} style={s.row}>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.rowTitle}>
                {n}. {info.nameTransliterated} <Text style={s.rowArabic}>{info.nameArabic}</Text>
              </Text>
              <Text style={s.small}>
                {p.furthestAyah ? `Read to ayah ${p.furthestAyah} of ${info.ayahCount}` : 'Not read yet'}
                {p.visitedWorld ? ` · places ${(p.areasFound ?? []).length} of ${total} · activities ${(p.activitiesDone ?? []).length}${p.reflected ? ' · reflected' : ''}` : ''}
              </Text>
            </View>
            <Row style={{ gap: 4 }}>
              <Button small kind="secondary" label="Read" onPress={() => onRead(n, p.lastAyah || 1)} />
              <Button small kind="secondary" label="World" onPress={() => onWorld(n)} />
            </Row>
          </View>
        );
      })}
      <Text style={s.small}>Vocabulary cards will come once a verified word-by-word source is added; none are generated by the app.</Text>
    </Sheet>
  );
}

/* ------------------------------ Settings ----------------------------- */

export function SettingsPanel({ onClose, surah, ayah }: { onClose: () => void; surah: number; ayah: number }) {
  const app = useAppState();
  const st = app.settings;
  const set = (p: Partial<Settings>) => app.updateSettings(p);
  return (
    <Sheet title="Settings" onClose={onClose}>
      <Choice label="Ambience (wind, sea, rooms)" value={st.ambienceVolume} options={[[0, 'Off'], [0.3, 'Soft'], [0.6, 'Medium'], [1, 'Full']]} onChange={(v) => set({ ambienceVolume: v })} />
      <Choice label="Effects (page turns, doorways)" value={st.effectsVolume} options={[[0, 'Off'], [0.4, 'Soft'], [0.7, 'Medium'], [1, 'Full']]} onChange={(v) => set({ effectsVolume: v })} />
      <Choice label="Quiet mode" value={st.quietMode} options={[[false, 'Off'], [true, 'On']]} onChange={(v) => set({ quietMode: v })} />
      <Text style={s.small}>There is no background music. Recitation is off until a licensed recording is added.</Text>
      <Choice label="Reduced motion" value={st.reducedMotion} options={[[false, 'Off'], [true, 'On']]} onChange={(v) => set({ reducedMotion: v })} />
      {app.systemReducedMotion && <Text style={s.small}>Your device asks for reduced motion, so camera moves are already short.</Text>}
      <Choice label="Graphics quality" value={st.quality} options={[['auto', 'Auto'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]} onChange={(v) => set({ quality: v })} />
      <Choice label="Arabic size on the pages" value={st.pageTextSize} options={[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]} onChange={(v) => set({ pageTextSize: v })} />
      <Choice label="Translation under the pages" value={st.showTranslation} options={[[true, 'Shown'], [false, 'Hidden']]} onChange={(v) => set({ showTranslation: v })} />
      <Text style={s.sheetHeading}>More</Text>
      <Row wrap style={{ gap: 6 }}>
        <Button small kind="secondary" label="Text view for screen readers" onPress={() => router.push(`/surah/${surah}?ayah=${ayah}`)} />
        <Button small kind="secondary" icon="parents" label="Grown-ups, sources and privacy" onPress={() => router.push('/parents')} />
      </Row>
    </Sheet>
  );
}

function Choice<T extends string | number | boolean>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.choiceLabel}>{label}</Text>
      <Row wrap style={{ gap: 6 }}>
        {options.map(([v, l]) => (
          <Chip key={String(v)} label={l} selected={v === value} onPress={() => onChange(v)} />
        ))}
      </Row>
    </View>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <View style={s.sheetBackdrop}>
      <View style={s.sheet} accessibilityRole="none" accessibilityLabel={title}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={s.sheetTitle}>{title}</Text>
          <IconButton icon="close" label={`Close ${title.toLowerCase()}`} onPress={onClose} />
        </Row>
        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>{children}</ScrollView>
      </View>
    </View>
  );
}

/** Surahs for the "begin" choice on the title screen. */
export const surahCount = surahs.length;

const s = StyleSheet.create({
  pill: { backgroundColor: glass, borderRadius: 999 },
  topBar: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  readTitle: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
  worldTitle: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center', gap: 8 },
  titleCard: { backgroundColor: glass, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 6, alignItems: 'center', maxWidth: 440 },
  titleArabic: { fontFamily: fonts.quran, fontSize: 24, color: cream, lineHeight: 40 },
  titleLatin: { fontFamily: fonts.bodyBold, fontSize: 14, color: cream, textAlign: 'center' },
  inlineArabic: { fontFamily: fonts.quran, fontSize: 15, writingDirection: 'rtl' },
  titleSub: { fontFamily: fonts.body, fontSize: 12, color: '#d8c6a6', textAlign: 'center' },
  subs: { position: 'absolute', backgroundColor: 'rgba(250, 245, 233, 0.95)', borderRadius: radius.md, padding: 12, gap: 6 },
  subsLandscape: { right: 16, top: 70, width: 300, bottom: 150 },
  subsPortrait: { left: 10, right: 10, bottom: 150, height: '24%' },
  subText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkSoft },
  subNum: { fontFamily: fonts.bodyBold, color: colors.ink },
  subNote: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  readBar: { position: 'absolute', left: 8, right: 8, bottom: 14, alignItems: 'center', gap: 8 },
  readControls: { backgroundColor: glass, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 4, gap: 8, alignItems: 'center', justifyContent: 'center' },
  jump: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingLeft: 12 },
  jumpInput: { width: 104, color: cream, fontFamily: fonts.body, fontSize: 15, paddingVertical: 6, outlineStyle: 'none' } as never,
  sizeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 999, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 2 },
  sizeLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink, paddingHorizontal: 2 },
  search: { position: 'absolute', backgroundColor: glass, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  searchInput: { flex: 1, color: cream, fontFamily: fonts.body, fontSize: 15, paddingVertical: 6, outlineStyle: 'none' } as never,
  bottomHint: { position: 'absolute', left: 16, right: 16, bottom: 24, alignItems: 'center', gap: 4 },
  hint: { fontFamily: fonts.body, fontSize: 15, color: '#f6ead2', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 },
  hintSmall: { fontFamily: fonts.body, fontSize: 13, color: '#e0cfb0', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 },
  plaque: { position: 'absolute', backgroundColor: 'rgba(250, 245, 233, 0.96)', borderRadius: radius.lg, padding: 14, gap: 8, borderWidth: 1, borderColor: '#d9c9a3' },
  plaquePortrait: { left: 10, right: 10, bottom: 10 },
  plaqueLandscape: { left: 16, bottom: 16, width: 380 },
  plaqueArabic: { fontFamily: fonts.quran, fontSize: 28, color: colors.ink, lineHeight: 46 },
  plaqueTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  plaqueSub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  plaqueNote: { fontFamily: fonts.body, fontSize: 12, fontStyle: 'italic', color: colors.inkSoft },
  activity: { gap: 4, paddingVertical: 6, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)' },
  activityTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  stage: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  stageDone: { color: '#1f6b3a', borderColor: '#1f6b3a', fontFamily: fonts.bodyBold },
  stageDraft: { color: '#8a5a12', borderColor: '#c9a46a' },
  storyText: { fontFamily: fonts.body, fontSize: 17, lineHeight: 26, color: colors.ink },
  plaqueProg: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.skyDeep },
  basis: { gap: 4, backgroundColor: '#f3ead6', borderRadius: radius.sm, padding: 8 },
  basisText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  about: { backgroundColor: 'rgba(250, 245, 233, 0.96)', borderRadius: radius.md, padding: 12, maxWidth: 440, maxHeight: 440, marginHorizontal: 12 },
  hintBox: { position: 'absolute', top: '42%', left: 20, right: 20, alignItems: 'center' },
  nearBox: { position: 'absolute', bottom: 150, left: 16, right: 16, alignItems: 'center' },
  stickWrap: { position: 'absolute', left: 22, bottom: 22, alignItems: 'center', gap: 6 },
  stick: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(24,18,12,0.35)', borderWidth: 2, borderColor: 'rgba(243,227,194,0.5)', alignItems: 'center', justifyContent: 'center', touchAction: 'none' } as never,
  knob: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(243,227,194,0.85)' },
  stickHint: { fontFamily: fonts.body, fontSize: 12, color: '#f0e2c6', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  passage: { position: 'absolute', backgroundColor: 'rgba(250, 245, 233, 0.98)', borderRadius: radius.lg, padding: 14, gap: 10 },
  passagePortrait: { left: 8, right: 8, bottom: 8, top: '30%' },
  passageLandscape: { right: 16, top: 64, bottom: 16, width: 520, maxWidth: '62%' },
  passageTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  sheetBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,8,6,0.45)', alignItems: 'center', justifyContent: 'center', padding: 12 },
  sheet: { backgroundColor: colors.paper, borderRadius: radius.lg, padding: 16, width: '100%', maxWidth: 560, maxHeight: '92%', gap: 8 },
  sheetTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  sheetHeading: { fontFamily: fonts.display, fontSize: 19, color: colors.ink, marginTop: 6 },
  choiceLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  rowArabic: { fontFamily: fonts.quran, fontSize: 16 },
  rowAction: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.skyDeep },
});
