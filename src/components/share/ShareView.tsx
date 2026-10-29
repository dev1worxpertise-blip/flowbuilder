import { useEffect, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Diagram } from "../../types";
import { diagramsApi } from "../../lib/api";
import { nodeTypes } from "../nodes";
import { edgeTypes } from "../edges";
import { SimulationDock } from "../simulation/SimulationDock";
import { useSimulationStore } from "../../store/simulationStore";
import { useEditorStore } from "../../store/editorStore";

export function ShareView({
  diagramId,
  onGoHome,
}: {
  diagramId: string;
  onGoHome: () => void;
}) {
  const [diagram, setDiagram] = useState<(Diagram & { user?: { name: string; email: string } }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadDiagram = useEditorStore((s) => s.loadDiagram);
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const isSimulating = useSimulationStore((s) => s.isActive);
  const stopSimulation = useSimulationStore((s) => s.stopSimulation);

  useEffect(() => {
    async function fetchDiagram() {
      setLoading(true);
      setError(null);
      try {
        const d = await diagramsApi.getShared(diagramId);
        setDiagram(d);
        loadDiagram(d);
      } catch (err: any) {
        console.error("Failed to load shared diagram:", err);
        setError("This diagram could not be found or the share link has expired.");
      } finally {
        setLoading(false);
      }
    }
    void fetchDiagram();
  }, [diagramId, loadDiagram]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0a0e1a] text-gray-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        <p className="mt-4 text-xs text-gray-400">Loading shared flowchart...</p>
      </div>
    );
  }

  if (error || !diagram) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0a0e1a] px-4 text-center text-gray-200">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-8 max-w-md shadow-2xl space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold text-gray-100">Flowchart Not Found</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            {error || "The requested flowchart does not exist or access has been restricted."}
          </p>
          <button
            onClick={onGoHome}
            className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition shadow"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0a0e1a] text-gray-100 overflow-hidden">
      {/* Shared Header Bar */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-[#0d121f]/95 px-5 py-3 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-lg font-bold shadow-inner">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-gray-100 truncate max-w-sm">
                {diagram.name}
              </h1>
              <span className="rounded-full bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                🔒 Read-Only
              </span>
            </div>
            <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
              {diagram.user && (
                <span>
                  Author: <strong className="text-gray-300">{diagram.user.name}</strong>
                </span>
              )}
              <span>•</span>
              <span>{diagram.nodes.length} Steps</span>
              <span>•</span>
              <span>{diagram.edges.length} Connections</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Simulate Flow Button */}
          <button
            onClick={() => {
              if (isSimulating) {
                stopSimulation();
              } else {
                startSimulation(diagram.nodes, diagram.edges);
              }
            }}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow transition flex items-center gap-1.5 ${
              isSimulating
                ? "bg-amber-600 text-white hover:bg-amber-500 shadow-amber-600/30"
                : "border border-emerald-600/60 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-500"
            }`}
          >
            <span>{isSimulating ? "⏹ Stop Sim" : "▶ Simulate Flow"}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleFullscreen}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-700 transition"
            title="Toggle Fullscreen"
          >
            ⛶
          </button>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-700 transition flex items-center gap-1"
          >
            {copied ? (
              <span className="text-emerald-400 font-semibold">✓ Copied</span>
            ) : (
              <>
                <span>🔗</span> Copy Link
              </>
            )}
          </button>

          {/* Create Own Flow CTA */}
          <button
            onClick={onGoHome}
            className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition shadow"
          >
            Create Your Flow →
          </button>
        </div>
      </header>

      {/* Interactive Read-Only Canvas */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <ReactFlow
            nodes={diagram.nodes as any}
            edges={diagram.edges as any}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            colorMode="dark"
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1f2937" gap={20} />
            <Controls />
            <SimulationDock />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
