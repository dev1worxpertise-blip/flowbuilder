import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Panel,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEditorStore } from "../../store/editorStore";
import { nodeTypes } from "../nodes";
import { edgeTypes } from "../edges";
import { SimulationDock } from "../simulation/SimulationDock";
import { TrafficDock } from "../simulation/TrafficDock";
import { MultiNodeActionBar } from "./MultiNodeActionBar";
import type { Sel } from "./Inspector";
import type { NodeKind } from "../../types";

function getMiniMapNodeColor(node: any): string {
  if (node.type === "note") return "#eab308";
  if (node.type === "decision") return "#a855f7";
  if (node.type === "group") return "rgba(56, 189, 248, 0.25)";
  const accent = node.data?.accent;
  switch (accent) {
    case "green":
      return "#10b981";
    case "pink":
      return "#f43f5e";
    case "blue":
      return "#38bdf8";
    case "amber":
      return "#f59e0b";
    case "neutral":
    default:
      return "#475569";
  }
}

function getMiniMapNodeStrokeColor(node: any): string {
  return node.selected ? "#38bdf8" : "#1e293b";
}

export function Canvas({
  onSelect,
  selection,
}: {
  onSelect: (sel: Sel) => void;
  selection?: Sel;
}) {
  const diagram = useEditorStore((s) => s.diagram);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const showMiniMap = useEditorStore((s) => s.showMiniMap);
  const toggleMiniMap = useEditorStore((s) => s.toggleMiniMap);
  const setNodes = useEditorStore((s) => s.setNodes);
  const setEdges = useEditorStore((s) => s.setEdges);
  const addEdge = useEditorStore((s) => s.addEdge);
  const addNode = useEditorStore((s) => s.addNode);
  const commitSnapshot = useEditorStore((s) => s.commitSnapshot);
  const { screenToFlowPosition } = useReactFlow();

  const multiNodeIds = selection?.kind === "multi" ? selection.nodeIds : [];

  const onSelectionChange = useCallback(
    ({ nodes, edges }: { nodes: any[]; edges: any[] }) => {
      if (nodes.length > 1) {
        onSelect({ kind: "multi", nodeIds: nodes.map((n) => n.id) });
      } else if (nodes.length === 1) {
        onSelect({ kind: "node", id: nodes[0].id });
      } else if (edges.length === 1) {
        onSelect({ kind: "edge", id: edges[0].id });
      }
    },
    [onSelect]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const d = useEditorStore.getState().diagram;
      if (!d) return;
      setNodes(applyNodeChanges(changes, d.nodes as any) as any);
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const d = useEditorStore.getState().diagram;
      if (!d) return;
      setEdges(applyEdgeChanges(changes, d.edges as any) as any);
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source && c.target)
        addEdge({
          source: c.source,
          target: c.target,
          sourceHandle: c.sourceHandle,
          targetHandle: c.targetHandle,
        });
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

  const nodesToRender = diagram.nodes.map((n) => ({
    ...n,
    zIndex: n.type === "group" ? -1 : 0,
  }));

  return (
    <ReactFlow
      nodes={nodesToRender as any}
      edges={diagram.edges as any}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionMode={"loose" as any}
      colorMode={"dark" as any}
      snapToGrid={snapToGrid}
      snapGrid={[20, 20]}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStart={() => {
        commitSnapshot();
        useEditorStore.getState().clearSelectionBounds();
      }}
      onConnect={onConnect}
      onNodeClick={(_, n) => onSelect({ kind: "node", id: n.id })}
      onEdgeClick={(_, ed) => onSelect({ kind: "edge", id: ed.id })}
      onPaneClick={() => {
        onSelect(null);
        useEditorStore.getState().clearSelectionBounds();
      }}
      onSelectionChange={onSelectionChange}
      multiSelectionKeyCode={["Shift", "Meta", "Control"]}
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      {snapToGrid ? (
        <Background
          id="grid-active-lines"
          variant={BackgroundVariant.Lines}
          color="#25384e"
          gap={20}
          lineWidth={1}
        />
      ) : (
        <Background
          id="grid-inactive-dots"
          variant={BackgroundVariant.Dots}
          color="#1e293b"
          gap={20}
          size={1.5}
        />
      )}
      <Controls />
      <SimulationDock />
      <TrafficDock />
      <MultiNodeActionBar
        selectedNodeIds={multiNodeIds}
        onClearSelection={() => onSelect(null)}
      />

      {snapToGrid && (
        <Panel position="top-center" className="!m-2 pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-sky-950/90 border border-sky-500/70 px-3.5 py-1 text-xs font-semibold text-sky-200 shadow-xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>🧲 Snap-to-Grid: 20px Grid Active (Drag blocks to align)</span>
          </div>
        </Panel>
      )}

      {/* Interactive Radar MiniMap */}
      {showMiniMap ? (
        <>
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={getMiniMapNodeColor}
            nodeStrokeColor={getMiniMapNodeStrokeColor}
            nodeStrokeWidth={2}
            nodeBorderRadius={3}
            bgColor="#090e17"
            maskColor="rgba(9, 14, 23, 0.78)"
            maskStrokeColor="#38bdf8"
            maskStrokeWidth={1.5}
            ariaLabel="Radar MiniMap"
            className="!bg-[#090e17]/95 !border !border-gray-800/90 !rounded-xl !shadow-2xl !backdrop-blur-md overflow-hidden !m-3"
            style={{ width: 190, height: 125 }}
          />
          <Panel position="bottom-right" className="!m-3 !mb-[135px]">
            <button
              aria-label="Hide Radar Map"
              onClick={toggleMiniMap}
              title="Hide Radar Map"
              className="flex items-center gap-1 rounded-md bg-gray-900/90 border border-gray-700/80 px-2 py-0.5 text-[10px] text-gray-400 hover:text-white hover:border-gray-500 shadow transition backdrop-blur-md"
            >
              <span>✕</span>
              <span>Hide Radar</span>
            </button>
          </Panel>
        </>
      ) : (
        <Panel position="bottom-right" className="!m-3">
          <button
            aria-label="Show Radar MiniMap"
            onClick={toggleMiniMap}
            title="Show Radar MiniMap"
            className="flex items-center gap-1.5 rounded-full border border-gray-700/80 bg-gray-900/90 px-3 py-1.5 text-xs font-semibold text-gray-300 shadow-xl backdrop-blur-md hover:border-sky-500/70 hover:text-sky-300 transition"
          >
            <span>🗺️</span>
            <span>Radar</span>
          </button>
        </Panel>
      )}
    </ReactFlow>
  );
}
