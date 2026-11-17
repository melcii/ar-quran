// Narration recorded in the Audio Studio, for the game. A published world
// carries a map of narration line ids to audio file ids; this looks up the
// approved files (plain fetch of the live_audio view: approved files only)
// and hands their public URLs to the voice director. Without a Supabase
// project, or offline, the game simply keeps its usual voice.
import { director } from '@/audio/director';
import type { WorldDef } from '@/adventure/types';
import { SUPABASE_KEY, SUPABASE_URL, studioConfigured } from './live';

export const audioUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/studio-audio/${path}`;

export async function loadWorldAudio(def: WorldDef | undefined) {
  const map: Record<string, string> = (def as any)?.__audio ?? {};
  const ids = [...new Set(Object.values(map))].filter((x) => /^[0-9a-f-]{36}$/.test(x));
  if (!ids.length || !studioConfigured()) {
    director.studioClips({});
    return;
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/live_audio?id=in.(${ids.join(',')})&kind=eq.narration&select=id,path`, { headers: { apikey: SUPABASE_KEY, Accept: 'application/json' } });
    const rows = r.ok ? ((await r.json()) as { id: string; path: string }[]) : [];
    const url = new Map(rows.map((x) => [x.id, audioUrl(x.path)]));
    director.studioClips(Object.fromEntries(Object.entries(map).flatMap(([line, id]) => (url.has(id) ? [[line, url.get(id)!]] : []))));
  } catch {
    director.studioClips({});
  }
}
