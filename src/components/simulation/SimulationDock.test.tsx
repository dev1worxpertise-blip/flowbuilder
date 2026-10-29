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
});
