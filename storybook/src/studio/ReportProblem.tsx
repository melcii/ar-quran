// "Something not working?" for players inside a world. Child-safe by design:
// the child taps one of six fixed pictures-and-words; what is sent is only
// the world number, that choice and the screen size. No typing, no name, no
// account, no explorer, no position. Nothing is sent during a studio play
// test, and nothing at all when the studio is not configured.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, fonts } from '@/theme';
import { STUDIO_URL, studioConfigured } from './live';
import { inStudioTest } from './mode';

export const PROBLEM_CHOICES: { id: 'stuck' | 'cannot_finish' | 'sound' | 'looks_wrong' | 'too_hard' | 'other'; icon: string; label: string }[] = [
  { id: 'stuck', icon: '🧱', label: 'I got stuck' },
  { id: 'cannot_finish', icon: '🧩', label: "I can't finish an activity" },
  { id: 'sound', icon: '🔇', label: 'The sound is wrong' },
  { id: 'looks_wrong', icon: '👀', label: 'Something looks wrong' },
  { id: 'too_hard', icon: '🧗', label: 'It is too hard' },
  { id: 'other', icon: '❓', label: 'Something else' },
];

export async function sendProblem(surah: number, category: string, screen: string): Promise<boolean> {
  if (!studioConfigured() || inStudioTest()) return false;
  try {
    const r = await fetch(`${STUDIO_URL}/api/report-problem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_surah: surah, p_category: category, p_screen: screen }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export function ReportSheet({ surah, onClose }: { surah: number; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const [sent, setSent] = useState<null | 'sent' | 'kept'>(null);
  const pick = async (id: string) => {
    const ok = await sendProblem(surah, id, `${Math.round(width)}x${Math.round(height)}`);
    setSent(ok ? 'sent' : 'kept');
  };
  return (
    <View style={s.wrap} testID="report-sheet">
      <View style={s.sheet}>
        <Text style={s.title}>{sent ? 'Thank you!' : 'What went wrong?'}</Text>
        {sent ? (
          <>
            <Text style={s.note}>{sent === 'sent' ? 'We will look at it. You can keep exploring.' : 'Thank you for telling us. You can keep exploring.'}</Text>
            <Text style={s.note}>If you are stuck, “Return to safe ground” takes you somewhere open.</Text>
          </>
        ) : (
          <>
            <View style={s.grid}>
              {PROBLEM_CHOICES.map((c) => (
                <Pressable key={c.id} style={s.choice} onPress={() => pick(c.id)} accessibilityRole="button" accessibilityLabel={c.label} testID={`report-${c.id}`}>
                  <Text style={s.icon}>{c.icon}</Text>
                  <Text style={s.choiceText}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.note}>Only your choice is sent, with this world&apos;s number. Not your name or anything about you.</Text>
          </>
        )}
        <Pressable style={s.close} onPress={onClose} accessibilityRole="button" testID="report-close">
          <Text style={s.closeText}>{sent ? 'Back to the world' : 'Never mind'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', padding: 12 } as never,
  sheet: { width: '100%', maxWidth: 520, backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 12 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { flexBasis: '31%', flexGrow: 1, minWidth: 130, alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fffaf0' },
  icon: { fontSize: 28 },
  choiceText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, textAlign: 'center' },
  note: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  close: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 14 },
  closeText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.skyDeep },
});
