// The save bar for a draft: its state, undo/redo, save, discard and submit
// for review. Used by the studio editors that are not world pages.
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { Problem } from './overlay';
import { discardDraft, submitDraft } from './session';
import type { useDraft } from './useDraft';
import { Btn, C, Card, Note, s, when } from './ui';

export function DraftBar({ scope, ed, problems, canSubmit, onSubmitted }: { scope: string; ed: ReturnType<typeof useDraft>; problems: Problem[]; canSubmit: boolean; onSubmitted?: () => void }) {
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const errors = problems.filter((p) => p.level === 'error');
  const label = { loading: 'Loading…', saved: ed.hasDraft ? `Draft saved ${when(ed.updatedAt)}` : 'No draft yet: editing a copy of what is live', unsaved: 'Unsaved changes (autosave in a moment)', saving: 'Saving…', error: `Not saved: ${ed.error}`, conflict: 'Someone else saved this draft. Reload to continue.' }[ed.state];
  const submit = async () => {
    setMsg(null);
    try {
      if (ed.state !== 'saved') await ed.save();
      const id = await submitDraft(scope, note);
      setMsg({ tone: 'good', text: `Submitted for review (version id ${id}). A reviewer approves it, then a Super Admin publishes it.` });
      setNote('');
      onSubmitted?.();
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };
  return (
    <>
      <Card style={{ backgroundColor: '#fbfaf6' }}>
        <View style={s.row}>
          <Text style={[s.body, { flex: 1, color: ed.state === 'error' || ed.state === 'conflict' ? C.bad : C.soft }]} testID="save-state">
            {label}
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
            <Btn label="Submit for review" kind="primary" onPress={submit} disabled={errors.length > 0 || !canSubmit} testID="submit" />
          </View>
        ) : null}
      </Card>
      {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
    </>
  );
}
