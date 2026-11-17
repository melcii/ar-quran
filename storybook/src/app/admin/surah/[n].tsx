// One surah's management page: its content record, the no-code story
// editor, versions with review / publish / rollback, and its test results.
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { WORLDS } from '@/adventure/worlds';
import type { Task, WorldDef } from '@/adventure/types';
import { getSurah, getVerse } from '@/content/quran';
import records from '@content/worlds/studio-records.json';
import { useStudio } from '@/studio/context';
import { physicsRuns, quranIndex, statusOf } from '@/studio/facts';
import { applyOverlay, changedKeys, fieldsOf, getAt, parsePath, quranLinked, validateOverlay, type Field, type Overlay, type Problem } from '@/studio/overlay';
import {
  has,
  hasExact,
  liveDoc,
  publications,
  publish,
  recordTest,
  review,
  rollback,
  staff,
  submitDraft,
  discardDraft,
  testRuns,
  versions,
  type Publication,
  type TestRun,
  type Version,
} from '@/studio/session';
import { useDraft } from '@/studio/useDraft';
import { Btn, Busy, C, Card, Field as Input, Note, Page, Pill, s, when } from '@/studio/ui';

type Rec = (typeof records.records)[number];

function openGame(n: number, mode: 'draft' | 'published' | 'built-in') {
  const url = `/adventure/${n}?studio=${mode}`;
  if (Platform.OS === 'web') window.open(url, '_blank');
}

/* ------------------------------ record ------------------------------ */

function Overview({ n, def, rec, doc, edit }: { n: number; def: WorldDef | undefined; rec: Rec; doc: Overlay; edit: (k: string, v: string) => void }) {
  const sur = getSurah(n)!;
  const st = statusOf(n);
  const ph = physicsRuns.worlds[String(n)];
  const r = doc.record ?? {};
  const val = (k: string, fallback: string) => (typeof r[k] === 'string' ? (r[k] as string) : fallback);
  const resolved = def ? applyOverlay(def, doc).def : undefined;
  return (
    <View>
      <Card title="Content record">
        <View style={[s.row, { alignItems: 'flex-start', gap: 28 }]}>
          <View style={{ minWidth: 220 }}>
            <Text style={s.label}>Surah</Text>
            <Text style={s.body}>
              {sur.number}. {sur.nameTransliterated} ({sur.nameMeaning})
            </Text>
            <Text style={[s.body, { fontFamily: 'AmiriQuran_400Regular', fontSize: 22 }]}>{sur.nameArabic}</Text>
            <Text style={s.small}>{sur.ayahCount} ayahs · {sur.revelation} · from the locked Quran dataset</Text>
          </View>
          <View style={{ flex: 1, minWidth: 260 }}>
            <Text style={s.label}>Quranic themes</Text>
            <Text style={s.body}>{rec.themes.join(' · ')}</Text>
            <Text style={[s.label, { marginTop: 10 }]}>Story chapters (design record)</Text>
            {rec.passages.length ? rec.passages.map((p) => <Text key={p.reference} style={s.body}>{`${p.title} (${p.reference})`}</Text>) : <Text style={s.small}>No narrative passages in this surah.</Text>}
            <Text style={[s.label, { marginTop: 10 }]}>Quran references</Text>
            <Text style={s.body}>{rec.references.join(', ')}</Text>
          </View>
        </View>
      </Card>
      <Card title="World">
        <Text style={s.label}>World title</Text>
        <Text style={[s.body, { marginBottom: 8 }]}>{resolved?.name ?? 'No world yet'}</Text>
        <Text style={s.label}>Environment settings</Text>
        <Text style={[s.body, { marginBottom: 8 }]}>{rec.environment}</Text>
        <Text style={s.label}>Game activities</Text>
        {resolved?.tasks.map((t, i) => (
          <Text key={t.id} style={s.body}>
            {i + 1}. {t.title} <Text style={s.small}>({t.kind}{t.requires?.length ? `, after: ${t.requires.join(', ')}` : ''})</Text>
          </Text>
        ))}
        <Text style={[s.small, { marginTop: 8 }]}>Progression: each activity opens when the ones it lists as "after" are done. That order is set in the world's code; the studio can reorder the list and add new activities that follow existing ones.</Text>
      </Card>
      <Card title="Editable record fields" right={<Pill text="Story Editor" tone="accent" />}>
        <Input label="World description" multiline value={val('world_description', resolved?.theme ?? '')} onChangeText={(v) => edit('world_description', v)} testID="rec-description" />
        <Input label="Learning objectives (one per line)" multiline value={val('learning_objectives', rec.objectives.join('\n'))} onChangeText={(v) => edit('learning_objectives', v)} />
        <Input label="Progression requirements (notes for the team)" multiline value={val('progression', '')} onChangeText={(v) => edit('progression', v)} placeholder="e.g. Finish Al-Fatihah first" />
        <Input label="Content review notes" multiline value={val('review_notes', '')} onChangeText={(v) => edit('review_notes', v)} />
        <Text style={s.small}>These fields are saved with the draft and published with it. Learning objectives and descriptions are shown in the studio; the game shows the world description as the world's subtitle once you also change it in the Story tab.</Text>
      </Card>
      <Card title="Technical and review status">
        <Text style={s.body}>Status report: {st?.status ?? 'unknown'} · {st?.gameplay_functional}</Text>
        <Text style={s.body}>Movement and collision: {st?.movement_collision}{ph ? ` · recorded run: desktop ${ph.desktop}, phone ${ph.phone}` : ''}</Text>
        <Text style={s.body}>Mobile: {st?.mobile}</Text>
        <Text style={s.body}>Story coverage: {st?.story_coverage}</Text>
        <Text style={s.body}>Narration: {st?.narration}</Text>
        <Text style={s.body}>Scholarly review: {st?.content_reviewed}</Text>
        {(st?.remaining_issues ?? []).map((x) => (
          <Text key={x} style={s.small}>
            • {x}
          </Text>
        ))}
        <Text style={[s.small, { marginTop: 6 }]}>From the generated status report and physics records (npm run status). They describe the built-in world; studio edits are tested separately below.</Text>
      </Card>
    </View>
  );
}

/* ------------------------------ story editor ------------------------------ */

function LockedAyahs({ refs }: { refs: [number, number][] }) {
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

const parseRefs = (t: string): [number, number][] | null => {
  const out: [number, number][] = [];
  for (const part of t.split(/[,\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d{1,3}):(\d{1,3})$/);
    if (!m) return null;
    out.push([+m[1], +m[2]]);
  }
  return out.length ? out : null;
};

function RefsInput({ f, value, onChange }: { f: Field; value: [number, number][]; onChange: (v: [number, number][]) => void }) {
  const [text, setText] = useState(value.map((r) => r.join(':')).join(', '));
  const [bad, setBad] = useState(false);
  useEffect(() => setText(value.map((r) => r.join(':')).join(', ')), [JSON.stringify(value)]);
  return (
    <View>
      <TextInput
        style={[s.input, bad && { borderColor: C.bad }]}
        value={text}
        accessibilityLabel={`${f.group}: ${f.label}`}
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

function StoryEditor({ n, def, ed, problems }: { n: number; def: WorldDef; ed: ReturnType<typeof useDraft>; problems: Problem[] }) {
  const { who } = useStudio();
  const canText = has(who, 'story_editor');
  const resolved = useMemo(() => applyOverlay(def, ed.doc).def, [def, ed.doc]);
  const fields = useMemo(() => fieldsOf(def).filter((f) => ['text', 'longtext', 'refs', 'ref'].includes(f.kind)), [def]);
  const groups = useMemo(() => {
    const m = new Map<string, Field[]>();
    for (const f of fields) m.set(f.group, [...(m.get(f.group) ?? []), f]);
    return [...m.entries()];
  }, [fields]);
  const [open, setOpen] = useState<string>('World');
  const [onlyEdited, setOnlyEdited] = useState(false);
  const order = resolved.tasks.map((t) => t.id);
  const move = (id: string, d: -1 | 1) => {
    const i = order.indexOf(id);
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j], next[i]];
    ed.change((doc) => ({ ...doc, order: next }));
  };
  const val = (f: Field) => (ed.doc.set && f.path in ed.doc.set ? ed.doc.set[f.path] : f.value);
  const problemFor = (p: string) => problems.filter((x) => x.key === p);
  return (
    <View>
      <Card title="Chapters and their order" right={<Text style={s.small}>Language: English (the only language the game's text is written in so far)</Text>}>
        {resolved.tasks.map((t, i) => (
          <View key={t.id} style={[s.tr, { paddingVertical: 6 }]}>
            <Text style={[s.body, { width: 28, fontWeight: '800' }]}>{i + 1}</Text>
            <Text style={[s.body, { flex: 1 }]}>
              {t.title} <Text style={s.small}>· {t.kind}{t.requires?.length ? ` · after ${t.requires.map((r) => resolved.tasks.find((x) => x.id === r)?.title ?? r).join(', ')}` : ''}{t.id.startsWith('x-') ? ' · added in the studio' : ''}</Text>
            </Text>
            <Btn small label="Up" onPress={() => move(t.id, -1)} disabled={!canText || i === 0} />
            <Btn small label="Down" onPress={() => move(t.id, 1)} disabled={!canText || i === resolved.tasks.length - 1} />
          </View>
        ))}
        {problemFor('order').map((p, i) => (
          <Note key={i} tone={p.level === 'error' ? 'bad' : 'warn'}>
            {p.message}
          </Note>
        ))}
        <AddReading n={n} def={def} ed={ed} disabled={!canText} />
      </Card>
      <View style={[s.row, { marginBottom: 10 }]}>
        <Btn small label={onlyEdited ? 'Show all fields' : 'Show only edited fields'} onPress={() => setOnlyEdited((x) => !x)} />
        <Text style={s.small}>{Object.keys(ed.doc.set ?? {}).length} field(s) edited in this draft</Text>
      </View>
      {groups.map(([g, fs]) => {
        const shown = onlyEdited ? fs.filter((f) => ed.doc.set && f.path in ed.doc.set) : fs;
        if (!shown.length) return null;
        const isOpen = open === g || onlyEdited;
        return (
          <Card key={g} title={g} right={<Btn small kind="quiet" label={isOpen ? 'Close' : `Open (${fs.length})`} onPress={() => setOpen(isOpen ? '' : g)} testID={`group-${g}`} />}>
            {isOpen
              ? shown.map((f) => {
                  const v = val(f);
                  const edited = !!ed.doc.set && f.path in ed.doc.set;
                  return (
                    <View key={f.path} style={{ marginBottom: 14 }}>
                      <View style={[s.row, { marginBottom: 4 }]}>
                        <Text style={s.label}>{f.label}</Text>
                        {f.quran ? <Pill text="Quran-linked: needs a Quran reviewer" tone="quran" /> : null}
                        {edited ? <Pill text="Edited" tone="accent" /> : null}
                        {edited ? <Btn small kind="quiet" label="Reset" onPress={() => ed.setField(f.path, f.value, f.value)} /> : null}
                      </View>
                      {f.kind === 'refs' ? (
                        <RefsInput f={f} value={v as any} onChange={(x) => ed.setField(f.path, x, f.value)} />
                      ) : f.kind === 'ref' ? (
                        <RefsInput f={f} value={[v as any]} onChange={(x) => ed.setField(f.path, x[0], f.value)} />
                      ) : (
                        <TextInput
                          accessibilityLabel={`${g}: ${f.label}`}
                          testID={`field-${f.path}`}
                          editable={canText}
                          multiline={f.kind === 'longtext'}
                          value={String(v ?? '')}
                          onChangeText={(t) => ed.setField(f.path, t, f.value)}
                          style={[s.input, f.kind === 'longtext' && { minHeight: 64, textAlignVertical: 'top' }]}
                        />
                      )}
                      {problemFor(f.path).map((p, i) => (
                        <Text key={i} style={[s.small, { color: p.level === 'error' ? C.bad : C.warn }]}>
                          {p.message}
                        </Text>
                      ))}
                    </View>
                  );
                })
              : null}
          </Card>
        );
      })}
      <Text style={s.small}>Positions, sizes and other numbers belong to the World and Activity editors. Narration plays when its chapter opens and ends; its timing is fixed by the game.</Text>
    </View>
  );
}

/** Add a story chapter from the reading-place template (a real game activity: walk to a marker and read verified ayahs). */
function AddReading({ n, def, ed, disabled }: { n: number; def: WorldDef; ed: ReturnType<typeof useDraft>; disabled: boolean }) {
  const [openForm, setOpenForm] = useState(false);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [note, setNote] = useState('');
  const [refs, setRefs] = useState('');
  const [after, setAfter] = useState(def.tasks[def.tasks.length - 1]?.id ?? '');
  const [x, setX] = useState(String(def.start[0] + 4));
  const [z, setZ] = useState(String(def.start[1] - 6));
  if (!openForm) return <Btn label="Add a reading chapter" onPress={() => setOpenForm(true)} disabled={disabled} testID="add-reading" />;
  const r = parseRefs(refs);
  const add = () => {
    const id = `x-read-${Date.now().toString(36)}`;
    const task: Task = { id, kind: 'read', title, goal, at: [Number(x), Number(z)], marker: 'tablet', requires: after ? [after] : undefined, reading: { title, refs: r ?? [], note } } as Task;
    ed.change((d) => ({ ...d, add: { ...(d.add ?? {}), tasks: [...(d.add?.tasks ?? []), task] } }));
    setOpenForm(false);
    setTitle('');
    setGoal('');
    setNote('');
    setRefs('');
  };
  return (
    <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: C.line, paddingTop: 12 }}>
      <Text style={s.h3}>New reading chapter</Text>
      <Text style={[s.small, { marginBottom: 8 }]}>A marker in the world where the child walks up and reads the ayahs you choose, with your explanation. This uses the game's existing reading activity.</Text>
      <Input label="Title" value={title} onChangeText={setTitle} />
      <Input label="Instruction shown to the child" value={goal} onChangeText={setGoal} placeholder="e.g. Find the tablet by the palm tree" />
      <Input label="Ayahs (surah:ayah, comma separated)" value={refs} onChangeText={setRefs} placeholder={`${n}:1`} />
      {r ? <LockedAyahs refs={r} /> : null}
      <Input label="Explanation for children" multiline value={note} onChangeText={setNote} />
      <View style={s.row}>
        <View style={{ width: 110 }}>
          <Input label="Place x" value={x} onChangeText={setX} keyboardType="numeric" />
        </View>
        <View style={{ width: 110 }}>
          <Input label="Place z" value={z} onChangeText={setZ} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Text style={s.label}>Opens after</Text>
          <View style={s.row}>
            {def.tasks.slice(-4).map((t) => (
              <Pressable key={t.id} onPress={() => setAfter(t.id)} style={[s.btn, s.btnSmall, { borderColor: C.line, backgroundColor: after === t.id ? C.accentSoft : '#fff' }]}>
                <Text style={{ fontSize: 12 }}>{t.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
      <Text style={[s.small, { marginBottom: 8 }]}>World radius is {def.ground.radius}; the start is at {def.start.join(', ')}. The World editor (next phase) lets you place it by pointing in 3D.</Text>
      <View style={s.row}>
        <Btn label="Add chapter" kind="primary" onPress={add} disabled={!title.trim() || !goal.trim() || !r || !note.trim()} />
        <Btn label="Cancel" onPress={() => setOpenForm(false)} />
      </View>
    </View>
  );
}

/* ------------------------------ versions ------------------------------ */

function Diff({ def, from, to }: { def: WorldDef; from: Overlay | null; to: Overlay }) {
  const keys = changedKeys(from, to);
  if (!keys.length) return <Text style={s.small}>No differences.</Text>;
  return (
    <View>
      {keys.map((k) => {
        const segs = parsePath(k);
        const base = segs ? getAt(def, segs) : undefined;
        const a = from?.set?.[k] ?? (k in (to.set ?? {}) ? base : undefined);
        const b = to.set?.[k] ?? (k in (from?.set ?? {}) ? base : undefined);
        return (
          <View key={k} style={{ marginBottom: 6 }}>
            <View style={s.row}>
              <Text style={[s.small, { fontWeight: '800' }]}>{k}</Text>
              {quranLinked(k) ? <Pill text="Quran-linked" tone="quran" /> : null}
            </View>
            {segs ? (
              <Text style={s.small}>
                <Text style={{ color: C.bad }}>{JSON.stringify(a ?? null).slice(0, 220)}</Text>
                {'  →  '}
                <Text style={{ color: C.good }}>{JSON.stringify(b ?? null).slice(0, 220)}</Text>
              </Text>
            ) : (
              <Text style={s.small}>Section changed: {k}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function Versions({ n, def, onChanged }: { n: number; def: WorldDef; onChanged: () => void }) {
  const { who } = useStudio();
  const scope = `surah:${n}`;
  const [vs, setVs] = useState<Version[] | null>(null);
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [live, setLive] = useState<Overlay | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [when2, setWhen] = useState<Record<number, string>>({});
  const [openDiff, setOpenDiff] = useState<number | null>(null);
  const load = () => {
    Promise.all([versions(scope), publications(scope), liveDoc(scope)]).then(([v, p, l]) => {
      setVs(v);
      setPubs(p);
      setLive(l);
    });
    if (has(who, 'super_admin')) staff().then((x) => setNames(Object.fromEntries(x.map((y) => [y.user_id, y.email])))).catch(() => {});
  };
  useEffect(load, [scope]);
  const act = async (f: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try {
      await f();
      setMsg({ tone: 'good', text: ok });
      load();
      onChanged();
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };
  const check = (v: Version) =>
    act(async () => {
      const probs = validateOverlay(def, v.doc, quranIndex);
      const errors = probs.filter((p) => p.level === 'error');
      await recordTest({ scope, version: v.id, kind: 'content', ok: errors.length === 0, summary: errors.length ? `${errors.length} error(s)` : `passed (${probs.length} warning(s))`, report: { problems: probs, checker: 'studio/overlay validateOverlay' }, hash: v.hash });
      if (errors.length) throw new Error(`Checks found ${errors.length} error(s): ${errors.map((e) => e.message).join('; ')}`);
    }, 'Content checks passed and were recorded for this version.');
  const by = (id: string | null) => (id ? (id === who.user ? 'you' : names[id] ?? `staff ${id.slice(0, 8)}`) : 'unknown');
  const livePub = pubs.find((p) => new Date(p.effective_at) <= new Date());
  const wasPublished = new Set(pubs.filter((p) => p.action !== 'unpublish').map((p) => p.version_id));
  if (!vs) return <Busy />;
  return (
    <View>
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
      <Card title="Live now">
        <Text style={s.body} testID="live-now">
          {livePub && livePub.action !== 'unpublish' ? `Version ${vs.find((v) => v.id === livePub.version_id)?.number} (since ${when(livePub.effective_at)})` : 'The built-in world, with no studio edits'}
        </Text>
        {has(who, 'super_admin') && livePub && livePub.action !== 'unpublish' ? (
          <View style={[s.row, { marginTop: 8 }]}>
            <Btn small kind="danger" label="Unpublish: go back to the built-in world" onPress={() => act(() => rollback(scope, null, 'unpublish'), 'Players now get the built-in world.')} />
          </View>
        ) : null}
      </Card>
      <Card title="Versions">
        {!vs.length ? <Text style={s.small}>No versions yet. Submit a draft from the Story tab.</Text> : null}
        {vs.map((v) => {
          const tone = v.state === 'published' ? 'good' : v.state === 'approved' ? 'accent' : v.state === 'changes_requested' ? 'bad' : v.state === 'withdrawn' ? 'plain' : 'warn';
          const canReview = v.quran_linked ? hasExact(who, 'quran_reviewer') : has(who, 'quran_reviewer') || has(who, 'super_admin');
          return (
            <View key={v.id} style={{ borderTopWidth: 1, borderColor: C.line, paddingVertical: 12 }} testID={`version-${v.number}`}>
              <View style={s.row}>
                <Text style={s.h3}>Version {v.number}</Text>
                <Pill text={v.state.replace('_', ' ')} tone={tone as any} />
                {v.quran_linked ? <Pill text="Quran-linked" tone="quran" /> : null}
                <Pill text={v.validation_ok == null ? 'not checked' : v.validation_ok ? 'checks passed' : 'checks failed'} tone={v.validation_ok == null ? 'plain' : v.validation_ok ? 'good' : 'bad'} />
                {livePub?.version_id === v.id && livePub.action !== 'unpublish' ? <Pill text="LIVE" tone="good" /> : null}
              </View>
              <Text style={s.small}>
                {when(v.created_at)} by {by(v.created_by)} · changes: {v.changed.join(', ')}
                {v.reviewed_at ? ` · reviewed by ${by(v.reviewed_by)} (${(v.reviewer_roles ?? []).join(', ')}) ${when(v.reviewed_at)}${v.review_note ? `: “${v.review_note}”` : ''}` : ''}
              </Text>
              {v.note ? <Text style={[s.body, { marginTop: 4 }]}>“{v.note}”</Text> : null}
              <View style={[s.row, { marginTop: 8 }]}>
                <Btn small label={openDiff === v.id ? 'Hide changes' : 'Show changes vs live'} onPress={() => setOpenDiff(openDiff === v.id ? null : v.id)} />
                {['submitted', 'approved', 'changes_requested'].includes(v.state) ? <Btn small label="Run content checks" onPress={() => check(v)} testID={`check-${v.number}`} /> : null}
              </View>
              {openDiff === v.id ? (
                <View style={{ marginTop: 8 }}>
                  <Diff def={def} from={live} to={v.doc} />
                </View>
              ) : null}
              {['submitted', 'changes_requested', 'approved'].includes(v.state) && canReview ? (
                <View style={[s.row, { marginTop: 8 }]}>
                  <TextInput value={notes[v.id] ?? ''} onChangeText={(t) => setNotes({ ...notes, [v.id]: t })} placeholder="Review note" style={[s.input, { flex: 1, minWidth: 200 }]} accessibilityLabel="Review note" />
                  <Btn small kind="primary" label="Approve" onPress={() => act(() => review(v.id, 'approve', notes[v.id] ?? ''), `Version ${v.number} approved.`)} testID={`approve-${v.number}`} />
                  <Btn small label="Request changes" onPress={() => act(() => review(v.id, 'changes', notes[v.id] ?? ''), 'Sent back to the editors.')} />
                </View>
              ) : null}
              {v.state === 'approved' && has(who, 'super_admin') ? (
                <View style={[s.row, { marginTop: 8 }]}>
                  <TextInput value={when2[v.id] ?? ''} onChangeText={(t) => setWhen({ ...when2, [v.id]: t })} placeholder="Publish later: YYYY-MM-DD HH:MM (blank = now)" style={[s.input, { width: 300 }]} accessibilityLabel="Publish time" />
                  <Btn
                    small
                    kind="primary"
                    label={when2[v.id] ? 'Schedule' : 'Publish now'}
                    testID={`publish-${v.number}`}
                    onPress={() => act(() => publish(v.id, when2[v.id] ? new Date(when2[v.id].replace(' ', 'T')).toISOString() : null, ''), when2[v.id] ? 'Scheduled.' : `Version ${v.number} is live. Players get it the next time they open this world; their progress is untouched.`)}
                  />
                </View>
              ) : null}
              {v.state === 'published' && wasPublished.has(v.id) && livePub?.version_id !== v.id && has(who, 'super_admin') ? (
                <View style={[s.row, { marginTop: 8 }]}>
                  <Btn small kind="danger" label={`Roll back to version ${v.number}`} testID={`rollback-${v.number}`} onPress={() => act(() => rollback(scope, v.id, `rolled back to ${v.number}`), `Players now get version ${v.number}. Their saved progress is not changed.`)} />
                </View>
              ) : null}
            </View>
          );
        })}
      </Card>
      <Card title="Publication history">
        {pubs.map((p) => (
          <Text key={p.id} style={s.body}>
            {when(p.at)} · {p.action} {p.version_id ? `version ${vs.find((v) => v.id === p.version_id)?.number}` : '(built-in world)'} by {by(p.by)}
            {new Date(p.effective_at) > new Date() ? ` · scheduled for ${when(p.effective_at)}` : ''}
          </Text>
        ))}
        {!pubs.length ? <Text style={s.small}>Nothing published yet: players get the built-in world.</Text> : null}
      </Card>
    </View>
  );
}

/* ------------------------------ tests ------------------------------ */

function Tests({ n }: { n: number }) {
  const [t, setT] = useState<TestRun[] | null>(null);
  useEffect(() => {
    testRuns(`surah:${n}`).then(setT);
  }, [n]);
  const ph = physicsRuns.worlds[String(n)];
  return (
    <View>
      <Card title="Recorded physics runs (built-in world)">
        {ph ? <Text style={s.body}>Desktop: {ph.desktop} · Phone: {ph.phone} · {ph.date ?? physicsRuns.date} · recipe {ph.hash ?? ''}</Text> : <Text style={s.small}>No run recorded.</Text>}
        <Text style={s.small}>{physicsRuns.how}</Text>
      </Card>
      <Card title="Studio test results">
        {!t ? <Busy /> : !t.length ? <Text style={s.small}>No studio tests yet.</Text> : null}
        {t?.map((x) => (
          <View key={x.id} style={s.tr}>
            <Pill text={x.ok ? 'pass' : 'fail'} tone={x.ok ? 'good' : 'bad'} />
            <Text style={[s.body, { width: 110 }]}>{x.kind}</Text>
            <Text style={[s.body, { flex: 1 }]}>{x.summary}</Text>
            <Text style={s.small}>{when(x.ran_at)}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

/* ------------------------------ page ------------------------------ */

export default function SurahPage() {
  const { n: raw } = useLocalSearchParams<{ n: string }>();
  const n = Number(raw);
  const sur = getSurah(n);
  const def = WORLDS[n];
  const rec = records.records[n - 1];
  const { who } = useStudio();
  const scope = `surah:${n}`;
  const ed = useDraft(scope);
  const [tab, setTab] = useState<'record' | 'story' | 'versions' | 'tests'>('story');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [vkey, setVkey] = useState(0);
  const problems = useMemo(() => (def ? validateOverlay(def, ed.doc, quranIndex) : []), [def, ed.doc]);
  const errors = problems.filter((p) => p.level === 'error');
  if (!sur || !rec) return <Page title="Not a surah">{null}</Page>;
  const editRecord = (k: string, v: string) => ed.change((d) => ({ ...d, record: { ...(d.record ?? {}), [k]: v } }));
  const submit = async () => {
    setMsg(null);
    try {
      if (ed.state !== 'saved') await ed.save();
      const id = await submitDraft(scope, note);
      setMsg({ tone: 'good', text: `Submitted for review (version id ${id}). A reviewer approves it, then a Super Admin publishes it.` });
      setNote('');
      setVkey((k) => k + 1);
      setTab('versions');
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };
  const saveLabel = { loading: 'Loading…', saved: ed.hasDraft ? `Draft saved ${when(ed.updatedAt)}` : 'No draft yet: editing a copy of what is live', unsaved: 'Unsaved changes (autosave in a moment)', saving: 'Saving…', error: `Not saved: ${ed.error}`, conflict: 'Someone else saved this draft. Reload to continue.' }[ed.state];
  return (
    <Page
      title={`${n}. ${sur.nameTransliterated}`}
      sub={def ? `World: ${applyOverlay(def, ed.doc).def.name}` : 'No world built for this surah'}
      actions={
        def ? (
          <>
            <Btn label="Play test draft" onPress={() => openGame(n, 'draft')} testID="playtest" />
            <Btn label="Published" onPress={() => openGame(n, 'published')} />
            <Btn label="Built-in" onPress={() => openGame(n, 'built-in')} />
          </>
        ) : null
      }
    >
      <View style={[s.row, { marginBottom: 14 }]}>
        {(['story', 'record', 'versions', 'tests'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[s.btn, { borderColor: C.line, backgroundColor: tab === t ? C.side : '#fff' }]} testID={`tab-${t}`}>
            <Text style={[s.btnText, { color: tab === t ? '#fff' : C.ink }]}>{{ story: 'Story editor', record: 'Content record', versions: 'Versions & publishing', tests: 'Tests' }[t]}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'story' || tab === 'record' ? (
        <Card style={{ backgroundColor: '#fbfaf6' }}>
          <View style={s.row}>
            <Text style={[s.body, { flex: 1, color: ed.state === 'error' || ed.state === 'conflict' ? C.bad : C.soft }]} testID="save-state">
              {saveLabel}
            </Text>
            <Btn small label="Undo" onPress={ed.undo} disabled={!ed.canUndo} testID="undo" />
            <Btn small label="Redo" onPress={ed.redo} disabled={!ed.canRedo} testID="redo" />
            <Btn small label="Save now" onPress={ed.save} disabled={ed.state !== 'unsaved'} testID="save" />
            {ed.state === 'conflict' ? <Btn small label="Reload" onPress={ed.reload} /> : null}
            {ed.hasDraft ? <Btn small kind="quiet" label="Discard draft" onPress={() => discardDraft(scope).then(ed.reload).catch((e) => setMsg({ tone: 'bad', text: e.message }))} /> : null}
          </View>
          {errors.length ? <Note tone="bad">{`${errors.length} problem(s) to fix before submitting: ${errors.slice(0, 3).map((e) => e.message).join('; ')}`}</Note> : null}
          {ed.hasDraft ? (
            <View style={[s.row, { marginTop: 8 }]}>
              <TextInput value={note} onChangeText={setNote} placeholder="What changed, for the reviewer" style={[s.input, { flex: 1, minWidth: 240 }]} accessibilityLabel="Change note" testID="submit-note" />
              <Btn label="Submit for review" kind="primary" onPress={submit} disabled={errors.length > 0 || !(has(who, 'story_editor') || has(who, 'world_editor'))} testID="submit" />
            </View>
          ) : null}
        </Card>
      ) : null}
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
      {ed.state === 'loading' ? <Busy /> : null}
      {tab === 'record' && ed.state !== 'loading' ? <Overview n={n} def={def} rec={rec} doc={ed.doc} edit={editRecord} /> : null}
      {tab === 'story' && ed.state !== 'loading' ? def ? <StoryEditor n={n} def={def} ed={ed} problems={problems} /> : <Note>No world has been built for this surah yet.</Note> : null}
      {tab === 'versions' && def ? <Versions key={vkey} n={n} def={def} onChanged={() => ed.reload()} /> : null}
      {tab === 'tests' ? <Tests n={n} /> : null}
    </Page>
  );
}
