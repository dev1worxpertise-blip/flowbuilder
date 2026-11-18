import { useEffect, useRef, useState, useCallback } from "react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { useEditorStore } from "../../store/editorStore";
import { useAuthStore } from "../../store/authStore";
import { saveDiagram } from "../../db/library";
import { diagramsApi } from "../../lib/api";
import {
  exportImage,
  downloadDataUrl,
  diagramBounds,
  exportPdf,
  exportGif,
} from "../../lib/exportDiagram";
import { Toolbar, SyncStatus } from "./Toolbar";
import { Palette } from "./Palette";
import { Canvas } from "./Canvas";
import { Inspector, type Sel } from "./Inspector";
import { PresentMode } from "../present/PresentMode";
import { NodeSearchModal } from "./NodeSearchModal";
import { ExportModal } from "../export/ExportModal";
import { NocModal } from "../noc/NocModal";
import { useWebhookStore } from "../../store/webhookStore";
import { useThemeStore } from "../../store/themeStore";
import { getEffectiveCanvasBg } from "../../lib/theme";

export function EditorView({ onBack, initialPresent = false }: { onBack: () => void; initialPresent?: boolean }) {
  return (
    <ReactFlowProvider>
      <EditorViewContent onBack={onBack} initialPresent={initialPresent} />
    </ReactFlowProvider>
  );
}

function EditorViewContent({ onBack, initialPresent = false }: { onBack: () => void; initialPresent?: boolean }) {
  const diagram = useEditorStore((s) => s.diagram);
  const user = useAuthStore((s) => s.user);
  const [selection, setSelection] = useState<Sel>(null);
  const [present, setPresent] = useState(initialPresent);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(user ? "saved" : "local");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNocOpen, setIsNocOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const showPalette = useEditorStore((s) => s.showPalette);
  const togglePalette = useEditorStore((s) => s.togglePalette);
  const showInspector = useEditorStore((s) => s.showInspector);
  const toggleInspector = useEditorStore((s) => s.toggleInspector);
  const setShowInspector = useEditorStore((s) => s.setShowInspector);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";
  const { fitView } = useReactFlow();

  // Auto-reveal Inspector when user selects a node or edge
  useEffect(() => {
    if (selection) {
      setShowInspector(true);
    }
  }, [selection, setShowInspector]);

  // Smoothly re-center canvas when sidebars are collapsed / expanded
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ duration: 350, padding: 0.18 });
    }, 80);
    return () => clearTimeout(timer);
  }, [showPalette, showInspector, fitView]);

  // Store actions for shortcuts
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const copyNode = useEditorStore((s) => s.copyNode);
  const pasteNode = useEditorStore((s) => s.pasteNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const removeNode = useEditorStore((s) => s.removeNode);
  const removeEdge = useEditorStore((s) => s.removeEdge);
  const removeMultipleNodes = useEditorStore((s) => s.removeMultipleNodes);

  const performSave = useCallback(async () => {
    if (!diagram) return;
    try {
      if (user) {
        setSyncStatus("saving");
        await diagramsApi.save(diagram);
        setSyncStatus("saved");
      }
      await saveDiagram(diagram);
      if (!user) setSyncStatus("local");
    } catch (err) {
      console.error("Auto-save error:", err);
      if (user) setSyncStatus("error");
      await saveDiagram(diagram);
    }
  }, [diagram, user]);

  // Debounced auto-save on diagram change
  useEffect(() => {
    if (!diagram) return;
    if (user) setSyncStatus("saving");
    const t = setTimeout(() => {
      void performSave();
    }, 800);
    return () => clearTimeout(t);
  }, [diagram, performSave, user]);

  // Auto-connect Live Webhook & NOC SSE stream for the active diagram
  useEffect(() => {
    if (!diagram?.id) return;
    const { connect, disconnect } = useWebhookStore.getState();
    connect(diagram.id);
    return () => {
      disconnect();
    };
  }, [diagram?.id]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V, Ctrl+D, Delete, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when typing in inputs/textareas
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isInput) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Find / Canvas Quick Search (Ctrl+F)
      if (modifier && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      // Toggle Component Library Sidebar ([ or Ctrl+B)
      if ((modifier && e.key.toLowerCase() === "b") || (!modifier && !e.altKey && e.key === "[")) {
        e.preventDefault();
        togglePalette();
        return;
      }

      // Toggle Properties / Canvas Settings Sidebar (] or Ctrl+J)
      if ((modifier && e.key.toLowerCase() === "j") || (!modifier && !e.altKey && e.key === "]")) {
        e.preventDefault();
        toggleInspector();
        return;
      }

      // Full-Screen Presentation Mode (P)
      if (!modifier && !e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPresent(true);
        return;
      }

      // Toggle Browser Fullscreen (F)
      if (!modifier && !e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
        return;
      }

      // Undo / Redo
      if (modifier && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (modifier && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      // Copy
      if (modifier && e.key.toLowerCase() === "c") {
        if (selection?.kind === "node") {
          e.preventDefault();
          copyNode(selection.id);
        }
        return;
      }

      // Paste
      if (modifier && e.key.toLowerCase() === "v") {
        e.preventDefault();
        const created = pasteNode();
        if (created) {
          setSelection({ kind: "node", id: created.id });
        }
        return;
      }

      // Duplicate
      if (modifier && e.key.toLowerCase() === "d") {
        if (selection?.kind === "node") {
          e.preventDefault();
          const created = duplicateNode(selection.id);
          if (created) {
            setSelection({ kind: "node", id: created.id });
          }
        }
        return;
      }

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selection) {
          e.preventDefault();
          if (selection.kind === "node") {
            removeNode(selection.id);
          } else if (selection.kind === "edge") {
            removeEdge(selection.id);
          } else if (selection.kind === "multi") {
            removeMultipleNodes(selection.nodeIds);
          }
          setSelection(null);
        }
        return;
      }

      // Escape
      if (e.key === "Escape") {
        setSelection(null);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection, undo, redo, copyNode, pasteNode, duplicateNode, removeNode, removeEdge, removeMultipleNodes]);

  const onExportImage = async (fmt: "png" | "svg") => {
    if (!diagram) return;
    const viewport = canvasRef.current?.querySelector<HTMLElement>(".react-flow__viewport") || document.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewport) return;
    try {
      const exportBg = getEffectiveCanvasBg(diagram.canvasColor, isDark);
      const url = await exportImage(viewport, fmt, diagramBounds(diagram.nodes), undefined, {
        backgroundColor: exportBg,
      });
      const ext = url.startsWith("data:image/svg") ? "svg" : fmt;
      downloadDataUrl(url, `${diagram.name ?? "diagram"}.${ext}`);
    } catch (err) {
      console.error("Export image failed:", err);
      alert("Failed to export diagram image. " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const onExportPdf = async () => {
    if (!diagram) return;
    const viewport = canvasRef.current?.querySelector<HTMLElement>(".react-flow__viewport") || document.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewport) return;
    try {
      await exportPdf(viewport, diagramBounds(diagram.nodes), diagram);
    } catch (err) {
      console.error("Export PDF failed:", err);
      alert("Failed to export PDF report. " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const onExportGif = async (onProgress?: (p: number) => void) => {
    if (!diagram) return;
    const viewport = canvasRef.current?.querySelector<HTMLElement>(".react-flow__viewport") || document.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewport) return;
    try {
      await exportGif(viewport, diagramBounds(diagram.nodes), diagram, onProgress);
    } catch (err) {
      console.error("Export GIF failed:", err);
      alert("Failed to export GIF animation. " + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (present) return <PresentMode onExit={() => setPresent(false)} />;

  return (
    <div className="flex h-full w-full max-w-full flex-col overflow-hidden">
      <Toolbar
        onPresent={() => setPresent(true)}
        onExportImage={onExportImage}
        onExportPdf={onExportPdf}
        onExportGif={onExportGif}
        onOpenExport={() => setIsExportOpen(true)}
        onBack={onBack}
        onSave={performSave}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNoc={() => setIsNocOpen(true)}
        syncStatus={syncStatus}
      />
      <div className="flex flex-1 w-full max-w-full overflow-hidden relative">
        {/* Component Library Sidebar (Collapsible) */}
        {showPalette ? (
          <Palette />
        ) : (
          <button
            type="button"
            onClick={togglePalette}
            title="Expand Component Library (Left Sidebar)"
            className={`group absolute left-0 top-1/2 -translate-y-1/2 z-30 flex h-14 w-4.5 hover:w-6.5 items-center justify-center rounded-r-lg border border-l-0 shadow-lg backdrop-blur transition-all duration-150 cursor-pointer ${
              isDark
                ? "border-[#232c3d] bg-[#0d111a]/95 text-slate-400 hover:text-white hover:border-[#c00000] hover:bg-[#c00000]/10"
                : "border-slate-300 bg-white/95 text-slate-500 hover:text-[#c00000] hover:border-[#c00000] hover:bg-[#c00000]/5"
            }`}
          >
            <span className="text-xs font-black group-hover:scale-125 transition-transform">›</span>
          </button>
        )}

        {/* Central Flow Canvas */}
        <div ref={canvasRef} className="flex-1 h-full relative overflow-hidden">
          <Canvas onSelect={setSelection} selection={selection} />
        </div>

        {/* Properties / Inspector Sidebar (Collapsible) */}
        {showInspector ? (
          <Inspector selection={selection} onClearSelection={() => setSelection(null)} />
        ) : (
          <button
            type="button"
            onClick={toggleInspector}
            title="Expand Properties / Canvas Settings (Right Sidebar)"
            className={`group absolute right-0 top-1/2 -translate-y-1/2 z-30 flex h-14 w-4.5 hover:w-6.5 items-center justify-center rounded-l-lg border border-r-0 shadow-lg backdrop-blur transition-all duration-150 cursor-pointer ${
              isDark
                ? "border-[#232c3d] bg-[#0d111a]/95 text-slate-400 hover:text-white hover:border-[#c00000] hover:bg-[#c00000]/10"
                : "border-slate-300 bg-white/95 text-slate-500 hover:text-[#c00000] hover:border-[#c00000] hover:bg-[#c00000]/5"
            }`}
          >
            <span className="text-xs font-black group-hover:scale-125 transition-transform">‹</span>
          </button>
        )}
      </div>

      <NodeSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectNode={(id) => setSelection({ kind: "node", id })}
      />

      <NocModal
        isOpen={isNocOpen}
        onClose={() => setIsNocOpen(false)}
      />

      {diagram && (
        <ExportModal
          diagram={diagram}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          viewportElement={canvasRef.current?.querySelector<HTMLElement>(".react-flow__viewport") || (typeof document !== "undefined" ? document.querySelector<HTMLElement>(".react-flow__viewport") : null)}
        />
      )}
    </div>
  );
}
