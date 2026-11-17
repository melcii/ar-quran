// Staff and roles (Super Admin). The server refuses role changes from
// anyone else, and a role only works with a multi-factor session.
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStudio } from '@/studio/context';
import { ROLES, has, setRole, staff, type Role, type Staff } from '@/studio/session';
import { Btn, Busy, C, Card, Field, Note, Page, Pill, s } from '@/studio/ui';

export default function StaffPage() {
  const { who } = useStudio();
  const [list, setList] = useState<Staff[] | null>(null);
  const [email, setEmail] = useState('');
  const [role, setR] = useState<Role>('story_editor');
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const load = () => staff().then(setList).catch((e) => setMsg({ tone: 'bad', text: e.message }));
  useEffect(() => {
    load();
  }, []);
  const change = (e: string, r: Role, on: boolean) =>
    setRole(e, r, on)
      .then(() => (setMsg({ tone: 'good', text: on ? `Gave ${e} the ${r} role.` : `Removed ${r} from ${e}.` }), load()))
      .catch((x) => setMsg({ tone: 'bad', text: x.message }));
  return (
    <Page title="Staff & roles" sub="Only a Super Admin can change roles. Moderation is kept apart from content editing.">
      {!has(who, 'super_admin') ? <Note tone="warn">Only a Super Admin can see and change staff.</Note> : null}
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
      <Card title="Roles">
        {ROLES.map((r) => (
          <Text key={r.id} style={s.body}>
            <Text style={{ fontWeight: '800' }}>{r.label}</Text>: {r.can}
          </Text>
        ))}
      </Card>
      {has(who, 'super_admin') ? (
        <Card title="Give someone a role">
          <Text style={[s.small, { marginBottom: 8 }]}>The person signs up first (with the same sign-in as the app), then you add their role here. They must set up an authenticator before the role works.</Text>
          <Field label="Their email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <View style={[s.row, { marginBottom: 10 }]}>
            {ROLES.map((r) => (
              <Pressable key={r.id} onPress={() => setR(r.id)} style={[s.btn, s.btnSmall, { borderColor: C.line, backgroundColor: role === r.id ? C.accentSoft : '#fff' }]}>
                <Text style={{ fontSize: 12 }}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
          <Btn label="Give role" kind="primary" onPress={() => change(email.trim(), role, true)} disabled={!email.includes('@')} />
        </Card>
      ) : null}
      {has(who, 'super_admin') ? (
        <Card title="Staff">
          {!list ? <Busy /> : null}
          {list?.map((p) => (
            <View key={p.user_id} style={s.tr}>
              <Text style={[s.body, { width: 240 }]}>{p.email}</Text>
              <Pill text={p.mfa ? 'authenticator set up' : 'no authenticator yet'} tone={p.mfa ? 'good' : 'warn'} />
              <View style={[s.row, { flex: 1 }]}>
                {p.roles.map((r) => (
                  <Pressable key={r} onPress={() => change(p.email, r, false)} accessibilityLabel={`Remove ${r}`}>
                    <Pill text={`${ROLES.find((x) => x.id === r)?.label} ✕`} tone="accent" />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </Card>
      ) : null}
    </Page>
  );
}
