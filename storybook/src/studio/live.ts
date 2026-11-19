// How the game picks up content published from the Admin Studio.
//
// The game always has its built-in worlds. If the studio server is
// configured (EXPO_PUBLIC_STUDIO_URL, public by design), it also reads the
// published overlay for a world from the server's /api/live and keeps a copy
// on the device. A newly
// published version is used the next time a world is opened, never in the
// middle of play, and progress is stored apart from content, so publishing
// or rolling back never changes a child's saves.
//
// Studio preview modes (?studio=draft|published) are for signed-in staff
// only; the draft is fetched with the staff member's own session and the
// server refuses it to anyone else.
import { useEffect, useState } from 'react';
import { WORLDS } from '@/adventure/worlds';
import type { WorldDef } from '@/adventure/types';
import { applyOverlay, type Overlay } from './overlay';

// The studio server's address, e.g. https://studio.example.org (storybook/server).
export const STUDIO_URL = (process.env.EXPO_PUBLIC_STUDIO_URL ?? '').replace(/\/$/, '');
export const studioConfigured = () => !!STUDIO_URL;

export type Live = { doc: Overlay | null; number: number | null; hash: string | null };
export type StudioMode = 'play' | 'draft' | 'published' | 'built-in';

const CACHE = (scope: string) => `quran-adventure.live.${scope}`;
const store = () => (typeof localStorage !== 'undefined' ? localStorage : null);

function cached(scope: string): Live | null {
  try {
    return JSON.parse(store()?.getItem(CACHE(scope)) ?? 'null');
  } catch {
    return null;
  }
}

/** Read the published overlay for a scope. Plain fetch: no SDK in the children's game. */
export async function fetchLive(scope: string, timeoutMs = 2500): Promise<Live | null> {
  if (!studioConfigured()) return null;
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctl?.abort(), timeoutMs);
  try {
    const r = await fetch(`${STUDIO_URL}/api/live?scope=${encodeURIComponent(scope)}`, {
      headers: { Accept: 'application/json' },
      signal: ctl?.signal,
    });
    if (!r.ok) return null;
    const rows = (await r.json()) as Live[];
    const live: Live = rows[0] ? { doc: rows[0].doc, number: rows[0].number, hash: rows[0].hash } : { doc: null, number: null, hash: null };
    store()?.setItem(CACHE(scope), JSON.stringify(live));
    return live;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** The address bar's studio mode, if any. */
export function studioMode(): StudioMode {
  try {
    const m = new URLSearchParams(globalThis.location?.search ?? '').get('studio');
    return m === 'draft' || m === 'published' || m === 'built-in' ? m : 'play';
  } catch {
    return 'play';
  }
}

/** Saves made while play-testing go here, never into a player's own progress. */
export const playtestKey = (key: string) => `quran-studio.playtest.${key}`;

type Loader = (scope: string) => Promise<Overlay | null>;
let draftLoader: Loader | null = null;
/** The studio registers how to fetch a draft with the staff session (see session.ts). */
export function setDraftLoader(f: Loader) {
  draftLoader = f;
}

export type Resolved = { def: WorldDef | undefined; mode: StudioMode; version: number | null; ready: boolean; skipped: number };
export type ResolvedDoc = { doc: Overlay | null; mode: StudioMode; version: number | null; ready: boolean };

/**
 * The studio document for a scope as it should be played now (any scope:
 * the Ark settings, the character catalog). Same rules as worlds: the cached
 * published copy at once, else the network within a short wait, else
 * nothing (built-in). Studio modes fetch the draft or the published copy.
 */
export function useResolvedDoc(scope: string): ResolvedDoc {
  const mode = studioMode();
  const [state, setState] = useState<ResolvedDoc>(() => {
    if (mode === 'built-in' || !studioConfigured()) return { doc: null, mode, version: null, ready: true };
    if (mode === 'play') {
      const c = cached(scope);
      if (c) return { doc: c.doc, mode, version: c.number, ready: true };
    }
    return { doc: null, mode, version: null, ready: false };
  });
  useEffect(() => {
    let gone = false;
    if (mode === 'draft') {
      (async () => {
        const loader = draftLoader ?? (await import('./session')).loadDraftDoc;
        const doc = await loader(scope).catch(() => null);
        if (!gone) setState({ doc, mode, version: null, ready: true });
      })();
    } else if (mode === 'published' || (mode === 'play' && !state.ready)) {
      fetchLive(scope).then((live) => !gone && setState({ doc: live?.doc ?? null, mode, version: live?.number ?? null, ready: true }));
    } else if (mode === 'play') fetchLive(scope);
    return () => {
      gone = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, mode]);
  return state;
}

/**
 * The world as it should be played now. In ordinary play: the cached
 * published copy at once, or (on a first visit) the network answer within a
 * short wait, else the built-in world. In studio modes: the draft, the
 * published version or the built-in world as asked.
 */
export function useResolvedWorld(n: number): Resolved {
  const base = WORLDS[n];
  const mode = studioMode();
  const scope = `surah:${n}`;
  const [state, setState] = useState<Resolved>(() => {
    if (!base) return { def: undefined, mode, version: null, ready: true, skipped: 0 };
    if (mode === 'built-in' || !studioConfigured()) return { def: base, mode: mode === 'play' ? 'play' : mode, version: null, ready: true, skipped: 0 };
    if (mode === 'play') {
      const c = cached(scope);
      if (c) {
        const a = applyOverlay(base, c.doc);
        return { def: a.def, mode, version: c.number, ready: true, skipped: a.skipped.length };
      }
    }
    return { def: base, mode, version: null, ready: false, skipped: 0 };
  });
  useEffect(() => {
    if (!base) return;
    let gone = false;
    if (mode === 'draft') {
      (async () => {
        const loader = draftLoader ?? (await import('./session')).loadDraftDoc;
        const doc = await loader(scope).catch(() => null);
        const a = applyOverlay(base, doc);
        if (!gone) setState({ def: a.def, mode, version: null, ready: true, skipped: a.skipped.length });
      })();
    } else if (mode === 'published' || (mode === 'play' && !state.ready)) {
      fetchLive(scope).then((live) => {
        if (gone) return;
        const a = applyOverlay(base, live?.doc ?? null);
        setState({ def: a.def, mode, version: live?.number ?? null, ready: true, skipped: a.skipped.length });
      });
    } else if (mode === 'play') {
      // Refresh the copy for next time; this visit keeps what it started with.
      fetchLive(scope);
    }
    return () => {
      gone = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, mode]);
  return state;
}
