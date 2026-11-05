// Listening choices, saved with the explorer's profile: what plays by itself,
// the story narrator, the Quran reciter, the narration language, and a
// separate volume for each kind of sound. There is no music.
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, Row } from '@/components/ui';
import { useAppState, type ListenMode, type Settings } from '@/state/AppState';
import { RATES, activeReciter } from '@/state/Recitation';
import { colors, fonts } from '@/theme';
import { CATALOG, usableNarrators } from './catalog';
import { director } from './director';

const MODES: [ListenMode, string][] = [
  ['both', 'Story, then Quran'],
  ['narration', 'Story voice only'],
  ['recitation', 'Quran recitation only'],
  ['quiet', 'Quiet'],
];
const VOL: [number, string][] = [
  [0, 'Off'],
  [0.4, 'Soft'],
  [0.7, 'Medium'],
  [1, 'Full'],
];

function Choice<T extends string | number | boolean>({ label, value, options, onChange, dark }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void; dark?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[s.label, dark && { color: '#f3e3c2' }]}>{label}</Text>
      <Row wrap style={{ gap: 6 }}>
        {options.map(([v, l]) => (
          <Chip key={String(v)} label={l} selected={v === value} onPress={() => onChange(v)} />
        ))}
      </Row>
    </View>
  );
}

/** The listening section; `dark` for the dark 3D sheets. */
export function ListeningSettings({ dark }: { dark?: boolean }) {
  const app = useAppState();
  const st = app.settings;
  const set = (p: Partial<Settings>) => app.updateSettings(p);
  const narrators = usableNarrators(st.narrationLanguage);
  const reciter = activeReciter(st.reciter);
  const note = [s.note, dark && { color: '#d8c6a6' }];
  const near = (v: number) => VOL.reduce((a, b) => (Math.abs(b[0] - v) < Math.abs(a[0] - v) ? b : a))[0];
  return (
    <View style={{ gap: 12 }}>
      <Choice dark={dark} label="What plays by itself" value={st.listenMode} options={MODES} onChange={(v) => set({ listenMode: v })} />
      <Text style={note}>Story narration and Quran recitation never play at the same time. The narrator&apos;s words are written for this game and are never Quran text.</Text>
      <Choice
        dark={dark}
        label="Story narrator"
        value={st.narrator}
        options={narrators.map((n) => [n.id, n.name] as [string, string])}
        onChange={(v) => set({ narrator: v })}
      />
      <Text style={note}>
        {CATALOG.narrators.find((n) => n.id === st.narrator)?.note ?? ''} A recorded child narrator appears here once licensed recordings are added.
      </Text>
      <Pressable accessibilityRole="button" onPress={() => director.readNow('Hello! I will tell you the story as we explore. Shall we begin?', true)} style={s.try}>
        <Text style={s.tryText}>Hear the narrator</Text>
      </Pressable>
      <Choice
        dark={dark}
        label="Narration language"
        value={st.narrationLanguage}
        options={CATALOG.languages.filter((l) => l.narration).map((l) => [l.id, l.name] as [string, string])}
        onChange={(v) => set({ narrationLanguage: v })}
      />
      <Text style={note}>Turkish and Arabic narration are planned; their lines are not written or recorded yet. The Quran itself is always in Arabic.</Text>
      <Text style={[s.label, dark && { color: '#f3e3c2' }]}>Quran reciter</Text>
      <Text style={note}>
        {reciter
          ? `${reciter.name} (${reciter.reading}).`
          : 'No reciter can play yet: recitation plays only from a licensed recording by an identified reciter that a specialist has checked against the text. Until then the Arabic is shown without playback. A child reciter will be offered once such recordings exist.'}
      </Text>
      {reciter && <Choice dark={dark} label="Recitation speed" value={st.recitationRate} options={RATES.map((r) => [r, r === 1 ? 'Normal' : `${r}×`] as [number, string])} onChange={(v) => set({ recitationRate: v })} />}
      <Text style={[s.label, dark && { color: '#f3e3c2' }, { marginTop: 4 }]}>Volumes</Text>
      <Choice dark={dark} label="Quran recitation" value={near(st.volume)} options={VOL} onChange={(v) => set({ volume: v })} />
      <Choice dark={dark} label="Story narration" value={near(st.narrationVolume)} options={VOL} onChange={(v) => set({ narrationVolume: v, narrationVoice: v > 0 })} />
      <Choice dark={dark} label="Instructions (hints in play)" value={near(st.instructionVolume)} options={VOL} onChange={(v) => set({ instructionVolume: v })} />
      <Choice dark={dark} label="Sound effects and ambience" value={near(st.effectsVolume)} options={VOL} onChange={(v) => set({ effectsVolume: v, ambienceVolume: v * 0.85 })} />
      <Text style={note}>There is no background music.</Text>
    </View>
  );
}

/** A small overlay with the listening settings, for inside the worlds. */
export function ListeningSheet({ onClose }: { onClose: () => void }) {
  return (
    <View style={s.sheetWrap}>
      <View style={s.sheet}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={s.title}>Voices and sound</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={s.close}>
            <Text style={s.tryText}>Done</Text>
          </Pressable>
        </Row>
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingBottom: 8 }}>
          <ListeningSettings />
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  note: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.inkSoft },
  try: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  tryText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.skyDeep },
  sheetWrap: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', padding: 12 } as never,
  sheet: { width: '100%', maxWidth: 520, backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 10 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  close: { paddingVertical: 6, paddingHorizontal: 12 },
});
