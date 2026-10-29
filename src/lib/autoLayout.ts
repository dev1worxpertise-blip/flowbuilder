import dagre from "dagre";
import type { FlowNode, FlowEdge } from "../types";

export type LayoutDirection = "LR" | "TB";

/**
 * Automatically layout nodes and edges in a clean hierarchical DAG graph.
 * Supports Left-to-Right (LR) and Top-to-Bottom (TB) directions.
 */
export function applyAutoLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: LayoutDirection = "LR"
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  if (!nodes.length) return { nodes, edges };

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";

  g.setGraph({
    rankdir: direction,
    nodesep: isHorizontal ? 80 : 80,
    ranksep: isHorizontal ? 120 : 100,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    const isPill = node.type === "pill";
    const isDecision = node.type === "decision";
    const width = node.data.width || (isDecision ? 150 : isPill ? 180 : 220);
    const height = node.data.height || (isDecision ? 150 : isPill ? 56 : 88);
    g.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    // Only layout edges connecting valid existing nodes
    if (nodes.some((n) => n.id === edge.source) && nodes.some((n) => n.id === edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  const layoutedNodes: FlowNode[] = nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;

    const width = node.data.width || (node.type === "decision" ? 140 : 220);
    const height = node.data.height || (node.type === "decision" ? 140 : 88);

    return {
      ...node,
      position: {
        x: Math.round(pos.x - width / 2),
        y: Math.round(pos.y - height / 2),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
