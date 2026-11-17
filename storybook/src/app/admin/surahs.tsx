// The 114-surah manager: every surah with its world, technical status and
// review state, and a way into each one's management page.
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { WORLDS } from '@/adventure/worlds';
import { surahs } from '@/content/quran';
import { statusOf } from '@/studio/facts';
import { drafts, publications } from '@/studio/session';
import { C, Card, Page, Pill, s } from '@/studio/ui';

export default function Surahs() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [draftSet, setDraftSet] = useState<Set<number>>(new Set());
  const [pubSet, setPubSet] = useState<Map<number, string>>(new Map());
  useEffect(() => {
    drafts().then((d) => setDraftSet(new Set(d.filter((x) => x.scope.startsWith('surah:')).map((x) => Number(x.scope.slice(6)))))).catch(() => {});
    publications()
      .then((p) => {
        const m = new Map<number, string>();
        for (const x of p) if (x.scope.startsWith('surah:') && !m.has(Number(x.scope.slice(6)))) m.set(Number(x.scope.slice(6)), x.action);
        setPubSet(m);
      })
      .catch(() => {});
  }, []);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return surahs.filter((x) => {
      if (filter === 'draft' && !draftSet.has(x.number)) return false;
      if (filter === 'published' && !(pubSet.has(x.number) && pubSet.get(x.number) !== 'unpublish')) return false;
      if (!t) return true;
      return String(x.number) === t || x.nameTransliterated.toLowerCase().includes(t) || x.nameMeaning.toLowerCase().includes(t) || (WORLDS[x.number]?.name ?? '').toLowerCase().includes(t);
    });
  }, [q, filter, draftSet, pubSet]);
  return (
    <Page title="114 Surahs" sub="Open a surah to manage its record, story, versions and tests.">
      <Card>
        <View style={s.row}>
          <TextInput value={q} onChangeText={setQ} placeholder="Search by number, name, meaning or world" style={[s.input, { flex: 1, minWidth: 260 }]} accessibilityLabel="Search surahs" />
          {(['all', 'draft', 'published'] as const).map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[s.btn, { borderColor: C.line, backgroundColor: filter === f ? C.accentSoft : '#fff' }]}>
              <Text style={s.btnText}>{f === 'all' ? 'All' : f === 'draft' ? 'With drafts' : 'Studio edits live'}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card>
        <View style={[s.tr, { borderBottomWidth: 2 }]}>
          <Text style={[s.th, { width: 40 }]}>No.</Text>
          <Text style={[s.th, { width: 170 }]}>Surah</Text>
          <Text style={[s.th, { width: 60 }]}>Ayahs</Text>
          <Text style={[s.th, { flex: 1 }]}>World</Text>
          <Text style={[s.th, { width: 110 }]}>Technical</Text>
          <Text style={[s.th, { width: 120 }]}>Scholarly review</Text>
          <Text style={[s.th, { width: 130 }]}>Studio</Text>
        </View>
        {list.map((x) => {
          const st = statusOf(x.number);
          const w = WORLDS[x.number];
          const pub = pubSet.get(x.number);
          return (
            <Pressable key={x.number} style={s.tr} onPress={() => router.push(`/admin/surah/${x.number}`)} accessibilityRole="link" testID={`surah-row-${x.number}`}>
              <Text style={[s.body, { width: 40, fontWeight: '800' }]}>{x.number}</Text>
              <View style={{ width: 170 }}>
                <Text style={[s.body, { fontWeight: '700' }]}>{x.nameTransliterated}</Text>
                <Text style={s.small}>{x.nameMeaning}</Text>
              </View>
              <Text style={[s.body, { width: 60 }]}>{x.ayahCount}</Text>
              <Text style={[s.body, { flex: 1 }]} numberOfLines={1}>
                {w ? w.name : 'No world yet'}
              </Text>
              <View style={{ width: 110 }}>
                <Pill text={st?.status ?? 'Unknown'} tone={st?.status === 'Tested' ? 'good' : 'warn'} />
              </View>
              <View style={{ width: 120 }}>
                <Pill text={st && /^No/.test(st.content_reviewed) ? 'Not reviewed' : 'Reviewed'} tone={st && /^No/.test(st.content_reviewed) ? 'warn' : 'good'} />
              </View>
              <View style={[s.row, { width: 130 }]}>
                {draftSet.has(x.number) ? <Pill text="Draft" tone="accent" /> : null}
                {pub && pub !== 'unpublish' ? <Pill text="Live edits" tone="good" /> : null}
              </View>
            </Pressable>
          );
        })}
      </Card>
    </Page>
  );
}
