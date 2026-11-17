// Versions of one scope: run the content checks, review, publish now or
// later, roll back or unpublish, and see what changed. Shared by every
// studio editor (worlds, the Ark settings, the character catalog).
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useStudio } from './context';
import { changedKeys, getAt, parsePath, quranLinked, type Overlay, type Problem } from './overlay';
import { has, hasExact, liveDoc, publications, publish, recordTest, review, rollback, staff, versions, type Publication, type Version } from './session';
import { Btn, Busy, C, Card, Note, Pill, s, when } from './ui';


function Diff({ base, from, to }: { base: unknown; from: Overlay | null; to: Overlay }) {
  const keys = changedKeys(from, to);
  if (!keys.length) return <Text style={s.small}>No differences.</Text>;
  return (
    <View>
      {keys.map((k) => {
        const segs = parsePath(k);
        const was = segs ? getAt(base, segs) : undefined;
        const a = from?.set?.[k] ?? (k in (to.set ?? {}) ? was : undefined);
        const b = to.set?.[k] ?? (k in (from?.set ?? {}) ? was : undefined);
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

export function Versions({ scope, base, validate, onChanged, empty = 'No versions yet. Submit a draft first.', builtIn = 'the built-in world' }: { scope: string; base: unknown; validate: (doc: Overlay) => Problem[]; onChanged: () => void; empty?: string; builtIn?: string }) {
  const { who } = useStudio();
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
      const probs = validate(v.doc);
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
          {livePub && livePub.action !== 'unpublish' ? `Version ${vs.find((v) => v.id === livePub.version_id)?.number} (since ${when(livePub.effective_at)})` : `${builtIn[0].toUpperCase()}${builtIn.slice(1)}, with no studio edits`}
        </Text>
        {has(who, 'super_admin') && livePub && livePub.action !== 'unpublish' ? (
          <View style={[s.row, { marginTop: 8 }]}>
            <Btn small kind="danger" label={`Unpublish: go back to ${builtIn}`} onPress={() => act(() => rollback(scope, null, 'unpublish'), `Players now get ${builtIn}.`)} />
          </View>
        ) : null}
      </Card>
      <Card title="Versions">
        {!vs.length ? <Text style={s.small}>{empty}</Text> : null}
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
                  <Diff base={base} from={live} to={v.doc} />
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
                    onPress={() => act(() => publish(v.id, when2[v.id] ? new Date(when2[v.id].replace(' ', 'T')).toISOString() : null, ''), when2[v.id] ? 'Scheduled.' : `Version ${v.number} is live. Players get it the next time they open it; their progress is untouched.`)}
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
            {when(p.at)} · {p.action} {p.version_id ? `version ${vs.find((v) => v.id === p.version_id)?.number}` : `(${builtIn})`} by {by(p.by)}
            {new Date(p.effective_at) > new Date() ? ` · scheduled for ${when(p.effective_at)}` : ''}
          </Text>
        ))}
        {!pubs.length ? <Text style={s.small}>Nothing published yet: players get the built-in world.</Text> : null}
      </Card>
    </View>
  );
}

