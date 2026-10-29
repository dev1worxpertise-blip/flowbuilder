import { buildGuidedTour } from "./guidedTour";
import type { FlowNode, FlowEdge } from "../types";

describe("buildGuidedTour", () => {
  it("returns empty array for empty node list", () => {
    expect(buildGuidedTour([], [])).toEqual([]);
  });

  it("orders a linear pipeline from start to finish", () => {
    const nodes = [
      { id: "c", type: "card", position: { x: 400, y: 0 }, data: { title: "Done" } },
      { id: "a", type: "card", position: { x: 0, y: 0 }, data: { title: "Start" } },
      { id: "b", type: "card", position: { x: 200, y: 0 }, data: { title: "Process" } },
    ] as any as FlowNode[];
    const edges = [
      { id: "e1", source: "a", target: "b", data: { animation: "dots" } },
      { id: "e2", source: "b", target: "c", data: { animation: "dots" } },
    ] as any as FlowEdge[];

    const tour = buildGuidedTour(nodes, edges);
    expect(tour.map((t) => t.node.id)).toEqual(["a", "b", "c"]);
    expect(tour[0].outgoingEdges).toHaveLength(1);
    expect(tour[1].incomingEdges).toHaveLength(1);
    expect(tour[2].incomingEdges).toHaveLength(1);
  });

  it("handles branched flows and orders multiple roots left-to-right", () => {
    const nodes = [
      { id: "r2", type: "card", position: { x: 300, y: 0 }, data: { title: "Webhook" } },
      { id: "r1", type: "card", position: { x: 100, y: 0 }, data: { title: "UI Click" } },
      { id: "proc", type: "process", position: { x: 200, y: 200 }, data: { title: "Worker" } },
    ] as any as FlowNode[];
    const edges = [
      { id: "e1", source: "r1", target: "proc", data: { animation: "dots" } },
      { id: "e2", source: "r2", target: "proc", data: { animation: "dots" } },
    ] as any as FlowEdge[];

    const tour = buildGuidedTour(nodes, edges);
    // r1 is at x=100, r2 is at x=300
    expect(tour[0].node.id).toBe("r1");
    expect(tour.map((t) => t.node.id)).toContain("proc");
  });

  it("excludes group nodes when actionable nodes exist", () => {
    const nodes = [
      { id: "g1", type: "group", position: { x: 0, y: 0 }, data: { title: "Container" } },
      { id: "n1", type: "card", position: { x: 50, y: 50 }, data: { title: "Step 1" } },
    ] as any as FlowNode[];
    const tour = buildGuidedTour(nodes, []);
    expect(tour.map((t) => t.node.id)).toEqual(["n1"]);
  });
});
