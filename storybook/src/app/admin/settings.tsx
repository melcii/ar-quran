// Family and educator controls that apply to everyone (Moderators edit,
// a Super Admin approves and publishes):
//  - Play: a gentle break reminder after some minutes, and worlds closed for
//    repair (players see "this world is resting" instead).
//  - Online play: on or off for everyone, and how many explorers a room holds.
//    The database's room functions enforce both.
// Each family's own choices (online play on, phrases only) stay with the
// family; the studio cannot see or change them.
import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { WORLDS } from '@/adventure/worlds';
import { getSurah } from '@/content/quran';
import { useStudio } from '@/studio/context';
import { DraftBar } from '@/studio/DraftBar';
import { has } from '@/studio/session';
import { MP_DEFAULTS, PLAY_DEFAULTS, checkSettings, resolveMp, resolvePlay } from '@/studio/settings';
import { useDraft } from '@/studio/useDraft';
import { Versions } from '@/studio/Versions';
import { Btn, C, Card, Note, Page, Pill, s } from '@/studio/ui';

const BREAKS = [0, 15, 20, 30, 45, 60];

export default function Settings() {
  const [scope, setScope] = useState<'config:play' | 'config:multiplayer'>('config:play');
  return (
    <Page title="Family & educator controls" sub="Settings that apply to every player. Changes are drafts until a Super Admin approves and publishes them.">
      <View style={[s.row, { marginBottom: 12 }]}>
        <Btn label="Play" kind={scope === 'config:play' ? 'primary' : 'plain'} onPress={() => setScope('config:play')} testID="set-play" />
        <Btn label="Online play" kind={scope === 'config:multiplayer' ? 'primary' : 'plain'} onPress={() => setScope('config:multiplayer')} testID="set-mp" />
      </View>
      <Editor key={scope} scope={scope} />
    </Page>
  );
}

function Editor({ scope }: { scope: 'config:play' | 'config:multiplayer' }) {
  const { who } = useStudio();
  const ed = useDraft(scope);
  const [tab, setTab] = useState<'edit' | 'versions'>('edit');
  const [vkey, setVkey] = useState(0);
  const [closeN, setCloseN] = useState('');
  const can = has(who, 'moderator');
  const problems = useMemo(() => checkSettings(scope, ed.doc), [scope, ed.doc]);
  (globalThis as any).__studioSettings = { scope, doc: ed.doc, problems };
  const play = resolvePlay(ed.doc);
  const mp = resolveMp(ed.doc);
  const edited = (k: string) => (ed.doc.set ?? {})[k] !== undefined;
  return (
    <>
      <View style={[s.row, { marginBottom: 12 }]}>
        {(['edit', 'versions'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[s.btn, { borderColor: C.line, backgroundColor: tab === t ? C.side : '#fff' }]} testID={`tab-${t}`}>
            <Text style={[s.btnText, { color: tab === t ? '#fff' : C.ink }]}>{{ edit: 'Settings', versions: 'Versions & publishing' }[t]}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'versions' ? (
        <Versions key={vkey} scope={scope} base={{}} validate={(d) => checkSettings(scope, d)} onChanged={() => ed.reload()} builtIn="the built-in settings" empty="No versions yet. Submit a draft from Settings." />
      ) : (
        <>
          {!can ? <Note tone="warn">Only Moderators change these settings. You can read them.</Note> : null}
          <DraftBar scope={scope} ed={ed} problems={problems} canSubmit={can} onSubmitted={() => setVkey((k) => k + 1)} />
          {scope === 'config:play' ? (
            <>
              <Card title="Break reminder" right={edited('breakMinutes') ? <Pill text="Edited" tone="accent" /> : null}>
                <Text style={[s.small, { marginBottom: 8 }]}>After this many minutes in an adventure world, a calm card suggests a short break. The child can keep exploring; nothing is locked.</Text>
                <View style={[s.row, { flexWrap: 'wrap' }]}>
                  {BREAKS.map((m) => (
                    <Btn key={m} small label={m ? `${m} min` : 'Off'} kind={play.breakMinutes === m ? 'primary' : 'plain'} disabled={!can} onPress={() => ed.setField('breakMinutes', m, PLAY_DEFAULTS.breakMinutes)} testID={`set-break-${m}`} />
                  ))}
                </View>
              </Card>
              <Card title="Worlds closed for repair" right={edited('closedWorlds') ? <Pill text="Edited" tone="accent" /> : null}>
                <Text style={[s.small, { marginBottom: 8 }]}>Players who open a closed world see “This world is resting while we fix something” and go back home. Their progress there is kept. Use it when a bug makes a world unplayable and a fix needs a developer.</Text>
                <View style={[s.row, { flexWrap: 'wrap', marginBottom: 8 }]}>
                  {!play.closedWorlds.length ? <Text style={s.small}>No world is closed.</Text> : null}
                  {play.closedWorlds.map((n) => (
                    <View key={n} style={[s.row, { borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 8 }]}>
                      <Text style={s.body}>{n}. {getSurah(n)?.nameTransliterated}</Text>
                      <Btn small kind="quiet" label="Reopen" disabled={!can} onPress={() => ed.setField('closedWorlds', play.closedWorlds.filter((x) => x !== n), PLAY_DEFAULTS.closedWorlds)} testID={`set-reopen-${n}`} />
                    </View>
                  ))}
                </View>
                <View style={s.row}>
                  <TextInput style={[s.input, { width: 110 }]} placeholder="Surah no." value={closeN} onChangeText={(t) => setCloseN(t.replace(/\D/g, ''))} editable={can} accessibilityLabel="Surah number to close" testID="set-close-n" />
                  <Btn
                    small
                    label="Close this world"
                    disabled={!can || !WORLDS[Number(closeN)] || play.closedWorlds.includes(Number(closeN))}
                    onPress={() => {
                      ed.setField('closedWorlds', [...play.closedWorlds, Number(closeN)].sort((a, b) => a - b), PLAY_DEFAULTS.closedWorlds);
                      setCloseN('');
                    }}
                    testID="set-close"
                  />
                  {Platform.OS === 'web' && play.closedWorlds.length ? <Btn small kind="quiet" label="Play test a closed world" onPress={() => window.open(`/adventure/${play.closedWorlds[0]}?studio=draft`, '_blank')} testID="set-playtest" /> : null}
                </View>
              </Card>
            </>
          ) : (
            <>
              <Card title="Online play for everyone" right={edited('enabled') ? <Pill text="Edited" tone="accent" /> : null}>
                <Text style={[s.small, { marginBottom: 8 }]}>An emergency switch. When off, no explorer can open, join or be invited to a room, whatever their family chose. Each family must still turn online play on for their own children.</Text>
                <View style={s.row}>
                  <Btn small label="On" kind={mp.enabled ? 'primary' : 'plain'} disabled={!can} onPress={() => ed.setField('enabled', true, MP_DEFAULTS.enabled)} testID="set-mp-on" />
                  <Btn small label="Off" kind={!mp.enabled ? 'danger' : 'plain'} disabled={!can} onPress={() => ed.setField('enabled', false, MP_DEFAULTS.enabled)} testID="set-mp-off" />
                </View>
              </Card>
              <Card title="Room size" right={edited('roomMax') ? <Pill text="Edited" tone="accent" /> : null}>
                <Text style={[s.small, { marginBottom: 8 }]}>How many explorers a room holds, including the host. Rooms are invitation only, for friends both families approved.</Text>
                <View style={s.row}>
                  {[2, 3, 4].map((n) => (
                    <Btn key={n} small label={String(n)} kind={mp.roomMax === n ? 'primary' : 'plain'} disabled={!can} onPress={() => ed.setField('roomMax', n, MP_DEFAULTS.roomMax)} testID={`set-room-${n}`} />
                  ))}
                </View>
              </Card>
              <Note>The in-game screens for friends and rooms are not built yet. These rules are enforced by the database today, so they apply as soon as those screens exist.</Note>
            </>
          )}
        </>
      )}
    </>
  );
}
