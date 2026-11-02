import { type NodeProps } from "@xyflow/react";
import type { NodeData } from "../../types";
import { isLightColor } from "../../types";
import { accentStyle } from "../../lib/theme";
import { DeleteButton, SideHandles, SimulationBadges, SpotlightHighlight } from "./shared";
import { useEditorStore } from "../../store/editorStore";
import { useThemeStore } from "../../store/themeStore";

/** Branch/decision point, drawn as a diamond (rotated square) with an upright
 *  centered label. Handles sit at the container edge midpoints, which line up
 *  with the diamond's four vertices. */
export function DecisionNode({ id, data, selected }: NodeProps & { data: NodeData }) {
  const s = accentStyle(data.accent);
  const side = Math.max(130, data.height + 56);
  const addBranch = useEditorStore((st) => st.addBranch);
  const diagram = useEditorStore((st) => st.diagram);
  const theme = useThemeStore((st) => st.theme);

  const canvasBg =
    theme === "light" && (!diagram?.canvasColor || diagram?.canvasColor === "#0a0d15")
      ? "#f8fafc"
      : diagram?.canvasColor || (theme === "light" ? "#f8fafc" : "#0a0d15");
  const isLight = isLightColor(canvasBg);

  const borderColor = data.accent === "crimson" ? "#c00000" : s.border;
  const shadow = data.glow
    ? isLight
      ? `0 2px 10px rgba(0, 0, 0, 0.06), 0 0 14px ${s.glow}`
      : `0 0 18px ${s.glow}`
    : isLight
    ? "0 1px 3px rgba(0, 0, 0, 0.08)"
    : "none";

  const titleColor = isLight ? "#0f172a" : s.title;

  return (
    <div className="group relative" style={{ width: side, height: side }}>
      <SimulationBadges id={id} />
      <SpotlightHighlight id={id} />
      {/* 1-Click Floating Branch Toolbar when selected or hovered */}
      {selected && (
        <div className={`absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 shadow-xl z-30 whitespace-nowrap backdrop-blur-md ${
          isLight
            ? "bg-white/95 border border-slate-200 text-slate-800"
            : "bg-gray-950/95 border border-gray-700/80 text-white"
        }`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addBranch(id, "Yes", "#10b981", { x: 230, y: -50 });
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 transition"
            title="Add 'Yes' branch step"
          >
            <span>✓</span> + Yes
          </button>
          <span className={`text-[10px] ${isLight ? "text-slate-300" : "text-gray-600"}`}>|</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addBranch(id, "No", "#f43f5e", { x: 230, y: 90 });
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-500 transition"
            title="Add 'No' branch step"
          >
            <span>✕</span> + No
          </button>
        </div>
      )}

      <div
        className="absolute inset-[15%] rotate-45 rounded-lg"
        style={{
          border: `1px solid ${borderColor}`,
          boxShadow: shadow,
          background: isLight ? "#ffffff" : "rgba(17,24,39,0.85)",
          outline: selected ? `2px solid ${borderColor}` : "none",
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center">
        <span
          className="font-bold text-xs sm:text-sm leading-tight break-words line-clamp-3 max-w-[110px]"
          title={data.title}
          style={{ color: titleColor }}
        >
          {data.title}
        </span>
      </div>
      <DeleteButton id={id} className="top-1 right-1" />
      <SideHandles color={borderColor} />
    </div>
  );
}
