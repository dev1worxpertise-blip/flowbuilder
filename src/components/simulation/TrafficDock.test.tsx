import { render, screen, fireEvent, act } from "@testing-library/react";
import { TrafficDock } from "./TrafficDock";
import { useTrafficStore } from "../../store/trafficStore";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram } from "../../types";

describe("TrafficDock", () => {
  beforeEach(() => {
    const diagram = createEmptyDiagram("Dock Test");
    diagram.nodes = [
      {
        id: "n1",
        type: "card",
        position: { x: 0, y: 0 },
        data: {
          title: "Service 1",
          subtitle: "Auth",
          accent: "blue",
          width: 200,
          height: 80,
          glow: false,
          healthStatus: "healthy",
          metric: "18ms",
        },
      },
    ];
    useEditorStore.getState().loadDiagram(diagram);
  });

  afterEach(() => {
    act(() => {
      useTrafficStore.getState().stopTraffic(false);
    });
  });

  test("renders nothing when not simulating", () => {
    act(() => {
      useTrafficStore.getState().stopTraffic(false);
    });
    const { container } = render(<TrafficDock />);
    expect(container.firstChild).toBeNull();
  });

  test("renders dock controls when simulating", () => {
    act(() => {
      useTrafficStore.getState().startTraffic();
    });
    render(<TrafficDock />);

    expect(screen.getByRole("region", { name: /live traffic simulation dock/i })).toBeInTheDocument();
    expect(screen.getByText(/live traffic/i)).toBeInTheDocument();
    expect(screen.getByText(/all systems normal/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chaos outage/i })).toBeInTheDocument();
  });

  test("clicking spike triggers packet surge", () => {
    act(() => {
      useTrafficStore.getState().startTraffic();
    });
    render(<TrafficDock />);

    const spikeBtn = screen.getByRole("button", { name: /spike/i });
    act(() => {
      fireEvent.click(spikeBtn);
    });
    expect(useTrafficStore.getState().totalPackets).toBeGreaterThan(2000);
  });
});
