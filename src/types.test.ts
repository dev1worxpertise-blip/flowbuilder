import { createEmptyDiagram, ACCENTS } from "./types";

test("createEmptyDiagram returns a named diagram with empty nodes/edges and an id", () => {
  const d = createEmptyDiagram("My Flow");
  expect(d.name).toBe("My Flow");
  expect(d.nodes).toEqual([]);
  expect(d.edges).toEqual([]);
  expect(typeof d.id).toBe("string");
  expect(d.id.length).toBeGreaterThan(0);
  expect(d.createdAt).toBeLessThanOrEqual(d.updatedAt);
});

test("ACCENTS has the required keys including brand accents", () => {
  expect(ACCENTS).toEqual([
    "neutral",
    "green",
    "pink",
    "blue",
    "amber",
    "crimson",
    "purple",
  ]);
});
