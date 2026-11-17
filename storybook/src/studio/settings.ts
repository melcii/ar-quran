// Studio settings that change how the game behaves for everyone, edited by
// Moderators and published like any other change:
//  - config:play: a gentle break reminder, and worlds closed for repair;
//  - config:multiplayer: online play on/off and the room size (enforced by
//    the database's room functions; there is no online play screen yet).
// The same limits are checked on the server (migration 0005).
import type { Overlay, Problem } from './overlay';
import { useResolvedDoc } from './live';

export const PLAY_DEFAULTS = { breakMinutes: 0, closedWorlds: [] as number[] };
export const MP_DEFAULTS = { enabled: true, roomMax: 4 };
export type PlaySettings = typeof PLAY_DEFAULTS;
export type MpSettings = typeof MP_DEFAULTS;

export function resolvePlay(doc: Overlay | null | undefined): PlaySettings {
  const s = (doc?.set ?? {}) as Record<string, unknown>;
  return {
    breakMinutes: typeof s.breakMinutes === 'number' ? s.breakMinutes : PLAY_DEFAULTS.breakMinutes,
    closedWorlds: Array.isArray(s.closedWorlds) ? (s.closedWorlds as number[]) : PLAY_DEFAULTS.closedWorlds,
  };
}
export function resolveMp(doc: Overlay | null | undefined): MpSettings {
  const s = (doc?.set ?? {}) as Record<string, unknown>;
  return { enabled: typeof s.enabled === 'boolean' ? s.enabled : MP_DEFAULTS.enabled, roomMax: typeof s.roomMax === 'number' ? s.roomMax : MP_DEFAULTS.roomMax };
}

export function checkSettings(scope: string, doc: Overlay | null | undefined): Problem[] {
  const out: Problem[] = [];
  const err = (key: string, message: string) => out.push({ key, level: 'error', message });
  for (const [k, v] of Object.entries((doc?.set ?? {}) as Record<string, unknown>)) {
    if (scope === 'config:play') {
      if (k === 'breakMinutes') {
        if (typeof v !== 'number' || !(v === 0 || (v >= 10 && v <= 120))) err(k, 'The break reminder is off (0) or 10 to 120 minutes.');
      } else if (k === 'closedWorlds') {
        if (!Array.isArray(v) || v.some((x) => typeof x !== 'number' || !Number.isInteger(x) || x < 1 || x > 114)) err(k, 'Closed worlds are surah numbers 1 to 114.');
      } else err(k, `Not a play setting: ${k}`);
    } else if (scope === 'config:multiplayer') {
      if (k === 'enabled') {
        if (typeof v !== 'boolean') err(k, 'On or off.');
      } else if (k === 'roomMax') {
        if (![2, 3, 4].includes(v as number)) err(k, 'Rooms hold 2, 3 or 4 explorers.');
      } else err(k, `Not an online play setting: ${k}`);
    }
  }
  if (doc && Object.keys(doc).some((k) => !['v', 'set'].includes(k))) err('doc', 'Settings documents hold only settings.');
  return out;
}

/** The play settings as they apply now (published; a draft in a studio play test). */
export function usePlaySettings(): PlaySettings & { ready: boolean } {
  const r = useResolvedDoc('config:play');
  return { ...resolvePlay(r.doc), ready: r.ready };
}
