import { expect, test } from "vitest";
import { TEMPLATE_CATALOG } from "./templates";

test("all templates build valid diagrams with nodes and edges", () => {
  expect(TEMPLATE_CATALOG.length).toBeGreaterThanOrEqual(5);

  for (const t of TEMPLATE_CATALOG) {
    const d = t.build();
    expect(d.name).toBeTruthy();
    expect(d.nodes.length).toBeGreaterThan(0);
    expect(d.edges.length).toBeGreaterThan(0);

    // Each edge connects existing nodes
    const nodeIds = new Set(d.nodes.map((n) => n.id));
    for (const e of d.edges) {
      expect(nodeIds.has(e.source)).toBe(true);
      expect(nodeIds.has(e.target)).toBe(true);
    }
  }
});
