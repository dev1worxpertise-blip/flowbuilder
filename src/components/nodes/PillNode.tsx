import { type NodeProps } from "@xyflow/react";
import type { NodeData } from "../../types";
import { isLightColor } from "../../types";
import { accentStyle } from "../../lib/theme";
import { DeleteButton, SideHandles, SimulationBadges } from "./shared";
import { useEditorStore } from "../../store/editorStore";
import { useThemeStore } from "../../store/themeStore";

/** Start / End terminator, drawn as a pill (stadium) with a single centered label. */
export function PillNode({ id, data, selected }: NodeProps & { data: NodeData }) {
  const s = accentStyle(data.accent);
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
    <div
      className="group relative flex items-center justify-center rounded-full px-5 py-2.5 text-center backdrop-blur transition hover:scale-[1.02]"
      style={{
        minWidth: 140,
        maxWidth: 240,
        minHeight: 52,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        background: isLight ? "#ffffff" : "rgba(17,24,39,0.9)",
        outline: selected ? `2px solid ${borderColor}` : "none",
      }}
    >
      <SimulationBadges id={id} />
      <DeleteButton id={id} />
      <span
        className="font-bold text-xs sm:text-sm truncate max-w-[190px]"
        title={data.title}
        style={{ color: titleColor }}
      >
        {data.title}
      </span>
      <SideHandles color={borderColor} />
    </div>
  );
}
