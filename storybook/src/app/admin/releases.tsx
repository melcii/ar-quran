// Release management (Super Admin): what is live in every world and setting,
// what is scheduled, and releases that publish several approved versions
// together (now or at a set time) and can be undone together. Each version
// shows the facts that matter before it goes out: its checks, who approved
// it, the newest movement/collision run for its world and open bugs there.
// Only the published pointer moves; player saves are never touched.
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { getSurah } from '@/content/quran';
import { useStudio } from '@/studio/context';
import { bugs, cancelRelease, createRelease, publications, publishRelease, releases, staff, testRuns, undoRelease, versions, has, type Bug, type Publication, type Release, type TestRun, type Version } from '@/studio/session';
import { Btn, Busy, C, Card, Field, Note, Page, Pill, s, when } from '@/studio/ui';

const name = (scope: string) =>
  scope.startsWith('surah:') ? `${scope.slice(6)}. ${getSurah(Number(scope.slice(6)))?.nameTransliterated}` : ({ 'ark:slice': "Nuh's Ark animals", 'catalog:avatar': 'Character catalog', 'config:play': 'Play settings', 'config:multiplayer': 'Online play settings' } as Record<string, string>)[scope] ?? scope;
const page = (scope: string) => (scope.startsWith('surah:') ? `/admin/surah/${scope.slice(6)}?tab=versions` : scope === 'ark:slice' ? '/admin/ark' : scope === 'catalog:avatar' ? '/admin/characters' : scope.startsWith('config:') ? '/admin/settings' : null);
const CLOSED = ['fixed', 'wont_fix', 'duplicate'];

type Data = { vs: Version[]; pubs: Publication[]; rels: Release[]; tests: TestRun[]; bugs: Bug[] };

export default function Releases() {
  const { who } = useStudio();
  const admin = has(who, 'super_admin');
  const [d, setD] = useState<Data | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [pick, setPick] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [at, setAt] = useState<Record<number, string>>({});
  const load = useCallback(async () => {
    try {
      const [vs, pubs, rels, tests, bs] = await Promise.all([versions(), publications(), releases(), testRuns(), bugs()]);
      setD({ vs, pubs, rels, tests, bugs: bs });
    } catch (e: any) {
      setErr(e.message);
    }
  }, []);
  useEffect(() => {
    load();
    staff().then((x) => setNames(Object.fromEntries(x.map((y) => [y.user_id, y.email])))).catch(() => {});
  }, [load]);
  (globalThis as any).__studioReleases = d;
  const now = Date.now();
  const live = useMemo(() => {
    // For each scope, the newest publication already in effect, and any scheduled ones.
    const m = new Map<string, { live?: Publication; later: Publication[] }>();
    for (const p of [...(d?.pubs ?? [])].sort((a, b) => +new Date(b.effective_at) - +new Date(a.effective_at) || b.id - a.id)) {
      const e = m.get(p.scope) ?? { later: [] };
      if (+new Date(p.effective_at) > now) e.later.push(p);
      else if (!e.live) e.live = p;
      m.set(p.scope, e);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [d, now]);
  const ready = (d?.vs ?? []).filter((v) => v.state === 'approved');
  const vById = (id: number | null) => d?.vs.find((v) => v.id === id);
  const who_ = (u: string | null) => (u ? names[u] ?? u.slice(0, 8) : '');
  const facts = (v: Version) => {
    const run = d?.tests.find((t) => t.scope === v.scope && (t.kind === 'collision' || t.kind === 'movement'));
    const open = (d?.bugs ?? []).filter((b) => !CLOSED.includes(b.status) && v.scope === `surah:${b.surah}`);
    return { run, open, critical: open.filter((b) => b.severity === 'critical' || b.severity === 'high').length };
  };
  const act = async (f: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try {
      await f();
      setMsg({ tone: 'good', text: ok });
      await load();
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };
  const parseAt = (t: string | undefined) => {
    if (!t?.trim()) return null;
    const x = new Date(t.trim().replace(' ', 'T'));
    if (isNaN(+x)) throw new Error('Write the time as 2026-12-01 09:00');
    return x.toISOString();
  };

  return (
    <Page title="Releases" sub="What players get now, what is scheduled, and releases that publish several approved changes together. Only a Super Admin publishes.">
      {err ? <Note tone="bad">{err}</Note> : null}
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
      {!d ? <Busy /> : null}

      <Card title={`Approved and ready (${ready.length})`}>
        {!ready.length ? <Text style={s.small}>No approved versions are waiting. Versions are approved on each world&apos;s or setting&apos;s Versions tab.</Text> : null}
        {ready.map((v) => {
          const f = facts(v);
          const on = pick.includes(v.id);
          const clash = !on && pick.some((id) => vById(id)?.scope === v.scope);
          return (
            <Pressable key={v.id} style={[s.tr, on && { backgroundColor: C.accentSoft }]} onPress={() => !clash && setPick(on ? pick.filter((x) => x !== v.id) : [...pick, v.id])} disabled={!admin || clash} testID={`rel-pick-${v.id}`} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
              <Text style={s.body}>{on ? '☑' : '☐'}</Text>
              <Text style={[s.body, { width: 210, fontWeight: '700' }]}>{name(v.scope)}</Text>
              <Text style={[s.body, { width: 80 }]}>v{v.number}</Text>
              <Pill text={v.validation_ok ? 'checks passed' : 'not checked'} tone={v.validation_ok ? 'good' : 'bad'} />
              <Text style={[s.small, { width: 170 }]}>approved by {who_(v.reviewed_by)}</Text>
              {v.scope.startsWith('surah:') ? <Pill text={f.run ? `movement ${f.run.ok ? 'pass' : 'fail'} ${when(f.run.ran_at)}` : 'no movement run'} tone={f.run ? (f.run.ok ? 'good' : 'bad') : 'warn'} /> : null}
              {f.open.length ? <Pill text={`${f.open.length} open bug(s)${f.critical ? `, ${f.critical} high` : ''}`} tone={f.critical ? 'bad' : 'warn'} /> : null}
              <Text style={[s.small, { flex: 1 }]} numberOfLines={1}>{v.note}</Text>
            </Pressable>
          );
        })}
        {admin && ready.length ? (
          <View style={{ marginTop: 10 }}>
            <Field label="Release title" value={title} onChangeText={setTitle} testID="rel-title" hint="For example: December worlds update" />
            <Field label="Notes" multiline value={notes} onChangeText={setNotes} testID="rel-notes" />
            <Btn label={`Plan a release with ${pick.length} version(s)`} kind="primary" disabled={!pick.length || title.trim().length < 3} onPress={() => act(async () => (await createRelease(title.trim(), notes, pick), setPick([]), setTitle(''), setNotes('')), 'Release planned. Publish it below when ready.')} testID="rel-create" />
          </View>
        ) : null}
      </Card>

      <Card title="Releases">
        {!d?.rels.length ? <Text style={s.small}>No releases yet.</Text> : null}
        {d?.rels.map((r) => (
          <View key={r.id} style={[s.tr, { flexWrap: 'wrap' }]} testID={`rel-${r.id}`}>
            <Pill text={r.state} tone={r.state === 'published' ? 'good' : r.state === 'planned' ? 'accent' : 'plain'} />
            <Text style={[s.body, { width: 220, fontWeight: '700' }]}>{r.title}</Text>
            <Text style={[s.small, { flex: 1 }]}>
              {r.versions.map((id) => {
                const v = vById(id);
                return v ? `${name(v.scope)} v${v.number}` : `version ${id}`;
              }).join(' · ')}
            </Text>
            <Text style={s.small}>
              {r.state === 'published' ? `${+new Date(r.effective_at ?? 0) > now ? 'goes live' : 'live since'} ${when(r.effective_at)} by ${who_(r.published_by)}` : r.state === 'undone' ? `undone ${when(r.undone_at)}` : `planned ${when(r.created_at)}`}
            </Text>
            {admin && r.state === 'planned' ? (
              <View style={[s.row, { width: '100%' }]}>
                <TextInput style={[s.input, { width: 190 }]} placeholder="Now, or 2026-12-01 09:00" value={at[r.id] ?? ''} onChangeText={(t) => setAt({ ...at, [r.id]: t })} accessibilityLabel="When to publish" testID={`rel-${r.id}-at`} />
                <Btn small kind="primary" label={at[r.id]?.trim() ? 'Schedule' : 'Publish now'} onPress={() => act(() => publishRelease(r.id, parseAt(at[r.id])), at[r.id]?.trim() ? 'Release scheduled.' : 'Release published. Players get it now.')} testID={`rel-${r.id}-publish`} />
                <Btn small kind="quiet" label="Cancel" onPress={() => act(() => cancelRelease(r.id), 'Release cancelled.')} testID={`rel-${r.id}-cancel`} />
              </View>
            ) : null}
            {admin && r.state === 'published' ? (
              <View style={[s.row, { width: '100%' }]}>
                <Btn small kind="danger" label="Undo this release" onPress={() => act(() => undoRelease(r.id), 'Release undone: each world and setting is back to what was live before it. Player progress was not touched.')} testID={`rel-${r.id}-undo`} />
                <Text style={s.small}>Goes back to: {Object.entries(r.previous).map(([k, v]) => `${name(k)} ${v ? `v${vById(v)?.number ?? '?'}` : 'built-in'}`).join(' · ')}</Text>
              </View>
            ) : null}
            {r.notes ? <Text style={[s.small, { width: '100%' }]}>{r.notes}</Text> : null}
          </View>
        ))}
      </Card>

      <Card title={`Live now (${live.length} worlds and settings with studio changes)`}>
        <Text style={[s.small, { marginBottom: 6 }]}>Everything else is the content built into the app.</Text>
        {live.map(([scope, e]) => {
          const v = vById(e.live?.version_id ?? null);
          const href = page(scope);
          return (
            <Pressable key={scope} style={s.tr} onPress={() => href && router.push(href as any)} testID={`live-${scope}`}>
              <Text style={[s.body, { width: 220, fontWeight: '700' }]}>{name(scope)}</Text>
              <Text style={[s.body, { width: 160 }]}>{e.live ? (e.live.action === 'unpublish' ? 'built-in' : `v${v?.number ?? '?'}`) : 'built-in'}{e.live?.action === 'rollback' ? ' (rolled back)' : ''}</Text>
              <Text style={[s.small, { flex: 1 }]}>{e.live ? `since ${when(e.live.effective_at)}${e.live.note ? ` · ${e.live.note}` : ''}` : ''}</Text>
              {e.later.map((p) => (
                <Pill key={p.id} text={`scheduled v${vById(p.version_id)?.number ?? '?'} ${when(p.effective_at)}`} tone="accent" />
              ))}
            </Pressable>
          );
        })}
      </Card>
    </Page>
  );
}
