// Nuh's Ark: the animal-guiding settings of the Ark valley, without code.
// For each pair: where they wander, their pad (the destination the animals
// route to), how close counts for noticing, leading and arriving, how fast
// they walk and hurry, and what the child is told. Also the Ark narration.
// Every change is a draft, checked with the game's own movement rules, then
// reviewed and published like any other studio change.
import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { checkArk } from '@/ark/check';
import { ARK_KINDS, LIMITS, NARRATION_KEYS, arkDefaults, resolveArk, type BeastCfg } from '@/ark/config';
import { NAMES, NARRATION } from '@/ark/story';
import ArkMap from '@/studio/ArkMap';
import { useStudio } from '@/studio/context';
import { DraftBar } from '@/studio/DraftBar';
import { has, recordTest } from '@/studio/session';
import { useDraft } from '@/studio/useDraft';
import { Versions } from '@/studio/Versions';
import { Btn, Busy, C, Card, Note, Page, Pill, s } from '@/studio/ui';

const SCOPE = 'ark:slice';
const DEF = arkDefaults();
const NARR0 = { ...NARRATION };
const NUM: { f: keyof typeof LIMITS; label: string; unit: string }[] = [
  { f: 'notice', label: 'Noticed within', unit: 'm' },
  { f: 'reach', label: 'Lead button within', unit: 'm' },
  { f: 'arrive', label: 'Arrives at the pad within', unit: 'm' },
  { f: 'speed', label: 'Walking pace', unit: 'm/s' },
  { f: 'followMax', label: 'Top speed when following', unit: 'm/s' },
];

export default function ArkSettings() {
  const { who } = useStudio();
  const ed = useDraft(SCOPE);
  const [tab, setTab] = useState<'settings' | 'versions'>('settings');
  const [kind, setKind] = useState<(typeof ARK_KINDS)[number]>('giraffe');
  const [placing, setPlacing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [vkey, setVkey] = useState(0);
  const { cfg, narration } = useMemo(() => resolveArk(ed.doc as any), [ed.doc]);
  const check = useMemo(() => checkArk(ed.doc as any), [ed.doc]);
  (globalThis as any).__studioArk = { doc: ed.doc, cfg, check };
  const canWorld = has(who, 'world_editor');
  const canText = has(who, 'story_editor');
  const c = cfg[kind];
  const set = (f: keyof BeastCfg, v: unknown) => ed.setField(`${kind}.${f}`, v, DEF[kind][f]);
  const probs = (key: string) => check.problems.filter((p) => p.key === key);
  const runTest = async () => {
    setMsg(null);
    try {
      const errors = check.problems.filter((p) => p.level === 'error');
      await recordTest({ scope: SCOPE, kind: 'movement', ok: errors.length === 0, summary: `${check.routes.filter((r) => r.ok).length}/${check.routes.length} routes walkable; ${errors.length} error(s)`, report: { problems: check.problems, routes: check.routes.map((r) => ({ kind: r.kind, from: r.from, ok: r.ok, length: r.length })), checker: 'ark/check checkArk (land.canStep + creatures/nav)' } });
      setMsg({ tone: errors.length ? 'bad' : 'good', text: errors.length ? `Guiding check found ${errors.length} problem(s); recorded.` : 'Guiding check passed: every pair can walk from its home to its pad and from its pad to the ramp. Recorded.' });
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };
  const open = (mode: 'draft' | 'published' | 'built-in') => Platform.OS === 'web' && window.open(`/ark?studio=${mode}`, '_blank');
  const spot = (f: 'home' | 'pad', label: string) => {
    const v = c[f];
    const id = `${kind}.${f}`;
    return (
      <View style={{ marginBottom: 12 }}>
        <View style={s.row}>
          <Text style={s.label}>{label}</Text>
          {JSON.stringify(v) !== JSON.stringify(DEF[kind][f]) ? <Pill text="Edited" tone="accent" /> : null}
        </View>
        <View style={s.row}>
          <TextInput style={[s.input, { width: 90 }]} value={String(v[0])} editable={canWorld} onChangeText={(t) => set(f, [Number(t), v[1]])} keyboardType="numeric" accessibilityLabel={`${label} x`} testID={`${id}-x`} />
          <TextInput style={[s.input, { width: 90 }]} value={String(v[1])} editable={canWorld} onChangeText={(t) => set(f, [v[0], Number(t)])} keyboardType="numeric" accessibilityLabel={`${label} z`} testID={`${id}-z`} />
          {Platform.OS === 'web' ? <Btn small label={placing === id ? 'Click the map…' : 'Place on the map'} kind={placing === id ? 'primary' : 'plain'} onPress={() => setPlacing(placing === id ? null : id)} disabled={!canWorld} testID={`${id}-pick`} /> : null}
          <Btn small kind="quiet" label="Reset" onPress={() => set(f, DEF[kind][f])} disabled={!canWorld} />
        </View>
        {probs(id).map((p, i) => (
          <Text key={i} style={[s.small, { color: p.level === 'error' ? C.bad : C.warn }]}>
            {p.message}
          </Text>
        ))}
      </View>
    );
  };
  return (
    <Page
      title="Nuh's Ark: guiding the animals"
      sub="Hud 11 · the Ark valley · settings for each pair of animals, checked with the game's own movement rules"
      actions={
        <>
          <Btn label="Play test draft" kind="primary" onPress={() => open('draft')} testID="ark-playtest" />
          <Btn label="Published" onPress={() => open('published')} />
          <Btn label="Built-in" onPress={() => open('built-in')} />
        </>
      }
    >
      <View style={[s.row, { marginBottom: 14 }]}>
        {(['settings', 'versions'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[s.btn, { borderColor: C.line, backgroundColor: tab === t ? C.side : '#fff' }]} testID={`tab-${t}`}>
            <Text style={[s.btnText, { color: tab === t ? '#fff' : C.ink }]}>{{ settings: 'Settings', versions: 'Versions & publishing' }[t]}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'versions' ? (
        <Versions key={vkey} scope={SCOPE} base={DEF} validate={(d) => checkArk(d as any).problems} onChanged={() => ed.reload()} builtIn="the built-in Ark settings" empty="No versions yet. Submit a draft from Settings." />
      ) : ed.state === 'loading' ? (
        <Busy />
      ) : (
        <>
          <DraftBar scope={SCOPE} ed={ed} problems={check.problems} canSubmit={canWorld || canText} onSubmitted={() => setVkey((k) => k + 1)} />
          {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
          <View style={[s.row, { alignItems: 'flex-start', gap: 16 }]}>
            <Card style={{ flexGrow: 0 }}>
              <ArkMap
                cfg={cfg}
                routes={check.routes}
                placing={placing}
                onPick={(p) => {
                  if (!placing) return;
                  const [k2, f] = placing.split('.') as [(typeof ARK_KINDS)[number], 'home' | 'pad'];
                  ed.setField(placing, p, DEF[k2][f]);
                  setPlacing(null);
                }}
              />
              <View style={[s.row, { marginTop: 10 }]}>
                <Btn label="Run the guiding check" onPress={runTest} testID="ark-check" />
                <Text style={s.small}>
                  {check.routes.filter((r) => r.ok).length}/{check.routes.length} routes walkable · {check.problems.filter((p) => p.level === 'error').length} error(s), {check.problems.filter((p) => p.level === 'warning').length} warning(s)
                </Text>
              </View>
            </Card>
            <View style={{ flex: 1, minWidth: 360 }}>
              <Card title="Pair">
                <View style={s.row}>
                  {ARK_KINDS.map((k) => (
                    <Pressable key={k} onPress={() => setKind(k)} style={[s.btn, s.btnSmall, { borderColor: kind === k ? C.accent : C.line, backgroundColor: kind === k ? C.accentSoft : '#fff' }]} testID={`pair-${k}`}>
                      <Text style={{ fontSize: 13, fontWeight: '700' }}>
                        {NAMES[k][1]}
                        {check.problems.some((p) => p.key.startsWith(`${k}.`) && p.level === 'error') ? ' ⚠' : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Card>
              <Card title={`The ${NAMES[kind][1]}`} right={<Pill text="positions and numbers: World Editor · words: Story Editor" />}>
                {spot('home', 'Start position: where the pair wanders')}
                {spot('pad', 'Destination: their pad by the ark (the animals route here)')}
                <View style={s.row}>
                  {NUM.map(({ f, label, unit }) => (
                    <View key={f} style={{ width: 200, marginBottom: 10 }}>
                      <Text style={s.label}>
                        {label} ({unit})
                      </Text>
                      <TextInput style={s.input} value={String(c[f])} editable={canWorld} onChangeText={(t) => set(f, t === '' ? NaN : Number(t))} keyboardType="numeric" accessibilityLabel={label} testID={`${kind}.${f}`} />
                      <Text style={s.hint}>
                        {LIMITS[f][0]}–{LIMITS[f][1]} · built-in {DEF[kind][f]}
                      </Text>
                      {probs(`${kind}.${f}`).map((p, i) => (
                        <Text key={i} style={[s.small, { color: p.level === 'error' ? C.bad : C.warn }]}>
                          {p.message}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
                <Text style={s.label}>Instruction when they start to follow</Text>
                <TextInput style={[s.input, { marginBottom: 10 }]} multiline value={c.instruction} editable={canText} onChangeText={(t) => set('instruction', t)} testID={`${kind}.instruction`} accessibilityLabel="Instruction" />
                <Text style={s.label}>Completion message when they are aboard</Text>
                <TextInput style={s.input} multiline value={c.done} editable={canText} onChangeText={(t) => set('done', t)} testID={`${kind}.done`} accessibilityLabel="Completion message" />
                <Text style={[s.small, { marginTop: 10 }]}>
                  How following works (fixed in the game): the pair walks behind the child, finding a way round the river, trees and the hull; when the leading animal is within the arriving distance of its pad, both step onto it, then walk up the ramp to their stall.
                </Text>
              </Card>
              <Card title="Ark narration" right={<Pill text="narration written for this game, not Quran text" />}>
                {NARRATION_KEYS.map((k) => (
                  <View key={k} style={{ marginBottom: 10 }}>
                    <Text style={s.label}>{k}</Text>
                    <TextInput style={[s.input, { minHeight: 48 }]} multiline value={narration[k]} editable={canText} onChangeText={(t) => ed.setField(`narration.${k}`, t, NARR0[k])} testID={`narration.${k}`} accessibilityLabel={`Narration: ${k}`} />
                  </View>
                ))}
              </Card>
            </View>
          </View>
        </>
      )}
    </Page>
  );
}
