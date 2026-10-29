import { useTrafficStore } from "./trafficStore";
import { useEditorStore } from "./editorStore";
import { createEmptyDiagram } from "../types";

describe("trafficStore", () => {
  beforeEach(() => {
    const diagram = createEmptyDiagram("Traffic Test");
    diagram.nodes = [
      {
        id: "n1",
        type: "card",
        position: { x: 0, y: 0 },
        data: {
          title: "API Gateway",
          subtitle: "Routes requests",
          accent: "blue",
          width: 200,
          height: 80,
          glow: false,
          healthStatus: "healthy",
          metric: "18ms",
        },
      },
      {
        id: "n2",
        type: "database",
        position: { x: 300, y: 0 },
        data: {
          title: "User DB",
          subtitle: "Postgres",
          accent: "green",
          width: 200,
          height: 80,
          glow: false,
          healthStatus: "healthy",
          metric: "99.9%",
        },
      },
    ];
    useEditorStore.getState().loadDiagram(diagram);
    useTrafficStore.getState().stopTraffic(false);
  });

  test("starts and stops traffic simulation", () => {
    const store = useTrafficStore.getState();
    expect(store.isSimulating).toBe(false);

    store.startTraffic();
    expect(useTrafficStore.getState().isSimulating).toBe(true);
    expect(useTrafficStore.getState().backups).toHaveLength(2);

    store.stopTraffic(true);
    expect(useTrafficStore.getState().isSimulating).toBe(false);
  });

  test("tickTraffic updates healthy node latency metrics", () => {
    const store = useTrafficStore.getState();
    store.startTraffic();

    // Call tick
    store.tickTraffic();

    const n1 = useEditorStore.getState().diagram!.nodes.find((n) => n.id === "n1");
    expect(n1?.data.metric).toBeDefined();
    expect(n1?.data.metric).toMatch(/\d+ms/);
  });

  test("injectChaos marks a node with outage or warning and increments incidentCount", () => {
    const store = useTrafficStore.getState();
    store.startTraffic();

    store.injectChaos();
    const state = useTrafficStore.getState();
    expect(state.incidentCount).toBeGreaterThanOrEqual(1);

    const hasBrokenNode = useEditorStore
      .getState()
      .diagram!.nodes.some((n) => n.data.healthStatus === "down" || n.data.healthStatus === "warning");
    expect(hasBrokenNode).toBe(true);

    // Now test healAll
    store.healAll();
    expect(useTrafficStore.getState().incidentCount).toBe(0);
    const allHealthy = useEditorStore
      .getState()
      .diagram!.nodes.every((n) => n.data.healthStatus === "healthy");
    expect(allHealthy).toBe(true);
  });
});
