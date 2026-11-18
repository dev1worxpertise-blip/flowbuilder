import { NODE_KINDS, NODE_LABELS } from "../../types";
import { NodeIcon } from "../nodes/NodeIcon";
import { useThemeStore } from "../../store/themeStore";
import { useEditorStore } from "../../store/editorStore";

export function Palette() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";
  const togglePalette = useEditorStore((s) => s.togglePalette);

  return (
    <aside
      className={`w-48 shrink-0 overflow-y-auto border-r p-3 select-none backdrop-blur transition-colors duration-150 animate-in slide-in-from-left duration-200 ${
        isDark
          ? "border-[#232c3d] bg-[#0d111a]/95 text-slate-200"
          : "border-slate-200 bg-white/95 text-slate-800 shadow-xs"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between border-b pb-2 border-slate-200/50 dark:border-slate-800/50">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Component Library
        </span>
        <button
          type="button"
          onClick={togglePalette}
          title="Hide Component Library (Widescreen Mode)"
          className={`rounded-md p-1 text-xs transition flex items-center justify-center h-6 w-6 cursor-pointer ${
            isDark
              ? "text-slate-400 hover:bg-slate-800 hover:text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          ✕
        </button>
      </div>
      <div className="space-y-1.5">
        {NODE_KINDS.map((k) => (
          <div
            key={k}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/flow-kind", k);
              e.dataTransfer.effectAllowed = "move";
            }}
            className={`flex cursor-grab items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition active:cursor-grabbing ${
              isDark
                ? "border border-[#232c3d] bg-[#151b27]/90 text-slate-200 hover:border-[#c00000]/70 hover:text-white"
                : "border border-slate-200 bg-slate-50/90 text-slate-700 hover:border-[#c00000]/60 hover:bg-[#c00000]/5 hover:text-[#c00000] shadow-xs"
            }`}
          >
            <NodeIcon kind={k} />
            <span className="truncate">{NODE_LABELS[k]}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
