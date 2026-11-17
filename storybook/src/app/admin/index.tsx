// Studio dashboard. Every number comes from real data: the project's own
// files (status report, physics runs, audio catalogue) or the studio
// database (drafts, versions, publications, tests, bugs). Each tile names
// its source; nothing is estimated or made up.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { surahs } from '@/content/quran';
import { projectFacts } from '@/studio/facts';
import { bugs, drafts, playerProblems, publications, testRuns, versions, type Bug, type Draft, type Publication, type TestRun, type Version } from '@/studio/session';
import { Busy, C, Card, Note, Page, s } from '@/studio/ui';

type Live = { drafts: Draft[]; versions: Version[]; pubs: Publication[]; bugs: Bug[]; tests: TestRun[]; problems: number };

function Tile({ label, value, src, tone = 'plain', onPress }: { label: string; value: string | number; src: string; tone?: 'plain' | 'warn' | 'bad' | 'good'; onPress?: () => void }) {
  const col = { plain: C.ink, warn: C.warn, bad: C.bad, good: C.good }[tone];
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[s.card, { width: 232, marginRight: 14, minHeight: 118 }]} accessibilityRole={onPress ? 'link' : undefined}>
      <Text style={s.label}>{label}</Text>
      <Text style={{ fontSize: 30, fontWeight: '800', color: col, marginVertical: 4 }} testID={`tile-${label}`}>
        {value}
      </Text>
      <Text style={s.small}>{src}</Text>
    </Pressable>
  );
}

export default function Dashboard() {
  const f = projectFacts();
  const [live, setLive] = useState<Live | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    Promise.all([drafts(), versions(), publications(), bugs(), testRuns(), playerProblems()])
      .then(([d, v, p, b, t, pp]) => setLive({ drafts: d, versions: v, pubs: p, bugs: b, tests: t, problems: pp.length }))
      .catch((e) => setErr(e.message));
  }, []);
  const open = live?.bugs.filter((b) => !['fixed', 'wont_fix', 'duplicate'].includes(b.status)) ?? [];
  // The newest studio test of each kind per world decides whether it is failing now.
  const latest = new Map<string, TestRun>();
  for (const t of live?.tests ?? []) if (!latest.has(`${t.scope}|${t.kind}`)) latest.set(`${t.scope}|${t.kind}`, t);
  const failing = [...latest.values()].filter((t) => !t.ok);
  const brokenActivities = failing.filter((t) => t.kind === 'interaction' || t.kind === 'playthrough').length;
  const quranPending = live?.versions.filter((v) => v.quran_linked && (v.state === 'submitted' || v.state === 'changes_requested')).length ?? 0;
  const waiting = live?.versions.filter((v) => v.state === 'submitted' || v.state === 'approved').length ?? 0;
  const published = live?.pubs.filter((p) => p.action !== 'unpublish').length ?? 0;
  const movement = open.filter((b) => b.severity === 'critical' && (b.category === 'movement' || b.category === 'collision')).length + f.physicsFails.length;
  const match = q.trim()
    ? surahs.filter((x) => String(x.number) === q.trim() || x.nameTransliterated.toLowerCase().replace(/[^a-z]/g, '').includes(q.toLowerCase().replace(/[^a-z]/g, '')) || x.nameMeaning.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : [];
  const rep = `Status report, ${f.reportDate}`;
  return (
    <Page title="Dashboard" sub="The state of the whole game, from the project's own records and the studio database.">
      <Card title="Open a surah">
        <TextInput value={q} onChangeText={setQ} placeholder="Number or name, e.g. 19 or Maryam" style={s.input} accessibilityLabel="Find a surah" testID="surah-search" />
        <View style={[s.row, { marginTop: 8 }]}>
          {match.map((x) => (
            <Pressable key={x.number} onPress={() => router.push(`/admin/surah/${x.number}`)} style={[s.btn, { borderColor: C.line }]} accessibilityRole="link" testID={`open-${x.number}`}>
              <Text style={s.btnText}>
                {x.number}. {x.nameTransliterated}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Text style={[s.h2, { marginBottom: 10 }]}>Worlds and content</Text>
      <View style={[s.row, { alignItems: 'stretch' }]}>
        <Tile label="Total surahs" value={f.totalSurahs} src="Quran dataset (KFGQPC Hafs)" />
        <Tile label="Worlds built" value={`${f.built} of 114`} src="Worlds in the game's code" />
        <Tile label="Tested worlds" value={f.tested} src={`${rep}. Headless browser, desktop; phone runs: ${f.phoneNotRun} not run`} tone="good" onPress={() => router.push('/admin/surahs')} />
        <Tile label="Under development" value={f.developing} src={rep} onPress={() => router.push('/admin/surahs')} />
        <Tile label="Incomplete stories" value={f.incompleteStories} src={`${rep}: story passages missing from a world`} />
        <Tile label="Never scholar-reviewed" value={f.notScholarReviewed} src={`${rep}: no named reviewer has approved`} tone={f.notScholarReviewed ? 'warn' : 'good'} />
      </View>

      <Text style={[s.h2, { marginVertical: 10 }]}>Quality</Text>
      {!live && !err ? <Busy /> : null}
      {err ? <Note tone="bad">{`Could not read the studio database: ${err}`}</Note> : null}
      <View style={[s.row, { alignItems: 'stretch' }]}>
        <Tile label="Open bugs" value={live ? open.length : '…'} src={`Bug reports in the studio${live?.problems ? `; ${live.problems} player problem reports` : ''}`} tone={open.length ? 'warn' : 'plain'} />
        <Tile label="Critical movement issues" value={live ? movement : '…'} src={`Critical movement or collision bugs, plus recorded physics failures (${f.physicsDate})`} tone={movement ? 'bad' : 'good'} />
        <Tile label="Broken activities" value={live ? brokenActivities + f.activitiesNotPassing : '…'} src="Latest studio play/interaction tests failing, plus worlds the status report marks not functional" tone={brokenActivities + f.activitiesNotPassing ? 'bad' : 'good'} />
        <Tile label="Failed automated tests" value={live ? failing.length + f.physicsFails.length : '…'} src="Newest studio test of each kind per world, plus recorded physics runs" tone={failing.length + f.physicsFails.length ? 'bad' : 'good'} onPress={() => router.push('/admin/tests')} />
        <Tile label="Missing audio" value={`${f.narrationLines - f.recordedClips} lines`} src={`${f.recordedClips} of ${f.narrationLines} narration lines recorded; licensed recitation: ${f.licensedReciters} of ${f.reciters} reciters confirmed`} tone="warn" />
      </View>

      <Text style={[s.h2, { marginVertical: 10 }]}>Changes</Text>
      <View style={[s.row, { alignItems: 'stretch' }]}>
        <Tile label="Drafts in progress" value={live ? live.drafts.length : '…'} src="Worlds with unsubmitted edits" onPress={() => router.push('/admin/review')} />
        <Tile label="Pending changes" value={live ? waiting : '…'} src="Versions waiting for review or publishing" onPress={() => router.push('/admin/review')} />
        <Tile label="Pending Quran reviews" value={live ? quranPending : '…'} src="Quran-linked versions waiting for a Quran Content Reviewer" tone={quranPending ? 'warn' : 'plain'} onPress={() => router.push('/admin/review')} />
        <Tile label="Published updates" value={live ? published : '…'} src="Publications and rollbacks so far" />
      </View>
    </Page>
  );
}
