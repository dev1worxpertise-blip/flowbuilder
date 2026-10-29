import { create } from "zustand";
import type { FlowNode, FlowEdge } from "../types";

export type SimulationStatus = "idle" | "playing" | "paused" | "completed";

export interface BranchOption {
  edgeId: string;
  targetId: string;
  label: string;
  color?: string;
  targetTitle?: string;
}

interface SimulationState {
  isActive: boolean;
  status: SimulationStatus;
  currentNodeId: string | null;
  activeEdgeId: string | null;
  visitedNodeIds: string[];
  speed: number; // 0.5, 1, 2
  branchChoice: {
    sourceNodeId: string;
    sourceTitle: string;
    branches: BranchOption[];
  } | null;

  startSimulation: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  stopSimulation: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  stepForward: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  chooseBranch: (edgeId: string, targetId: string, nodes: FlowNode[]) => void;
  restartSimulation: (nodes: FlowNode[], edges: FlowEdge[]) => void;
}

export function findStartNode(nodes: FlowNode[], edges: FlowEdge[]): FlowNode | null {
  if (!nodes.length) return null;

  // 1. Look for explicit Start node
  const startPill = nodes.find(
    (n) =>
      n.data.title.toLowerCase().includes("start") ||
      n.data.title.toLowerCase().includes("begin") ||
      n.data.title.toLowerCase().startsWith("1.")
  );
  if (startPill) return startPill;

  // 2. Look for node with 0 incoming edges (root node)
  const incomingTargets = new Set(edges.map((e) => e.target));
  const roots = nodes.filter((n) => !incomingTargets.has(n.id));
  if (roots.length > 0) {
    // Pick the leftmost root node
    return roots.reduce((min, cur) => (cur.position.x < min.position.x ? cur : min), roots[0]);
  }

  // 3. Fallback: leftmost node
  return nodes.reduce((min, cur) => (cur.position.x < min.position.x ? cur : min), nodes[0]);
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isActive: false,
  status: "idle",
  currentNodeId: null,
  activeEdgeId: null,
  visitedNodeIds: [],
  speed: 1,
  branchChoice: null,

  startSimulation: (nodes, edges) => {
    const start = findStartNode(nodes, edges);
    if (!start) return;

    set({
      isActive: true,
      status: "playing",
      currentNodeId: start.id,
      activeEdgeId: null,
      visitedNodeIds: [start.id],
      branchChoice: null,
    });
  },

  stopSimulation: () => {
    set({
      isActive: false,
      status: "idle",
      currentNodeId: null,
      activeEdgeId: null,
      visitedNodeIds: [],
      branchChoice: null,
    });
  },

  play: () => set({ status: "playing" }),
  pause: () => set({ status: "paused" }),
  setSpeed: (speed) => set({ speed }),

  restartSimulation: (nodes, edges) => {
    const start = findStartNode(nodes, edges);
    if (!start) return;

    set({
      isActive: true,
      status: "playing",
      currentNodeId: start.id,
      activeEdgeId: null,
      visitedNodeIds: [start.id],
      branchChoice: null,
    });
  },

  stepForward: (nodes, edges) => {
    const { currentNodeId, visitedNodeIds, branchChoice } = get();
    if (!currentNodeId || branchChoice) return;

    const sourceNode = nodes.find((n) => n.id === currentNodeId);
    const outgoing = edges.filter((e) => e.source === currentNodeId);

    // Flow completed
    if (outgoing.length === 0) {
      set({ status: "completed", activeEdgeId: null });
      return;
    }

    // Single edge: step through immediately
    if (outgoing.length === 1) {
      const ed = outgoing[0];
      set({
        activeEdgeId: ed.id,
        currentNodeId: ed.target,
        visitedNodeIds: visitedNodeIds.includes(ed.target)
          ? visitedNodeIds
          : [...visitedNodeIds, ed.target],
      });
      return;
    }

    // Multiple branches (e.g. Decision point): pause for user selection
    const branches: BranchOption[] = outgoing.map((ed) => {
      const target = nodes.find((n) => n.id === ed.target);
      return {
        edgeId: ed.id,
        targetId: ed.target,
        label: ed.data.label || target?.data.title || "Branch",
        color: ed.data.color,
        targetTitle: target?.data.title,
      };
    });

    set({
      status: "paused",
      branchChoice: {
        sourceNodeId: currentNodeId,
        sourceTitle: sourceNode?.data.title || "Decision",
        branches,
      },
    });
  },

  chooseBranch: (edgeId, targetId, _nodes) => {
    const { visitedNodeIds } = get();
    set({
      branchChoice: null,
      activeEdgeId: edgeId,
      currentNodeId: targetId,
      visitedNodeIds: visitedNodeIds.includes(targetId)
        ? visitedNodeIds
        : [...visitedNodeIds, targetId],
      status: "playing",
    });
  },
}));
