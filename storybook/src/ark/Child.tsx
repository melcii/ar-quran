// The child explorer the player walks around as: a made-up modern visitor to
// the story's world, not anyone from the story. Rounded, friendly, modestly
// dressed, with a small lantern. Dressed as the active explorer chose in the
// dressing room (the default is the original explorer).
import { Explorer } from '@/profile/Explorer';
import { useActiveProfile } from '@/profile/store';

export function Child() {
  const p = useActiveProfile();
  return <Explorer look={p.look} follow />;
}
