import { compareText, fingerprint } from "./validation";
import { compareFunctionIds } from "./function-order";
export { compareFunctionIds } from "./function-order";

export interface DirectedEdge { from: string; to: string }
export interface StrongComponent {
  id: string;
  functionIds: string[];
  exclusive: boolean;
  hasSelfLoop: boolean;
  selfLoopPreserved: true;
}
export interface Condensation {
  sccs: StrongComponent[];
  componentByNode: Map<string, string>;
  edges: DirectedEdge[];
  topologicalOrder: string[];
}

/** Explicit DFS frames implement Tarjan; no native recursion, including 10k+ chains. */
export function stronglyConnectedComponents(
  nodeIds: readonly string[], edges: readonly DirectedEdge[],
  compare: (a: string, b: string) => number = compareFunctionIds,
): Condensation {
  if (new Set(nodeIds).size !== nodeIds.length) throw new Error("SCC: duplicate node");
  const adjacency = new Map(nodeIds.map(id => [id, new Set<string>()]));
  const selfLoops = new Set<string>();
  for (const e of edges) {
    if (!adjacency.has(e.from) || !adjacency.has(e.to)) throw new Error("SCC: missing endpoint");
    adjacency.get(e.from)!.add(e.to);
    if (e.from === e.to) selfLoops.add(e.from);
  }
  const lists = new Map([...adjacency].map(([id, next]) => [id, [...next].sort(compare)]));
  const index = new Map<string, number>(), low = new Map<string, number>();
  const stack: string[] = [], onStack = new Set<string>(), components: string[][] = [];
  let serial = 0;
  type Frame = { node: string; next: number; parent: string | null };
  const enter = (node: string, parent: string | null): Frame => {
    index.set(node, serial); low.set(node, serial++); stack.push(node); onStack.add(node);
    return { node, next: 0, parent };
  };
  for (const start of [...nodeIds].sort(compare)) {
    if (index.has(start)) continue;
    const frames = [enter(start, null)];
    while (frames.length) {
      const frame = frames[frames.length - 1]!;
      const next = lists.get(frame.node)!;
      if (frame.next < next.length) {
        const child = next[frame.next++]!;
        if (!index.has(child)) frames.push(enter(child, frame.node));
        else if (onStack.has(child)) low.set(frame.node, Math.min(low.get(frame.node)!, index.get(child)!));
        continue;
      }
      frames.pop();
      if (frame.parent !== null) low.set(frame.parent, Math.min(low.get(frame.parent)!, low.get(frame.node)!));
      if (low.get(frame.node) === index.get(frame.node)) {
        const members: string[] = [];
        let member: string;
        do { member = stack.pop()!; onStack.delete(member); members.push(member); } while (member !== frame.node);
        components.push(members.sort(compare));
      }
    }
  }
  components.sort((a, b) => compare(a[0]!, b[0]!));
  const sccs = components.map(functionIds => {
    const hasSelfLoop = functionIds.some(id => selfLoops.has(id));
    return { id: `scc:${fingerprint(functionIds)}`, functionIds, exclusive: functionIds.length > 1 || hasSelfLoop,
      hasSelfLoop, selfLoopPreserved: true as const };
  });
  const componentByNode = new Map<string, string>();
  for (const s of sccs) for (const id of s.functionIds) componentByNode.set(id, s.id);
  const unique = new Map<string, DirectedEdge>();
  for (const e of edges) {
    const from = componentByNode.get(e.from)!, to = componentByNode.get(e.to)!;
    if (from !== to) unique.set(JSON.stringify([from, to]), { from, to });
  }
  const condensed = [...unique.values()].sort((a, b) => compareText(a.from, b.from) || compareText(a.to, b.to));
  return { sccs, componentByNode, edges: condensed, topologicalOrder: topologicalOrder(sccs.map(s => s.id), condensed) };
}

/** Kahn with deterministic FIFO frontier: O(V+E), no hidden quadratic shift/sort. */
export function topologicalOrder(nodeIds: readonly string[], edges: readonly DirectedEdge[]): string[] {
  const incoming = new Map(nodeIds.map(id => [id, 0]));
  const outgoing = new Map(nodeIds.map(id => [id, new Set<string>()]));
  for (const { from, to } of edges) {
    if (!incoming.has(from) || !incoming.has(to)) throw new Error("DAG: missing endpoint");
    if (!outgoing.get(from)!.has(to)) {
      outgoing.get(from)!.add(to); incoming.set(to, incoming.get(to)! + 1);
    }
  }
  const queue = [...nodeIds].filter(id => incoming.get(id) === 0).sort(compareText);
  const result: string[] = [];
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head]!; result.push(id);
    for (const to of [...outgoing.get(id)!].sort(compareText)) {
      incoming.set(to, incoming.get(to)! - 1);
      if (incoming.get(to) === 0) queue.push(to);
    }
  }
  if (result.length !== nodeIds.length) throw new Error("DAG: cycle in quotient");
  return result;
}
