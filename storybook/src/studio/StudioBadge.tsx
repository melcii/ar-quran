// A small strip shown only in studio preview modes, so a tester always knows
// which version of a world they are in. Never shown in ordinary play.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StudioMode } from './live';

const LABEL: Record<StudioMode, string> = {
  play: '',
  draft: 'Play Test: draft',
  published: 'Published version',
  'built-in': 'Built-in world (no studio edits)',
};

export function StudioBadge({ mode, n, version, skipped, back }: { mode: StudioMode; n: number; version: number | null; skipped: number; back?: string }) {
  return (
    <View style={st.bar} pointerEvents="box-none" testID="studio-badge">
      <Text style={st.text}>
        {LABEL[mode]}
        {mode === 'published' ? (version ? ` (version ${version})` : ' (nothing published: built-in world)') : ''}
        {' · progress here is kept apart from players’ saves'}
        {skipped ? ` · ${skipped} edit(s) no longer fit and were skipped` : ''}
      </Text>
      <Pressable onPress={() => router.push((back ?? `/admin/surah/${n}`) as any)} style={st.btn} accessibilityRole="link">
        <Text style={st.btnText}>Back to the studio</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  bar: { position: 'absolute', top: 6, left: '50%', transform: [{ translateX: '-50%' as any }], flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(30,24,40,0.82)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, zIndex: 50 },
  text: { color: '#fff', fontSize: 12, fontWeight: '600' },
  btn: { backgroundColor: '#f1c27d', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  btnText: { color: '#2a1d10', fontSize: 12, fontWeight: '700' },
});

/**
 * A small "Edit World" button in ordinary play, only on a device where a
 * staff member has signed in to the studio. It is just a link: the editor
 * itself checks the role with the server.
 */
export function EditWorldButton({ n }: { n: number }) {
  let staff = false;
  try {
    staff = !!globalThis.localStorage?.getItem('quran-studio.auth');
  } catch {}
  if (!staff) return null;
  return (
    <Pressable onPress={() => router.push(`/admin/world/${n}`)} style={[st.btn, { position: 'absolute', bottom: 12, right: 12, zIndex: 50 }]} accessibilityRole="link" testID="edit-world-in-game">
      <Text style={st.btnText}>Edit World</Text>
    </Pressable>
  );
}
