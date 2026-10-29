import { NODE_KINDS, NODE_LABELS } from "../../types";
import { NodeIcon } from "../nodes/NodeIcon";

export function Palette() {
  return (
    <aside className="w-48 shrink-0 overflow-y-auto border-r border-[#232c3d] bg-[#0d111a]/90 backdrop-blur p-3 select-none">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#858591]">
        Component Library
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
            className="flex cursor-grab items-center gap-2.5 rounded-lg border border-[#232c3d] bg-[#151b27]/90 px-2.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-[#c00000]/70 hover:text-white hover:shadow-sm"
          >
            <NodeIcon kind={k} />
            <span className="truncate">{NODE_LABELS[k]}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
