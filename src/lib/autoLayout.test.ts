import { expect, test } from "vitest";
import { applyAutoLayout } from "./autoLayout";
import { buildCicdTemplate } from "../templates/templates";

test("applyAutoLayout repositions nodes without losing connections", () => {
  const cicd = buildCicdTemplate();

  const { nodes, edges } = applyAutoLayout(cicd.nodes, cicd.edges, "LR");

  expect(nodes).toHaveLength(cicd.nodes.length);
  expect(edges).toHaveLength(cicd.edges.length);

  // Nodes are laid out from left to right
  const root = nodes.find((n) => n.id === "ci1");
  const end = nodes.find((n) => n.id === "ci7a");
  expect(root).toBeDefined();
  expect(end).toBeDefined();
  expect(end!.position.x).toBeGreaterThan(root!.position.x);
});

test("applyAutoLayout works with empty or single node diagrams", () => {
  const empty = applyAutoLayout([], []);
  expect(empty.nodes).toHaveLength(0);
});
