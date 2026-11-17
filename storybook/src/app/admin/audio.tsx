// The Audio Studio: upload narration, Quran recitation and sound effects
// with their licence records, review them, and assign approved narration to
// the lines it speaks in a world.
//
// Rules enforced by the server (supabase/migrations/0003_studio_phase3.sql):
// recitation must be a human recording by a named reciter, with a confirmed
// licence, approved by a Quran Content Reviewer; there is no music
// category; nobody approves their own upload; files are never overwritten.
// Nothing here generates speech.
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { WORLDS } from '@/adventure/worlds';
import { lineId } from '@/audio/catalog';
import { narrationLines } from '@/studio/narration';
import { getSurah } from '@/content/quran';
import AudioPreview from '@/studio/AudioPreview';
import { audioUrl } from '@/studio/audioLive';
import { useStudio } from '@/studio/context';
import FilePick from '@/studio/FilePick';
import { applyOverlay, type Overlay } from '@/studio/overlay';
import { LockedAyahs } from '@/studio/quranUi';
import { audioAssets, getDraft, has, hasExact, liveDoc, registerAudio, reviewAudio, saveDraft, uploadAudio, type AudioAsset } from '@/studio/session';
import { Btn, Busy, C, Card, Field, Note, Page, Pill, s, when } from '@/studio/ui';

type Kind = AudioAsset['kind'];
const ORIGINS: Record<Kind, { id: AudioAsset['origin']; label: string }[]> = {
  narration: [
    { id: 'human_recording', label: 'Recorded by a person' },
    { id: 'licensed_tts', label: 'Licensed voice service (terms permit this use)' },
  ],
  recitation: [{ id: 'human_recording', label: 'Recorded by the named reciter (the only option)' }],
  effect: [
    { id: 'sound_library', label: 'From a licensed sound library' },
    { id: 'human_recording', label: 'Recorded by a person' },
  ],
};
const BUILT = Object.keys(WORLDS).map(Number).sort((a, b) => a - b);

function Upload({ onDone }: { onDone: () => void }) {
  const [kind, setKind] = useState<Kind>('narration');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [voice, setVoice] = useState('');
  const [origin, setOrigin] = useState<AudioAsset['origin']>('human_recording');
  const [licence, setLicence] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [source, setSource] = useState('');
  const [surah, setSurah] = useState(19);
  const [line, setLine] = useState<string | null>(null);
  const [a1, setA1] = useState('1');
  const [a2, setA2] = useState('1');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [lines, setLines] = useState<{ where: string; text: string; id: string }[]>([]);
  useEffect(() => {
    const base = WORLDS[surah];
    if (!base) return setLines([]);
    // The lines as they read in the current draft (or what is live), so a recording matches the words players will hear.
    getDraft(`surah:${surah}`)
      .then(async (d) => d?.doc ?? (await liveDoc(`surah:${surah}`)))
      .then((doc) => setLines(narrationLines(applyOverlay(base, doc).def)))
      .catch(() => setLines(narrationLines(base)));
  }, [surah]);
  const sur = getSurah(surah);
  const r1 = Number(a1);
  const r2 = Number(a2);
  const rangeOk = !!sur && r1 >= 1 && r2 >= r1 && r2 <= sur.ayahCount;
  const ready = !!file && title.trim() && licence.trim().length >= 3 && (kind !== 'recitation' || (voice.trim().length > 1 && rangeOk)) && (kind !== 'narration' || !!line);
  const go = async () => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const duration = await new Promise<number | null>((res) => {
        const a = new Audio(URL.createObjectURL(file));
        a.onloadedmetadata = () => res(Number.isFinite(a.duration) ? +a.duration.toFixed(2) : null);
        a.onerror = () => res(null);
        setTimeout(() => res(null), 4000);
      });
      const path = await uploadAudio(file);
      const id = await registerAudio({
        kind,
        title,
        language: 'en',
        path,
        mime: file.type,
        bytes: file.size,
        duration_s: duration,
        voice,
        origin,
        licence,
        licence_confirmed: confirmed,
        source,
        surah: kind === 'effect' ? null : surah,
        ayah_from: kind === 'recitation' ? r1 : null,
        ayah_to: kind === 'recitation' ? r2 : null,
        line_text: kind === 'narration' ? lines.find((l) => l.id === line)?.text : null,
      });
      setMsg({ tone: 'good', text: `Uploaded (${id.slice(0, 8)}). It now waits for review by ${kind === 'recitation' ? 'a Quran Content Reviewer' : 'another audio editor'}.` });
      setFile(null);
      setTitle('');
      onDone();
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
    setBusy(false);
  };
  return (
    <Card title="Upload a file">
      <View style={[s.row, { marginBottom: 12 }]}>
        {(['narration', 'recitation', 'effect'] as Kind[]).map((k) => (
          <Pressable
            key={k}
            onPress={() => {
              setKind(k);
              setOrigin(ORIGINS[k][0].id);
            }}
            style={[s.btn, s.btnSmall, { borderColor: kind === k ? C.accent : C.line, backgroundColor: kind === k ? C.accentSoft : '#fff' }]}
            testID={`au-kind-${k}`}
          >
            <Text style={{ fontWeight: '700' }}>{{ narration: 'Story narration', recitation: 'Quran recitation', effect: 'Sound effect' }[k]}</Text>
          </Pressable>
        ))}
        <Pill text="No music: there is no category for it" />
      </View>
      {kind === 'recitation' ? (
        <Note tone="quran">Recitation must be a real person's recitation, identified by name, with a licence that allows this use. A Quran Content Reviewer listens to it against the text before it can be used. Synthetic or altered voices are refused.</Note>
      ) : null}
      <FilePick onPick={setFile} testID="au-file" />
      <View style={{ height: 10 }} />
      <Field label="Title" value={title} onChangeText={setTitle} testID="au-title" />
      {kind !== 'effect' ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={s.label}>Surah</Text>
          <View style={s.row}>
            <TextInput style={[s.input, { width: 80 }]} value={String(surah)} onChangeText={(t) => setSurah(Math.max(1, Math.min(114, Number(t) || 1)))} keyboardType="numeric" testID="au-surah" accessibilityLabel="Surah number" />
            <Text style={s.body}>{sur ? `${sur.nameTransliterated}` : ''}</Text>
          </View>
        </View>
      ) : null}
      {kind === 'narration' ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={s.label}>The line this recording speaks</Text>
          {!WORLDS[surah] ? <Text style={s.small}>No world is built for this surah. Built: {BUILT.join(', ')}</Text> : null}
          {lines.map((l) => (
            <Pressable key={l.id + l.where} onPress={() => setLine(l.id)} style={[{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 4, borderColor: line === l.id ? C.accent : C.line, backgroundColor: line === l.id ? C.accentSoft : '#fff' }]} testID={`au-line-${l.id}`}>
              <Text style={s.small}>{l.where}</Text>
              <Text style={s.body} numberOfLines={2}>
                {l.text}
              </Text>
            </Pressable>
          ))}
          <Text style={s.hint}>The recording is matched to the words. If the line is reworded later, the game goes back to its usual voice for it until a new recording is assigned.</Text>
        </View>
      ) : null}
      {kind === 'recitation' ? (
        <View style={{ marginBottom: 12 }}>
          <View style={s.row}>
            <View style={{ width: 120 }}>
              <Field label="From ayah" value={a1} onChangeText={setA1} keyboardType="numeric" testID="au-a1" />
            </View>
            <View style={{ width: 120 }}>
              <Field label="To ayah" value={a2} onChangeText={setA2} keyboardType="numeric" testID="au-a2" />
            </View>
          </View>
          {rangeOk ? <LockedAyahs refs={Array.from({ length: Math.min(6, r2 - r1 + 1) }, (_, i) => [surah, r1 + i] as [number, number])} /> : <Text style={[s.small, { color: C.bad }]}>Not a real ayah range for this surah.</Text>}
        </View>
      ) : null}
      <Field label={kind === 'recitation' ? 'Reciter (full name)' : kind === 'narration' ? 'Narrator or voice' : 'Made by (optional)'} value={voice} onChangeText={setVoice} testID="au-voice" />
      <View style={{ marginBottom: 12 }}>
        <Text style={s.label}>Where the sound comes from</Text>
        <View style={s.row}>
          {ORIGINS[kind].map((o) => (
            <Pressable key={o.id} onPress={() => setOrigin(o.id)} style={[s.btn, s.btnSmall, { borderColor: origin === o.id ? C.accent : C.line, backgroundColor: origin === o.id ? C.accentSoft : '#fff' }]} testID={`au-origin-${o.id}`}>
              <Text style={{ fontSize: 12 }}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Field label="Licence (who holds it and what it allows)" multiline value={licence} onChangeText={setLicence} testID="au-licence" />
      <Field label="Source (link or where the file came from)" value={source} onChangeText={setSource} testID="au-source" />
      <View style={[s.row, { marginBottom: 12 }]}>
        <Switch value={confirmed} onValueChange={setConfirmed} testID="au-confirmed" accessibilityLabel="Licence confirmed" />
        <Text style={s.body}>I have checked the licence and it allows use in this app</Text>
      </View>
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
      <Btn label={busy ? 'Uploading…' : 'Upload'} kind="primary" onPress={go} disabled={!ready || busy} testID="au-upload" />
    </Card>
  );
}

/** Put an approved narration file on its line in the world's draft. */
async function assign(a: AudioAsset) {
  const scope = `surah:${a.surah}`;
  const d = await getDraft(scope);
  const doc: Overlay = d?.doc ?? (await liveDoc(scope)) ?? { v: 1 };
  const next: Overlay = { ...doc, audio: { ...(doc.audio ?? {}), [lineId(a.line_text ?? '')]: a.id } };
  await saveDraft(scope, next, d?.revision ?? 0);
}

export default function AudioStudio() {
  const { who } = useStudio();
  const [list, setList] = useState<AudioAsset[] | null>(null);
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | Kind>('all');
  const load = () => audioAssets().then(setList).catch((e) => setMsg({ tone: 'bad', text: e.message }));
  useEffect(() => {
    load();
  }, []);
  const act = async (f: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try {
      await f();
      setMsg({ tone: 'good', text: ok });
      load();
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };
  const shown = useMemo(() => (list ?? []).filter((a) => filter === 'all' || a.kind === filter), [list, filter]);
  const canUpload = has(who, 'audio_editor');
  return (
    <Page title="Audio Studio" sub="Narration, Quran recitation and sound effects, with licences and review. No music.">
      {canUpload ? <Upload onDone={load} /> : <Note>Uploading needs the Audio Editor role.</Note>}
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
      <Card
        title="Library"
        right={
          <View style={s.row}>
            {(['all', 'narration', 'recitation', 'effect'] as const).map((k) => (
              <Btn key={k} small kind={filter === k ? 'primary' : 'plain'} label={k} onPress={() => setFilter(k)} />
            ))}
          </View>
        }
      >
        {!list ? <Busy /> : !shown.length ? <Text style={s.small}>No files yet.</Text> : null}
        {shown.map((a) => {
          const mine = a.uploaded_by === who.user;
          const canReview = a.kind === 'recitation' ? hasExact(who, 'quran_reviewer') : has(who, 'audio_editor');
          const waiting = a.status === 'uploaded' || a.status === 'rejected';
          return (
            <View key={a.id} style={{ borderTopWidth: 1, borderColor: C.line, paddingVertical: 12 }} testID={`asset-${a.id}`}>
              <View style={s.row}>
                <Text style={s.h3}>{a.title}</Text>
                <Pill text={a.kind} tone={a.kind === 'recitation' ? 'quran' : 'plain'} />
                <Pill text={a.status} tone={a.status === 'approved' ? 'good' : a.status === 'rejected' ? 'bad' : a.status === 'retired' ? 'plain' : 'warn'} />
                <Pill text={a.licence_confirmed ? 'licence confirmed' : 'licence not confirmed'} tone={a.licence_confirmed ? 'good' : 'warn'} />
                <AudioPreview src={audioUrl(a.path)} testID={`play-${a.id}`} />
              </View>
              <Text style={s.small}>
                {a.voice ? `${a.voice} · ` : ''}
                {a.origin.replace('_', ' ')} · {a.duration_s ? `${a.duration_s}s · ` : ''}
                {(a.bytes / 1024).toFixed(0)} KB · uploaded {when(a.uploaded_at)}
                {mine ? ' by you' : ''}
                {a.surah ? ` · surah ${a.surah}` : ''}
                {a.kind === 'recitation' ? ` ${a.ayah_from}–${a.ayah_to}` : ''}
              </Text>
              <Text style={s.small}>Licence: {a.licence}</Text>
              {a.line_text ? <Text style={[s.small, { fontStyle: 'italic' }]}>“{a.line_text}”</Text> : null}
              {a.reviewed_at ? <Text style={s.small}>Reviewed {when(a.reviewed_at)} ({(a.reviewer_roles ?? []).join(', ')}){a.review_note ? `: “${a.review_note}”` : ''}</Text> : null}
              <View style={[s.row, { marginTop: 6 }]}>
                {waiting && canReview && !mine ? (
                  <>
                    <TextInput value={notes[a.id] ?? ''} onChangeText={(t) => setNotes({ ...notes, [a.id]: t })} placeholder="Review note" style={[s.input, { width: 220 }]} accessibilityLabel="Review note" />
                    <Btn small kind="primary" label="Approve" onPress={() => act(() => reviewAudio(a.id, 'approve', notes[a.id] ?? ''), 'Approved.')} testID={`au-approve-${a.id}`} />
                    <Btn small label="Reject" onPress={() => act(() => reviewAudio(a.id, 'reject', notes[a.id] ?? ''), 'Rejected.')} />
                  </>
                ) : null}
                {waiting && mine ? <Text style={s.small}>Waiting for someone else to review it.</Text> : null}
                {a.status === 'approved' && a.kind === 'narration' && a.surah && WORLDS[a.surah] && has(who, 'audio_editor') ? (
                  <Btn small label={`Assign to its line in surah ${a.surah} (draft)`} onPress={() => act(() => assign(a), `Assigned in the surah ${a.surah} draft. Submit that draft for review to publish it.`)} testID={`au-assign-${a.id}`} />
                ) : null}
                {a.status !== 'retired' && has(who, 'audio_editor') ? <Btn small kind="quiet" label="Retire" onPress={() => act(() => reviewAudio(a.id, 'retire', ''), 'Retired: it can no longer be assigned.')} /> : null}
              </View>
            </View>
          );
        })}
      </Card>
      <Card title="What the game does with these files">
        <Text style={s.body}>• Approved narration assigned to a line plays instead of the device voice for that line, once the world's version with the assignment is published (or in a play test of the draft).</Text>
        <Text style={s.body}>• Recitation files are kept with their reciter, licence and review here. The game's Quran player still uses its reciter catalog (content/audio/catalog.json); playing an approved studio recitation in the game is developer work that is not done yet.</Text>
        <Text style={s.body}>• Sound effects are stored and reviewed here; the game's effects are built into its code, so swapping one in is also developer work.</Text>
      </Card>
    </Page>
  );
}
