// Shared pieces for showing Quran references in the studio: the locked
// Arabic and translation from the verified dataset (never editable), and an
// input for typing references as surah:ayah.
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { getVerse } from '@/content/quran';
import type { Field } from './overlay';
import { C, s } from './ui';

export function LockedAyahs({ refs }: { refs: [number, number][] }) {
  return (
    <View style={{ backgroundColor: '#fffdf8', borderWidth: 1, borderColor: '#e6dcc3', borderRadius: 8, padding: 10, marginTop: 6 }}>
      <Text style={[s.small, { marginBottom: 4 }]}>Locked text from the verified dataset (KFGQPC Hafs; Saheeh International). It cannot be edited here.</Text>
      {refs.slice(0, 6).map(([a, b]) => {
        const v = getVerse(a, b);
        return v ? (
          <View key={`${a}:${b}`} style={{ marginBottom: 6 }}>
            <Text style={{ fontFamily: 'AmiriQuran_400Regular', fontSize: 20, textAlign: 'right', writingDirection: 'rtl', color: C.ink }} selectable={false}>
              {v.arabic_text}
            </Text>
            <Text style={s.small}>
              {a}:{b} · {v.translation_text}
            </Text>
          </View>
        ) : (
          <Text key={`${a}:${b}`} style={[s.small, { color: C.bad }]}>
            {a}:{b} does not exist
          </Text>
        );
      })}
      {refs.length > 6 ? <Text style={s.small}>…and {refs.length - 6} more</Text> : null}
    </View>
  );
}

export const parseRefs = (t: string): [number, number][] | null => {
  const out: [number, number][] = [];
  for (const part of t.split(/[,\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d{1,3}):(\d{1,3})$/);
    if (!m) return null;
    out.push([+m[1], +m[2]]);
  }
  return out.length ? out : null;
};

export function RefsInput({ f, value, onChange, testID }: { f: Pick<Field, 'group' | 'label'>; value: [number, number][]; onChange: (v: [number, number][]) => void; testID?: string }) {
  const [text, setText] = useState(value.map((r) => r.join(':')).join(', '));
  const [bad, setBad] = useState(false);
  useEffect(() => setText(value.map((r) => r.join(':')).join(', ')), [JSON.stringify(value)]);
  return (
    <View>
      <TextInput
        style={[s.input, bad && { borderColor: C.bad }]}
        value={text}
        accessibilityLabel={`${f.group}: ${f.label}`}
        testID={testID}
        onChangeText={(t) => {
          setText(t);
          const p = parseRefs(t);
          setBad(!p);
          if (p) onChange(p);
        }}
      />
      {bad ? <Text style={[s.small, { color: C.bad }]}>Write references as surah:ayah, separated by commas, e.g. 19:2, 19:3</Text> : null}
      <LockedAyahs refs={value} />
    </View>
  );
}

