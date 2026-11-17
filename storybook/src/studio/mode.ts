// Is this page a studio play test (?studio=draft|published|built-in)?
// Kept tiny and free of imports so any store in the game can ask it.
export function inStudioTest(): boolean {
  try {
    const m = new URLSearchParams(globalThis.location?.search ?? '').get('studio');
    return m === 'draft' || m === 'published' || m === 'built-in';
  } catch {
    return false;
  }
}

/** A storage key that keeps play-test progress apart from a player's own. */
export const testSafeKey = (key: string) => (inStudioTest() ? `quran-studio.playtest.${key}` : key);
