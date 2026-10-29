import { create } from "zustand";
import { applyAutoLayout, type LayoutDirection } from "../lib/autoLayout";
import {
  type Diagram,
  type FlowNode,
  type FlowEdge,
  type NodeKind,
  type NodeData,
  type EdgeData,
  type Accent,
  type PathKind,
  uid,
  defaultNodeData,
} from "../types";

const DEFAULT_EDGE_DATA: EdgeData = {
  animation: "dots",
  color: "#60a5fa",
  speed: 3,
  lineStyle: "solid",
  path: "smoothstep",
};

const MAX_HISTORY = 40;

export interface HistorySnapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
  name: string;
}

interface EditorState {
  diagram: Diagram | null;
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  clipboard: FlowNode | null;

  loadDiagram: (d: Diagram) => void;
  addNode: (kind: NodeKind, position: { x: number; y: number }) => FlowNode | null;
  updateNodeData: (id: string, patch: Partial<NodeData>) => void;
  updateEdgeData: (id: string, patch: Partial<EdgeData>) => void;
  addEdge: (partial: {
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  setName: (name: string) => void;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  commitSnapshot: () => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Clipboard & Shortcuts
  copyNode: (id: string) => void;
  pasteNode: (offset?: { x: number; y: number }) => FlowNode | null;
  duplicateNode: (id: string) => FlowNode | null;
  addBranch: (
    sourceId: string,
    label: string,
    color?: string,
    offset?: { x: number; y: number }
  ) => { node: FlowNode; edge: FlowEdge } | null;

  // Grid & Layout
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;
  autoLayout: (direction?: LayoutDirection) => void;

  // Edge Routing
  defaultPathKind: PathKind;
  setDefaultPathKind: (kind: PathKind) => void;
  setAllEdgesPathKind: (kind: PathKind) => void;

  // Radar / MiniMap
  showMiniMap: boolean;
  toggleMiniMap: () => void;
  setShowMiniMap: (show: boolean) => void;

  // Search & Spotlight Highlight
  highlightedNodeId: string | null;
  setHighlightedNodeId: (id: string | null) => void;
  flashNode: (id: string, durationMs?: number) => void;

  // Multi-Node Alignment & Distribution
  selectionBounds: {
    nodeIdsKey: string;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null;
  clearSelectionBounds: () => void;
  alignNodes: (
    nodeIds: string[],
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom"
  ) => void;
  distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
  bulkUpdateNodeData: (nodeIds: string[], patch: Partial<NodeData>) => void;
  removeMultipleNodes: (nodeIds: string[]) => void;
}

function touch(d: Diagram): Diagram {
  return { ...d, updatedAt: Date.now() };
}

function takeSnapshot(s: { diagram: Diagram | null; past: HistorySnapshot[] }): {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
} {
  if (!s.diagram) return { past: s.past, future: [] };
  const current: HistorySnapshot = {
    nodes: JSON.parse(JSON.stringify(s.diagram.nodes)),
    edges: JSON.parse(JSON.stringify(s.diagram.edges)),
    name: s.diagram.name,
  };
  const past = [...s.past, current].slice(-MAX_HISTORY);
  return { past, future: [] };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  diagram: null,
  past: [],
  future: [],
  clipboard: null,
  snapToGrid: false,
  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),

  defaultPathKind: "smoothstep",
  setDefaultPathKind: (kind) => set({ defaultPathKind: kind }),
  setAllEdgesPathKind: (kind) =>
    set((s) => {
      if (!s.diagram || !s.diagram.edges.length) {
        return { defaultPathKind: kind };
      }
      const { past, future } = takeSnapshot(s);
      const edges = s.diagram.edges.map((e) => ({
        ...e,
        data: { ...e.data, path: kind },
      }));
      return {
        past,
        future,
        defaultPathKind: kind,
        diagram: touch({ ...s.diagram, edges }),
      };
    }),

  showMiniMap: true,
  toggleMiniMap: () => set((s) => ({ showMiniMap: !s.showMiniMap })),
  setShowMiniMap: (show) => set({ showMiniMap: show }),

  highlightedNodeId: null,
  setHighlightedNodeId: (id) => set({ highlightedNodeId: id }),
  flashNode: (id, durationMs = 2500) => {
    set({ highlightedNodeId: id });
    setTimeout(() => {
      if (get().highlightedNodeId === id) {
        set({ highlightedNodeId: null });
      }
    }, durationMs);
  },

  selectionBounds: null,
  clearSelectionBounds: () => set({ selectionBounds: null }),

  autoLayout: (direction = "LR") =>
    set((s) => {
      if (!s.diagram || !s.diagram.nodes.length) return s;
      const { past, future } = takeSnapshot(s);
      const { nodes, edges } = applyAutoLayout(s.diagram.nodes, s.diagram.edges, direction);
      return {
        past,
        future,
        diagram: touch({ ...s.diagram, nodes, edges }),
      };
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  loadDiagram: (d) => set({ diagram: d, past: [], future: [], clipboard: null }),

  commitSnapshot: () =>
    set((s) => {
      if (!s.diagram) return s;
      const { past, future } = takeSnapshot(s);
      return { past, future };
    }),

  addNode: (kind, position) => {
    let created: FlowNode | null = null;
    set((s) => {
      if (!s.diagram) return s;
      const { past, future } = takeSnapshot(s);
      const n: FlowNode = {
        id: uid(),
        type: kind,
        position,
        data: defaultNodeData(kind),
      };
      created = n;
      return {
        past,
        future,
        diagram: touch({ ...s.diagram, nodes: [...s.diagram.nodes, n] }),
      };
    });
    return created;
  },

  updateNodeData: (id, patch) =>
    set((s) => {
      if (!s.diagram) return s;
      const { past, future } = takeSnapshot(s);
      const nodes = s.diagram.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
      );
      return {
        past,
        future,
        diagram: touch({ ...s.diagram, nodes }),
      };
    }),

  updateEdgeData: (id, patch) =>
    set((s) => {
      if (!s.diagram) return s;
      const { past, future } = takeSnapshot(s);
      const edges = s.diagram.edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, ...patch } } : e
      );
      return {
        past,
        future,
        diagram: touch({ ...s.diagram, edges }),
      };
    }),

  addEdge: (partial) =>
    set((s) => {
      if (!s.diagram) return s;
      const { past, future } = takeSnapshot(s);
      const e: FlowEdge = {
        id: uid(),
        source: partial.source,
        target: partial.target,
        sourceHandle: partial.sourceHandle,
        targetHandle: partial.targetHandle,
        type: "animated",
        data: { ...DEFAULT_EDGE_DATA, path: s.defaultPathKind },
      };
      return {
        past,
        future,
        diagram: touch({ ...s.diagram, edges: [...s.diagram.edges, e] }),
      };
    }),

  removeNode: (id) =>
    set((s) => {
      if (!s.diagram) return s;
      const { past, future } = takeSnapshot(s);
      const nodes = s.diagram.nodes.filter((n) => n.id !== id);
      const edges = s.diagram.edges.filter((e) => e.source !== id && e.target !== id);
      return {
        past,
        future,
        diagram: touch({ ...s.diagram, nodes, edges }),
      };
    }),

  removeEdge: (id) =>
    set((s) => {
      if (!s.diagram) return s;
      const { past, future } = takeSnapshot(s);
      return {
        past,
        future,
        diagram: touch({ ...s.diagram, edges: s.diagram.edges.filter((e) => e.id !== id) }),
      };
    }),

  setName: (name) =>
    set((s) => (s.diagram ? { diagram: touch({ ...s.diagram, name }) } : s)),

  setNodes: (nodes) =>
    set((s) => (s.diagram ? { diagram: { ...s.diagram, nodes } } : s)),

  setEdges: (edges) =>
    set((s) => (s.diagram ? { diagram: { ...s.diagram, edges } } : s)),

  undo: () =>
    set((s) => {
      if (!s.diagram || s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      const newPast = s.past.slice(0, -1);
      const current: HistorySnapshot = {
        nodes: s.diagram.nodes,
        edges: s.diagram.edges,
        name: s.diagram.name,
      };
      const newFuture = [current, ...s.future].slice(0, MAX_HISTORY);
      return {
        past: newPast,
        future: newFuture,
        diagram: touch({
          ...s.diagram,
          nodes: previous.nodes,
          edges: previous.edges,
          name: previous.name,
        }),
      };
    }),

  redo: () =>
    set((s) => {
      if (!s.diagram || s.future.length === 0) return s;
      const next = s.future[0];
      const newFuture = s.future.slice(1);
      const current: HistorySnapshot = {
        nodes: s.diagram.nodes,
        edges: s.diagram.edges,
        name: s.diagram.name,
      };
      const newPast = [...s.past, current].slice(-MAX_HISTORY);
      return {
        past: newPast,
        future: newFuture,
        diagram: touch({
          ...s.diagram,
          nodes: next.nodes,
          edges: next.edges,
          name: next.name,
        }),
      };
    }),

  copyNode: (id) =>
    set((s) => {
      if (!s.diagram) return s;
      const node = s.diagram.nodes.find((n) => n.id === id);
      if (!node) return s;
      return { clipboard: JSON.parse(JSON.stringify(node)) };
    }),

  pasteNode: (offset = { x: 40, y: 40 }) => {
    let created: FlowNode | null = null;
    set((s) => {
      if (!s.diagram || !s.clipboard) return s;
      const { past, future } = takeSnapshot(s);
      const newNode: FlowNode = {
        ...JSON.parse(JSON.stringify(s.clipboard)),
        id: uid(),
        position: {
          x: s.clipboard.position.x + offset.x,
          y: s.clipboard.position.y + offset.y,
        },
      };
      created = newNode;
      return {
        past,
        future,
        // Update clipboard position so multiple pastes stagger nicely
        clipboard: {
          ...s.clipboard,
          position: {
            x: s.clipboard.position.x + offset.x,
            y: s.clipboard.position.y + offset.y,
          },
        },
        diagram: touch({
          ...s.diagram,
          nodes: [...s.diagram.nodes, newNode],
        }),
      };
    });
    return created;
  },

  duplicateNode: (id) => {
    let created: FlowNode | null = null;
    set((s) => {
      if (!s.diagram) return s;
      const target = s.diagram.nodes.find((n) => n.id === id);
      if (!target) return s;
      const { past, future } = takeSnapshot(s);
      const newNode: FlowNode = {
        ...JSON.parse(JSON.stringify(target)),
        id: uid(),
        position: {
          x: target.position.x + 35,
          y: target.position.y + 35,
        },
      };
      created = newNode;
      return {
        past,
        future,
        diagram: touch({
          ...s.diagram,
          nodes: [...s.diagram.nodes, newNode],
        }),
      };
    });
    return created;
  },

  addBranch: (sourceId, label, color, offset) => {
    let result: { node: FlowNode; edge: FlowEdge } | null = null;
    set((s) => {
      if (!s.diagram) return s;
      const source = s.diagram.nodes.find((n) => n.id === sourceId);
      if (!source) return s;

      const { past, future } = takeSnapshot(s);
      const outgoing = s.diagram.edges.filter((e) => e.source === sourceId);

      // Determine smart offset if not provided
      let targetOffset = offset;
      if (!targetOffset) {
        if (label.toLowerCase() === "yes" || label.toLowerCase() === "approved" || outgoing.length === 0) {
          targetOffset = { x: 240, y: -50 };
        } else if (label.toLowerCase() === "no" || label.toLowerCase() === "rejected" || outgoing.length === 1) {
          targetOffset = { x: 240, y: 90 };
        } else {
          targetOffset = { x: 240, y: outgoing.length * 90 - 30 };
        }
      }

      const isYes =
        label.toLowerCase() === "yes" ||
        label.toLowerCase() === "approved" ||
        label.toLowerCase() === "success";
      const isNo =
        label.toLowerCase() === "no" ||
        label.toLowerCase() === "rejected" ||
        label.toLowerCase() === "retry";

      const branchColor = color ?? (isYes ? "#10b981" : isNo ? "#f43f5e" : "#38bdf8");
      const branchAccent: Accent = isYes ? "green" : isNo ? "pink" : "blue";

      const newNode: FlowNode = {
        id: uid(),
        type: "card",
        position: {
          x: source.position.x + targetOffset.x,
          y: source.position.y + targetOffset.y,
        },
        data: {
          ...defaultNodeData("card"),
          title: isYes ? "Approved Step" : isNo ? "Rejected Step" : `${label} Step`,
          subtitle: isYes ? "Condition passed" : isNo ? "Condition failed" : `Handled ${label}`,
          accent: branchAccent,
        },
      };

      const newEdge: FlowEdge = {
        id: uid(),
        source: sourceId,
        target: newNode.id,
        type: "animated",
        data: {
          ...DEFAULT_EDGE_DATA,
          path: s.defaultPathKind,
          label,
          color: branchColor,
        },
      };

      result = { node: newNode, edge: newEdge };

      return {
        past,
        future,
        diagram: touch({
          ...s.diagram,
          nodes: [...s.diagram.nodes, newNode],
          edges: [...s.diagram.edges, newEdge],
        }),
      };
    });
    return result;
  },

  alignNodes: (nodeIds, alignment) =>
    set((s) => {
      if (!s.diagram || nodeIds.length < 2) return s;
      const targetNodes = s.diagram.nodes.filter((n) => nodeIds.includes(n.id));
      if (targetNodes.length < 2) return s;

      const { past, future } = takeSnapshot(s);

      const key = [...nodeIds].sort().join(",");
      let bounds = s.selectionBounds;
      if (!bounds || bounds.nodeIdsKey !== key) {
        const minX = Math.min(...targetNodes.map((n) => n.position.x));
        const maxX = Math.max(...targetNodes.map((n) => n.position.x + (n.data.width || 180)));
        const minY = Math.min(...targetNodes.map((n) => n.position.y));
        const maxY = Math.max(...targetNodes.map((n) => n.position.y + (n.data.height || 80)));
        bounds = { nodeIdsKey: key, minX, maxX, minY, maxY };
      }

      let getNewPos: (node: FlowNode) => { x: number; y: number };

      if (alignment === "left") {
        getNewPos = (node) => ({ x: bounds!.minX, y: node.position.y });
      } else if (alignment === "right") {
        getNewPos = (node) => ({ x: bounds!.maxX - (node.data.width || 180), y: node.position.y });
      } else if (alignment === "center") {
        const groupCenterX = (bounds!.minX + bounds!.maxX) / 2;
        getNewPos = (node) => ({
          x: Math.round(groupCenterX - (node.data.width || 180) / 2),
          y: node.position.y,
        });
      } else if (alignment === "top") {
        getNewPos = (node) => ({ x: node.position.x, y: bounds!.minY });
      } else if (alignment === "bottom") {
        getNewPos = (node) => ({ x: node.position.x, y: bounds!.maxY - (node.data.height || 80) });
      } else {
        // "middle"
        const groupCenterY = (bounds!.minY + bounds!.maxY) / 2;
        getNewPos = (node) => ({
          x: node.position.x,
          y: Math.round(groupCenterY - (node.data.height || 80) / 2),
        });
      }

      const idSet = new Set(nodeIds);
      const updatedNodes = s.diagram.nodes.map((n) => {
        if (!idSet.has(n.id)) return n;
        const newPos = getNewPos(n);
        return { ...n, position: newPos };
      });

      return {
        past,
        future,
        selectionBounds: bounds,
        diagram: touch({ ...s.diagram, nodes: updatedNodes }),
      };
    }),

  distributeNodes: (nodeIds, axis) =>
    set((s) => {
      if (!s.diagram || nodeIds.length < 3) return s;
      const targetNodes = s.diagram.nodes.filter((n) => nodeIds.includes(n.id));
      if (targetNodes.length < 3) return s;

      const { past, future } = takeSnapshot(s);
      const key = [...nodeIds].sort().join(",");
      let bounds = s.selectionBounds;
      if (!bounds || bounds.nodeIdsKey !== key) {
        const minX = Math.min(...targetNodes.map((n) => n.position.x));
        const maxX = Math.max(...targetNodes.map((n) => n.position.x + (n.data.width || 180)));
        const minY = Math.min(...targetNodes.map((n) => n.position.y));
        const maxY = Math.max(...targetNodes.map((n) => n.position.y + (n.data.height || 80)));
        bounds = { nodeIdsKey: key, minX, maxX, minY, maxY };
      }

      const posMap = new Map<string, { x: number; y: number }>();

      if (axis === "horizontal") {
        const sorted = [...targetNodes].sort((a, b) => a.position.x - b.position.x);
        const totalSpan = bounds.maxX - bounds.minX;
        const sumWidths = sorted.reduce((acc, n) => acc + (n.data.width || 180), 0);
        const totalGap = totalSpan - sumWidths;
        const gap = totalGap / (sorted.length - 1);
        let currX = bounds.minX;
        sorted.forEach((n, idx) => {
          if (idx === 0) {
            posMap.set(n.id, { x: bounds!.minX, y: n.position.y });
          } else if (idx === sorted.length - 1) {
            posMap.set(n.id, { x: bounds!.maxX - (n.data.width || 180), y: n.position.y });
          } else {
            posMap.set(n.id, { x: Math.round(currX), y: n.position.y });
          }
          currX += (n.data.width || 180) + gap;
        });
      } else {
        const sorted = [...targetNodes].sort((a, b) => a.position.y - b.position.y);
        const totalSpan = bounds.maxY - bounds.minY;
        const sumHeights = sorted.reduce((acc, n) => acc + (n.data.height || 80), 0);
        const totalGap = totalSpan - sumHeights;
        const gap = totalGap / (sorted.length - 1);
        let currY = bounds.minY;
        sorted.forEach((n, idx) => {
          if (idx === 0) {
            posMap.set(n.id, { x: n.position.x, y: bounds!.minY });
          } else if (idx === sorted.length - 1) {
            posMap.set(n.id, { x: n.position.x, y: bounds!.maxY - (n.data.height || 80) });
          } else {
            posMap.set(n.id, { x: n.position.x, y: Math.round(currY) });
          }
          currY += (n.data.height || 80) + gap;
        });
      }

      const updatedNodes = s.diagram.nodes.map((n) => {
        const newPos = posMap.get(n.id);
        if (newPos) {
          return { ...n, position: newPos };
        }
        return n;
      });

      return {
        past,
        future,
        selectionBounds: bounds,
        diagram: touch({ ...s.diagram, nodes: updatedNodes }),
      };
    }),

  bulkUpdateNodeData: (nodeIds, patch) =>
    set((s) => {
      if (!s.diagram || nodeIds.length === 0) return s;
      const { past, future } = takeSnapshot(s);
      const idSet = new Set(nodeIds);
      const updatedNodes = s.diagram.nodes.map((n) => {
        if (!idSet.has(n.id)) return n;
        return {
          ...n,
          data: { ...n.data, ...patch },
        };
      });
      return {
        past,
        future,
        diagram: touch({ ...s.diagram, nodes: updatedNodes }),
      };
    }),

  removeMultipleNodes: (nodeIds) =>
    set((s) => {
      if (!s.diagram || nodeIds.length === 0) return s;
      const { past, future } = takeSnapshot(s);
      const idSet = new Set(nodeIds);
      const nodes = s.diagram.nodes.filter((n) => !idSet.has(n.id));
      const edges = s.diagram.edges.filter((e) => !idSet.has(e.source) && !idSet.has(e.target));
      return {
        past,
        future,
        diagram: touch({ ...s.diagram, nodes, edges }),
      };
    }),
}));
