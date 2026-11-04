// The game home: a welcome, the main options at the bottom and a small corner
// menu. Only options that work are shown; My Home and Friends appear once
// they are built (Friends also needs accounts).
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { brand } from '@/brand';
import { Icon, type IconName } from '@/components/Icon';
import { getSurah } from '@/content/quran';
import { useActiveProfile } from '@/profile/store';
import { useAppState } from '@/state/AppState';
import { sound } from '@/three/sound';
import { fonts } from '@/theme';
import { FIRST, lastAdventure } from './adventures';

const cream = '#f3e3c2';
const glass = 'rgba(24,17,11,0.62)';
const SEEN = 'quran-adventure.home-seen.v1';

/** Whether this explorer has been home before (read once per visit). */
function useReturning() {
  const [returning] = useState(() => {
    try {
      const s = globalThis.localStorage;
      const was = !!s?.getItem(SEEN);
      s?.setItem(SEEN, '1');
      return was;
    } catch {
      return false;
    }
  });
  return returning;
}

function Option({ icon, title, detail, onPress, main, portrait, label }: { icon: IconName; title: string; detail: string; onPress: () => void; main?: boolean; portrait: boolean; label?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? `${title}. ${detail}`}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [s.opt, portrait ? s.optPortrait : s.optWide, main && s.optMain, (pressed || hovered) && s.optOn]}
    >
      <View style={[s.optIcon, main && s.optIconMain]}>
        <Icon name={icon} size={22} color={main ? '#2a1c10' : cream} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={s.optTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={s.optDetail} numberOfLines={portrait ? 1 : 2}>
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}

export function HomeHud({ portrait, onLibrary, onReadOn, onJournal, onSettings }: { portrait: boolean; onLibrary: () => void; onReadOn: () => void; onJournal: () => void; onSettings: () => void }) {
  const app = useAppState();
  const me = useActiveProfile();
  const returning = useReturning();
  const [last, setLast] = useState(lastAdventure);
  // Coming back from a world: show where the explorer is now.
  useFocusEffect(useCallback(() => setLast(lastAdventure()), []));
  const reading = app.recentReading[0];
  const rs = reading ? getSurah(reading.surah) : null;

  return (
    <>
      <View style={[s.welcome, { top: portrait ? 70 : 22 }]} pointerEvents="none">
        {returning ? (
          <>
            <Text style={s.small}>{brand.name}</Text>
            <Text style={s.title}>Welcome back, {me.nickname}</Text>
          </>
        ) : (
          <>
            <Text style={s.title}>{brand.name}</Text>
            <Text style={s.tagline}>The whole Quran, 114 surahs, in one quiet world</Text>
          </>
        )}
      </View>

      <View style={[s.bottom, portrait && { bottom: 18 }]} pointerEvents="box-none">
        <View style={[s.opts, portrait && s.optsPortrait]}>
          {last ? (
            <Option main portrait={portrait} icon="compass" title="Continue Adventure" detail={`${last.title} · ${last.detail}`} onPress={() => router.push(last.href as never)} />
          ) : (
            <Option main portrait={portrait} icon="compass" title="Start Exploring" detail={`Begin in the world of ${FIRST.title}`} onPress={() => router.push(FIRST.href as never)} />
          )}
          <Option portrait={portrait} icon="stories" title="Explore the Quran" detail="The library of all 114 surahs, their stories and worlds" onPress={onLibrary} />
          <Option portrait={portrait} icon="person" title="My Explorer" detail={`${me.nickname}: change your look and clothes`} onPress={() => router.push('/dressing' as never)} />
        </View>
        <Pressable onPress={onReadOn} accessibilityRole="button" style={s.readOn}>
          <Text style={s.readOnText}>
            {reading && rs ? `Continue reading ${rs.nameTransliterated} ${reading.surah}:${reading.ayah}` : 'Or tap the Quran on its rehal to read'}
          </Text>
        </Pressable>
      </View>

      <CornerMenu onJournal={onJournal} onSettings={onSettings} />
    </>
  );
}

function CornerMenu({ onJournal, onSettings }: { onJournal: () => void; onSettings: () => void }) {
  const app = useAppState();
  const me = useActiveProfile();
  const quiet = app.settings.quietMode;
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const item = (icon: IconName, label: string, go: () => void) => (
    <Pressable
      key={label}
      onPress={() => {
        setOpen(false);
        go();
      }}
      accessibilityRole="button"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [s.item, (pressed || hovered) && s.itemOn]}
    >
      <Icon name={icon} size={18} color={cream} />
      <Text style={s.itemText}>{label}</Text>
    </Pressable>
  );
  return (
    <>
      <View style={s.corner} pointerEvents="box-none">
        <Pressable
          style={s.round}
          accessibilityRole="button"
          accessibilityLabel={quiet ? 'Sounds are off. Turn on ambience and effects' : 'Quiet mode: turn off ambience and effects'}
          onPress={() => {
            sound.start();
            app.updateSettings({ quietMode: !quiet });
          }}
        >
          <Icon name={quiet ? 'still' : 'speaker'} size={20} color={cream} />
        </Pressable>
        <Pressable style={[s.round, open && s.roundOn]} accessibilityRole="button" accessibilityLabel="Menu" accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)}>
          <Icon name={open ? 'close' : 'menu'} size={20} color={cream} />
        </Pressable>
      </View>
      {open && (
        <View style={s.menu}>
          {item('person', `Explorers: ${me.nickname} (switch or add)`, () => router.push('/dressing' as never))}
          {item('journey', 'My discovery journal', onJournal)}
          {item('motion', 'Settings', onSettings)}
          {item('parents', "Parents' corner", () => router.push('/parents' as never))}
          {item('quran', 'How to play', () => setHelp(true))}
        </View>
      )}
      {help && (
        <View style={s.help}>
          <Text style={s.helpTitle}>How to play</Text>
          <Text style={s.helpText}>
            Continue Adventure takes you back to the last world you explored, to the spot where you left it. Explore the Quran opens the library: pick a surah to read it, play its
            adventure or open its story chapters. Tap your explorer, or My Explorer, to change how they look. Drag to look around; in a world, walk with the arrow keys or the
            on-screen pad.
          </Text>
          <Pressable onPress={() => setHelp(false)} accessibilityRole="button" style={s.helpClose}>
            <Text style={s.readOnText}>Close</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  welcome: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 2 },
  title: { fontFamily: fonts.display, fontSize: 30, color: cream, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 12 },
  tagline: { fontFamily: fonts.displayItalic, fontSize: 16, color: '#e6d3b0', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 8 },
  small: { fontFamily: fonts.displayItalic, fontSize: 15, color: '#e6d3b0', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 8 },
  bottom: { position: 'absolute', left: 12, right: 12, bottom: 26, alignItems: 'center', gap: 8 },
  opts: { flexDirection: 'row', gap: 10, justifyContent: 'center', width: '100%', maxWidth: 860 },
  optsPortrait: { flexDirection: 'column', gap: 8, maxWidth: 440 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: glass, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(243,227,194,0.18)', paddingVertical: 12, paddingHorizontal: 14 },
  optWide: { flex: 1, minHeight: 74 },
  optPortrait: { paddingVertical: 10 },
  optMain: { borderColor: 'rgba(232,184,120,0.75)', backgroundColor: 'rgba(52,34,18,0.78)' },
  optOn: { borderColor: 'rgba(243,227,194,0.7)', transform: [{ translateY: -2 }] },
  optIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(243,227,194,0.12)' },
  optIconMain: { backgroundColor: '#e8b878' },
  optTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: cream },
  optDetail: { fontFamily: fonts.body, fontSize: 13, color: '#d8c6a6' },
  readOn: { paddingVertical: 4, paddingHorizontal: 10 },
  readOnText: { fontFamily: fonts.body, fontSize: 13, color: '#e6d3b0', textDecorationLine: 'underline', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  corner: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8 },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: glass, alignItems: 'center', justifyContent: 'center' },
  roundOn: { backgroundColor: 'rgba(60,40,22,0.9)' },
  menu: { position: 'absolute', top: 60, right: 12, backgroundColor: 'rgba(24,17,11,0.9)', borderRadius: 16, paddingVertical: 6, minWidth: 250, maxWidth: 320 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14 },
  itemOn: { backgroundColor: 'rgba(243,227,194,0.08)' },
  itemText: { fontFamily: fonts.body, fontSize: 14, color: cream, flexShrink: 1 },
  help: { position: 'absolute', top: 60, left: 16, right: 16, alignSelf: 'center', maxWidth: 460, marginHorizontal: 'auto', backgroundColor: 'rgba(24,17,11,0.92)', borderRadius: 16, padding: 16, gap: 8 },
  helpTitle: { fontFamily: fonts.display, fontSize: 20, color: cream },
  helpText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: '#e6d3b0' },
  helpClose: { alignSelf: 'flex-end' },
});
