import { create } from "zustand";
import {
  type Diagram,
  type FlowNode,
  type FlowEdge,
  type NodeKind,
  type NodeData,
  type EdgeData,
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
        data: { ...DEFAULT_EDGE_DATA },
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
}));
