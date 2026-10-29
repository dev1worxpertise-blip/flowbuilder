import { render, screen, fireEvent } from "@testing-library/react";
import { MultiNodeActionBar } from "./MultiNodeActionBar";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram } from "../../types";

describe("MultiNodeActionBar", () => {
  beforeEach(() => {
    const diagram = createEmptyDiagram("Multi Test");
    diagram.nodes = [
      {
        id: "n1",
        type: "card",
        position: { x: 10, y: 10 },
        data: { title: "A", subtitle: "", accent: "blue", width: 180, height: 80, glow: false },
      },
      {
        id: "n2",
        type: "card",
        position: { x: 100, y: 50 },
        data: { title: "B", subtitle: "", accent: "blue", width: 180, height: 80, glow: false },
      },
      {
        id: "n3",
        type: "card",
        position: { x: 400, y: 120 },
        data: { title: "C", subtitle: "", accent: "blue", width: 180, height: 80, glow: false },
      },
    ];
    useEditorStore.getState().loadDiagram(diagram);
  });

  test("renders nothing when fewer than 2 nodes are selected", () => {
    const { container } = render(
      <MultiNodeActionBar selectedNodeIds={["n1"]} onClearSelection={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders alignment and distribution buttons when 3 nodes selected", () => {
    render(
      <MultiNodeActionBar selectedNodeIds={["n1", "n2", "n3"]} onClearSelection={() => {}} />
    );

    expect(screen.getByRole("toolbar")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /align left/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /distribute horizontally/i })).toBeInTheDocument();
  });

  test("clicking Align Left aligns nodes in store", () => {
    render(
      <MultiNodeActionBar selectedNodeIds={["n1", "n2"]} onClearSelection={() => {}} />
    );

    fireEvent.click(screen.getByRole("button", { name: /align left/i }));
    const nodes = useEditorStore.getState().diagram!.nodes;
    expect(nodes[0].position.x).toBe(10);
    expect(nodes[1].position.x).toBe(10);
  });

  test("clicking Delete removes multiple nodes", () => {
    const onClear = vi.fn();
    render(
      <MultiNodeActionBar selectedNodeIds={["n1", "n2"]} onClearSelection={onClear} />
    );

    fireEvent.click(screen.getByRole("button", { name: /delete selected nodes/i }));
    expect(useEditorStore.getState().diagram!.nodes).toHaveLength(1);
    expect(onClear).toHaveBeenCalled();
  });
});
