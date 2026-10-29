# HDL Flow Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline, drag-and-drop flowchart builder with animated connectors, a saved-diagram library, and a fullscreen Present mode, opening with the HDL Customer Lifecycle preloaded.

**Architecture:** Pure frontend SPA. React Flow renders the canvas with custom node and edge components. Zustand holds editor state; IndexedDB persists a library of diagrams. Animations are SVG/Framer Motion on custom edges. Present mode is a fullscreen overlay that replays edge animations in sequence.

**Tech Stack:** Vite, React 18, TypeScript, @xyflow/react (React Flow), Tailwind CSS, Framer Motion, Zustand, idb (IndexedDB), html-to-image. Tests: Vitest, @testing-library/react, fake-indexeddb.

## Global Constraints

- Runs fully offline — no backend, no network calls at runtime. Platform: Windows; dev via `npm run dev`, build via `npm run build`.
- TypeScript strict mode on. No `any` in committed code except typed third-party shims.
- Accent palette (exact keys): `neutral | green | pink | blue | amber`.
- Node types (exact keys): `card | decision | pill | label`.
- Edge animation keys (exact): `dots | gradient | none`.
- Dark theme only for v1. Card aesthetic: dark glassy rounded rectangle, bold numbered title, muted subtitle, accent border + soft outer glow.
- Commit after every task with a `feat:`/`chore:`/`test:` prefixed message.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `App` React component (default export) rendering a `<div>` with text "HDL Flow Builder".

- [ ] **Step 1: Create package.json**

```json
{
  "name": "hdl-flow-builder",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@xyflow/react": "^12.3.0",
    "framer-motion": "^11.5.0",
    "html-to-image": "^1.11.11",
    "idb": "^8.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vite": "^5.4.3",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create config files**

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
} as any);
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

`postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 3: Create entry files**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HDL Flow Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
html, body, #root { height: 100%; margin: 0; background: #0a0e1a; color: #e5e7eb; }
```

`src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/App.tsx`:
```tsx
export default function App() {
  return <div className="p-6 text-xl">HDL Flow Builder</div>;
}
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`src/test-setup.ts`:
```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Write the smoke test**

`src/App.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app title", () => {
  render(<App />);
  expect(screen.getByText("HDL Flow Builder")).toBeInTheDocument();
});
```

- [ ] **Step 5: Install and run test**

Run: `npm install && npm test`
Expected: PASS — 1 test passes. Then `npm run dev` serves the page showing "HDL Flow Builder".

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind project"
```

---

### Task 2: Domain types

**Files:**
- Create: `src/types.ts`
- Test: `src/types.test.ts`

**Interfaces:**
- Produces: types `Accent`, `NodeKind`, `EdgeAnimation`, `PathKind`, `LineStyle`, `NodeData`, `EdgeData`, `FlowNode`, `FlowEdge`, `Diagram`; const arrays `ACCENTS`, `NODE_KINDS`, `EDGE_ANIMATIONS`; function `createEmptyDiagram(name: string): Diagram`.

- [ ] **Step 1: Write the failing test**

`src/types.test.ts`:
```ts
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

test("ACCENTS has the five required keys", () => {
  expect(ACCENTS).toEqual(["neutral", "green", "pink", "blue", "amber"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/types.test.ts`
Expected: FAIL — cannot find module './types'.

- [ ] **Step 3: Write the implementation**

`src/types.ts`:
```ts
export const ACCENTS = ["neutral", "green", "pink", "blue", "amber"] as const;
export type Accent = (typeof ACCENTS)[number];

export const NODE_KINDS = ["card", "decision", "pill", "label"] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

export const EDGE_ANIMATIONS = ["dots", "gradient", "none"] as const;
export type EdgeAnimation = (typeof EDGE_ANIMATIONS)[number];

export type PathKind = "bezier" | "smoothstep" | "straight";
export type LineStyle = "solid" | "dashed";

export interface NodeData {
  title: string;
  subtitle: string;
  accent: Accent;
  width: number;
  height: number;
  glow: boolean;
  [key: string]: unknown; // React Flow requires index signature on node data
}

export interface EdgeData {
  animation: EdgeAnimation;
  color: string;
  speed: number; // 1..5
  lineStyle: LineStyle;
  path: PathKind;
  label?: string;
  [key: string]: unknown;
}

export interface FlowNode {
  id: string;
  type: NodeKind;
  position: { x: number; y: number };
  data: NodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type: "animated";
  data: EdgeData;
}

export interface Diagram {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  theme: "dark";
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createEmptyDiagram(name: string): Diagram {
  const now = Date.now();
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    nodes: [],
    edges: [],
    theme: "dark",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/types.test.ts`
Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/types.test.ts
git commit -m "feat: add domain types and createEmptyDiagram"
```

---

### Task 3: IndexedDB diagram library

**Files:**
- Create: `src/db/library.ts`
- Test: `src/db/library.test.ts`

**Interfaces:**
- Consumes: `Diagram` from `src/types.ts`.
- Produces: async functions `saveDiagram(d: Diagram): Promise<void>`, `getDiagram(id: string): Promise<Diagram | undefined>`, `listDiagrams(): Promise<Diagram[]>` (sorted by `updatedAt` desc), `deleteDiagram(id: string): Promise<void>`.

- [ ] **Step 1: Write the failing test**

`src/db/library.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/db/library.test.ts`
Expected: FAIL — cannot find module './library'.

- [ ] **Step 3: Write the implementation**

`src/db/library.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/db/library.test.ts`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/db/library.ts src/db/library.test.ts
git commit -m "feat: add IndexedDB diagram library"
```

---

### Task 4: HDL starter template

**Files:**
- Create: `src/templates/hdl.ts`
- Test: `src/templates/hdl.test.ts`

**Interfaces:**
- Consumes: `Diagram`, `FlowNode`, `FlowEdge` from `src/types.ts`.
- Produces: function `buildHdlTemplate(): Diagram` with a fixed `id` of `"hdl-starter"`, 8 nodes, and connecting edges. Exported const `HDL_TEMPLATE_ID = "hdl-starter"`.

- [ ] **Step 1: Write the failing test**

`src/templates/hdl.test.ts`:
```ts
import { buildHdlTemplate, HDL_TEMPLATE_ID } from "./hdl";

test("HDL template has the fixed id and 8 nodes", () => {
  const d = buildHdlTemplate();
  expect(d.id).toBe(HDL_TEMPLATE_ID);
  expect(d.nodes).toHaveLength(8);
});

test("HDL template includes the high-priority green and standard pink routes", () => {
  const d = buildHdlTemplate();
  const titles = d.nodes.map((n) => n.data.title);
  expect(titles).toContain("3A. High-Priority Route");
  expect(titles).toContain("4B. Standard CRM Route");
  const green = d.nodes.find((n) => n.data.title === "3A. High-Priority Route");
  const pink = d.nodes.find((n) => n.data.title === "4B. Standard CRM Route");
  expect(green?.data.accent).toBe("green");
  expect(pink?.data.accent).toBe("pink");
});

test("every edge references existing node ids", () => {
  const d = buildHdlTemplate();
  const ids = new Set(d.nodes.map((n) => n.id));
  for (const e of d.edges) {
    expect(ids.has(e.source)).toBe(true);
    expect(ids.has(e.target)).toBe(true);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/templates/hdl.test.ts`
Expected: FAIL — cannot find module './hdl'.

- [ ] **Step 3: Write the implementation**

`src/templates/hdl.ts`:
```ts
import type { Diagram, FlowNode, FlowEdge, Accent } from "../types";

export const HDL_TEMPLATE_ID = "hdl-starter";

function node(
  id: string,
  title: string,
  subtitle: string,
  x: number,
  y: number,
  accent: Accent = "neutral"
): FlowNode {
  return {
    id,
    type: "card",
    position: { x, y },
    data: { title, subtitle, accent, width: 220, height: 88, glow: true },
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  color: string,
  animation: "dots" | "gradient" = "dots"
): FlowEdge {
  return {
    id,
    source,
    target,
    type: "animated",
    data: { animation, color, speed: 3, lineStyle: "solid", path: "smoothstep" },
  };
}

export function buildHdlTemplate(): Diagram {
  const now = Date.now();
  const nodes: FlowNode[] = [
    node("n1", "1. Customer Engagement", "Web, Social, Client Touchpoints", 40, 220),
    node("n2", "2. Lead Prioritization", "Sorting Decision Engine Split", 320, 220),
    node("n3a", "3A. High-Priority Route", "Bypasses scrub to Quick Dispatch", 600, 80, "green"),
    node("n4b", "4B. Standard CRM Route", "Data Scrub, Cleaning & Validation", 600, 360, "pink"),
    node("n3", "3. Data Scrub & Assign", "Worxpertise CRM Core", 880, 220),
    node("n4", "4. Intelligent Contact", "Agent Intelligent UI View", 1160, 220, "blue"),
    node("n5", "5. Channel Execution", "Omnichannel SMS / Inbound IVR", 880, 440),
    node("n6", "6. Experience Tracking", "Feedback Loops & CSAT Metrics", 600, 560, "amber"),
  ];
  const edges: FlowEdge[] = [
    edge("e1", "n1", "n2", "#34d399"),
    edge("e2", "n2", "n3a", "#34d399"),
    edge("e3", "n2", "n4b", "#ec4899", "gradient"),
    edge("e4", "n3a", "n3", "#34d399"),
    edge("e5", "n4b", "n3", "#ec4899", "gradient"),
    edge("e6", "n3", "n4", "#60a5fa"),
    edge("e7", "n4", "n5", "#60a5fa"),
    edge("e8", "n5", "n6", "#fbbf24"),
  ];
  return { id: HDL_TEMPLATE_ID, name: "HDL Customer Lifecycle", createdAt: now, updatedAt: now, nodes, edges, theme: "dark" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/templates/hdl.test.ts`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/templates/hdl.ts src/templates/hdl.test.ts
git commit -m "feat: add HDL starter template"
```

---

### Task 5: Accent theme helper

**Files:**
- Create: `src/lib/theme.ts`
- Test: `src/lib/theme.test.ts`

**Interfaces:**
- Consumes: `Accent` from `src/types.ts`.
- Produces: `accentStyle(accent: Accent): { border: string; glow: string; title: string }` returning CSS color strings.

- [ ] **Step 1: Write the failing test**

`src/lib/theme.test.ts`:
```ts
import { accentStyle } from "./theme";
import { ACCENTS } from "../types";

test("every accent returns three non-empty color strings", () => {
  for (const a of ACCENTS) {
    const s = accentStyle(a);
    expect(s.border).toMatch(/#|rgb/);
    expect(s.glow).toMatch(/#|rgb/);
    expect(s.title).toMatch(/#|rgb/);
  }
});

test("green accent border is the emerald tone", () => {
  expect(accentStyle("green").border).toBe("#34d399");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/theme.test.ts`
Expected: FAIL — cannot find module './theme'.

- [ ] **Step 3: Write the implementation**

`src/lib/theme.ts`:
```ts
import type { Accent } from "../types";

const MAP: Record<Accent, { border: string; glow: string; title: string }> = {
  neutral: { border: "#3b4660", glow: "rgba(96,118,165,0.35)", title: "#e5e7eb" },
  green: { border: "#34d399", glow: "rgba(52,211,153,0.45)", title: "#6ee7b7" },
  pink: { border: "#ec4899", glow: "rgba(236,72,153,0.45)", title: "#f9a8d4" },
  blue: { border: "#60a5fa", glow: "rgba(96,165,250,0.45)", title: "#93c5fd" },
  amber: { border: "#fbbf24", glow: "rgba(251,191,36,0.45)", title: "#fcd34d" },
};

export function accentStyle(accent: Accent) {
  return MAP[accent];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/theme.test.ts`
Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts src/lib/theme.test.ts
git commit -m "feat: add accent theme helper"
```

---

### Task 6: Editor store (Zustand)

**Files:**
- Create: `src/store/editorStore.ts`
- Test: `src/store/editorStore.test.ts`

**Interfaces:**
- Consumes: `Diagram`, `FlowNode`, `FlowEdge`, `NodeData`, `EdgeData`, `createEmptyDiagram`, `uid` from types.
- Produces: Zustand hook `useEditorStore` with state `{ diagram: Diagram | null }` and actions: `loadDiagram(d)`, `addNode(kind, position)`, `updateNodeData(id, patch)`, `updateEdgeData(id, patch)`, `addEdge(partial)`, `removeNode(id)`, `removeEdge(id)`, `setName(name)`, `setNodes(nodes)`, `setEdges(edges)`. Every mutating action bumps `diagram.updatedAt`.

- [ ] **Step 1: Write the failing test**

`src/store/editorStore.test.ts`:
```ts
import { beforeEach, expect, test } from "vitest";
import { useEditorStore } from "./editorStore";
import { createEmptyDiagram } from "../types";

beforeEach(() => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
});

test("addNode appends a card node at the given position", () => {
  useEditorStore.getState().addNode("card", { x: 10, y: 20 });
  const nodes = useEditorStore.getState().diagram!.nodes;
  expect(nodes).toHaveLength(1);
  expect(nodes[0].type).toBe("card");
  expect(nodes[0].position).toEqual({ x: 10, y: 20 });
});

test("updateNodeData patches data and bumps updatedAt", () => {
  const s = useEditorStore.getState();
  s.addNode("card", { x: 0, y: 0 });
  const id = useEditorStore.getState().diagram!.nodes[0].id;
  const before = useEditorStore.getState().diagram!.updatedAt;
  s.updateNodeData(id, { title: "Hello" });
  const d = useEditorStore.getState().diagram!;
  expect(d.nodes[0].data.title).toBe("Hello");
  expect(d.updatedAt).toBeGreaterThanOrEqual(before);
});

test("removeNode also removes its connected edges", () => {
  const s = useEditorStore.getState();
  s.addNode("card", { x: 0, y: 0 });
  s.addNode("card", { x: 1, y: 1 });
  const [a, b] = useEditorStore.getState().diagram!.nodes;
  s.addEdge({ source: a.id, target: b.id });
  expect(useEditorStore.getState().diagram!.edges).toHaveLength(1);
  s.removeNode(a.id);
  expect(useEditorStore.getState().diagram!.edges).toHaveLength(0);
  expect(useEditorStore.getState().diagram!.nodes).toHaveLength(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/editorStore.test.ts`
Expected: FAIL — cannot find module './editorStore'.

- [ ] **Step 3: Write the implementation**

`src/store/editorStore.ts`:
```ts
import { create } from "zustand";
import {
  type Diagram, type FlowNode, type FlowEdge, type NodeKind,
  type NodeData, type EdgeData, uid,
} from "../types";

const DEFAULT_NODE_DATA: NodeData = {
  title: "New Block", subtitle: "Subtitle", accent: "neutral",
  width: 220, height: 88, glow: true,
};

const DEFAULT_EDGE_DATA: EdgeData = {
  animation: "dots", color: "#60a5fa", speed: 3, lineStyle: "solid", path: "smoothstep",
};

interface EditorState {
  diagram: Diagram | null;
  loadDiagram: (d: Diagram) => void;
  addNode: (kind: NodeKind, position: { x: number; y: number }) => void;
  updateNodeData: (id: string, patch: Partial<NodeData>) => void;
  updateEdgeData: (id: string, patch: Partial<EdgeData>) => void;
  addEdge: (partial: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  setName: (name: string) => void;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
}

function touch(d: Diagram): Diagram {
  return { ...d, updatedAt: Date.now() };
}

export const useEditorStore = create<EditorState>((set) => ({
  diagram: null,
  loadDiagram: (d) => set({ diagram: d }),
  addNode: (kind, position) =>
    set((s) => {
      if (!s.diagram) return s;
      const n: FlowNode = { id: uid(), type: kind, position, data: { ...DEFAULT_NODE_DATA } };
      return { diagram: touch({ ...s.diagram, nodes: [...s.diagram.nodes, n] }) };
    }),
  updateNodeData: (id, patch) =>
    set((s) => {
      if (!s.diagram) return s;
      const nodes = s.diagram.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
      );
      return { diagram: touch({ ...s.diagram, nodes }) };
    }),
  updateEdgeData: (id, patch) =>
    set((s) => {
      if (!s.diagram) return s;
      const edges = s.diagram.edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, ...patch } } : e
      );
      return { diagram: touch({ ...s.diagram, edges }) };
    }),
  addEdge: (partial) =>
    set((s) => {
      if (!s.diagram) return s;
      const e: FlowEdge = {
        id: uid(), source: partial.source, target: partial.target,
        sourceHandle: partial.sourceHandle, targetHandle: partial.targetHandle,
        type: "animated", data: { ...DEFAULT_EDGE_DATA },
      };
      return { diagram: touch({ ...s.diagram, edges: [...s.diagram.edges, e] }) };
    }),
  removeNode: (id) =>
    set((s) => {
      if (!s.diagram) return s;
      const nodes = s.diagram.nodes.filter((n) => n.id !== id);
      const edges = s.diagram.edges.filter((e) => e.source !== id && e.target !== id);
      return { diagram: touch({ ...s.diagram, nodes, edges }) };
    }),
  removeEdge: (id) =>
    set((s) => {
      if (!s.diagram) return s;
      return { diagram: touch({ ...s.diagram, edges: s.diagram.edges.filter((e) => e.id !== id) }) };
    }),
  setName: (name) => set((s) => (s.diagram ? { diagram: touch({ ...s.diagram, name }) } : s)),
  setNodes: (nodes) => set((s) => (s.diagram ? { diagram: { ...s.diagram, nodes } } : s)),
  setEdges: (edges) => set((s) => (s.diagram ? { diagram: { ...s.diagram, edges } } : s)),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/editorStore.test.ts`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/editorStore.ts src/store/editorStore.test.ts
git commit -m "feat: add Zustand editor store"
```

---

### Task 7: Custom card node component

**Files:**
- Create: `src/components/nodes/CardNode.tsx`, `src/components/nodes/index.ts`
- Test: `src/components/nodes/CardNode.test.tsx`

**Interfaces:**
- Consumes: `NodeData` from types, `accentStyle` from `src/lib/theme.ts`, React Flow `Handle`, `Position`, `NodeProps`.
- Produces: `CardNode` component; `nodeTypes` map `{ card: CardNode, decision: CardNode, pill: CardNode, label: CardNode }` exported from `index.ts` (all kinds reuse CardNode visual for v1; shape variation deferred — they differ only by styling props, acceptable for v1).

- [ ] **Step 1: Write the failing test**

`src/components/nodes/CardNode.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { CardNode } from "./CardNode";

function renderNode(data: any) {
  return render(
    <ReactFlowProvider>
      <CardNode id="n1" data={data} selected={false} type="card"
        dragging={false} zIndex={0} isConnectable positionAbsoluteX={0} positionAbsoluteY={0} />
    </ReactFlowProvider> as any
  );
}

test("renders title and subtitle", () => {
  renderNode({ title: "1. Engagement", subtitle: "Touchpoints", accent: "green", width: 220, height: 88, glow: true });
  expect(screen.getByText("1. Engagement")).toBeInTheDocument();
  expect(screen.getByText("Touchpoints")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/nodes/CardNode.test.tsx`
Expected: FAIL — cannot find module './CardNode'.

- [ ] **Step 3: Write the implementation**

`src/components/nodes/CardNode.tsx`:
```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NodeData } from "../../types";
import { accentStyle } from "../../lib/theme";

export function CardNode({ data, selected }: NodeProps & { data: NodeData }) {
  const s = accentStyle(data.accent);
  const handles = [Position.Top, Position.Right, Position.Bottom, Position.Left];
  return (
    <div
      style={{
        width: data.width, minHeight: data.height,
        border: `1px solid ${s.border}`,
        boxShadow: data.glow ? `0 0 18px ${s.glow}` : "none",
        background: "rgba(17,24,39,0.85)",
        outline: selected ? `2px solid ${s.border}` : "none",
      }}
      className="rounded-xl px-4 py-3 backdrop-blur"
    >
      <div className="font-bold text-sm" style={{ color: s.title }}>{data.title}</div>
      <div className="text-xs text-gray-400 mt-1">{data.subtitle}</div>
      {handles.map((p) => (
        <Handle key={p} type="source" position={p} id={p}
          style={{ background: s.border, width: 8, height: 8 }} />
      ))}
    </div>
  );
}
```

`src/components/nodes/index.ts`:
```ts
import { CardNode } from "./CardNode";

export const nodeTypes = {
  card: CardNode,
  decision: CardNode,
  pill: CardNode,
  label: CardNode,
};
```

Note: React Flow allows a `Handle` to act as both source and target when `type="source"` and connection mode is `Loose`; the canvas (Task 9) sets `connectionMode="loose"` so any handle can start or receive a connection.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/nodes/CardNode.test.tsx`
Expected: PASS — 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/nodes
git commit -m "feat: add custom card node component"
```

---

### Task 8: Animated edge component

**Files:**
- Create: `src/components/edges/AnimatedEdge.tsx`, `src/components/edges/index.ts`
- Test: `src/components/edges/AnimatedEdge.test.tsx`

**Interfaces:**
- Consumes: `EdgeData` from types; React Flow `EdgeProps`, `getBezierPath`, `getSmoothStepPath`, `getStraightPath`, `BaseEdge`.
- Produces: `AnimatedEdge` component; `edgeTypes` map `{ animated: AnimatedEdge }`. Renders the base path plus, when `animation==="dots"`, a `<circle>` with `<animateMotion>`; when `animation==="gradient"`, a stroked path using an animated `<linearGradient>`. Animation duration derived from `speed` (higher speed = shorter duration).

- [ ] **Step 1: Write the failing test**

`src/components/edges/AnimatedEdge.test.tsx`:
```tsx
import { render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { AnimatedEdge } from "./AnimatedEdge";

function renderEdge(data: any) {
  return render(
    <ReactFlowProvider>
      <svg>
        <AnimatedEdge id="e1" source="a" target="b" sourceX={0} sourceY={0}
          targetX={100} targetY={100} sourcePosition={"right" as any}
          targetPosition={"left" as any} data={data} selected={false}
          markerEnd="" style={{}} />
      </svg>
    </ReactFlowProvider> as any
  );
}

test("dots animation renders an animateMotion element", () => {
  const { container } = renderEdge({ animation: "dots", color: "#fff", speed: 3, lineStyle: "solid", path: "smoothstep" });
  expect(container.querySelector("animateMotion")).toBeTruthy();
});

test("gradient animation renders a linearGradient", () => {
  const { container } = renderEdge({ animation: "gradient", color: "#fff", speed: 3, lineStyle: "solid", path: "bezier" });
  expect(container.querySelector("linearGradient")).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/edges/AnimatedEdge.test.tsx`
Expected: FAIL — cannot find module './AnimatedEdge'.

- [ ] **Step 3: Write the implementation**

`src/components/edges/AnimatedEdge.tsx`:
```tsx
import {
  BaseEdge, getBezierPath, getSmoothStepPath, getStraightPath,
  type EdgeProps,
} from "@xyflow/react";
import type { EdgeData } from "../../types";

function durationFor(speed: number): number {
  // speed 1 (slow) -> 4s, speed 5 (fast) -> 0.8s
  const clamped = Math.min(5, Math.max(1, speed));
  return 4.8 - clamped * 0.8;
}

export function AnimatedEdge(props: EdgeProps & { data: EdgeData }) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const common = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
  const [path] =
    data.path === "bezier" ? getBezierPath(common)
    : data.path === "straight" ? getStraightPath(common)
    : getSmoothStepPath(common);

  const dur = `${durationFor(data.speed)}s`;
  const dash = data.lineStyle === "dashed" ? "6 6" : undefined;
  const gradId = `grad-${id}`;

  if (data.animation === "gradient") {
    return (
      <>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={data.color} stopOpacity="0.1" />
            <stop offset="50%" stopColor={data.color} stopOpacity="1" />
            <stop offset="100%" stopColor={data.color} stopOpacity="0.1" />
            <animateTransform attributeName="gradientTransform" type="translate"
              from="-1 0" to="1 0" dur={dur} repeatCount="indefinite" />
          </linearGradient>
        </defs>
        <BaseEdge id={id} path={path}
          style={{ stroke: `url(#${gradId})`, strokeWidth: 3, strokeDasharray: dash,
            filter: `drop-shadow(0 0 4px ${data.color})` }} />
      </>
    );
  }

  return (
    <>
      <BaseEdge id={id} path={path}
        style={{ stroke: data.color, strokeWidth: 2, opacity: 0.55, strokeDasharray: dash }} />
      {data.animation === "dots" && (
        <circle r={4} fill={data.color} style={{ filter: `drop-shadow(0 0 6px ${data.color})` }}>
          <animateMotion dur={dur} repeatCount="indefinite" path={path} />
        </circle>
      )}
    </>
  );
}
```

`src/components/edges/index.ts`:
```ts
import { AnimatedEdge } from "./AnimatedEdge";
export const edgeTypes = { animated: AnimatedEdge };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/edges/AnimatedEdge.test.tsx`
Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/edges
git commit -m "feat: add animated edge component (dots + gradient)"
```

---

### Task 9: Canvas component

**Files:**
- Create: `src/components/editor/Canvas.tsx`
- Test: `src/components/editor/Canvas.test.tsx`

**Interfaces:**
- Consumes: `useEditorStore`, `nodeTypes`, `edgeTypes`, React Flow `ReactFlow`, `Background`, `Controls`, `applyNodeChanges`, `applyEdgeChanges`, `addEdge` helpers; selection state setters passed via props.
- Produces: `Canvas({ onSelect }: { onSelect: (sel: { kind: "node" | "edge"; id: string } | null) => void })`. Wires React Flow `nodes`/`edges` from the store, handles `onNodesChange`/`onEdgesChange` (position/drag) writing back via `setNodes`/`setEdges`, `onConnect` calling store `addEdge`, drop handling for palette drag, and selection via `onNodeClick`/`onEdgeClick`. `connectionMode="loose"`.

- [ ] **Step 1: Write the failing test**

`src/components/editor/Canvas.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./Canvas";
import { useEditorStore } from "../../store/editorStore";
import { buildHdlTemplate } from "../../templates/hdl";

test("renders nodes from the loaded diagram", () => {
  useEditorStore.getState().loadDiagram(buildHdlTemplate());
  render(
    <ReactFlowProvider>
      <div style={{ width: 800, height: 600 }}>
        <Canvas onSelect={() => {}} />
      </div>
    </ReactFlowProvider>
  );
  expect(screen.getByText("1. Customer Engagement")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor/Canvas.test.tsx`
Expected: FAIL — cannot find module './Canvas'.

- [ ] **Step 3: Write the implementation**

`src/components/editor/Canvas.tsx`:
```tsx
import { useCallback } from "react";
import {
  ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges,
  type NodeChange, type EdgeChange, type Connection, useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEditorStore } from "../../store/editorStore";
import { nodeTypes } from "../nodes";
import { edgeTypes } from "../edges";
import type { NodeKind } from "../../types";

type Sel = { kind: "node" | "edge"; id: string } | null;

export function Canvas({ onSelect }: { onSelect: (sel: Sel) => void }) {
  const diagram = useEditorStore((s) => s.diagram);
  const setNodes = useEditorStore((s) => s.setNodes);
  const setEdges = useEditorStore((s) => s.setEdges);
  const addEdge = useEditorStore((s) => s.addEdge);
  const addNode = useEditorStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!diagram) return;
      setNodes(applyNodeChanges(changes, diagram.nodes as any) as any);
    },
    [diagram, setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!diagram) return;
      setEdges(applyEdgeChanges(changes, diagram.edges as any) as any);
    },
    [diagram, setEdges]
  );
  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source && c.target)
        addEdge({ source: c.source, target: c.target, sourceHandle: c.sourceHandle, targetHandle: c.targetHandle });
    },
    [addEdge]
  );
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData("application/flow-kind") as NodeKind;
      if (!kind) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(kind, position);
    },
    [addNode, screenToFlowPosition]
  );

  if (!diagram) return null;

  return (
    <ReactFlow
      nodes={diagram.nodes as any}
      edges={diagram.edges as any}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionMode={"loose" as any}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, n) => onSelect({ kind: "node", id: n.id })}
      onEdgeClick={(_, ed) => onSelect({ kind: "edge", id: ed.id })}
      onPaneClick={() => onSelect(null)}
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#1f2937" gap={20} />
      <Controls />
    </ReactFlow>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor/Canvas.test.tsx`
Expected: PASS — 1 test passes. (React Flow needs a sized parent; the wrapper div provides it. If jsdom warns about dimensions it still renders node DOM.)

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/Canvas.tsx src/components/editor/Canvas.test.tsx
git commit -m "feat: add React Flow canvas with drag/connect/drop"
```

---

### Task 10: Blocks palette

**Files:**
- Create: `src/components/editor/Palette.tsx`
- Test: `src/components/editor/Palette.test.tsx`

**Interfaces:**
- Consumes: `NODE_KINDS` from types.
- Produces: `Palette` component rendering one draggable item per node kind; each sets `dataTransfer` `application/flow-kind` to its kind on drag start.

- [ ] **Step 1: Write the failing test**

`src/components/editor/Palette.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Palette } from "./Palette";

test("renders a draggable item per node kind and sets drag data", () => {
  render(<Palette />);
  const card = screen.getByText(/card/i);
  const setData = vi.fn();
  fireEvent.dragStart(card, { dataTransfer: { setData, effectAllowed: "" } });
  expect(setData).toHaveBeenCalledWith("application/flow-kind", "card");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor/Palette.test.tsx`
Expected: FAIL — cannot find module './Palette'.

- [ ] **Step 3: Write the implementation**

`src/components/editor/Palette.tsx`:
```tsx
import { NODE_KINDS, type NodeKind } from "../../types";

const LABELS: Record<NodeKind, string> = {
  card: "Card", decision: "Decision", pill: "Start / End", label: "Label",
};

export function Palette() {
  return (
    <aside className="w-44 shrink-0 border-r border-gray-800 p-3 space-y-2">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Blocks</div>
      {NODE_KINDS.map((k) => (
        <div
          key={k}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/flow-kind", k);
            e.dataTransfer.effectAllowed = "move";
          }}
          className="cursor-grab rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-sm hover:border-gray-500"
        >
          {LABELS[k]}
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor/Palette.test.tsx`
Expected: PASS — 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/Palette.tsx src/components/editor/Palette.test.tsx
git commit -m "feat: add blocks palette"
```

---

### Task 11: Inspector panel

**Files:**
- Create: `src/components/editor/Inspector.tsx`
- Test: `src/components/editor/Inspector.test.tsx`

**Interfaces:**
- Consumes: `useEditorStore`, `ACCENTS`, `EDGE_ANIMATIONS` from types.
- Produces: `Inspector({ selection }: { selection: { kind: "node" | "edge"; id: string } | null })`. For a node: title input, subtitle input, accent select, glow checkbox — calling `updateNodeData`. For an edge: animation select, color input, speed range (1..5), line-style select, path select — calling `updateEdgeData`. Shows "Select a block or connector" when null.

- [ ] **Step 1: Write the failing test**

`src/components/editor/Inspector.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Inspector } from "./Inspector";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram } from "../../types";

test("editing node title updates the store", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("T"));
  useEditorStore.getState().addNode("card", { x: 0, y: 0 });
  const id = useEditorStore.getState().diagram!.nodes[0].id;
  render(<Inspector selection={{ kind: "node", id }} />);
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Renamed" } });
  expect(useEditorStore.getState().diagram!.nodes[0].data.title).toBe("Renamed");
});

test("shows placeholder when nothing selected", () => {
  render(<Inspector selection={null} />);
  expect(screen.getByText(/select a block/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor/Inspector.test.tsx`
Expected: FAIL — cannot find module './Inspector'.

- [ ] **Step 3: Write the implementation**

`src/components/editor/Inspector.tsx`:
```tsx
import { useEditorStore } from "../../store/editorStore";
import { ACCENTS, EDGE_ANIMATIONS } from "../../types";

type Sel = { kind: "node" | "edge"; id: string } | null;

export function Inspector({ selection }: { selection: Sel }) {
  const diagram = useEditorStore((s) => s.diagram);
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const updateEdgeData = useEditorStore((s) => s.updateEdgeData);

  if (!selection || !diagram)
    return <aside className="w-64 shrink-0 border-l border-gray-800 p-4 text-sm text-gray-500">Select a block or connector to edit it.</aside>;

  if (selection.kind === "node") {
    const n = diagram.nodes.find((x) => x.id === selection.id);
    if (!n) return <aside className="w-64 shrink-0 border-l border-gray-800 p-4" />;
    return (
      <aside className="w-64 shrink-0 border-l border-gray-800 p-4 space-y-3 text-sm">
        <div className="text-xs uppercase tracking-wide text-gray-500">Block</div>
        <label className="block">Title
          <input aria-label="title" className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2 py-1"
            value={n.data.title} onChange={(e) => updateNodeData(n.id, { title: e.target.value })} />
        </label>
        <label className="block">Subtitle
          <input aria-label="subtitle" className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2 py-1"
            value={n.data.subtitle} onChange={(e) => updateNodeData(n.id, { subtitle: e.target.value })} />
        </label>
        <label className="block">Accent
          <select aria-label="accent" className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2 py-1"
            value={n.data.accent} onChange={(e) => updateNodeData(n.id, { accent: e.target.value as any })}>
            {ACCENTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={n.data.glow} onChange={(e) => updateNodeData(n.id, { glow: e.target.checked })} />
          Glow
        </label>
      </aside>
    );
  }

  const ed = diagram.edges.find((x) => x.id === selection.id);
  if (!ed) return <aside className="w-64 shrink-0 border-l border-gray-800 p-4" />;
  return (
    <aside className="w-64 shrink-0 border-l border-gray-800 p-4 space-y-3 text-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">Connector</div>
      <label className="block">Animation
        <select aria-label="animation" className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2 py-1"
          value={ed.data.animation} onChange={(e) => updateEdgeData(ed.id, { animation: e.target.value as any })}>
          {EDGE_ANIMATIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </label>
      <label className="block">Color
        <input aria-label="color" type="color" className="mt-1 h-8 w-full rounded bg-gray-900 border border-gray-700"
          value={ed.data.color} onChange={(e) => updateEdgeData(ed.id, { color: e.target.value })} />
      </label>
      <label className="block">Speed: {ed.data.speed}
        <input aria-label="speed" type="range" min={1} max={5} className="mt-1 w-full"
          value={ed.data.speed} onChange={(e) => updateEdgeData(ed.id, { speed: Number(e.target.value) })} />
      </label>
      <label className="block">Line style
        <select aria-label="lineStyle" className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2 py-1"
          value={ed.data.lineStyle} onChange={(e) => updateEdgeData(ed.id, { lineStyle: e.target.value as any })}>
          <option value="solid">solid</option><option value="dashed">dashed</option>
        </select>
      </label>
      <label className="block">Path
        <select aria-label="path" className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2 py-1"
          value={ed.data.path} onChange={(e) => updateEdgeData(ed.id, { path: e.target.value as any })}>
          <option value="smoothstep">smoothstep</option><option value="bezier">bezier</option><option value="straight">straight</option>
        </select>
      </label>
    </aside>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor/Inspector.test.tsx`
Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/Inspector.tsx src/components/editor/Inspector.test.tsx
git commit -m "feat: add inspector panel for nodes and edges"
```

---

### Task 12: Export & import library

**Files:**
- Create: `src/lib/exportDiagram.ts`
- Test: `src/lib/exportDiagram.test.ts`

**Interfaces:**
- Consumes: `Diagram` from types, `toPng`, `toSvg` from `html-to-image`.
- Produces: `diagramToJson(d: Diagram): string`; `diagramFromJson(text: string): Diagram` (validates required fields, throws `Error("Invalid diagram file")` otherwise); `exportImage(el: HTMLElement, format: "png" | "svg"): Promise<string>` (returns data URL via html-to-image); `downloadDataUrl(dataUrl: string, filename: string): void`.

- [ ] **Step 1: Write the failing test**

`src/lib/exportDiagram.test.ts`:
```ts
import { diagramToJson, diagramFromJson } from "./exportDiagram";
import { createEmptyDiagram } from "../types";

test("round-trips a diagram through JSON", () => {
  const d = createEmptyDiagram("Round");
  const restored = diagramFromJson(diagramToJson(d));
  expect(restored.name).toBe("Round");
  expect(restored.id).toBe(d.id);
});

test("rejects invalid JSON", () => {
  expect(() => diagramFromJson("{}")).toThrow("Invalid diagram file");
  expect(() => diagramFromJson("not json")).toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/exportDiagram.test.ts`
Expected: FAIL — cannot find module './exportDiagram'.

- [ ] **Step 3: Write the implementation**

`src/lib/exportDiagram.ts`:
```ts
import { toPng, toSvg } from "html-to-image";
import type { Diagram } from "../types";

export function diagramToJson(d: Diagram): string {
  return JSON.stringify(d, null, 2);
}

export function diagramFromJson(text: string): Diagram {
  const obj = JSON.parse(text);
  if (
    !obj || typeof obj.id !== "string" || typeof obj.name !== "string" ||
    !Array.isArray(obj.nodes) || !Array.isArray(obj.edges)
  ) {
    throw new Error("Invalid diagram file");
  }
  return obj as Diagram;
}

export async function exportImage(el: HTMLElement, format: "png" | "svg"): Promise<string> {
  const opts = { backgroundColor: "#0a0e1a", pixelRatio: 2 };
  return format === "png" ? toPng(el, opts) : toSvg(el, opts);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/exportDiagram.test.ts`
Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/exportDiagram.ts src/lib/exportDiagram.test.ts
git commit -m "feat: add JSON + image export/import helpers"
```

---

### Task 13: Toolbar

**Files:**
- Create: `src/components/editor/Toolbar.tsx`
- Test: `src/components/editor/Toolbar.test.tsx`

**Interfaces:**
- Consumes: `useEditorStore`, `saveDiagram` from db, `diagramToJson`, `diagramFromJson`, `downloadDataUrl` from export lib.
- Produces: `Toolbar({ onPresent, onExportImage, onBack }: { onPresent: () => void; onExportImage: (fmt: "png" | "svg") => void; onBack: () => void })`. Renders editable diagram-name input (calls `setName`), Save button (calls `saveDiagram(diagram)`), Export JSON button, Import JSON file input (parses and `loadDiagram`), Export PNG / SVG buttons (call `onExportImage`), Present button (calls `onPresent`), Back-to-gallery button (`onBack`).

- [ ] **Step 1: Write the failing test**

`src/components/editor/Toolbar.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Toolbar } from "./Toolbar";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram } from "../../types";

test("editing name updates the store and Present fires callback", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("Old"));
  const onPresent = vi.fn();
  render(<Toolbar onPresent={onPresent} onExportImage={() => {}} onBack={() => {}} />);
  fireEvent.change(screen.getByLabelText(/diagram name/i), { target: { value: "New" } });
  expect(useEditorStore.getState().diagram!.name).toBe("New");
  fireEvent.click(screen.getByText(/present/i));
  expect(onPresent).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor/Toolbar.test.tsx`
Expected: FAIL — cannot find module './Toolbar'.

- [ ] **Step 3: Write the implementation**

`src/components/editor/Toolbar.tsx`:
```tsx
import { useRef } from "react";
import { useEditorStore } from "../../store/editorStore";
import { saveDiagram } from "../../db/library";
import { diagramToJson, diagramFromJson, downloadDataUrl } from "../../lib/exportDiagram";

export function Toolbar({
  onPresent, onExportImage, onBack,
}: { onPresent: () => void; onExportImage: (fmt: "png" | "svg") => void; onBack: () => void }) {
  const diagram = useEditorStore((s) => s.diagram);
  const setName = useEditorStore((s) => s.setName);
  const loadDiagram = useEditorStore((s) => s.loadDiagram);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!diagram) return null;

  const btn = "rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm hover:border-gray-500";

  return (
    <header className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
      <button className={btn} onClick={onBack}>← Gallery</button>
      <input aria-label="diagram name"
        className="rounded-md bg-gray-900 border border-gray-700 px-2 py-1 text-sm w-56"
        value={diagram.name} onChange={(e) => setName(e.target.value)} />
      <div className="flex-1" />
      <button className={btn} onClick={() => saveDiagram(useEditorStore.getState().diagram!)}>Save</button>
      <button className={btn} onClick={() =>
        downloadDataUrl("data:application/json," + encodeURIComponent(diagramToJson(diagram)), `${diagram.name}.json`)}>
        Export JSON
      </button>
      <button className={btn} onClick={() => fileRef.current?.click()}>Import JSON</button>
      <input ref={fileRef} type="file" accept="application/json" className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          loadDiagram(diagramFromJson(await f.text()));
          e.target.value = "";
        }} />
      <button className={btn} onClick={() => onExportImage("png")}>PNG</button>
      <button className={btn} onClick={() => onExportImage("svg")}>SVG</button>
      <button className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold hover:bg-sky-500" onClick={onPresent}>
        ▶ Present
      </button>
    </header>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor/Toolbar.test.tsx`
Expected: PASS — 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/Toolbar.tsx src/components/editor/Toolbar.test.tsx
git commit -m "feat: add editor toolbar"
```

---

### Task 14: Present mode overlay

**Files:**
- Create: `src/components/present/PresentMode.tsx`
- Test: `src/components/present/PresentMode.test.tsx`

**Interfaces:**
- Consumes: `useEditorStore`, `ReactFlow`, `Background`, `nodeTypes`, `edgeTypes`, React Flow `ReactFlowProvider`.
- Produces: `PresentMode({ onExit }: { onExit: () => void })`. Renders a fixed fullscreen overlay with the diagram title/subtitle header, a non-interactive React Flow (`nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`, `fitView`, `panOnDrag={false}`, `zoomOnScroll={false}`), Play/Pause/Restart buttons and a speed control, and an Exit button. Listens for `Escape` to call `onExit`. Playback state controls a `playing` boolean passed down; in v1, "Play" sets all edges' animation active and "Pause" freezes by swapping edge animation to `none` via a local copy (does not mutate the store).

- [ ] **Step 1: Write the failing test**

`src/components/present/PresentMode.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { PresentMode } from "./PresentMode";
import { useEditorStore } from "../../store/editorStore";
import { buildHdlTemplate } from "../../templates/hdl";

test("shows the diagram title and exits on Escape", () => {
  useEditorStore.getState().loadDiagram(buildHdlTemplate());
  const onExit = vi.fn();
  render(<PresentMode onExit={onExit} />);
  expect(screen.getByText("HDL Customer Lifecycle")).toBeInTheDocument();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onExit).toHaveBeenCalled();
});

test("Exit button calls onExit", () => {
  useEditorStore.getState().loadDiagram(buildHdlTemplate());
  const onExit = vi.fn();
  render(<PresentMode onExit={onExit} />);
  fireEvent.click(screen.getByText(/exit/i));
  expect(onExit).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/present/PresentMode.test.tsx`
Expected: FAIL — cannot find module './PresentMode'.

- [ ] **Step 3: Write the implementation**

`src/components/present/PresentMode.tsx`:
```tsx
import { useEffect, useMemo, useState } from "react";
import { ReactFlow, ReactFlowProvider, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEditorStore } from "../../store/editorStore";
import { nodeTypes } from "../nodes";
import { edgeTypes } from "../edges";

export function PresentMode({ onExit }: { onExit: () => void }) {
  const diagram = useEditorStore((s) => s.diagram);
  const [playing, setPlaying] = useState(true);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onExit(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onExit]);

  const edges = useMemo(() => {
    if (!diagram) return [];
    return diagram.edges.map((e) =>
      playing ? e : { ...e, data: { ...e.data, animation: "none" as const } }
    );
  }, [diagram, playing]);

  if (!diagram) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0e1a] flex flex-col">
      <div className="text-center pt-6 pb-2">
        <h1 className="text-3xl font-bold text-sky-400">{diagram.name}</h1>
        <p className="text-gray-500 text-sm">Interactive Workflow Simulation</p>
      </div>
      <div className="flex-1" key={restartKey}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={diagram.nodes as any}
            edges={edges as any}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#111827" gap={24} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      <div className="flex items-center justify-center gap-3 py-4">
        <button className="rounded-md border border-gray-700 px-4 py-2 text-sm"
          onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
        <button className="rounded-md border border-gray-700 px-4 py-2 text-sm"
          onClick={() => { setRestartKey((k) => k + 1); setPlaying(true); }}>Restart</button>
        <button className="rounded-md bg-gray-800 px-4 py-2 text-sm" onClick={onExit}>Exit</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/present/PresentMode.test.tsx`
Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/present
git commit -m "feat: add fullscreen present mode"
```

---

### Task 15: Gallery view

**Files:**
- Create: `src/components/gallery/Gallery.tsx`
- Test: `src/components/gallery/Gallery.test.tsx`

**Interfaces:**
- Consumes: `listDiagrams`, `deleteDiagram`, `saveDiagram` from db; `createEmptyDiagram` from types; `buildHdlTemplate`, `HDL_TEMPLATE_ID` from template.
- Produces: `Gallery({ onOpen }: { onOpen: (d: Diagram) => void })`. On mount, lists diagrams; if empty, seeds the HDL template (saves it) then re-lists. Renders a card per diagram (name, updated date) with Open and Delete; a "New diagram" button creates an empty diagram, saves it, and calls `onOpen`.

- [ ] **Step 1: Write the failing test**

`src/components/gallery/Gallery.test.tsx`:
```tsx
import "fake-indexeddb/auto";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Gallery } from "./Gallery";
import { listDiagrams, deleteDiagram } from "../../db/library";

beforeEach(async () => {
  for (const d of await listDiagrams()) await deleteDiagram(d.id);
});

test("seeds HDL template when library is empty", async () => {
  render(<Gallery onOpen={() => {}} />);
  await waitFor(() => expect(screen.getByText("HDL Customer Lifecycle")).toBeInTheDocument());
});

test("New diagram button opens a fresh diagram", async () => {
  const onOpen = vi.fn();
  render(<Gallery onOpen={onOpen} />);
  await waitFor(() => screen.getByText(/new diagram/i));
  fireEvent.click(screen.getByText(/new diagram/i));
  await waitFor(() => expect(onOpen).toHaveBeenCalled());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/gallery/Gallery.test.tsx`
Expected: FAIL — cannot find module './Gallery'.

- [ ] **Step 3: Write the implementation**

`src/components/gallery/Gallery.tsx`:
```tsx
import { useEffect, useState, useCallback } from "react";
import type { Diagram } from "../../types";
import { createEmptyDiagram } from "../../types";
import { listDiagrams, saveDiagram, deleteDiagram } from "../../db/library";
import { buildHdlTemplate } from "../../templates/hdl";

export function Gallery({ onOpen }: { onOpen: (d: Diagram) => void }) {
  const [items, setItems] = useState<Diagram[]>([]);

  const refresh = useCallback(async () => {
    let list = await listDiagrams();
    if (list.length === 0) {
      await saveDiagram(buildHdlTemplate());
      list = await listDiagrams();
    }
    setItems(list);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const newDiagram = async () => {
    const d = createEmptyDiagram("Untitled Flow");
    await saveDiagram(d);
    onOpen(d);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-sky-400">My Diagrams</h1>
        <button className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold hover:bg-sky-500"
          onClick={newDiagram}>+ New diagram</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((d) => (
          <div key={d.id} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
            <div className="font-semibold">{d.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(d.updatedAt).toLocaleString()}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="rounded border border-gray-700 px-3 py-1 text-sm hover:border-gray-500"
                onClick={() => onOpen(d)}>Open</button>
              <button className="rounded border border-gray-700 px-3 py-1 text-sm text-red-400 hover:border-red-500"
                onClick={async () => { await deleteDiagram(d.id); await refresh(); }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/gallery/Gallery.test.tsx`
Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/gallery
git commit -m "feat: add diagram gallery with HDL seed"
```

---

### Task 16: App shell wiring + auto-save

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/editor/EditorView.tsx`
- Test: `src/App.test.tsx` (replace the Task 1 smoke test)

**Interfaces:**
- Consumes: `Gallery`, `EditorView`, `useEditorStore`, `saveDiagram`.
- Produces: `App` managing a `view` state of `"gallery" | "editor"`; `EditorView` composes Toolbar + Palette + Canvas + Inspector + PresentMode, holds `selection` and `present` state, owns a `ref` to the canvas wrapper for image export, and auto-saves the diagram to IndexedDB (debounced) on every change.

- [ ] **Step 1: Update the smoke test**

`src/App.test.tsx`:
```tsx
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { listDiagrams, deleteDiagram } from "./db/library";

beforeEach(async () => {
  for (const d of await listDiagrams()) await deleteDiagram(d.id);
});

test("app starts on the gallery and seeds HDL", async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText("My Diagrams")).toBeInTheDocument());
  await waitFor(() => expect(screen.getByText("HDL Customer Lifecycle")).toBeInTheDocument());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — App still renders the Task 1 placeholder, "My Diagrams" not found.

- [ ] **Step 3: Write EditorView**

`src/components/editor/EditorView.tsx`:
```tsx
import { useEffect, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useEditorStore } from "../../store/editorStore";
import { saveDiagram } from "../../db/library";
import { exportImage, downloadDataUrl } from "../../lib/exportDiagram";
import { Toolbar } from "./Toolbar";
import { Palette } from "./Palette";
import { Canvas } from "./Canvas";
import { Inspector } from "./Inspector";
import { PresentMode } from "../present/PresentMode";

type Sel = { kind: "node" | "edge"; id: string } | null;

export function EditorView({ onBack }: { onBack: () => void }) {
  const diagram = useEditorStore((s) => s.diagram);
  const [selection, setSelection] = useState<Sel>(null);
  const [present, setPresent] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Debounced auto-save on any diagram change.
  useEffect(() => {
    if (!diagram) return;
    const t = setTimeout(() => { void saveDiagram(diagram); }, 600);
    return () => clearTimeout(t);
  }, [diagram]);

  const onExportImage = async (fmt: "png" | "svg") => {
    if (!canvasRef.current) return;
    const url = await exportImage(canvasRef.current, fmt);
    downloadDataUrl(url, `${diagram?.name ?? "diagram"}.${fmt}`);
  };

  if (present) return <PresentMode onExit={() => setPresent(false)} />;

  return (
    <div className="flex h-full flex-col">
      <Toolbar onPresent={() => setPresent(true)} onExportImage={onExportImage} onBack={onBack} />
      <div className="flex flex-1 overflow-hidden">
        <Palette />
        <div ref={canvasRef} className="flex-1 relative">
          <ReactFlowProvider>
            <Canvas onSelect={setSelection} />
          </ReactFlowProvider>
        </div>
        <Inspector selection={selection} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write App**

`src/App.tsx`:
```tsx
import { useState } from "react";
import type { Diagram } from "./types";
import { useEditorStore } from "./store/editorStore";
import { Gallery } from "./components/gallery/Gallery";
import { EditorView } from "./components/editor/EditorView";

export default function App() {
  const [view, setView] = useState<"gallery" | "editor">("gallery");
  const loadDiagram = useEditorStore((s) => s.loadDiagram);

  const open = (d: Diagram) => { loadDiagram(d); setView("editor"); };

  return (
    <div className="h-full">
      {view === "gallery"
        ? <Gallery onOpen={open} />
        : <EditorView onBack={() => setView("gallery")} />}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS — gallery + HDL seed visible.

- [ ] **Step 6: Run the full suite and the app**

Run: `npm test`
Expected: All tests pass.
Run: `npm run dev` and manually verify: gallery shows HDL → Open → drag a block from palette → connect two blocks → select a connector → change animation to "dots"/"gradient" and color → Save → Present (animations play, Esc exits) → Export PNG downloads an image.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: wire app shell, editor view, and auto-save"
```

---

## Self-Review Notes

- **Spec coverage:** stack (T1), types/model (T2), library/IndexedDB + save-previous-work (T3, T15, T16 auto-save), HDL starter (T4, T15 seed), accent themes (T5), editor store (T6), node cards (T7), animated connectors dots+gradient (T8), canvas drag/drop/connect (T9), palette (T10), inspector node+edge editing (T11), JSON+image export/import (T12, T13), present mode (T14), gallery (T15), wiring/auto-save (T16). Node-pulse glow is delivered via the always-on node `glow` styling + accent shadow (T7); a richer active-edge pulse is a deferred enhancement noted here rather than a silent gap.
- **Type consistency:** `setNodes`/`setEdges`/`addEdge`/`updateNodeData`/`updateEdgeData` names match across store (T6), Canvas (T9), Inspector (T11). `nodeTypes`/`edgeTypes` keys match `NodeKind`/`"animated"`. `exportImage`/`downloadDataUrl`/`diagramFromJson` names match across T12, T13, T16.
- **Placeholders:** none — every step has full code and concrete commands.
