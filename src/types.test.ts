import { createEmptyDiagram, ACCENTS, isLightColor, CANVAS_COLOR_PRESETS } from "./types";

test("createEmptyDiagram returns a named diagram with empty nodes/edges and an id", () => {
  const d = createEmptyDiagram("My Flow");
  expect(d.name).toBe("My Flow");
  expect(d.nodes).toEqual([]);
  expect(d.edges).toEqual([]);
  expect(typeof d.id).toBe("string");
  expect(d.id.length).toBeGreaterThan(0);
  expect(d.createdAt).toBeLessThanOrEqual(d.updatedAt);
  expect(d.canvasColor).toBe("#0a0d15");
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

test("isLightColor correctly detects light and dark background hex codes", () => {
  expect(isLightColor("#0a0d15")).toBe(false);
  expect(isLightColor("#000000")).toBe(false);
  expect(isLightColor("#18181b")).toBe(false);
  expect(isLightColor("#ffffff")).toBe(true);
  expect(isLightColor("#f8fafc")).toBe(true);
  expect(isLightColor("#fafaf9")).toBe(true);
  expect(isLightColor("transparent")).toBe(false);
});

test("CANVAS_COLOR_PRESETS contains default and popular themes", () => {
  expect(CANVAS_COLOR_PRESETS.length).toBeGreaterThanOrEqual(10);
  expect(CANVAS_COLOR_PRESETS.find((p) => p.id === "default")?.color).toBe("#0a0d15");
  expect(CANVAS_COLOR_PRESETS.find((p) => p.id === "oled")?.color).toBe("#000000");
  expect(CANVAS_COLOR_PRESETS.find((p) => p.id === "pure-white")?.color).toBe("#ffffff");
});
