// World health checks: for each world, exactly as players get it now (or as
// its draft would be), run the content checks and the game's own collision
// and movement validator on the same physics space the game builds. Results
// are recorded as test runs; failures can be filed as bugs in one click, and
// the one problem with a safe automatic fix (a blocked player start) can be
// fixed in the world's draft, which then goes through review as usual.
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { WORLDS } from '@/adventure/worlds';
import { getSurah } from '@/content/quran';
import { useStudio } from '@/studio/context';
import { checkWorld, type Health } from '@/studio/health';
import type { Overlay } from '@/studio/overlay';
import { bugs, fileBug, getDraft, has, liveDoc, recordTest, saveDraft, type Bug } from '@/studio/session';
import { Btn, C, Card, Note, Page, Pill, s } from '@/studio/ui';

type Row = Health & { mode: 'published' | 'draft'; hasDoc: boolean; recorded: boolean; bug?: number };
const ALL = Object.keys(WORLDS).map(Number).sort((a, b) => a - b);

function parseRange(t: string): number[] {
  const out = new Set<number>();
  for (const part of t.split(',')) {
    const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (WORLDS[i]) out.add(i);
  }
  return [...out].sort((a, b) => a - b);
}

/** A compact copy of a report for the database (the full lists can be long). */
function compact(h: Health) {
  const r = h.collision;
  const cut = <T,>(a: T[]) => a.slice(0, 25);
  return {
    spawn: r.spawn,
    openStart: h.openStart,
    solids: { tested: r.solids.tested, entered: cut(r.solids.entered) },
    slopes: { tested: r.slopes.tested, climbs: cut(r.slopes.climbs) },
    edge: { tested: r.edge.tested, escaped: cut(r.edge.escaped) },
    paths: { tested: r.paths.tested, walked: r.paths.walked, stuck: cut(r.paths.stuck) },
    zones: { tested: r.zones.tested, unreachable: cut(r.zones.unreachable) },
    content: h.content.slice(0, 40),
    checker: 'studio/health checkWorld (adventure/terrain + land + space, physics/validate validateSpace, studio/overlay validateOverlay)',
  };
}

export default function HealthPage() {
  const { who } = useStudio();
  const [range, setRange] = useState('1-114');
  const [mode, setMode] = useState<'published' | 'draft'>('published');
  const [record, setRecord] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState<{ done: number; total: number } | null>(null);
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad' | 'warn'; text: string } | null>(null);
  const stop = useRef(false);
  const canRecord = has(who, 'game_tester') || has(who, 'world_editor') || has(who, 'story_editor') || has(who, 'quran_reviewer');
  const canFix = has(who, 'world_editor');
  (globalThis as any).__studioHealth = { rows, running };

  const run = async () => {
    const list = parseRange(range);
    if (!list.length) return setMsg({ tone: 'bad', text: 'Choose worlds, for example 1-114, or 2, 5, 19.' });
    setMsg(null);
    setRows([]);
    stop.current = false;
    setRunning({ done: 0, total: list.length });
    const out: Row[] = [];
    let recordErr = '';
    for (const n of list) {
      if (stop.current) break;
      const scope = `surah:${n}`;
      let doc: Overlay | null = null;
      try {
        doc = mode === 'draft' ? ((await getDraft(scope))?.doc ?? (await liveDoc(scope))) : await liveDoc(scope);
      } catch {
        doc = null;
      }
      const h = await checkWorld(n, WORLDS[n], doc);
      const row: Row = { ...h, mode, hasDoc: !!doc, recorded: false };
      if (record && canRecord && !recordErr) {
        try {
          await recordTest({ scope, kind: 'collision', ok: h.ok, summary: `World health (${mode === 'draft' ? 'draft' : 'as players get it'}): ${h.summary}`, report: compact(h) });
          row.recorded = true;
        } catch (e: any) {
          recordErr = e.message;
        }
      }
      out.push(row);
      setRows([...out]);
      setRunning({ done: out.length, total: list.length });
      await new Promise((r) => setTimeout(r, 0));
    }
    setRunning(null);
    const bad = out.filter((r) => !r.ok).length;
    setMsg({
      tone: recordErr ? 'warn' : bad ? 'warn' : 'good',
      text: `${out.length} world(s) checked; ${bad} with problems.${record ? (recordErr ? ` Results were not recorded: ${recordErr}` : canRecord ? ' Results recorded in Test results.' : ' Results not recorded: recording needs a tester or editor role.') : ''}`,
    });
  };

  const openBugFor = (n: number, list: Bug[]) => list.find((b) => b.surah === n && b.source === 'automated' && b.diagnostics?.check === 'world-health' && !['fixed', 'wont_fix', 'duplicate'].includes(b.status));
  const file = async (targets: Row[]) => {
    setMsg(null);
    try {
      const existing = await bugs();
      let made = 0;
      let skipped = 0;
      const next = [...rows];
      for (const r of targets) {
        const old = openBugFor(r.n, existing);
        const i = next.findIndex((x) => x.n === r.n);
        if (old) {
          skipped++;
          next[i] = { ...next[i], bug: old.id };
          continue;
        }
        const c = r.collision;
        const movement = !c.spawn.ok || c.paths.stuck.length || c.zones.unreachable.length;
        const id = await fileBug({
          title: `World health: surah ${r.n} ${getSurah(r.n)?.nameTransliterated ?? ''} ${!c.spawn.ok ? 'start is blocked' : c.solids.entered.length ? 'walk-through solids' : c.edge.escaped.length ? 'way off the world edge' : c.slopes.climbs.length ? 'climbable cliffs' : c.paths.stuck.length ? 'path blocked' : c.zones.unreachable.length ? 'activity spot out of reach' : 'content problem'}`.slice(0, 200),
          surah: r.n,
          category: r.content.some((p) => p.level === 'error') && c.ok ? 'story' : movement ? 'movement' : 'collision',
          severity: !c.spawn.ok || c.edge.escaped.length || c.solids.entered.length ? 'high' : 'medium',
          description: `Found by the automated world health check (${r.mode === 'draft' ? 'draft' : 'as players get it'}). ${r.summary}.`,
          diagnostics: { check: 'world-health', summary: r.summary, mode: r.mode, ...compact(r) },
          source: 'automated',
        } as any);
        made++;
        next[i] = { ...next[i], bug: id };
      }
      setRows(next);
      setMsg({ tone: 'good', text: `${made} bug(s) filed${skipped ? `; ${skipped} world(s) already had an open health bug` : ''}.` });
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };

  const fixStart = async (r: Row) => {
    if (!r.openStart) return;
    setMsg(null);
    const scope = `surah:${r.n}`;
    try {
      const d = await getDraft(scope);
      const doc: Overlay = d?.doc ?? (await liveDoc(scope)) ?? { v: 1 };
      const next: Overlay = { ...doc, set: { ...(doc.set ?? {}), start: r.openStart } };
      await saveDraft(scope, next, d?.revision ?? 0);
      setMsg({ tone: 'good', text: `Surah ${r.n}: the player start was moved to the nearest open spot (${r.openStart.join(', ')}) in the draft. Run the check on the draft, then submit it for review.` });
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };

  const bad = rows.filter((r) => !r.ok);
  const cell = (label: string, n: number, of?: number) => <Pill text={`${label} ${n}${of != null ? `/${of}` : ''}`} tone={n ? 'bad' : 'good'} />;
  return (
    <Page title="World health checks" sub="The game's own collision and movement validator and the content checks, run here in the browser on the exact world players get. Nothing is estimated.">
      <Card title="Run">
        <View style={[s.row, { flexWrap: 'wrap', marginBottom: 8 }]}>
          <Text style={s.label}>Worlds</Text>
          <TextInput style={[s.input, { width: 160 }]} value={range} onChangeText={setRange} accessibilityLabel="Worlds to check" testID="hc-range" />
          <Btn small label="All 114" onPress={() => setRange('1-114')} />
          <Btn small label="As players get it" kind={mode === 'published' ? 'primary' : 'plain'} onPress={() => setMode('published')} testID="hc-mode-published" />
          <Btn small label="Drafts" kind={mode === 'draft' ? 'primary' : 'plain'} onPress={() => setMode('draft')} testID="hc-mode-draft" />
          <Btn small label={`${record ? '☑' : '☐'} Record results`} onPress={() => setRecord(!record)} testID="hc-record" />
        </View>
        <View style={s.row}>
          {running ? <Btn label="Stop" kind="danger" onPress={() => (stop.current = true)} testID="hc-stop" /> : <Btn label="Run checks" kind="primary" onPress={run} testID="hc-run" />}
          {running ? <Text style={s.body} testID="hc-progress">Checked {running.done} of {running.total}…</Text> : null}
          {!running && bad.length ? <Btn label={`File bugs for ${bad.length} world(s) with problems`} onPress={() => file(bad)} testID="hc-file-all" /> : null}
        </View>
        <Text style={[s.small, { marginTop: 8 }]}>
          What it does: builds each world's ground, buildings, rocks and trees into the physics space, then checks the player start, runs at every solid from eight sides, tries to climb steep slopes, runs at the world edge, walks every footpath and looks for open ground near every activity spot. It does not play the activities themselves; the full play-test run does that. Each world takes roughly 15 to 40 seconds (about 20 s in our headless test browser), so all 114 take about 40 minutes; keep this tab open, or press Stop.
        </Text>
      </Card>
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
      {rows.length ? (
        <Card title={`Results (${rows.length - bad.length} healthy, ${bad.length} with problems)`}>
          {rows.map((r) => {
            const c = r.collision;
            const errs = r.content.filter((p) => p.level === 'error');
            return (
              <View key={r.n} style={[s.tr, { flexWrap: 'wrap' }]} testID={`hc-row-${r.n}`}>
                <Pill text={r.ok ? 'healthy' : 'problems'} tone={r.ok ? 'good' : 'bad'} />
                <Text style={[s.body, { width: 190 }]}>
                  {r.n}. {getSurah(r.n)?.nameTransliterated}
                  {r.hasDoc ? ' (studio changes)' : ''}
                </Text>
                <Pill text={errs.length ? `content ${errs.length} error(s)` : 'content ok'} tone={errs.length ? 'bad' : 'good'} />
                <Pill text={c.spawn.ok ? 'start ok' : 'start blocked'} tone={c.spawn.ok ? 'good' : 'bad'} />
                {cell('solids entered', c.solids.entered.length, c.solids.tested)}
                {cell('cliffs', c.slopes.climbs.length)}
                {cell('edge', c.edge.escaped.length)}
                {cell('paths stuck', c.paths.stuck.length, c.paths.tested)}
                {cell('spots out of reach', c.zones.unreachable.length, c.zones.tested)}
                <Text style={s.small}>{r.ms} ms{r.recorded ? ' · recorded' : ''}</Text>
                {!r.ok ? (
                  <View style={[s.row, { width: '100%', paddingLeft: 4, flexWrap: 'wrap' }]}>
                    {c.solids.entered.slice(0, 3).map((e, i) => (
                      <Text key={`s${i}`} style={[s.small, { color: C.bad }]}>walked into {e.tag} at {e.x.toFixed(1)}, {e.z.toFixed(1)};</Text>
                    ))}
                    {c.zones.unreachable.slice(0, 3).map((e, i) => (
                      <Text key={`z${i}`} style={[s.small, { color: C.bad }]}>no open ground near {e.key};</Text>
                    ))}
                    {c.paths.stuck.slice(0, 2).map((e, i) => (
                      <Text key={`p${i}`} style={[s.small, { color: C.bad }]}>path {e.path + 1} blocked at {e.x.toFixed(1)}, {e.z.toFixed(1)};</Text>
                    ))}
                    {errs.slice(0, 3).map((p, i) => (
                      <Text key={`c${i}`} style={[s.small, { color: C.bad }]}>{p.message};</Text>
                    ))}
                    {r.openStart && canFix ? <Btn small kind="primary" label={`Safe fix: move start to ${r.openStart.join(', ')} (draft)`} onPress={() => fixStart(r)} testID={`hc-fix-start-${r.n}`} /> : null}
                    <Btn small label="Open World editor" onPress={() => router.push(`/admin/world/${r.n}` as any)} testID={`hc-world-${r.n}`} />
                    {r.bug ? <Btn small kind="quiet" label={`Bug #${r.bug}`} onPress={() => router.push('/admin/bugs' as any)} /> : <Btn small label="File a bug" onPress={() => file([r])} testID={`hc-file-${r.n}`} />}
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>
      ) : null}
    </Page>
  );
}
