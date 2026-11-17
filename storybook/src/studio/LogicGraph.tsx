// The graph is drawn with SVG in the web studio; the list beside it works everywhere.
import type { Task } from '@/adventure/types';

export type GraphNode = { id: string; title: string; kind: string; requires: string[]; added?: boolean; edited?: boolean };
export default function LogicGraph(_: { nodes: GraphNode[]; selected: string | null; onSelect: (id: string | null) => void; onToggle: (waiter: string, on: string) => void; readOnly?: boolean }) {
  return null;
}
export const nodesOf = (tasks: Task[], added: Set<string>, edited: Set<string>): GraphNode[] => tasks.map((t) => ({ id: t.id, title: t.title, kind: t.kind, requires: t.requires ?? [], added: added.has(t.id), edited: edited.has(t.id) }));
