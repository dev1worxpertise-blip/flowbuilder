import { useEditorStore } from "../../store/editorStore";
import { ACCENTS, type Accent } from "../../types";

interface MultiNodeActionBarProps {
  selectedNodeIds: string[];
  onClearSelection: () => void;
}

export function MultiNodeActionBar({ selectedNodeIds, onClearSelection }: MultiNodeActionBarProps) {
  const alignNodes = useEditorStore((s) => s.alignNodes);
  const distributeNodes = useEditorStore((s) => s.distributeNodes);
  const bulkUpdateNodeData = useEditorStore((s) => s.bulkUpdateNodeData);
  const removeMultipleNodes = useEditorStore((s) => s.removeMultipleNodes);

  const count = selectedNodeIds.length;
  if (count < 2) return null;

  return (
    <div
      role="toolbar"
      aria-label="Multi-selection alignment and bulk editing toolbar"
      className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border border-sky-500/50 bg-[#0b1322]/95 px-4 py-2 shadow-2xl backdrop-blur-md text-gray-200 animate-in slide-in-from-top duration-200 max-w-4xl flex-wrap justify-center select-none"
    >
      {/* Selection Count Pill */}
      <div className="flex items-center gap-1.5 border-r border-gray-800 pr-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/20 text-[11px] font-bold text-sky-400">
          {count}
        </span>
        <span className="text-xs font-semibold text-gray-200 whitespace-nowrap">Selected</span>
      </div>

      {/* Horizontal Alignment */}
      <div className="flex items-center gap-1 border-r border-gray-800 pr-2">
        <span className="text-[10px] text-gray-400 font-medium mr-0.5">Align:</span>
        <button
          type="button"
          onClick={() => alignNodes(selectedNodeIds, "left")}
          className="flex h-7 px-2 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
          title="Align Left edges"
          aria-label="Align Left"
        >
          ⇤ Left
        </button>
        <button
          type="button"
          onClick={() => alignNodes(selectedNodeIds, "center")}
          className="flex h-7 px-2 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
          title="Align Horizontal Center"
          aria-label="Align Center"
        >
          ↔ Center
        </button>
        <button
          type="button"
          onClick={() => alignNodes(selectedNodeIds, "right")}
          className="flex h-7 px-2 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
          title="Align Right edges"
          aria-label="Align Right"
        >
          Right ⇥
        </button>
      </div>

      {/* Vertical Alignment */}
      <div className="flex items-center gap-1 border-r border-gray-800 pr-2">
        <button
          type="button"
          onClick={() => alignNodes(selectedNodeIds, "top")}
          className="flex h-7 px-2 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
          title="Align Top edges"
          aria-label="Align Top"
        >
          ⤒ Top
        </button>
        <button
          type="button"
          onClick={() => alignNodes(selectedNodeIds, "middle")}
          className="flex h-7 px-2 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
          title="Align Vertical Middle"
          aria-label="Align Middle"
        >
          ↕ Middle
        </button>
        <button
          type="button"
          onClick={() => alignNodes(selectedNodeIds, "bottom")}
          className="flex h-7 px-2 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
          title="Align Bottom edges"
          aria-label="Align Bottom"
        >
          ⤓ Bottom
        </button>
      </div>

      {/* Distribute Spacing (only when >= 3 nodes) */}
      {count >= 3 && (
        <div className="flex items-center gap-1 border-r border-gray-800 pr-2">
          <span className="text-[10px] text-gray-400 font-medium mr-0.5">Distribute:</span>
          <button
            type="button"
            onClick={() => distributeNodes(selectedNodeIds, "horizontal")}
            className="flex h-7 px-2 items-center justify-center rounded-lg border border-amber-600/50 bg-amber-950/40 hover:bg-amber-900/60 text-xs font-medium text-amber-300 transition"
            title="Distribute Evenly Horizontally"
            aria-label="Distribute Horizontally"
          >
            ⇹ Horiz
          </button>
          <button
            type="button"
            onClick={() => distributeNodes(selectedNodeIds, "vertical")}
            className="flex h-7 px-2 items-center justify-center rounded-lg border border-amber-600/50 bg-amber-950/40 hover:bg-amber-900/60 text-xs font-medium text-amber-300 transition"
            title="Distribute Evenly Vertically"
            aria-label="Distribute Vertically"
          >
            ⇕ Vert
          </button>
        </div>
      )}

      {/* Bulk Color Accents */}
      <div className="flex items-center gap-1 border-r border-gray-800 pr-2">
        <span className="text-[10px] text-gray-400 font-medium mr-0.5">Color:</span>
        {ACCENTS.map((acc: Accent) => {
          const colors: Record<Accent, string> = {
            neutral: "#858591",
            green: "#10b981",
            pink: "#f43f5e",
            blue: "#38bdf8",
            amber: "#f59e0b",
            crimson: "#c00000",
            purple: "#ff4040",
          };
          return (
            <button
              key={acc}
              type="button"
              aria-label={`Bulk Color ${acc}`}
              onClick={() => bulkUpdateNodeData(selectedNodeIds, { accent: acc })}
              style={{ backgroundColor: colors[acc] }}
              className="h-4 w-4 rounded-full border border-gray-900 hover:scale-125 transition shadow-sm"
              title={`Set all selected blocks to ${acc}`}
            />
          );
        })}
      </div>

      {/* Bulk Status */}
      <div className="flex items-center gap-1 border-r border-gray-800 pr-2">
        <button
          type="button"
          onClick={() => bulkUpdateNodeData(selectedNodeIds, { healthStatus: "healthy", metric: "18ms" })}
          className="flex h-7 px-2 items-center gap-1 rounded-lg border border-emerald-600/50 bg-emerald-950/40 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900/60 transition"
          title="Bulk set Healthy (18ms)"
          aria-label="Bulk set Healthy"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Healthy</span>
        </button>
        <button
          type="button"
          onClick={() => bulkUpdateNodeData(selectedNodeIds, { healthStatus: undefined, metric: undefined })}
          className="flex h-7 px-1.5 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-[10px] text-gray-400 hover:text-white transition"
          title="Clear health status on all selected"
          aria-label="Clear Status"
        >
          Reset
        </button>
      </div>

      {/* Delete Multiple */}
      <button
        type="button"
        onClick={() => {
          removeMultipleNodes(selectedNodeIds);
          onClearSelection();
        }}
        className="flex h-7 px-2.5 items-center gap-1 rounded-lg border border-rose-600/50 bg-rose-950/40 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition"
        title="Delete all selected blocks"
        aria-label="Delete Selected Nodes"
      >
        <span>🗑</span> Delete
      </button>

      {/* Deselect All */}
      <button
        type="button"
        onClick={onClearSelection}
        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition text-xs"
        title="Deselect all blocks (Esc)"
        aria-label="Clear Selection"
      >
        ✕
      </button>
    </div>
  );
}
