// A top-down map of the Ark valley for the animal-guiding settings: the
// river, the ark and its ramp, trees and rocks the animals walk round, each
// pair's home and pad, and the routes the game finds between them. Click to
// place whatever is being placed. Plain SVG; web only.
import { ARK, RAMP, START, WORLD_R, obstacles, riverZ, RIVER_HALF } from '@/ark/land';
import type { ArkRoute } from '@/ark/check';
import type { BeastCfg } from '@/ark/config';

const COLORS: Record<string, string> = { giraffe: '#c8902e', elephant: '#6a6a72', camel: '#b07a3a', sheep: '#7a8a5a', horse: '#7a4a2a' };

export default function ArkMap({ cfg, routes, placing, onPick, size = 520 }: { cfg: Record<string, BeastCfg>; routes: ArkRoute[]; placing: string | null; onPick: (p: [number, number]) => void; size?: number }) {
  const R = WORLD_R + 4;
  const k = size / (2 * R);
  const sx = (x: number) => size / 2 + x * k;
  const sz = (z: number) => size / 2 + z * k;
  const river: string[] = [];
  for (let x = -R; x <= R; x += 2) river.push(`${sx(x)},${sz(riverZ(x))}`);
  const click = (e: any) => {
    if (!placing) return;
    const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const wx = +((((e.clientX - r.left) / r.width) * size - size / 2) / k).toFixed(1);
    const wz = +((((e.clientY - r.top) / r.height) * size - size / 2) / k).toFixed(1);
    onPick([wx, wz]);
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onClick={click} style={{ cursor: placing ? 'crosshair' : 'default', background: '#e9eedd', borderRadius: 10, border: '1px solid #e2ddd2' }} data-testid="ark-map" role="img" aria-label="Map of the Ark valley">
      <circle cx={size / 2} cy={size / 2} r={WORLD_R * k} fill="#dfe8cf" stroke="#9aaa82" />
      <polyline points={river.join(' ')} fill="none" stroke="#8fb8c8" strokeWidth={RIVER_HALF * 2 * k} strokeLinecap="round" opacity={0.85} />
      {obstacles.map((o, i) => (
        <circle key={i} cx={sx(o.x)} cy={sz(o.z)} r={Math.max(1.2, o.r * k)} fill="#6f8a5a" opacity={0.5} />
      ))}
      <rect x={sx(ARK.x - ARK.len / 2)} y={sz(ARK.z - ARK.wid / 2)} width={ARK.len * k} height={ARK.wid * k} rx={ARK.wid * k * 0.4} fill="#9a6a3a" />
      <rect x={sx(RAMP.x - RAMP.half)} y={sz(RAMP.z0)} width={RAMP.half * 2 * k} height={(RAMP.z1 - RAMP.z0) * k} fill="#b98a52" />
      {routes.map((r, i) => (
        <polyline key={`r${i}`} points={r.points.map(([x, z]) => `${sx(x)},${sz(z)}`).join(' ')} fill="none" stroke={r.ok ? COLORS[r.kind] : '#a8352b'} strokeWidth={r.ok ? 1.6 : 2.5} strokeDasharray={r.from === 'pad' ? '3 3' : undefined} opacity={0.9} />
      ))}
      {Object.entries(cfg).map(([kind, c]) => (
        <g key={kind}>
          <circle cx={sx(c.home[0])} cy={sz(c.home[1])} r={c.notice * k} fill={COLORS[kind]} opacity={0.12} />
          <circle cx={sx(c.home[0])} cy={sz(c.home[1])} r={5} fill={COLORS[kind]} stroke="#fff" strokeWidth={1.5} data-testid={`map-home-${kind}`}>
            <title>{`${kind}: where they wander`}</title>
          </circle>
          <rect x={sx(c.pad[0]) - 6} y={sz(c.pad[1]) - 6} width={12} height={12} fill="#fff" stroke={COLORS[kind]} strokeWidth={2.5} data-testid={`map-pad-${kind}`}>
            <title>{`${kind}: pad`}</title>
          </rect>
          <circle cx={sx(c.pad[0])} cy={sz(c.pad[1])} r={c.arrive * k} fill="none" stroke={COLORS[kind]} strokeDasharray="2 3" opacity={0.6} />
          <text x={sx(c.pad[0]) + 8} y={sz(c.pad[1]) + 4} fontSize={10} fill="#1d2328">
            {kind}
          </text>
        </g>
      ))}
      <circle cx={sx(START.x)} cy={sz(START.z)} r={5} fill="#fff" stroke="#1d2328" strokeWidth={2}>
        <title>Where the child starts</title>
      </circle>
      <text x={8} y={size - 8} fontSize={11} fill="#5b6670">
        circles: where each pair wanders (shaded: how close to notice them) · squares: pads (dashed ring: arriving distance) · lines: routes the game finds
      </text>
    </svg>
  );
}
