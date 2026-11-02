import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { PATH_KINDS, CANVAS_COLOR_PRESETS } from "../../types";
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
  const setCanvasColor = useEditorStore((s) => s.setCanvasColor);
  const user = useAuthStore((s) => s.user);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRoutingMenu, setShowRoutingMenu] = useState(false);
  const [showCanvasColorMenu, setShowCanvasColorMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [gifProgress, setGifProgress] = useState<number | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const routingRef = useRef<HTMLDivElement>(null);
  const canvasColorRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (routingRef.current && !routingRef.current.contains(event.target as Node)) {
        setShowRoutingMenu(false);
      }
      if (canvasColorRef.current && !canvasColorRef.current.contains(event.target as Node)) {
        setShowCanvasColorMenu(false);
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
    <header
      className={`flex w-full items-center justify-between gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 select-none shrink-0 border-b backdrop-blur-md transition-colors duration-150 ${
        isDark
          ? "border-[#232c3d] bg-[#0d111a]/95 text-slate-100"
          : "border-slate-200 bg-white/95 text-slate-800 shadow-xs"
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. BRAND & FILE IDENTITY (LEFT)                               */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={onBack}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition ${
            isDark
              ? "border border-[#232c3d] bg-[#151b27] text-slate-300 hover:border-[#c00000]/70 hover:text-white"
              : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-[#c00000]/60 hover:text-[#c00000]"
          }`}
          title="Back to Gallery"
        >
          <span>←</span>
          <span className="hidden md:inline">Gallery</span>
        </button>

        {/* Worxpertise Brand Badge */}
        <div className={`flex items-center gap-1 px-1 border-r pr-2 ${isDark ? "border-[#232c3d]" : "border-slate-200"}`}>
          <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-xs flex items-center shrink-0">
            <img
              src="https://worxpertise.com/wp-content/themes/worxpertise/assets/images/worx-header-logo.png"
              alt="Worxpertise Logo"
              className="h-3.5 sm:h-4 w-auto object-contain"
              onError={(e) => {
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-[10px] font-black text-[#c00000]">Worx</span>';
                }
              }}
            />
          </div>
          <span className="hidden lg:inline text-[9px] font-extrabold text-[#c00000] tracking-wider uppercase">
            Flow
          </span>
        </div>

        {/* Title & Cloud/Local Sync Pill */}
        <div className="flex items-center gap-1 shrink-0">
          <input
            aria-label="diagram name"
            className={`rounded-lg px-2 py-1 text-xs font-bold transition truncate focus:outline-none w-24 sm:w-28 md:w-32 lg:w-36 ${
              isDark
                ? "bg-[#151b27] border border-[#232c3d] text-white focus:border-[#c00000]"
                : "bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#c00000] focus:bg-white"
            }`}
            value={diagram.name}
            onChange={(e) => setName(e.target.value)}
          />

          {user ? (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${
                syncStatus === "saving"
                  ? isDark ? "bg-amber-950/40 border-amber-800 text-amber-300" : "bg-amber-50 border-amber-300 text-amber-800"
                  : syncStatus === "error"
                  ? isDark ? "bg-red-950/40 border-red-800 text-red-300" : "bg-red-50 border-red-300 text-red-800"
                  : isDark ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" : "bg-emerald-50 border-emerald-300 text-emerald-800"
              }`}
              title={syncStatus === "saving" ? "Saving..." : syncStatus === "error" ? "Cloud error" : "Saved to cloud"}
            >
              {syncStatus === "saving" ? "⏳" : syncStatus === "error" ? "⚠️" : "☁️"}
              <span className="hidden xl:inline">
                {syncStatus === "saving" ? "Saving" : syncStatus === "error" ? "Error" : "Saved"}
              </span>
            </span>
          ) : (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium border shrink-0 ${
                isDark
                  ? "bg-[#151b27] border-[#232c3d] text-slate-400"
                  : "bg-slate-100 border-slate-200 text-slate-600"
              }`}
              title="Local storage"
            >
              💾 <span className="hidden xl:inline">Local</span>
            </span>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CANVAS & LAYOUT TOOLS (SEGMENTED)                          */}
      {/* ------------------------------------------------------------- */}
      <div className={`hidden sm:flex items-center gap-1 border-l border-r px-1.5 shrink-0 ${
        isDark ? "border-[#232c3d]" : "border-slate-200"
      }`}>
        {/* Undo / Redo */}
        <div className={`flex items-center rounded-lg border p-0.5 shadow-xs ${
          isDark ? "border-[#232c3d] bg-[#151b27]" : "border-slate-200 bg-slate-50"
        }`}>
          <button
            className={`px-1.5 py-0.5 rounded text-xs disabled:opacity-30 transition ${
              isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-200"
            }`}
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <div className={`h-3 w-px ${isDark ? "bg-[#232c3d]" : "bg-slate-200"}`} />
          <button
            className={`px-1.5 py-0.5 rounded text-xs disabled:opacity-30 transition ${
              isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-200"
            }`}
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
        </div>

        {/* 1-Click Auto Layout */}
        <button
          className={`rounded-lg border px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shadow-xs shrink-0 ${
            isDark
              ? "border-[#c00000]/40 bg-[#c00000]/10 text-[#ff4040] hover:bg-[#c00000]/20"
              : "border-[#c00000]/30 bg-[#c00000]/10 text-[#c00000] hover:bg-[#c00000]/20"
          }`}
          onClick={() => autoLayout("LR")}
          title="Hierarchical Auto Layout (Left-to-Right)"
        >
          <span>⚡</span>
          <span className="hidden xl:inline">Auto</span>
        </button>

        {/* Grid Snap Toggle */}
        <button
          className={`rounded-lg px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shrink-0 ${
            snapToGrid
              ? isDark
                ? "bg-[#c00000]/20 border border-[#c00000]/60 text-[#ffbfbf]"
                : "bg-[#c00000]/10 border border-[#c00000]/50 text-[#c00000]"
              : isDark
              ? "border border-[#232c3d] bg-[#151b27] text-slate-400 hover:text-white"
              : "border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900"
          }`}
          onClick={toggleSnapToGrid}
          title={snapToGrid ? "Snap Grid is ON (20px)" : "Snap Grid is OFF"}
        >
          <span>🧲</span>
          <span className="hidden xl:inline">Grid</span>
        </button>

        {/* MiniMap / Radar Toggle */}
        <button
          className={`rounded-lg px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shrink-0 ${
            showMiniMap
              ? isDark
                ? "bg-[#c00000]/20 border border-[#c00000]/60 text-[#ffbfbf]"
                : "bg-[#c00000]/10 border border-[#c00000]/50 text-[#c00000]"
              : isDark
              ? "border border-[#232c3d] bg-[#151b27] text-slate-400 hover:text-white"
              : "border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900"
          }`}
          onClick={toggleMiniMap}
          title={showMiniMap ? "Radar MiniMap is ON" : "Radar MiniMap is OFF"}
        >
          <span>🗺️</span>
          <span className="hidden xl:inline">Radar</span>
        </button>

        {/* Connector Routing Style Dropdown */}
        <div className="relative" ref={routingRef}>
          <button
            className={`rounded-lg border px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shrink-0 ${
              isDark
                ? "border-[#232c3d] bg-[#151b27] text-slate-300 hover:text-white hover:border-slate-600"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:border-slate-400"
            }`}
            onClick={() => setShowRoutingMenu(!showRoutingMenu)}
            title="Connector Routing Style"
          >
            <span className="text-[#c00000] font-mono">{currentRoutingMeta.icon}</span>
            <span className="hidden xl:inline">{currentRoutingMeta.label}</span>
            <span className="text-[9px] text-slate-400">▾</span>
          </button>

          {showRoutingMenu && (
            <div
              className={`absolute top-full left-0 mt-1.5 w-56 rounded-xl border p-2 shadow-2xl backdrop-blur-md z-50 animate-in fade-in space-y-1 ${
                isDark
                  ? "border-[#232c3d] bg-[#0d111a] text-slate-200"
                  : "border-slate-200 bg-white text-slate-800"
              }`}
            >
              <div className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}>
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
                        ? isDark
                          ? "bg-[#c00000]/15 border border-[#c00000]/40 text-[#ff4040]"
                          : "bg-[#c00000]/10 border border-[#c00000]/30 text-[#c00000] font-semibold"
                        : isDark
                        ? "hover:bg-slate-800 text-slate-300 hover:text-white"
                        : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-[#c00000]">{pk.icon}</span>
                      <div>
                        <div className="font-medium leading-tight">{pk.label}</div>
                        <div className={`text-[10px] leading-tight ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {pk.desc}
                        </div>
                      </div>
                    </div>
                    {isActive && <span className="text-xs text-[#c00000]">✓</span>}
                  </button>
                );
              })}
              <div className={`pt-1 mt-1 border-t ${isDark ? "border-[#232c3d]" : "border-slate-100"}`}>
                <button
                  onClick={() => {
                    setAllEdgesPathKind(defaultPathKind);
                    setShowRoutingMenu(false);
                  }}
                  className={`w-full rounded-md px-2 py-1 text-[11px] font-medium transition text-center ${
                    isDark
                      ? "bg-[#151b27] hover:bg-slate-800 border border-[#232c3d] text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
                  }`}
                >
                  ⚡ Convert all to "{currentRoutingMeta.label}"
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas Background Color Picker Dropdown */}
        <div className="relative" ref={canvasColorRef}>
          <button
            className={`rounded-lg border px-2 py-1 text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              isDark
                ? "border-[#232c3d] bg-[#151b27] text-slate-300 hover:text-white hover:border-slate-600"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:border-slate-400"
            }`}
            onClick={() => setShowCanvasColorMenu(!showCanvasColorMenu)}
            title={`Canvas Background Color (${diagram.canvasColor || (isDark ? "#0a0d15" : "#f8fafc")})`}
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-400/40 shadow-xs shrink-0"
              style={{ backgroundColor: diagram.canvasColor || (isDark ? "#0a0d15" : "#f8fafc") }}
            />
            <span className="hidden xl:inline">Canvas</span>
            <span className="text-[9px] text-slate-400">▾</span>
          </button>

          {showCanvasColorMenu && (
            <div
              className={`absolute top-full left-0 mt-1.5 w-64 rounded-xl border p-3 shadow-2xl backdrop-blur-md z-50 animate-in fade-in space-y-2.5 ${
                isDark
                  ? "border-[#232c3d] bg-[#0d111a] text-slate-200"
                  : "border-slate-200 bg-white text-slate-800"
              }`}
            >
              <div className={`flex items-center justify-between border-b pb-1.5 ${
                isDark ? "border-[#232c3d]" : "border-slate-100"
              }`}>
                <span className={`text-[11px] font-bold flex items-center gap-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                  <span>🎨</span> Canvas Color
                </span>
                <span className={`text-[10px] font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {diagram.canvasColor || (isDark ? "#0a0d15" : "#f8fafc")}
                </span>
              </div>

              {/* Presets Grid */}
              <div className="space-y-1">
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Presets
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {CANVAS_COLOR_PRESETS.map((preset) => {
                    const current = (diagram.canvasColor || (isDark ? "#0a0d15" : "#f8fafc")).toLowerCase();
                    const isActive = current === preset.color.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setCanvasColor(preset.color);
                          setShowCanvasColorMenu(false);
                        }}
                        title={preset.name}
                        className={`group relative flex flex-col items-center justify-center p-1.5 rounded-lg border transition ${
                          isActive
                            ? "border-[#c00000] ring-1 ring-[#c00000]/60 bg-[#c00000]/5"
                            : isDark
                            ? "border-[#232c3d] hover:border-slate-500 hover:bg-white/5"
                            : "border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shadow-inner border flex items-center justify-center text-[10px]"
                          style={{
                            backgroundColor: preset.color,
                            borderColor: preset.border || "rgba(0,0,0,0.15)",
                          }}
                        >
                          {isActive && <span className={preset.isDark ? "text-white" : "text-slate-900"}>✓</span>}
                        </span>
                        <span className={`text-[9px] mt-1 truncate max-w-[48px] text-center ${
                          isDark ? "text-slate-400 group-hover:text-slate-200" : "text-slate-600 group-hover:text-slate-900"
                        }`}>
                          {preset.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Input */}
              <div className={`pt-2 border-t space-y-1.5 ${isDark ? "border-[#232c3d]" : "border-slate-100"}`}>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Custom Hex
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={diagram.canvasColor || (isDark ? "#0a0d15" : "#f8fafc")}
                    onChange={(e) => setCanvasColor(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-300 bg-transparent cursor-pointer shrink-0"
                    title="Pick custom color"
                  />
                  <input
                    type="text"
                    value={diagram.canvasColor || (isDark ? "#0a0d15" : "#f8fafc")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setCanvasColor(val);
                      }
                    }}
                    placeholder={isDark ? "#0a0d15" : "#f8fafc"}
                    className={`flex-1 rounded-md px-2 py-1 text-xs font-mono focus:border-[#c00000] focus:outline-none ${
                      isDark
                        ? "bg-[#151b27] border border-[#232c3d] text-white"
                        : "bg-slate-50 border border-slate-300 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              {/* Reset to Worxpertise Default */}
              <button
                type="button"
                onClick={() => {
                  setCanvasColor(isDark ? "#0a0d15" : "#f8fafc");
                  setShowCanvasColorMenu(false);
                }}
                className={`w-full text-center py-1 text-[11px] font-semibold rounded-md border transition ${
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/60 border-[#232c3d]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
                }`}
              >
                ↺ Reset to {isDark ? "Midnight" : "Clean Paper"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. RIGHT ACTIONS GROUP (CONSOLIDATED & NEVER OVERFLOWS)       */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
        {/* Quick Search */}
        {onOpenSearch && (
          <button
            className={`rounded-lg border px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shrink-0 ${
              isDark
                ? "border-[#232c3d] bg-[#151b27] text-slate-300 hover:text-white hover:border-slate-600"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:border-slate-400 shadow-xs"
            }`}
            onClick={onOpenSearch}
            title="Quick Search (Ctrl+F)"
          >
            <span>🔍</span>
            <span className="hidden 2xl:inline">Search</span>
          </button>
        )}

        {/* ✨ AI Workflow Generator */}
        <button
          className={`rounded-lg border px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shadow-xs shrink-0 ${
            isDark
              ? "border-[#c00000]/60 bg-[#c00000]/15 text-[#ffbfbf] hover:bg-[#c00000]/30 hover:border-[#ff4040]"
              : "border-[#c00000]/30 bg-[#c00000]/10 text-[#c00000] hover:bg-[#c00000]/20 hover:border-[#c00000]"
          }`}
          onClick={() => setShowAiModal(true)}
          title="AI Workflow Generator (Generate from text)"
        >
          <span className="text-xs">✨</span>
          <span className="text-xs font-bold hidden sm:inline">AI Flow</span>
        </button>

        {/* Templates */}
        <button
          className={`rounded-lg border px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shrink-0 ${
            isDark
              ? "border-[#232c3d] bg-[#151b27] text-slate-300 hover:text-white hover:border-slate-600"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:border-slate-400 shadow-xs"
          }`}
          onClick={() => setShowTemplates(true)}
          title="Open Template Library"
        >
          <span>📋</span>
          <span className="hidden 2xl:inline">Templates</span>
        </button>

        {/* Keyboard Shortcuts */}
        <button
          className={`rounded-lg border p-1 text-xs transition shrink-0 ${
            isDark
              ? "border-[#232c3d] bg-[#151b27] text-slate-400 hover:text-white"
              : "border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setShowShortcuts(true)}
          title="Keyboard Shortcuts"
        >
          ⌨️
        </button>

        {/* Simulation Controls */}
        <div className={`flex items-center gap-1 border-l pl-1 ${isDark ? "border-[#232c3d]" : "border-slate-200"}`}>
          <button
            className={`rounded-lg px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shrink-0 ${
              isSimulating
                ? "bg-amber-600 text-white shadow-xs"
                : isDark
                ? "border border-emerald-600/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50"
                : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
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
                ? "bg-emerald-600 text-white shadow-xs animate-pulse"
                : isDark
                ? "border border-cyan-600/50 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50"
                : "border border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
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
              className={`rounded-lg px-2 py-1 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs shrink-0 ${
                nocSummary.down > 0
                  ? "bg-[#c00000] text-white border border-[#ff4040] shadow-md shadow-[#c00000]/40 animate-pulse"
                  : nocSummary.warning > 0
                  ? isDark
                    ? "bg-amber-600/30 border border-amber-500/70 text-amber-200"
                    : "bg-amber-50 border border-amber-300 text-amber-800"
                  : nocSummary.healthy > 0
                  ? isDark
                    ? "border border-emerald-600/50 bg-emerald-950/40 text-emerald-300"
                    : "border border-emerald-300 bg-emerald-50 text-emerald-800"
                  : isDark
                  ? "border border-cyan-800/60 bg-cyan-950/30 text-cyan-300"
                  : "border border-slate-200 bg-slate-50 text-slate-700"
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
              <span className="font-bold hidden sm:inline">
                {nocSummary.down > 0
                  ? `${nocSummary.down} Down`
                  : nocSummary.warning > 0
                  ? `${nocSummary.warning} Warn`
                  : nocSummary.healthy > 0
                  ? `NOC (${nocSummary.healthy})`
                  : "NOC"}
              </span>
              {isNocConnected && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" title="Live SSE active" />
              )}
            </button>
          )}
        </div>

        {/* Unified 📸 Export Dropdown Menu */}
        <div className={`relative border-l pl-1 ${isDark ? "border-[#232c3d]" : "border-slate-200"}`} ref={exportRef}>
          <button
            className={`rounded-lg border px-2 py-1 text-xs font-semibold transition flex items-center gap-1 shadow-xs shrink-0 ${
              isDark
                ? "border-[#232c3d] bg-[#151b27] text-slate-200 hover:text-white hover:border-[#c00000]/70"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:border-slate-400"
            }`}
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export Diagram as High-Res Poster, PDF Report, GIF, or JSON"
          >
            <span>📸</span>
            <span className="hidden xl:inline">Export</span>
            <span className="text-[9px] text-slate-400">▾</span>
          </button>

          {showExportMenu && (
            <div
              className={`absolute right-0 top-full mt-1.5 w-56 rounded-xl border p-1.5 shadow-2xl backdrop-blur-md z-50 animate-in fade-in space-y-1 ${
                isDark
                  ? "border-[#232c3d] bg-[#0d111a] text-slate-200"
                  : "border-slate-200 bg-white text-slate-800"
              }`}
            >
              {onOpenExport && (
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onOpenExport();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition text-left ${
                    isDark
                      ? "bg-[#c00000]/15 hover:bg-[#c00000]/25 border border-[#c00000]/40 text-[#ff4040]"
                      : "bg-[#c00000]/10 hover:bg-[#c00000]/15 border border-[#c00000]/30 text-[#c00000]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">📸</span>
                    <div>
                      <div>Export Studio</div>
                      <div className={`text-[10px] font-normal ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Poster, PDF & GIF
                      </div>
                    </div>
                  </div>
                  <span className="text-sm">→</span>
                </button>
              )}

              <div className={`h-px my-1 ${isDark ? "bg-[#232c3d]" : "bg-slate-100"}`} />
              <div className={`text-[10px] uppercase font-bold px-2 py-0.5 tracking-wider ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}>
                Quick Download
              </div>

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExportImage("png");
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                  isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>🖼️</span> Quick PNG Image
              </button>

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExportImage("svg");
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                  isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>📐</span> Quick SVG Vector
              </button>

              {onExportPdf && (
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportPdf();
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                    isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
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
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                    isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>🎞️</span> Quick Looping GIF
                </button>
              )}

              <div className={`h-px my-1 ${isDark ? "bg-[#232c3d]" : "bg-slate-100"}`} />

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  downloadDataUrl(
                    "data:application/json," + encodeURIComponent(diagramToJson(diagram)),
                    `${diagram.name}.json`
                  );
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                  isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>💾</span> Export JSON
              </button>

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  fileRef.current?.click();
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                  isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
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

        {/* Share Button */}
        <button
          className={`rounded-lg border px-2 py-1 text-xs font-semibold transition shadow-xs flex items-center gap-1 shrink-0 ${
            isDark
              ? "border-[#858591]/50 bg-[#858591]/15 text-[#c0c0c8] hover:text-white"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900"
          }`}
          onClick={() => setShowShare(true)}
          title="Generate public shareable link"
        >
          <span>🔗</span>
          <span className="hidden xl:inline">Share</span>
        </button>

        {/* Present Hero Button (Worxpertise Red #c00000) */}
        <button
          className="rounded-lg bg-[#c00000] hover:bg-[#a50000] active:scale-95 px-2.5 py-1 text-xs font-bold text-white shadow-sm transition flex items-center gap-1 shrink-0"
          onClick={onPresent}
          title="Full-Screen Presentation Mode"
        >
          <span>▶</span>
          <span>Present</span>
        </button>

        {/* Global Theme Toggle (Worxpertise Light vs Dark) */}
        <button
          onClick={toggleTheme}
          className={`rounded-lg px-2 py-1 text-xs font-semibold border transition flex items-center gap-1 shrink-0 ${
            isDark
              ? "border-[#232c3d] bg-[#151b27] text-amber-300 hover:border-amber-400"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
          }`}
          title={isDark ? "Switch to Worxpertise Light Theme" : "Switch to Midnight Dark Theme"}
        >
          <span>{isDark ? "☀️" : "🌙"}</span>
          <span className="hidden 2xl:inline">{isDark ? "Light" : "Dark"}</span>
        </button>

        {/* User Account Menu - ALWAYS VISIBLE PINNED TO FAR RIGHT */}
        <div className={`h-4 w-px mx-0.5 shrink-0 ${isDark ? "bg-[#232c3d]" : "bg-slate-200"}`} />
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
