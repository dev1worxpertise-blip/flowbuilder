# HDL Flow Builder — Design

**Date:** 2026-06-20
**Status:** Approved (pending written-spec review)

## 1. Purpose

A web-based, drag-and-drop flowchart builder for creating **dynamic, animated, presentation-ready** workflow diagrams — conceptually like draw.io, but with a polished dark "glowing card" aesthetic and animated connectors, suitable for presenting to customers.

The app opens with the **HDL Customer Lifecycle** workflow preloaded as an editable starter template (derived from `HDL Customer LifeCycle Workflow.xlsx`).

Reference look & feel: the two HDL Customer Lifecycle mockups provided (branching decision view + "Start Video Simulation" view) — dark cinematic background, numbered glassy cards with title + subtitle, accent colors (green high-priority, pink standard route), and glowing flowing connectors.

## 2. Scope (v1)

In scope:
- Full builder: drag/drop blocks, connect them, edit properties.
- Per-connector animation (flowing dots, gradient flow) + node pulse/glow.
- Library of saved diagrams (multiple, reusable, never lost).
- Present/fullscreen animated playback mode.
- Export: PNG, SVG, JSON; import JSON.
- HDL starter template preloaded.

Out of scope (v1):
- Cloud accounts / backend / login / share-by-link.
- True video-file (.mp4) export. Present mode is the live "video"; screen-recording is a manual follow-up.
- Real-time multi-user collaboration.

## 3. Tech Stack

Pure offline frontend SPA — no backend.

- **Vite + React + TypeScript** — app shell and build. Runs via `npm run dev`; `npm run build` produces static files that open/host anywhere.
- **React Flow (@xyflow/react)** — canvas: pan, zoom, drag, drop, connection handles, custom nodes, custom animated edges.
- **Tailwind CSS** — dark glassy theme.
- **Framer Motion** + SVG (`animateMotion`) — connector and node animations.
- **Zustand** — in-memory diagram/editor state.
- **IndexedDB** (via a thin wrapper, e.g. `idb`) — persistent diagram library + thumbnails.
- **html-to-image** — PNG/SVG export of the canvas.

Rationale: React Flow is purpose-built for node-based editors and gives draw.io-style editing for free, while custom node/edge components deliver the exact glowing aesthetic and independent per-edge animation. Alternatives considered and rejected: raw canvas/Konva (reinvents drag/connect/zoom), embedding draw.io/mxGraph (heavy, hard to theme, weak animation).

## 4. Persistence & Library

The app is multi-document. On launch the user lands on a **gallery of saved diagrams**.

- **My Diagrams library** — each diagram has a name, thumbnail, and last-edited date. Open, rename, duplicate, or delete any past diagram.
- **Storage:** IndexedDB (handles many diagrams + thumbnails better than localStorage).
- **Auto-save** of the currently edited diagram so nothing is lost.
- **JSON export/import** of a single diagram for backup or moving between machines.
- HDL template is seeded into the library on first run.
- (Future option: "Export all" as one backup file.)

User flow: open app → gallery (HDL starter + past work) → click to edit, or start new blank/template.

## 5. Editor UI

- **Left sidebar — Blocks palette:** drag block types onto canvas — Card, Decision/branch, Start/End pill, plain Label. Dark glowing card styling.
- **Center — Canvas:** React Flow; pan/zoom, snap-to-grid, drag-to-connect from handles on each block.
- **Right sidebar — Inspector:**
  - Node selected: edit title, subtitle, accent theme (neutral / green / pink / blue / amber), size, glow toggle.
  - Edge selected: animation style (dots / gradient / none), color, speed, line style, path type, optional label.
- **Top toolbar:** diagram name, Save, Undo/Redo, Export (PNG/SVG/JSON), Present.

## 6. Data Model

### Diagram (saved unit)
```
Diagram {
  id, name, createdAt, updatedAt, thumbnail,
  nodes[], edges[], theme
}
```

### Node (block)
```
Node {
  id,
  type: 'card' | 'decision' | 'pill' | 'label',
  position: { x, y },
  data: {
    title, subtitle,
    accent: 'neutral' | 'green' | 'pink' | 'blue' | 'amber',
    width, height,
    glow: boolean
  }
}
```
Rendered as a custom React Flow node: dark glassy rounded card, bold numbered title, muted subtitle, accent-colored border + soft outer glow, connection handles on all four sides.

### Edge (connector)
```
Edge {
  id, source, target, sourceHandle, targetHandle,
  data: {
    animation: 'dots' | 'gradient' | 'none',
    color,
    speed: 1..5,
    lineStyle: 'solid' | 'dashed',
    path: 'bezier' | 'smoothstep' | 'straight',
    label?: string
  }
}
```

### Animations
- **dots** — glowing circles travel source→target along the SVG path (`<animateMotion>` / Framer Motion along path).
- **gradient** — moving gradient + dash flow with glow along the line.
- **node pulse** — connected nodes softly pulse/glow when their edge is active (present mode or hover).
- Each edge animates independently, so styles can be mixed per branch (e.g. green dots + pink gradient).

## 7. Present Mode

The "Start Video Simulation" experience.

- Fullscreen; editor chrome hidden; cinematic dark background with title/subtitle header.
- **Play** runs the simulation: connectors reveal/draw-on in sequence stage-by-stage, flowing dots travel, connected nodes pulse as each becomes active.
- Controls: Play / Pause / Restart, speed slider, loop toggle.
- **Esc** exits back to the editor.

## 8. Export

- **PNG / SVG** of the current canvas (html-to-image) for slides/email.
- **JSON** export/import of a single diagram.
- Video-file export out of scope for v1.

## 9. HDL Starter Template

Seeded into the library on first run. Six stages from the Excel:
1. Customer Engagement (Inbound Touchpoints Ingest)
2. Lead Prioritization (Sorting Decision Engine Split)
3. Data Scrub & Assign (Worxpertise CRM Core)
4. Intelligent Contact (Agent Intelligent UI View)
5. Channel Execution (Omnichannel SMS / Inbound IVR)
6. Experience Tracking (Feedback Loops & CSAT Metrics)

Plus the branching variant — 3A High-Priority Route (green, bypasses scrub → Quick Dispatch) and 4B Standard CRM Route (pink, Data Scrub/Cleaning/Validation) — styled and animated to match the reference images. Fully editable.

## 10. Project Structure (initial)

```
C:\sachin\
  index.html
  package.json
  vite.config.ts
  tailwind.config.js
  src/
    main.tsx
    App.tsx
    store/            # Zustand diagram + editor state
    db/               # IndexedDB library (idb wrapper)
    components/
      gallery/        # My Diagrams gallery
      editor/         # canvas, palette, inspector, toolbar
      nodes/          # custom React Flow node components
      edges/          # custom animated edge components
      present/        # present-mode overlay + playback
    templates/        # HDL starter seed
    lib/              # export (png/svg/json), thumbnail
    types.ts          # Diagram/Node/Edge types
```
```
