import { useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { useSimulationStore } from "../../store/simulationStore";
import { useEditorStore } from "../../store/editorStore";

export function SimulationDock() {
  const diagram = useEditorStore((s) => s.diagram);
  const { setCenter } = useReactFlow();

  const isActive = useSimulationStore((s) => s.isActive);
  const status = useSimulationStore((s) => s.status);
  const currentNodeId = useSimulationStore((s) => s.currentNodeId);
  const speed = useSimulationStore((s) => s.speed);
  const branchChoice = useSimulationStore((s) => s.branchChoice);
  const visitedNodeIds = useSimulationStore((s) => s.visitedNodeIds);

  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const stepForward = useSimulationStore((s) => s.stepForward);
  const chooseBranch = useSimulationStore((s) => s.chooseBranch);
  const restartSimulation = useSimulationStore((s) => s.restartSimulation);
  const stopSimulation = useSimulationStore((s) => s.stopSimulation);

  const timerRef = useRef<number | null>(null);

  // Auto-pan canvas to focus the current active node
  useEffect(() => {
    if (!isActive || !currentNodeId || !diagram) return;
    const node = diagram.nodes.find((n) => n.id === currentNodeId);
    if (node) {
      const centerX = node.position.x + (node.data.width || 200) / 2;
      const centerY = node.position.y + (node.data.height || 90) / 2;
      setCenter(centerX, centerY, { duration: 600, zoom: 1 });
    }
  }, [isActive, currentNodeId, diagram, setCenter]);

  // Simulation timer loop
  useEffect(() => {
    if (!isActive || status !== "playing" || branchChoice || !diagram) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const interval = Math.round(1800 / speed);
    timerRef.current = window.setTimeout(() => {
      stepForward(diagram.nodes, diagram.edges);
    }, interval);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [isActive, status, speed, branchChoice, currentNodeId, diagram, stepForward]);

  if (!isActive || !diagram) return null;

  const currentNode = diagram.nodes.find((n) => n.id === currentNodeId);
  const totalNodes = diagram.nodes.length;
  const visitedCount = visitedNodeIds.length;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 w-auto max-w-xl animate-in slide-in-from-bottom duration-300">
      {/* Branch Choice Selection Banner (when paused at a decision node) */}
      {branchChoice && (
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-amber-500/50 bg-[#0f172a]/95 px-5 py-3.5 shadow-2xl backdrop-blur-md text-center">
          <div className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
            <span>🔀</span> Decision Point: <strong className="text-white">{branchChoice.sourceTitle}</strong>
          </div>
          <div className="text-[11px] text-gray-300">
            Multiple outgoing paths found. Which branch would you like to follow?
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
            {branchChoice.branches.map((b) => (
              <button
                key={b.edgeId}
                onClick={() => chooseBranch(b.edgeId, b.targetId, diagram.nodes)}
                className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/60 px-3.5 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-900/80 hover:border-sky-400 transition shadow"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: b.color || "#38bdf8" }}
                />
                <span>{b.label}</span>
                {b.targetTitle && (
                  <span className="text-[10px] text-gray-400">→ {b.targetTitle}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Player Dock */}
      <div className="flex items-center gap-3 rounded-full border border-gray-700/80 bg-[#0b0f19]/95 px-5 py-2.5 shadow-2xl backdrop-blur-md text-gray-100">
        {/* Status Badge & Current Step */}
        <div className="flex items-center gap-2 border-r border-gray-800 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs">
            {status === "completed" ? "🎉" : status === "playing" ? "▶" : "⏸"}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-gray-200 truncate max-w-[140px]">
              {status === "completed"
                ? "Flow Complete!"
                : currentNode?.data.title || "Simulation"}
            </span>
            <span className="text-[9px] text-gray-400">
              Step {visitedCount} of {totalNodes}
            </span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          {status === "playing" ? (
            <button
              onClick={pause}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white transition"
              title="Pause Simulation"
            >
              ⏸
            </button>
          ) : (
            <button
              onClick={() => {
                if (status === "completed") {
                  restartSimulation(diagram.nodes, diagram.edges);
                } else {
                  play();
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c00000] text-white hover:bg-[#ff4040] transition shadow-md shadow-[#c00000]/30"
              title="Play Simulation"
            >
              ▶
            </button>
          )}

          <button
            onClick={() => stepForward(diagram.nodes, diagram.edges)}
            disabled={status === "completed" || !!branchChoice}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Step Next"
          >
            ⏭
          </button>

          <button
            onClick={() => restartSimulation(diagram.nodes, diagram.edges)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition"
            title="Restart Simulation"
          >
            ↺
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 border-l border-gray-800 pl-3">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                speed === s
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Exit Button */}
        <div className="border-l border-gray-800 pl-2">
          <button
            onClick={stopSimulation}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-red-400 transition text-xs"
            title="Exit Simulation"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
