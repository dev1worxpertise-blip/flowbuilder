import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { nodeTypes } from "./index";
import { CardNode } from "./CardNode";
import { DecisionNode } from "./DecisionNode";
import { PillNode } from "./PillNode";
import { LabelNode } from "./LabelNode";
import { ShapeNode } from "./shapes";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram, defaultNodeData, type NodeData, type NodeKind } from "../../types";

const DATA: NodeData = { title: "My Block", subtitle: "Sub", accent: "blue", width: 220, height: 88, glow: true };

function renderNode(Comp: any, type: NodeKind = "card") {
  return render(
    <ReactFlowProvider>
      <Comp id="n1" data={DATA} selected={false} type={type}
        dragging={false} zIndex={0} isConnectable positionAbsoluteX={0} positionAbsoluteY={0}
        draggable={false} selectable={false} deletable={false} />
    </ReactFlowProvider> as any
  );
}

test("nodeTypes maps the special kinds to their components and shape kinds to ShapeNode", () => {
  expect(nodeTypes.card).toBe(CardNode);
  expect(nodeTypes.decision).toBe(DecisionNode);
  expect(nodeTypes.pill).toBe(PillNode);
  expect(nodeTypes.label).toBe(LabelNode);
  for (const k of ["process", "io", "database", "document", "multidoc", "predefined",
    "preparation", "connector", "manualinput", "delay", "manualop", "offpage"] as const) {
    expect(nodeTypes[k]).toBe(ShapeNode);
  }
});

test("every NodeKind has a nodeTypes entry and a default size preset", () => {
  for (const k of Object.keys(nodeTypes) as NodeKind[]) {
    expect(nodeTypes[k]).toBeTruthy();
    const d = defaultNodeData(k);
    expect(d.width).toBeGreaterThan(0);
    expect(d.height).toBeGreaterThan(0);
  }
});

test.each([
  ["decision", DecisionNode],
  ["pill", PillNode],
  ["label", LabelNode],
] as const)("%s node renders its title and can be deleted", (kind, Comp) => {
  const d = createEmptyDiagram("T");
  d.nodes = [{ id: "n1", type: kind as NodeKind, position: { x: 0, y: 0 }, data: { ...DATA } }];
  useEditorStore.getState().loadDiagram(d);
  renderNode(Comp, kind);
  expect(screen.getByText("My Block")).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText(/delete block/i));
  expect(useEditorStore.getState().diagram!.nodes).toHaveLength(0);
});

test.each([
  "process", "io", "database", "document", "multidoc", "predefined",
  "preparation", "connector", "manualinput", "delay", "manualop", "offpage",
] as const)("ShapeNode (%s) renders its title and can be deleted", (kind) => {
  const d = createEmptyDiagram("T");
  d.nodes = [{ id: "n1", type: kind, position: { x: 0, y: 0 }, data: { ...DATA } }];
  useEditorStore.getState().loadDiagram(d);
  renderNode(ShapeNode, kind);
  expect(screen.getByText("My Block")).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText(/delete block/i));
  expect(useEditorStore.getState().diagram!.nodes).toHaveLength(0);
});
