import { type NodeProps } from "@xyflow/react";
import type { NodeData, Accent } from "../../types";
import { DeleteButton, SideHandles, SimulationBadges } from "./shared";
import { useEditorStore } from "../../store/editorStore";

const NOTE_STYLES: Record<
  Accent,
  {
    bg: string;
    border: string;
    tape: string;
    title: string;
    body: string;
    placeholder: string;
  }
> = {
  amber: {
    bg: "rgba(43, 33, 14, 0.96)",
    border: "#d97706",
    tape: "rgba(245, 158, 11, 0.35)",
    title: "#fbbf24",
    body: "#fef3c7",
    placeholder: "#b45309",
  },
  pink: {
    bg: "rgba(46, 16, 30, 0.96)",
    border: "#db2777",
    tape: "rgba(236, 72, 153, 0.35)",
    title: "#f472b6",
    body: "#fce7f3",
    placeholder: "#be185d",
  },
  blue: {
    bg: "rgba(14, 32, 54, 0.96)",
    border: "#0284c7",
    tape: "rgba(56, 189, 248, 0.35)",
    title: "#38bdf8",
    body: "#e0f2fe",
    placeholder: "#0369a1",
  },
  green: {
    bg: "rgba(12, 40, 28, 0.96)",
    border: "#059669",
    tape: "rgba(52, 211, 153, 0.35)",
    title: "#34d399",
    body: "#d1fae5",
    placeholder: "#047857",
  },
  neutral: {
    bg: "rgba(24, 25, 32, 0.96)",
    border: "#858591",
    tape: "rgba(133, 133, 145, 0.35)",
    title: "#c0c0c8",
    body: "#f1f1f5",
    placeholder: "#858591",
  },
  crimson: {
    bg: "rgba(40, 10, 12, 0.96)",
    border: "#c00000",
    tape: "rgba(192, 0, 0, 0.35)",
    title: "#ff4040",
    body: "#ffbfbf",
    placeholder: "#858591",
  },
  purple: {
    bg: "rgba(38, 14, 52, 0.96)",
    border: "#9744cc",
    tape: "rgba(151, 68, 204, 0.35)",
    title: "#c084fc",
    body: "#f3e8ff",
    placeholder: "#7e22ce",
  },
};

export function NoteNode({ id, data, selected }: NodeProps & { data: NodeData }) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const theme = NOTE_STYLES[data.accent] || NOTE_STYLES.amber;

  return (
    <div
      className="group relative rounded-xl p-3.5 backdrop-blur shadow-2xl transition-transform hover:-translate-y-0.5"
      style={{
        width: Math.max(160, data.width),
        minHeight: Math.max(120, data.height),
        background: theme.bg,
        border: `1.5px solid ${theme.border}`,
        outline: selected ? `2px solid ${theme.title}` : "none",
        boxShadow: selected
          ? `0 0 20px ${theme.border}40, 0 10px 25px -5px rgba(0, 0, 0, 0.5)`
          : "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
      }}
    >
      <SimulationBadges id={id} />
      <DeleteButton id={id} />

      {/* Top Tape / Pin effect */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 h-3.5 w-14 rounded-sm border border-white/10 shadow-sm"
        style={{ background: theme.tape }}
      />

      {/* Header with Title and Pin Icon */}
      <div className="flex items-center justify-between gap-1.5 border-b border-white/10 pb-1.5 mb-2">
        <input
          value={data.title}
          onChange={(e) => updateNodeData(id, { title: e.target.value })}
          className="bg-transparent font-bold text-xs focus:outline-none w-full truncate"
          style={{ color: theme.title }}
          placeholder="Note title..."
        />
        <span className="text-xs shrink-0 opacity-75">📌</span>
      </div>

      {/* Body content */}
      <textarea
        value={data.subtitle}
        onChange={(e) => updateNodeData(id, { subtitle: e.target.value })}
        rows={4}
        className="nodrag nopan w-full resize-none bg-transparent text-xs leading-relaxed focus:outline-none scrollbar-none"
        style={{
          color: theme.body,
        }}
        placeholder="Type comments, requirements, or team instructions here..."
      />

      <SideHandles color={theme.border} />
    </div>
  );
}
