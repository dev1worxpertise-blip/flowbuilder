import { type NodeProps } from "@xyflow/react";
import type { NodeData } from "../../types";
import { accentStyle } from "../../lib/theme";
import { DeleteButton, SideHandles } from "./shared";

/** Free-floating text annotation: no box, border, or glow — just text. */
export function LabelNode({ id, data, selected }: NodeProps & { data: NodeData }) {
  const s = accentStyle(data.accent);
  return (
    <div
      className="group relative px-2 py-1"
      style={{ outline: selected ? `1px dashed ${s.border}` : "none" }}
    >
      <DeleteButton id={id} />
      <div className="font-semibold text-sm" style={{ color: s.title }}>{data.title}</div>
      {data.subtitle ? <div className="text-xs text-gray-400">{data.subtitle}</div> : null}
      <SideHandles color={s.border} />
    </div>
  );
}
