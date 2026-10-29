import { render, screen, fireEvent } from "@testing-library/react";
import { Inspector } from "./Inspector";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram } from "../../types";

test("editing node title updates the store", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
  useEditorStore.getState().addNode("card", { x: 0, y: 0 });
  const id = useEditorStore.getState().diagram!.nodes[0].id;
  render(<Inspector selection={{ kind: "node", id }} />);
  fireEvent.change(screen.getByDisplayValue("New Block"), { target: { value: "Renamed" } });
  expect(useEditorStore.getState().diagram!.nodes[0].data.title).toBe("Renamed");
});

test("editing width/height resizes the node in the store", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
  useEditorStore.getState().addNode("card", { x: 0, y: 0 });
  const id = useEditorStore.getState().diagram!.nodes[0].id;
  render(<Inspector selection={{ kind: "node", id }} />);
  fireEvent.change(screen.getByLabelText("width"), { target: { value: "300" } });
  fireEvent.change(screen.getByLabelText("height"), { target: { value: "120" } });
  const n = useEditorStore.getState().diagram!.nodes[0].data;
  expect(n.width).toBe(300);
  expect(n.height).toBe(120);
});

test("delete connector removes the edge from the store and clears selection", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
  useEditorStore.getState().addNode("card", { x: 0, y: 0 });
  useEditorStore.getState().addNode("card", { x: 100, y: 0 });
  const [a, b] = useEditorStore.getState().diagram!.nodes;
  useEditorStore.getState().addEdge({ source: a.id, target: b.id });
  const edgeId = useEditorStore.getState().diagram!.edges[0].id;
  let cleared = false;
  render(<Inspector selection={{ kind: "edge", id: edgeId }} onClearSelection={() => { cleared = true; }} />);
  fireEvent.click(screen.getByLabelText("Delete connector"));
  expect(useEditorStore.getState().diagram!.edges).toHaveLength(0);
  expect(cleared).toBe(true);
});

test("shows placeholder when nothing selected", () => {
  render(<Inspector selection={null} />);
  expect(screen.getByText(/select a block/i)).toBeInTheDocument();
});

test("renders Add Yes and Add No branch buttons when node is selected", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
  useEditorStore.getState().addNode("decision", { x: 0, y: 0 });
  const id = useEditorStore.getState().diagram!.nodes[0].id;
  render(<Inspector selection={{ kind: "node", id }} />);
  expect(screen.getByRole("button", { name: /\+ add "yes"/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /\+ add "no"/i })).toBeInTheDocument();

  // Clicking Add Yes adds a connected node and edge
  fireEvent.click(screen.getByRole("button", { name: /\+ add "yes"/i }));
  const diagram = useEditorStore.getState().diagram!;
  expect(diagram.nodes).toHaveLength(2);
  expect(diagram.edges).toHaveLength(1);
  expect(diagram.edges[0].data.label).toBe("Yes");
});

test("selecting connector routing buttons updates edge path in store", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
  useEditorStore.getState().addNode("card", { x: 0, y: 0 });
  useEditorStore.getState().addNode("card", { x: 100, y: 0 });
  const [a, b] = useEditorStore.getState().diagram!.nodes;
  useEditorStore.getState().addEdge({ source: a.id, target: b.id });
  const edgeId = useEditorStore.getState().diagram!.edges[0].id;

  render(<Inspector selection={{ kind: "edge", id: edgeId }} />);

  // Click Sharp Step routing
  fireEvent.click(screen.getByRole("button", { name: /route sharp step/i }));
  expect(useEditorStore.getState().diagram!.edges[0].data.path).toBe("step");

  // Click Straight routing
  fireEvent.click(screen.getByRole("button", { name: /route straight/i }));
  expect(useEditorStore.getState().diagram!.edges[0].data.path).toBe("straight");
});

test("opening icon picker and selecting an icon updates node data", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
  useEditorStore.getState().addNode("card", { x: 0, y: 0 });
  const id = useEditorStore.getState().diagram!.nodes[0].id;

  render(<Inspector selection={{ kind: "node", id }} />);

  // Click AWS Cloud icon from the quick icon grid
  const awsButtons = screen.getAllByRole("button", { name: /aws cloud/i });
  fireEvent.click(awsButtons[0]);

  expect(useEditorStore.getState().diagram!.nodes[0].data.iconify).toBe("logos:aws");
});

test("selecting health status and metric presets updates node data", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
  useEditorStore.getState().addNode("card", { x: 0, y: 0 });
  const id = useEditorStore.getState().diagram!.nodes[0].id;

  render(<Inspector selection={{ kind: "node", id }} />);

  // Click Healthy status button
  fireEvent.click(screen.getByRole("button", { name: /status healthy/i }));
  expect(useEditorStore.getState().diagram!.nodes[0].data.healthStatus).toBe("healthy");

  // Click 18ms metric preset
  fireEvent.click(screen.getByRole("button", { name: /metric preset 18ms/i }));
  expect(useEditorStore.getState().diagram!.nodes[0].data.metric).toBe("18ms");

  // Click Reset to clear health
  fireEvent.click(screen.getByRole("button", { name: /clear health status/i }));
  expect(useEditorStore.getState().diagram!.nodes[0].data.healthStatus).toBeUndefined();
  expect(useEditorStore.getState().diagram!.nodes[0].data.metric).toBeUndefined();
});

test("multi-selection shows multi-selection inspector panel and aligns blocks", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
  useEditorStore.getState().addNode("card", { x: 20, y: 10 });
  useEditorStore.getState().addNode("card", { x: 120, y: 80 });
  const [a, b] = useEditorStore.getState().diagram!.nodes;

  render(<Inspector selection={{ kind: "multi", nodeIds: [a.id, b.id] }} />);

  expect(screen.getByText(/2 blocks selected/i)).toBeInTheDocument();
  expect(screen.getByText("Align Blocks")).toBeInTheDocument();

  // Click Top alignment button
  fireEvent.click(screen.getByTitle(/align top edges/i));
  const nodes = useEditorStore.getState().diagram!.nodes;
  expect(nodes[0].position.y).toBe(10);
  expect(nodes[1].position.y).toBe(10);
});

test("edge speed, animation, color presets, and beam width update edge data in store", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
  useEditorStore.getState().addNode("card", { x: 0, y: 0 });
  useEditorStore.getState().addNode("card", { x: 100, y: 0 });
  const [a, b] = useEditorStore.getState().diagram!.nodes;
  useEditorStore.getState().addEdge({ source: a.id, target: b.id });
  const edgeId = useEditorStore.getState().diagram!.edges[0].id;

  render(<Inspector selection={{ kind: "edge", id: edgeId }} />);

  // Click 5x speed preset
  fireEvent.click(screen.getByRole("button", { name: /speed 5x/i }));
  expect(useEditorStore.getState().diagram!.edges[0].data.speed).toBe(5);

  // Click Energy Wave (pulse) animation
  fireEvent.click(screen.getByRole("button", { name: /animation energy wave/i }));
  expect(useEditorStore.getState().diagram!.edges[0].data.animation).toBe("pulse");

  // Click Thick beam width
  fireEvent.click(screen.getByRole("button", { name: /width thick/i }));
  expect(useEditorStore.getState().diagram!.edges[0].data.strokeWidth).toBe(4);

  // Click Emerald color preset
  fireEvent.click(screen.getByRole("button", { name: /color preset emerald/i }));
  expect(useEditorStore.getState().diagram!.edges[0].data.color).toBe("#10b981");
});
