// The visual logic editor: every activity in a world as a node, with an
// arrow from each activity to the ones that wait for it. Click an activity
// to select it, then click another to make the selected one wait for it (or
// stop waiting). The links are the game's real "requires" rule: an activity
// opens once everything it waits for is done. Plain SVG; web only.
import type { Task } from '@/adventure/types';

export type GraphNode = { id: string; title: string; kind: string; requires: string[]; added?: boolean; edited?: boolean };

export function layout(nodes: GraphNode[]) {
  const by = new Map(nodes.map((n) => [n.id, n]));
  const depth = new Map<string, number>();
  const d = (id: string, seen = new Set<string>()): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const n = by.get(id);
    const v = n && n.requires.length ? 1 + Math.max(...n.requires.filter((r) => by.has(r)).map((r) => d(r, seen)), -1) : 0;
    depth.set(id, v);
    return v;
  };
  nodes.forEach((n) => d(n.id));
  const cols = new Map<number, string[]>();
  nodes.forEach((n) => cols.set(depth.get(n.id)!, [...(cols.get(depth.get(n.id)!) ?? []), n.id]));
  const pos = new Map<string, { x: number; y: number }>();
  for (const [c, ids] of cols) ids.forEach((id, r) => pos.set(id, { x: 20 + c * 210, y: 20 + r * 66 }));
  const w = 20 + Math.max(...[...cols.keys(), 0]) * 210 + 190;
  const h = 20 + Math.max(...[...cols.values()].map((x) => x.length), 1) * 66;
  return { pos, w, h };
}

export default function LogicGraph({ nodes, selected, onSelect, onToggle, readOnly }: { nodes: GraphNode[]; selected: string | null; onSelect: (id: string | null) => void; onToggle: (waiter: string, on: string) => void; readOnly?: boolean }) {
  const { pos, w, h } = layout(nodes);
  const W = 170;
  const H = 46;
  const click = (id: string) => {
    if (readOnly) return onSelect(id === selected ? null : id);
    if (!selected || selected === id) onSelect(id === selected ? null : id);
    else onToggle(selected, id);
  };
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e2ddd2', borderRadius: 10, background: '#fbfaf6' }}>
      <svg width={w} height={h} data-testid="logic-graph" role="img" aria-label="Activity logic: arrows show which activity opens after which">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#5b6670" />
          </marker>
        </defs>
        {nodes.flatMap((n) =>
          n.requires
            .filter((r) => pos.has(r))
            .map((r) => {
              const a = pos.get(r)!;
              const b = pos.get(n.id)!;
              const x1 = a.x + W;
              const y1 = a.y + H / 2;
              const x2 = b.x;
              const y2 = b.y + H / 2;
              const hot = selected === n.id || selected === r;
              return <path key={`${r}>${n.id}`} d={`M ${x1} ${y1} C ${x1 + 30} ${y1}, ${x2 - 30} ${y2}, ${x2 - 2} ${y2}`} fill="none" stroke={hot ? '#2f6f73' : '#9aa3aa'} strokeWidth={hot ? 2.5 : 1.5} markerEnd="url(#arr)" />;
            }),
        )}
        {nodes.map((n) => {
          const p = pos.get(n.id)!;
          const sel = selected === n.id;
          const waitsHere = selected && nodes.find((x) => x.id === selected)?.requires.includes(n.id);
          return (
            <g key={n.id} transform={`translate(${p.x},${p.y})`} onClick={() => click(n.id)} style={{ cursor: 'pointer' }} data-testid={`node-${n.id}`}>
              <rect width={W} height={H} rx={8} fill={sel ? '#e3f0ef' : n.added ? '#fbf0dc' : '#fff'} stroke={sel ? '#2f6f73' : waitsHere ? '#2f6f73' : '#e2ddd2'} strokeWidth={sel || waitsHere ? 2 : 1} />
              <text x={10} y={19} fontSize={12} fontWeight={700} fill="#1d2328">
                {n.title.length > 24 ? `${n.title.slice(0, 23)}…` : n.title}
              </text>
              <text x={10} y={35} fontSize={10} fill="#5b6670">
                {n.kind}
                {n.added ? ' · added' : ''}
                {n.edited ? ' · links edited' : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const nodesOf = (tasks: Task[], added: Set<string>, edited: Set<string>): GraphNode[] => tasks.map((t) => ({ id: t.id, title: t.title, kind: t.kind, requires: t.requires ?? [], added: added.has(t.id), edited: edited.has(t.id) }));
