// The valley map is drawn with SVG in the web studio; elsewhere places are typed as numbers.
import type { ArkRoute } from '@/ark/check';
import type { BeastCfg } from '@/ark/config';
export default function ArkMap(_: { cfg: Record<string, BeastCfg>; routes: ArkRoute[]; placing: string | null; onPick: (p: [number, number]) => void; size?: number }) {
  return null;
}
