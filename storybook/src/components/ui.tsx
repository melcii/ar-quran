// Shared building blocks: screens, buttons, cards and the labels that keep
// scripture, translation, explanation and activities visually distinct.
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '@/theme';
import { Icon, type IconName } from './Icon';

export function Screen({ children, scroll = true, padded = true }: { children: ReactNode; scroll?: boolean; padded?: boolean }) {
  const inner = <View style={[styles.inner, padded && styles.padded]}>{children}</View>;
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text accessibilityRole="header" style={[styles.title, style]}>
      {children}
    </Text>
  );
}

export function Heading({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text accessibilityRole="header" style={[styles.heading, style]}>
      {children}
    </Text>
  );
}

export function Body({ children, style, muted }: { children: ReactNode; style?: StyleProp<TextStyle>; muted?: boolean }) {
  return <Text style={[styles.body, muted && { color: colors.inkSoft }, style]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  icon,
  kind = 'primary',
  small,
  disabled,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  kind?: 'primary' | 'secondary' | 'quiet';
  small?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = kind === 'primary' ? '#FFFBF2' : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        kind === 'primary' && { backgroundColor: colors.terracotta },
        kind === 'secondary' && { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line },
        kind === 'quiet' && { backgroundColor: 'transparent' },
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={small ? 18 : 22} color={fg} />}
      {!!label && <Text style={[styles.buttonText, small && { fontSize: 15 }, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  active,
  disabled,
  size = 44,
  color = colors.ink,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  size?: number;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2 },
        active && { backgroundColor: colors.sand },
        (pressed || disabled) && { opacity: disabled ? 0.35 : 0.7 },
      ]}
    >
      <Icon name={icon} size={size * 0.5} color={color} />
    </Pressable>
  );
}

export function Card({ children, style, onPress, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accessibilityLabel?: string }) {
  if (onPress)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [styles.card, shadow, style, pressed && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    );
  return <View style={[styles.card, shadow, style]}>{children}</View>;
}

export function Chip({ label, onPress, selected }: { label: string; onPress?: () => void; selected?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && { opacity: 0.8 }]}
    >
      <Text style={[styles.chipText, selected && { color: '#FFFBF2' }]}>{label}</Text>
    </Pressable>
  );
}

export type ContentKind = 'quran' | 'translation' | 'explanation' | 'activity' | 'art' | 'discovery';

const kindLabel: Record<ContentKind, string> = {
  quran: 'Quran · original Arabic',
  translation: 'Translation',
  explanation: 'Explanation for children',
  activity: 'Learning activity · not from the Quran',
  art: "Artist's illustration",
  discovery: 'Discovery',
};

const kindColor: Record<ContentKind, { bg: string; fg: string }> = {
  quran: { bg: colors.scriptureBorder, fg: colors.ink },
  translation: { bg: colors.paperDeep, fg: colors.inkSoft },
  explanation: { bg: colors.explanationBorder, fg: colors.greenDeep },
  activity: { bg: colors.activityBorder, fg: '#8A4A2E' },
  art: { bg: 'rgba(255,251,242,0.85)', fg: colors.inkSoft },
  discovery: { bg: '#F1DFAE', fg: '#7A5A1E' },
};

/** A small tag saying what kind of content follows. Always visible, never hidden. */
export function ContentLabel({ kind, extra }: { kind: ContentKind; extra?: string }) {
  const c = kindColor[kind];
  return (
    <View style={[styles.label, { backgroundColor: c.bg }]}>
      <Text style={[styles.labelText, { color: c.fg }]}>
        {kindLabel[kind]}
        {extra ? ` · ${extra}` : ''}
      </Text>
    </View>
  );
}

export function Row({ children, style, wrap }: { children: ReactNode; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, wrap && { flexWrap: 'wrap' }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  scroll: { flexGrow: 1 },
  inner: { flex: 1, width: '100%', maxWidth: 1100, alignSelf: 'center' },
  padded: { padding: 20, gap: 16 },
  title: { fontFamily: fonts.display, fontSize: 32, color: colors.ink, lineHeight: 40 },
  heading: { fontFamily: fonts.display, fontSize: 21, color: colors.ink, lineHeight: 28, marginTop: 6 },
  body: { fontFamily: fonts.body, fontSize: 17, color: colors.ink, lineHeight: 26 },
  button: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonSmall: { minHeight: 40, paddingHorizontal: 14 },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 18 },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  chipSelected: { backgroundColor: colors.greenDeep, borderColor: colors.greenDeep },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  label: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  labelText: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.3 },
});
