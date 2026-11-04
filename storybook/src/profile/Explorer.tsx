// The explorer figure, as the worlds and the dressing room use it. The figure
// itself (jointed body, sculpted face, layered hair, woven clothes and the
// blended animation set) lives in ./figure.
import { Figure } from './figure/Figure';
import type { Anim } from './figure/pose';
import type { Look } from './look';

export type { Anim };

export function Explorer({ look, follow, anim, lantern = true }: { look: Look; follow?: boolean; anim?: { current: Anim }; lantern?: boolean }) {
  return <Figure look={look} follow={follow} anim={anim} lantern={lantern} />;
}
