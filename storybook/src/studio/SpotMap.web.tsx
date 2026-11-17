// A top-down map of a world for placing activity spots: click to choose.
// It draws the world's edge, its buildings, the player start, the spots of
// existing activities and the spot being chosen. Plain SVG; web only.
import type { WorldDef } from '@/adventure/types';

export type MapMark = { at: [number, number]; label: string; tone?: 'task' | 'new' | 'other' };

/** Every [x, z] pair inside an activity (its markers, spots, pens and paths). */
export function spotsOf(task: unknown): [number, number][] {
  const out: [number, number][] = [];
  const walk = (v: any) => {
    if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'number')) out.push(v as [number, number]);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(task);
  return out;
}

export default function SpotMap({ def, value, onPick, marks = [], size = 300 }: { def: WorldDef; value?: [number, number] | null; onPick: (p: [number, number]) => void; marks?: MapMark[]; size?: number }) {
  const R = def.ground.radius;
  const k = size / (2 * R + 8);
  const sx = (x: number) => size / 2 + x * k;
  const sz = (z: number) => size / 2 + z * k;
  const click = (e: any) => {
    const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * size;
    const y = ((e.clientY - r.top) / r.height) * size;
    const wx = +((x - size / 2) / k).toFixed(1);
    const wz = +((y - size / 2) / k).toFixed(1);
    if (Math.hypot(wx, wz) <= R - 1) onPick([wx, wz]);
  };
  const tasks = def.tasks.flatMap((t) => spotsOf(t).map((p) => ({ p, t: t.title })));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onClick={click} style={{ cursor: 'crosshair', background: '#eef2e6', borderRadius: 10, border: '1px solid #e2ddd2' }} role="img" aria-label="Map of the world: click to choose a place" data-testid="spot-map">
      <circle cx={size / 2} cy={size / 2} r={R * k} fill="#dfe8cf" stroke="#9aaa82" strokeWidth={1.5} />
      {def.structures.map((s, i) => (
        <rect key={`s${i}`} x={sx(s.x) - 3} y={sz(s.z) - 3} width={6} height={6} fill="#8a7a62" opacity={0.8}>
          <title>{s.type}</title>
        </rect>
      ))}
      {tasks.map(({ p, t }, i) => (
        <circle key={`t${i}`} cx={sx(p[0])} cy={sz(p[1])} r={3} fill="#2f6f73" opacity={0.65}>
          <title>{t}</title>
        </circle>
      ))}
      {marks.map((m, i) => (
        <circle key={`m${i}`} cx={sx(m.at[0])} cy={sz(m.at[1])} r={4} fill={m.tone === 'new' ? '#d9a55a' : '#6a4c93'}>
          <title>{m.label}</title>
        </circle>
      ))}
      <g>
        <circle cx={sx(def.start[0])} cy={sz(def.start[1])} r={5} fill="#fff" stroke="#1d2328" strokeWidth={2} />
        <title>Player start</title>
      </g>
      {value ? (
        <g pointerEvents="none">
          <circle cx={sx(value[0])} cy={sz(value[1])} r={7} fill="none" stroke="#a8352b" strokeWidth={2.5} />
          <circle cx={sx(value[0])} cy={sz(value[1])} r={2} fill="#a8352b" />
        </g>
      ) : null}
      <text x={6} y={size - 6} fontSize={10} fill="#5b6670">
        seen from above · radius {R} m · white ring: player start
      </text>
    </svg>
  );
}
