// Moderation (Moderators): reports that explorers made about each other in
// invitation-only rooms. Privacy-limited by the server itself: the reason,
// when, the room's world, the reported explorer's nickname and how often they
// were reported. Never the grown-up, the friend code, the look, saves or who
// reported. Actions are small and reversible, and every one is audited.
import { useCallback, useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { getSurah } from '@/content/quran';
import { useStudio } from '@/studio/context';
import { has, modAct, modQueue, modUnpause, type ModReport } from '@/studio/session';
import { Btn, Busy, C, Card, Note, Page, Pill, s, when } from '@/studio/ui';

const REASON = { unkind: 'Unkind', unsafe: 'Felt unsafe', other: 'Something else' } as const;
const DAYS = [1, 3, 7, 30];
const world = (w: string | null) => (!w ? '' : w === 'ark' ? "Nuh's Ark" : `${w}. ${getSurah(Number(w))?.nameTransliterated ?? ''}`);

export default function Moderation() {
  const { who } = useStudio();
  const [rows, setRows] = useState<ModReport[] | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [show, setShow] = useState<'open' | 'all'>('open');
  const load = useCallback(() => modQueue().then(setRows, (e) => setErr(e.message)), []);
  useEffect(() => {
    load();
  }, [load]);
  (globalThis as any).__studioMod = { rows };
  if (!has(who, 'moderator')) return <Page title="Moderation"><Note tone="warn">Only Moderators (and Super Admins) can see player reports.</Note></Page>;
  const list = (rows ?? []).filter((r) => show === 'all' || r.status === 'open');
  const act = async (f: () => Promise<void>, ok: string) => {
    setMsg(null);
    try {
      await f();
      setMsg({ tone: 'good', text: ok });
      await load();
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };
  return (
    <Page title="Moderation" sub="Reports from invitation-only rooms. You see only what you need to decide: no names, emails, friend codes, saves or who reported.">
      {err ? <Note tone="bad">{err}</Note> : null}
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
      <View style={[s.row, { marginBottom: 10 }]}>
        <Btn small label={`Open (${(rows ?? []).filter((r) => r.status === 'open').length})`} kind={show === 'open' ? 'primary' : 'plain'} onPress={() => setShow('open')} testID="mod-open" />
        <Btn small label={`All (${rows?.length ?? 0})`} kind={show === 'all' ? 'primary' : 'plain'} onPress={() => setShow('all')} testID="mod-all" />
      </View>
      {!rows ? <Busy /> : !list.length ? <Card><Text style={s.small}>{show === 'open' ? 'No open reports.' : 'No reports yet.'}</Text></Card> : null}
      {list.map((r) => (
        <ReportCard key={r.id} r={r} act={act} />
      ))}
      <Card title="What each action does">
        <Text style={s.small}>Pause online play: the explorer leaves any open room and cannot open, join or be invited to rooms for the chosen days. Playing alone is not affected. You can lift it early.</Text>
        <Text style={s.small}>Replace nickname: the nickname becomes “Explorer” and four digits. The family can choose a new one.</Text>
        <Text style={s.small}>Close room: everyone in that room returns to playing alone.</Text>
        <Text style={s.small}>Rooms are designed without free chat or voice (preset phrases and gestures only), so there are no messages to read here. The in-game online play screens are not built yet; these reports and actions work on the server today.</Text>
      </Card>
    </Page>
  );
}

function ReportCard({ r, act }: { r: ModReport; act: (f: () => Promise<void>, ok: string) => Promise<void> }) {
  const [days, setDays] = useState(3);
  const [note, setNote] = useState('');
  const paused = r.about_paused_until && new Date(r.about_paused_until) > new Date();
  const open = r.status === 'open';
  return (
    <Card title={`Report #${r.id}`} right={<Pill text={open ? 'open' : r.status} tone={open ? 'warn' : r.status === 'actioned' ? 'accent' : 'plain'} />}>
      <View testID={`mod-${r.id}`}>
        <View style={[s.row, { flexWrap: 'wrap', marginBottom: 8 }]}>
          <Pill text={REASON[r.reason] ?? r.reason} tone={r.reason === 'unsafe' ? 'bad' : 'warn'} />
          <Text style={s.small}>{when(r.created_at)}</Text>
          {r.room_world ? <Text style={s.small}>in a room in {world(r.room_world)}{r.room_closed ? ' (room closed)' : ''}</Text> : null}
        </View>
        {r.about ? (
          <Text style={[s.body, { marginBottom: 8 }]}>
            About the explorer “<Text style={{ fontWeight: '800' }}>{r.about_nickname ?? 'removed'}</Text>” · reported {r.about_reports} time{r.about_reports === 1 ? '' : 's'} in all
            {paused ? <Text style={{ color: C.warn }}> · online play paused until {when(r.about_paused_until)}</Text> : null}
          </Text>
        ) : (
          <Text style={[s.small, { marginBottom: 8 }]}>The reported explorer no longer exists.</Text>
        )}
        {!open ? <Text style={[s.small, { marginBottom: 8 }]}>{r.action?.replace('_', ' ')} {when(r.handled_at)}{r.note ? ` · “${r.note}”` : ''}</Text> : null}
        {open ? (
          <>
            <TextInput style={[s.input, { marginBottom: 8 }]} placeholder="Note for other moderators (optional, no personal details)" value={note} onChangeText={setNote} maxLength={1000} accessibilityLabel="Moderator note" testID={`mod-${r.id}-note`} />
            <View style={[s.row, { flexWrap: 'wrap' }]}>
              {r.about ? (
                <>
                  <Text style={s.label}>Pause online play</Text>
                  {DAYS.map((d) => (
                    <Btn key={d} small label={`${d} day${d > 1 ? 's' : ''}`} kind={days === d ? 'primary' : 'plain'} onPress={() => setDays(d)} testID={`mod-${r.id}-days-${d}`} />
                  ))}
                  <Btn small kind="danger" label="Pause" onPress={() => act(() => modAct(r.id, 'pause_online', days, note), `Online play paused for ${days} day(s).`)} testID={`mod-${r.id}-pause`} />
                  <Btn small label="Replace nickname" onPress={() => act(() => modAct(r.id, 'reset_nickname', null, note), 'The nickname was replaced with a neutral one.')} testID={`mod-${r.id}-nick`} />
                </>
              ) : null}
              {r.room && !r.room_closed ? <Btn small label="Close the room" onPress={() => act(() => modAct(r.id, 'close_room', null, note), 'The room was closed.')} testID={`mod-${r.id}-close`} /> : null}
              <Btn small kind="quiet" label="Dismiss" onPress={() => act(() => modAct(r.id, 'dismiss', null, note), 'Report dismissed.')} testID={`mod-${r.id}-dismiss`} />
            </View>
          </>
        ) : paused ? (
          <Btn small label="Lift the pause now" onPress={() => act(() => modUnpause(r.id), 'Online play is allowed again.')} testID={`mod-${r.id}-unpause`} />
        ) : null}
      </View>
    </Card>
  );
}
