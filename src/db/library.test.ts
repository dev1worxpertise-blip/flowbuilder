import "fake-indexeddb/auto";
import { beforeEach, expect, test } from "vitest";
import { saveDiagram, getDiagram, listDiagrams, deleteDiagram } from "./library";
import { createEmptyDiagram } from "../types";

beforeEach(async () => {
  for (const d of await listDiagrams()) await deleteDiagram(d.id);
});

test("save then get returns the diagram", async () => {
  const d = createEmptyDiagram("A");
  await saveDiagram(d);
  expect((await getDiagram(d.id))?.name).toBe("A");
});

test("listDiagrams sorts by updatedAt descending", async () => {
  const a = { ...createEmptyDiagram("A"), updatedAt: 100 };
  const b = { ...createEmptyDiagram("B"), updatedAt: 200 };
  await saveDiagram(a);
  await saveDiagram(b);
  const list = await listDiagrams();
  expect(list.map((x) => x.name)).toEqual(["B", "A"]);
});

test("deleteDiagram removes it", async () => {
  const d = createEmptyDiagram("A");
  await saveDiagram(d);
  await deleteDiagram(d.id);
  expect(await getDiagram(d.id)).toBeUndefined();
});
