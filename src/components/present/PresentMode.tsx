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
import { useThemeStore } from "../../store/themeStore";
import { getEffectiveCanvasBg } from "../../lib/theme";
import { diagramBounds, type Bounds } from "../../lib/exportDiagram";
import { buildGuidedTour, type TourStep } from "../../lib/guidedTour";
import { nodeTypes } from "../nodes";
import { edgeTypes } from "../edges";
import { SimulationDock } from "../simulation/SimulationDock";
import { AudioControls } from "../simulation/AudioControls";
import { useAudioStore } from "../../store/audioStore";
import { useSimulationStore } from "../../store/simulationStore";
import { HEALTH_STATUS_CONFIG, type NodeHealthStatus } from "../../types";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Zoom in / out / fit buttons */
function ZoomControls({ isDark }: { isDark: boolean }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const cls = `flex h-8 w-8 items-center justify-center rounded-lg border text-base leading-none transition shadow-sm ${
    isDark
      ? "border-slate-800 bg-[#0d111a]/90 text-slate-200 hover:border-slate-600 hover:text-white"
      : "border-slate-200 bg-white/95 text-slate-700 hover:border-[#c00000] hover:text-[#c00000] shadow-md"
  }`;
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

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";
  const canvasBg = getEffectiveCanvasBg(diagram?.canvasColor, isDark);

  const [playing, setPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [restartKey, setRestartKey] = useState(0);
  const [tourActive, setTourActive] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const isSimulating = useSimulationStore((s) => s.isActive);
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const stopSimulation = useSimulationStore((s) => s.stopSimulation);

  // Audio SFX & Voice Narration
  const playStepSound = useAudioStore((s) => s.playStepSound);
  const narrateStep = useAudioStore((s) => s.narrateStep);
  const stopAllAudio = useAudioStore((s) => s.stopAllAudio);

  // Generate guided sequence
  const steps: TourStep[] = useMemo(() => {
    if (!diagram) return [];
    return buildGuidedTour(diagram.nodes, diagram.edges);
  }, [diagram]);

  const currentStep = steps[stepIndex];

  // Play contextual sound and voice narration when tour step changes (when not in simulation mode)
  useEffect(() => {
    if (tourActive && currentStep && !isSimulating) {
      playStepSound(currentStep.node.data.title, currentStep.node.type);
      narrateStep(currentStep.node.data.title, currentStep.node.data.subtitle);
    }
  }, [stepIndex, tourActive, currentStep, isSimulating, playStepSound, narrateStep]);

  // Stop audio on unmount or when guided tour / present exits
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  // Camera framing on step with clear, readable focus
  const frameCurrentStep = useCallback((step: TourStep) => {
    if (!step || !diagram) return;
    // For small diagrams (<= 4 nodes), keep full overview framed so user sees whole context
    if (diagram.nodes.length <= 4) {
      fitView({ padding: 0.22, maxZoom: 1.0, duration: 350 });
    } else {
      // For larger diagrams, frame the node with clean comfortable readability
      fitView({
        nodes: [{ id: step.node.id }],
        padding: 0.65,
        maxZoom: 1.05,
        minZoom: 0.6,
        duration: 400,
      });
    }
  }, [diagram, fitView]);

  // Handle step index navigation
  useEffect(() => {
    if (tourActive && currentStep) {
      frameCurrentStep(currentStep);
    }
  }, [stepIndex, tourActive, currentStep, frameCurrentStep]);

  // Auto-frame initial step on load
  useEffect(() => {
    if (tourActive && currentStep) {
      const timer = setTimeout(() => {
        frameCurrentStep(currentStep);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

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
    <div
      className={`fixed inset-0 z-50 flex flex-col select-none overflow-hidden transition-colors duration-200 ${
        isDark ? "text-slate-100" : "text-slate-900"
      }`}
      style={{ backgroundColor: canvasBg }}
    >
      {/* Top Header Bar - Worxpertise Corporate Brand */}
      <div className={`relative z-20 flex items-center justify-between border-b px-4 sm:px-6 py-2.5 backdrop-blur-md transition-colors duration-150 ${
        isDark
          ? "border-[#232c3d] bg-[#0d111a]/95 text-slate-100 shadow-sm"
          : "border-slate-200 bg-white/95 text-slate-800 shadow-xs"
      }`}>
        <div className="flex items-center gap-3">
          {/* Worxpertise Logo Badge */}
          <div className="bg-white p-1 px-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center shrink-0">
            <img
              src="https://worxpertise.com/wp-content/themes/worxpertise/assets/images/worx-header-logo.png"
              alt="Worxpertise Logo"
              className="h-4 sm:h-5 w-auto object-contain"
              onError={(e) => {
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-xs font-black text-[#c00000]">Worx</span>';
                }
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-sm sm:text-base font-extrabold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                {diagram.name}
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border shrink-0 ${
                isDark
                  ? "bg-[#c00000]/15 border-[#c00000]/40 text-[#ff4040]"
                  : "bg-rose-50 border-rose-200/80 text-[#c00000]"
              }`}>
                Presentation Mode
              </span>
            </div>
            <p className={`text-[10px] sm:text-[11px] truncate max-w-sm sm:max-w-md ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Worxpertise Flow Studio — Interactive Architecture Walkthrough & Live Simulation
            </p>
          </div>
        </div>

        {/* Central Mode Switcher */}
        <div className={`flex items-center gap-1 rounded-xl border p-1 transition ${
          isDark ? "border-[#232c3d] bg-[#111827]/80" : "border-slate-200 bg-slate-100/90 shadow-inner"
        }`}>
          <button
            onClick={() => {
              if (isSimulating) stopSimulation();
              setTourActive(true);
              if (currentStep) frameCurrentStep(currentStep);
            }}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition flex items-center gap-1 ${
              tourActive && !isSimulating
                ? "bg-[#c00000] text-white shadow-sm"
                : isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🎯</span>
            <span>Guided Tour</span>
          </button>
          <button
            onClick={() => {
              if (isSimulating) {
                stopSimulation();
              } else {
                setTourActive(false);
                startSimulation(diagram.nodes, diagram.edges);
              }
            }}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition flex items-center gap-1 ${
              isSimulating
                ? "bg-[#c00000] text-white shadow-sm"
                : isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>{isSimulating ? "⏹" : "▶"}</span>
            <span>Simulate</span>
          </button>
          <button
            onClick={() => {
              if (isSimulating) stopSimulation();
              setTourActive(false);
              fitView({ padding: 0.22, maxZoom: 1.0, duration: 350 });
            }}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition flex items-center gap-1 ${
              !tourActive && !isSimulating
                ? "bg-[#c00000] text-white shadow-sm"
                : isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🗺️</span>
            <span>Free Explore</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Flow Speed Toggles */}
          <div className={`flex items-center rounded-lg border px-1 py-0.5 text-xs ${
            isDark ? "border-[#232c3d] bg-[#151b27] text-slate-400" : "border-slate-200 bg-white text-slate-700 shadow-xs"
          }`}>
            <span className="text-[10px] px-1 font-semibold text-slate-400">Flow:</span>
            {[1, 2, 3].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`rounded px-1.5 py-0.5 text-[11px] font-bold transition ${
                  speedMultiplier === spd
                    ? "bg-[#c00000] text-white"
                    : isDark
                    ? "hover:text-white"
                    : "hover:text-slate-900"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            className={`rounded-lg border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition ${
              isDark
                ? "border-[#232c3d] bg-[#151b27] text-slate-200 hover:border-slate-500"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-xs"
            }`}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? "⏸ Pause Flows" : "▶ Resume Flows"}
          </button>

          <button
            className={`rounded-lg border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition ${
              isDark
                ? "border-[#232c3d] bg-[#151b27] text-slate-200 hover:border-slate-500"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-xs"
            }`}
            onClick={() => {
              setRestartKey((k) => k + 1);
              setPlaying(true);
              setStepIndex(0);
              if (currentStep) frameCurrentStep(currentStep);
            }}
            title="Restart Walkthrough"
          >
            ↺ Reset
          </button>

          {/* Theme Toggle (Worxpertise Light vs Dark) */}
          <button
            onClick={toggleTheme}
            className={`rounded-lg px-2 sm:px-2.5 py-1.5 text-xs font-semibold border transition flex items-center gap-1 ${
              isDark
                ? "border-[#232c3d] bg-[#151b27] text-amber-300 hover:border-amber-400"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-xs"
            }`}
            title={isDark ? "Switch to Worxpertise Light Theme" : "Switch to Midnight Dark Theme"}
          >
            <span>{isDark ? "☀️" : "🌙"}</span>
          </button>

          {/* Interactive Audio SFX & AI Voice Narration Controls */}
          <AudioControls compact />

          <button
            className={`rounded-lg border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1 ${
              isDark
                ? "border-[#232c3d] bg-[#151b27] text-slate-200 hover:border-slate-500"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-xs"
            }`}
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (F)"
          >
            <span>{isFullscreen ? "🗗" : "⛶"}</span>
            <span className="hidden md:inline">{isFullscreen ? "Windowed" : "Fullscreen"}</span>
          </button>

          <button
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold border transition shadow-xs ${
              isDark
                ? "bg-rose-950/40 border-rose-900/60 text-rose-300 hover:bg-[#c00000] hover:text-white"
                : "bg-rose-50 border-rose-200 text-[#c00000] hover:bg-[#c00000] hover:text-white"
            }`}
            onClick={() => {
              if (isSimulating) stopSimulation();
              onExit();
            }}
            title="Exit Presentation Mode (Esc)"
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
          style={{ backgroundColor: canvasBg }}
        >
          <Background
            color={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(100, 116, 139, 0.25)"}
            bgColor={canvasBg}
            gap={24}
          />
          <ZoomControls isDark={isDark} />
          <VerticalScrollbar bounds={bounds} />
          <SimulationDock />
        </ReactFlow>

        {/* Compact Floating Presentation Remote (HUD) - Worxpertise Styled */}
        {tourActive && currentStep && !isSimulating && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {isMinimized ? (
              /* Minimized Floating Pill */
              <div className={`flex items-center justify-between rounded-full border px-4 py-2 shadow-2xl backdrop-blur-xl ring-1 ${
                isDark
                  ? "border-[#232c3d] bg-[#0d111a]/95 text-slate-200 ring-[#c00000]/20"
                  : "border-slate-200 bg-white/95 text-slate-800 ring-slate-900/5 shadow-slate-300/40"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider border ${
                    isDark
                      ? "bg-[#c00000]/15 border-[#c00000]/40 text-[#ff4040]"
                      : "bg-rose-50 border-rose-200 text-[#c00000]"
                  }`}>
                    STEP {stepIndex + 1} OF {steps.length}
                  </span>
                  <span className={`text-xs font-bold truncate max-w-[180px] ${isDark ? "text-white" : "text-slate-900"}`}>
                    {String((currentStep.node.data as any)?.title || (currentStep.node.data as any)?.label || currentStep.node.id)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStepIndex((cur) => (cur - 1 + steps.length) % steps.length);
                      setAutoProgress(0);
                    }}
                    className={`p-1 transition ${isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
                    title="Previous Step"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => {
                      setStepIndex((cur) => (cur + 1) % steps.length);
                      setAutoProgress(0);
                    }}
                    className={`p-1 transition ${isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
                    title="Next Step"
                  >
                    ▶
                  </button>
                  <button
                    onClick={() => setIsMinimized(false)}
                    className="ml-2 text-xs text-[#c00000] hover:text-[#a00000] font-bold"
                    title="Expand Remote"
                  >
                    ▴
                  </button>
                </div>
              </div>
            ) : (
              /* Full Slim Presentation Remote */
              <div className={`relative rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ring-1 ${
                isDark
                  ? "border-[#232c3d] bg-[#0d111a]/95 text-slate-100 ring-[#c00000]/20"
                  : "border-slate-200/90 bg-white/95 text-slate-900 ring-slate-900/5 shadow-slate-300/40"
              }`}>
                {/* Auto-play progress bar */}
                {isAutoPlaying && (
                  <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-t-2xl bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-[#c00000] via-[#ff4040] to-emerald-500 transition-all duration-75 ease-linear"
                      style={{ width: `${autoProgress}%` }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider border ${
                        isDark
                          ? "bg-[#c00000]/15 border-[#c00000]/40 text-[#ff4040]"
                          : "bg-rose-50 border-rose-200 text-[#c00000]"
                      }`}>
                        STEP {stepIndex + 1} OF {steps.length}
                      </span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase border ${
                        isDark
                          ? "bg-slate-800 border-slate-700 text-slate-300"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}>
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

                    <h3 className={`text-sm font-extrabold truncate leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
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
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1 ${
                        isDark
                          ? "border-[#232c3d] bg-[#151b27] text-slate-200 hover:bg-slate-800"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 shadow-xs"
                      }`}
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
                          : isDark
                          ? "border border-emerald-600/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60"
                          : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-xs"
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
                      className="rounded-lg bg-[#c00000] hover:bg-[#a00000] active:scale-95 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-[#c00000]/25 transition flex items-center gap-1"
                      title="Next Step (Right Arrow or Space)"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span>▶</span>
                    </button>

                    <button
                      onClick={() => fitView({ padding: 0.22, maxZoom: 1.0, duration: 350 })}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                        isDark
                          ? "border-[#232c3d] bg-[#151b27] text-slate-300 hover:text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 shadow-xs"
                      }`}
                      title="Fit entire diagram in view"
                    >
                      ⤢ Overview
                    </button>

                    <button
                      onClick={() => setIsMinimized(true)}
                      className={`p-1 text-xs transition ${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}
                      title="Minimize Remote"
                    >
                      ▾
                    </button>
                  </div>
                </div>

                {/* Progress Dot Trail */}
                <div className={`flex items-center justify-center gap-1 mt-2 pt-1.5 border-t ${
                  isDark ? "border-[#232c3d]" : "border-slate-100"
                }`}>
                  {steps.map((st, i) => (
                    <button
                      key={st.node.id}
                      onClick={() => {
                        setStepIndex(i);
                        setAutoProgress(0);
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        i === stepIndex
                          ? "w-5 bg-[#c00000] shadow-sm shadow-[#c00000]/50"
                          : isDark
                          ? "w-1.5 bg-slate-800 hover:bg-slate-600"
                          : "w-1.5 bg-slate-200 hover:bg-slate-400"
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
