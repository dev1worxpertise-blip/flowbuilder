import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { NodeSearchModal } from "./NodeSearchModal";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram } from "../../types";

const mockSetCenter = vi.fn();

vi.mock("@xyflow/react", async () => {
  const actual = await vi.importActual("@xyflow/react");
  return {
    ...actual,
    useReactFlow: () => ({
      setCenter: mockSetCenter,
    }),
  };
});

describe("NodeSearchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const diagram = createEmptyDiagram("Search Test");
    diagram.nodes = [
      {
        id: "node-1",
        type: "card",
        position: { x: 100, y: 150 },
        data: {
          title: "Auth Service",
          subtitle: "Handles OAuth & JWT",
          accent: "blue",
          width: 220,
          height: 88,
          glow: false,
          healthStatus: "healthy",
          metric: "18ms",
        },
      },
      {
        id: "node-2",
        type: "card",
        position: { x: 400, y: 200 },
        data: {
          title: "Payment Gateway",
          subtitle: "Stripe & PayPal",
          accent: "green",
          width: 220,
          height: 88,
          glow: false,
          healthStatus: "warning",
          metric: "250ms",
        },
      },
      {
        id: "node-3",
        type: "database",
        position: { x: 700, y: 300 },
        data: {
          title: "PostgreSQL DB",
          subtitle: "Primary replica",
          accent: "pink",
          width: 140,
          height: 80,
          glow: true,
          healthStatus: "down",
          metric: "0 rps",
        },
      },
    ];
    useEditorStore.getState().loadDiagram(diagram);
  });

  test("renders all nodes when open", () => {
    render(
      <ReactFlowProvider>
        <NodeSearchModal isOpen={true} onClose={() => {}} onSelectNode={() => {}} />
      </ReactFlowProvider>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Auth Service")).toBeInTheDocument();
    expect(screen.getByText("Payment Gateway")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL DB")).toBeInTheDocument();
  });

  test("filters nodes by search query", () => {
    render(
      <ReactFlowProvider>
        <NodeSearchModal isOpen={true} onClose={() => {}} onSelectNode={() => {}} />
      </ReactFlowProvider>
    );

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "OAuth" } });

    expect(screen.getByText("Auth Service")).toBeInTheDocument();
    expect(screen.queryByText("Payment Gateway")).not.toBeInTheDocument();
    expect(screen.queryByText("PostgreSQL DB")).not.toBeInTheDocument();
  });

  test("filters nodes by health status filter pill", () => {
    render(
      <ReactFlowProvider>
        <NodeSearchModal isOpen={true} onClose={() => {}} onSelectNode={() => {}} />
      </ReactFlowProvider>
    );

    // Click Outage (1) pill
    const outageFilter = screen.getByRole("button", { name: /outage/i });
    fireEvent.click(outageFilter);

    expect(screen.getByText("PostgreSQL DB")).toBeInTheDocument();
    expect(screen.queryByText("Auth Service")).not.toBeInTheDocument();
    expect(screen.queryByText("Payment Gateway")).not.toBeInTheDocument();
  });

  test("clicking a node selects it and flies camera via setCenter", () => {
    const onSelectNode = vi.fn();
    const onClose = vi.fn();

    render(
      <ReactFlowProvider>
        <NodeSearchModal isOpen={true} onClose={onClose} onSelectNode={onSelectNode} />
      </ReactFlowProvider>
    );

    fireEvent.click(screen.getByText("Auth Service"));

    expect(onSelectNode).toHaveBeenCalledWith("node-1");
    expect(mockSetCenter).toHaveBeenCalledWith(210, 194, expect.objectContaining({ duration: 600, zoom: 1.25 }));
    expect(onClose).toHaveBeenCalled();
    expect(useEditorStore.getState().highlightedNodeId).toBe("node-1");
  });

  test("keyboard navigation: Down and Enter selects node", () => {
    const onSelectNode = vi.fn();
    const onClose = vi.fn();

    render(
      <ReactFlowProvider>
        <NodeSearchModal isOpen={true} onClose={onClose} onSelectNode={onSelectNode} />
      </ReactFlowProvider>
    );

    const input = screen.getByRole("searchbox");
    // Press ArrowDown to move to node-2 ("Payment Gateway")
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelectNode).toHaveBeenCalledWith("node-2");
    expect(onClose).toHaveBeenCalled();
  });
});
