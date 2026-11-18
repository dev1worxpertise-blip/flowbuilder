import type { FlowNode, FlowEdge } from "../types";

export interface TourStep {
  index: number;
  node: FlowNode;
  incomingEdges: FlowEdge[];
  outgoingEdges: FlowEdge[];
}

/**
 * Builds a deterministic, logical sequence of steps for a guided walkthrough of a diagram.
 * Traverses downstream causal flows matching Simulation stepForward execution:
 * 1. Prioritizes explicit Start/Begin nodes and active process roots
 * 2. Follows downstream directed edges sequentially (depth-first causal path)
 * 3. Appends disconnected reference notes / architecture containers at the end
 */
export function buildGuidedTour(nodes: FlowNode[], edges: FlowEdge[]): TourStep[] {
  if (!nodes || nodes.length === 0) return [];

  // Focus primarily on actionable workflow nodes (exclude group containers if actionable nodes exist)
  const stepNodes = nodes.filter((n) => n.type !== "group");
  const candidates = stepNodes.length > 0 ? stepNodes : nodes;
  const nodeMap = new Map(candidates.map((n) => [n.id, n]));

  // Build incoming and outgoing adjacency maps
  const incoming = new Map<string, FlowEdge[]>();
  const outgoing = new Map<string, FlowEdge[]>();

  for (const n of candidates) {
    incoming.set(n.id, []);
    outgoing.set(n.id, []);
  }

  for (const e of edges) {
    if (outgoing.has(e.source)) {
      outgoing.get(e.source)!.push(e);
    }
    if (incoming.has(e.target)) {
      incoming.get(e.target)!.push(e);
    }
  }

  const visited = new Set<string>();
  const orderedIds: string[] = [];

  // Find root candidates (in-degree === 0 among candidates)
  const roots = candidates.filter((n) => (incoming.get(n.id)?.length ?? 0) === 0);

  // Score roots to find the true workflow entry point:
  // - Priority 1: Title contains "start", "begin", or starts with "1." (explicit workflow start)
  // - Priority 2: Has outgoing edges (active process root)
  // - Priority 3: Sorted by spatial position (x then y)
  const sortedRoots = [...roots].sort((a, b) => {
    const aTitle = (a.data?.title ?? "").toLowerCase();
    const bTitle = (b.data?.title ?? "").toLowerCase();

    const aIsExplicitStart = aTitle.includes("start") || aTitle.includes("begin") || aTitle.startsWith("1.");
    const bIsExplicitStart = bTitle.includes("start") || bTitle.includes("begin") || bTitle.startsWith("1.");
    if (aIsExplicitStart && !bIsExplicitStart) return -1;
    if (!aIsExplicitStart && bIsExplicitStart) return 1;

    const aHasOut = (outgoing.get(a.id)?.length ?? 0) > 0;
    const bHasOut = (outgoing.get(b.id)?.length ?? 0) > 0;
    if (aHasOut && !bHasOut) return -1;
    if (!aHasOut && bHasOut) return 1;

    return a.position.x - b.position.x || a.position.y - b.position.y;
  });

  // Recursive depth-first traversal along downstream directed edges (matching simulation step-by-step)
  const traverse = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    orderedIds.push(nodeId);

    const outEdges = outgoing.get(nodeId) ?? [];
    // Sort outgoing edges: left-to-right based on target position
    const sortedEdges = [...outEdges].sort((ea, eb) => {
      const na = nodeMap.get(ea.target);
      const nb = nodeMap.get(eb.target);
      return (na?.position.x ?? 0) - (nb?.position.x ?? 0) || (na?.position.y ?? 0) - (nb?.position.y ?? 0);
    });

    for (const edge of sortedEdges) {
      if (nodeMap.has(edge.target) && !visited.has(edge.target)) {
        traverse(edge.target);
      }
    }
  };

  // 1. Traverse sorted roots with active outgoing connections (the primary business flow)
  for (const root of sortedRoots) {
    if (!visited.has(root.id) && (outgoing.get(root.id)?.length ?? 0) > 0) {
      traverse(root.id);
    }
  }

  // 2. Traverse any remaining roots
  for (const root of sortedRoots) {
    if (!visited.has(root.id)) {
      traverse(root.id);
    }
  }

  // 3. Append any remaining unvisited nodes (e.g. disconnected notes/legend cards)
  const remaining = candidates
    .filter((n) => !visited.has(n.id))
    .sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);

  for (const rem of remaining) {
    if (!visited.has(rem.id)) {
      traverse(rem.id);
    }
  }

  return orderedIds.map((id, index) => {
    const node = nodeMap.get(id)!;
    return {
      index,
      node,
      incomingEdges: incoming.get(id) ?? [],
      outgoingEdges: outgoing.get(id) ?? [],
    };
  });
}
