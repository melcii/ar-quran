// The read-aloud voice for explanations and narration (never for Quran text).
// It uses the device's own speech voices, so how it sounds depends on the
// device. We pick the most natural voice available and lift it toward a
// child's voice:
//   1. A real child voice when the device has one (Microsoft Ana on Edge and
//      Windows is a child's voice).
//   2. Otherwise a natural or neural voice (Edge "Online (Natural)", Apple
//      "Enhanced"/"Premium", Google), with a higher pitch and a lighter pace.
//   3. Otherwise the default voice, also with a higher pitch.
// Text is read one sentence at a time with a short pause between, which
// sounds less flat and avoids long utterances being cut off in Chrome.
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

type Done = { onDone?: () => void; onStopped?: () => void; onError?: () => void };

const CHILD = [/\bAna\b/i, /\bJunior\b/i, /\bchild\b/i, /\bkid\b/i];
const NATURAL = [/natural/i, /neural/i, /premium/i, /enhanced/i, /online/i, /\bGoogle\b/i];
// Warm, lighter voices that sound younger once pitched up.
const LIGHT = [/Aria/i, /Jenny/i, /Ava/i, /Emma/i, /Samantha/i, /Libby/i, /Sonia/i, /Natasha/i, /Female/i, /Karen/i, /Moira/i, /Tessa/i, /Allison/i, /Susan/i, /Zira/i];

const web = () => Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window;

let chosen: { voice: SpeechSynthesisVoice | null; pitch: number; rate: number } | null = null;

function score(v: SpeechSynthesisVoice) {
  let s = 0;
  if (!/^en/i.test(v.lang)) return -100;
  if (CHILD.some((r) => r.test(v.name))) s += 100;
  if (NATURAL.some((r) => r.test(v.name))) s += 40;
  if (LIGHT.some((r) => r.test(v.name))) s += 15;
  if (/en[-_](US|GB)/i.test(v.lang)) s += 3;
  if (v.localService) s += 1;
  return s;
}

/** The voice to use, chosen once the device has listed its voices. */
export function pickVoice() {
  if (!web()) return { voice: null, pitch: 1.25, rate: 0.95 };
  if (chosen) return chosen;
  const list = window.speechSynthesis.getVoices();
  if (!list.length) return { voice: null, pitch: 1.3, rate: 0.95 };
  const best = [...list].sort((a, b) => score(b) - score(a))[0];
  const child = !!best && CHILD.some((r) => r.test(best.name));
  chosen = { voice: best ?? null, pitch: child ? 1.05 : 1.3, rate: child ? 0.98 : 0.95 };
  return chosen;
}
if (web()) window.speechSynthesis.addEventListener?.('voiceschanged', () => (chosen = null));

/** Split into sentences, keeping short ones together. */
function sentences(text: string) {
  const parts = text.replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]+["')\]]*|[^.!?;:]+$/g) ?? [text];
  const out: string[] = [];
  for (const p of parts.map((x) => x.trim()).filter(Boolean)) {
    if (out.length && out[out.length - 1].length < 40) out[out.length - 1] += ' ' + p;
    else out.push(p);
  }
  return out;
}

let run = 0;

export function stopVoice() {
  run++;
  if (web()) window.speechSynthesis.cancel();
  else Speech.stop();
}

/** Read text aloud in the child-like narration voice. */
export function speakKid(text: string, cb: Done = {}, rateK = 1, volume = 1) {
  stopVoice();
  const id = run;
  if (!web()) {
    Speech.speak(text, { language: 'en', pitch: 1.25, rate: 0.92 * rateK, volume, ...cb });
    return;
  }
  const v = pickVoice();
  const queue = sentences(text);
  const next = (i: number) => {
    if (id !== run) return cb.onStopped?.();
    if (i >= queue.length) return cb.onDone?.();
    const u = new SpeechSynthesisUtterance(queue[i]);
    if (v.voice) u.voice = v.voice;
    u.lang = v.voice?.lang ?? 'en-US';
    // A little life: questions lift, and the pitch wanders slightly.
    u.pitch = Math.min(2, v.pitch + (/\?$/.test(queue[i]) ? 0.08 : 0) + (i % 2 ? 0.03 : -0.02));
    u.rate = v.rate * rateK;
    u.volume = Math.max(0, Math.min(1, volume));
    u.onend = () => setTimeout(() => next(i + 1), 180);
    u.onerror = (e) => (e.error === 'interrupted' || e.error === 'canceled' ? cb.onStopped?.() : cb.onError?.());
    window.speechSynthesis.speak(u);
  };
  next(0);
}
