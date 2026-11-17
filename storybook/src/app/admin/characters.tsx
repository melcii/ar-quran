// Character Studio: choose which dressing-room options children are offered
// and what each is called, previewing every option on the game's own
// explorer figure. A child's saved look is never changed: a hidden option
// stays available to a child who already chose it.
import { useMemo, useState } from 'react';
import { Platform, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { GROUPS, catalogView, checkCatalog, type CatalogDoc } from '@/profile/catalog';
import * as L from '@/profile/look';
import CharacterPreview from '@/studio/CharacterPreview';
import { useStudio } from '@/studio/context';
import { DraftBar } from '@/studio/DraftBar';
import type { Overlay } from '@/studio/overlay';
import { has } from '@/studio/session';
import { useDraft } from '@/studio/useDraft';
import { Versions } from '@/studio/Versions';
import { Btn, Busy, C, Card, Note, Page, Pill, s } from '@/studio/ui';

const SCOPE = 'catalog:avatar';

export default function CharacterStudio() {
  const { who } = useStudio();
  const ed = useDraft(SCOPE);
  const [tab, setTab] = useState<'catalog' | 'versions'>('catalog');
  const [look, setLook] = useState<L.Look>(L.DEFAULT_LOOK);
  const [vkey, setVkey] = useState(0);
  const doc = ed.doc as unknown as CatalogDoc;
  const problems = useMemo(() => checkCatalog(doc), [doc]);
  const view = useMemo(() => catalogView(doc), [doc]);
  const can = has(who, 'world_editor');
  const change = (f: (d: NonNullable<CatalogDoc>) => NonNullable<CatalogDoc>) => ed.change((d) => f(d as any) as unknown as Overlay);
  const toggle = (g: string, id: string, show: boolean) =>
    change((d) => {
      const list = new Set(d.hide?.[g] ?? []);
      if (show) list.delete(id);
      else list.add(id);
      const hide = { ...(d.hide ?? {}), [g]: [...list] };
      if (!hide[g].length) delete hide[g];
      const next: NonNullable<CatalogDoc> = { ...d, hide };
      if (!Object.keys(hide).length) delete next.hide;
      return next;
    });
  const rename = (g: string, id: string, label: string, base: string) =>
    change((d) => {
      const labels = { ...(d.labels ?? {}) };
      if (!label || label === base) delete labels[`${g}.${id}`];
      else labels[`${g}.${id}`] = label;
      const next: NonNullable<CatalogDoc> = { ...d, labels };
      if (!Object.keys(labels).length) delete next.labels;
      return next;
    });
  const open = (mode: 'draft' | 'published') => Platform.OS === 'web' && window.open(`/dressing?studio=${mode}`, '_blank');
  return (
    <Page
      title="Character Studio"
      sub="The explorer figure children dress in the dressing room: which choices are offered and what they are called"
      actions={
        <>
          <Btn label="Play test draft" kind="primary" onPress={() => open('draft')} testID="char-playtest" />
          <Btn label="Published" onPress={() => open('published')} />
        </>
      }
    >
      <View style={[s.row, { marginBottom: 14 }]}>
        {(['catalog', 'versions'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[s.btn, { borderColor: C.line, backgroundColor: tab === t ? C.side : '#fff' }]} testID={`tab-${t}`}>
            <Text style={[s.btnText, { color: tab === t ? '#fff' : C.ink }]}>{{ catalog: 'Catalog', versions: 'Versions & publishing' }[t]}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'versions' ? (
        <Versions key={vkey} scope={SCOPE} base={{}} validate={(d) => checkCatalog(d as any)} onChanged={() => ed.reload()} builtIn="the built-in catalog" empty="No versions yet. Submit a draft from Catalog." />
      ) : ed.state === 'loading' ? (
        <Busy />
      ) : (
        <>
          <DraftBar scope={SCOPE} ed={ed} problems={problems} canSubmit={can} onSubmitted={() => setVkey((k) => k + 1)} />
          {problems.map((p, i) => (
            <Note key={i} tone={p.level === 'error' ? 'bad' : 'warn'}>
              {p.message}
            </Note>
          ))}
          <View style={[s.row, { alignItems: 'flex-start', gap: 16 }]}>
            <Card style={{ flexGrow: 0, position: 'sticky' as any, top: 0 }}>
              <CharacterPreview look={look} />
              <Text style={[s.small, { marginTop: 8, maxWidth: 300 }]}>Click any option to see it on the explorer. Drag to turn.</Text>
              <View style={[s.row, { marginTop: 8, maxWidth: 300 }]}>
                {L.PRESETS.map((p) => (
                  <Btn key={p.name} small label={p.name} onPress={() => setLook(p.look)} />
                ))}
              </View>
              <Text style={[s.small, { marginTop: 8, maxWidth: 300 }]}>
                {view.presets().length} of {L.PRESETS.length} ready-made explorers offered.
              </Text>
            </Card>
            <View style={{ flex: 1, minWidth: 380 }}>
              {GROUPS.map((g) => (
                <Card key={g.key} title={g.label} right={<Pill text={`${g.opts.filter((o) => !view.hidden(g.key, o.id)).length} of ${g.opts.length} offered`} />}>
                  {g.opts.map((o) => {
                    const shown = !view.hidden(g.key, o.id);
                    const isDefault = (L.DEFAULT_LOOK as any)[g.key] === o.id;
                    const label = doc?.labels?.[`${g.key}.${o.id}`] ?? o.label;
                    return (
                      <View key={o.id} style={[s.tr, { paddingVertical: 4 }]}>
                        {isDefault ? <View style={{ width: 40 }} testID={`show-${g.key}-${o.id}`}><Text style={s.small}>always</Text></View> : <Switch value={shown} disabled={!can} onValueChange={(v) => toggle(g.key, o.id, v)} accessibilityLabel={`Offer ${o.label}`} testID={`show-${g.key}-${o.id}`} />}
                        <Pressable onPress={() => setLook({ ...look, [g.key]: o.id })} style={{ width: 120 }} testID={`try-${g.key}-${o.id}`}>
                          <Text style={[s.body, { textDecorationLine: 'underline', color: (look as any)[g.key] === o.id ? C.accent : C.ink }]}>{o.id}</Text>
                        </Pressable>
                        <TextInput style={[s.input, { flex: 1, paddingVertical: 4 }]} value={label} editable={can} onChangeText={(t) => rename(g.key, o.id, t, o.label)} accessibilityLabel={`Name of ${o.id}`} testID={`label-${g.key}-${o.id}`} />
                        {isDefault ? <Pill text="default explorer" /> : null}
                      </View>
                    );
                  })}
                </Card>
              ))}
              <Text style={s.small}>
                Colours, new clothes and new hair styles are drawn in code (src/profile/figure); adding a new option is developer work. The studio decides which existing options are offered and their names.
              </Text>
            </View>
          </View>
        </>
      )}
    </Page>
  );
}
