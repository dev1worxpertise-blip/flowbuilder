import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReactFlow } from "@xyflow/react";
import { useSimulationStore } from "../../store/simulationStore";
import { useEditorStore } from "../../store/editorStore";
import { useAudioStore } from "../../store/audioStore";
import { AudioControls } from "./AudioControls";
import { useTranscriptStore } from "../../store/transcriptStore";

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

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const timerRef = useRef<number | null>(null);

  // Audio SFX & Voice Narration
  const playStepSound = useAudioStore((s) => s.playStepSound);
  const narrateStep = useAudioStore((s) => s.narrateStep);
  const stopAllAudio = useAudioStore((s) => s.stopAllAudio);

  // Customer Journey Transcript
  const processTranscriptStep = useTranscriptStore((s) => s.processNodeStep);
  const isTranscriptOpen = useTranscriptStore((s) => s.isOpen);
  const toggleTranscript = useTranscriptStore((s) => s.toggleOpen);

  // Play contextual sound effect & AI voice narration on step change
  useEffect(() => {
    if (!isActive || !currentNodeId || !diagram) return;
    const node = diagram.nodes.find((n) => n.id === currentNodeId);
    if (node) {
      playStepSound(node.data.title, node.type);
      narrateStep(node.data.title, node.data.subtitle);
      processTranscriptStep(
        node.data.title,
        node.data.subtitle,
        visitedNodeIds.length,
        diagram.nodes.length
      );
    }
  }, [isActive, currentNodeId, diagram, visitedNodeIds.length, playStepSound, narrateStep, processTranscriptStep]);

  // Stop speech when paused, completed or inactive
  useEffect(() => {
    if (!isActive || status === "paused" || status === "completed") {
      stopAllAudio();
    }
  }, [isActive, status, stopAllAudio]);

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
    <>
      {/* Branch Choice Selection Dialog (when paused at a decision node) */}
      {branchChoice &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border-2 border-amber-500 bg-[#0d121f]/98 p-6 shadow-2xl backdrop-blur-xl ring-4 ring-amber-500/20 text-center animate-in zoom-in-95 duration-200">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold mb-2">
                <span>🔀</span>
                <span>Decision Point</span>
              </div>

              <h3 className="text-lg font-black text-white mb-1 tracking-tight">
                {branchChoice.sourceTitle}
              </h3>

              <p className="text-xs text-gray-300 mb-5">
                Multiple outgoing paths found. Please select a branch to continue:
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {branchChoice.branches.map((b) => (
                  <button
                    key={b.edgeId}
                    onClick={() => chooseBranch(b.edgeId, b.targetId, diagram.nodes)}
                    className="group flex items-center gap-2.5 rounded-xl border-2 border-sky-400/60 bg-sky-950/90 hover:bg-sky-600 hover:border-sky-300 hover:text-white px-5 py-3 text-sm font-bold text-sky-200 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span
                      className="h-3 w-3 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                      style={{ background: b.color || "#38bdf8" }}
                    />
                    <span className="text-base tracking-wide font-black">{b.label}</span>
                    {b.targetTitle && (
                      <span className="text-xs text-sky-300/80 group-hover:text-white/90 font-normal">
                        → {b.targetTitle}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 w-auto max-w-xl animate-in slide-in-from-bottom duration-300">
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

        {/* Audio SFX & Voice Narration Controls */}
        <div className="border-l border-gray-800 pl-2.5">
          <AudioControls compact dropdownDirection="up" />
        </div>

        {/* Customer Call CX Simulator Toggle */}
        <div className="border-l border-gray-800 pl-2">
          <button
            onClick={toggleTranscript}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition ${
              isTranscriptOpen
                ? "bg-[#c00000] text-white shadow-sm"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            title="Customer Call Experience (CX) — View live caller & AI bot conversation"
          >
            <span>🎧</span>
            <span className="hidden sm:inline">Call CX</span>
          </button>
        </div>

        {/* Fullscreen Toggle Button */}
        <div className="border-l border-gray-800 pl-2">
          <button
            onClick={toggleFullscreen}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition text-xs ${
              isFullscreen
                ? "bg-[#c00000] text-white hover:bg-[#a50000]"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
          >
            {isFullscreen ? "🗗" : "⛶"}
          </button>
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
  </>
);
}
