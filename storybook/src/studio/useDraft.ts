// Editing a draft: load it (or start from what is published), keep an
// undo/redo history, autosave a few seconds after the last change, and
// report conflicts when someone else saved in between. Pure data: no AI,
// no network calls beyond the studio's own database.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Overlay } from './overlay';
import { getDraft, liveDoc, saveDraft } from './session';

export type SaveState = 'loading' | 'saved' | 'unsaved' | 'saving' | 'error' | 'conflict';

export function useDraft(scope: string, autosaveMs = 2500) {
  const [doc, setDocState] = useState<Overlay>({ v: 1 });
  const [state, setState] = useState<SaveState>('loading');
  const [error, setError] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const rev = useRef(0);
  const past = useRef<Overlay[]>([]);
  const future = useRef<Overlay[]>([]);
  const [, bump] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(doc);
  latest.current = doc;

  const reload = useCallback(async () => {
    setState('loading');
    try {
      const d = await getDraft(scope);
      if (d) {
        rev.current = d.revision;
        setDocState(d.doc);
        setHasDraft(true);
        setUpdatedAt(d.updated_at);
      } else {
        rev.current = 0;
        setDocState((await liveDoc(scope)) ?? { v: 1 });
        setHasDraft(false);
        setUpdatedAt(null);
      }
      past.current = [];
      future.current = [];
      setState('saved');
      setError('');
    } catch (e: any) {
      setState('error');
      setError(e.message);
    }
  }, [scope]);
  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setState('saving');
    try {
      rev.current = await saveDraft(scope, latest.current, rev.current);
      setHasDraft(true);
      setUpdatedAt(new Date().toISOString());
      setState('saved');
      setError('');
    } catch (e: any) {
      const conflict = /reload|newer/.test(e.message ?? '');
      setState(conflict ? 'conflict' : 'error');
      setError(e.message);
    }
  }, [scope]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, autosaveMs);
  }, [save, autosaveMs]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const change = useCallback(
    (f: (d: Overlay) => Overlay) => {
      past.current.push(latest.current);
      if (past.current.length > 200) past.current.shift();
      future.current = [];
      const n = f(latest.current);
      latest.current = n;
      setDocState(n);
      setState('unsaved');
      schedule();
    },
    [schedule],
  );
  const undo = useCallback(() => {
    const p = past.current.pop();
    if (!p) return;
    future.current.push(latest.current);
    latest.current = p;
    setDocState(p);
    setState('unsaved');
    schedule();
    bump((x) => x + 1);
  }, [schedule]);
  const redo = useCallback(() => {
    const n = future.current.pop();
    if (!n) return;
    past.current.push(latest.current);
    latest.current = n;
    setDocState(n);
    setState('unsaved');
    schedule();
    bump((x) => x + 1);
  }, [schedule]);

  /** Set one field; setting it back to the recipe's own value removes the edit. */
  const setField = useCallback(
    (path: string, value: unknown, baseValue: unknown) =>
      change((d) => {
        const set = { ...(d.set ?? {}) };
        if (JSON.stringify(value) === JSON.stringify(baseValue)) delete set[path];
        else set[path] = value as any;
        return { ...d, set };
      }),
    [change],
  );

  return { doc, state, error, hasDraft, updatedAt, change, setField, save, reload, undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}
