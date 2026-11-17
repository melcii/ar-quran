// Bug Control Center: every bug filed by staff, by the automated world checks
// and from player reports, in one list. Filter, triage (status, severity,
// whether it needs a developer), see the history, and jump straight to the
// no-code tool that can fix it. Player reports are child-safe: a world, one of
// six fixed choices and a screen size; they can be grouped into bugs here.
// Some bugs need source-code changes; this page says so instead of hiding it.
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { getSurah } from '@/content/quran';
import { PROBLEM_CHOICES } from '@/studio/ReportProblem';
import { bugFromProblems, bugs, fileBug, playerProblems, staff, updateBug, type Bug, type PlayerProblem } from '@/studio/session';
import { Btn, Busy, C, Card, Field, Note, Page, Pill, s, when } from '@/studio/ui';

const STATUSES = ['new', 'confirmed', 'in_progress', 'needs_developer', 'fixed', 'wont_fix', 'duplicate'] as const;
const CLOSED = ['fixed', 'wont_fix', 'duplicate'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const CATEGORIES = ['movement', 'collision', 'activity', 'story', 'quran_content', 'audio', 'save', 'visual', 'multiplayer', 'performance', 'other'] as const;
const label = (x: string) => x.replace(/_/g, ' ');
const sevTone = (v: string) => (v === 'critical' ? 'bad' : v === 'high' ? 'warn' : 'plain') as 'bad' | 'warn' | 'plain';

/** Where a bug of this kind can be fixed without code, and when it cannot. */
function fixHint(b: Bug): { text: string; href?: string; go?: string } {
  const w = b.surah ? `/admin/surah/${b.surah}` : null;
  switch (b.category) {
    case 'movement':
    case 'collision':
      return { text: 'Often fixable without code: move the player start, a rock, tree or building in the World editor, then run its collision test. If the shape of the ground or a building itself is wrong, it needs a developer.', href: b.surah ? `/admin/world/${b.surah}` : undefined, go: 'Open World editor' };
    case 'activity':
      return { text: 'Text, places, order and links of activities can be changed in Activities & logic. A broken activity type (how it behaves) needs a developer.', href: w ? `${w}?tab=activities` : undefined, go: 'Open Activities & logic' };
    case 'story':
      return { text: 'Story wording is edited in the Story editor and goes through review.', href: w ?? undefined, go: 'Open Story editor' };
    case 'quran_content':
      return { text: 'The Arabic Quran text is locked and cannot be changed here. Which ayahs a world links to is changed in the Story editor and needs a Quran Content Reviewer. A wrong Arabic source text needs a developer and a scholar.', href: w ?? undefined, go: 'Open Story editor' };
    case 'audio':
      return { text: 'Narration recordings are replaced or retired in the Audio Studio. How sounds are played needs a developer.', href: '/admin/audio', go: 'Open Audio Studio' };
    case 'visual':
      return { text: 'Placement and visibility of pieces can be changed in the World editor. Models, materials and lighting need a developer.', href: b.surah ? `/admin/world/${b.surah}` : undefined, go: 'Open World editor' };
    case 'save':
    case 'multiplayer':
    case 'performance':
      return { text: 'Saving, multiplayer and speed are in the game code: this needs a developer. Mark it as needing code and add the steps.' };
    default:
      return { text: b.surah ? 'If a recent change caused it, roll the world back in Versions & publishing (player progress is never touched).' : 'Look at the details and decide where it belongs.', href: w ? `${w}?tab=versions` : undefined, go: 'Open Versions & publishing' };
  }
}

export default function Bugs() {
  const [list, setList] = useState<Bug[] | null>(null);
  const [pp, setPp] = useState<PlayerProblem[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [f, setF] = useState({ status: 'open', severity: 'all', category: 'all', source: 'all', surah: '' });
  const [sel, setSel] = useState<number | null>(null);
  const [filing, setFiling] = useState(false);
  const load = useCallback(async () => {
    try {
      const [b, p] = await Promise.all([bugs(), playerProblems()]);
      setList(b);
      setPp(p);
      setErr('');
    } catch (e: any) {
      setErr(e.message);
    }
  }, []);
  useEffect(() => {
    load();
    staff().then((x) => setNames(Object.fromEntries(x.map((y) => [y.user_id, y.email])))).catch(() => {});
  }, [load]);
  (globalThis as any).__studioBugs = { list, pp };

  const shown = useMemo(
    () =>
      (list ?? []).filter(
        (b) =>
          (f.status === 'all' || (f.status === 'open' ? !CLOSED.includes(b.status) : b.status === f.status)) &&
          (f.severity === 'all' || b.severity === f.severity) &&
          (f.category === 'all' || b.category === f.category) &&
          (f.source === 'all' || b.source === f.source) &&
          (!f.surah || String(b.surah ?? '') === f.surah.trim()),
      ),
    [list, f],
  );
  const bug = list?.find((b) => b.id === sel) ?? null;
  const open = (list ?? []).filter((b) => !CLOSED.includes(b.status));
  const unlinked = pp.filter((p) => p.bug_id == null);
  const groups = useMemo(() => {
    const m = new Map<string, { surah: number | null; category: string; ids: number[]; last: string }>();
    for (const p of unlinked) {
      const k = `${p.surah ?? 0}-${p.category}`;
      const g = m.get(k) ?? { surah: p.surah, category: p.category, ids: [], last: p.created_at };
      g.ids.push(p.id);
      if (p.created_at > g.last) g.last = p.created_at;
      m.set(k, g);
    }
    return [...m.values()].sort((a, b) => b.ids.length - a.ids.length);
  }, [unlinked]);

  const act = async (what: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try {
      await what();
      setMsg({ tone: 'good', text: ok });
      await load();
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };

  const chips = (key: keyof typeof f, opts: readonly string[]) => (
    <View style={[s.row, { flexWrap: 'wrap', marginBottom: 6 }]}>
      {opts.map((o) => (
        <Btn key={o} small label={label(o)} kind={f[key] === o ? 'primary' : 'plain'} onPress={() => setF({ ...f, [key]: o })} testID={`bf-${key}-${o}`} />
      ))}
    </View>
  );

  return (
    <Page
      title="Bug Control Center"
      sub="Bugs from staff, from the automated world checks and from player reports. Counts are read from the database."
      actions={<Btn label={filing ? 'Close form' : 'File a bug'} kind="primary" onPress={() => setFiling(!filing)} testID="bug-file-open" />}
    >
      {err ? <Note tone="bad">{err}</Note> : null}
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
      {!list ? <Busy /> : null}
      {list ? (
        <View style={[s.row, { flexWrap: 'wrap', marginBottom: 12 }]}>
          <Pill text={`${open.length} open`} tone={open.length ? 'warn' : 'good'} />
          <Pill text={`${open.filter((b) => b.severity === 'critical').length} critical`} tone={open.some((b) => b.severity === 'critical') ? 'bad' : 'plain'} />
          <Pill text={`${open.filter((b) => b.needs_code).length} need a developer`} />
          <Pill text={`${open.filter((b) => b.source === 'automated').length} from automated checks`} />
          <Pill text={`${unlinked.length} player reports not yet grouped`} tone={unlinked.length ? 'accent' : 'plain'} />
        </View>
      ) : null}

      {filing ? <FileForm onDone={(id) => (setFiling(false), setSel(id), load())} /> : null}

      <Card title="Player reports" right={<Text style={s.small}>Child-safe: a world, one fixed choice, a screen size</Text>}>
        {!groups.length ? <Text style={s.small}>No ungrouped player reports.</Text> : null}
        {groups.map((g) => {
          const key = `${g.surah ?? 0}-${g.category}`;
          const choice = PROBLEM_CHOICES.find((c) => c.id === g.category);
          return (
            <View key={key} style={s.tr} testID={`pp-${key}`}>
              <Text style={[s.body, { width: 220 }]}>{g.surah ? `${g.surah}. ${getSurah(g.surah)?.nameTransliterated ?? ''}` : 'No world'}</Text>
              <Text style={[s.body, { flex: 1 }]}>
                {choice?.icon} “{choice?.label ?? g.category}”
              </Text>
              <Pill text={`${g.ids.length} report${g.ids.length === 1 ? '' : 's'}`} tone={g.ids.length >= 5 ? 'warn' : 'plain'} />
              <Text style={[s.small, { width: 140 }]}>last {when(g.last)}</Text>
              <Btn small label="Make a bug" onPress={() => act(async () => setSel(await bugFromProblems(g.ids, null, `Players: “${choice?.label ?? g.category}” in surah ${g.surah ?? '?'}`)), 'Bug made from the reports.')} testID={`pp-${key}-new`} />
              <Btn small label={bug ? `Add to bug #${bug.id}` : 'Add to selected bug'} disabled={!bug} onPress={() => bug && act(() => bugFromProblems(g.ids, bug.id, ''), `Reports added to bug #${bug.id}.`)} testID={`pp-${key}-link`} />
            </View>
          );
        })}
      </Card>

      <Card title="Bugs">
        {chips('status', ['open', 'all', ...STATUSES])}
        {chips('severity', ['all', ...SEVERITIES])}
        {chips('source', ['all', 'staff', 'player', 'automated'])}
        <View style={[s.row, { marginBottom: 8 }]}>
          <Text style={s.label}>Category</Text>
          <View style={[s.row, { flexWrap: 'wrap', flex: 1 }]}>
            {['all', ...CATEGORIES].map((o) => (
              <Btn key={o} small label={label(o)} kind={f.category === o ? 'primary' : 'quiet'} onPress={() => setF({ ...f, category: o })} testID={`bf-category-${o}`} />
            ))}
          </View>
          <TextInput style={[s.input, { width: 90 }]} placeholder="Surah no." value={f.surah} onChangeText={(t) => setF({ ...f, surah: t.replace(/\D/g, '') })} accessibilityLabel="Filter by surah" testID="bf-surah" />
        </View>
        <Text style={[s.small, { marginBottom: 6 }]}>
          Showing {shown.length} of {list?.length ?? 0}.
        </Text>
        {shown.map((b) => (
          <Pressable key={b.id} onPress={() => setSel(b.id === sel ? null : b.id)} style={[s.tr, b.id === sel && { backgroundColor: C.accentSoft }]} testID={`bug-${b.id}`} accessibilityRole="button">
            <Text style={[s.small, { width: 44 }]}>#{b.id}</Text>
            <Pill text={b.severity} tone={sevTone(b.severity)} />
            <Text style={[s.body, { flex: 1, fontWeight: '700' }]} numberOfLines={1}>
              {b.title}
            </Text>
            <Text style={[s.small, { width: 70 }]}>{b.surah ? `surah ${b.surah}` : ''}</Text>
            <Text style={[s.small, { width: 100 }]}>{label(b.category)}</Text>
            <Pill text={label(b.status)} tone={CLOSED.includes(b.status) ? 'good' : b.status === 'needs_developer' ? 'warn' : 'accent'} />
            <Text style={[s.small, { width: 70 }]}>{b.source}</Text>
            {b.needs_code ? <Pill text="needs code" tone="warn" /> : null}
            <Text style={[s.small, { width: 130 }]}>{when(b.discovered_at)}</Text>
          </Pressable>
        ))}
      </Card>

      {bug ? <BugDetail key={bug.id} b={bug} names={names} pp={pp.filter((p) => p.bug_id === bug.id)} onSaved={load} /> : null}
    </Page>
  );
}

function FileForm({ onDone }: { onDone: (id: number) => void }) {
  const [v, setV] = useState({ title: '', description: '', steps: '', surah: '', scene: '', object: '', category: 'other', severity: 'medium', needs_code: false });
  const [err, setErr] = useState('');
  const submit = async () => {
    setErr('');
    try {
      const n = v.surah ? Number(v.surah) : null;
      if (n != null && !(n >= 1 && n <= 114)) throw new Error('The surah number must be between 1 and 114.');
      const device = Platform.OS === 'web' ? { screen: `${window.innerWidth}x${window.innerHeight}`, agent: navigator.userAgent.slice(0, 200) } : { os: Platform.OS };
      const id = await fileBug({ title: v.title.trim(), description: v.description, steps: v.steps, surah: n, scene: v.scene, object: v.object, category: v.category, severity: v.severity as Bug['severity'], needs_code: v.needs_code, device });
      onDone(id);
    } catch (e: any) {
      setErr(e.message);
    }
  };
  return (
    <Card title="File a bug">
      <Field label="Title" value={v.title} onChangeText={(t) => setV({ ...v, title: t })} testID="nb-title" hint="3 to 200 characters" />
      <View style={[s.row, { alignItems: 'flex-start' }]}>
        <View style={{ width: 120 }}>
          <Field label="Surah" value={v.surah} onChangeText={(t) => setV({ ...v, surah: t.replace(/\D/g, '') })} testID="nb-surah" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Scene or place" value={v.scene} onChangeText={(t) => setV({ ...v, scene: t })} testID="nb-scene" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Object" value={v.object} onChangeText={(t) => setV({ ...v, object: t })} testID="nb-object" />
        </View>
      </View>
      <Field label="What happens" multiline value={v.description} onChangeText={(t) => setV({ ...v, description: t })} testID="nb-description" />
      <Field label="Steps to see it" multiline value={v.steps} onChangeText={(t) => setV({ ...v, steps: t })} testID="nb-steps" />
      <Text style={s.label}>Category</Text>
      <View style={[s.row, { flexWrap: 'wrap', marginBottom: 8 }]}>
        {CATEGORIES.map((c) => (
          <Btn key={c} small label={label(c)} kind={v.category === c ? 'primary' : 'plain'} onPress={() => setV({ ...v, category: c })} testID={`nb-category-${c}`} />
        ))}
      </View>
      <Text style={s.label}>Severity</Text>
      <View style={[s.row, { marginBottom: 8 }]}>
        {SEVERITIES.map((c) => (
          <Btn key={c} small label={c} kind={v.severity === c ? 'primary' : 'plain'} onPress={() => setV({ ...v, severity: c })} testID={`nb-severity-${c}`} />
        ))}
        <Btn small label={`${v.needs_code ? '☑' : '☐'} Needs a developer`} onPress={() => setV({ ...v, needs_code: !v.needs_code })} testID="nb-needs-code" />
      </View>
      {err ? <Note tone="bad">{err}</Note> : null}
      <Btn label="File the bug" kind="primary" onPress={submit} disabled={v.title.trim().length < 3} testID="nb-submit" />
    </Card>
  );
}

function BugDetail({ b, names, pp, onSaved }: { b: Bug; names: Record<string, string>; pp: PlayerProblem[]; onSaved: () => void }) {
  const [v, setV] = useState({ status: b.status, severity: b.severity, category: b.category, needs_code: b.needs_code, resolution: b.resolution });
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [raw, setRaw] = useState(false);
  const dirty = v.status !== b.status || v.severity !== b.severity || v.category !== b.category || v.needs_code !== b.needs_code || v.resolution !== b.resolution;
  const hint = fixHint({ ...b, category: v.category });
  const history: { at: string; by: string | null; from: string; to: string }[] = b.diagnostics?.history ?? [];
  const who = (u: string | null) => (u ? names[u] ?? u.slice(0, 8) : 'unknown');
  const save = async () => {
    setMsg(null);
    try {
      const change: Record<string, unknown> = {};
      for (const k of ['status', 'severity', 'category', 'needs_code', 'resolution'] as const) if (v[k] !== b[k]) change[k] = v[k];
      await updateBug(b.id, change as any);
      setMsg({ tone: 'good', text: 'Saved.' });
      onSaved();
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };
  const diag = { ...(b.diagnostics ?? {}) };
  delete diag.history;
  return (
    <Card title={`Bug #${b.id}: ${b.title}`} right={<Pill text={b.source} />}>
      <Text style={[s.small, { marginBottom: 8 }]}>
        Filed {when(b.discovered_at)} by {b.source === 'automated' ? 'an automated check' : b.source === 'player' ? 'player reports' : who(b.reported_by)}
        {b.surah ? ` · surah ${b.surah}. ${getSurah(b.surah)?.nameTransliterated ?? ''}` : ''}
        {b.scene ? ` · ${b.scene}` : ''}
        {b.object ? ` · ${b.object}` : ''}
        {b.resolved_at ? ` · closed ${when(b.resolved_at)}` : ''}
      </Text>
      {b.description ? <Text style={[s.body, { marginBottom: 8 }]}>{b.description}</Text> : null}
      {b.steps ? (
        <>
          <Text style={s.label}>Steps</Text>
          <Text style={[s.body, { marginBottom: 8 }]}>{b.steps}</Text>
        </>
      ) : null}
      {b.diagnostics?.summary ? <Note>{String(b.diagnostics.summary)}</Note> : null}
      {pp.length ? <Text style={[s.small, { marginBottom: 8 }]}>{pp.length} player report(s) are linked: {Object.entries(pp.reduce((m: Record<string, number>, p) => ((m[p.category] = (m[p.category] ?? 0) + 1), m), {})).map(([k, n]) => `${label(k)} ×${n}`).join(', ')}.</Text> : null}

      <Note tone={v.needs_code || ['save', 'multiplayer', 'performance'].includes(v.category) ? 'warn' : 'plain'}>
        <Text style={[s.body, { color: C.ink }]}>{hint.text}</Text>
        {hint.href ? (
          <View style={[s.row, { marginTop: 6 }]}>
            <Btn small label={hint.go ?? 'Open'} onPress={() => router.push(hint.href as any)} testID="bug-fix-open" />
            {b.surah ? <Btn small label="Play test this world" onPress={() => Platform.OS === 'web' && window.open(`/adventure/${b.surah}?studio=draft`, '_blank')} testID="bug-playtest" /> : null}
            {b.surah ? <Btn small kind="quiet" label="Versions & rollback" onPress={() => router.push(`/admin/surah/${b.surah}?tab=versions` as any)} testID="bug-versions" /> : null}
          </View>
        ) : null}
      </Note>

      <Text style={s.label}>Status</Text>
      <View style={[s.row, { flexWrap: 'wrap', marginBottom: 8 }]}>
        {STATUSES.map((x) => (
          <Btn key={x} small label={label(x)} kind={v.status === x ? 'primary' : 'plain'} onPress={() => setV({ ...v, status: x, needs_code: x === 'needs_developer' ? true : v.needs_code })} testID={`bd-status-${x}`} />
        ))}
      </View>
      <Text style={s.label}>Severity and category</Text>
      <View style={[s.row, { flexWrap: 'wrap', marginBottom: 8 }]}>
        {SEVERITIES.map((x) => (
          <Btn key={x} small label={x} kind={v.severity === x ? 'primary' : 'plain'} onPress={() => setV({ ...v, severity: x })} testID={`bd-severity-${x}`} />
        ))}
        <Text style={s.small}> · </Text>
        {CATEGORIES.map((x) => (
          <Btn key={x} small label={label(x)} kind={v.category === x ? 'primary' : 'quiet'} onPress={() => setV({ ...v, category: x })} testID={`bd-category-${x}`} />
        ))}
      </View>
      <View style={[s.row, { marginBottom: 8 }]}>
        <Btn small label={`${v.needs_code ? '☑' : '☐'} Needs a developer (source-code change)`} onPress={() => setV({ ...v, needs_code: !v.needs_code })} testID="bd-needs-code" />
      </View>
      <Field label="Resolution" multiline value={v.resolution} onChangeText={(t) => setV({ ...v, resolution: t })} testID="bd-resolution" hint="What was done, or why it is not fixed." />
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
      <Btn label="Save changes" kind="primary" onPress={save} disabled={!dirty} testID="bd-save" />

      <Text style={[s.label, { marginTop: 14 }]}>History</Text>
      {!history.length ? <Text style={s.small}>No status changes yet.</Text> : null}
      {history.map((h, i) => (
        <Text key={i} style={s.small} testID={`bd-history-${i}`}>
          {when(h.at)}: {label(h.from)} → {label(h.to)} by {who(h.by)}
        </Text>
      ))}
      {Object.keys(diag).length ? (
        <>
          <Btn small kind="quiet" label={raw ? 'Hide diagnostics' : 'Show diagnostics'} onPress={() => setRaw(!raw)} testID="bd-diag" />
          {raw ? <Text style={[s.small, { fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }]}>{JSON.stringify(diag, null, 2).slice(0, 6000)}</Text> : null}
        </>
      ) : null}
    </Card>
  );
}
