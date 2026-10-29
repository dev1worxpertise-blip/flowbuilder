import { type NodeProps } from "@xyflow/react";
import type { NodeData } from "../../types";
import { accentStyle } from "../../lib/theme";
import { DeleteButton, SideHandles, SimulationBadges } from "./shared";

/** Start / End terminator, drawn as a pill (stadium) with a single centered label. */
export function PillNode({ id, data, selected }: NodeProps & { data: NodeData }) {
  const s = accentStyle(data.accent);
  return (
    <div
      className="group relative flex items-center justify-center rounded-full px-5 py-2.5 text-center backdrop-blur transition hover:scale-[1.02]"
      style={{
        minWidth: 140,
        maxWidth: 240,
        minHeight: 52,
        border: `1px solid ${s.border}`,
        boxShadow: data.glow ? `0 0 18px ${s.glow}` : "none",
        background: "rgba(17,24,39,0.9)",
        outline: selected ? `2px solid ${s.border}` : "none",
      }}
    >
      <SimulationBadges id={id} />
      <DeleteButton id={id} />
      <span className="font-bold text-xs sm:text-sm truncate max-w-[190px]" title={data.title} style={{ color: s.title }}>
        {data.title}
      </span>
      <SideHandles color={s.border} />
    </div>
  );
}
