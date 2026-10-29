import type { FlowNode, FlowEdge } from "../types";

export interface TourStep {
  index: number;
  node: FlowNode;
  incomingEdges: FlowEdge[];
  outgoingEdges: FlowEdge[];
}

/**
 * Builds a deterministic, logical sequence of steps for a guided walkthrough of a diagram.
 * Starts with root/entry nodes (0 incoming edges) and traverses downstream causal flows.
 */
export function buildGuidedTour(nodes: FlowNode[], edges: FlowEdge[]): TourStep[] {
  if (!nodes || nodes.length === 0) return [];

  // Focus primarily on actionable workflow nodes (exclude group containers if actionable nodes exist)
  const stepNodes = nodes.filter((n) => n.type !== "group");
  const candidates = stepNodes.length > 0 ? stepNodes : nodes;

  // Calculate in-degree and adjacency
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of candidates) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }

  for (const e of edges) {
    if (inDegree.has(e.target) && adj.has(e.source)) {
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
      adj.get(e.source)!.push(e.target);
    }
  }

  // Find root nodes (in-degree 0), sorted left-to-right (min x)
  const roots = candidates
    .filter((n) => (inDegree.get(n.id) ?? 0) === 0)
    .sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);

  const queue: string[] = roots.map((r) => r.id);
  const visited = new Set<string>();
  const orderedIds: string[] = [];

  while (queue.length > 0) {
    const curId = queue.shift()!;
    if (visited.has(curId)) continue;
    visited.add(curId);
    orderedIds.push(curId);

    const neighbors = adj.get(curId) ?? [];
    // Sort unvisited downstream neighbors left-to-right
    const sortedNeighbors = neighbors
      .filter((id) => !visited.has(id))
      .sort((a, b) => {
        const na = candidates.find((n) => n.id === a);
        const nb = candidates.find((n) => n.id === b);
        return (na?.position.x ?? 0) - (nb?.position.x ?? 0);
      });

    for (const nextId of sortedNeighbors) {
      if (!visited.has(nextId) && !queue.includes(nextId)) {
        queue.push(nextId);
      }
    }
  }

  // Append any remaining disconnected nodes in spatial order
  const remaining = candidates
    .filter((n) => !visited.has(n.id))
    .sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);

  for (const rem of remaining) {
    if (!visited.has(rem.id)) {
      visited.add(rem.id);
      orderedIds.push(rem.id);
    }
  }

  return orderedIds.map((id, index) => {
    const node = candidates.find((n) => n.id === id)!;
    const incoming = edges.filter((e) => e.target === id);
    const outgoing = edges.filter((e) => e.source === id);
    return {
      index,
      node,
      incomingEdges: incoming,
      outgoingEdges: outgoing,
    };
  });
}
