// Test results: the recorded physics runs for every built-in world, and
// every check recorded from the studio. Real records only.
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getSurah } from '@/content/quran';
import { physicsRuns } from '@/studio/facts';
import { testRuns, type TestRun } from '@/studio/session';
import { Busy, Card, Page, Pill, s, when } from '@/studio/ui';

export default function Tests() {
  const [t, setT] = useState<TestRun[] | null>(null);
  useEffect(() => {
    testRuns().then(setT);
  }, []);
  const rows = Object.entries(physicsRuns.worlds);
  const fails = rows.filter(([, w]) => w.desktop !== 'pass');
  return (
    <Page title="Test results" sub="Recorded runs only. A world counts as tested only for the exact recipe a run used.">
      <Card title="Studio checks">
        {!t ? <Busy /> : !t.length ? <Text style={s.small}>No checks recorded from the studio yet.</Text> : null}
        {t?.map((x) => (
          <View key={x.id} style={s.tr}>
            <Pill text={x.ok ? 'pass' : 'fail'} tone={x.ok ? 'good' : 'bad'} />
            <Text style={[s.body, { width: 160 }]}>{x.scope}</Text>
            <Text style={[s.body, { width: 100 }]}>{x.kind}</Text>
            <Text style={[s.body, { flex: 1 }]}>{x.summary}</Text>
            <Text style={s.small}>{when(x.ran_at)}</Text>
          </View>
        ))}
      </Card>
      <Card title={`Physics and movement runs (${rows.length} worlds, ${fails.length} failing on desktop)`}>
        <Text style={[s.small, { marginBottom: 8 }]}>{physicsRuns.how}</Text>
        {rows.map(([k, w]) => (
          <View key={k} style={s.tr}>
            <Text style={[s.body, { width: 200 }]}>{k}. {getSurah(Number(k))?.nameTransliterated}</Text>
            <Pill text={`desktop ${w.desktop}`} tone={w.desktop === 'pass' ? 'good' : 'bad'} />
            <Pill text={`phone ${w.phone}`} tone={w.phone === 'pass' ? 'good' : 'plain'} />
            <Text style={s.small}>{w.date ?? physicsRuns.date} · recipe {w.hash}</Text>
          </View>
        ))}
      </Card>
    </Page>
  );
}
