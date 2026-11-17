// The Activity Builder and the visual logic editor for one world.
//
// Builder: pick a template (each is one of the game's working activity
// kinds), fill in a form, place its spots on the map, and add it to the
// draft. Logic: see every activity as a node and change which activities
// open after which. Both write only to the draft overlay; nothing is live
// until it is reviewed and published.
import { useMemo, useState } from 'react';
import { Platform, Pressable, Switch, Text, TextInput, View } from 'react-native';
import type { Task, WorldDef } from '@/adventure/types';
import LogicGraph, { nodesOf } from './LogicGraph';
import SpotMap, { spotsOf } from './SpotMap';
import { applyOverlay, linkCycle, type Overlay, type Problem } from './overlay';
import { LockedAyahs, parseRefs } from './quranUi';
import { TEMPLATES, buildTask, formProblems, initial, templateById, type Spec, type Values } from './templates';
import { Btn, C, Card, Field as Input, Note, Pill, s } from './ui';

type Ed = { doc: Overlay; change: (f: (d: Overlay) => Overlay) => void };

/* ------------------------------ logic editor ------------------------------ */

export function ActivityLogic({ def, ed, problems, canEdit }: { def: WorldDef; ed: Ed; problems: Problem[]; canEdit: boolean }) {
  const resolved = useMemo(() => applyOverlay(def, ed.doc).def, [def, ed.doc]);
  const [sel, setSel] = useState<string | null>(null);
  const added = new Set((ed.doc.add?.tasks ?? []).map((t) => t.id));
  const edited = new Set(Object.keys(ed.doc.links ?? {}));
  const baseReq = (id: string) => (def.tasks.find((t) => t.id === id) ?? ed.doc.add?.tasks?.find((t) => t.id === id))?.requires ?? [];
  const setReq = (id: string, list: string[]) =>
    ed.change((d) => {
      const links = { ...(d.links ?? {}) };
      if (JSON.stringify([...list].sort()) === JSON.stringify([...baseReq(id)].sort())) delete links[id];
      else links[id] = list;
      const next: Overlay = { ...d, links };
      if (!Object.keys(links).length) delete next.links;
      return next;
    });
  const toggle = (waiter: string, on: string) => {
    const t = resolved.tasks.find((x) => x.id === waiter);
    if (!t) return;
    const cur = t.requires ?? [];
    setReq(waiter, cur.includes(on) ? cur.filter((x) => x !== on) : [...cur, on]);
  };
  // Would this new link make a loop? Then say so before it is made.
  const wouldLoop = (waiter: string, on: string) =>
    !!linkCycle(resolved.tasks.map((t) => ({ id: t.id, requires: t.id === waiter ? [...(t.requires ?? []), on] : t.requires ?? [] })));
  const selTask = resolved.tasks.find((t) => t.id === sel);
  const linkProblems = problems.filter((p) => p.key === 'links' || p.key.startsWith('links.'));
  return (
    <Card title="Activity logic" right={<Pill text="the game's own rule: an activity opens when everything it waits for is done" />}>
      <Text style={[s.small, { marginBottom: 10 }]}>
        {Platform.OS === 'web' ? 'Click an activity to select it, then click another to make the selected one wait for it (click again to remove the link). ' : ''}
        Arrows point from an activity to the ones that open after it. Activities with nothing to wait for are open from the start.
      </Text>
      <LogicGraph nodes={nodesOf(resolved.tasks, added, edited)} selected={sel} onSelect={setSel} onToggle={(w, o) => (wouldLoop(w, o) && !(resolved.tasks.find((t) => t.id === w)?.requires ?? []).includes(o) ? null : toggle(w, o))} readOnly={!canEdit} />
      {linkProblems.map((p, i) => (
        <Note key={i} tone={p.level === 'error' ? 'bad' : 'warn'}>
          {p.message}
        </Note>
      ))}
      <View style={{ marginTop: 12 }}>
        <Text style={s.label}>{selTask ? `"${selTask.title}" waits for` : 'Select an activity to change what it waits for'}</Text>
        {selTask ? (
          <View style={s.row}>
            {resolved.tasks
              .filter((t) => t.id !== selTask.id)
              .map((t) => {
                const on = (selTask.requires ?? []).includes(t.id);
                const loop = !on && wouldLoop(selTask.id, t.id);
                return (
                  <Pressable
                    key={t.id}
                    disabled={!canEdit || loop}
                    onPress={() => toggle(selTask.id, t.id)}
                    style={[s.btn, s.btnSmall, { borderColor: on ? C.accent : C.line, backgroundColor: on ? C.accentSoft : '#fff', opacity: loop ? 0.4 : 1 }]}
                    testID={`wait-${selTask.id}-${t.id}`}
                    accessibilityLabel={`${selTask.title} waits for ${t.title}: ${on ? 'yes' : 'no'}`}
                  >
                    <Text style={{ fontSize: 12 }}>
                      {on ? '✓ ' : ''}
                      {t.title}
                      {loop ? ' (would make a loop)' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            {edited.has(selTask.id) ? <Btn small kind="quiet" label="Back to the world's own links" onPress={() => setReq(selTask.id, baseReq(selTask.id))} /> : null}
          </View>
        ) : null}
      </View>
      <Text style={[s.small, { marginTop: 10 }]}>
        This editor changes only the order in which activities open. What happens inside an activity is set by its template. There is no cross-world progression in the game (every world is open), so there is nothing to edit for that.
      </Text>
    </Card>
  );
}

/* ------------------------------ form fields ------------------------------ */

function RefsField({ spec, value, onChange, testID }: { spec: Spec; value: [number, number][]; onChange: (v: [number, number][]) => void; testID: string }) {
  const [text, setText] = useState(value.map((r) => r.join(':')).join(', '));
  const bad = text.trim() !== '' && !parseRefs(text);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{spec.label}</Text>
      <TextInput
        style={[s.input, bad && { borderColor: C.bad }]}
        value={text}
        testID={testID}
        accessibilityLabel={spec.label}
        placeholder="e.g. 11:40, 11:41"
        onChangeText={(t) => {
          setText(t);
          if (!t.trim()) onChange([]);
          else {
            const p = parseRefs(t);
            if (p) onChange(p);
          }
        }}
      />
      {spec.hint ? <Text style={s.hint}>{spec.hint}</Text> : null}
      {bad ? <Text style={[s.small, { color: C.bad }]}>Write references as surah:ayah, separated by commas.</Text> : null}
      {value.length ? <LockedAyahs refs={value} /> : null}
    </View>
  );
}

function SpotField({ spec, value, onChange, def, testID, picking, setPicking }: { spec: Spec; value: [number, number]; onChange: (v: [number, number]) => void; def: WorldDef; testID: string; picking: string | null; setPicking: (k: string | null) => void }) {
  const on = picking === testID;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{spec.label}</Text>
      <View style={s.row}>
        <TextInput style={[s.input, { width: 90 }]} value={String(value?.[0] ?? '')} onChangeText={(t) => onChange([Number(t), value?.[1] ?? 0])} keyboardType="numeric" accessibilityLabel={`${spec.label} x`} testID={`${testID}-x`} />
        <TextInput style={[s.input, { width: 90 }]} value={String(value?.[1] ?? '')} onChangeText={(t) => onChange([value?.[0] ?? 0, Number(t)])} keyboardType="numeric" accessibilityLabel={`${spec.label} z`} testID={`${testID}-z`} />
        {Platform.OS === 'web' ? <Btn small label={on ? 'Click the map…' : 'Place on the map'} kind={on ? 'primary' : 'plain'} onPress={() => setPicking(on ? null : testID)} testID={`${testID}-pick`} /> : null}
      </View>
      {on ? (
        <View style={{ marginTop: 8 }}>
          <SpotMap
            def={def}
            value={value}
            onPick={(p) => {
              onChange(p);
              setPicking(null);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

function SpecFields({ specs, v, set, def, prefix, picking, setPicking }: { specs: Spec[]; v: Values; set: (k: string, x: any) => void; def: WorldDef; prefix: string; picking: string | null; setPicking: (k: string | null) => void }) {
  return (
    <>
      {specs.map((sp) => {
        const id = `${prefix}${sp.key}`;
        const x = v[sp.key];
        if (sp.type === 'text' || sp.type === 'longtext')
          return <Input key={sp.key} label={sp.label + (sp.required ? '' : ' (optional)')} hint={sp.hint} multiline={sp.type === 'longtext'} value={String(x ?? '')} onChangeText={(t) => set(sp.key, t)} testID={id} />;
        if (sp.type === 'number')
          return (
            <View key={sp.key} style={{ width: 260 }}>
              <Input label={`${sp.label} (${sp.min}–${sp.max})`} hint={sp.hint} value={String(x ?? '')} onChangeText={(t) => set(sp.key, t === '' ? NaN : Number(t))} keyboardType="numeric" testID={id} />
            </View>
          );
        if (sp.type === 'bool')
          return (
            <View key={sp.key} style={[s.row, { marginBottom: 12 }]}>
              <Switch value={!!x} onValueChange={(b) => set(sp.key, b)} accessibilityLabel={sp.label} testID={id} />
              <Text style={s.body}>{sp.label}</Text>
            </View>
          );
        if (sp.type === 'enum')
          return (
            <View key={sp.key} style={{ marginBottom: 12 }}>
              <Text style={s.label}>{sp.label}</Text>
              <View style={s.row}>
                {sp.options.map((o) => (
                  <Pressable key={o.id} onPress={() => set(sp.key, o.id)} style={[s.btn, s.btnSmall, { borderColor: x === o.id ? C.accent : C.line, backgroundColor: x === o.id ? C.accentSoft : '#fff' }]} testID={`${id}-${o.id}`} accessibilityRole="radio" accessibilityState={{ checked: x === o.id }}>
                    <Text style={{ fontSize: 12 }}>{o.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        if (sp.type === 'spot') return <SpotField key={sp.key} spec={sp} value={x} onChange={(p) => set(sp.key, p)} def={def} testID={id} picking={picking} setPicking={setPicking} />;
        if (sp.type === 'refs') return <RefsField key={sp.key} spec={sp} value={x ?? []} onChange={(r) => set(sp.key, r)} testID={id} />;
        if (sp.type === 'list') {
          const list: Values[] = x ?? [];
          return (
            <View key={sp.key} style={{ marginBottom: 12 }}>
              <Text style={s.label}>
                {sp.label} ({list.length}; {sp.min} to {sp.max})
              </Text>
              {list.map((it, i) => (
                <View key={i} style={{ borderLeftWidth: 3, borderColor: C.line, paddingLeft: 12, marginBottom: 8 }}>
                  <View style={[s.row, { marginBottom: 6 }]}>
                    <Text style={s.h3}>
                      {sp.itemLabel} {i + 1}
                    </Text>
                    <Btn small kind="quiet" label="Remove" onPress={() => set(sp.key, list.filter((_, j) => j !== i))} disabled={list.length <= sp.min} />
                  </View>
                  <SpecFields specs={sp.item} v={it} set={(k, y) => set(sp.key, list.map((o, j) => (j === i ? { ...o, [k]: y } : o)))} def={def} prefix={`${id}.${i}.`} picking={picking} setPicking={setPicking} />
                </View>
              ))}
              <Btn small label={`Add ${sp.itemLabel.toLowerCase()}`} onPress={() => set(sp.key, [...list, initial(sp.item, [def.start[0] + 3 * (list.length + 1), def.start[1] - 3 * (list.length + 1)])])} disabled={list.length >= sp.max} testID={`${id}-add`} />
            </View>
          );
        }
        return null;
      })}
    </>
  );
}

/* ------------------------------ builder ------------------------------ */

export function ActivityBuilder({ def, ed, canEdit, problems }: { def: WorldDef; ed: Ed; canEdit: boolean; problems: Problem[] }) {
  const resolved = useMemo(() => applyOverlay(def, ed.doc).def, [def, ed.doc]);
  const [tid, setTid] = useState<string | null>(null);
  const t = tid ? templateById(tid) : undefined;
  const [common, setCommon] = useState({ title: '', goal: '', intro: '', outro: '', after: '', adaptation: '' });
  const [v, setV] = useState<Values>({});
  const [picking, setPicking] = useState<string | null>(null);
  const start = (id: string) => {
    const tt = templateById(id)!;
    setTid(id);
    setV(initial(tt.specs, def.start));
    setCommon({ title: '', goal: '', intro: '', outro: '', after: resolved.tasks[resolved.tasks.length - 1]?.id ?? '', adaptation: '' });
  };
  const formErr = t
    ? [
        ...(!common.title.trim() ? [{ key: 'title', message: 'Title: needed' }] : []),
        ...(!common.goal.trim() ? [{ key: 'goal', message: 'Instruction: needed' }] : []),
        ...(!common.adaptation.trim() ? [{ key: 'adaptation', message: 'Say what in this activity is a game idea, not the Quran’s account' }] : []),
        ...formProblems(t.specs, v, def.ground.radius),
      ]
    : [];
  const add = () => {
    if (!t) return;
    const id = `x-${t.kind}-${Date.now().toString(36)}`;
    const task = buildTask(t, common, v, id);
    ed.change((d) => ({ ...d, add: { ...(d.add ?? {}), tasks: [...(d.add?.tasks ?? []), task] } }));
    setTid(null);
  };
  const addedTasks = ed.doc.add?.tasks ?? [];
  const remove = (id: string) =>
    ed.change((d) => {
      const tasks = (d.add?.tasks ?? []).filter((x) => x.id !== id);
      const links = Object.fromEntries(Object.entries(d.links ?? {}).filter(([k]) => k !== id).map(([k, l]) => [k, l.filter((x) => x !== id)]));
      const next: Overlay = { ...d, add: { ...(d.add ?? {}), tasks }, links, order: d.order?.filter((x) => x !== id) };
      if (!Object.keys(links).length) delete next.links;
      if (!next.order?.length) delete next.order;
      return next;
    });
  return (
    <View>
      <Card title="Activities added in the studio" right={<Text style={s.small}>{addedTasks.length} in this draft</Text>}>
        {!addedTasks.length ? <Text style={s.small}>None yet. Choose a template below.</Text> : null}
        {addedTasks.map((x, i) => (
          <View key={x.id} style={s.tr} testID={`added-${x.id}`}>
            <Text style={[s.body, { flex: 1 }]}>
              {x.title} <Text style={s.small}>· {TEMPLATES.find((tt) => tt.kind === x.kind)?.label ?? x.kind} · {spotsOf(x).length} place(s){x.requires?.length ? ` · after ${x.requires.join(', ')}` : ''}</Text>
            </Text>
            {problems
              .filter((p) => p.key === `add.tasks.${i}`)
              .slice(0, 2)
              .map((p, j) => (
                <Pill key={j} text={p.message} tone={p.level === 'error' ? 'bad' : 'warn'} />
              ))}
            <Btn small kind="quiet" label="Remove" onPress={() => remove(x.id)} disabled={!canEdit} />
          </View>
        ))}
      </Card>
      <Card title="Add an activity from a template">
        <Text style={[s.small, { marginBottom: 10 }]}>Every template is an activity the game already plays in any world. Positions are in metres from the world's centre.</Text>
        <View style={[s.row, { alignItems: 'stretch' }]}>
          {TEMPLATES.map((tt) => (
            <Pressable
              key={tt.id}
              disabled={!canEdit}
              onPress={() => start(tt.id)}
              style={[{ width: 220, borderWidth: 1, borderRadius: 10, padding: 10, borderColor: tid === tt.id ? C.accent : C.line, backgroundColor: tid === tt.id ? C.accentSoft : '#fff', opacity: canEdit ? 1 : 0.5 }]}
              testID={`tpl-${tt.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Template: ${tt.label}`}
            >
              <Text style={s.h3}>{tt.label}</Text>
              <Text style={s.small}>{tt.what}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      {t ? (
        <Card title={`New activity: ${t.label}`} right={<Btn small kind="quiet" label="Cancel" onPress={() => setTid(null)} />}>
          <Input label="Title (shown in the activity list)" value={common.title} onChangeText={(x) => setCommon({ ...common, title: x })} testID="act-title" />
          <Input label="Instruction for the child" value={common.goal} onChangeText={(x) => setCommon({ ...common, goal: x })} testID="act-goal" placeholder="e.g. Lead the sheep to the fold" />
          <Input label="Narration when it opens (optional)" multiline value={common.intro} onChangeText={(x) => setCommon({ ...common, intro: x })} testID="act-intro" />
          <Input label="Narration when it is done (optional)" multiline value={common.outro} onChangeText={(x) => setCommon({ ...common, outro: x })} testID="act-outro" />
          <Input label="What in this activity is a game idea, not the Quran's account" multiline value={common.adaptation} onChangeText={(x) => setCommon({ ...common, adaptation: x })} testID="act-adaptation" hint="Shown to families in “About this world”." />
          <View style={{ marginBottom: 12 }}>
            <Text style={s.label}>Opens after</Text>
            <View style={s.row}>
              <Pressable onPress={() => setCommon({ ...common, after: '' })} style={[s.btn, s.btnSmall, { borderColor: C.line, backgroundColor: !common.after ? C.accentSoft : '#fff' }]}>
                <Text style={{ fontSize: 12 }}>Open from the start</Text>
              </Pressable>
              {resolved.tasks.map((x) => (
                <Pressable key={x.id} onPress={() => setCommon({ ...common, after: x.id })} style={[s.btn, s.btnSmall, { borderColor: C.line, backgroundColor: common.after === x.id ? C.accentSoft : '#fff' }]} testID={`act-after-${x.id}`}>
                  <Text style={{ fontSize: 12 }}>{x.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <SpecFields specs={t.specs} v={v} set={(k, x) => setV((o) => ({ ...o, [k]: x }))} def={resolved} prefix="act-" picking={picking} setPicking={setPicking} />
          {formErr.length ? <Note tone="warn">{formErr.slice(0, 4).map((e) => e.message).join(' · ')}</Note> : null}
          <View style={s.row}>
            <Btn label="Add to draft" kind="primary" onPress={add} disabled={!canEdit || formErr.length > 0} testID="act-add" />
            <Text style={s.small}>It appears in play tests of the draft at once; players get it only after review and publishing.</Text>
          </View>
        </Card>
      ) : null}
    </View>
  );
}

export type { Task };
