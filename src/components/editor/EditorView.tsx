import { useEffect, useRef, useState, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
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

export function EditorView({ onBack }: { onBack: () => void }) {
  return (
    <ReactFlowProvider>
      <EditorViewContent onBack={onBack} />
    </ReactFlowProvider>
  );
}

function EditorViewContent({ onBack }: { onBack: () => void }) {
  const diagram = useEditorStore((s) => s.diagram);
  const user = useAuthStore((s) => s.user);
  const [selection, setSelection] = useState<Sel>(null);
  const [present, setPresent] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(user ? "saved" : "local");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNocOpen, setIsNocOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

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
    if (!canvasRef.current || !diagram) return;
    const viewport = canvasRef.current.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewport) return;
    const url = await exportImage(viewport, fmt, diagramBounds(diagram.nodes));
    downloadDataUrl(url, `${diagram.name ?? "diagram"}.${fmt}`);
  };

  const onExportPdf = async () => {
    if (!canvasRef.current || !diagram) return;
    const viewport = canvasRef.current.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewport) return;
    await exportPdf(viewport, diagramBounds(diagram.nodes), diagram);
  };

  const onExportGif = async (onProgress?: (p: number) => void) => {
    if (!canvasRef.current || !diagram) return;
    const viewport = canvasRef.current.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewport) return;
    await exportGif(viewport, diagramBounds(diagram.nodes), diagram, onProgress);
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
        <Palette />
        <div ref={canvasRef} className="flex-1 h-full relative overflow-hidden">
          <Canvas onSelect={setSelection} selection={selection} />
        </div>
        <Inspector selection={selection} onClearSelection={() => setSelection(null)} />
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
          viewportElement={canvasRef.current?.querySelector<HTMLElement>(".react-flow__viewport") ?? null}
        />
      )}
    </div>
  );
}
