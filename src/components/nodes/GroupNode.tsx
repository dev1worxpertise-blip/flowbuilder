import { type NodeProps, NodeResizer } from "@xyflow/react";
import { Icon } from "@iconify/react";
import type { NodeData, Accent } from "../../types";
import { DeleteButton, SideHandles, SimulationBadges, SpotlightHighlight } from "./shared";
import { HealthBadge } from "./HealthBadge";
import { useEditorStore } from "../../store/editorStore";

const GROUP_THEMES: Record<
  Accent,
  {
    border: string;
    bg: string;
    headerBg: string;
    titleColor: string;
    subtitleColor: string;
    tagBg: string;
    tagBorder: string;
  }
> = {
  blue: {
    border: "rgba(56, 189, 248, 0.45)",
    bg: "rgba(14, 28, 48, 0.28)",
    headerBg: "rgba(14, 34, 60, 0.8)",
    titleColor: "#38bdf8",
    subtitleColor: "#93c5fd",
    tagBg: "rgba(56, 189, 248, 0.15)",
    tagBorder: "rgba(56, 189, 248, 0.3)",
  },
  green: {
    border: "rgba(52, 211, 153, 0.45)",
    bg: "rgba(12, 36, 26, 0.28)",
    headerBg: "rgba(12, 44, 32, 0.8)",
    titleColor: "#34d399",
    subtitleColor: "#a7f3d0",
    tagBg: "rgba(52, 211, 153, 0.15)",
    tagBorder: "rgba(52, 211, 153, 0.3)",
  },
  pink: {
    border: "rgba(244, 114, 182, 0.45)",
    bg: "rgba(42, 16, 28, 0.28)",
    headerBg: "rgba(54, 18, 36, 0.8)",
    titleColor: "#f472b6",
    subtitleColor: "#fbcfe8",
    tagBg: "rgba(244, 114, 182, 0.15)",
    tagBorder: "rgba(244, 114, 182, 0.3)",
  },
  amber: {
    border: "rgba(251, 191, 36, 0.45)",
    bg: "rgba(38, 28, 12, 0.28)",
    headerBg: "rgba(50, 36, 14, 0.8)",
    titleColor: "#fbbf24",
    subtitleColor: "#fde68a",
    tagBg: "rgba(251, 191, 36, 0.15)",
    tagBorder: "rgba(251, 191, 36, 0.3)",
  },
  neutral: {
    border: "rgba(133, 133, 145, 0.45)",
    bg: "rgba(20, 22, 28, 0.3)",
    headerBg: "rgba(35, 38, 48, 0.85)",
    titleColor: "#c0c0c8",
    subtitleColor: "#858591",
    tagBg: "rgba(192, 192, 200, 0.15)",
    tagBorder: "rgba(133, 133, 145, 0.3)",
  },
  crimson: {
    border: "rgba(192, 0, 0, 0.55)",
    bg: "rgba(40, 8, 10, 0.3)",
    headerBg: "rgba(65, 10, 15, 0.85)",
    titleColor: "#ff4040",
    subtitleColor: "#ffbfbf",
    tagBg: "rgba(192, 0, 0, 0.2)",
    tagBorder: "rgba(255, 64, 64, 0.4)",
  },
  purple: {
    border: "rgba(151, 68, 204, 0.5)",
    bg: "rgba(35, 12, 48, 0.3)",
    headerBg: "rgba(50, 16, 68, 0.85)",
    titleColor: "#c084fc",
    subtitleColor: "#e9d5ff",
    tagBg: "rgba(151, 68, 204, 0.18)",
    tagBorder: "rgba(151, 68, 204, 0.4)",
  },
};

export function GroupNode({ id, data, selected }: NodeProps & { data: NodeData }) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const theme = GROUP_THEMES[data.accent] ?? GROUP_THEMES.blue;
  const isDashed = data.borderStyle !== "solid";
  const width = Math.max(220, data.width || 480);
  const height = Math.max(140, data.height || 280);

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={140}
        color={theme.titleColor}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
        onResizeEnd={(_, params) => {
          updateNodeData(id, {
            width: Math.round(params.width),
            height: Math.round(params.height),
          });
        }}
      />

      <div
        style={{
          width,
          height,
          backgroundColor: theme.bg,
          borderColor: theme.border,
          boxShadow: selected
            ? `0 0 20px ${theme.border}, inset 0 0 20px ${theme.border}`
            : data.glow
            ? `0 0 15px ${theme.border}`
            : "none",
          outline: selected ? `2px solid ${theme.titleColor}` : "none",
        }}
        className={`group relative rounded-2xl flex flex-col pointer-events-none transition-all ${
          isDashed ? "border-2 border-dashed" : "border-2 border-solid"
        }`}
      >
        <SimulationBadges id={id} />
        <SpotlightHighlight id={id} />

        {/* Header Bar - Interactive & Draggable */}
        <div
          style={{
            backgroundColor: theme.headerBg,
            borderBottom: `1px solid ${theme.border}`,
          }}
          className="pointer-events-auto flex items-center justify-between rounded-t-2xl px-3.5 py-2 cursor-move select-none backdrop-blur-md"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm flex items-center justify-center shrink-0">
              {data.iconify ? (
                <Icon icon={data.iconify} width={18} height={18} />
              ) : data.icon ? (
                data.icon
              ) : data.accent === "amber" ? (
                "🗄️"
              ) : data.accent === "green" ? (
                "🛡️"
              ) : (
                "☁️"
              )}
            </span>
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-xs truncate" style={{ color: theme.titleColor }}>
                {data.title || "Group Container"}
              </span>
              {data.subtitle && (
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium truncate"
                  style={{
                    backgroundColor: theme.tagBg,
                    color: theme.subtitleColor,
                    border: `1px solid ${theme.tagBorder}`,
                  }}
                >
                  {data.subtitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {data.healthStatus && (
              <HealthBadge status={data.healthStatus} metric={data.metric} size="sm" />
            )}
            <DeleteButton id={id} />
          </div>
        </div>

        {/* Empty container interior (allows mouse clicks to reach children inside) */}
        <div className="flex-1 pointer-events-none" />

        {/* Connection Handles for Linking to the Group */}
        <div className="pointer-events-auto">
          <SideHandles color={theme.titleColor} />
        </div>
      </div>
    </>
  );
}
