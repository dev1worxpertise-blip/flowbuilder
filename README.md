# Animated Flowchart Builder

An offline, presentation-ready flowchart builder with **animated connectors** — like draw.io, but with a polished dark theme and motion designed for showing workflows to customers. Ships with the **HDL Customer Lifecycle** preloaded as an editable template.

![Build](https://img.shields.io/badge/tests-55%20passing-brightgreen) ![Vite](https://img.shields.io/badge/Vite-React%20%2B%20TS-646cff)

## Features

- **Drag-and-drop builder** — drag blocks from the palette onto an infinite canvas, connect them, pan & zoom.
- **16 block types** — Card, Decision (diamond), Start/End (pill), Label, plus 12 standard flowchart shapes: Process, Input/Output, Database, Document, Multi-document, Predefined Process, Preparation, Connector, Manual Input, Delay, Manual Operation, Off-page. Each shows a matching icon in the palette.
- **Animated connectors** — flowing dots or moving gradient, with per-edge colour, speed, line style, and path type.
- **Per-block styling** — accent colours, glow, resize (W×H), and an optional emoji / image / **Iconify** icon on cards.
- **Saved-diagram library** — diagrams persist in the browser (IndexedDB); auto-saves as you edit.
- **Present mode** — fullscreen animated "simulation" view with Play / Pause / Restart, controls top-right.
- **Export / import** — JSON (round-trips a diagram), plus clean **PNG / SVG** export (editor chrome excluded).
- **Fully offline** — no backend. (The only runtime network call is fetching Iconify icons on demand.)

## Tech stack

Vite · React 18 · TypeScript · [React Flow (@xyflow/react)](https://reactflow.dev) · Tailwind CSS · Framer Motion · Zustand · IndexedDB (`idb`) · `html-to-image` · `@iconify/react`. Tests: Vitest + Testing Library.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm test         # run the test suite
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Deploy

It's a static SPA, so any static host works. On **Vercel**: import this repo at [vercel.com/new](https://vercel.com/new) — the Vite preset is auto-detected (build `npm run build`, output `dist`). No environment variables required.

## Project structure

```
src/
  components/
    gallery/    # saved-diagram library (landing page)
    editor/     # canvas, palette, inspector, toolbar
    nodes/      # node components + SVG shape geometry + palette icons
    edges/      # animated edge component
    present/    # fullscreen present mode
  store/        # Zustand editor state
  db/           # IndexedDB diagram library
  lib/          # export/import + theme helpers
  templates/    # HDL Customer Lifecycle starter
  types.ts      # domain model
docs/superpowers/  # design spec + implementation plan
```

## License

Private project — all rights reserved.
