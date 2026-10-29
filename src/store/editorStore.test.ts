import { beforeEach, expect, test } from "vitest";
import { useEditorStore } from "./editorStore";
import { createEmptyDiagram } from "../types";

beforeEach(() => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
});

test("addNode appends a card node at the given position", () => {
  useEditorStore.getState().addNode("card", { x: 10, y: 20 });
  const nodes = useEditorStore.getState().diagram!.nodes;
  expect(nodes).toHaveLength(1);
  expect(nodes[0].type).toBe("card");
  expect(nodes[0].position).toEqual({ x: 10, y: 20 });
});

test("updateNodeData patches data and bumps updatedAt", () => {
  const s = useEditorStore.getState();
  s.addNode("card", { x: 0, y: 0 });
  const id = useEditorStore.getState().diagram!.nodes[0].id;
  const before = useEditorStore.getState().diagram!.updatedAt;
  s.updateNodeData(id, { title: "Hello" });
  const d = useEditorStore.getState().diagram!;
  expect(d.nodes[0].data.title).toBe("Hello");
  expect(d.updatedAt).toBeGreaterThanOrEqual(before);
});

test("removeNode also removes its connected edges", () => {
  const s = useEditorStore.getState();
  s.addNode("card", { x: 0, y: 0 });
  s.addNode("card", { x: 1, y: 1 });
  const [a, b] = useEditorStore.getState().diagram!.nodes;
  s.addEdge({ source: a.id, target: b.id });
  expect(useEditorStore.getState().diagram!.edges).toHaveLength(1);
  s.removeNode(a.id);
  expect(useEditorStore.getState().diagram!.edges).toHaveLength(0);
  expect(useEditorStore.getState().diagram!.nodes).toHaveLength(1);
});

test("addBranch creates a connected step node and an animated edge with label", () => {
  useEditorStore.getState().addNode("decision", { x: 100, y: 100 });
  const decisionNode = useEditorStore.getState().diagram!.nodes[0];

  const resYes = useEditorStore.getState().addBranch(decisionNode.id, "Yes");
  expect(resYes).not.toBeNull();
  expect(useEditorStore.getState().diagram!.nodes).toHaveLength(2);
  expect(useEditorStore.getState().diagram!.edges).toHaveLength(1);
  expect(resYes!.edge.data.label).toBe("Yes");
  expect(resYes!.node.data.title).toBe("Approved Step");

  const resNo = useEditorStore.getState().addBranch(decisionNode.id, "No");
  expect(resNo).not.toBeNull();
  expect(useEditorStore.getState().diagram!.nodes).toHaveLength(3);
  expect(useEditorStore.getState().diagram!.edges).toHaveLength(2);
  expect(resNo!.edge.data.label).toBe("No");
  expect(resNo!.node.data.title).toBe("Rejected Step");

  // Can undo branch creation
  useEditorStore.getState().undo();
  expect(useEditorStore.getState().diagram!.nodes).toHaveLength(2);
  expect(useEditorStore.getState().diagram!.edges).toHaveLength(1);
});

test("setDefaultPathKind sets default routing and setAllEdgesPathKind converts all edges", () => {
  const s = useEditorStore.getState();
  s.addNode("card", { x: 0, y: 0 });
  s.addNode("card", { x: 100, y: 100 });
  const [a, b] = useEditorStore.getState().diagram!.nodes;

  s.setDefaultPathKind("bezier");
  expect(useEditorStore.getState().defaultPathKind).toBe("bezier");

  s.addEdge({ source: a.id, target: b.id });
  expect(useEditorStore.getState().diagram!.edges[0].data.path).toBe("bezier");

  // Convert all to step
  useEditorStore.getState().setAllEdgesPathKind("step");
  expect(useEditorStore.getState().diagram!.edges[0].data.path).toBe("step");
  expect(useEditorStore.getState().defaultPathKind).toBe("step");

  // Undo reverts the conversion
  useEditorStore.getState().undo();
  expect(useEditorStore.getState().diagram!.edges[0].data.path).toBe("bezier");
});

test("alignNodes aligns multiple nodes to left, center, and top", () => {
  const store = useEditorStore.getState();
  store.addNode("card", { x: 50, y: 10 });
  store.addNode("card", { x: 150, y: 80 });
  const [n1, n2] = useEditorStore.getState().diagram!.nodes;

  // Align Left
  store.alignNodes([n1.id, n2.id], "left");
  const nodesLeft = useEditorStore.getState().diagram!.nodes;
  expect(nodesLeft[0].position.x).toBe(50);
  expect(nodesLeft[1].position.x).toBe(50);

  // Align Top
  store.alignNodes([n1.id, n2.id], "top");
  const nodesTop = useEditorStore.getState().diagram!.nodes;
  expect(nodesTop[0].position.y).toBe(10);
  expect(nodesTop[1].position.y).toBe(10);

  // Undo reverts to before align top
  store.undo();
  expect(useEditorStore.getState().diagram!.nodes[1].position.y).toBe(80);
});

test("aligning Top then Bottom works without getting stuck on same coordinates", () => {
  const store = useEditorStore.getState();
  store.clearSelectionBounds();
  store.addNode("card", { x: 50, y: 50 });
  store.addNode("card", { x: 50, y: 200 });
  const [n1, n2] = useEditorStore.getState().diagram!.nodes;

  // 1. Align Top
  store.alignNodes([n1.id, n2.id], "top");
  let nodes = useEditorStore.getState().diagram!.nodes;
  expect(nodes[0].position.y).toBe(50);
  expect(nodes[1].position.y).toBe(50);

  // 2. Now Align Bottom -> should move both to bottom (200), NOT get stuck at 50!
  store.alignNodes([n1.id, n2.id], "bottom");
  nodes = useEditorStore.getState().diagram!.nodes;
  expect(nodes[0].position.y).toBe(200);
  expect(nodes[1].position.y).toBe(200);

  // 3. Now Align Middle -> should move both to middle (125)
  store.alignNodes([n1.id, n2.id], "middle");
  nodes = useEditorStore.getState().diagram!.nodes;
  expect(nodes[0].position.y).toBe(125);
  expect(nodes[1].position.y).toBe(125);
});

test("distributeNodes evenly spaces 3 nodes horizontally", () => {
  const store = useEditorStore.getState();
  store.addNode("card", { x: 0, y: 0 }); // w=180 -> right=180
  store.addNode("card", { x: 50, y: 0 }); // middle node
  store.addNode("card", { x: 600, y: 0 }); // last node w=180
  const ids = useEditorStore.getState().diagram!.nodes.map((n) => n.id);

  store.distributeNodes(ids, "horizontal");
  const nodes = useEditorStore.getState().diagram!.nodes;
  // First stays at 0, last stays at 600, middle is evenly spaced
  expect(nodes[0].position.x).toBe(0);
  expect(nodes[2].position.x).toBe(600);
  expect(nodes[1].position.x).toBeGreaterThan(150);
  expect(nodes[1].position.x).toBeLessThan(500);
});

test("bulkUpdateNodeData and removeMultipleNodes", () => {
  const store = useEditorStore.getState();
  store.addNode("card", { x: 0, y: 0 });
  store.addNode("card", { x: 100, y: 0 });
  const ids = useEditorStore.getState().diagram!.nodes.map((n) => n.id);

  store.bulkUpdateNodeData(ids, { accent: "green", healthStatus: "healthy" });
  const nodes = useEditorStore.getState().diagram!.nodes;
  expect(nodes[0].data.accent).toBe("green");
  expect(nodes[1].data.accent).toBe("green");
  expect(nodes[0].data.healthStatus).toBe("healthy");
  expect(nodes[1].data.healthStatus).toBe("healthy");

  store.removeMultipleNodes(ids);
  expect(useEditorStore.getState().diagram!.nodes).toHaveLength(0);
});

