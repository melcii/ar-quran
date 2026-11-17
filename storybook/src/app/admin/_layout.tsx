// The Admin Studio: a separate, protected part of the app at /admin. Nothing
// in the children's game links here. This screen only decides what to show;
// every permission is enforced by the database, so a person who reaches a
// studio page without the right role still cannot read or change anything.
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { enrolMfa, roleLabel, signIn, signOut, useGate, verifyMfa } from '@/studio/session';
import { Btn, Busy, C, Card, Field, Note, Shell, s } from '@/studio/ui';
import { StudioContext } from '@/studio/context';

function Centre({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, minHeight: '100%' as any, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ width: '100%', maxWidth: 440 }}>
        <Text style={[s.h1, { marginBottom: 2 }]}>Admin Studio</Text>
        <Text style={[s.sub, { marginBottom: 18 }]}>Quran Adventure · staff only</Text>
        {children}
      </View>
    </View>
  );
}

function SignIn({ done }: { done: () => void }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    setErr('');
    try {
      await signIn(email.trim(), pw);
      done();
    } catch (e: any) {
      setErr(e.message ?? 'Could not sign in');
    }
    setBusy(false);
  };
  return (
    <Card title="Sign in">
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" testID="email" />
      <Field label="Password" value={pw} onChangeText={setPw} secureTextEntry onSubmitEditing={go} testID="password" />
      {err ? <Note tone="bad">{err}</Note> : null}
      <Btn label={busy ? 'Signing in…' : 'Sign in'} kind="primary" onPress={go} disabled={busy || !email || !pw} testID="sign-in" />
      <Text style={[s.small, { marginTop: 12 }]}>Staff accounts must also use an authenticator app. Children never sign in here.</Text>
    </Card>
  );
}

function MfaEnrol({ done }: { done: () => void }) {
  const [f, setF] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  return (
    <Card title="Set up your authenticator">
      <Text style={[s.body, { marginBottom: 10 }]}>Your account has a studio role. Before it can be used, add this account to an authenticator app (such as Google Authenticator, Microsoft Authenticator or 1Password).</Text>
      {!f ? (
        <Btn label="Show the setup code" kind="primary" onPress={() => enrolMfa().then(setF).catch((e) => setErr(e.message))} testID="mfa-start" />
      ) : (
        <View>
          {Platform.OS === 'web' ? <Image source={{ uri: f.qr }} style={{ width: 180, height: 180, alignSelf: 'center', marginBottom: 8 }} accessibilityLabel="QR code for your authenticator app" /> : null}
          <Text style={s.small}>Or type this key:</Text>
          <Text selectable style={[s.body, { fontFamily: 'monospace', marginBottom: 12 }]} testID="mfa-secret">
            {f.secret}
          </Text>
          <Field label="6-digit code from the app" value={code} onChangeText={setCode} keyboardType="number-pad" testID="mfa-code" />
          <Btn label="Confirm" kind="primary" onPress={() => verifyMfa(code, f.id).then(done).catch((e) => setErr(e.message))} disabled={code.length < 6} testID="mfa-verify" />
        </View>
      )}
      {err ? <Note tone="bad">{err}</Note> : null}
    </Card>
  );
}

function MfaCheck({ done }: { done: () => void }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  return (
    <Card title="Authenticator code">
      <Field label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" onSubmitEditing={() => verifyMfa(code).then(done).catch((e) => setErr(e.message))} testID="mfa-code" />
      {err ? <Note tone="bad">{err}</Note> : null}
      <Btn label="Continue" kind="primary" onPress={() => verifyMfa(code).then(done).catch((e) => setErr(e.message))} disabled={code.length < 6} testID="mfa-verify" />
    </Card>
  );
}

export default function AdminLayout() {
  const [g, refresh] = useGate();
  const out = () => signOut().then(refresh);
  if (g.state === 'loading') return <Centre><Busy /></Centre>;
  if (g.state === 'not-configured')
    return (
      <Centre>
        <Note tone="warn">
          <Text style={s.body}>
            The studio is not connected to a Supabase project yet. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (the publishable key, never the secret one), apply the migrations in storybook/supabase/migrations, and make the first Super Admin as described in storybook/supabase/README.md.
          </Text>
        </Note>
      </Centre>
    );
  if (g.state === 'signed-out') return <Centre><SignIn done={refresh} /></Centre>;
  if (g.state === 'needs-mfa-enrol') return <Centre><MfaEnrol done={refresh} /></Centre>;
  if (g.state === 'needs-mfa') return <Centre><MfaCheck done={refresh} /></Centre>;
  if (g.state === 'not-staff')
    return (
      <Centre>
        <Note tone="bad">This account has no studio role. A Super Admin can add one from Staff &amp; roles.</Note>
        <Btn label="Sign out" onPress={out} />
      </Centre>
    );
  const who = g.who!;
  return (
    <StudioContext.Provider value={{ who, refresh }}>
      <Shell email={who.email ?? ''} roles={who.roles.map(roleLabel).join(', ')} onSignOut={out}>
        <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: C.bg } }} />
      </Shell>
    </StudioContext.Provider>
  );
}
