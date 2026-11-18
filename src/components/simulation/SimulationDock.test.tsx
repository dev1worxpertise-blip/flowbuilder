import { render, screen, act } from "@testing-library/react";
import { vi } from "vitest";
import { SimulationDock } from "./SimulationDock";
import { useSimulationStore } from "../../store/simulationStore";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram } from "../../types";

// Mock React Flow setCenter
vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({
    setCenter: vi.fn(),
  }),
}));

describe("SimulationDock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const diagram = createEmptyDiagram("Simulation Multi-Step Test");
    diagram.nodes = [
      {
        id: "step1",
        type: "pill",
        position: { x: 0, y: 0 },
        data: { title: "1. Step One", width: 150, height: 60, glow: false },
      },
      {
        id: "step2",
        type: "card",
        position: { x: 250, y: 0 },
        data: { title: "2. Step Two", width: 150, height: 60, glow: false },
      },
      {
        id: "step3",
        type: "card",
        position: { x: 500, y: 0 },
        data: { title: "3. Step Three", width: 150, height: 60, glow: false },
      },
    ];
    diagram.edges = [
      {
        id: "e1",
        source: "step1",
        target: "step2",
        type: "animated",
        data: { animation: "dots", color: "#38bdf8", speed: 2, lineStyle: "solid", path: "smoothstep" },
      },
      {
        id: "e2",
        source: "step2",
        target: "step3",
        type: "animated",
        data: { animation: "dots", color: "#38bdf8", speed: 2, lineStyle: "solid", path: "smoothstep" },
      },
    ];
    useEditorStore.getState().loadDiagram(diagram);
  });

  afterEach(() => {
    act(() => {
      useSimulationStore.getState().stopSimulation();
    });
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test("auto-advances past step 2 to step 3 continuously", () => {
    const diagram = useEditorStore.getState().diagram!;
    
    // Start simulation at step 1
    act(() => {
      useSimulationStore.getState().startSimulation(diagram.nodes, diagram.edges);
    });

    render(<SimulationDock />);
    expect(useSimulationStore.getState().currentNodeId).toBe("step1");

    // Advance 1 interval: should step from 1 -> 2
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(useSimulationStore.getState().currentNodeId).toBe("step2");

    // Advance 2nd interval: should step from 2 -> 3 (previously was stuck at step 2!)
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(useSimulationStore.getState().currentNodeId).toBe("step3");

    // Advance 3rd interval: step 3 has no outgoing edges -> should complete
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(useSimulationStore.getState().status).toBe("completed");
    expect(screen.getByText(/flow complete!/i)).toBeInTheDocument();
  });

  test("renders Decision Point branch dialog clearly and allows selecting Yes/No branches", () => {
    const diagram = useEditorStore.getState().diagram!;
    diagram.nodes.push({
      id: "dec1",
      type: "decision",
      position: { x: 750, y: 0 },
      data: { title: "Tool Required?", width: 150, height: 80, glow: false },
    } as any);
    diagram.nodes.push({
      id: "branchYes",
      type: "card",
      position: { x: 1000, y: -100 },
      data: { title: "Invoke Tool API", width: 150, height: 60, glow: false },
    } as any);
    diagram.nodes.push({
      id: "branchNo",
      type: "card",
      position: { x: 1000, y: 100 },
      data: { title: "Direct LLM Response", width: 150, height: 60, glow: false },
    } as any);
    diagram.edges.push({
      id: "e-yes",
      source: "dec1",
      target: "branchYes",
      type: "animated",
      data: { label: "Yes", animation: "dots" },
    } as any);
    diagram.edges.push({
      id: "e-no",
      source: "dec1",
      target: "branchNo",
      type: "animated",
      data: { label: "No", animation: "dots" },
    } as any);

    render(<SimulationDock />);

    // Trigger branch choice at decision point
    act(() => {
      useSimulationStore.setState({
        isActive: true,
        status: "paused",
        currentNodeId: "dec1",
        branchChoice: {
          sourceNodeId: "dec1",
          sourceTitle: "Tool Required?",
          branches: [
            { edgeId: "e-yes", targetId: "branchYes", label: "Yes", targetTitle: "Invoke Tool API" },
            { edgeId: "e-no", targetId: "branchNo", label: "No", targetTitle: "Direct LLM Response" },
          ],
        },
      });
    });

    // Dialog must be rendered prominently
    expect(screen.getByText("Decision Point")).toBeInTheDocument();
    expect(screen.getAllByText("Tool Required?").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();

    // Click "Yes"
    act(() => {
      screen.getByText("Yes").click();
    });

    expect(useSimulationStore.getState().currentNodeId).toBe("branchYes");
    expect(useSimulationStore.getState().branchChoice).toBeNull();
  });
});
