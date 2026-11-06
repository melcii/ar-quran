import { StyleSheet, Text, View } from 'react-native';
import type { Story } from '@/content/types';
import { colors, fonts, radius } from '@/theme';

/** Shown on any story that a qualified reviewer has not yet approved. */
export function ReviewNotice({ story }: { story: Story }) {
  if (story.editorial_review_status === 'approved') return null;
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.title}>Prototype story, not yet reviewed</Text>
      <Text style={styles.text}>
        The Quran verses come from a verified text. The explanations and pictures are a draft that a qualified scholar or
        Islamic educator has not reviewed yet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#FBF0D9', borderColor: '#E7CF97', borderWidth: 1.5, borderRadius: radius.md, padding: 12, gap: 2 },
  title: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#7A5A1E' },
  text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: '#6B5524' },
});
