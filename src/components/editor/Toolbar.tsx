import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import { useAuthStore } from "../../store/authStore";
import { PATH_KINDS } from "../../types";
import { diagramToJson, diagramFromJson, downloadDataUrl } from "../../lib/exportDiagram";
import { UserMenu } from "../auth/UserMenu";
import { ShortcutsHelpModal } from "./ShortcutsHelpModal";
import { TemplateModal } from "../templates/TemplateModal";
import { ShareModal } from "../share/ShareModal";
import { AiFlowModal } from "./AiFlowModal";
import { useSimulationStore } from "../../store/simulationStore";
import { useTrafficStore } from "../../store/trafficStore";
import { useWebhookStore } from "../../store/webhookStore";

export type SyncStatus = "saved" | "saving" | "error" | "local";

export function Toolbar({
  onPresent,
  onExportImage,
  onExportPdf,
  onExportGif,
  onOpenExport,
  onBack,
  onSave,
  onOpenSearch,
  onOpenNoc,
  syncStatus = "local",
}: {
  onPresent: () => void;
  onExportImage: (fmt: "png" | "svg") => void;
  onExportPdf?: () => void;
  onExportGif?: (onProgress?: (p: number) => void) => Promise<void>;
  onOpenExport?: () => void;
  onBack: () => void;
  onSave?: () => void;
  onOpenSearch?: () => void;
  onOpenNoc?: () => void;
  syncStatus?: SyncStatus;
}) {
  const diagram = useEditorStore((s) => s.diagram);
  const setName = useEditorStore((s) => s.setName);
  const loadDiagram = useEditorStore((s) => s.loadDiagram);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo());
  const canRedo = useEditorStore((s) => s.canRedo());
  const autoLayout = useEditorStore((s) => s.autoLayout);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const toggleSnapToGrid = useEditorStore((s) => s.toggleSnapToGrid);
  const defaultPathKind = useEditorStore((s) => s.defaultPathKind);
  const setDefaultPathKind = useEditorStore((s) => s.setDefaultPathKind);
  const setAllEdgesPathKind = useEditorStore((s) => s.setAllEdgesPathKind);
  const showMiniMap = useEditorStore((s) => s.showMiniMap);
  const toggleMiniMap = useEditorStore((s) => s.toggleMiniMap);
  const user = useAuthStore((s) => s.user);

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRoutingMenu, setShowRoutingMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [gifProgress, setGifProgress] = useState<number | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const routingRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (routingRef.current && !routingRef.current.contains(event.target as Node)) {
        setShowRoutingMenu(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentRoutingMeta = PATH_KINDS.find((p) => p.id === defaultPathKind) ?? PATH_KINDS[0];

  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const isSimulating = useSimulationStore((s) => s.isActive);
  const stopSimulation = useSimulationStore((s) => s.stopSimulation);

  const isTrafficSimulating = useTrafficStore((s) => s.isSimulating);
  const toggleTraffic = useTrafficStore((s) => s.toggleTraffic);

  const isNocConnected = useWebhookStore((s) => s.isConnected);
  const nocSummary = useWebhookStore((s) => s.getNocSummary());

  if (!diagram) return null;

  return (
    <header className="flex w-full items-center justify-between gap-1 sm:gap-2 border-b border-[#232c3d] bg-[#0d111a]/95 px-2 sm:px-3 py-1.5 text-slate-100 backdrop-blur-md select-none shrink-0 shadow-sm overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* 1. BRAND & FILE IDENTITY (LEFT)                               */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-1.5 py-1 rounded-lg border border-[#232c3d] bg-[#151b27] hover:border-[#c00000]/70 hover:text-white text-xs font-semibold text-slate-300 transition"
          title="Back to Gallery"
        >
          <span>←</span>
          <span className="hidden xl:inline">Gallery</span>
        </button>

        {/* Worxpertise Brand Badge */}
        <div className="flex items-center gap-1 px-0.5 border-r border-[#232c3d] pr-2">
          <div className="bg-white/95 px-1.5 py-0.5 rounded border border-slate-700/40 shadow-sm flex items-center shrink-0">
            <img
              src="https://worxpertise.com/wp-content/themes/worxpertise/assets/images/worx-header-logo.png"
              alt="Worxpertise Logo"
              className="h-4 w-auto object-contain"
              onError={(e) => {
                // If remote logo fails, display clean text badge
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-[10px] font-black text-[#c00000]">Worx</span>';
                }
              }}
            />
          </div>
          <span className="hidden 2xl:inline text-[9px] font-extrabold text-[#ff4040] tracking-wider uppercase">
            Flow
          </span>
        </div>

        {/* Title & Cloud/Local Sync Pill */}
        <div className="flex items-center gap-1 shrink-0">
          <input
            aria-label="diagram name"
            className="rounded-lg bg-[#151b27] border border-[#232c3d] px-2 py-1 text-xs font-bold text-white focus:border-[#c00000] focus:outline-none w-20 sm:w-28 md:w-32 lg:w-36 transition truncate"
            value={diagram.name}
            onChange={(e) => setName(e.target.value)}
          />

          {user ? (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${
                syncStatus === "saving"
                  ? "bg-amber-950/40 border-amber-800 text-amber-300"
                  : syncStatus === "error"
                  ? "bg-red-950/40 border-red-800 text-red-300"
                  : "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              }`}
              title={syncStatus === "saving" ? "Saving..." : syncStatus === "error" ? "Cloud error" : "Saved"}
            >
              {syncStatus === "saving" ? "⏳" : syncStatus === "error" ? "⚠️" : "☁️"}
              <span className="hidden 2xl:inline">
                {syncStatus === "saving" ? "Saving..." : syncStatus === "error" ? "Error" : "Saved"}
              </span>
            </span>
          ) : (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-[#151b27] border border-[#232c3d] text-slate-400 shrink-0"
              title="Local storage"
            >
              💾 <span className="hidden 2xl:inline">Local</span>
            </span>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CANVAS & LAYOUT TOOLS (SEGMENTED)                          */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden sm:flex items-center gap-1 border-l border-r border-[#232c3d] px-1.5 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center rounded-lg border border-[#232c3d] bg-[#151b27] p-0.5 shadow-sm">
          <button
            className="px-1.5 py-1 rounded hover:bg-slate-800 text-xs text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <div className="h-3 w-px bg-[#232c3d]" />
          <button
            className="px-1.5 py-1 rounded hover:bg-slate-800 text-xs text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
        </div>

        {/* 1-Click Auto Layout */}
        <button
          className="rounded-lg border border-[#c00000]/40 bg-[#c00000]/10 px-2 py-1 text-xs font-semibold text-[#ff4040] hover:bg-[#c00000]/20 transition flex items-center gap-1 shadow-sm shrink-0"
          onClick={() => autoLayout("LR")}
          title="Hierarchical Auto Layout (Left-to-Right)"
        >
          <span>⚡</span>
          <span className="hidden 2xl:inline">Auto</span>
        </button>

        {/* Grid Snap Toggle */}
        <button
          className={`rounded-lg px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shrink-0 ${
            snapToGrid
              ? "bg-[#c00000]/20 border border-[#c00000]/60 text-[#ffbfbf] shadow-sm"
              : "border border-[#232c3d] bg-[#151b27] text-slate-400 hover:text-white"
          }`}
          onClick={toggleSnapToGrid}
          title={snapToGrid ? "Snap Grid is ON (snaps to 20px)" : "Snap Grid is OFF (free 1px movement)"}
        >
          <span>🧲</span>
          <span className="hidden 2xl:inline">{snapToGrid ? "Grid: ON" : "Grid"}</span>
        </button>

        {/* MiniMap / Radar Toggle */}
        <button
          className={`rounded-lg px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shrink-0 ${
            showMiniMap
              ? "bg-[#c00000]/20 border border-[#c00000]/60 text-[#ffbfbf] shadow-sm"
              : "border border-[#232c3d] bg-[#151b27] text-slate-400 hover:text-white"
          }`}
          onClick={toggleMiniMap}
          title={showMiniMap ? "Radar MiniMap is ON" : "Radar MiniMap is OFF"}
        >
          <span>🗺️</span>
          <span className="hidden 2xl:inline">Radar</span>
        </button>

        {/* Connector Routing Style Dropdown */}
        <div className="relative" ref={routingRef}>
          <button
            className="rounded-lg border border-[#232c3d] bg-[#151b27] px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition flex items-center gap-1 shrink-0"
            onClick={() => setShowRoutingMenu(!showRoutingMenu)}
            title="Connector Routing Style"
          >
            <span className="text-[#ff4040] font-mono">{currentRoutingMeta.icon}</span>
            <span className="hidden 2xl:inline">{currentRoutingMeta.label}</span>
            <span className="text-[9px] text-slate-500">▾</span>
          </button>

          {showRoutingMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#232c3d] bg-[#0d111a] p-2 shadow-2xl backdrop-blur-md z-50 animate-in fade-in space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-2 py-0.5">
                Connector Style
              </div>
              {PATH_KINDS.map((pk) => {
                const isActive = defaultPathKind === pk.id;
                return (
                  <button
                    key={pk.id}
                    onClick={() => {
                      setDefaultPathKind(pk.id);
                      setShowRoutingMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                      isActive
                        ? "bg-[#c00000]/15 border border-[#c00000]/40 text-[#ff4040]"
                        : "hover:bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-[#ff4040]">{pk.icon}</span>
                      <div>
                        <div className="font-medium leading-tight">{pk.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight">{pk.desc}</div>
                      </div>
                    </div>
                    {isActive && <span className="text-xs text-[#c00000]">✓</span>}
                  </button>
                );
              })}
              <div className="pt-1 mt-1 border-t border-[#232c3d]">
                <button
                  onClick={() => {
                    setAllEdgesPathKind(defaultPathKind);
                    setShowRoutingMenu(false);
                  }}
                  className="w-full rounded-md bg-[#151b27] hover:bg-slate-800 border border-[#232c3d] px-2 py-1 text-[11px] font-medium text-slate-300 transition text-center"
                >
                  ⚡ Convert all to "{currentRoutingMeta.label}"
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. RIGHT ACTIONS GROUP (CONSOLIDATED & PINNED TO FAR RIGHT)  */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
        {/* Quick Search */}
        {onOpenSearch && (
          <button
            className="rounded-lg border border-[#232c3d] bg-[#151b27] px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition flex items-center gap-1 shrink-0"
            onClick={onOpenSearch}
            title="Quick Search (Ctrl+F)"
          >
            <span>🔍</span>
            <span className="hidden 2xl:inline">Search</span>
          </button>
        )}

        {/* ✨ AI Workflow Generator */}
        <button
          className="rounded-lg border border-[#c00000]/60 bg-[#c00000]/15 px-2 py-1 text-xs font-semibold text-[#ffbfbf] hover:bg-[#c00000]/30 hover:border-[#ff4040] transition flex items-center gap-1 shadow-sm shrink-0"
          onClick={() => setShowAiModal(true)}
          title="AI Workflow Generator (Generate from text)"
        >
          <span className="text-xs">✨</span>
          <span className="text-xs font-bold">AI Flow</span>
        </button>

        {/* Templates */}
        <button
          className="rounded-lg border border-[#232c3d] bg-[#151b27] px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition flex items-center gap-1 shrink-0"
          onClick={() => setShowTemplates(true)}
          title="Open Template Library"
        >
          <span>📋</span>
          <span className="hidden 2xl:inline">Templates</span>
        </button>

        {/* Keyboard Shortcuts */}
        <button
          className="rounded-lg border border-[#232c3d] bg-[#151b27] p-1 text-xs text-slate-400 hover:text-white transition shrink-0"
          onClick={() => setShowShortcuts(true)}
          title="Keyboard Shortcuts"
        >
          ⌨️
        </button>

        {/* Simulation Controls */}
        <div className="flex items-center gap-1 border-l border-[#232c3d] pl-1">
          <button
            className={`rounded-lg px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shrink-0 ${
              isSimulating
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "border border-emerald-600/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50"
            }`}
            onClick={() => {
              if (isSimulating) {
                stopSimulation();
              } else {
                startSimulation(diagram.nodes, diagram.edges);
              }
            }}
            title="Simulate workflow step-by-step"
          >
            <span>{isSimulating ? "⏹ Stop" : "▶ Sim"}</span>
          </button>

          <button
            className={`rounded-lg px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shrink-0 ${
              isTrafficSimulating
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 animate-pulse"
                : "border border-cyan-600/50 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50"
            }`}
            onClick={toggleTraffic}
            title="DevOps live simulated network traffic & ping metrics"
          >
            <span>📡</span>
            <span className="hidden 2xl:inline">{isTrafficSimulating ? "Traffic ON" : "Traffic"}</span>
          </button>

          {/* NOC & Live Health Dashboard */}
          {onOpenNoc && (
            <button
              className={`rounded-lg px-2 py-1 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm shrink-0 ${
                nocSummary.down > 0
                  ? "bg-[#c00000] text-white border border-[#ff4040] shadow-md shadow-[#c00000]/40 animate-pulse"
                  : nocSummary.warning > 0
                  ? "bg-amber-600/30 border border-amber-500/70 text-amber-200 hover:bg-amber-600/50"
                  : nocSummary.healthy > 0
                  ? "border border-emerald-600/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
                  : "border border-cyan-800/60 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-600"
              }`}
              onClick={onOpenNoc}
              title={
                nocSummary.down > 0
                  ? `🚨 NOC Alert: ${nocSummary.down} node(s) down!`
                  : "Open NOC Incident Monitor & Webhooks"
              }
            >
              <span className="text-xs">
                {nocSummary.down > 0 ? "🚨" : nocSummary.warning > 0 ? "⚠️" : nocSummary.healthy > 0 ? "🛡️" : "⚡"}
              </span>
              <span className="font-bold">
                {nocSummary.down > 0
                  ? `${nocSummary.down} Down`
                  : nocSummary.warning > 0
                  ? `${nocSummary.warning} Warn`
                  : nocSummary.healthy > 0
                  ? `NOC (${nocSummary.healthy} OK)`
                  : "NOC"}
              </span>
              {isNocConnected && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" title="Live SSE active" />
              )}
            </button>
          )}
        </div>

        {/* Unified 📸 Export Dropdown Menu */}
        <div className="relative border-l border-[#232c3d] pl-1" ref={exportRef}>
          <button
            className="rounded-lg border border-[#232c3d] bg-[#151b27] px-2 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:border-[#c00000]/70 transition flex items-center gap-1 shadow-sm shrink-0"
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export Diagram as High-Res Poster, PDF Report, GIF, or JSON"
          >
            <span>📸</span>
            <span className="hidden xl:inline">Export</span>
            <span className="text-[9px] text-slate-500">▾</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-[#232c3d] bg-[#0d111a] p-1.5 shadow-2xl backdrop-blur-md z-50 animate-in fade-in space-y-1">
              {/* Primary Item: Export Studio Modal */}
              {onOpenExport && (
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onOpenExport();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#c00000]/15 hover:bg-[#c00000]/25 border border-[#c00000]/40 text-[#ff4040] text-xs font-bold transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">📸</span>
                    <div>
                      <div>Export Studio</div>
                      <div className="text-[10px] text-slate-400 font-normal">Poster, Multi-Page PDF & GIF</div>
                    </div>
                  </div>
                  <span className="text-sm">→</span>
                </button>
              )}

              <div className="h-px bg-[#232c3d] my-1" />
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 tracking-wider">
                Quick Download
              </div>

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExportImage("png");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <span>🖼️</span> Quick PNG Image
              </button>

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExportImage("svg");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <span>📐</span> Quick SVG Vector
              </button>

              {onExportPdf && (
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportPdf();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
                >
                  <span>📄</span> Quick PDF Report
                </button>
              )}

              {onExportGif && (
                <button
                  disabled={gifProgress !== null}
                  onClick={async () => {
                    setShowExportMenu(false);
                    setGifProgress(0);
                    try {
                      await onExportGif((p) => setGifProgress(p));
                    } catch (err) {
                      console.error("GIF generation error:", err);
                    } finally {
                      setGifProgress(null);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
                >
                  <span>🎞️</span> Quick Looping GIF
                </button>
              )}

              <div className="h-px bg-[#232c3d] my-1" />
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 tracking-wider">
                Diagram Data
              </div>

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  downloadDataUrl(
                    "data:application/json," + encodeURIComponent(diagramToJson(diagram)),
                    `${diagram.name}.json`
                  );
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <span>💾</span> Export JSON
              </button>

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  fileRef.current?.click();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <span>📂</span> Import JSON
              </button>
            </div>
          )}
        </div>

        {/* Hidden JSON file input */}
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            loadDiagram(diagramFromJson(await f.text()));
            e.target.value = "";
          }}
        />

        {/* Share Button (Worxpertise Slate / Coral) */}
        <button
          className="rounded-lg border border-[#858591]/50 bg-[#858591]/15 px-2 py-1 text-xs font-semibold text-[#c0c0c8] hover:border-[#ff4040]/60 hover:text-white hover:bg-[#858591]/25 transition shadow-sm flex items-center gap-1 shrink-0"
          onClick={() => setShowShare(true)}
          title="Generate public shareable link"
        >
          <span>🔗</span>
          <span className="hidden xl:inline">Share</span>
        </button>

        {/* Present Hero Button (Worxpertise Deep Red #c00000) */}
        <button
          className="rounded-lg bg-[#c00000] hover:bg-[#ff4040] px-2.5 py-1 text-xs font-bold text-white shadow-md shadow-[#c00000]/30 transition flex items-center gap-1 shrink-0"
          onClick={onPresent}
          title="Full-Screen Presentation Mode"
        >
          <span>▶</span>
          <span>Present</span>
        </button>

        {/* User Account Menu - ALWAYS PINNED TO FAR RIGHT */}
        <div className="h-4 w-px bg-[#232c3d] mx-0.5 shrink-0" />
        <div className="shrink-0">
          <UserMenu />
        </div>
      </div>

      {/* Modals */}
      {showAiModal && (
        <AiFlowModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
        />
      )}
      {showShortcuts && <ShortcutsHelpModal onClose={() => setShowShortcuts(false)} />}
      {showTemplates && (
        <TemplateModal
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={(t) => {
            loadDiagram(t);
            if (onSave) onSave();
          }}
        />
      )}
      {showShare && (
        <ShareModal
          diagram={diagram}
          isOpen={showShare}
          onClose={() => setShowShare(false)}
        />
      )}
    </header>
  );
}
