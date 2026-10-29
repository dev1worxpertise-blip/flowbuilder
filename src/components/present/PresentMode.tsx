import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useReactFlow,
  useViewport,
  useStore,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEditorStore } from "../../store/editorStore";
import { diagramBounds, type Bounds } from "../../lib/exportDiagram";
import { buildGuidedTour, type TourStep } from "../../lib/guidedTour";
import { nodeTypes } from "../nodes";
import { edgeTypes } from "../edges";
import { SimulationDock } from "../simulation/SimulationDock";
import { HEALTH_STATUS_CONFIG, type NodeHealthStatus } from "../../types";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Zoom in / out / fit buttons */
function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const cls =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/80 text-base leading-none text-gray-200 backdrop-blur hover:border-gray-500 hover:text-white transition";
  return (
    <div className="absolute left-4 bottom-20 z-20 flex flex-col gap-1.5 shadow-lg">
      <button className={cls} title="Zoom in" aria-label="Zoom in" onClick={() => zoomIn({ duration: 150 })}>+</button>
      <button className={cls} title="Zoom out" aria-label="Zoom out" onClick={() => zoomOut({ duration: 150 })}>−</button>
      <button className={`${cls} text-xs`} title="Fit to view" aria-label="Fit to view"
        onClick={() => fitView({ padding: 0.22, maxZoom: 1.0, duration: 250 })}>⤢</button>
    </div>
  );
}

/** Draggable vertical scrollbar */
function VerticalScrollbar({ bounds }: { bounds: Bounds }) {
  const paneHeight = useStore((s) => s.height);
  const vp = useViewport();
  const { setViewport } = useReactFlow();

  const z = vp.zoom;
  const contentPx = bounds.height * z;
  const trackTop = 88, trackBottom = 24;
  const trackH = Math.max(0, paneHeight - trackTop - trackBottom);

  if (contentPx <= paneHeight + 1 || trackH <= 0) return null;

  const yMax = -bounds.y * z;
  const yMin = paneHeight - (bounds.y + bounds.height) * z;
  const range = yMax - yMin;
  const f = clamp((yMax - vp.y) / range, 0, 1);
  const thumbH = clamp(paneHeight / contentPx, 0.06, 1) * trackH;
  const thumbTop = f * (trackH - thumbH);

  const onThumbDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    const startY = e.clientY;
    const startF = f;
    const travel = trackH - thumbH;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const nf = clamp(startF + (travel > 0 ? (ev.clientY - startY) / travel : 0), 0, 1);
      setViewport({ x: vp.x, y: yMax - nf * range, zoom: z });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="absolute right-2 z-10 w-2.5" style={{ top: trackTop, height: trackH }}>
      <div className="relative h-full w-full rounded-full bg-gray-700/30">
        <div
          role="scrollbar"
          aria-label="Scroll vertically"
          aria-orientation="vertical"
          onPointerDown={onThumbDown}
          className="absolute left-0 w-full cursor-grab rounded-full bg-gray-400/70 hover:bg-gray-300 active:cursor-grabbing"
          style={{ top: thumbTop, height: thumbH }}
        />
      </div>
    </div>
  );
}

function PresentContent({ onExit }: { onExit: () => void }) {
  const diagram = useEditorStore((s) => s.diagram);
  const { fitView } = useReactFlow();

  const [playing, setPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [restartKey, setRestartKey] = useState(0);
  const [tourActive, setTourActive] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Generate guided sequence
  const steps: TourStep[] = useMemo(() => {
    if (!diagram) return [];
    return buildGuidedTour(diagram.nodes, diagram.edges);
  }, [diagram]);

  const currentStep = steps[stepIndex];

  // Camera framing on step without aggressive zooming
  const isInitialMount = useRef(true);
  const frameCurrentStep = useCallback((step: TourStep) => {
    if (!step || !diagram) return;
    // For small diagrams (<= 4 nodes), keep full overview framed so user sees whole context
    if (diagram.nodes.length <= 4) {
      fitView({ padding: 0.22, maxZoom: 1.0, duration: 350 });
    } else {
      // For larger diagrams, frame the node with generous padding
      fitView({
        nodes: [{ id: step.node.id }],
        padding: 2.2,
        maxZoom: 1.0,
        duration: 400,
      });
    }
  }, [diagram, fitView]);

  // Handle step index navigation
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // On initial mount, let ReactFlow fitView frame the full diagram cleanly
      return;
    }
    if (tourActive && currentStep) {
      frameCurrentStep(currentStep);
    }
  }, [stepIndex, tourActive, currentStep, frameCurrentStep]);

  // Auto-play timer
  const autoPlayTimerRef = useRef<any>(null);
  useEffect(() => {
    if (!isAutoPlaying || !tourActive || steps.length <= 1) {
      setAutoProgress(0);
      return;
    }

    const intervalMs = 50;
    const durationMs = 4500;
    const increment = (intervalMs / durationMs) * 100;

    autoPlayTimerRef.current = setInterval(() => {
      setAutoProgress((p) => {
        if (p >= 100) {
          setStepIndex((cur) => (cur + 1) % steps.length);
          return 0;
        }
        return p + increment;
      });
    }, intervalMs);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, tourActive, steps.length]);

  // Fullscreen state listener
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

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
        return;
      }
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (steps.length > 0) {
          setStepIndex((cur) => (cur + 1) % steps.length);
          setAutoProgress(0);
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (steps.length > 0) {
          setStepIndex((cur) => (cur - 1 + steps.length) % steps.length);
          setAutoProgress(0);
        }
        return;
      }
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
        return;
      }
      if (e.key === "t" || e.key === "T") {
        setTourActive((t) => !t);
        return;
      }
      if (e.key === "p" || e.key === "P") {
        setIsAutoPlaying((a) => !a);
        return;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onExit, steps.length]);

  // Dynamic styled edges with flow speed multiplier
  const edges = useMemo(() => {
    if (!diagram) return [];
    return diagram.edges.map((e) => {
      if (!playing) return { ...e, data: { ...e.data, animation: "none" as const } };
      if (speedMultiplier !== 1) {
        const baseSpeed = Number((e.data as any)?.speed ?? 1);
        return {
          ...e,
          data: {
            ...e.data,
            speed: Math.min(5, Math.max(1, baseSpeed * speedMultiplier)),
          },
        };
      }
      return e;
    });
  }, [diagram, playing, speedMultiplier]);

  // Highlight active node without washing out other nodes
  const nodes = useMemo(() => {
    if (!diagram) return [];
    const activeNodeId = tourActive && currentStep ? currentStep.node.id : null;

    return diagram.nodes.map((n: any) => {
      const isActive = n.id === activeNodeId;
      return {
        ...n,
        zIndex: isActive ? 40 : n.type === "group" ? -1 : 0,
        className: `${n.className || ""} ${isActive ? "react-flow__node-present-active" : ""}`.trim(),
        style: {
          ...(n.style || {}),
          opacity: tourActive ? (isActive ? 1 : 0.88) : 1,
        },
      };
    });
  }, [diagram, tourActive, currentStep]);

  const bounds = useMemo(() => diagramBounds(diagram?.nodes ?? []), [diagram]);

  if (!diagram) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0e1a] flex flex-col select-none overflow-hidden">
      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between border-b border-gray-800/80 bg-[#0d121f]/95 px-6 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold">
            ▶
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-sky-400 leading-tight">{diagram.name}</h1>
              <span className="rounded-full bg-sky-950/80 border border-sky-700/50 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                Presentation Mode
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Interactive Architecture Walkthrough & Live Simulation</p>
          </div>
        </div>

        {/* Central Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-gray-800 bg-gray-900/60 p-1">
          <button
            onClick={() => {
              setTourActive(true);
              if (currentStep) frameCurrentStep(currentStep);
            }}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              tourActive
                ? "bg-sky-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            🎯 Guided Tour
          </button>
          <button
            onClick={() => {
              setTourActive(false);
              fitView({ padding: 0.22, maxZoom: 1.0, duration: 350 });
            }}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              !tourActive
                ? "bg-sky-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            🗺️ Free Explore
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Flow Speed Toggles */}
          <div className="flex items-center rounded-lg border border-gray-700 bg-gray-900 px-1 py-0.5 text-xs text-gray-400">
            <span className="text-[10px] px-1.5 text-gray-400 font-semibold">Flow:</span>
            {[1, 2, 3].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`rounded px-1.5 py-0.5 text-[11px] font-bold transition ${
                  speedMultiplier === spd
                    ? "bg-sky-600 text-white"
                    : "hover:text-gray-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:border-gray-500 transition"
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? "⏸ Pause Flows" : "▶ Resume Flows"}
          </button>

          <button
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:border-gray-500 transition"
            onClick={() => {
              setRestartKey((k) => k + 1);
              setPlaying(true);
              setStepIndex(0);
              fitView({ padding: 0.22, maxZoom: 1.0, duration: 350 });
            }}
          >
            ↺ Reset
          </button>

          <button
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:border-gray-500 transition flex items-center gap-1"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (F)"
          >
            <span>{isFullscreen ? "🗗" : "⛶"}</span>
            <span>{isFullscreen ? "Windowed" : "Fullscreen"}</span>
          </button>

          <button
            className="rounded-md bg-red-950/80 border border-red-700/60 px-3.5 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900/60 transition"
            onClick={onExit}
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative" key={restartKey}>
        <ReactFlow
          nodes={nodes as any}
          edges={edges as any}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          onNodeClick={(_, clickedNode) => {
            const foundIdx = steps.findIndex((s) => s.node.id === clickedNode.id);
            if (foundIdx !== -1) {
              setTourActive(true);
              setStepIndex(foundIdx);
              setAutoProgress(0);
            }
          }}
          panOnDrag
          panOnScroll
          zoomOnScroll
          minZoom={0.05}
          fitView
          fitViewOptions={{ padding: 0.22, maxZoom: 1.0 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#111827" gap={24} />
          <ZoomControls />
          <VerticalScrollbar bounds={bounds} />
          <SimulationDock />
        </ReactFlow>

        {/* Compact Floating Presentation Remote (HUD) */}
        {tourActive && currentStep && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {isMinimized ? (
              /* Minimized Floating Pill */
              <div className="flex items-center justify-between rounded-full border border-sky-500/50 bg-[#0d1322]/95 px-4 py-2 shadow-2xl backdrop-blur-xl ring-1 ring-sky-500/30">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-sky-500/20 border border-sky-500/40 px-2 py-0.5 text-[10px] font-bold tracking-wider text-sky-300">
                    STEP {stepIndex + 1} OF {steps.length}
                  </span>
                  <span className="text-xs font-bold text-white truncate max-w-[180px]">
                    {String((currentStep.node.data as any)?.title || (currentStep.node.data as any)?.label || currentStep.node.id)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStepIndex((cur) => (cur - 1 + steps.length) % steps.length);
                      setAutoProgress(0);
                    }}
                    className="p-1 text-gray-300 hover:text-white"
                    title="Previous Step"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => {
                      setStepIndex((cur) => (cur + 1) % steps.length);
                      setAutoProgress(0);
                    }}
                    className="p-1 text-gray-300 hover:text-white"
                    title="Next Step"
                  >
                    ▶
                  </button>
                  <button
                    onClick={() => setIsMinimized(false)}
                    className="ml-2 text-xs text-sky-400 hover:text-sky-300 font-bold"
                    title="Expand Remote"
                  >
                    ▴
                  </button>
                </div>
              </div>
            ) : (
              /* Full Slim Presentation Remote */
              <div className="relative rounded-2xl border border-sky-500/40 bg-[#0d1322]/95 p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-sky-500/20">
                {/* Auto-play progress bar */}
                {isAutoPlaying && (
                  <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-t-2xl bg-gray-800">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-75 ease-linear"
                      style={{ width: `${autoProgress}%` }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="rounded-md bg-sky-500/20 border border-sky-500/40 px-2 py-0.5 text-[10px] font-bold tracking-wider text-sky-300">
                        STEP {stepIndex + 1} OF {steps.length}
                      </span>
                      <span className="rounded-md bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold text-gray-300 uppercase">
                        {currentStep.node.type || "Component"}
                      </span>
                      {(() => {
                        const health = (currentStep.node.data?.healthStatus as NodeHealthStatus) || "healthy";
                        const cfg = HEALTH_STATUS_CONFIG[health] || HEALTH_STATUS_CONFIG.healthy;
                        const metric = (currentStep.node.data as any)?.metric;
                        return (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border"
                            style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                            <span>{cfg.label}</span>
                            {metric && <span>• {String(metric)}</span>}
                          </span>
                        );
                      })()}
                    </div>

                    <h3 className="text-sm font-bold text-white truncate leading-tight">
                      {String((currentStep.node.data as any)?.title || (currentStep.node.data as any)?.label || currentStep.node.id)}
                    </h3>
                  </div>

                  {/* Right: Navigation Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setStepIndex((cur) => (cur - 1 + steps.length) % steps.length);
                        setAutoProgress(0);
                      }}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700 hover:text-white transition flex items-center gap-1"
                      title="Previous Step (Left Arrow)"
                    >
                      <span>◀</span>
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    <button
                      onClick={() => setIsAutoPlaying((a) => !a)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1 ${
                        isAutoPlaying
                          ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                          : "border border-emerald-600/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60"
                      }`}
                      title={isAutoPlaying ? "Pause Auto Walkthrough (P)" : "Play Auto Walkthrough (P)"}
                    >
                      <span>{isAutoPlaying ? "⏸" : "▶"}</span>
                      <span className="hidden sm:inline">{isAutoPlaying ? "Pause" : "Auto"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setStepIndex((cur) => (cur + 1) % steps.length);
                        setAutoProgress(0);
                      }}
                      className="rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-bold text-white shadow-md transition flex items-center gap-1"
                      title="Next Step (Right Arrow or Space)"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span>▶</span>
                    </button>

                    <button
                      onClick={() => fitView({ padding: 0.22, maxZoom: 1.0, duration: 350 })}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:border-gray-500 transition"
                      title="Fit entire diagram in view"
                    >
                      ⤢ Overview
                    </button>

                    <button
                      onClick={() => setIsMinimized(true)}
                      className="text-gray-400 hover:text-white p-1 text-xs"
                      title="Minimize Remote"
                    >
                      ▾
                    </button>
                  </div>
                </div>

                {/* Progress Dot Trail */}
                <div className="flex items-center justify-center gap-1 mt-2 pt-1.5 border-t border-gray-800/80">
                  {steps.map((st, i) => (
                    <button
                      key={st.node.id}
                      onClick={() => {
                        setStepIndex(i);
                        setAutoProgress(0);
                      }}
                      className={`h-1 rounded-full transition-all ${
                        i === stepIndex
                          ? "w-5 bg-sky-400 shadow-sm shadow-sky-400/50"
                          : "w-1.5 bg-gray-700 hover:bg-gray-500"
                      }`}
                      title={`Jump to step ${i + 1}: ${String((st.node.data as any)?.title || st.node.id)}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PresentMode({ onExit }: { onExit: () => void }) {
  return (
    <ReactFlowProvider>
      <PresentContent onExit={onExit} />
    </ReactFlowProvider>
  );
}
