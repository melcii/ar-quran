// Facts the studio reads from the project itself (not typed in by hand):
// the Quran dataset, the built worlds, the generated status report
// (npm run status), the recorded physics runs and the audio catalogue.
// Each fact says where it came from and how old it is.
import { WORLDS } from '@/adventure/worlds';
import { getSurah, surahs } from '@/content/quran';
import catalog from '@content/audio/catalog.json';
import lines from '@content/audio/narration-lines.json';
import physics from '@content/worlds/physics-results.json';
import status from '@content/worlds/status-114.json';

export type StatusRow = (typeof status.rows)[number];

export const statusReport = status as { generated: string; rows: StatusRow[] };
export const statusOf = (n: number) => statusReport.rows.find((r) => r.surah === n);
export const physicsRuns = physics as unknown as { date: string; how: string; worlds: Record<string, { desktop: string; phone?: string; hash?: string; date?: string; note?: string }> };

export function projectFacts() {
  const rows = statusReport.rows;
  const built = Object.keys(WORLDS).length;
  const tested = rows.filter((r) => r.status === 'Tested').length;
  const developing = rows.filter((r) => r.status !== 'Tested').length;
  const incompleteStories = rows.filter((r) => !r.story_complete).length;
  const notScholarReviewed = rows.filter((r) => /^No/.test(r.content_reviewed)).length;
  const activitiesNotPassing = rows.filter((r) => !/^Yes/.test(r.gameplay_functional)).length;
  const physicsFails = Object.entries(physicsRuns.worlds).filter(([, w]) => w.desktop !== 'pass').map(([k]) => Number(k));
  const phoneNotRun = Object.values(physicsRuns.worlds).filter((w) => w.phone !== 'pass').length;
  const clips = (catalog as any).clips as unknown[];
  const narrationLines = (lines as any).count as number;
  const reciters = (catalog as any).reciters as { id: string; name: string; licence: { status: string }; verification: { matchesText: string } }[];
  const licensedReciters = reciters.filter((r) => r.licence.status === 'confirmed' && r.verification.matchesText === 'verified').length;
  return {
    totalSurahs: surahs.length,
    built,
    tested,
    developing,
    incompleteStories,
    notScholarReviewed,
    activitiesNotPassing,
    physicsFails,
    phoneNotRun,
    recordedClips: clips.length,
    narrationLines,
    reciters: reciters.length,
    licensedReciters,
    reportDate: statusReport.generated,
    physicsDate: physicsRuns.date,
  };
}

export { catalog, lines };

/** Ayah counts for checking references. */
export const quranIndex = { ayahs: (n: number) => getSurah(n)?.ayahCount };
