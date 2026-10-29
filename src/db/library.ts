import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Diagram } from "../types";

interface LibrarySchema extends DBSchema {
  diagrams: { key: string; value: Diagram; indexes: { updatedAt: number } };
}

let dbPromise: Promise<IDBPDatabase<LibrarySchema>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<LibrarySchema>("hdl-flow-builder", 1, {
      upgrade(database) {
        const store = database.createObjectStore("diagrams", { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      },
    });
  }
  return dbPromise;
}

export async function saveDiagram(d: Diagram): Promise<void> {
  await (await db()).put("diagrams", d);
}

export async function getDiagram(id: string): Promise<Diagram | undefined> {
  return (await db()).get("diagrams", id);
}

export async function listDiagrams(): Promise<Diagram[]> {
  const all = await (await db()).getAll("diagrams");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteDiagram(id: string): Promise<void> {
  await (await db()).delete("diagrams", id);
}
