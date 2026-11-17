// Building blocks for the Admin Studio screens: a calm, readable look that is
// clearly a tool for grown-ups, separate from the children's game.
import { router, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

export const C = {
  bg: '#f4f1ea',
  panel: '#ffffff',
  side: '#1f2a33',
  sideText: '#d9e2e8',
  ink: '#1d2328',
  soft: '#5b6670',
  line: '#e2ddd2',
  accent: '#2f6f73',
  accentSoft: '#e3f0ef',
  warn: '#a46a12',
  warnSoft: '#fbf0dc',
  bad: '#a8352b',
  badSoft: '#f9e3df',
  good: '#2f7a45',
  goodSoft: '#e2f2e6',
  quran: '#6a4c93',
  quranSoft: '#efe8f7',
};

export function Page({ title, sub, actions, children }: { title: string; sub?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.page}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={s.h1} accessibilityRole="header">
            {title}
          </Text>
          {sub ? <Text style={s.sub}>{sub}</Text> : null}
        </View>
        {actions ? <View style={s.row}>{actions}</View> : null}
      </View>
      {children}
    </ScrollView>
  );
}

export function Card({ title, right, children, style }: { title?: string; right?: ReactNode; children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[s.card, style]}>
      {title ? (
        <View style={[s.row, { marginBottom: 10, justifyContent: 'space-between' }]}>
          <Text style={s.h2}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Btn({ label, onPress, kind = 'plain', disabled, testID, small }: { label: string; onPress?: () => void; kind?: 'plain' | 'primary' | 'danger' | 'quiet'; disabled?: boolean; testID?: string; small?: boolean }) {
  const bg = kind === 'primary' ? C.accent : kind === 'danger' ? C.bad : kind === 'quiet' ? 'transparent' : C.panel;
  const fg = kind === 'primary' || kind === 'danger' ? '#fff' : C.ink;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ hovered }: any) => [s.btn, small && s.btnSmall, { backgroundColor: bg, borderColor: kind === 'plain' ? C.line : bg, opacity: disabled ? 0.45 : hovered ? 0.85 : 1 }]}
    >
      <Text style={[s.btnText, small && { fontSize: 12 }, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ text, tone = 'plain' }: { text: string; tone?: 'plain' | 'good' | 'warn' | 'bad' | 'quran' | 'accent' }) {
  const m = { plain: ['#eeeae2', C.soft], good: [C.goodSoft, C.good], warn: [C.warnSoft, C.warn], bad: [C.badSoft, C.bad], quran: [C.quranSoft, C.quran], accent: [C.accentSoft, C.accent] }[tone];
  return (
    <View style={[s.pill, { backgroundColor: m[0] }]}>
      <Text style={[s.pillText, { color: m[1] }]}>{text}</Text>
    </View>
  );
}

export function Field({ label, hint, ...p }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor="#9aa3aa" {...p} style={[s.input, p.multiline && { minHeight: 70, textAlignVertical: 'top' }, p.style]} />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Note({ tone = 'plain', children }: { tone?: 'plain' | 'warn' | 'bad' | 'good' | 'quran'; children: ReactNode }) {
  const m = { plain: ['#f1eee7', C.soft], warn: [C.warnSoft, C.warn], bad: [C.badSoft, C.bad], good: [C.goodSoft, C.good], quran: [C.quranSoft, C.quran] }[tone];
  return (
    <View style={[s.note, { backgroundColor: m[0], borderLeftColor: m[1] }]}>
      {typeof children === 'string' ? <Text style={[s.body, { color: C.ink }]}>{children}</Text> : children}
    </View>
  );
}

export const Busy = ({ label = 'Loading…' }: { label?: string }) => (
  <View style={[s.row, { padding: 20 }]}>
    <ActivityIndicator color={C.accent} />
    <Text style={s.body}>{label}</Text>
  </View>
);

const NAV: { href: string; label: string; match: RegExp }[] = [
  { href: '/admin', label: 'Dashboard', match: /^\/admin\/?$/ },
  { href: '/admin/surahs', label: '114 Surahs', match: /^\/admin\/(surahs|surah)/ },
  { href: '/admin/ark', label: "Nuh's Ark animals", match: /^\/admin\/ark/ },
  { href: '/admin/audio', label: 'Audio Studio', match: /^\/admin\/audio/ },
  { href: '/admin/characters', label: 'Character Studio', match: /^\/admin\/characters/ },
  { href: '/admin/review', label: 'Review & publish', match: /^\/admin\/review/ },
  { href: '/admin/tests', label: 'Test results', match: /^\/admin\/tests/ },
  { href: '/admin/staff', label: 'Staff & roles', match: /^\/admin\/staff/ },
  { href: '/admin/audit', label: 'Audit log', match: /^\/admin\/audit/ },
];

export function Shell({ email, roles, onSignOut, children }: { email: string; roles: string; onSignOut: () => void; children: ReactNode }) {
  const path = usePathname();
  return (
    <View style={s.shell}>
      <View style={s.side} accessibilityRole="navigation">
        <Text style={s.brand}>Quran Adventure</Text>
        <Text style={s.brandSub}>Admin Studio</Text>
        <View style={{ height: 18 }} />
        {NAV.map((n) => {
          const on = n.match.test(path);
          return (
            <Pressable key={n.href} onPress={() => router.push(n.href as any)} style={[s.nav, on && s.navOn]} accessibilityRole="link">
              <Text style={[s.navText, on && { color: '#fff' }]}>{n.label}</Text>
            </Pressable>
          );
        })}
        <View style={{ flex: 1 }} />
        <Text style={s.who} numberOfLines={1}>
          {email}
        </Text>
        <Text style={[s.who, { opacity: 0.7, fontSize: 11 }]}>{roles}</Text>
        <Pressable onPress={onSignOut} style={s.nav} accessibilityRole="button">
          <Text style={s.navText}>Sign out</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/')} style={s.nav} accessibilityRole="link">
          <Text style={[s.navText, { opacity: 0.7 }]}>Open the game</Text>
        </Pressable>
      </View>
      <View style={{ flex: 1, backgroundColor: C.bg }}>{children}</View>
    </View>
  );
}

export const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

export const s = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', minHeight: '100%' as any },
  side: { width: 220, backgroundColor: C.side, paddingVertical: 20, paddingHorizontal: 12 },
  brand: { color: '#fff', fontSize: 17, fontWeight: '800', paddingHorizontal: 8 },
  brandSub: { color: '#9fd3cf', fontSize: 13, fontWeight: '600', paddingHorizontal: 8 },
  nav: { paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8, marginBottom: 2 },
  navOn: { backgroundColor: '#2f3e4a' },
  navText: { color: C.sideText, fontSize: 14, fontWeight: '600' },
  who: { color: C.sideText, fontSize: 12, paddingHorizontal: 10, marginBottom: 2 },
  page: { padding: 28, paddingBottom: 80, maxWidth: 1240, width: '100%' as any },
  head: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 18, gap: 12 },
  h1: { fontSize: 26, fontWeight: '800', color: C.ink },
  h2: { fontSize: 16, fontWeight: '800', color: C.ink },
  h3: { fontSize: 14, fontWeight: '800', color: C.ink, marginBottom: 4 },
  sub: { fontSize: 14, color: C.soft, marginTop: 4 },
  body: { fontSize: 14, color: C.ink, lineHeight: 20 },
  small: { fontSize: 12, color: C.soft, lineHeight: 17 },
  card: { backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 18, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  btn: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  btnSmall: { paddingVertical: 4, paddingHorizontal: 9 },
  btnText: { fontSize: 14, fontWeight: '700' },
  pill: { borderRadius: 20, paddingVertical: 2, paddingHorizontal: 9, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  label: { fontSize: 12, fontWeight: '800', color: C.soft, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  hint: { fontSize: 12, color: C.soft, marginTop: 3 },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, fontSize: 14, color: C.ink, backgroundColor: '#fff' },
  note: { borderLeftWidth: 4, borderRadius: 6, padding: 12, marginBottom: 12 },
  table: { borderTopWidth: 1, borderColor: C.line },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderColor: C.line, paddingVertical: 8, alignItems: 'center', gap: 10 },
  th: { fontSize: 11, fontWeight: '800', color: C.soft, textTransform: 'uppercase' },
});
