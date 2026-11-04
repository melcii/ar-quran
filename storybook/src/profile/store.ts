// Explorer profiles on this device: several children can play on one device,
// each with their own nickname, look and saves (worlds, Ark, journal, reading
// progress, bookmarks and settings). Only a nickname and a look are kept, never
// a real name, photo, age or location, and nothing leaves the device.
//
// The rest of the app keeps reading and writing its usual storage keys. Those
// keys always hold the active explorer's saves; the other explorers' saves are
// packed away under their own key, and swapped in when someone switches.
import { useSyncExternalStore } from 'react';
import { cleanLook, DEFAULT_LOOK, type Look } from './look';

export type Profile = { id: string; nickname: string; look: Look; created: number };
type Book = { active: string; list: Profile[] };

const KEY = 'quran-adventure.profiles.v1';
const BUCKET = (id: string) => `quran-adventure.profile-data.${id}`;
export const MAX_PROFILES = 6;

const ls = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

/** The keys that belong to the active explorer. */
export const isLiveKey = (k: string) => (k.startsWith('quran-adventure.') && !k.startsWith('quran-adventure.profile')) || k.startsWith('quran-storybook/');

/** Nicknames: letters, numbers and spaces, up to 16 characters. */
export function cleanNick(s: string) {
  return s.replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16);
}

const A = ['Swift', 'Quiet', 'Bright', 'Gentle', 'Brave', 'Kind', 'Patient', 'Curious', 'Happy', 'Careful'];
const B = ['Falcon', 'Olive', 'Pebble', 'Dove', 'Palm', 'River', 'Cedar', 'Lantern', 'Hoopoe', 'Fig'];
/** A made-up nickname, so no child needs to type a real name. */
export const suggestNick = () => `${A[Math.floor(Math.random() * A.length)]} ${B[Math.floor(Math.random() * B.length)]}`;

const newId = () => `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

let book: Book | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function load(): Book {
  if (book) return book;
  const s = ls();
  try {
    const raw = JSON.parse(s?.getItem(KEY) ?? 'null');
    if (raw && Array.isArray(raw.list) && raw.list.length) {
      const list: Profile[] = raw.list
        .filter((p: Profile) => p && typeof p.id === 'string')
        .map((p: Profile) => ({ id: p.id, nickname: cleanNick(String(p.nickname ?? '')) || 'Explorer', look: cleanLook(p.look), created: Number(p.created) || 0 }));
      if (list.length) {
        book = { active: list.some((p) => p.id === raw.active) ? raw.active : list[0].id, list };
        return book;
      }
    }
  } catch {}
  // The first explorer keeps any saves already on this device.
  book = { active: 'p1', list: [{ id: 'p1', nickname: 'Explorer', look: DEFAULT_LOOK, created: Date.now() }] };
  write();
  return book;
}

function write() {
  try {
    ls()?.setItem(KEY, JSON.stringify(book));
  } catch {}
  emit();
}

export const profiles = {
  get: () => load(),
  active: (): Profile => {
    const b = load();
    return b.list.find((p) => p.id === b.active) ?? b.list[0];
  },
  subscribe(f: () => void) {
    subs.add(f);
    return () => subs.delete(f);
  },
  /** Change the active (or another) explorer's nickname or look. */
  update(id: string, patch: Partial<Pick<Profile, 'nickname' | 'look'>>) {
    const b = load();
    book = { ...b, list: b.list.map((p) => (p.id === id ? { ...p, ...(patch.nickname != null ? { nickname: cleanNick(patch.nickname) || p.nickname } : {}), ...(patch.look ? { look: cleanLook(patch.look) } : {}) } : p)) };
    write();
  },
  /** Add an explorer with empty saves. Returns its id, or null when the device is full. */
  add(nickname: string, look: Look = DEFAULT_LOOK): string | null {
    const b = load();
    if (b.list.length >= MAX_PROFILES) return null;
    const id = newId();
    try {
      ls()?.setItem(BUCKET(id), '{}');
    } catch {}
    book = { ...b, list: [...b.list, { id, nickname: cleanNick(nickname) || suggestNick(), look: cleanLook(look), created: Date.now() }] };
    write();
    return id;
  },
  /** Make another explorer the active one: pack away the current saves and unpack theirs. */
  switchTo(id: string) {
    const b = load();
    if (id === b.active || !b.list.some((p) => p.id === id)) return false;
    const s = ls();
    if (s) {
      const live: Record<string, string> = {};
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i)!;
        if (isLiveKey(k)) live[k] = s.getItem(k) ?? '';
      }
      s.setItem(BUCKET(b.active), JSON.stringify(live));
      Object.keys(live).forEach((k) => s.removeItem(k));
      let next: Record<string, string> = {};
      try {
        next = JSON.parse(s.getItem(BUCKET(id)) ?? '{}') ?? {};
      } catch {}
      for (const [k, v] of Object.entries(next)) if (isLiveKey(k)) s.setItem(k, v);
      s.removeItem(BUCKET(id));
    }
    book = { ...b, active: id };
    write();
    return true;
  },
  /** Remove an explorer who is not the active one, with all their saves. */
  remove(id: string) {
    const b = load();
    if (id === b.active) return false;
    try {
      ls()?.removeItem(BUCKET(id));
    } catch {}
    book = { ...b, list: b.list.filter((p) => p.id !== id) };
    write();
    return true;
  },
};

export function useProfiles() {
  return useSyncExternalStore(profiles.subscribe, profiles.get, profiles.get);
}
export function useActiveProfile() {
  useProfiles();
  return profiles.active();
}
