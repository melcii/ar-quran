// Summary of the per-surah world design records (content/worlds/designs).
// These are drafts: none is reviewed, and none is a playable world yet unless
// its status says so. The app shows that status rather than hiding it.
import indexData from '@content/worlds/design-index.json';

export type WorldDesignSummary = {
  surah: number;
  world_title: string;
  content_type: string;
  concept: string;
  areas: { name: string; reference: string }[];
  activities: string[];
  status: Record<string, string>;
  review: string;
};

const designs = indexData.designs as WorldDesignSummary[];
export const designFor = (n: number): WorldDesignSummary | undefined => designs[n - 1];

export type StageState = 'done' | 'draft' | 'todo';
export type Stage = { label: string; state: StageState; detail: string };

/** The five development stages the team tracks for every surah. */
export function stagesFor(d: WorldDesignSummary): Stage[] {
  const built = !/^not built/.test(d.status.playable_environment ?? 'not built');
  const tested = !/^not tested/.test(d.status.testing ?? 'not tested');
  return [
    { label: 'Verified text', state: /^verified/.test(d.status.quran_text) ? 'done' : 'todo', detail: d.status.quran_text },
    { label: 'Approved content', state: d.review === 'unreviewed' ? 'draft' : 'done', detail: d.review === 'unreviewed' ? 'draft, awaiting scholarly review' : d.review },
    { label: 'World designed', state: /^designed/.test(d.status.world_design) ? 'draft' : 'todo', detail: d.status.world_design },
    { label: 'Playable world', state: built ? 'done' : 'todo', detail: d.status.playable_environment },
    { label: 'Tested', state: tested ? 'done' : 'todo', detail: d.status.testing },
  ];
}
