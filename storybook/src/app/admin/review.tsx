// Everything waiting: drafts in progress and versions waiting for review or
// publishing, across all surahs. Reviewing and publishing happen on each
// surah's Versions tab, where the changes can be read in full.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { getSurah } from '@/content/quran';
import { drafts, versions, type Draft, type Version } from '@/studio/session';
import { Busy, Card, Page, Pill, s, when } from '@/studio/ui';

const name = (scope: string) => (scope.startsWith('surah:') ? `${scope.slice(6)}. ${getSurah(Number(scope.slice(6)))?.nameTransliterated}` : scope);

export default function Review() {
  const [d, setD] = useState<Draft[] | null>(null);
  const [v, setV] = useState<Version[]>([]);
  useEffect(() => {
    drafts().then(setD);
    versions().then(setV);
  }, []);
  const go = (scope: string) => {
    const to = scope.startsWith('surah:') ? `/admin/surah/${scope.slice(6)}` : scope === 'ark:slice' ? '/admin/ark' : scope === 'catalog:avatar' ? '/admin/characters' : scope.startsWith('config:') ? '/admin/settings' : null;
    if (to) router.push(to as any);
  };
  const waiting = v.filter((x) => ['submitted', 'approved', 'changes_requested'].includes(x.state));
  return (
    <Page title="Review & publish" sub="Draft → preview → checks → review → publish → verify. Nothing is published automatically.">
      <Card title={`Waiting (${waiting.length})`}>
        {!waiting.length ? <Text style={s.small}>Nothing is waiting.</Text> : null}
        {waiting.map((x) => (
          <Pressable key={x.id} style={s.tr} onPress={() => go(x.scope)} accessibilityRole="link">
            <Text style={[s.body, { width: 200, fontWeight: '700' }]}>{name(x.scope)}</Text>
            <Text style={[s.body, { width: 90 }]}>Version {x.number}</Text>
            <Pill text={x.state.replace('_', ' ')} tone={x.state === 'approved' ? 'accent' : x.state === 'changes_requested' ? 'bad' : 'warn'} />
            {x.quran_linked ? <Pill text="Needs Quran reviewer" tone="quran" /> : null}
            <Pill text={x.validation_ok ? 'checks passed' : x.validation_ok === false ? 'checks failed' : 'not checked'} tone={x.validation_ok ? 'good' : x.validation_ok === false ? 'bad' : 'plain'} />
            <Text style={[s.small, { flex: 1 }]}>{x.note}</Text>
            <Text style={s.small}>{when(x.created_at)}</Text>
          </Pressable>
        ))}
      </Card>
      <Card title="Drafts in progress">
        {!d ? <Busy /> : !d.length ? <Text style={s.small}>No drafts.</Text> : null}
        {d?.map((x) => (
          <Pressable key={x.scope} style={s.tr} onPress={() => go(x.scope)} accessibilityRole="link">
            <Text style={[s.body, { width: 200, fontWeight: '700' }]}>{name(x.scope)}</Text>
            <Text style={[s.small, { flex: 1 }]}>{Object.keys(x.doc.set ?? {}).length} field edit(s){x.doc.add?.tasks?.length ? `, ${x.doc.add.tasks.length} added chapter(s)` : ''}{x.doc.order ? ', chapters reordered' : ''}</Text>
            <Text style={s.small}>saved {when(x.updated_at)} · revision {x.revision}</Text>
          </Pressable>
        ))}
      </Card>
    </Page>
  );
}
