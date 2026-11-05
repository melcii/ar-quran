// The voice director: one place that decides which voice is speaking, so the
// story narrator and the Quran recitation never overlap.
//
// - Narration lines queue and play one after another, each shown as a subtitle.
// - Instructions are short hints; one that arrives while someone is speaking
//   is dropped rather than queued, so hints never pile up.
// - When a recitation starts, narration stops at once and waits; it never
//   talks over the Quran.
// - A line plays from a licensed recording when the catalog has one for the
//   chosen narrator, otherwise from the device's own young-sounding voice.
// Narration is creative educational text and is always labelled as such;
// it is never used for Quran text.
import { Platform } from 'react-native';
import { clipFor, lineId } from './catalog';
import { speakKid, stopVoice } from '@/state/voice';
import type { ListenMode } from '@/state/AppState';

export type LineKind = 'narration' | 'instruction';
/** subtitle: show it in the subtitle strip (false when the text is already on screen in a card). */
export type Line = { id: string; text: string; kind: LineKind; source: 'recorded' | 'device'; subtitle: boolean };

type Config = { mode: ListenMode; narrator: string; language: string; narrationVolume: number; instructionVolume: number; voiceOn: boolean };

let cfg: Config = { mode: 'both', narrator: 'device-child-en', language: 'en', narrationVolume: 1, instructionVolume: 0.85, voiceOn: true };
let now: Line | null = null;
let queue: { text: string; kind: LineKind; subtitle: boolean }[] = [];
let reciting = false;
let audio: HTMLAudioElement | null = null;
let idle: (() => void)[] = [];
let token = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const log: { at: number; kind: string; text: string }[] = [];

/** Whether the voice of a kind may speak under the current settings. */
const allowed = (kind: LineKind) => cfg.voiceOn && (kind === 'instruction' ? cfg.mode !== 'quiet' : cfg.mode === 'both' || cfg.mode === 'narration');

function finish(t: number) {
  if (t !== token) return;
  now = null;
  audio = null;
  emit();
  // A short breath between lines, then the next one.
  setTimeout(() => (t === token ? pump() : null), 250);
}

function pump() {
  if (now || reciting) return;
  const next = queue.shift();
  if (!next) {
    const run = idle;
    idle = [];
    run.forEach((f) => f());
    return;
  }
  const t = ++token;
  const clip = clipFor(next.text, cfg.narrator, cfg.language);
  const vol = next.kind === 'instruction' ? cfg.instructionVolume : cfg.narrationVolume;
  now = { id: lineId(next.text), text: next.text, kind: next.kind, source: clip ? 'recorded' : 'device', subtitle: next.subtitle };
  log.push({ at: Date.now(), kind: next.kind, text: next.text });
  emit();
  if (clip && Platform.OS === 'web') {
    audio = new Audio(clip.file);
    audio.volume = vol;
    audio.onended = () => finish(t);
    audio.onerror = () => finish(t);
    audio.play().catch(() => finish(t));
    return;
  }
  const end = () => finish(t);
  speakKid(next.text, { onDone: end, onStopped: end, onError: end }, 1, vol);
  // Safety net: if the device never reports the end (no voices), move on.
  setTimeout(end, 3000 + next.text.length * 110);
}

function cut() {
  token++;
  stopVoice();
  if (audio) {
    audio.onended = null;
    audio.pause();
  }
  audio = null;
  now = null;
}

export const director = {
  configure(c: Partial<Config>) {
    cfg = { ...cfg, ...c };
    if (now && !allowed(now.kind)) director.stop();
  },
  get config() {
    return cfg;
  },
  /** Queue a narration line (story voice). */
  narrate(text: string, subtitle = true) {
    if (!text || !allowed('narration')) return false;
    queue.push({ text, kind: 'narration', subtitle });
    pump();
    return true;
  },
  /** A short hint; dropped if a voice is already speaking. */
  instruct(text: string) {
    if (!text || !allowed('instruction') || now || reciting || queue.length) return false;
    queue.push({ text, kind: 'instruction', subtitle: true });
    pump();
    return true;
  },
  /** Read a line now, replacing whatever narration is playing (a "read aloud" button). */
  readNow(text: string, subtitle = false) {
    if (!text || !cfg.voiceOn || reciting) return false;
    queue = [];
    cut();
    queue.push({ text, kind: 'narration', subtitle });
    pump();
    return true;
  },
  /** Run once the narrator has nothing left to say (or at once if silent). */
  whenIdle(f: () => void) {
    if (!now && !queue.length) f();
    else idle.push(f);
  },
  stop() {
    queue = [];
    idle = [];
    cut();
    emit();
  },
  /** Called by the recitation player. Narration stops and waits for the Quran. */
  recitation(active: boolean) {
    if (active === reciting) return;
    reciting = active;
    if (active) {
      // The line that was cut is not repeated; later lines wait.
      cut();
      emit();
    } else setTimeout(pump, 400);
  },
  get reciting() {
    return reciting;
  },
  current: () => now,
  subscribe(f: () => void) {
    subs.add(f);
    return () => subs.delete(f);
  },
  /** Test hooks: what was spoken, and what is waiting. */
  log,
  pending: () => ({ queue: queue.length, idle: idle.length, token }),
};

if (typeof globalThis !== 'undefined') (globalThis as { __voice?: unknown }).__voice = director;
