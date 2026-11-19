// Narration recorded in the Audio Studio, for the game. A published world
// carries a map of narration line ids to audio file ids; this looks up the
// approved files (plain fetch of the server's /api/live-audio: approved files only)
// and hands their public URLs to the voice director. Without the studio
// server, or offline, the game simply keeps its usual voice.
import { director } from '@/audio/director';
import type { WorldDef } from '@/adventure/types';
import { STUDIO_URL, studioConfigured } from './live';

export const audioUrl = (path: string) => `${STUDIO_URL}/files/studio-audio/${path}`;

export async function loadWorldAudio(def: WorldDef | undefined) {
  const map: Record<string, string> = (def as any)?.__audio ?? {};
  const ids = [...new Set(Object.values(map))].filter((x) => /^[0-9a-f-]{36}$/.test(x));
  if (!ids.length || !studioConfigured()) {
    director.studioClips({});
    return;
  }
  try {
    const r = await fetch(`${STUDIO_URL}/api/live-audio?ids=${ids.join(',')}&kind=narration`, { headers: { Accept: 'application/json' } });
    const rows = r.ok ? ((await r.json()) as { id: string; path: string }[]) : [];
    const url = new Map(rows.map((x) => [x.id, audioUrl(x.path)]));
    director.studioClips(Object.fromEntries(Object.entries(map).flatMap(([line, id]) => (url.has(id) ? [[line, url.get(id)!]] : []))));
  } catch {
    director.studioClips({});
  }
}
