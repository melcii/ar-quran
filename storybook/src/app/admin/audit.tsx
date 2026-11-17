// The audit log (Super Admin): every studio change, append only.
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { audit, staff, type AuditRow } from '@/studio/session';
import { Busy, Card, Note, Page, s, when } from '@/studio/ui';

export default function Audit() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');
  useEffect(() => {
    audit(500).then(setRows).catch((e) => setErr(e.message));
    staff().then((x) => setNames(Object.fromEntries(x.map((y) => [y.user_id, y.email])))).catch(() => {});
  }, []);
  return (
    <Page title="Audit log" sub="Every administrative change, who made it and when. It cannot be edited or deleted.">
      {err ? <Note tone="bad">{err}</Note> : null}
      <Card>
        {!rows ? <Busy /> : !rows.length ? <Text style={s.small}>Nothing here, or only Super Admins can read the log.</Text> : null}
        {rows?.map((r) => (
          <View key={r.id} style={s.tr}>
            <Text style={[s.small, { width: 150 }]}>{when(r.at)}</Text>
            <Text style={[s.body, { width: 200 }]} numberOfLines={1}>{r.actor ? names[r.actor] ?? r.actor.slice(0, 8) : 'database owner'}</Text>
            <Text style={[s.body, { width: 140, fontWeight: '700' }]}>{r.action}</Text>
            <Text style={[s.body, { width: 90 }]}>{r.scope ?? ''}</Text>
            <Text style={[s.small, { flex: 1 }]} numberOfLines={2}>{JSON.stringify(r.detail)}</Text>
          </View>
        ))}
      </Card>
    </Page>
  );
}
